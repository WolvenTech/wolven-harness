import { realpath } from 'node:fs/promises';
import path from 'node:path';
import { gitOriginUrl, gitTopLevel } from '../git.js';
import { pathExists } from '../path-exists.js';
import type { Config } from './config.js';
import { isGitHost, isRuntime, readConfig, writeConfig } from './config.js';
import { resolveOwnPackage } from './own-package.js';
import type { SkillSet } from './skill-sets.js';
import {
  ALL_SKILLS,
  formatSkillCatalog,
  isKnownSkill,
  isSkillSet,
  orderSets,
  orderSkills,
  SET_SKILLS,
  SKILL_SETS,
} from './skill-sets.js';
import type { Context, GitHost, Io, Options, Prompter, Runtime } from './types.js';
import { SetupCancelled, SetupError } from './types.js';
import { clackPrompter } from './ui.js';

/**
 * Guards that `setup` runs at the git top-level: `git rev-parse
 * --show-toplevel` from `io.cwd` must succeed and resolve (via `realpath`,
 * so symlinked temp dirs compare correctly) to the same directory as
 * `io.cwd`. Runs before any flag parsing, prompt, or write.
 */
async function assertGitTopLevel(io: Io): Promise<void> {
  let toplevel: string;
  try {
    toplevel = await gitTopLevel(io.cwd);
  } catch {
    throw new SetupError(`not a git repository: ${io.cwd}`, 'Run "git init" here first, then re-run setup.');
  }

  const [realToplevel, realCwd] = await Promise.all([realpath(toplevel), realpath(io.cwd)]);

  if (realToplevel !== realCwd) {
    throw new SetupError(
      `setup must run at the git top-level (${realToplevel}), not ${realCwd}`,
      `Run it from ${realToplevel}.`,
    );
  }
}

/**
 * When `--list-skills` is present: require git top-level, print the catalog
 * to stdout, and return true so the caller exits 0 without writes.
 */
export async function listSkillsRequested(argv: string[], io: Io): Promise<boolean> {
  if (!argv.includes('--list-skills')) return false;
  await assertGitTopLevel(io);
  io.stdout.write(formatSkillCatalog());
  return true;
}

const VALID_OPTIONS =
  '--git-host <gh|bit>, --runtimes <claude,codex,cursor>, --skills <ship,discovery|none>, --skill <name>, --list-skills, --verbose, --debug';

interface Flags {
  gitHost?: string;
  runtimes?: string;
  skills?: string;
  /** Raw `--skill` values (each may be comma-separated); accumulated across repeats. */
  skill: string[];
}

/**
 * Parses `--git-host <value>` / `--git-host=<value>` and `--runtimes
 * <csv>` / `--runtimes=<csv>`. A missing value or any other argument is
 * a `SetupError`.
 */
function parseFlags(argv: string[]): Flags {
  const flags: Flags = { skill: [] };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--git-host') {
      const value = argv[++i];
      if (value === undefined)
        throw new SetupError('missing value for --git-host', 'Use --git-host gh or --git-host bit.');
      flags.gitHost = value;
    } else if (arg.startsWith('--git-host=')) {
      flags.gitHost = arg.slice('--git-host='.length);
    } else if (arg === '--runtimes') {
      const value = argv[++i];
      if (value === undefined)
        throw new SetupError('missing value for --runtimes', 'Use e.g. --runtimes claude,codex.');
      flags.runtimes = value;
    } else if (arg.startsWith('--runtimes=')) {
      flags.runtimes = arg.slice('--runtimes='.length);
    } else if (arg === '--skills') {
      const value = argv[++i];
      if (value === undefined)
        throw new SetupError('missing value for --skills', 'Use e.g. --skills ship,discovery or --skills none.');
      flags.skills = value;
    } else if (arg.startsWith('--skills=')) {
      flags.skills = arg.slice('--skills='.length);
    } else if (arg === '--skill') {
      // hazard: must follow `--skills` checks — `--skills` also starts with `--skill`.
      const value = argv[++i];
      if (value === undefined)
        throw new SetupError('missing value for --skill', `Valid skills: ${ALL_SKILLS.join(', ')}.`);
      flags.skill.push(value);
    } else if (arg.startsWith('--skill=')) {
      flags.skill.push(arg.slice('--skill='.length));
    } else if (arg === '--debug' || arg === '--verbose' || arg === '--list-skills') {
      // why: read by runSetup before resolveOptions runs; accepted here so they are not "unknown".
    } else {
      throw new SetupError(`unknown option "${arg}"`, `Valid options: ${VALID_OPTIONS}.`);
    }
  }

  return flags;
}

function parseGitHostValue(raw: string): GitHost | undefined {
  return isGitHost(raw) ? raw : undefined;
}

/**
 * Splits a comma-separated runtimes list, trims entries, dedupes while
 * preserving first-seen order, and validates each against the known
 * `Runtime` values. Returns `undefined` when the list is empty or any
 * entry is invalid.
 */
function parseRuntimesValue(raw: string): Runtime[] | undefined {
  const parts = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (parts.length === 0) return undefined;

  const result: Runtime[] = [];
  for (const part of parts) {
    if (!isRuntime(part)) return undefined;
    if (!result.includes(part)) result.push(part);
  }

  return result;
}

/**
 * Parses `--skills` values: `ship`, `discovery`, or `none` (core only).
 * `none` cannot be combined with another value.
 */
function parseSkillsFlag(raw: string): SkillSet[] {
  const parts = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const hint = 'Use a comma-separated list of "ship", "discovery", or "none" for core skills only.';

  if (parts.length === 0) throw new SetupError(`invalid value for --skills: "${raw}"`, hint);
  if (parts.includes('none')) {
    if (parts.length > 1) {
      throw new SetupError(
        `--skills none cannot be combined with other values: "${raw}"`,
        'Use --skills none alone, or list the sets you want, e.g. --skills ship.',
      );
    }
    return [];
  }
  for (const part of parts) {
    if (!isSkillSet(part)) throw new SetupError(`invalid value for --skills: "${part}"`, hint);
  }
  return orderSets(parts as SkillSet[]);
}

/**
 * Parses one or more `--skill` values (each may be comma-separated). Every
 * name must be a known template skill folder.
 */
function parseSkillNames(rawParts: readonly string[]): string[] {
  const hint = `Valid skills: ${ALL_SKILLS.join(', ')}.`;
  const names: string[] = [];
  for (const raw of rawParts) {
    const parts = raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (parts.length === 0) throw new SetupError(`invalid value for --skill: "${raw}"`, hint);
    for (const part of parts) {
      if (!isKnownSkill(part)) throw new SetupError(`unknown skill "${part}"`, hint);
      if (!names.includes(part)) names.push(part);
    }
  }
  return orderSkills(names);
}

function parseGitHostFlag(raw: string): GitHost {
  const value = parseGitHostValue(raw);
  if (value === undefined) {
    throw new SetupError(`invalid value for --git-host: "${raw}"`, 'Use "gh" for GitHub or "bit" for Bitbucket.');
  }
  return value;
}

function parseRuntimesFlag(raw: string): Runtime[] {
  const value = parseRuntimesValue(raw);
  if (value === undefined) {
    throw new SetupError(
      `invalid value for --runtimes: "${raw}"`,
      'Use a comma-separated list of "claude", "codex", "cursor", e.g. --runtimes claude,codex.',
    );
  }
  return value;
}

/**
 * Guesses the git host from the `origin` remote URL: github.com maps to
 * `gh`, bitbucket.org to `bit`; no remote or any other host is `undefined`.
 */
export async function detectGitHost(root: string): Promise<GitHost | undefined> {
  const url = await gitOriginUrl(root);
  if (url === undefined) return undefined;
  if (/github\.com/i.test(url)) return 'gh';
  if (/bitbucket\.org/i.test(url)) return 'bit';
  return undefined;
}

const RUNTIME_MARKERS: readonly (readonly [Runtime, readonly string[]])[] = [
  ['claude', ['.claude', 'CLAUDE.md']],
  ['codex', ['.codex']],
  ['cursor', ['.cursor', '.cursorrules']],
];

/** Runtimes whose config files or folders already exist in `root`, in a fixed order. */
export async function detectRuntimes(root: string): Promise<Runtime[]> {
  const found: Runtime[] = [];
  for (const [runtime, markers] of RUNTIME_MARKERS) {
    for (const marker of markers) {
      if (await pathExists(path.join(root, marker))) {
        found.push(runtime);
        break;
      }
    }
  }
  return found;
}

/** Why a flag's value was set aside, shown above the question that replaces it. */
interface Notes {
  gitHost?: string;
  runtimes?: string;
  skills?: string;
}

/** Prefixes `message` with the reason a flag value was set aside, when there is one. */
function withNote(note: string | undefined, message: string): string {
  return note === undefined ? message : `${note}\n${message}`;
}

/**
 * Parses a flag value. When a person can answer prompts, an invalid value
 * is recorded in `setNote` and returns `undefined`, so the question is
 * asked instead; otherwise the `SetupError` stands.
 */
function parseOrAsk<T>(parse: () => T, interactive: boolean, setNote: (note: string) => void): T | undefined {
  try {
    return parse();
  } catch (err) {
    if (!interactive || !(err instanceof SetupError)) throw err;
    setNote(`${err.message.charAt(0).toUpperCase()}${err.message.slice(1)}; pick from the list instead.`);
    return undefined;
  }
}

/**
 * Asks for whichever of `gitHost`/`runtimes` is still missing, host first
 * then runtimes, preselecting what the repo already shows. A cancelled
 * prompt throws `SetupCancelled` before anything has been written.
 */
async function promptMissing(
  prompter: Prompter,
  root: string,
  needGitHost: boolean,
  needRuntimes: boolean,
  notes: Notes = {},
): Promise<{ gitHost?: GitHost; runtimes?: Runtime[] }> {
  let gitHost: GitHost | undefined;
  let runtimes: Runtime[] | undefined;

  if (needGitHost) {
    const detected = await detectGitHost(root);
    const note = detected === undefined ? '' : ' (detected from origin)';
    gitHost = await prompter.select<GitHost>({
      message: withNote(notes.gitHost, 'Where is this repository hosted?'),
      options: [
        { value: 'gh', label: 'GitHub', hint: `github.com${detected === 'gh' ? note : ''}` },
        { value: 'bit', label: 'Bitbucket', hint: `bitbucket.org${detected === 'bit' ? note : ''}` },
      ],
      initialValue: detected,
    });
    if (gitHost === undefined) throw new SetupCancelled('git host prompt cancelled');
  }

  if (needRuntimes) {
    const detected = await detectRuntimes(root);
    runtimes = await prompter.multiselect<Runtime>({
      message: withNote(notes.runtimes, 'Which agent runtimes do you use? (space to toggle, enter to confirm)'),
      options: [
        {
          value: 'claude',
          label: 'Claude Code',
          hint: detected.includes('claude') ? 'detected in this repo' : undefined,
        },
        { value: 'codex', label: 'Codex', hint: detected.includes('codex') ? 'detected in this repo' : undefined },
        { value: 'cursor', label: 'Cursor', hint: detected.includes('cursor') ? 'detected in this repo' : undefined },
      ],
      initialValues: detected,
    });
    if (runtimes === undefined) throw new SetupCancelled('runtimes prompt cancelled');
  }

  return { gitHost, runtimes };
}

/** Optional sets that already have every skill folder under `.agents/skills/` in `root`. */
export async function detectInstalledSets(root: string): Promise<SkillSet[]> {
  const found: SkillSet[] = [];
  for (const set of SKILL_SETS) {
    // why: a lone `--skill` must not count as opting into its whole set on later runs.
    const skills = SET_SKILLS[set];
    let complete = true;
    for (const skill of skills) {
      if (!(await pathExists(path.join(root, '.agents', 'skills', skill)))) {
        complete = false;
        break;
      }
    }
    if (complete) found.push(set);
  }
  return found;
}

/** Asks which optional skill sets to add; ship is preselected, zero selections is allowed. */
async function promptSkillSets(prompter: Prompter, installed: SkillSet[], note?: string): Promise<SkillSet[]> {
  const answer = await prompter.multiselect<SkillSet>({
    message: withNote(
      note,
      'Which extra skill sets do you want? Core is always included (spec, plan, execute, ADRs, grilling…).',
    ),
    options: [
      { value: 'ship', label: 'Ship — commit, PR, review, CI', hint: 'for getting changes merged' },
      { value: 'discovery', label: 'Discovery — PRD, prototype, handoff', hint: 'for shaping what to build' },
    ],
    initialValues: orderSets(['ship', ...installed]),
    required: false,
  });
  if (answer === undefined) throw new SetupCancelled('skill sets prompt cancelled');
  return orderSets(answer);
}

/** True when a person can answer prompts: an interactive stdout plus an injected or real TTY stdin. */
export function canPrompt(io: Io): boolean {
  if (!io.isTTY) return false;
  return io.prompts !== undefined || Boolean((io.stdin as { isTTY?: boolean }).isTTY);
}

/**
 * Resolves `setup`'s options: the git-top-level guard runs first (before
 * any prompt or write); then flags override `.wolven-harness.json`
 * defaults, which override interactive prompts (TTY only — no TTY with a
 * value still missing is a named-flag `SetupError`; a cancelled prompt is `SetupCancelled`). The resolved options
 * are written back to `.wolven-harness.json` on every run, refreshing
 * `packageVersion` to this running package's own version and carrying
 * every other existing key (`ignore`, `comments`, and any unknown key)
 * forward untouched.
 */
export async function resolveOptions(argv: string[], ctx: Context): Promise<Options> {
  await assertGitTopLevel(ctx.io);

  const flags = parseFlags(argv);
  const existing = await readConfig(ctx.root);

  const interactive = canPrompt(ctx.io);
  const notes: Notes = {};
  const { gitHost: hostFlag, runtimes: runtimesFlag, skills: skillsFlag } = flags;

  let gitHost: GitHost | undefined =
    hostFlag !== undefined
      ? parseOrAsk(
          () => parseGitHostFlag(hostFlag),
          interactive,
          (n) => (notes.gitHost = n),
        )
      : existing?.gitHost;
  let runtimes: Runtime[] | undefined =
    runtimesFlag !== undefined
      ? parseOrAsk(
          () => parseRuntimesFlag(runtimesFlag),
          interactive,
          (n) => (notes.runtimes = n),
        )
      : existing?.runtimes;

  const missing: string[] = [];
  if (gitHost === undefined) missing.push('--git-host');
  if (runtimes === undefined) missing.push('--runtimes');

  if (missing.length > 0) {
    if (!interactive) {
      const label = missing.length > 1 ? 'flags' : 'flag';
      throw new SetupError(
        `missing required ${label}: ${missing.join(', ')}`,
        `Pass ${missing.length > 1 ? 'them' : 'it'} as ${missing.length > 1 ? 'flags' : 'a flag'} (e.g. ${missing.map((f) => (f === '--git-host' ? '--git-host gh' : '--runtimes claude')).join(' ')}) or run setup in an interactive terminal to be asked.`,
      );
    }

    const prompter = ctx.io.prompts ?? clackPrompter(ctx.io);
    const prompted = await promptMissing(prompter, ctx.root, gitHost === undefined, runtimes === undefined, notes);
    if (gitHost === undefined) gitHost = prompted.gitHost;
    if (runtimes === undefined) runtimes = prompted.runtimes;
  }

  const installed = await detectInstalledSets(ctx.root);
  let skillSets: SkillSet[] | undefined =
    skillsFlag !== undefined
      ? parseOrAsk(
          () => parseSkillsFlag(skillsFlag),
          interactive,
          (n) => (notes.skills = n),
        )
      : existing?.skillSets;
  if (skillSets === undefined) {
    skillSets = interactive
      ? await promptSkillSets(ctx.io.prompts ?? clackPrompter(ctx.io), installed, notes.skills)
      : ['ship'];
  }
  const chosenSets: SkillSet[] = skillSets;
  const keptSets = installed.filter((s) => !chosenSets.includes(s));
  const recordedSets = orderSets([...chosenSets, ...installed]);

  const requestedSkills = flags.skill.length > 0 ? parseSkillNames(flags.skill) : [];
  const recordedSkills = orderSkills([...(existing?.skills ?? []), ...requestedSkills]);

  // invariant: both are set here, from flags/config or from prompts that only resolve with an answer.
  const resolvedGitHost = gitHost as GitHost;
  const resolvedRuntimes = runtimes as Runtime[];

  const { version: packageVersion } = await resolveOwnPackage();

  const config: Config = {
    version: 1,
    gitHost: resolvedGitHost,
    runtimes: resolvedRuntimes,
    skillSets: recordedSets,
    ...(recordedSkills.length > 0 ? { skills: recordedSkills } : {}),
    packageVersion,
    ...(existing?.ignore !== undefined ? { ignore: existing.ignore } : {}),
    ...(existing?.extra !== undefined ? { extra: existing.extra } : {}),
  };

  await writeConfig(ctx.root, config);

  return {
    gitHost: resolvedGitHost,
    runtimes: resolvedRuntimes,
    skillSets: orderSets(chosenSets),
    keptSets,
    skills: recordedSkills,
  };
}

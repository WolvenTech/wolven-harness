import { lstat, realpath } from 'node:fs/promises';
import path from 'node:path';
import { gitOriginUrl, gitTopLevel } from '../git.js';
import { pathExists } from '../path-exists.js';
import type { Config, PackageManager } from './config.js';
import { isGitHost, isPackageManager, isRuntime, readConfig, writeConfig } from './config.js';
import { resolveOwnPackage } from './own-package.js';
import { resolvePackageManager } from './package-manager.js';
import { RUNTIME_REGISTRY, type RuntimeEnv } from './runtimes.js';
import type { SkillSet } from './skill-sets.js';
import { isSkillSet, orderSets, SET_SKILLS, SKILL_SETS } from './skill-sets.js';
import type { Context, GitHost, Io, Options, Prompter, Runtime, SetupMode } from './types.js';
import { SetupCancelled, SetupError } from './types.js';
import { clackPrompter } from './ui.js';

/** Finds a git top-level without the git executable, including linked worktrees. */
async function gitTopLevelFromPath(cwd: string): Promise<string | undefined> {
  let current = await realpath(cwd);
  while (true) {
    try {
      await lstat(path.join(current, '.git'));
      return current;
    } catch {
      const parent = path.dirname(current);
      if (parent === current) return undefined;
      current = parent;
    }
  }
}

/** Returns the repository top-level, or `undefined` outside a repository. */
async function gitTopLevelFor(io: Io): Promise<string | undefined> {
  try {
    return await gitTopLevel(io.cwd);
  } catch {
    return gitTopLevelFromPath(io.cwd);
  }
}

async function isGitTopLevel(io: Io, toplevel: string): Promise<boolean> {
  const [realToplevel, realCwd] = await Promise.all([realpath(toplevel), realpath(io.cwd)]);
  return realToplevel === realCwd;
}

const VALID_OPTIONS =
  '--git-host <gh|bit>, --runtimes <claude|codex|cursor|opencode|amp|copilot|gemini|kiro|antigravity>, --skills <ship,discovery|none>, --package-manager <npm|yarn|pnpm|none>, --verbose, --debug';

interface Flags {
  gitHost?: string;
  runtimes?: string;
  skills?: string;
  packageManager?: string;
}

/**
 * Parses `--git-host <value>` / `--git-host=<value>` and `--runtimes
 * <csv>` / `--runtimes=<csv>`. A missing value or any other argument is
 * a `SetupError`.
 */
function parseFlags(argv: string[]): Flags {
  const flags: Flags = {};

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
    } else if (arg === '--package-manager') {
      const value = argv[++i];
      if (value === undefined)
        throw new SetupError(
          'missing value for --package-manager',
          'Use --package-manager npm, --package-manager yarn or --package-manager pnpm.',
        );
      flags.packageManager = value;
    } else if (arg.startsWith('--package-manager=')) {
      flags.packageManager = arg.slice('--package-manager='.length);
    } else if (arg === '--debug' || arg === '--verbose') {
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
    const choices = RUNTIME_REGISTRY.map((row) => `"${row.id}"`).join(', ');
    throw new SetupError(
      `invalid value for --runtimes: "${raw}"`,
      `Use a comma-separated list of ${choices}, e.g. --runtimes claude,codex.`,
    );
  }
  return value;
}

function parsePackageManagerFlag(raw: string): PackageManager {
  if (!isPackageManager(raw)) {
    throw new SetupError(`invalid value for --package-manager: "${raw}"`, 'Use "npm", "yarn", "pnpm" or "none".');
  }
  return raw;
}

/**
 * Asks which package manager the project uses. It replaces an invalid
 * `--package-manager` value, and answers several lockfiles at once. A
 * cancelled prompt throws `SetupCancelled` before anything is written.
 */
async function promptPackageManager(prompter: Prompter, note?: string): Promise<PackageManager> {
  const answer = await prompter.select<'npm' | 'yarn' | 'pnpm'>({
    message: withNote(note, 'Which package manager does this project use?'),
    options: [
      { value: 'npm', label: 'npm' },
      { value: 'yarn', label: 'yarn' },
      { value: 'pnpm', label: 'pnpm' },
    ],
  });
  if (answer === undefined) throw new SetupCancelled('package manager prompt cancelled');
  return answer;
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

/** Where a runtime's marker was found: the project folder or this machine. */
type DetectionSignal = 'repo' | 'machine';

async function anyPathExists(paths: readonly string[]): Promise<boolean> {
  for (const candidate of paths) {
    if (await pathExists(candidate)) return true;
  }
  return false;
}

/**
 * Registry rows with an existing folder marker under `root` or machine
 * marker under `env`, in registry order, each mapped to the signal found
 * first. `env` stays explicit so a caller with no machine environment
 * resolves no machine markers.
 */
async function detectionSignals(root: string, env: RuntimeEnv): Promise<Map<Runtime, DetectionSignal>> {
  const found = new Map<Runtime, DetectionSignal>();

  for (const row of RUNTIME_REGISTRY) {
    const folderMarkers = row.folderMarkers.map((marker) => path.join(root, marker));
    if (await anyPathExists(folderMarkers)) {
      found.set(row.id, 'repo');
      continue;
    }
    if (await anyPathExists(row.machineMarkers(env))) found.set(row.id, 'machine');
  }

  return found;
}

/** Runtimes whose folder or machine markers exist, in registry order; an empty `env` checks folders only. */
export async function detectRuntimes(root: string, env: RuntimeEnv = {}): Promise<Runtime[]> {
  return [...(await detectionSignals(root, env)).keys()];
}

/** Why a flag's value was set aside, shown above the question that replaces it. */
interface Notes {
  gitHost?: string;
  runtimes?: string;
  skills?: string;
  packageManager?: string;
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
 * then runtimes, preselecting what the repo already shows and what `env`
 * says is installed on this machine. A cancelled prompt throws
 * `SetupCancelled` before anything has been written.
 */
async function promptMissing(
  prompter: Prompter,
  root: string,
  env: RuntimeEnv,
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
    const signals = await detectionSignals(root, env);
    runtimes = await prompter.multiselect<Runtime>({
      message: withNote(notes.runtimes, 'Which agent runtimes do you use? (space to toggle, enter to confirm)'),
      options: RUNTIME_REGISTRY.map((row) => {
        const signal = signals.get(row.id);
        return {
          value: row.id,
          label: row.name,
          hint:
            signal === 'repo' ? 'detected in this repo' : signal === 'machine' ? 'detected on this machine' : undefined,
        };
      }),
      initialValues: [...signals.keys()],
    });
    if (runtimes === undefined) throw new SetupCancelled('runtimes prompt cancelled');
  }

  return { gitHost, runtimes };
}

/** Optional sets that already have at least one skill folder under `.agents/skills/` in `root`. */
export async function detectInstalledSets(root: string): Promise<SkillSet[]> {
  const found: SkillSet[] = [];
  for (const set of SKILL_SETS) {
    for (const skill of SET_SKILLS[set]) {
      if (await pathExists(path.join(root, '.agents', 'skills', skill))) {
        found.push(set);
        break;
      }
    }
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
      {
        value: 'discovery',
        label: 'Discovery — PRD, prototype, handoff, fool, jury, journey map',
        hint: 'for shaping what to build',
      },
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
 * Resolves `setup`'s options: the root/outside mode decision runs first
 * (before any prompt or write); then flags override `.wolven-harness.json`
 * defaults, which override interactive prompts (TTY only — no TTY with a
 * value still missing is a named-flag `SetupError`; a cancelled prompt is `SetupCancelled`). The resolved options
 * are written back to `.wolven-harness.json` on every run, refreshing
 * `packageVersion` to this running package's own version and carrying
 * every other existing key (`ignore`, `comments`, and any unknown key)
 * forward untouched.
 */
export async function resolveOptions(argv: string[], ctx: Context): Promise<Options> {
  const toplevel = await gitTopLevelFor(ctx.io);
  const mode: SetupMode = toplevel === undefined ? 'outside' : 'root';
  if (toplevel !== undefined && !(await isGitTopLevel(ctx.io, toplevel))) {
    throw new SetupError(
      `setup cannot run from a subfolder of a git repository (top-level: ${toplevel})`,
      `Run setup at ${toplevel} or in a folder outside the repository.`,
    );
  }

  const flags = parseFlags(argv);
  const existing = await readConfig(ctx.root);

  const interactive = canPrompt(ctx.io);
  const notes: Notes = {};
  const { gitHost: hostFlag, runtimes: runtimesFlag, skills: skillsFlag, packageManager: packageManagerFlag } = flags;

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
    const prompted = await promptMissing(
      prompter,
      ctx.root,
      ctx.io.env ?? {},
      gitHost === undefined,
      runtimes === undefined,
      notes,
    );
    if (gitHost === undefined) gitHost = prompted.gitHost;
    if (runtimes === undefined) runtimes = prompted.runtimes;
  }

  const managerPrompter = interactive ? (ctx.io.prompts ?? clackPrompter(ctx.io)) : undefined;
  let managerFlag: PackageManager | undefined;
  if (packageManagerFlag !== undefined) {
    managerFlag = parseOrAsk(
      () => parsePackageManagerFlag(packageManagerFlag),
      interactive,
      (n) => (notes.packageManager = n),
    );
    if (managerFlag === undefined && managerPrompter !== undefined) {
      managerFlag = await promptPackageManager(managerPrompter, notes.packageManager);
    }
  }
  const packageManager = await resolvePackageManager(
    ctx.root,
    { flag: managerFlag, recorded: existing?.packageManager },
    managerPrompter === undefined ? undefined : () => promptPackageManager(managerPrompter),
  );

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

  // invariant: both are set here, from flags/config or from prompts that only resolve with an answer.
  const resolvedGitHost = gitHost as GitHost;
  const resolvedRuntimes = runtimes as Runtime[];

  const { version: packageVersion } = await resolveOwnPackage();

  const config: Config = {
    version: 1,
    gitHost: resolvedGitHost,
    runtimes: resolvedRuntimes,
    skillSets: recordedSets,
    packageVersion,
    packageManager,
    ...(existing?.ignore !== undefined ? { ignore: existing.ignore } : {}),
    ...(existing?.extra !== undefined ? { extra: existing.extra } : {}),
  };

  await writeConfig(ctx.root, config);

  return { gitHost: resolvedGitHost, runtimes: resolvedRuntimes, skillSets: orderSets(chosenSets), keptSets, mode };
}

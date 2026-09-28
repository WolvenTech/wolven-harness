import { realpath } from 'node:fs/promises';
import path from 'node:path';
import type { GitHost, Io, Options, Context, Runtime, Prompter } from './types.js';
import { InitError, InitCancelled } from './types.js';
import { isGitHost, isRuntime, readConfig, writeConfig } from './config.js';
import type { Config } from './config.js';
import { gitTopLevel, gitOriginUrl } from '../git.js';
import { pathExists } from '../path-exists.js';
import { clackPrompter } from './ui.js';
import { resolveOwnPackage } from './own-package.js';

/**
 * Guards that `init` runs at the git top-level: `git rev-parse
 * --show-toplevel` from `io.cwd` must succeed and resolve (via `realpath`,
 * so symlinked temp dirs compare correctly) to the same directory as
 * `io.cwd`. Runs before any flag parsing, prompt, or write.
 */
async function assertGitTopLevel(io: Io): Promise<void> {
  let toplevel: string;
  try {
    toplevel = await gitTopLevel(io.cwd);
  } catch {
    throw new InitError(`not a git repository: ${io.cwd}`, 'Run "git init" here first, then re-run init.');
  }

  const [realToplevel, realCwd] = await Promise.all([realpath(toplevel), realpath(io.cwd)]);

  if (realToplevel !== realCwd) {
    throw new InitError(
      `init must run at the git top-level (${realToplevel}), not ${realCwd}`,
      `Run it from ${realToplevel}.`,
    );
  }
}

const VALID_OPTIONS = '--git-host <gh|bit>, --runtimes <claude,codex,cursor>, --verbose, --debug';

interface Flags {
  gitHost?: string;
  runtimes?: string;
}

/**
 * Parses `--git-host <value>` / `--git-host=<value>` and `--runtimes
 * <csv>` / `--runtimes=<csv>`. A missing value or any other argument is
 * an `InitError`.
 */
function parseFlags(argv: string[]): Flags {
  const flags: Flags = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--git-host') {
      const value = argv[++i];
      if (value === undefined) throw new InitError('missing value for --git-host', 'Use --git-host gh or --git-host bit.');
      flags.gitHost = value;
    } else if (arg.startsWith('--git-host=')) {
      flags.gitHost = arg.slice('--git-host='.length);
    } else if (arg === '--runtimes') {
      const value = argv[++i];
      if (value === undefined) throw new InitError('missing value for --runtimes', 'Use e.g. --runtimes claude,codex.');
      flags.runtimes = value;
    } else if (arg.startsWith('--runtimes=')) {
      flags.runtimes = arg.slice('--runtimes='.length);
    } else if (arg === '--debug' || arg === '--verbose') {
      // why: read by runInit before resolveOptions runs; accepted here so they are not "unknown".
      continue;
    } else {
      throw new InitError(`unknown option "${arg}"`, `Valid options: ${VALID_OPTIONS}.`);
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

function parseGitHostFlag(raw: string): GitHost {
  const value = parseGitHostValue(raw);
  if (value === undefined) {
    throw new InitError(`invalid value for --git-host: "${raw}"`, 'Use "gh" for GitHub or "bit" for Bitbucket.');
  }
  return value;
}

function parseRuntimesFlag(raw: string): Runtime[] {
  const value = parseRuntimesValue(raw);
  if (value === undefined) {
    throw new InitError(
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

/**
 * Asks for whichever of `gitHost`/`runtimes` is still missing, host first
 * then runtimes, preselecting what the repo already shows. A cancelled
 * prompt throws `InitCancelled` before anything has been written.
 */
async function promptMissing(
  prompter: Prompter,
  root: string,
  needGitHost: boolean,
  needRuntimes: boolean,
): Promise<{ gitHost?: GitHost; runtimes?: Runtime[] }> {
  let gitHost: GitHost | undefined;
  let runtimes: Runtime[] | undefined;

  if (needGitHost) {
    const detected = await detectGitHost(root);
    const note = detected === undefined ? '' : ' (detected from origin)';
    gitHost = await prompter.select<GitHost>({
      message: 'Where is this repository hosted?',
      options: [
        { value: 'gh', label: 'GitHub', hint: `github.com${detected === 'gh' ? note : ''}` },
        { value: 'bit', label: 'Bitbucket', hint: `bitbucket.org${detected === 'bit' ? note : ''}` },
      ],
      initialValue: detected,
    });
    if (gitHost === undefined) throw new InitCancelled('git host prompt cancelled');
  }

  if (needRuntimes) {
    const detected = await detectRuntimes(root);
    runtimes = await prompter.multiselect<Runtime>({
      message: 'Which agent runtimes do you use? (space to toggle, enter to confirm)',
      options: [
        { value: 'claude', label: 'Claude Code', hint: detected.includes('claude') ? 'detected in this repo' : undefined },
        { value: 'codex', label: 'Codex', hint: detected.includes('codex') ? 'detected in this repo' : undefined },
        { value: 'cursor', label: 'Cursor', hint: detected.includes('cursor') ? 'detected in this repo' : undefined },
      ],
      initialValues: detected,
    });
    if (runtimes === undefined) throw new InitCancelled('runtimes prompt cancelled');
  }

  return { gitHost, runtimes };
}

/** True when a person can answer prompts: an interactive stdout plus an injected or real TTY stdin. */
export function canPrompt(io: Io): boolean {
  if (!io.isTTY) return false;
  return io.prompts !== undefined || Boolean((io.stdin as { isTTY?: boolean }).isTTY);
}

/**
 * Resolves `init`'s options: the git-top-level guard runs first (before
 * any prompt or write); then flags override `.wolven-harness.json`
 * defaults, which override interactive prompts (TTY only — no TTY with a
 * value still missing is a named-flag `InitError`; a cancelled prompt is `InitCancelled`). The resolved options
 * are written back to `.wolven-harness.json` on every run, refreshing
 * `packageVersion` to this running package's own version and carrying
 * every other existing key (`ignore`, `comments`, and any unknown key)
 * forward untouched.
 */
export async function resolveOptions(argv: string[], ctx: Context): Promise<Options> {
  await assertGitTopLevel(ctx.io);

  const flags = parseFlags(argv);
  const existing = await readConfig(ctx.root);

  let gitHost: GitHost | undefined =
    flags.gitHost !== undefined ? parseGitHostFlag(flags.gitHost) : existing?.gitHost;
  let runtimes: Runtime[] | undefined =
    flags.runtimes !== undefined ? parseRuntimesFlag(flags.runtimes) : existing?.runtimes;

  const missing: string[] = [];
  if (gitHost === undefined) missing.push('--git-host');
  if (runtimes === undefined) missing.push('--runtimes');

  if (missing.length > 0) {
    if (!canPrompt(ctx.io)) {
      const label = missing.length > 1 ? 'flags' : 'flag';
      throw new InitError(
        `missing required ${label}: ${missing.join(', ')}`,
        `Pass ${missing.length > 1 ? 'them' : 'it'} as ${missing.length > 1 ? 'flags' : 'a flag'} (e.g. ${missing.map((f) => (f === '--git-host' ? '--git-host gh' : '--runtimes claude')).join(' ')}) or run init in an interactive terminal to be asked.`,
      );
    }

    const prompter = ctx.io.prompts ?? clackPrompter(ctx.io);
    const prompted = await promptMissing(prompter, ctx.root, gitHost === undefined, runtimes === undefined);
    if (gitHost === undefined) gitHost = prompted.gitHost;
    if (runtimes === undefined) runtimes = prompted.runtimes;
  }

  // invariant: both are set here, from flags/config or from prompts that only resolve with an answer.
  const resolvedGitHost = gitHost as GitHost;
  const resolvedRuntimes = runtimes as Runtime[];

  const { version: packageVersion } = await resolveOwnPackage();

  const config: Config = {
    version: 1,
    gitHost: resolvedGitHost,
    runtimes: resolvedRuntimes,
    packageVersion,
    ...(existing?.ignore !== undefined ? { ignore: existing.ignore } : {}),
    ...(existing?.extra !== undefined ? { extra: existing.extra } : {}),
  };

  await writeConfig(ctx.root, config);

  return { gitHost: resolvedGitHost, runtimes: resolvedRuntimes };
}

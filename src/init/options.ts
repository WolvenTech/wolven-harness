import { execFile } from 'node:child_process';
import { realpath } from 'node:fs/promises';
import readline from 'node:readline';
import { promisify } from 'node:util';
import type { GitHost, Io, Options, Context, Runtime } from './types.js';
import { InitError } from './types.js';
import { isGitHost, isRuntime, readConfig, writeConfig } from './config.js';
import type { Config } from './config.js';

const execFileAsync = promisify(execFile);

/**
 * Guards that `init` runs at the git top-level: `git rev-parse
 * --show-toplevel` from `io.cwd` must succeed and resolve (via `realpath`,
 * so symlinked temp dirs compare correctly) to the same directory as
 * `io.cwd`. Runs before any flag parsing, prompt, or write.
 */
async function assertGitTopLevel(io: Io): Promise<void> {
  let stdout: string;
  try {
    const result = await execFileAsync('git', ['rev-parse', '--show-toplevel'], { cwd: io.cwd });
    stdout = result.stdout;
  } catch {
    throw new InitError(`not a git repository: ${io.cwd}`);
  }

  const toplevel = stdout.trim();

  const [realToplevel, realCwd] = await Promise.all([realpath(toplevel), realpath(io.cwd)]);

  if (realToplevel !== realCwd) {
    throw new InitError(
      `init must run at the git top-level (${realToplevel}), not ${realCwd}`,
    );
  }
}

interface Flags {
  gitHost?: string;
  runtimes?: string;
}

/**
 * Parses `--git-host <value>` / `--git-host=<value>` and `--runtimes
 * <csv>` / `--runtimes=<csv>`. Unknown args are ignored (other steps may
 * add flags later).
 */
function parseFlags(argv: string[]): Flags {
  const flags: Flags = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--git-host') {
      flags.gitHost = argv[++i];
    } else if (arg.startsWith('--git-host=')) {
      flags.gitHost = arg.slice('--git-host='.length);
    } else if (arg === '--runtimes') {
      flags.runtimes = argv[++i];
    } else if (arg.startsWith('--runtimes=')) {
      flags.runtimes = arg.slice('--runtimes='.length);
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
    throw new InitError(`invalid value for --git-host: "${raw}" (expected "gh" or "bit")`);
  }
  return value;
}

function parseRuntimesFlag(raw: string): Runtime[] {
  const value = parseRuntimesValue(raw);
  if (value === undefined) {
    throw new InitError(
      `invalid value for --runtimes: "${raw}" (expected a comma-separated list of "claude", "codex", "cursor")`,
    );
  }
  return value;
}

/**
 * Reads lines from `io.stdin` one at a time. Built on `readline`'s `line`
 * event (queued eagerly) rather than the promises `question()` API,
 * because a piped, already-ended input stream (as fixtures use to supply
 * canned answers) can deliver every line and then close before a second
 * sequential `question()` call attaches its listener — `question()` then
 * throws `ERR_USE_AFTER_CLOSE`. Queuing lines as they arrive avoids that
 * race and still serves each prompt one line at a time.
 */
class LineReader {
  private readonly rl: readline.Interface;
  private readonly queue: string[] = [];
  private closed = false;
  private waiting: ((line: string | undefined) => void) | undefined;

  constructor(io: Io) {
    this.rl = readline.createInterface({ input: io.stdin, terminal: false });
    this.rl.on('line', (line) => {
      if (this.waiting) {
        const resolve = this.waiting;
        this.waiting = undefined;
        resolve(line);
      } else {
        this.queue.push(line);
      }
    });
    this.rl.on('close', () => {
      this.closed = true;
      if (this.waiting) {
        const resolve = this.waiting;
        this.waiting = undefined;
        resolve(undefined);
      }
    });
  }

  next(): Promise<string | undefined> {
    if (this.queue.length > 0) return Promise.resolve(this.queue.shift());
    if (this.closed) return Promise.resolve(undefined);
    return new Promise((resolve) => {
      this.waiting = resolve;
    });
  }

  close(): void {
    this.rl.close();
  }
}

async function promptGitHost(reader: LineReader, io: Io): Promise<GitHost> {
  for (;;) {
    io.stdout.write('Git host — gh or bit: ');
    const answer = ((await reader.next()) ?? '').trim();
    const value = parseGitHostValue(answer);
    if (value !== undefined) return value;
    io.stdout.write(`Invalid git host "${answer}" — enter "gh" or "bit".\n`);
  }
}

async function promptRuntimes(reader: LineReader, io: Io): Promise<Runtime[]> {
  for (;;) {
    io.stdout.write('Runtimes — comma-separated, one or more of claude, codex, cursor: ');
    const answer = ((await reader.next()) ?? '').trim();
    const value = parseRuntimesValue(answer);
    if (value !== undefined) return value;
    io.stdout.write(
      `Invalid runtimes "${answer}" — enter one or more of "claude", "codex", "cursor", comma-separated.\n`,
    );
  }
}

/**
 * Prompts for whichever of `gitHost`/`runtimes` is still missing, host
 * first then runtimes, one question at a time over a single
 * `node:readline`-backed reader bound to `io.stdin`/`io.stdout`.
 */
async function promptMissing(
  io: Io,
  needGitHost: boolean,
  needRuntimes: boolean,
): Promise<{ gitHost?: GitHost; runtimes?: Runtime[] }> {
  const reader = new LineReader(io);
  try {
    const gitHost = needGitHost ? await promptGitHost(reader, io) : undefined;
    const runtimes = needRuntimes ? await promptRuntimes(reader, io) : undefined;
    return { gitHost, runtimes };
  } finally {
    reader.close();
  }
}

/**
 * Resolves `init`'s options: the git-top-level guard runs first (before
 * any prompt or write); then flags override `.wolven-harness.json`
 * defaults, which override interactive prompts (TTY only — no TTY with a
 * value still missing is a named-flag `InitError`). The resolved options
 * are written back to `.wolven-harness.json`, carrying an existing
 * `ignore` key forward untouched.
 */
export async function resolveOptions(argv: string[], io: Io, ctx: Context): Promise<Options> {
  await assertGitTopLevel(io);

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
    if (!io.isTTY) {
      const label = missing.length > 1 ? 'flags' : 'flag';
      throw new InitError(`missing required ${label}: ${missing.join(', ')}`);
    }

    const prompted = await promptMissing(io, gitHost === undefined, runtimes === undefined);
    if (gitHost === undefined) gitHost = prompted.gitHost;
    if (runtimes === undefined) runtimes = prompted.runtimes;
  }

  // Both are guaranteed set past this point: either flags/config supplied
  // them, or promptMissing (TTY) blocked until valid answers were given.
  const resolvedGitHost = gitHost as GitHost;
  const resolvedRuntimes = runtimes as Runtime[];

  const config: Config = {
    version: 1,
    gitHost: resolvedGitHost,
    runtimes: resolvedRuntimes,
    ...(existing?.ignore !== undefined ? { ignore: existing.ignore } : {}),
  };

  await writeConfig(ctx.root, config);

  return { gitHost: resolvedGitHost, runtimes: resolvedRuntimes };
}

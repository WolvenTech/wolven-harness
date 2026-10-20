import type { SkillSet } from './skill-sets.js';

export interface Io {
  cwd: string;
  stdin: NodeJS.ReadableStream;
  stdout: NodeJS.WritableStream;
  stderr: NodeJS.WritableStream;
  isTTY: boolean;
  /** Environment variables; the real CLI passes `process.env`. */
  env?: Record<string, string | undefined>;
  /** Replaces the interactive prompts; tests inject one, the real CLI leaves it unset. */
  prompts?: Prompter;
  /** The running script's path (`process.argv[1]`); a non-global copy gets the global-install hint. */
  execPath?: string;
}

/** One choice offered by a prompt. */
export interface Choice<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

/**
 * The two questions `setup` can ask. Each resolves to `undefined` when the
 * person cancels (Ctrl-C), so callers never see a library-specific symbol.
 */
export interface Prompter {
  select<T extends string>(o: { message: string; options: Choice<T>[]; initialValue?: T }): Promise<T | undefined>;
  multiselect<T extends string>(o: {
    message: string;
    options: Choice<T>[];
    initialValues: T[];
    /** Defaults to true: at least one option must stay selected. */
    required?: boolean;
  }): Promise<T[] | undefined>;
}

export type GitHost = 'gh' | 'bit';
export type Runtime =
  | 'claude'
  | 'codex'
  | 'cursor'
  | 'opencode'
  | 'amp'
  | 'copilot'
  | 'gemini'
  | 'kiro'
  | 'antigravity';

/** `root` scaffolds the harness at a git top-level; `outside` writes only what `harness-init` needs. */
export type SetupMode = 'root' | 'outside';

export interface Options {
  gitHost: GitHost;
  runtimes: Runtime[];
  /** Optional skill sets to install this run (core is always installed). */
  skillSets: SkillSet[];
  /** Sets already installed but not chosen this run; `setup` never removes them. */
  keptSets: SkillSet[];
  /** Which write set this run uses, decided by whether the folder is a git top-level. */
  mode: SetupMode;
}

export interface Context {
  root: string;
  templatesDir: string;
  io: Io;
}

export interface StepResult {
  created: string[];
  skipped: string[];
}

/**
 * Expected failure of a `setup` step (bad flag, not at git top-level,
 * symlink not possible). `runSetup` prints the message, then the optional
 * `hint` naming the fix, and exits 1.
 */
export class SetupError extends Error {
  constructor(
    message: string,
    readonly hint?: string,
  ) {
    super(message);
  }
}

/** The person cancelled a prompt; nothing has been written yet. */
export class SetupCancelled extends Error {}

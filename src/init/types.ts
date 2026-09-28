export interface Io {
  cwd: string;
  stdin: NodeJS.ReadableStream;
  stdout: NodeJS.WritableStream;
  stderr: NodeJS.WritableStream;
  isTTY: boolean;
  /** Replaces the interactive prompts; tests inject one, the real CLI leaves it unset. */
  prompts?: Prompter;
}

/** One choice offered by a prompt. */
export interface Choice<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

/**
 * The two questions `init` can ask. Each resolves to `undefined` when the
 * person cancels (Ctrl-C), so callers never see a library-specific symbol.
 */
export interface Prompter {
  select<T extends string>(o: {
    message: string;
    options: Choice<T>[];
    initialValue?: T;
  }): Promise<T | undefined>;
  multiselect<T extends string>(o: {
    message: string;
    options: Choice<T>[];
    initialValues: T[];
  }): Promise<T[] | undefined>;
}

export type GitHost = 'gh' | 'bit';
export type Runtime = 'claude' | 'codex' | 'cursor';

export interface Options {
  gitHost: GitHost;
  runtimes: Runtime[];
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
 * Expected failure of an `init` step (bad flag, not at git top-level,
 * symlink not possible). `runInit` prints the message, then the optional
 * `hint` naming the fix, and exits 1.
 */
export class InitError extends Error {
  constructor(
    message: string,
    readonly hint?: string,
  ) {
    super(message);
  }
}

/** The person cancelled a prompt; nothing has been written yet. */
export class InitCancelled extends Error {}

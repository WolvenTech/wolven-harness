export interface Io {
  cwd: string;
  stdin: NodeJS.ReadableStream;
  stdout: NodeJS.WritableStream;
  stderr: NodeJS.WritableStream;
  isTTY: boolean;
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
 * symlink not possible). `runInit` prints the message and exits 1.
 */
export class InitError extends Error {}

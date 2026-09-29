import { PassThrough } from 'node:stream';
import type { Io } from '../../src/setup/types.js';

/** A silent Io bound to `cwd`, for render and apply calls that never read stdin. */
export function makeIo(cwd: string): Io {
  return {
    cwd,
    stdin: new PassThrough(),
    stdout: new PassThrough(),
    stderr: new PassThrough(),
    isTTY: false,
  };
}

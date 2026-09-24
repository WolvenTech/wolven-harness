import type { Io } from '../init/types.js';

/**
 * A1 stub — prints a fixed line and exits 0. Unit 08 replaces this with
 * the full validate orchestrator (git-root resolution, `ignore` handling,
 * profile rules, the ADR claim gate, legacy mode, and the spine checks).
 */
export async function runValidate(argv: string[], io: Io): Promise<number> {
  io.stdout.write('validate: ok (A1 scaffold)\n');
  return 0;
}

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/** Runs `git` in `cwd`. Rejects when git exits non-zero. */
export async function execGit(
  cwd: string,
  args: string[],
  maxBuffer = 64 * 1024 * 1024,
): Promise<{ stdout: string; stderr: string }> {
  const result = await execFileAsync('git', args, { cwd, maxBuffer, encoding: 'utf8' });
  return { stdout: String(result.stdout), stderr: String(result.stderr) };
}

/** `git rev-parse --show-toplevel` from `cwd`. Rejects outside a work tree. */
export async function gitTopLevel(cwd: string): Promise<string> {
  const { stdout } = await execGit(cwd, ['rev-parse', '--show-toplevel']);
  return stdout.trim();
}

import { lstat } from 'node:fs/promises';

/** True when `p` exists, including a symlink. Rethrows anything other than a missing path. */
export async function pathExists(p: string): Promise<boolean> {
  try {
    await lstat(p);
    return true;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw err;
  }
}

/** True when `file` sits strictly inside `dir` (`dir/` prefix, not `dir` itself). */
export function isUnderDir(file: string, dir: string): boolean {
  return file.startsWith(`${dir}/`);
}

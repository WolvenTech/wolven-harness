import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { execGit, gitTopLevel } from '../git.js';
import { isUnderDir } from '../path-exists.js';

/**
 * Everything the check modules need: the git root, the tracked/non-ignored
 * file list, the ignore entries that were applied (and how many files they
 * dropped), and a root-relative file reader.
 */
export interface RepoContext {
  root: string;
  files: string[];
  ignore: { entries: string[]; count: number };
  read(rel: string): Promise<string>;
}

/**
 * Resolves the git top-level from `cwd` via `git rev-parse
 * --show-toplevel` (no shell). Rejects when `cwd` is not inside a git work
 * tree.
 */
export async function resolveGitRoot(cwd: string): Promise<string> {
  return gitTopLevel(cwd);
}

/**
 * Lists every tracked file under `root` via `git ls-files -z` (no shell),
 * root-relative and sorted.
 */
async function listTrackedFiles(root: string): Promise<string[]> {
  const { stdout } = await execGit(root, ['ls-files', '-z']);

  return stdout
    .split('\0')
    .filter((f) => f.length > 0)
    .sort();
}

interface BuildRepoContextOptions {
  /** Valid `ignore` entries, each already checked to end in `/**`. */
  ignoreEntries: string[];
}

/**
 * Builds the `RepoContext` handed to check modules: lists tracked files,
 * drops those under any `ignoreEntries` directory, and records how many
 * files each entry dropped in total.
 */
export async function buildRepoContext(root: string, opts: BuildRepoContextOptions): Promise<RepoContext> {
  const allFiles = await listTrackedFiles(root);
  const dirs = opts.ignoreEntries.map((entry) => entry.slice(0, -'/**'.length));

  const files = allFiles.filter((f) => !dirs.some((dir) => isUnderDir(f, dir)));
  const ignoredCount = allFiles.length - files.length;

  return {
    root,
    files,
    ignore: { entries: opts.ignoreEntries, count: ignoredCount },
    read: (rel: string) => readFile(path.join(root, rel), 'utf8'),
  };
}

import type { Dirent } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { execGit, gitTopLevel } from '../git.js';
import { isUnderDir, pathExists } from '../path-exists.js';

/**
 * Everything the check modules need: the git root, the scanned file list
 * (git-visible, or every home file for a quiet install), the ignore entries that were
 * applied (and how many files they dropped), and a root-relative file reader.
 */
export interface RepoContext {
  root: string;
  gitRoot?: string;
  homePrefix?: string;
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
 * root-relative.
 */
async function listTrackedFiles(root: string): Promise<string[]> {
  const { stdout } = await execGit(root, ['ls-files', '-z']);

  return stdout.split('\0').filter((f) => f.length > 0);
}

/**
 * Lists untracked, non-ignored files under `root` — same set `comments`
 * uses when unioning changed paths.
 */
async function listUntrackedFiles(root: string): Promise<string[]> {
  const { stdout } = await execGit(root, ['ls-files', '--others', '--exclude-standard', '-z']);

  return stdout.split('\0').filter((f) => f.length > 0);
}

/** Tracked plus untracked non-ignored paths, deduped and sorted. */
async function listScannedFiles(root: string): Promise<string[]> {
  const [tracked, untracked] = await Promise.all([listTrackedFiles(root), listUntrackedFiles(root)]);

  return [...new Set([...tracked, ...untracked])].sort();
}

interface BuildRepoContextOptions {
  /** Valid `ignore` entries, each already checked to end in `/**`. */
  ignoreEntries: string[];
  homePrefix?: string;
}

/** Lists home files directly so local-only documents participate in validation. */
async function listHomeFiles(root: string, dir = ''): Promise<string[]> {
  let entries: Dirent[];
  try {
    entries = await readdir(path.join(root, dir), { withFileTypes: true });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }
  const files: string[] = [];
  for (const entry of entries) {
    const rel = dir ? `${dir}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...(await listHomeFiles(root, rel)));
    else files.push(rel);
  }
  return files.sort();
}

/**
 * Builds the check context: scans git-visible files, or every quiet-install
 * home file including ignored ones, and drops any `ignoreEntries`
 * directory, and records how many files each entry dropped in total.
 */
export async function buildRepoContext(root: string, opts: BuildRepoContextOptions): Promise<RepoContext> {
  const gitRoot = root;
  if (opts.homePrefix) root = path.join(root, opts.homePrefix);
  const allFiles = opts.homePrefix ? await listHomeFiles(root) : await listScannedFiles(root);
  const dirs = opts.ignoreEntries.map((entry) => entry.slice(0, -'/**'.length));

  const files = allFiles.filter((f) => !dirs.some((dir) => isUnderDir(f, dir)));
  const ignoredCount = allFiles.length - files.length;

  // why: git ls-files lists the index; a tracked file deleted but not staged is not in the working tree, and scanning it would abort the run.
  const present = await Promise.all(
    files.map(async (rel) => ((await pathExists(path.join(root, rel))) ? rel : undefined)),
  );

  return {
    root,
    ...(opts.homePrefix ? { gitRoot, homePrefix: opts.homePrefix } : {}),
    files: present.filter((rel): rel is string => rel !== undefined),
    ignore: { entries: opts.ignoreEntries, count: ignoredCount },
    read: (rel: string) => readFile(path.join(root, rel), 'utf8'),
  };
}

import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export type AddedLine = { file: string; line: number; text: string };

async function gitLines(root: string, args: string[]): Promise<string[]> {
  try {
    const { stdout } = await execFileAsync('git', args, { cwd: root, maxBuffer: 64 * 1024 * 1024 });
    return stdout.split(/\r?\n/).filter(Boolean);
  } catch {
    return [];
  }
}

export async function refExists(root: string, ref: string): Promise<boolean> {
  try {
    await execFileAsync('git', ['rev-parse', '--verify', '--quiet', ref], { cwd: root });
    return true;
  } catch {
    return false;
  }
}

async function mergeBaseSha(root: string, a: string, b: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync('git', ['merge-base', a, b], { cwd: root });
    return stdout.trim();
  } catch {
    return null;
  }
}

const DEFAULT_BASE_REFS = ['origin/HEAD', 'origin/main', 'main'] as const;

/**
 * Resolves the default base: the merge-base of `HEAD` with the first of
 * `origin/HEAD`, `origin/main`, or `main` that exists. Null when none do.
 */
export async function resolveDefaultBase(root: string): Promise<string | null> {
  for (const ref of DEFAULT_BASE_REFS) {
    if (!(await refExists(root, ref))) continue;
    const mergeBase = await mergeBaseSha(root, 'HEAD', ref);
    if (mergeBase !== null) return mergeBase;
  }
  return null;
}

/** Lists every file changed since `base` (tracked diff plus untracked), root-relative. */
export async function listChangedFiles(root: string, base: string): Promise<string[]> {
  const diffed = await gitLines(root, ['diff', '--name-only', base]);
  const untracked = await gitLines(root, ['ls-files', '--others', '--exclude-standard']);
  return [...new Set([...diffed, ...untracked])];
}

/**
 * Lists every added line in `relativePaths` since `base`: a full-file read
 * for an untracked file, or the `+` lines of a unified-zero diff otherwise.
 */
export async function listAddedLines(root: string, relativePaths: string[], base: string): Promise<AddedLine[]> {
  if (relativePaths.length === 0) return [];
  const tracked = new Set(await gitLines(root, ['ls-files', '--', ...relativePaths]));
  const out: AddedLine[] = [];

  for (const file of relativePaths) {
    if (!tracked.has(file)) {
      let raw = '';
      try {
        raw = await readFile(path.join(root, file), 'utf8');
      } catch {
        continue;
      }
      raw.split(/\r?\n/).forEach((text, index) => {
        out.push({ file, line: index + 1, text });
      });
      continue;
    }
    const diff = await gitLines(root, ['diff', '--unified=0', base, '--', file]);
    let lineNo = 0;
    for (const row of diff) {
      const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(row);
      if (hunk) {
        lineNo = Number(hunk[1]);
        continue;
      }
      if (row.startsWith('+++')) continue;
      if (row.startsWith('+')) {
        out.push({ file, line: lineNo, text: row.slice(1) });
        lineNo += 1;
      }
    }
  }
  return out;
}

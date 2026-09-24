import { mkdir, readdir, readFile, writeFile, lstat } from 'node:fs/promises';
import path from 'node:path';
import type { Options, Context, StepResult } from './types.js';
import { renderWolven } from './render-wolven.js';

/** Relative path (posix, `/`-joined) of the one file `init` must never create or edit. */
const AGENTS_MD = 'AGENTS.md';
const WOLVEN_MD = 'WOLVEN.md';

function toPosix(relFsPath: string): string {
  return relFsPath.split(path.sep).join('/');
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await lstat(p);
    return true;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw err;
  }
}

/**
 * True when some ancestor directory component of `relPosix` (under `root`)
 * already exists as a non-directory (a file or a symlink), which would
 * block creating the target's parent directories.
 */
async function isBlockedByAncestor(root: string, relPosix: string): Promise<boolean> {
  const parts = relPosix.split('/');
  parts.pop(); // drop the filename itself; only directory components matter here
  let cur = root;
  for (const part of parts) {
    cur = path.join(cur, part);
    try {
      const st = await lstat(cur);
      if (!st.isDirectory()) return true;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return false;
      throw err;
    }
  }
  return false;
}

/** Recursively lists every regular file under `dir`, relative to `dir`, posix-joined. */
async function walkFiles(dir: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }

  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await walkFiles(full);
      files.push(...nested.map((n) => toPosix(path.join(entry.name, n))));
    } else if (entry.isFile()) {
      files.push(entry.name);
    }
    // symlinks inside templatesDir are not expected and are skipped
  }
  return files;
}

/**
 * Walks `ctx.templatesDir` and creates each template file at its matching
 * path under `ctx.root`, but only when that path (and every directory
 * component leading to it) is missing — an existing path, whatever it is,
 * is left byte-identical and reported under `skipped`. `AGENTS.md` is
 * hard-refused: never created or edited, even if the template manifest
 * carried one. `WOLVEN.md`'s content comes from `renderWolven(ctx)` rather
 * than being copied verbatim.
 */
export async function applyTemplates(opts: Options, ctx: Context): Promise<StepResult> {
  const created: string[] = [];
  const skipped: string[] = [];

  const templateFiles = await walkFiles(ctx.templatesDir);

  for (const relFsPath of templateFiles) {
    const rel = toPosix(relFsPath);

    if (rel === AGENTS_MD) {
      // Hard refuse: AGENTS.md is never created or edited by `init`,
      // regardless of whether the template manifest carries one or
      // whether a consumer AGENTS.md already exists.
      skipped.push(rel);
      continue;
    }

    const targetPath = path.join(ctx.root, ...rel.split('/'));

    if ((await isBlockedByAncestor(ctx.root, rel)) || (await pathExists(targetPath))) {
      skipped.push(rel);
      continue;
    }

    await mkdir(path.dirname(targetPath), { recursive: true });

    const content =
      rel === WOLVEN_MD
        ? await renderWolven(ctx)
        : await readFile(path.join(ctx.templatesDir, ...rel.split('/')), 'utf8');

    await writeFile(targetPath, content, 'utf8');
    created.push(rel);
  }

  created.sort();
  skipped.sort();
  return { created, skipped };
}

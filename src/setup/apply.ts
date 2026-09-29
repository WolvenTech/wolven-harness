import { mkdir, readdir, readFile, writeFile, lstat } from 'node:fs/promises';
import path from 'node:path';
import { pathExists } from '../path-exists.js';
import type { Context, StepResult } from './types.js';
import { renderWolven } from './render-wolven.js';

/** Relative path (posix, `/`-joined) of the one file `setup` must never create or edit. */
const AGENTS_MD = 'AGENTS.md';
const WOLVEN_MD = 'WOLVEN.md';

/**
 * Template files installed under a different name. why: npm drops every
 * `.gitignore` from a published tarball, so the template ships without the dot.
 */
const INSTALLED_AS: Record<string, string> = {
  '.qmd/gitignore': '.qmd/.gitignore',
};

function toPosix(relFsPath: string): string {
  return relFsPath.split(path.sep).join('/');
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
    // invariant: a symlink in templatesDir is not a file to copy, so the walk skips it.
  }
  return files;
}

/**
 * Walks `ctx.templatesDir` and creates each template file at its matching
 * path under `ctx.root`, but only when that path (and every directory
 * component leading to it) is missing — an existing path, whatever it is,
 * is left byte-identical and reported under `skipped`. `AGENTS.md` is
 * hard-refused: never created or edited, even if the template manifest
 * carried one. A template listed in `INSTALLED_AS` is written under its mapped name. `WOLVEN.md`'s content comes from `renderWolven(ctx)` rather
 * than being copied verbatim. When `skillFolders` is given, only those
 * skill folders under `.agents/skills/` are considered; the rest are neither
 * created nor reported.
 */
export async function applyTemplates(ctx: Context, skillFolders?: readonly string[]): Promise<StepResult> {
  const created: string[] = [];
  const skipped: string[] = [];

  const templateFiles = await walkFiles(ctx.templatesDir);

  for (const relFsPath of templateFiles) {
    const sourceRel = toPosix(relFsPath);
    const rel = INSTALLED_AS[sourceRel] ?? sourceRel;

    const skillName = /^\.agents\/skills\/([^/]+)\//.exec(rel)?.[1];
    if (skillFolders !== undefined && skillName !== undefined && !skillFolders.includes(skillName)) continue;

    if (rel === AGENTS_MD) {
      // invariant: setup never creates or edits AGENTS.md, even when a template lists it.
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
        ? await renderWolven(ctx, skillFolders)
        : await readFile(path.join(ctx.templatesDir, ...sourceRel.split('/')), 'utf8');

    await writeFile(targetPath, content, 'utf8');
    created.push(rel);
  }

  created.sort();
  skipped.sort();
  return { created, skipped };
}

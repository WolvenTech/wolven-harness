import { isArchivedPath } from './legacy.js';
import type { RepoContext } from './repo.js';
import type { Finding } from './report.js';

/** Folder basenames, lower-cased, a consumer might use for ADR-shaped records outside the profile's numbering scheme. */
const CANDIDATE_FOLDER_NAMES = new Set(['adr', 'adrs', 'decisions']);

/**
 * Matches a 4-digit-numbered basename, case-insensitive, with or without an
 * `adr` prefix: `0001-use-postgres.md`, `adr-0001-x.md`, `ADR0001-x.md`.
 */
const UNRECOGNIZED_BASENAME_RE = /^(?:adr-?)?\d{4}-.*\.md$/i;

/**
 * Detects tracked folders named `adr`, `adrs` or `decisions` (any depth, any
 * case) that hold 4-digit-numbered files (`NNNN-*.md`, optionally prefixed
 * `adr-`) — a layout the profile and claim gate don't recognize. Returns one
 * `adr-unrecognized` warning per qualifying folder, naming the folder and
 * the count of matching files; the folder's own numbering is not checked.
 * `docs/adrs/` is skipped (the profile already rejects a misnamed file
 * there), as is any path with an `archived` segment. A folder whose files
 * don't match (e.g. 3-digit legacy sets) raises nothing.
 */
export async function checkAdrFolders(ctx: RepoContext): Promise<Finding[]> {
  const counts = new Map<string, number>();

  for (const rel of ctx.files) {
    if (isArchivedPath(rel)) continue;

    const lastSlash = rel.lastIndexOf('/');
    if (lastSlash === -1) continue;

    const dir = rel.slice(0, lastSlash);
    if (dir === 'docs/adrs') continue;
    const dirBasename = dir.slice(dir.lastIndexOf('/') + 1).toLowerCase();
    if (!CANDIDATE_FOLDER_NAMES.has(dirBasename)) continue;

    const basename = rel.slice(lastSlash + 1);
    if (!UNRECOGNIZED_BASENAME_RE.test(basename)) continue;

    counts.set(dir, (counts.get(dir) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([dir, count]) => ({
      level: 'warn' as const,
      rule: 'adr-unrecognized',
      file: dir,
      message: `${count} file(s) named NNNN-*.md; 4-digit ADR numbering is not checked`,
    }));
}

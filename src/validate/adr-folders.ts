import type { RepoContext } from './repo.js';
import type { Finding } from './report.js';

/** Folder basenames a consumer might use for ADR-shaped records outside the profile's numbering scheme. */
const CANDIDATE_FOLDER_NAMES = new Set(['adr', 'adrs', 'decisions']);

/** Matches a 4-digit-numbered basename, e.g. `0001-use-postgres.md`: exactly four digits, a dash, anything, `.md`. */
const UNRECOGNIZED_BASENAME_RE = /^\d{4}-.*\.md$/;

/**
 * Detects tracked folders named `adr`, `adrs` or `decisions` (at any depth)
 * that hold files named `NNNN-*.md` — a 4-digit ADR layout the profile and
 * claim gate don't recognize. Returns one `adr-unrecognized` warning per
 * qualifying folder, naming the folder and the count of matching files;
 * the folder's own numbering is not checked. A folder whose files don't
 * match (e.g. 3-digit legacy sets, or `docs/adrs/`'s `adr-NNN-*.md` profile
 * ADRs) raises nothing.
 */
export async function checkAdrFolders(ctx: RepoContext): Promise<Finding[]> {
  const counts = new Map<string, number>();

  for (const rel of ctx.files) {
    const lastSlash = rel.lastIndexOf('/');
    if (lastSlash === -1) continue;

    const dir = rel.slice(0, lastSlash);
    const dirBasename = dir.slice(dir.lastIndexOf('/') + 1);
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

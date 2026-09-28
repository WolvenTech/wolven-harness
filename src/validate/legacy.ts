import type { RepoContext } from './repo.js';

/** One legacy (pre-ADR-numbering-scheme) ADR found in the repo. */
export interface LegacyAdr {
  /** 3-digit ADR number, e.g. '002'. */
  number: string;
  path: string;
}

/**
 * Matches a legacy-ADR-shaped basename, case-insensitive: `adr`, an
 * optional dash, three digits, anything, then `.md`.
 */
const LEGACY_BASENAME_RE = /^adr-?(\d{3}).*\.md$/i;

/**
 * True when `rel` has an `archived` path segment — the same test the claim
 * scan applies, so an archived legacy copy is never a second match for its
 * number.
 */
function hasArchivedSegment(rel: string): boolean {
  return rel === 'archived' || rel.startsWith('archived/') || rel.includes('/archived/');
}

/**
 * Detects legacy ADRs: every entry in `ctx.files`
 * (already tracked, non-ignored, root-relative, POSIX) outside
 * `docs/adrs/` — at any depth, that's profile territory — and outside any
 * `archived` path segment, whose basename matches `LEGACY_BASENAME_RE` is a
 * legacy ADR. The number is the first three digits of the basename, as a
 * string like '002'. No content check is performed; the basename shape is
 * the whole rule. Results are sorted by path. `claims.ts` uses them to
 * downgrade legacy-only claims to warnings.
 */
export async function detectLegacy(ctx: RepoContext): Promise<LegacyAdr[]> {
  const results: LegacyAdr[] = [];

  for (const rel of ctx.files) {
    if (rel.startsWith('docs/adrs/')) continue;
    if (hasArchivedSegment(rel)) continue;

    const basename = rel.slice(rel.lastIndexOf('/') + 1);
    const match = basename.match(LEGACY_BASENAME_RE);
    if (!match) continue;

    results.push({ number: match[1], path: rel });
  }

  return results.sort((a, b) => a.path.localeCompare(b.path));
}

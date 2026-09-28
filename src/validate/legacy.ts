import type { RepoContext } from './repo.js';

/** One legacy (pre-ADR-numbering-scheme) ADR found in the repo. */
export interface LegacyAdr {
  /** 3-digit ADR number, e.g. '002'. */
  number: string;
  path: string;
}

/**
 * Matches a legacy-ADR-shaped basename, case-insensitive: `adr`, an
 * optional dash, exactly three digits, anything, then `.md`. A fourth digit
 * (`adr-0001-*.md`) is a 4-digit layout, not a legacy ADR numbered 000.
 */
const LEGACY_BASENAME_RE = /^adr-?(\d{3})(?!\d).*\.md$/i;

/** True when `rel` has an `archived` path segment: the claim scan, legacy detection and the ADR-folder check skip it. */
export function isArchivedPath(rel: string): boolean {
  return rel === 'archived' || rel.startsWith('archived/') || rel.includes('/archived/');
}

/** The legacy-ADR number of a root-relative path outside `docs/adrs/`, or `undefined`. */
function legacyNumber(rel: string): string | undefined {
  if (rel.startsWith('docs/adrs/')) return undefined;
  const basename = rel.slice(rel.lastIndexOf('/') + 1);
  return basename.match(LEGACY_BASENAME_RE)?.[1];
}

/** Shared scan for {@link detectLegacy} and {@link detectArchivedLegacy}; `archived` selects which side of an `archived` path segment. */
function collectLegacy(ctx: RepoContext, archived: boolean): LegacyAdr[] {
  const results: LegacyAdr[] = [];

  for (const rel of ctx.files) {
    if (isArchivedPath(rel) !== archived) continue;
    const number = legacyNumber(rel);
    if (number !== undefined) results.push({ number, path: rel });
  }

  return results.sort((a, b) => a.path.localeCompare(b.path));
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
export function detectLegacy(ctx: RepoContext): LegacyAdr[] {
  return collectLegacy(ctx, false);
}

/**
 * Detects legacy ADRs that sit under an `archived` path segment, by the same
 * basename rule as `detectLegacy`. They raise no `legacy-adr` finding;
 * `claims.ts` resolves a claim to one only when no live ADR has its number.
 * Results are sorted by path.
 */
export function detectArchivedLegacy(ctx: RepoContext): LegacyAdr[] {
  return collectLegacy(ctx, true);
}

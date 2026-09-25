import { parse } from 'yaml';
import { detectLegacy } from './legacy.js';
import type { LegacyAdr } from './legacy.js';
import type { RepoContext } from './repo.js';
import type { Finding } from './report.js';

/** Tallies for the ADR claim gate. */
export interface ClaimCounts {
  ok: number;
  legacyWarn: number;
  fail: number;
}

/** Matches a direct child of `docs/adrs/`: captures its basename. */
const PROFILE_ADR_DIR_RE = /^docs\/adrs\/([^/]+)$/;

/** Extracts the 3-digit number from a profile-ADR-shaped basename. */
const ADR_NUMBER_PREFIX_RE = /^adr-(\d{3})/;

/** Captures the slug from an `adr-NNN-<slug>.md` basename. */
const ADR_SLUG_FULL_RE = /^adr-\d{3}-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/;

/** Bare `ADR-NNN` token, whole word. */
const BARE_TOKEN_RE = /\bADR-(\d{3})\b/g;

/** Slug-form `adr-NNN-<slug>` token, whole word. */
const SLUG_TOKEN_RE = /\badr-(\d{3})-([a-z0-9]+(?:-[a-z0-9]+)*)\b/g;

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---/;

/**
 * Parses the leading `---\n … \n---` frontmatter block. Returns `undefined`
 * when the block is missing, unparseable, or does not parse to an object.
 * Duplicated from `profile.ts`'s idiom — that module can't be imported from
 * here for this purpose.
 */
function parseFrontmatter(content: string): Record<string, unknown> | undefined {
  const match = content.match(FRONTMATTER_RE);
  if (!match) return undefined;

  let parsed: unknown;
  try {
    parsed = parse(match[1]);
  } catch {
    return undefined;
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return undefined;
  return parsed as Record<string, unknown>;
}

/** One profile ADR, keyed by its 3-digit number. */
interface ProfileAdrEntry {
  number: string;
  path: string;
  slug?: string;
  passesProfile: boolean;
  status?: string;
  supersededBy?: string;
}

interface ProfileIndex {
  byNumber: Map<string, ProfileAdrEntry[]>;
  /** Every file directly under `docs/adrs/`, regardless of basename shape — scan exclusions. */
  dirFiles: Set<string>;
}

/**
 * Indexes profile ADRs: files directly under `docs/adrs/` whose basename
 * starts with `adr-NNN`. Reads `status`/`superseded_by` from frontmatter
 * itself (own parser) only for files that pass the writing profile (no `profileFindings`
 * error at that path).
 */
async function buildProfileIndex(ctx: RepoContext, profileFindings: Finding[]): Promise<ProfileIndex> {
  const errorFiles = new Set(profileFindings.filter((f) => f.level === 'error' && f.file !== undefined).map((f) => f.file));

  const byNumber = new Map<string, ProfileAdrEntry[]>();
  const dirFiles = new Set<string>();

  for (const rel of ctx.files) {
    const dirMatch = rel.match(PROFILE_ADR_DIR_RE);
    if (!dirMatch) continue;

    dirFiles.add(rel);

    const baseName = dirMatch[1];
    const numberMatch = baseName.match(ADR_NUMBER_PREFIX_RE);
    if (!numberMatch) continue;

    const number = numberMatch[1];
    const slugMatch = baseName.match(ADR_SLUG_FULL_RE);
    const slug = slugMatch ? slugMatch[1] : undefined;
    const passesProfile = !errorFiles.has(rel);

    let status: string | undefined;
    let supersededBy: string | undefined;
    if (passesProfile) {
      try {
        const content = await ctx.read(rel);
        const frontmatter = parseFrontmatter(content);
        if (frontmatter) {
          status = typeof frontmatter.status === 'string' ? frontmatter.status : undefined;
          supersededBy = typeof frontmatter.superseded_by === 'string' ? frontmatter.superseded_by : undefined;
        }
      } catch {
        // Leave status/supersededBy undefined; treated as invalid below.
      }
    }

    const entry: ProfileAdrEntry = { number, path: rel, slug, passesProfile, status, supersededBy };
    const list = byNumber.get(number) ?? [];
    list.push(entry);
    byNumber.set(number, list);
  }

  return { byNumber, dirFiles };
}

interface LegacyIndex {
  byNumber: Map<string, LegacyAdr[]>;
  paths: Set<string>;
}

function buildLegacyIndex(legacyAdrs: LegacyAdr[]): LegacyIndex {
  const byNumber = new Map<string, LegacyAdr[]>();
  const paths = new Set<string>();

  for (const legacy of legacyAdrs) {
    paths.add(legacy.path);
    const list = byNumber.get(legacy.number) ?? [];
    list.push(legacy);
    byNumber.set(legacy.number, list);
  }

  return { byNumber, paths };
}

/** Whether `rel` is excluded from the claim scan: ADR files, `node_modules/`, and archived paths. */
function isScanExcluded(rel: string, profile: ProfileIndex, legacy: LegacyIndex): boolean {
  if (profile.dirFiles.has(rel)) return true;
  if (legacy.paths.has(rel)) return true;
  if (rel.startsWith('node_modules/')) return true;
  if (rel === 'archived' || rel.startsWith('archived/') || rel.includes('/archived/')) return true;
  return false;
}

type ClaimOutcome =
  | { kind: 'ok' }
  | { kind: 'fail'; rule: string; message: string }
  | { kind: 'legacy-warn'; legacyPath: string };

/** Resolves one claim occurrence against the profile and legacy indexes. */
function resolveClaim(
  number: string,
  tokenSlug: string | undefined,
  profile: ProfileIndex,
  legacy: LegacyIndex,
): ClaimOutcome {
  const adrId = `ADR-${number}`;
  const profileMatches = profile.byNumber.get(number) ?? [];
  const legacyMatches = legacy.byNumber.get(number) ?? [];
  const total = profileMatches.length + legacyMatches.length;

  if (total === 0) {
    return { kind: 'fail', rule: 'claim-missing', message: `${adrId}: no profile or legacy ADR found` };
  }

  if (total > 1) {
    return {
      kind: 'fail',
      rule: 'claim-duplicate',
      message: `${adrId}: matches ${total} ADRs (profile and/or legacy); expected exactly one`,
    };
  }

  if (profileMatches.length === 1) {
    const adr = profileMatches[0];

    if (!adr.passesProfile || adr.status === undefined) {
      return { kind: 'fail', rule: 'claim-invalid', message: `${adrId} (${adr.path}) fails the writing profile` };
    }

    if (adr.status === 'draft') {
      return { kind: 'fail', rule: 'claim-draft', message: `${adrId} (${adr.path}) is draft, not stable` };
    }

    if (adr.status === 'deprecated') {
      return {
        kind: 'fail',
        rule: 'claim-deprecated',
        message: `${adrId} (${adr.path}) is deprecated, superseded_by: ${adr.supersededBy ?? 'unknown'}`,
      };
    }

    if (adr.status === 'stable') {
      if (tokenSlug !== undefined && tokenSlug !== adr.slug) {
        return {
          kind: 'fail',
          rule: 'claim-slug-mismatch',
          message: `${adrId} (${adr.path}): slug "${tokenSlug}" does not match filename slug "${adr.slug ?? ''}"`,
        };
      }
      return { kind: 'ok' };
    }

    // Defensive: an unrecognized status would already have failed the writing profile above.
    return { kind: 'fail', rule: 'claim-invalid', message: `${adrId} (${adr.path}) fails the writing profile` };
  }

  // Exactly one legacy match.
  return { kind: 'legacy-warn', legacyPath: legacyMatches[0].path };
}

/**
 * Runs the ADR claim gate: scans tracked, non-ignored,
 * non-ADR files for `ADR-NNN` / `adr-NNN-<slug>` claim tokens and resolves
 * each against the profile ADRs (stable only) and legacy ADRs (warn only).
 */
export async function checkClaims(
  ctx: RepoContext,
  profileFindings: Finding[],
): Promise<{ findings: Finding[]; counts: ClaimCounts }> {
  const profile = await buildProfileIndex(ctx, profileFindings);
  const legacyAdrs = await detectLegacy(ctx);
  const legacy = buildLegacyIndex(legacyAdrs);

  const findings: Finding[] = [];
  const counts: ClaimCounts = { ok: 0, legacyWarn: 0, fail: 0 };

  const legacyStats = new Map<string, { count: number; files: Set<string> }>();
  for (const l of legacyAdrs) {
    legacyStats.set(l.path, { count: 0, files: new Set() });
  }

  for (const rel of ctx.files) {
    if (isScanExcluded(rel, profile, legacy)) continue;

    let content: string;
    try {
      content = await ctx.read(rel);
    } catch {
      continue;
    }
    if (content.includes('\u0000')) continue;

    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNo = i + 1;

      const occurrences: { number: string; slug?: string }[] = [];
      for (const m of line.matchAll(BARE_TOKEN_RE)) {
        occurrences.push({ number: m[1] });
      }
      for (const m of line.matchAll(SLUG_TOKEN_RE)) {
        occurrences.push({ number: m[1], slug: m[2] });
      }

      for (const occurrence of occurrences) {
        const outcome = resolveClaim(occurrence.number, occurrence.slug, profile, legacy);

        if (outcome.kind === 'ok') {
          counts.ok++;
        } else if (outcome.kind === 'fail') {
          counts.fail++;
          findings.push({ level: 'error', rule: outcome.rule, file: rel, line: lineNo, message: outcome.message });
        } else {
          counts.legacyWarn++;
          const stats = legacyStats.get(outcome.legacyPath);
          if (stats) {
            stats.count++;
            stats.files.add(rel);
          }
          findings.push({
            level: 'warn',
            rule: 'legacy-claim',
            file: rel,
            line: lineNo,
            message: `ADR-${occurrence.number} matches only legacy ADR (${outcome.legacyPath})`,
            verboseOnly: true,
          });
        }
      }
    }
  }

  for (const l of legacyAdrs) {
    const stats = legacyStats.get(l.path) ?? { count: 0, files: new Set<string>() };
    findings.push({
      level: 'warn',
      rule: 'legacy-adr',
      file: l.path,
      message: `legacy ADR-${l.number} (${l.path}): ${stats.count} claims in ${stats.files.size} files — migrate via harness-init`,
    });
  }

  return { findings, counts };
}

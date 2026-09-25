import { parse } from 'yaml';
import type { RepoContext } from './repo.js';
import type { Finding } from './report.js';

/** Maps each profile directory to the `type` its frontmatter must carry. */
const DIR_TYPE: Record<string, string> = {
  adrs: 'adr',
  specs: 'spec',
  notes: 'note',
  deferrals: 'deferral',
};

const STATUSES = new Set(['draft', 'stable', 'deprecated']);

/** Matches a direct child `docs/<dir>/<name>.md` for the four profile dirs. */
const PROFILE_FILE_RE = /^docs\/(adrs|specs|notes|deferrals)\/([^/]+\.md)$/;

/** Kebab-case, ASCII-only filename. */
const KEBAB_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;

/** `adr-NNN-<kebab-slug>.md` — a three-digit number, dash, kebab slug. */
const ADR_NAME_RE = /^adr-\d{3}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---/;

const REQUIRED_FIELDS = ['type', 'title', 'description', 'status'] as const;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Parses the leading `---\n … \n---` frontmatter block. Returns `undefined`
 * when the block is missing, unparseable, or does not parse to an object —
 * all of which count as a `profile-frontmatter` failure at the call site.
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

/**
 * Checks one profile file (already known to live directly under
 * `docs/<dir>/`) and appends its findings.
 */
function checkFile(rel: string, dir: string, baseName: string, content: string, findings: Finding[]): void {
  // (d) kebab-case ASCII filename.
  if (!KEBAB_RE.test(baseName)) {
    findings.push({
      level: 'error',
      rule: 'profile-filename',
      file: rel,
      message: `filename "${baseName}" is not kebab-case ASCII`,
    });
  }

  // ADR-only: adr-NNN-<kebab-slug>.md name shape.
  if (dir === 'adrs' && !ADR_NAME_RE.test(baseName)) {
    findings.push({
      level: 'error',
      rule: 'profile-adr-name',
      file: rel,
      message: `ADR filename "${baseName}" does not match "adr-NNN-<kebab-slug>.md"`,
    });
  }

  const frontmatter = parseFrontmatter(content);
  if (!frontmatter) {
    findings.push({
      level: 'error',
      rule: 'profile-frontmatter',
      file: rel,
      line: 1,
      message: 'missing or unparseable frontmatter block',
    });
    return;
  }

  // (a) non-empty type, title, description, status.
  let missingRequired = false;
  for (const field of REQUIRED_FIELDS) {
    if (!isNonEmptyString(frontmatter[field])) {
      missingRequired = true;
      findings.push({
        level: 'error',
        rule: 'profile-frontmatter',
        file: rel,
        line: 1,
        message: `missing or empty frontmatter field "${field}"`,
      });
    }
  }
  if (missingRequired) return;

  const type = frontmatter.type as string;
  const status = frontmatter.status as string;

  // (c) type matches directory.
  const expectedType = DIR_TYPE[dir];
  if (type !== expectedType) {
    findings.push({
      level: 'error',
      rule: 'profile-type-dir',
      file: rel,
      line: 1,
      message: `type "${type}" does not match directory "docs/${dir}" (expected "${expectedType}")`,
    });
  }

  // (b) status is one of draft|stable|deprecated.
  if (!STATUSES.has(status)) {
    findings.push({
      level: 'error',
      rule: 'profile-status',
      file: rel,
      line: 1,
      message: `status "${status}" is not one of draft, stable, deprecated`,
    });
    return;
  }

  // ADR-only: superseded_by required when deprecated.
  if (dir === 'adrs' && status === 'deprecated' && !isNonEmptyString(frontmatter.superseded_by)) {
    findings.push({
      level: 'error',
      rule: 'profile-superseded-by',
      file: rel,
      line: 1,
      message: 'deprecated ADR is missing "superseded_by"',
    });
  }
}

/**
 * Enforces the writing profile on direct children of
 * `docs/{adrs,specs,notes,deferrals}/*.md`. Nested paths and non-`.md`
 * files are out of scope.
 */
export async function checkProfile(ctx: RepoContext): Promise<Finding[]> {
  const findings: Finding[] = [];

  for (const rel of ctx.files) {
    const match = rel.match(PROFILE_FILE_RE);
    if (!match) continue;

    const [, dir, baseName] = match;
    const content = await ctx.read(rel);
    checkFile(rel, dir, baseName, content, findings);
  }

  return findings;
}

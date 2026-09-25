import { parse } from 'yaml';
import type { RepoContext } from './repo.js';
import type { Finding } from './report.js';

/** Maps each doc-folder to the singular `type` its frontmatter must carry. */
const DIR_TYPE: Record<string, string> = {
  adrs: 'adr',
  prds: 'prd',
  specs: 'spec',
  notes: 'note',
  deferrals: 'deferral',
};

const STATUSES = new Set(['draft', 'stable', 'deprecated']);

/** A direct child `docs/adrs/<name>.md` — ADRs stay flat, unlike the other doc-folders. */
const ADR_FILE_RE = /^docs\/adrs\/([^/]+\.md)$/;

/** A `.md` directly under a doc-folder — the flat layout, always rejected. */
const FLAT_FILE_RE = /^docs\/(prds|specs|notes|deferrals)\/([^/]+)\.md$/;

/** A file under a doc-folder's slug folder: captures dir, slug, and the rest of the path. */
const SLUG_FILE_RE = /^docs\/(prds|specs|notes|deferrals)\/([^/]+)\/(.+)$/;

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
 * Checks one main doc (an ADR, or a doc-folder's `<slug>-<type>.md` /
 * `<slug>-plan.md`) and appends its findings.
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
 * Enforces the writing profile on `docs/adrs/*.md` (flat, unchanged) and on
 * the doc-folder layout `docs/{prds,specs,notes,deferrals}/<slug>/<slug>-<type>.md`
 * (plus `<slug>-plan.md` for specs). A flat `.md` under a doc-folder fails,
 * naming the expected doc-folder path; a slug folder without its main doc
 * fails too. Other files in a slug folder, and everything under a doc-folder's
 * `archived/`, are out of scope.
 */
export async function checkProfile(ctx: RepoContext): Promise<Finding[]> {
  const findings: Finding[] = [];

  // invariant: slugsSeen minus mainDocSeen, per dir, is the missing-main-doc set.
  const slugsSeen = new Map<string, Set<string>>();
  const mainDocSeen = new Map<string, Set<string>>();

  for (const rel of ctx.files) {
    const adrMatch = rel.match(ADR_FILE_RE);
    if (adrMatch) {
      const content = await ctx.read(rel);
      checkFile(rel, 'adrs', adrMatch[1], content, findings);
      continue;
    }

    const flatMatch = rel.match(FLAT_FILE_RE);
    if (flatMatch) {
      const [, dir, name] = flatMatch;
      findings.push({
        level: 'error',
        rule: 'profile-flat-layout',
        file: rel,
        message: `expected the doc-folder layout "docs/${dir}/${name}/${name}-${DIR_TYPE[dir]}.md", not a flat file`,
      });
      continue;
    }

    const slugMatch = rel.match(SLUG_FILE_RE);
    if (!slugMatch) continue;

    const [, dir, slug, restPath] = slugMatch;
    if (slug === 'archived') continue; // docs/<dir>/archived/** is skipped entirely.
    if (!restPath.endsWith('.md')) continue;

    if (!slugsSeen.has(dir)) slugsSeen.set(dir, new Set());
    slugsSeen.get(dir)!.add(slug);

    const expectedType = DIR_TYPE[dir];
    const isDirectChild = !restPath.includes('/');
    const isMainDoc = isDirectChild && restPath === `${slug}-${expectedType}.md`;
    const isPlanDoc = dir === 'specs' && isDirectChild && restPath === `${slug}-plan.md`;
    if (!isMainDoc && !isPlanDoc) continue; // other files in the folder are not checked.

    if (isMainDoc) {
      if (!mainDocSeen.has(dir)) mainDocSeen.set(dir, new Set());
      mainDocSeen.get(dir)!.add(slug);
    }

    const content = await ctx.read(rel);
    checkFile(rel, dir, restPath, content, findings);
  }

  for (const [dir, slugs] of slugsSeen) {
    const done = mainDocSeen.get(dir) ?? new Set<string>();
    for (const slug of slugs) {
      if (done.has(slug)) continue;
      findings.push({
        level: 'error',
        rule: 'profile-missing-main-doc',
        file: `docs/${dir}/${slug}`,
        message: `folder is missing its main doc "${slug}-${DIR_TYPE[dir]}.md"`,
      });
    }
  }

  return findings;
}

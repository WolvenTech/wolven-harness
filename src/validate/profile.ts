import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { FRONTMATTER_RE, parseFrontmatter } from '../frontmatter.js';
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

/** What follows `<slug>` in a review-fix iteration doc: `-iteration-<N>-spec|plan.md`, N from 1. */
const ITERATION_SUFFIX_RE = /^-iteration-[1-9]\d*-(spec|plan)\.md$/;

/** Status words in an ADR body that contradict `status: stable`. */
const RETIRED_STATUS_RE = /^(superseded|deprecated|rejected|obsolete)\b/i;

const REQUIRED_FIELDS = ['type', 'title', 'description', 'status'] as const;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/** Resolves a `superseded_by` value (an ADR filename without `.md`) to the path it names. */
function supersededByPath(value: string): string {
  return `docs/adrs/${value}.md`;
}

/**
 * Lists `docs/adrs/*.md` files on disk that git doesn't track, so an
 * unresolved `superseded_by` can say the successor needs staging rather than
 * that it's missing.
 */
async function listUntrackedAdrFiles(root: string, adrFiles: Set<string>): Promise<Set<string>> {
  let names: string[];
  try {
    names = await readdir(path.join(root, 'docs', 'adrs'));
  } catch {
    return new Set();
  }
  return new Set(
    names
      .filter((name) => name.endsWith('.md'))
      .map((name) => `docs/adrs/${name}`)
      .filter((rel) => !adrFiles.has(rel)),
  );
}

/**
 * Finds the status statement in an ADR body: the first non-empty line after a
 * `## Status` heading, or a `Status:` / `**Status:**` line. Returns the
 * statement's 1-based line in the file and its text without emphasis marks.
 */
function bodyStatement(content: string): { line: number; text: string } | undefined {
  const lines = content.split('\n');
  const start = content.match(FRONTMATTER_RE)?.[0].split('\n').length ?? 0;
  for (let i = start; i < lines.length; i++) {
    if (/^#{2}\s+status\s*$/i.test(lines[i])) {
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim() === '') continue;
        return /^#/.test(lines[j]) ? undefined : { line: j + 1, text: lines[j].trim().replace(/^[*_]+/, '') };
      }
      return undefined;
    }
    const inline = lines[i].match(/^\s*\**status\**\s*:\s*\**\s*(\S.*)$/i);
    if (inline) return { line: i + 1, text: inline[1].replace(/^[*_]+/, '') };
  }
  return undefined;
}

/**
 * Checks one main doc (an ADR, or a doc-folder's `<slug>-<type>.md` /
 * `<slug>-plan.md`) and appends its findings. `adrFiles` is every tracked
 * `docs/adrs/*.md` path; a deprecated ADR's `superseded_by` is resolved
 * against it. `untrackedAdrFiles` holds the ones on disk git doesn't track,
 * named in the error when the successor is one of them.
 */
function checkFile(
  rel: string,
  dir: string,
  baseName: string,
  content: string,
  findings: Finding[],
  adrFiles: Set<string>,
  untrackedAdrFiles: Set<string>,
): void {
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

  // why: validate reads frontmatter only, so a stable ADR whose own Status says it is retired would pass silently.
  if (dir === 'adrs' && status === 'stable') {
    const statement = bodyStatement(content);
    const word = statement?.text.match(RETIRED_STATUS_RE)?.[1];
    if (statement && word) {
      findings.push({
        level: 'warn',
        rule: 'adr-status-mismatch',
        file: rel,
        line: statement.line,
        message: `frontmatter says stable but the ADR says "${word}"; write a successor and deprecate it, or split the part that still binds`,
      });
    }
  }

  // ADR-only: superseded_by required when deprecated.
  if (dir === 'adrs' && status === 'deprecated') {
    if (!isNonEmptyString(frontmatter.superseded_by)) {
      findings.push({
        level: 'error',
        rule: 'profile-superseded-by',
        file: rel,
        line: 1,
        message: 'deprecated ADR is missing "superseded_by"',
      });
    } else if (!adrFiles.has(supersededByPath(frontmatter.superseded_by))) {
      // invariant: superseded_by must name an ADR file present in this repo.
      const successor = supersededByPath(frontmatter.superseded_by);
      findings.push({
        level: 'error',
        rule: 'profile-superseded-by',
        file: rel,
        line: 1,
        message: untrackedAdrFiles.has(successor)
          ? `"superseded_by" names "${frontmatter.superseded_by}", whose file ${successor} is not tracked by git — run "git add ${successor}"`
          : `"superseded_by" names "${frontmatter.superseded_by}", which does not resolve to an existing ADR`,
      });
    }
  }
}

/** Adds `value` to the set stored under `key`, creating the set on first use. */
function addTo(map: Map<string, Set<string>>, key: string, value: string): void {
  let set = map.get(key);
  if (!set) {
    set = new Set();
    map.set(key, set);
  }
  set.add(value);
}

/**
 * Enforces the writing profile on `docs/adrs/*.md` (flat, unchanged) and on
 * the doc-folder layout `docs/{prds,specs,notes,deferrals}/<slug>/<slug>-<type>.md`
 * (plus `<slug>-plan.md` and `<slug>-iteration-<N>-{spec,plan}.md` for specs). A
 * flat `.md` under a doc-folder fails, naming the expected doc-folder path; a slug
 * folder without its main doc fails too. Other files in a slug folder, and
 * everything under a doc-folder's `archived/`, are out of scope.
 */
export async function checkProfile(ctx: RepoContext): Promise<Finding[]> {
  const findings: Finding[] = [];

  // invariant: slugsSeen minus mainDocSeen, per dir, is the missing-main-doc set.
  const slugsSeen = new Map<string, Set<string>>();
  const mainDocSeen = new Map<string, Set<string>>();

  const adrFiles = new Set(ctx.files.filter((rel) => ADR_FILE_RE.test(rel)));
  const untrackedAdrFiles = await listUntrackedAdrFiles(ctx.root, adrFiles);

  for (const rel of ctx.files) {
    const adrMatch = rel.match(ADR_FILE_RE);
    if (adrMatch) {
      const content = await ctx.read(rel);
      checkFile(rel, 'adrs', adrMatch[1], content, findings, adrFiles, untrackedAdrFiles);
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

    addTo(slugsSeen, dir, slug);

    const expectedType = DIR_TYPE[dir];
    const isDirectChild = !restPath.includes('/');
    const isMainDoc = isDirectChild && restPath === `${slug}-${expectedType}.md`;
    const isPlanDoc = dir === 'specs' && isDirectChild && restPath === `${slug}-plan.md`;
    const isIterationDoc =
      dir === 'specs' &&
      isDirectChild &&
      restPath.startsWith(slug) &&
      ITERATION_SUFFIX_RE.test(restPath.slice(slug.length));
    if (!isMainDoc && !isPlanDoc && !isIterationDoc) continue; // other files in the folder are not checked.

    if (isMainDoc) {
      addTo(mainDocSeen, dir, slug);
    }

    const content = await ctx.read(rel);
    if (!isIterationDoc) {
      checkFile(rel, dir, restPath, content, findings, adrFiles, untrackedAdrFiles);
      continue;
    }
    const iterationFindings: Finding[] = [];
    checkFile(rel, dir, restPath, content, iterationFindings, adrFiles, untrackedAdrFiles);
    // why: iteration docs went unchecked through 0.3.0, and ADR-003 lets a new check only warn.
    for (const finding of iterationFindings) {
      findings.push({
        ...finding,
        level: 'warn',
        rule: 'profile-iteration-doc',
        message: `${finding.rule}: ${finding.message}`,
      });
    }
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

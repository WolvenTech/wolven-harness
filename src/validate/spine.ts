import { execFile } from 'node:child_process';
import { access, lstat, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'yaml';
import type { RepoContext } from './repo.js';
import type { Finding } from './report.js';

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---/;
const RULE_CITATION_RE = /\.agents\/rules\/[A-Za-z0-9._-]+\.md/g;
const CITING_FILES = ['WOLVEN.md', 'AGENTS.md'];

/** Harness paths every clone needs; `harness-ignored` checks the ones present on disk. */
const HARNESS_PATHS = [
  '.agents/skills',
  '.agents/rules',
  '.agents/hooks',
  '.qmd',
  'docs',
  '.claude/skills',
  'AGENTS.md',
  'CLAUDE.md',
  '.wolven-harness.json',
];

async function fileExists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

/** Reads `p` as utf8, or `undefined` when it can't be read (missing, not a file, ...). */
async function readOptional(p: string): Promise<string | undefined> {
  try {
    return await readFile(p, 'utf8');
  } catch {
    return undefined;
  }
}

/**
 * Walks every directory directly under `.agents/skills/` once and applies
 * two rules to each `SKILL.md`. A missing skills dir yields no findings.
 *
 * - `skill-frontmatter` (error): the `SKILL.md` must exist, and its
 *   frontmatter must parse and carry non-empty string `name` and
 *   `description`.
 * - `skill-stub-open` (warning, exit 0): frontmatter carrying
 *   `metadata.wolven-harness: stub` is an open stub; the finding names the
 *   file and tells the reader to define the skill and then remove the
 *   marker. Any other `metadata` value, or none, raises nothing. It fires
 *   whenever the frontmatter parses, independent of `skill-frontmatter`.
 */
async function checkSkills(root: string): Promise<{ frontmatter: Finding[]; stubs: Finding[] }> {
  const skillsDir = path.join(root, '.agents', 'skills');

  let entries;
  try {
    entries = await readdir(skillsDir, { withFileTypes: true });
  } catch {
    return { frontmatter: [], stubs: [] };
  }

  const findings: Finding[] = [];
  const stubs: Finding[] = [];
  const dirs = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  for (const dir of dirs) {
    const relFile = `.agents/skills/${dir}/SKILL.md`;
    const raw = await readOptional(path.join(skillsDir, dir, 'SKILL.md'));

    if (raw === undefined) {
      findings.push({ level: 'error', rule: 'skill-frontmatter', file: relFile, message: 'missing SKILL.md' });
      continue;
    }

    const match = raw.match(FRONTMATTER_RE);
    if (!match) {
      findings.push({ level: 'error', rule: 'skill-frontmatter', file: relFile, message: 'missing frontmatter' });
      continue;
    }

    let parsed: Record<string, unknown> | null | undefined;
    try {
      parsed = parse(match[1]) as Record<string, unknown> | null | undefined;
    } catch {
      findings.push({
        level: 'error',
        rule: 'skill-frontmatter',
        file: relFile,
        message: 'unparseable frontmatter',
      });
      continue;
    }

    const name = typeof parsed?.name === 'string' && parsed.name.length > 0 ? parsed.name : undefined;
    const description =
      typeof parsed?.description === 'string' && parsed.description.length > 0 ? parsed.description : undefined;

    const missing: string[] = [];
    if (!name) missing.push('name');
    if (!description) missing.push('description');

    if (missing.length > 0) {
      findings.push({
        level: 'error',
        rule: 'skill-frontmatter',
        file: relFile,
        message: `missing or empty frontmatter field(s): ${missing.join(', ')}`,
      });
    }

    const metadata = parsed?.metadata;
    const isOpenStub =
      typeof metadata === 'object' &&
      metadata !== null &&
      (metadata as Record<string, unknown>)['wolven-harness'] === 'stub';

    if (isOpenStub) {
      stubs.push({
        level: 'warn',
        rule: 'skill-stub-open',
        file: relFile,
        message: 'open stub: define the skill, then remove the wolven-harness: stub marker',
      });
    }
  }

  return { frontmatter: findings, stubs };
}

/**
 * Rule `rule-missing`: every `.agents/rules/<name>.md` cited in
 * `WOLVEN.md` or `AGENTS.md` must exist. One finding per missing cited
 * path, per citing line.
 */
async function checkRuleCitations(root: string): Promise<Finding[]> {
  const findings: Finding[] = [];

  for (const relFile of CITING_FILES) {
    const content = await readOptional(path.join(root, relFile));
    if (content === undefined) continue;

    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const cited = lines[i].match(RULE_CITATION_RE) ?? [];
      for (const citedPath of cited) {
        const exists = await fileExists(path.join(root, citedPath));
        if (!exists) {
          findings.push({
            level: 'error',
            rule: 'rule-missing',
            file: relFile,
            line: i + 1,
            message: `cited rule not found: ${citedPath}`,
          });
        }
      }
    }
  }

  return findings;
}

/**
 * Rule `step0-pending`: while `WOLVEN.md` exists and `AGENTS.md` is
 * absent or doesn't mention it, warn (exit 0) rather than fail.
 */
async function checkStep0Pending(root: string): Promise<Finding[]> {
  const wolvenExists = await fileExists(path.join(root, 'WOLVEN.md'));
  if (!wolvenExists) return [];

  const agentsContent = await readOptional(path.join(root, 'AGENTS.md'));
  const mentioned = agentsContent !== undefined && agentsContent.includes('WOLVEN.md');
  if (mentioned) return [];

  return [{ level: 'warn', rule: 'step0-pending', file: 'WOLVEN.md', message: 'harness-init step 0 pending' }];
}

/**
 * Runs `git check-ignore --stdin -z -v -n` over `paths` and returns its raw
 * NUL-separated output: four fields per path (source, line, pattern, path),
 * empty fields when no rule matched.
 */
function gitCheckIgnore(root: string, paths: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      'git',
      ['check-ignore', '--stdin', '-z', '-v', '-n'],
      { cwd: root, maxBuffer: 1024 * 1024 },
      (error, stdout) => {
        // invariant: exit 1 only means no path matched; any other failure surfaces.
        if (error && (error as { code?: unknown }).code !== 1) reject(error);
        else resolve(stdout);
      },
    );
    child.stdin?.end(paths.map((p) => `${p}\0`).join(''));
  });
}

/**
 * Rule `harness-ignored`: every harness path present on disk must be able
 * to reach other clones. A path excluded by an ignore rule (`.gitignore`,
 * `.git/info/exclude`, or the global excludes file) is an error naming the
 * rule. A path whose last matching rule is a `!` re-include is fine, and
 * tracked files are never reported, since git applies ignore rules only to
 * untracked ones.
 */
async function checkHarnessIgnored(root: string): Promise<Finding[]> {
  const present: string[] = [];
  for (const rel of HARNESS_PATHS) {
    try {
      await lstat(path.join(root, rel));
      present.push(rel);
    } catch {
      // why: an absent path has nothing to share, so it is not checked.
    }
  }
  if (present.length === 0) return [];

  const fields = (await gitCheckIgnore(root, present)).split('\0');
  const findings: Finding[] = [];
  for (let i = 0; i + 3 < fields.length; i += 4) {
    const [source, line, pattern, rel] = fields.slice(i, i + 4);
    if (pattern === '' || pattern.startsWith('!')) continue;
    findings.push({
      level: 'error',
      rule: 'harness-ignored',
      file: rel,
      message: `excluded by ignore rule "${pattern}" (${source}:${line}), so other clones and CI never get it; add re-include rules after that line`,
    });
  }
  return findings;
}

/**
 * Checks the harness spine: skill frontmatter, open skill stubs,
 * cited-rule existence, harness paths excluded by ignore rules, and the
 * step-0-pending warning. Reads the working
 * tree directly via `node:fs/promises` against `ctx.root`, not `ctx.files`
 * — `WOLVEN.md` and `.agents/**` stay untracked until someone commits them,
 * and these checks must still see them.
 */
export async function checkSpine(ctx: RepoContext): Promise<Finding[]> {
  const [skills, ruleFindings, ignoredFindings, step0Findings] = await Promise.all([
    checkSkills(ctx.root),
    checkRuleCitations(ctx.root),
    checkHarnessIgnored(ctx.root),
    checkStep0Pending(ctx.root),
  ]);

  return [...skills.frontmatter, ...skills.stubs, ...ruleFindings, ...ignoredFindings, ...step0Findings];
}

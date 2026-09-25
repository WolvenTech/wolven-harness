import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'yaml';
import type { RepoContext } from './repo.js';
import type { Finding } from './report.js';

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---/;
const RULE_CITATION_RE = /\.agents\/rules\/[A-Za-z0-9._-]+\.md/g;
const CITING_FILES = ['WOLVEN.md', 'AGENTS.md'];

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
 * Rule `skill-frontmatter`: every directory directly under
 * `.agents/skills/` must have a `SKILL.md` whose frontmatter parses and
 * carries non-empty string `name` and `description`. A missing skills dir
 * yields no findings.
 */
async function checkSkillFrontmatter(root: string): Promise<Finding[]> {
  const skillsDir = path.join(root, '.agents', 'skills');

  let entries;
  try {
    entries = await readdir(skillsDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const findings: Finding[] = [];
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
  }

  return findings;
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
 * Checks the harness spine: skill frontmatter, cited-rule
 * existence, and the step-0-pending warning. Reads the working tree
 * directly via `node:fs/promises` against `ctx.root`, not `ctx.files` —
 * `WOLVEN.md` and `.agents/**` stay untracked until someone commits them, and
 * these checks must still see them.
 */
export async function checkSpine(ctx: RepoContext): Promise<Finding[]> {
  const [skillFindings, ruleFindings, step0Findings] = await Promise.all([
    checkSkillFrontmatter(ctx.root),
    checkRuleCitations(ctx.root),
    checkStep0Pending(ctx.root),
  ]);

  return [...skillFindings, ...ruleFindings, ...step0Findings];
}

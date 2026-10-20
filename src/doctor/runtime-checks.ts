import { lstat, readdir, readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { type RuntimeRegistryRow, runtimeRow } from '../setup/runtimes.js';
import { skillFolders } from '../setup/skill-sets.js';
import type { Runtime } from '../setup/types.js';
import type { DoctorContext } from './index.js';
import type { DoctorCode, DoctorFinding } from './report.js';

const HARNESS_START = '<!-- wolven-harness:start -->';
const RULES_START = '<!-- wolven-harness:rules:start -->';
const RULES_END = '<!-- wolven-harness:rules:end -->';

const ENTRY_FIX = 'run the "harness-init" skill in this folder to write the harness section';
const RULES_FIX = 're-run "wolven-harness setup" to recreate the rules wiring';
const RULES_INSTALL_FIX = 'run the "harness-init" skill to install the standing rules';
const SKILLS_FIX = 're-run "wolven-harness setup" to recreate the skills path';

/** One installed standing rule, read from `<harnessHome>/.agents/rules/<base>.md`. */
interface Rule {
  base: string;
  /** The rule's H1 text, or its file name when the body has no H1. */
  title: string;
  raw: string;
}

/** Reads `file` as utf8, or `undefined` when it is missing or unreadable. */
async function readText(file: string): Promise<string | undefined> {
  try {
    return await readFile(file, 'utf8');
  } catch {
    return undefined;
  }
}

/** True when `file` exists and is a directory once symlinks are followed. */
async function isDirectory(file: string): Promise<boolean> {
  try {
    return (await stat(file)).isDirectory();
  } catch {
    return false;
  }
}

/** True when `link` is a symlink (or a path) that resolves to `target`, both existing. */
async function resolvesTo(link: string, target: string): Promise<boolean> {
  try {
    const [from, to] = await Promise.all([realpath(link), realpath(target)]);
    return from === to;
  } catch {
    return false;
  }
}

/** The text between `start` and `end`, or `undefined` when either marker is missing. */
function between(text: string, start: string, end: string): string | undefined {
  const from = text.indexOf(start);
  if (from === -1) return undefined;
  const to = text.indexOf(end, from + start.length);
  if (to === -1) return undefined;
  return text.slice(from + start.length, to);
}

/** A rule file without its YAML frontmatter. */
function stripFrontmatter(raw: string): string {
  return raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
}

/** The rule's H1 text, falling back to its base name. */
function ruleTitle(body: string, base: string): string {
  const heading = /^#\s+(.+?)\s*$/m.exec(body);
  return heading?.[1] ?? base;
}

/** The YAML frontmatter block of `raw`, or `undefined` when there is none. */
function frontmatterBlock(raw: string): string | undefined {
  return /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw)?.[1];
}

/** Every `*.md` file under `<harnessHome>/.agents/rules/`, sorted, skipping unreadable entries. */
async function readRules(harnessHome: string): Promise<Rule[]> {
  const dir = path.join(harnessHome, '.agents', 'rules');
  let names: string[];
  try {
    names = await readdir(dir);
  } catch {
    return [];
  }

  const rules: Rule[] = [];
  for (const name of names.filter((entry) => entry.endsWith('.md')).sort()) {
    const raw = await readText(path.join(dir, name));
    if (raw === undefined) continue;
    const base = name.slice(0, -'.md'.length);
    rules.push({ base, title: ruleTitle(stripFrontmatter(raw), base), raw });
  }
  return rules;
}

/** The entry files whose chain must reach the harness section, per runtime. */
function entryProblem(
  row: RuntimeRegistryRow,
  agents: string | undefined,
  claude: string | undefined,
  gemini: string | undefined,
): string | undefined {
  if (agents === undefined || !agents.includes(HARNESS_START)) {
    return 'AGENTS.md has no harness section start marker';
  }
  if (row.id === 'claude' && claude !== undefined && !claude.includes('@AGENTS.md')) {
    return 'CLAUDE.md exists but does not import @AGENTS.md';
  }
  if (row.id === 'gemini') {
    if (gemini === undefined) return 'GEMINI.md is missing, so the harness section is never read';
    if (!gemini.includes('@AGENTS.md')) return 'GEMINI.md does not import @AGENTS.md';
  }
  return undefined;
}

/** The rules a runtime fails to receive, or `undefined` when its strategy holds. */
async function rulesProblem(
  row: RuntimeRegistryRow,
  ctx: DoctorContext,
  rules: Rule[],
  agents: string | undefined,
  gemini: string | undefined,
): Promise<string | undefined> {
  if (rules.length === 0) return 'no standing rules were found under .agents/rules/';

  if (row.rules === 'inline') {
    const block = between(agents ?? '', RULES_START, RULES_END);
    if (block === undefined) return 'AGENTS.md has no inline rules block';
    const missing = rules.filter((rule) => !block.includes(rule.title) && !block.includes(rule.base));
    if (missing.length > 0) return `AGENTS.md's inline rules block is missing ${missing.map((r) => r.base).join(', ')}`;
    return undefined;
  }

  const home = ctx.harnessHome;
  const rulePath = (rule: Rule): string => `.agents/rules/${rule.base}.md`;

  switch (row.id) {
    case 'claude':
      return (await resolvesTo(path.join(home, '.claude', 'rules'), path.join(home, '.agents', 'rules')))
        ? undefined
        : '.claude/rules does not resolve to .agents/rules';

    case 'cursor': {
      const missing = await missingFiles(
        rules.map((rule) => path.join(home, '.cursor', 'rules', `wolven-${rule.base}.mdc`)),
      );
      return missing.length > 0 ? `.cursor/rules is missing ${missing.join(', ')}` : undefined;
    }

    case 'copilot': {
      const missing = await missingFiles(
        rules.map((rule) => path.join(home, '.github', 'instructions', `wolven-${rule.base}.instructions.md`)),
      );
      return missing.length > 0 ? `.github/instructions is missing ${missing.join(', ')}` : undefined;
    }

    case 'kiro': {
      const missing = await missingFiles(
        rules.map((rule) => path.join(home, '.kiro', 'steering', `wolven-${rule.base}.md`)),
      );
      return missing.length > 0 ? `.kiro/steering is missing ${missing.join(', ')}` : undefined;
    }

    case 'opencode': {
      const raw = await readText(path.join(home, 'opencode.json'));
      if (raw === undefined) return 'opencode.json is missing';
      let instructions: unknown;
      try {
        instructions = (JSON.parse(raw) as { instructions?: unknown }).instructions;
      } catch {
        return 'opencode.json is not valid JSON';
      }
      const listed = Array.isArray(instructions) ? instructions.filter((entry) => typeof entry === 'string') : [];
      const missing = rules.filter((rule) => !listed.includes(rulePath(rule))).map((rule) => rulePath(rule));
      return missing.length > 0 ? `opencode.json does not list ${missing.join(', ')}` : undefined;
    }

    case 'gemini': {
      const missing = rules.filter((rule) => !(gemini ?? '').includes(`@${rulePath(rule)}`)).map(rulePath);
      return missing.length > 0 ? `GEMINI.md does not import ${missing.join(', ')}` : undefined;
    }

    case 'amp': {
      const missing = rules.filter((rule) => !(agents ?? '').includes(`@${rulePath(rule)}`)).map(rulePath);
      return missing.length > 0 ? `AGENTS.md does not import ${missing.join(', ')}` : undefined;
    }

    case 'antigravity': {
      const missing = rules
        .filter((rule) => !/^trigger:\s*\S+/m.test(frontmatterBlock(rule.raw) ?? ''))
        .map((rule) => rulePath(rule));
      return missing.length > 0 ? `${missing.join(', ')} carry no trigger frontmatter` : undefined;
    }

    default:
      return undefined;
  }
}

/** The relative paths in `files` that do not exist as regular files. */
async function missingFiles(files: string[]): Promise<string[]> {
  const missing: string[] = [];
  for (const file of files) {
    try {
      const entry = await lstat(file);
      if (!entry.isFile()) missing.push(path.basename(file));
    } catch {
      missing.push(path.basename(file));
    }
  }
  return missing;
}

/** The skills a runtime fails to see, or `undefined` when its skills path holds all of them. */
async function skillsProblem(row: RuntimeRegistryRow, ctx: DoctorContext): Promise<string | undefined> {
  const skillsRoot = path.join(ctx.harnessHome, '.agents', 'skills');
  const rowPath = path.join(ctx.harnessHome, row.skills.path);

  if (row.skills.kind === 'symlink' && !(await resolvesTo(rowPath, skillsRoot))) {
    return `${row.skills.path} does not resolve to .agents/skills`;
  }

  const installed = skillFolders(ctx.config.skillSets ?? []);
  const missing: string[] = [];
  for (const skill of installed) {
    if (!(await isDirectory(path.join(skillsRoot, skill)))) missing.push(skill);
  }
  return missing.length > 0 ? `.agents/skills is missing ${missing.join(', ')}` : undefined;
}

/** An error finding for `row` and `code`, or `undefined`; a read failure becomes that check's finding. */
async function check(
  code: DoctorCode,
  row: RuntimeRegistryRow,
  fix: string,
  problem: () => Promise<string | undefined>,
): Promise<DoctorFinding | undefined> {
  let reason: string | undefined;
  try {
    reason = await problem();
  } catch {
    reason = 'the check could not read the files it needs';
  }
  if (reason === undefined) return undefined;
  return { level: 'error', code, message: `${row.name}: ${reason}`, fix: `${fix} for ${row.name}` };
}

/**
 * Checks each wired runtime against the registry: its instruction chain
 * reaches the harness section, its rules strategy holds for the installed
 * rules, and its skills path holds every skill the config's sets install.
 * Harness-owned folders are read under `harnessHome`, entry files under
 * `root`, so a linked layout is checked in the folder that owns them.
 */
export async function runRuntimeChecks(ctx: DoctorContext): Promise<DoctorFinding[]> {
  const rules = await readRules(ctx.harnessHome);
  const agents = await readText(path.join(ctx.root, 'AGENTS.md'));
  const claude = await readText(path.join(ctx.root, 'CLAUDE.md'));
  const gemini = await readText(path.join(ctx.root, 'GEMINI.md'));

  const findings: DoctorFinding[] = [];
  const seen = new Set<Runtime>();

  for (const id of ctx.config.runtimes) {
    if (seen.has(id)) continue;
    seen.add(id);
    const row = runtimeRow(id);

    const entry = await check('doctor-entry', row, ENTRY_FIX, async () => entryProblem(row, agents, claude, gemini));
    if (entry !== undefined) findings.push(entry);

    const rulesFinding = await check(
      'doctor-rules',
      row,
      rules.length === 0 ? RULES_INSTALL_FIX : RULES_FIX,
      async () => rulesProblem(row, ctx, rules, agents, gemini),
    );
    if (rulesFinding !== undefined) findings.push(rulesFinding);

    const skills = await check('doctor-skills', row, SKILLS_FIX, async () => skillsProblem(row, ctx));
    if (skills !== undefined) findings.push(skills);
  }

  return findings;
}

import { runtimeRow } from './runtimes.js';
import type { SkillSet } from './skill-sets.js';
import { setsOf } from './skill-sets.js';
import type { Runtime, StepResult } from './types.js';

/**
 * What a finished `setup` run reports: things it added, and things it left
 * alone (each `kept` entry completes "kept your existing ...").
 */
export interface Summary {
  done: string[];
  kept: string[];
  /** Whole-sentence remarks, shown as they are. */
  notes: string[];
}

const RUNTIME_NAMES: Record<Runtime, string> = {
  claude: 'Claude Code',
  codex: 'Codex',
  cursor: 'Cursor',
  opencode: 'OpenCode',
  amp: 'Amp',
  copilot: 'GitHub Copilot',
  gemini: 'Gemini CLI',
  kiro: 'Kiro',
  antigravity: 'Antigravity',
};

/** The runtime whose wiring produced `entry`, or `undefined` for a path no runtime owns. */
function wiringOwner(entry: string): Runtime | undefined {
  if (entry === 'CLAUDE.md' || entry.startsWith('.claude/')) return 'claude';
  if (entry.startsWith('.kiro/')) return 'kiro';
  if (entry.startsWith('.cursor/')) return 'cursor';
  if (entry.startsWith('.github/instructions/')) return 'copilot';
  if (entry === 'opencode.json') return 'opencode';
  if (entry === 'GEMINI.md') return 'gemini';
  return undefined;
}

/** Groups wiring entries by the runtime that owns each path. */
function entriesByRuntime(runtimes: Runtime[], entries: string[]): Map<Runtime, string[]> {
  const grouped = new Map<Runtime, string[]>();
  for (const runtime of runtimes) grouped.set(runtime, []);
  for (const entry of entries) {
    const owner = wiringOwner(entry);
    if (owner === undefined) continue;
    const owned = grouped.get(owner);
    if (owned !== undefined) owned.push(entry);
  }
  return grouped;
}

/** A single path, or a count plus folder when a runtime generated several files at once. */
function describeWiring(paths: string[]): string {
  if (paths.length === 1) return paths[0];
  const dirs = new Set(paths.map((p) => p.slice(0, p.lastIndexOf('/'))));
  if (dirs.size === 1) return `${paths.length} files in ${[...dirs][0]}`;
  return paths.join(', ');
}

/** Display name for a runtime, as used in prompts and messages. */
export function runtimeName(runtime: Runtime): string {
  return RUNTIME_NAMES[runtime];
}

/** Joins names as "a, b and c". */
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** Names of the top-level entries directly under `prefix` (a folder path ending in `/`). */
function childNames(paths: string[], prefix: string): string[] {
  const names = new Set<string>();
  for (const p of paths) {
    if (!p.startsWith(prefix)) continue;
    const rest = p.slice(prefix.length);
    const slash = rest.indexOf('/');
    names.add(slash === -1 ? rest : rest.slice(0, slash));
  }
  return [...names].sort();
}

/** Describes the `.agents/` and `docs/` content in `paths`, without a verb. */
function describeTree(paths: string[]): string[] {
  const lines: string[] = [];

  const skills = childNames(paths, '.agents/skills/');
  const rules = paths.filter((p) => /^\.agents\/rules\/[^/]+$/.test(p));
  const agentParts: string[] = [];
  if (skills.length > 0) agentParts.push(`${plural(skills.length, 'skill')} (${setsOf(skills).join(', ')})`);
  if (rules.length > 0) agentParts.push(plural(rules.length, 'rule'));
  if (agentParts.length > 0) lines.push(`${joinNames(agentParts)} in .agents/`);

  const folders = childNames(
    paths.filter((p) => p.startsWith('docs/') && p.slice('docs/'.length).includes('/')),
    'docs/',
  );
  const docFiles = paths.filter((p) => p.startsWith('docs/') && !p.slice('docs/'.length).includes('/'));
  if (folders.length > 0) lines.push(`docs/ folders: ${folders.join(', ')}`);
  if (docFiles.length > 0) lines.push(docFiles.join(', '));

  if (paths.includes('WOLVEN.md')) lines.push('WOLVEN.md');
  if (paths.includes('.harness-score.json')) lines.push('.harness-score.json (harness-score config)');
  const qmd: string[] = [];
  if (paths.includes('.qmd/index.yml')) qmd.push('.qmd/index.yml (search index config)');
  if (paths.includes('.qmd/.gitignore')) qmd.push('.qmd/.gitignore (keeps the local index out of git)');
  if (qmd.length > 0) lines.push(joinNames(qmd));

  const rest = paths.filter(
    (p) =>
      !p.startsWith('.agents/') &&
      !p.startsWith('docs/') &&
      !p.startsWith('.qmd/') &&
      p !== 'WOLVEN.md' &&
      p !== '.harness-score.json',
  );
  if (rest.length > 0) lines.push(rest.join(', '));

  return lines;
}

function scriptKeys(paths: string[]): string[] {
  return paths.filter((p) => p.startsWith('package.json#scripts.')).map((p) => p.slice('package.json#scripts.'.length));
}

/**
 * Builds the grouped summary from the real results of the three apply
 * steps. Every count and name comes from those results; nothing is fixed.
 */
export function buildSummary(
  apply: StepResult,
  wiring: StepResult,
  scripts: StepResult,
  runtimes: Runtime[],
  keptSets: SkillSet[] = [],
): Summary {
  const done: string[] = [];
  const kept: string[] = [];
  const notes: string[] = [];

  for (const line of describeTree(apply.created)) done.push(line);

  kept.push(...describeTree(apply.skipped));

  const claudeMdFirst = (a: string, b: string): number => Number(b === 'CLAUDE.md') - Number(a === 'CLAUDE.md');
  const createdByRuntime = entriesByRuntime(runtimes, wiring.created);
  const skippedByRuntime = entriesByRuntime(runtimes, wiring.skipped);
  const inline = runtimes.some((runtime) => runtimeRow(runtime).rules === 'inline');
  const direct: string[] = [];

  for (const runtime of runtimes) {
    const row = runtimeRow(runtime);
    const created = createdByRuntime.get(runtime) ?? [];
    const skipped = skippedByRuntime.get(runtime) ?? [];
    const isSkills = (entry: string): boolean => entry === 'CLAUDE.md' || entry === row.skills.path;
    const skillsCreated = created.filter(isSkills).sort(claudeMdFirst);
    const skillsSkipped = skipped.filter(isSkills).sort(claudeMdFirst);
    const rulesCreated = created.filter((entry) => !isSkills(entry));
    const rulesSkipped = skipped.filter((entry) => !isSkills(entry));

    if (row.skills.kind === 'symlink') {
      if (skillsCreated.length > 0) done.push(`${row.name} wired (${skillsCreated.join(', ')})`);
      if (skillsSkipped.length > 0) kept.push(skillsSkipped.join(', '));
    } else {
      direct.push(row.name);
    }

    if (inline) {
      if (row.rules === 'inline') done.push(`${row.name} takes the rules inline from the harness section`);
      continue;
    }

    if (row.id === 'amp') {
      done.push('Amp gets the rules through the harness section (@.agents/rules/*.md)');
      continue;
    }
    if (row.id === 'antigravity') {
      done.push('Antigravity reads .agents/rules/ directly through its trigger frontmatter');
      continue;
    }
    if (row.rules === 'inline') continue;

    if (rulesCreated.length > 0) done.push(`${row.name} rules wired (${describeWiring(rulesCreated)})`);
    if (rulesSkipped.length > 0) {
      kept.push(rulesSkipped.join(', '));
      const needsInit = rulesSkipped.filter((entry) => entry === 'opencode.json' || entry === 'GEMINI.md');
      if (needsInit.length > 0) {
        notes.push(
          `Run the harness-init skill to point your existing ${joinNames(needsInit)} at .agents/rules/; setup left ${needsInit.length === 1 ? 'it' : 'them'} untouched.`,
        );
      }
    }
  }

  if (direct.length > 0) {
    done.push(
      `${joinNames(direct)} ${direct.length === 1 ? 'reads' : 'read'} .agents/skills/ natively, so nothing extra is needed`,
    );
  }
  if (inline) {
    notes.push('Rules are inlined in the harness section, so setup created no per-runtime rule files.');
  }

  const added = scriptKeys(scripts.created);
  if (added.length > 0) done.push(`package.json scripts: ${added.join(', ')}`);
  const present = scriptKeys(scripts.skipped);
  if (present.length > 0) kept.push(`package.json scripts: ${present.join(', ')}`);

  if (keptSets.length > 0) {
    notes.push(
      `Left the ${joinNames(keptSets)} skills in place. You did not pick them this time, but setup never removes anything.`,
    );
  }

  return { done, kept, notes };
}

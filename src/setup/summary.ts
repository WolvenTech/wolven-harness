import type { Runtime, StepResult } from './types.js';
import { setsOf } from './skill-sets.js';
import type { SkillSet } from './skill-sets.js';

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
};

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
  const claudeCreated = [...wiring.created].sort(claudeMdFirst);
  const claudeKept = [...wiring.skipped].sort(claudeMdFirst);
  if (runtimes.includes('claude')) {
    if (claudeCreated.length > 0) done.push(`Claude Code wired (${claudeCreated.join(', ')})`);
    if (claudeKept.length > 0) kept.push(claudeKept.join(', '));
  }
  const native = runtimes.filter((r) => r !== 'claude').map(runtimeName);
  if (native.length > 0) {
    done.push(`${joinNames(native)} ${native.length === 1 ? 'reads' : 'read'} .agents/skills/ natively, so nothing extra is needed`);
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

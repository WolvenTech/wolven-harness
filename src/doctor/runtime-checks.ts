import { readdir, readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import {
  quietEntryRequirements,
  quietGeneratedFiles,
  type RuleSource,
  type RuntimeRegistryRow,
  readRules,
  rulesMode,
  runtimeRow,
  wrapRule,
} from '../setup/runtimes.js';
import { skillFolders } from '../setup/skill-sets.js';
import type { Runtime } from '../setup/types.js';
import { type DoctorContext, isQuietInstall } from './index.js';
import type { DoctorCode, DoctorFinding } from './report.js';

type WiringEntry = { path: string; outcome: string };

export async function readWiringRecord(ctx: DoctorContext): Promise<WiringEntry[]> {
  if (!isQuietInstall(ctx)) return [];
  try {
    const record: unknown = JSON.parse(await readFile(path.join(ctx.harnessHome, 'wiring.json'), 'utf8'));
    if (typeof record !== 'object' || record === null || !('entries' in record) || !Array.isArray(record.entries))
      return [];
    return record.entries.filter(
      (entry): entry is WiringEntry =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof entry.path === 'string' &&
        typeof entry.outcome === 'string',
    );
  } catch {
    return [];
  }
}

function keptEntry(record: WiringEntry[], file: string): WiringEntry | undefined {
  return record.find((entry) => entry.path === file && ['merged', 'prefixed', 'skipped'].includes(entry.outcome));
}

async function quietClaudeFindings(ctx: DoctorContext, rules: Rule[]): Promise<DoctorFinding[]> {
  const row = runtimeRow('claude');
  const findings: DoctorFinding[] = [];
  const home = path.relative(ctx.root, ctx.harnessHome).split(path.sep).join('/');
  const record = await readWiringRecord(ctx);
  const inspect = async (file: string, target: string, code: DoctorCode) => {
    const kept = keptEntry(record, file);
    if (kept !== undefined) {
      findings.push({ level: 'warn', code, message: `${row.name}: kept client path ${file} (${kept.outcome})` });
    } else if (!(await resolvesTo(path.join(ctx.root, file), target))) {
      findings.push({
        level: 'error',
        code,
        message: `${row.name}: ${file} isn't connected to ${path.relative(ctx.root, target)}`,
        fix: `ask your agent to run the harness-init skill to reconnect ${file}`,
      });
    }
  };
  await inspect('CLAUDE.local.md', path.join(ctx.harnessHome, 'AGENTS.md'), 'doctor-entry');
  if (rules.length === 0) {
    findings.push({
      level: 'error',
      code: 'doctor-rules',
      message: `${row.name}: no standing rules were found in ${home}`,
      fix: 'ask your agent to run the harness-init skill to install the standing rules',
    });
  }
  for (const rule of rules)
    await inspect(
      `${row.rules.kind === 'link' ? row.rules.path : ''}/${rule.base}.md`,
      path.join(ctx.harnessHome, '.agents/rules', `${rule.base}.md`),
      'doctor-rules',
    );
  for (const skill of skillFolders(ctx.config.skillSets ?? [])) {
    const file = `${row.skills.path}/${skill}`;
    await inspect(file, path.join(ctx.harnessHome, '.agents/skills', skill), 'doctor-skills');
    if (
      !keptEntry(record, file) &&
      (await resolvesTo(path.join(ctx.root, file), path.join(ctx.harnessHome, '.agents/skills', skill))) &&
      (await readText(path.join(ctx.root, file, 'SKILL.md'))) === undefined
    ) {
      findings.push({
        level: 'error',
        code: 'doctor-skills',
        message: `${row.name}: ${file}/SKILL.md is missing or unreadable`,
        fix: 'run "wolven-harness setup" to restore the skill',
      });
    }
  }
  return findings;
}

async function quietRuntimeFindings(
  row: RuntimeRegistryRow,
  ctx: DoctorContext,
  rules: Rule[],
  seen: Set<string>,
): Promise<DoctorFinding[]> {
  const wiring = row.quietInstall;
  if (wiring === undefined) return [];
  const findings: DoctorFinding[] = [];
  const record = await readWiringRecord(ctx);
  const home = path.relative(ctx.root, ctx.harnessHome).split(path.sep).join('/');
  const agents = await readText(path.join(ctx.harnessHome, 'AGENTS.md'));
  const inspect = async (
    file: string,
    code: DoctorCode,
    problem: () => Promise<string | undefined>,
    fix: string = wiring.manualStep ?? 'ask your agent to run the harness-init skill',
  ) => {
    // invariant: runtimes that share a path report it once, under the first runtime that reaches it.
    if (seen.has(`${code}:${file}`)) return;
    seen.add(`${code}:${file}`);
    const kept = keptEntry(record, file);
    if (kept !== undefined) {
      findings.push({ level: 'warn', code, message: `${row.name}: kept client path ${file} (${kept.outcome})` });
      return;
    }
    const reason = await problem();
    if (reason !== undefined)
      findings.push({
        level: 'error',
        code,
        message: `${row.name}: ${file} ${reason}`,
        fix,
      });
  };
  for (const skill of skillFolders(ctx.config.skillSets ?? [])) {
    const file = `${wiring.skillsPath}/${skill}`;
    await inspect(
      file,
      'doctor-skills',
      async () => {
        if (!(await resolvesTo(path.join(ctx.root, file), path.join(ctx.harnessHome, '.agents/skills', skill))))
          return "isn't connected to its harness skill";
        return (await readText(path.join(ctx.root, file, 'SKILL.md'))) === undefined
          ? 'has no readable SKILL.md'
          : undefined;
      },
      `run wolven-harness setup to restore ${file}`,
    );
  }
  if (row.id === 'codex') {
    const kept = keptEntry(record, 'AGENTS.md');
    if (kept !== undefined) {
      findings.push({
        level: 'warn',
        code: 'doctor-entry',
        message: `${row.name}: kept client path AGENTS.md (${kept.outcome})`,
      });
    } else if (!(await readText(path.join(ctx.root, 'AGENTS.md')))?.includes(HARNESS_START)) {
      findings.push({
        level: 'warn',
        code: 'doctor-entry',
        message: `${row.name} reads only your AGENTS.md, so it won't load the harness on its own. Next: ask your agent to run the harness-init skill and add the harness lines to AGENTS.md, or ask ${row.name} to read ${home}/AGENTS.md.`,
      });
    }
    return findings;
  }
  const requirement = quietEntryRequirements(row, home);
  if (requirement !== undefined) {
    await inspect(requirement.file, 'doctor-entry', async () => {
      const text = await readText(path.join(ctx.root, requirement.file));
      if (text === undefined) return 'is missing or unreadable';
      if (requirement.json) {
        try {
          const parsed = JSON.parse(text) as { instructions?: unknown };
          return Array.isArray(parsed.instructions) &&
            requirement.needles.every((needle) => (parsed.instructions as unknown[]).includes(needle))
            ? undefined
            : 'does not list the harness instructions and rules';
        } catch {
          return 'is not valid JSON';
        }
      }
      return requirement.needles.every((needle) => text.includes(needle))
        ? undefined
        : 'does not import the harness instructions and rules';
    });
  }
  const generated = quietGeneratedFiles(row, rules, agents ?? '', home);
  for (const [file, expected] of generated) {
    await inspect(file, file.includes('agents.mdc') ? 'doctor-entry' : 'doctor-rules', async () => {
      return (await readText(path.join(ctx.root, file))) === undefined ? 'is missing or unreadable' : undefined;
    });
    if (!keptEntry(record, file) && !seen.has(`stale:${file}`)) {
      seen.add(`stale:${file}`);
      const actual = await readText(path.join(ctx.root, file));
      if (actual !== undefined && actual !== expected)
        findings.push({
          level: 'error',
          code: 'doctor-rules-stale',
          message: `${row.name}: ${file} differs from the current harness source`,
          fix: `ask your agent to run the harness-doctor skill to refresh ${file}`,
        });
    }
  }
  if (row.rules.kind === 'per-rule') {
    const pattern = row.rules.pattern;
    const folder = pattern.slice(0, pattern.lastIndexOf('/'));
    const [prefix, suffix] = path.posix.basename(pattern).split('{rule}');
    let names: string[] = [];
    try {
      names = await readdir(path.join(ctx.root, folder));
    } catch {
      // why: missing expected files already produce wiring findings.
    }
    for (const name of names.sort()) {
      if (!name.startsWith(prefix) || !name.endsWith(suffix) || name.length <= prefix.length + suffix.length) continue;
      const file = `${folder}/${name}`;
      if (generated.has(file)) continue;
      const kept = keptEntry(record, file);
      findings.push(
        kept === undefined
          ? {
              level: 'error',
              code: 'doctor-rules-stale',
              message: `${row.name}: ${file} has no current source rule`,
              fix: `ask your agent to run the harness-doctor skill to review ${file}`,
            }
          : {
              level: 'warn',
              code: 'doctor-rules-stale',
              message: `${row.name}: kept client path ${file} (${kept.outcome})`,
            },
      );
    }
  }
  if (agents === undefined && !seen.has('missing-agents')) {
    seen.add('missing-agents');
    findings.push({
      level: 'error',
      code: 'doctor-entry',
      message: `${row.name}: ${home}/AGENTS.md is missing`,
      fix: 'run "wolven-harness setup" to restore the harness instructions',
    });
  }
  return findings;
}

const HARNESS_START = '<!-- wolven-harness:start -->';
const RULES_START = '<!-- wolven-harness:rules:start -->';
const RULES_END = '<!-- wolven-harness:rules:end -->';

const ENTRY_FIX = 'ask your agent to run the harness-init skill to write the harness section';
const RULES_FIX = 're-run "wolven-harness setup" to recreate the rules wiring';
const INLINE_FIX = 'ask your agent to run the harness-init skill to write the inline rules block';
const RULES_INSTALL_FIX = 'ask your agent to run the harness-init skill to install the standing rules';
const SKILLS_FIX = 're-run "wolven-harness setup" to recreate the skills path';

/** One installed standing rule, read from `<harnessHome>/.agents/rules/<base>.md`. */
type Rule = RuleSource;

/** Reads `file` as utf8, or `undefined` when it is missing or unreadable. */
async function readText(file: string): Promise<string | undefined> {
  try {
    return await readFile(file, 'utf8');
  } catch {
    return undefined;
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

/** The import every instruction chain must reach the harness section through. */
const AGENTS_IMPORT = '@AGENTS.md';

/** The instruction chain problem for a runtime, or `undefined` when its entry reaches the harness section. */
async function entryProblem(row: RuntimeRegistryRow, ctx: DoctorContext, agents: string | undefined) {
  if (agents === undefined || !agents.includes(HARNESS_START)) {
    return 'AGENTS.md has no harness section start marker';
  }

  if (row.entryFile !== undefined) {
    const entry = await readText(path.join(ctx.root, row.entryFile.path));
    if (entry === undefined) return `${row.entryFile.path} is missing or unreadable`;
    const needle = row.entryFile.content.trim();
    if (!entry.includes(needle)) {
      return `${row.entryFile.path} exists but does not import ${AGENTS_IMPORT}`;
    }
  }

  // invariant: a `file` row whose rendered output imports AGENTS.md is that runtime's only way into the harness section.
  if (row.rules.kind === 'file' && row.rules.render([]).includes(AGENTS_IMPORT)) {
    const entry = await readText(path.join(ctx.root, row.rules.path));
    if (entry === undefined) return `${row.rules.path} is missing, so the harness section is never read`;
    if (!entry.includes(AGENTS_IMPORT)) return `${row.rules.path} does not import ${AGENTS_IMPORT}`;
  }
  return undefined;
}

/** `text` with every whitespace run collapsed to one space, for a layout-blind comparison. */
function normalizeRuleText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** The inline body harness-init writes, with its title promoted and nested headings demoted. */
function inlineRuleBody(body: string): string {
  let titleWritten = false;
  return body.replace(/^(#{1,6})([ \t]+.*)$/gm, (_heading, hashes: string, rest: string) => {
    if (!titleWritten && hashes === '#') {
      titleWritten = true;
      return `###${rest}`;
    }
    return `${'#'.repeat(Math.min(hashes.length + 1, 6))}${rest}`;
  });
}

function expectedInlineRules(rules: Rule[]): string {
  return rules.map((rule) => inlineRuleBody(rule.body)).join('\n\n');
}

/** The inline rules block problem, or `undefined` when the block holds every installed rule. */
function inlineProblem(rules: Rule[], agents: string | undefined): string | undefined {
  if (rules.length === 0) return 'no standing rules were found under .agents/rules/';
  const block = between(agents ?? '', RULES_START, RULES_END);
  if (block === undefined) return 'AGENTS.md has no inline rules block';
  const missing = rules.filter((rule) => {
    const title = /^#\s+(.+?)\s*$/m.exec(rule.body)?.[1] ?? rule.base;
    return !block.includes(`### ${title}`);
  });
  if (missing.length > 0)
    return `AGENTS.md's inline rules block is missing ${missing.map((rule) => rule.base).join(', ')}`;
  return undefined;
}

/** The inline block's body drift, or `undefined` when it matches all current rules. */
function inlineStaleProblem(rules: Rule[], agents: string | undefined): string | undefined {
  if (rules.length === 0) return undefined;
  const block = between(agents ?? '', RULES_START, RULES_END);
  if (block === undefined) return undefined;
  return normalizeRuleText(block) === normalizeRuleText(expectedInlineRules(rules))
    ? undefined
    : "AGENTS.md's inline rules block differs from the current rule bodies";
}

/** Stale native rule copies and orphaned `wolven-` copies under one runtime's folder. */
async function stalePerRuleFindings(
  row: RuntimeRegistryRow,
  ctx: DoctorContext,
  rules: Rule[],
): Promise<DoctorFinding[]> {
  if (row.rules.kind !== 'per-rule') return [];
  const { pattern, frontmatter } = row.rules;
  const files = rules.map((rule) => pattern.replace('{rule}', rule.base));
  const expected = new Map(rules.map((rule) => [pattern.replace('{rule}', rule.base), wrapRule(rule, frontmatter)]));
  const stale: string[] = [];
  for (const file of files) {
    const full = path.join(ctx.root, file);
    try {
      if (!(await stat(full)).isFile()) continue;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') continue;
      stale.push(file);
      continue;
    }
    const actual = await readText(full);
    if (actual === undefined || actual !== expected.get(file)) stale.push(file);
  }

  const folder = path.join(ctx.root, pattern.slice(0, pattern.lastIndexOf('/')));
  const basenamePattern = path.posix.basename(pattern);
  const placeholder = basenamePattern.indexOf('{rule}');
  const prefix = basenamePattern.slice(0, placeholder);
  const suffix = basenamePattern.slice(placeholder + '{rule}'.length);
  try {
    for (const name of (await readdir(folder)).sort()) {
      if (!name.startsWith(prefix) || (suffix.length > 0 && !name.endsWith(suffix))) continue;
      const base = name.slice(prefix.length, suffix.length === 0 ? undefined : -suffix.length);
      if (base.length > 0 && !rules.some((rule) => rule.base === base)) {
        stale.push(path.posix.join(pattern.slice(0, pattern.lastIndexOf('/')), name));
      }
    }
  } catch {
    // why: doctor-rules already reports a missing or unreadable per-rule folder.
  }

  return [...new Set(stale)].map((file) => ({
    level: 'error',
    code: 'doctor-rules-stale',
    message: `${row.name}: ${file} differs from a current rule or has no source rule`,
    fix: `ask your agent to run the harness-doctor skill to refresh ${file}`,
  }));
}

/** The inline rules block drift, naming every runtime that reads that block. */
function staleInlineFinding(readers: string, reason: string): DoctorFinding {
  return {
    level: 'error',
    code: 'doctor-rules-stale',
    message: `${readers}: ${reason}`,
    fix: `ask your agent to run the harness-doctor skill to refresh the inline rules block for ${readers}`,
  };
}

/** The native rules wiring a runtime fails to have under the open folder, or `undefined` when its row's data holds. */
async function nativeRulesProblem(
  row: RuntimeRegistryRow,
  ctx: DoctorContext,
  rules: Rule[],
  agents: string | undefined,
): Promise<string | undefined> {
  if (rules.length === 0) return 'no standing rules were found under .agents/rules/';

  const wiring = row.rules;
  const rulePath = (rule: Rule): string => `.agents/rules/${rule.base}.md`;

  switch (wiring.kind) {
    case 'link':
      return (await resolvesTo(path.join(ctx.root, wiring.path), path.join(ctx.harnessHome, '.agents', 'rules')))
        ? undefined
        : `${wiring.path} isn't connected to the harness's .agents/rules`;

    case 'per-rule': {
      const files = rules.map((rule) => wiring.pattern.replace('{rule}', rule.base));
      const missing = await missingFiles(files.map((file) => path.join(ctx.root, file)));
      const folder = wiring.pattern.slice(0, wiring.pattern.lastIndexOf('/'));
      return missing.length > 0 ? `${folder} is missing ${missing.join(', ')}` : undefined;
    }

    case 'file': {
      const text = await readText(path.join(ctx.root, wiring.path));
      if (text === undefined) return `${wiring.path} is missing`;
      if (wiring.path.endsWith('.json')) {
        try {
          JSON.parse(text);
        } catch {
          return `${wiring.path} is not valid JSON`;
        }
      }
      const missing = rules.filter((rule) => !text.includes(rulePath(rule))).map(rulePath);
      return missing.length > 0 ? `${wiring.path} does not list ${missing.join(', ')}` : undefined;
    }

    case 'imports': {
      const missing = rules
        .filter((rule) => !(agents ?? '').includes(`@${wiring.source.replace('*', rule.base)}`))
        .map(rulePath);
      return missing.length > 0 ? `AGENTS.md does not import ${missing.join(', ')}` : undefined;
    }

    case 'inline':
      return undefined;
  }
}

/** The relative paths in `files` that do not exist as regular files once symlinks are followed. */
async function missingFiles(files: string[]): Promise<string[]> {
  const missing: string[] = [];
  for (const file of files) {
    try {
      const entry = await stat(file);
      if (!entry.isFile()) missing.push(path.basename(file));
    } catch {
      missing.push(path.basename(file));
    }
  }
  return missing;
}

/** The skills a runtime fails to see under the open folder, or `undefined` when its skills path holds all of them. */
async function skillsProblem(row: RuntimeRegistryRow, ctx: DoctorContext): Promise<string | undefined> {
  const rowPath = path.join(ctx.root, row.skills.path);

  if (row.skills.kind === 'symlink' && !(await resolvesTo(rowPath, path.join(ctx.harnessHome, '.agents', 'skills')))) {
    return `${row.skills.path} isn't connected to the harness's .agents/skills`;
  }

  const installed = skillFolders(ctx.config.skillSets ?? []);
  const missing: string[] = [];
  for (const skill of installed) {
    if ((await readText(path.join(rowPath, skill, 'SKILL.md'))) === undefined) missing.push(skill);
  }
  return missing.length > 0 ? `${row.skills.path} is missing ${missing.join(', ')}` : undefined;
}

/** An error finding for `label` and `code`, or `undefined`; a read failure becomes that check's finding. */
async function check(
  code: DoctorCode,
  label: string,
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
  return { level: 'error', code, message: `${label}: ${reason}`, fix: `${fix} for ${label}` };
}

/**
 * Checks each wired runtime against the registry, resolving every path under
 * the open folder: its instruction chain reaches the harness section, its
 * skills path holds every skill the config's sets install, and its rules
 * wiring holds for the installed rules. In inline mode no runtime has native
 * wiring, so the block in the harness section is checked once and the finding
 * names every runtime that reads it. Installed rules are read from `harnessHome`.
 */
export async function runRuntimeChecks(ctx: DoctorContext): Promise<DoctorFinding[]> {
  let rules: Rule[] = [];
  let rulesReadFailed = false;
  try {
    rules = await readRules(ctx.harnessHome);
  } catch {
    rulesReadFailed = true;
  }
  const agents = await readText(path.join(ctx.root, 'AGENTS.md'));

  const findings: DoctorFinding[] = [];
  const ids = [...new Set<Runtime>(ctx.config.runtimes)];
  const rows = ids.map(runtimeRow);
  const inline = rulesMode(ids) === 'inline' && !isQuietInstall(ctx);

  // why: wiring.json is written by harness-init, so its absence means nothing is connected yet and per-path errors would mislead.
  if (isQuietInstall(ctx) && (await readText(path.join(ctx.harnessHome, 'wiring.json'))) === undefined)
    return rows.map((row) => ({
      level: 'warn',
      code: 'doctor-entry',
      message: `${row.name} isn't connected yet. Ask your agent to run the harness-init skill.`,
    }));

  const seen = new Set<string>();
  for (const row of rows) {
    if (isQuietInstall(ctx) && row.id === 'claude') {
      findings.push(...(await quietClaudeFindings(ctx, rules)));
      continue;
    }
    if (isQuietInstall(ctx)) {
      findings.push(...(await quietRuntimeFindings(row, ctx, rules, seen)));
      continue;
    }
    const entry = await check('doctor-entry', row.name, ENTRY_FIX, () => entryProblem(row, ctx, agents));
    if (entry !== undefined) findings.push(entry);

    if (!inline) {
      const rulesFinding = await check(
        'doctor-rules',
        row.name,
        rules.length === 0 ? RULES_INSTALL_FIX : RULES_FIX,
        async () =>
          rulesReadFailed ? 'the check could not read the standing rules' : nativeRulesProblem(row, ctx, rules, agents),
      );
      if (rulesFinding !== undefined) findings.push(rulesFinding);
      findings.push(...(await stalePerRuleFindings(row, ctx, rules)));
    }

    const skills = await check('doctor-skills', row.name, SKILLS_FIX, () => skillsProblem(row, ctx));
    if (skills !== undefined) findings.push(skills);
  }

  if (inline) {
    const readers = rows.map((row) => row.name).join(', ');
    const problem = rulesReadFailed ? 'the check could not read the standing rules' : inlineProblem(rules, agents);
    const finding =
      problem === undefined
        ? undefined
        : await check(
            'doctor-rules',
            readers,
            rules.length === 0 ? RULES_INSTALL_FIX : INLINE_FIX,
            async () => problem,
          );
    if (finding !== undefined) findings.push(finding);
    const staleProblem = rulesReadFailed ? undefined : inlineStaleProblem(rules, agents);
    if (staleProblem !== undefined) findings.push(staleInlineFinding(readers, staleProblem));
  }

  return findings;
}

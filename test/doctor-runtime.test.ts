import assert from 'node:assert/strict';
import { mkdir, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import type { DoctorContext } from '../src/doctor/index.js';
import type { DoctorFinding } from '../src/doctor/report.js';
import { runRuntimeChecks } from '../src/doctor/runtime-checks.js';
import { readConfig } from '../src/setup/config.js';
import { runtimeRow } from '../src/setup/runtimes.js';
import { CORE_SKILLS } from '../src/setup/skill-sets.js';
import type { Runtime } from '../src/setup/types.js';
import { makeRepo, run } from './helpers/fixture.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATES = path.join(ROOT, 'templates');

const MARKER = '<!-- wolven-harness:start -->';
const RULES_START = '<!-- wolven-harness:rules:start -->';
const RULES_END = '<!-- wolven-harness:rules:end -->';

const AGENTS_SECTION = `${MARKER}\n\n# Agents\n\n<!-- wolven-harness:end -->\n`;

const ALL_RUNTIMES: readonly Runtime[] = [
  'claude',
  'codex',
  'cursor',
  'opencode',
  'amp',
  'copilot',
  'gemini',
  'kiro',
  'antigravity',
];

/** The doctor context for a fixture, read the way `runDoctor` builds it. */
async function contextFor(dir: string, overrides: Partial<DoctorContext> = {}): Promise<DoctorContext> {
  const config = await readConfig(dir);
  assert.ok(config, 'fixture has a valid config');
  const harnessHome =
    config.layout === 'linked' && config.harnessHome !== undefined ? path.resolve(dir, config.harnessHome) : dir;
  return {
    root: dir,
    harnessHome,
    config,
    env: {},
    templatesDir: TEMPLATES,
    packageVersion: '0.0.0',
    ...overrides,
  };
}

/** The rule file names installed under `.agents/rules/`, without the `.md` suffix. */
async function ruleBases(dir: string): Promise<string[]> {
  const names = await readdir(path.join(dir, '.agents', 'rules'));
  return names
    .filter((name) => name.endsWith('.md'))
    .map((name) => name.slice(0, -'.md'.length))
    .sort();
}

/** The inline rules block `harness-init` writes for codex. */
async function inlineRules(dir: string): Promise<string> {
  const sections: string[] = [];
  for (const base of await ruleBases(dir)) {
    const raw = await readFile(path.join(dir, '.agents', 'rules', `${base}.md`), 'utf8');
    const body = raw.replace(/^---\n[\s\S]*?\n---\n?/, '').replace(/^\n/, '');
    let titleWritten = false;
    sections.push(
      body.replace(/^(#{1,6})([ \t]+.*)$/gm, (_heading, hashes: string, rest: string) => {
        if (!titleWritten && hashes === '#') {
          titleWritten = true;
          return `###${rest}`;
        }
        return `${'#'.repeat(Math.min(hashes.length + 1, 6))}${rest}`;
      }),
    );
  }
  return `${RULES_START}\n\n${sections.join('\n\n')}\n\n${RULES_END}\n`;
}

/**
 * A fixture where `setup` wired `runtime`, with the harness section in
 * AGENTS.md and the wiring the runtime's strategy needs that setup does not
 * write itself (amp's imports, codex's inline rules block).
 */
async function install(runtime: Runtime): Promise<string> {
  const dir = await makeRepo({}, { git: true });
  const result = await run(['setup', '--git-host', 'gh', '--runtimes', runtime], { cwd: dir });
  assert.equal(result.code, 0, result.stderr);

  let agents = AGENTS_SECTION;
  if (runtime === 'amp') {
    const imports = (await ruleBases(dir)).map((base) => `@.agents/rules/${base}.md`);
    agents = `${AGENTS_SECTION}\n${imports.join('\n')}\n`;
  } else if (runtime === 'codex' || runtime === 'antigravity') {
    agents = AGENTS_SECTION.replace(
      '<!-- wolven-harness:end -->',
      `${await inlineRules(dir)}\n<!-- wolven-harness:end -->`,
    );
  }

  await writeFile(path.join(dir, 'AGENTS.md'), agents, 'utf8');
  return dir;
}

/** The codes present in `findings`, once each. */
function codes(findings: readonly DoctorFinding[]): string[] {
  return findings.map((finding) => finding.code);
}

/** Asserts a finding exists for `code`, names `runtime`, and carries a fix when it is an error. */
function assertFinding(findings: readonly DoctorFinding[], code: DoctorFinding['code'], runtime: Runtime): void {
  const row = runtimeRow(runtime);
  const found = findings.find((finding) => finding.code === code);
  assert.ok(found, `${runtime}: expected ${code}, got ${JSON.stringify(findings)}`);
  assert.match(found.message, new RegExp(row.name), `${runtime}: message names the runtime`);
  if (found.level === 'error') assert.ok(found.fix.length > 0, `${runtime}: ${code} has a fix`);
}

test('doctor-runtime: every wired runtime with its full wiring has no findings', async () => {
  for (const runtime of ALL_RUNTIMES) {
    const dir = await install(runtime);

    const findings = await runRuntimeChecks(await contextFor(dir));

    assert.deepEqual(findings, [], `${runtime}: ${JSON.stringify(findings)}`);
  }
});

test('doctor-rules-stale: changed native copies name their runtime and file', async () => {
  const cases = [
    ['cursor', '.cursor/rules/wolven-qmd-first.mdc'],
    ['copilot', '.github/instructions/wolven-qmd-first.instructions.md'],
    ['kiro', '.kiro/steering/wolven-qmd-first.md'],
  ] as const;

  for (const [runtime, copy] of cases) {
    const dir = await install(runtime);
    const rulePath = path.join(dir, '.agents', 'rules', 'qmd-first.md');
    await writeFile(rulePath, `${await readFile(rulePath, 'utf8')}\nCurrent update.\n`, 'utf8');

    const result = await run(['doctor'], { cwd: dir });

    assert.equal(result.code, 1, runtime);
    assert.match(
      result.stdout,
      new RegExp(
        `error \\[doctor-rules-stale\\] .*${runtime === 'copilot' ? 'GitHub Copilot' : runtime === 'cursor' ? 'Cursor' : 'Kiro'}: ${copy.replaceAll('.', '\\.')} `,
      ),
    );
    assert.match(result.stdout, /fix: .*harness-doctor/);
  }
});

test('doctor-rules-stale: inline blocks match exact rendered rule bodies and name all readers', async () => {
  for (const runtime of ['codex', 'antigravity'] as const) {
    const dir = await install(runtime);
    const agentsPath = path.join(dir, 'AGENTS.md');
    const agents = await readFile(agentsPath, 'utf8');
    await writeFile(agentsPath, agents.replace('Search ADRs first, then widen', 'Search only later'), 'utf8');

    const result = await run(['doctor'], { cwd: dir });

    assert.equal(result.code, 1, runtime);
    assert.match(result.stdout, /error \[doctor-rules-stale\]/);
    assert.match(result.stdout, new RegExp(runtime === 'codex' ? 'Codex' : 'Antigravity'));
    assert.match(result.stdout, /fix: .*harness-doctor/);
  }

  const dir = await install('codex');
  const configPath = path.join(dir, '.wolven-harness.json');
  const config = JSON.parse(await readFile(configPath, 'utf8')) as { runtimes: Runtime[]; [key: string]: unknown };
  await writeFile(configPath, `${JSON.stringify({ ...config, runtimes: ['codex', 'antigravity'] })}\n`, 'utf8');
  const agentsPath = path.join(dir, 'AGENTS.md');
  const agents = await readFile(agentsPath, 'utf8');
  await writeFile(agentsPath, agents.replace('Search ADRs first, then widen', 'Search only later'), 'utf8');

  const findings = await runRuntimeChecks(await contextFor(dir));
  const stale = findings.find((finding) => finding.code === 'doctor-rules-stale');
  assert.ok(stale);
  assert.match(stale.message, /Codex/);
  assert.match(stale.message, /Antigravity/);
});

test('doctor-rules-stale: orphaned prefixed copies are reported', async () => {
  const dir = await install('cursor');
  await rm(path.join(dir, '.agents', 'rules', 'qmd-first.md'));

  const findings = await runRuntimeChecks(await contextFor(dir));

  const stale = findings.find((finding) => finding.code === 'doctor-rules-stale');
  assert.ok(stale, JSON.stringify(findings));
  assert.match(stale.message, /Cursor/);
  assert.match(stale.message, /\.cursor\/rules\/wolven-qmd-first\.mdc/);
});

test('doctor-entry: a broken instruction chain fires for each affected runtime', async () => {
  const breaks: readonly (readonly [Runtime, (dir: string) => Promise<void>])[] = [
    ['cursor', (dir) => rm(path.join(dir, 'AGENTS.md'))],
    ['opencode', (dir) => writeFile(path.join(dir, 'AGENTS.md'), '# Agents\n\nno harness section\n', 'utf8')],
    ['claude', (dir) => writeFile(path.join(dir, 'CLAUDE.md'), '# hand-written\n\nno import\n', 'utf8')],
    ['gemini', (dir) => writeFile(path.join(dir, 'GEMINI.md'), '# Gemini\n\nno import\n', 'utf8')],
  ];

  for (const [runtime, breakIt] of breaks) {
    const dir = await install(runtime);
    await breakIt(dir);

    const findings = await runRuntimeChecks(await contextFor(dir));

    assertFinding(findings, 'doctor-entry', runtime);
  }
});

test('doctor-entry: a missing or unreadable runtime entry is an error', async () => {
  for (const runtime of ['claude', 'gemini'] as const) {
    const dir = await install(runtime);
    const entryFile = runtimeRow(runtime).entryFile;
    assert.ok(entryFile);
    const entry = path.join(dir, entryFile.path);
    assert.deepEqual(await runRuntimeChecks(await contextFor(dir)), []);

    await rm(entry);
    const missing = await runRuntimeChecks(await contextFor(dir));
    assertFinding(missing, 'doctor-entry', runtime);
    assert.equal(missing.find((finding) => finding.code === 'doctor-entry')?.level, 'error');
    assert.ok(missing.find((finding) => finding.code === 'doctor-entry')?.message.includes(entryFile.path));

    await mkdir(entry);
    assertFinding(await runRuntimeChecks(await contextFor(dir)), 'doctor-entry', runtime);
  }
});

test('doctor-rules: a broken rules strategy fires for every registry row', async () => {
  const breaks = new Map<Runtime, (dir: string) => Promise<void>>([
    ['claude', (dir) => rm(path.join(dir, '.claude', 'rules'), { recursive: true })],
    ['codex', async (dir) => writeFile(path.join(dir, 'AGENTS.md'), AGENTS_SECTION, 'utf8')],
    ['cursor', (dir) => rm(path.join(dir, '.cursor', 'rules', 'wolven-qmd-first.mdc'))],
    ['opencode', (dir) => writeFile(path.join(dir, 'opencode.json'), '{"instructions":[]}\n', 'utf8')],
    ['amp', (dir) => writeFile(path.join(dir, 'AGENTS.md'), AGENTS_SECTION, 'utf8')],
    ['copilot', (dir) => rm(path.join(dir, '.github', 'instructions'), { recursive: true })],
    ['gemini', (dir) => writeFile(path.join(dir, 'GEMINI.md'), '@AGENTS.md\n', 'utf8')],
    ['kiro', (dir) => rm(path.join(dir, '.kiro', 'steering'), { recursive: true })],
    ['antigravity', (dir) => writeFile(path.join(dir, 'AGENTS.md'), AGENTS_SECTION, 'utf8')],
  ]);

  for (const runtime of ALL_RUNTIMES) {
    const dir = await install(runtime);
    const breakIt = breaks.get(runtime);
    assert.ok(breakIt, `${runtime} has a way to break its rules wiring`);
    await breakIt(dir);

    const findings = await runRuntimeChecks(await contextFor(dir));

    assertFinding(findings, 'doctor-rules', runtime);
  }
});

test('doctor-skills: a broken skills path fires for a symlinked and a direct runtime', async () => {
  const symlinked = await install('claude');
  await rm(path.join(symlinked, '.claude', 'skills'), { recursive: true });
  assertFinding(await runRuntimeChecks(await contextFor(symlinked)), 'doctor-skills', 'claude');

  const direct = await install('cursor');
  await rm(path.join(direct, '.agents', 'skills', 'qmd'), { recursive: true });
  const findings = await runRuntimeChecks(await contextFor(direct));
  assertFinding(findings, 'doctor-skills', 'cursor');
  assert.match(findings.find((finding) => finding.code === 'doctor-skills')?.message ?? '', /qmd/);
});

test('doctor-skills: a skill needs a readable SKILL.md through the runtime path', async () => {
  for (const runtime of ['claude', 'cursor'] as const) {
    const dir = await install(runtime);
    const entry = path.join(dir, runtimeRow(runtime).skills.path, 'harness-init', 'SKILL.md');
    const original = await readFile(entry, 'utf8');
    assert.deepEqual(await runRuntimeChecks(await contextFor(dir)), []);

    await rm(entry);
    const missing = await runRuntimeChecks(await contextFor(dir));
    assertFinding(missing, 'doctor-skills', runtime);
    assert.equal(missing.find((finding) => finding.code === 'doctor-skills')?.level, 'error');
    assert.match(missing.find((finding) => finding.code === 'doctor-skills')?.message ?? '', /harness-init/);

    await mkdir(entry);
    assertFinding(await runRuntimeChecks(await contextFor(dir)), 'doctor-skills', runtime);

    await rm(entry, { recursive: true });
    await writeFile(entry, original, 'utf8');
    assert.deepEqual(await runRuntimeChecks(await contextFor(dir)), []);
  }
});

test('doctor-rules: a missing rules folder is a finding, not a throw', async () => {
  const dir = await makeRepo({
    '.wolven-harness.json': `${JSON.stringify({ version: 1, gitHost: 'gh', runtimes: ['cursor'] })}\n`,
  });

  const findings = await runRuntimeChecks(await contextFor(dir));

  assertFinding(findings, 'doctor-entry', 'cursor');
  assertFinding(findings, 'doctor-rules', 'cursor');
  assertFinding(findings, 'doctor-skills', 'cursor');
  assert.equal(new Set(codes(findings)).size, codes(findings).length, 'one finding per code');
});

test('doctor-rules: an unreadable source rules folder is a finding, not a CLI failure', async () => {
  const dir = await install('cursor');
  const rulesPath = path.join(dir, '.agents', 'rules');
  await rm(rulesPath, { recursive: true });
  await writeFile(rulesPath, 'not a directory', 'utf8');

  const result = await run(['doctor'], { cwd: dir });

  assert.equal(result.code, 1);
  assert.match(result.stdout, /error \[doctor-rules\] Cursor: the check could not read the standing rules/);
  assert.doesNotMatch(result.stderr, /could not read|ENOENT|ENOTDIR/);
});

test('doctor-rules: one incomplete inline block names every runtime that reads it', async () => {
  const dir = await install('claude');
  const config = JSON.parse(await readFile(path.join(dir, '.wolven-harness.json'), 'utf8')) as {
    runtimes: Runtime[];
    [key: string]: unknown;
  };
  await writeFile(
    path.join(dir, '.wolven-harness.json'),
    `${JSON.stringify({ ...config, runtimes: ['claude', 'codex'] })}\n`,
  );

  const findings = await runRuntimeChecks(await contextFor(dir));
  const rulesFindings = findings.filter((finding) => finding.code === 'doctor-rules');

  assert.equal(rulesFindings.length, 1, JSON.stringify(findings));
  assert.match(rulesFindings[0].message, /Claude Code/);
  assert.match(rulesFindings[0].message, /Codex/);
});

test('doctor-entry: an entry path that cannot be read is a finding, not a throw', async () => {
  const dir = await makeRepo({
    '.wolven-harness.json': `${JSON.stringify({ version: 1, gitHost: 'gh', runtimes: ['claude'] })}\n`,
    'AGENTS.md': 'placeholder\n',
  });
  await rm(path.join(dir, 'AGENTS.md'));
  await mkdir(path.join(dir, 'AGENTS.md'));

  const findings = await runRuntimeChecks(await contextFor(dir));

  assertFinding(findings, 'doctor-entry', 'claude');
});

test('doctor-linked: wiring under the open folder follows links into harnessHome', async () => {
  const files: Record<string, string> = {
    '.wolven-harness.json': `${JSON.stringify(
      { version: 1, gitHost: 'gh', runtimes: ['claude'], layout: 'linked', harnessHome: 'harness' },
      null,
      2,
    )}\n`,
    'AGENTS.md': AGENTS_SECTION,
    'CLAUDE.md': '@AGENTS.md\n',
    'harness/.agents/rules/qmd-first.md':
      '---\ndescription: Search first.\ntrigger: always_on\n---\n\n# QMD before web\n',
  };
  for (const skill of CORE_SKILLS) {
    files[`harness/.agents/skills/${skill}/SKILL.md`] =
      `---\nname: ${skill}\ndescription: ${skill}\n---\n\n# ${skill}\n`;
  }

  const dir = await makeRepo(files);
  await mkdir(path.join(dir, '.claude'), { recursive: true });
  await symlink('../harness/.agents/rules', path.join(dir, '.claude', 'rules'), 'dir');
  await symlink('../harness/.agents/skills', path.join(dir, '.claude', 'skills'), 'dir');

  const ctx = await contextFor(dir);
  const findings = await runRuntimeChecks(ctx);

  assert.equal(ctx.harnessHome, path.join(dir, 'harness'));
  assert.deepEqual(findings, []);
});

test('doctor-linked: Cursor rules present only in harnessHome fail until linked from the open folder', async () => {
  const dir = await makeRepo({
    '.wolven-harness.json': `${JSON.stringify(
      { version: 1, gitHost: 'gh', runtimes: ['cursor'], layout: 'linked', harnessHome: 'harness' },
      null,
      2,
    )}\n`,
    'AGENTS.md': AGENTS_SECTION,
  });
  const sourceRules = await install('cursor');
  await mkdir(path.join(dir, 'harness'), { recursive: true });
  await symlink(path.join(sourceRules, '.agents'), path.join(dir, 'harness', '.agents'), 'dir');
  await symlink('harness/.agents', path.join(dir, '.agents'), 'dir');
  await symlink(path.join(sourceRules, '.cursor'), path.join(dir, 'harness', '.cursor'), 'dir');

  const rulesOnlyInHome = await runRuntimeChecks(await contextFor(dir));
  assertFinding(rulesOnlyInHome, 'doctor-rules', 'cursor');

  await mkdir(path.join(dir, '.cursor'), { recursive: true });
  await symlink('../harness/.cursor/rules', path.join(dir, '.cursor', 'rules'), 'dir');

  const linkedRules = await runRuntimeChecks(await contextFor(dir));
  assert.equal(
    linkedRules.some((finding) => finding.code === 'doctor-rules'),
    false,
    JSON.stringify(linkedRules),
  );
});

test('doctor-runtime: a linked layout that is missing the harness home reports findings', async () => {
  const dir = await makeRepo({
    '.wolven-harness.json': `${JSON.stringify(
      { version: 1, gitHost: 'gh', runtimes: ['claude'], layout: 'linked', harnessHome: 'gone' },
      null,
      2,
    )}\n`,
    'AGENTS.md': AGENTS_SECTION,
  });

  const findings = await runRuntimeChecks(await contextFor(dir));

  assertFinding(findings, 'doctor-rules', 'claude');
  assertFinding(findings, 'doctor-skills', 'claude');
});

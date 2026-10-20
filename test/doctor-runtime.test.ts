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

/** The rule's H1 text, read from the installed file. */
async function ruleTitle(dir: string, base: string): Promise<string> {
  const raw = await readFile(path.join(dir, '.agents', 'rules', `${base}.md`), 'utf8');
  const body = raw.replace(/^---\n[\s\S]*?\n---\n?/, '');
  const heading = /^#\s+(.+?)\s*$/m.exec(body);
  assert.ok(heading, `${base}.md has an H1`);
  return heading[1];
}

/** The inline rules block `harness-init` writes for codex. */
async function inlineRules(dir: string): Promise<string> {
  const sections: string[] = [];
  for (const base of await ruleBases(dir)) sections.push(`### ${await ruleTitle(dir, base)}`);
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
  } else if (runtime === 'codex') {
    agents = `${AGENTS_SECTION}\n${await inlineRules(dir)}`;
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
    [
      'antigravity',
      (dir) =>
        writeFile(
          path.join(dir, '.agents', 'rules', 'qmd-first.md'),
          '---\ndescription: no trigger\n---\n\n# QMD before web\n',
          'utf8',
        ),
    ],
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

test('doctor-linked: a linked layout is checked through harnessHome', async () => {
  const files: Record<string, string> = {
    '.wolven-harness.json': `${JSON.stringify(
      { version: 1, gitHost: 'gh', runtimes: ['claude'], layout: 'linked', harnessHome: 'harness' },
      null,
      2,
    )}\n`,
    'AGENTS.md': AGENTS_SECTION,
    'harness/.agents/rules/qmd-first.md':
      '---\ndescription: Search first.\ntrigger: always_on\n---\n\n# QMD before web\n',
  };
  for (const skill of CORE_SKILLS) {
    files[`harness/.agents/skills/${skill}/SKILL.md`] =
      `---\nname: ${skill}\ndescription: ${skill}\n---\n\n# ${skill}\n`;
  }

  const dir = await makeRepo(files);
  await mkdir(path.join(dir, 'harness', '.claude'), { recursive: true });
  await symlink('../.agents/rules', path.join(dir, 'harness', '.claude', 'rules'), 'dir');
  await symlink('../.agents/skills', path.join(dir, 'harness', '.claude', 'skills'), 'dir');

  const ctx = await contextFor(dir);
  const findings = await runRuntimeChecks(ctx);

  assert.equal(ctx.harnessHome, path.join(dir, 'harness'));
  assert.deepEqual(findings, []);
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

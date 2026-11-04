import assert from 'node:assert/strict';
import { mkdir, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import type { DoctorContext } from '../src/doctor/index.js';
import { type DoctorFinding, formatFinding } from '../src/doctor/report.js';
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
  const dir = await makeRepo({}, { git: true, layout: 'home' });
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
    'harness/AGENTS.md': AGENTS_SECTION,
    'harness/wiring.json': WIRED,
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
  await symlink('harness/AGENTS.md', path.join(dir, 'CLAUDE.local.md'));
  await mkdir(path.join(dir, '.claude/rules'), { recursive: true });
  await mkdir(path.join(dir, '.claude/skills'), { recursive: true });
  await symlink('../../harness/.agents/rules/qmd-first.md', path.join(dir, '.claude/rules/qmd-first.md'));
  for (const skill of CORE_SKILLS)
    await symlink(`../../harness/.agents/skills/${skill}`, path.join(dir, '.claude/skills', skill));

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
  await writeFile(path.join(dir, 'harness', 'wiring.json'), WIRED);
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
    'gone/wiring.json': WIRED,
  });

  const findings = await runRuntimeChecks(await contextFor(dir));

  assertFinding(findings, 'doctor-rules', 'claude');
  assertFinding(findings, 'doctor-skills', 'claude');
});

const WIRED = JSON.stringify({ entries: [] });

async function quietClaude(): Promise<string> {
  const dir = await makeRepo({
    '.wolven-harness.json': JSON.stringify({
      version: 1,
      gitHost: 'gh',
      runtimes: ['claude'],
      skillSets: ['ship'],
      layout: 'linked',
      harnessHome: '.wolven-harness',
    }),
    '.wolven-harness/AGENTS.md': '# Harness\n',
    '.wolven-harness/wiring.json': WIRED,
    '.wolven-harness/.agents/rules/example.md': '---\ndescription: Example\n---\n# Example\n',
    '.claude/skills/client/SKILL.md': '# Client\n',
  });
  await mkdir(path.join(dir, '.claude/rules'), { recursive: true });
  await symlink('.wolven-harness/AGENTS.md', path.join(dir, 'CLAUDE.local.md'));
  await symlink('../../.wolven-harness/.agents/rules/example.md', path.join(dir, '.claude/rules/example.md'));
  for (const skill of [...CORE_SKILLS, 'code-commit', 'code-pr', 'code-review', 'code-ci']) {
    await mkdir(path.join(dir, '.wolven-harness/.agents/skills', skill), { recursive: true });
    await writeFile(path.join(dir, '.wolven-harness/.agents/skills', skill, 'SKILL.md'), `# ${skill}\n`);
    await symlink(`../../.wolven-harness/.agents/skills/${skill}`, path.join(dir, '.claude/skills', skill));
  }
  return dir;
}

test('proof-quiet-install-doctor-claude: individual links coexist with client skills', async () => {
  const dir = await quietClaude();
  assert.deepEqual(await runRuntimeChecks(await contextFor(dir)), []);
  await rm(path.join(dir, '.claude/rules/example.md'));
  assertFinding(await runRuntimeChecks(await contextFor(dir)), 'doctor-rules', 'claude');
});

test('proof-quiet-install-doctor-record: kept paths warn, missing linked paths fail', async () => {
  for (const outcome of ['skipped', 'merged', 'prefixed', 'linked']) {
    const dir = await quietClaude();
    await rm(path.join(dir, '.claude/skills/code-commit'));
    await writeFile(
      path.join(dir, '.wolven-harness/wiring.json'),
      JSON.stringify({ entries: [{ path: '.claude/skills/code-commit', outcome }] }),
    );
    const findings = await runRuntimeChecks(await contextFor(dir));
    assert.equal(findings.length, 1, JSON.stringify(findings));
    assert.equal(findings[0].code, 'doctor-skills');
    assert.equal(findings[0].level, outcome === 'linked' ? 'error' : 'warn');
    assert.match(findings[0].message, /\.claude\/skills\/code-commit/);
    if (outcome !== 'linked') assert.ok(findings[0].message.includes(outcome));
  }
});

test('proof-quiet-install-doctor-runtimes: seven automatic rows pass and Codex names its manual step', async () => {
  for (const runtime of ALL_RUNTIMES.filter((id) => id !== 'claude')) {
    const row = runtimeRow(runtime);
    const wiring = row.quietInstall;
    assert.ok(wiring);
    const dir = await makeRepo({
      '.wolven-harness.json': JSON.stringify({
        version: 1,
        gitHost: 'gh',
        runtimes: [runtime],
        layout: 'linked',
        harnessHome: '.wolven-harness',
      }),
      '.wolven-harness/AGENTS.md': '# Harness\n',
      '.wolven-harness/wiring.json': WIRED,
      '.wolven-harness/.agents/rules/example.md': '---\ndescription: Example\n---\n# Example\n',
    });
    for (const skill of CORE_SKILLS) {
      await mkdir(path.join(dir, '.wolven-harness/.agents/skills', skill), { recursive: true });
      await writeFile(path.join(dir, '.wolven-harness/.agents/skills', skill, 'SKILL.md'), `# ${skill}\n`);
      await mkdir(path.join(dir, wiring.skillsPath), { recursive: true });
      await symlink(`../../.wolven-harness/.agents/skills/${skill}`, path.join(dir, wiring.skillsPath, skill));
    }
    const generated: Record<string, string> = {};
    if (runtime === 'cursor') {
      generated['.cursor/rules/wolven-example.mdc'] = '---\nalwaysApply: true\n---\n\n# Example\n';
      generated['.cursor/rules/wolven-agents.mdc'] = '---\nalwaysApply: true\n---\n\n# Harness\n';
    } else if (runtime === 'copilot') {
      generated['.github/instructions/wolven-example.instructions.md'] = '---\napplyTo: "**"\n---\n\n# Example\n';
    } else if (runtime === 'kiro') {
      generated['.kiro/steering/wolven-harness.md'] =
        '---\ninclusion: always\n---\n\n#[[file:.wolven-harness/AGENTS.md]]\n';
    } else if (runtime === 'antigravity') {
      generated['.agents/rules/wolven-harness.md'] =
        '---\ntrigger: always_on\n---\n\n@[harness](../../.wolven-harness/AGENTS.md)\n';
    } else if (runtime === 'opencode') {
      generated['opencode.json'] = JSON.stringify({
        instructions: ['.wolven-harness/AGENTS.md', '.wolven-harness/.agents/rules/*.md'],
      });
    } else if (runtime === 'amp') generated['AGENTS.md'] = '@.wolven-harness/AGENTS.md\n';
    else if (runtime === 'gemini') generated['GEMINI.md'] = '@.wolven-harness/AGENTS.md\n';
    for (const [file, text] of Object.entries(generated)) {
      await mkdir(path.dirname(path.join(dir, file)), { recursive: true });
      await writeFile(path.join(dir, file), text);
    }
    const findings = await runRuntimeChecks(await contextFor(dir));
    if (runtime === 'codex') {
      assert.equal(findings.length, 1);
      assert.equal(findings[0].code, 'doctor-entry');
      assert.equal(findings[0].level, 'warn');
    } else assert.deepEqual(findings, [], runtime);
    if (row.rules.kind === 'per-rule') {
      const orphan = row.rules.pattern.replace('{rule}', 'removed-source');
      const unrelated = path.posix.join(path.posix.dirname(orphan), 'client-notes.md');
      await writeFile(path.join(dir, unrelated), '# Client steering\n');
      assert.deepEqual(await runRuntimeChecks(await contextFor(dir)), [], runtime);
      await writeFile(path.join(dir, orphan), '# Removed source\n');
      const orphanFindings = await runRuntimeChecks(await contextFor(dir));
      assert.equal(orphanFindings.length, 1, runtime);
      assert.equal(orphanFindings[0].code, 'doctor-rules-stale');
      assert.equal(orphanFindings[0].level, 'error');
      assert.ok(orphanFindings[0].message.includes(orphan));
      await writeFile(
        path.join(dir, '.wolven-harness/wiring.json'),
        JSON.stringify({ entries: [{ path: orphan, outcome: 'prefixed' }] }),
      );
      const keptOrphan = await runRuntimeChecks(await contextFor(dir));
      assert.equal(keptOrphan.length, 1, runtime);
      assert.equal(keptOrphan[0].level, 'warn');
      assert.match(keptOrphan[0].message, /prefixed/);
      await rm(path.join(dir, orphan));
      await writeFile(path.join(dir, '.wolven-harness/wiring.json'), WIRED);
    }
    if (['cursor', 'copilot', 'kiro', 'antigravity'].includes(runtime)) {
      const file = Object.keys(generated)[0];
      await writeFile(path.join(dir, file), `${generated[file]}edited\n`);
      assertFinding(await runRuntimeChecks(await contextFor(dir)), 'doctor-rules-stale', runtime);
      await rm(path.join(dir, file));
      const missing = await runRuntimeChecks(await contextFor(dir));
      assert.ok(
        missing.some((finding) => finding.level === 'error' && ['doctor-entry', 'doctor-rules'].includes(finding.code)),
        runtime,
      );
      await writeFile(
        path.join(dir, '.wolven-harness/wiring.json'),
        JSON.stringify({ entries: [{ path: file, outcome: 'skipped' }] }),
      );
      const kept = await runRuntimeChecks(await contextFor(dir));
      assert.equal(
        kept.some((finding) => finding.level === 'error'),
        false,
        runtime,
      );
      assert.ok(
        kept.some((finding) => finding.level === 'warn' && finding.message.includes(file)),
        runtime,
      );
    }
  }
});

test('proof-iter1-codex-warning: Codex warns until the harness block is in the root AGENTS.md', async () => {
  const dir = await makeRepo({
    '.wolven-harness.json': JSON.stringify({
      version: 1,
      gitHost: 'gh',
      runtimes: ['codex'],
      layout: 'linked',
      harnessHome: '.wolven-harness',
    }),
    '.wolven-harness/AGENTS.md': '# Harness\n',
    '.wolven-harness/wiring.json': WIRED,
  });
  const entry = (findings: readonly DoctorFinding[]) => findings.filter((finding) => finding.code === 'doctor-entry');

  const before = entry(await runRuntimeChecks(await contextFor(dir)));
  assert.equal(before.length, 1);
  assert.equal(before[0].level, 'warn');
  assert.match(
    before[0].message,
    /won't load the harness on its own\. Next: ask your agent to run the harness-init skill/,
  );

  await writeFile(path.join(dir, 'AGENTS.md'), AGENTS_SECTION);
  assert.deepEqual(entry(await runRuntimeChecks(await contextFor(dir))), []);
});

test('proof-iter1-fresh-tree: no wiring.json yields one finding per runtime', async () => {
  const dir = await makeRepo({
    '.wolven-harness.json': JSON.stringify({
      version: 1,
      gitHost: 'gh',
      runtimes: ['claude', 'codex', 'cursor', 'amp'],
      layout: 'linked',
      harnessHome: '.wolven-harness',
    }),
    '.wolven-harness/AGENTS.md': '# Harness\n',
  });
  const findings = await runRuntimeChecks(await contextFor(dir));
  assert.equal(findings.length, 4, JSON.stringify(findings));
  assert.match(findings[2].message, /^Cursor isn't connected yet\. Ask your agent to run the harness-init skill\.$/);
});

test('proof-iter1-fresh-tree: once wired, a shared missing skill path reports once with a skill fix', async () => {
  const dir = await makeRepo({
    '.wolven-harness.json': JSON.stringify({
      version: 1,
      gitHost: 'gh',
      runtimes: ['amp', 'opencode'],
      layout: 'linked',
      harnessHome: '.wolven-harness',
    }),
    '.wolven-harness/AGENTS.md': '# Harness\n',
    '.wolven-harness/wiring.json': WIRED,
  });
  const findings = await runRuntimeChecks(await contextFor(dir));
  const skill = `${runtimeRow('amp').quietInstall?.skillsPath}/${CORE_SKILLS[0]}`;
  const reports = findings.filter((finding) => finding.code === 'doctor-skills' && finding.message.includes(skill));
  assert.equal(reports.length, 1, JSON.stringify(findings));
  assert.match(reports[0].level === 'error' ? reports[0].fix : '', /wolven-harness setup/);
});

test('proof-iter1-doctor-voice: rendered findings drop the old phrases and keep a next step', async () => {
  const banned = /Nothing changed\.|harness home|does not resolve|run "harness-(init|doctor)"|run the "harness-init"/;
  const lines: string[] = [];
  const render = (findings: readonly DoctorFinding[]) => {
    for (const finding of findings) {
      lines.push(...formatFinding(finding));
      if (finding.level === 'error') assert.ok(finding.fix.length > 0, finding.message);
      else if (/isn't connected yet|won't load/.test(finding.message)) assert.match(finding.message, /ask your agent/i);
    }
  };
  const fresh = await makeRepo({
    '.wolven-harness.json': JSON.stringify({
      version: 1,
      gitHost: 'gh',
      runtimes: ALL_RUNTIMES,
      layout: 'linked',
      harnessHome: '.wolven-harness',
    }),
    '.wolven-harness/AGENTS.md': '# Harness\n',
  });
  render(await runRuntimeChecks(await contextFor(fresh)));
  const wired = await quietClaude();
  await rm(path.join(wired, '.claude/rules/example.md'));
  await rm(path.join(wired, '.claude/skills/code-commit'));
  render(await runRuntimeChecks(await contextFor(wired)));
  const mixed = await makeRepo({
    '.wolven-harness.json': JSON.stringify({
      version: 1,
      gitHost: 'gh',
      runtimes: ['codex', 'cursor'],
      layout: 'linked',
      harnessHome: '.wolven-harness',
    }),
    '.wolven-harness/wiring.json': WIRED,
  });
  render(await runRuntimeChecks(await contextFor(mixed)));
  assert.ok(lines.length > 0);
  for (const line of lines) assert.doesNotMatch(line, banned);
});

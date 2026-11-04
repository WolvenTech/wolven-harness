import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { appendFile, lstat, mkdir, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { runDriftChecks } from '../src/doctor/drift.js';
import { execGit } from '../src/git.js';
import { readConfig } from '../src/setup/config.js';
import { HARNESS_SCORE_VERSION } from '../src/setup/harness-score.js';
import { runSetup } from '../src/setup/index.js';
import { RUNTIME_REGISTRY, setSymlinkImpl, wireQuietBootstrap } from '../src/setup/runtimes.js';
import { quietNextSteps } from '../src/setup/summary.js';
import { makeRepo, run } from './helpers/fixture.js';
import { makeIo } from './helpers/io.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const flags = ['--git-host', 'gh', '--runtimes', 'claude', '--skills', 'none'];

test('proof-quiet-install-setup-default: ignore first, mapped scaffold next, root config last', async () => {
  const packageText = '{"name":"client","scripts":{"test":"client-test"}}\n';
  const root = await makeRepo({ 'package.json': packageText, 'AGENTS.md': 'Client instructions.\n' }, { git: true });
  const writes: string[] = [];
  let result: number;
  setSymlinkImpl(async (target, file, type) => {
    assert.equal(writes.at(-1), '.wolven-harness.json', 'bootstrap follows the config write');
    await symlink(target, file, type);
  });
  try {
    result = await runSetup(flags, makeIo(root), async (file, content) => {
      writes.push(path.relative(root, file));
      await writeFile(file, content, 'utf8');
    });
  } finally {
    setSymlinkImpl();
  }
  assert.equal(result, 0);
  assert.equal(writes[0], '.wolven-harness/.gitignore');
  assert.equal(writes.at(-1), '.wolven-harness.json');
  assert.ok(writes.length > 10);
  assert.ok(writes.slice(0, -1).every((file) => file.startsWith('.wolven-harness/')));
  const config = await readConfig(root);
  assert.equal(config?.layout, 'linked');
  assert.equal(config.harnessHome, '.wolven-harness');
  const skill = await readFile(path.join(root, '.wolven-harness/.agents/skills/adr/SKILL.md'), 'utf8');
  assert.ok(skill.includes('.wolven-harness/docs/adrs/'));
  assert.equal(await readFile(path.join(root, 'package.json'), 'utf8'), packageText);
  assert.equal(await readFile(path.join(root, 'AGENTS.md'), 'utf8'), 'Client instructions.\n');
  const bootstrap = path.join(root, '.claude/skills/harness-init');
  assert.equal((await lstat(bootstrap)).isSymbolicLink(), true);
  assert.equal(
    await realpath(bootstrap),
    await realpath(path.join(root, '.wolven-harness/.agents/skills/harness-init')),
  );
  assert.equal((await lstat(path.join(root, '.claude/skills'))).isDirectory(), true);
  assert.equal(existsSync(path.join(root, '.claude/rules')), false);
  assert.equal(existsSync(path.join(root, '.claude/settings.json')), false);
});

test('proof-quiet-install-nested-gitignore: skills ignored, instructions, rules, hooks and ADRs included', async () => {
  const root = await makeRepo({}, { git: true });
  assert.equal((await run(['setup', ...flags], { cwd: root })).code, 0);
  assert.equal(
    await readFile(path.join(root, '.wolven-harness/.gitignore'), 'utf8'),
    await readFile(path.join(repoRoot, 'templates/.wolven-harness/gitignore'), 'utf8'),
  );
  const ignored = await execGit(root, ['check-ignore', '.wolven-harness/.agents/skills/adr/SKILL.md']);
  assert.equal(ignored.stdout.trim(), '.wolven-harness/.agents/skills/adr/SKILL.md');
  for (const file of [
    'AGENTS.md',
    '.gitignore',
    '.agents/rules/qmd-first.md',
    '.agents/hooks/secret-path-guard.mjs',
    'docs/adrs/adr-000-record-architecture-decisions.md',
  ]) {
    await assert.rejects(execGit(root, ['check-ignore', `.wolven-harness/${file}`]));
  }
  const status = await execGit(root, ['status', '--porcelain', '--untracked-files=all']);
  const paths = status.stdout
    .trim()
    .split('\n')
    .map((line) => line.slice(3));
  assert.ok(paths.includes('.wolven-harness/AGENTS.md'));
  assert.ok(paths.includes('.wolven-harness.json'));
  assert.ok(
    paths.every(
      (file) =>
        file === '.wolven-harness.json' ||
        file === '.claude/skills/harness-init' ||
        /^\.wolven-harness\/(?:\.gitignore|AGENTS\.md|\.agents\/(?:rules|hooks)\/|docs\/adrs\/)/.test(file),
    ),
  );
});

test('proof-quiet-install-render: instructions are durable, prefixed, and create-only', async () => {
  const root = await makeRepo({}, { git: true });
  assert.equal((await run(['setup', ...flags], { cwd: root })).code, 0);
  const file = path.join(root, '.wolven-harness/AGENTS.md');
  const text = await readFile(file, 'utf8');
  assert.ok(text.startsWith('<!-- wolven-harness:start -->\n\n# Wolven harness — entry router\n'));
  assert.ok(text.includes('| `.wolven-harness/.agents/skills/` | Agent skills,'));
  assert.ok(text.includes('| `.wolven-harness/docs/adrs/` | Architecture decision records (profile ADRs),'));
  assert.doesNotMatch(text, /(^|[\s`'"(])(?:docs\/|\.agents\/)/m);
  assert.doesNotMatch(text, /WOLVEN\.md|step 0|transient/);
  assert.ok(text.includes('`.wolven-harness/.harness-score.json`'));
  assert.ok(!text.includes('`.harness-score.json`'));
  assert.equal(existsSync(path.join(root, 'WOLVEN.md')), false);
  assert.equal(existsSync(path.join(root, '.wolven-harness/WOLVEN.md')), false);
  await writeFile(file, 'Edited harness instructions.\n');
  assert.equal((await run(['setup', ...flags], { cwd: root })).code, 0);
  assert.equal(await readFile(file, 'utf8'), 'Edited harness instructions.\n');
});

test('proof-quiet-install-setup-unchanged: recorded home and absent layout retain the full scaffold', async () => {
  for (const layout of ['home', undefined]) {
    const root = await makeRepo(
      {
        '.wolven-harness.json': JSON.stringify({ version: 1, gitHost: 'gh', runtimes: ['claude'], layout }),
      },
      { git: true },
    );
    assert.equal((await run(['setup', ...flags], { cwd: root })).code, 0);
    assert.equal(existsSync(path.join(root, 'WOLVEN.md')), true);
    assert.equal(existsSync(path.join(root, '.agents/skills/adr/SKILL.md')), true);
    assert.equal(existsSync(path.join(root, 'AGENTS.md')), false);
    assert.equal(existsSync(path.join(root, '.wolven-harness')), false);
  }
});

test('quiet bootstrap links follow each runtime skills folder without ignore edits', async () => {
  for (const row of RUNTIME_REGISTRY) {
    const root = await makeRepo({}, { git: true });
    const result = await run(['setup', '--git-host', 'gh', '--runtimes', row.id, '--skills', 'none'], { cwd: root });
    assert.equal(result.code, 0, result.stderr);
    const rel = `${row.quietInstall?.skillsPath}/harness-init`;
    assert.equal((await lstat(path.join(root, rel))).isSymbolicLink(), true);
    assert.equal(
      await realpath(path.join(root, rel, 'SKILL.md')),
      await realpath(path.join(root, '.wolven-harness/.agents/skills/harness-init/SKILL.md')),
    );
    await assert.rejects(execGit(root, ['check-ignore', rel]));
    assert.equal(existsSync(path.join(root, '.gitignore')), false);
  }
});

test('quiet bootstrap keeps occupied paths and symlink parents, reporting manual runtimes', async () => {
  for (const occupied of ['file', 'link', 'parent', 'directory']) {
    const root = await makeRepo({}, { git: true });
    const external = await makeRepo({ 'client.txt': 'Client bytes.\n' });
    const skills = path.join(root, '.claude/skills');
    await mkdir(path.dirname(skills), { recursive: true });
    if (occupied === 'parent') {
      await symlink(external, skills, 'dir');
    } else {
      await mkdir(skills);
      const target = path.join(skills, 'harness-init');
      if (occupied === 'file') await writeFile(target, 'Client bytes.\n');
      else if (occupied === 'link') await symlink('missing-client-target', target);
      else await mkdir(target);
    }
    assert.equal((await run(['setup', ...flags], { cwd: root })).code, 0);
    const result = await wireQuietBootstrap(
      { gitHost: 'gh', runtimes: ['claude'], skillSets: [], keptSets: [], mode: 'root' },
      { root, templatesDir: path.join(repoRoot, 'templates'), io: makeIo(root) },
      path.join(root, '.wolven-harness'),
    );
    assert.deepEqual(result.created, []);
    assert.deepEqual(result.skipped, ['.claude/skills/harness-init']);
    assert.deepEqual(result.manualRuntimes, ['claude']);
    assert.equal(result.skillPath, '.wolven-harness/.agents/skills/harness-init/SKILL.md');
    if (occupied === 'file') assert.equal(await readFile(path.join(skills, 'harness-init'), 'utf8'), 'Client bytes.\n');
    if (occupied === 'parent') assert.equal(existsSync(path.join(external, 'harness-init')), false);
  }
});

test('proof-quiet-install-setup-rerun: restores mapped files and bootstrap links, preserving edits', async () => {
  const root = await makeRepo({}, { git: true });
  assert.equal((await run(['setup', ...flags], { cwd: root })).code, 0);
  const home = path.join(root, '.wolven-harness');
  const ignored = path.join(home, '.gitignore');
  const edited = path.join(home, '.agents/skills/harness-init/SKILL.md');
  const missing = path.join(home, '.agents/skills/adr/SKILL.md');
  await appendFile(ignored, '\n# Local choice.\n');
  await appendFile(edited, '\nLocal instruction.\n');
  const ignoredText = await readFile(ignored, 'utf8');
  const editedText = await readFile(edited, 'utf8');
  await rm(missing);
  await rm(path.join(root, '.claude/skills/harness-init'));
  assert.equal((await run(['setup'], { cwd: root })).code, 0);
  assert.equal(await readFile(ignored, 'utf8'), ignoredText);
  assert.equal(await readFile(edited, 'utf8'), editedText);
  assert.ok((await readFile(missing, 'utf8')).includes('.wolven-harness/docs/adrs/'));
  assert.equal((await lstat(path.join(root, '.claude/skills/harness-init'))).isSymbolicLink(), true);
});

test('proof-quiet-install-setup-rerun: fresh clone restores mapped skills with no drift', async () => {
  const original = await makeRepo({}, { git: true });
  assert.equal((await run(['setup', ...flags], { cwd: original })).code, 0);
  await execGit(original, ['add', '.wolven-harness.json', '.wolven-harness']);
  await execGit(original, ['commit', '-qm', 'fixture quiet install']);
  const root = await makeRepo({});
  await execGit(root, ['clone', '--quiet', original, '.']);
  assert.equal(existsSync(path.join(root, '.wolven-harness/.agents/skills/adr/SKILL.md')), false);
  assert.equal((await run(['setup'], { cwd: root })).code, 0);
  const config = await readConfig(root);
  assert.ok(config);
  const own = JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8')) as { version: string };
  const findings = await runDriftChecks({
    root,
    harnessHome: path.join(root, '.wolven-harness'),
    config,
    env: {},
    templatesDir: path.join(repoRoot, 'templates'),
    packageVersion: own.version,
  });
  assert.deepEqual(findings, []);
  assert.ok(
    (await readFile(path.join(root, '.wolven-harness/.agents/skills/adr/SKILL.md'), 'utf8')).includes(
      '.wolven-harness/docs/adrs/',
    ),
  );
  assert.equal((await lstat(path.join(root, '.claude/skills/harness-init'))).isSymbolicLink(), true);
});

test('proof-quiet-install-setup-wording / proof-quiet-install-setup-scope: plain stdout snapshot', async () => {
  const packageText = '{"name":"client","scripts":{"test":"run-client-tests"}}\n';
  const root = await makeRepo({ 'package.json': packageText }, { git: true });
  const result = await run(['setup', ...flags], { cwd: root });
  assert.equal(result.code, 0, result.stderr);
  const own = JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8')) as {
    name: string;
    version: string;
  };
  assert.equal(
    result.stdout,
    [
      `${own.name} ${own.version}`,
      '',
      '✔ Quiet install',
      '✔ The harness lives in .wolven-harness/, and git sees only what you pick.',
      '✔ Harness files for Claude Code in .wolven-harness/',
      '✔ harness-init symlink: .claude/skills/harness-init',
      '',
      'Next steps:',
      '  1. Open your coding agent and ask it to run the harness-init skill to connect the harness.',
      "  2. git status shows .claude/skills/harness-init as untracked until you do; that's expected.",
      '  3. To drop the harness instead, remove .wolven-harness/, .wolven-harness.json and those links.',
      '  4. Run wolven-harness validate any time to check the harness.',
      `  5. Run npx harness-score@${HARNESS_SCORE_VERSION} --config .wolven-harness/.harness-score.json to see how mature the harness is.`,
      '',
    ].join('\n'),
  );
  assert.doesNotMatch(result.stdout, /\b(?:linked|home)\b/);
  assert.equal(await readFile(path.join(root, 'package.json'), 'utf8'), packageText);
});

test('quiet setup prints the manual skill path when the bootstrap is occupied', async () => {
  const root = await makeRepo({ '.claude/skills/harness-init': 'Client skill.\n' }, { git: true });
  const result = await run(['setup', ...flags], { cwd: root });
  assert.equal(result.code, 0, result.stderr);
  assert.ok(
    result.stdout.includes(
      'For Claude Code: ask your agent to read .wolven-harness/.agents/skills/harness-init/SKILL.md and follow it.',
    ),
  );
  assert.ok(result.stdout.includes('kept your existing .claude/skills/harness-init, left untouched'));
  assert.equal(await readFile(path.join(root, '.claude/skills/harness-init'), 'utf8'), 'Client skill.\n');
});

test('quiet next steps provide manual entry for a runtime without a skills folder', () => {
  const steps = quietNextSteps({
    created: [],
    skipped: [],
    manualRuntimes: ['codex'],
    skillPath: '.wolven-harness/.agents/skills/harness-init/SKILL.md',
  });
  assert.ok(
    steps.includes(
      'For Codex: ask your agent to read .wolven-harness/.agents/skills/harness-init/SKILL.md and follow it.',
    ),
  );
  assert.ok(steps.includes('To drop the harness instead, remove .wolven-harness/, .wolven-harness.json.'));
});

import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { buildRepoContext } from '../src/validate/repo.js';
import { makeRepo, run } from './helpers/fixture.js';

const config = (extra = {}) =>
  JSON.stringify({
    version: 1,
    gitHost: 'gh',
    runtimes: ['claude'],
    layout: 'linked',
    harnessHome: '.wolven-harness',
    ...extra,
  });
const adr = '---\ntype: adr\ntitle: A decision\ndescription: A decision\nstatus: stable\n---\n';

async function quietRepo(files: Record<string, string>, extra = {}): Promise<string> {
  return makeRepo({ '.wolven-harness.json': config(extra), ...files }, { git: true });
}

test('proof-quiet-install-validate-root: all working directories report home-prefixed paths', async () => {
  const dir = await quietRepo({
    '.wolven-harness/docs/adrs/bad.md': adr,
    '.wolven-harness/AGENTS.md': '# Harness\n',
    'src/nested/app.ts': '',
  });
  const top = await run(['validate'], { cwd: dir });
  for (const cwd of [path.join(dir, 'src/nested'), path.join(dir, '.wolven-harness/docs/adrs')]) {
    assert.deepEqual(await run(['validate'], { cwd }), top);
  }
  assert.equal(top.code, 1);
  assert.match(top.stdout, /profile-adr-name.*\.wolven-harness\/docs\/adrs\/bad\.md/);
});

test('proof-quiet-install-validate-scan: ignored skills and docs are scanned, client files are excluded', async () => {
  const dir = await quietRepo({
    '.wolven-harness/.gitignore': '*\n!.gitignore\n',
    '.wolven-harness/.agents/skills/broken/SKILL.md': 'See ADR-099.\n',
    '.wolven-harness/docs/adrs/bad.md': adr,
    'src/app.ts': 'ADR-098\n',
  });
  const ctx = await buildRepoContext(dir, { ignoreEntries: [], homePrefix: '.wolven-harness' });
  assert.deepEqual(ctx.files, ['.agents/skills/broken/SKILL.md', '.gitignore', 'docs/adrs/bad.md']);
  const result = await run(['validate'], { cwd: dir });
  assert.equal(result.code, 1);
  assert.match(result.stdout, /skill-frontmatter.*\.wolven-harness\/\.agents\/skills\/broken\/SKILL.md/);
  assert.match(result.stdout, /claim-missing.*\.wolven-harness\/\.agents\/skills\/broken\/SKILL.md/);
  assert.match(result.stdout, /profile-adr-name.*\.wolven-harness\/docs\/adrs\/bad.md/);
  assert.doesNotMatch(result.stdout, /ADR-098/);
});

test('proof-quiet-install-client-claims and client-docs: only home claims and profile docs count', async () => {
  const dir = await quietRepo({
    '.wolven-harness/docs/adrs/adr-001-choice.md': adr,
    '.wolven-harness/AGENTS.md': 'See ADR-001.\n',
    'src/app.ts': 'ADR-001 ADR-099\n',
    'docs/adrs/notes.md': '# Client notes\n',
  });
  const result = await run(['validate'], { cwd: dir });
  assert.equal(result.code, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /claims: 1 ok, 0 legacy-warn, 0 fail/);
  assert.doesNotMatch(result.stdout, /src\/app|docs\/adrs\/notes/);
});

test('proof-quiet-install-ignore-entries: exclusions are home-relative', async () => {
  const dir = await quietRepo(
    {
      '.wolven-harness/vendor/broken.md': 'ADR-099\n',
      '.wolven-harness/AGENTS.md': '# Harness\n',
      'vendor/client.md': 'ADR-098\n',
    },
    { ignore: ['vendor/**'] },
  );
  const result = await run(['validate'], { cwd: dir });
  assert.equal(result.code, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /ignored: \.wolven-harness\/vendor\/\*\* \(1 files\)/);
  assert.match(result.stdout, /claims: 0 ok, 0 legacy-warn, 0 fail/);
});

for (const layout of ['absent', 'home', 'external'] as const) {
  test(`proof-quiet-install-validate-unchanged: ${layout} keeps root validation`, async () => {
    const files: Record<string, string> = { 'docs/adrs/bad.md': adr };
    if (layout !== 'absent') {
      files['.wolven-harness.json'] = config(
        layout === 'home' ? { layout: 'home', harnessHome: undefined } : { harnessHome: '../external-harness' },
      );
    }
    const dir = await makeRepo(files, { git: true });
    const result = await run(['validate'], { cwd: dir });
    assert.equal(result.code, 1);
    assert.match(result.stdout, /profile-adr-name.*docs\/adrs\/bad.md/);
    assert.doesNotMatch(result.stdout, /\.wolven-harness\/docs/);
  });
}

const nestedIgnore = [
  '*',
  '!.gitignore',
  '!AGENTS.md',
  '!.agents/',
  '!.agents/rules/',
  '!.agents/rules/**',
  '!.agents/hooks/',
  '!.agents/hooks/**',
  '!docs/',
  '!docs/adrs/',
  '!docs/adrs/**',
  '',
].join('\n');
const versionedHomeFiles = {
  '.wolven-harness/.gitignore': nestedIgnore,
  '.wolven-harness/AGENTS.md': '# Harness\n',
  '.wolven-harness/.agents/rules/one.md': '# Rule\n',
  '.wolven-harness/.agents/hooks/one.mjs': '',
  '.wolven-harness/docs/adrs/adr-001-choice.md': adr,
  '.wolven-harness/docs/notes/local/local-note.md':
    '---\ntype: note\ntitle: Local\ndescription: Local\nstatus: draft\n---\n',
};

for (const rootIgnore of ['docs/\n', '*.md\n', 'CLAUDE.local.md\n']) {
  test(`proof-quiet-install-ignored-scope: nested re-includes override ${rootIgnore.trim()}`, async () => {
    const dir = await quietRepo({
      ...versionedHomeFiles,
      '.gitignore': rootIgnore,
      'CLAUDE.local.md': '# Local entry\n',
    });
    const result = await run(['validate'], { cwd: dir });
    assert.equal(result.code, 0, result.stdout + result.stderr);
    assert.doesNotMatch(result.stdout, /harness-ignored/);
  });
}

test('proof-quiet-install-ignored-scope: a root rule hiding the home reports every versioned path only', async () => {
  const dir = await quietRepo({ ...versionedHomeFiles, '.gitignore': '.wolven-harness/\n' });
  const result = await run(['validate'], { cwd: dir });
  assert.equal(result.code, 1);
  const findings = result.stdout.split('\n').filter((line) => line.includes('[harness-ignored]'));
  assert.equal(findings.length, 5, result.stdout);
  for (const rel of ['.gitignore', 'AGENTS.md', '.agents/rules', '.agents/hooks', 'docs/adrs']) {
    assert.ok(
      findings.some((line) => line.includes(`.wolven-harness/${rel}:`)),
      result.stdout,
    );
  }
  for (const finding of findings) {
    assert.match(finding, /excluded by ignore rule "\.wolven-harness\/" \(\.gitignore:1\)/);
  }
  assert.doesNotMatch(findings.join('\n'), /skills|docs\/notes|CLAUDE/);
});

test('proof-quiet-install-ignored-scope: a selected notes folder joins the versioned scope', async () => {
  const dir = await quietRepo({
    ...versionedHomeFiles,
    '.wolven-harness/.gitignore': `${nestedIgnore}!docs/notes/\n!docs/notes/**\n`,
    '.gitignore': '.wolven-harness/\n',
  });
  const result = await run(['validate'], { cwd: dir });
  assert.equal(result.code, 1);
  assert.match(result.stdout, /harness-ignored.*\.wolven-harness\/docs\/notes:/);
});

test('proof-quiet-install-misplaced: one tracked profile document warns with its destination', async () => {
  const dir = await quietRepo({
    ...versionedHomeFiles,
    'docs/adrs/stray-decision.md': adr,
    'README.md': '---\ntype: guide\n---\n',
  });
  const result = await run(['validate'], { cwd: dir });
  assert.equal(result.code, 0, result.stdout + result.stderr);
  const warnings = result.stdout.split('\n').filter((line) => line.includes('[harness-misplaced]'));
  assert.equal(warnings.length, 1, result.stdout);
  assert.match(warnings[0], /warn \[harness-misplaced\] docs\/adrs\/stray-decision.md:/);
  assert.match(warnings[0], /\.wolven-harness\/docs\/adrs\/.*Move it there/);
  assert.doesNotMatch(result.stdout, /profile-frontmatter|README.md/);
});

test('proof-quiet-install-misplaced: all profile types warn when untracked, ignored documents do not', async () => {
  const dir = await quietRepo({ ...versionedHomeFiles, '.gitignore': 'ignored/\n' });
  for (const type of ['adr', 'prd', 'spec', 'note', 'deferral', 'map']) {
    await writeFile(path.join(dir, `${type}.md`), `---\ntype: ${type}\n---\n`);
  }
  await mkdir(path.join(dir, 'ignored'));
  await writeFile(path.join(dir, 'ignored/decision.md'), adr);
  const result = await run(['validate'], { cwd: dir });
  assert.equal(result.code, 0, result.stdout + result.stderr);
  const warnings = result.stdout.split('\n').filter((line) => line.includes('[harness-misplaced]'));
  assert.equal(warnings.length, 6, result.stdout);
  assert.doesNotMatch(result.stdout, /ignored\/decision/);
});

import assert from 'node:assert/strict';
import { lstat, mkdir, readFile, readlink } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { MANIFEST_FILENAME } from '../src/setup/manifest.js';
import { CORE_SKILLS } from '../src/setup/skill-sets.js';
import { makeRepo, run } from './helpers/fixture.js';
import { walkFiles } from './helpers/walk.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const templatesSkills = path.join(repoRoot, 'templates', '.agents', 'skills');

/** The template files of the core skills, as paths relative to the install root. */
async function coreSkillFiles(): Promise<string[]> {
  const files = await walkFiles(templatesSkills);
  return files
    .map((rel) => `.agents/skills/${rel}`)
    .filter((rel) => (CORE_SKILLS as readonly string[]).includes(rel.split('/')[2]));
}

/** The exact file set the outside mode writes: the core skills, the config and the manifest. */
async function outsideFileSet(): Promise<string[]> {
  return [...(await coreSkillFiles()), '.wolven-harness.json', MANIFEST_FILENAME].sort();
}

test('proof-install-experience-outside-root: outside a repository setup writes only the core skills, the links, the config and the manifest', async () => {
  const dir = await makeRepo({});

  const result = await run(['setup', '--git-host', 'gh', '--runtimes', 'claude'], { cwd: dir });

  assert.equal(result.code, 0, result.stderr);
  assert.deepEqual((await walkFiles(dir)).sort(), await outsideFileSet());

  const skillsLink = path.join(dir, '.claude', 'skills');
  assert.equal((await lstat(skillsLink)).isSymbolicLink(), true);
  assert.equal(await readlink(skillsLink), '../.agents/skills');

  for (const absent of ['WOLVEN.md', '.agents/rules', '.qmd', '.harness-score.json', 'CLAUDE.md', 'docs']) {
    await assert.rejects(lstat(path.join(dir, absent)), `${absent} must not exist`);
  }

  const manifest = JSON.parse(await readFile(path.join(dir, MANIFEST_FILENAME), 'utf8')) as {
    files: Record<string, string>;
  };
  assert.deepEqual(Object.keys(manifest.files).sort(), (await coreSkillFiles()).sort());

  const output = result.stdout + result.stderr;
  assert.match(output, /"harness-init"/);
  assert.match(output, /in this folder/);
});

test('proof-install-experience-outside-root: a package.json beside the install keeps its scripts', async () => {
  const packageJson = `${JSON.stringify({ name: 'client', version: '1.0.0', scripts: { build: 'tsc' } }, null, 2)}\n`;
  const dir = await makeRepo({ 'package.json': packageJson });

  const result = await run(['setup', '--git-host', 'gh', '--runtimes', 'claude'], { cwd: dir });

  assert.equal(result.code, 0, result.stderr);
  assert.equal(await readFile(path.join(dir, 'package.json'), 'utf8'), packageJson, 'package.json is untouched');
});

test('proof-install-experience-outside-root: a subfolder of a git repository uses the same minimal mode', async () => {
  const parent = await makeRepo({ 'README.md': '# parent\n' }, { git: true });
  const subdir = path.join(parent, 'client');
  await mkdir(subdir);

  const result = await run(['setup', '--git-host', 'gh', '--runtimes', 'claude'], { cwd: subdir });

  assert.equal(result.code, 0, result.stderr);
  assert.deepEqual((await walkFiles(subdir)).sort(), await outsideFileSet());
  await assert.rejects(lstat(path.join(subdir, 'WOLVEN.md')), 'no WOLVEN.md in the subfolder');

  const parentFiles = await walkFiles(parent);
  assert.ok(
    parentFiles.every((rel) => rel === 'README.md' || rel.startsWith('client/')),
    `the repository top-level is untouched: ${parentFiles.join(', ')}`,
  );
});

test('proof-install-experience-global-hint: a local or cached executable recommends the global install', async () => {
  const localDir = await makeRepo({});
  const local = await run(['setup', '--git-host', 'gh', '--runtimes', 'claude'], {
    cwd: localDir,
    execPath: '/work/client/node_modules/.bin/wolven-harness',
  });
  assert.equal(local.code, 0, local.stderr);
  assert.match(local.stderr, /npm install -g @wolven-tech\/harness/);

  const cachedDir = await makeRepo({});
  const cached = await run(['setup', '--git-host', 'gh', '--runtimes', 'claude'], {
    cwd: cachedDir,
    execPath: '/home/client/.npm/_npx/1a2b/node_modules/.bin/wolven-harness',
  });
  assert.equal(cached.code, 0, cached.stderr);
  assert.match(cached.stderr, /npm install -g @wolven-tech\/harness/);

  const globalDir = await makeRepo({});
  const global = await run(['setup', '--git-host', 'gh', '--runtimes', 'claude'], {
    cwd: globalDir,
    execPath: '/usr/local/bin/wolven-harness',
  });
  assert.equal(global.code, 0, global.stderr);
  assert.doesNotMatch(global.stdout + global.stderr, /install -g/);
});

test('proof-install-experience-root-unchanged: a git top-level still gets the full scaffold and its next steps', async () => {
  const dir = await makeRepo({}, { git: true });

  const result = await run(['setup', '--git-host', 'gh', '--runtimes', 'claude'], { cwd: dir });

  assert.equal(result.code, 0, result.stderr);
  for (const rel of ['WOLVEN.md', '.agents/rules/qmd-first.md', '.qmd/index.yml', '.harness-score.json']) {
    assert.ok((await lstat(path.join(dir, rel))).isFile(), `${rel} is scaffolded`);
  }
  assert.equal((await lstat(path.join(dir, '.claude', 'rules'))).isSymbolicLink(), true);
  assert.match(result.stdout, /in this repo/);
  assert.doesNotMatch(result.stdout + result.stderr, /not a git top-level/);
});

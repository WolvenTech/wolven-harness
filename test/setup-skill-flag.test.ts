import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { ALL_SKILLS, CORE_SKILLS, SET_SKILLS } from '../src/setup/skill-sets.js';
import { makeRepo, run } from './helpers/fixture.js';
import { walkFiles } from './helpers/walk.js';

const BASE = ['setup', '--git-host', 'gh', '--runtimes', 'codex'];

async function installed(dir: string): Promise<string[]> {
  return (await readdir(path.join(dir, '.agents/skills'))).sort();
}

async function config(dir: string): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(path.join(dir, '.wolven-harness.json'), 'utf8'));
}

async function configExists(dir: string): Promise<boolean> {
  try {
    await readFile(path.join(dir, '.wolven-harness.json'));
    return true;
  } catch {
    return false;
  }
}

test('setup-skill-flag: unknown --skill exits 1 naming valid skills', async () => {
  const dir = await makeRepo({}, { git: true });

  const result = await run([...BASE, '--skills', 'none', '--skill', 'not-a-skill'], { cwd: dir });

  assert.equal(result.code, 1, result.stderr);
  assert.match(result.stderr, /unknown skill "not-a-skill"/);
  assert.match(result.stderr, /Valid skills:/);
  assert.match(result.stderr, /create-prd/);
  assert.equal(await configExists(dir), false);
});

test('setup-skill-flag: --skills none --skill create-prd installs core+create-prd only', async () => {
  const dir = await makeRepo({}, { git: true });

  const result = await run([...BASE, '--skills', 'none', '--skill', 'create-prd'], { cwd: dir });

  assert.equal(result.code, 0, result.stderr);
  assert.deepEqual(await installed(dir), [...CORE_SKILLS, 'create-prd'].sort());
  assert.ok(!(await installed(dir)).includes('prototype'));
  assert.ok(!(await installed(dir)).includes('handoff'));

  const cfg = await config(dir);
  assert.deepEqual(cfg.skills, ['create-prd']);
  assert.deepEqual(cfg.skillSets, []);
  assert.ok(!(cfg.skillSets as string[]).includes('discovery'));
});

test('setup-skill-flag: --skill= with --skills ship installs the set plus the skill', async () => {
  const dir = await makeRepo({}, { git: true });

  const result = await run([...BASE, '--skills', 'ship', '--skill=create-prd'], { cwd: dir });

  assert.equal(result.code, 0, result.stderr);
  assert.deepEqual(await installed(dir), [...CORE_SKILLS, ...SET_SKILLS.ship, 'create-prd'].sort());

  const cfg = await config(dir);
  assert.deepEqual(cfg.skillSets, ['ship']);
  assert.deepEqual(cfg.skills, ['create-prd']);
});

test('setup-skill-flag: repeat --skill create-prd is additive and idempotent', async () => {
  const dir = await makeRepo({}, { git: true });
  await run([...BASE, '--skills', 'none', '--skill', 'create-prd'], { cwd: dir });

  const skillFile = path.join(dir, '.agents/skills/create-prd/SKILL.md');
  const before = await readFile(skillFile, 'utf8');
  const beforeTree = (await walkFiles(dir)).sort();

  const again = await run([...BASE, '--skills', 'none', '--skill', 'create-prd'], { cwd: dir });

  assert.equal(again.code, 0, again.stderr);
  assert.equal(await readFile(skillFile, 'utf8'), before);
  assert.deepEqual(await installed(dir), [...CORE_SKILLS, 'create-prd'].sort());
  assert.deepEqual((await config(dir)).skills, ['create-prd']);
  assert.deepEqual((await config(dir)).skillSets, []);
  assert.deepEqual((await walkFiles(dir)).sort(), beforeTree);
});

test('setup-skill-flag: --list-skills prints groups and exits 0 without writes', async () => {
  const dir = await makeRepo({}, { git: true });
  const before = (await walkFiles(dir)).sort();

  const result = await run(['setup', '--list-skills'], { cwd: dir });

  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /^core:/m);
  assert.match(result.stdout, /^ship:/m);
  assert.match(result.stdout, /^discovery:/m);
  for (const name of ALL_SKILLS) {
    assert.match(result.stdout, new RegExp(`^  ${name}$`, 'm'));
  }
  assert.equal(await configExists(dir), false);
  assert.deepEqual((await walkFiles(dir)).sort(), before);
});

test('setup-skill-flag: --list-skills leaves an existing config unchanged', async () => {
  const saved = `${JSON.stringify({
    version: 1,
    gitHost: 'gh',
    runtimes: ['codex'],
    skillSets: ['ship'],
    skills: ['create-prd'],
  })}\n`;
  const dir = await makeRepo({ '.wolven-harness.json': saved }, { git: true });

  const result = await run(['setup', '--list-skills'], { cwd: dir });

  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /^core:/m);
  assert.equal(await readFile(path.join(dir, '.wolven-harness.json'), 'utf8'), saved);
});

test('setup-skill-flag: --list-skills still requires git top-level', async () => {
  const dir = await makeRepo({});

  const result = await run(['setup', '--list-skills'], { cwd: dir });

  assert.equal(result.code, 1);
  assert.match(result.stderr, /not a git repository/);
});

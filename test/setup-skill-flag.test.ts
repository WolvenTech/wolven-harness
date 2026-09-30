import assert from 'node:assert/strict';
import { readdir, readFile, writeFile } from 'node:fs/promises';
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

test('setup-skill-flag: --list-skills validates the rest of the arguments', async () => {
  const dir = await makeRepo({}, { git: true });

  for (const extra of [['--bogus'], ['--git-host'], ['--skill']]) {
    const result = await run(['setup', '--list-skills', ...extra], { cwd: dir });
    assert.equal(result.code, 1, extra.join(' '));
    assert.equal(result.stdout.includes('core:'), false);
  }
  assert.match((await run(['setup', '--bogus', '--list-skills'], { cwd: dir })).stderr, /unknown option "--bogus"/);

  const consumed = await run(['setup', '--skill', '--list-skills', ...BASE.slice(1)], { cwd: dir });
  assert.equal(consumed.code, 1);
  assert.match(consumed.stderr, /unknown skill "--list-skills"/);
  assert.equal(await configExists(dir), false);
});

test('setup-skill-flag: an invalid --skill in a terminal asks for individual skills instead', async () => {
  const dir = await makeRepo({}, { git: true });
  const messages: string[] = [];

  const result = await run([...BASE, '--skills', 'none', '--skill', 'nope'], {
    cwd: dir,
    isTTY: true,
    prompts: {
      async select() {
        throw new Error('not asked');
      },
      async multiselect(o) {
        messages.push(o.message);
        assert.equal(o.required, false);
        assert.deepEqual(
          o.options.map((c) => c.value),
          [...ALL_SKILLS],
        );
        return ['create-prd'] as never;
      },
    },
  });

  assert.equal(result.code, 0, result.stderr);
  assert.equal(messages.length, 1);
  assert.match(messages[0], /^Unknown skill "nope"; pick from the list instead\.\nWhich individual skills/);
  assert.deepEqual((await config(dir)).skills, ['create-prd']);
  assert.deepEqual(await installed(dir), [...CORE_SKILLS, 'create-prd'].sort());
});

test('setup-skill-flag: a valid --skill in a terminal asks nothing about skills', async () => {
  const dir = await makeRepo({}, { git: true });

  const result = await run([...BASE, '--skills', 'none', '--skill', 'create-prd'], {
    cwd: dir,
    isTTY: true,
    prompts: {
      async select() {
        throw new Error('not asked');
      },
      async multiselect() {
        throw new Error('not asked');
      },
    },
  });

  assert.equal(result.code, 0, result.stderr);
  assert.deepEqual((await config(dir)).skills, ['create-prd']);
});

test('setup-skill-flag: individual installs of a whole set never become skillSets', async () => {
  const dir = await makeRepo({}, { git: true });
  const each = SET_SKILLS.discovery.flatMap((s) => ['--skill', s]);

  const first = await run([...BASE, '--skills', 'none', ...each], { cwd: dir });
  assert.equal(first.code, 0, first.stderr);
  assert.deepEqual((await config(dir)).skillSets, []);

  const again = await run([...BASE, '--skills', 'none'], { cwd: dir });
  assert.equal(again.code, 0, again.stderr);
  assert.deepEqual((await config(dir)).skillSets, []);
  assert.deepEqual((await config(dir)).skills, [...SET_SKILLS.discovery]);
  assert.doesNotMatch(again.stdout, /Left the discovery skills in place/);

  const manual = await makeRepo({}, { git: true });
  await run([...BASE, '--skills', 'discovery'], { cwd: manual });
  await run([...BASE, '--skills', 'none'], { cwd: manual });
  assert.deepEqual((await config(manual)).skillSets, ['discovery']);
});

test('setup-skill-flag: a complete set on disk with empty skills is still inferred', async () => {
  const dir = await makeRepo({}, { git: true });
  await run([...BASE, '--skills', 'discovery'], { cwd: dir });
  const cfg = await config(dir);
  await writeFile(path.join(dir, '.wolven-harness.json'), `${JSON.stringify({ ...cfg, skillSets: [] })}\n`);

  const result = await run([...BASE, '--skills', 'none'], { cwd: dir });

  assert.equal(result.code, 0, result.stderr);
  assert.deepEqual((await config(dir)).skillSets, ['discovery']);
});

test('setup-skill-flag: an unknown persisted skill is ignored when copying and kept in the config', async () => {
  const saved = {
    version: 1,
    gitHost: 'gh',
    runtimes: ['codex'],
    skillSets: [],
    skills: ['from-the-future', 'create-prd'],
  };
  const dir = await makeRepo({ '.wolven-harness.json': `${JSON.stringify(saved)}\n` }, { git: true });

  const result = await run(['setup', '--skill', 'prototype'], { cwd: dir });

  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stderr, /Ignored unknown skills.*from-the-future/);
  assert.deepEqual(await installed(dir), [...CORE_SKILLS, 'create-prd', 'prototype'].sort());
  assert.deepEqual((await config(dir)).skills, ['create-prd', 'prototype', 'from-the-future']);

  const bad = await makeRepo(
    { '.wolven-harness.json': `${JSON.stringify({ ...saved, skills: [''] })}\n` },
    { git: true },
  );
  assert.equal((await run(['setup'], { cwd: bad })).code, 1);
});

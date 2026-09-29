import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { makeRepo, run } from './helpers/fixture.js';
import { CORE_SKILLS, SET_SKILLS } from '../src/setup/skill-sets.js';

const BASE = ['setup', '--git-host', 'gh', '--runtimes', 'codex'];

async function installed(dir: string): Promise<string[]> {
  return (await readdir(path.join(dir, '.agents/skills'))).sort();
}

async function config(dir: string): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(path.join(dir, '.wolven-harness.json'), 'utf8'));
}

test('setup-skill-sets: default without a terminal installs core and ship', async () => {
  const dir = await makeRepo({}, { git: true });

  const result = await run(BASE, { cwd: dir });

  assert.equal(result.code, 0, result.stderr);
  assert.deepEqual(await installed(dir), [...CORE_SKILLS, ...SET_SKILLS.ship].sort());
  assert.deepEqual((await config(dir)).skillSets, ['ship']);
  assert.match(result.stdout, /✔ 13 skills \(core, ship\) and 3 rules in \.agents\//);
});

test('setup-skill-sets: --skills none installs core only', async () => {
  const dir = await makeRepo({}, { git: true });

  const result = await run([...BASE, '--skills', 'none'], { cwd: dir });

  assert.equal(result.code, 0, result.stderr);
  assert.deepEqual(await installed(dir), [...CORE_SKILLS].sort());
  assert.ok(!(await installed(dir)).includes('code-commit'));
  assert.deepEqual((await config(dir)).skillSets, []);
  assert.match(result.stdout, /✔ 9 skills \(core\) and 3 rules/);
});

test('setup-skill-sets: --skills ship,discovery installs all sixteen', async () => {
  const dir = await makeRepo({}, { git: true });

  const result = await run([...BASE, '--skills=ship,discovery'], { cwd: dir });

  assert.equal(result.code, 0, result.stderr);
  assert.equal((await installed(dir)).length, 16);
  assert.deepEqual((await config(dir)).skillSets, ['ship', 'discovery']);
});

test('setup-skill-sets: a flag beats saved config, and saved config beats the default', async () => {
  const saved = JSON.stringify({ version: 1, gitHost: 'gh', runtimes: ['codex'], skillSets: ['discovery'] }) + '\n';

  const fromConfig = await makeRepo({ '.wolven-harness.json': saved }, { git: true });
  const a = await run(['setup'], { cwd: fromConfig });
  assert.equal(a.code, 0, a.stderr);
  assert.deepEqual(await installed(fromConfig), [...CORE_SKILLS, ...SET_SKILLS.discovery].sort());

  const fromFlag = await makeRepo({ '.wolven-harness.json': saved }, { git: true });
  const b = await run(['setup', '--skills', 'ship'], { cwd: fromFlag });
  assert.equal(b.code, 0, b.stderr);
  assert.deepEqual(await installed(fromFlag), [...CORE_SKILLS, ...SET_SKILLS.ship].sort());
});

test('setup-skill-sets: a TTY prompt is asked only when neither flag nor config decides', async () => {
  const dir = await makeRepo({}, { git: true });
  const seen: string[][] = [];

  const result = await run(['setup', '--git-host', 'gh', '--runtimes', 'codex'], {
    cwd: dir,
    isTTY: true,
    prompts: {
      async select() {
        throw new Error('not asked');
      },
      async multiselect(o) {
        seen.push(o.options.map((c) => c.label));
        return ['discovery'] as never;
      },
    },
  });

  assert.equal(result.code, 0, result.stderr);
  assert.deepEqual(seen, [['Ship — commit, PR, review, CI', 'Discovery — PRD, prototype, handoff']]);
  assert.deepEqual(await installed(dir), [...CORE_SKILLS, ...SET_SKILLS.discovery].sort());
});

test('setup-skill-sets: re-running with discovery keeps ship and adds discovery', async () => {
  const dir = await makeRepo({}, { git: true });
  await run(BASE, { cwd: dir });

  const again = await run([...BASE, '--skills', 'discovery'], { cwd: dir });

  assert.equal(again.code, 0, again.stderr);
  assert.equal((await installed(dir)).length, 16);
  assert.deepEqual((await config(dir)).skillSets, ['ship', 'discovery']);
  assert.match(again.stdout, /✔ 3 skills \(discovery\) in \.agents\//);
  assert.match(again.stdout, /Left the ship skills in place/);
});

test('setup-skill-sets: re-running with none after ship removes nothing and says so', async () => {
  const dir = await makeRepo({}, { git: true });
  await run(BASE, { cwd: dir });

  const again = await run([...BASE, '--skills', 'none'], { cwd: dir });

  assert.equal(again.code, 0, again.stderr);
  assert.deepEqual(await installed(dir), [...CORE_SKILLS, ...SET_SKILLS.ship].sort());
  assert.deepEqual((await config(dir)).skillSets, ['ship']);
  assert.match(again.stdout, /Left the ship skills in place\. You did not pick them this time, but setup never removes anything\./);
});

test('setup-skill-sets: WOLVEN.md lists exactly the installed skills', async () => {
  for (const [flag, expected] of [
    ['none', [...CORE_SKILLS]],
    ['ship', [...CORE_SKILLS, ...SET_SKILLS.ship]],
  ] as const) {
    const dir = await makeRepo({}, { git: true });
    await run([...BASE, '--skills', flag], { cwd: dir });

    const wolven = await readFile(path.join(dir, 'WOLVEN.md'), 'utf8');
    const known = [...CORE_SKILLS, ...Object.values(SET_SKILLS).flat()];
    const skillRows = [...wolven.matchAll(/^\| ([a-z-]+) \| .+ \|$/gm)].map((m) => m[1]).filter((n) => known.includes(n));
    assert.deepEqual(skillRows.sort(), [...expected].sort());
  }
});

test('setup-skill-sets: invalid values fail with a hint and write nothing', async () => {
  const dir = await makeRepo({}, { git: true });

  for (const bad of ['bogus', 'none,ship', '']) {
    const result = await run([...BASE, '--skills', bad], { cwd: dir });
    assert.equal(result.code, 1, bad);
    assert.match(result.stderr, /--skills/);
    assert.match(result.stderr, /Hint: /);
  }
  assert.deepEqual((await readdir(dir)).filter((f) => !f.startsWith('.git')), []);

  const unknown = await run(['setup', '--nope'], { cwd: dir });
  assert.match(unknown.stderr, /--skills <ship,discovery\|none>/);
});

test('setup-skill-sets: --help lists --skills', async () => {
  const result = await run(['--help'], { cwd: await makeRepo({}) });
  assert.ok(result.stdout.includes('--skills'));
});

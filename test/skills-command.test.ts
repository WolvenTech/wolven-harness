import assert from 'node:assert/strict';
import { chmod, lstat, mkdir, mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { pathExists } from '../src/path-exists.js';
import { CORE_SKILLS, SET_SKILLS } from '../src/setup/skill-sets.js';
import type { Prompter } from '../src/setup/types.js';
import { makeRepo, run } from './helpers/fixture.js';

const packageCreatePrd = fileURLToPath(new URL('../templates/.agents/skills/create-prd', import.meta.url));

async function filesUnder(dir: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(current: string, prefix: string): Promise<void> {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const rel = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
      if (entry.isDirectory()) await walk(path.join(current, entry.name), rel);
      else if (entry.isFile()) out.push(rel);
    }
  }
  await walk(dir, '');
  out.sort();
  return out;
}

async function assertPackageCopy(dest: string): Promise<void> {
  const expected = await filesUnder(packageCreatePrd);
  assert.deepEqual(await filesUnder(dest), expected);
  for (const rel of expected) {
    assert.deepEqual(await readFile(path.join(dest, rel)), await readFile(path.join(packageCreatePrd, rel)));
  }
}

test('proof-skills-command-claude-project', async () => {
  const dir = await makeRepo({});
  const result = await run(['skills', '--skills', 'create-prd', '--runtimes', 'claude', '--scope', 'project'], {
    cwd: dir,
  });

  assert.equal(result.code, 0);
  assert.equal(result.stdout, '');
  await assertPackageCopy(path.join(dir, '.claude', 'skills', 'create-prd'));

  const skillsDir = await lstat(path.join(dir, '.claude', 'skills'));
  assert.equal(skillsDir.isSymbolicLink(), false);
  assert.equal(skillsDir.isDirectory(), true);
  assert.deepEqual((await readdir(dir)).sort(), ['.claude']);
  assert.equal(await pathExists(path.join(dir, '.agents')), false);
  assert.equal(await pathExists(path.join(dir, '.wolven-harness.json')), false);
  assert.equal(await pathExists(path.join(dir, 'CLAUDE.md')), false);
  assert.equal(await pathExists(path.join(dir, 'package.json')), false);
});

test('proof-skills-command-multi-path', async () => {
  const dir = await makeRepo({});
  const home = await mkdtemp(path.join(tmpdir(), 'wolven-harness-home-'));
  const result = await run(
    ['skills', '--skills', 'create-prd', '--runtimes', 'claude,codex', '--scope', 'project,global'],
    { cwd: dir, env: { HOME: home } },
  );

  assert.equal(result.code, 0);
  const dests = [
    path.join(dir, '.claude', 'skills', 'create-prd'),
    path.join(home, '.claude', 'skills', 'create-prd'),
    path.join(dir, '.agents', 'skills', 'create-prd'),
    path.join(home, '.agents', 'skills', 'create-prd'),
  ];
  for (const dest of dests) await assertPackageCopy(dest);

  assert.deepEqual((await readdir(dir)).sort(), ['.agents', '.claude']);
  assert.deepEqual((await readdir(home)).sort(), ['.agents', '.claude']);
  assert.deepEqual(await readdir(path.join(dir, '.agents', 'skills')), ['create-prd']);
  assert.deepEqual(await readdir(path.join(dir, '.claude', 'skills')), ['create-prd']);
  assert.deepEqual(await readdir(path.join(home, '.agents', 'skills')), ['create-prd']);
  assert.deepEqual(await readdir(path.join(home, '.claude', 'skills')), ['create-prd']);
  assert.equal(await pathExists(path.join(dir, '.wolven-harness.json')), false);
  assert.equal(await pathExists(path.join(home, '.wolven-harness.json')), false);
  assert.equal(await pathExists(path.join(dir, '.cursor')), false);
  assert.equal(await pathExists(path.join(home, '.cursor')), false);
});

test('proof-skills-command-shared-agents', async () => {
  const dir = await makeRepo({});
  const result = await run(['skills', '--skills', 'create-prd', '--runtimes', 'cursor,codex', '--scope', 'project'], {
    cwd: dir,
  });

  assert.equal(result.code, 0);
  await assertPackageCopy(path.join(dir, '.agents', 'skills', 'create-prd'));
  assert.deepEqual(await readdir(path.join(dir, '.agents', 'skills')), ['create-prd']);
  assert.deepEqual((await readdir(dir)).sort(), ['.agents']);
  assert.equal(await pathExists(path.join(dir, '.cursor')), false);
  assert.equal(await pathExists(path.join(dir, '.cursor', 'skills')), false);
});

function scripted(answers: {
  multi?: string[][];
  select?: Array<'yes' | 'no' | undefined>;
  calls?: string[];
}): Prompter {
  const multi = [...(answers.multi ?? [])];
  const selects = [...(answers.select ?? [])];
  return {
    async multiselect(o) {
      answers.calls?.push(`multi:${o.message}`);
      return multi.shift() as never;
    },
    async select(o) {
      answers.calls?.push(`select:${o.message}`);
      return selects.shift();
    },
  };
}

test('proof-skills-command-set-select', async () => {
  const all = await makeRepo({});
  const allResult = await run(['skills', '--runtimes', 'codex', '--scope', 'project'], {
    cwd: all,
    isTTY: true,
    prompts: scripted({ multi: [['discovery']] }),
  });
  assert.equal(allResult.code, 0);
  assert.deepEqual((await readdir(path.join(all, '.agents', 'skills'))).sort(), [...SET_SKILLS.discovery].sort());

  const one = await makeRepo({});
  const oneResult = await run(['skills', '--runtimes', 'codex', '--scope', 'project'], {
    cwd: one,
    isTTY: true,
    prompts: scripted({ multi: [['create-prd']] }),
  });
  assert.equal(oneResult.code, 0);
  assert.deepEqual(await readdir(path.join(one, '.agents', 'skills')), ['create-prd']);
});

test('proof-skills-command-core-disabled', async () => {
  const dir = await makeRepo({});
  let message = '';
  let options: string[] = [];
  const result = await run(['skills', '--runtimes', 'codex', '--scope', 'project'], {
    cwd: dir,
    isTTY: true,
    prompts: {
      async multiselect(o) {
        message = o.message;
        options = o.options.map((option) => option.value);
        return ['create-prd'];
      },
      async select() {
        return 'no';
      },
    },
  });
  assert.equal(result.code, 0);
  for (const name of CORE_SKILLS) {
    assert.match(message, new RegExp(name));
    assert.equal(options.includes(name), false);
    assert.equal(await pathExists(path.join(dir, '.agents', 'skills', name)), false);
  }
  assert.match(message, /code-lane/);
  assert.match(message, /adr/);
  assert.match(message, /qmd/);
});

test('proof-skills-command-flag-expand', async () => {
  const ship = await makeRepo({});
  assert.equal(
    (await run(['skills', '--skills', 'ship', '--runtimes', 'codex', '--scope', 'project'], { cwd: ship })).code,
    0,
  );
  assert.deepEqual((await readdir(path.join(ship, '.agents', 'skills'))).sort(), [...SET_SKILLS.ship].sort());

  const one = await makeRepo({});
  assert.equal(
    (await run(['skills', '--skills', 'create-prd', '--runtimes', 'codex', '--scope', 'project'], { cwd: one })).code,
    0,
  );
  assert.deepEqual(await readdir(path.join(one, '.agents', 'skills')), ['create-prd']);

  const overlap = await makeRepo({});
  assert.equal(
    (await run(['skills', '--skills', 'ship,code-pr', '--runtimes', 'codex', '--scope', 'project'], { cwd: overlap }))
      .code,
    0,
  );
  assert.deepEqual((await readdir(path.join(overlap, '.agents', 'skills'))).sort(), [...SET_SKILLS.ship].sort());
});

test('proof-skills-command-core-flag', async () => {
  for (const skills of ['adr', 'create-prd,adr']) {
    const dir = await makeRepo({});
    const before = await readdir(dir);
    const result = await run(['skills', '--skills', skills, '--runtimes', 'codex', '--scope', 'project'], { cwd: dir });
    assert.equal(result.code, 1);
    assert.match(result.stderr, /adr is installed by setup/);
    assert.deepEqual(await readdir(dir), before);
  }
});

test('proof-skills-command-unknown-skill', async () => {
  for (const skills of ['code-reviw', 'create-prd,code-reviw']) {
    const dir = await makeRepo({});
    const before = await readdir(dir);
    const result = await run(['skills', '--skills', skills, '--runtimes', 'codex', '--scope', 'project'], { cwd: dir });
    assert.equal(result.code, 1);
    assert.match(result.stderr, /code-reviw/);
    assert.match(result.stderr, /setup/);
    assert.doesNotMatch(result.stderr, /code-reviw is installed by setup/);
    assert.deepEqual(await readdir(dir), before);
  }
});

test('proof-skills-command-missing-flag', async () => {
  const dir = await makeRepo({});
  const result = await run(['skills', '--scope', 'project', '--skills', 'create-prd'], { cwd: dir });
  assert.equal(result.code, 1);
  assert.match(result.stderr, /--runtimes/);
  assert.deepEqual(await readdir(dir), []);
});

test('proof-skills-command-scope-both', async () => {
  const bad = await makeRepo({});
  const failed = await run(['skills', '--skills', 'create-prd', '--runtimes', 'codex', '--scope', 'both'], {
    cwd: bad,
  });
  assert.equal(failed.code, 1);
  assert.match(failed.stderr, /both/);
  assert.deepEqual(await readdir(bad), []);

  for (const scope of ['project,global', 'global,project']) {
    const dir = await makeRepo({});
    const home = await mkdtemp(path.join(tmpdir(), 'wolven-harness-home-'));
    const result = await run(['skills', '--skills', 'create-prd', '--runtimes', 'codex', '--scope', scope], {
      cwd: dir,
      env: { HOME: home },
    });
    assert.equal(result.code, 0);
    assert.equal(await pathExists(path.join(dir, '.agents', 'skills', 'create-prd')), true);
    assert.equal(await pathExists(path.join(home, '.agents', 'skills', 'create-prd')), true);
  }
});

test('proof-skills-command-reask', async () => {
  const dir = await makeRepo({});
  const calls: string[] = [];
  const result = await run(['skills', '--runtimes', 'foo', '--scope', 'project', '--skills', 'create-prd'], {
    cwd: dir,
    isTTY: true,
    prompts: scripted({ multi: [['codex']], calls }),
  });
  assert.equal(result.code, 0);
  assert.deepEqual(calls, ['multi:Runtimes']);
  await assertPackageCopy(path.join(dir, '.agents', 'skills', 'create-prd'));
});

test('proof-skills-command-help', async () => {
  const dir = await makeRepo({});
  for (const flag of ['--help', '-h']) {
    const result = await run(['skills', flag], { cwd: dir });
    assert.equal(result.code, 0);
    assert.equal(result.stderr, '');
    for (const token of [
      '--runtimes',
      '--scope',
      '--skills',
      'claude',
      'codex',
      'cursor',
      'project',
      'global',
      'project,global',
      ...SET_SKILLS.ship,
      ...SET_SKILLS.discovery,
    ]) {
      assert.match(result.stdout, new RegExp(token.replace(',', '\\,')));
    }
    assert.match(result.stdout, /installed by setup/);
  }
  assert.deepEqual(await readdir(dir), []);
});

test('proof-skills-command-nontty-ok', async () => {
  const dir = await makeRepo({});
  const result = await run(['skills', '--skills', 'create-prd', '--runtimes', 'codex', '--scope', 'project'], {
    cwd: dir,
    isTTY: false,
  });

  assert.equal(result.code, 0);
  await assertPackageCopy(path.join(dir, '.agents', 'skills', 'create-prd'));
});

test('proof-skills-command-decline', async () => {
  const dir = await makeRepo({});
  const kept = path.join(dir, '.claude', 'skills', 'create-prd');
  await mkdir(kept, { recursive: true });
  await writeFile(path.join(kept, 'SKILL.md'), 'local\n');
  let seenPrototype = true;
  const result = await run(
    ['skills', '--skills', 'create-prd,prototype', '--runtimes', 'claude', '--scope', 'project'],
    {
      cwd: dir,
      isTTY: true,
      prompts: {
        async multiselect() {
          return ['create-prd'];
        },
        async select() {
          seenPrototype = await pathExists(path.join(dir, '.claude', 'skills', 'prototype'));
          return 'no';
        },
      },
    },
  );
  assert.equal(result.code, 0);
  assert.equal(seenPrototype, false);
  assert.equal(await readFile(path.join(kept, 'SKILL.md'), 'utf8'), 'local\n');
  assert.equal(await pathExists(path.join(dir, '.claude', 'skills', 'prototype', 'SKILL.md')), true);
});

test('proof-skills-command-replace', async () => {
  const dir = await makeRepo({});
  const kept = path.join(dir, '.claude', 'skills', 'create-prd');
  await mkdir(kept, { recursive: true });
  await writeFile(path.join(kept, 'SKILL.md'), 'local\n');
  await writeFile(path.join(kept, 'extra.txt'), 'extra\n');
  const result = await run(['skills', '--skills', 'create-prd', '--runtimes', 'claude', '--scope', 'project'], {
    cwd: dir,
    isTTY: true,
    prompts: scripted({ select: ['yes'] }),
  });
  assert.equal(result.code, 0);
  assert.equal(await pathExists(path.join(kept, 'extra.txt')), false);
  await assertPackageCopy(kept);
});

test('proof-skills-command-per-folder', async () => {
  const dir = await makeRepo({});
  const home = await mkdtemp(path.join(tmpdir(), 'wolven-harness-home-'));
  const project = path.join(dir, '.claude', 'skills', 'create-prd');
  const global = path.join(home, '.claude', 'skills', 'create-prd');
  await mkdir(project, { recursive: true });
  await mkdir(global, { recursive: true });
  await writeFile(path.join(project, 'SKILL.md'), 'project\n');
  await writeFile(path.join(global, 'SKILL.md'), 'global\n');
  const result = await run(['skills', '--skills', 'create-prd', '--runtimes', 'claude', '--scope', 'project,global'], {
    cwd: dir,
    isTTY: true,
    env: { HOME: home },
    prompts: {
      async multiselect() {
        return ['create-prd'];
      },
      async select(o) {
        return o.message.includes(project) ? 'no' : 'yes';
      },
    },
  });
  assert.equal(result.code, 0);
  assert.equal(await readFile(path.join(project, 'SKILL.md'), 'utf8'), 'project\n');
  await assertPackageCopy(global);
});

test('proof-skills-command-no-tty-keep', async () => {
  const dir = await makeRepo({});
  const kept = path.join(dir, '.agents', 'skills', 'create-prd');
  await mkdir(kept, { recursive: true });
  await writeFile(path.join(kept, 'SKILL.md'), 'keep\n');
  const calls: string[] = [];
  const result = await run(
    ['skills', '--skills', 'create-prd,prototype', '--runtimes', 'codex', '--scope', 'project'],
    {
      cwd: dir,
      isTTY: false,
      prompts: scripted({ calls }),
    },
  );
  assert.equal(result.code, 0);
  assert.deepEqual(calls, []);
  assert.equal(await readFile(path.join(kept, 'SKILL.md'), 'utf8'), 'keep\n');
  assert.equal(await pathExists(path.join(dir, '.agents', 'skills', 'prototype', 'SKILL.md')), true);
});

test('proof-skills-command-identical', async () => {
  const dir = await makeRepo({});
  assert.equal(
    (await run(['skills', '--skills', 'create-prd', '--runtimes', 'codex', '--scope', 'project'], { cwd: dir })).code,
    0,
  );
  const calls: string[] = [];
  const again = await run(['skills', '--skills', 'create-prd', '--runtimes', 'codex', '--scope', 'project'], {
    cwd: dir,
    isTTY: true,
    prompts: scripted({ calls }),
  });
  assert.equal(again.code, 0);
  assert.deepEqual(calls, []);
});

test('proof-skills-command-cancel-atomic', async () => {
  const dir = await makeRepo({});
  const project = path.join(dir, '.claude', 'skills', 'create-prd');
  const home = await mkdtemp(path.join(tmpdir(), 'wolven-harness-home-'));
  const globalDir = path.join(home, '.claude', 'skills', 'create-prd');
  await mkdir(project, { recursive: true });
  await mkdir(globalDir, { recursive: true });
  await writeFile(path.join(project, 'SKILL.md'), 'project\n');
  await writeFile(path.join(globalDir, 'SKILL.md'), 'global\n');
  const result = await run(['skills', '--skills', 'create-prd', '--runtimes', 'claude', '--scope', 'project,global'], {
    cwd: dir,
    isTTY: true,
    env: { HOME: home },
    prompts: scripted({ select: ['yes', undefined] }),
  });
  assert.equal(result.code, 1);
  assert.equal(await readFile(path.join(project, 'SKILL.md'), 'utf8'), 'project\n');
  assert.equal(await readFile(path.join(globalDir, 'SKILL.md'), 'utf8'), 'global\n');
});

test('proof-skills-command-write-error', async () => {
  const dir = await makeRepo({});
  const blocked = path.join(dir, '.claude');
  await mkdir(blocked);
  await chmod(blocked, 0o555);
  const untouched = path.join(dir, '.agents', 'skills', 'prototype');
  await mkdir(untouched, { recursive: true });
  await writeFile(path.join(untouched, 'SKILL.md'), 'stay\n');
  try {
    const result = await run(['skills', '--skills', 'create-prd', '--runtimes', 'codex,claude', '--scope', 'project'], {
      cwd: dir,
    });
    assert.equal(result.code, 1);
    assert.equal(await pathExists(path.join(dir, '.agents', 'skills', 'create-prd', 'SKILL.md')), true);
    assert.equal(await readFile(path.join(untouched, 'SKILL.md'), 'utf8'), 'stay\n');
  } finally {
    await chmod(blocked, 0o755);
  }
});

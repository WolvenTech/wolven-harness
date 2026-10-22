import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { makeRepo, run } from './helpers/fixture.js';
import { walkFiles } from './helpers/walk.js';

async function readConfigFile(dir: string): Promise<Record<string, unknown>> {
  const raw = await readFile(path.join(dir, '.wolven-harness.json'), 'utf8');
  return JSON.parse(raw) as Record<string, unknown>;
}

async function configExists(dir: string): Promise<boolean> {
  try {
    await readFile(path.join(dir, '.wolven-harness.json'));
    return true;
  } catch {
    return false;
  }
}

test('setup-prompts: an unknown argument exits 1 and writes nothing', async () => {
  const dir = await makeRepo({}, { git: true });

  const result = await run(['setup', '--help'], { cwd: dir, isTTY: false });

  assert.equal(result.code, 1);
  assert.match(result.stderr, /unknown option "--help"/);
  assert.equal(await configExists(dir), false);
});

test('setup-prompts: flags-only', async () => {
  const dir = await makeRepo({}, { git: true });

  const result = await run(['setup', '--git-host', 'gh', '--runtimes', 'claude,codex'], {
    cwd: dir,
    isTTY: false,
  });

  assert.equal(result.code, 0);

  const config = await readConfigFile(dir);
  assert.equal(config.version, 1);
  assert.equal(config.gitHost, 'gh');
  assert.deepEqual(config.runtimes, ['claude', 'codex']);
});

test('setup-prompts: flags-only accepts --flag=value form', async () => {
  const dir = await makeRepo({}, { git: true });

  const result = await run(['setup', '--git-host=bit', '--runtimes=cursor'], {
    cwd: dir,
    isTTY: false,
  });

  assert.equal(result.code, 0);

  const config = await readConfigFile(dir);
  assert.equal(config.gitHost, 'bit');
  assert.deepEqual(config.runtimes, ['cursor']);
});

test('setup-prompts: no-tty missing flag exits 1 naming the flag', async () => {
  const dir = await makeRepo({}, { git: true });

  const result = await run(['setup'], { cwd: dir, isTTY: false });

  assert.equal(result.code, 1);
  assert.match(result.stderr, /--git-host/);
  assert.match(result.stderr, /--runtimes/);
  assert.equal(await configExists(dir), false);
});

test('setup-prompts: unknown option exits without writing config', async () => {
  const dir = await makeRepo({}, { git: true });
  const result = await run(['setup', '--git-host', 'gh', '--runtimes', 'codex', '--runtime', 'claude'], {
    cwd: dir,
    isTTY: false,
  });

  assert.equal(result.code, 1);
  assert.match(result.stderr, /unknown option "--runtime"/);
  assert.equal(await configExists(dir), false);
});

test('setup-prompts: a flag without a value does not use a saved default', async () => {
  const config = `${JSON.stringify({ version: 1, gitHost: 'gh', runtimes: ['codex'] })}\n`;
  const dir = await makeRepo({ '.wolven-harness.json': config }, { git: true });
  const result = await run(['setup', '--runtimes'], { cwd: dir, isTTY: false });

  assert.equal(result.code, 1);
  assert.match(result.stderr, /missing value for --runtimes/);
  assert.equal(await readFile(path.join(dir, '.wolven-harness.json'), 'utf8'), config);
});

test('setup-prompts: no-tty missing only --runtimes names just that flag', async () => {
  const dir = await makeRepo({}, { git: true });

  const result = await run(['setup', '--git-host', 'gh'], { cwd: dir, isTTY: false });

  assert.equal(result.code, 1);
  assert.match(result.stderr, /--runtimes/);
  assert.doesNotMatch(result.stderr, /--git-host/);
});

test('setup-prompts: a folder outside any repository runs the outside mode', async () => {
  const dir = await makeRepo({ 'README.md': '# fixture\n' });

  const result = await run(['setup', '--git-host', 'gh', '--runtimes', 'claude'], {
    cwd: dir,
    isTTY: false,
  });

  assert.equal(result.code, 0, result.stderr);
  assert.equal(await configExists(dir), true);
  assert.equal(await readFile(path.join(dir, 'README.md'), 'utf8'), '# fixture\n');
  const files = (await walkFiles(dir)).sort();
  assert.ok(files.includes('.agents/skills/harness-init/SKILL.md'));
  assert.equal(files.includes('WOLVEN.md'), false);
});

test('setup-config: re-run reads .wolven-harness.json without prompting', {
  timeout: 5000,
}, async () => {
  const dir = await makeRepo(
    {
      '.wolven-harness.json': `${JSON.stringify({ version: 1, gitHost: 'bit', runtimes: ['codex'] })}\n`,
    },
    { git: true },
  );

  // why: a prompt here would block on empty stdin; the test timeout turns that hang into a failure.
  const result = await run(['setup'], { cwd: dir, isTTY: true, input: '' });

  assert.equal(result.code, 0);
  assert.doesNotMatch(result.stdout, /hosted/);
  assert.doesNotMatch(result.stdout, /runtimes do you use/);

  const config = await readConfigFile(dir);
  assert.equal(config.gitHost, 'bit');
  assert.deepEqual(config.runtimes, ['codex']);
});

test('setup-config: a flag overrides the file default', async () => {
  const dir = await makeRepo(
    {
      '.wolven-harness.json': `${JSON.stringify({ version: 1, gitHost: 'bit', runtimes: ['codex'] })}\n`,
    },
    { git: true },
  );

  const result = await run(['setup', '--git-host', 'gh'], { cwd: dir, isTTY: false });

  assert.equal(result.code, 0);

  const config = await readConfigFile(dir);
  assert.equal(config.gitHost, 'gh');
  assert.deepEqual(config.runtimes, ['codex']);
});

test('setup-config: a hand-added ignore key survives the re-run', async () => {
  const dir = await makeRepo(
    {
      '.wolven-harness.json': `${JSON.stringify({
        version: 1,
        gitHost: 'gh',
        runtimes: ['claude'],
        ignore: ['templates/**', 'test/**'],
      })}\n`,
    },
    { git: true },
  );

  const result = await run(['setup'], { cwd: dir, isTTY: false });

  assert.equal(result.code, 0);

  const config = await readConfigFile(dir);
  assert.deepEqual(config.ignore, ['templates/**', 'test/**']);
});

test('proof-install-experience-config-rerun', async () => {
  const preserved = {
    ignore: ['templates/**', 'test/**'],
    layout: 'home',
    codeRepo: '../client',
    commitConvention: { style: 'pattern', pattern: '^TASK-[0-9]+:', example: 'TASK-42: add feature' },
    comments: { paths: ['src/**', 'test/**'] },
    custom: { enabled: true },
  };
  const initial = {
    version: 1,
    gitHost: 'bit',
    runtimes: ['codex'],
    ...preserved,
  };
  const dir = await makeRepo({ '.wolven-harness.json': `${JSON.stringify(initial)}\n` }, { git: true });

  const result = await run(['setup', '--git-host', 'gh', '--runtimes', 'claude'], { cwd: dir, isTTY: false });

  assert.equal(result.code, 0, result.stderr);
  const config = await readConfigFile(dir);
  for (const [key, value] of Object.entries(preserved)) assert.deepEqual(config[key], value, key);
  assert.deepEqual(
    Object.keys(config).filter((key) => Object.hasOwn(preserved, key)),
    Object.keys(initial).filter((key) => Object.hasOwn(preserved, key)),
  );
  assert.equal(config.version, 1);
  assert.equal(config.gitHost, 'gh');
  assert.deepEqual(config.runtimes, ['claude']);
  assert.deepEqual(config.skillSets, ['ship']);
  assert.equal(typeof config.packageVersion, 'string');
  assert.ok((config.packageVersion as string).length > 0);
  assert.equal(config.packageManager, 'none');
});

test('setup-config: version is 1', async () => {
  const dir = await makeRepo({}, { git: true });

  const result = await run(['setup', '--git-host', 'gh', '--runtimes', 'claude'], {
    cwd: dir,
    isTTY: false,
  });

  assert.equal(result.code, 0);

  const config = await readConfigFile(dir);
  assert.equal(config.version, 1);
});

test('setup-config: invalid --git-host value exits 1 naming the flag', async () => {
  const dir = await makeRepo({}, { git: true });

  const result = await run(['setup', '--git-host', 'bogus', '--runtimes', 'claude'], {
    cwd: dir,
    isTTY: false,
  });

  assert.equal(result.code, 1);
  assert.match(result.stderr, /--git-host/);
  assert.equal(await configExists(dir), false);
});

test('setup-config: invalid --runtimes value exits 1 naming the flag', async () => {
  const dir = await makeRepo({}, { git: true });

  const result = await run(['setup', '--git-host', 'gh', '--runtimes', 'not-a-runtime'], {
    cwd: dir,
    isTTY: false,
  });

  assert.equal(result.code, 1);
  assert.match(result.stderr, /--runtimes/);
  assert.equal(await configExists(dir), false);
});

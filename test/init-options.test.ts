import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
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

// --- init-prompts ---

test('init-prompts: an unknown argument exits 1 and writes nothing', async () => {
  const dir = await makeRepo({}, { git: true });

  const result = await run(['init', '--help'], { cwd: dir, isTTY: false });

  assert.equal(result.code, 1);
  assert.match(result.stderr, /unknown option "--help"/);
  assert.equal(await configExists(dir), false);
});

test('init-prompts: flags-only', async () => {
  const dir = await makeRepo({}, { git: true });

  const result = await run(['init', '--git-host', 'gh', '--runtimes', 'claude,codex'], {
    cwd: dir,
    isTTY: false,
  });

  assert.equal(result.code, 0);

  const config = await readConfigFile(dir);
  assert.equal(config.version, 1);
  assert.equal(config.gitHost, 'gh');
  assert.deepEqual(config.runtimes, ['claude', 'codex']);
});

test('init-prompts: flags-only accepts --flag=value form', async () => {
  const dir = await makeRepo({}, { git: true });

  const result = await run(['init', '--git-host=bit', '--runtimes=cursor'], {
    cwd: dir,
    isTTY: false,
  });

  assert.equal(result.code, 0);

  const config = await readConfigFile(dir);
  assert.equal(config.gitHost, 'bit');
  assert.deepEqual(config.runtimes, ['cursor']);
});

test('init-prompts: no-tty missing flag exits 1 naming the flag', async () => {
  const dir = await makeRepo({}, { git: true });

  const result = await run(['init'], { cwd: dir, isTTY: false });

  assert.equal(result.code, 1);
  assert.match(result.stderr, /--git-host/);
  assert.match(result.stderr, /--runtimes/);
  assert.equal(await configExists(dir), false);
});

test('init-prompts: unknown option exits without writing config', async () => {
  const dir = await makeRepo({}, { git: true });
  const result = await run(['init', '--git-host', 'gh', '--runtimes', 'codex', '--runtime', 'claude'], {
    cwd: dir,
    isTTY: false,
  });

  assert.equal(result.code, 1);
  assert.match(result.stderr, /unknown option "--runtime"/);
  assert.equal(await configExists(dir), false);
});

test('init-prompts: a flag without a value does not use a saved default', async () => {
  const config = JSON.stringify({ version: 1, gitHost: 'gh', runtimes: ['codex'] }) + '\n';
  const dir = await makeRepo({ '.wolven-harness.json': config }, { git: true });
  const result = await run(['init', '--runtimes'], { cwd: dir, isTTY: false });

  assert.equal(result.code, 1);
  assert.match(result.stderr, /missing value for --runtimes/);
  assert.equal(await readFile(path.join(dir, '.wolven-harness.json'), 'utf8'), config);
});

test('init-prompts: no-tty missing only --runtimes names just that flag', async () => {
  const dir = await makeRepo({}, { git: true });

  const result = await run(['init', '--git-host', 'gh'], { cwd: dir, isTTY: false });

  assert.equal(result.code, 1);
  assert.match(result.stderr, /--runtimes/);
  assert.doesNotMatch(result.stderr, /--git-host/);
});

test('init-prompts: subdir exits 1 and creates nothing', async () => {
  const dir = await makeRepo({ 'README.md': '# fixture\n' }, { git: true });
  const subdir = path.join(dir, 'sub');
  await mkdir(subdir);

  const before = (await walkFiles(dir)).sort();
  const result = await run(['init', '--git-host', 'gh', '--runtimes', 'claude'], {
    cwd: subdir,
    isTTY: false,
  });
  const after = (await walkFiles(dir)).sort();

  assert.equal(result.code, 1);
  assert.deepEqual(after, before);
});

test('init-prompts: non-git dir exits 1 and creates nothing', async () => {
  const dir = await makeRepo({ 'README.md': '# fixture\n' });

  const before = (await walkFiles(dir)).sort();
  const result = await run(['init', '--git-host', 'gh', '--runtimes', 'claude'], {
    cwd: dir,
    isTTY: false,
  });
  const after = (await walkFiles(dir)).sort();

  assert.equal(result.code, 1);
  assert.deepEqual(after, before);
  assert.equal(await configExists(dir), false);
});

test('init-prompts: tty asks host then runtimes, one at a time', async () => {
  const dir = await makeRepo({}, { git: true });

  const result = await run(['init'], { cwd: dir, isTTY: true, input: 'gh\nclaude,codex\n' });

  assert.equal(result.code, 0);

  const hostIdx = result.stdout.search(/gh.*bit/i);
  const runtimesIdx = result.stdout.search(/claude.*codex.*cursor/i);
  assert.ok(hostIdx >= 0, 'host question printed');
  assert.ok(runtimesIdx >= 0, 'runtimes question printed');
  assert.ok(runtimesIdx > hostIdx, 'runtimes question printed after host question');

  const config = await readConfigFile(dir);
  assert.equal(config.gitHost, 'gh');
  assert.deepEqual(config.runtimes, ['claude', 'codex']);
});

test('init-prompts: tty re-asks on an invalid runtimes answer', async () => {
  const dir = await makeRepo({}, { git: true });

  const result = await run(['init'], {
    cwd: dir,
    isTTY: true,
    input: 'gh\nnotaruntime\nclaude\n',
  });

  assert.equal(result.code, 0);
  assert.match(result.stdout, /Invalid runtimes/);

  const config = await readConfigFile(dir);
  assert.deepEqual(config.runtimes, ['claude']);
});

test('init-prompts: ended input fails without writing config', async () => {
  const dir = await makeRepo({}, { git: true });
  const hostResult = await run(['init'], { cwd: dir, isTTY: true, input: '' });
  assert.equal(hostResult.code, 1);
  assert.match(hostResult.stderr, /input ended before --git-host was answered/);

  const result = await run(['init'], { cwd: dir, isTTY: true, input: 'gh\n' });

  assert.equal(result.code, 1);
  assert.match(result.stderr, /input ended before --runtimes was answered/);
  assert.equal(await configExists(dir), false);
});

// --- init-config ---

test('init-config: re-run reads .wolven-harness.json without prompting', {
  timeout: 5000,
}, async () => {
  const dir = await makeRepo(
    {
      '.wolven-harness.json': JSON.stringify({ version: 1, gitHost: 'bit', runtimes: ['codex'] }) + '\n',
    },
    { git: true },
  );

  // isTTY: true with no input — if the implementation tried to prompt it
  // would hang waiting on stdin; the bounded timeout above turns that
  // regression into a fast failure instead of hanging the whole run.
  const result = await run(['init'], { cwd: dir, isTTY: true, input: '' });

  assert.equal(result.code, 0);
  assert.doesNotMatch(result.stdout, /Git host/);
  assert.doesNotMatch(result.stdout, /Runtimes/);

  const config = await readConfigFile(dir);
  assert.equal(config.gitHost, 'bit');
  assert.deepEqual(config.runtimes, ['codex']);
});

test('init-config: a flag overrides the file default', async () => {
  const dir = await makeRepo(
    {
      '.wolven-harness.json': JSON.stringify({ version: 1, gitHost: 'bit', runtimes: ['codex'] }) + '\n',
    },
    { git: true },
  );

  const result = await run(['init', '--git-host', 'gh'], { cwd: dir, isTTY: false });

  assert.equal(result.code, 0);

  const config = await readConfigFile(dir);
  assert.equal(config.gitHost, 'gh');
  assert.deepEqual(config.runtimes, ['codex']);
});

test('init-config: a hand-added ignore key survives the re-run', async () => {
  const dir = await makeRepo(
    {
      '.wolven-harness.json':
        JSON.stringify({
          version: 1,
          gitHost: 'gh',
          runtimes: ['claude'],
          ignore: ['templates/**', 'test/**'],
        }) + '\n',
    },
    { git: true },
  );

  const result = await run(['init'], { cwd: dir, isTTY: false });

  assert.equal(result.code, 0);

  const config = await readConfigFile(dir);
  assert.deepEqual(config.ignore, ['templates/**', 'test/**']);
});

test('init-config: version is 1', async () => {
  const dir = await makeRepo({}, { git: true });

  const result = await run(['init', '--git-host', 'gh', '--runtimes', 'claude'], {
    cwd: dir,
    isTTY: false,
  });

  assert.equal(result.code, 0);

  const config = await readConfigFile(dir);
  assert.equal(config.version, 1);
});

test('init-config: invalid --git-host value exits 1 naming the flag', async () => {
  const dir = await makeRepo({}, { git: true });

  const result = await run(['init', '--git-host', 'bogus', '--runtimes', 'claude'], {
    cwd: dir,
    isTTY: false,
  });

  assert.equal(result.code, 1);
  assert.match(result.stderr, /--git-host/);
  assert.equal(await configExists(dir), false);
});

test('init-config: invalid --runtimes value exits 1 naming the flag', async () => {
  const dir = await makeRepo({}, { git: true });

  const result = await run(['init', '--git-host', 'gh', '--runtimes', 'not-a-runtime'], {
    cwd: dir,
    isTTY: false,
  });

  assert.equal(result.code, 1);
  assert.match(result.stderr, /--runtimes/);
  assert.equal(await configExists(dir), false);
});

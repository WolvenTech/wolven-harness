import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { makeRepo, run } from './helpers/fixture.js';

test('--help lists setup, validate, and comments', async () => {
  const dir = await makeRepo({});
  const result = await run(['--help'], { cwd: dir });

  assert.equal(result.code, 0);
  assert.match(result.stdout, /\bsetup\b/);
  assert.match(result.stdout, /\bvalidate\b/);
  assert.match(result.stdout, /\bcomments\b/);
});

test('no args prints usage listing setup, validate, and comments', async () => {
  const dir = await makeRepo({});
  const result = await run([], { cwd: dir });

  assert.equal(result.code, 0);
  assert.match(result.stdout, /\bsetup\b/);
  assert.match(result.stdout, /\bvalidate\b/);
  assert.match(result.stdout, /\bcomments\b/);
});

test('setup prints a summary and the harness-init next step', async () => {
  const dir = await makeRepo({}, { git: true });
  const result = await run(['setup', '--git-host', 'gh', '--runtimes', 'codex'], { cwd: dir });

  assert.equal(result.code, 0);
  assert.doesNotMatch(result.stderr, /step resolveOptions/);
  assert.match(result.stdout, /✔ .*skills.*in \.agents\//);
  assert.match(result.stdout, /Next steps:/);
  assert.match(result.stdout, /harness-init/);
});

test('validate exits 0', async () => {
  const dir = await makeRepo({}, { git: true });
  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 0);
  assert.match(result.stdout, /validate: ok/);
});

test('--version and -v print the package name and version', async () => {
  const dir = await makeRepo({});
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8')) as {
    version: string;
  };

  for (const flag of ['--version', '-v']) {
    const result = await run([flag], { cwd: dir });
    assert.equal(result.code, 0);
    assert.equal(result.stdout, `@wolven-tech/harness ${pkg.version}\n`);
  }
});

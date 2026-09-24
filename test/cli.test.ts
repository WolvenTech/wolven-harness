import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRepo, run } from './helpers/fixture.js';

test('--help lists init and validate', async () => {
  const dir = await makeRepo({});
  const result = await run(['--help'], { cwd: dir });

  assert.equal(result.code, 0);
  assert.match(result.stdout, /\binit\b/);
  assert.match(result.stdout, /\bvalidate\b/);
});

test('no args prints usage listing init and validate', async () => {
  const dir = await makeRepo({});
  const result = await run([], { cwd: dir });

  assert.equal(result.code, 0);
  assert.match(result.stdout, /\binit\b/);
  assert.match(result.stdout, /\bvalidate\b/);
});

test('unknown command exits 1', async () => {
  const dir = await makeRepo({});
  const result = await run(['bogus'], { cwd: dir });

  assert.equal(result.code, 1);
  assert.match(result.stderr, /unknown command/);
});

test('init runs its steps in order and prints the harness-init closing line', async () => {
  const dir = await makeRepo({}, { git: true });
  const result = await run(['init', '--git-host', 'gh', '--runtimes', 'codex'], { cwd: dir });

  assert.equal(result.code, 0);

  const order = ['resolveOptions', 'applyTemplates', 'wireRuntimes', 'addValidateScript'];
  const positions = order.map((name) => result.stderr.indexOf(`step ${name}`));
  for (const [i, pos] of positions.entries()) {
    assert.ok(pos >= 0, `step trace for ${order[i]} present`);
  }
  for (let i = 1; i < positions.length; i++) {
    assert.ok(positions[i] > positions[i - 1], `${order[i]} runs after ${order[i - 1]}`);
  }

  assert.match(result.stdout, /created:/);
  assert.match(result.stdout, /skipped \(exists\):/);
  assert.match(result.stdout, /harness-init/);
});

test('validate exits 0', async () => {
  const dir = await makeRepo({}, { git: true });
  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 0);
  assert.match(result.stdout, /validate: ok/);
});

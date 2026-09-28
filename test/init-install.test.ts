import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeRepo, run } from './helpers/fixture.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');

async function ownPackageVersion(): Promise<string> {
  const raw = await readFile(path.join(repoRoot, 'package.json'), 'utf8');
  return (JSON.parse(raw) as { version: string }).version;
}

async function readConfigFile(dir: string): Promise<Record<string, unknown>> {
  const raw = await readFile(path.join(dir, '.wolven-harness.json'), 'utf8');
  return JSON.parse(raw) as Record<string, unknown>;
}

async function readPackageFile(dir: string): Promise<Record<string, unknown>> {
  const raw = await readFile(path.join(dir, 'package.json'), 'utf8');
  return JSON.parse(raw) as Record<string, unknown>;
}

test('init-devdep: warns when package.json exists without the dep in devDependencies', async () => {
  const pkg = { name: 'consumer', version: '1.0.0' };
  const dir = await makeRepo({ 'package.json': `${JSON.stringify(pkg, null, 2)}\n` }, { git: true });

  const result = await run(['init', '--git-host', 'gh', '--runtimes', 'claude'], { cwd: dir });

  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stderr, /@wolventech\/wolven-harness/);
  assert.match(result.stderr, /pnpm add -D @wolventech\/wolven-harness/);

  // why: addValidateScript also touches package.json (adds scripts) — only
  // devDependencies must stay untouched by this step.
  const after = await readPackageFile(dir);
  assert.equal(after.devDependencies, undefined);
});

test('init-devdep: no warning when the dep is already in devDependencies', async () => {
  const pkg = {
    name: 'consumer',
    version: '1.0.0',
    devDependencies: { '@wolventech/wolven-harness': '^0.1.0' },
  };
  const dir = await makeRepo({ 'package.json': `${JSON.stringify(pkg, null, 2)}\n` }, { git: true });

  const result = await run(['init', '--git-host', 'gh', '--runtimes', 'claude'], { cwd: dir });

  assert.equal(result.code, 0, result.stderr);
  assert.doesNotMatch(result.stderr, /@wolventech\/wolven-harness/);
});

test('init-devdep: no warning without a package.json', async () => {
  const dir = await makeRepo({}, { git: true });

  const result = await run(['init', '--git-host', 'gh', '--runtimes', 'claude'], { cwd: dir });

  assert.equal(result.code, 0, result.stderr);
  assert.doesNotMatch(result.stderr, /@wolventech\/wolven-harness/);
});

test('init-config: a fresh run writes this package\'s own version as packageVersion', async () => {
  const dir = await makeRepo({}, { git: true });

  const result = await run(['init', '--git-host', 'gh', '--runtimes', 'claude'], { cwd: dir });

  assert.equal(result.code, 0, result.stderr);

  const config = await readConfigFile(dir);
  assert.equal(config.packageVersion, await ownPackageVersion());
});

test('init-config: comments, ignore, and an unknown key survive a re-run unchanged apart from packageVersion', async () => {
  const existing = {
    version: 1,
    gitHost: 'gh',
    runtimes: ['claude'],
    ignore: ['templates/**', 'test/**'],
    comments: { paths: ['src/**'] },
    someUnknownKey: { nested: [1, 2, 3] },
  };
  const dir = await makeRepo(
    { '.wolven-harness.json': `${JSON.stringify(existing)}\n` },
    { git: true },
  );

  const result = await run(['init'], { cwd: dir, isTTY: false });

  assert.equal(result.code, 0, result.stderr);

  const config = await readConfigFile(dir);
  const { packageVersion, ...rest } = config;

  assert.equal(packageVersion, await ownPackageVersion());
  assert.deepEqual(rest, existing);
});

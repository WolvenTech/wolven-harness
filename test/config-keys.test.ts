import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { CONFIG_FILENAME, readConfig, writeConfig } from '../src/setup/config.js';
import { SetupError } from '../src/setup/types.js';
import { makeRepo, run } from './helpers/fixture.js';

const BASE = { version: 1, gitHost: 'gh', runtimes: ['claude'] };

/** A fixture whose config file holds `BASE` merged with `extra`. */
async function writeConfigFile(extra: Record<string, unknown>): Promise<string> {
  return makeRepo({ [CONFIG_FILENAME]: JSON.stringify({ ...BASE, ...extra }, null, 2) });
}

/** The config file's parsed JSON, as written. */
async function readConfigFile(root: string): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(path.join(root, CONFIG_FILENAME), 'utf8')) as Record<string, unknown>;
}

/** Asserts that reading a config with `extra` fails with a `SetupError` naming `key`. */
async function rejectsNamingKey(extra: Record<string, unknown>, key: string): Promise<void> {
  const dir = await writeConfigFile(extra);
  await assert.rejects(readConfig(dir), (err: unknown) => {
    assert.ok(err instanceof SetupError, `expected SetupError, got ${String(err)}`);
    assert.match((err as Error).message, new RegExp(`"${key}"`), `message names "${key}": ${(err as Error).message}`);
    return true;
  });
}

test('config-keys: every optional key survives read -> write -> read', async () => {
  const original = {
    ...BASE,
    packageManager: 'yarn',
    layout: 'home',
    codeRepo: '../app',
    commitConvention: { style: 'pattern', pattern: '^[A-Z]+-\\d+: ', example: 'ABC-1: add a check' },
  };
  const dir = await makeRepo({ [CONFIG_FILENAME]: JSON.stringify(original, null, 2) });

  const config = await readConfig(dir);
  assert.ok(config);
  assert.equal(config.packageManager, 'yarn');
  assert.equal(config.layout, 'home');
  assert.equal(config.codeRepo, '../app');
  assert.deepEqual(config.commitConvention, original.commitConvention);

  await writeConfig(dir, config);
  assert.deepEqual(await readConfigFile(dir), original);
});

test('config-keys: new keys append after the existing ones in contract order', async () => {
  const dir = await writeConfigFile({});
  const config = await readConfig(dir);
  assert.ok(config);

  await writeConfig(dir, {
    ...config,
    packageManager: 'pnpm',
    layout: 'home',
    codeRepo: 'app',
    commitConvention: { style: 'conventional' },
  });

  assert.deepEqual(Object.keys(await readConfigFile(dir)), [
    'version',
    'gitHost',
    'runtimes',
    'packageManager',
    'layout',
    'codeRepo',
    'commitConvention',
  ]);
});

test('config-keys: packageManager accepts npm, yarn, pnpm and none', async () => {
  for (const packageManager of ['npm', 'yarn', 'pnpm', 'none']) {
    const dir = await writeConfigFile({ packageManager });
    const config = await readConfig(dir);
    assert.ok(config);
    assert.equal(config.packageManager, packageManager);
  }
});

test('config-keys: an unknown packageManager names the key', async () => {
  await rejectsNamingKey({ packageManager: 'cargo' }, 'packageManager');
});

test('config-keys: only the home layout is accepted', async () => {
  assert.equal((await readConfig(await writeConfigFile({ layout: 'home' })))?.layout, 'home');
  await rejectsNamingKey({ layout: 'linked' }, 'layout');
  await rejectsNamingKey({ layout: 'elsewhere' }, 'layout');
  await rejectsNamingKey({ harnessHome: '..' }, 'harnessHome');
});

test('config-keys: codeRepo is a non-empty relative path', async () => {
  for (const codeRepo of ['app', '../app', 'apps/client']) {
    const config = await readConfig(await writeConfigFile({ codeRepo }));
    assert.equal(config?.codeRepo, codeRepo);
  }

  await rejectsNamingKey({ codeRepo: '' }, 'codeRepo');
  await rejectsNamingKey({ codeRepo: '/absolute/path' }, 'codeRepo');
  await rejectsNamingKey({ codeRepo: 3 }, 'codeRepo');
});

test('config-keys: commitConvention accepts both contract shapes', async () => {
  const conventional = await readConfig(await writeConfigFile({ commitConvention: { style: 'conventional' } }));
  assert.deepEqual(conventional?.commitConvention, { style: 'conventional' });

  const pattern = { style: 'pattern', pattern: '^[A-Z]+-\\d+: ', example: 'ABC-1: add a check' };
  const withPattern = await readConfig(await writeConfigFile({ commitConvention: pattern }));
  assert.deepEqual(withPattern?.commitConvention, pattern);
});

test('config-keys: a bad commitConvention names the key', async () => {
  await rejectsNamingKey({ commitConvention: 'conventional' }, 'commitConvention');
  await rejectsNamingKey({ commitConvention: null }, 'commitConvention');
  await rejectsNamingKey({ commitConvention: [] }, 'commitConvention');
  await rejectsNamingKey({ commitConvention: { style: 'semantic' } }, 'commitConvention');
  await rejectsNamingKey({ commitConvention: { style: 'pattern', example: 'ABC-1: x' } }, 'commitConvention');
  await rejectsNamingKey({ commitConvention: { style: 'pattern', pattern: '[' } }, 'commitConvention');
  await rejectsNamingKey({ commitConvention: { style: 'pattern', pattern: '^x', example: 3 } }, 'commitConvention');
});

test('config-keys: a config without the new keys still loads and rewrites unchanged', async () => {
  const dir = await writeConfigFile({});

  const config = await readConfig(dir);
  assert.ok(config);
  assert.equal(config.version, 1);
  assert.equal(config.packageManager, undefined);
  assert.equal(config.layout, undefined);
  assert.equal(config.codeRepo, undefined);
  assert.equal(config.commitConvention, undefined);

  await writeConfig(dir, config);
  assert.deepEqual(await readConfigFile(dir), BASE);
});

test('config-keys: unknown keys and file order survive a rewrite that adds a new key', async () => {
  const original = { version: 1, gitHost: 'bit', vendorKey: { nested: [1, 2] }, runtimes: ['codex'] };
  const dir = await makeRepo({ [CONFIG_FILENAME]: JSON.stringify(original, null, 2) });
  const config = await readConfig(dir);
  assert.ok(config);

  await writeConfig(dir, { ...config, packageManager: 'npm' });

  const rewritten = await readConfigFile(dir);
  assert.deepEqual(rewritten.vendorKey, { nested: [1, 2] });
  assert.deepEqual(Object.keys(rewritten), ['version', 'gitHost', 'vendorKey', 'runtimes', 'packageManager']);
});

test('config-keys: setup exits 1 naming a bad config key', async () => {
  const dir = await makeRepo(
    { [CONFIG_FILENAME]: JSON.stringify({ ...BASE, packageManager: 'cargo' }, null, 2) },
    { git: true },
  );

  const result = await run(['setup', '--git-host', 'gh', '--runtimes', 'claude'], { cwd: dir });

  assert.equal(result.code, 1);
  assert.match(result.stderr, /"packageManager"/);
});

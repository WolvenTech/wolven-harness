import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { runSetup } from '../src/setup/index.js';
import { runValidate } from '../src/validate/index.js';
import { makeRepo } from './helpers/fixture.js';
import { makeIo } from './helpers/io.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const flags = ['--git-host', 'gh', '--runtimes', 'claude', '--skills', 'none'];
const row =
  'Want git to track the whole harness? Follow the uninstall steps, but keep `.wolven-harness.json`. In that file, set `layout` to `home` and remove `harnessHome`, then run `wolven-harness setup`.';

test('proof-iter1-guides: the Full install guide row is in the layout and install pages', async () => {
  for (const page of ['site/layout.md', 'site/install.md']) {
    const text = (await readFile(path.join(repoRoot, page), 'utf8')).replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
    assert.ok(text.includes(row), page);
  }
});

test('proof-iter1-switch-cut: the guide route turns a quiet install into a validating full install', async () => {
  const root = await makeRepo(
    { 'package.json': '{"name":"smoke","private":true}\n', '.gitignore': 'node_modules/\n' },
    { git: true },
  );
  assert.equal(await runSetup(flags, makeIo(root)), 0);
  assert.ok(existsSync(path.join(root, '.wolven-harness')));

  for (const rel of ['.wolven-harness', '.claude', '.agents', '.qmd', 'CLAUDE.local.md']) {
    await rm(path.join(root, rel), { recursive: true, force: true });
  }
  const configPath = path.join(root, '.wolven-harness.json');
  const config = JSON.parse(await readFile(configPath, 'utf8')) as Record<string, unknown>;
  config.layout = 'home';
  delete config.harnessHome;
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');

  assert.equal(await runSetup(flags, makeIo(root)), 0);
  assert.ok(existsSync(path.join(root, 'docs', 'adrs')));
  assert.ok(existsSync(path.join(root, '.agents', 'skills')));
  assert.equal(existsSync(path.join(root, '.wolven-harness')), false);
  assert.equal(await runValidate([], makeIo(root)), 0);
});

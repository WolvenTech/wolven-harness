import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { runDriftChecks } from '../src/doctor/drift.js';
import type { DoctorContext } from '../src/doctor/index.js';
import { readConfig } from '../src/setup/config.js';
import { runSetup } from '../src/setup/index.js';
import { makeRepo } from './helpers/fixture.js';
import { makeIo } from './helpers/io.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const templatesDir = path.join(repoRoot, 'templates');
const flags = ['--git-host', 'gh', '--runtimes', 'claude', '--skills', 'none'];

async function quietInstall(): Promise<{ root: string; home: string; ctx: DoctorContext }> {
  const root = await makeRepo({ 'AGENTS.md': 'Client instructions.\n' }, { git: true });
  await mkdir(path.join(root, 'docs'));
  await writeFile(path.join(root, 'docs', 'client.md'), '# Client\n', 'utf8');
  assert.equal(await runSetup(flags, makeIo(root)), 0);
  const config = await readConfig(root);
  assert.ok(config);
  const own = JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8')) as { version: string };
  const home = path.join(root, '.wolven-harness');
  return { root, home, ctx: { root, harnessHome: home, config, env: {}, templatesDir, packageVersion: own.version } };
}

test('proof-iter1-rules-mapped: installed rules name home paths and drift stays silent', async () => {
  const { home, ctx } = await quietInstall();
  const yagni = await readFile(path.join(home, '.agents/rules/yagni-strict.md'), 'utf8');
  const qmdFirst = await readFile(path.join(home, '.agents/rules/qmd-first.md'), 'utf8');
  assert.ok(yagni.includes('.wolven-harness/docs/deferrals/'));
  assert.ok(qmdFirst.includes('.wolven-harness/docs/'));
  assert.doesNotMatch(yagni, /(^|[\s`'"(])docs\//m);
  assert.doesNotMatch(qmdFirst, /(^|[\s`'"(])docs\//m);
  assert.deepEqual(await runDriftChecks(ctx), []);
});

test('proof-iter1-qmd-paths: collections resolve under the home docs and skip a client docs/', async () => {
  const { root, home, ctx } = await quietInstall();
  const index = parse(await readFile(path.join(home, '.qmd/index.yml'), 'utf8')) as {
    collections: Record<string, { path: string }>;
  };
  const resolved = Object.values(index.collections).map((collection) => path.resolve(root, collection.path));
  assert.ok(resolved.length > 0);
  for (const dir of resolved) {
    assert.ok(dir.startsWith(`${path.join(root, '.wolven-harness', 'docs')}${path.sep}`), dir);
    assert.notEqual(dir.startsWith(`${path.join(root, 'docs')}${path.sep}`), true);
  }
  assert.ok(existsSync(path.join(root, 'docs', 'client.md')));
  assert.deepEqual(await runDriftChecks(ctx), []);
});

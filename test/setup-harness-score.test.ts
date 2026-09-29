import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { HARNESS_SCORE_VERSION } from '../src/setup/harness-score.js';
import { makeRepo, run } from './helpers/fixture.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');

function packageJson(extra: Record<string, unknown> = {}): string {
  return `${JSON.stringify({ name: 'consumer', version: '1.0.0', ...extra }, null, 2)}\n`;
}

test('harness-score: the version setup recommends is the one this repo pins', async () => {
  const pkg = JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8'));
  assert.equal(pkg.devDependencies['harness-score'], HARNESS_SCORE_VERSION);
});

test('harness-score: the starter config drops nothing', async () => {
  const raw = await readFile(path.join(repoRoot, 'templates', '.harness-score.json'), 'utf8');
  assert.deepEqual(JSON.parse(raw), { rules: {} });
});

test('harness-score: setup warns with the pinned install command and leaves dependencies alone', async () => {
  const dir = await makeRepo({ 'package.json': packageJson() }, { git: true });

  const result = await run(['setup', '--git-host', 'gh', '--runtimes', 'claude'], { cwd: dir });

  assert.equal(result.code, 0, result.stderr);
  assert.ok(
    result.stderr.includes(`pnpm add -D -E harness-score@${HARNESS_SCORE_VERSION}`),
    'prints the pinned install command',
  );
  const pkg = JSON.parse(await readFile(path.join(dir, 'package.json'), 'utf8'));
  assert.equal(pkg.devDependencies, undefined);
  assert.equal(pkg.scripts['harness:score'], 'harness-score');
});

test('harness-score: no warning when harness-score is already a dependency', async () => {
  const dir = await makeRepo(
    { 'package.json': packageJson({ devDependencies: { 'harness-score': '1.0.0' } }) },
    { git: true },
  );

  const result = await run(['setup', '--git-host', 'gh', '--runtimes', 'claude'], { cwd: dir });

  assert.equal(result.code, 0, result.stderr);
  assert.doesNotMatch(result.stderr, /harness-score is not in your dependencies/);
});

test('harness-score: no package.json means no warning and no script', async () => {
  const dir = await makeRepo({}, { git: true });

  const result = await run(['setup', '--git-host', 'gh', '--runtimes', 'claude'], { cwd: dir });

  assert.equal(result.code, 0, result.stderr);
  assert.doesNotMatch(result.stderr, /harness-score is not in your dependencies/);
  assert.ok(result.stdout.includes(`pnpm dlx harness-score@${HARNESS_SCORE_VERSION}`), 'pins the dlx version');
});

test('harness-score: an existing .harness-score.json is kept', async () => {
  const mine = '{\n  "extends": ["no-hooks"]\n}\n';
  const dir = await makeRepo({ '.harness-score.json': mine }, { git: true });

  const result = await run(['setup', '--git-host', 'gh', '--runtimes', 'claude'], { cwd: dir });

  assert.equal(result.code, 0, result.stderr);
  assert.equal(await readFile(path.join(dir, '.harness-score.json'), 'utf8'), mine);
});

test('harness-score: a kept harness:score script that runs something else gets no warning', async () => {
  const dir = await makeRepo(
    { 'package.json': packageJson({ scripts: { 'harness:score': 'node scripts/score.js' } }) },
    { git: true },
  );

  const result = await run(['setup', '--git-host', 'gh', '--runtimes', 'claude'], { cwd: dir });

  assert.equal(result.code, 0, result.stderr);
  assert.doesNotMatch(result.stderr, /harness-score is not in your dependencies/);
  const pkg = JSON.parse(await readFile(path.join(dir, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts['harness:score'], 'node scripts/score.js');
});

test('harness-score: the harness-init reference names the pinned version its check IDs come from', async () => {
  const ref = await readFile(
    path.join(repoRoot, 'templates', '.agents', 'skills', 'harness-init', 'references', 'harness-score.md'),
    'utf8',
  );
  assert.ok(ref.includes(`harness-score ${HARNESS_SCORE_VERSION}`), 'bumping the pin means re-checking the reference');
});

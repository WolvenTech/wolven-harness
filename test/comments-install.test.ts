import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PassThrough } from 'node:stream';
import { makeRepo, run } from './helpers/fixture.js';
import { renderWolven } from '../src/init/render-wolven.js';
import type { Context, Io } from '../src/init/types.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const repoTemplatesDir = path.join(repoRoot, 'templates');

function makeIo(cwd: string): Io {
  return {
    cwd,
    stdin: new PassThrough(),
    stdout: new PassThrough(),
    stderr: new PassThrough(),
    isTTY: false,
  };
}

async function freshFixture(): Promise<string> {
  return makeRepo(
    { 'package.json': `${JSON.stringify({ name: 'consumer', version: '1.0.0' }, null, 2)}\n` },
    { git: true },
  );
}

test('comments-install: init adds exactly harness:validate and harness:comments, and a re-run adds nothing', async () => {
  const dir = await freshFixture();

  const first = await run(['init', '--git-host', 'gh', '--runtimes', 'claude'], { cwd: dir });
  assert.equal(first.code, 0, first.stderr);

  const pkg = JSON.parse(await readFile(path.join(dir, 'package.json'), 'utf8'));
  assert.deepEqual(Object.keys(pkg.scripts).sort(), ['harness:comments', 'harness:validate']);
  assert.equal(pkg.scripts['harness:validate'], 'wolven-harness validate');
  assert.equal(pkg.scripts['harness:comments'], 'wolven-harness comments');

  const afterFirst = await readFile(path.join(dir, 'package.json'), 'utf8');

  const second = await run(['init', '--git-host', 'gh', '--runtimes', 'claude'], { cwd: dir });
  assert.equal(second.code, 0, second.stderr);
  assert.doesNotMatch(second.stdout.split('skipped (exists):')[0] ?? '', /package\.json#scripts/);
  assert.match(second.stdout, /skipped \(exists\):[\s\S]*package\.json#scripts\.harness:validate/);
  assert.match(second.stdout, /skipped \(exists\):[\s\S]*package\.json#scripts\.harness:comments/);

  const afterSecond = await readFile(path.join(dir, 'package.json'), 'utf8');
  assert.equal(afterSecond, afterFirst, 'second run leaves package.json byte-identical');
});

test('comments-install: rule file is created with the style hints and names the command', async () => {
  const dir = await freshFixture();

  const result = await run(['init', '--git-host', 'gh', '--runtimes', 'claude'], { cwd: dir });
  assert.equal(result.code, 0, result.stderr);

  const rule = await readFile(path.join(dir, '.agents/rules/comments.md'), 'utf8');

  assert.match(rule, /why/i, 'explains why, not what');
  assert.match(rule, /`why:`/, 'names the why: tag');
  assert.match(rule, /`hazard:`/, 'names the hazard: tag');
  assert.match(rule, /`invariant:`/, 'names the invariant: tag');
  assert.match(rule, /better name/i, 'prefers a better name to a comment');
  assert.match(rule, /four lines/i, 'states the length limit');
  assert.match(rule, /narrate the change/i, 'forbids change narration');
  assert.match(rule, /ticket or requirement id/i, 'forbids planning ids, described generically');
  assert.match(rule, /wolven-harness comments/, 'names the command');
  assert.match(rule, /harness:comments/, 'names the installed script');
});

test('comments-install: WOLVEN.md cites .agents/rules/comments.md under Standing rules', async () => {
  const ctx: Context = { root: '/unused', templatesDir: repoTemplatesDir, io: makeIo('/unused') };
  const rendered = await renderWolven(ctx);

  const section = rendered.split('## Standing rules')[1]?.split('\n## ')[0] ?? '';
  assert.match(section, /\.agents\/rules\/comments\.md/);
});

test('comments-install: validate (spine included) passes on the fixture', async () => {
  const dir = await freshFixture();

  const initResult = await run(['init', '--git-host', 'gh', '--runtimes', 'claude'], { cwd: dir });
  assert.equal(initResult.code, 0, initResult.stderr);

  const validateResult = await run(['validate'], { cwd: dir });

  assert.equal(validateResult.code, 0, validateResult.stdout + validateResult.stderr);
  assert.doesNotMatch(validateResult.stdout, /rule-missing/);
});

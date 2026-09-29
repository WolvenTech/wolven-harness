import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import path from 'node:path';
import { makeRepo, run } from './helpers/fixture.js';

const execFileAsync = promisify(execFile);
const ARGS = ['init', '--git-host', 'gh', '--runtimes', 'codex'];

test('init-qmd-ignore: a fresh init writes .qmd/.gitignore and git ignores the local index', async () => {
  const dir = await makeRepo({}, { git: true });

  const result = await run(ARGS, { cwd: dir });

  assert.equal(result.code, 0, result.stderr);
  assert.equal(await readFile(path.join(dir, '.qmd/.gitignore'), 'utf8'), 'index.sqlite*\n');
  assert.match(result.stdout, /✔ \.qmd\/index\.yml \(search index config\) and \.qmd\/\.gitignore/);
  for (const name of ['index.sqlite', 'index.sqlite-wal', 'index.sqlite-shm']) {
    const check = await execFileAsync('git', ['check-ignore', `.qmd/${name}`], { cwd: dir });
    assert.equal(check.stdout.trim(), `.qmd/${name}`);
  }
  await assert.rejects(execFileAsync('git', ['check-ignore', '.qmd/index.yml'], { cwd: dir }));
});

test('init-qmd-ignore: an existing .qmd/.gitignore is kept and reported as kept', async () => {
  const dir = await makeRepo({ '.qmd/.gitignore': 'mine\n' }, { git: true });

  const result = await run(ARGS, { cwd: dir });

  assert.equal(result.code, 0, result.stderr);
  assert.equal(await readFile(path.join(dir, '.qmd/.gitignore'), 'utf8'), 'mine\n');
  assert.match(result.stdout, /kept your existing \.qmd\/\.gitignore/);
});

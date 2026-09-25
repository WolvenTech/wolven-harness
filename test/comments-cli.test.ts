import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { makeRepo, run } from './helpers/fixture.js';

const execFileAsync = promisify(execFile);

async function headSha(dir: string): Promise<string> {
  const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: dir });
  return stdout.trim();
}

async function putFile(dir: string, rel: string, lines: string[]): Promise<void> {
  const full = path.join(dir, rel);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, `${lines.join('\n')}\n`, 'utf8');
}

test('comments-cli: a non-git directory exits 1', async () => {
  const dir = await makeRepo({ 'src/a.ts': 'export const a = 1;\n' });
  const result = await run(['comments'], { cwd: dir });

  assert.equal(result.code, 1);
});

test('comments-cli: a repo with no origin or main exits 1 naming --base', async () => {
  const dir = await makeRepo({ 'src/a.ts': 'export const a = 1;\n' }, { git: true });
  await execFileAsync('git', ['branch', '-m', 'not-main'], { cwd: dir });

  const result = await run(['comments'], { cwd: dir });

  assert.equal(result.code, 1);
  assert.match(result.stderr, /--base/);
});

test('comments-cli: a clean branch exits 0 with the ok line', async () => {
  const dir = await makeRepo({ 'src/a.ts': 'export const a = 1;\n' }, { git: true });
  await execFileAsync('git', ['branch', '-m', 'main'], { cwd: dir });

  const result = await run(['comments'], { cwd: dir });

  assert.equal(result.code, 0);
  assert.match(result.stdout, /comments: ok \(0 findings\)/);
});

test('comments-cli: prints one finding line then the finding-count summary', async () => {
  const dir = await makeRepo({ 'src/a.ts': ['export const a = 1;', ''].join('\n') }, { git: true });
  const base = await headSha(dir);
  await putFile(dir, 'src/a.ts', ['export const a = 1;', '', '// fix bug', 'export const b = 2;']);

  const result = await run(['comments', '--base', base], { cwd: dir });

  assert.equal(result.code, 1);
  assert.match(result.stdout, /^src\/a\.ts:3: \[untagged\] undeclared comment added since the base$/m);
  assert.match(result.stdout, /^comments: 1 finding\(s\)$/m);
});

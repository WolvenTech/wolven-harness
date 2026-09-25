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

function config(extra: Record<string, unknown>): string {
  return JSON.stringify({ version: 1, gitHost: 'gh', runtimes: ['codex'], ...extra }, null, 2);
}

test('comments-config: an untagged # comment in .py is ignored by default and counted as skipped', async () => {
  const dir = await makeRepo({ 'src/a.py': 'a = 1\n' }, { git: true });
  const base = await headSha(dir);
  await putFile(dir, 'src/a.py', ['a = 1', '# fix bug', 'b = 2']);

  const result = await run(['comments', '--base', base], { cwd: dir });

  assert.equal(result.code, 0, result.stdout);
  assert.match(result.stdout, /^comments: ok \(0 findings, 1 skipped: no syntax\)$/m);
});

test('comments-config: a file under an ignore dir is not judged', async () => {
  const dir = await makeRepo(
    {
      '.wolven-harness.json': config({ ignore: ['vendor/**'] }),
      'vendor/a.ts': 'export const a = 1;\n',
      'src/a.ts': 'export const a = 1;\n',
    },
    { git: true },
  );
  const base = await headSha(dir);
  await putFile(dir, 'vendor/a.ts', ['export const a = 1;', '// fix bug', 'export const b = 2;']);

  const result = await run(['comments', '--base', base], { cwd: dir });

  assert.equal(result.code, 0, result.stdout);
  assert.match(result.stdout, /^comments: ok \(0 findings\)$/m);
});

test('comments-config: comments.paths ["src"] skips lib/', async () => {
  const dir = await makeRepo(
    {
      '.wolven-harness.json': config({ comments: { paths: ['src'] } }),
      'src/a.ts': 'export const a = 1;\n',
      'lib/b.ts': 'export const b = 1;\n',
    },
    { git: true },
  );
  const base = await headSha(dir);
  await putFile(dir, 'src/a.ts', ['export const a = 1;', '// fix bug', 'export const c = 2;']);
  await putFile(dir, 'lib/b.ts', ['export const b = 1;', '// fix bug', 'export const d = 2;']);

  const result = await run(['comments', '--base', base], { cwd: dir });

  assert.equal(result.code, 1, result.stdout);
  assert.match(result.stdout, /^src\/a\.ts:2: \[untagged\]/m);
  assert.ok(!result.stdout.includes('lib/b.ts'), result.stdout);
  assert.match(result.stdout, /^comments: 1 finding\(s\)$/m);
});

test('comments-config: comments.paths judges a dir that ignore hides', async () => {
  const dir = await makeRepo(
    {
      '.wolven-harness.json': config({ ignore: ['test/**'], comments: { paths: ['src', 'test'] } }),
      'test/a.test.ts': 'export const a = 1;\n',
    },
    { git: true },
  );
  const base = await headSha(dir);
  await putFile(dir, 'test/a.test.ts', ['export const a = 1;', '// fix bug', 'export const c = 2;']);

  const result = await run(['comments', '--base', base], { cwd: dir });

  assert.equal(result.code, 1, result.stdout);
  assert.match(result.stdout, /^test\/a\.test\.ts:2: \[untagged\]/m);
});

test('comments-config: an untagged # comment in .py is flagged once .py maps to "#"', async () => {
  const dir = await makeRepo(
    {
      '.wolven-harness.json': config({ comments: { languages: { '.py': { line: '#' } } } }),
      'src/a.py': 'a = 1\n',
    },
    { git: true },
  );
  const base = await headSha(dir);
  await putFile(dir, 'src/a.py', ['a = 1', '# fix bug', 'b = 2']);

  const result = await run(['comments', '--base', base], { cwd: dir });

  assert.equal(result.code, 1, result.stdout);
  assert.match(result.stdout, /^src\/a\.py:2: \[untagged\] undeclared comment added since the base$/m);
  assert.match(result.stdout, /^comments: 1 finding\(s\)$/m);
});

test('comments-config: a /** */ block in a configured language gets no JSDoc exemption', async () => {
  const dir = await makeRepo(
    {
      '.wolven-harness.json': config({
        comments: { languages: { '.py': { line: '#', block: ['/**', '*/'] } } },
      }),
      'src/a.py': ['a = 1', ''].join('\n'),
    },
    { git: true },
  );
  const base = await headSha(dir);
  await putFile(dir, 'src/a.py', [
    'a = 1',
    '',
    '/**',
    ' * Formats the given amount as a two-decimal currency string for display.',
    ' */',
    'export function formatAmount(n) {',
    '  return n;',
    '}',
  ]);

  const result = await run(['comments', '--base', base], { cwd: dir });

  assert.equal(result.code, 1, result.stdout);
  assert.match(result.stdout, /^src\/a\.py:3: \[untagged\] undeclared comment added since the base$/m);
});

test('comments-config: languages: {".py": {}} exits 1 naming comments.languages', async () => {
  const dir = await makeRepo(
    { '.wolven-harness.json': config({ comments: { languages: { '.py': {} } } }) },
    { git: true },
  );
  await execFileAsync('git', ['branch', '-m', 'main'], { cwd: dir });

  const result = await run(['comments'], { cwd: dir });

  assert.equal(result.code, 1);
  assert.match(result.stderr, /comments\.languages/);
  assert.match(result.stderr, /\.py/);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { makeRepo } from './helpers/fixture.js';
import { findCommentFindings } from '../src/comments/index.js';

const execFileAsync = promisify(execFile);

async function headSha(dir: string): Promise<string> {
  const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: dir });
  return stdout.trim();
}

async function setupRepo(initialFiles: Record<string, string>): Promise<{ dir: string; base: string }> {
  const dir = await makeRepo(initialFiles, { git: true });
  const base = await headSha(dir);
  return { dir, base };
}

async function putFile(dir: string, rel: string, lines: string[]): Promise<void> {
  const full = path.join(dir, rel);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, `${lines.join('\n')}\n`, 'utf8');
}

test('comments-rules: flags an untagged // comment', async () => {
  const { dir, base } = await setupRepo({ 'src/a.ts': ['export const a = 1;', ''].join('\n') });
  await putFile(dir, 'src/a.ts', ['export const a = 1;', '', '// fix bug', 'export const b = 2;']);

  const hits = await findCommentFindings({ root: dir, base });

  assert.equal(hits.length, 1);
  assert.equal(hits[0]?.kind, 'untagged');
  assert.equal(hits[0]?.file, 'src/a.ts');
});

test('comments-rules: flags a tagged comment over 4 lines', async () => {
  const { dir, base } = await setupRepo({ 'src/b.ts': ['export const a = 1;', ''].join('\n') });
  await putFile(dir, 'src/b.ts', [
    'export const a = 1;',
    '',
    '// why: this guard exists because',
    '// the lock must be released',
    '// before another caller can',
    '// acquire it again safely',
    '// otherwise deadlock follows',
    'export const b = 2;',
  ]);

  const hits = await findCommentFindings({ root: dir, base });

  assert.equal(hits.length, 1);
  assert.equal(hits[0]?.kind, 'over-length');
});

test('comments-rules: flags change-narration', async () => {
  const { dir, base } = await setupRepo({ 'src/c.ts': ['export const a = 1;', ''].join('\n') });
  await putFile(dir, 'src/c.ts', [
    'export const a = 1;',
    '',
    '// why: previously returned null when unset',
    'export const b = 2;',
  ]);

  const hits = await findCommentFindings({ root: dir, base });

  assert.equal(hits.length, 1);
  assert.equal(hits[0]?.kind, 'change-narration');
});

test('comments-rules: flags a dead citation', async () => {
  const { dir, base } = await setupRepo({ 'src/d.ts': ['export const a = 1;', ''].join('\n') });
  await putFile(dir, 'src/d.ts', [
    'export const a = 1;',
    '',
    '// why: per decision #3 skip validation',
    'export const b = 2;',
  ]);

  const hits = await findCommentFindings({ root: dir, base });

  assert.equal(hits.length, 1);
  assert.equal(hits[0]?.kind, 'dead-citation');
});

test('comments-rules: flags a planning id shaped like R3.1', async () => {
  const { dir, base } = await setupRepo({ 'src/e.ts': ['export const a = 1;', ''].join('\n') });
  await putFile(dir, 'src/e.ts', [
    'export const a = 1;',
    '',
    '// why: implements R3.1 exactly',
    'export const b = 2;',
  ]);

  const hits = await findCommentFindings({ root: dir, base });

  assert.equal(hits.length, 1);
  assert.equal(hits[0]?.kind, 'planning-id');
});

test('comments-rules: flags a planning id shaped like S1', async () => {
  const { dir, base } = await setupRepo({ 'src/f.ts': ['export const a = 1;', ''].join('\n') });
  await putFile(dir, 'src/f.ts', [
    'export const a = 1;',
    '',
    '// why: matches S1 decision shape',
    'export const b = 2;',
  ]);

  const hits = await findCommentFindings({ root: dir, base });

  assert.equal(hits.length, 1);
  assert.equal(hits[0]?.kind, 'planning-id');
});

test('comments-rules: flags a planning id shaped like proof-x', async () => {
  const { dir, base } = await setupRepo({ 'src/g.ts': ['export const a = 1;', ''].join('\n') });
  await putFile(dir, 'src/g.ts', [
    'export const a = 1;',
    '',
    '// why: proof-x covers this branch',
    'export const b = 2;',
  ]);

  const hits = await findCommentFindings({ root: dir, base });

  assert.equal(hits.length, 1);
  assert.equal(hits[0]?.kind, 'planning-id');
});

test('comments-rules: flags a planning id shaped like unit 08', async () => {
  const { dir, base } = await setupRepo({ 'src/h.ts': ['export const a = 1;', ''].join('\n') });
  await putFile(dir, 'src/h.ts', [
    'export const a = 1;',
    '',
    '// why: unit 08 needs this guard',
    'export const b = 2;',
  ]);

  const hits = await findCommentFindings({ root: dir, base });

  assert.equal(hits.length, 1);
  assert.equal(hits[0]?.kind, 'planning-id');
});

test('comments-rules: flags a planning id shaped like a later unit', async () => {
  const { dir, base } = await setupRepo({ 'src/i.ts': ['export const a = 1;', ''].join('\n') });
  await putFile(dir, 'src/i.ts', [
    'export const a = 1;',
    '',
    '// why: a later unit will extend this',
    'export const b = 2;',
  ]);

  const hits = await findCommentFindings({ root: dir, base });

  assert.equal(hits.length, 1);
  assert.equal(hits[0]?.kind, 'planning-id');
});

test('comments-rules: passes a resolvable why: comment', async () => {
  const { dir, base } = await setupRepo({ 'src/j.ts': ['export const a = 1;', ''].join('\n') });
  await putFile(dir, 'src/j.ts', [
    'export const a = 1;',
    '',
    '// why: mutex ordering matters here for consistency',
    'export const b = 2;',
  ]);

  const hits = await findCommentFindings({ root: dir, base });

  assert.deepEqual(hits, []);
});

test('comments-rules: passes an informative JSDoc comment on a declaration', async () => {
  const { dir, base } = await setupRepo({ 'src/k.ts': ['export const a = 1;', ''].join('\n') });
  await putFile(dir, 'src/k.ts', [
    'export const a = 1;',
    '',
    '/**',
    ' * Formats the given amount as a two-decimal currency string for display.',
    ' */',
    'export function formatAmount(n: number): string {',
    '  return n.toFixed(2);',
    '}',
  ]);

  const hits = await findCommentFindings({ root: dir, base });

  assert.deepEqual(hits, []);
});

test('comments-rules: checks untracked new files', async () => {
  const { dir, base } = await setupRepo({ 'src/l.ts': ['export const a = 1;', ''].join('\n') });
  await putFile(dir, 'scripts/new-thing.ts', ['// leftover fixme', 'export const z = 9;']);

  const hits = await findCommentFindings({ root: dir, base });

  assert.equal(hits.length, 1);
  assert.equal(hits[0]?.file, 'scripts/new-thing.ts');
  assert.equal(hits[0]?.kind, 'untagged');
});

test('comments-rules: grandfathers a pre-existing comment and flags a new one', async () => {
  const { dir, base } = await setupRepo({
    'src/old.ts': ['// sloppy old comment', 'export const legacy = 1;', ''].join('\n'),
  });
  await putFile(dir, 'src/old.ts', [
    '// sloppy old comment',
    'export const legacy = 1;',
    '',
    '// new sloppy comment',
    'export const fresh = 2;',
  ]);

  const hits = await findCommentFindings({ root: dir, base });

  assert.equal(hits.length, 1);
  assert.equal(hits[0]?.text, '// new sloppy comment');
});

test('comments-rules: passes a tool directive', async () => {
  const { dir, base } = await setupRepo({ 'src/m.ts': ['export const a = 1;', ''].join('\n') });
  await putFile(dir, 'src/m.ts', [
    'export const a = 1;',
    '',
    '// eslint-disable-next-line no-console',
    'console.log(a);',
  ]);

  const hits = await findCommentFindings({ root: dir, base });

  assert.deepEqual(hits, []);
});

test('comments-rules: passes an interior edit of an informative JSDoc on a declaration', async () => {
  const jsdocLines = [
    'export const a = 1;',
    '',
    '/**',
    ' * Formats the given amount as a two-decimal currency string.',
    ' */',
    'export function formatAmount(n: number): string {',
    '  return n.toFixed(2);',
    '}',
  ];
  const { dir, base } = await setupRepo({ 'src/n.ts': jsdocLines.join('\n') });
  await putFile(dir, 'src/n.ts', [
    'export const a = 1;',
    '',
    '/**',
    ' * Formats the given amount as a two-decimal currency string for display.',
    ' */',
    'export function formatAmount(n: number): string {',
    '  return n.toFixed(2);',
    '}',
  ]);

  const hits = await findCommentFindings({ root: dir, base });

  assert.deepEqual(hits, []);
});

test('comments-rules: flags a planning id introduced by an interior JSDoc edit', async () => {
  const jsdocLines = [
    'export const a = 1;',
    '',
    '/**',
    ' * Formats the given amount as a two-decimal currency string.',
    ' */',
    'export function formatAmount(n: number): string {',
    '  return n.toFixed(2);',
    '}',
  ];
  const { dir, base } = await setupRepo({ 'src/o.ts': jsdocLines.join('\n') });
  await putFile(dir, 'src/o.ts', [
    'export const a = 1;',
    '',
    '/**',
    ' * Formats the amount per R3.1 for display.',
    ' */',
    'export function formatAmount(n: number): string {',
    '  return n.toFixed(2);',
    '}',
  ]);

  const hits = await findCommentFindings({ root: dir, base });

  assert.equal(hits.length, 1);
  assert.equal(hits[0]?.kind, 'planning-id');
});

test('comments-rules: flags one finding for an interior edit of an untagged block comment', async () => {
  const blockLines = [
    'export const a = 1;',
    '',
    '/*',
    ' * general notes about this module',
    ' * spanning multiple lines',
    ' */',
    'export const b = 2;',
  ];
  const { dir, base } = await setupRepo({ 'src/p.ts': blockLines.join('\n') });
  await putFile(dir, 'src/p.ts', [
    'export const a = 1;',
    '',
    '/*',
    ' * general notes about this module',
    ' * spanning several lines instead',
    ' */',
    'export const b = 2;',
  ]);

  const hits = await findCommentFindings({ root: dir, base });

  assert.equal(hits.length, 1);
  assert.equal(hits[0]?.kind, 'untagged');
});

test('comments-rules: a plain JSDoc above a function passes', async () => {
  const { dir, base } = await setupRepo({ 'src/q.ts': ['export const a = 1;', ''].join('\n') });
  await putFile(dir, 'src/q.ts', [
    'export const a = 1;',
    '',
    '/**',
    ' * a.',
    ' */',
    'export function nextA(): number {',
    '  return a + 1;',
    '}',
  ]);

  const hits = await findCommentFindings({ root: dir, base });

  assert.deepEqual(hits, []);
});

test('comments-rules: a /** */ block above a statement fails untagged', async () => {
  const { dir, base } = await setupRepo({ 'src/r.ts': ['export const a = 1;', ''].join('\n') });
  await putFile(dir, 'src/r.ts', [
    'export const a = 1;',
    '',
    '/**',
    ' * notes about the log line below',
    ' */',
    "console.log('ready');",
  ]);

  const hits = await findCommentFindings({ root: dir, base });

  assert.equal(hits.length, 1);
  assert.equal(hits[0]?.kind, 'untagged');
});

test('comments-rules: @todo in JSDoc fails', async () => {
  const { dir, base } = await setupRepo({ 'src/s.ts': ['export const a = 1;', ''].join('\n') });
  await putFile(dir, 'src/s.ts', [
    'export const a = 1;',
    '',
    '/**',
    ' * Formats the amount for display.',
    ' * @todo handle currency symbols',
    ' */',
    'export function formatAmount3(n: number): string {',
    '  return n.toFixed(2);',
    '}',
  ]);

  const hits = await findCommentFindings({ root: dir, base });

  assert.equal(hits.length, 1);
  assert.equal(hits[0]?.kind, 'todo');
});

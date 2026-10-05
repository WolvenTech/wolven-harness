import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { promisify } from 'node:util';
import { buildRepoContext, resolveGitRoot } from '../src/validate/repo.js';
import { makeRepo, run } from './helpers/fixture.js';

const execFileAsync = promisify(execFile);

test('validate-untracked: ctx.files includes an untracked path', async () => {
  const dir = await makeRepo({ 'README.md': '# hi\n' }, { git: true });
  const probeNote = path.join(dir, 'docs/notes/probe/probe-note.md');
  await mkdir(path.dirname(probeNote), { recursive: true });
  await writeFile(probeNote, '# scratch\n', 'utf8');

  const root = await resolveGitRoot(dir);
  const ctx = await buildRepoContext(root, { ignoreEntries: [] });

  assert.ok(ctx.files.includes('docs/notes/probe/probe-note.md'));
});

test('validate-untracked: gitignored untracked paths are excluded from ctx.files', async () => {
  const dir = await makeRepo(
    {
      'README.md': '# hi\n',
      '.gitignore': 'local-scratch/\n',
    },
    { git: true },
  );
  const ignored = path.join(dir, 'local-scratch/secret.txt');
  await mkdir(path.dirname(ignored), { recursive: true });
  await writeFile(ignored, 'ignored\n', 'utf8');

  const root = await resolveGitRoot(dir);
  const ctx = await buildRepoContext(root, { ignoreEntries: [] });

  assert.ok(!ctx.files.some((f) => f.startsWith('local-scratch/')));
  assert.ok(ctx.files.includes('README.md'));
});

test('validate-untracked: staging an untracked file keeps it in the scan set', async () => {
  const dir = await makeRepo({ 'README.md': '# hi\n' }, { git: true });
  const rel = 'docs/notes/stage-probe/stage-probe-note.md';
  const abs = path.join(dir, rel);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(
    abs,
    ['---', 'type: note', 'title: staged', 'description: probe', 'status: draft', '---', ''].join('\n'),
    'utf8',
  );

  const root = await resolveGitRoot(dir);
  const before = await buildRepoContext(root, { ignoreEntries: [] });
  assert.ok(before.files.includes(rel));
  assert.ok(before.files.includes('README.md'));

  await execFileAsync('git', ['add', rel], { cwd: dir });

  const after = await buildRepoContext(root, { ignoreEntries: [] });
  assert.deepEqual(after.files, before.files);
});

test('validate-untracked: ignore drops untracked files under ignored dirs', async () => {
  const dir = await makeRepo({ 'README.md': '# hi\n' }, { git: true });
  const scratch = path.join(dir, 'vendor/scratch.txt');
  await mkdir(path.dirname(scratch), { recursive: true });
  await writeFile(scratch, 'x\n', 'utf8');

  const root = await resolveGitRoot(dir);
  const ctx = await buildRepoContext(root, { ignoreEntries: ['vendor/**'] });

  assert.ok(!ctx.files.some((f) => f.startsWith('vendor/')));
});

test('validate-untracked: bad untracked note fails validate without git add', async () => {
  const dir = await makeRepo({ 'README.md': '# hi\n' }, { git: true });
  const notePath = path.join(dir, 'docs/notes/zz-probe/zz-probe-note.md');
  await mkdir(path.dirname(notePath), { recursive: true });
  await writeFile(notePath, ['---', 'type: note', 'title: x', '---', '', 'See ADR-099.', ''].join('\n'), 'utf8');

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 1);
  assert.match(result.stdout, /profile-frontmatter/);
  assert.match(result.stdout, /claim-missing/);
});

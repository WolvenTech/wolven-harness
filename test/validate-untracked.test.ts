import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { buildRepoContext, resolveGitRoot } from '../src/validate/repo.js';
import { makeRepo, run } from './helpers/fixture.js';

test('validate-untracked: ctx.files includes an untracked path', async () => {
  const dir = await makeRepo({ 'README.md': '# hi\n' }, { git: true });
  const probeNote = path.join(dir, 'docs/notes/probe/probe-note.md');
  await mkdir(path.dirname(probeNote), { recursive: true });
  await writeFile(probeNote, '# scratch\n', 'utf8');

  const root = await resolveGitRoot(dir);
  const ctx = await buildRepoContext(root, { ignoreEntries: [] });

  assert.ok(ctx.files.includes('docs/notes/probe/probe-note.md'));
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

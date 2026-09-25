import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { makeRepo, run } from './helpers/fixture.js';
import { buildRepoContext, resolveGitRoot } from '../src/validate/repo.js';

test('claim-no-git: non-git dir exits 1 with "claim gate requires git"', async () => {
  const dir = await makeRepo({ 'README.md': '# hi\n' });
  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 1);
  assert.match(result.stderr, /claim gate requires git/);
});

test('claim-no-git: subdirectory run prints the same stdout as the top level', async () => {
  const dir = await makeRepo(
    {
      'README.md': '# hi\n',
      'sub/nested/file.md': '# nested\n',
    },
    { git: true },
  );

  const top = await run(['validate'], { cwd: dir });
  const nested = await run(['validate'], { cwd: path.join(dir, 'sub', 'nested') });

  assert.equal(top.code, 0);
  assert.equal(nested.code, 0);
  assert.equal(top.stdout, nested.stdout);
});

const BAD_ENTRIES = ['*.md', 'docs/**', 'docs/adrs/**', '.agents/**', '../x/**', '/abs/**'];

for (const entry of BAD_ENTRIES) {
  test(`ignore-guard: bad entry "${entry}" exits 1 naming the entry`, async () => {
    const dir = await makeRepo(
      {
        '.wolven-harness.json': JSON.stringify(
          { version: 1, gitHost: 'gh', runtimes: ['claude'], ignore: [entry] },
          null,
          2,
        ),
        'README.md': '# hi\n',
      },
      { git: true },
    );

    const result = await run(['validate'], { cwd: dir });

    assert.equal(result.code, 1);
    assert.ok(result.stdout.includes(entry), `stdout names the bad entry: ${result.stdout}`);
  });
}

test('ignore-guard: valid entry prints "ignored: <entries> (<n> files)" and exits 0', async () => {
  const dir = await makeRepo(
    {
      '.wolven-harness.json': JSON.stringify(
        { version: 1, gitHost: 'gh', runtimes: ['claude'], ignore: ['vendor/**'] },
        null,
        2,
      ),
      'README.md': '# hi\n',
      'vendor/a.txt': 'a\n',
      'vendor/b.txt': 'b\n',
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 0);
  assert.match(result.stdout, /ignored: vendor\/\*\* \(2 files\)/);
});

test('ignore-guard: ignored files are dropped from ctx.files', async () => {
  const dir = await makeRepo(
    {
      'README.md': '# hi\n',
      'vendor/a.txt': 'a\n',
      'vendor/b.txt': 'b\n',
    },
    { git: true },
  );

  const root = await resolveGitRoot(dir);
  const ctx = await buildRepoContext(root, { ignoreEntries: ['vendor/**'], verbose: false });

  assert.ok(!ctx.files.some((f) => f.startsWith('vendor/')), 'no vendor files in ctx.files');
  assert.ok(ctx.files.includes('README.md'));
  assert.equal(ctx.ignore.count, 2);
  assert.deepEqual(ctx.ignore.entries, ['vendor/**']);
});

test('claim-no-git: a clean git fixture exits 0 with zero claim counts', async () => {
  const dir = await makeRepo({ 'README.md': '# hi\n' }, { git: true });
  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 0);
  assert.match(result.stdout, /claims: 0 ok, 0 legacy-warn, 0 fail/);
  assert.match(result.stdout, /validate: ok/);
});

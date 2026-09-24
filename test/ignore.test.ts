import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeRepo, run } from './helpers/fixture.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');

function ignoreConfig(ignore: string[]): string {
  return JSON.stringify({ version: 1, gitHost: 'gh', runtimes: ['codex'], ignore }, null, 2);
}

// --- proof-wha-ignore ---

test('ignore: an ADR-999 claim under an ignored dir does not fail, and the ignored line names it', async () => {
  const dir = await makeRepo(
    {
      '.wolven-harness.json': ignoreConfig(['vendor/**']),
      'vendor/notes.md': 'ADR-999\n',
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 0, result.stdout);
  assert.match(result.stdout, /ignored: vendor\/\*\* \(1 files\)/);
});

test('ignore: a legacy-shaped file under an ignored dir is not detected as legacy', async () => {
  const dir = await makeRepo(
    {
      '.wolven-harness.json': ignoreConfig(['vendor/**']),
      'vendor/adr-005.md': '# ADR-005: something\n\n## Status\n\nAccepted\n',
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 0, result.stdout);
  assert.ok(!result.stdout.includes('legacy ADR-005'), result.stdout);
});

const BAD_ENTRIES = ['*.md', 'docs/**', 'docs/adrs/**', '.agents/**'];

for (const entry of BAD_ENTRIES) {
  test(`ignore: malformed entry "${entry}" exits 1 naming the entry`, async () => {
    const dir = await makeRepo(
      {
        '.wolven-harness.json': ignoreConfig([entry]),
        'README.md': '# hi\n',
      },
      { git: true },
    );

    const result = await run(['validate'], { cwd: dir });

    assert.equal(result.code, 1);
    assert.ok(result.stdout.includes(entry), `stdout names the bad entry: ${result.stdout}`);
  });
}

test('ignore: the package repo\'s own .wolven-harness.json sets ["templates/**","test/**"]', async () => {
  const raw = await readFile(path.join(repoRoot, '.wolven-harness.json'), 'utf8');
  const config = JSON.parse(raw) as { ignore?: string[] };

  assert.deepEqual(config.ignore, ['templates/**', 'test/**']);
});

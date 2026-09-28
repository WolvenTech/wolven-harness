import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const readmePath = path.join(here, '..', 'README.md');

/** why: one read backs every phrase assertion below, so a single file miss fails loudly instead of once per test. */
async function readReadme(): Promise<string> {
  return readFile(readmePath, 'utf8');
}

test('readme-install: the add and init commands appear, in that order', async () => {
  const readme = await readReadme();

  const addIndex = readme.indexOf('pnpm add -D @wolven/harness');
  const initIndex = readme.indexOf('pnpm exec wolven-harness init');

  assert.ok(addIndex !== -1, 'pnpm add -D @wolven/harness not found');
  assert.ok(initIndex !== -1, 'pnpm exec wolven-harness init not found');
  assert.ok(addIndex < initIndex, 'install command must appear before the init command');
});

test('readme-install: no GitHub Packages registry residue', async () => {
  const readme = await readReadme();

  assert.doesNotMatch(readme, /\.npmrc/);
  assert.doesNotMatch(readme, /npm\.pkg\.github\.com/);
  assert.doesNotMatch(readme, /NODE_AUTH_TOKEN/);
  assert.doesNotMatch(readme, /packages: read/);
  assert.doesNotMatch(readme, /read:packages/);
  assert.doesNotMatch(readme, /@wolventech/);
  assert.doesNotMatch(readme, /_authToken/);
});

test('readme-install: the release section covers trusted publishing, its npm-side setup and the manual re-run', async () => {
  const readme = await readReadme();

  assert.match(readme, /## Release/);

  const start = readme.indexOf('## Release');
  const next = readme.indexOf('\n## ', start + 1);
  const releaseSection = readme.slice(start, next === -1 ? undefined : next);

  assert.match(releaseSection, /trusted publish/i);
  assert.match(releaseSection, /seed/i);
  assert.match(releaseSection, /workflow `release\.yml`/);
  assert.match(releaseSection, /disallow tokens/);
  assert.match(releaseSection, /run the `release` workflow by hand/);
});

test('readme-install: the release section says to close and reopen the release PR before merging', async () => {
  const readme = await readReadme();

  assert.match(readme, /[Cc]lose and reopen the release PR before merging/);
});

test('readme-install: a contributor section keeps clone-and-build with pnpm build', async () => {
  const readme = await readReadme();

  assert.match(readme, /## Contributing/);

  const contributingSection = readme.slice(readme.indexOf('## Contributing'));

  assert.match(contributingSection, /pnpm build/);
});

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

test('readme-install: documents both .npmrc lines', async () => {
  const readme = await readReadme();

  assert.match(readme, /@wolventech:registry=https:\/\/npm\.pkg\.github\.com/);
  assert.match(readme, /\/\/npm\.pkg\.github\.com\/:_authToken=\$\{NODE_AUTH_TOKEN\}/);
});

test('readme-install: documents the local read:packages token scope', async () => {
  const readme = await readReadme();

  assert.match(readme, /read:packages/);
});

test('readme-install: documents the CI packages: read permission', async () => {
  const readme = await readReadme();

  assert.match(readme, /packages: read/);
});

test('readme-install: documents NODE_AUTH_TOKEN', async () => {
  const readme = await readReadme();

  assert.match(readme, /NODE_AUTH_TOKEN/);
});

test('readme-install: documents granting Manage Actions access on the package', async () => {
  const readme = await readReadme();

  assert.match(readme, /Manage Actions access/);
});

test('readme-install: documents installing the package with pnpm add -D', async () => {
  const readme = await readReadme();

  assert.match(readme, /pnpm add -D @wolventech\/wolven-harness/);
});

test('readme-install: documents running init with pnpm exec', async () => {
  const readme = await readReadme();

  assert.match(readme, /pnpm exec wolven-harness init/);
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

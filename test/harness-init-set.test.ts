import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { flatten } from './helpers/prose.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');

async function readReadme(): Promise<string> {
  return readFile(path.join(repoRoot, 'README.md'), 'utf8');
}

/** Slices the README between a `## <heading>` line and the next `## ` line (or end of file). */
function extractSection(doc: string, heading: string): string {
  const start = doc.indexOf(`## ${heading}`);
  assert.ok(start >= 0, `README missing heading "## ${heading}"`);
  const rest = doc.slice(start + `## ${heading}`.length);
  const next = rest.search(/\n## /);
  return next === -1 ? rest : rest.slice(0, next);
}

test('skill-set: the README has a wizard section naming steps 0 through 6', async () => {
  const section = extractSection(await readReadme(), 'Setting up with harness-init');

  for (const label of ['Step 0', 'Step 1', 'Steps 2', 'Step 5', 'Step 6']) {
    assert.match(section, new RegExp(`${label}\\b`), `missing "${label}"`);
  }
});

test('skill-set: the wizard section names the three entry modes', async () => {
  const section = flatten(extractSection(await readReadme(), 'Setting up with harness-init'));

  assert.match(section, /full, light, or mention-only/i);
});

test('skill-set: the wizard section says migration is done only at a clean validate with no legacy warnings', async () => {
  const section = flatten(extractSection(await readReadme(), 'Setting up with harness-init'));

  assert.match(section, /done only once `?harness:validate`? exits 0 with no legacy warnings left/i);
});

test('skill-set: the wizard section covers stubs and the skill-stub-open warning', async () => {
  const section = flatten(extractSection(await readReadme(), 'Setting up with harness-init'));

  assert.match(section, /\bstubs?\b/i);
  assert.match(section, /`skill-stub-open`/);
});

test('skill-set: the wizard section covers the phased commits', async () => {
  const section = flatten(extractSection(await readReadme(), 'Setting up with harness-init'));

  assert.match(section, /three commits/i);
  assert.match(section, /entry, migration, setup/i);
  assert.match(section, /only if you say yes/i);
});

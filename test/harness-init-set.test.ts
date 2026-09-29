import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { flatten } from './helpers/prose.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');

async function readHarnessInit(): Promise<string> {
  return readFile(path.join(repoRoot, 'site/harness-init.md'), 'utf8');
}

/** Slices from a `#` or `##` heading of that name through the end of the doc. */
function extractSection(doc: string, heading: string): string {
  const match = new RegExp(`^#{1,2} ${heading}\\s*$`, 'm').exec(doc);
  assert.ok(match, `missing heading "${heading}"`);
  return doc.slice(match.index);
}

test('skill-set: the harness-init page names steps 0 through 6', async () => {
  const section = extractSection(await readHarnessInit(), 'Setting up with harness-init');

  for (const label of ['Step 0', 'Step 1', 'Steps 2', 'Step 5', 'Step 6']) {
    assert.match(section, new RegExp(`${label}\\b`), `missing "${label}"`);
  }
});

test('skill-set: the harness-init page names the three entry modes', async () => {
  const section = flatten(extractSection(await readHarnessInit(), 'Setting up with harness-init'));

  assert.match(section, /full, light, or mention-only/i);
});

test('skill-set: the harness-init page says migration is done only at a clean validate with no legacy warnings', async () => {
  const section = flatten(extractSection(await readHarnessInit(), 'Setting up with harness-init'));

  assert.match(section, /done only once `?harness:validate`? exits 0 with no legacy warnings left/i);
});

test('skill-set: the harness-init page covers stubs and the skill-stub-open warning', async () => {
  const section = flatten(extractSection(await readHarnessInit(), 'Setting up with harness-init'));

  assert.match(section, /\bstubs?\b/i);
  assert.match(section, /`skill-stub-open`/);
});

test('skill-set: the harness-init page covers the phased commits', async () => {
  const section = flatten(extractSection(await readHarnessInit(), 'Setting up with harness-init'));

  assert.match(section, /three commits/i);
  assert.match(section, /entry, migration, setup/i);
  assert.match(section, /only if you say yes/i);
});

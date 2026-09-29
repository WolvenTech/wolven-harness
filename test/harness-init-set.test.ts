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

test('skill-set: the harness-init page covers integration, migration, discovery, stubs, and validation wiring', async () => {
  const section = extractSection(await readHarnessInit(), 'Setup');

  for (const label of ['integrate', 'migrate', 'suggests', 'stubs', 'CI', 'session note']) {
    assert.match(section, new RegExp(`${label}\\b`), `missing "${label}"`);
  }
});

test('skill-set: the harness-init page names the three entry modes', async () => {
  const section = flatten(extractSection(await readHarnessInit(), 'Setup'));

  assert.match(section, /full, light, or mention-only/i);
});

test('skill-set: the harness-init page says migration is done only at a clean validate with no legacy warnings', async () => {
  const section = flatten(extractSection(await readHarnessInit(), 'Setup'));

  assert.match(section, /complete when validation exits 0 with no legacy warnings left/i);
});

test('skill-set: the harness-init page covers stubs and the skill-stub-open warning', async () => {
  const section = flatten(extractSection(await readHarnessInit(), 'Setup'));

  assert.match(section, /\bstubs?\b/i);
  assert.match(section, /`skill-stub-open`/);
});

test('skill-set: the harness-init page covers the phased commits', async () => {
  const section = flatten(extractSection(await readHarnessInit(), 'Setup'));

  assert.match(section, /three commits/i);
  assert.match(section, /entry, migration, setup/i);
  assert.match(section, /only after validation passes and you say yes/i);
});

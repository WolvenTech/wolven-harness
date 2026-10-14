import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const profiles = [
  path.join(repoRoot, 'templates', 'docs', 'WRITING-PROFILE.md'),
  path.join(repoRoot, 'docs', 'WRITING-PROFILE.md'),
];

test('wayfinder-writing-profile: both profiles document the maps folder and type: map', async () => {
  for (const file of profiles) {
    const raw = await readFile(file, 'utf8');
    assert.ok(raw.includes('docs/maps/<slug>/<slug>-map.md'), `${file} names the main doc path`);
    assert.ok(raw.includes('type: map'), `${file} names type: map`);
    assert.ok(raw.includes('| `maps` | `map` |'), `${file} lists maps in the type map`);
  }
});

test('wayfinder-writing-profile: the two profiles stay identical', async () => {
  const [template, own] = await Promise.all(profiles.map((f) => readFile(f, 'utf8')));
  assert.equal(own, template);
});

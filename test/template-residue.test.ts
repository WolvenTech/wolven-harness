import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { walkFiles } from './helpers/walk.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const templatesRoot = path.resolve(here, '..', 'templates');

const concreteAdrToken = /\bADR-\d{3}\b|\badr-\d{3}-[a-z0-9-]+/;

test('template-residue: copied skills contain no concrete ADR token', async () => {
  const hits: string[] = [];
  for (const rel of await walkFiles(templatesRoot)) {
    const applies =
      rel.startsWith('.agents/skills/adr/') ||
      rel.startsWith('.agents/skills/code-review/') ||
      rel === '.agents/skills/code-spec/references/TEMPLATE.md';
    if (!applies) continue;
    const content = await readFile(path.join(templatesRoot, rel), 'utf8');
    const found = content.match(concreteAdrToken);
    if (found) hits.push(`${rel}: concrete ADR token (${found[0]})`);
  }
  assert.deepEqual(hits, []);
});

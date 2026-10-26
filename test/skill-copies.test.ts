import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const INSTALLED = path.join(ROOT, '.agents', 'skills');
const TEMPLATE = path.join(ROOT, 'templates', '.agents', 'skills');

async function skillDirs(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

async function filesUnder(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries
    .filter((e) => e.isFile())
    .map((e) => path.relative(dir, path.join(e.parentPath, e.name)))
    .sort();
}

test('proof-lean-init-copies-identical: installed and template copies of every shared skill are identical', async () => {
  const templateNames = new Set(await skillDirs(TEMPLATE));
  const shared = (await skillDirs(INSTALLED)).filter((name) => templateNames.has(name)).sort();
  assert.ok(shared.includes('harness-init'), 'harness-init must exist in both skill trees');

  const differences: string[] = [];
  for (const name of shared) {
    const installed = await filesUnder(path.join(INSTALLED, name));
    const template = await filesUnder(path.join(TEMPLATE, name));
    for (const file of new Set([...installed, ...template])) {
      const rel = path.join(name, file);
      if (!installed.includes(file)) differences.push(`${rel}: missing from .agents/skills/`);
      else if (!template.includes(file)) differences.push(`${rel}: missing from templates/.agents/skills/`);
      else {
        const [a, b] = await Promise.all([readFile(path.join(INSTALLED, rel)), readFile(path.join(TEMPLATE, rel))]);
        if (!a.equals(b)) differences.push(`${rel}: contents differ`);
      }
    }
  }

  assert.deepEqual(differences, [], `skill copies differ:\n${differences.join('\n')}`);
});

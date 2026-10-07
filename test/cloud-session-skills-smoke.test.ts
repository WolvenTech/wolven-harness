import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const notePath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'docs/notes/cloud-session-skills/cloud-session-skills-note.md',
);

const sections = ['Codex', 'Cursor', 'Claude Code'] as const;
const smokeLine = /^Smoke: (proceeded|stopped) — \S.+$/m;

test('proof-cloud-session-skills-smoke', async () => {
  const text = await readFile(notePath, 'utf8');

  assert.match(text, /^---\r?\ntype: note\r?\n/);
  assert.doesNotMatch(text, /TODO|placeholder|<one sentence>/i);

  for (const name of sections) {
    const heading = `## ${name}`;
    const start = text.indexOf(heading);
    assert.ok(start >= 0, heading);
    const next = text.indexOf('\n## ', start + heading.length);
    const body = text.slice(start, next === -1 ? text.length : next);
    assert.match(body, smokeLine, name);
  }
});

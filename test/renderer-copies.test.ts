import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { drift, MANIFEST, sync } from '../renderer/sync.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('renderer-copies: every skill copy holds exactly its manifest, byte-identical to the source', () => {
  assert.deepEqual(drift(root), []);
});

test('renderer-copies: the drift check names a changed, a missing and a stray file, and sync restores them', () => {
  const tmp = mkdtempSync(path.join(tmpdir(), 'renderer-copies-'));
  try {
    cpSync(path.join(root, 'renderer'), path.join(tmp, 'renderer'), { recursive: true });
    for (const skill of Object.keys(MANIFEST)) {
      for (const copyRoot of ['templates/.agents/skills', '.agents/skills']) {
        const dir = path.join(copyRoot, skill, 'renderer');
        cpSync(path.join(root, dir), path.join(tmp, dir), { recursive: true });
      }
    }
    const dir = path.join('templates', '.agents', 'skills', 'journey-map', 'renderer');
    writeFileSync(path.join(tmp, dir, 'draw.js'), '// drifted\n');
    unlinkSync(path.join(tmp, dir, 'page.html'));
    writeFileSync(path.join(tmp, dir, 'radial.js'), '');

    assert.deepEqual(drift(tmp), [
      `changed: ${path.join(dir, 'draw.js')}`,
      `missing: ${path.join(dir, 'page.html')}`,
      `stray: ${path.join(dir, 'radial.js')}`,
    ]);
    assert.equal(sync(tmp).length, 3);
    assert.deepEqual(drift(tmp), []);
    assert.deepEqual(sync(tmp), []);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

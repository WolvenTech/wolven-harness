import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { drift, MANIFEST, sync } from '../renderer/sync.mjs';
import type { Prompter } from '../src/setup/types.js';
import { makeRepo, run } from './helpers/fixture.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('renderer-copies: every skill copy holds exactly its manifest, byte-identical to the source', () => {
  assert.deepEqual(drift(root), []);
});

test('renderer-copies: each skill folder holds only its own manifest', () => {
  assert.deepEqual(MANIFEST['journey-map'], ['logic.js', 'canvas.js', 'draw.js', 'page.html']);
  assert.deepEqual(MANIFEST.wayfinder, [
    'logic.js',
    'canvas.js',
    'lanes.js',
    'lanes-draw.js',
    'lanes.html',
    'radial.js',
    'radial-draw.js',
    'radial.html',
  ]);
  for (const skill of Object.keys(MANIFEST)) {
    for (const copyRoot of ['templates/.agents/skills', '.agents/skills']) {
      assert.deepEqual(readdirSync(path.join(root, copyRoot, skill, 'renderer')).sort(), [...MANIFEST[skill]].sort());
    }
  }
});

test('proof-wayfinder-lanes-manifest (R2.7): MANIFEST.wayfinder lists the lanes files and every copy matches renderer/', () => {
  const lanesFiles = ['lanes.js', 'lanes-draw.js', 'lanes.html'];
  for (const file of lanesFiles) assert.ok(MANIFEST.wayfinder.includes(file));
  for (const file of lanesFiles) {
    const source = readFileSync(path.join(root, 'renderer', file));
    for (const copyRoot of ['templates/.agents/skills', '.agents/skills']) {
      const copy = path.join(root, copyRoot, 'wayfinder', 'renderer', file);
      assert.ok(readFileSync(copy).equals(source), `${copy} matches renderer/${file}`);
    }
  }
});

test('proof-wayfinder-subset-isolation: a wayfinder-only change leaves journey-map byte-identical and asks no replace question', async () => {
  const tmp = mkdtempSync(path.join(tmpdir(), 'renderer-isolation-'));
  try {
    cpSync(path.join(root, 'renderer'), path.join(tmp, 'renderer'), { recursive: true });
    for (const skill of Object.keys(MANIFEST)) {
      for (const copyRoot of ['templates/.agents/skills', '.agents/skills']) {
        cpSync(path.join(root, copyRoot, skill), path.join(tmp, copyRoot, skill), { recursive: true });
      }
    }
    const jm = path.join('templates', '.agents', 'skills', 'journey-map');
    const before = snapshot(path.join(tmp, jm));
    writeFileSync(path.join(tmp, 'renderer', 'radial-draw.js'), '// changed\n');
    sync(tmp);

    assert.deepEqual(snapshot(path.join(tmp, jm)), before);
    assert.equal(
      readFileSync(path.join(tmp, 'templates', '.agents', 'skills', 'wayfinder', 'renderer', 'radial-draw.js'), 'utf8'),
      '// changed\n',
    );
    // why: the rebuilt journey-map folder equals the shipped one, so reinstalling the shipped one stands in for the new build.
    assert.deepEqual(snapshot(path.join(root, jm)), before);
    const dir = await makeRepo({});
    const args = ['skills', '--skills', 'journey-map', '--runtimes', 'codex', '--scope', 'project'];
    assert.equal((await run(args, { cwd: dir })).code, 0);
    const asked: string[] = [];
    const prompts = {
      async select(opts: { message: string }) {
        asked.push(opts.message);
        return 'no';
      },
    } as unknown as Prompter;
    assert.equal((await run(args, { cwd: dir, isTTY: true, prompts })).code, 0);
    assert.deepEqual(asked, []);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

function snapshot(dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const entry of readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const full = path.join(entry.parentPath, entry.name);
    out[path.relative(dir, full)] = readFileSync(full, 'base64');
  }
  return out;
}

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

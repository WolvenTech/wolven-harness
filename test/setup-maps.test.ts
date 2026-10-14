import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { makeRepo, run } from './helpers/fixture.js';

const BASE = ['setup', '--git-host', 'gh', '--runtimes', 'codex'];
const ROW =
  '| `docs/maps/<slug>/` | Maps of a large decision: `docs/maps/<slug>/<slug>-map.md` plus one file per ticket |';
const COLLECTION = '  maps:\n    path: ./docs/maps\n    pattern: "!(archived)/**/*.md"\n';

async function exists(file: string): Promise<boolean> {
  return stat(file).then(
    () => true,
    () => false,
  );
}

async function snapshot(dir: string): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (const rel of await readdir(dir, { recursive: true })) {
    if (rel.startsWith('.git/') || rel === '.git') continue;
    const full = path.join(dir, rel);
    if ((await stat(full)).isFile()) out.set(rel, await readFile(full, 'utf8'));
  }
  return out;
}

test('proof-wayfinder-setup-discovery: discovery creates the maps pieces with no marker text left', async () => {
  const dir = await makeRepo({}, { git: true });

  const result = await run([...BASE, '--skills', 'discovery'], { cwd: dir });

  assert.equal(result.code, 0, result.stderr);
  assert.equal(await readFile(path.join(dir, 'docs/maps/.gitkeep'), 'utf8'), '');
  assert.equal(await readFile(path.join(dir, 'docs/maps/.gitignore'), 'utf8'), '*-canvas.json\n*-canvas.html\n');
  assert.ok(!(await exists(path.join(dir, 'docs/maps/gitignore'))));
  assert.ok((await readFile(path.join(dir, '.qmd/index.yml'), 'utf8')).includes(COLLECTION));
  assert.ok((await readFile(path.join(dir, 'WOLVEN.md'), 'utf8')).split('\n').includes(ROW));
  for (const [rel, text] of await snapshot(dir)) {
    assert.doesNotMatch(text, /set:(discovery|ship)\b/, rel);
  }
});

test('proof-wayfinder-setup-absent: ship and none create no maps pieces', async () => {
  for (const skills of ['ship', 'none']) {
    const dir = await makeRepo({}, { git: true });

    const result = await run([...BASE, '--skills', skills], { cwd: dir });

    assert.equal(result.code, 0, result.stderr);
    assert.ok(!(await exists(path.join(dir, 'docs/maps'))), skills);
    const qmd = await readFile(path.join(dir, '.qmd/index.yml'), 'utf8');
    assert.ok(!qmd.includes('maps'), skills);
    assert.ok(qmd.includes('  deferrals:\n    path: ./docs/deferrals\n    pattern: "!(archived)/**/*.md"\n'), skills);
    const wolven = await readFile(path.join(dir, 'WOLVEN.md'), 'utf8');
    assert.ok(!wolven.includes('docs/maps'), skills);
    for (const [rel, text] of await snapshot(dir)) {
      assert.doesNotMatch(text, /set:(discovery|ship)\b/, rel);
    }
  }
});

test('proof-wayfinder-setup-rerun: a second run is byte-identical and an older install only gains missing paths', async () => {
  const dir = await makeRepo({}, { git: true });
  assert.equal((await run([...BASE, '--skills', 'discovery'], { cwd: dir })).code, 0);
  const first = await snapshot(dir);

  assert.equal((await run([...BASE, '--skills', 'discovery'], { cwd: dir })).code, 0);

  assert.deepEqual(await snapshot(dir), first);

  const older = await makeRepo(
    { '.qmd/index.yml': 'collections:\n  mine:\n    path: ./x\n', 'WOLVEN.md': 'mine\n' },
    { git: true },
  );

  assert.equal((await run([...BASE, '--skills', 'discovery'], { cwd: older })).code, 0);

  assert.equal(await readFile(path.join(older, '.qmd/index.yml'), 'utf8'), 'collections:\n  mine:\n    path: ./x\n');
  assert.equal(await readFile(path.join(older, 'WOLVEN.md'), 'utf8'), 'mine\n');
  assert.equal(await readFile(path.join(older, 'docs/maps/.gitignore'), 'utf8'), '*-canvas.json\n*-canvas.html\n');
  assert.ok(await exists(path.join(older, 'docs/maps/.gitkeep')));
});

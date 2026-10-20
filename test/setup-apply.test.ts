import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstat, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { applyTemplates } from '../src/setup/apply.js';
import { MANIFEST_FILENAME } from '../src/setup/manifest.js';
import { addValidateScript } from '../src/setup/package-script.js';
import { setSymlinkImpl } from '../src/setup/runtimes.js';
import type { Context } from '../src/setup/types.js';
import { makeRepo, run } from './helpers/fixture.js';
import { makeIo } from './helpers/io.js';
import { walkFiles } from './helpers/walk.js';

/** Shape of `.wolven-harness.manifest.json` as the tests read it. */
interface ManifestShape {
  version: number;
  packageVersion: string;
  files: Record<string, string>;
}

/** Lowercase hex sha-256 of file bytes, or of a string's UTF-8 bytes. */
function sha256(bytes: Buffer | string): string {
  return createHash('sha256').update(bytes).digest('hex');
}

async function readManifest(root: string): Promise<ManifestShape> {
  return JSON.parse(await readFile(path.join(root, MANIFEST_FILENAME), 'utf8')) as ManifestShape;
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await readFile(p);
    return true;
  } catch {
    return false;
  }
}

test('setup-skip: existing files byte-identical', async () => {
  const templatesDir = await makeRepo({ '.agents/rules/qmd-first.md': 'TEMPLATE CONTENT\n' });
  const root = await makeRepo({ '.agents/rules/qmd-first.md': 'EXISTING CONTENT\n' });
  const ctx: Context = { root, templatesDir, io: makeIo(root) };

  const result = await applyTemplates(ctx);

  assert.deepEqual(result.skipped, ['.agents/rules/qmd-first.md']);
  assert.deepEqual(result.created, []);

  const after = await readFile(path.join(root, '.agents/rules/qmd-first.md'), 'utf8');
  assert.equal(after, 'EXISTING CONTENT\n');
});

test('setup-skip: AGENTS.md never created', async () => {
  const templatesDir = await makeRepo({ 'AGENTS.md': 'TEMPLATE AGENTS CONTENT\n' });
  const root = await makeRepo({});
  const ctx: Context = { root, templatesDir, io: makeIo(root) };

  const result = await applyTemplates(ctx);

  assert.ok(!result.created.includes('AGENTS.md'), 'AGENTS.md is not in created');
  assert.ok(result.skipped.includes('AGENTS.md'), 'AGENTS.md is reported (hard refuse), not silently dropped');
  assert.equal(await fileExists(path.join(root, 'AGENTS.md')), false, 'AGENTS.md was not written to disk');
});

test('setup-apply: creates missing nested paths, sorted, WOLVEN.md rendered not copied', async () => {
  const templatesDir = await makeRepo({
    'WOLVEN.md': 'RAW TEMPLATE TEXT {{skills_table}} SHOULD NOT APPEAR VERBATIM',
    '.agents/skills/qmd/SKILL.md': '---\nname: qmd\ndescription: search docs\n---\nbody\n',
    'docs/notes/.gitkeep': '',
  });
  const root = await makeRepo({});
  const ctx: Context = { root, templatesDir, io: makeIo(root) };

  const result = await applyTemplates(ctx);

  const expected = ['.agents/skills/qmd/SKILL.md', 'WOLVEN.md', 'docs/notes/.gitkeep'].sort();
  assert.deepEqual(result.created, expected, 'created list is sorted deterministically');
  assert.deepEqual(result.skipped, []);

  const wolven = await readFile(path.join(root, 'WOLVEN.md'), 'utf8');
  assert.ok(
    !wolven.includes('{{skills_table}}'),
    'WOLVEN.md content comes from renderWolven(ctx), not the template file',
  );
  assert.match(wolven, /\| qmd \|/, 'renderWolven filled the skills table');

  const skill = await readFile(path.join(root, '.agents/skills/qmd/SKILL.md'), 'utf8');
  assert.equal(skill, '---\nname: qmd\ndescription: search docs\n---\nbody\n');

  const gitkeep = await readFile(path.join(root, 'docs/notes/.gitkeep'), 'utf8');
  assert.equal(gitkeep, '');
});

test('setup-apply: a file blocking a path component is skipped, not thrown on', async () => {
  const templatesDir = await makeRepo({ '.agents/rules/foo.md': 'x' });
  const root = await makeRepo({ '.agents': 'this is a plain file, not a directory\n' });
  const ctx: Context = { root, templatesDir, io: makeIo(root) };

  const result = await applyTemplates(ctx);

  assert.deepEqual(result.skipped, ['.agents/rules/foo.md']);
  assert.deepEqual(result.created, []);
  const blocker = await readFile(path.join(root, '.agents'), 'utf8');
  assert.equal(blocker, 'this is a plain file, not a directory\n');
});

test('setup-apply: missing templatesDir returns empty lists', async () => {
  const root = await makeRepo({});
  const ctx: Context = { root, templatesDir: path.join(root, 'does-not-exist'), io: makeIo(root) };

  const result = await applyTemplates(ctx);

  assert.deepEqual(result, { created: [], skipped: [] });
});

test('setup-skip: second run creates nothing', async () => {
  const templatesDir = await makeRepo({
    '.agents/rules/qmd-first.md': 'template\n',
    'docs/notes/.gitkeep': '',
  });
  const root = await makeRepo({});
  const ctx: Context = { root, templatesDir, io: makeIo(root) };

  const first = await applyTemplates(ctx);
  assert.deepEqual(first.created, ['.agents/rules/qmd-first.md', 'docs/notes/.gitkeep'].sort());

  const second = await applyTemplates(ctx);
  assert.deepEqual(second.created, []);
  assert.deepEqual(second.skipped, ['.agents/rules/qmd-first.md', 'docs/notes/.gitkeep'].sort());
});

test('setup-skip: closing line names harness-init, and pre-existing files stay byte-identical', async () => {
  const dir = await makeRepo(
    {
      'AGENTS.md': 'AGENTS CONTENT\n',
      'CLAUDE.md': 'CLAUDE CONTENT\n',
      '.claude/skills/foo.md': 'SKILL CONTENT\n',
      'package.json': `${JSON.stringify({ name: 'consumer', version: '1.0.0', scripts: { build: 'tsc' } }, null, 2)}\n`,
    },
    { git: true },
  );

  const result = await run(['setup', '--git-host', 'gh', '--runtimes', 'claude'], { cwd: dir });

  assert.equal(result.code, 0);
  assert.match(result.stdout, /harness-init/);
  assert.doesNotMatch(result.stdout, /skipped \(exists\)/);

  assert.match(result.stdout, /kept your existing CLAUDE\.md, \.claude\/skills, left untouched/);
  assert.equal(await readFile(path.join(dir, 'AGENTS.md'), 'utf8'), 'AGENTS CONTENT\n');
  assert.equal(await readFile(path.join(dir, 'CLAUDE.md'), 'utf8'), 'CLAUDE CONTENT\n');
  assert.equal(await readFile(path.join(dir, '.claude/skills/foo.md'), 'utf8'), 'SKILL CONTENT\n');

  const pkg = JSON.parse(await readFile(path.join(dir, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts['harness:validate'], 'wolven-harness validate');
  assert.equal(pkg.scripts['harness:comments'], 'wolven-harness comments');
  assert.equal(pkg.scripts.build, 'tsc');
  assert.equal(pkg.name, 'consumer');
  assert.equal(pkg.version, '1.0.0');
});

test('setup-skip: second `setup` run creates nothing further', async () => {
  const dir = await makeRepo(
    {
      'AGENTS.md': 'AGENTS CONTENT\n',
      'package.json': `${JSON.stringify({ name: 'consumer', version: '1.0.0' }, null, 2)}\n`,
    },
    { git: true },
  );

  const firstRun = await run(['setup', '--git-host', 'gh', '--runtimes', 'codex'], { cwd: dir });
  assert.equal(firstRun.code, 0);
  const pkgAfterFirst = await readFile(path.join(dir, 'package.json'), 'utf8');

  const secondRun = await run(['setup', '--git-host', 'gh', '--runtimes', 'codex'], { cwd: dir });
  assert.equal(secondRun.code, 0);
  assert.match(
    secondRun.stdout,
    /kept your existing package\.json scripts: harness:validate, harness:comments, harness:score, left untouched/,
  );

  const pkgAfterSecond = await readFile(path.join(dir, 'package.json'), 'utf8');
  assert.equal(pkgAfterSecond, pkgAfterFirst, 'second run does not touch package.json again');
  assert.equal(await readFile(path.join(dir, 'AGENTS.md'), 'utf8'), 'AGENTS CONTENT\n');
});

test('setup-script: adds harness:validate, harness:comments and harness:score only when absent', async () => {
  const root = await makeRepo({ 'package.json': '{\n  "name": "pkg",\n  "version": "1.0.0"\n}\n' });
  const ctx: Context = { root, templatesDir: path.join(root, 'unused'), io: makeIo(root) };

  const result = await addValidateScript(ctx);

  assert.deepEqual(result.created, [
    'package.json#scripts.harness:validate',
    'package.json#scripts.harness:comments',
    'package.json#scripts.harness:score',
  ]);
  assert.deepEqual(result.skipped, []);

  const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts['harness:validate'], 'wolven-harness validate');
  assert.equal(pkg.scripts['harness:comments'], 'wolven-harness comments');
  assert.equal(pkg.scripts['harness:score'], 'harness-score');
  assert.equal(pkg.name, 'pkg');
  assert.equal(pkg.version, '1.0.0');
});

test('setup-script: no change when all three are present', async () => {
  const raw = `${JSON.stringify(
    {
      name: 'pkg',
      scripts: {
        'harness:validate': 'wolven-harness validate',
        'harness:comments': 'wolven-harness comments',
        'harness:score': 'harness-score',
      },
    },
    null,
    2,
  )}\n`;
  const root = await makeRepo({ 'package.json': raw });
  const ctx: Context = { root, templatesDir: path.join(root, 'unused'), io: makeIo(root) };

  const result = await addValidateScript(ctx);

  assert.deepEqual(result.created, []);
  assert.deepEqual(result.skipped, [
    'package.json#scripts.harness:validate',
    'package.json#scripts.harness:comments',
    'package.json#scripts.harness:score',
  ]);

  const after = await readFile(path.join(root, 'package.json'), 'utf8');
  assert.equal(after, raw, 'file is untouched byte-for-byte when every key is already present');
});

test('setup-script: adds only the missing key when one is already present', async () => {
  const raw = `${JSON.stringify({ name: 'pkg', scripts: { 'harness:validate': 'wolven-harness validate' } }, null, 2)}\n`;
  const root = await makeRepo({ 'package.json': raw });
  const ctx: Context = { root, templatesDir: path.join(root, 'unused'), io: makeIo(root) };

  const result = await addValidateScript(ctx);

  assert.deepEqual(result.created, ['package.json#scripts.harness:comments', 'package.json#scripts.harness:score']);
  assert.deepEqual(result.skipped, ['package.json#scripts.harness:validate']);

  const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts['harness:validate'], 'wolven-harness validate');
  assert.equal(pkg.scripts['harness:comments'], 'wolven-harness comments');
});

test('setup-script: preserves other keys, key order, indentation, and trailing newline', async () => {
  const raw =
    '{\n' +
    '  "name": "pkg",\n' +
    '  "version": "1.0.0",\n' +
    '  "scripts": {\n' +
    '    "build": "tsc",\n' +
    '    "test": "vitest"\n' +
    '  },\n' +
    '  "dependencies": {\n' +
    '    "yaml": "^2.0.0"\n' +
    '  }\n' +
    '}\n';
  const root = await makeRepo({ 'package.json': raw });
  const ctx: Context = { root, templatesDir: path.join(root, 'unused'), io: makeIo(root) };

  const result = await addValidateScript(ctx);
  assert.deepEqual(result.created, [
    'package.json#scripts.harness:validate',
    'package.json#scripts.harness:comments',
    'package.json#scripts.harness:score',
  ]);

  const after = await readFile(path.join(root, 'package.json'), 'utf8');
  const pkg = JSON.parse(after);

  assert.deepEqual(Object.keys(pkg), ['name', 'version', 'scripts', 'dependencies'], 'top-level key order preserved');
  assert.deepEqual(
    Object.keys(pkg.scripts),
    ['build', 'test', 'harness:validate', 'harness:comments', 'harness:score'],
    'existing scripts keep their order; the new keys are appended in the fixed order',
  );
  assert.equal(pkg.dependencies.yaml, '^2.0.0');
  assert.ok(after.startsWith('{\n  "name": "pkg"'), 'two-space indentation preserved');
  assert.ok(after.endsWith('}\n'), 'trailing newline preserved');
});

test('setup-script: no package.json means no change', async () => {
  const root = await makeRepo({});
  const ctx: Context = { root, templatesDir: path.join(root, 'unused'), io: makeIo(root) };

  const result = await addValidateScript(ctx);

  assert.deepEqual(result, { created: [], skipped: [] });
  assert.equal(await fileExists(path.join(root, 'package.json')), false);
});

test('setup-manifest: records every created regular file with the hash of its bytes', async () => {
  const dir = await makeRepo({}, { git: true });

  const result = await run(['setup', '--git-host', 'gh', '--runtimes', 'claude'], { cwd: dir });
  assert.equal(result.code, 0, result.stderr);

  const manifest = await readManifest(dir);
  assert.equal(manifest.version, 1);
  const own = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8')) as { version: string };
  assert.equal(manifest.packageVersion, own.version);

  const created = (await walkFiles(dir)).filter((rel) => rel !== '.wolven-harness.json' && rel !== MANIFEST_FILENAME);
  assert.deepEqual(Object.keys(manifest.files).sort(), created.sort(), 'keys are exactly the created files');

  for (const rel of created) {
    assert.equal(manifest.files[rel], sha256(await readFile(path.join(dir, rel))), `${rel} hash`);
  }

  assert.ok(Object.hasOwn(manifest.files, 'CLAUDE.md'), 'the CLAUDE.md stub is a created file');
  assert.equal(Object.hasOwn(manifest.files, '.claude/skills'), false, 'a skills symlink is not an entry');
  assert.equal(Object.hasOwn(manifest.files, '.claude/rules'), false, 'a rules symlink is not an entry');
  assert.equal(Object.hasOwn(manifest.files, '.wolven-harness.json'), false, 'the config rewrite is not an entry');
  assert.equal((await lstat(path.join(dir, '.claude', 'rules'))).isSymbolicLink(), true);
});

test('setup-manifest: generated runtime rule files are recorded', async () => {
  const dir = await makeRepo({}, { git: true });

  const result = await run(['setup', '--git-host', 'gh', '--runtimes', 'cursor'], { cwd: dir });
  assert.equal(result.code, 0, result.stderr);

  const manifest = await readManifest(dir);
  const ruleBases = (await readdir(path.join(dir, '.agents', 'rules')))
    .filter((name) => name.endsWith('.md'))
    .map((name) => name.slice(0, -'.md'.length));
  assert.ok(ruleBases.length > 0);

  for (const base of ruleBases) {
    const rel = `.cursor/rules/wolven-${base}.mdc`;
    assert.ok(Object.hasOwn(manifest.files, rel), `${rel} is recorded`);
    assert.equal(manifest.files[rel], sha256(await readFile(path.join(dir, rel))), `${rel} hash`);
  }
});

test('setup-manifest: a re-run keeps existing entries and never re-hashes an edited file', async () => {
  const dir = await makeRepo({}, { git: true });
  const args = ['setup', '--git-host', 'gh', '--runtimes', 'codex'];
  assert.equal((await run(args, { cwd: dir })).code, 0);
  const first = await readManifest(dir);

  const edited = path.join(dir, '.agents', 'rules', 'qmd-first.md');
  await writeFile(edited, 'edited locally\n', 'utf8');

  assert.equal((await run(args, { cwd: dir })).code, 0);
  const second = await readManifest(dir);

  assert.deepEqual(second.files, first.files, 'entries and hashes are untouched');
  assert.equal(second.packageVersion, first.packageVersion);
  assert.notEqual(
    second.files['.agents/rules/qmd-first.md'],
    sha256('edited locally\n'),
    'the re-run does not re-hash a file it did not write',
  );
});

test('setup-manifest: a failed run writes no manifest', async () => {
  const dir = await makeRepo({}, { git: true });

  setSymlinkImpl(async () => {
    throw new Error('EPERM: operation not permitted, symlink');
  });
  try {
    const result = await run(['setup', '--git-host', 'gh', '--runtimes', 'claude'], { cwd: dir });
    assert.equal(result.code, 1);
  } finally {
    setSymlinkImpl();
  }

  await assert.rejects(readFile(path.join(dir, MANIFEST_FILENAME)), 'no manifest after a failed run');
});

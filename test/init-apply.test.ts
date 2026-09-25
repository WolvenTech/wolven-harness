import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import { makeRepo, run } from './helpers/fixture.js';
import { applyTemplates } from '../src/init/apply.js';
import { addValidateScript } from '../src/init/package-script.js';
import type { Context, Io, Options } from '../src/init/types.js';

function makeIo(cwd: string): Io {
  return {
    cwd,
    stdin: new PassThrough(),
    stdout: new PassThrough(),
    stderr: new PassThrough(),
    isTTY: false,
  };
}

const OPTS: Options = { gitHost: 'gh', runtimes: ['claude'] };

async function fileExists(p: string): Promise<boolean> {
  try {
    await readFile(p);
    return true;
  } catch {
    return false;
  }
}

// --- applyTemplates: direct unit tests against a test template root ---

test('init-skip: existing files byte-identical', async () => {
  const templatesDir = await makeRepo({ '.agents/rules/qmd-first.md': 'TEMPLATE CONTENT\n' });
  const root = await makeRepo({ '.agents/rules/qmd-first.md': 'EXISTING CONTENT\n' });
  const ctx: Context = { root, templatesDir, io: makeIo(root) };

  const result = await applyTemplates(OPTS, ctx);

  assert.deepEqual(result.skipped, ['.agents/rules/qmd-first.md']);
  assert.deepEqual(result.created, []);

  const after = await readFile(path.join(root, '.agents/rules/qmd-first.md'), 'utf8');
  assert.equal(after, 'EXISTING CONTENT\n');
});

test('init-skip: AGENTS.md never created', async () => {
  const templatesDir = await makeRepo({ 'AGENTS.md': 'TEMPLATE AGENTS CONTENT\n' });
  const root = await makeRepo({});
  const ctx: Context = { root, templatesDir, io: makeIo(root) };

  const result = await applyTemplates(OPTS, ctx);

  assert.ok(!result.created.includes('AGENTS.md'), 'AGENTS.md is not in created');
  assert.ok(result.skipped.includes('AGENTS.md'), 'AGENTS.md is reported (hard refuse), not silently dropped');
  assert.equal(await fileExists(path.join(root, 'AGENTS.md')), false, 'AGENTS.md was not written to disk');
});

test('init-apply: creates missing nested paths, sorted, WOLVEN.md rendered not copied', async () => {
  const templatesDir = await makeRepo({
    'WOLVEN.md': 'RAW TEMPLATE TEXT {{skills_table}} SHOULD NOT APPEAR VERBATIM',
    '.agents/skills/qmd/SKILL.md': '---\nname: qmd\ndescription: search docs\n---\nbody\n',
    'docs/notes/.gitkeep': '',
  });
  const root = await makeRepo({});
  const ctx: Context = { root, templatesDir, io: makeIo(root) };

  const result = await applyTemplates(OPTS, ctx);

  const expected = ['.agents/skills/qmd/SKILL.md', 'WOLVEN.md', 'docs/notes/.gitkeep'].sort();
  assert.deepEqual(result.created, expected, 'created list is sorted deterministically');
  assert.deepEqual(result.skipped, []);

  const wolven = await readFile(path.join(root, 'WOLVEN.md'), 'utf8');
  assert.ok(!wolven.includes('{{skills_table}}'), 'WOLVEN.md content comes from renderWolven(ctx), not the template file');
  assert.match(wolven, /\| qmd \|/, 'renderWolven filled the skills table');

  const skill = await readFile(path.join(root, '.agents/skills/qmd/SKILL.md'), 'utf8');
  assert.equal(skill, '---\nname: qmd\ndescription: search docs\n---\nbody\n');

  const gitkeep = await readFile(path.join(root, 'docs/notes/.gitkeep'), 'utf8');
  assert.equal(gitkeep, '');
});

test('init-apply: a file blocking a path component is skipped, not thrown on', async () => {
  const templatesDir = await makeRepo({ '.agents/rules/foo.md': 'x' });
  const root = await makeRepo({ '.agents': 'this is a plain file, not a directory\n' });
  const ctx: Context = { root, templatesDir, io: makeIo(root) };

  const result = await applyTemplates(OPTS, ctx);

  assert.deepEqual(result.skipped, ['.agents/rules/foo.md']);
  assert.deepEqual(result.created, []);
  const blocker = await readFile(path.join(root, '.agents'), 'utf8');
  assert.equal(blocker, 'this is a plain file, not a directory\n');
});

test('init-apply: missing templatesDir returns empty lists', async () => {
  const root = await makeRepo({});
  const ctx: Context = { root, templatesDir: path.join(root, 'does-not-exist'), io: makeIo(root) };

  const result = await applyTemplates(OPTS, ctx);

  assert.deepEqual(result, { created: [], skipped: [] });
});

test('init-skip: second run creates nothing', async () => {
  const templatesDir = await makeRepo({
    '.agents/rules/qmd-first.md': 'template\n',
    'docs/notes/.gitkeep': '',
  });
  const root = await makeRepo({});
  const ctx: Context = { root, templatesDir, io: makeIo(root) };

  const first = await applyTemplates(OPTS, ctx);
  assert.deepEqual(first.created, ['.agents/rules/qmd-first.md', 'docs/notes/.gitkeep'].sort());

  const second = await applyTemplates(OPTS, ctx);
  assert.deepEqual(second.created, []);
  assert.deepEqual(second.skipped, ['.agents/rules/qmd-first.md', 'docs/notes/.gitkeep'].sort());
});

// --- end-to-end: full `init` run through the CLI ---

test('init-skip: closing line names harness-init, and pre-existing files stay byte-identical', async () => {
  const dir = await makeRepo(
    {
      'AGENTS.md': 'AGENTS CONTENT\n',
      'CLAUDE.md': 'CLAUDE CONTENT\n',
      '.claude/skills/foo.md': 'SKILL CONTENT\n',
      'package.json': `${JSON.stringify({ name: 'consumer', version: '1.0.0', scripts: { build: 'tsc' } }, null, 2)}\n`,
    },
    { git: true },
  );

  const result = await run(['init', '--git-host', 'gh', '--runtimes', 'claude'], { cwd: dir });

  assert.equal(result.code, 0);
  assert.match(result.stdout, /created:/);
  assert.match(result.stdout, /skipped \(exists\):/);
  assert.match(result.stdout, /harness-init/);

  // Pre-existing runtime files are reported as skipped and stay byte-identical.
  const skippedBlock = result.stdout.split('skipped (exists):')[1] ?? '';
  assert.match(skippedBlock, /^\s+CLAUDE\.md$/m);
  assert.match(skippedBlock, /^\s+\.claude\/skills$/m);
  assert.equal(await readFile(path.join(dir, 'AGENTS.md'), 'utf8'), 'AGENTS CONTENT\n');
  assert.equal(await readFile(path.join(dir, 'CLAUDE.md'), 'utf8'), 'CLAUDE CONTENT\n');
  assert.equal(await readFile(path.join(dir, '.claude/skills/foo.md'), 'utf8'), 'SKILL CONTENT\n');

  const pkg = JSON.parse(await readFile(path.join(dir, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts['harness:validate'], 'wolven-harness validate');
  assert.equal(pkg.scripts.build, 'tsc');
  assert.equal(pkg.name, 'consumer');
  assert.equal(pkg.version, '1.0.0');
});

test('init-skip: second `init` run creates nothing further', async () => {
  const dir = await makeRepo(
    {
      'AGENTS.md': 'AGENTS CONTENT\n',
      'package.json': `${JSON.stringify({ name: 'consumer', version: '1.0.0' }, null, 2)}\n`,
    },
    { git: true },
  );

  const firstRun = await run(['init', '--git-host', 'gh', '--runtimes', 'codex'], { cwd: dir });
  assert.equal(firstRun.code, 0);
  const pkgAfterFirst = await readFile(path.join(dir, 'package.json'), 'utf8');

  const secondRun = await run(['init', '--git-host', 'gh', '--runtimes', 'codex'], { cwd: dir });
  assert.equal(secondRun.code, 0);
  assert.match(secondRun.stdout, /skipped \(exists\):[\s\S]*package\.json#scripts\.harness:validate/);

  const pkgAfterSecond = await readFile(path.join(dir, 'package.json'), 'utf8');
  assert.equal(pkgAfterSecond, pkgAfterFirst, 'second run does not touch package.json again');
  assert.equal(await readFile(path.join(dir, 'AGENTS.md'), 'utf8'), 'AGENTS CONTENT\n');
});

// --- addValidateScript: direct unit tests ---

test('init-script: adds harness:validate only when absent', async () => {
  const root = await makeRepo({ 'package.json': '{\n  "name": "pkg",\n  "version": "1.0.0"\n}\n' });
  const ctx: Context = { root, templatesDir: path.join(root, 'unused'), io: makeIo(root) };

  const result = await addValidateScript(ctx);

  assert.deepEqual(result.created, ['package.json#scripts.harness:validate']);
  assert.deepEqual(result.skipped, []);

  const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts['harness:validate'], 'wolven-harness validate');
  assert.equal(pkg.name, 'pkg');
  assert.equal(pkg.version, '1.0.0');
});

test('init-script: no change when present', async () => {
  const raw = `${JSON.stringify({ name: 'pkg', scripts: { 'harness:validate': 'wolven-harness validate' } }, null, 2)}\n`;
  const root = await makeRepo({ 'package.json': raw });
  const ctx: Context = { root, templatesDir: path.join(root, 'unused'), io: makeIo(root) };

  const result = await addValidateScript(ctx);

  assert.deepEqual(result.created, []);
  assert.deepEqual(result.skipped, ['package.json#scripts.harness:validate']);

  const after = await readFile(path.join(root, 'package.json'), 'utf8');
  assert.equal(after, raw, 'file is untouched byte-for-byte when the key is already present');
});

test('init-script: preserves other keys, key order, indentation, and trailing newline', async () => {
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
  assert.deepEqual(result.created, ['package.json#scripts.harness:validate']);

  const after = await readFile(path.join(root, 'package.json'), 'utf8');
  const pkg = JSON.parse(after);

  assert.deepEqual(Object.keys(pkg), ['name', 'version', 'scripts', 'dependencies'], 'top-level key order preserved');
  assert.deepEqual(
    Object.keys(pkg.scripts),
    ['build', 'test', 'harness:validate'],
    'existing scripts keep their order; the new key is appended',
  );
  assert.equal(pkg.dependencies.yaml, '^2.0.0');
  assert.ok(after.startsWith('{\n  "name": "pkg"'), 'two-space indentation preserved');
  assert.ok(after.endsWith('}\n'), 'trailing newline preserved');
});

test('init-script: no package.json means no change', async () => {
  const root = await makeRepo({});
  const ctx: Context = { root, templatesDir: path.join(root, 'unused'), io: makeIo(root) };

  const result = await addValidateScript(ctx);

  assert.deepEqual(result, { created: [], skipped: [] });
  assert.equal(await fileExists(path.join(root, 'package.json')), false);
});

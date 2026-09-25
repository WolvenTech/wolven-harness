import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import { readFile } from 'node:fs/promises';
import { wireRuntimes, setSymlinkImpl } from '../src/init/runtimes.js';
import { InitError } from '../src/init/types.js';
import type { Context, Io, Options } from '../src/init/types.js';
import { makeRepo, run } from './helpers/fixture.js';

function makeCtx(root: string): Context {
  const io: Io = {
    cwd: root,
    stdin: new PassThrough(),
    stdout: new PassThrough(),
    stderr: new PassThrough(),
    isTTY: false,
  };
  return { root, templatesDir: path.join(root, 'templates'), io };
}

function opts(runtimes: Options['runtimes']): Options {
  return { gitHost: 'gh', runtimes };
}

test('runtime-wiring: claude creates skills symlink to .agents/skills', async () => {
  const dir = await makeRepo({
    'AGENTS.md': '# AGENTS\n',
    '.agents/skills/qmd/marker.txt': 'marker\n',
  });
  const ctx = makeCtx(dir);

  const result = await wireRuntimes(opts(['claude']), ctx);

  const linkPath = path.join(dir, '.claude', 'skills');
  const stat = await fs.lstat(linkPath);
  assert.ok(stat.isSymbolicLink(), '.claude/skills is a symlink');

  const target = await fs.readlink(linkPath);
  assert.equal(target, '../.agents/skills');

  // Resolves through the symlink to the real .agents/skills content.
  const resolved = await readFile(path.join(linkPath, 'qmd', 'marker.txt'), 'utf8');
  assert.equal(resolved, 'marker\n');

  assert.ok(result.created.includes('.claude/skills'));
});

test('runtime-wiring: claude creates CLAUDE.md only when absent', async () => {
  const dir = await makeRepo({ 'AGENTS.md': '# AGENTS\n' });
  const ctx = makeCtx(dir);

  const result = await wireRuntimes(opts(['claude']), ctx);

  const claudeMd = await readFile(path.join(dir, 'CLAUDE.md'), 'utf8');
  assert.equal(claudeMd, '@AGENTS.md\n');
  assert.ok(result.created.includes('CLAUDE.md'));
});

test('runtime-wiring: existing CLAUDE.md byte-identical', async () => {
  const existing = '# hand-written CLAUDE.md\ncustom content\n';
  const dir = await makeRepo({
    'AGENTS.md': '# AGENTS\n',
    'CLAUDE.md': existing,
  });
  const ctx = makeCtx(dir);

  const result = await wireRuntimes(opts(['claude']), ctx);

  const after = await readFile(path.join(dir, 'CLAUDE.md'), 'utf8');
  assert.equal(after, existing);
  assert.ok(result.skipped.includes('CLAUDE.md'));
});

test('runtime-wiring: codex,cursor create no runtime dirs', async () => {
  const dir = await makeRepo({ 'AGENTS.md': '# AGENTS\n' });
  const ctx = makeCtx(dir);

  const result = await wireRuntimes(opts(['codex', 'cursor']), ctx);

  for (const rel of ['.claude', '.codex', '.cursor']) {
    await assert.rejects(fs.lstat(path.join(dir, rel)), `${rel} does not exist`);
  }
  assert.deepEqual(result.created, []);
  assert.deepEqual(result.skipped, []);
});

test('runtime-wiring: symlink failure exits 1 naming macOS/Linux', async () => {
  const dir = await makeRepo({ 'AGENTS.md': '# AGENTS\n' });
  const ctx = makeCtx(dir);

  setSymlinkImpl(async () => {
    throw new Error('EPERM: operation not permitted, symlink');
  });

  try {
    await assert.rejects(
      wireRuntimes(opts(['claude']), ctx),
      (err: unknown) => {
        assert.ok(err instanceof InitError, 'throws InitError');
        assert.match((err as Error).message, /macOS/);
        assert.match((err as Error).message, /Linux/);
        return true;
      },
    );
  } finally {
    setSymlinkImpl();
  }
});

test('runtime-wiring: end-to-end codex,cursor via CLI creates no runtime dirs', async () => {
  const dir = await makeRepo({ 'AGENTS.md': '# AGENTS\n' }, { git: true });

  await run(['init', '--git-host', 'gh', '--runtimes', 'codex,cursor'], { cwd: dir });

  for (const rel of ['.claude', '.codex', '.cursor']) {
    await assert.rejects(fs.lstat(path.join(dir, rel)), `${rel} does not exist`);
  }
});

test('runtime-wiring: README cites three URLs and macOS/Linux', async () => {
  const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');

  assert.match(readme, /https:\/\/code\.claude\.com\/docs\/en\/skills/);
  assert.match(readme, /https:\/\/learn\.chatgpt\.com\/docs\/build-skills/);
  assert.match(readme, /https:\/\/cursor\.com\/docs\/context\/skills/);
  assert.match(readme, /macOS/);
  assert.match(readme, /Linux/);
});

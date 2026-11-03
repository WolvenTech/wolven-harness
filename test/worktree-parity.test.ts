import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

const HOOK = path.resolve('templates/.agents/hooks/worktree-parity.mjs');

async function folder(entries: { file?: boolean; rules?: boolean }): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'parity-'));
  if (entries.file) await writeFile(path.join(dir, 'CLAUDE.local.md'), '# local\n');
  if (entries.rules) await mkdir(path.join(dir, '.claude', 'rules'), { recursive: true });
  return dir;
}

function runHook(env: Record<string, string>, cwd?: string) {
  const result = spawnSync(process.execPath, [HOOK], { cwd, env: { ...process.env, ...env }, encoding: 'utf8' });
  return { status: result.status, out: result.stdout };
}

test('proof-quiet-install-parity-hook: a complete folder prints nothing and exits 0', async () => {
  const dir = await folder({ file: true, rules: true });
  const result = runHook({ CLAUDE_PROJECT_DIR: dir });
  assert.equal(result.status, 0);
  assert.equal(result.out, '');
});

test('proof-quiet-install-parity-hook: a missing CLAUDE.local.md warns with a next step and exits 0', async () => {
  const dir = await folder({ rules: true });
  const result = runHook({ CLAUDE_PROJECT_DIR: dir });
  assert.equal(result.status, 0);
  assert.match(result.out, /CLAUDE\.local\.md/);
  assert.doesNotMatch(result.out, /\.claude\/rules/);
  assert.match(result.out, /Nothing changed\. Next:/);
  assert.match(result.out, /harness-init/);
  assert.doesNotMatch(result.out, /entry point|the Human/);
});

test('proof-quiet-install-parity-hook: a missing .claude/rules/ warns and exits 0', async () => {
  const dir = await folder({ file: true });
  const result = runHook({ CLAUDE_PROJECT_DIR: dir });
  assert.equal(result.status, 0);
  assert.match(result.out, /\.claude\/rules\//);
  assert.doesNotMatch(result.out, /CLAUDE\.local\.md/);
});

test('proof-quiet-install-parity-hook: both missing warn once each, and cwd is the fallback', async () => {
  const dir = await folder({});
  const result = runHook({ CLAUDE_PROJECT_DIR: '' }, dir);
  assert.equal(result.status, 0);
  assert.equal(result.out.trim().split('\n').length, 2);
});

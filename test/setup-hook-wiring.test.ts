import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { pathExists } from '../src/path-exists.js';
import { makeRepo, run } from './helpers/fixture.js';

const GUARD = '.agents/hooks/secret-path-guard.mjs';

async function setup(dir: string, runtimes: string) {
  return run(['setup', '--git-host', 'gh', '--runtimes', runtimes], { cwd: dir });
}

async function readJson(dir: string, rel: string): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(path.join(dir, rel), 'utf8')) as Record<string, unknown>;
}

test('proof-secret-path-guard-cursor-wiring: cursor gets .cursor/hooks.json running the guard on reads and shell', async () => {
  const dir = await makeRepo({ 'README.md': '# demo\n' }, { git: true });

  const result = await setup(dir, 'cursor');
  assert.equal(result.code, 0, result.stderr);

  const config = await readJson(dir, '.cursor/hooks.json');
  assert.equal(config.version, 1);
  const hooks = config.hooks as Record<string, { command: string }[]>;
  for (const event of ['beforeReadFile', 'beforeShellExecution']) {
    assert.ok(
      hooks[event]?.some((entry) => entry.command.includes(GUARD)),
      `${event} should run ${GUARD}`,
    );
  }
  assert.ok(await pathExists(path.join(dir, GUARD)), `${GUARD} should be copied`);
});

test('proof-secret-path-guard-claude-wiring: claude gets .claude/settings.json with a PreToolUse guard', async () => {
  const dir = await makeRepo({ 'README.md': '# demo\n' }, { git: true });

  const result = await setup(dir, 'claude');
  assert.equal(result.code, 0, result.stderr);

  const config = await readJson(dir, '.claude/settings.json');
  const preToolUse = (config.hooks as Record<string, unknown>).PreToolUse as {
    matcher: string;
    hooks: { type: string; command: string }[];
  }[];
  const matched = preToolUse[0].matcher.split('|');
  assert.ok(matched.includes('Read') && matched.includes('Bash'), preToolUse[0].matcher);
  assert.equal(preToolUse[0].hooks[0].type, 'command');
  assert.ok(preToolUse[0].hooks[0].command.includes(GUARD), preToolUse[0].hooks[0].command);
  assert.ok(await pathExists(path.join(dir, '.claude/skills')), '.claude/skills should coexist with the settings file');
});

test('proof-secret-path-guard-no-hook-for-inline-only: codex alone writes no hook config', async () => {
  const dir = await makeRepo({ 'README.md': '# demo\n' }, { git: true });

  const result = await setup(dir, 'codex');
  assert.equal(result.code, 0, result.stderr);

  assert.equal(await pathExists(path.join(dir, '.cursor/hooks.json')), false);
  assert.equal(await pathExists(path.join(dir, '.claude/settings.json')), false);
});

test('hook config is written for cursor even when an inline runtime is also selected', async () => {
  const dir = await makeRepo({ 'README.md': '# demo\n' }, { git: true });

  const result = await setup(dir, 'codex,cursor');
  assert.equal(result.code, 0, result.stderr);

  assert.ok(await pathExists(path.join(dir, '.cursor/hooks.json')));
  assert.equal(await pathExists(path.join(dir, '.claude/settings.json')), false);
});

test('pre-existing hook config is skipped, not merged', async () => {
  const cursorHooks = '{ "version": 1, "hooks": { "stop": [{ "command": "./mine.sh" }] } }\n';
  const claudeSettings = '{ "permissions": { "allow": ["Bash(ls)"] } }\n';
  const dir = await makeRepo(
    { 'README.md': '# demo\n', '.cursor/hooks.json': cursorHooks, '.claude/settings.json': claudeSettings },
    { git: true },
  );

  const result = await setup(dir, 'claude,cursor');
  assert.equal(result.code, 0, result.stderr);

  assert.equal(await readFile(path.join(dir, '.cursor/hooks.json'), 'utf8'), cursorHooks);
  assert.equal(await readFile(path.join(dir, '.claude/settings.json'), 'utf8'), claudeSettings);
});

test('the wired guard command denies a secret read from the repo root', async () => {
  const dir = await makeRepo({ 'README.md': '# demo\n' }, { git: true });

  const result = await setup(dir, 'claude,cursor');
  assert.equal(result.code, 0, result.stderr);

  const guard = spawnSync(process.execPath, [GUARD], {
    cwd: dir,
    input: JSON.stringify({ tool_name: 'Read', tool_input: { file_path: 'certs/client.pem' } }),
    encoding: 'utf8',
    timeout: 10_000,
  });
  assert.equal(guard.signal, null);
  assert.equal(guard.status, 2, guard.stderr);
});

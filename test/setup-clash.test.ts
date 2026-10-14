import assert from 'node:assert/strict';
import { chmod, mkdir, mkdtemp, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { makeRepo, run } from './helpers/fixture.js';

const BASE = ['setup', '--git-host', 'gh', '--runtimes', 'claude'];

/** A home directory whose `.agents/skills/<skill>` differs from the project copy. */
async function homeWith(skill: string, body: string): Promise<string> {
  const home = await mkdtemp(path.join(tmpdir(), 'wolven-harness-home-'));
  const folder = path.join(home, '.agents', 'skills', skill);
  await mkdir(folder, { recursive: true });
  await writeFile(path.join(folder, 'SKILL.md'), body, 'utf8');
  return home;
}

/** Every path under `dir`, for a before/after comparison. */
async function tree(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries.map((entry) => `${entry.parentPath}/${entry.name}`).sort();
}

test('proof-project-skill-precedence-setup-warning', async () => {
  const dir = await makeRepo({}, { git: true });
  const home = await homeWith('grilling', '# a user-level grilling\n');

  const result = await run(BASE, { cwd: dir, env: { HOME: home } });

  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stderr, /"grilling" is installed at/);
  assert.ok(result.stderr.includes(path.join(dir, '.agents', 'skills', 'grilling')), 'names the project copy');
  assert.ok(result.stderr.includes(path.join(home, '.agents', 'skills', 'grilling')), 'names the user copy');
  assert.match(result.stderr, /Claude Code loads the user-level copy first/);
  assert.match(result.stderr, /wolven-harness setup: note:/);
});

test('proof-project-skill-precedence-setup-silent', async () => {
  const dir = await makeRepo({}, { git: true });
  const home = await mkdtemp(path.join(tmpdir(), 'wolven-harness-home-'));

  const result = await run(BASE, { cwd: dir, env: { HOME: home } });

  assert.equal(result.code, 0, result.stderr);
  assert.doesNotMatch(result.stderr, /is installed at/);
});

test('proof-project-skill-precedence-setup-inert', async () => {
  const dir = await makeRepo({}, { git: true });
  const home = await homeWith('grilling', '# a user-level grilling\n');
  await run(BASE, { cwd: dir, env: { HOME: home } });
  const before = await tree(dir);

  await chmod(home, 0o000);
  const locked = await run(BASE, { cwd: dir, env: { HOME: home } });

  assert.equal(locked.code, 0, locked.stderr);
  assert.doesNotMatch(locked.stderr, /is installed at/);
  assert.deepEqual(await tree(dir), before, 'a failed home read writes nothing under the project');
  await chmod(home, 0o700);
});

const LIVE = ['setup', '--git-host', 'gh', '--runtimes', 'claude', '--skills', 'ship,discovery'];

/** The home shape this package's own machine has: divergent twins of three shipped skills. */
async function homeWithLiveTwins(): Promise<string> {
  const home = await mkdtemp(path.join(tmpdir(), 'wolven-harness-home-'));
  for (const skill of ['grilling', 'handoff', 'prototype']) {
    const folder = path.join(home, '.agents', 'skills', skill);
    await mkdir(folder, { recursive: true });
    await writeFile(path.join(folder, 'SKILL.md'), `# user-level ${skill}\n`, 'utf8');
  }
  return home;
}

/** The clash lines of a run, in order. */
function clashLines(stderr: string): string[] {
  return stderr.split('\n').filter((line) => line.includes('is installed at'));
}

test('proof-project-skill-precedence-live-clashes', async () => {
  const dir = await makeRepo({}, { git: true });
  const home = await homeWithLiveTwins();

  const result = await run(LIVE, { cwd: dir, env: { HOME: home } });

  assert.equal(result.code, 0, result.stderr);
  const lines = clashLines(result.stderr);
  assert.equal(lines.length, 3);
  for (const skill of ['grilling', 'handoff', 'prototype']) {
    assert.ok(
      lines.some((line) => line.includes(`"${skill}" is installed at`)),
      `reports ${skill}`,
    );
  }
  assert.doesNotMatch(result.stderr, /delete|remove|\brm\b/i);
});

test('proof-project-skill-precedence-idempotent', async () => {
  const dir = await makeRepo({}, { git: true });
  const home = await homeWithLiveTwins();

  const first = await run(LIVE, { cwd: dir, env: { HOME: home } });
  const after = await tree(dir);
  const second = await run(LIVE, { cwd: dir, env: { HOME: home } });

  assert.equal(first.code, 0, first.stderr);
  assert.equal(second.code, 0, second.stderr);
  assert.deepEqual(clashLines(second.stderr), clashLines(first.stderr));
  assert.deepEqual(await tree(dir), after, 'the second run writes nothing');
});

import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import { test } from 'node:test';
import { detectRuntimes } from '../src/setup/options.js';
import { setSymlinkImpl, wireRuntimes } from '../src/setup/runtimes.js';
import type { Context, Io, Options, Prompter, Runtime } from '../src/setup/types.js';
import { SetupError } from '../src/setup/types.js';
import { makeRepo, run } from './helpers/fixture.js';

const IDS: readonly Runtime[] = [
  'claude',
  'codex',
  'cursor',
  'opencode',
  'amp',
  'copilot',
  'gemini',
  'kiro',
  'antigravity',
];

const NAMES = [
  'Claude Code',
  'Codex',
  'Cursor',
  'OpenCode',
  'Amp',
  'GitHub Copilot',
  'Gemini CLI',
  'Kiro',
  'Antigravity',
];

interface Asked {
  initial: Runtime[];
  values: Runtime[];
  labels: string[];
  hints: (string | undefined)[];
}

/**
 * Records the runtimes question and answers with its preselection, or with
 * `answer` when given; the skill-set question takes its defaults.
 */
function fakePrompter(asked: Asked, answer?: Runtime[]): Prompter {
  return {
    async select() {
      throw new Error('the git-host prompt should not be asked');
    },
    async multiselect(o) {
      if (o.options.some((choice) => choice.value === 'ship')) return o.initialValues as never;
      asked.initial = o.initialValues;
      asked.values = o.options.map((choice) => choice.value);
      asked.labels = o.options.map((choice) => choice.label);
      asked.hints = o.options.map((choice) => choice.hint);
      return (answer ?? o.initialValues) as never;
    },
  };
}

function newAsked(): Asked {
  return { initial: [], values: [], labels: [], hints: [] };
}

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

test('runtime-wiring: codex,cursor create only the cursor hook config', async () => {
  const dir = await makeRepo({ 'AGENTS.md': '# AGENTS\n' });
  const ctx = makeCtx(dir);

  const result = await wireRuntimes(opts(['codex', 'cursor']), ctx);

  for (const rel of ['.claude', '.codex', '.cursor/rules']) {
    await assert.rejects(fs.lstat(path.join(dir, rel)), `${rel} does not exist`);
  }
  assert.deepEqual(await fs.readdir(path.join(dir, '.cursor')), ['hooks.json']);
  assert.deepEqual(result.created, ['.cursor/hooks.json']);
  assert.deepEqual(result.skipped, []);
});

test('runtime-wiring: symlink failure exits 1 naming macOS/Linux', async () => {
  const dir = await makeRepo({ 'AGENTS.md': '# AGENTS\n' });
  const ctx = makeCtx(dir);

  setSymlinkImpl(async () => {
    throw new Error('EPERM: operation not permitted, symlink');
  });

  try {
    await assert.rejects(wireRuntimes(opts(['claude']), ctx), (err: unknown) => {
      assert.ok(err instanceof SetupError, 'throws SetupError');
      assert.match((err as Error).message, /macOS/);
      assert.match((err as Error).message, /Linux/);
      return true;
    });
  } finally {
    setSymlinkImpl();
  }
});

test('runtime-wiring: end-to-end codex,cursor via CLI creates only the cursor hook config', async () => {
  const dir = await makeRepo({ 'AGENTS.md': '# AGENTS\n' }, { git: true });

  await run(['setup', '--git-host', 'gh', '--runtimes', 'codex,cursor'], { cwd: dir });

  for (const rel of ['.claude', '.codex', '.cursor/rules']) {
    await assert.rejects(fs.lstat(path.join(dir, rel)), `${rel} does not exist`);
  }
  assert.deepEqual(await fs.readdir(path.join(dir, '.cursor')), ['hooks.json']);
});

test('runtime-wiring: runtimes page cites three URLs; README install lines cite macOS/Linux', async () => {
  const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
  const installStart = readme.indexOf('## Install');
  assert.ok(installStart >= 0, 'README missing "## Install"');
  const installEnd = readme.indexOf('\n## ', installStart + 1);
  const install = readme.slice(installStart, installEnd === -1 ? undefined : installEnd);

  assert.match(install, /macOS/);
  assert.match(install, /Linux/);

  const runtimes = await readFile(new URL('../site/runtimes.md', import.meta.url), 'utf8');

  assert.match(runtimes, /https:\/\/code\.claude\.com\/docs\/en\/skills/);
  assert.match(runtimes, /https:\/\/learn\.chatgpt\.com\/docs\/build-skills/);
  assert.match(runtimes, /https:\/\/cursor\.com\/docs\/context\/skills/);
});

test('runtime-detect: machine markers come from the supplied environment, in registry order', async () => {
  const home = await makeRepo({});
  await fs.mkdir(path.join(home, '.claude'), { recursive: true });
  const repo = await makeRepo({ '.cursorrules': 'x\n' }, { git: true });

  assert.deepEqual(await detectRuntimes(repo), ['cursor']);
  assert.deepEqual(await detectRuntimes(repo, { HOME: home }), ['claude', 'cursor']);
});

test('runtime-detect: a fake home holding .codex and .cursor preselects exactly those', async () => {
  const home = await makeRepo({});
  await fs.mkdir(path.join(home, '.codex'), { recursive: true });
  await fs.mkdir(path.join(home, '.cursor'), { recursive: true });
  const dir = await makeRepo({}, { git: true });
  const asked = newAsked();

  const result = await run(['setup', '--git-host', 'gh'], {
    cwd: dir,
    isTTY: true,
    prompts: fakePrompter(asked),
    env: { HOME: home },
  });

  assert.equal(result.code, 0, result.stderr);
  assert.deepEqual(asked.initial, ['codex', 'cursor']);
});

test('runtime-detect: an empty home and no repo markers preselect nothing but list every runtime', async () => {
  const home = await makeRepo({});
  const dir = await makeRepo({}, { git: true });
  const asked = newAsked();

  const result = await run(['setup', '--git-host', 'gh'], {
    cwd: dir,
    isTTY: true,
    prompts: fakePrompter(asked, ['claude']),
    env: { HOME: home },
  });

  assert.equal(result.code, 0, result.stderr);
  assert.deepEqual(asked.initial, []);
  assert.deepEqual(asked.values, [...IDS]);
  assert.deepEqual(asked.labels, NAMES);
  assert.ok(
    asked.hints.every((hint) => hint === undefined),
    'nothing is detected, so nothing carries a hint',
  );
});

test('runtime-flag: --runtimes accepts every registry id', async () => {
  for (const id of IDS) {
    const dir = await makeRepo({}, { git: true });
    const result = await run(['setup', '--git-host', 'gh', '--runtimes', id], { cwd: dir });

    assert.equal(result.code, 0, `${id}: ${result.stderr}`);
    const config = JSON.parse(await readFile(path.join(dir, '.wolven-harness.json'), 'utf8')) as {
      runtimes: string[];
    };
    assert.deepEqual(config.runtimes, [id], id);
  }

  const opencode = await makeRepo({}, { git: true });
  await run(['setup', '--git-host', 'gh', '--runtimes', 'opencode'], { cwd: opencode });
  assert.ok((await fs.lstat(path.join(opencode, 'opencode.json'))).isFile(), 'opencode wiring was created');
});

import assert from 'node:assert/strict';
import { lstat, readdir, readFile, readlink } from 'node:fs/promises';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import { test } from 'node:test';
import { wireRuntimes } from '../src/setup/runtimes.js';
import { buildSummary } from '../src/setup/summary.js';
import type { Context, Io, Options, StepResult } from '../src/setup/types.js';
import { makeRepo, run } from './helpers/fixture.js';

const RULES_SURFACES = ['.claude/rules', '.cursor', 'opencode.json', '.github/instructions', 'GEMINI.md', '.kiro'];

const ALPHA = '---\ndescription: Alpha.\nalwaysApply: true\ntrigger: always_on\n---\n\n# Alpha\n\nAlpha body.\n';
const BETA = '---\ndescription: Beta.\nalwaysApply: true\ntrigger: always_on\n---\n\n# Beta\n\nBeta body.\n';

/** A fixture holding two rule sources plus one entry that is not a rule. */
async function makeRulesRepo(extra: Record<string, string> = {}): Promise<string> {
  return makeRepo({
    '.agents/rules/alpha.md': ALPHA,
    '.agents/rules/beta.md': BETA,
    '.agents/rules/notes.txt': 'not a rule\n',
    ...extra,
  });
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

const EMPTY: StepResult = { created: [], skipped: [] };

async function ruleBases(root: string): Promise<string[]> {
  const names = await readdir(path.join(root, '.agents', 'rules'));
  return names
    .filter((name) => name.endsWith('.md'))
    .map((name) => name.slice(0, -'.md'.length))
    .sort();
}

function splitFrontmatter(raw: string): { head: string; body: string } {
  const match = /^---\n([\s\S]*?)\n---\n\n([\s\S]*)$/.exec(raw);
  assert.ok(match, 'generated file carries frontmatter');
  return { head: match[1], body: match[2] };
}

async function assertAbsent(root: string, entries: string[]): Promise<void> {
  for (const rel of entries) {
    await assert.rejects(lstat(path.join(root, rel)), `${rel} must not exist`);
  }
}

test('native-wiring: claude CLI symlinks .claude/rules to ../.agents/rules', async () => {
  const dir = await makeRepo({}, { git: true });

  const result = await run(['setup', '--git-host', 'gh', '--runtimes', 'claude'], { cwd: dir });
  assert.equal(result.code, 0, result.stderr);

  const link = path.join(dir, '.claude', 'rules');
  assert.equal((await lstat(link)).isSymbolicLink(), true);
  assert.equal(await readlink(link), '../.agents/rules');

  const bases = await ruleBases(dir);
  assert.ok(bases.length > 0);
  for (const base of bases) {
    assert.ok(
      (await readFile(path.join(link, `${base}.md`), 'utf8')).length > 0,
      `${base}.md resolves through the link`,
    );
  }

  assert.match(result.stdout, /Claude Code rules wired \(\.claude\/rules\)/);
});

test('native-wiring: cursor CLI generates one always-applied .mdc per rule', async () => {
  const dir = await makeRepo({}, { git: true });

  const result = await run(['setup', '--git-host', 'gh', '--runtimes', 'cursor'], { cwd: dir });
  assert.equal(result.code, 0, result.stderr);

  const bases = await ruleBases(dir);
  assert.ok(bases.length > 0);
  for (const base of bases) {
    const raw = await readFile(path.join(dir, '.cursor', 'rules', `wolven-${base}.mdc`), 'utf8');
    const { head, body } = splitFrontmatter(raw);
    assert.equal(head, 'alwaysApply: true', `${base} is always applied`);
    assert.match(body, /^# /, `${base} keeps the rule body`);
    assert.doesNotMatch(body, /^(description|alwaysApply|trigger):/m, `${base} drops the source frontmatter`);
  }

  assert.match(result.stdout, /Cursor rules wired \(\d+ files in \.cursor\/rules\)/);
});

test('native-wiring: opencode writes every rule path into instructions', async () => {
  const dir = await makeRulesRepo();

  const result = await wireRuntimes(opts(['opencode']), makeCtx(dir));

  const config = JSON.parse(await readFile(path.join(dir, 'opencode.json'), 'utf8'));
  assert.deepEqual(config.instructions, ['.agents/rules/alpha.md', '.agents/rules/beta.md']);
  assert.deepEqual(result.created, ['opencode.json']);
});

test('native-wiring: copilot generates instructions with applyTo "**"', async () => {
  const dir = await makeRulesRepo();

  const result = await wireRuntimes(opts(['copilot']), makeCtx(dir));

  for (const base of ['alpha', 'beta']) {
    const raw = await readFile(path.join(dir, '.github', 'instructions', `wolven-${base}.instructions.md`), 'utf8');
    const { head, body } = splitFrontmatter(raw);
    assert.equal(head, 'applyTo: "**"');
    assert.match(body, /^# /);
  }

  assert.deepEqual(result.created, [
    '.github/instructions/wolven-alpha.instructions.md',
    '.github/instructions/wolven-beta.instructions.md',
  ]);
});

test('native-wiring: gemini imports AGENTS.md and every rule', async () => {
  const dir = await makeRulesRepo();

  const result = await wireRuntimes(opts(['gemini']), makeCtx(dir));

  assert.equal(
    await readFile(path.join(dir, 'GEMINI.md'), 'utf8'),
    '@AGENTS.md\n\n@.agents/rules/alpha.md\n@.agents/rules/beta.md\n',
  );
  assert.deepEqual(result.created, ['GEMINI.md']);
});

test('native-wiring: kiro generates steering files and the skills symlink', async () => {
  const dir = await makeRulesRepo();

  const result = await wireRuntimes(opts(['kiro']), makeCtx(dir));

  for (const base of ['alpha', 'beta']) {
    const raw = await readFile(path.join(dir, '.kiro', 'steering', `wolven-${base}.md`), 'utf8');
    const { head, body } = splitFrontmatter(raw);
    assert.equal(head, 'inclusion: always');
    assert.match(body, /^# /);
  }

  const skillsLink = path.join(dir, '.kiro', 'skills');
  assert.equal((await lstat(skillsLink)).isSymbolicLink(), true);
  assert.equal(await readlink(skillsLink), '../.agents/skills');

  assert.deepEqual(result.created, ['.kiro/skills', '.kiro/steering/wolven-alpha.md', '.kiro/steering/wolven-beta.md']);

  const summary = buildSummary(EMPTY, result, EMPTY, ['kiro']);
  assert.ok(summary.done.includes('Kiro wired (.kiro/skills)'), 'kiro reports its symlink, not a native read');
  assert.ok(summary.done.includes('Kiro rules wired (2 files in .kiro/steering)'));
});

test('native-wiring: amp, antigravity and codex create no rules path', async () => {
  for (const runtime of ['amp', 'antigravity'] as const) {
    const dir = await makeRulesRepo();
    const result = await wireRuntimes(opts([runtime]), makeCtx(dir));

    assert.deepEqual(result.created, []);
    assert.deepEqual(result.skipped, []);
    await assertAbsent(dir, RULES_SURFACES);

    const summary = buildSummary(EMPTY, result, EMPTY, [runtime]);
    assert.ok(
      summary.done.some((line) => /harness section|trigger frontmatter/.test(line)),
      runtime,
    );
  }

  const codexDir = await makeRulesRepo();
  const codex = await wireRuntimes(opts(['codex']), makeCtx(codexDir));
  assert.deepEqual(codex.created, []);
  await assertAbsent(codexDir, RULES_SURFACES);

  const summary = buildSummary(EMPTY, codex, EMPTY, ['codex']);
  assert.ok(summary.done.some((line) => /inline from the harness section/.test(line)));
});

test('native-wiring: an existing opencode.json stays byte-identical and the summary names it', async () => {
  const existing = '{\n  "instructions": [".agents/rules/hand-written.md"]\n}\n';
  const dir = await makeRulesRepo({ 'opencode.json': existing });

  const result = await wireRuntimes(opts(['opencode']), makeCtx(dir));

  assert.equal(await readFile(path.join(dir, 'opencode.json'), 'utf8'), existing);
  assert.deepEqual(result.created, []);
  assert.deepEqual(result.skipped, ['opencode.json']);

  const summary = buildSummary(EMPTY, result, EMPTY, ['opencode']);
  assert.ok(
    summary.kept.some((line) => line.includes('opencode.json')),
    'kept names opencode.json',
  );
  assert.ok(summary.notes.some((line) => line.includes('harness-init') && line.includes('opencode.json')));
});

test('native-wiring: codex suppresses native rules wiring for every runtime', async () => {
  const claudeDir = await makeRepo({}, { git: true });
  const claude = await run(['setup', '--git-host', 'gh', '--runtimes', 'claude,codex'], { cwd: claudeDir });
  assert.equal(claude.code, 0, claude.stderr);
  await assertAbsent(claudeDir, RULES_SURFACES);

  assert.equal((await lstat(path.join(claudeDir, '.claude', 'skills'))).isSymbolicLink(), true);
  assert.equal(await readFile(path.join(claudeDir, 'CLAUDE.md'), 'utf8'), '@AGENTS.md\n');
  assert.match(claude.stdout, /Rules are inlined in the harness section/);

  const cursorDir = await makeRepo({}, { git: true });
  const cursor = await run(['setup', '--git-host', 'gh', '--runtimes', 'codex,cursor'], { cwd: cursorDir });
  assert.equal(cursor.code, 0, cursor.stderr);
  await assertAbsent(cursorDir, ['.cursor']);
});

test('native-wiring: a second run creates no new wiring', async () => {
  const dir = await makeRepo({}, { git: true });
  const args = ['setup', '--git-host', 'gh', '--runtimes', 'claude,cursor'];
  const first = await run(args, { cwd: dir });
  assert.equal(first.code, 0, first.stderr);
  const claudeMd = await readFile(path.join(dir, 'CLAUDE.md'), 'utf8');
  const rulesDir = path.join(dir, '.cursor', 'rules');
  const cursorFiles = await Promise.all(
    (await readdir(rulesDir)).map(async (name) => [name, await readFile(path.join(rulesDir, name), 'utf8')] as const),
  );

  const second = await run(args, { cwd: dir });
  assert.equal(second.code, 0, second.stderr);
  assert.doesNotMatch(second.stdout, /rules wired/);
  assert.equal(await readFile(path.join(dir, 'CLAUDE.md'), 'utf8'), claudeMd);
  assert.equal(await readlink(path.join(dir, '.claude', 'rules')), '../.agents/rules');
  assert.deepEqual(
    await Promise.all(
      (await readdir(rulesDir)).map(async (name) => [name, await readFile(path.join(rulesDir, name), 'utf8')] as const),
    ),
    cursorFiles,
  );

  for (const runtime of ['opencode', 'copilot', 'gemini', 'kiro'] as const) {
    const root = await makeRulesRepo();
    const ctx = makeCtx(root);
    const once = await wireRuntimes(opts([runtime]), ctx);
    const twice = await wireRuntimes(opts([runtime]), ctx);
    assert.ok(once.created.length > 0, `${runtime} creates its wiring`);
    assert.deepEqual(twice.created, [], `${runtime} creates nothing on a second run`);
  }
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { quietGeneratedFiles, RUNTIME_REGISTRY, runtimeRow } from '../src/setup/runtimes.js';
import { flatten } from './helpers/prose.js';
import { assertSkillBasics, readSkill } from './helpers/skill-contract.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

async function readLayout(): Promise<string> {
  const skill = await readSkill('harness-init');
  return skill.read('references/layout.md');
}

test('skill-harness-init-layout: passes the shared skill contract checks', async () => {
  await assertSkillBasics('harness-init');
});

test('layout: bootstrap copies are replaced only without edited or added files', async () => {
  const flat = flatten(await readLayout());

  assert.doesNotMatch(flat, /manifest/);
  assert.match(flat, /ask before anything is deleted/);
  assert.match(flat, /Never overwrite an edited copy/);
});

test('layout: the step forbids moves and writes nothing under codeRepo', async () => {
  const flat = flatten(await readLayout());

  assert.match(flat, /## No moves/);
  assert.match(flat, /never writes under `codeRepo`/);
});

test('proof-quiet-install-init-section: the quiet-install section states its place on both paths', async () => {
  const flat = flatten(await readLayout());

  assert.match(flat, /## Quiet install/);
  assert.match(flat, /Quick setup runs this section right after the path question/);
  assert.match(flat, /Guided setup runs it after the guided steps/);
});

test('proof-quiet-install-init-wire: entry points stay ignored and are never re-included to clear a check', async () => {
  const flat = flatten(await readLayout());

  assert.match(flat, /Every entry point stays ignored/);
  assert.match(flat, /Never re-include one to clear a failed check; show the failure and ask/);
});

test('proof-quiet-install-init-version: the versioning question has five items, defaults and a keep-defaults fallback', async () => {
  const flat = flatten(await readLayout());

  assert.match(flat, /Which harness folders should git track\?/);
  assert.match(flat, /"Rules: instructions your agent always follows" \(ticked\)/);
  assert.match(
    flat,
    /"Decision records \(ADRs\): why the code is the way it is\. They keep your agent's context accurate over the long run, so keep them current" \(ticked\)/,
  );
  assert.match(flat, /"Notes" \(not ticked\)/);
  assert.match(flat, /"Requirements and specs" \(not ticked\)/);
  assert.match(flat, /"Postponed-work notes" \(not ticked\)/);
  assert.match(
    flat,
    /When the question tool can't show items already ticked, never make the person tick the defaults by hand/,
  );
  assert.match(
    flat,
    /"Keep the defaults \(recommended\): Rules and Decision records \(ADRs\)" and "Choose the folders myself"/,
  );
  assert.match(flat, /`AGENTS\.md` and `\.agents\/hooks\/` are always tracked and are not checkboxes/);
  assert.doesNotMatch(flat, /Hooks: scripts/);
  assert.match(flat, /Edit only `\.wolven-harness\/\.gitignore`/);
});

test('proof-quiet-install-init-wire: one diff, one approval, a decline path and Yes and No only', async () => {
  const flat = flatten(await readLayout());

  assert.match(flat, /How should we ignore the harness local-only files\?/);
  assert.match(
    flat,
    /Show one diff with every entry point and every ignore line for those runtimes, and take one approval/,
  );
  assert.match(flat, /On a no, leave everything outside `\.wolven-harness\/` unchanged and say "Nothing changed\."/);
  assert.match(flat, /Options: Yes and No only/);
});

test('proof-quiet-install-init-wording: the quiet install name and both ignore options use the wording table text', async () => {
  const flat = flatten(await readLayout());

  assert.match(flat, /Quiet install: The harness lives in `\.wolven-harness\/`, and git sees only what you pick\./);
  assert.match(flat, /"In `\.gitignore` \(tracked change everyone with repo access sees\)"/);
  assert.match(flat, /"Only on this machine: `\.git\/info\/exclude` \(nothing tracked changes\)"/);
});

test('proof-quiet-install-claude-entry: the Claude Code table lists exactly the six entry points', async () => {
  const text = await readLayout();
  const table = text.slice(text.indexOf('### Claude Code entry points'), text.indexOf('### Claude Code hooks'));
  const rows = table.split('\n').filter((line) => /^\| `/.test(line));

  assert.deepEqual(
    rows.map((row) => row.split('|')[1]?.trim()),
    [
      '`CLAUDE.local.md`',
      '`.claude/skills/`',
      '`.claude/rules/`',
      '`.claude/settings.local.json`',
      '`.worktreeinclude`',
      '`.qmd`',
    ],
  );
});

test('proof-quiet-install-occupied: an occupied entry point keeps the client copy and asks three ways', async () => {
  const flat = flatten(await readLayout());

  assert.match(flat, /"Save as wolven-<name>": the diff links the harness copy beside the client's under that name/);
  assert.match(flat, /"Skip it": the diff creates nothing for that path/);
  assert.match(flat, /Never replace, move or delete a client path/);
});

test('proof-quiet-install-wiring-record: the record has its fields and outcomes, and stays ignored', async () => {
  const text = await readLayout();
  const section = text.slice(text.indexOf('### Wiring record'), text.indexOf('### Harness block'));
  const flat = flatten(section);
  const json = /```json\n([\s\S]*?)```/.exec(section)?.[1];
  assert.ok(json);
  const record = JSON.parse(json) as { entries: { path: string; outcome: string }[] };

  assert.deepEqual(Object.keys(record.entries[0] ?? {}), ['path', 'outcome']);
  for (const outcome of ['linked', 'merged', 'prefixed', 'skipped', 'unwired'])
    assert.match(flat, new RegExp(`- \`${outcome}\`:`));

  const gitignore = await readFile(path.join(ROOT, 'templates', '.wolven-harness', 'gitignore'), 'utf8');
  assert.doesNotMatch(gitignore, /wiring\.json/);
  assert.match(gitignore, /^\*$/m);
});

test('proof-quiet-install-runtime-table: every non-Claude registry runtime has a sourced row matching the registry', async () => {
  const text = await readLayout();
  const section = text.slice(text.indexOf('### Other runtimes'), text.indexOf('### Claude Code hooks'));
  const rows = section.split('\n').filter((line) => /^\| (?!Runtime|---)/.test(line));
  const others = RUNTIME_REGISTRY.filter((row) => row.id !== 'claude');
  const plain = (value: string) => value.replaceAll('`', '');

  assert.equal(rows.length, 8);
  assert.equal(others.length, 8);
  for (const runtime of others) {
    const row = rows.find((line) => line.split('|')[1]?.trim() === runtime.name);
    assert.ok(row, `${runtime.id} has a row`);
    assert.match(row, /\]\(https:\/\/[^)]+\)/, `${runtime.id} row links a source`);
    const cells = row.split('|').map((cell) => plain(cell.trim()));
    assert.ok(cells[4]?.includes(runtime.quietInstall?.manualStep ?? '?'), `${runtime.id} row has its manual step`);
  }

  const flat = flatten(section);
  assert.match(flat, /Options: "Yes" and "No, leave <runtime> without it"/);
});

test('proof-quiet-install-hook-paths: hook commands run scripts under the home', async () => {
  const text = await readLayout();
  const json = /```json\n([\s\S]*?)```/.exec(text.slice(text.indexOf('### Claude Code hooks')))?.[1];
  assert.ok(json);
  const settings = JSON.parse(json) as {
    hooks: Record<string, { hooks: { command: string }[] }[]>;
  };

  assert.equal(
    settings.hooks.PreToolUse?.[0]?.hooks[0]?.command,
    'node "$CLAUDE_PROJECT_DIR/.wolven-harness/.agents/hooks/secret-path-guard.mjs"',
  );
  assert.equal(
    settings.hooks.SessionStart?.[0]?.hooks[0]?.command,
    'node "$CLAUDE_PROJECT_DIR/.wolven-harness/.agents/hooks/worktree-parity.mjs"',
  );
});

test('layout: the installed copy matches the shipped template byte for byte', async () => {
  const template = await readFile(
    path.join(ROOT, 'templates', '.agents', 'skills', 'harness-init', 'references', 'layout.md'),
    'utf8',
  );
  const installed = await readFile(
    path.join(ROOT, '.agents', 'skills', 'harness-init', 'references', 'layout.md'),
    'utf8',
  );

  assert.equal(installed, template);
});

test('convention: step 2 proposes a convention at 80% of 30 subjects and writes only after a yes', async () => {
  const skill = await readSkill('harness-init');
  const body = flatten(skill.body);

  assert.match(body, /last 30 commit subjects/);
  assert.match(body, /80% agreement or more/);

  const flat = flatten(await skill.read('references/convention.md'));

  assert.match(flat, /at least 80%\*\* of the subjects \(24 of 30\)/);
  assert.match(flat, /Show the diff and write only on a yes/);
  assert.match(flat, /"style": "conventional"/);
  assert.match(flat, /"style": "pattern"/);
  assert.match(flat, /Never record a pattern from fewer than 80%/);
  assert.match(flat, /Never pick a convention silently/);
});

test('proof-iter1-switch-cut: harness-init has no layout question, keep-or-switch or switch procedure', async () => {
  const flat = flatten(await readLayout());

  assert.doesNotMatch(flat, /Keep or switch|The switch|Apply this switch|Full install/);
  assert.doesNotMatch(flat, /How much of the harness do you want to version in git\?/);
});

test('proof-iter1-hooks-tracked: .worktreeinclude lists the hooks folder', async () => {
  const flat = flatten(await readLayout());

  assert.match(flat, /\| `\.worktreeinclude` \| Lists [^|]*`\.wolven-harness\/\.agents\/hooks\/`/);
});

test('proof-iter1-cursor-guard: the Cursor hooks block equals what a quiet install renders', async () => {
  const text = await readLayout();
  const json = /```json\n([\s\S]*?)```/.exec(text.slice(text.indexOf('### Cursor hooks')))?.[1];
  assert.ok(json);
  const rendered = quietGeneratedFiles(runtimeRow('cursor'), [], '', '.wolven-harness').get('.cursor/hooks.json');
  assert.ok(rendered);
  assert.deepEqual(JSON.parse(json), JSON.parse(rendered));
});

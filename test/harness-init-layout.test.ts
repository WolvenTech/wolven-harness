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

test('layout: step 2 settles the layout before discovery and links the reference', async () => {
  const skill = await readSkill('harness-init');
  const body = flatten(skill.body);

  assert.match(body, /First settle the layout/);
  assert.match(body, /\[references\/layout\.md\]\(references\/layout\.md\)/);
  assert.match(body, /It asks before `git init`, records `layout` and the harness paths/);
  assert.match(body, /moves no folder/);
});

test('layout: the home layout asks before git init, gitignores codeRepo and records both keys', async () => {
  const flat = flatten(await readLayout());

  assert.match(flat, /Ask for the code repository's path/);
  assert.match(flat, /record it as `codeRepo`/);
  assert.match(flat, /Ask whether this folder should become a git repository/);
  assert.match(flat, /Run `git init` only after the Human agrees/);
  assert.match(flat, /Add the code repository's path to the harness home's `\.gitignore`/);
  assert.match(flat, /Record `layout: "home"` and `codeRepo` in `\.wolven-harness\.json`/);
  assert.match(flat, /Never write a file under `codeRepo`/);
  assert.match(flat, /Run `harness:validate` after the write/);
});

test('layout: the linked layout names the four symlinks, the native wiring and both keys', async () => {
  const flat = flatten(await readLayout());

  assert.match(flat, /Create these symlinks in the open folder/);
  assert.match(flat, /`AGENTS\.md` - `\.agents` - `\.claude\/skills` - `\.qmd`/);
  assert.match(flat, /Then create each wired runtime's native wiring the same way/);
  assert.match(
    flat,
    /directory symlink for `\.claude\/rules`, `\.cursor`, `\.kiro\/steering` or `\.github\/instructions`/,
  );
  assert.match(flat, /file symlink for `GEMINI\.md` or `opencode\.json`/);
  assert.match(flat, /run `wolven-harness setup` when it has no `\.wolven-harness\.json`, and record `codeRepo` there/);
  assert.match(flat, /record `layout: "linked"` and `harnessHome`/);
  assert.match(flat, /Show the diff of the links before creating them/);
});

test('layout: bootstrap copies are replaced only without edited or added files', async () => {
  const flat = flatten(await readLayout());

  assert.match(
    flat,
    /Replace a copy with its symlink only when `doctor` reports no `doctor-drift-edited` file under it and no file was added there/,
  );
  assert.doesNotMatch(flat, /manifest/);
  assert.match(flat, /Remove the copy and create the link in one shown diff/);
  assert.match(flat, /Otherwise the Human has edited that folder: leave it in place/);
  assert.match(flat, /ask before anything is deleted/);
  assert.match(flat, /Never overwrite an edited copy/);
});

test('layout: the step forbids moves and writes nothing under codeRepo', async () => {
  const flat = flatten(await readLayout());

  assert.match(flat, /## No moves/);
  assert.match(flat, /It never moves, renames or deletes a folder or file to make a layout fit/);
  assert.match(flat, /never writes under `codeRepo`/);
  assert.match(
    flat,
    /When a layout cannot be reached without a move, say so, say "Nothing changed\.", and stop with the next step/,
  );
});

test('proof-quiet-install-init-section: the quiet-install section states its place on both paths', async () => {
  const flat = flatten(await readLayout());

  assert.match(flat, /## Quiet install/);
  assert.match(flat, /records `layout: "linked"` and a `harnessHome` of `\.wolven-harness`/);
  assert.match(flat, /Quick setup runs this section right after the path question/);
  assert.match(flat, /Guided setup runs it after the guided steps/);
});

test('proof-quiet-install-init-wire: entry points stay ignored, and the diff explains .qmd', async () => {
  const flat = flatten(await readLayout());

  assert.match(flat, /Every entry point stays ignored/);
  assert.match(flat, /Never re-include one to clear a failed check; show the failure and ask/);
  assert.match(
    flat,
    /"`\.qmd` is the search index for your harness docs\. It lets your agent search your decision records, specs and notes before it answers, instead of working from memory\."/,
  );
});

test('proof-quiet-install-init-version: the versioning question has five items, defaults and a footer', async () => {
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
  assert.match(
    flat,
    /Ticked folders get committed, and everyone with repo access sees them\. Unticked ones stay on this machine and don't reach worktrees\./,
  );
  assert.match(flat, /`AGENTS\.md` and `\.agents\/hooks\/` are always tracked and are not checkboxes/);
  assert.doesNotMatch(flat, /Hooks: scripts/);
  assert.match(flat, /Edit only `\.wolven-harness\/\.gitignore`/);
});

test('proof-quiet-install-init-wire: one diff, one approval, a decline path and the wiring record', async () => {
  const flat = flatten(await readLayout());

  assert.match(flat, /How should we ignore the harness local-only files\?/);
  assert.match(
    flat,
    /Check every entry-point path against what the repository root already holds before the diff is built/,
  );
  assert.match(
    flat,
    /Show one diff with every entry point and every ignore line for those runtimes, and take one approval/,
  );
  assert.match(flat, /bootstrap symlinks .* too, so they stop showing as untracked/);
  assert.match(flat, /has a `\.dockerignore`, the same diff adds `\.wolven-harness\/` to it/);
  assert.match(flat, /On a yes, write the diff, then write the wiring record `\.wolven-harness\/wiring\.json`/);
  assert.match(flat, /On a no, leave everything outside `\.wolven-harness\/` unchanged and say "Nothing changed\."/);
  assert.match(flat, /Add the harness block to <file names>\?/);
  assert.match(flat, /Options: Yes and No only/);
  assert.match(flat, /It is text, never an `@` import/);
});

test('proof-quiet-install-init-wording: each question uses the wording table text and the quiet install name', async () => {
  const flat = flatten(await readLayout());

  assert.match(flat, /Quiet install: The harness lives in `\.wolven-harness\/`, and git sees only what you pick\./);
  assert.match(flat, /"In `\.gitignore` \(tracked change everyone with repo access sees\)"/);
  assert.match(flat, /"Only on this machine: `\.git\/info\/exclude` \(nothing tracked changes\)"/);
  assert.match(
    flat,
    /Create the harness symlinks for <runtime names>\? The diff lists each symlink, the Claude Code hooks it sets up, and any tracked change, such as `\.dockerignore`\./,
  );
  assert.match(
    flat,
    /Add the harness block to <file names>\? \(Tracked change; `AGENTS\.md` is created if missing\.\)/,
  );
  assert.match(flat, /"Tracked change: `<path>`" or "New tracked file: `<path>`"/);
  assert.match(flat, /say "symlinks" to the person/);
});

test('proof-quiet-install-claude-entry: the Claude Code table lists exactly the six entry points', async () => {
  const text = await readLayout();
  const table = text.slice(text.indexOf('### Claude Code entry points'), text.indexOf('### Claude Code hooks'));
  const rows = table.split('\n').filter((line) => /^\| `/.test(line));
  const flat = flatten(table);

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
  assert.match(flat, /`CLAUDE\.local\.md` \| File symlink to `\.wolven-harness\/AGENTS\.md`/);
  assert.match(flat, /A real folder with one symlink per home skill, the bootstrap symlink among them/);
  assert.match(flat, /A real folder with one file symlink per home rule/);
  assert.match(flat, /The secret guard and the worktree-parity hooks/);
  assert.match(
    flat,
    /Lists `CLAUDE\.local\.md`, `\.claude\/rules\/`, `\.claude\/rules\/\*\.md`, each linked `\.claude\/skills\/<name>`, `\.claude\/settings\.local\.json`/,
  );
  assert.match(flat, /`\.qmd` \| Symlink to the home's `\.qmd`/);
});

test('proof-quiet-install-occupied: an occupied entry point keeps the client copy and asks three ways', async () => {
  const flat = flatten(await readLayout());

  assert.match(
    flat,
    /When `\.claude\/skills\/` is a real folder, keep it and add the symlinks beside the client's own skills/,
  );
  assert.match(
    flat,
    /"Your `\.claude\/skills\/` folder is kept\. The harness adds one symlink per skill inside it, and git ignores them\."/,
  );
  assert.match(
    flat,
    /"You already have `<path>`, and it stays as it is\. For the harness's `<name>`: merge it into yours \(tracked change when `<path>` is tracked\), save it next to yours as `wolven-<name>`, or skip it\?"/,
  );
  assert.match(
    flat,
    /"Merge into mine": the wiring diff shows the merged text\. When `<path>` is tracked, the diff line says "Tracked change: `<path>`"/,
  );
  assert.match(flat, /"Save as wolven-<name>": the diff links the harness copy beside the client's under that name/);
  assert.match(flat, /"Skip it": the diff creates nothing for that path/);
  assert.match(flat, /Never replace, move or delete a client path/);
});

test('proof-quiet-install-wiring-record: the record has its fields, outcomes and rerun rule, and stays ignored', async () => {
  const text = await readLayout();
  const section = text.slice(text.indexOf('### Wiring record'), text.indexOf('### Harness block'));
  const flat = flatten(section);
  const json = /```json\n([\s\S]*?)```/.exec(section)?.[1];
  assert.ok(json);
  const record = JSON.parse(json) as { entries: { path: string; outcome: string }[] };

  assert.deepEqual(Object.keys(record.entries[0] ?? {}), ['path', 'outcome']);
  assert.match(flat, /`\.wolven-harness\/wiring\.json`/);
  for (const outcome of ['linked', 'merged', 'prefixed', 'skipped', 'unwired'])
    assert.match(flat, new RegExp(`- \`${outcome}\`:`));
  assert.match(flat, /Write it after each approved wiring diff/);
  assert.match(flat, /Ask again only for an entry point that is missing and has no recorded outcome/);
  assert.match(flat, /The nested `\.gitignore` ignores `wiring\.json`/);

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
    for (const entry of runtime.quietInstall?.entryPoints ?? [])
      assert.ok(cells[2]?.includes(entry), `${runtime.id} row lists ${entry}`);
    assert.ok(cells[4]?.includes(runtime.quietInstall?.manualStep ?? '?'), `${runtime.id} row has its manual step`);
    if (runtime.quietInstall?.trackedEdit !== undefined)
      assert.match(row, /Tracked change: |New tracked file: /, `${runtime.id} row names the tracked edit`);
    else assert.match(cells[3] ?? '', /^None/, `${runtime.id} row offers no tracked edit`);
  }

  const flat = flatten(section);
  assert.match(
    flat,
    /Skills are one symlink per skill in `\.\/\.agents\/skills\/`, and in `\.kiro\/skills\/` for Kiro/,
  );
  assert.match(
    flat,
    /"<runtime> can't read <the harness instructions \/ rules> from a file only on this machine\. Add <change> to `<path>`\? Tracked change: `<path>` \(or New tracked file: `<path>`\)\."/,
  );
  assert.match(flat, /Options: "Yes" and "No, leave <runtime> without it"/);
  assert.match(
    flat,
    /A No, and Codex's instructions, leave the piece not set up to read the harness: name the row's manual step/,
  );
  assert.match(flat, /Codex \| `\.\/\.agents\/skills\/<name>` \| None: Codex follows no import/);
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

test('convention: step 2 reads 30 subjects, proposes at 80% and records both shapes after a yes', async () => {
  const skill = await readSkill('harness-init');
  const body = flatten(skill.body);

  assert.match(body, /Then settle the commit convention/);
  assert.match(body, /\[references\/convention\.md\]\(references\/convention\.md\)/);
  assert.match(body, /last 30 commit subjects/);
  assert.match(body, /80% agreement or more/);
  assert.match(body, /record `commitConvention` in the harness home's `\.wolven-harness\.json`/);

  const flat = flatten(await skill.read('references/convention.md'));

  assert.match(flat, /last 30 commit subjects/);
  assert.match(flat, /git -C <codeRepo> log -30 --format=%s/);
  assert.match(flat, /\^\[A-Z\]\+-\\d\+: /);
  assert.match(flat, /at least 80%\*\* of the subjects \(24 of 30\)/);
  assert.match(flat, /Show the diff and write only on a yes/);
  assert.match(flat, /"style": "conventional"/);
  assert.match(
    flat,
    /"style": "pattern", "pattern": "\^\[A-Z\]\+-\\\\d\+: ", "example": "ABC-123: add the retry guard"/,
  );
  assert.match(flat, /must compile as a JavaScript regular expression/);
  assert.match(flat, /With no clear pattern, the default is Conventional Commits/);
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

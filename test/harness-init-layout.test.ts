import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { RUNTIME_REGISTRY } from '../src/setup/runtimes.js';
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
  assert.match(
    flat,
    /Apart from the confirmed switch to a full install above, it never moves, renames or deletes a folder or file to make a layout fit/,
  );
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

test('proof-quiet-install-init-version: the versioning question has six items, defaults and a footer', async () => {
  const flat = flatten(await readLayout());

  assert.match(flat, /Which harness folders should git track\?/);
  assert.match(flat, /"Rules: instructions your agent always follows" \(ticked\)/);
  assert.match(flat, /"Hooks: scripts Claude Code runs automatically" \(ticked\)/);
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
    /"Keep the defaults \(recommended\): Rules, Hooks and Decision records \(ADRs\)" and "Choose the folders myself"/,
  );
  assert.match(
    flat,
    /Ticked folders get committed, and your client sees them\. Unticked ones stay on this machine and don't reach worktrees\./,
  );
  assert.match(flat, /is always tracked and is not a checkbox/);
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

test('proof-quiet-install-init-wording: each question uses the wording table text and both layout names', async () => {
  const flat = flatten(await readLayout());

  assert.match(flat, /Quiet install: The harness lives in `\.wolven-harness\/`, and git sees only what you pick\./);
  assert.match(
    flat,
    /Full install: The harness sits at the repo root, and git tracks all of it\. Only for repos you own\./,
  );
  assert.match(flat, /"In `\.gitignore` \(tracked change your client sees\)"/);
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

  assert.match(flat, /Claude Code skills are always one symlink per skill/);
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
  assert.match(flat, /Options: "Merge into mine", "Save as wolven-<name>", "Skip it"/);
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
  assert.match(flat, /Skills are one symlink per skill in `\.agents\/skills\/`, and in `\.kiro\/skills\/` for Kiro/);
  assert.match(
    flat,
    /"<runtime> can't read <the harness instructions \/ rules> from a file only on this machine\. Add <change> to `<path>`\? Tracked change: `<path>` \(or New tracked file: `<path>`\)\."/,
  );
  assert.match(flat, /Options: "Yes" and "No, leave <runtime> without it"/);
  assert.match(
    flat,
    /A No, and Codex's instructions, leave the piece not set up to read the harness: name the row's manual step/,
  );
  assert.match(flat, /Codex \| `\.agents\/skills\/<name>` \| None: Codex follows no import/);
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

test('proof-quiet-install-init-fork: the keep-or-switch question precedes the section body and the switch asks to confirm', async () => {
  const flat = flatten(await readLayout());
  const question = flat.indexOf('How much of the harness do you want to version in git?');

  assert.ok(question > flat.indexOf('## Quiet install'));
  assert.ok(question < flat.indexOf('**Place.**'));
  assert.ok(question < flat.indexOf('### Versioning'));
  assert.match(flat, /Options: "Quiet install" \(the default\) and "Full install"/);
  assert.match(flat, /for a repository the person owns/);
  assert.match(flat, /Move `\.wolven-harness\/docs\/` to the root `docs\/`/);
  assert.match(flat, /Remove the rest of `\.wolven-harness\/`/);
  assert.match(flat, /Rewrite `\.wolven-harness\.json` to `layout: "home"`/);
  assert.match(flat, /Apply this switch\? It removes `\.wolven-harness\/` and adds tracked files at the root\./);
  assert.ok(flat.indexOf('Apply this switch?') > flat.indexOf('Rewrite `.wolven-harness.json`'));
  assert.match(flat, /apply the diff and rerun `setup`, which writes the root scaffold/);
  assert.match(flat, /On a no, say "Nothing changed\." and the quiet install stays/);
  assert.match(
    flat,
    /Can't switch to a full install: `<path>` already exists at the repo root\. Nothing changed\. Move or rename it, then ask again\./,
  );
  assert.ok(flat.indexOf('already exists at the repo root') < flat.indexOf('Then show one diff'));
});

test('proof-quiet-install-switch-keeps: edited and added files are carried to the root with the map reversed', async () => {
  const flat = flatten(await readLayout());

  assert.match(flat, /List every file under `\.wolven-harness\/\.agents\/`, ignored files included/);
  assert.match(flat, /`doctor-drift-edited` \(edited since install\) and each one no template installed/);
  assert.match(flat, /Move each to the same path at the root, with the map reversed on skill text/);
  assert.match(flat, /`\.wolven-harness\/docs\/` back to `docs\/`/);
  assert.match(flat, /`\.wolven-harness\/\.agents\/` back to `\.agents\/`/);
  assert.match(flat, /Your edited or added files move to the root: `<paths>`\./);
  assert.match(flat, /Unedited template files are dropped, and the setup rerun recreates them/);
  assert.match(flat, /each carried file's root path/);
});

test('proof-quiet-install-switch-unwires: the switch removes owned wiring by the record and checks for leftovers', async () => {
  const flat = flatten(await readLayout());

  assert.match(flat, /Remove the quiet-install wiring the record names/);
  assert.match(
    flat,
    /The harness symlinks, hooks, ignore lines and harness block for the quiet install are removed: `<paths>`\./,
  );
  for (const kind of [
    'per-skill and per-rule symlinks',
    '`CLAUDE.local.md`',
    '`.qmd`',
    'harness hook entries in `.claude/settings.local.json`',
    'harness lines in `.worktreeinclude`',
    'harness ignore lines in `.gitignore` or `.git/info/exclude`',
    '`.dockerignore` line',
    'bootstrap symlinks',
    "harness block in the client's `AGENTS.md` and `CLAUDE.md`",
  ]) {
    assert.ok(flat.includes(kind), kind);
  }
  assert.match(flat, /Client content around them is kept, and kept client paths .* are not touched/);
  assert.match(flat, /check that no symlink or entry still points into `\.wolven-harness\/`, and report any leftover/);
  assert.match(
    flat,
    /An entry that points into `\.wolven-harness\/` and that the record does not name stops the switch with this message: "Can't switch to a full install: `<path>` points into `\.wolven-harness\/`, and it may not be the harness's\. Nothing changed\. Remove or keep it by hand, then ask again\."/,
  );
});

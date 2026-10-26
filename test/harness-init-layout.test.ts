import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
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
  assert.match(flat, /When a layout cannot be reached without a move, say so and stop/);
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

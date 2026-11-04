import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { flatten } from './helpers/prose.js';

const run = promisify(execFile);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILL = path.join(ROOT, 'templates', '.agents', 'skills', 'harness-init');
const PARITY_HOOK = path.join(ROOT, 'templates', '.agents', 'hooks', 'worktree-parity.mjs');

const SKILL_FILES = [
  'SKILL.md',
  'references/layout.md',
  'references/lean-path.md',
  'references/entry-modes.md',
  'references/adr-migration.md',
  'references/validate-wiring.md',
  'references/convention.md',
  'references/session-note-template.md',
  'references/stub-template.md',
];

async function readHarnessInit(rel: string): Promise<string> {
  return readFile(path.join(SKILL, rel), 'utf8');
}

/** The blank-line-delimited paragraph (or list item) that holds `anchor`, flattened. */
function paragraphAt(text: string, anchor: string): string {
  const at = text.indexOf(anchor);
  assert.ok(at >= 0, `anchor not found: ${anchor}`);
  const start = text.lastIndexOf('\n\n', at);
  const end = text.indexOf('\n\n', at);
  return flatten(text.slice(start < 0 ? 0 : start, end < 0 ? text.length : end));
}

/** Quoted strings that end a question: the text the person reads when the agent asks. */
function quotedQuestions(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .flatMap((paragraph) => [...flatten(paragraph).matchAll(/"([^"]*\?[^"]*)"/g)].map((m) => m[1]));
}

/** The fenced template a person later reads in their own repo. */
function fencedTemplate(text: string): string {
  return [...text.matchAll(/```markdown\n([\s\S]*?)```/g)].map((m) => m[1]).join('\n');
}

const TRACKED = /tracked (change|files?)\b/i;

// invariant: one row per harness-init question whose yes writes a client file outside `.wolven-harness/`.
const WRITES_OUTSIDE_HOME: Array<[file: string, anchor: string]> = [
  ['references/entry-modes.md', 'How much should we change your current AGENTS.md?'],
  ['references/entry-modes.md', 'the agent offers to add an `@AGENTS.md` line'],
  ['references/entry-modes.md', 'Propose re-include rules appended'],
  ['references/layout.md', '"In `.gitignore` (tracked change everyone with repo access sees)"'],
  ['references/layout.md', 'Then ask: "Create the harness symlinks for <runtime names>?'],
  ['references/layout.md', 'Ask: "Add the harness block to <file names>?'],
  ['references/layout.md', 'this question: "<runtime> can\'t read'],
  ['references/layout.md', '"Merge into mine"'],
  ['references/validate-wiring.md', '**On every pull request** (a CI job)'],
  ['references/validate-wiring.md', '**With your existing checks**'],
  ['references/validate-wiring.md', '"On every pull request: new tracked file'],
  ['references/adr-migration.md', '3. **Move it.**'],
  ['SKILL.md', '> Next: <what the step does, in one line, with any tracked change named>'],
];

test('proof-quiet-install-tracked-changes: every question that writes outside the home names its tracked change', async () => {
  for (const [file, anchor] of WRITES_OUTSIDE_HOME) {
    const paragraph = paragraphAt(await readHarnessInit(file), anchor);
    assert.match(paragraph, TRACKED, `${file}: "${anchor}" names no tracked change`);
  }
});

test('proof-quiet-install-terms-first: the introduction comes first, and text people read says "you" with the glossary', async () => {
  const skill = flatten(await readHarnessInit('SKILL.md'));
  const intro = skill.indexOf('The harness is the set of instructions, rules and doc folders');
  const pathQuestion = skill.indexOf('## Lean path');
  assert.ok(intro >= 0, 'SKILL.md has the introduction');
  assert.ok(pathQuestion > intro, 'the introduction comes before the path question');

  const banned =
    /\bthe Human\b|\bdeferrals?\b|\bstubs?\b|\bdrift\b|\bentry points?\b|harness home|\bunwired\b|codeRepo|`linked`|`home`/i;
  for (const file of SKILL_FILES) {
    for (const question of quotedQuestions(await readHarnessInit(file)))
      assert.doesNotMatch(question, banned, `${file}: "${question}"`);
  }
  for (const file of ['references/session-note-template.md', 'references/stub-template.md'])
    assert.doesNotMatch(fencedTemplate(await readHarnessInit(file)), /\bthe Human\b/, `${file} template`);
});

test('proof-quiet-install-next-step: every harness-init stop that changed nothing says so and names the next step', async () => {
  let stops = 0;
  for (const file of SKILL_FILES) {
    const text = await readHarnessInit(file);
    for (const match of text.matchAll(/Nothing changed\./g)) {
      stops++;
      const after = flatten(text.slice(match.index, text.indexOf('\n\n', match.index)));
      assert.match(after, /next step|then /i, `${file}: a stop with no next step: ${after}`);
    }
  }
  assert.ok(stops >= 3, `expected the wiring and no-moves stops, found ${stops}`);
});

test('proof-quiet-install-worktree-stop: harness-init stops before its first question in a worktree with no harness', async () => {
  const skill = flatten((await readHarnessInit('SKILL.md')).replace(/^> ?/gm, ''));
  const stop = skill.indexOf("This session is in a git worktree, and the harness isn't here yet");

  assert.ok(stop >= 0, 'SKILL.md has the worktree stop');
  assert.ok(stop < skill.indexOf('## Lean path'), 'the stop comes before the path question');
  assert.match(skill, /`git rev-parse --git-dir` and `git rev-parse --git-common-dir` differ/);
  assert.match(skill, /A worktree with no `\.wolven-harness\.json` has no harness yet, so stop/);
  assert.match(skill, /never write into the main checkout from here, and never copy the harness in/);
  assert.match(skill, /Nothing changed\. Next: open a session on `<main checkout path>` with no worktree/);
});

test('proof-quiet-install-next-step: the parity warning names the next step', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'wh-copy-'));
  try {
    const { stdout } = await run(process.execPath, [PARITY_HOOK], {
      env: { ...process.env, CLAUDE_PROJECT_DIR: dir },
    });
    const lines = stdout.trim().split('\n');
    assert.ok(lines.length >= 1);
    for (const line of lines) assert.match(line, /Next: /);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { parseMarkdownTables, section } from './helpers/markdown.js';
import { flatten } from './helpers/prose.js';
import { assertNoRuntimeToolNames, assertSkillBasics, readSkill } from './helpers/skill-contract.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const STEPS = [
  '0. Entry integration',
  '1. Legacy ADR migration',
  '2. Discovery',
  '3. Research',
  '4. Suggest',
  '5. Write stubs',
  '6. Score, session note and hand-back',
];

const REFERENCES = [
  'references/entry-modes.md',
  'references/adr-migration.md',
  'references/discovery.md',
  'references/stub-template.md',
  'references/session-note-template.md',
  'references/validate-wiring.md',
  'references/harness-score.md',
  'references/lean-path.md',
];

const LEAN_PATH = 'references/lean-path.md';

const CONSUMER_NAME_RE = /agentic-mkt|compozy/i;

test('skill-shape: passes the shared skill contract checks, including the harness:validate mention', async () => {
  await assertSkillBasics('harness-init', { requireHarnessValidate: true });
});

test('skill-shape: is model-invocable, with no ask-only flag and no agents/openai.yaml', async () => {
  const skill = await readSkill('harness-init');

  assert.equal(skill.frontmatter.name, 'harness-init');
  assert.equal(typeof skill.frontmatter.description, 'string');
  assert.ok(!(skill.frontmatter.description as string).includes('|'));
  assert.equal('disable-model-invocation' in skill.frontmatter, false);
  assert.ok(!skill.files.includes('agents/openai.yaml'));
});

test('skill-shape: lists steps 0 through 6 in order', async () => {
  const skill = await readSkill('harness-init');

  const positions = STEPS.map((step) => {
    const index = skill.body.indexOf(step);
    assert.ok(index >= 0, `missing step "${step}"`);
    return index;
  });

  for (let i = 1; i < positions.length; i++) {
    assert.ok(positions[i] > positions[i - 1], `step "${STEPS[i]}" must come after "${STEPS[i - 1]}"`);
  }
});

test('proof-full-step1-covered: step 1 runs only when covered and validate reports legacy-adr', async () => {
  const skill = await readSkill('harness-init');

  const migrationSection = flatten(skill.body.split(/^### 1\. Legacy ADR migration/m)[1]?.split(/^### /m)[0] ?? '');
  assert.match(
    migrationSection,
    /Runs when "Move old decision records" is covered and `harness:validate` reports `legacy-adr`/,
  );
});

test('skill-shape: re-run skips step 0, step 1, and resumes a draft session note', async () => {
  const skill = await readSkill('harness-init');
  const flat = flatten(skill.body);

  assert.match(
    flat,
    /step 0 is skipped when `WOLVEN\.md` is already gone, or `AGENTS\.md` already holds the harness start marker/i,
  );
  assert.match(flat, /step 1 is skipped when there are no legacy-adr warnings/i);
  assert.match(flat, /draft.*session note.*interrupted run.*is resumed/i);
  assert.match(flat, /resumed, not replaced/i);
});

test('skill-shape: an AGENTS.md that already holds the harness section is refreshed, never folded twice', async () => {
  const flat = flatten((await readSkill('harness-init')).body);

  assert.match(flat, /already holds the harness section was integrated by an earlier run/i);
  assert.match(flat, /never fold it a second time/i);
  assert.match(flat, /show the diff, ask whether to refresh the section, then delete `WOLVEN\.md`/i);
});

test('skill-shape: each writing step runs validate, shows the diff first, and waits for the choice', async () => {
  const flat = flatten((await readSkill('harness-init')).body);

  assert.match(flat, /runs `harness:validate` right after it writes/i);
  assert.match(flat, /shows the human the diff before writing/i);
  assert.match(flat, /waits for the human's choice/i);
});

test("skill-shape: three phases, each gated on a clean validate and the human's yes, never a commit per file", async () => {
  const skill = await readSkill('harness-init');
  const flat = flatten(skill.body);

  assert.match(flat, /\|\s*Entry\s*\|\s*0\s*\|/);
  assert.match(flat, /\|\s*Migration\s*\|\s*1\s*\|/);
  assert.match(flat, /\|\s*Setup\s*\|\s*2.6\s*\|/);

  assert.match(flat, /once `harness:validate` exits 0/i);
  assert.match(flat, /0 legacy-warn/i);
  assert.match(flat, /through `code-commit`/);
  assert.match(flat, /commit only on the human's yes/i);
  assert.match(flat, /never a single commit at the end/i);
  assert.match(flat, /never a commit per file, ADR, claim, or stub/i);
  assert.match(flat, /declined commit leaves that phase uncommitted/i);
  assert.match(flat, /next phase's offer covers only its own paths/i);
});

test('skill-shape: the eight references exist and are each linked from the step that uses them', async () => {
  const skill = await readSkill('harness-init');

  for (const ref of REFERENCES) {
    assert.ok(skill.files.includes(ref), `missing reference file ${ref}`);
    const escaped = ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.match(skill.body, new RegExp(`\\[${escaped}\\]\\(${escaped}\\)`), `no link to ${ref} in the body`);
  }
});

test('skill-shape: names the other skills it consults only in backticks, never as a relative link', async () => {
  const skill = await readSkill('harness-init');

  for (const name of ['adr', 'research', 'code-commit', 'qmd', 'grilling']) {
    assert.match(skill.body, new RegExp(`\`${name}\``));
    assert.doesNotMatch(skill.body, new RegExp(`\\]\\(\\.\\./${name}/`));
  }
});

test('runtime-rules: the four runtime gates are present under Hard gates', async () => {
  const skill = await readSkill('harness-init');
  const gates = flatten(skill.body.split(/^## Hard gates/m)[1]?.split(/^## /m)[0] ?? '');

  assert.match(gates, /drives what comes next/i);
  assert.match(gates, /one question at a time/i);
  assert.match(gates, /recommended option listed first/i);
  assert.match(gates, /never invent/i);
  assert.match(gates, /no status, successor ADR, entry mode, or decision/i);
  assert.match(gates, /names? no specific consumer repository|no consumer names/i);
  assert.match(gates, /questions are plain language/i);
  assert.match(gates, /supporting detail, never the subject/i);
});

test('runtime-rules: a failing claim after migration is expected input, not a defect', async () => {
  const flat = flatten((await readSkill('harness-init')).body);

  assert.match(flat, /claim that starts failing after migration is expected input/i);
});

test('runtime-rules: no file in the harness-init folder names a real consumer repository', async () => {
  const skill = await readSkill('harness-init');

  for (const rel of skill.files) {
    const content = await skill.read(rel);
    assert.doesNotMatch(content, CONSUMER_NAME_RE, `${rel} names a consumer repository`);
  }
});

test('runtime-rules: no unguarded runtime-specific question tool name in the skill body', async () => {
  const skill = await readSkill('harness-init');
  assertNoRuntimeToolNames(skill.body);
});

test('skill-harness-init: asks how harness:validate is wired, with three options, and writes nothing without a yes', async () => {
  const skill = await readSkill('harness-init');
  const step = flatten(skill.body.split(/^### 6\. /m)[1]?.split(/^## /m)[0] ?? '');

  assert.match(step, /how should `harness:validate` be wired/i);
  assert.match(step, /\(a\) as a CI job on pull requests/);
  assert.match(step, /\(b\) chained into the repo's existing `validate` or `test` script/);
  assert.match(step, /\(c\) local only/);
  assert.match(step, /recommended option first/i);
  assert.match(step, /Nothing is written without the Human's yes/);

  const ref = flatten(await skill.read('references/validate-wiring.md'));
  assert.match(ref, /ask in plain language how `harness:validate` should run/i);
  assert.match(ref, /`\.github\/workflows\/\*\.yml`/);
  assert.match(ref, /`bitbucket-pipelines\.yml`/);
  assert.match(ref, /`pnpm install --frozen-lockfile`/);
  assert.match(ref, /must set up\s+pnpm and Node ≥ 22 before it runs/);
  assert.match(ref, /`pnpm\/action-setup`/);
  assert.match(ref, /`actions\/setup-node`/);
  assert.match(ref, /`corepack enable`/);
  assert.match(ref, /`pnpm harness:validate`/);
  assert.match(ref, /`&& pnpm harness:validate`/);
  assert.match(ref, /Nothing is written without a yes: show the diff, wait for the Human's yes, then write/);

  const note = flatten(await skill.read('references/session-note-template.md'));
  assert.match(note, /## Validate wiring/);
});

test('skill-harness-init: step 0 puts the entry mode to the Human as a question and the note records question, recommendation and answer', async () => {
  const skill = await readSkill('harness-init');
  const step = flatten(skill.body.split(/^### 0\. /m)[1]?.split(/^### /m)[0] ?? '');
  assert.match(step, /Put the mode to the Human as one question, the recommended mode first with the reason/);
  assert.match(step, /never pick it silently/i);

  const modes = flatten(await skill.read('references/entry-modes.md'));
  assert.match(modes, /Never pick a mode silently/);
  assert.match(modes, /put to the Human as one question phrased in plain language/i);

  const note = flatten(await skill.read('references/session-note-template.md'));
  assert.match(note, /the mode question as asked, the mode recommended and why, and the Human's answer/);
  assert.match(note, /the wiring question as asked, the option recommended and why, the Human's answer/);
});

test('skill-harness-init: step 6 scores the harness, asks per dimension, and never drops a check without a yes', async () => {
  const skill = await readSkill('harness-init');
  const step = flatten(skill.body.split(/^### 6\. /m)[1]?.split(/^## /m)[0] ?? '');

  assert.match(step, /run `harness:score`/i);
  assert.match(step, /For each dimension with a failing check, ask one question/);
  assert.match(step, /never drop one without the Human's yes/);
  assert.match(
    step,
    /The run ends at hand-back\. Defining stubs or building score gaps is a separate change on its own branch/,
  );
  assert.match(step, /If the Human asks for it in the same session, say so and stop/);
  assert.ok(
    step.indexOf('harness:score') < step.indexOf('harness:validate'),
    'scoring comes before the wiring question',
  );

  const ref = flatten(await skill.read('references/harness-score.md'));
  assert.match(ref, /ask one question in plain language/i);
  assert.match(ref, /state what the repo lacks and what building it means/i);
  assert.match(ref, /check IDs.*never the subject/i);
  assert.match(ref, /explain non-obvious failure causes/i);
  assert.match(ref, /spell out what a drop costs/i);
  assert.match(
    ref,
    /L1 Context ≥ 40%; L2 Context ≥ 60%, Skills ≥ 30% or Hooks ≥ 30%, Hygiene ≥ 50%; L3 Sensors ≥ 60%, CI ≥ 50%; L4 Hooks ≥ 70%, Total ≥ 80%/,
  );
  assert.match(ref, /`HYG-03`, `HYG-04` and `HYG-06` detect leaked credentials and can never be dropped/);
  assert.match(ref, /add `"no-hooks"` to `extends`/);
  assert.match(ref, /Never build a failing check inside this run/);
  assert.match(ref, /The run ends at hand-back.*separate change on its own branch/);
  assert.match(ref, /Nothing is written without a yes/);

  const note = flatten(await skill.read('references/session-note-template.md'));
  assert.ok(note.indexOf('## Stubs') < note.indexOf('## Harness score'), 'Harness score follows Stubs');
  assert.ok(
    note.indexOf('## Harness score') < note.indexOf('## Validate wiring'),
    'Harness score precedes Validate wiring',
  );
});

test('proof-basics-path-question: the Human picks the path from one plain question, basics first', async () => {
  const skill = await readSkill('harness-init');
  const raw = await skill.read(LEAN_PATH);
  const question = flatten(section(raw, '## The path question'));

  assert.match(question, /"How much setup do you want right now\?"/);
  assert.ok(
    question.indexOf('Just the basics') < question.indexOf('The full tour'),
    'Just the basics is offered before The full tour',
  );
  assert.match(question, /\*\*Just the basics\*\* \(recommended\)/);
  assert.match(question, /Never pick it for them from what the tree shows/);
  assert.ok(raw.indexOf('## Resume first') < raw.indexOf('## The path question'), 'resume is checked first');

  const fork = flatten(section(skill.body, '## Lean path'));
  assert.ok(skill.body.indexOf('## Re-run skips') < skill.body.indexOf('## Lean path'), 're-run skips come first');
  assert.match(fork, /"How much setup do you want right now\?"/);

  for (const rel of skill.files) {
    assert.doesNotMatch(await skill.read(rel), /thin-evidence/i, `${rel} still judges the path from the tree`);
  }
});

test('proof-basics-resume: a draft note resumes its path, and a stable note asks the path question again', async () => {
  const skill = await readSkill('harness-init');
  const resume = flatten(section(await skill.read(LEAN_PATH), '## Resume first'));

  assert.match(
    resume,
    /`draft` note that records a \*\*Path:\*\* resumes on that path, with the goal and coverage it records/,
  );
  assert.match(resume, /Ask none of them again/);
  assert.match(resume, /`stable` note means an earlier run finished\. It does not block a new run/);
  assert.match(resume, /the path question is asked again/);
  assert.match(
    flatten(section(skill.body, '## Re-run skips')),
    /resumed, not replaced, with the path, goal and coverage it already records/,
  );
});

test('proof-basics-three-questions: the lean path asks the path, the goal and the AGENTS.md question, in that order', async () => {
  const asks = flatten(section(await (await readSkill('harness-init')).read(LEAN_PATH), '## What the lean path asks'));

  assert.match(asks, /In this order, and nothing else/);
  const order = [
    'The path question above',
    'What do you want to get done first in this repo?',
    'how much to change `AGENTS.md`',
  ];
  const positions = order.map((phrase) => {
    const index = asks.indexOf(phrase);
    assert.ok(index >= 0, `missing "${phrase}"`);
    return index;
  });
  assert.ok(positions[0] < positions[1] && positions[1] < positions[2], 'path, then goal, then AGENTS.md');
  assert.match(asks, /never compose one for the Human/);
  assert.match(asks, /become questions only when they find something/);
});

test('proof-basics-skips: the lean path leaves steps 1 to 5 and both step 6 questions for later', async () => {
  const skips = flatten(
    section(await (await readSkill('harness-init')).read(LEAN_PATH), '## What the lean path does not run'),
  );

  assert.match(skips, /\*\*Left for later\*\* in the note and listed in the hand-back/);
  assert.match(skips, /Step 1, legacy ADR migration/);
  assert.match(skips, /Step 2, discovery: neither reading the repo nor its questions/);
  assert.match(skips, /Step 3, research/);
  assert.match(skips, /Steps 4 and 5, skill proposals and stubs/);
  assert.match(skips, /Step 6's score-gap questions/);
  assert.match(skips, /Step 6's question about how to check the harness/);
});

test('proof-basics-empty-goal: an empty goal is recorded as none given and never asked again', async () => {
  const asks = flatten(section(await (await readSkill('harness-init')).read(LEAN_PATH), '## What the lean path asks'));

  assert.match(asks, /An empty answer is recorded as "none given", and the run moves on without asking again/);
});

test('proof-basics-writes: the lean path writes only the step 0 change and the note, with one entry commit offer', async () => {
  const writes = flatten(
    section(await (await readSkill('harness-init')).read(LEAN_PATH), '## What the lean path writes'),
  );

  assert.match(writes, /Only step 0's change and the session note/);
  assert.match(writes, /the `AGENTS\.md` change, the `WOLVEN\.md` change that goes with it/);
  assert.match(writes, /one commit, for the entry phase/);
});

test('proof-leak-checks-every-path: every path reads the leaked-credential checks before step 0 writes anything', async () => {
  const skill = await readSkill('harness-init');

  const gate = skill.body.indexOf('## Leaked credentials before step 0');
  assert.ok(gate >= 0, 'SKILL.md has a leaked-credential gate section');
  assert.ok(gate < skill.body.indexOf('### 0. Entry integration'), 'the gate comes before step 0 writes anything');
  const gateText = flatten(section(skill.body, '## Leaked credentials before step 0'));
  assert.match(gateText, /before step 0 writes anything \(the session note included\)/);
  assert.match(
    gateText,
    /read the leaked-credential checks: `HYG-03`, `HYG-04` and `HYG-06`\. A failure stops the run/,
  );
  const step6 = flatten(skill.body.split(/^### 6\. /m)[1]?.split(/^## /m)[0] ?? '');
  assert.match(step6, /The leaked-credential checks already ran before step 0/);

  const score = flatten(
    section(await skill.read('references/harness-score.md'), '## Leaked-credential checks on every path'),
  );
  assert.match(score, /Every run reads the leaked-credential checks, whichever path the Human picked/);
  assert.match(
    score,
    /They run before step 0, so a leak stops the run before the session note or any other file is written/,
  );
  assert.match(
    score,
    /When the score is not covered this run, nothing else from the report is recorded or asked about/,
  );
  assert.match(score, /If the Human declines the install, the run continues/);
  assert.match(score, /"leaked-credential checks not run" under \*\*Left for later\*\*/);

  const runs = flatten(section(await skill.read(LEAN_PATH), '## What the lean path runs'));
  const leak = runs.indexOf('The leaked-credential checks');
  assert.ok(
    leak >= 0 && leak < runs.indexOf('Step 0, entry integration'),
    'the lean path checks for leaks before step 0',
  );
  assert.match(
    runs,
    /after the goal question and before step 0\. A leaked credential stops the run before anything else is written/,
  );
});

test('proof-full-coverage-checklist: the full tour opens with six ticked items, each mapped to its step', async () => {
  const skill = await readSkill('harness-init');
  const raw = section(skill.body, '## Full tour coverage');
  const coverage = flatten(raw);

  assert.match(coverage, /before step 0, show one checklist: "What should this run cover\?" Every item starts ticked/);
  const [table] = parseMarkdownTables(raw);
  assert.deepEqual(table.headers, ['Item', 'Covers']);
  assert.deepEqual(
    table.rows.map((row) => row[0]),
    [
      'Move old decision records',
      "Ask about the project's stage and plans",
      'Look up your tools on the web',
      'Suggest skills for this repo',
      'Check the harness score now',
      'Set up automatic checks',
    ],
  );
  assert.deepEqual(
    table.rows.map((row) => row[1].split(',')[0]),
    ['Step 1', 'Step 2', 'Step 3', 'Steps 4 and 5', 'Step 6', 'Step 6'],
  );
  assert.ok(
    skill.body.indexOf('## Full tour coverage') < skill.body.indexOf('## Workflow'),
    'coverage comes before step 0',
  );
});

test('proof-full-unticked-is-later: an unticked item never runs and is listed for later', async () => {
  const skill = await readSkill('harness-init');
  const coverage = flatten(section(skill.body, '## Full tour coverage'));

  assert.match(coverage, /An unticked item is never asked about or run: record it under \*\*Left for later\*\*/);
  assert.match(
    coverage,
    /File-based discovery and the repo and `qmd` search still run on the full path, whatever is ticked/,
  );
  assert.match(
    coverage,
    /With every item unticked, the run reads the leaked-credential checks, makes only step 0's change, and hands back/,
  );

  const step6 = flatten(skill.body.split(/^### 6\. /m)[1]?.split(/^## /m)[0] ?? '');
  assert.match(step6, /when "Set up automatic checks" is covered/);
  assert.match(step6, /When "Check the harness score now" is covered/);
});

test('proof-wiring-plain-labels: the wiring question asks how to check the harness, with three labels', async () => {
  const ref = flatten(await (await readSkill('harness-init')).read('references/validate-wiring.md'));

  assert.match(ref, /The question is "How should we check the harness\?"/);
  assert.match(ref, /\*\*On every pull request\*\* \(a CI job\)/);
  assert.match(ref, /\*\*With your existing checks\*\* \(chained into the existing script\)/);
  assert.match(ref, /\*\*Only when I run it\*\* \(local only\)/);
});

test('proof-handback-three-parts: the hand-back says what is installed, what waits, and what to do next', async () => {
  const step6 = flatten((await readSkill('harness-init')).body.split(/^### 6\. /m)[1]?.split(/^## /m)[0] ?? '');

  assert.match(step6, /hand the run back to the Human in one closing message with three parts/);
  assert.match(
    step6,
    /\*\*What's installed:\*\* the skills and the runtimes they are ready in, the `AGENTS\.md` change/,
  );
  assert.match(step6, /\*\*Left for later:\*\* every step this run did not run/);
  assert.match(step6, /\*\*Next steps:\*\* a numbered list fitted to the installed skill sets/);
});

test('proof-handback-spec-offer: the hand-back offers a spec for the goal and starts nothing without a yes', async () => {
  const step6 = flatten((await readSkill('harness-init')).body.split(/^### 6\. /m)[1]?.split(/^## /m)[0] ?? '');

  assert.match(step6, /"Should we start with a spec for “<goal>”\?" when the Human gave a goal/);
  assert.match(step6, /"What should we build first\?" when none was given/);
  assert.match(step6, /On a yes, the run ends and `code-spec` starts as separate work on its own branch/);
  assert.match(step6, /Nothing starts without a yes/);
});

test('proof-no-stale-lean-tests: no test still pins the replaced lean path', async () => {
  const testDir = path.join(ROOT, 'test');
  const self = path.basename(fileURLToPath(import.meta.url));
  // why: the phrases are split so this file does not match the list it guards.
  const retired = [
    ['defers exactly these', 'four items'],
    ['A declined item runs as', 'on the full path'],
    ['Skill proposals (step 4) are', 'never deferred'],
    ['shows the four', 'beats in order'],
  ].map((parts) => parts.join(' '));

  for (const name of await readdir(testDir)) {
    if (!name.endsWith('.test.ts') || name === self) continue;
    const content = await readFile(path.join(testDir, name), 'utf8');
    for (const phrase of retired) {
      assert.ok(!content.includes(phrase), `${name} still pins "${phrase}"`);
    }
  }
});

test('skill-harness-init: lean rules live only in lean-path.md, which SKILL.md loads', async () => {
  const skill = await readSkill('harness-init');

  const workflow = skill.body.split(/^## Workflow/m)[1]?.split(/^## Anti-patterns/m)[0] ?? '';
  assert.ok(workflow.length > 0, 'SKILL.md has a Workflow section');
  assert.doesNotMatch(workflow, /lean/i, 'steps 0–6 carry no lean wording');

  for (const ref of ['references/discovery.md', 'references/harness-score.md', 'references/validate-wiring.md']) {
    assert.doesNotMatch(await skill.read(ref), /lean/i, `${ref} carries no lean wording`);
  }

  assert.match(skill.body, /\[references\/lean-path\.md\]\(references\/lean-path\.md\)/);
});

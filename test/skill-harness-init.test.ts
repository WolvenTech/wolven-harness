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
  'references/layout.md',
  'references/convention.md',
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
    /Runs when `harness:validate` reports `legacy-adr` and the Human runs it at the guided step question/,
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

test('skill-shape: no step offers a commit; the run makes one offer at the end, gated on a clean validate', async () => {
  const skill = await readSkill('harness-init');
  const flat = flatten(skill.body);

  assert.match(flat, /Every writing step shows the Human the diff before writing/);
  assert.match(flat, /runs `harness:validate` right after it writes/i);
  assert.match(flat, /waits for the Human's choice/i);
  assert.match(flat, /No step offers a commit; the run makes one offer, at the end/);
  assert.match(flat, /once `harness:validate` exits 0 \(`0 legacy-warn` as well, when migration ran\)/i);
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
  assert.match(ref, /sets up Node ≥ 22 before the install and validate steps/);
  assert.match(ref, /`actions\/setup-node`/);
  assert.match(ref, /`corepack enable`/);
  assert.match(ref, /recorded `packageManager`/);
  for (const manager of ['npm', 'yarn', 'pnpm', 'none']) {
    assert.match(ref, new RegExp(`\\| \`${manager}\` \\|`), `${manager} has a branch`);
  }
  assert.match(ref, /`npm ci`/);
  assert.match(ref, /`npm run harness:validate`/);
  assert.match(ref, /`yarn install --frozen-lockfile`/);
  assert.match(ref, /`yarn harness:validate`/);
  assert.match(ref, /`pnpm\/action-setup`/);
  assert.match(ref, /`pnpm install --frozen-lockfile`/);
  assert.match(ref, /`pnpm harness:validate`/);
  assert.match(ref, /no install step/);
  assert.match(ref, /globally installed `wolven-harness validate`/);
  assert.match(ref, /Append `&& ` and the run-script form/);
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
  assert.match(note, /the mode question as asked, the mode recommended and why, and your answer/);
  assert.match(note, /the wiring question as asked, the option recommended and why, your answer/);
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
  assert.match(
    ref,
    /`HYG-03`, `HYG-04` and `HYG-06` detect leaked credentials and can never be dropped\. The score step asks no dimension question about them/,
  );
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

test('proof-basics-path-question: the Human picks the path from one plain question, quick setup first', async () => {
  const skill = await readSkill('harness-init');
  const raw = await skill.read(LEAN_PATH);
  const question = flatten(section(raw, '## The path question'));

  assert.match(question, /"How much setup do you want right now\?"/);
  assert.ok(
    question.indexOf('Quick setup') < question.indexOf('Guided setup'),
    'Quick setup is offered before Guided setup',
  );
  assert.match(question, /\*\*Quick setup \(recommended\)\*\*: connect the harness to <runtime names>;/);
  assert.match(question, /everything else can wait/);
  assert.match(question, /\*\*Guided setup\*\*: walk through every step, skipping whatever you don't want yet/);
  assert.match(question, /Never pick it for them from what the tree shows/);
  assert.ok(raw.indexOf('## Resume first') < raw.indexOf('## The path question'), 'resume is checked first');

  const fork = flatten(section(skill.body, '## Lean path'));
  assert.ok(skill.body.indexOf('## Re-run skips') < skill.body.indexOf('## Lean path'), 're-run skips come first');
  assert.match(fork, /holds the resume check, the path question and the whole lean path/);

  for (const rel of skill.files) {
    assert.doesNotMatch(await skill.read(rel), /thin-evidence/i, `${rel} still judges the path from the tree`);
  }
});

test('proof-basics-resume: a draft note resumes its path, and a stable note asks the path question again', async () => {
  const skill = await readSkill('harness-init');
  const resume = flatten(section(await skill.read(LEAN_PATH), '## Resume first'));

  assert.match(resume, /`draft` note that records a \*\*Path:\*\* resumes on that path, with the answers it records/);
  assert.match(resume, /Ask none of them again/);
  assert.match(resume, /`stable` note means an earlier run finished\. It does not block a new run/);
  assert.match(resume, /the path question is asked again/);
  assert.match(
    flatten(section(skill.body, '## Re-run skips')),
    /resumed, not replaced, with the path and answers it already records/,
  );
});

test('proof-basics-asks: the lean path asks the path question, then the AGENTS.md question in a full install, and no goal', async () => {
  const asks = flatten(section(await (await readSkill('harness-init')).read(LEAN_PATH), '## What the lean path asks'));

  assert.match(asks, /In this order, and nothing else/);
  const order = ['The path question above', 'how much to change `AGENTS.md`'];
  const positions = order.map((phrase) => {
    const index = asks.indexOf(phrase);
    assert.ok(index >= 0, `missing "${phrase}"`);
    return index;
  });
  assert.ok(positions[0] < positions[1], 'path, then AGENTS.md');
  assert.match(asks, /become questions only when they find something/);
  assert.doesNotMatch(asks, /What do you want to get done first/);
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

test('proof-basics-writes: the lean path writes only the step 0 change and the note, with the one commit offer at the end', async () => {
  const writes = flatten(
    section(await (await readSkill('harness-init')).read(LEAN_PATH), '## What the lean path writes'),
  );

  assert.match(writes, /In a full install, only step 0's change and the session note/);
  assert.match(writes, /the `AGENTS\.md` change, the `WOLVEN\.md` change that goes with it/);
  assert.match(writes, /The run ends with the one commit offer in `SKILL\.md`/);
  assert.match(writes, /In a quiet install, only what the quiet-install section writes and the session note/);
});

test('proof-safety-audit-offered-last: every path asks first, promises secrets stay unread, and offers it before the commit offer', async () => {
  const skill = await readSkill('harness-init');

  assert.doesNotMatch(skill.body, /## Leaked credentials before step 0/);
  const step6 = flatten((skill.body.split(/^### 6\. /m)[1]?.split(/^## /m)[0] ?? '').replace(/^> ?/gm, ''));
  assert.match(
    step6,
    /Last step: do you want a safety audit\? The harness never opens your `\.env` or key files, and it blocks your agent from opening them\. This audit checks that protection is in place: that git ignores your `.env` files, and that no key was pasted into your MCP config or harness files, which your agent loads anyway\. It reports file names, never values\./,
  );
  assert.match(
    flatten(skill.body.replace(/^\s*> ?/gm, '')),
    /I can't find `wolven-harness` on this machine, so I can't check the setup\. Next: install it with `<install command>`, then tell me to continue\./,
  );
  assert.doesNotMatch(step6, /looks through this repo/);
  assert.match(step6, /"and its rules tell your agent not to open them"/);
  assert.match(step6, /"Run the audit \(recommended\)" and "Skip it"\. Never run it unasked/);
  assert.match(step6, /read only `HYG-03`, `HYG-04` and `HYG-06`/);
  assert.match(
    step6,
    /Never open a `\.env` or key file, a flagged file or a secret-shaped file yourself, and never print a value/,
  );
  assert.match(step6, /A finding never stops the run/);
  assert.match(step6, /Setup didn't cause this, and the audit changed nothing\. Next: have git ignore that file/);
  assert.match(step6, /Leave any path with a finding out of the commit offer/);
  assert.match(step6, /"safety audit not run" under \*\*Left for later\*\*/);
  assert.ok(
    step6.indexOf('do you want a safety audit') < step6.indexOf('make the one commit offer'),
    'the safety audit comes before the commit offer',
  );

  const score = flatten(
    section(await skill.read('references/harness-score.md'), '## Safety audit at the end of setup'),
  );
  assert.match(score, /`HYG-03` looks only at file names/);
  assert.match(score, /It never opens the file/);
  assert.match(score, /Never open a flagged file or a secret-shaped file to look closer/);
  assert.match(
    score,
    /When the score is not covered this run, nothing else from the report is recorded or asked about/,
  );

  const runs = flatten(section(await skill.read(LEAN_PATH), '## What the lean path runs'));
  const check = runs.indexOf('The safety audit question');
  assert.ok(
    check > runs.indexOf('step 0, entry integration'),
    'the lean path offers the safety audit after the setup steps',
  );
  assert.match(runs, /as the last step, before the commit offer\. It runs only on a yes/);
  assert.doesNotMatch(runs, /stops the run/);
});

test('proof-guided-no-checklist: guided setup opens with repo and role, then one step question per phase, in order', async () => {
  const skill = await readSkill('harness-init');
  const raw = section(skill.body, '## Guided setup');
  const guided = flatten(raw.replace(/^> ?/gm, ''));

  assert.match(guided, /asks no coverage checklist/);
  assert.match(guided, /opens with one question, "What's this repo for, and what's your role in it\?"/);
  assert.match(guided, /which replaces the goal question/);
  assert.match(guided, /Next: <what the step does, in one line, with any tracked change named>\. Run it, or skip\?/);
  assert.match(guided, /The options are "Run it" and "Skip it"/);
  assert.match(guided, /asked once per phase and never shown as a list/);
  const [table] = parseMarkdownTables(raw);
  assert.deepEqual(
    table.rows.map((row) => row[0]),
    ['Migration', 'Research', 'Skill suggestions', 'Score'],
  );
  assert.match(guided, /The checks question closes the phases and carries its own "Skip it"/);
  assert.ok(
    skill.body.indexOf('## Guided setup') < skill.body.indexOf('## Workflow'),
    'guided setup comes before step 0',
  );
  assert.doesNotMatch(skill.body, /What should this run cover/);
});

test('proof-guided-skipped-is-later: a skipped step never runs and is listed for later', async () => {
  const skill = await readSkill('harness-init');
  const guided = flatten(section(skill.body, '## Guided setup'));

  assert.match(
    guided,
    /A skipped step is never asked about or run again this session: record it under \*\*Left for later\*\*/,
  );
  assert.match(guided, /File-based discovery and the repo and `qmd` search still run, whatever is skipped/);

  const step6 = flatten(skill.body.split(/^### 6\. /m)[1]?.split(/^## /m)[0] ?? '');
  assert.match(step6, /in guided setup, put the checks question to the Human, with its own skip/);
  assert.match(step6, /When the Human runs the score step, run `harness:score` again/);
});

test('proof-wiring-plain-labels: the wiring question asks how to check the harness, with three labels', async () => {
  const ref = flatten(await (await readSkill('harness-init')).read('references/validate-wiring.md'));

  assert.match(ref, /The question is "How should we check the harness\?"/);
  assert.match(ref, /\*\*On every pull request\*\* \(a CI job\)/);
  assert.match(ref, /\*\*With your existing checks\*\* \(chained into the existing script\)/);
  assert.match(ref, /\*\*Only when I run it\*\* \(local only\)/);
});

test('proof-quiet-install-checks-question: a quiet install offers only-when-I-run-it, then every pull request, and no existing-checks option', async () => {
  const ref = flatten(await (await readSkill('harness-init')).read('references/validate-wiring.md'));
  const section = ref.split(/### In a quiet install/)[1]?.split(/## What each answer does/)[0] ?? '';
  const first = '"Only when I run it (recommended): `wolven-harness validate`"';
  const second =
    '"On every pull request: new tracked file `.github/workflows/<file>`, which everyone with repo access sees"';

  assert.ok(section.includes(first), 'first option text');
  assert.ok(section.includes(second), 'second option text');
  assert.ok(section.indexOf(first) < section.indexOf(second), 'only-when-I-run-it comes first');
  assert.match(section, /On guided setup it also offers "Skip it"/);
  assert.match(section, /"With your existing checks" is not offered/);
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

test('proof-handback-next-work: the hand-back asks what to work on next and starts nothing without a yes', async () => {
  const step6 = flatten((await readSkill('harness-init')).body.split(/^### 6\. /m)[1]?.split(/^## /m)[0] ?? '');

  assert.match(step6, /End the message by asking what to work on next/);
  assert.match(step6, /`code-spec` starts as separate work on its own branch/);
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

test('proof-quiet-install-init-step0: the skill opens with the introduction and skips step 0 in a quiet install', async () => {
  const skill = await readSkill('harness-init');
  const flat = flatten(skill.body.replace(/^> ?/gm, ''));

  const intro =
    'The harness is the set of instructions, rules and doc folders your coding agent follows. In a quiet install it lives in `.wolven-harness/`. Before anything outside that folder changes, you see the diff and say yes. Nothing is ever pushed.';
  assert.ok(flat.includes(intro), 'the introduction is quoted verbatim');
  assert.ok(flat.indexOf(intro) < flat.indexOf('## Lean path'), 'introduction comes first');
  assert.ok(flat.indexOf(intro) < flat.indexOf('## Hard gates'), 'introduction precedes the gates');

  const step = flatten(skill.body.split(/^### 0\. /m)[1]?.split(/^### /m)[0] ?? '');
  assert.match(step, /^Entry integration Skipped in a quiet install/);
  assert.match(step, /setup already wrote `\.wolven-harness\/AGENTS\.md`, and there is no `WOLVEN\.md` to fold/);
  assert.match(flat, /It is also skipped in a quiet install, always/);
});

test('proof-quiet-install-lean-path: quick setup asks no goal, guided setup opens with repo and role', async () => {
  const skill = await readSkill('harness-init');
  const lean = await skill.read(LEAN_PATH);
  const question = flatten(section(lean, '## The path question'));

  assert.match(
    question,
    /\*\*Quick setup \(recommended\)\*\*: connect the harness to <runtime names>; everything else can wait\./,
  );
  assert.match(question, /\*\*Guided setup\*\*: walk through every step, skipping whatever you don't want yet\./);
  assert.match(question, /never call the second answer a "full tour"/);
  for (const rel of ['SKILL.md', LEAN_PATH, 'references/entry-modes.md']) {
    assert.doesNotMatch(await skill.read(rel), /Just the basics|The full tour/, `${rel} keeps the old path labels`);
  }

  const asks = flatten(section(lean, '## What the lean path asks'));
  assert.match(asks, /It asks no goal question, in either install/);
  assert.match(asks, /quiet-install section of \[layout\.md\]\(layout\.md\)/);
  const runs = flatten(section(lean, '## What the lean path runs'));
  assert.match(runs, /In a quiet install, the questions above, then the hand-back/);

  const guided = flatten(section(skill.body, '## Guided setup'));
  assert.match(guided, /opens with one question, "What's this repo for, and what's your role in it\?"/);
  assert.match(guided, /guided setup then runs the quiet-install section/);
  assert.match(guided, /The closing asks what to work on next/);
  const order = ['Migration', 'Research', 'Skill suggestions', 'Score'].map((phase) => guided.indexOf(`| ${phase} |`));
  assert.ok(
    order.every((at, i) => at >= 0 && (i === 0 || at > order[i - 1])),
    'phases are offered in order',
  );
});

test('proof-quiet-install-init-agents-conflict: the harness block is three lines of text, with Yes and No only', async () => {
  const skill = await readSkill('harness-init');
  const raw = await skill.read('references/entry-modes.md');
  const part = section(raw, '## Harness block in a quiet install');
  const flat = flatten(part);

  const block = part.match(/```markdown\n([\s\S]*?)```/)?.[1] ?? '';
  const lines = block.trim().split('\n');
  assert.equal(lines[0], '<!-- wolven-harness:start -->');
  assert.equal(lines.at(-1), '<!-- wolven-harness:end -->');
  assert.ok(lines.length - 2 <= 3, 'at most three lines of text between the markers');
  assert.match(block, /Its instructions are in `\.wolven-harness\/AGENTS\.md`/);
  assert.match(block, /Harness docs go under `\.wolven-harness\/docs\/`/);
  assert.doesNotMatch(block, /@/, 'the default block holds no @ import');

  assert.match(
    flat,
    /Only after a yes to Amp's tracked-edit offer, the block gains a fourth line, `@\.wolven-harness\/AGENTS\.md`/,
  );
  assert.match(flat, /never an `@` import/);
  assert.match(flat, /No other line of the file changes/);
  assert.match(flat, /create a root `AGENTS\.md` that holds only the block/);
  assert.match(flat, /Codex, Cursor, Amp, opencode, Copilot, Antigravity/);
  assert.match(flat, /On a No, nothing is written to those files\. The runtimes that read that file stay not set up/);
  assert.match(flat, /`wolven-harness doctor` names them/);
  assert.match(flatten(skill.body), /"Harness block in a quiet install"/);
});

test('proof-quiet-install-init-statement: one commit offer at the end, listing only trackable paths', async () => {
  const skill = await readSkill('harness-init');
  const offer = flatten(section(skill.body, '## Commit offer').replace(/^> ?/gm, ''));

  assert.match(offer, /makes exactly one commit offer, at the end, in both installs/);
  assert.match(offer, /No phase, step, file, ADR, claim, or stub gets an offer of its own/);
  assert.match(offer, /naming the branch `git branch --show-current` prints/);
  assert.match(offer, /Commit these <N> files to `<branch>`\? Nothing is pushed\./);
  assert.match(offer, /tagged `\(tracked\)` when git already tracks it or `\(new\)` when the run created it/);
  assert.match(offer, /List only paths git would track, and never force-add one/);
  assert.match(
    offer,
    /`\.wolven-harness\/\.gitignore`, `\.wolven-harness\/AGENTS\.md`, the ticked home folders, `\.wolven-harness\/\.agents\/hooks\/`, `\.wolven-harness\.json`, and each tracked root file/,
  );
  assert.match(offer, /root `\.gitignore`, `AGENTS\.md`, `CLAUDE\.md` or `\.dockerignore`/);
  assert.match(offer, /The session note is in the list only when the Notes folder is ticked/);
  assert.match(offer, /"The session note is kept on this machine only\."/);
  assert.match(offer, /None of them is ever in the list/);
  assert.match(offer, /Never stage with `git add -A` or `git add \.`/);

  assert.ok(skill.body.indexOf('## Commit offer') < skill.body.indexOf('## Workflow'), 'the offer rule is stated once');
  assert.doesNotMatch(skill.body, /Phased commits|per-phase|each phase's commit|that phase's commit offer/i);
  assert.doesNotMatch(skill.body, /offer one commit of that phase/i);
  const flatBody = flatten(skill.body);
  const step6 = flatten(skill.body.split(/^### 6\. /m)[1]?.split(/^## /m)[0] ?? '');
  assert.match(step6, /make the one commit offer \(see "Commit offer"\), and hand the run back/);
  assert.match(flatBody, /A commit offer before the end of the run, or a commit per file, ADR, claim, or stub/);
  assert.match(flatBody, /Listing an ignored path in the commit offer, or force-adding one/);
});

test('proof-quiet-install-init-statement: the closing lists local-only and kept paths, and both packaging lines by condition', async () => {
  const skill = await readSkill('harness-init');
  const offer = flatten(section(skill.body, '## Commit offer').replace(/^> ?/gm, ''));

  assert.match(
    offer,
    /"These stay on this machine, and git ignores them: `<paths>`\." That covers the symlinks, the Claude Code settings and the wiring record/,
  );
  assert.match(offer, /"Kept as yours: `<path>` \(`<merged \/ saved as wolven-<name> \/ skipped>`\)\."/);
  assert.match(
    offer,
    /When it added `\.wolven-harness\/` to the root `\.dockerignore`: "Docker builds skip the harness: your `\.dockerignore` now excludes `\.wolven-harness\/`\. Archives and rsync deploys need their own exclusion\."/,
  );
  assert.match(
    offer,
    /Otherwise: "Packaging that ignores `\.gitignore` \(a Docker build, an archive, an rsync deploy\) picks up the whole harness, unticked docs included\. Exclude `\.wolven-harness\/` there\."/,
  );
  assert.ok(
    offer.indexOf('When it added') < offer.indexOf('Otherwise: "Packaging'),
    'the .dockerignore condition comes before the fallback line',
  );
});

test('proof-quiet-install-init-statement: a yes goes to code-commit by path, no remote means no offer, a worktree gets only tracked folders', async () => {
  const skill = await readSkill('harness-init');
  const offer = flatten(section(skill.body, '## Commit offer'));

  assert.match(offer, /On a yes, pass the listed paths by name to `code-commit`/);
  assert.match(
    offer,
    /not installed \(no `\.agents\/skills\/code-commit\/`\), make the commit with plain `git commit` of those paths/,
  );
  assert.match(offer, /On a no, nothing is committed and the changes stay in the working tree/);
  assert.match(
    offer,
    /When `git remote` prints nothing, make no commit offer, since there is no remote to share the commit with\. Say: "This repo has no remote, so no commit was offered\. Your changes stay in the working tree\."/,
  );
  assert.match(
    offer,
    /a worktree gets only the folders git tracks\. An unticked docs folder can't be read from a worktree session, and a write to it lands in the worktree's ignored copy, which is lost when the worktree is removed/,
  );
});

test('proof-quiet-install-terms-first: the session note template names the new paths and says you, never the Human', async () => {
  const skill = await readSkill('harness-init');
  const note = await skill.read('references/session-note-template.md');
  const later = flatten(section(note, '## Left for later'));

  assert.match(later, /\*\*Path:\*\* <Quick setup \(lean\) or Guided setup \(full\)>/);
  assert.match(later, /\*\*Repo and role:\*\* <your answer to "What's this repo for, and what's your role in it\?"/);
  assert.doesNotMatch(note, /Just the basics|The full tour|\*\*Goal:\*\*|\*\*Covered:\*\*/);
  assert.doesNotMatch(note, /the Human/i);
  assert.doesNotMatch(note, /phase's commit offer|phase commit/);
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
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
];

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

test('skill-shape: step 1 is offered only when validate reports legacy-adr', async () => {
  const skill = await readSkill('harness-init');

  const migrationSection = flatten(skill.body.split(/^### 1\. Legacy ADR migration/m)[1]?.split(/^### /m)[0] ?? '');
  assert.match(migrationSection, /offered only when.*`?legacy-adr`?/i);
});

test('skill-shape: re-run skips step 0, step 1, and resumes a draft session note', async () => {
  const skill = await readSkill('harness-init');
  const flat = flatten(skill.body);

  assert.match(flat, /step 0 is skipped when `WOLVEN\.md` is already gone, or `AGENTS\.md` already mentions it/i);
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

test('skill-shape: the five references exist and are each linked from the step that uses them', async () => {
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
  assert.match(ref, /`HYG-03`, `HYG-04` and `HYG-06` detect leaked credentials and can never be dropped/);
  assert.match(ref, /add `"no-hooks"` to `extends`/);
  assert.match(ref, /Never build a failing check inside this run/);
  assert.match(ref, /The run ends at hand-back.*separate change on its own branch/);
  assert.match(ref, /Nothing is written without a yes/);
  assert.match(ref, /lean path never defers the score run/i);

  const note = flatten(await skill.read('references/session-note-template.md'));
  assert.ok(note.indexOf('## Stubs') < note.indexOf('## Harness score'), 'Harness score follows Stubs');
  assert.ok(
    note.indexOf('## Harness score') < note.indexOf('## Validate wiring'),
    'Harness score precedes Validate wiring',
  );
});

test('skill-harness-init: lean path defers exactly four named items, including validate-wiring', async () => {
  const skill = await readSkill('harness-init');
  const lean = flatten(skill.body.split(/^## Lean path/m)[1]?.split(/^## /m)[0] ?? '');

  assert.match(skill.body, /^## Lean path/m);
  assert.match(lean, /thin-evidence/i);
  assert.match(lean, /deep discovery Q&A beyond files/i);
  assert.match(lean, /optional web research/i);
  assert.match(lean, /per-dimension score-gap keep\/drop questions/i);
  assert.match(lean, /defers exactly these four items, and nothing else/i);
  assert.match(lean, /\| Validate-wiring question \| part of 6 \|/i);
  assert.doesNotMatch(lean, /defer only these|only these three/i);

  const wiring = flatten(await skill.read('references/validate-wiring.md'));
  assert.match(wiring, /one of the four deferrable items/i);
  assert.match(wiring, /Deferred \/ skipped steps/i);
});

test('skill-harness-init: lean path captures the immediate goal instead of assuming one', async () => {
  const skill = await readSkill('harness-init');
  const lean = flatten(skill.body.split(/^## Lean path/m)[1]?.split(/^## /m)[0] ?? '');

  assert.match(lean, /a goal is not a precondition for lean/i);
  assert.match(lean, /Capture the immediate goal/i);
  assert.match(lean, /ask one question/i);
  assert.match(lean, /One sentence/i);
  assert.match(lean, /never compose one for the Human/i);
  assert.match(lean, /"none stated"/i);
  assert.match(lean, /Proposals cite the recorded immediate goal/i);
  assert.ok(
    lean.indexOf('Capture the immediate goal') < lean.indexOf('Present the deferral list'),
    'goal is captured before the deferral list is presented',
  );

  const discovery = flatten(await skill.read('references/discovery.md'));
  assert.match(discovery, /recorded immediate goal/i);
});

test('skill-harness-init: lean deferrals are named before proceeding and recorded in the session note', async () => {
  const skill = await readSkill('harness-init');
  const lean = flatten(skill.body.split(/^## Lean path/m)[1]?.split(/^## /m)[0] ?? '');

  assert.match(lean, /Before proceeding/i);
  assert.match(lean, /present each deferred or skipped step by number and name/i);
  assert.match(lean, /with why and what remaining work/i);
  assert.match(lean, /Deferred \/ skipped steps/i);

  const note = flatten(await skill.read('references/session-note-template.md'));
  assert.match(note, /## Deferred \/ skipped steps/);
  assert.match(note, /\| Step \| Name \| Reason \| Remaining work \|/);
  assert.match(note, /why this step was deferred or skipped/i);
  assert.match(note, /what still needs doing later/i);
  assert.match(note, /\*\*Immediate goal:\*\*/);
  assert.match(note, /\*\*Path:\*\* <lean or full>/);
});

test('skill-harness-init: skill proposals are never deferred on the lean path', async () => {
  const skill = await readSkill('harness-init');
  const lean = flatten(skill.body.split(/^## Lean path/m)[1]?.split(/^## /m)[0] ?? '');
  const step4 = flatten(skill.body.split(/^### 4\. /m)[1]?.split(/^### /m)[0] ?? '');
  const flat = flatten(skill.body);

  assert.match(lean, /Skill proposals \(step 4\) are never deferred/i);
  assert.match(lean, /never listed as skippable/i);
  assert.match(lean, /recorded immediate goal and the available references/i);
  assert.match(lean, /explicit thin-evidence basis/i);
  assert.match(lean, /Unsupported tool or architecture decisions stay open/i);
  assert.match(step4, /never deferred/i);
  assert.match(flat, /Deferring skill proposals \(step 4\) on the lean path/i);

  const discovery = flatten(await skill.read('references/discovery.md'));
  assert.match(discovery, /Skill proposals are never deferred on the lean path/i);
  assert.match(discovery, /thin-evidence basis/i);
});

test('skill-harness-init: lean path still lists the must-run steps', async () => {
  const skill = await readSkill('harness-init');
  const lean = flatten(skill.body.split(/^## Lean path/m)[1]?.split(/^## /m)[0] ?? '');

  assert.match(lean, /Must still run/i);
  assert.match(lean, /Entry integration \(step 0\)/i);
  assert.match(lean, /Legacy ADR migration when needed \(step 1\)/i);
  assert.match(lean, /File-based discovery \(step 2/i);
  assert.match(lean, /Skill proposals \(step 4 — never deferred\)/i);
  assert.match(lean, /Stubs for skills the Human picks \(step 5\)/i);
  assert.match(lean, /score run that records the level without forcing every gap question/i);
  assert.match(lean, /Session note close/i);
  assert.doesNotMatch(
    lean.split(/Must still run/i)[1]?.split(/Validate-wiring is not in that list/i)[0] ?? '',
    /validate-wiring/i,
  );
  assert.match(lean, /Validate-wiring is not in that list/i);
  assert.match(lean, /asked as one essential choice unless the Human agreed to defer it/i);
});

test('skill-harness-init: the lean walkthrough note shows the four beats in order and the note template backs them', async () => {
  const walkthrough = await readFile(
    path.join(ROOT, 'docs/notes/lean-init-walkthrough/lean-init-walkthrough-note.md'),
    'utf8',
  );
  const beats = [
    '## Beat 1: Goal captured',
    '## Beat 2: Deferral list presented before proceeding',
    '## Beat 3: Proposals made',
    '## Beat 4: Session note records the same choices',
  ];
  const positions = beats.map((beat) => {
    const index = walkthrough.indexOf(beat);
    assert.ok(index >= 0, `walkthrough is missing "${beat}"`);
    return index;
  });
  for (let i = 1; i < positions.length; i++) {
    assert.ok(positions[i] > positions[i - 1], `"${beats[i]}" must come after "${beats[i - 1]}"`);
  }
  assert.match(walkthrough, /\*\*Immediate goal:\*\*/);

  const skill = await readSkill('harness-init');
  const note = await skill.read('references/session-note-template.md');
  assert.match(note, /\*\*Immediate goal:\*\*/);
  assert.match(note, /## Deferred \/ skipped steps/);
});

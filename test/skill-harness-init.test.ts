import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readSkill, assertSkillBasics, assertNoRuntimeToolNames } from './helpers/skill-contract.js';

const STEPS = [
  '0. Entry integration',
  '1. Legacy ADR migration',
  '2. Discovery',
  '3. Research',
  '4. Suggest',
  '5. Write stubs',
  '6. Session note and hand-back',
];

const REFERENCES = [
  'references/entry-modes.md',
  'references/adr-migration.md',
  'references/discovery.md',
  'references/stub-template.md',
  'references/session-note-template.md',
];

const CONSUMER_NAME_RE = /agentic-mkt|compozy/i;

// why: prose in SKILL.md wraps across lines, so a phrase spanning several
// words is matched against whitespace-collapsed text instead of the raw
// body, which would otherwise break on an arbitrary line wrap.
function flatten(text: string): string {
  return text.replace(/\s+/g, ' ');
}

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
    assert.match(skill.body, new RegExp('`' + name + '`'));
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

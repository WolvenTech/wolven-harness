import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from './helpers/fixture.js';
import { readSkill, assertSkillBasics, renderInto } from './helpers/skill-contract.js';

const NINE_DIMENSIONS = [
  'validation',
  'failure modes',
  'idempotency and retry',
  'authorization',
  'concurrency and ordering',
  'data lifecycle',
  'external-dependency failure',
  'state transitions',
  'observability',
];

test('skill-code-spec: passes the shared skill contract checks', async () => {
  await assertSkillBasics('code-spec', { requireHarnessValidate: true });
});

test('skill-code-spec: takes a PRD or a confirmed ask as input', async () => {
  const skill = await readSkill('code-spec');

  assert.match(skill.body, /\bPRD\b/);
  assert.match(skill.body, /confirmed ask/i);
});

test('skill-code-spec: writes the spec into the doc-folder layout', async () => {
  const skill = await readSkill('code-spec');

  assert.match(skill.body, /docs\/specs\/<slug>\/<slug>-spec\.md/);
});

test('skill-code-spec: names create-prd, code-plan, and code-execute as the surrounding skills', async () => {
  const skill = await readSkill('code-spec');

  assert.match(skill.body, /`create-prd`/);
  assert.match(skill.body, /`code-plan`/);
  assert.match(skill.body, /`code-execute`/);
});

test('skill-code-spec: keeps obligation-proof pairs', async () => {
  const skill = await readSkill('code-spec');
  const template = await skill.read('references/TEMPLATE.md');
  const example = await skill.read('references/EXAMPLE.md');

  assert.match(skill.body, /obligation ↔ proof/i);
  assert.match(template, /## Requirements \(obligation ↔ proof\)/);
  assert.match(example, /## Obligation ↔ proof/);
});

test('skill-code-spec: names all nine dimensions in the template', async () => {
  const skill = await readSkill('code-spec');
  const template = await skill.read('references/TEMPLATE.md');

  assert.match(template, /## Nine-dimension landings/);
  for (const dimension of NINE_DIMENSIONS) {
    assert.match(template, new RegExp(`\\|\\s*${dimension}\\s*\\|`, 'i'), `template must land the "${dimension}" dimension`);
  }
});

test('skill-code-spec: keeps typed Unresolved rows', async () => {
  const skill = await readSkill('code-spec');
  const template = await skill.read('references/TEMPLATE.md');

  assert.match(template, /## Unresolved/);
  assert.match(template, /`U-<topic>`/);
  assert.match(skill.body, /never\s+invented\s+behavior/i);
});

test('skill-code-spec: keeps waves for multi-batch work', async () => {
  const skill = await readSkill('code-spec');
  const template = await skill.read('references/TEMPLATE.md');

  assert.match(template, /## Waves/);
  assert.match(skill.body, /work spans more than one mutate batch/i);
});

test('skill-code-spec: keeps an eval / gates table', async () => {
  const skill = await readSkill('code-spec');
  const template = await skill.read('references/TEMPLATE.md');

  assert.match(template, /## Eval \/ gates/);
  assert.match(skill.body, /Eval \/ gates/);
});

test('skill-code-spec: keeps the cross-domain leak table', async () => {
  const skill = await readSkill('code-spec');
  const template = await skill.read('references/TEMPLATE.md');

  assert.match(template, /## Cross-domain leak table/);
  assert.match(skill.body, /Cross-domain leak table/i);
});

test('skill-code-spec: points its ADR section at the adr skill', async () => {
  const skill = await readSkill('code-spec');
  const template = await skill.read('references/TEMPLATE.md');

  assert.match(template, /^## ADR$/m);
  assert.match(template, /`adr` skill/);
  assert.doesNotMatch(template, /\bADR-\d{3}\b/);
  assert.doesNotMatch(template, /\badr-\d{3}-[a-z-]+\b/);
});

test('skill-code-spec: term challenge checks terms against docs and the ADRs, not a canon or an Area', async () => {
  const skill = await readSkill('code-spec');

  assert.match(skill.body, /against\s+`docs\/`\s+and the existing ADRs/i);
  assert.doesNotMatch(skill.body.toLowerCase(), /\bcanon\b/);
  assert.doesNotMatch(skill.body.toLowerCase(), /\barea\b/);
});

test('skill-code-spec: TEMPLATE and EXAMPLE exist with resolving links', async () => {
  const skill = await readSkill('code-spec');

  assert.ok(skill.files.includes('references/TEMPLATE.md'));
  assert.ok(skill.files.includes('references/EXAMPLE.md'));
});

test('skill-code-spec: is model-invocable', async () => {
  const skill = await readSkill('code-spec');

  assert.equal('disable-model-invocation' in skill.frontmatter, false);
  assert.ok(!skill.files.includes('agents/openai.yaml'));
});

test('skill-code-spec: renderInto renders the template into a fixture that passes validate', async () => {
  const cwd = await renderInto(
    {},
    '.agents/skills/code-spec/references/TEMPLATE.md',
    'docs/specs/widget-export/widget-export-spec.md',
    {
      title: 'Widget export — spec',
      description: 'Freezes requirements for a bulk widget export feature.',
    },
  );

  const result = await run(['validate'], { cwd });

  assert.equal(result.code, 0);
});

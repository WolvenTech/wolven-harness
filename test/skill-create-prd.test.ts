import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from './helpers/fixture.js';
import { readSkill, assertSkillBasics, renderInto } from './helpers/skill-contract.js';

const FORBIDDEN_RE = /cynefin|dice|executor|board|ticket/i;

test('skill-create-prd: passes the shared skill contract checks', async () => {
  await assertSkillBasics('create-prd');
});

test('skill-create-prd: has the five workflow steps in order', async () => {
  const skill = await readSkill('create-prd');

  const stepHeadings = skill.headings.filter((h) => /^\d+\./.test(h));
  assert.deepEqual(stepHeadings, [
    '1. Grill the problem',
    '2. Term challenge',
    '3. Draft',
    '4. Approve',
    '5. ADR offer',
  ]);
});

test('skill-create-prd: grills the problem through grilling with no cap before drafting', async () => {
  const skill = await readSkill('create-prd');

  assert.match(skill.body, /run `grilling` on the problem/i);
  assert.match(skill.body, /no cap on the number of questions/i);
  assert.match(skill.body, /one sentence and the (?:human|.+) confirms it/i);
  assert.match(skill.body, /split it into its own prd or park it under open questions/i);
});

test('skill-create-prd: challenges terms against local docs before reusing or coining one', async () => {
  const skill = await readSkill('create-prd');

  assert.match(skill.body, /check the key terms/i);
  assert.match(skill.body, /reuse a name that already exists/i);
});

test('skill-create-prd: drafts to the doc-folder prd path with draft status', async () => {
  const skill = await readSkill('create-prd');

  assert.match(skill.body, /docs\/prds\/<slug>\/<slug>-prd\.md/);
  assert.match(skill.body, /status: draft/);
});

test('skill-create-prd: only moves draft to stable on explicit approval, and approval does not authorize code', async () => {
  const skill = await readSkill('create-prd');

  assert.match(skill.body, /change `status` from `draft` to `stable`/i);
  assert.match(skill.body, /does not authorize writing code/i);
  assert.match(skill.body, /`code-spec`'s input/);
});

test('skill-create-prd: offers the adr skill for a durable decision without treating the prd as one', async () => {
  const skill = await readSkill('create-prd');

  assert.match(skill.body, /offer to record it with the `adr` skill/i);
  assert.match(skill.body, /is not the decision record/i);
});

test('skill-create-prd: lists what it refuses', async () => {
  const skill = await readSkill('create-prd');

  assert.ok(skill.headings.includes('Refuses'));
  const refusesIndex = skill.body.indexOf('## Refuses');
  const nextHeadingIndex = skill.body.indexOf('## Anti-patterns');
  const refusesSection = skill.body.slice(refusesIndex, nextHeadingIndex);

  assert.match(refusesSection, /scoring or classifying/i);
  assert.match(refusesSection, /who or what carries out the resulting work/i);
  assert.match(refusesSection, /external tracker/i);
  assert.match(refusesSection, /implementation detail/i);
  assert.match(refusesSection, /separate files/i);
});

test('skill-create-prd: names no forbidden classification or tracker vocabulary anywhere in the skill', async () => {
  const skill = await readSkill('create-prd');

  for (const rel of skill.files) {
    const content = await skill.read(rel);
    const match = content.match(FORBIDDEN_RE);
    assert.equal(match, null, `${rel} contains forbidden term "${match?.[0]}"`);
  }
});

test('skill-create-prd: the template has the six sections in order', async () => {
  const skill = await readSkill('create-prd');
  const template = await skill.read('references/prd-template.md');

  const headingMatches = [...template.matchAll(/^##\s+(.+)$/gm)].map((m) => m[1]);
  assert.deepEqual(headingMatches, ['Problem', 'Goals', 'User stories', 'Scope', 'Open questions', 'Handoff']);
});

test('skill-create-prd: the template has one US-1 story with one AC-1.1 given/when/then example', async () => {
  const skill = await readSkill('create-prd');
  const template = await skill.read('references/prd-template.md');

  const usMatches = [...template.matchAll(/US-1\b/g)];
  const acMatches = [...template.matchAll(/AC-1\.1\b/g)];
  assert.equal(usMatches.length, 1);
  assert.equal(acMatches.length, 1);
  assert.match(template, /\*\*Given\*\*/);
  assert.match(template, /\*\*When\*\*/);
  assert.match(template, /\*\*Then\*\*/);
});

test('skill-create-prd: a PRD rendered from the template passes validate', async () => {
  const cwd = await renderInto(
    {},
    '.agents/skills/create-prd/references/prd-template.md',
    'docs/prds/render-check/render-check-prd.md',
    {
      title: 'Render check',
      description: 'proves the prd template renders into a passing doc',
    },
  );

  const result = await run(['validate'], { cwd });

  assert.equal(result.code, 0, result.stdout + result.stderr);
});

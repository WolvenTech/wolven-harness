import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assertSkillBasics, readSkill } from './helpers/skill-contract.js';

test('skill-prototype: passes the shared skill contract checks', async () => {
  await assertSkillBasics('prototype');
});

test('skill-prototype: LOGIC.md and UI.md exist and are linked from SKILL.md', async () => {
  const skill = await readSkill('prototype');

  assert.ok(skill.files.includes('LOGIC.md'));
  assert.ok(skill.files.includes('UI.md'));
  assert.match(skill.body, /\[LOGIC\.md\]\(LOGIC\.md\)/);
  assert.match(skill.body, /\[UI\.md\]\(UI\.md\)/);
});

test('skill-prototype: names a location table with the temp directory, a scratch folder, and a throwaway branch', async () => {
  const skill = await readSkill('prototype');

  assert.match(skill.body, /\| Location \| When to use it \|/);
  assert.match(skill.body, /OS temp directory/i);
  assert.match(skill.body, /scratch folder/i);
  assert.match(skill.body, /throwaway git branch/i);
});

test('skill-prototype: carries a PROTOTYPE marking that names the question it answers', async () => {
  const skill = await readSkill('prototype');

  assert.match(skill.body, /PROTOTYPE/);
  assert.match(skill.body, /naming the exact question it answers/i);
});

test('skill-prototype: discards or promotes deliberately, with the verdict recorded on the PRD', async () => {
  const skill = await readSkill('prototype');

  assert.match(skill.body, /Discard or promote, deliberately/);
  assert.match(skill.body, /\*\*Discard\.\*\*/);
  assert.match(skill.body, /\*\*Promote\.\*\*/);
  assert.match(skill.body, /record the verdict/i);
  assert.match(skill.body, /docs\/prds\/<slug>\/<slug>-prd\.md/);
});

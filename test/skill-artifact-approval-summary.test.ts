import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { readSkill } from './helpers/skill-contract.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const templateSkills = path.join(root, 'templates', '.agents', 'skills');
const installedSkills = path.join(root, '.agents', 'skills');

const SKILLS = ['create-prd', 'code-spec', 'code-plan'] as const;
const REF = 'references/artifact-approval-summary.md';

async function readRef(base: string, skill: string): Promise<string> {
  return readFile(path.join(base, skill, REF), 'utf8');
}

test('proof-artifact-approval-summary-reference: five sections and skill-specific table rules', async () => {
  const content = await readRef(templateSkills, 'create-prd');

  assert.match(content, /## 1\. Where and status/);
  assert.match(content, /## 2\. What it requires/);
  assert.match(content, /## 3\. What grounding found/);
  assert.match(content, /## 4\. Decisions folded in/);
  assert.match(content, /## 5\. What changed/);
  assert.match(content, /`create-prd`/);
  assert.match(content, /`code-spec`/);
  assert.match(content, /`code-plan`/);
});

test('proof-artifact-approval-summary-identical: template and installed copies match across skills', async () => {
  const canonical = await readRef(templateSkills, 'create-prd');

  for (const skill of SKILLS) {
    const template = await readRef(templateSkills, skill);
    const installed = await readRef(installedSkills, skill);
    assert.equal(template, canonical, `${skill} template reference differs from canonical`);
    assert.equal(installed, canonical, `${skill} installed reference differs from canonical`);
  }
});

test('proof-artifact-approval-summary-create-prd-step', async () => {
  const skill = await readSkill('create-prd');

  assert.match(skill.body, /### 4\. Normalized summary/);
  assert.match(skill.body, /artifact-approval-summary\.md/);
  assert.match(skill.body, /after the first draft and after every material revision/i);
  assert.match(skill.body, /before asking the\s+Human to approve/i);
});

test('proof-artifact-approval-summary-code-spec-step', async () => {
  const skill = await readSkill('code-spec');

  assert.match(skill.body, /\*\*Normalized summary\.\*\*/);
  assert.match(skill.body, /artifact-approval-summary\.md/);
  assert.match(skill.body, /after the first draft and after every material revision/i);
});

test('proof-artifact-approval-summary-code-plan-step', async () => {
  const skill = await readSkill('code-plan');

  assert.match(skill.body, /\*\*Normalized summary\.\*\*/);
  assert.match(skill.body, /artifact-approval-summary\.md/);
  assert.match(skill.body, /after the first draft and after every material revision/i);
});

test('proof-artifact-approval-summary-anti-dump: reference forbids full re-paste and path dumps', async () => {
  const content = await readRef(templateSkills, 'code-spec');

  assert.match(content, /Do not repeat the artifact in full/i);
  assert.match(content, /Do not dump raw path lists/i);
});

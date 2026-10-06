import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parse as parseYaml } from 'yaml';
import { assertSkillBasics, readSkill } from './helpers/skill-contract.js';

test('skill-code-review: passes the shared skill contract checks', async () => {
  await assertSkillBasics('code-review', { requireHarnessValidate: true });
});

test('skill-code-review: ships display_name and short_description', async () => {
  const skill = await readSkill('code-review');

  assert.ok(skill.files.includes('agents/openai.yaml'), 'expected agents/openai.yaml');

  const raw = await skill.read('agents/openai.yaml');
  const parsed = parseYaml(raw) as {
    interface?: { display_name?: string; short_description?: string };
    policy?: { allow_implicit_invocation?: boolean };
  };

  assert.ok(typeof parsed.interface?.display_name === 'string' && parsed.interface.display_name.length > 0);
  assert.ok(typeof parsed.interface?.short_description === 'string' && parsed.interface.short_description.length > 0);
});

test('skill-code-review: grounds findings in the PR body, its cited refs, and the diff', async () => {
  const skill = await readSkill('code-review');

  assert.match(skill.body, /## Grounding/);
  assert.match(skill.body, /cited/i);
  assert.match(skill.body, /docs\/specs\/<slug>\/<slug>-spec\.md/);
  assert.match(skill.body, /docs\/specs\/<slug>\/<slug>-plan\.md/);
  assert.match(skill.body, /docs\/prds\/<slug>\/<slug>-prd\.md/);
  assert.match(skill.body, /adr-NNN-<slug>/);
});

test('skill-code-review: drops an uncited finding', async () => {
  const skill = await readSkill('code-review');
  const criteria = await skill.read('references/review-criteria.md');

  assert.match(skill.body, /not posted/i);
  assert.match(criteria, /## Citation rule/);
});

test('skill-code-review: labels every finding blocking or nit', async () => {
  const skill = await readSkill('code-review');
  const criteria = await skill.read('references/review-criteria.md');

  assert.match(skill.body, /\bBlocking\b/);
  assert.match(skill.body, /\bNit\b/);
  assert.match(criteria, /## Severity/);
  assert.match(criteria, /\bBlocking\b/);
  assert.match(criteria, /\bNit\b/);
});

test('skill-code-review: never merges', async () => {
  const skill = await readSkill('code-review');
  const criteria = await skill.read('references/review-criteria.md');

  assert.match(skill.body, /## Never merges/);
  assert.doesNotMatch(skill.body, /\bpr merge\b/i);
  assert.match(criteria, /never merges, approves-and-merges, or\s+enables auto-merge/i);
});

test('skill-code-review: does not fix code or follow through on threads itself', async () => {
  const skill = await readSkill('code-review');

  assert.match(skill.body, /`code-ci`/);
  assert.match(skill.body, /does not\s*:?\s*.*implement fixes/is);
  assert.match(skill.body, /reply to or resolve a thread/i);
});

test('skill-code-review: directs review-fix rounds through iteration spec and plan paths', async () => {
  const skill = await readSkill('code-review');

  assert.match(skill.body, /iteration-<N>-\{spec,plan\}\.md/);
});

test('skill-code-review: links host operations and names the operations in plain words', async () => {
  const skill = await readSkill('code-review');

  assert.match(skill.body, /\[host operations\]\(\.\.\/code-pr\/references\/host-operations\.md\)/);
  assert.match(skill.body, /read PR and diff/i);
  assert.match(skill.body, /list unresolved threads/i);
  assert.match(skill.body, /post a review comment/i);
});

test('proof-skills-command-handoff-absent', async () => {
  const skill = await readSkill('code-review');
  const handoff = skill.body.indexOf('**Review-fix handoff**');
  const verdict = skill.body.indexOf('End with one verdict');

  assert.match(
    skill.body,
    /`code-spec`\s+or\s+`code-plan`\s+is\s+absent\s+from\s+the\s+session\s+skill\s+list,\s+name\s+it\s+and\s+the\s+next\s+free\s+N/,
  );
  assert.ok(handoff >= 0 && verdict >= 0, 'expected both steps');
  assert.ok(handoff < verdict, 'handoff step comes before the verdict step');
});

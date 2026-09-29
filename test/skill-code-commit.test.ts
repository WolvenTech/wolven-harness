import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assertSkillBasics, readSkill } from './helpers/skill-contract.js';

test('skill-code-commit: passes the shared skill contract checks', async () => {
  await assertSkillBasics('code-commit', { requireHarnessValidate: true });
});

test('skill-code-commit: keeps Conventional Commits shape', async () => {
  const skill = await readSkill('code-commit');

  assert.match(skill.body, /Conventional Commits/);
  assert.match(skill.body, /type\[?\(?optional-scope\)?\]?: /i);
});

test('skill-code-commit: keeps the atomic plan-completion mark', async () => {
  const skill = await readSkill('code-commit');

  assert.match(skill.body, /same commit/i);
  assert.match(skill.body, /plan-completion mark/i);
  assert.match(skill.body, /docs\/specs\/<slug>\/<slug>-plan\.md/);
  assert.match(
    skill.body,
    /never\s+flip\s+another\s+unit's\s+checkbox|never\s+leave\s+the\s+plan-completion\s+mark\s+for\s+a\s+later\s+commit/i,
  );
});

test('skill-code-commit: keeps split heuristics for unrelated contexts', async () => {
  const skill = await readSkill('code-commit');

  assert.match(skill.body, /## Multi-commit heuristics/);
  assert.match(skill.body, /Split/);
  assert.match(skill.body, /coherent context/i);
});

test('skill-code-commit: keeps failed-commit cleanup', async () => {
  const skill = await readSkill('code-commit');
  const examples = await skill.read('references/commit-examples.md');

  assert.match(skill.body, /the unit remains \*\*incomplete\*\*|the unit stays incomplete/i);
  assert.match(skill.body, /false-green/i);
  assert.match(examples, /false green|false-green/i);
  assert.match(examples, /## Failed commit leaves false green \(cleanup required\)/i);
});

test('skill-code-commit: keeps hard gates for secrets, empty commits, and git safety', async () => {
  const skill = await readSkill('code-commit');

  assert.match(skill.body, /non-empty/i);
  assert.match(skill.body, /no secrets/i);
  assert.match(skill.body, /force-push/i);
  assert.match(skill.body, /--no-verify/);
});

test('skill-code-commit: names its two entry paths without inventing a consumer commit-cadence config', async () => {
  const skill = await readSkill('code-commit');

  assert.match(skill.body, /## Entry modes/);
  assert.match(skill.body, /wave gate/i);
  assert.match(skill.body, /[Ss]tandalone/);
  assert.doesNotMatch(skill.body, /\.wolven-harness\.json/);
  assert.doesNotMatch(skill.body, /autocommit/i);
});

test('skill-code-commit: names code-pr, code-review, and code-ci under When not to use', async () => {
  const skill = await readSkill('code-commit');

  assert.match(skill.body, /`code-pr`/);
  assert.match(skill.body, /`code-review`/);
  assert.match(skill.body, /`code-ci`/);
  assert.match(skill.body, /## When not to use/);
});

test('skill-code-commit: does not push or merge in its own steps', async () => {
  const skill = await readSkill('code-commit');
  const workflowStart = skill.body.indexOf('## Workflow');
  const workflowSection = skill.body.slice(workflowStart, skill.body.indexOf('## Message shape'));

  assert.ok(workflowStart > -1, 'expected a Workflow section');
  assert.doesNotMatch(workflowSection, /git push/i);
  assert.doesNotMatch(workflowSection, /\bmerge\b/i);
});

test('skill-code-commit: examples file has the Good, Bad, split, atomic-plan, and cleanup headings, and cites the avatar-upload plan', async () => {
  const skill = await readSkill('code-commit');
  const examples = await skill.read('references/commit-examples.md');

  assert.match(examples, /^## Good$/m);
  assert.match(examples, /^## Bad examples/m);
  assert.match(examples, /### Multi-commit split \(standalone\)/);
  assert.match(examples, /### Atomic plan completion \(after a wave gate\)/);
  assert.match(examples, /### Failed commit leaves false green \(cleanup required\)/);
  assert.match(examples, /docs\/specs\/avatar-upload\/avatar-upload-plan\.md/);
});

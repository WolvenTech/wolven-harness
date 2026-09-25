import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readSkill, assertSkillBasics } from './helpers/skill-contract.js';

test('skill-code-commit: passes the shared skill contract checks', async () => {
  await assertSkillBasics('code-commit', { requireHarnessValidate: true });
});

test('skill-code-commit: is model-invocable', async () => {
  const skill = await readSkill('code-commit');

  assert.equal(
    Object.prototype.hasOwnProperty.call(skill.frontmatter, 'disable-model-invocation'),
    false,
    'SKILL.md frontmatter must not set disable-model-invocation',
  );

  assert.ok(!skill.files.includes('agents/openai.yaml'), 'must not ship agents/openai.yaml');
});

test('skill-code-commit: is invoked from code-execute only when the resolved opt says so', async () => {
  const executeSkill = await readSkill('code-execute');

  assert.match(executeSkill.body, /invoke `code-commit` only when the resolved/i);
  assert.match(executeSkill.body, /never invoke `code-pr`,\s*`code-review`, or `code-ci` on its own/i);
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
  assert.match(skill.body, /never\s+flip\s+another\s+unit's\s+checkbox|never\s+leave\s+the\s+plan-completion\s+mark\s+for\s+a\s+later\s+commit/i);
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

test('skill-code-commit: names code-pr, code-review, and code-ci as peers, not steps it chains into', async () => {
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

test('skill-code-commit: names no git-host tool and links out only to nothing (no host-operations use)', async () => {
  const skill = await readSkill('code-commit');

  assert.doesNotMatch(skill.body, /\bgh pr\b/);
  assert.doesNotMatch(skill.body, /create_pull_request|pull_request_read|pull_request_review_write|get_job_logs/);
  assert.doesNotMatch(skill.body, /createPullRequest|getPullRequestDetails/);
  assert.doesNotMatch(skill.body, /api\.bitbucket\.org/);
});

test('skill-code-commit: examples are free of source-repo paths and vocabulary', async () => {
  const skill = await readSkill('code-commit');
  const examples = await skill.read('references/commit-examples.md');
  const combined = `${skill.body}\n${examples}`;

  assert.doesNotMatch(combined, /\.agents\/skills\//);
  assert.doesNotMatch(combined, /docs\/ideas/);
  assert.doesNotMatch(combined, /docs\/projects/);
  assert.doesNotMatch(combined.toLowerCase(), /\bokf\b/);
  assert.match(examples, /docs\/specs\/avatar-upload\/avatar-upload-plan\.md/);
});

test('skill-code-commit: examples include good and bad subjects, a split, the atomic plan mark, and cleanup', async () => {
  const skill = await readSkill('code-commit');
  const examples = await skill.read('references/commit-examples.md');

  assert.match(examples, /^## Good$/m);
  assert.match(examples, /^## Bad examples/m);
  assert.match(examples, /### Multi-commit split \(standalone\)/);
  assert.match(examples, /### Atomic plan completion \(after a wave gate\)/);
  assert.match(examples, /### Failed commit leaves false green \(cleanup required\)/);
});

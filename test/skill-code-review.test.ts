import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse as parseYaml } from 'yaml';
import { readSkill, assertSkillBasics } from './helpers/skill-contract.js';

test('skill-code-review: passes the shared skill contract checks', async () => {
  await assertSkillBasics('code-review', { requireHarnessValidate: true });
});

test('skill-code-review: is ask-only in its frontmatter', async () => {
  const skill = await readSkill('code-review');

  assert.equal(skill.frontmatter['disable-model-invocation'], true);
});

test('skill-code-review: ships an ask-only agents/openai.yaml', async () => {
  const skill = await readSkill('code-review');

  assert.ok(skill.files.includes('agents/openai.yaml'), 'expected agents/openai.yaml');

  const raw = await skill.read('agents/openai.yaml');
  const parsed = parseYaml(raw) as {
    interface?: { display_name?: string; short_description?: string };
    policy?: { allow_implicit_invocation?: boolean };
  };

  assert.equal(parsed.policy?.allow_implicit_invocation, false);
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

test('skill-code-review: links host operations and names the operations in plain words', async () => {
  const skill = await readSkill('code-review');

  assert.match(skill.body, /\[host operations\]\(\.\.\/code-pr\/references\/host-operations\.md\)/);
  assert.match(skill.body, /read PR and diff/i);
  assert.match(skill.body, /list unresolved threads/i);
  assert.match(skill.body, /post a review comment/i);
});

test('skill-code-review: names no git-host tool outside host-operations.md', async () => {
  const skill = await readSkill('code-review');
  const criteria = await skill.read('references/review-criteria.md');
  const combined = `${skill.body}\n${criteria}`;

  assert.doesNotMatch(combined, /\bgh pr\b/);
  assert.doesNotMatch(combined, /create_pull_request|pull_request_read|pull_request_review_write|get_job_logs/);
  assert.doesNotMatch(combined, /createPullRequest|getPullRequestDetails/);
  assert.doesNotMatch(combined, /api\.bitbucket\.org/);
});

test('skill-code-review: has no Bugbot, Cursor, or ClickUp residue anywhere in the folder', async () => {
  const skill = await readSkill('code-review');

  for (const rel of skill.files) {
    const content = await skill.read(rel);
    assert.doesNotMatch(content.toLowerCase(), /bugbot/, `${rel} must not mention Bugbot`);
    assert.doesNotMatch(content.toLowerCase(), /cursor/, `${rel} must not mention Cursor`);
    assert.doesNotMatch(content.toLowerCase(), /clickup/, `${rel} must not mention ClickUp`);
  }
});

test('skill-code-review: has no concrete ADR token, only the placeholder', async () => {
  const skill = await readSkill('code-review');
  const criteria = await skill.read('references/review-criteria.md');
  const combined = `${skill.body}\n${criteria}`;

  assert.doesNotMatch(combined, /ADR-\d{3}\b/);
  assert.doesNotMatch(combined, /adr-\d{3}-[a-z0-9-]+/);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse as parseYaml } from 'yaml';
import { readSkill, assertSkillBasics } from './helpers/skill-contract.js';

test('skill-code-ci: passes the shared skill contract checks', async () => {
  await assertSkillBasics('code-ci', { requireHarnessValidate: true });
});

test('skill-code-ci: is ask-only in its frontmatter', async () => {
  const skill = await readSkill('code-ci');

  assert.equal(skill.frontmatter['disable-model-invocation'], true);
});

test('skill-code-ci: ships an ask-only agents/openai.yaml', async () => {
  const skill = await readSkill('code-ci');

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

test('skill-code-ci: runs conflicts, then comments, then CI, then closure, in that order', async () => {
  const skill = await readSkill('code-ci');

  const wanted = ['Conflicts', 'Comments', 'CI', 'Closure'];
  const positions = wanted.map((h) => skill.headings.indexOf(h));

  for (const [i, pos] of positions.entries()) {
    assert.ok(pos !== -1, `expected a "## ${wanted[i]}" heading`);
  }
  for (let i = 1; i < positions.length; i += 1) {
    assert.ok(positions[i] > positions[i - 1], `expected "${wanted[i]}" to come after "${wanted[i - 1]}"`);
  }
});

test('skill-code-ci: classifies a red check as inherited or in-scope before fixing it', async () => {
  const skill = await readSkill('code-ci');

  assert.match(skill.body, /[Ii]nherited/);
  assert.match(skill.body, /in-scope/i);
  assert.match(skill.body, /base is already red|base.branch alone|base-branch evidence/i);
  assert.match(skill.body, /do not (fix outside this scope|chase it as if this branch caused it)/i);
});

test('skill-code-ci: links the shared host operations table and covers resolve a thread', async () => {
  const skill = await readSkill('code-ci');

  assert.match(skill.body, /\(\.\.\/code-pr\/references\/host-operations\.md\)/);
  assert.match(skill.body, /resolve a thread/i);
});

test('skill-code-ci: names the Bitbucket REST fallback for resolving a thread', async () => {
  const skill = await readSkill('code-ci');

  assert.match(skill.body, /Bitbucket/);
  assert.match(skill.body, /has no tool that resolves a thread/i);
  assert.match(skill.body, /REST route/i);
});

test('skill-code-ci: names every host step in plain words, never a host tool name or URL', async () => {
  const skill = await readSkill('code-ci');

  assert.doesNotMatch(skill.body, /\bgh pr\b/);
  assert.doesNotMatch(skill.body, /create_pull_request|pull_request_read|pull_request_review_write|get_job_logs/);
  assert.doesNotMatch(skill.body, /createPullRequest|getPullRequestDetails|addPullRequestComment/);
  assert.doesNotMatch(skill.body, /api\.bitbucket\.org/);
});

test('skill-code-ci: never merges the pull request or enables auto-merge', async () => {
  const skill = await readSkill('code-ci');

  assert.match(skill.body, /[Nn]ever merge/);
  assert.match(skill.body, /auto-merge/i);
  assert.doesNotMatch(skill.body, /```[^`]*\bmerge\b[^`]*```/is);
});

test('skill-code-ci: distinguishes updating the branch from base from merging the pull request', async () => {
  const skill = await readSkill('code-ci');

  assert.match(skill.body, /update the branch from base/i);
});

test('skill-code-ci: runs closure only on a separate ask and points at the pull-request skill for it', async () => {
  const skill = await readSkill('code-ci');

  assert.match(skill.body, /`code-pr`/);
  assert.match(skill.body, /pre-merge closure/i);
  assert.match(skill.body, /explicit ask/i);
});

test('skill-code-ci: requires an explicit ask and never auto-chains into the loop', async () => {
  const skill = await readSkill('code-ci');

  assert.match(skill.body, /explicit ask/i);
  assert.match(skill.body, /## When not to use/);
});

test('skill-code-ci: reports merge-ready or blocked with tried and need, never a merge', async () => {
  const skill = await readSkill('code-ci');

  assert.match(skill.body, /[Mm]erge-ready/);
  assert.match(skill.body, /\*\*TRIED\*\*/);
  assert.match(skill.body, /\*\*NEED\*\*/);
});

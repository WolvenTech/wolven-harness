import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse as parseYaml } from 'yaml';
import { readSkill, assertSkillBasics } from './helpers/skill-contract.js';

test('skill-code-pr: passes the shared skill contract checks', async () => {
  await assertSkillBasics('code-pr', { requireHarnessValidate: true });
});

test('skill-code-pr: is ask-only in its frontmatter', async () => {
  const skill = await readSkill('code-pr');

  assert.equal(skill.frontmatter['disable-model-invocation'], true);
});

test('skill-code-pr: ships an ask-only agents/openai.yaml', async () => {
  const skill = await readSkill('code-pr');

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

test('skill-code-pr: title is always Conventional Commits shape', async () => {
  const skill = await readSkill('code-pr');

  assert.match(skill.body, /Conventional Commits/);
  assert.match(skill.body, /type\(scope\): summary/);
});

test('skill-code-pr: pushes every run and never merges or enables auto-merge', async () => {
  const skill = await readSkill('code-pr');

  assert.match(skill.body, /push branch/i);
  assert.match(skill.body, /every run/i);
  assert.match(skill.body, /[Nn]ever merge/);
  assert.match(skill.body, /auto-merge/i);
  assert.doesNotMatch(skill.body, /\bgh pr merge\b/);
});

test('skill-code-pr: finds an existing PR before opening and handles zero, one, and many', async () => {
  const skill = await readSkill('code-pr');

  assert.match(skill.body, /[Zz]ero.{0,40}create/s);
  assert.match(skill.body, /[Oo]ne.{0,40}amend/s);
  assert.match(skill.body, /[Mm]ore than one.{0,60}stop and ask/is);
  assert.match(skill.body, /never open a second/i);
});

test('skill-code-pr: host steps cite host-operations.md and name the operations by plain words', async () => {
  const skill = await readSkill('code-pr');

  assert.match(skill.body, /references\/host-operations\.md/);
  assert.match(skill.body, /push branch/i);
  assert.match(skill.body, /read PR and diff/i);
  assert.match(skill.body, /open PR/);
  assert.doesNotMatch(skill.body, /create_pull_request|pull_request_read|pull_request_review_write|get_job_logs/);
  assert.doesNotMatch(skill.body, /createPullRequest|getPullRequestDetails/);
  assert.doesNotMatch(skill.body, /api\.bitbucket\.org/);
  assert.doesNotMatch(skill.body, /(^|[\s`(])gh (pr|api|run|auth|repo|issue)\b/m);
});

test('skill-code-pr: reads before rewriting on amend', async () => {
  const skill = await readSkill('code-pr');

  assert.match(skill.body, /[Rr]ead before rewrite/);
  assert.match(skill.body, /title.{0,20}body.{0,20}comments|comments.{0,40}before replacing/is);
});

test('skill-code-pr: verification cites real evidence, N/A only for docs-only', async () => {
  const skill = await readSkill('code-pr');

  assert.match(skill.body, /real evidence|actually run/i);
  assert.match(skill.body, /N\/A.{0,60}docs-only/is);
});

test('skill-code-pr: checkbox reset before ticking from this session', async () => {
  const skill = await readSkill('code-pr');

  assert.match(skill.body, /[Cc]heckbox reset/);
  assert.match(skill.body, /\[ \]/);
});

test('skill-code-pr: body template has the required sections and checkbox guidance', async () => {
  const skill = await readSkill('code-pr');
  const template = await skill.read('references/pr-body-template.md');

  for (const heading of [
    'Summary of Changes',
    '## What',
    '## Why',
    '## How',
    'Changes Made',
    'Verification & Testing',
    '## Checklist',
    'Pre-merge closure',
    'Risk & Reviewer Notes',
  ]) {
    assert.ok(template.includes(heading), `expected the body template to include "${heading}"`);
  }

  assert.doesNotMatch(template, /human review focus/i);
  assert.match(template, /Review focus/);
  assert.match(template, /\[ \]/);
  assert.match(template, /checkbox reset/i);
});

test('skill-code-pr: pre-merge-closure.md moves the spec/plan and PRD folders to the exact archived paths, deprecated', async () => {
  const skill = await readSkill('code-pr');
  const closure = await skill.read('references/pre-merge-closure.md');

  assert.match(closure, /docs\/specs\/archived\/<slug>\//);
  assert.match(closure, /docs\/prds\/archived\/<slug>\//);
  assert.match(closure, /status: deprecated/);
  assert.match(closure, /status: stable/);
  assert.match(closure, /harness:validate/);
  assert.doesNotMatch(closure, /status: archived/);
});

test('skill-code-pr: pre-merge closure runs only as the last batch before merge, never mid-initiative', async () => {
  const skill = await readSkill('code-pr');
  const closure = await skill.read('references/pre-merge-closure.md');

  assert.match(closure, /last mutate batch/i);
  assert.match(closure, /never.{0,40}mid-initiative|not.{0,20}mid-initiative/is);
});

test('skill-code-pr: pre-merge closure is not needed to open or amend, only to claim merge-ready or tick closure boxes', async () => {
  const skill = await readSkill('code-pr');

  const flat = skill.body.replace(/\s+/g, ' ');
  assert.match(flat, /not needed to.{0,20}\*\*open\*\*.{0,20}\*\*amend\*\*/i);
  assert.match(flat, /needed only to claim merge-ready or to tick a closure checkbox/i);
  assert.match(skill.body, /\*\*Not a refusal:\*\*/);
});

test('skill-code-pr: prints the PR found or created and the resolved base', async () => {
  const skill = await readSkill('code-pr');
  const flat = skill.body.replace(/\s+/g, ' ');

  assert.match(flat, /[Pp]rint the PR found or created and the resolved base/);
});

test('skill-code-pr: ships a filled verification example', async () => {
  const skill = await readSkill('code-pr');

  assert.match(skill.body, /## EXAMPLE — filled verification/);
  const example = skill.body.slice(
    skill.body.indexOf('## EXAMPLE — filled verification'),
    skill.body.indexOf('## Pragmatic-guard'),
  );

  assert.match(example, /\*\*Title:\*\* `[a-z]+(\([a-z0-9-]+\))?: .+`/);
  assert.match(example, /harness:validate/);
  assert.match(example, /## Checklist/);
  assert.match(example, /\[x\]/);
  assert.match(example, /checkbox reset/i);
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parse as parseYaml } from 'yaml';
import { assertSkillBasics, readSkill } from './helpers/skill-contract.js';

test('skill-code-pr: passes the shared skill contract checks', async () => {
  await assertSkillBasics('code-pr', { requireHarnessValidate: true });
});

test('skill-code-pr: ships display_name and short_description', async () => {
  const skill = await readSkill('code-pr');

  assert.ok(skill.files.includes('agents/openai.yaml'), 'expected agents/openai.yaml');

  const raw = await skill.read('agents/openai.yaml');
  const parsed = parseYaml(raw) as {
    interface?: { display_name?: string; short_description?: string };
    policy?: { allow_implicit_invocation?: boolean };
  };

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

test('proof-cloud-session-skills-code-commit-installed', async () => {
  const codePr = await readSkill('code-pr');
  const codeCi = await readSkill('code-ci');
  const closure = await codePr.read('references/pre-merge-closure.md');
  const commitInstalled =
    /A commit goes through `code-commit` when `code-commit\/SKILL\.md` is at `\.agents\/skills\/code-commit\/SKILL\.md` or `\.claude\/skills\/code-commit\/SKILL\.md` \(either project load path\)/;
  const commitStop = /When that file is on neither path, stop, name `code-commit`, and do not run `git commit`/;

  for (const text of [codePr.body, codeCi.body, closure]) {
    const flat = text.replace(/\s+/g, ' ');
    assert.match(flat, commitInstalled);
    assert.match(flat, commitStop);
    assert.match(flat, /That check does not consult the session skill list/);
  }

  assert.match(closure.replace(/\s+/g, ' '), /then push branch \(see \[host operations\]\(host-operations\.md\)\)/);
});

test('proof-cloud-session-skills-consults-stay', async () => {
  const skill = await readSkill('code-pr');
  const flat = skill.body.replace(/\s+/g, ' ');
  const consultAt = flat.indexOf('**Consult:**');
  const templateAt = flat.indexOf('**Body template:**');

  assert.ok(consultAt >= 0 && templateAt > consultAt, 'expected the consult before the body template');
  const consult = flat.slice(consultAt, templateAt);
  assert.match(
    consult,
    /Loaded means the session skill list from the runtime\. When that list includes `pragmatic-guard`/,
  );
  assert.match(consult, /A folder on disk or a remembered name is not loaded/);
  assert.doesNotMatch(consult, /That check does not consult the session skill list/);
  assert.match(flat, /That check does not consult the session skill list/);

  const closure = (await skill.read('references/pre-merge-closure.md')).replace(/\s+/g, ' ');
  assert.match(closure, /When `adr` is on the session skill list/);
});

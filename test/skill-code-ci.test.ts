import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parse as parseYaml } from 'yaml';
import { assertSkillBasics, readSkill } from './helpers/skill-contract.js';

test('skill-code-ci: passes the shared skill contract checks', async () => {
  await assertSkillBasics('code-ci', { requireHarnessValidate: true });
});

test('skill-code-ci: ships display_name and short_description', async () => {
  const skill = await readSkill('code-ci');

  assert.ok(skill.files.includes('agents/openai.yaml'), 'expected agents/openai.yaml');

  const raw = await skill.read('agents/openai.yaml');
  const parsed = parseYaml(raw) as {
    interface?: { display_name?: string; short_description?: string };
    policy?: { allow_implicit_invocation?: boolean };
  };

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

test('skill-code-ci: names When not to use', async () => {
  const skill = await readSkill('code-ci');

  assert.match(skill.body, /## When not to use/);
});

test('skill-code-ci: reports merge-ready or blocked with tried and need, never a merge', async () => {
  const skill = await readSkill('code-ci');

  assert.match(skill.body, /[Mm]erge-ready/);
  assert.match(skill.body, /\*\*TRIED\*\*/);
  assert.match(skill.body, /\*\*NEED\*\*/);
});

test('proof-cloud-session-skills-code-pr-installed', async () => {
  const skill = await readSkill('code-ci');
  const flat = skill.body.replace(/\s+/g, ' ');

  assert.match(
    flat,
    /A host action follows `code-pr\/references\/host-operations\.md` when `code-pr\/SKILL\.md` is at `\.agents\/skills\/code-pr\/SKILL\.md` or `\.claude\/skills\/code-pr\/SKILL\.md`/,
  );
  assert.match(
    flat,
    /When that file is on neither path, stop before the host action, name `code-pr`, and do not copy the host procedure/,
  );
  assert.match(flat, /That check does not consult the session skill list/);
});

test('proof-cloud-session-skills-consults-stay', async () => {
  const skill = await readSkill('code-ci');
  const flat = skill.body.replace(/\s+/g, ' ');
  const consultAt = flat.indexOf('**Consult:**');
  const hostAt = flat.indexOf('**Host steps:**');

  assert.ok(consultAt >= 0 && hostAt > consultAt, 'expected the consult before host steps');
  const consult = flat.slice(consultAt, hostAt);
  assert.match(
    consult,
    /Loaded means the session skill list from the runtime\. When that list includes `pragmatic-guard`/,
  );
  assert.match(consult, /A folder on disk or a remembered name is not loaded/);
  assert.doesNotMatch(consult, /That check does not consult the session skill list/);
  assert.match(flat, /That check does not consult the session skill list/);
});

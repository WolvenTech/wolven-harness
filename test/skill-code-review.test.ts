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

test('proof-cloud-session-skills-code-pr-installed', async () => {
  const skill = await readSkill('code-review');
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

test('proof-cloud-session-skills-ask-only', async () => {
  for (const name of ['code-review', 'code-pr', 'code-ci', 'handoff']) {
    const skill = await readSkill(name);

    assert.equal(skill.frontmatter['disable-model-invocation'], true, name);

    const raw = await skill.read('agents/openai.yaml');
    const parsed = parseYaml(raw) as { policy?: { allow_implicit_invocation?: boolean } };

    assert.equal(parsed.policy?.allow_implicit_invocation, false, name);
  }
});

test('proof-cloud-session-skills-consults-stay', async () => {
  const skill = await readSkill('code-review');
  const flat = skill.body.replace(/\s+/g, ' ');
  const consultAt = flat.indexOf('**Consult:**');
  const hostAt = flat.indexOf('**Host steps:**');
  const handoffAt = flat.indexOf('**Review-fix handoff**');
  const verdictAt = flat.indexOf('End with one verdict');

  assert.ok(consultAt >= 0 && hostAt > consultAt, 'expected the consult before host steps');
  const consult = flat.slice(consultAt, hostAt);
  assert.match(consult, /when the session skill list includes `pragmatic-guard`/);
  assert.match(consult, /A folder on disk or a remembered name is not loaded/);
  assert.doesNotMatch(consult, /That check does not consult the session skill list/);

  assert.ok(handoffAt >= 0 && verdictAt > handoffAt, 'expected the handoff before the verdict');
  const handoff = flat.slice(handoffAt, verdictAt);
  assert.match(handoff, /`code-spec` or `code-plan` is absent from the session skill list/);
  assert.match(handoff, /A folder on disk or a remembered name is not loaded/);
});

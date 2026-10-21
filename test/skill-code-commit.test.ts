import assert from 'node:assert/strict';
import { test } from 'node:test';
import { section } from './helpers/markdown.js';
import { assertSkillBasics, readSkill } from './helpers/skill-contract.js';

/** Returns the content of the first ```` ```text ```` fence in `text`. */
function textFence(text: string): string {
  const match = text.match(/```text\n([\s\S]*?)```/);
  assert.ok(match, 'expected a ```text fenced block');
  return match[1];
}

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
  assert.match(skill.body, /never\s+leave\s+the\s+plan-completion\s+mark\s+for\s+a\s+later\s+commit/i);
  assert.match(skill.body, /never\s+flip\s+the\s+checkbox\s+of\s+a\s+unit\s+outside\s+the\s+batch/i);
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

test('proof-templates-trim-wave-message-rule: a multi-unit wave batch is one subject plus a body of at most three lines', async () => {
  const skill = await readSkill('code-commit');
  const rule = section(skill.body, '### Wave batch').replace(/\s+/g, ' ');

  assert.match(rule, /wave batch of more than one unit gets \*\*one\*\* Conventional Commit/i);
  assert.match(rule, /subject that states the batch's outcome/);
  assert.match(rule, /body of \*\*at most three lines\*\*/);
  assert.match(rule, /never join per-unit subjects into one message/i);
});

test('proof-templates-trim-wave-scope: one-unit waves and standalone commits keep the existing rules', async () => {
  const skill = await readSkill('code-commit');
  const rule = section(skill.body, '### Wave batch').replace(/\s+/g, ' ');

  assert.match(rule, /wave batch/i);
  assert.match(rule, /a one-unit wave and a standalone commit keep the message shape above/i);
  assert.match(rule, /no invented batch summary/i);
  assert.match(rule, /no three-line cap/i);
  assert.match(rule, /split rule for unrelated contexts still applies/i);
  assert.match(skill.body, /## Multi-commit heuristics/);
  assert.match(skill.body, /Split/);
  assert.doesNotMatch(skill.body, /autocommit/i);
});

// why: the atomic commit gate is the unchanged contract, so this test catches
// a rewording that would silently edit it.
const ATOMIC_COMMIT_GATE_BASELINE = [
  'Create a Conventional Commit **only after validation has passed**. When a',
  "plan unit is in scope, its **plan-completion mark** — the unit's Done-when",
  'checkbox in `docs/specs/<slug>/<slug>-plan.md`, already flipped in the',
  'worktree and not yet committed — lands in the **same commit** as its work.',
  '',
  "1. Stage the batch's proven work **and** only the batch's plan-completion",
  '   marks.',
  '2. One commit contains both; never leave the plan-completion mark for a',
  '   later commit, and never flip the checkbox of a unit outside the batch.',
  '3. With no plan unit in scope, skip plan staging.',
  '',
  '**If the commit fails** (hook reject, empty stage, conflict, abort):',
  '',
  '1. The unit remains **incomplete** — every unit in the batch.',
  "2. Reverse the batch's plan-completion marks to `[ ]` — never leave a",
  '   false-green checkbox on the plan; keep the rest of the uncommitted work.',
  '3. Re-confirm validation before retrying; never claim the unit done from a',
  '   failed commit.',
].join('\n');

test('proof-templates-trim-plan-mark-unchanged: the Atomic commit gate section equals the baseline', async () => {
  const skill = await readSkill('code-commit');

  assert.equal(section(skill.body, '## Atomic commit gate').trim(), ATOMIC_COMMIT_GATE_BASELINE);
});

test('proof-templates-trim-wave-examples: a good wave message and a bad concatenated one', async () => {
  const skill = await readSkill('code-commit');
  const examples = await skill.read('references/commit-examples.md');
  const goodHeading = '### One message for a multi-unit wave (wave batch)';
  const badHeading = '### Joined unit subjects (bad)';
  const goodLines = textFence(section(examples, goodHeading)).replace(/\n$/, '').split('\n');
  const badBlock = textFence(section(examples, badHeading));
  const goodBody = goodLines.slice(1).filter((line) => line.trim().length > 0);
  const badSubjects = badBlock.split('\n').filter((line) => /^[a-z]+\([a-z0-9-]+\): /.test(line));

  assert.ok(examples.indexOf('## Good') < examples.indexOf(goodHeading));
  assert.ok(examples.indexOf(goodHeading) < examples.indexOf('## Type quick reference'));
  assert.ok(examples.indexOf('## Bad examples') < examples.indexOf(badHeading));
  assert.match(goodLines[0], /^[a-z]+\([a-z0-9-]+\): \S/);
  assert.equal(goodLines.slice(1).filter((line) => /^[a-z]+\([a-z0-9-]+\): /.test(line)).length, 0);
  assert.ok(goodBody.length >= 1 && goodBody.length <= 3, `expected 1-3 body lines, got ${goodBody.length}`);
  assert.ok(
    badSubjects.length >= 2,
    `expected at least two joined \`type(scope):\` subjects, got ${badSubjects.length}`,
  );
});

test('proof-guard-consult-no-negative-commit: consults stay without mandatory negative boilerplate', async () => {
  const skill = await readSkill('code-commit');
  const flat = skill.body.replace(/\s+/g, ' ');
  const consultAt = flat.indexOf('**Consult:**');
  const inOutAt = flat.indexOf('**In / out / handoff:**');

  assert.ok(consultAt >= 0 && inOutAt > consultAt, 'expected the consult before in/out');
  const consult = flat.slice(consultAt, inOutAt);
  assert.match(
    consult,
    /Loaded means the session skill list from the runtime\. When that list includes `pragmatic-guard`/,
  );
  assert.match(consult, /A folder on disk or a remembered name is not loaded/);
  assert.doesNotMatch(consult, /pragmatic-guard was not consulted/);
});

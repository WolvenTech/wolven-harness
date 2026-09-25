import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readSkill, assertSkillBasics } from './helpers/skill-contract.js';

test('builder-brief: passes the shared skill contract checks', async () => {
  await assertSkillBasics('code-execute', { requireHarnessValidate: true });
});

test('builder-brief: is model-invocable', async () => {
  const skill = await readSkill('code-execute');
  assert.equal('disable-model-invocation' in skill.frontmatter, false);
  assert.ok(!skill.files.includes('agents/openai.yaml'));
});

test('builder-brief: documents all seven resume fields by name', async () => {
  const skill = await readSkill('code-execute');
  const names = [
    'Unit identifier',
    'Spec/plan paths',
    'Obligation / proof status',
    '`HEAD` commit',
    '`git status` summary',
    'Intended diff scope',
    'Decision on every discrepancy',
  ];
  for (const name of names) {
    assert.ok(skill.body.includes(name), `expected the resume field "${name}" to be named in the skill`);
  }
});

test('builder-brief: documents a pre-start print before mutate', async () => {
  const skill = await readSkill('code-execute');
  assert.ok(skill.headings.some((h) => /pre-start print/i.test(h)), 'expected a pre-start print section');
  assert.match(skill.body, /before (editing files|any mutate)/i);
});

test('builder-brief: validate must pass before a commit is asked for', async () => {
  const skill = await readSkill('code-execute');
  assert.match(skill.body, /validate before commit/i);
  assert.match(skill.body, /harness:validate/);
});

test('builder-brief: the plan mark lands in the same commit as the work', async () => {
  const skill = await readSkill('code-execute');
  assert.match(skill.body, /plan('s)? mark[s]? land[s]?[^.\n]*(same|one) commit/i);
});

test('builder-brief: tells the parent to paste the brief and re-run the final check at every wave gate', async () => {
  const skill = await readSkill('code-execute');
  const flat = skill.body.replace(/\s+/g, ' ');
  assert.match(flat, /paste[^.]*(subagent's prompt|filled-in)/i);
  assert.match(flat, /builder-brief\.md/);
  assert.match(flat, /re-runs[^.]*final check[^.]*wave gate/i);
});

test('builder-brief: never calls code-commit, code-pr, code-review, or code-ci on its own', async () => {
  const skill = await readSkill('code-execute');
  assert.match(skill.body, /do not\s*\*\*\s*invoke `code-commit`, `code-pr`, `code-review`, or `code-ci`/i);
});

test('builder-brief.md carries the unit row verbatim placeholder and its Owns / must-not-touch', async () => {
  const skill = await readSkill('code-execute');
  const brief = await skill.read('references/builder-brief.md');

  assert.ok(skill.headings.length > 0);
  assert.match(brief, /Unit row \(verbatim from the plan\)/i);
  assert.match(brief, /Owns and must-not-touch/i);
  assert.match(brief, /Must not touch/i);
});

test('builder-brief.md restricts the subagent to tests only — no build, commit, or push', async () => {
  const skill = await readSkill('code-execute');
  const brief = await skill.read('references/builder-brief.md');
  assert.match(brief, /tests only[^.\n]*no build,? (no )?commit,? (or |no )?push/i);
});

test('builder-brief.md names the final check and requires both outputs pasted', async () => {
  const skill = await readSkill('code-execute');
  const brief = await skill.read('references/builder-brief.md');
  assert.match(brief, /harness:comments/);
  assert.match(brief, /harness:validate/);
  assert.match(brief, /paste both outputs/i);
});

test('builder-brief.md return shape names files, checklist, check outputs, and blockers', async () => {
  const skill = await readSkill('code-execute');
  const brief = await skill.read('references/builder-brief.md');
  assert.match(brief, /\*\*Files changed:\*\*/);
  assert.match(brief, /\*\*Checklist:\*\*/);
  assert.match(brief, /\*\*Check outputs:\*\*/);
  assert.match(brief, /\*\*Outside Owns \/ blockers:\*\*/);
});

test('builder-brief: says the brief is a paste-in prompt, not a registered agent', async () => {
  const skill = await readSkill('code-execute');
  const brief = await skill.read('references/builder-brief.md');
  assert.match(brief, /not a registered persona/i);
  assert.match(skill.body, /not a registered persona file/i);
});

test('builder-brief: no writer, Fast-draft, docs/index, .agents/agents, or code-commit.config anywhere in the skill', async () => {
  const skill = await readSkill('code-execute');

  for (const rel of skill.files) {
    const content = await skill.read(rel);
    assert.doesNotMatch(content, /\bwriter\b/i, `${rel} must not mention a writer persona`);
    assert.doesNotMatch(content, /fast-draft/i, `${rel} must not mention Fast-draft`);
    assert.doesNotMatch(content, /docs\/index/i, `${rel} must not mention docs/index`);
    assert.doesNotMatch(content, /\.agents\/agents/i, `${rel} must not load .agents/agents`);
    assert.doesNotMatch(content, /code-commit\.config/i, `${rel} must not invent a commit-cadence config file`);
    assert.doesNotMatch(content, /\bthreshold\b/i, `${rel} must not name a threshold rule`);
    assert.doesNotMatch(content, /\bN\s*=\s*\d/i, `${rel} must not name an "N = <number>" line-count rule`);
  }
});

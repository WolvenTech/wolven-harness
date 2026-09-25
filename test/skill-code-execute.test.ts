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

test('builder-brief: never auto-chains code-pr, code-review, or code-ci', async () => {
  const skill = await readSkill('code-execute');
  assert.match(skill.body, /never invoke `code-pr`,\s*`code-review`, or `code-ci` on its own/i);
  assert.match(skill.body, /[Aa]uto-chaining `code-pr`, `code-review`, or `code-ci` after every unit/);
});

test('builder-brief: invokes code-commit only when the resolved opt says to', async () => {
  const skill = await readSkill('code-execute');
  assert.match(skill.body, /invoke `code-commit` only when the resolved/i);
  assert.match(skill.body, /[Cc]ommit only on cadence/);
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

test('builder-brief: no writer, Fast-draft, docs/index, or .agents/agents anywhere in the skill', async () => {
  const skill = await readSkill('code-execute');

  for (const rel of skill.files) {
    const content = await skill.read(rel);
    assert.doesNotMatch(content, /\bwriter\b/i, `${rel} must not mention a writer persona`);
    assert.doesNotMatch(content, /fast-draft/i, `${rel} must not mention Fast-draft`);
    assert.doesNotMatch(content, /docs\/index/i, `${rel} must not mention docs/index`);
    assert.doesNotMatch(content, /\.agents\/agents/i, `${rel} must not load .agents/agents`);
    assert.doesNotMatch(content, /\bthreshold\b/i, `${rel} must not name a threshold rule`);
    assert.doesNotMatch(content, /\bN\s*=\s*\d/i, `${rel} must not name an "N = <number>" line-count rule`);
  }
});

test('builder-brief: reads the consumer opt from one named config path', async () => {
  const skill = await readSkill('code-execute');
  assert.match(skill.body, /\.agents\/code-commit\.config\.yml/);
});

test('builder-brief: both cadence keys are named with their defaults', async () => {
  const skill = await readSkill('code-execute');
  const flat = skill.body.replace(/\s+/g, ' ');
  assert.match(flat, /key's default: `autocommit: false`, `autocommit-rule: wave`/);
});

test('builder-brief: an unknown cadence value fails closed instead of guessing', async () => {
  const skill = await readSkill('code-execute');
  assert.match(skill.body, /fail-closed/i);
  assert.match(skill.body, /do not\s*\n?\s*guess/i);
  assert.match(skill.body, /name the bad key/i);
});

test('builder-brief: the three-row cadence table covers false, unit, and wave', async () => {
  const skill = await readSkill('code-execute');
  const flat = skill.body.replace(/\s+/g, ' ');
  assert.match(flat, /\| `false` \| ignored \| Skip `code-commit`/);
  assert.match(flat, /\| `true` \| `unit` \|/);
  assert.match(flat, /\| `true` \| `wave` \|/);
});

test('builder-brief: pre-start print states the resolved opt', async () => {
  const skill = await readSkill('code-execute');
  const preStart = skill.body.slice(
    skill.body.indexOf('## Pre-start print'),
    skill.body.indexOf('## Done-when checklist'),
  );
  assert.match(preStart, /[Rr]esolved opt/);
  assert.match(preStart, /`autocommit`/);
  assert.match(preStart, /`autocommit-rule`/);
});

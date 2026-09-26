import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run, makeRepo } from './helpers/fixture.js';
import { readSkill, assertSkillBasics, renderInto } from './helpers/skill-contract.js';

const CONCRETE_ADR_TOKEN_RE = /\bADR-\d{3}\b|\badr-\d{3}-[a-z]/;

test('skill-adr: passes the shared skill contract checks, including the harness:validate mention', async () => {
  await assertSkillBasics('adr', { requireHarnessValidate: true });
});

test('skill-adr: describes create, promote, and supersede, each followed by validate', async () => {
  const skill = await readSkill('adr');

  assert.match(skill.body, /## Create/);
  assert.match(skill.body, /## Promote/);
  assert.match(skill.body, /## Supersede/);

  const sections = skill.body.split(/^## /m).slice(1);
  for (const name of ['Create', 'Promote', 'Supersede']) {
    const section = sections.find((s) => s.startsWith(name));
    assert.ok(section, `missing "## ${name}" section`);
    assert.match(section!, /harness:validate/, `"## ${name}" section must run harness:validate`);
  }
});

test('skill-adr: creates the next free numbered file as draft from the template', async () => {
  const skill = await readSkill('adr');

  assert.match(skill.body, /next free/i);
  assert.match(skill.body, /adr-NNN-<slug>\.md/);
  assert.match(skill.body, /status: draft/);
});

test('skill-adr: promotes to stable only once the confirmation step approves it', async () => {
  const skill = await readSkill('adr');

  const promoteSection = skill.body.split(/^## Promote/m)[1]?.split(/^## /m)[0] ?? '';
  assert.match(promoteSection, /human confirms/i);
  assert.match(promoteSection, /stable/);
});

test('skill-adr: supersedes by deprecating the old ADR, setting superseded_by, and repointing its claims', async () => {
  const skill = await readSkill('adr');

  const supersedeSection = skill.body.split(/^## Supersede/m)[1]?.split(/^## /m)[0] ?? '';
  assert.match(supersedeSection, /deprecated/);
  assert.match(supersedeSection, /superseded_by/);
  assert.match(supersedeSection, /[Rr]epoint/);
});

test('skill-adr: the skill folder carries no concrete ADR-NNN or adr-NNN-<slug> tokens, only placeholders', async () => {
  const skill = await readSkill('adr');

  for (const rel of skill.files) {
    const content = await skill.read(rel);
    assert.doesNotMatch(content, CONCRETE_ADR_TOKEN_RE, `${rel} contains a concrete ADR token`);
  }
});

test('skill-adr: renderInto writes a new ADR from the template that passes validate', async () => {
  const cwd = await renderInto(
    {},
    '.agents/skills/adr/references/adr-template.md',
    'docs/adrs/adr-001-use-x.md',
    {
      title: 'Use X',
      description: 'records the decision to use X',
      context: 'A choice needed a durable record.',
      decision: 'We use X.',
      consequences: 'Future work builds on X.',
    },
  );

  const result = await run(['validate'], { cwd });

  assert.equal(result.code, 0, result.stdout + result.stderr);
});

test('skill-adr: a supersession fixture (old deprecated, new stable, claim repointed) passes validate', async () => {
  const cwd = await makeRepo(
    {
      'docs/adrs/adr-001-old-decision.md': [
        '---',
        'type: adr',
        'title: Old decision',
        'description: the decision this record replaced',
        'status: deprecated',
        'superseded_by: adr-002-new-decision',
        '---',
        '',
        '# Old decision',
        '',
        '## Context',
        '',
        'A prior choice.',
        '',
        '## Decision',
        '',
        'We chose the old way.',
        '',
        '## Consequences',
        '',
        'Superseded below.',
        '',
      ].join('\n'),
      'docs/adrs/adr-002-new-decision.md': [
        '---',
        'type: adr',
        'title: New decision',
        'description: the decision that replaces the old one',
        'status: stable',
        '---',
        '',
        '# New decision',
        '',
        '## Context',
        '',
        'The old choice needed revisiting.',
        '',
        '## Decision',
        '',
        'We now choose the new way.',
        '',
        '## Consequences',
        '',
        'Anything citing the old decision points here instead.',
        '',
      ].join('\n'),
      'README.md': 'The current decision is recorded in ADR-002 (adr-002-new-decision).\n',
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd });

  assert.equal(result.code, 0, result.stdout + result.stderr);
});

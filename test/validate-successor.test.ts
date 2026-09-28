import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRepo, run } from './helpers/fixture.js';

test('superseded-resolves: missing successor — one profile-superseded-by error naming the value, exit 1', async () => {
  const dir = await makeRepo(
    {
      'docs/adrs/adr-001-old-decision.md': [
        '---',
        'type: adr',
        'title: Old decision',
        'description: superseded by an ADR that does not exist',
        'status: deprecated',
        'superseded_by: adr-999-missing',
        '---',
        '',
        '# Old decision',
        '',
      ].join('\n'),
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 1);
  const matches = result.stdout.match(/profile-superseded-by/g) ?? [];
  assert.equal(matches.length, 1);
  assert.match(result.stdout, /adr-999-missing/);
});

test('superseded-resolves: existing successor — no profile-superseded-by finding', async () => {
  const dir = await makeRepo(
    {
      'docs/adrs/adr-001-old-decision.md': [
        '---',
        'type: adr',
        'title: Old decision',
        'description: superseded by a decision that exists',
        'status: deprecated',
        'superseded_by: adr-002-new-decision',
        '---',
        '',
        '# Old decision',
        '',
      ].join('\n'),
      'docs/adrs/adr-002-new-decision.md': [
        '---',
        'type: adr',
        'title: New decision',
        'description: the current decision',
        'status: stable',
        '---',
        '',
        '# New decision',
        '',
      ].join('\n'),
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 0, result.stdout);
  assert.doesNotMatch(result.stdout, /profile-superseded-by/);
});

test('superseded-resolves: chain deprecated -> deprecated -> stable — no profile-superseded-by finding', async () => {
  const dir = await makeRepo(
    {
      'docs/adrs/adr-001-first.md': [
        '---',
        'type: adr',
        'title: First decision',
        'description: superseded by the second, itself deprecated',
        'status: deprecated',
        'superseded_by: adr-002-second',
        '---',
        '',
        '# First decision',
        '',
      ].join('\n'),
      'docs/adrs/adr-002-second.md': [
        '---',
        'type: adr',
        'title: Second decision',
        'description: superseded by the third, which is stable',
        'status: deprecated',
        'superseded_by: adr-003-third',
        '---',
        '',
        '# Second decision',
        '',
      ].join('\n'),
      'docs/adrs/adr-003-third.md': [
        '---',
        'type: adr',
        'title: Third decision',
        'description: the current decision',
        'status: stable',
        '---',
        '',
        '# Third decision',
        '',
      ].join('\n'),
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 0, result.stdout);
  assert.doesNotMatch(result.stdout, /profile-superseded-by/);
});

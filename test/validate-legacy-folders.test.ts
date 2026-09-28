import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRepo, run } from './helpers/fixture.js';

/** A Nygard-shaped legacy ADR body: no frontmatter, `## Status` section. */
function legacyAdrBody(number: string, title: string): string {
  return [`# ADR-${number}: ${title}`, '', '## Status', '', 'Accepted', '', '## Context', '', 'Context goes here.', ''].join(
    '\n',
  );
}

/** A minimal 4-digit-numbered body, shaped like an adr-tools/MADR entry. */
function fourDigitAdrBody(number: string, title: string): string {
  return [`# ${number}. ${title}`, '', '## Status', '', 'Accepted', ''].join('\n');
}

/** A minimal stable profile ADR body that passes the writing profile. */
function stableProfileAdr(title: string): string {
  return ['---', 'type: adr', `title: ${title}`, 'description: a fixture ADR', 'status: stable', '---', '', '# Fixture ADR', ''].join(
    '\n',
  );
}

test('legacy-archived: an archived copy of a legacy ADR raises no legacy-adr, the live one warns once, and a claim on it downgrades to legacy-warn with no claim-duplicate', async () => {
  const dir = await makeRepo(
    {
      'adrs/adr-001.md': legacyAdrBody('001', 'Use Postgres'),
      'adrs/archived/adr-001.md': legacyAdrBody('001', 'Use Postgres (archived copy)'),
      'AGENTS.md': 'See ADR-001 for the decision.\n',
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 0, result.stdout);

  const legacyLines = result.stdout.split('\n').filter((l) => l.includes('legacy ADR-'));
  assert.equal(legacyLines.length, 1, result.stdout);
  assert.match(result.stdout, /legacy ADR-001 \(adrs\/adr-001\.md\)/);
  assert.ok(!result.stdout.includes('adrs/archived/adr-001.md'), result.stdout);

  assert.match(result.stdout, /claims: \d+ ok, 1 legacy-warn, 0 fail/);
  assert.ok(!result.stdout.includes('claim-duplicate'), result.stdout);
});

test('adr-unrecognized: a decisions folder with two 4-digit files gets one warning naming the folder and the count, exit 0', async () => {
  const dir = await makeRepo(
    {
      'docs/decisions/0001-x.md': fourDigitAdrBody('0001', 'x'),
      'docs/decisions/0002-y.md': fourDigitAdrBody('0002', 'y'),
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 0, result.stdout);
  const warnLines = result.stdout.split('\n').filter((l) => l.includes('adr-unrecognized'));
  assert.equal(warnLines.length, 1, result.stdout);
  assert.match(result.stdout, /adr-unrecognized\] docs\/decisions: 2 file\(s\)/);
  assert.match(result.stdout, /numbering is not checked/);
});

test('adr-unrecognized: a 3-digit legacy set under adrs/ raises none', async () => {
  const dir = await makeRepo(
    {
      'adrs/adr-001.md': legacyAdrBody('001', 'Use Postgres'),
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 0, result.stdout);
  assert.ok(!result.stdout.includes('adr-unrecognized'), result.stdout);
});

test('adr-unrecognized: a valid profile ADR under docs/adrs/ raises none', async () => {
  const dir = await makeRepo(
    {
      'docs/adrs/adr-000-fixture.md': stableProfileAdr('Fixture'),
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 0, result.stdout);
  assert.ok(!result.stdout.includes('adr-unrecognized'), result.stdout);
});

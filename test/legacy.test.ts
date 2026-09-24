import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRepo, run } from './helpers/fixture.js';
import { buildRepoContext, resolveGitRoot } from '../src/validate/repo.js';
import { detectLegacy } from '../src/validate/legacy.js';

/** A Nygard-shaped legacy ADR body: no frontmatter, `## Status` section. */
function legacyAdrBody(number: string, title: string): string {
  return [`# ADR-${number}: ${title}`, '', '## Status', '', 'Accepted', '', '## Context', '', 'Context goes here.', ''].join(
    '\n',
  );
}

const LEGACY_README = [
  '# Architecture Decision Records',
  '',
  '- [ADR-001](adr-001.md)',
  '- [ADR-002](adr-002.md)',
  '',
].join('\n');

/** The agentic-mkt-shaped legacy fixture: two Nygard ADRs plus an index README. */
function legacyFixtureFiles(): Record<string, string> {
  return {
    'adrs/adr-001.md': legacyAdrBody('001', 'Use Postgres'),
    'adrs/adr-002.md': legacyAdrBody('002', 'Use Redis for caching'),
    'adrs/README.md': LEGACY_README,
  };
}

/** A minimal, R2.2-valid stable profile ADR body. */
function stableProfileAdr(title: string): string {
  return ['---', 'type: adr', `title: ${title}`, 'description: a fixture ADR', 'status: stable', '---', '', '# Fixture ADR', ''].join(
    '\n',
  );
}

// --- proof-wha-legacy-detect ---

test('legacy-detect: agentic-mkt fixture prints exactly two legacy-adr lines, none for README, exit 0', async () => {
  const dir = await makeRepo(legacyFixtureFiles(), { git: true });

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 0, result.stdout);

  const legacyLines = result.stdout.split('\n').filter((l) => l.includes('legacy ADR-'));
  assert.equal(legacyLines.length, 2, result.stdout);

  assert.match(
    result.stdout,
    /legacy ADR-001 \(adrs\/adr-001\.md\): 1 claims in 1 files — migrate via harness-init/,
  );
  assert.match(
    result.stdout,
    /legacy ADR-002 \(adrs\/adr-002\.md\): 1 claims in 1 files — migrate via harness-init/,
  );
  assert.ok(!/legacy ADR-\d{3} \(adrs\/README\.md\)/.test(result.stdout), result.stdout);
});

test('legacy-detect: detectLegacy matches adr-shaped basenames outside docs/adrs/, case-insensitively', async () => {
  const dir = await makeRepo(
    {
      'ADR-003.md': '# uppercase, no dash needed after adr\n',
      'adr003-x.md': '# no dash before the digits\n',
      'docs/adrs/adr-001-x.md': '# profile territory, excluded\n',
      'adr-01.md': '# only two digits, not a match\n',
    },
    { git: true },
  );

  const root = await resolveGitRoot(dir);
  const ctx = await buildRepoContext(root, { ignoreEntries: [], verbose: false });
  const legacyAdrs = await detectLegacy(ctx);

  const byPath = new Map(legacyAdrs.map((l) => [l.path, l.number]));

  assert.equal(byPath.get('ADR-003.md'), '003');
  assert.equal(byPath.get('adr003-x.md'), '003');
  assert.ok(!byPath.has('docs/adrs/adr-001-x.md'));
  assert.ok(!byPath.has('adr-01.md'));
});

// --- proof-wha-legacy-claims ---

test('legacy-claims: AGENTS.md citing ADR-002 warns, exit 0, file:line only under --verbose', async () => {
  const dir = await makeRepo(
    {
      ...legacyFixtureFiles(),
      'AGENTS.md': 'See ADR-002 for the caching decision.\n',
    },
    { git: true },
  );

  const plain = await run(['validate'], { cwd: dir });
  assert.equal(plain.code, 0, plain.stdout);
  assert.match(plain.stdout, /claims: \d+ ok, [1-9]\d* legacy-warn, 0 fail/);
  assert.ok(!plain.stdout.includes('AGENTS.md:1'), plain.stdout);

  const verbose = await run(['validate', '--verbose'], { cwd: dir });
  assert.equal(verbose.code, 0, verbose.stdout);
  assert.ok(verbose.stdout.includes('AGENTS.md:1'), verbose.stdout);
});

test('legacy-claims: ADR-999 in AGENTS.md exits 1 with claim-missing', async () => {
  const dir = await makeRepo(
    {
      ...legacyFixtureFiles(),
      'AGENTS.md': 'See ADR-999 for details.\n',
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 1);
  assert.match(result.stdout, /claim-missing/);
  assert.match(result.stdout, /AGENTS\.md:1/);
});

test('legacy-claims: a number with both a profile and a legacy ADR exits 1 as claim-duplicate', async () => {
  const dir = await makeRepo(
    {
      ...legacyFixtureFiles(),
      'docs/adrs/adr-001-use-postgres.md': stableProfileAdr('Use Postgres'),
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 1);
  assert.match(result.stdout, /claim-duplicate/);
});

test('legacy-claims: replacing legacy ADRs with valid profile ADRs drops the legacy warnings for the same claims', async () => {
  const dir = await makeRepo(
    {
      'docs/adrs/adr-001-use-postgres.md': stableProfileAdr('Use Postgres'),
      'docs/adrs/adr-002-use-redis.md': stableProfileAdr('Use Redis for caching'),
      'AGENTS.md': 'See ADR-002 for the caching decision.\n',
      'references.md': 'ADR-001 and ADR-002 are both documented.\n',
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 0, result.stdout);
  assert.ok(!result.stdout.includes('legacy ADR-'), result.stdout);
  assert.match(result.stdout, /claims: \d+ ok, 0 legacy-warn, 0 fail/);
});

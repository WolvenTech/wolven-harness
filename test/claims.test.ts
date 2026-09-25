import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeRepo, run } from './helpers/fixture.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');

/** A minimal profile ADR body that passes the writing profile. */
function stableAdr(opts: { title?: string; status?: string; supersededBy?: string } = {}): string {
  const lines = ['---', 'type: adr'];
  if (opts.title !== undefined) lines.push(`title: ${opts.title}`);
  lines.push('description: a fixture ADR');
  lines.push(`status: ${opts.status ?? 'stable'}`);
  if (opts.supersededBy !== undefined) lines.push(`superseded_by: ${opts.supersededBy}`);
  lines.push('---', '', '# Fixture ADR', '');
  return lines.join('\n');
}

// --- claim-scan ---

test('claim-scan: a claim in src/*.ts, AGENTS.md, and docs/specs/*.md is reported at each file:line', async () => {
  const dir = await makeRepo(
    {
      'src/x.ts': 'ADR-042\n',
      'AGENTS.md': 'ADR-042\n',
      'docs/specs/y.md': [
        '---',
        'type: spec',
        'title: Y',
        'description: has a claim',
        'status: stable',
        '---',
        '',
        'ADR-042 referenced here.',
        '',
      ].join('\n'),
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 1);
  assert.match(result.stdout, /claim-missing.*src\/x\.ts:1/);
  assert.match(result.stdout, /claim-missing.*AGENTS\.md:1/);
  assert.match(result.stdout, /claim-missing.*docs\/specs\/y\.md:8/);
});

test('claim-scan: tokens inside docs/adrs/*.md are not reported', async () => {
  const dir = await makeRepo(
    {
      'docs/adrs/adr-001-something.md': [
        '---',
        'type: adr',
        'title: Something',
        'description: mentions an unrelated adr number in its body',
        'status: stable',
        '---',
        '',
        'See ADR-999 for background.',
        '',
      ].join('\n'),
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 0, result.stdout);
  assert.match(result.stdout, /claims: 0 ok, 0 legacy-warn, 0 fail/);
});

test('claim-scan: tokens in docs/specs/archived/ and archived/ are not reported', async () => {
  const dir = await makeRepo(
    {
      'docs/specs/archived/z.md': 'ADR-999\n',
      'archived/q.md': 'ADR-999\n',
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 0, result.stdout);
  assert.match(result.stdout, /claims: 0 ok, 0 legacy-warn, 0 fail/);
});

test('claim-scan: tokens in an ignored dir are not reported', async () => {
  const dir = await makeRepo(
    {
      '.wolven-harness.json': JSON.stringify(
        { version: 1, gitHost: 'gh', runtimes: ['codex'], ignore: ['vendor/**'] },
        null,
        2,
      ),
      'vendor/thing.ts': 'ADR-999\n',
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 0, result.stdout);
  assert.match(result.stdout, /claims: 0 ok, 0 legacy-warn, 0 fail/);
});

test('claim-scan: a bare "adr-042" (lowercase, no slug) is not a claim', async () => {
  const dir = await makeRepo(
    {
      'README.md': 'see adr-042 for details\n',
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 0, result.stdout);
  assert.match(result.stdout, /claims: 0 ok/);
});

test('claim-scan: "ADR-0421" is not a claim', async () => {
  const dir = await makeRepo(
    {
      'README.md': 'see ADR-0421 for details\n',
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 0, result.stdout);
  assert.match(result.stdout, /claims: 0 ok/);
});

// --- claim-fail-closed ---

test('claim-fail-closed: claim-missing — a claim with no matching ADR exits 1', async () => {
  const dir = await makeRepo(
    {
      'README.md': 'see ADR-042 for the decision\n',
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 1);
  assert.match(result.stdout, /claim-missing/);
  assert.match(result.stdout, /README\.md:1/);
  assert.match(result.stdout, /ADR-042/);
});

test('claim-fail-closed: claim-duplicate — two profile ADRs with the same number exits 1', async () => {
  const dir = await makeRepo(
    {
      'docs/adrs/adr-003-a.md': stableAdr({ title: 'A' }),
      'docs/adrs/adr-003-b.md': stableAdr({ title: 'B' }),
      'README.md': 'see ADR-003 for the decision\n',
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 1);
  assert.match(result.stdout, /claim-duplicate/);
  assert.match(result.stdout, /README\.md:1/);
  assert.match(result.stdout, /ADR-003/);
});

test('claim-fail-closed: claim-invalid — an ADR failing the writing profile (missing title) exits 1', async () => {
  const dir = await makeRepo(
    {
      'docs/adrs/adr-004-no-title.md': stableAdr(),
      'README.md': 'see ADR-004 for the decision\n',
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 1);
  assert.match(result.stdout, /claim-invalid/);
  assert.match(result.stdout, /README\.md:1/);
  assert.match(result.stdout, /ADR-004/);
});

test('claim-fail-closed: claim-draft — a draft ADR exits 1', async () => {
  const dir = await makeRepo(
    {
      'docs/adrs/adr-005-draft-decision.md': stableAdr({ title: 'Draft decision', status: 'draft' }),
      'README.md': 'see ADR-005 for the decision\n',
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 1);
  assert.match(result.stdout, /claim-draft/);
  assert.match(result.stdout, /README\.md:1/);
  assert.match(result.stdout, /ADR-005/);
});

test('claim-fail-closed: claim-deprecated — the message names superseded_by', async () => {
  const dir = await makeRepo(
    {
      'docs/adrs/adr-006-old-decision.md': stableAdr({
        title: 'Old decision',
        status: 'deprecated',
        supersededBy: 'adr-007-new-decision',
      }),
      'README.md': 'see ADR-006 for the decision\n',
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 1);
  assert.match(result.stdout, /claim-deprecated/);
  assert.match(result.stdout, /README\.md:1/);
  assert.match(result.stdout, /ADR-006/);
  assert.match(result.stdout, /adr-007-new-decision/);
});

test('claim-fail-closed: claim-slug-mismatch — a slug-form token with the wrong slug exits 1', async () => {
  const dir = await makeRepo(
    {
      'docs/adrs/adr-008-right-slug.md': stableAdr({ title: 'Right slug' }),
      'README.md': 'see adr-008-wrong-slug for the decision\n',
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 1);
  assert.match(result.stdout, /claim-slug-mismatch/);
  assert.match(result.stdout, /README\.md:1/);
  assert.match(result.stdout, /ADR-008/);
});

test('claim-fail-closed: claim-ok — a stable ADR with a bare and a correct slug-form claim exits 0', async () => {
  const dir = await makeRepo(
    {
      'docs/adrs/adr-009-good-decision.md': stableAdr({ title: 'Good decision' }),
      'README.md': 'ADR-009 and adr-009-good-decision are both valid claims\n',
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 0, result.stdout);
  assert.match(result.stdout, /claims: 2 ok, 0 legacy-warn, 0 fail/);
});

// --- self-claim ---

test('self-claim: the package repo\'s own ADR-001 doc and AGENTS.md citation pass validate', async () => {
  const adr001 = await readFile(path.join(repoRoot, 'docs', 'adrs', 'adr-001-claim-path.md'), 'utf8');
  const agentsMd = await readFile(path.join(repoRoot, 'AGENTS.md'), 'utf8');

  const dir = await makeRepo(
    {
      'docs/adrs/adr-001-claim-path.md': adr001,
      'AGENTS.md': agentsMd,
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 0, result.stdout);
  assert.match(result.stdout, /claims: [1-9]\d* ok/);
});

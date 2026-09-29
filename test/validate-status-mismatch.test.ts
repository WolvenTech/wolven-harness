import assert from 'node:assert/strict';
import { test } from 'node:test';
import { makeRepo, run } from './helpers/fixture.js';

function adr(status: 'stable' | 'deprecated', body: string[]): string {
  return [
    '---',
    'type: adr',
    'title: A decision',
    'description: a fixture decision',
    `status: ${status}`,
    ...(status === 'deprecated' ? ['superseded_by: adr-002-successor'] : []),
    '---',
    '',
    '# A decision',
    '',
    ...body,
    '',
  ].join('\n');
}

const SUCCESSOR = adr('stable', ['## Status', '', 'Accepted']);

async function validate(first: string): Promise<{ code: number; out: string }> {
  const dir = await makeRepo(
    { 'docs/adrs/adr-001-a-decision.md': first, 'docs/adrs/adr-002-successor.md': SUCCESSOR },
    { git: true },
  );
  const result = await run(['validate'], { cwd: dir });
  return { code: result.code, out: result.stdout + result.stderr };
}

test('status-mismatch: stable with a Status section saying Superseded warns once with the file and line, exit 0', async () => {
  const result = await validate(adr('stable', ['## Status', '', 'Superseded by the successor']));
  assert.equal(result.code, 0, result.out);
  const hits = result.out.match(/warn \[adr-status-mismatch\] docs\/adrs\/adr-001-a-decision\.md:12:/g);
  assert.equal(hits?.length, 1, result.out);
  assert.match(result.out, /says "Superseded"/);
});

test('status-mismatch: stable with Accepted raises nothing', async () => {
  const result = await validate(adr('stable', ['## Status', '', 'Accepted']));
  assert.equal(result.code, 0, result.out);
  assert.doesNotMatch(result.out, /adr-status-mismatch/);
});

test('status-mismatch: deprecated with Superseded raises nothing', async () => {
  const result = await validate(adr('deprecated', ['## Status', '', 'Superseded by the successor']));
  assert.equal(result.code, 0, result.out);
  assert.doesNotMatch(result.out, /adr-status-mismatch/);
});

test('status-mismatch: no Status section raises nothing', async () => {
  const result = await validate(adr('stable', ['## Context', '', 'Superseded is only a word here.']));
  assert.equal(result.code, 0, result.out);
  assert.doesNotMatch(result.out, /adr-status-mismatch/);
});

test('status-mismatch: the bold Status line form warns', async () => {
  const result = await validate(adr('stable', ['**Status:** Deprecated']));
  assert.equal(result.code, 0, result.out);
  assert.match(result.out, /warn \[adr-status-mismatch\] docs\/adrs\/adr-001-a-decision\.md:10:.*"Deprecated"/);
});

test('status-mismatch: the plain Status line form warns for Rejected and Obsolete, case-insensitively', async () => {
  const rejected = await validate(adr('stable', ['Status: rejected']));
  assert.match(rejected.out, /adr-status-mismatch.*"rejected"/);
  const obsolete = await validate(adr('stable', ['## status', '', 'OBSOLETE since the rewrite']));
  assert.match(obsolete.out, /adr-status-mismatch.*"OBSOLETE"/);
});

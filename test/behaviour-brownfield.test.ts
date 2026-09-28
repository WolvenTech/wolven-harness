import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import path from 'node:path';
import { makeRepo, run } from './helpers/fixture.js';

const execFileAsync = promisify(execFile);

/** Writes `files` into `dir` and stages everything git does not ignore, as a real edit-then-validate cycle would. */
async function edit(dir: string, files: Record<string, string>): Promise<void> {
  for (const [rel, content] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(dir, rel)), { recursive: true });
    await writeFile(path.join(dir, rel), content, 'utf8');
  }
  await execFileAsync('git', ['add', '-A'], { cwd: dir });
}

async function validate(dir: string): Promise<{ code: number; out: string }> {
  const result = await run(['validate'], { cwd: dir });
  return { code: result.code, out: result.stdout + result.stderr };
}

function adr(opts: { status: 'stable' | 'deprecated'; supersededBy?: string; title?: string }): string {
  return [
    '---',
    'type: adr',
    `title: ${opts.title ?? 'A decision'}`,
    'description: a fixture decision',
    `status: ${opts.status}`,
    ...(opts.supersededBy === undefined ? [] : [`superseded_by: ${opts.supersededBy}`]),
    '---',
    '',
    '# A decision',
    '',
  ].join('\n');
}

const SKILL = '---\nname: demo\ndescription: a demo skill\n---\n\n# Demo\n';

test('behaviour: ignored adapter folders fail harness-ignored until re-include rules follow the broad ignore', async () => {
  const dir = await makeRepo(
    { '.gitignore': '.agents/\n.claude/\n', '.agents/skills/demo/SKILL.md': SKILL, '.agents/rules/r.md': '# r\n' },
    { git: true },
  );
  await mkdir(path.join(dir, '.claude'), { recursive: true });
  await execFileAsync('ln', ['-s', '../.agents/skills', path.join(dir, '.claude/skills')]);

  const broken = await validate(dir);
  assert.equal(broken.code, 1);
  assert.match(broken.out, /harness-ignored.*\.agents\/skills/);
  assert.match(broken.out, /harness-ignored.*\.claude\/skills/);

  await edit(dir, {
    '.gitignore': '.agents/*\n!.agents/skills/\n!.agents/rules/\n.claude/*\n!.claude/skills\n',
  });
  const fixed = await validate(dir);
  assert.doesNotMatch(fixed.out, /harness-ignored/);
  assert.equal(fixed.code, 0, fixed.out);
});

test('behaviour: a partly binding superseded ADR is split into a stable successor and references repointed', async () => {
  const files = {
    'docs/adrs/adr-001-storage.md': adr({ status: 'deprecated', supersededBy: 'adr-004-storage-v2' }),
    'docs/adrs/adr-004-storage-v2.md': adr({ status: 'stable' }),
    'docs/adrs/adr-005-retention-window.md': adr({ status: 'stable' }),
    'src/store.ts': '// keeps to ADR-005 for retention\n',
  };
  const dir = await makeRepo(files, { git: true });

  const repointed = await validate(dir);
  assert.equal(repointed.code, 0, repointed.out);

  await edit(dir, { 'src/store.ts': '// keeps to ADR-001 for retention\n' });
  const stale = await validate(dir);
  assert.equal(stale.code, 1);
  assert.match(stale.out, /claim-deprecated.*src\/store\.ts:1/);
  assert.match(stale.out, /superseded_by: adr-004-storage-v2/);
});

test('behaviour: a test file pinning a deprecated ADR token fails claim-deprecated until repointed to the successor', async () => {
  const dir = await makeRepo(
    {
      'docs/adrs/adr-001-storage.md': adr({ status: 'deprecated', supersededBy: 'adr-004-storage-v2' }),
      'docs/adrs/adr-004-storage-v2.md': adr({ status: 'stable' }),
      'tests/contracts/storage.test.ts': "it('follows ADR-001', () => {});\n",
    },
    { git: true },
  );

  const pinned = await validate(dir);
  assert.equal(pinned.code, 1);
  assert.match(pinned.out, /claim-deprecated.*tests\/contracts\/storage\.test\.ts:1/);

  await edit(dir, { 'tests/contracts/storage.test.ts': "it('follows ADR-004', () => {});\n" });
  const repointed = await validate(dir);
  assert.equal(repointed.code, 0, repointed.out);
});

test('behaviour: a superseded ADR is resolved by a recorded successor, and a missing successor file is a profile error', async () => {
  const missing = await makeRepo(
    { 'docs/adrs/adr-002-queue.md': adr({ status: 'deprecated', supersededBy: 'adr-006-queue-v2' }) },
    { git: true },
  );
  const broken = await validate(missing);
  assert.equal(broken.code, 1);
  assert.match(broken.out, /profile-superseded-by.*adr-002-queue\.md/);
  assert.match(broken.out, /does not resolve to an existing ADR/);

  await edit(missing, { 'docs/adrs/adr-006-queue-v2.md': adr({ status: 'stable' }) });
  const resolved = await validate(missing);
  assert.equal(resolved.code, 0, resolved.out);
});

test('behaviour: a legacy index file left beside migrated ADRs is invisible to validate until it cites a deprecated ADR', async () => {
  const migrated = {
    'docs/adrs/adr-001-storage.md': adr({ status: 'deprecated', supersededBy: 'adr-004-storage-v2' }),
    'docs/adrs/adr-004-storage-v2.md': adr({ status: 'stable' }),
  };

  const plainIndex = await makeRepo({ ...migrated, 'adrs/README.md': '# Decisions\n\nSee the decision records.\n' }, { git: true });
  const quiet = await validate(plainIndex);
  assert.equal(quiet.code, 0, quiet.out);
  assert.doesNotMatch(quiet.out, /legacy-adr|adr-unrecognized/);

  const citingIndex = await makeRepo({ ...migrated, 'adrs/README.md': '# Decisions\n\n- ADR-001 storage\n' }, { git: true });
  const stale = await validate(citingIndex);
  assert.equal(stale.code, 1);
  assert.match(stale.out, /claim-deprecated.*adrs\/README\.md:3/);

  await rm(path.join(citingIndex, 'adrs/README.md'));
  await execFileAsync('git', ['add', '-A'], { cwd: citingIndex });
  const clean = await validate(citingIndex);
  assert.equal(clean.code, 0, clean.out);
});

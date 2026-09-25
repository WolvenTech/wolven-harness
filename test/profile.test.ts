import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeRepo, run } from './helpers/fixture.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const writingProfilePath = path.join(repoRoot, 'templates', 'docs', 'WRITING-PROFILE.md');
const seededAdrPath = path.join(repoRoot, 'templates', 'docs', 'adrs', 'adr-000-record-architecture-decisions.md');

test('profile-rules: profile-frontmatter — missing block exits 1 naming the rule', async () => {
  const dir = await makeRepo(
    {
      'docs/notes/no-frontmatter.md': '# No frontmatter\n\nJust body text.\n',
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 1);
  assert.match(result.stdout, /profile-frontmatter/);
});

test('profile-rules: profile-status — invalid status value exits 1 naming the rule', async () => {
  const dir = await makeRepo(
    {
      'docs/notes/bad-status.md': [
        '---',
        'type: note',
        'title: Bad status',
        'description: status not in enum',
        'status: active',
        '---',
        '',
        '# Bad status',
        '',
      ].join('\n'),
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 1);
  assert.match(result.stdout, /profile-status/);
});

const TYPE_DIR_CASES: { dir: string; wrongType: string }[] = [
  { dir: 'adrs', wrongType: 'note' },
  { dir: 'specs', wrongType: 'adr' },
  { dir: 'notes', wrongType: 'spec' },
  { dir: 'deferrals', wrongType: 'note' },
];

for (const { dir, wrongType } of TYPE_DIR_CASES) {
  test(`profile-rules: profile-type-dir — docs/${dir} with mismatched type exits 1 naming the rule`, async () => {
    const fileName = dir === 'adrs' ? 'adr-001-wrong-type.md' : 'wrong-type.md';
    const files: Record<string, string> = {
      [`docs/${dir}/${fileName}`]: [
        '---',
        `type: ${wrongType}`,
        'title: Wrong type',
        'description: type does not match its directory',
        'status: stable',
        '---',
        '',
        '# Wrong type',
        '',
      ].join('\n'),
    };

    const repoDir = await makeRepo(files, { git: true });
    const result = await run(['validate'], { cwd: repoDir });

    assert.equal(result.code, 1);
    assert.match(result.stdout, /profile-type-dir/);
  });
}

test('profile-rules: profile-filename — non-kebab filename exits 1 naming the rule', async () => {
  const dir = await makeRepo(
    {
      'docs/notes/Bad_Name.md': [
        '---',
        'type: note',
        'title: Bad filename',
        'description: filename is not kebab ascii',
        'status: stable',
        '---',
        '',
        '# Bad filename',
        '',
      ].join('\n'),
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 1);
  assert.match(result.stdout, /profile-filename/);
});

test('profile-rules: profile-adr-name — ADR filename not matching adr-NNN-<slug> exits 1 naming the rule', async () => {
  const dir = await makeRepo(
    {
      'docs/adrs/decision-one.md': [
        '---',
        'type: adr',
        'title: Decision one',
        'description: adr filename does not match the required shape',
        'status: stable',
        '---',
        '',
        '# Decision one',
        '',
      ].join('\n'),
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 1);
  assert.match(result.stdout, /profile-adr-name/);
});

test('profile-rules: profile-superseded-by — deprecated ADR without superseded_by exits 1 naming the rule', async () => {
  const dir = await makeRepo(
    {
      'docs/adrs/adr-002-deprecated-no-successor.md': [
        '---',
        'type: adr',
        'title: Deprecated without successor',
        'description: deprecated adr missing superseded_by',
        'status: deprecated',
        '---',
        '',
        '# Deprecated without successor',
        '',
      ].join('\n'),
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 1);
  assert.match(result.stdout, /profile-superseded-by/);
});

test('profile-rules: clean fixture with all four dirs plus a deprecated/successor ADR pair exits 0', async () => {
  const dir = await makeRepo(
    {
      'docs/adrs/adr-001-old-decision.md': [
        '---',
        'type: adr',
        'title: Old decision',
        'description: superseded by a newer decision',
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
      'docs/specs/example-spec.md': [
        '---',
        'type: spec',
        'title: Example spec',
        'description: a valid spec',
        'status: stable',
        '---',
        '',
        '# Example spec',
        '',
      ].join('\n'),
      'docs/notes/example-note.md': [
        '---',
        'type: note',
        'title: Example note',
        'description: a valid note',
        'status: draft',
        '---',
        '',
        '# Example note',
        '',
      ].join('\n'),
      'docs/deferrals/example-deferral.md': [
        '---',
        'type: deferral',
        'title: Example deferral',
        'description: a valid deferral',
        'status: draft',
        '---',
        '',
        '# Example deferral',
        '',
      ].join('\n'),
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 0, result.stdout);
});

test('profile-rules: the seeded template ADR produces no findings', async () => {
  const seeded = await readFile(seededAdrPath, 'utf8');
  const dir = await makeRepo(
    {
      'docs/adrs/adr-000-record-architecture-decisions.md': seeded,
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 0, result.stdout);
});

test('profile-rules: nested paths and non-md files under the profile dirs are out of scope', async () => {
  const dir = await makeRepo(
    {
      'README.md': '# hi\n',
      'docs/specs/archived/Bad_Name.md': '# not checked, nested\n',
      'docs/adrs/.gitkeep': '',
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 0, result.stdout);
});

test('profile-rules: an "ignore" entry for an unrelated dir still checks docs/ normally', async () => {
  const dir = await makeRepo(
    {
      '.wolven-harness.json': JSON.stringify(
        { version: 1, gitHost: 'gh', runtimes: ['codex'], ignore: ['vendor/**'] },
        null,
        2,
      ),
      'vendor/thing.txt': 'vendored\n',
      'docs/notes/no-frontmatter.md': '# still checked\n',
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 1);
  assert.match(result.stdout, /profile-frontmatter/);
});

test('profile-doc: templates/docs/WRITING-PROFILE.md is at most 80 lines', async () => {
  const content = await readFile(writingProfilePath, 'utf8');
  const lineCount = content.split('\n').length;

  assert.ok(lineCount <= 80, `expected <= 80 lines, got ${lineCount}`);
});

test('profile-doc: templates/docs/WRITING-PROFILE.md mentions every implemented rule term', async () => {
  const content = await readFile(writingProfilePath, 'utf8');

  const requiredTerms = [
    'type',
    'title',
    'description',
    'status',
    'draft',
    'stable',
    'deprecated',
    'superseded_by',
    'adr-NNN-',
    'adrs',
    'specs',
    'notes',
    'deferrals',
  ];

  for (const term of requiredTerms) {
    assert.ok(content.includes(term), `expected WRITING-PROFILE.md to mention "${term}"`);
  }
});

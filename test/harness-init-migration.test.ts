import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readSkill } from './helpers/skill-contract.js';
import { makeRepo, run } from './helpers/fixture.js';

const REF = 'references/adr-migration.md';

async function readReference(): Promise<string> {
  const skill = await readSkill('harness-init');
  return skill.read(REF);
}

// why: prose in the reference wraps across lines, so a phrase spanning
// several words is matched against whitespace-collapsed text instead of
// the raw body, which would otherwise break on an arbitrary line wrap.
function flatten(text: string): string {
  return text.replace(/\s+/g, ' ');
}

/**
 * Extracts `path`/fenced-block pairs from a section of the reference doc.
 * The reference marks each worked-example file with a line holding just
 * `` `path`: `` immediately above a fenced block with no language tag —
 * parsed here, never duplicated as literal content in this test.
 */
function parseFiles(section: string): Record<string, string> {
  const re = /`([^`\n]+)`:\n\n```\n([\s\S]*?)```/g;
  const files: Record<string, string> = {};
  let match: RegExpExecArray | null;
  while ((match = re.exec(section))) {
    files[match[1]] = match[2];
  }
  return files;
}

/**
 * The shipped reference stands its two example ADR numbers in as `<A>` /
 * `<B>` — literal digits would themselves read as an unresolved claim once
 * this file is copied into a consumer repo's own tree (see
 * `src/validate/claims.ts`, which scans every tracked file, this one
 * included). Substituting concrete three-digit numbers is this test's job,
 * not the shipped file's.
 */
function substitutePlaceholders(files: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [path, content] of Object.entries(files)) {
    const realPath = path.split('<A>').join('012').split('<B>').join('013');
    const realContent = content.split('<A>').join('012').split('<B>').join('013');
    out[realPath] = realContent;
  }
  return out;
}

async function loadExampleFixtures(): Promise<{ before: Record<string, string>; after: Record<string, string> }> {
  const raw = await readReference();
  const afterSplit = raw.split(/^### Before$/m)[1];
  assert.ok(afterSplit, 'reference is missing a "### Before" section');
  const [beforeSection, afterSection] = afterSplit.split(/^### After$/m);
  assert.ok(afterSection, 'reference is missing a "### After" section');

  // why: parseFiles only matches complete `path`+fence pairs, so trailing
  // prose after the last fenced block (the closing paragraph, "##
  // Anti-patterns") is naturally ignored without needing to be sliced off.
  const before = parseFiles(beforeSection);
  const after = parseFiles(afterSection);
  assert.ok(Object.keys(before).length > 0, 'no files parsed out of the "### Before" section');
  assert.ok(Object.keys(after).length > 0, 'no files parsed out of the "### After" section');
  return { before: substitutePlaceholders(before), after: substitutePlaceholders(after) };
}

test('migrate-rules: keeps the legacy number so claims keep resolving', async () => {
  const flat = flatten(await readReference());
  assert.match(flat, /keep the legacy number/i);
  assert.match(flat, /every claim already pointing at that number keeps resolving/i);
});

test('migrate-rules: stops on a collision with an existing profile ADR, including adr-000', async () => {
  const flat = flatten(await readReference());
  assert.match(flat, /stop on a collision/i);
  assert.match(flat, /`adr-000`/);
  assert.match(flat, /stop and ask the human/i);
});

test('migrate-rules: git mv into docs/adrs/adr-NNN-<slug>.md with a title-derived slug', async () => {
  const flat = flatten(await readReference());
  assert.match(flat, /`git mv`/);
  assert.match(flat, /docs\/adrs\/adr-NNN-<slug>\.md/);
  assert.match(flat, /derive.*<slug>.*from the adr's title/i);
});

test('migrate-rules: prepends frontmatter (type, title, description, mapped status) and keeps the body verbatim', async () => {
  const flat = flatten(await readReference());
  assert.match(flat, /prepend.*frontmatter/i);
  assert.match(flat, /`type: adr`/);
  assert.match(flat, /`title`/);
  assert.match(flat, /one-sentence\s*`description`/);
  assert.match(flat, /`status`.*mapped from the legacy status/i);
  assert.match(flat, /body below the frontmatter.*is not rewritten/i);
});

test('migrate-rules: the status mapping table carries Accepted, Proposed, Superseded by, and an ask-the-human row', async () => {
  const raw = await readReference();
  const table = raw.split('### Status mapping')[1]?.split('## Closure')[0] ?? '';
  const flat = flatten(table);

  assert.match(flat, /\|\s*`Accepted`\s*\|\s*`stable`\s*\|/);
  assert.match(flat, /\|\s*`Proposed`\s*\|\s*`draft`\s*\|/);
  assert.match(flat, /\|\s*`Superseded by <ADR>`\s*\|\s*`deprecated`\s*\|/);
  assert.match(flat, /anything else.*ask the human.*\|/i);
  assert.match(flat, /offer only the options that would pass `harness:validate`/i);
  assert.match(flat, /never guesses a status mapping/i);
});

test('migrate-rules: a superseded ADR that still partly applies is asked about, never deprecated directly', async () => {
  const raw = await readReference();
  const table = flatten(raw.split('### Status mapping')[1]?.split('### Before writing')[0] ?? '');

  assert.match(table, /`deprecated`\s*\|\s*only when nothing in the ADR or an index of the legacy folder says part of it still applies/i);
  assert.match(table, /\|\s*superseded, but the ADR or an index says part of it still applies\s*\|\s*ask the human\s*\|/i);
  assert.match(table, /split the part that still binds into a new ADR through `adr`, then deprecate this one/i);
  assert.match(table, /keep this one `stable`.*with that decision recorded in the session note/i);
});

test('migrate-rules: tokens are searched, tests included, before a status other than stable is written', async () => {
  const flat = flatten(await readReference());

  assert.match(flat, /### Before writing a status other than `stable`/);
  assert.match(flat, /search the whole repo, tests included, for the ADR's tokens/i);
  assert.match(flat, /marking the ones a test or fixture asserts/i);
  assert.match(flat, /never as a reason to pick a different status/i);
});

test('migrate-closure: each claim to a touched ADR is read against its title, mismatches asked one at a time', async () => {
  const flat = flatten(await readReference());

  assert.match(flat, /check what each claim means/i);
  assert.match(flat, /for every claim to an ADR this migration touched, read the line making the claim next to that ADR's title/i);
  assert.match(flat, /take each mismatch to the human, one at a time: repoint it, reword it, or leave it as is/i);
});

test('migrate-closure: recomputes every relative link into and out of a moved file', async () => {
  const flat = flatten(await readReference());
  assert.match(flat, /recompute every relative link/i);
  assert.match(flat, /both changed depth/i);
});

test('migrate-closure: never moves a non-ADR legacy-folder file into docs/adrs — the human chooses delete or rewrite', async () => {
  const flat = flatten(await readReference());
  assert.match(flat, /never move a non-adr file into `docs\/adrs\/`/i);
  assert.match(flat, /ask the human to choose: delete it, or keep it where it is with its links rewritten/i);
});

test('migrate-closure: the claim loop repoints, rewords, or records a new decision through adr, with the human', async () => {
  const flat = flatten(await readReference());
  assert.match(flat, /work the claim loop/i);
  assert.match(flat, /repoint the claim.*reword the sentence.*record a new decision through `adr`/i);
  assert.match(flat, /claim that starts failing after migration is expected input to work through, not a defect/i);
});

test('migrate-closure: done only when harness:validate exits 0 with 0 legacy-warn', async () => {
  const flat = flatten(await readReference());
  assert.match(flat, /the step is done only when `harness:validate` exits 0\s*with `0 legacy-warn`/i);
});

test('migrate-closure: points at the repo\'s own test and lint commands for links inside source files', async () => {
  const flat = flatten(await readReference());
  assert.match(flat, /point at the repo's own checks/i);
  assert.match(flat, /point the human at the repo's own test and lint commands/i);
});

test('migrate-closure: the human reviews the whole diff before the migration commit offer', async () => {
  const flat = flatten(await readReference());
  assert.match(flat, /the human reviews the whole diff/i);
  assert.match(flat, /before the migration commit is offered/i);
});

test('migrate-example: the before fixture warns legacy-adr for both ADRs and reports the example\'s own legacy-warn count', async () => {
  const { before } = await loadExampleFixtures();
  const dir = await makeRepo(before, { git: true });
  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 0, result.stdout);
  assert.match(result.stdout, /legacy-adr.*legacy ADR-012/);
  assert.match(result.stdout, /legacy-adr.*legacy ADR-013/);

  const match = result.stdout.match(/claims: \d+ ok, (\d+) legacy-warn, \d+ fail/);
  assert.ok(match, result.stdout);
  const legacyWarnCount = Number(match[1]);
  assert.ok(legacyWarnCount > 0, `expected a nonzero legacy-warn count, got ${legacyWarnCount}`);
  // why: the reference's README cites the superseded ADR once, both by
  // its bare token and by the legacy filename beside it, so 2 is exactly
  // what this example produces.
  assert.equal(legacyWarnCount, 2, `expected the example to produce 2 legacy-warn claims, got ${legacyWarnCount}`);
});

test('migrate-example: the after fixture exits 0 with 0 legacy-warn, the citation resolves ok, and the deprecated ADR is error-free', async () => {
  const { after } = await loadExampleFixtures();
  const dir = await makeRepo(after, { git: true });
  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 0, result.stdout);
  assert.match(result.stdout, /claims: \d+ ok, 0 legacy-warn, 0 fail/);
  assert.doesNotMatch(result.stdout, /legacy-adr/);
  assert.doesNotMatch(result.stdout, /superseded-by/);
  assert.doesNotMatch(result.stdout, /profile-superseded-by/);

  const match = result.stdout.match(/claims: (\d+) ok, 0 legacy-warn, 0 fail/);
  assert.ok(match, result.stdout);
  assert.ok(Number(match[1]) > 0, 'expected at least one ok claim against the stable ADR');
});

test('migrate-example: the after fixture\'s ADRs carry the mapped statuses and superseded_by', async () => {
  const { after } = await loadExampleFixtures();
  const deprecated = after['docs/adrs/adr-012-cache-with-memcached.md'];
  const stable = after['docs/adrs/adr-013-cache-with-redis.md'];

  assert.match(deprecated, /status: deprecated/);
  assert.match(deprecated, /superseded_by: adr-013-cache-with-redis/);
  assert.match(stable, /status: stable/);
  assert.doesNotMatch(stable, /superseded_by/);
});

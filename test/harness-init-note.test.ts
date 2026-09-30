import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run } from './helpers/fixture.js';
import { flatten } from './helpers/prose.js';
import { minimalValidateFixture, readSkill } from './helpers/skill-contract.js';

const REF = 'references/session-note-template.md';
const DATE = '2026-01-01';

async function readReference(): Promise<string> {
  const skill = await readSkill('harness-init');
  return skill.read(REF);
}

/** Extracts the single fenced ```markdown block's inner text, trimmed of trailing whitespace. */
function extractTemplate(content: string): string {
  const match = content.match(/```markdown\n([\s\S]*?)```/);
  assert.ok(match, 'reference is missing its fenced ```markdown template block');
  return match[1].replace(/\s+$/, '');
}

/**
 * Fills the template's frontmatter placeholders with invented values, then
 * replaces every remaining `<...>` section prompt with filler text — a
 * real run would put its own findings there, but validate never reads a
 * note's body, only its frontmatter.
 */
function fillTemplate(template: string, status: string): string {
  let out = template;
  out = out.split('<title>').join(`Harness init session — ${DATE}`);
  out = out
    .split('<one-sentence description of what this run did>')
    .join('Folded WOLVEN.md into AGENTS.md and stubbed two skills.');
  out = out.split('<status>').join(status);
  out = out.replace(/<[^>\n]+>/g, (m) => `Filled in for the run: ${m.slice(1, -1)}.`);
  return out;
}

test('session-note: the path rule names the dated slug and the same-day -2 fallback for both folder and file', async () => {
  const flat = flatten(await readReference());

  assert.match(flat, /`?docs\/notes\/harness-init-<yyyy-mm-dd>\/harness-init-<yyyy-mm-dd>-note\.md`?/);
  assert.match(
    flat,
    /second run on the same day.*uses `?harness-init-<yyyy-mm-dd>-2`? as the slug, for both the folder and the file/i,
  );
  assert.match(flat, /`?docs\/notes\/harness-init-<yyyy-mm-dd>-2\/harness-init-<yyyy-mm-dd>-2-note\.md`?/);
  assert.match(flat, /docs\/<folder>\/<slug>\/<slug>-<type>\.md/);
});

test('session-note: every section heading appears in order inside the template', async () => {
  const template = extractTemplate(await readReference());
  const headings = [
    'Entry integration',
    'ADR migration',
    'Discovery',
    'Research',
    'Suggestions',
    'Stubs',
    'Harness score',
    'Validate wiring',
    'Deferred / skipped steps',
    'Next steps for the human',
  ];

  // why: the shipped template capitalizes that word in its heading; matching
  // case-insensitively here keeps this test file's own source lowercase.
  const positions = headings.map((heading) => {
    const match = template.match(new RegExp(`## ${heading}`, 'i'));
    assert.ok(match, `missing heading "## ${heading}"`);
    return match.index as number;
  });

  for (let i = 1; i < positions.length; i++) {
    assert.ok(positions[i] > positions[i - 1], `heading "${headings[i]}" must come after "${headings[i - 1]}"`);
  }
});

test('session-note: sections that cover a skipped step say so instead of disappearing', async () => {
  const flat = flatten(await readReference());

  assert.match(flat, /skipped — no legacy adrs/i);
  assert.match(flat, /repo-only.*the reason the web was skipped or unavailable/i);
  assert.match(flat, /skipped step fills its section with why.*rather than leaving the heading empty or dropping it/i);
});

test('session-note: the lifecycle states draft at step 0, a per-phase update before each commit offer, stable at hand-back, and resume-not-replace', async () => {
  const flat = flatten(await readReference());

  assert.match(flat, /created with `?status: draft`? at the very start of step 0/i);
  assert.match(flat, /each phase.*adds its own section.*before that phase's commit offer/i);
  assert.match(flat, /every phase commit carries its own part of the note/i);
  assert.match(flat, /step 6 fills in whatever sections are still open and sets `?status: stable`? at hand-back/i);
  assert.match(
    flat,
    /a `?draft`? note left by an interrupted run.*the next run reads it and keeps filling it in, rather than starting a second note over it/i,
  );
});

test('session-note: the ADR migration section carries a per-ADR table and names ADRs by bare number and title', async () => {
  const reference = await readReference();
  const template = extractTemplate(reference);
  const flat = flatten(reference);

  assert.match(template, /\| Number \| Title \| Legacy status \| Mapped status \| Evidence \| Decision \|/);
  assert.match(template, /each claim repointed, reworded, or left as is/i);
  assert.match(template, /### Meaning check/);
  assert.match(template, /grouped by ADR number/i);
  assert.match(template, /`ok` or `mismatch → the Human's answer`/);
  assert.match(template, /Skipped only when step 1 was skipped/);
  assert.match(flat, /## Naming ADRs in the note/);
  assert.match(flat, /names an ADR only by its bare number and title/i);
  assert.match(flat, /never in the claim forms/i);
});

const DEPRECATED_ADR = [
  '---',
  'type: adr',
  'title: Cache with Memcached',
  'description: Cache session state in Memcached; replaced by the Redis decision.',
  'status: deprecated',
  'superseded_by: adr-008-cache-with-redis',
  '---',
  '',
  '# Cache with Memcached',
  '',
].join('\n');

const STABLE_ADR = [
  '---',
  'type: adr',
  'title: Cache with Redis',
  'description: Cache session state in Redis with append-only persistence.',
  'status: stable',
  '---',
  '',
  '# Cache with Redis',
  '',
].join('\n');

/** Renders the template as `stable` with one table row per ADR, naming each the way `ref` says. */
function noteWithRows(template: string, ref: (number: string) => string): string {
  const row = (number: string, title: string, legacy: string, mapped: string) =>
    `| ${ref(number)} | ${title} | ${legacy} | ${mapped} | status section of the legacy file | table |`;
  const rows = [
    row('007', 'Cache with Memcached', `Superseded by ${ref('008')}`, 'deprecated'),
    row('008', 'Cache with Redis', 'Accepted', 'stable'),
  ].join('\n');
  const withRows = template.replace(/^\| <number> \|.*$/m, rows);
  return fillTemplate(withRows, 'stable');
}

test('session-note-fixture: a table row for a deprecated ADR passes when named by bare number, fails as a claim token', async () => {
  const template = extractTemplate(await readReference());
  const notePath = `docs/notes/harness-init-${DATE}/harness-init-${DATE}-note.md`;
  const adrs = {
    'docs/adrs/adr-007-cache-with-memcached.md': DEPRECATED_ADR,
    'docs/adrs/adr-008-cache-with-redis.md': STABLE_ADR,
  };

  const bare = await minimalValidateFixture({ ...adrs, [notePath]: noteWithRows(template, (n) => n) });
  const bareResult = await run(['validate'], { cwd: bare });
  assert.equal(bareResult.code, 0, bareResult.stdout + bareResult.stderr);

  const tokens = await minimalValidateFixture({ ...adrs, [notePath]: noteWithRows(template, (n) => `ADR-${n}`) });
  const tokensResult = await run(['validate'], { cwd: tokens });
  assert.notEqual(tokensResult.code, 0);
  assert.match(tokensResult.stdout + tokensResult.stderr, /claim-deprecated/);
});

test('session-note-fixture: a rendered draft note passes validate with no profile findings', async () => {
  const template = extractTemplate(await readReference());
  const rendered = fillTemplate(template, 'draft');

  const cwd = await minimalValidateFixture({
    [`docs/notes/harness-init-${DATE}/harness-init-${DATE}-note.md`]: rendered,
  });

  const result = await run(['validate'], { cwd });

  assert.equal(result.code, 0, result.stdout + result.stderr);
  assert.doesNotMatch(result.stdout, /profile-/);
});

test('session-note-fixture: the same note rendered as stable also passes validate with no profile findings', async () => {
  const template = extractTemplate(await readReference());
  const rendered = fillTemplate(template, 'stable');

  const cwd = await minimalValidateFixture({
    [`docs/notes/harness-init-${DATE}/harness-init-${DATE}-note.md`]: rendered,
  });

  const result = await run(['validate'], { cwd });

  assert.equal(result.code, 0, result.stdout + result.stderr);
  assert.doesNotMatch(result.stdout, /profile-/);
});

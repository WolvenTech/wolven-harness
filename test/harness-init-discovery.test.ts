import assert from 'node:assert/strict';
import { test } from 'node:test';
import { flatten } from './helpers/prose.js';
import { readSkill } from './helpers/skill-contract.js';

const REF = 'references/discovery.md';

async function readDiscovery(): Promise<string> {
  const skill = await readSkill('harness-init');
  return skill.read(REF);
}

function sections(body: string): { discovery: string; research: string; suggestions: string } {
  const afterTitle = body.split(/^## Discovery$/m)[1] ?? '';
  const [discovery, rest1] = afterTitle.split(/^## Research$/m);
  const [research, rest2] = (rest1 ?? '').split(/^## Suggestions$/m);
  return { discovery: discovery ?? '', research: research ?? '', suggestions: rest2 ?? '' };
}

test('discovery: the three sections each sit under their own heading, in order', async () => {
  const body = await readDiscovery();

  const positions = ['## Discovery', '## Research', '## Suggestions'].map((heading) => {
    const index = body.indexOf(heading);
    assert.ok(index >= 0, `missing heading "${heading}"`);
    return index;
  });

  for (let i = 1; i < positions.length; i++) {
    assert.ok(positions[i] > positions[i - 1], 'headings are out of order');
  }
});

test('discovery: reads every named source before asking anything', async () => {
  const { discovery } = sections(await readDiscovery());
  const flat = flatten(discovery);

  for (const source of [
    'manifests',
    'lockfiles',
    '`README`',
    '`AGENTS\\.md`',
    'CI config',
    '`docs/adrs/`',
    'installed skills',
    '`\\.agents/skills/`',
    'top-level layout',
  ]) {
    assert.match(flat, new RegExp(source, 'i'), `discovery section is missing source "${source}"`);
  }
});

test('discovery: carries the adopted local-search-index prompt verbatim', async () => {
  const { discovery } = sections(await readDiscovery());
  const flat = flatten(discovery.replace(/^>\s?/gm, ''));

  assert.match(
    flat,
    /Before reading files by hand, check whether the repository already has a local search index over its own documentation \(for example, a QMD collection\)\. If one exists, query it for relevant documentation and architecture notes before reading further, and note the indexing tool itself as a decided tool\. If none exists, skip this step and read the repository directly\./,
  );
});

test('discovery: asks only two things, one at a time — lifecycle stage and decisions not visible in code', async () => {
  const { discovery } = sections(await readDiscovery());
  const flat = flatten(discovery);

  assert.match(flat, /only two things in this step go to the human/i);
  assert.match(flat, /one question at a time/i);
  assert.match(flat, /lifecycle stage.*prototype, MVP, production, or maintenance/i);
  assert.match(flat, /decisions not yet visible in code/i);
});

test('discovery: produces three output lists, each under its own heading — context, lifecycle, decided tools', async () => {
  const { discovery } = sections(await readDiscovery());
  const flat = flatten(discovery);

  assert.match(discovery, /^### Context$/m);
  assert.match(discovery, /^### Lifecycle$/m);
  assert.match(discovery, /^### Decided tools$/m);
  assert.match(flat, /a tool counts as decided when the repo shows it in use, or the human names it/i);
  assert.match(flat, /never because it merely seems a fit/i);
});

test('research-cap: searches the repo and qmd before any web fetch', async () => {
  const { research } = sections(await readDiscovery());
  const flat = flatten(research);

  assert.match(flat, /search the repo and `qmd` first/i);
});

test("research-cap: the web only runs on the human's ok", async () => {
  const { research } = sections(await readDiscovery());
  const flat = flatten(research);

  assert.match(flat, /web research is optional.*runs only once the human says yes/i);
});

test('research-cap: capped at five primary-source fetches', async () => {
  const { research } = sections(await readDiscovery());
  const flat = flatten(research);

  assert.match(flat, /capped at five\s+primary-source\s+fetches/i);
});

test('research-cap: covers decided tools only, never a tool that only seems like a fit', async () => {
  const { research } = sections(await readDiscovery());
  const flat = flatten(research);

  assert.match(flat, /looks up decided tools only/i);
  assert.match(flat, /never a tool that only seems like a fit/i);
});

test('research-cap: every kept finding is cited in the session note', async () => {
  const { research } = sections(await readDiscovery());
  const flat = flatten(research);

  assert.match(flat, /every finding this step keeps gets cited in the session note/i);
});

test('research-cap: offers the research skill for depth on one tool', async () => {
  const { research } = sections(await readDiscovery());
  const flat = flatten(research);

  assert.match(flat, /offer `research` instead of widening this step's own web budget/i);
});

test('research-cap: an unavailable or declined web pass falls back to repo-only, recorded in the note', async () => {
  const { research } = sections(await readDiscovery());
  const flat = flatten(research);

  assert.match(
    flat,
    /if the web is unavailable, or the human declines it, this step continues repo-only and says so in the note/i,
  );
});

test('suggest: two to four skills, each named for a decided tool or field and citing its evidence', async () => {
  const { suggestions } = sections(await readDiscovery());
  const flat = flatten(suggestions);

  assert.match(flat, /suggest two to four architectural skills/i);
  assert.match(flat, /is named for a decided tool or field/i);
  assert.match(flat, /cites the discovery.*evidence that grounds it/i);
});

test('suggest: never duplicates an installed skill', async () => {
  const { suggestions } = sections(await readDiscovery());
  const flat = flatten(suggestions);

  assert.match(flat, /never duplicates a skill already installed under `\.agents\/skills\/`/i);
});

test('suggest: fewer than two supported by evidence is stated, never padded', async () => {
  const { suggestions } = sections(await readDiscovery());
  const flat = flatten(suggestions);

  assert.match(flat, /when the evidence only supports fewer than two, say so rather than padding/i);
});

test('suggest: the human picks any subset, including none, with no catalogue to pick from', async () => {
  const { suggestions } = sections(await readDiscovery());
  const flat = flatten(suggestions);

  assert.match(flat, /the human picks any subset of what's suggested, including none of it/i);
  assert.match(flat, /there is no catalogue to pick from instead/i);
});

test('suggest: a worked example names an invented tool and an invented repo', async () => {
  const { suggestions } = sections(await readDiscovery());
  const flat = flatten(suggestions);

  assert.match(flat, /fictional repo, `Petalworks`/i);
  assert.match(flat, /queueing library called\s*\n?\s*`Quinly`/i);
  assert.match(flat, /suggests a `quinly-patterns` skill/i);
});

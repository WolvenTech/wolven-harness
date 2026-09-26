import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readSkill } from './helpers/skill-contract.js';
import { makeRepo, run } from './helpers/fixture.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');

const MARKDOWN_FENCE_RE = /```markdown\n([\s\S]*?)```/g;
const RULE_CITATION_RE = /\.agents\/rules\/[A-Za-z0-9._-]+\.md/g;

// why: prose in the reference wraps across lines, so a phrase spanning
// several words is matched against whitespace-collapsed text instead of
// the raw body, which would otherwise break on an arbitrary line wrap.
function flatten(text: string): string {
  return text.replace(/\s+/g, ' ');
}

async function readEntryModes(): Promise<string> {
  const skill = await readSkill('harness-init');
  return skill.read('references/entry-modes.md');
}

/** Extracts every fenced ```markdown block's inner text, trimmed of trailing whitespace, in document order. */
function extractFencedBlocks(content: string): string[] {
  return [...content.matchAll(MARKDOWN_FENCE_RE)].map((m) => m[1].replace(/\s+$/, ''));
}

/** Reads every `.agents/rules/<name>.md` path cited in `block` from this package's templates dir, keyed by that same relative path. */
async function collectCitedRules(block: string): Promise<Record<string, string>> {
  const cited = [...new Set(block.match(RULE_CITATION_RE) ?? [])];
  const files: Record<string, string> = {};
  for (const rel of cited) {
    files[rel] = await readFile(path.join(repoRoot, 'templates', rel), 'utf8');
  }
  return files;
}

test('step0-modes: the three modes each sit under their own heading, in order', async () => {
  const body = await readEntryModes();

  const positions = ['## Full', '## Light', '## Mention-only'].map((heading) => {
    const index = body.indexOf(heading);
    assert.ok(index >= 0, `missing heading "${heading}"`);
    return index;
  });

  for (let i = 1; i < positions.length; i++) {
    assert.ok(positions[i] > positions[i - 1], 'headings are out of order');
  }
});

test('step0-modes: full and light write the WOLVEN.md fold and describe the no-AGENTS.md case', async () => {
  const flat = flatten(await readEntryModes());

  assert.match(flat, /without its first line, goes into `?AGENTS\.md`? as a\s*\n?\s*new `?##? ?Wolven harness`? section/i);
  assert.match(flat, /no `?AGENTS\.md`? yet, `?WOLVEN\.md`? \(without its first line\) becomes `?AGENTS\.md`? outright/i);
  assert.match(flat, /short `?##? ?Wolven harness`? block/i);
  assert.match(flat, /carries no router table and no skills table/i);
});

test('step0-modes: the deletion rule keeps WOLVEN.md only in mention-only, minus its first line', async () => {
  const flat = flatten(await readEntryModes());

  assert.match(flat, /deleted in full and light/i);
  assert.match(flat, /kept, minus its first line, in mention-only/i);
});

test('step0-modes: the recommendation rule names both signals and leaves the pick to the human', async () => {
  const flat = flatten(await readEntryModes());

  assert.match(flat, /no `?AGENTS\.md`?, or a short one.*recommend full/i);
  assert.match(flat, /long, curated `?AGENTS\.md`?.*recommend light/i);
  assert.match(flat, /the human always picks/i);
});

test('step0-modes: the four before-writing checks are all present', async () => {
  const flat = flatten(await readEntryModes());

  assert.match(flat, /never removed or rewritten without the human's OK/i);
  assert.match(flat, /overlaps.*(?:questions|question).*one at a time/i);
  assert.match(flat, /`?CLAUDE\.md`? .*does not import `?AGENTS\.md`?.*offers to add an `?@AGENTS\.md`? line/i);
  assert.match(flat, /`?git check-ignore`?/i);
  assert.match(flat, /`?\.gitignore`? line/i);
  assert.match(flat, /the human decides/i);
});

test('step0-fixture: an existing AGENTS.md plus the light block passes validate with no step0-pending or rule-missing', async () => {
  const content = await readEntryModes();
  const blocks = extractFencedBlocks(content);
  assert.equal(blocks.length, 2, 'expected exactly two fenced markdown blocks (light block, mention-only line)');
  const [lightBlock] = blocks;
  assert.match(lightBlock, /## Wolven harness/);

  const ruleFiles = await collectCitedRules(lightBlock);
  assert.ok(Object.keys(ruleFiles).length > 0, 'light block cites no rule files to copy');

  const priorAgents = [
    '# Agents',
    '',
    '## Deploy',
    '',
    'Run the deploy script after every release to staging.',
    '',
  ].join('\n');

  const cwd = await makeRepo(
    {
      'AGENTS.md': `${priorAgents}\n${lightBlock}\n`,
      ...ruleFiles,
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd });

  assert.equal(result.code, 0, result.stdout + result.stderr);
  assert.doesNotMatch(result.stdout, /step0-pending/);
  assert.doesNotMatch(result.stdout, /rule-missing/);
});

test('step0-fixture: an existing AGENTS.md plus the mention-only line, with WOLVEN.md kept, clears step0-pending', async () => {
  const content = await readEntryModes();
  const blocks = extractFencedBlocks(content);
  assert.equal(blocks.length, 2, 'expected exactly two fenced markdown blocks (light block, mention-only line)');
  const [, mentionLine] = blocks;
  assert.match(mentionLine, /WOLVEN\.md/);

  const wolvenTemplate = await readFile(path.join(repoRoot, 'templates', 'WOLVEN.md'), 'utf8');
  // why: the first mode-agnostic line names step 0 itself; every mode drops
  // it, so the fixture's kept WOLVEN.md starts from its second line on.
  const wolvenBody = wolvenTemplate.split('\n').slice(1).join('\n').replace(/^\n+/, '');

  const ruleFiles = await collectCitedRules(wolvenBody);
  assert.ok(Object.keys(ruleFiles).length > 0, 'kept WOLVEN.md cites no rule files to copy');

  const priorAgents = [
    '# Agents',
    '',
    '## Deploy',
    '',
    'Run the deploy script after every release to staging.',
    '',
  ].join('\n');

  // why: the shipped WOLVEN.md claims ADR-000 by name (its own
  // architecture-claims example), so keeping the template body verbatim
  // means the fixture needs that same profile ADR to resolve the claim.
  const adr000 = await readFile(
    path.join(repoRoot, 'templates', 'docs', 'adrs', 'adr-000-record-architecture-decisions.md'),
    'utf8',
  );

  const cwd = await makeRepo(
    {
      'AGENTS.md': `${priorAgents}\n${mentionLine}\n`,
      'WOLVEN.md': wolvenBody,
      'docs/adrs/adr-000-record-architecture-decisions.md': adr000,
      ...ruleFiles,
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd });

  assert.equal(result.code, 0, result.stdout + result.stderr);
  assert.doesNotMatch(result.stdout, /step0-pending/);
});

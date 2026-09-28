import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { readSkill } from './helpers/skill-contract.js';
import { makeRepo, run } from './helpers/fixture.js';
import { flatten } from './helpers/prose.js';

const execFileAsync = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');

const MARKDOWN_FENCE_RE = /```markdown\n([\s\S]*?)```/g;
const RULE_CITATION_RE = /\.agents\/rules\/[A-Za-z0-9._-]+\.md/g;

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

test('step0-modes: full mode drops the body H1 and demotes its headings, except with no AGENTS.md', async () => {
  const flat = flatten(await readEntryModes());

  assert.match(flat, /new `## Wolven harness` heading replaces that H1, so drop it/i);
  assert.match(flat, /demote every remaining heading one level \(`##` → `###`\)/i);
  assert.match(flat, /body's H1 stays as the file's title/i);
});

test('step0-modes: an already-integrated AGENTS.md gets a refresh offer, never a second fold', async () => {
  const flat = flatten(await readEntryModes());

  assert.match(flat, /## Already integrated/);
  assert.match(flat, /running it again after a full or light fold .* brings `WOLVEN\.md` back/i);
  assert.match(flat, /a `## Wolven harness` heading .* or the router's own `# Wolven harness — entry router` title/i);
  assert.match(flat, /do not fold it a second time/i);
  assert.match(flat, /show the human the diff .* ask whether to refresh the section .* then delete `WOLVEN\.md`/i);
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

test('step0-modes: the five before-writing checks are all present', async () => {
  const flat = flatten(await readEntryModes());

  assert.match(flat, /step 0 runs five checks/i);
  assert.match(flat, /never removed or rewritten without the human's OK/i);
  assert.match(flat, /overlaps.*(?:questions|question).*one at a time/i);
  assert.match(flat, /`?CLAUDE\.md`? .*does not import `?AGENTS\.md`?.*offers to add an `?@AGENTS\.md`? line/i);
  assert.match(flat, /`?git check-ignore -v <path>`?/i);
  assert.match(flat, /List any content the harness did not write/i);
});

test('step0-modes: an ignored harness path gets re-include rules on a yes, never a deleted ignore line', async () => {
  const flat = flatten(await readEntryModes());

  assert.match(flat, /fails with `harness-ignored` for each harness path an ignore rule excludes/i);
  assert.match(flat, /never delete its ignore lines/i);
  assert.match(flat, /Propose re-include rules appended after them/i);
  assert.match(flat, /write them only on the human's yes/i);
  assert.match(flat, /stays red until those paths are shared/i);
  assert.match(flat, /## Re-include rules/);
  assert.match(flat, /point it out rather than editing it/i);
});

test('step0-modes: existing content in the five doc folders is a question, never a silent move', async () => {
  const flat = flatten(await readEntryModes());

  assert.match(flat, /`docs\/adrs\/`, `docs\/prds\/`, `docs\/specs\/`, `docs\/notes\/`, or `docs\/deferrals\/`/);
  assert.match(flat, /the rest of `docs\/` is left alone/i);
  assert.match(flat, /reshape it into the doc-folder layout with frontmatter or move it out of those five folders/i);
  assert.match(flat, /never move or rewrite one without the human's answer/i);
});

test('step0-fixture: the re-include block shares the harness paths and keeps the rest of the folders ignored', async () => {
  const content = await readEntryModes();
  const block = content.match(/```gitignore\n([\s\S]*?)```/)?.[1];
  assert.ok(block, 'expected one fenced gitignore block');

  const skill = '---\nname: foo\ndescription: does stuff\n---\n\n# Foo\n';
  const files: Record<string, string> = {
    '.agents/skills/foo/SKILL.md': skill,
    '.agents/rules/local.md': '# Local rule\n',
    '.agents/hooks/README.md': '# Hooks\n',
    '.agents/private/notes.md': 'mine\n',
    '.claude/skills/foo/SKILL.md': skill,
    '.claude/settings.local.json': '{}\n',
  };
  const ignored = 'node_modules/\n.claude/\n.agents/\n';

  const before = await makeRepo({ '.gitignore': ignored, ...files }, { git: true });
  const beforeResult = await run(['validate'], { cwd: before });
  assert.match(beforeResult.stdout + beforeResult.stderr, /harness-ignored\] \.agents\/skills/);

  const after = await makeRepo({ '.gitignore': `${ignored}\n${block}`, ...files }, { git: true });
  const afterResult = await run(['validate'], { cwd: after });
  assert.equal(afterResult.code, 0, afterResult.stdout + afterResult.stderr);
  assert.doesNotMatch(afterResult.stdout + afterResult.stderr, /harness-ignored/);

  const { stdout: tracked } = await execFileAsync('git', ['ls-files'], { cwd: after });
  assert.match(tracked, /^\.agents\/skills\/foo\/SKILL\.md$/m);
  assert.match(tracked, /^\.claude\/skills\/foo\/SKILL\.md$/m);
  assert.doesNotMatch(tracked, /\.agents\/private\/|settings\.local\.json/);
});

test('step0-fixture: an existing AGENTS.md plus the light block passes validate with no step0-pending or rule-missing', async () => {
  const content = await readEntryModes();
  const blocks = extractFencedBlocks(content);
  assert.equal(blocks.length, 2, 'expected exactly two fenced markdown blocks (light block, mention-only line)');
  const [lightBlock] = blocks;
  assert.match(lightBlock, /## Wolven harness/);
  assert.match(lightBlock, /<standing-rules>/);

  const wolvenTemplate = await readFile(path.join(repoRoot, 'templates', 'WOLVEN.md'), 'utf8');
  const standing = wolvenTemplate.split('## Standing rules')[1]?.split('\n## ')[0]?.trim() ?? '';
  const light = lightBlock.replace('<standing-rules>', standing);
  const ruleFiles = await collectCitedRules(light);
  assert.ok(Object.keys(ruleFiles).length > 0, 'WOLVEN.md standing rules cite no rule files to copy');

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
      'AGENTS.md': `${priorAgents}\n${light}\n`,
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

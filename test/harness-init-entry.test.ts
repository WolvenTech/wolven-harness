import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { makeRepo, run } from './helpers/fixture.js';
import { flatten } from './helpers/prose.js';
import { readSkill } from './helpers/skill-contract.js';

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

/** Slices one `## <heading>` section out of a markdown document. */
function sectionBody(content: string, heading: string, next: string): string {
  const start = content.indexOf(heading);
  assert.ok(start >= 0, `missing heading "${heading}"`);
  const end = content.indexOf(next, start);
  assert.ok(end > start, `missing heading "${next}" after "${heading}"`);
  return content.slice(start, end);
}

test('step0-modes: full and light sit under their own headings, in order, and mention-only is gone', async () => {
  const skill = await readSkill('harness-init');
  const body = await readEntryModes();

  const positions = ['## Full', '## Light'].map((heading) => {
    const index = body.indexOf(heading);
    assert.ok(index >= 0, `missing heading "${heading}"`);
    return index;
  });

  assert.ok(positions[0] < positions[1], 'headings are out of order');
  assert.doesNotMatch(body, /mention-only/i);
  assert.doesNotMatch(skill.body, /mention-only/i);
  assert.match(flatten(skill.body), /in one of two modes — full or light/i);
});

test('step0-modes: full and light write the WOLVEN.md fold and describe the no-AGENTS.md case', async () => {
  const flat = flatten(await readEntryModes());

  assert.match(
    flat,
    /without its first line, goes into `?AGENTS\.md`? as a\s*\n?\s*new `?##? ?Wolven harness`? section/i,
  );
  assert.match(
    flat,
    /no `?AGENTS\.md`? yet, `?WOLVEN\.md`? \(without its first line\) becomes `?AGENTS\.md`? outright/i,
  );
  assert.match(flat, /short `?##? ?Wolven harness`? block/i);
  assert.match(flat, /carries no router table and no skills table/i);
});

test('step0-modes: full mode drops the body H1 and demotes its headings, except with no AGENTS.md', async () => {
  const flat = flatten(await readEntryModes());

  assert.match(flat, /new `## Wolven harness` heading replaces that H1, so drop it/i);
  assert.match(flat, /demote every remaining heading one level \(`##` → `###`\)/i);
  assert.match(flat, /body's H1 stays as the file's title/i);
});

test('step0-modes: both modes write the section markers, and the WOLVEN.md body carries them', async () => {
  const content = await readEntryModes();
  const full = flatten(sectionBody(content, '## Full', '## Light'));

  assert.match(
    full,
    /`<!-- wolven-harness:start -->` before the `## Wolven harness` heading, and\s+`<!-- wolven-harness:end -->` after its last line/i,
  );
  assert.match(full, /markers stay intact around the harness body/i);

  const [lightBlock] = extractFencedBlocks(content);
  assert.match(lightBlock, /## Wolven harness/);
  assert.ok(lightBlock.indexOf('<!-- wolven-harness:start -->') >= 0, 'light block lacks the start marker');
  assert.ok(
    lightBlock.indexOf('<!-- wolven-harness:start -->') < lightBlock.indexOf('<!-- wolven-harness:end -->'),
    'light block markers are out of order',
  );

  const wolven = await readFile(path.join(repoRoot, 'templates', 'WOLVEN.md'), 'utf8');
  assert.match(
    wolven,
    /^Before anything else: [^\n]*\n\n<!-- wolven-harness:start -->\n\n# Wolven harness — entry router\n/,
  );
  assert.match(wolven, /\n<!-- wolven-harness:end -->\n$/);
  assert.equal(wolven.match(/<!-- wolven-harness:start -->/g)?.length, 1);
  assert.equal(wolven.match(/<!-- wolven-harness:end -->/g)?.length, 1);
});

test('step0-rules: the entry text checks the wired runtimes and inserts the rule bodies between the rules markers', async () => {
  const content = await readEntryModes();
  const flat = flatten(content);

  assert.match(flat, /Read `\.wolven-harness\.json` before writing either mode/);
  assert.match(flat, /`runtimes` list includes `codex`/i);
  assert.match(flat, /cannot import files/);
  assert.match(flat, /`<!-- wolven-harness:rules:start -->` and\s+`<!-- wolven-harness:rules:end -->`/i);
  assert.match(flat, /inside the section's own start and end markers/i);
  assert.match(flat, /Read every `\.agents\/rules\/\*\.md` and strip its YAML frontmatter/);
  assert.match(flat, /When `codex` is not wired, write no rules block/);

  const full = flatten(sectionBody(content, '## Full', '## Light'));
  assert.match(
    full,
    /lists `codex` under `runtimes`, append the \[rules block\]\(#rules-for-codex\) inside the section's markers/i,
  );

  const light = flatten(sectionBody(content, '## Light', '## Rules for `codex`'));
  assert.match(
    light,
    /lists `codex` under `runtimes`, insert the \[rules block\]\(#rules-for-codex\) before the closing/i,
  );
});

test('step0-modes: an already-integrated AGENTS.md gets a refresh offer, never a second fold', async () => {
  const flat = flatten(await readEntryModes());

  assert.match(flat, /## Already integrated/);
  assert.match(flat, /running it again after a full or light fold .* brings `WOLVEN\.md` back/i);
  assert.match(flat, /a `## Wolven harness` heading .* or the router's own `# Wolven harness — entry router` title/i);
  assert.match(flat, /do not fold it a second time/i);
  assert.match(flat, /show the human the diff .* ask whether to refresh the section .* then delete `WOLVEN\.md`/i);
});

test('step0-modes: WOLVEN.md is deleted after either mode, once the markers and rules are in place', async () => {
  const flat = flatten(await readEntryModes());

  assert.match(flat, /`WOLVEN\.md` is deleted in both full and light/i);
  assert.match(flat, /Deleting it is the last write of step 0, after the section markers and any rules block/i);
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

test('step0-fixture: the light block carries the markers, so validate clears step 0 with WOLVEN.md present and after it is gone', async () => {
  const content = await readEntryModes();
  const blocks = extractFencedBlocks(content);
  assert.equal(blocks.length, 2, 'expected two fenced markdown blocks (light block, rules block)');
  const [lightBlock] = blocks;
  assert.match(lightBlock, /## Wolven harness/);
  assert.match(lightBlock, /<!-- wolven-harness:start -->/);
  assert.match(lightBlock, /<!-- wolven-harness:end -->/);
  assert.match(lightBlock, /<standing-rules>/);

  const wolvenTemplate = await readFile(path.join(repoRoot, 'templates', 'WOLVEN.md'), 'utf8');
  const standing = wolvenTemplate.split('## Standing rules')[1]?.split('\n## ')[0]?.trim() ?? '';
  assert.match(
    standing,
    /before using a skill, check `\.agents\/skills\/<name>\/SKILL\.md` and `\.claude\/skills\/<name>\/SKILL\.md`/i,
  );
  assert.match(standing, /follow an available project copy, use the user-level copy only when neither exists/i);
  assert.match(standing, /resolve relative references from the selected skill directory/i);
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
      'WOLVEN.md': '# Wolven harness — entry router\n',
      ...ruleFiles,
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd });
  assert.equal(result.code, 0, result.stdout + result.stderr);
  assert.doesNotMatch(result.stdout, /step0-pending/);
  assert.doesNotMatch(result.stdout, /rule-missing/);

  await rm(path.join(cwd, 'WOLVEN.md'));
  const deleted = await run(['validate'], { cwd });
  assert.equal(deleted.code, 0, deleted.stdout + deleted.stderr);
  assert.doesNotMatch(deleted.stdout, /step0-pending/);
  assert.doesNotMatch(deleted.stdout, /rule-missing/);
});

test('proof-entry-plain-labels: step 0 asks how much to change AGENTS.md, with two labels tied to the modes', async () => {
  const flat = flatten(await readEntryModes());

  assert.match(flat, /"How much should we change your current AGENTS\.md\?"/);
  assert.match(flat, /with two answers named for what they do/i);
  assert.match(flat, /\*\*A short section\*\* \(light\): adds a brief summary of where skills and rules live/);
  assert.match(flat, /\*\*The whole guide\*\* \(full\): copies the full harness guide and skills list in/);
  assert.doesNotMatch(flat, /Just one line/);
  assert.match(flat, /List the recommended answer first/);
});

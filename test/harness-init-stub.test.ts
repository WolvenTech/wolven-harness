import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parse as parseYaml } from 'yaml';
import { run } from './helpers/fixture.js';
import { flatten } from './helpers/prose.js';
import { minimalValidateFixture, readSkill } from './helpers/skill-contract.js';

const REF = 'references/stub-template.md';
const INVENTED_NAME = 'payments-gateway';

async function readReference(): Promise<string> {
  const skill = await readSkill('harness-init');
  return skill.read(REF);
}

/**
 * Extracts `path`/fenced-block pairs from the reference. Each rendered file
 * is marked by a line holding just `` `path`: `` immediately above a fenced
 * block (an optional language tag on the opening fence is allowed) — parsed
 * here, never duplicated as literal content in this test.
 */
function parseFiles(content: string): Record<string, string> {
  const re = /`([^`\n]+)`:\n\n```(?:\w+)?\n([\s\S]*?)```/g;
  const files: Record<string, string> = {};
  let match: RegExpExecArray | null;
  while ((match = re.exec(content))) {
    files[match[1]] = match[2];
  }
  return files;
}

/** Substitutes the `<name>` placeholder with an invented skill name, in both a path and its content. */
function substituteName(text: string): string {
  return text.split('<name>').join(INVENTED_NAME);
}

async function loadRenderedFiles(): Promise<{
  skillPath: string;
  skillMd: string;
  yamlPath: string;
  openaiYaml: string;
}> {
  const raw = await readReference();
  const files = parseFiles(raw);
  const rawSkillEntry = Object.entries(files).find(([p]) => p.endsWith('SKILL.md'));
  const rawYamlEntry = Object.entries(files).find(([p]) => p.endsWith('openai.yaml'));

  assert.ok(rawSkillEntry, 'reference has no `path`+fence pair for SKILL.md');
  assert.ok(rawYamlEntry, 'reference has no `path`+fence pair for agents/openai.yaml');

  return {
    skillPath: substituteName(rawSkillEntry![0]),
    skillMd: substituteName(rawSkillEntry![1]),
    yamlPath: substituteName(rawYamlEntry![0]),
    openaiYaml: substituteName(rawYamlEntry![1]),
  };
}

test('stub-template: never overwrites an existing skill folder — ask for another name or skip', async () => {
  const flat = flatten(await readReference());
  assert.match(flat, /an existing skill folder is never overwritten/i);
  assert.match(flat, /ask the human for another name or skip/i);
});

test('stub-template: an ask-only stub never fires on its own', async () => {
  const flat = flatten(await readReference());
  assert.match(flat, /never fires on its own/i);
  assert.match(flat, /disable-model-invocation: true.*allow_implicit_invocation: false/i);
});

test('stub-template: harness:validate warns skill-stub-open until the marker is removed', async () => {
  const flat = flatten(await readReference());
  assert.match(flat, /`harness:validate` warns `skill-stub-open`/);
  assert.match(flat, /still carries `wolven-harness: stub`/);
  assert.match(flat, /removing that marker/i);
  assert.match(flat, /only if the human wants the skill model-invocable/i);
});

test("stub-template: every stub lands in the setup phase's single commit offer, never one per stub", async () => {
  const flat = flatten(await readReference());
  assert.match(flat, /setup phase's single commit offer/i);
  assert.match(flat, /never a commit per stub/i);
});

test('stub-template: ends with the hand-back line — define each stub, then remove the marker', async () => {
  const raw = await readReference();
  const trimmed = raw.trimEnd();
  assert.match(trimmed, /hand back to the human: define each stub, then remove the marker\.$/i);
});

test('stub-template: renders a SKILL.md stub whose frontmatter carries the stub marker and ask-only flag', async () => {
  const { skillMd } = await loadRenderedFiles();

  const match = skillMd.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(match, 'rendered SKILL.md has no frontmatter block');
  const frontmatter = parseYaml(match![1]) as Record<string, unknown>;

  assert.equal(frontmatter.name, INVENTED_NAME);
  assert.equal(typeof frontmatter.description, 'string');
  assert.ok(!(frontmatter.description as string).includes('|'), 'description must not contain "|"');
  assert.match(frontmatter.description as string, /stub/i);
  assert.equal(frontmatter['disable-model-invocation'], true);
  assert.equal((frontmatter.metadata as Record<string, unknown>)?.['wolven-harness'], 'stub');
});

test('stub-template: renders headed prompts and the discovery evidence the suggestion came from', async () => {
  const { skillMd } = await loadRenderedFiles();

  assert.match(skillMd, /## Discovery evidence/);
  assert.match(skillMd, /## When to use/);
  assert.match(skillMd, /## Conventions/);
  assert.match(skillMd, /## What to avoid/);
  assert.match(skillMd, /## How to verify/);
});

test('stub-template: renders an agents/openai.yaml whose policy blocks implicit invocation', async () => {
  const { openaiYaml } = await loadRenderedFiles();
  const parsed = parseYaml(openaiYaml) as { policy?: { allow_implicit_invocation?: boolean } };

  assert.equal(parsed.policy?.allow_implicit_invocation, false);
});

test('stub-template: a rendered stub passes validate with no skill-frontmatter finding and exactly one skill-stub-open warning', async () => {
  const { skillPath, skillMd, yamlPath, openaiYaml } = await loadRenderedFiles();

  const dir = await minimalValidateFixture({
    [skillPath]: skillMd,
    [yamlPath]: openaiYaml,
  });

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 0, result.stdout);
  assert.doesNotMatch(result.stdout, /skill-frontmatter/);
  const matches = result.stdout.match(/skill-stub-open/g) ?? [];
  assert.equal(matches.length, 1);
  assert.match(result.stdout, new RegExp(`skill-stub-open.*${skillPath.replace(/\./g, '\\.')}`));
});

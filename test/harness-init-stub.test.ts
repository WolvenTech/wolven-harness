import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { run } from './helpers/fixture.js';
import { flatten } from './helpers/prose.js';
import { minimalValidateFixture, readSkill } from './helpers/skill-contract.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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
  assert.equal(frontmatter.description, '<What the skill does, in third person>. Use when <trigger>');
  assert.ok(!(frontmatter.description as string).includes('|'), 'description must not contain "|"');
  assert.doesNotMatch(frontmatter.description as string, /stub skill/i);
  assert.doesNotMatch(frontmatter.description as string, /not yet defined/i);
  assert.equal(frontmatter['disable-model-invocation'], true);
  assert.equal((frontmatter.metadata as Record<string, unknown>)?.['wolven-harness'], 'stub');
});

test('stub-template: renders cited evidence, a generated-against stamp, and a step per prompt', async () => {
  const { skillMd } = await loadRenderedFiles();

  assert.match(skillMd, /## Cited evidence/);
  assert.match(skillMd, /Decided tool: <tool-or-field>/);
  assert.match(skillMd, /Repo file: <path>/);
  assert.match(skillMd, /External skill: <skill-name and location, or none>/);
  assert.match(skillMd, /its text stays in its own file/i);
  assert.match(skillMd, /Generated against: <tool-or-field> <version, or no version recorded>/);

  assert.match(skillMd, /### 1\. Trigger/);
  assert.match(skillMd, /### 2\. Conventions/);
  assert.match(skillMd, /### 3\. Workflow/);
  assert.match(skillMd, /### 4\. Verify/);
  assert.equal((skillMd.match(/^Ask the Human/gm) ?? []).length, 4);

  const steps = skillMd.split(/^## Steps/m)[1] ?? '';
  assert.equal((steps.match(/^Done when:/gm) ?? []).length, 4);
});

test('stub-template: renders an agents/openai.yaml whose policy blocks implicit invocation', async () => {
  const { openaiYaml } = await loadRenderedFiles();
  const parsed = parseYaml(openaiYaml) as {
    interface?: { short_description?: string };
    policy?: { allow_implicit_invocation?: boolean };
  };

  assert.equal(parsed.policy?.allow_implicit_invocation, false);
  assert.equal(parsed.interface?.short_description, '<What the skill does, in third person>. Use when <trigger>');
});

test('stub-template: a cited skill that conflicts with a local ADR or workflow is recorded and left out', async () => {
  const raw = await readReference();
  const flat = flatten(raw);

  assert.match(
    flat,
    /when a cited skill conflicts with a stable ADR or an existing workflow in this repo, record the conflict here and follow the local decision/i,
  );
  assert.match(flat, /the conflicting step stays out of this skill/i);
  assert.match(flat, /step 3 stays a prompt until the Human fills it/);
  assert.doesNotMatch(raw, /ADR-002/);
  assert.doesNotMatch(raw, /release\.yml/);
});

test('stub-template: branch-only detail sits one level down, and the skill file stays under 500 lines', async () => {
  const skillMd = flatten((await loadRenderedFiles()).skillMd);

  assert.match(skillMd, /Keep this file under 500 lines/);
  assert.match(skillMd, /`references\/<slug>\.md` in this skill folder — one level down/);
});

test('stub-template: step 5 is done when validate warns skill-stub-open and no folder was overwritten', async () => {
  const step = flatten(
    (await readSkill('harness-init')).body.split(/^### 5\. Write stubs/m)[1]?.split(/^### /m)[0] ?? '',
  );

  assert.match(step, /\[references\/stub-template\.md\]\(references\/stub-template\.md\)/);
  assert.match(step, /trigger `description`/);
  assert.match(step, /generated-against stamp/);
  assert.match(step, /each step ending on a checkable done/i);
  assert.match(step, /no existing skill folder was overwritten/i);
  assert.match(step, /warns `skill-stub-open` once for that `SKILL\.md`/);
});

test('stub-template: the installed harness-init copy matches the template', async () => {
  for (const rel of [
    '.agents/skills/harness-init/SKILL.md',
    '.agents/skills/harness-init/references/stub-template.md',
  ]) {
    const template = await readFile(path.join(repoRoot, 'templates', rel), 'utf8');
    const installed = await readFile(path.join(repoRoot, rel), 'utf8');
    assert.equal(installed, template, rel);
  }
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

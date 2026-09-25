import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { readSkill, assertSkillBasics } from './helpers/skill-contract.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const skillsRoot = path.join(here, '..', 'templates', '.agents', 'skills');

test('skill-handoff: passes the shared skill contract checks', async () => {
  await assertSkillBasics('handoff');
});

test('skill-handoff: is ask-only in its frontmatter', async () => {
  const skill = await readSkill('handoff');

  assert.equal(skill.frontmatter['disable-model-invocation'], true);
});

test('skill-handoff: ships an ask-only agents/openai.yaml', async () => {
  const skill = await readSkill('handoff');

  assert.ok(skill.files.includes('agents/openai.yaml'), 'expected agents/openai.yaml');

  const raw = await skill.read('agents/openai.yaml');
  const parsed = parseYaml(raw) as {
    interface?: { display_name?: string; short_description?: string };
    policy?: { allow_implicit_invocation?: boolean };
  };

  assert.equal(parsed.policy?.allow_implicit_invocation, false);
  assert.ok(typeof parsed.interface?.display_name === 'string' && parsed.interface.display_name.length > 0);
  assert.ok(typeof parsed.interface?.short_description === 'string' && parsed.interface.short_description.length > 0);
});

test('skill-handoff: saves to the OS temp directory, never the repository', async () => {
  const skill = await readSkill('handoff');

  assert.match(skill.body, /OS temp directory/i);
  assert.match(skill.body, /\$TMPDIR/);
  assert.match(skill.body, /%TEMP%/);
  assert.match(skill.body, /never.{0,40}(inside|write).{0,40}repository/i);
  assert.match(skill.body, /must not be\s+committed/i);
});

test('skill-handoff: the template carries every required section', async () => {
  const skill = await readSkill('handoff');
  const templ = await skill.read('references/TEMPLATE.md');

  assert.match(templ, /Next-session goal/i);
  assert.match(templ, /## Context/);
  assert.match(templ, /## Artifacts/);
  assert.match(templ, /## Open decisions/);
  assert.match(templ, /Suggested next skills/i);
  assert.match(templ, /Cross-runtime notes/i);
  assert.match(templ, /## Redactions/);
});

test('skill-handoff: artifacts are cited by path, never pasted', async () => {
  const skill = await readSkill('handoff');
  const templ = await skill.read('references/TEMPLATE.md');
  const combined = `${skill.body}\n${templ}`;

  assert.match(combined, /branch/i);
  assert.match(combined, /commit SHA/i);
  assert.match(combined, /pull request link/i);
  assert.match(combined, /never paste/i);
});

test('skill-handoff: names Claude Code, Codex, and Cursor as separate cross-runtime subsections', async () => {
  const skill = await readSkill('handoff');
  const templ = await skill.read('references/TEMPLATE.md');

  const section = templ.split(/## Cross-runtime notes/)[1]?.split(/^## /m)[0] ?? '';
  assert.match(section, /\*\*Claude Code:\*\*/);
  assert.match(section, /\*\*Codex:\*\*/);
  assert.match(section, /\*\*Cursor:\*\*/);
});

test('skill-handoff: has a redaction step for secrets, tokens, credentials, and personal data', async () => {
  const skill = await readSkill('handoff');

  assert.match(skill.body, /[Rr]edact/);
  assert.match(skill.body, /secret/i);
  assert.match(skill.body, /token/i);
  assert.match(skill.body, /credential/i);
  assert.match(skill.body, /personal data/i);
});

test('skill-handoff: every skill named in backticks under Suggested next skills exists in this package', async () => {
  const skill = await readSkill('handoff');
  const templ = await skill.read('references/TEMPLATE.md');

  const section = templ.split(/## Suggested next skills/)[1]?.split(/^## /m)[0] ?? '';
  assert.ok(section.length > 0, 'expected a Suggested next skills section');

  const names = [...section.matchAll(/`([a-z][a-z0-9-]*)`/g)].map((m) => m[1]);
  assert.ok(names.length > 0, 'expected at least one skill named in backticks');

  const entries = await readdir(skillsRoot, { withFileTypes: true });
  const existing = new Set(entries.filter((e) => e.isDirectory()).map((e) => e.name));

  for (const name of names) {
    assert.ok(existing.has(name), `suggested skill "${name}" does not exist under templates/.agents/skills/`);
  }
});

test('skill-handoff: has no cowork, board, or Area residue', async () => {
  const skill = await readSkill('handoff');
  const templ = await skill.read('references/TEMPLATE.md');
  const combined = `${skill.body}\n${templ}`.toLowerCase();

  assert.doesNotMatch(combined, /cowork/);
  assert.doesNotMatch(combined, /\bboard\b/);
  assert.doesNotMatch(combined, /\barea\b/);
});

import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse as parseYaml } from 'yaml';
import { readSkill } from './helpers/skill-contract.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const skillsRoot = path.join(here, '..', 'templates', '.agents', 'skills');

const EXPECTED_SKILLS = [
  'adr',
  'code-ci',
  'code-commit',
  'code-execute',
  'code-plan',
  'code-pr',
  'code-review',
  'code-spec',
  'create-prd',
  'grilling',
  'handoff',
  'pragmatic-guard',
  'prototype',
  'qmd',
  'research',
].sort();

const ASK_ONLY_SKILLS = new Set(['code-commit', 'code-pr', 'code-review', 'code-ci', 'handoff']);

test('ask-only: the template skill set is exactly the fifteen expected folders', async () => {
  const entries = await readdir(skillsRoot, { withFileTypes: true });
  const actual = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  assert.deepEqual(actual, EXPECTED_SKILLS);
});

for (const name of EXPECTED_SKILLS) {
  if (ASK_ONLY_SKILLS.has(name)) {
    test(`ask-only: ${name} is ask-only in both runtimes`, async () => {
      const skill = await readSkill(name);

      assert.equal(
        skill.frontmatter['disable-model-invocation'],
        true,
        `${name}: SKILL.md frontmatter must set disable-model-invocation: true`,
      );

      assert.ok(
        skill.files.includes('agents/openai.yaml'),
        `${name}: expected agents/openai.yaml`,
      );

      const raw = await skill.read('agents/openai.yaml');
      const parsed = parseYaml(raw) as { policy?: { allow_implicit_invocation?: boolean } };

      assert.equal(
        parsed.policy?.allow_implicit_invocation,
        false,
        `${name}: agents/openai.yaml must set policy.allow_implicit_invocation: false`,
      );
    });
  } else {
    test(`ask-only: ${name} is model-invocable`, async () => {
      const skill = await readSkill(name);

      assert.equal(
        Object.prototype.hasOwnProperty.call(skill.frontmatter, 'disable-model-invocation'),
        false,
        `${name}: SKILL.md frontmatter must not set disable-model-invocation`,
      );

      assert.ok(
        !skill.files.includes('agents/openai.yaml'),
        `${name}: must not ship agents/openai.yaml`,
      );
    });
  }
}

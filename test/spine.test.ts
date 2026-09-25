import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { makeRepo, run } from './helpers/fixture.js';

// --- skill-frontmatter ---

test('skill-frontmatter: SKILL.md missing "name" exits 1 with the rule id', async () => {
  const dir = await makeRepo(
    {
      '.agents/skills/foo/SKILL.md': '---\ndescription: does stuff\n---\n\n# Foo\n',
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 1);
  assert.match(result.stdout, /skill-frontmatter/);
});

test('skill-frontmatter: SKILL.md missing "description" exits 1 with the rule id', async () => {
  const dir = await makeRepo(
    {
      '.agents/skills/foo/SKILL.md': '---\nname: foo\n---\n\n# Foo\n',
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 1);
  assert.match(result.stdout, /skill-frontmatter/);
});

test('skill-frontmatter: SKILL.md with no frontmatter exits 1 with the rule id', async () => {
  const dir = await makeRepo(
    {
      '.agents/skills/foo/SKILL.md': '# Foo\n\nNo frontmatter here.\n',
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 1);
  assert.match(result.stdout, /skill-frontmatter/);
});

test('skill-frontmatter: a valid skill passes (exit 0)', async () => {
  const dir = await makeRepo(
    {
      '.agents/skills/foo/SKILL.md': '---\nname: foo\ndescription: does stuff\n---\n\n# Foo\n',
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 0);
});

test('skill-frontmatter: WOLVEN.md citing a missing rule exits 1 with the rule id', async () => {
  const dir = await makeRepo(
    {
      'WOLVEN.md': 'See .agents/rules/missing.md for details.\n',
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 1);
  assert.match(result.stdout, /rule-missing/);
});

test('skill-frontmatter: AGENTS.md citing a missing rule exits 1 with the rule id', async () => {
  const dir = await makeRepo(
    {
      'AGENTS.md': 'See .agents/rules/missing.md for details.\n',
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 1);
  assert.match(result.stdout, /rule-missing/);
});

test('skill-frontmatter: an existing cited rule produces no rule-missing finding', async () => {
  const dir = await makeRepo(
    {
      'WOLVEN.md': 'See .agents/rules/present.md.\n',
      '.agents/rules/present.md': '# Present rule\n',
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.doesNotMatch(result.stdout, /rule-missing/);
});

// --- step0-pending ---

test('step0-pending: fresh init warns, and AGENTS.md mentioning WOLVEN.md clears it', async () => {
  const dir = await makeRepo({}, { git: true });

  const initResult = await run(['init', '--git-host', 'gh', '--runtimes', 'codex'], { cwd: dir });
  assert.equal(initResult.code, 0);

  const first = await run(['validate'], { cwd: dir });
  assert.equal(first.code, 0);
  assert.match(first.stdout, /harness-init step 0 pending/);

  await writeFile(path.join(dir, 'AGENTS.md'), '# Agents\n\nSee WOLVEN.md for the harness router.\n', 'utf8');

  const second = await run(['validate'], { cwd: dir });
  assert.equal(second.code, 0);
  assert.doesNotMatch(second.stdout, /harness-init step 0 pending/);
});

test('step0-pending: no WOLVEN.md means no warning', async () => {
  const dir = await makeRepo(
    {
      'AGENTS.md': '# Agents\n\nNo router mentioned here.\n',
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 0);
  assert.doesNotMatch(result.stdout, /harness-init step 0 pending/);
});

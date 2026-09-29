import assert from 'node:assert/strict';
import { mkdir, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
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

test('rule-missing: WOLVEN.md citing a missing rule exits 1 with the rule id', async () => {
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

test('rule-missing: AGENTS.md citing a missing rule exits 1 with the rule id', async () => {
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

test('rule-missing: a dangling symlink cited as a rule exits 1 with the rule id', async () => {
  const dir = await makeRepo(
    {
      'WOLVEN.md': 'See .agents/rules/missing.md for details.\n',
    },
    { git: true },
  );
  await mkdir(path.join(dir, '.agents', 'rules'), { recursive: true });
  await symlink('gone.md', path.join(dir, '.agents', 'rules', 'missing.md'));

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 1);
  assert.match(result.stdout, /rule-missing/);
});

test('rule-missing: a regular-file .agents reports the missing rule instead of throwing', async () => {
  const dir = await makeRepo(
    {
      'WOLVEN.md': 'See .agents/rules/missing.md for details.\n',
      '.agents': 'not a directory\n',
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 1);
  assert.match(result.stdout, /rule-missing/);
  assert.doesNotMatch(result.stderr, /ENOTDIR/);
});

test('rule-missing: an existing cited rule produces no rule-missing finding', async () => {
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

test('stub-warn: one stub raises exactly one skill-stub-open warning, exit 0', async () => {
  const dir = await makeRepo(
    {
      '.agents/skills/foo/SKILL.md':
        '---\nname: foo\ndescription: does stuff\nmetadata:\n  wolven-harness: stub\n---\n\n# Foo\n',
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 0);
  const matches = result.stdout.match(/skill-stub-open/g) ?? [];
  assert.equal(matches.length, 1);
});

test('stub-warn: removing the marker clears the warning', async () => {
  const dir = await makeRepo(
    {
      '.agents/skills/foo/SKILL.md': '---\nname: foo\ndescription: does stuff\n---\n\n# Foo\n',
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 0);
  assert.doesNotMatch(result.stdout, /skill-stub-open/);
});

test('stub-warn: an unrelated metadata value raises no warning', async () => {
  const dir = await makeRepo(
    {
      '.agents/skills/foo/SKILL.md': '---\nname: foo\ndescription: does stuff\nmetadata:\n  other: x\n---\n\n# Foo\n',
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 0);
  assert.doesNotMatch(result.stdout, /skill-stub-open/);
});

test('stub-warn: two stubs raise two skill-stub-open warnings', async () => {
  const dir = await makeRepo(
    {
      '.agents/skills/foo/SKILL.md':
        '---\nname: foo\ndescription: does stuff\nmetadata:\n  wolven-harness: stub\n---\n\n# Foo\n',
      '.agents/skills/bar/SKILL.md':
        '---\nname: bar\ndescription: does other stuff\nmetadata:\n  wolven-harness: stub\n---\n\n# Bar\n',
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 0);
  const matches = result.stdout.match(/skill-stub-open/g) ?? [];
  assert.equal(matches.length, 2);
});

test('stub-warn: a stub missing its description raises both skill-frontmatter and skill-stub-open', async () => {
  const dir = await makeRepo(
    {
      '.agents/skills/foo/SKILL.md': '---\nname: foo\nmetadata:\n  wolven-harness: stub\n---\n\n# Foo\n',
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });
  const output = result.stdout + result.stderr;

  assert.notEqual(result.code, 0);
  assert.equal((output.match(/skill-frontmatter/g) ?? []).length, 1);
  assert.equal((output.match(/skill-stub-open/g) ?? []).length, 1);
});

const SKILL = '---\nname: foo\ndescription: does stuff\n---\n\n# Foo\n';

test('harness-ignored: an ignored .agents/ fails once per harness path present, naming the rule', async () => {
  const dir = await makeRepo(
    {
      '.gitignore': 'node_modules/\n.agents/\n',
      '.agents/skills/foo/SKILL.md': SKILL,
      '.agents/rules/present.md': '# Present rule\n',
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });
  const output = result.stdout + result.stderr;

  assert.notEqual(result.code, 0);
  assert.equal((output.match(/harness-ignored/g) ?? []).length, 2);
  assert.match(output, /harness-ignored\] \.agents\/skills: excluded by ignore rule "\.agents\/" \(\.gitignore:2\)/);
  assert.match(output, /harness-ignored\] \.agents\/rules:/);
});

test('harness-ignored: re-include rules after the ignore clear it and keep the rest of the folder ignored', async () => {
  const dir = await makeRepo(
    {
      '.gitignore':
        '.agents/\n.claude/\n\n!.agents/\n.agents/*\n!.agents/skills/\n!.agents/rules/\n!.claude/\n.claude/*\n!.claude/skills\n',
      '.agents/skills/foo/SKILL.md': SKILL,
      '.agents/rules/present.md': '# Present rule\n',
      '.agents/private/notes.md': 'mine\n',
      '.claude/skills/foo/SKILL.md': SKILL,
      '.claude/settings.local.json': '{}\n',
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 0, result.stdout + result.stderr);
  assert.doesNotMatch(result.stdout + result.stderr, /harness-ignored/);
});

test('harness-ignored: an ignored docs/ fails', async () => {
  const dir = await makeRepo(
    {
      '.gitignore': 'docs/\n',
      'docs/WRITING-PROFILE.md': '# Writing profile\n',
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });
  const output = result.stdout + result.stderr;

  assert.notEqual(result.code, 0);
  assert.match(output, /harness-ignored\] docs: excluded by ignore rule "docs\/" \(\.gitignore:1\)/);
});

test('harness-ignored: no ignore rules over harness paths raise nothing', async () => {
  const dir = await makeRepo(
    {
      '.gitignore': 'node_modules/\ndist/\n',
      '.agents/skills/foo/SKILL.md': SKILL,
    },
    { git: true },
  );

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 0, result.stdout + result.stderr);
  assert.doesNotMatch(result.stdout + result.stderr, /harness-ignored/);
});

// --- step0-pending ---

test('step0-pending: fresh init warns, and AGENTS.md mentioning WOLVEN.md clears it', async () => {
  const dir = await makeRepo({}, { git: true });

  const initResult = await run(['setup', '--git-host', 'gh', '--runtimes', 'codex'], { cwd: dir });
  assert.equal(initResult.code, 0);

  const first = await run(['validate'], { cwd: dir });
  assert.equal(first.code, 0);
  assert.match(first.stdout, /harness-init step 0 pending/);

  await writeFile(path.join(dir, 'AGENTS.md'), '# Agents\n\nSee WOLVEN.md for the harness router.\n', 'utf8');

  const second = await run(['validate'], { cwd: dir });
  assert.equal(second.code, 0);
  assert.doesNotMatch(second.stdout, /harness-init step 0 pending/);
});

test('step0-pending: a dangling WOLVEN.md symlink is absent, so there is no warning', async () => {
  const dir = await makeRepo({}, { git: true });
  await symlink('gone.md', path.join(dir, 'WOLVEN.md'));

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 0);
  assert.doesNotMatch(result.stdout + result.stderr, /harness-init step 0 pending/);
});

test('step0-pending: a dangling AGENTS.md symlink is absent, so the warning stays', async () => {
  const dir = await makeRepo(
    {
      'WOLVEN.md': '# Wolven\n',
    },
    { git: true },
  );
  await symlink('gone.md', path.join(dir, 'AGENTS.md'));

  const result = await run(['validate'], { cwd: dir });

  assert.equal(result.code, 0);
  assert.match(result.stdout, /harness-init step 0 pending/);
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

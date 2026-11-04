import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { flatten } from './helpers/prose.js';
import { readSkill } from './helpers/skill-contract.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS = ['code-commit', 'code-pr'] as const;

for (const name of SKILLS) {
  test(`convention-skills: ${name} reads the recorded commitConvention for codeRepo work`, async () => {
    const flat = flatten((await readSkill(name)).body);

    assert.match(flat, /commitConvention/);
    assert.match(flat, /`codeRepo` work/);
  });

  test(`convention-skills: ${name} keeps Conventional Commits in the harness home`, async () => {
    const flat = flatten((await readSkill(name)).body);

    assert.match(flat, /harness home[\s\S]{0,200}?Conventional Commits/i);
  });

  test(`convention-skills: ${name} names both recorded shapes`, async () => {
    const flat = flatten((await readSkill(name)).body);

    assert.match(flat, /conventional/);
    assert.match(flat, /pattern/);
    assert.match(flat, /example/);
  });

  test(`proof-quiet-install-convention: ${name} applies the root commitConvention to every commit in a quiet install`, async () => {
    const flat = flatten((await readSkill(name)).body);

    assert.match(flat, /quiet install[\s\S]{0,300}?no `codeRepo`/);
    assert.match(flat, /root `\.wolven-harness\.json`/);
    assert.match(flat, /every commit[\s\S]{0,80}?harness paths included/);
  });

  test(`proof-quiet-install-no-home-staging: ${name} stages a home path only when named, never add -A or add .`, async () => {
    const flat = flatten((await readSkill(name)).body);

    assert.match(flat, /Stage a path under `\.wolven-harness\/` only when you name it/);
    assert.match(flat, /never stage with `git add -A` or `git add \.`/);
  });
}

test('proof-quiet-install-convention: convention.md records it at the root with no codeRepo', async () => {
  const file = path.join(ROOT, 'templates/.agents/skills/harness-init/references/convention.md');
  const flat = flatten(await readFile(file, 'utf8'));

  assert.match(flat, /quiet install[\s\S]{0,200}?no `codeRepo`/);
  assert.match(flat, /root `\.wolven-harness\.json`/);
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { flatten } from './helpers/prose.js';
import { readSkill } from './helpers/skill-contract.js';

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
}

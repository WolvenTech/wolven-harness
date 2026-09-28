import { test } from 'node:test';
import { assertSkillBasics } from './helpers/skill-contract.js';

test('skill-qmd: passes the shared skill contract checks', async () => {
  await assertSkillBasics('qmd');
});

test('skill-pragmatic-guard: passes the shared skill contract checks', async () => {
  await assertSkillBasics('pragmatic-guard');
});

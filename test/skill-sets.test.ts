import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { CORE_SKILLS, SET_SKILLS, skillFolders } from '../src/setup/skill-sets.js';
import { readSkill } from './helpers/skill-contract.js';

const skillsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'templates', '.agents', 'skills');

test('skill-sets: core and the optional sets partition the template skill folders exactly', async () => {
  const onDisk = (await readdir(skillsDir, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
  const listed = [...CORE_SKILLS, ...Object.values(SET_SKILLS).flat()];

  assert.deepEqual([...listed].sort(), onDisk, 'every skill folder is in exactly one set and every set entry exists');
  assert.equal(new Set(listed).size, listed.length, 'no skill is in two sets');
});

test('skill-sets: the folders for all sets are every template skill', async () => {
  assert.equal(skillFolders(['ship', 'discovery']).length, 18);
  assert.equal(skillFolders([]).length, CORE_SKILLS.length);
});

test('skill-sets: core skills cope with an absent code-commit', async () => {
  const harnessInit = (await readSkill('harness-init')).body;
  assert.match(harnessInit, /`code-commit`\s+is not installed[\s\S]*plain `git commit`/);

  const execute = (await readSkill('code-execute')).body;
  assert.match(execute, /`code-commit` not installed[\s\S]*never\s+commit automatically/);

  const spec = (await readSkill('code-spec')).body;
  assert.match(spec, /PRD is optional input/);
});

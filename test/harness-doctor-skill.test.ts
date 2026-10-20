import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { CORE_SKILLS } from '../src/setup/skill-sets.js';
import { flatten } from './helpers/prose.js';
import { assertSkillBasics, readSkill } from './helpers/skill-contract.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const DOCTOR_CODES = [
  'doctor-config',
  'doctor-entry',
  'doctor-rules',
  'doctor-skills',
  'doctor-docs',
  'doctor-qmd',
  'doctor-code-repo',
  'doctor-not-global',
  'doctor-version-behind',
  'doctor-drift-edited',
  'doctor-drift-stale',
  'doctor-drift-missing',
];

test('skill-harness-doctor: passes the shared skill contract checks', async () => {
  await assertSkillBasics('harness-doctor');
});

test('skill-harness-doctor: is a core skill and AGENTS.md lists it verbatim', async () => {
  const skill = await readSkill('harness-doctor');
  const description = skill.frontmatter.description;

  assert.ok(CORE_SKILLS.includes('harness-doctor'), 'harness-doctor is in CORE_SKILLS');

  const agents = await readFile(path.join(repoRoot, 'AGENTS.md'), 'utf8');
  assert.ok(agents.includes(`| harness-doctor | ${description} |`), 'AGENTS.md carries the skills-table row');
});

test('proof-install-experience-doctor-skill: runs doctor, applies one agreed fix at a time, and keeps the layout', async () => {
  const flat = flatten((await readSkill('harness-doctor')).body);

  assert.match(flat, /Run `wolven-harness doctor`/);
  assert.match(flat, /One fix at a time/);
  assert.match(flat, /apply it only after the Human says yes/);
  assert.match(flat, /Rerun `doctor` before proposing the next one/);
  assert.match(flat, /Keep the layout/);
  assert.match(flat, /layout move is offered only when a check cannot pass otherwise/i);
  assert.match(flat, /Never move, rename or restructure a folder/);

  for (const code of DOCTOR_CODES) {
    assert.ok(flat.includes(code), `the skill names \`${code}\``);
  }
});

test('proof-install-experience-doctor-skill: the closing summary keeps every declined check failing', async () => {
  const flat = flatten((await readSkill('harness-doctor')).body);

  assert.match(flat, /\*\*Still failing\*\* — every finding that remains, declined fixes included/);
  assert.match(flat, /A declined check is still failing, not fixed/);
  assert.match(flat, /Reporting a declined check as fixed or "skipped"/);
});

test('proof-install-experience-doctor-refresh: stale files are replaced with the template and their manifest entry updated; edited files are shown and left alone', async () => {
  const flat = flatten((await readSkill('harness-doctor')).body);

  assert.match(flat, /doctor-drift-stale/);
  assert.match(flat, /Offer to replace the file with the current template's content/);
  assert.match(flat, /update \*\*that file's entry only\*\* in `\.wolven-harness\.manifest\.json`/);
  assert.match(flat, /sha-256/);

  assert.match(flat, /doctor-drift-edited/);
  assert.match(flat, /Show the diff between the file and the current template/);
  assert.match(flat, /change nothing/);
  assert.match(flat, /never merge the two/);
});

test('proof-install-experience-doctor-migrate: a mention-only entry file is routed to harness-init step 0 and the marker is verified after', async () => {
  const flat = flatten((await readSkill('harness-doctor')).body);

  assert.match(flat, /entry file that only mentions `WOLVEN\.md`/);
  assert.match(flat, /lacks `<!-- wolven-harness:start -->`/);
  assert.match(flat, /Route to the `harness-init` skill, step 0/);
  assert.match(flat, /Full or Light/);
  assert.match(flat, /After the fold lands, verify `<!-- wolven-harness:start -->` and `<!-- wolven-harness:end -->`/);
});

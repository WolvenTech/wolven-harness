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
  'doctor-rules-stale',
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

test('skill-harness-doctor: is a core skill and AGENTS.md lists it', async () => {
  const skill = await readSkill('harness-doctor');

  assert.ok(CORE_SKILLS.includes('harness-doctor'), 'harness-doctor is in CORE_SKILLS');

  const agents = await readFile(path.join(repoRoot, 'AGENTS.md'), 'utf8');
  assert.ok(
    agents.includes(`| harness-doctor | ${skill.frontmatter.description} |`),
    'AGENTS.md carries the current skill description',
  );
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

test('proof-install-experience-doctor-refresh: stale files are replaced one at a time after approval; edited files are shown and left alone', async () => {
  const skill = await readSkill('harness-doctor');
  const flat = flatten(skill.body);
  const completeSkill = `${JSON.stringify(skill.frontmatter)} ${skill.body}`;

  assert.match(flat, /doctor-drift-stale/);
  assert.match(flat, /Offer to replace that one file with the current template/i);
  assert.match(flat, /Replace it only after a yes/i);
  assert.match(flat, /rerun `doctor` before proposing another refresh/i);

  assert.match(flat, /doctor-drift-edited/);
  assert.match(flat, /Show the diff between the file and the current template/i);
  assert.match(flat, /change nothing/i);
  assert.match(flat, /Never merge the two or overwrite the edit/i);
  assert.match(flat, /doctor-drift-missing/);
  assert.match(flat, /offer to create the missing file from its current template/);
  assert.doesNotMatch(completeSkill, /manifest/i);
});

test('proof-install-experience-rules-refresh: stale copies and inline blocks refresh only after review and approval', async () => {
  const flat = flatten((await readSkill('harness-doctor')).body);

  assert.match(flat, /doctor-rules-stale/);
  assert.match(flat, /show the diff between each stale copy and the current rule, then ask before changing anything/i);
  assert.match(flat, /On a no, leave it unchanged/);
  assert.match(
    flat,
    /delete only that approved copy, then run `wolven-harness setup` to recreate a stale copy from its current rule/,
  );
  assert.match(flat, /If the source rule no longer exists, explain that the orphan can only be deleted/);
  assert.match(
    flat,
    /replace only the text between `<!-- wolven-harness:rules:start -->` and `<!-- wolven-harness:rules:end -->`/,
  );
  assert.match(flat, /current rule bodies in file-name order, with frontmatter removed/);
  assert.match(flat, /Preserve all surrounding text/);

  const rulesRow = flat.match(/`doctor-rules` \| error \| ([^|]+)/)?.[1] ?? '';
  assert.match(rulesRow, /inline rules block, use `harness-init`/);
  assert.doesNotMatch(rulesRow, /setup.*inline block|inline block.*setup/i);
});

test('proof-install-experience-doctor-migrate: a mention-only entry file is routed to harness-init step 0 and the marker is verified after', async () => {
  const flat = flatten((await readSkill('harness-doctor')).body);

  assert.match(flat, /entry file that only mentions `WOLVEN\.md`/);
  assert.match(flat, /lacks `<!-- wolven-harness:start -->`/);
  assert.match(flat, /Route to the `harness-init` skill, step 0/i);
  assert.match(flat, /Full or Light/);
  assert.match(flat, /After the fold lands, verify `<!-- wolven-harness:start -->` and `<!-- wolven-harness:end -->`/);
});

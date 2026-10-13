import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assertSkillBasics, readSkill } from './helpers/skill-contract.js';

test('skill-journey-map: passes the shared contract, reads as "Use when", and is not ask-only', async () => {
  await assertSkillBasics('journey-map');
  const skill = await readSkill('journey-map');

  assert.match(String(skill.frontmatter.description), /\bUse when\b/);
  assert.equal(skill.frontmatter['disable-model-invocation'], undefined);
  assert.match(skill.body, /accepts? a one-line offer|offer it in one line/i);
  assert.ok(skill.headings.includes('Anti-patterns'));
  assert.match(skill.body, /\(references\/tree-format\.md\)/);
});

test('skill-journey-map: writes beside the doc, or a draft note first, then harness:validate', async () => {
  const skill = await readSkill('journey-map');

  assert.match(skill.body, /docs\/<folder>\/<slug>\/<slug>-map\.json/);
  assert.match(skill.body, /docs\/<folder>\/<slug>\/<slug>-map\.html/);
  assert.match(skill.body, /docs\/notes\/<slug>\/<slug>-note\.md/);
  assert.match(skill.body, /type: note/);
  assert.match(skill.body, /status: draft/);
  assert.match(skill.body, /harness:validate/);
  assert.match(skill.body, /Other skills don't call this one/);
});

test('skill-journey-map: writes only the JSON, builds after every write, and fixes the tree on exit 1', async () => {
  const skill = await readSkill('journey-map');

  assert.match(skill.body, /Write only the JSON/);
  assert.match(skill.body, /Never edit the HTML/i);
  assert.match(skill.body, /node <this skill's folder>\/scripts\/build-map\.mjs <path>\/<slug>-map\.json/);
  assert.match(skill.body, /after every write/i);
  assert.match(skill.body, /exit 1/);
  assert.match(skill.body, /Fix the tree/);
  assert.match(skill.body, /browser tool/);
});

test('skill-journey-map: closes the loop with Copy for agent, a rebuild and a republish to the same URL', async () => {
  const skill = await readSkill('journey-map');

  assert.match(skill.body, /Copy for agent/);
  assert.match(skill.body, /rebuild/i);
  assert.match(skill.body, /same URL/);
  assert.match(skill.body, /Show whole map/);
  assert.match(skill.body, /not saved across reloads/);
});

test('skill-journey-map: calls a map a design aid that moves with its doc folder', async () => {
  const skill = await readSkill('journey-map');

  assert.match(skill.body, /design aid/);
  assert.match(skill.body, /not kept in sync with shipped code/);
  assert.match(skill.body, /move with\s+their doc folder/);
});

test('skill-journey-map: tree-format.md covers the rules, and no file names wayfinder or docs/maps', async () => {
  const skill = await readSkill('journey-map');
  const format = await skill.read('references/tree-format.md');

  for (const kind of ['start', 'choice', 'checklist', 'text', 'waypoint', 'card', 'ticket']) {
    assert.match(format, new RegExp(`\`${kind}\``));
  }
  assert.match(format, /no cycles/i);
  assert.match(format, /only at waypoints/);
  assert.match(format, /recommendation/);
  assert.match(format, /journey-map feedback for/);

  for (const rel of ['SKILL.md', 'references/tree-format.md']) {
    assert.doesNotMatch(await skill.read(rel), /wayfinder|docs\/maps/i, rel);
  }
});

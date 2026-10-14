import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { assertSkillBasics, readSkill } from './helpers/skill-contract.js';

test('proof-wayfinder-skill-basics: passes the shared contract, reads as "Use when", is not ask-only, and credits its origin', async () => {
  await assertSkillBasics('wayfinder');
  const skill = await readSkill('wayfinder');

  assert.match(String(skill.frontmatter.description), /^[A-Z][a-z]+s\b/);
  assert.match(String(skill.frontmatter.description), /\bUse when\b/);
  assert.equal(skill.frontmatter['disable-model-invocation'], undefined);
  assert.match(skill.body, /The Human asks to chart/);
  assert.match(skill.body, /offer a map in\s+one line\. Chart it only if the Human accepts/);
  assert.match(skill.body, /Matt Pocock's MIT-licensed `wayfinder` skill/);
});

test('proof-wayfinder-skill-chart: charts through grilling into the five sections, closed answers and resume', async () => {
  const { body } = await readSkill('wayfinder');

  assert.match(body, /## Chart a map/);
  assert.match(body, /Run `grilling`/);
  assert.match(body, /`type: map` and\s+`status: draft`/);
  for (const name of ['Destination', 'Notes', 'Decisions so far', 'Not yet specified', 'Out of scope']) {
    assert.ok(body.includes(name), name);
  }
  assert.match(body, /numbered from `01`/);
  assert.match(body, /`status: open`/);
  assert.match(body, /recording an\s+answer/);
  assert.match(body, /`status: closed` and a\s+`## Resolution`/);
  assert.match(body, /resume that map/);
  assert.match(body, /write nothing over any file/);
  assert.match(body, /Show the frontier:[\s\S]*Stop\. Do not claim a\s+ticket/);
});

test('proof-wayfinder-skill-work: claims first, resolves by kind, stops after one ticket, handles stale claims and a missing skill', async () => {
  const { body } = await readSkill('wayfinder');

  assert.match(body, /## Work a ticket/);
  assert.match(body, /Claim before any work/);
  assert.match(body, /`claimed_by`/);
  assert.match(body, /`claimed_at`/);
  for (const name of ['research', 'prototype', 'grilling']) {
    assert.match(body, new RegExp(`run \`${name}\``));
  }
  assert.match(body, /`task`/);
  assert.match(body, /`## Resolution`/);
  assert.match(body, /Resolve no second ticket/);
  assert.match(body, /Work one ticket per session/);
  assert.match(body, /older\s+than 72 hours, say it is stale/);
  assert.match(body, /Never take it over or release it silently/);
  assert.match(body, /pnpm exec wolven-harness skills --skills <name>/);
  assert.match(body, /Leave the ticket\s+`open`/);
  assert.match(body, /says no skill was used/);
  assert.match(body, /\]\(references\/ticket-format\.md\)/);
});

test('proof-wayfinder-skill-checklist: lists every pre-commit check', async () => {
  const { body } = await readSkill('wayfinder');
  const checklist = body.slice(body.indexOf('## Pre-commit checklist'));

  assert.ok(checklist.length > 0);
  assert.match(checklist, /Fix each\s+failure before committing/);
  assert.match(checklist, /Each `blocked_by` names an existing ticket other than itself/);
  assert.match(checklist, /No `blocked_by` cycle exists/);
  assert.match(checklist, /Each status matches its closing section/);
  assert.match(checklist, /`claimed_by` and `claimed_at` appear together/);
  assert.match(checklist, /Each `closed` ticket appears once under Decisions so far/);
  assert.match(checklist, /each\s+`out_of_scope` ticket once under Out of scope/);
  assert.match(checklist, /No ticket number is reused and no ticket file is deleted/);
  assert.match(checklist, /No progress count is written/);
  assert.match(body, /harness:validate/);
});

test('skill-wayfinder: ticket-format.md documents the flat subset and section rules', async () => {
  const format = await (await readSkill('wayfinder')).read('references/ticket-format.md');

  assert.match(format, /blocked_by: \["01", "03"\]/);
  assert.match(format, /type: map/);
  for (const name of ['Destination', 'Notes', 'Decisions so far', 'Not yet specified', 'Out of scope']) {
    assert.ok(format.includes(`## ${name}`), name);
  }
  for (const field of ['title', 'ticket', 'status', 'blocked_by', 'undermined_by', 'claimed_by', 'claimed_at']) {
    assert.ok(format.includes(`\`${field}\``), field);
  }
  assert.match(format, /<nn>-<ticket-slug>\.md/);
  assert.match(format, /## Superseded resolution/);
  assert.match(format, /`claimed` has one only when `undermined_by` is set/);
});

test('proof-wayfinder-skill-update: new unknowns, ruling out, undermining and re-resolving in place', async () => {
  const { body } = await readSkill('wayfinder');

  assert.match(body, /## Keep the map current/);
  assert.match(body, /write a new ticket for\s+each, with its `blocked_by`/);
  assert.match(body, /ask the Human to agree\. Then set that\s+ticket's `status: out_of_scope`/);
  assert.match(body, /ask the Human to either remove that\s+`blocked_by` edge or rule the blocked ticket out as well/);
  assert.match(body, /set `undermined_by` on the broken\s+ticket/);
  assert.match(body, /keep its `status: closed`/);
  assert.match(body, /dependents leave the frontier/);
  assert.match(body, /under its own `## Superseded resolution` heading, newest\s+first/);
  assert.match(body, /Clear `undermined_by`, set `status: closed`, and rewrite the\s+ticket's gist/);
});

test('proof-wayfinder-skill-canvas: built on ask or accepted offer, never edited, feedback edits tickets', async () => {
  const { body } = await readSkill('wayfinder');

  assert.match(body, /## The canvas/);
  assert.match(body, /Build it only when the\s+Human asks to see the map, or accepts a one-line offer/);
  assert.match(body, /do not repeat the offer until the\s+next chart or close/);
  assert.match(body, /node <this skill's folder>\/scripts\/build-canvas\.mjs\s+docs\/maps\/<slug>\/<slug>-map\.md/);
  assert.match(body, /Never edit either one/);
  assert.match(body, /Feedback goes into the ticket files/);
  assert.match(body, /Use the wayfinder skill to take ticket/);
  assert.match(body, /wayfinder feedback for/);
  assert.match(body, /note challenges\s+a decided ticket, start the undermine step/);
  assert.match(body, /Build no canvas until\s+`docs\/maps\/\.gitignore` exists/);
});

test('proof-wayfinder-skill-handoff: names the next skill, confirms open tickets, deprecates, archives and rewrites links', async () => {
  const { body } = await readSkill('wayfinder');
  const handoff = body.slice(body.indexOf('## Hand off'), body.indexOf('## Missing install pieces'));

  assert.ok(handoff.length > 0);
  assert.match(handoff, /`create-prd`/);
  assert.match(handoff, /`code-spec`/);
  assert.match(handoff, /Decisions so far/);
  assert.match(handoff, /`open`, `claimed` or undermined/);
  assert.match(handoff, /ask the Human to confirm before archiving/);
  assert.match(handoff, /open questions/);
  assert.match(handoff, /`status: deprecated`/);
  assert.match(handoff, /`docs\/maps\/archived\/<slug>\/`/);
  assert.match(handoff, /Rewrite every relative link in a tracked file/);
});

test('proof-wayfinder-skill-missing-pieces: prints the exact lines and never edits .qmd/index.yml or AGENTS.md', async () => {
  const { body } = await readSkill('wayfinder');
  const section = body.slice(body.indexOf('## Missing install pieces'));

  assert.ok(section.length > 0);
  assert.ok(section.includes('`docs/maps/.gitkeep`'));
  assert.ok(section.includes('  *-canvas.json\n  *-canvas.html\n'));
  assert.ok(section.includes('  maps:\n      path: ./docs/maps\n      pattern: "!(archived)/**/*.md"\n'));
  assert.ok(
    section.includes(
      '| `docs/maps/<slug>/` | Maps of a large decision: `docs/maps/<slug>/<slug>-map.md` plus one file per ticket |',
    ),
  );
  assert.match(
    section,
    /Do not edit `\.qmd\/index\.yml`, `WOLVEN\.md` or\s+`AGENTS\.md` yourself; ask the Human to add the lines/,
  );
  assert.match(section, /The router row, in the table in `WOLVEN\.md`/);
  const flat = body.replace(/\s+/g, ' ');
  assert.doesNotMatch(flat, /(?<!not )\b(edit|append to|modify|write to) `(\.qmd\/index\.yml|WOLVEN\.md|AGENTS\.md)`/i);
});

test('proof-wayfinder-listings: README, the guide and AGENTS.md list wayfinder and twenty skills', async () => {
  const [readme, guide, agents] = await Promise.all(
    ['README.md', 'site/skills.md', 'AGENTS.md'].map((file) =>
      readFile(new URL(`../${file}`, import.meta.url), 'utf8'),
    ),
  );
  const { frontmatter } = await readSkill('wayfinder');

  assert.match(readme, /^- `discovery`:.*`wayfinder`/m);
  assert.match(readme, /`wayfinder`.*need the discovery set/);
  assert.match(readme, /All 20 skills/);
  assert.match(guide, /Twenty skills are available/);
  assert.match(guide, /^\| `wayfinder` \|/m);
  assert.ok(agents.includes(`| wayfinder | ${frontmatter.description} |`));
});

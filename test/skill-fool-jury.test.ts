import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const skillsRoot = path.join(here, '..', 'templates', '.agents', 'skills');

test('fool-jury: the-fool requires challenges, user response, then synthesis without forcing a decision', async () => {
  const body = await readFile(path.join(skillsRoot, 'the-fool', 'SKILL.md'), 'utf8');
  assert.match(body, /3–5|3-5/);
  assert.match(body, /[Ww]ait.*[Hh]uman|[Hh]uman's response|before synthesizing/);
  assert.match(body, /[Ss]ynthesiz/);
  assert.match(body, /[Nn]ot force a decision|Do \*\*not\*\* force a decision|does not force a decision/i);
  assert.match(body, /[Mm]ode selection|Ask explicitly/);
});

test('fool-jury: the-fool ships MIT attribution', async () => {
  const notice = await readFile(path.join(skillsRoot, 'the-fool', 'NOTICE'), 'utf8');
  const license = await readFile(path.join(skillsRoot, 'the-fool', 'LICENSE'), 'utf8');
  assert.match(notice, /Jeffallan\/claude-skills/);
  assert.match(license, /MIT License/);
});

test('fool-jury: the-jury requires independent first round, dissent, confidence, and a concrete test', async () => {
  const body = await readFile(path.join(skillsRoot, 'the-jury', 'SKILL.md'), 'utf8');
  assert.match(body, /[Ii]ndependent first-round/);
  assert.match(body, /[Bb]efore.*deliberat|[Dd]eliberation starts only after/i);
  assert.match(body, /[Dd]issent/);
  assert.match(body, /[Cc]onfidence/);
  assert.match(body, /[Cc]oncrete test/);
});

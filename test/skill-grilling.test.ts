import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { run } from './helpers/fixture.js';
import { readSkill, assertSkillBasics, assertNoRuntimeToolNames, renderInto } from './helpers/skill-contract.js';

test('skill-grilling: passes the shared skill contract checks', async () => {
  await assertSkillBasics('grilling');
});

test('skill-grilling: maps the decision as a design tree worked in frontier rounds', async () => {
  const skill = await readSkill('grilling');

  assert.match(skill.body, /design tree/i);
  assert.match(skill.body, /\bfrontier\b/i);
});

test('skill-grilling: asks one question per round with the recommended option listed first', async () => {
  const skill = await readSkill('grilling');

  assert.match(skill.body, /single question per round/i);
  assert.match(skill.body, /\(Recommended\)/);
  assert.match(skill.body, /recommended one listed first/i);
});

test('skill-grilling: labels every option so the answer can be the label alone', async () => {
  const skill = await readSkill('grilling');

  assert.match(skill.body, /^a\) \(Recommended\)/m);
  assert.match(skill.body, /^b\) /m);
  assert.match(skill.body, /label every option with a letter/i);
  assert.match(skill.body, /typing just the label/i);
  assert.match(skill.body, /free-text answer/i);
});

test('skill-grilling: stops after every question instead of answering for the other side', async () => {
  const skill = await readSkill('grilling');

  assert.match(skill.body, /stop after every question/i);
});

test('skill-grilling: has the agent look up facts instead of asking for them', async () => {
  const skill = await readSkill('grilling');

  assert.match(skill.body, /finding facts is your job/i);
});

test('skill-grilling: is done only when the frontier is empty and confirmed', async () => {
  const skill = await readSkill('grilling');

  assert.match(skill.body, /done only when the frontier is empty/i);
  assert.match(skill.body, /confirms the shared understanding/i);
});

test('skill-grilling: names no runtime tool outside a guard clause', async () => {
  const skill = await readSkill('grilling');

  assertNoRuntimeToolNames(skill.body);
});

test('skill-grilling: is model-invocable', async () => {
  const skill = await readSkill('grilling');

  assert.equal('disable-model-invocation' in skill.frontmatter, false);
  assert.ok(!skill.files.includes('agents/openai.yaml'));
});

test('skill-grilling: renderInto renders a template into a fixture that passes validate', async () => {
  const tmpDir = await mkdtemp(path.join(tmpdir(), 'skill-grilling-template-'));
  const templatePath = path.join(tmpDir, 'note.md');
  await writeFile(
    templatePath,
    [
      '---',
      'type: note',
      'title: <title>',
      'description: {{description}}',
      'status: draft',
      '---',
      '',
      '# <title>',
      '',
      '{{body}}',
      '',
    ].join('\n'),
    'utf8',
  );

  const cwd = await renderInto(
    {},
    templatePath,
    'docs/notes/render-check/render-check-note.md',
    {
      title: 'Render check',
      description: 'proves the render helper produces a passing doc',
      body: 'Rendered from a template placeholder.',
    },
  );

  const result = await run(['validate'], { cwd });

  assert.equal(result.code, 0);
});

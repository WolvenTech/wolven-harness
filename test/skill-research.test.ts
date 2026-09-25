import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from './helpers/fixture.js';
import { readSkill, assertSkillBasics, renderInto } from './helpers/skill-contract.js';

const STEPS = ['1. Frame', '2. QMD first', '3. Primary sources', '4. Cited note', '5. Verify', '6. Finalize'];

test('skill-research: passes the shared skill contract checks, including the harness:validate mention', async () => {
  await assertSkillBasics('research', { requireHarnessValidate: true });
});

test('skill-research: is model-invocable', async () => {
  const skill = await readSkill('research');

  assert.equal('disable-model-invocation' in skill.frontmatter, false);
  assert.ok(!skill.files.includes('agents/openai.yaml'));
});

test('skill-research: names qmd as the local search step', async () => {
  const skill = await readSkill('research');

  assert.match(skill.body, /`qmd`/);
});

test('skill-research: runs frame, QMD first, primary sources, cited note, verify, and finalize in order', async () => {
  const skill = await readSkill('research');

  const positions = STEPS.map((step) => {
    const index = skill.body.indexOf(step);
    assert.ok(index >= 0, `missing step "${step}"`);
    return index;
  });

  for (let i = 1; i < positions.length; i++) {
    assert.ok(positions[i] > positions[i - 1], `step "${STEPS[i]}" must come after "${STEPS[i - 1]}"`);
  }
});

test('skill-research: primary sources only, every claim cited', async () => {
  const skill = await readSkill('research');

  assert.match(skill.body, /primary sources? only/i);
  assert.match(skill.body, /never (the )?citation on its own|never cited on its own/i);
  assert.match(skill.body, /every claim.*carries a citation/i);
});

test('skill-research: refuses a secondary-only summary', async () => {
  const skill = await readSkill('research');

  assert.match(skill.body, /refuse/i);
  assert.match(skill.body, /secondary/i);
});

test('skill-research: verify re-opens each cited source before finalize sets stable and runs harness:validate', async () => {
  const skill = await readSkill('research');

  const verifySection = skill.body.split(/^### 5\. Verify/m)[1]?.split(/^### /m)[0] ?? '';
  assert.match(verifySection, /re-open/i);

  const finalizeSection = skill.body.split(/^### 6\. Finalize/m)[1]?.split(/^## /m)[0] ?? '';
  assert.match(finalizeSection, /status: stable/);
  assert.match(finalizeSection, /harness:validate/);
});

test('skill-research: notes land at docs/notes/<slug>/<slug>-note.md with type: note, sources allowed beside it', async () => {
  const skill = await readSkill('research');

  assert.match(skill.body, /docs\/notes\/<slug>\/<slug>-note\.md/);
  assert.match(skill.body, /`type: note`/);
  assert.match(skill.body, /beside it|beside the note/i);

  const template = await skill.read('references/note-template.md');
  assert.match(template, /^type: note$/m);
  assert.match(template, /^status: draft$/m);
});

test('skill-research: note-template.md carries question, findings, sources, and open questions sections', async () => {
  const skill = await readSkill('research');
  const template = await skill.read('references/note-template.md');

  assert.match(template, /^## Question$/m);
  assert.match(template, /^## Findings$/m);
  assert.match(template, /^## Sources$/m);
  assert.match(template, /^## Open questions$/m);
});

test('skill-research: renderInto renders the note template into a fixture that passes validate', async () => {
  const cwd = await renderInto(
    {},
    '.agents/skills/research/references/note-template.md',
    'docs/notes/widget-latency/widget-latency-note.md',
    {
      title: 'Widget latency — note',
      description: 'Answers whether the widget endpoint caches its response.',
    },
  );

  const result = await run(['validate'], { cwd });

  assert.equal(result.code, 0, result.stdout + result.stderr);
});

test('skill-research: a sources.md extra with no frontmatter beside the note still passes validate', async () => {
  const cwd = await renderInto(
    {
      'docs/notes/widget-latency/sources.md': '# Saved excerpts\n\nRaw text pulled while researching, kept for reference.\n',
    },
    '.agents/skills/research/references/note-template.md',
    'docs/notes/widget-latency/widget-latency-note.md',
    {
      title: 'Widget latency — note',
      description: 'Answers whether the widget endpoint caches its response.',
    },
  );

  const result = await run(['validate'], { cwd });

  assert.equal(result.code, 0, result.stdout + result.stderr);
});

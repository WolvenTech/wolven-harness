import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');

async function readPair(rel: string): Promise<{ live: string; template: string }> {
  const [live, template] = await Promise.all([
    readFile(path.join(repoRoot, rel), 'utf8'),
    readFile(path.join(repoRoot, 'templates', rel), 'utf8'),
  ]);
  return { live, template };
}

test('proof-qmd-empty-index-mirrors-match: rule and skill templates match live copies', async () => {
  for (const rel of ['.agents/rules/qmd-first.md', '.agents/skills/qmd/SKILL.md'] as const) {
    const { live, template } = await readPair(rel);
    assert.equal(live, template, `${rel} must match templates/${rel}`);
  }
});

test('proof-qmd-empty-index-readiness-guidance: qmd-first names qmd status and empty-index update', async () => {
  const { live: rule } = await readPair('.agents/rules/qmd-first.md');

  assert.match(rule, /## Index readiness/);
  assert.match(rule, /qmd status/);
  assert.match(rule, /0 files indexed/);
  assert.match(rule, /qmd update/);
  assert.match(rule, /Do not run `qmd embed` for this[\s\S]*bootstrap/);
});

test('proof-qmd-empty-index-rule-procedure: readiness precedes ADR-first search examples', async () => {
  const { live: rule } = await readPair('.agents/rules/qmd-first.md');

  const readiness = rule.indexOf('## Index readiness');
  const search = rule.indexOf('## Search ADRs first');
  assert.ok(readiness >= 0 && search > readiness, 'Index readiness must appear before ADR-first search');
});

test('proof-qmd-empty-index-populated-no-mutate: populated index stays query-only in rule', async () => {
  const { live: rule } = await readPair('.agents/rules/qmd-first.md');

  assert.match(rule, /Total is greater than zero/);
  assert.match(rule, /Do not run unasked `qmd update`/);
  assert.match(rule, /Do not run unasked `qmd update`[\s\S]*`qmd embed`/);
});

test('proof-qmd-empty-index-skill-antipattern-refine: skill distinguishes empty bootstrap from populated mutation', async () => {
  const { live: skill } = await readPair('.agents/skills/qmd/SKILL.md');

  assert.match(skill, /Empty index bootstrap/);
  assert.match(skill, /qmd status/);
  assert.match(skill, /0 files indexed/);
  assert.match(skill, /Populated index/);
  assert.match(skill, /already-populated index during routine search/);
  assert.match(skill, /`qmd collection add`/);
});

test('proof-qmd-empty-index-readiness-guidance: skill allows bootstrap update without maintenance ask', async () => {
  const { live: skill } = await readPair('.agents/skills/qmd/SKILL.md');

  assert.match(skill, /even without a separate maintenance ask/);
  assert.match(skill, /Do not run `qmd embed` for this bootstrap/);
});

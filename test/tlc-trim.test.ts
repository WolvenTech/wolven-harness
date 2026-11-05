import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel: string): Promise<string> => readFile(path.join(repoRoot, rel), 'utf8');

test('proof-tlc-trim-final-check: code-execute no longer says the final check proves the unit', async () => {
  const text = await read('.agents/skills/code-execute/SKILL.md');
  assert.doesNotMatch(text, /proves the unit/);
  assert.match(text, /runs the checks and records their outputs/);
});

test('proof-tlc-trim-assertion-adequacy: code-execute records author assertion inspection', async () => {
  const text = await read('.agents/skills/code-execute/SKILL.md');
  assert.match(text, /expected outcome, assertion, and the plausible wrong implementation/);
});

test('proof-tlc-trim-capture-authority: code-spec records binding capture vs inspiration', async () => {
  const text = await read('.agents/skills/code-spec/SKILL.md');
  assert.match(text, /binding unless labeled inspiration/);
});

test('proof-tlc-trim-notice: the four skills ship a NOTICE in both trees', async () => {
  for (const skill of ['code-spec', 'code-plan', 'code-execute', 'code-review']) {
    for (const root of ['.agents/skills', 'templates/.agents/skills']) {
      const notice = await read(path.join(root, skill, 'NOTICE'));
      assert.match(notice, /Felipe Rodrigues/);
      assert.match(notice, /CC-BY-4\.0/);
    }
  }
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { classifyFrontmatter } from '../src/frontmatter.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RULES = ['comments.md', 'project-skill-precedence.md', 'qmd-first.md', 'secrets.md', 'yagni-strict.md'] as const;
const RULE_DIRS = ['.agents/rules', 'templates/.agents/rules'] as const;

async function frontmatterOf(rel: string): Promise<Record<string, unknown>> {
  const read = classifyFrontmatter(await readFile(path.join(repoRoot, rel), 'utf8'));
  if (read.kind !== 'ok') assert.fail(`${rel}: expected parsed frontmatter, got ${read.kind}`);
  return read.value;
}

function flat(text: string): string {
  return text.replace(/\s+/g, ' ');
}

test('proof-install-experience-rule-frontmatter', async () => {
  for (const dir of RULE_DIRS) {
    for (const rule of RULES) {
      const rel = `${dir}/${rule}`;
      const frontmatter = await frontmatterOf(rel);

      assert.equal('trigger' in frontmatter, false, `${rel} omits trigger`);
      assert.equal(frontmatter.alwaysApply, true, `${rel} keeps alwaysApply: true`);
      assert.equal(typeof frontmatter.description, 'string', `${rel} carries a description`);
      assert.ok(
        typeof frontmatter.description === 'string' && frontmatter.description.length > 0,
        `${rel} description is non-empty`,
      );
    }
  }

  for (const rule of RULES) {
    const [installed, template] = await Promise.all([
      readFile(path.join(repoRoot, '.agents/rules', rule), 'utf8'),
      readFile(path.join(repoRoot, 'templates/.agents/rules', rule), 'utf8'),
    ]);
    assert.equal(installed, template, `${rule} copies stay byte-identical`);
  }

  const entryModes = await readFile(
    path.join(repoRoot, '.agents/skills/harness-init/references/entry-modes.md'),
    'utf8',
  );
  const entryModesTemplate = await readFile(
    path.join(repoRoot, 'templates/.agents/skills/harness-init/references/entry-modes.md'),
    'utf8',
  );
  assert.equal(entryModes, entryModesTemplate, 'entry-modes copies stay byte-identical');
  const entryModesFlat = flat(entryModes);
  assert.match(entryModesFlat, /selected runtime reads rules inline \(`codex` or `antigravity`\)/);
  assert.match(entryModesFlat, /selected runtimes use native rules mode/);
  assert.match(entryModesFlat, /any selected runtime uses inline rules mode \(`codex` or `antigravity`\)/);
  assert.equal((entryModesFlat.match(/runtime with inline rules mode \(`codex` or `antigravity`\)/g) ?? []).length, 3);
  assert.match(
    entryModesFlat,
    /selected runtime with inline rules mode \(`codex` or `antigravity`\) reads the standing rules/,
  );
});

test('proof-install-experience-tool-report', async () => {
  const wolven = await readFile(path.join(repoRoot, 'templates/WOLVEN.md'), 'utf8');

  assert.doesNotMatch(wolven, /loads? unconditionally/i, 'WOLVEN.md drops the false loading claim');
  for (const rule of RULES) {
    assert.ok(wolven.includes(`.agents/rules/${rule}`), `WOLVEN.md cites .agents/rules/${rule}`);
  }

  for (const dir of RULE_DIRS) {
    const body = flat(await readFile(path.join(repoRoot, dir, 'qmd-first.md'), 'utf8'));

    assert.match(body, /harness tool/i, `${dir}/qmd-first.md names a harness tool`);
    assert.match(body, /the Human/i, `${dir}/qmd-first.md reports to the Human`);
    assert.match(body, /which tool failed/i, `${dir}/qmd-first.md names the tool that failed`);
    assert.match(body, /the error/i, `${dir}/qmd-first.md gives the error`);
    assert.match(body, /before .*fallback/i, `${dir}/qmd-first.md reports before falling back`);
  }
});

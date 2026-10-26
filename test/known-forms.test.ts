import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { build, currentForms, readTable, serialize, sha256, TABLE_PATH, TAGS } from '../scripts/known-forms.mjs';
import { applySetMarkers } from '../src/setup/render-wolven.js';
import { SKILL_SETS } from '../src/setup/skill-sets.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

type Table = { forms: Record<string, string[]> };

function hasTag(tag: string): boolean {
  try {
    execFileSync('git', ['rev-parse', '--verify', '--quiet', `refs/tags/${tag}`], { cwd: root, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function missing(required: Table, committed: Table): string[] {
  const out: string[] = [];
  for (const [installed, shas] of Object.entries(required.forms)) {
    for (const sha of shas) {
      if (!committed.forms[installed]?.includes(sha)) out.push(`${installed} ${sha}`);
    }
  }
  return out;
}

function installedPath(template: string): string {
  return (
    (
      {
        '.qmd/gitignore': '.qmd/.gitignore',
        'docs/maps/gitignore': 'docs/maps/.gitignore',
      } as Record<string, string>
    )[template] ?? template
  );
}

test('proof-install-experience-known-forms: every current template form is in the committed table', () => {
  const committed = readTable(root) as Table;
  assert.deepEqual(missing(currentForms(root) as Table, committed), []);
});

test('proof-install-experience-known-forms: every rendered .qmd/index.yml form is in the committed table', () => {
  const committed = readTable(root) as Table;
  const template = readFileSync(path.join(root, 'templates', '.qmd', 'index.yml'), 'utf8');
  const choices = Array.from({ length: 2 ** SKILL_SETS.length }, (_, mask) =>
    SKILL_SETS.filter((_set, i) => (mask >> i) & 1),
  );
  for (const sets of choices) {
    const sha = sha256(Buffer.from(applySetMarkers(template, sets), 'utf8'));
    assert.ok(committed.forms['.qmd/index.yml']?.includes(sha), `.qmd/index.yml for sets [${sets}] is missing`);
  }
});

test('proof-install-experience-known-forms: removing a current form from the table is detected', () => {
  const committed = readTable(root) as Table;
  const current = currentForms(root) as Table;
  for (const [installed, shas] of Object.entries(current.forms)) {
    for (const sha of shas) {
      const trimmed: Table = {
        forms: { ...committed.forms, [installed]: committed.forms[installed]?.filter((form) => form !== sha) ?? [] },
      };
      assert.ok(missing({ forms: { [installed]: [sha] } }, trimmed).length > 0, `${installed} ${sha}`);
    }
  }
});

test('proof-install-experience-known-forms: the committed table is what the generator writes', () => {
  assert.equal(readFileSync(path.join(root, TABLE_PATH), 'utf8'), serialize(build(root)));
});

test('proof-install-experience-known-forms: every form a release tag wrote is in the committed table', (t) => {
  const tags = (TAGS as string[]).filter(hasTag);
  if (tags.length === 0) return t.skip('no release tags in this clone');
  const committed = readTable(root) as Table;
  for (const tag of tags) {
    const files = execFileSync('git', ['ls-tree', '-r', '--name-only', tag, '--', 'templates/'], {
      cwd: root,
      encoding: 'utf8',
    })
      .trim()
      .split('\n');
    for (const file of files) {
      if (!file) continue;
      const installed = installedPath(file.slice('templates/'.length));
      if (installed === 'WOLVEN.md' || installed === 'AGENTS.md') continue;
      const bytes = execFileSync('git', ['show', `${tag}:${file}`], { cwd: root, maxBuffer: 64 * 1024 * 1024 });
      assert.ok(committed.forms[installed]?.includes(sha256(bytes)), `${tag} ${installed}`);
    }
  }
});

test('proof-install-experience-known-forms: the table leaves WOLVEN.md and AGENTS.md out', () => {
  const committed = readTable(root) as Table;
  assert.equal(committed.forms['WOLVEN.md'], undefined);
  assert.equal(committed.forms['AGENTS.md'], undefined);
});

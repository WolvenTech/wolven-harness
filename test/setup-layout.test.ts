import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { renderWolven } from '../src/setup/render-wolven.js';
import type { Context } from '../src/setup/types.js';
import { makeIo } from './helpers/io.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const repoTemplatesDir = path.join(repoRoot, 'templates');

const DOC_FOLDERS = ['prds', 'specs', 'notes', 'deferrals'] as const;
const DIR_TYPE: Record<string, string> = {
  prds: 'prd',
  specs: 'spec',
  notes: 'note',
  deferrals: 'deferral',
};

test('setup-layout: .qmd/index.yml has one collection per folder with the doc-folder pattern', async () => {
  const raw = await readFile(path.join(repoTemplatesDir, '.qmd', 'index.yml'), 'utf8');
  const parsed = parse(raw) as { collections: Record<string, { path: string; pattern: string }> };

  assert.equal(parsed.collections.adrs.pattern, '*.md');
  assert.equal(parsed.collections.adrs.path, './docs/adrs');

  for (const folder of DOC_FOLDERS) {
    const collection = parsed.collections[folder];
    assert.ok(collection, `collection "${folder}" exists`);
    assert.equal(collection.path, `./docs/${folder}`);
    assert.equal(collection.pattern, '!(archived)/**/*.md', `collection "${folder}" uses the doc-folder pattern`);
  }

  assert.deepEqual(Object.keys(parsed.collections).sort(), ['adrs', ...DOC_FOLDERS].sort());
});

test('setup-layout: WRITING-PROFILE.md documents the layout, the type map, and stays <= 80 lines', async () => {
  const raw = await readFile(path.join(repoTemplatesDir, 'docs', 'WRITING-PROFILE.md'), 'utf8');
  const lineCount = raw.split('\n').length;

  assert.ok(lineCount <= 80, `WRITING-PROFILE.md is ${lineCount} lines, expected <= 80`);

  assert.match(raw, /docs\/<folder>\/<slug>\/<slug>-<type>\.md/);
  assert.match(raw, /docs\/adrs\/adr-NNN-<slug>\.md/);

  for (const [folder, type] of Object.entries(DIR_TYPE)) {
    assert.ok(raw.includes(`\`${folder}\``), `mentions folder "${folder}"`);
    assert.ok(raw.includes(`\`${type}\``), `mentions type "${type}"`);
  }
});

test('setup-layout: WOLVEN.md router shows docs/<folder>/<slug>/<slug>-<type>.md', async () => {
  const ctx: Context = { root: '/unused', templatesDir: repoTemplatesDir, io: makeIo('/unused') };
  const rendered = await renderWolven(ctx);

  assert.match(rendered, /docs\/<folder>\/<slug>\/<slug>-<type>\.md/);

  for (const folder of DOC_FOLDERS) {
    assert.ok(rendered.includes(`docs/${folder}/<slug>/`), `router shows docs/${folder}/<slug>/`);
  }

  assert.ok(rendered.includes('docs/adrs/'));
  assert.ok(rendered.includes('adr-NNN-<slug>.md'));
});

test('setup-layout: pragmatic-guard skill and yagni-strict rule write docs/deferrals/<slug>/<slug>-deferral.md', () => {
  const pragmaticGuard = readFileSync(
    path.join(repoTemplatesDir, '.agents', 'skills', 'pragmatic-guard', 'SKILL.md'),
    'utf8',
  );
  const yagniStrict = readFileSync(path.join(repoTemplatesDir, '.agents', 'rules', 'yagni-strict.md'), 'utf8');

  for (const content of [pragmaticGuard, yagniStrict]) {
    assert.match(content, /docs\/deferrals\/<slug>\/<slug>-deferral\.md/);
    assert.doesNotMatch(content, /docs\/deferrals\/[a-z0-9-]+\.md[^/]/);
  }
});

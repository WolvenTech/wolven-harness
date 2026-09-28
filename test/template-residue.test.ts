import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { walkFiles } from './helpers/walk.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const templatesRoot = path.resolve(here, '..', 'templates');

/** Residue that must not appear anywhere under `templates/`, including `docs/` and `WOLVEN.md`. */
const GLOBAL: readonly { label: string; pattern: RegExp }[] = [
  { label: 'source-repo collection', pattern: /\bcanon\b|docs\/(canon|concepts|sources)\b|-c (canon|concepts|sources)\b|qmd\/config\.yml/ },
  { label: 'source-repo residue', pattern: /clickup|board-|area-context|wayfind|okf-qmd-kit|docs\/canon|pragmatic-guard\.config|bugbot|cowork|compozy|agentic-mkt/i },
  { label: 'persona or threshold rule', pattern: /\bwriter\b|board-decompose|fast-draft|docs\/index|\.agents\/agents|\bthreshold\b|\bN\s*=/i },
  { label: 'benchmarked search tool', pattern: /\bkb\b/i },
  { label: 'classification vocabulary', pattern: /cynefin|\bdice\b|\bexecutor\b/i },
];

/** Bans that are true for one path and false for another, so they cannot be global. */
const SCOPED: readonly { label: string; test: (rel: string) => boolean; pattern: RegExp }[] = [
  { label: 'Cursor in code-review', test: (rel) => rel.startsWith('.agents/skills/code-review/'), pattern: /cursor/i },
  { label: 'board or area in handoff', test: (rel) => rel.startsWith('.agents/skills/handoff/'), pattern: /\bboard\b|\barea\b/i },
  { label: 'board, ticket, or map in prototype', test: (rel) => rel.startsWith('.agents/skills/prototype/'), pattern: /\b(board|ticket|map|wayfinder)\b/i },
  { label: 'board or ticket in create-prd', test: (rel) => rel.startsWith('.agents/skills/create-prd/'), pattern: /\bboard\b|\bticket\b/i },
  { label: 'canon or area in code-spec', test: (rel) => rel === '.agents/skills/code-spec/SKILL.md', pattern: /\bcanon\b|\barea\b/i },
  {
    label: 'source-repo path in commit examples',
    test: (rel) => rel === '.agents/skills/code-commit/references/commit-examples.md',
    pattern: /\.agents\/skills\/|docs\/ideas|docs\/projects|\bokf\b/i,
  },
  {
    label: 'concrete ADR token in a skill',
    test: (rel) =>
      rel.startsWith('.agents/skills/adr/') ||
      rel.startsWith('.agents/skills/code-review/') ||
      rel === '.agents/skills/code-spec/references/TEMPLATE.md',
    pattern: /\bADR-\d{3}\b|\badr-\d{3}-[a-z0-9-]+/,
  },
];

test('template-residue: no source-repo vocabulary anywhere under templates/', async () => {
  const hits: string[] = [];
  for (const rel of await walkFiles(templatesRoot)) {
    const content = await readFile(path.join(templatesRoot, rel), 'utf8');
    for (const rule of GLOBAL) {
      const found = content.match(rule.pattern);
      if (found) hits.push(`${rel}: ${rule.label} (${found[0]})`);
    }
    for (const rule of SCOPED) {
      if (!rule.test(rel)) continue;
      const found = content.match(rule.pattern);
      if (found) hits.push(`${rel}: ${rule.label} (${found[0]})`);
    }
  }
  assert.deepEqual(hits, []);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from './helpers/fixture.js';
import { readSkill, assertSkillBasics, renderInto } from './helpers/skill-contract.js';

/** One parsed GitHub-flavored markdown table: header cells and data rows, cell text trimmed. */
interface MdTable {
  headers: string[];
  rows: string[][];
}

function isTableRow(line: string): boolean {
  return /^\s*\|.*\|\s*$/.test(line);
}

function isSeparatorRow(line: string): boolean {
  return isTableRow(line) && /^[\s|:-]+$/.test(line) && line.includes('-');
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

/** Parses every `| … |` table (header + separator + data rows) out of a markdown document. */
function parseMarkdownTables(md: string): MdTable[] {
  const lines = md.split('\n');
  const tables: MdTable[] = [];
  let i = 0;
  while (i < lines.length) {
    if (isTableRow(lines[i]) && i + 1 < lines.length && isSeparatorRow(lines[i + 1])) {
      const headers = splitRow(lines[i]);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && isTableRow(lines[i])) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      tables.push({ headers, rows });
    } else {
      i++;
    }
  }
  return tables;
}

/** Every value found in the column named `columnName` (case-insensitive) across every table in `tables` that has one. */
function valuesInColumn(tables: MdTable[], columnName: string): string[] {
  const values: string[] = [];
  for (const table of tables) {
    const idx = table.headers.findIndex((h) => h.toLowerCase() === columnName.toLowerCase());
    if (idx === -1) continue;
    for (const row of table.rows) {
      if (row[idx] !== undefined) values.push(row[idx]);
    }
  }
  return values;
}

/** Strips a single pair of surrounding backticks, if present. */
function unbacktick(s: string): string {
  const m = s.match(/^`([^`]*)`$/);
  return m ? m[1] : s;
}

test('skill-code-plan: passes the shared skill contract checks', async () => {
  await assertSkillBasics('code-plan', { requireHarnessValidate: true });
});

test('skill-code-plan: is model-invocable', async () => {
  const skill = await readSkill('code-plan');
  assert.equal('disable-model-invocation' in skill.frontmatter, false);
  assert.ok(!skill.files.includes('agents/openai.yaml'));
});

test('skill-code-plan: work units table names Depends, Owns, Subagent, and Done when', async () => {
  const example = await (await readSkill('code-plan')).read('references/EXAMPLE-units.md');
  const tables = parseMarkdownTables(example);

  const unitsTable = tables.find((t) => {
    const lower = t.headers.map((h) => h.toLowerCase());
    return lower.includes('depends') && lower.includes('owns') && lower.includes('subagent') && lower.includes('done when');
  });

  assert.ok(unitsTable, 'expected a work-units table with #, Unit, Depends, Owns, Subagent, Done when columns');
});

test('skill-code-plan: writes the plan at docs/specs/<slug>/<slug>-plan.md next to the spec', async () => {
  const skill = await readSkill('code-plan');
  assert.match(skill.body, /docs\/specs\/<slug>\/<slug>-plan\.md/);
  assert.match(skill.body, /docs\/specs\/<slug>\/<slug>-spec\.md/);
});

test('skill-code-plan: documents phase stops with an explicit STOP gate', async () => {
  const skill = await readSkill('code-plan');
  assert.ok(skill.headings.some((h) => /-stop pattern/i.test(h)));

  const example = await skill.read('references/EXAMPLE-units.md');
  assert.match(example, /STOP/);

  const tables = parseMarkdownTables(example);
  const stopsTable = tables.find((t) => {
    const lower = t.headers.map((h) => h.toLowerCase());
    return lower.includes('stop') && lower.includes('gate');
  });
  assert.ok(stopsTable, 'expected a Stop/After/Gate table');
});

test('skill-code-plan: carries Unresolved rows as a typed table without inventing a disposition', async () => {
  const skill = await readSkill('code-plan');
  assert.ok(skill.headings.some((h) => /unresolved/i.test(h)));
  assert.match(skill.body, /Disposition/);
  assert.match(skill.body, /never invent a\s*\n?\s*Disposition/i);

  const example = await skill.read('references/EXAMPLE-units.md');
  const tables = parseMarkdownTables(example);
  const unresolvedTable = tables.find((t) => t.headers.map((h) => h.toLowerCase()).includes('disposition'));
  assert.ok(unresolvedTable, 'expected a typed Unresolved table with a Disposition column');
  for (const row of unresolvedTable!.rows) {
    const idx = unresolvedTable!.headers.findIndex((h) => h.toLowerCase() === 'disposition');
    assert.match(row[idx], /empty until decided/i, 'example Disposition must stay empty, never invented');
  }
});

test('skill-code-plan: has a safety valve section', async () => {
  const skill = await readSkill('code-plan');
  assert.ok(skill.headings.some((h) => /safety valve/i.test(h)));
});

test('skill-code-plan: the documented Subagent values are exactly spawn and inline', async () => {
  const skill = await readSkill('code-plan');

  const section = skill.body.split(/^## Subagent column/m)[1]?.split(/\n## /)[0] ?? '';
  assert.ok(section.length > 0, 'expected a "## Subagent column" section');

  const tables = parseMarkdownTables(section);
  const legendTable = tables.find((t) => t.headers.map((h) => h.toLowerCase()).includes('subagent'));
  assert.ok(legendTable, 'expected a Subagent legend table');

  const idx = legendTable!.headers.findIndex((h) => h.toLowerCase() === 'subagent');
  const values = new Set(legendTable!.rows.map((row) => unbacktick(row[idx])));

  assert.deepEqual(values, new Set(['spawn', 'inline']));
});

test('skill-code-plan: the EXAMPLE Subagent cells only use spawn or inline, never empty', async () => {
  const skill = await readSkill('code-plan');
  const example = await skill.read('references/EXAMPLE-units.md');
  const tables = parseMarkdownTables(example);

  const subagentValues = valuesInColumn(tables, 'Subagent').map(unbacktick);
  assert.ok(subagentValues.length > 0, 'expected at least one Subagent cell in the EXAMPLE');

  for (const value of subagentValues) {
    assert.ok(value === 'spawn' || value === 'inline', `unexpected Subagent value "${value}" — must be "spawn" or "inline"`);
  }
});

test('skill-code-plan: no writer persona, board-decompose, or N-threshold rule', async () => {
  const skill = await readSkill('code-plan');

  for (const rel of skill.files.filter((f) => f.endsWith('.md'))) {
    const content = await skill.read(rel);
    assert.doesNotMatch(content, /\bwriter\b/i, `${rel} must not mention a writer persona`);
    assert.doesNotMatch(content, /board-decompose/i, `${rel} must not mention board-decompose`);
    assert.doesNotMatch(content, /\bthreshold\b/i, `${rel} must not name a threshold rule`);
    assert.doesNotMatch(content, /\bN\s*=/, `${rel} must not name an "N =" line-count rule`);
  }
});

test('skill-code-plan: TEMPLATE-plan.md renders next to a spec and passes validate', async () => {
  const slug = 'sample-feature';
  const specDoc = [
    '---',
    'type: spec',
    'title: Sample feature',
    'description: A minimal locked spec, present only to satisfy the plan folder\'s main-doc rule.',
    'status: draft',
    '---',
    '',
    '# Sample feature',
    '',
    'Minimal fixture spec body.',
    '',
  ].join('\n');

  const cwd = await renderInto(
    { [`docs/specs/${slug}/${slug}-spec.md`]: specDoc },
    '.agents/skills/code-plan/references/TEMPLATE-plan.md',
    `docs/specs/${slug}/${slug}-plan.md`,
    {
      title: 'Sample feature plan',
      description: 'Ordered work units for the sample feature.',
    },
  );

  const result = await run(['validate'], { cwd });
  assert.equal(result.code, 0, `${result.stdout}${result.stderr}`);
});

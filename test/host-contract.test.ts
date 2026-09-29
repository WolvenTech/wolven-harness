import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { type MdTable, parseMarkdownTables } from './helpers/markdown.js';
import { walkFiles } from './helpers/walk.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const skillsRoot = path.join(repoRoot, 'templates', '.agents', 'skills');
const HOST_TABLE_REL = 'code-pr/references/host-operations.md';
const HOST_TABLE_PATH = path.join(skillsRoot, HOST_TABLE_REL);

const OPERATIONS = [
  'push branch',
  'open PR',
  'read PR and diff',
  'list unresolved threads',
  'reply to a thread',
  'resolve a thread',
  'post a review comment',
  'read check status',
  'read a failing log',
];

function findColumn(headers: string[], name: string): number {
  return headers.findIndex((h) => h.toLowerCase() === name.toLowerCase());
}

async function readHostTable(): Promise<{ md: string; table: MdTable }> {
  const md = await readFile(HOST_TABLE_PATH, 'utf8');
  const tables = parseMarkdownTables(md);
  const table = tables.find((t) => findColumn(t.headers, 'Operation') !== -1);
  assert.ok(table, 'expected a table with an "Operation" column in host-operations.md');
  return { md, table: table! };
}

/** Bare backtick-quoted identifiers in `cell` — tool names, never a `method: x` annotation (which has a space). */
function toolNamesIn(cell: string): string[] {
  return [...cell.matchAll(/`([A-Za-z_][A-Za-z0-9_]*)`/g)].map((m) => m[1]);
}

test('host-table: has all nine operations, one row each', async () => {
  const { table } = await readHostTable();
  const opCol = findColumn(table.headers, 'Operation');
  assert.ok(opCol !== -1);
  const names = table.rows.map((r) => r[opCol]);
  for (const op of OPERATIONS) {
    assert.ok(names.includes(op), `expected an operation row named "${op}"`);
  }
  assert.equal(table.rows.length, OPERATIONS.length, 'expected exactly nine operation rows');
});

test('host-table: every row has non-empty GitHub cells, a gh fallback, and a Bitbucket REST route', async () => {
  const { table } = await readHostTable();
  const mcpCol = findColumn(table.headers, 'GitHub MCP');
  const ghCol = findColumn(table.headers, 'gh fallback');
  const rovoCol = findColumn(table.headers, 'Rovo MCP (Bitbucket)');
  const restCol = findColumn(table.headers, 'Bitbucket REST');
  for (const col of [mcpCol, ghCol, rovoCol, restCol]) assert.ok(col !== -1);

  for (const row of table.rows) {
    const op = row[findColumn(table.headers, 'Operation')];
    assert.ok(row[mcpCol].length > 0, `${op}: GitHub MCP cell must not be empty`);
    assert.ok(row[ghCol].length > 0, `${op}: gh fallback cell must not be empty`);
    assert.ok(row[rovoCol].length > 0, `${op}: Rovo MCP cell must not be empty`);
    assert.ok(row[restCol].length > 0, `${op}: Bitbucket REST cell must not be empty`);
    // invariant: "none" is only ever valid on an MCP column; the gh
    // fallback and the REST route must always carry the operation.
    assert.doesNotMatch(row[ghCol], /^none\b/i, `${op}: gh fallback must name a real command, never "none"`);
    assert.doesNotMatch(row[restCol], /^none\b/i, `${op}: Bitbucket REST must name a real route, never "none"`);
  }
});

test('host-table: every row has a GitHub doc URL and a Bitbucket doc URL', async () => {
  const { table } = await readHostTable();
  const githubDocCol = findColumn(table.headers, 'GitHub doc');
  const bitbucketDocCol = findColumn(table.headers, 'Bitbucket doc');
  assert.ok(githubDocCol !== -1 && bitbucketDocCol !== -1);

  for (const row of table.rows) {
    const op = row[findColumn(table.headers, 'Operation')];
    assert.match(row[githubDocCol], /^https:\/\//, `${op}: GitHub doc must be an https:// URL`);
    assert.match(row[bitbucketDocCol], /^https:\/\//, `${op}: Bitbucket doc must be an https:// URL`);
  }
});

test('host-table: preamble names gitHost, MCP-first with a silent fallback, and where credentials come from', async () => {
  const { md } = await readHostTable();
  assert.match(md, /`gitHost`/, 'preamble must name the gitHost setting');
  assert.match(md, /MCP.{0,40}first/is, 'preamble must say MCP is tried first');
  assert.match(md, /fall\s*back.{0,120}without asking/is, 'preamble must say the fallback happens without asking');
  assert.match(
    md,
    /credentials?.{0,80}(only|never).{0,120}(MCP session|environment variable)/is,
    'preamble must say credentials come only from the MCP session or a named environment variable',
  );
});

test('host-contract: no other skill file names a gh command, a table tool name, or api.bitbucket.org', async () => {
  const { table } = await readHostTable();
  const mcpCol = findColumn(table.headers, 'GitHub MCP');
  const rovoCol = findColumn(table.headers, 'Rovo MCP (Bitbucket)');
  const toolNames = new Set<string>();
  for (const row of table.rows) {
    for (const name of toolNamesIn(row[mcpCol])) toolNames.add(name);
    for (const name of toolNamesIn(row[rovoCol])) toolNames.add(name);
  }
  assert.ok(toolNames.size > 0, 'expected at least one host tool name parsed out of the table');

  const ghCommandRe = /(^|[\s`(])gh (pr|api|run|auth|repo|issue)\b/m;

  for (const rel of await walkFiles(skillsRoot)) {
    if (rel === HOST_TABLE_REL) continue;

    const content = await readFile(path.join(skillsRoot, rel), 'utf8');

    assert.doesNotMatch(content, ghCommandRe, `${rel}: must not name a gh CLI command outside host-operations.md`);
    assert.ok(
      !content.includes('api.bitbucket.org'),
      `${rel}: must not name api.bitbucket.org outside host-operations.md`,
    );

    for (const name of toolNames) {
      const nameRe = new RegExp(`\\b${name}\\b`);
      assert.ok(!nameRe.test(content), `${rel}: must not name host tool "${name}" outside host-operations.md`);
    }
  }
});

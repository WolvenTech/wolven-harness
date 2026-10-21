import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { CONFIG_FILENAME, readConfig, writeConfig } from '../src/setup/config.js';
import { RUNTIME_REGISTRY } from '../src/setup/runtimes.js';
import { SetupError } from '../src/setup/types.js';
import { makeRepo, run } from './helpers/fixture.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ADR = path.join(ROOT, 'docs', 'adrs', 'adr-006-install-check-and-repair-contract.md');

/** Text of ADR-006 from the line starting with `start` up to the next line starting with `end` (or the end of the file). */
function adrSection(adr: string, start: string, end?: string): string {
  const from = adr.indexOf(start);
  assert.notEqual(from, -1, `ADR-006 has no "${start}" section`);
  const rest = adr.slice(from + start.length);
  const to = end === undefined ? -1 : rest.indexOf(end);
  return to === -1 ? rest : rest.slice(0, to);
}

/** Unique values of every backticked token in `text` that matches `shape`, in order. */
function backticked(text: string, shape: RegExp): string[] {
  const found = [...text.matchAll(/`([^`]+)`/g)].map((m) => m[1]).filter((t) => shape.test(t));
  return [...new Set(found)];
}

/** Every `.ts` file under `dir`, recursively. */
async function tsFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await tsFiles(full)));
    else if (entry.name.endsWith('.ts')) out.push(full);
  }
  return out;
}

/**
 * Collects every string literal assigned to `property` (as `property: 'x'`)
 * in the given source files. `validate` findings are built with `rule: '<code>'`
 * and `comments` verdicts with `kind: '<kind>'`; a rule table or literal added
 * anywhere in those files is picked up without a registry.
 */
async function literalsFor(property: string, files: string[]): Promise<Set<string>> {
  const pattern = new RegExp(`\\b${property}:\\s*'([a-z0-9-]+)'`, 'g');
  const out = new Set<string>();
  for (const file of files) {
    for (const m of (await readFile(file, 'utf8')).matchAll(pattern)) out.add(m[1]);
  }
  return out;
}

/** Fails with a two-way diff when `actual` and `documented` differ. */
function assertSameSet(what: string, actual: Set<string>, documented: Set<string>): void {
  const undocumented = [...actual].filter((c) => !documented.has(c)).sort();
  const stale = [...documented].filter((c) => !actual.has(c)).sort();
  assert.ok(
    undocumented.length === 0 && stale.length === 0,
    `${what} drifted from ADR-006 (update the ADR with a superseding ADR, or revert):\n` +
      `  emitted by src/ but missing from the ADR: ${undocumented.join(', ') || '(none)'}\n` +
      `  listed in the ADR but not emitted by src/: ${stale.join(', ') || '(none)'}`,
  );
}

test('contract: validate finding codes match ADR-006', async () => {
  const adr = await readFile(ADR, 'utf8');
  const table = adrSection(adr, '### `validate`', '### `comments`');
  const documented = new Set(backticked(table, /^[a-z0-9]+(-[a-z0-9]+)+$/));
  assert.ok(documented.size > 0, 'ADR-006 lists no validate finding codes');

  const files = await tsFiles(path.join(ROOT, 'src', 'validate'));
  assertSameSet('validate finding codes', await literalsFor('rule', files), documented);
});

test('contract: comments finding kinds match ADR-006', async () => {
  const adr = await readFile(ADR, 'utf8');
  const para = adrSection(adr, 'Finding kinds:', '### `.wolven-harness.json`');
  const documented = new Set(backticked(para, /^[a-z]+(-[a-z]+)*$/));
  assert.ok(documented.size > 0, 'ADR-006 lists no comments finding kinds');

  const files = ['rules.ts', 'leak-rules.ts'].map((f) => path.join(ROOT, 'src', 'comments', f));
  assertSameSet('comments finding kinds', await literalsFor('kind', files), documented);
});

test('contract: setup flags match ADR-006', async () => {
  const adr = await readFile(ADR, 'utf8');
  const table = adrSection(adr, 'Flags. Each value flag', '- Any other argument');
  const documented = new Set(backticked(table, /^--[a-z-]+$/));

  const source = await readFile(path.join(ROOT, 'src', 'setup', 'options.ts'), 'utf8');
  const line = source.match(/const VALID_OPTIONS =\s*'([^']*)'/);
  assert.ok(line, 'VALID_OPTIONS not found in src/setup/options.ts');
  const actual = new Set(line[1].match(/--[a-z-]+/g) ?? []);

  const undocumented = [...actual].filter((flag) => !documented.has(flag)).sort();
  const stale = [...documented].filter((flag) => !actual.has(flag)).sort();
  assert.ok(
    undocumented.length === 0 && stale.length === 0,
    `setup flags drifted from ADR-006:\n  in options.ts but missing from the ADR: ${undocumented.join(', ') || '(none)'}\n  in the ADR but not in options.ts: ${stale.join(', ') || '(none)'}`,
  );
});

test('contract: runtime ids match ADR-006', async () => {
  const adr = await readFile(ADR, 'utf8');
  const list = adrSection(adr, '### Runtime ids', 'Each id names');
  const documented = new Set(backticked(list, /^[a-z][a-z0-9-]*$/));
  assert.ok(documented.size > 0, 'ADR-006 lists no runtime ids');

  const actual = new Set(RUNTIME_REGISTRY.map((row) => row.id));
  assertSameSet('runtime ids', actual, documented);
});

test('contract: config keys match ADR-006', async () => {
  const adr = await readFile(ADR, 'utf8');
  const table = adrSection(adr, '### `.wolven-harness.json`, schema `version: 1`', '### Not contract');
  const documented = new Set(
    [...table.matchAll(/^\| `([A-Za-z.]+)` \|/gm)].map((match) => match[1]).filter((key) => !key.includes('.')),
  );
  assert.ok(documented.size > 0, 'ADR-006 lists no config keys');

  const source = await readFile(path.join(ROOT, 'src', 'setup', 'config.ts'), 'utf8');
  const block = /const KNOWN_KEYS = new Set\(\[([\s\S]*?)\]\);/.exec(source);
  assert.ok(block, 'KNOWN_KEYS not found in src/setup/config.ts');
  const actual = new Set([...block[1].matchAll(/'([A-Za-z]+)'/g)].map((match) => match[1]));
  assertSameSet('config keys', actual, documented);
});

test('contract: --help lists the commands and --version', async () => {
  const dir = await makeRepo({});
  const result = await run(['--help'], { cwd: dir });

  assert.equal(result.code, 0);
  for (const word of ['setup', 'doctor', 'validate', 'comments', 'skills', '--version']) {
    assert.ok(result.stdout.includes(word), `--help output does not mention ${word}`);
  }
});

test('contract: an unknown command exits 1 and --version exits 0', async () => {
  const dir = await makeRepo({});

  const unknown = await run(['no-such-command'], { cwd: dir });
  assert.equal(unknown.code, 1);
  assert.match(unknown.stderr, /unknown command/);
  assert.match(unknown.stdout, /\bvalidate\b/);
  assert.doesNotMatch(unknown.stdout, /unknown command/);

  const version = await run(['--version'], { cwd: dir });
  assert.equal(version.code, 0);
});

const VALID_CONFIG = { version: 1, gitHost: 'gh', runtimes: ['claude'] };

test('contract: config schema v1 rejects version 2', async () => {
  const dir = await makeRepo({ [CONFIG_FILENAME]: JSON.stringify({ ...VALID_CONFIG, version: 2 }) });
  await assert.rejects(readConfig(dir), SetupError);
});

test('contract: config schema v1 requires gitHost', async () => {
  const { gitHost: _omitted, ...withoutHost } = VALID_CONFIG;
  const dir = await makeRepo({ [CONFIG_FILENAME]: JSON.stringify(withoutHost) });
  await assert.rejects(readConfig(dir), SetupError);
});

test('contract: config schema v1 preserves unknown top-level keys and key order on rewrite', async () => {
  const original = { version: 1, gitHost: 'bit', vendorKey: { nested: [1, 2] }, runtimes: ['codex'] };
  const dir = await makeRepo({ [CONFIG_FILENAME]: JSON.stringify(original, null, 2) });

  const config = await readConfig(dir);
  assert.ok(config);
  await writeConfig(dir, config);

  const rewritten = JSON.parse(await readFile(path.join(dir, CONFIG_FILENAME), 'utf8')) as Record<string, unknown>;
  assert.deepEqual(rewritten.vendorKey, { nested: [1, 2] });
  assert.deepEqual(Object.keys(rewritten), ['version', 'gitHost', 'vendorKey', 'runtimes']);
});

test('proof-install-experience-contract: the successor carries wiring forward and records check-and-repair', async () => {
  const adr = await readFile(ADR, 'utf8');
  assert.match(adr, /^status: stable$/m);
  assert.match(adr, /Outside any git repository/);
  assert.match(adr, /Inside a repository subfolder/);
  assert.match(adr, /`--package-manager`/);
  assert.match(adr, /\| `layout` \| string \| Optional\. `home` or `linked`/);
  for (const key of ['packageManager', 'harnessHome', 'codeRepo', 'commitConvention']) {
    assert.ok(adr.includes(`| \`${key}\` |`), `config key ${key} is documented`);
  }
  const predecessor = path.join(
    path.dirname(ADR),
    (await readdir(path.dirname(ADR))).find(
      (name) => name.startsWith('adr-') && name !== path.basename(ADR) && name.includes('install-anywhere-contract'),
    ) ?? '',
  );
  const old = await readFile(predecessor, 'utf8');
  assert.match(old, /^status: deprecated$/m);
  assert.ok(old.includes(`superseded_by: ${path.basename(ADR, '.md')}`));
  assert.match(adr, /doctor-rules-stale/);
  assert.match(adr, /without writing files or using the network/);
  const dir = await makeRepo({});
  const result = await run(['doctor'], { cwd: dir });
  assert.equal(result.code, 1);
  assert.match(result.stdout, /error \[doctor-config\]/);
  assert.doesNotMatch(result.stderr, /unknown command/);
});

test('contract: doctor finding codes and levels match ADR-006', async () => {
  const adr = await readFile(ADR, 'utf8');
  const section = adrSection(adr, '### `doctor`', '### `skills`');
  const documented = new Set(backticked(section, /^doctor-[a-z-]+$/));
  const files = (await tsFiles(path.join(ROOT, 'src', 'doctor'))).filter((file) => !file.endsWith('report.ts'));
  const emitted = new Set<string>();
  for (const file of files) {
    for (const match of (await readFile(file, 'utf8')).matchAll(/'(doctor-[a-z-]+)'/g)) emitted.add(match[1]);
  }
  assertSameSet('doctor finding codes', emitted, documented);
  for (const code of documented) {
    const level = [
      'doctor-not-global',
      'doctor-version-behind',
      'doctor-drift-missing',
      'doctor-drift-stale',
      'doctor-drift-edited',
    ].includes(code)
      ? 'warn'
      : 'error';
    assert.ok(section.includes(`| \`${code}\` | ${level} |`), `${code} has the contract level`);
  }
});

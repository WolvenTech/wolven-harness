import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixtures = path.join(root, 'test', 'fixtures', 'wayfinder');
const buildScript = path.join(root, 'templates', '.agents', 'skills', 'wayfinder', 'scripts', 'build-canvas.mjs');
const expectedCanvas = path.join(fixtures, 'billing-30-canvas.json');

/** Runs `body` with a fresh repo-shaped temp dir holding `docs/maps/.gitignore`, unless `ignore` is false. */
function inRepo(body: (repo: string) => void, { ignore = true } = {}) {
  const repo = mkdtempSync(path.join(tmpdir(), 'wayfinder-'));
  try {
    mkdirSync(path.join(repo, 'docs', 'maps'), { recursive: true });
    if (ignore) writeFileSync(path.join(repo, 'docs', 'maps', '.gitignore'), '*-canvas.json\n*-canvas.html\n');
    body(repo);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
}

/** Copies a fixture map folder to `docs/maps/<slug>/` in the repo and returns its folder and map file. */
function place(repo: string, source: string, slug: string) {
  const folder = path.join(repo, 'docs', 'maps', slug);
  cpSync(source, folder, { recursive: true });
  return { folder, input: path.join(folder, `${slug}-map.md`) };
}

function build(input: string) {
  const result = spawnSync(process.execPath, [buildScript, input], { encoding: 'utf8' });
  const base = input.replace(/-map\.md$/, '-canvas');
  const read = (ext: string) => (existsSync(`${base}.${ext}`) ? readFileSync(`${base}.${ext}`, 'utf8') : null);
  return { ...result, json: read('json'), html: read('html'), page: `${base}.html` };
}

/** The errors the page's data carries, which `radial-draw.js` shows in the error panel. */
function pageErrors(html: string | null): string[] {
  const match = /<script id="map-data" type="application\/json">(.*?)<\/script>/s.exec(html ?? '');
  assert.ok(match, 'page has a map-data script');
  return JSON.parse(match[1]).errors ?? [];
}

const billing = path.join(fixtures, 'billing-30');

test('proof-wayfinder-build-writes-canvas: the 30-ticket map builds to its canvas JSON and page', () => {
  inRepo((repo) => {
    const { input } = place(repo, billing, 'billing-30');
    const result = build(input);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, `wayfinder: wrote ${result.page} (30 tickets)\n`);
    assert.equal(result.json, readFileSync(expectedCanvas, 'utf8'));
    const html = result.html ?? '';
    assert.ok(html.includes('id="map-data"'));
    assert.deepEqual(pageErrors(html), []);
    const hosts = [...html.matchAll(/\b(?:src|href)="(https?:\/\/[^"/]+)/g)].map((match) => match[1]);
    assert.ok(hosts.length > 0);
    for (const host of hosts) assert.match(host, /^https:\/\/fonts\.(googleapis|gstatic)\.com$/);
    assert.ok(!/<script[^>]+\ssrc=/.test(html));
  });
});

const errorCases: Array<[string, string]> = [
  ['broken-blocked-by', '02'],
  ['cycle', '01'],
  ['open-with-resolution', '01'],
  ['closed-without-resolution', '01'],
  ['out-of-scope-without-resolution', '01'],
  ['claimed-resolution-not-undermined', '01'],
];

for (const [name, ticket] of errorCases) {
  test(`proof-wayfinder-build-errors: ${name} exits 1 naming the ticket and the page shows the error panel`, () => {
    inRepo((repo) => {
      const { input } = place(repo, path.join(fixtures, 'errors', name, 'tiny'), 'tiny');
      const result = build(input);
      assert.equal(result.status, 1);
      assert.match(result.stderr, new RegExp(`^${ticket}: `, 'm'));
      assert.equal(result.stdout, '');
      const errors = pageErrors(result.html);
      assert.ok(errors.length > 0);
      assert.ok(errors.some((error) => error.startsWith(`${ticket}: `)));
      assert.equal(result.json, null);
    });
  });
}

test('proof-wayfinder-build-errors: a map without a title exits 1 naming the map file', () => {
  inRepo((repo) => {
    const { input } = place(repo, billing, 'billing-30');
    writeFileSync(input, readFileSync(input, 'utf8').replace(/^title: .*\n/m, ''));
    const result = build(input);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /^billing-30-map\.md: the map needs a title/m);
    assert.ok(pageErrors(result.html).some((error) => error.startsWith('billing-30-map.md: ')));
    assert.equal(result.json, null);
  });
});

test('proof-wayfinder-build-input-errors: a non-flat frontmatter value exits 1 and writes nothing', () => {
  inRepo((repo) => {
    const { folder, input } = place(repo, path.join(fixtures, 'errors', 'non-flat-frontmatter', 'tiny'), 'tiny');
    const before = readdirSync(folder).sort();
    const result = build(input);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /01-first\.md:5: /);
    assert.deepEqual(readdirSync(folder).sort(), before);
  });
});

test('proof-wayfinder-build-input-errors: an input not ending in -map.md exits 1 and writes nothing', () => {
  inRepo((repo) => {
    const { folder } = place(repo, billing, 'billing-30');
    const wrong = path.join(folder, 'billing-30-notes.md');
    renameSync(path.join(folder, 'billing-30-map.md'), wrong);
    const before = readdirSync(folder).sort();
    const result = build(wrong);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /input must end in -map\.md/);
    assert.deepEqual(readdirSync(folder).sort(), before);
  });
});

test('proof-wayfinder-build-input-errors: a missing docs/maps/.gitignore exits 1 and writes nothing', () => {
  inRepo(
    (repo) => {
      const { folder, input } = place(repo, billing, 'billing-30');
      const before = readdirSync(folder).sort();
      const result = build(input);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /docs\/maps\/\.gitignore/);
      assert.deepEqual(readdirSync(folder).sort(), before);
    },
    { ignore: false },
  );
});

test('proof-wayfinder-build-deterministic: two builds give the same bytes', () => {
  inRepo((repo) => {
    const { input } = place(repo, billing, 'billing-30');
    const first = build(input);
    const second = build(input);
    assert.equal(first.status, 0, first.stderr);
    assert.equal(second.status, 0, second.stderr);
    assert.equal(second.json, first.json);
    assert.equal(second.html, first.html);
  });
});

test('proof-wayfinder-no-html-injection: an injected ticket title stays escaped in the page', () => {
  inRepo((repo) => {
    const { folder, input } = place(repo, billing, 'billing-30');
    const title = '</script><img onerror=alert(1)>';
    const ticket = path.join(folder, '01-audit-invoices.md');
    writeFileSync(ticket, readFileSync(ticket, 'utf8').replace('Audit the current invoice model', title));
    const result = build(input);
    assert.equal(result.status, 0, result.stderr);
    const html = result.html ?? '';
    assert.ok(!html.includes(title));
    assert.ok(html.includes('\\u003c/script>\\u003cimg onerror=alert(1)>'));
  });
});

test('proof-wayfinder-reference-map: the map a fresh agent charted from the skill alone builds', () => {
  inRepo((repo) => {
    const { input } = place(repo, path.join(fixtures, 'reference'), 'postgres-backups');
    const result = build(input);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, `wayfinder: wrote ${result.page} (5 tickets)\n`);
    const map = JSON.parse(result.json ?? '');
    assert.equal(map.fog.length, 1);
    const blockers = Object.fromEntries(
      map.trees[0].nodes.map((node: { id: string; blocked_by: string[] }) => [node.id, node.blocked_by]),
    );
    assert.ok(
      Object.entries(blockers).some(([, by]) => by.some((id) => blockers[id]?.length > 0)),
      'a blocker chain',
    );
  });
});

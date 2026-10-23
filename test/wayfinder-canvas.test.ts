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

function build(input: string, { radial = false } = {}) {
  const args = radial ? ['--radial', input] : [input];
  const result = spawnSync(process.execPath, [buildScript, ...args], { encoding: 'utf8' });
  const stem = input.replace(/-map\.md$/, '');
  const page = radial ? `${stem}-radial-canvas.html` : `${stem}-canvas.html`;
  const read = (file: string) => (existsSync(file) ? readFileSync(file, 'utf8') : null);
  return { ...result, json: read(`${stem}-canvas.json`), html: read(page), page };
}

/** The errors the page's data carries, which the drawing script shows in the error panel. */
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
  for (const radial of [false, true]) {
    const mode = radial ? 'radial' : 'default';
    test(`proof-wayfinder-lanes-build-errors (R2.4): ${name} in ${mode} mode exits 1 naming the ticket and the page shows errors`, () => {
      inRepo((repo) => {
        const { input } = place(repo, path.join(fixtures, 'errors', name, 'tiny'), 'tiny');
        const result = build(input, { radial });
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

test('proof-wayfinder-lanes-build-deterministic (R2.11): two builds give the same bytes in default and radial modes', () => {
  for (const radial of [false, true]) {
    inRepo((repo) => {
      const { input } = place(repo, billing, 'billing-30');
      const first = build(input, { radial });
      const second = build(input, { radial });
      assert.equal(first.status, 0, first.stderr);
      assert.equal(second.status, 0, second.stderr);
      assert.equal(second.json, first.json);
      assert.equal(second.html, first.html);
    });
  }
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

test('proof-wayfinder-lanes-default-build (R2.1): default build inlines lanes shell and scripts, not radial-draw', () => {
  const lanesDraw = readFileSync(path.join(root, 'renderer', 'lanes-draw.js'), 'utf8');
  inRepo((repo) => {
    const { input } = place(repo, billing, 'billing-30');
    const result = build(input);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, `wayfinder: wrote ${result.page} (30 tickets)\n`);
    const html = result.html ?? '';
    assert.ok(html.includes('Wayfinder map as lanes'));
    assert.ok(html.includes('LanesLayout'));
    assert.ok(html.includes(lanesDraw.trim().slice(0, 120)));
    assert.ok(!html.includes('drawLabels'));
    assert.ok(!html.includes('allLabels'));
    assert.ok(!html.includes('MAX_FIT_K = 1.25'));
  });
});

test('proof-wayfinder-lanes-shell (R2.9): built page has lane tokens, color-scheme, no remote script', () => {
  inRepo((repo) => {
    const { input } = place(repo, billing, 'billing-30');
    const result = build(input);
    assert.equal(result.status, 0, result.stderr);
    const html = result.html ?? '';
    assert.match(html, /color-scheme:\s*light dark/);
    for (let i = 0; i < 12; i++) assert.match(html, new RegExp(`--lane-${i}:`));
    assert.match(html, /@media \(prefers-color-scheme: dark\)[\s\S]*--lane-11:/);
    assert.ok(!/<script[^>]+\ssrc=/.test(html));
  });
});

test('proof-wayfinder-radial-on-ask (R2.2): --radial writes the radial page with radial-draw and the canvas JSON', () => {
  const radialDraw = readFileSync(path.join(root, 'renderer', 'radial-draw.js'), 'utf8');
  inRepo((repo) => {
    const { input } = place(repo, billing, 'billing-30');
    const result = build(input, { radial: true });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, `wayfinder: wrote ${result.page} (30 tickets)\n`);
    assert.equal(result.json, readFileSync(expectedCanvas, 'utf8'));
    const html = result.html ?? '';
    assert.ok(html.includes('MAX_FIT_K = 1.25'));
    assert.ok(html.includes(radialDraw.trim().slice(0, 80)));
    assert.ok(!html.includes('LanesLayout'));
    assert.ok(!html.includes('Wayfinder map as lanes'));
    assert.deepEqual(pageErrors(html), []);
  });
});

test('proof-wayfinder-lanes-bad-flag (R2.5): an unknown flag exits 1 naming the flag and writes nothing', () => {
  inRepo((repo) => {
    const { folder, input } = place(repo, billing, 'billing-30');
    const before = readdirSync(folder).sort();
    const result = spawnSync(process.execPath, [buildScript, '--lanes', input], { encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /unknown flag --lanes/);
    assert.equal(result.stdout, '');
    assert.deepEqual(readdirSync(folder).sort(), before);
  });
});

test('proof-wayfinder-radial-ignored (R2.10): the radial page matches setup docs/maps/.gitignore', () => {
  inRepo((repo) => {
    spawnSync('git', ['init'], { cwd: repo, encoding: 'utf8' });
    const { input } = place(repo, billing, 'billing-30');
    const result = build(input, { radial: true });
    assert.equal(result.status, 0, result.stderr);
    const check = spawnSync('git', ['check-ignore', result.page], { cwd: repo, encoding: 'utf8' });
    assert.equal(check.status, 0, check.stderr || check.stdout);
    assert.equal(check.stdout.trim(), result.page);
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

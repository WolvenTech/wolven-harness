import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { findCommentFindings } from '../src/comments/index.js';
import { makeRepo } from './helpers/fixture.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const logicPath = path.join(root, 'templates', '.agents', 'skills', 'journey-map', 'renderer', 'logic.js');
const fixture = (name: string) =>
  JSON.parse(readFileSync(path.join(root, 'test', 'fixtures', 'journey-map', name), 'utf8'));

// why: the logic API is a classic script global, so tests see it through a loose shape.
type Logic = Record<string, any>;

function loadLogic(): Logic {
  const context = vm.createContext({});
  vm.runInContext(readFileSync(logicPath, 'utf8'), context);
  return (context as { JourneyMapLogic: Logic }).JourneyMapLogic;
}

// why: each case mutates a different path of the fixture, so a precise type would only add noise.
type Map = any;

function addTree(m: Map) {
  m.trees.push({
    id: 'extra',
    label: 'Extra',
    nodes: [
      { id: 'extra-start', kind: 'start', label: 'Extra', next: 'extra-end' },
      { id: 'extra-end', kind: 'waypoint', label: 'Extra end', tag: 'extra' },
    ],
  });
}

const cases: Array<[string, string, (m: Map) => void]> = [
  ['an unknown kind', 'route', (m) => (m.trees[0].nodes[1].kind = 'dragon')],
  ['a duplicate id', 'shire', (m) => m.trees[0].nodes.push({ ...m.trees[0].nodes[0] })],
  ['a missing next', 'shire', (m) => (m.trees[0].nodes[0].next = 'missing')],
  [
    'a missing gates target',
    'pack',
    (m) => {
      m.trees[0].nodes.find((n: Map) => n.id === 'pack').items[0].gates = ['missing'];
    },
  ],
  ['a missing link target', 'doom', (m) => (m.links[0].to = 'missing')],
  ['a missing annotation target', 'shared-note', (m) => (m.annotations[0].target = 'missing')],
  [
    'a next that crosses trees',
    'shire',
    (m) => {
      addTree(m);
      m.trees[0].nodes[0].next = 'extra-end';
    },
  ],
  [
    'a gates target in another tree',
    'pack',
    (m) => {
      addTree(m);
      m.trees[0].nodes.find((n: Map) => n.id === 'pack').items[0].gates = ['extra-end'];
    },
  ],
  [
    'a gates target that is not a waypoint',
    'pack',
    (m) => {
      m.trees[0].nodes.find((n: Map) => n.id === 'pack').items[0].gates = ['shire'];
    },
  ],
  [
    'a default that is not an option key',
    'route',
    (m) => {
      m.trees[0].nodes.find((n: Map) => n.id === 'route').default = 'nope';
    },
  ],
  [
    'a cycle',
    'route',
    (m) => {
      m.trees[0].nodes.find((n: Map) => n.id === 'forest').next = 'route';
    },
  ],
  ['a mood out of range', 'forest', (m) => (m.trees[0].nodes.find((n: Map) => n.id === 'forest').mood = 3)],
  [
    'a thought that is not a string',
    'rivendell',
    (m) => (m.trees[0].nodes.find((n: Map) => n.id === 'rivendell').thought = 7),
  ],
  ['a list field of non-strings', 'meal', (m) => (m.trees[0].nodes.find((n: Map) => n.id === 'meal').pains = [1])],
  ['a journey field on a non-waypoint', 'route', (m) => (m.trees[0].nodes.find((n: Map) => n.id === 'route').mood = 1)],
  ['a persona with no name', 'map', (m) => (m.persona = { role: 'Ranger' })],
  ['a missing label', 'shire', (m) => delete m.trees[0].nodes[0].label],
  ['a tree with no start', 'shire-journey', (m) => (m.trees[0].nodes[0].kind = 'waypoint')],
  ['a tree with two starts', 'shire-journey', (m) => (m.trees[0].nodes[2].kind = 'start')],
];

test('journey-map validate: returns no errors for the LotR fixture', () => {
  assert.deepEqual([...loadLogic().validate(fixture('lotr-map.json'))], []);
});

test('journey-map validate: reports at least one error for the malformed fixture', () => {
  assert.ok(loadLogic().validate(fixture('malformed-map.json')).length >= 1);
});

for (const [name, id, mutate] of cases) {
  test(`journey-map validate: names ${id} for ${name}`, () => {
    const map = fixture('lotr-map.json');
    mutate(map);
    const errors = loadLogic().validate(map);
    assert.ok(
      errors.some((e) => e.startsWith(`${id}:`)),
      `expected an error starting "${id}:", got ${JSON.stringify(errors)}`,
    );
  });
}

test('journey-map validate: the malformed fixture names every journey case', () => {
  const errors: string[] = [...loadLogic().validate(fixture('malformed-map.json'))];
  for (const id of ['forest', 'rivendell', 'meal', 'descent', 'armor', 'route']) {
    assert.ok(
      errors.some((e) => e.startsWith(`${id}: `) && /mood|thought|pains|touchpoints|opportunities/.test(e)),
      id,
    );
  }
  assert.ok(errors.includes('map: persona.name must be a string'));
});

test('journey-map validate: the cj-001 fixture gives no errors', () => {
  assert.deepEqual([...loadLogic().validate(fixture('cj-001-map.json'))], []);
});

test('journey-map isStep: a persona map or a journey field makes a waypoint a step; a plain waypoint is not', () => {
  const logic = loadLogic();
  const lotr = fixture('lotr-map.json');
  const plain = lotr.trees[0].nodes.find((n: Map) => n.kind === 'waypoint');
  assert.equal(logic.isStep(plain, lotr), false);
  assert.equal(logic.isStep({ ...plain, mood: 0 }, lotr), true);
  const cj = fixture('cj-001-map.json');
  const bare = cj.trees[0].nodes.find((n: Map) => n.id === 'co-1b');
  assert.equal(bare.mood, undefined);
  assert.equal(logic.isStep(bare, cj), true);
  assert.equal(logic.isStep(cj.trees[0].nodes[0], cj), false);
  assert.equal(logic.moodOf({ mood: -2 }).name, 'Frustrated');
  assert.equal(logic.moodOf({}), null);
});

const overlaps = (a: Map, b: Map) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

test('journey-map layout: no two boxes overlap on either fixture', () => {
  const logic = loadLogic();
  for (const map of [fixture('lotr-map.json'), stackedUpwardLinkMap()]) {
    const { boxes } = logic.layout(map);
    assert.equal(boxes.length, logic.all(map).length);
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        assert.ok(!overlaps(boxes[i], boxes[j]), `${boxes[i].id} overlaps ${boxes[j].id}`);
      }
    }
  }
});

test('journey-map layout: a shared node sits at its longest-path column', () => {
  const logic = loadLogic();
  const map = fixture('lotr-map.json');
  const column = (m: Map) => logic.layout(m).boxes.find((b: Map) => b.id === 'rivendell').column;
  assert.equal(column(map), 3);
  map.trees[0].nodes.find((n: Map) => n.id === 'forest').next = 'bree';
  assert.equal(column(map), 4);
});

test('journey-map layout: height(n) is the sum of rows(n) plus the padding for its kind', () => {
  const logic = loadLogic();
  const { M } = logic;
  for (const map of [fixture('lotr-map.json'), stackedUpwardLinkMap()]) {
    for (const node of logic.all(map)) {
      const sum = logic.rows(node).reduce((h: number, r: Map) => h + r.h, 0);
      const expected = node.kind === 'start' ? Math.max(76, sum + 2 * M.pad) : sum + M.pad + 14;
      assert.equal(logic.height(node), expected, node.id);
    }
  }
});

const openAll = (map: Map) =>
  new Set(
    loadLogic()
      .all(map)
      .map((n: Map) => n.id),
  );
const zoneSum = (rows: Map[], zone: string) =>
  rows.filter((r) => (r.zone || 'card') === zone).reduce((h, r) => h + r.h, 0);

test('journey-map layout: journey rows fall in the cloud, card and sticky zones, stickies only when open', () => {
  const logic = loadLogic();
  const map = fixture('cj-001-map.json');
  const opts = logic.ctx(map, { open: openAll(map) });
  const closed = logic.ctx(map);
  const rich = logic.all(map).find((n: Map) => n.thought && n.pains?.length && n.touchpoints?.length);
  assert.ok(rich, 'cj-001 has a fully populated step');
  const zones = (r: Map[]) => Object.fromEntries(r.map((x) => [x.kind, x.zone || 'card']));
  assert.deepEqual(zones(logic.rows(rich, closed)), {
    cloud: 'top',
    band: 'card',
    eyebrow: 'card',
    title: 'card',
    dbar: 'card',
  });
  const z = zones(logic.rows(rich, opts));
  assert.equal(z.cloud, 'top');
  assert.equal(z.chips, 'card');
  assert.equal(z.sticky, 'bottom');
  assert.equal(z.dbar, undefined);
});

test('journey-map layout: no two boxes overlap on cj-001 with every step expanded, clouds and stickies included', () => {
  const logic = loadLogic();
  const map = fixture('cj-001-map.json');
  const { boxes } = logic.layout(map, { open: openAll(map) });
  assert.ok(boxes.some((b: Map) => b.inset > 0) && boxes.some((b: Map) => b.tail > 0));
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      assert.ok(!overlaps(boxes[i], boxes[j]), `${boxes[i].id} overlaps ${boxes[j].id}`);
    }
  }
});

test('journey-map layout: height equals the sum of the zones', () => {
  const logic = loadLogic();
  const map = fixture('cj-001-map.json');
  const opts = logic.ctx(map, { open: openAll(map) });
  for (const node of logic.all(map)) {
    const p = logic.parts(node, opts);
    assert.equal(logic.height(node, opts), p.inset + p.card + p.tail, node.id);
    assert.equal(p.inset, zoneSum(p.rows, 'top'), node.id);
    assert.equal(p.tail, zoneSum(p.rows, 'bottom'), node.id);
  }
});

test('journey-map layout: an annotated node keeps the note slot and its annotation lines under the card', () => {
  const logic = loadLogic();
  const map = fixture('cj-001-map.json');
  const annotation = map.annotations[0];
  const node = logic.all(map).find((n: Map) => n.id === annotation.target);
  const plain = logic.parts(node, logic.ctx({ ...map, annotations: [] }));
  const noted = logic.parts(node, logic.ctx(map));
  const wrapped = logic.lines(annotation.text, logic.M.annoChars).length;
  assert.equal(noted.card, plain.card);
  assert.ok(noted.tail >= plain.tail + logic.M.noteSlot + wrapped * logic.M.annoLine);
  const box = logic.layout(map).boxes.find((b: Map) => b.id === node.id);
  assert.equal(box.tail, noted.tail);
});

test('journey-map validate: a ticket node is an unknown kind, and a ticket-only tree has no start', () => {
  const map = fixture('lotr-map.json');
  map.trees.push({ id: 'board', label: 'Board', nodes: [{ id: 'scout', kind: 'ticket', label: 'Scout the paths' }] });
  const errors = loadLogic().validate(map);
  assert.ok(errors.includes('scout: unknown kind ticket'), JSON.stringify(errors));
  assert.ok(errors.includes('board: tree requires exactly one start'), JSON.stringify(errors));
});

const reveal = (answers: Map) => [...loadLogic().revealed(fixture('lotr-map.json'), answers)].sort();

test('journey-map reveal: empty answers show only the start and the first question', () => {
  assert.deepEqual(reveal({}), ['route', 'shire']);
});

test('journey-map reveal: a choice reveals its branch and not the other', () => {
  const shown = reveal({ route: { choice: 'road' } });
  for (const id of ['bree', 'rivendell', 'pack']) assert.ok(shown.includes(id), id);
  for (const id of ['forest', 'pony']) assert.ok(!shown.includes(id), id);
});

test('journey-map reveal: a checklist waits for done before showing what follows', () => {
  const road = { route: { choice: 'road' } };
  assert.ok(!reveal({ ...road, pack: {} }).includes('pony'));
  const shown = reveal({ ...road, pack: { done: true } });
  assert.ok(shown.includes('pony'));
  assert.ok(!shown.includes('meal'));
});

const stepRun = (answers: Map, extra: Map = {}) => {
  const logic = loadLogic();
  const map = fixture('cj-001-map.json');
  return {
    logic,
    map,
    shown: () => [...logic.revealed(map, answers, { stepwise: true })],
    walk: (showAll = false) => [...logic.walked(map, answers, showAll, { stepwise: true, ...extra })],
  };
};

test('journey-map step by step: the walk holds at each waypoint, done releases it, and pending names it', () => {
  const answers: Map = {};
  const run = stepRun(answers);
  assert.deepEqual(run.shown(), ['start', 'aw-1']);
  assert.equal(run.logic.pending(run.map, answers), 'aw-1');
  answers['aw-1'] = { done: true };
  assert.deepEqual(run.shown(), ['start', 'aw-1', 'aw-2']);
  assert.equal(run.logic.pending(run.map, answers), 'aw-2');
});

test('journey-map step by step: without stepwise the LotR reveal is the base reveal', () => {
  const logic = loadLogic();
  const map = fixture('lotr-map.json');
  assert.deepEqual([...logic.revealed(map, {}, {})].sort(), [...logic.revealed(map, {})].sort());
  assert.deepEqual(reveal({}), [...logic.revealed(map, {}, { stepwise: false })].sort());
});

test('journey-map step by step: clearing the latest answer hides exactly the last node shown', () => {
  const answers: Map = {};
  const run = stepRun(answers);
  const ids = ['aw-1', 'aw-2', 'co-1', 'co-1b'];
  for (const id of ids) answers[id] = { done: true };
  answers['co-choice'] = { choice: 'trial' };
  answers['co-2'] = { done: true };
  for (let guard = 0; guard < 20; guard++) {
    const before = run.shown();
    const target = run.logic.prevTarget(run.map, answers, { stepwise: true });
    if (!target) break;
    if (run.map.trees[0].nodes.find((n: Map) => n.id === target).kind === 'choice') delete answers[target].choice;
    else answers[target].done = false;
    const after = run.shown();
    assert.equal(after.length, before.length - 1, target);
    assert.deepEqual(after, before.slice(0, -1), target);
  }
  assert.equal(run.shown().length, 2);
  assert.equal(run.logic.prevTarget(run.map, answers, { stepwise: true }), null);
  assert.equal(run.logic.prevTarget(run.map, { 'aw-1': { done: true } }, { stepwise: true, showAll: true }), null);
  assert.equal(run.logic.prevTarget(run.map, { 'aw-1': { done: true } }, {}), null);
});

test('journey-map walked: the order follows the chosen branch, and show-all follows the default', () => {
  const answers: Map = {};
  for (const id of ['aw-1', 'aw-2', 'co-1', 'co-1b']) answers[id] = { done: true };
  const run = stepRun(answers);
  const upToChoice = ['start', 'aw-1', 'aw-2', 'co-1', 'co-1b', 'co-choice'];
  assert.deepEqual(run.walk(), upToChoice);
  answers['co-choice'] = { choice: 'leave' };
  assert.deepEqual(run.walk(), [...upToChoice, 'co-comp']);
  answers['co-comp'] = { done: true };
  assert.deepEqual(run.walk(), [...upToChoice, 'co-comp', 'co-end']);
  answers['co-choice'] = { choice: 'trial' };
  assert.deepEqual(run.walk().slice(0, 7), [...upToChoice, 'co-2']);
  const noAnswers = stepRun({});
  const full = [...noAnswers.logic.walked(noAnswers.map, {}, true)];
  assert.deepEqual(full.slice(0, 8), [...upToChoice, 'co-2', 'de-1']);
  assert.ok(!full.includes('co-comp'));
});

test('journey-map fade: the merge node is spared when its other branch is chosen', () => {
  const { faded, later } = loadLogic().faded(fixture('lotr-map.json'), { route: { choice: 'road' } });
  assert.ok(faded.has('forest'));
  assert.ok(!faded.has('rivendell'));
  assert.ok(!faded.has('doom'));
  assert.equal(later.size, 0);
});

test('journey-map fade: unticking an item fades what it gates as later, and ticking restores it', () => {
  const logic = loadLogic();
  const map = fixture('lotr-map.json');
  const off = logic.faded(map, { pack: { checks: { rope: false, mithril: true } } });
  assert.ok(off.faded.has('descent') && off.later.has('descent'));
  assert.ok(!off.faded.has('doom'));
  const on = logic.faded(map, { pack: { checks: { rope: true, mithril: true } } });
  assert.ok(!on.faded.has('descent') && !on.later.has('descent'));
});

test('journey-map feedback: names each touched node in layout order with exact lines', () => {
  const state = {
    route: { choice: 'road', note: 'Prefer Bree' },
    pack: { checks: { rope: false } },
    pony: { text: 'Bill' },
    shire: { done: true },
  };
  assert.equal(
    loadLogic().feedback(fixture('lotr-map.json'), state, 'lotr-map.json'),
    [
      'journey-map feedback for lotr-map.json',
      'route "Which way out of the Shire?": chose road "The Road"',
      'route "Which way out of the Shire?": note "Prefer Bree"',
      'pack "What goes in the pack?": ticked lembas, mithril; unticked rope',
      'pony "Name the pony": typed "Bill"',
    ].join('\n'),
  );
});

test('journey-map feedback: an unchanged continued checklist gets a line and a done waypoint gets none', () => {
  const logic = loadLogic();
  const map = fixture('lotr-map.json');
  const waypoint = logic.all(map).find((n: Map) => n.kind === 'waypoint').id;
  const text = logic.feedback(map, { pack: { done: true }, [waypoint]: { done: true } }, 'lotr-map.json');
  assert.equal(text, 'journey-map feedback for lotr-map.json\npack "What goes in the pack?": continued with no change');
  const changed = logic.feedback(map, { pack: { done: true, checks: { rope: false } } }, 'lotr-map.json');
  assert.ok(!changed.includes('continued with no change'));
});

const skillDir = path.join(root, 'templates', '.agents', 'skills', 'journey-map');
const buildScript = path.join(skillDir, 'scripts', 'build-map.mjs');
const rendererFile = (name: string) => readFileSync(path.join(skillDir, 'renderer', name), 'utf8');
const ROUGH_INTEGRITY =
  'integrity="sha384-1NLkwxMO2sOqcq7rQkFBhIAUJtbt8ziLxhVKVgKfFGMEU8pF+GEq5LVogviveup6" crossorigin="anonymous"';

/** Runs `body` with a fresh temp dir, because the build writes its page next to its input. */
function inTempDir(body: (dir: string) => void) {
  const dir = mkdtempSync(path.join(tmpdir(), 'journey-map-'));
  try {
    body(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function buildMap(dir: string, name: string, map: unknown) {
  const input = path.join(dir, name);
  writeFileSync(input, typeof map === 'string' ? map : JSON.stringify(map));
  const result = spawnSync(process.execPath, [buildScript, input], { encoding: 'utf8' });
  const page = input.replace(/\.json$/, '.html');
  return { ...result, input, page, html: existsSync(page) ? readFileSync(page, 'utf8') : null };
}

test('journey-map build: writes the page and prints the wrote line', () => {
  inTempDir((dir) => {
    const first = buildMap(dir, 'lotr-map.json', fixture('lotr-map.json'));
    assert.equal(first.status, 0, first.stderr);
    assert.equal(first.stdout.trim(), `journey-map: wrote ${first.page} (16 nodes)`);
    const second = buildMap(dir, 'second-map.json', stackedUpwardLinkMap());
    assert.equal(second.status, 0, second.stderr);
    assert.match(second.stdout, /^journey-map: wrote .* \(\d+ nodes\)\n$/);
  });
});

test('journey-map build: both pages carry a byte-identical renderer and load only the allowed hosts', () => {
  inTempDir((dir) => {
    const region = `<script>${rendererFile('logic.js')}${rendererFile('draw.js')}</script>`;
    for (const [name, map] of [
      ['lotr-map.json', fixture('lotr-map.json')],
      ['second-map.json', stackedUpwardLinkMap()],
    ] as const) {
      const html = buildMap(dir, name, map).html ?? '';
      assert.equal(html.split('<!-- journey-map:renderer -->')[1], region);
      assert.ok(html.includes(ROUGH_INTEGRITY));
      for (const match of html.matchAll(/(?:src|href)="(https:[^"]+)"/g)) {
        const url = new URL(match[1]);
        assert.ok(['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname), match[1]);
        if (url.hostname === 'cdn.jsdelivr.net') assert.ok(url.pathname.startsWith('/npm/roughjs@4.6.6/'), match[1]);
      }
    }
  });
});

test('journey-map build: two builds of one input give the same bytes', () => {
  inTempDir((dir) => {
    const first = buildMap(dir, 'lotr-map.json', fixture('lotr-map.json')).html;
    const second = buildMap(dir, 'lotr-map.json', fixture('lotr-map.json')).html;
    assert.ok(first);
    assert.equal(first, second);
  });
});

test('journey-map build: a malformed map writes the error page, names the nodes and exits 1', () => {
  inTempDir((dir) => {
    const result = buildMap(dir, 'malformed-map.json', fixture('malformed-map.json'));
    assert.equal(result.status, 1);
    const errors = [...loadLogic().validate(fixture('malformed-map.json'))];
    assert.ok(errors.length > 0);
    assert.deepEqual(result.stderr.trim().split('\n'), errors);
    assert.match(result.html ?? '', /id="errors"/);
  });
});

test('journey-map build: a bad name, missing file or invalid JSON exits 1 and writes nothing', () => {
  inTempDir((dir) => {
    const invalid = buildMap(dir, 'invalid-map.json', '{');
    const wrongName = buildMap(dir, 'wrong.json', fixture('lotr-map.json'));
    const missing = spawnSync(process.execPath, [buildScript, path.join(dir, 'missing-map.json')], {
      encoding: 'utf8',
    });
    for (const result of [invalid, wrongName, missing]) assert.equal(result.status, 1);
    assert.equal(invalid.html, null);
    assert.equal(wrongName.html, null);
    assert.ok(!existsSync(path.join(dir, 'missing-map.html')));
  });
});

test('journey-map build: an injected label stays escaped in the page', () => {
  inTempDir((dir) => {
    const map = fixture('lotr-map.json');
    const label = '</script><img onerror=alert(1)>';
    map.trees[0].nodes[0].label = label;
    const result = buildMap(dir, 'inject-map.json', map);
    assert.equal(result.status, 0, result.stderr);
    assert.ok(!(result.html ?? '').includes(label));
    assert.ok((result.html ?? '').includes('\\u003c/script>'));
  });
});

test('journey-map comments: the shipped scripts pass a consumer comment check', async () => {
  const dir = await makeRepo({ 'README.md': 'base\n' }, { git: true });
  const git = (...args: string[]) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' }).trim();
  const base = git('rev-parse', 'HEAD');
  const shipped: Array<[string, string]> = [
    ['logic.js', 'renderer/logic.js'],
    ['draw.js', 'renderer/draw.js'],
    ['build-map.mjs', 'scripts/build-map.mjs'],
  ];
  for (const [, rel] of shipped) {
    const target = path.join(dir, '.agents', 'skills', 'journey-map', rel);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, readFileSync(path.join(skillDir, rel), 'utf8'));
  }
  git('add', '-A');
  git('-c', 'user.name=t', '-c', 'user.email=t@example.com', 'commit', '-m', 'add journey-map');

  assert.deepEqual(await findCommentFindings({ root: dir, base }), []);
});

test('journey-map reference map: the harness-init redesign validates, builds and reaches the handback', () => {
  const logic = loadLogic();
  const map = fixture('harness-init-redesign-map.json');
  assert.deepEqual([...logic.validate(map)], []);
  inTempDir((dir) => {
    const result = buildMap(dir, 'harness-init-redesign-map.json', map);
    assert.equal(result.status, 0, result.stderr);
  });

  const byId = new Map<string, Map>(logic.all(map).map((n: Map) => [n.id, n]));
  const expectedKinds: Array<[string, string]> = [
    ['setup-start', 'start'],
    ['init-start', 'start'],
    ['init-depth', 'choice'],
    ['basics-goal', 'text'],
    ['basics-agents', 'choice'],
    ['full-agents', 'choice'],
    ['full-scope', 'checklist'],
    ['full-skills-q', 'choice'],
    ['full-checks-q', 'choice'],
    ['full-commits', 'checklist'],
    ['handback', 'card'],
    ['setup-command', 'card'],
  ];
  for (const [id, kind] of expectedKinds) assert.equal(byId.get(id)?.kind, kind, id);

  const depth = byId.get('init-depth');
  assert.deepEqual(
    depth?.options.map((o: Map) => o.next),
    ['basics-goal', 'full-scope'],
  );
  assert.equal(byId.get('basics-agents')?.options.length, 3);
  assert.equal(byId.get('full-agents')?.options.length, 3);
  assert.ok(map.links.some((l: Map) => l.from === 'setup-command' && l.to === 'init-start'));

  const basicsKey = depth?.options[0].key;
  const agentKey = byId.get('basics-agents')?.options[0].key;
  const shown = logic.revealed(map, {
    'init-depth': { choice: basicsKey },
    'basics-goal': { done: true },
    'basics-agents': { choice: agentKey },
  });
  assert.ok(shown.has('handback'));
});

function stackedUpwardLinkMap() {
  const card = (id: string, next?: string) => ({
    id,
    kind: 'card',
    label: id,
    sections: [{ head: 'h', items: ['a', 'b'] }],
    next,
  });
  const choice = (id: string) => ({
    id,
    kind: 'choice',
    label: id,
    options: [
      { key: 'a', label: 'a', next: `${id}-a` },
      { key: 'b', label: 'b', next: `${id}-b` },
    ],
  });
  const tree = (id: string, prefix: string) => ({
    id,
    label: id,
    nodes: [
      { id: `${prefix}-start`, kind: 'start', label: prefix, next: `${prefix}-q` },
      choice(`${prefix}-q`),
      card(`${prefix}-q-a`),
      card(`${prefix}-q-b`),
    ],
  });
  return {
    version: 1,
    title: 'Upward link',
    trees: [tree('upper', 'up'), tree('lower', 'low')],
    links: [{ from: 'low-q-b', to: 'up-q-a', label: 'back up' }],
    annotations: [],
  };
}

test('journey-map linkRoute: no link route passes through a card, downward or upward', () => {
  const logic = loadLogic();
  for (const map of [fixture('lotr-map.json'), stackedUpwardLinkMap()]) {
    assert.deepEqual([...logic.validate(map)], []);
    const plan = logic.layout(map);
    assert.ok(map.links.length > 0);
    for (const link of map.links) {
      const { points } = logic.linkRoute(plan, link);
      const target = plan.boxes.find((b: Map) => b.id === link.to);
      for (let i = 1; i < points.length; i++) {
        const [x1, y1] = points[i - 1];
        const [x2, y2] = points[i];
        const steps = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 4));
        for (let s = 0; s <= steps; s++) {
          const x = x1 + ((x2 - x1) * s) / steps;
          const y = y1 + ((y2 - y1) * s) / steps;
          const inLastApproach = i === points.length - 1 && Math.abs(x - target.x) <= 6;
          for (const b of plan.boxes) {
            if (b.id === link.from && s === 0 && i === 1) continue;
            const inside = x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h;
            assert.ok(!inside || inLastApproach, `${link.from}->${link.to} passes through ${b.id} at ${x},${y}`);
          }
        }
      }
    }
  }
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const radialPath = path.join(root, 'renderer', 'radial.js');
const fixture = (name: string) =>
  JSON.parse(readFileSync(path.join(root, 'test', 'fixtures', 'wayfinder', name), 'utf8'));

// why: the radial API is a classic script global, so tests see it through a loose shape.
type Radial = Record<string, any>;

function loadRadial(): Radial {
  // invariant: the context has no window, document or require, so a DOM reference in radial.js throws here.
  const context = vm.createContext({});
  vm.runInContext(readFileSync(radialPath, 'utf8'), context);
  return (context as { RadialLayout: Radial }).RadialLayout;
}

// why: arrays and objects built inside the vm have another realm's prototypes, which deepEqual rejects.
const plain = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const radial = loadRadial();
const canvas = fixture('billing-30-canvas.json');
const reached = fixture('billing-30-reached-canvas.json');
const m = plain(radial.model(canvas));
const placed = plain(radial.layout(canvas));

const ids = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => String(from + i).padStart(2, '0'));
const stateIds = (state: string) => m.tickets.filter((t: any) => t.state === state).map((t: any) => t.id);

test('radial.js runs with no DOM and sets RadialLayout', () => {
  assert.equal(typeof radial.model, 'function');
  assert.equal(typeof radial.layout, 'function');
});

test('the 30-ticket fixture has 30 tickets, 12 on the frontier ring and five fog patches', () => {
  assert.equal(m.tickets.length, 30);
  assert.equal(m.ring.length, 12);
  assert.equal(m.fog.length, 5);
});

test('model counts every state exactly', () => {
  assert.deepEqual(m.counts, { now: 8, redo: 2, claimed: 2, blocked: 7, patches: 5, decided: 8, oos: 3 });
  assert.deepEqual(stateIds('now'), ids(13, 20));
  assert.deepEqual(stateIds('redo'), ['09', '10']);
  assert.deepEqual(stateIds('claimed'), ['21', '22']);
  assert.deepEqual(stateIds('blocked'), ['11', '12', '23', '24', '25', '26', '27']);
  assert.deepEqual(stateIds('decided'), ids(1, 8));
  assert.deepEqual(stateIds('oos'), ['28', '29', '30']);
});

test('model gives the frontier and the frontier ring exactly', () => {
  assert.deepEqual(m.frontier, ['09', '10', ...ids(13, 20)]);
  assert.deepEqual(m.ring, ['09', '10', ...ids(13, 22)]);
});

test('model header lists the counts in order and leaves out zeros', () => {
  assert.deepEqual(
    m.header.map((h: any) => [h.key, h.count]),
    [
      ['now', 8],
      ['redo', 2],
      ['claimed', 2],
      ['blocked', 7],
      ['patches', 5],
      ['decided', 8],
      ['oos', 3],
    ],
  );
  const noOos = plain(
    radial.model({ ...canvas, trees: [{ id: 'tickets', nodes: canvas.trees[0].nodes.slice(0, 20) }] }),
  );
  assert.ok(!noOos.header.some((h: any) => h.key === 'oos'));
});

test('an undermined blocker keeps its open dependents off the frontier', () => {
  const byId = m.byId;
  assert.equal(byId['09'].state, 'redo');
  assert.deepEqual(byId['11'].blocked_by, ['09']);
  assert.equal(byId['11'].state, 'blocked');
  assert.deepEqual(byId['11'].waitsOn, ['09']);
  assert.ok(!m.frontier.includes('11'));
  assert.equal(byId['12'].state, 'blocked');
  assert.deepEqual(byId['12'].waitsOn, ['10']);

  const cleared = structuredClone(canvas);
  for (const node of cleared.trees[0].nodes) if (node.id === '09') node.undermined_by = [];
  const after = plain(radial.model(cleared));
  assert.equal(after.byId['09'].state, 'decided');
  assert.equal(after.byId['11'].state, 'now');
  assert.ok(after.frontier.includes('11'));
});

test('a claimed, out-of-scope or missing blocker also keeps dependents blocked', () => {
  assert.deepEqual(m.byId['24'].waitsOn, ['21']);
  assert.deepEqual(m.byId['27'].waitsOn, ['30']);
  assert.equal(m.byId['27'].state, 'blocked');
  const orphan = structuredClone(canvas);
  orphan.trees[0].nodes.find((n: any) => n.id === '13').blocked_by = ['99'];
  assert.equal(plain(radial.model(orphan)).byId['13'].state, 'blocked');
});

test('model records dependents and marks a claim stale only against a given clock', () => {
  assert.deepEqual(m.byId['01'].dependents, ['03', '04', '14']);
  assert.equal(m.byId['22'].stale, false);
  const at = plain(radial.model(canvas, { now: Date.parse('2026-10-14T12:00:00Z') }));
  assert.equal(at.byId['21'].stale, false);
  assert.equal(at.byId['22'].stale, true);
});

test('model does not change the canvas it reads', () => {
  const before = JSON.stringify(canvas);
  radial.model(canvas);
  radial.layout(canvas);
  assert.equal(JSON.stringify(canvas), before);
});

test('reached is false on the 30-ticket fixture and true on the reached variant', () => {
  assert.equal(m.reached, false);
  const done = plain(radial.model(reached));
  assert.equal(done.reached, true);
  assert.deepEqual(done.counts, { now: 0, redo: 0, claimed: 0, blocked: 0, patches: 0, decided: 27, oos: 3 });
  assert.deepEqual(done.frontier, []);
  assert.deepEqual(done.ring, []);
  assert.deepEqual(
    done.header.map((h: any) => h.key),
    ['decided', 'oos'],
  );
});

test('a single fog patch, claimed ticket or undermined ticket stops the destination being reached', () => {
  const withPatch = { ...reached, fog: [{ label: 'One more thing' }] };
  assert.equal(plain(radial.model(withPatch)).reached, false);
  const claimed = structuredClone(reached);
  Object.assign(claimed.trees[0].nodes[0], { status: 'claimed', claimed_by: 'a', claimed_at: '2026-10-14T09:00:00Z' });
  assert.equal(plain(radial.model(claimed)).reached, false);
  const under = structuredClone(reached);
  under.trees[0].nodes[0].undermined_by = ['02'];
  assert.equal(plain(radial.model(under)).reached, false);
});

const dist = (t: any) => Math.hypot(t.x, t.y);

test('layout puts each state in its ring band', () => {
  const { rings } = placed;
  assert.equal(placed.tickets.length, 30);
  for (const t of placed.tickets) {
    const d = dist(t);
    const state = m.byId[t.id].state;
    if (state === 'blocked') assert.ok(d > rings.destination && d < rings.fogEdge, `${t.id} fog band`);
    else if (['now', 'redo', 'claimed'].includes(state)) {
      assert.ok(d > rings.fogEdge && d < rings.frontierEdge, `${t.id} frontier band`);
    } else if (state === 'decided') assert.ok(d > rings.frontierEdge && d < rings.decidedEdge, `${t.id} decided band`);
    else assert.ok(d > rings.scope, `${t.id} beyond the scope ring`);
    assert.ok(Math.abs(d - t.dist) < 0.02, `${t.id} dist matches x, y`);
  }
});

test('layout orders the rings from the destination out, with out of scope beyond the scope ring', () => {
  const { rings } = placed;
  const order = [
    rings.destination,
    rings.patch,
    rings.fog,
    rings.fogEdge,
    rings.frontier,
    rings.frontierEdge,
    rings.decided,
    rings.decidedEdge,
    rings.scope,
    rings.oos,
    rings.outer,
  ];
  assert.deepEqual(
    [...order].sort((a, b) => a - b),
    order,
  );
  assert.equal(new Set(order).size, order.length);
  assert.equal(placed.hasOos, true);
  assert.ok(placed.tickets.filter((t: any) => t.state === 'oos').every((t: any) => dist(t) > rings.scope));
  assert.ok(placed.tickets.filter((t: any) => t.state === 'decided').every((t: any) => dist(t) < rings.scope));
});

test('layout draws one patch per fog item, inside the fog band', () => {
  assert.equal(placed.patches.length, canvas.fog.length);
  assert.deepEqual(
    placed.patches.map((p: any) => p.label),
    canvas.fog.map((f: any) => f.label),
  );
  for (const p of placed.patches) assert.ok(dist(p) > placed.rings.destination && dist(p) < placed.rings.fogEdge);
  assert.equal(plain(radial.layout(reached)).patches.length, 0);
});

test('no two circles overlap on the 30-ticket fixture', () => {
  const circles = [...placed.tickets, ...placed.patches];
  assert.equal(circles.length, 35);
  for (let i = 0; i < circles.length; i++) {
    const a = circles[i];
    assert.ok(dist(a) - a.radius >= placed.rings.destination, 'clear of the destination');
    for (let j = i + 1; j < circles.length; j++) {
      const b = circles[j];
      const gap = Math.hypot(a.x - b.x, a.y - b.y) - (a.radius + b.radius);
      assert.ok(gap >= 0, `${a.id ?? a.label} and ${b.id ?? b.label} overlap by ${-gap}`);
    }
  }
});

test('layout is deterministic and accepts a model or a canvas', () => {
  assert.deepEqual(plain(radial.layout(canvas)), placed);
  assert.deepEqual(plain(radial.layout(radial.model(canvas))), placed);
  assert.equal(JSON.stringify(radial.layout(canvas)), JSON.stringify(radial.layout(canvas)));
});

test('layout keeps a chain of tickets in one sector', () => {
  const angle = (id: string) => placed.tickets.find((t: any) => t.id === id).angle;
  const turn = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  assert.ok(turn(angle('05'), angle('07')) < turn(angle('05'), angle('30')));
});

test('layout copes with an empty map and a reached map', () => {
  const empty = plain(radial.layout({ version: 1, trees: [{ id: 't', nodes: [] }] }));
  assert.deepEqual(empty.tickets, []);
  assert.deepEqual(empty.patches, []);
  assert.equal(empty.hasOos, false);
  const done = plain(radial.layout(reached));
  assert.equal(done.tickets.length, 30);
  assert.ok(done.tickets.every((t: any) => t.state === 'decided' || t.state === 'oos'));
});

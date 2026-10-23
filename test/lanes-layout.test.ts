import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const radialPath = path.join(root, 'renderer', 'radial.js');
const lanesPath = path.join(root, 'renderer', 'lanes.js');
const fixture = (name: string) =>
  JSON.parse(readFileSync(path.join(root, 'test', 'fixtures', 'wayfinder', name), 'utf8'));

type ScriptGlobal = Record<string, any>;

function loadScript(file: string, exportName: string): ScriptGlobal {
  const context = vm.createContext({});
  vm.runInContext(readFileSync(file, 'utf8'), context);
  return (context as Record<string, ScriptGlobal>)[exportName];
}

const plain = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const RadialLayout = loadScript(radialPath, 'RadialLayout');
const LanesLayout = loadScript(lanesPath, 'LanesLayout');

const FIXTURES = [
  ['starter', 'starter-canvas.json'],
  ['medium', 'medium-canvas.json'],
  ['billing-30', 'billing-30-canvas.json'],
  ['reached', 'billing-30-reached-canvas.json'],
] as const;

function modelAndLayout(canvasName: string) {
  const canvas = fixture(canvasName);
  const model = plain(RadialLayout.model(canvas));
  const laid = plain(LanesLayout.layout(model));
  return { canvas, model, laid };
}

function edgesBetween(laid: any, from: string, to: string) {
  return laid.edges.filter((e: any) => e.from === from && e.to === to);
}

test('proof-wayfinder-lanes-vm (R1.1): lanes.js runs with no DOM and sets LanesLayout.layout', () => {
  assert.equal(typeof LanesLayout.layout, 'function');
});

for (const [label, file] of FIXTURES) {
  test(`proof-wayfinder-lanes-rows (R1.2) on ${label}: one row per ticket below blockers`, () => {
    const { model, laid } = modelAndLayout(file);
    const ticketRows = laid.rows.filter((id: string) => id !== 'S' && id !== 'F' && id !== 'D');
    assert.equal(ticketRows.length, model.tickets.length);
    for (const t of model.tickets) {
      const row = laid.rowOf[t.id];
      for (const b of t.blocked_by) {
        if (!model.byId[b]) continue;
        assert.ok(laid.rowOf[b] < row, `${t.id} must sit below blocker ${b}`);
      }
    }
    assert.equal(laid.rows[0], 'S');
    assert.equal(laid.rows.at(-1), 'D');
    if (model.fog.length) assert.ok(laid.rows.includes('F'));
  });

  test(`proof-wayfinder-lanes-packing (R1.4) on ${label}: lanes do not overlap`, () => {
    const { laid } = modelAndLayout(file);
    for (const line of laid.lines) {
      assert.ok(line.lane >= 0, `line ${line.id} lane index`);
    }
    const byLane = new Map<number, Array<{ start: number; end: number; id: number }>>();
    for (const line of laid.lines) {
      const span = { start: line.startRow, end: line.endRow, id: line.id };
      const list = byLane.get(line.lane) ?? [];
      for (const other of list) {
        const overlap = span.start < other.end && other.start < span.end;
        assert.ok(!overlap, `lines ${span.id} and ${other.id} overlap in lane ${line.lane}`);
      }
      list.push(span);
      byLane.set(line.lane, list);
    }
  });
}

test('proof-wayfinder-lanes-lines (R1.3): billing-30 line topology', () => {
  const { laid } = modelAndLayout('billing-30-canvas.json');
  const line06 = laid.lineOf['06'];
  const line03 = laid.lineOf['03'];
  const line04 = laid.lineOf['04'];
  assert.equal(line06, line03, '06 continues 03’s line');
  assert.notEqual(line04, line06, '04 keeps its own line');
  assert.ok(laid.interchange.includes('06'), '06 is an interchange (joins 04’s line)');
  assert.ok(edgesBetween(laid, '04', '06').some((e: any) => e.kind === 'join'));

  const line19 = laid.lineOf['19'];
  assert.notEqual(line19, line03);
  assert.ok(edgesBetween(laid, '03', '19').some((e: any) => e.kind === 'fork'));
  assert.ok(edgesBetween(laid, '04', '19').some((e: any) => e.kind === 'cross'));

  for (const id of ['28', '29', '30']) {
    const line = laid.lines.find((l: any) => l.id === laid.lineOf[id]);
    assert.equal(line?.end, 'buffer', `${id} ends in a buffer stop`);
  }
  for (const line of laid.lines) {
    if (line.oos || line.end === 'buffer' || line.tail === null) continue;
    assert.equal(line.end, 'destination', `open line ${line.id} runs to destination`);
  }
});

test('proof-wayfinder-lanes-track (R1.5): track solidity on billing-30 and reached', () => {
  const open = modelAndLayout('billing-30-canvas.json');
  for (const id of ['11', '12', '23', '24', '25', '26', '27']) {
    const incoming = open.laid.edges.filter((e: any) => e.to === id);
    assert.ok(incoming.length > 0, `edges into blocked ${id}`);
    assert.ok(
      incoming.every((e: any) => e.track === 'dashed'),
      `${id} has dashed incoming track`,
    );
  }
  const toDest = open.laid.edges.filter((e: any) => e.to === 'D' && e.kind === 'leaf');
  assert.ok(toDest.length > 0);
  assert.ok(
    toDest.every((e: any) => e.track === 'dashed'),
    'destination leaves dashed when not reached',
  );

  const reached = modelAndLayout('billing-30-reached-canvas.json');
  assert.ok(!reached.laid.edges.some((e: any) => e.track === 'dashed'), 'reached map has no dashed track');
});

test('proof-wayfinder-lanes-oos-blocker (R1.6): ticket 27 blocked by out-of-scope 30', () => {
  const { laid } = modelAndLayout('billing-30-canvas.json');
  assert.notEqual(laid.lineOf['27'], laid.lineOf['30']);
  assert.ok(edgesBetween(laid, '30', '27').some((e: any) => e.kind === 'fork'));
  const leaf = laid.edges.filter((e: any) => e.from === '27' && e.to === 'D');
  assert.ok(leaf.every((e: any) => e.track === 'dashed'));
});

test('proof-wayfinder-lanes-deterministic (R1.7): layout is stable and does not mutate the model', () => {
  for (const [, file] of FIXTURES) {
    const canvas = fixture(file);
    const model = plain(RadialLayout.model(canvas));
    const before = JSON.stringify(model);
    const a = plain(LanesLayout.layout(model));
    const b = plain(LanesLayout.layout(model));
    assert.equal(JSON.stringify(model), before);
    assert.deepEqual(a, b);
  }
});

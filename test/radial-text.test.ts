import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const radialPath = path.join(root, 'renderer', 'radial.js');
const canvas = JSON.parse(
  readFileSync(path.join(root, 'test', 'fixtures', 'wayfinder', 'billing-30-canvas.json'), 'utf8'),
);

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
const m = radial.model(canvas);
const placed = radial.layout(m);
const viewport = { width: 1200, height: 800 };
const k = radial.fitZoom(placed, viewport);
const all = plain(radial.labels(m, placed, { k })) as any[];

const overlap = (a: any, b: any) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

test('proof-wayfinder-labels-30: no two shown labels overlap at fitted zoom', () => {
  assert.ok(k > 0 && k < 1);
  const shown = all.filter((l) => l.shown);
  for (let i = 0; i < shown.length; i++) {
    for (let j = i + 1; j < shown.length; j++) {
      assert.equal(overlap(shown[i], shown[j]), false, `${shown[i].key} overlaps ${shown[j].key}`);
    }
  }
});

test('proof-wayfinder-labels-30: a default label is hidden only when it overlaps a shown label', () => {
  const defaults = all.filter((l) => l.default);
  assert.equal(defaults.length, 12 + 5);
  const shown = all.filter((l) => l.shown);
  const hidden = defaults.filter((l) => !l.shown);
  assert.ok(hidden.length > 0 && hidden.length < defaults.length);
  for (const label of hidden) {
    assert.ok(
      shown.some((other) => overlap(label, other)),
      `${label.key} is hidden with nothing in its way`,
    );
  }
});

test('proof-wayfinder-labels-30: decided and out-of-scope labels need hover, focus or all', () => {
  assert.equal(all.length, 12 + 5);
  assert.ok(all.every((l) => l.default));
  const hovered = plain(radial.labels(m, placed, { k, active: '08' })) as any[];
  assert.equal(hovered[0].key, 'ticket:08');
  assert.equal(hovered[0].shown, true);
  const everything = plain(radial.labels(m, placed, { k, all: true })) as any[];
  assert.equal(everything.length, 30 + 5);
  const shown = everything.filter((l) => l.shown);
  for (let i = 0; i < shown.length; i++) {
    for (let j = i + 1; j < shown.length; j++) assert.equal(overlap(shown[i], shown[j]), false);
  }
});

test('proof-wayfinder-labels-30: the frontier list names every ticket on the frontier ring', () => {
  const list = plain(radial.frontierList(m)) as any[];
  assert.equal(list.length, 12);
  assert.deepEqual(
    list.map((t) => t.id),
    ['09', '10', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22'],
  );
  assert.deepEqual(
    list.map((t) => t.id),
    [...plain(m.ring)].sort(),
  );
});

test('proof-wayfinder-focus-order: the frontier ring comes first, then the fog, decided and out of scope', () => {
  const order = plain(radial.focusOrder(m, placed)) as any[];
  const ring = new Set(plain(m.ring) as string[]);
  assert.equal(order.length, 30 + 5);
  assert.deepEqual(
    order
      .slice(0, 12)
      .map((e) => e.id)
      .sort(),
    [...ring].sort(),
  );
  const ringOf = (e: any) => (e.kind === 'patch' ? 'patch' : m.byId[e.id].ring);
  const kinds = order.slice(12).map(ringOf);
  assert.deepEqual([...new Set(kinds)], ['patch', 'fog', 'decided', 'oos']);
  assert.deepEqual(
    kinds,
    [...kinds].sort(
      (a, b) => ['patch', 'fog', 'decided', 'oos'].indexOf(a) - ['patch', 'fog', 'decided', 'oos'].indexOf(b),
    ),
  );
  assert.deepEqual(plain(radial.focusOrder(m, placed)), order);
});

const dest = 'Move billing to usage-based invoicing without a missed invoice cycle.';
const note = '  mind the cap \n';

test('proof-wayfinder-copy-text: handoff for a now ticket', () => {
  const head = [
    'Use the wayfinder skill to take ticket 14 on docs/maps/billing-30/.',
    '',
    'Ticket: docs/maps/billing-30/14-ledger-shape.md — Sketch the ledger tables (prototype)',
    `Destination: ${dest}`,
    'Question: What should we settle for: sketch the ledger tables?',
    'Decided blockers:',
    '- docs/maps/billing-30/01-audit-invoices.md — Audit the current invoice model — Invoices are flat per-seat lines',
    'Unblocks: 25 Write the cutover plan',
  ];
  assert.equal(radial.handoff(m, '14', ''), head.join('\n'));
  assert.equal(radial.handoff(m, '14', '   '), head.join('\n'));
  assert.equal(radial.handoff(m, '14', note), [...head, '', 'Note from the Human: mind the cap'].join('\n'));
});

test('proof-wayfinder-copy-text: handoff for a redo ticket', () => {
  const head = [
    'Use the wayfinder skill to re-resolve ticket 09 in place on docs/maps/billing-30/.',
    '',
    'Ticket: docs/maps/billing-30/09-free-tier.md — Size the free tier (grilling)',
    `Destination: ${dest}`,
    'Question: What should we settle for: size the free tier?',
    'Premise broken by: docs/maps/billing-30/07-rounding.md — Fix the rounding rule — Round per line, half up',
    'Decided blockers:',
    '- docs/maps/billing-30/02-pick-meter.md — Pick the usage meter — Bill on API calls, not seats',
    'Unblocks: 11 Price the usage tiers',
  ];
  assert.equal(radial.handoff(m, '09'), head.join('\n'));
  assert.equal(radial.handoff(m, '09', note), [...head, '', 'Note from the Human: mind the cap'].join('\n'));
});

test('proof-wayfinder-copy-text: handoff for a claimed ticket', () => {
  const head = [
    'Use the wayfinder skill to take ticket 21, which claude-code-4f2 claimed at 2026-10-14T09:00:00Z; confirm with me before taking it over on docs/maps/billing-30/.',
    '',
    'Ticket: docs/maps/billing-30/21-backfill-plan.md — Plan the historical backfill (research)',
    `Destination: ${dest}`,
    'Question: What should we settle for: plan the historical backfill?',
    'Decided blockers:',
    '- docs/maps/billing-30/02-pick-meter.md — Pick the usage meter — Bill on API calls, not seats',
    'Unblocks: 24 Run the backfill on staging',
  ];
  assert.equal(radial.handoff(m, '21', ''), head.join('\n'));
  assert.equal(radial.handoff(m, '21', note), [...head, '', 'Note from the Human: mind the cap'].join('\n'));
});

test('proof-wayfinder-copy-text: copyText for a blocked, a decided and an out-of-scope ticket', () => {
  const cases: [string, string][] = [
    ['12', 'docs/maps/billing-30/12-dunning.md — Plan the dunning flow (research), blocked'],
    ['05', 'docs/maps/billing-30/05-meter-events.md — Define the meter event schema (prototype), decided'],
    ['29', 'docs/maps/billing-30/29-self-serve-refund.md — Self-serve refunds (prototype), out of scope'],
  ];
  for (const [id, ticket] of cases) {
    const head = ['wayfinder feedback for docs/maps/billing-30/', `Ticket: ${ticket}`];
    assert.equal(radial.copyText(m, id, ''), head.join('\n'));
    assert.equal(radial.copyText(m, id, note), [...head, 'Note from the Human: mind the cap'].join('\n'));
  }
});

test('handoff and copyText return an empty string for an unknown id', () => {
  assert.equal(radial.handoff(m, '99', 'x'), '');
  assert.equal(radial.copyText(m, '99', 'x'), '');
});

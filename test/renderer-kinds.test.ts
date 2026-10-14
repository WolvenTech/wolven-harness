import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skillDir = path.join(root, 'templates', '.agents', 'skills', 'journey-map');
const buildScript = path.join(skillDir, 'scripts', 'build-map.mjs');

type Validate = (map: unknown, options?: { kinds?: string[] }) => string[];

function loadValidate(): Validate {
  const context = vm.createContext({});
  vm.runInContext(readFileSync(path.join(skillDir, 'renderer', 'logic.js'), 'utf8'), context);
  const logic = (context as { JourneyMapLogic: { validate: Validate } }).JourneyMapLogic;
  return (map, options) => [...logic.validate(map, options)];
}

const validate = loadValidate();
const ticketKinds = { kinds: ['ticket'] };

function ticket(id: string, extra: Record<string, unknown> = {}) {
  return { id, kind: 'ticket', label: `Ticket ${id}`, ticket: 'research', status: 'open', ...extra };
}

function board(...nodes: unknown[]) {
  return { version: 1, trees: [{ id: 'board', nodes }] };
}

test('default kinds: a ticket node is an unknown kind naming the node', () => {
  const errors = validate(board(ticket('t1')));
  assert.ok(errors.includes('t1: unknown kind ticket'), errors.join('\n'));
});

test('journey-map build: exits 1 on a ticket and names the node', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'kinds-'));
  try {
    const input = path.join(dir, 'ticket-map.json');
    writeFileSync(input, JSON.stringify(board(ticket('t1'))));
    const result = spawnSync(process.execPath, [buildScript, input], { encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /t1: unknown kind ticket/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('kinds ["ticket"]: a ticket-only tree with no start passes', () => {
  const map = board(ticket('t1', { status: 'closed' }), ticket('t2', { blocked_by: ['t1'] }));
  assert.deepEqual(validate(map, ticketKinds), []);
});

const faults: Array<[string, unknown[], RegExp]> = [
  ['blocked_by names no node', [ticket('t1', { blocked_by: ['nope'] })], /^t1: blocked_by target nope does not exist$/],
  [
    'blocked_by names a non-ticket node',
    [ticket('t1', { blocked_by: ['t2'] }), { id: 't2', kind: 'text', label: 'Text', next: 't1' }],
    /^t1: blocked_by target t2 is not a ticket$/,
  ],
  [
    'undermined_by names no node',
    [ticket('t1', { status: 'closed', undermined_by: ['nope'] })],
    /^t1: undermined_by target nope does not exist$/,
  ],
  [
    'undermined_by names a non-ticket node',
    [ticket('t1', { status: 'closed', undermined_by: ['t2'] }), { id: 't2', kind: 'text', label: 'Text' }],
    /^t1: undermined_by target t2 is not a ticket$/,
  ],
  [
    'blocked_by cycle',
    [ticket('t1', { blocked_by: ['t2'] }), ticket('t2', { blocked_by: ['t1'] })],
    /^t[12]: cycle in tree$/,
  ],
  ['bad ticket value', [ticket('t1', { ticket: 'epic' })], /^t1: bad ticket epic$/],
  ['bad status value', [ticket('t1', { status: 'done' })], /^t1: bad status done$/],
  [
    'claimed_by without claimed_at',
    [ticket('t1', { status: 'claimed', claimed_by: 'a' })],
    /^t1: claimed_by and claimed_at/,
  ],
  [
    'claimed_at without claimed_by',
    [ticket('t1', { status: 'claimed', claimed_at: '2026-10-14T00:00:00Z' })],
    /^t1: claimed_by and claimed_at/,
  ],
  [
    'undermined_by on an open ticket',
    [ticket('t1', { undermined_by: ['t2'] }), ticket('t2', { status: 'closed' })],
    /^t1: undermined_by needs status closed or claimed, not open$/,
  ],
];

for (const [name, nodes, expected] of faults) {
  test(`kinds ["ticket"]: ${name} names the ticket`, () => {
    const errors = validate(board(...nodes), ticketKinds);
    assert.ok(
      errors.some((error) => expected.test(error)),
      errors.join('\n'),
    );
  });
}

test('kinds ["ticket"]: an undermined closed or claimed ticket passes', () => {
  const map = board(
    ticket('t1', { status: 'closed', undermined_by: ['t2'] }),
    ticket('t2', { status: 'claimed', claimed_by: 'a', claimed_at: '2026-10-14T00:00:00Z' }),
  );
  assert.deepEqual(validate(map, ticketKinds), []);
});

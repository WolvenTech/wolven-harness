import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixtures = path.join(root, 'test', 'fixtures', 'journey-map');
const logicPath = path.join(root, 'templates', '.agents', 'skills', 'journey-map', 'renderer', 'logic.js');

// invariant: baseline.json was computed from main's logic.js before any renderer edit; it is never regenerated.
const baseline = JSON.parse(readFileSync(path.join(fixtures, 'baseline.json'), 'utf8'));

function loadLogic(): Record<string, any> {
  const context = vm.createContext({});
  vm.runInContext(readFileSync(logicPath, 'utf8'), context);
  return (context as { JourneyMapLogic: Record<string, any> }).JourneyMapLogic;
}

const names = readdirSync(fixtures)
  .filter((name) => name.endsWith('.json') && name !== 'baseline.json')
  .sort();

test('the baseline covers every journey-map fixture', () => {
  assert.match(baseline.source, /^main@[0-9a-f]{40}$/);
  assert.deepEqual(Object.keys(baseline.fixtures).sort(), names);
});

for (const name of names) {
  test(`${name}: validate and layout match the main baseline`, () => {
    const logic = loadLogic();
    const map = JSON.parse(readFileSync(path.join(fixtures, name), 'utf8'));
    const errors = [...logic.validate(map)];
    assert.deepEqual(errors, baseline.fixtures[name].validate);
    // why: the baseline went through JSON, so layout is compared after the same round trip.
    const layout = errors.length ? null : JSON.parse(JSON.stringify(logic.layout(map)));
    assert.deepEqual(layout, baseline.fixtures[name].layout);
  });
}

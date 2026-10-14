import assert from 'node:assert/strict';
import { test } from 'node:test';
import { makeRepo, run } from './helpers/fixture.js';

const mapDoc = (type: string) => `---\ntype: ${type}\ntitle: M\ndescription: fixture\nstatus: stable\n---\n`;

test('maps: a valid map with ticket files gives no finding', async () => {
  const dir = await makeRepo(
    {
      'docs/maps/m/m-map.md': mapDoc('map'),
      'docs/maps/m/01-first-ticket.md': '# no frontmatter',
      'docs/maps/m/02-second-ticket.md': '---\ntype: bogus\n---\n',
    },
    { git: true },
  );
  const result = await run(['validate'], { cwd: dir });
  assert.equal(result.code, 0, result.stdout);
  assert.doesNotMatch(result.stdout, /profile-/);
});

test('maps: another type on the main doc warns profile-map-doc and exits 0', async () => {
  const dir = await makeRepo({ 'docs/maps/m/m-map.md': mapDoc('note') }, { git: true });
  const result = await run(['validate'], { cwd: dir });
  assert.equal(result.code, 0, result.stdout);
  assert.match(result.stdout, /warn \[profile-map-doc\].*m-map\.md/);
});

test('maps: a missing main doc warns profile-map-doc and exits 0', async () => {
  const dir = await makeRepo({ 'docs/maps/m/01-first-ticket.md': '# ticket' }, { git: true });
  const result = await run(['validate'], { cwd: dir });
  assert.equal(result.code, 0, result.stdout);
  assert.match(result.stdout, /warn \[profile-map-doc\].*m-map\.md/);
});

test('maps: a flat file under docs/maps warns profile-map-doc and exits 0', async () => {
  const dir = await makeRepo({ 'docs/maps/flat.md': mapDoc('map') }, { git: true });
  const result = await run(['validate'], { cwd: dir });
  assert.equal(result.code, 0, result.stdout);
  assert.match(result.stdout, /warn \[profile-map-doc\].*flat\.md/);
});

test('maps: anything under docs/maps/archived gives no finding', async () => {
  const dir = await makeRepo(
    {
      'docs/maps/archived/old/old-map.md': '# no frontmatter',
      'docs/maps/archived/loose.md': '# no frontmatter',
    },
    { git: true },
  );
  const result = await run(['validate'], { cwd: dir });
  assert.equal(result.code, 0, result.stdout);
  assert.doesNotMatch(result.stdout, /profile-/);
});

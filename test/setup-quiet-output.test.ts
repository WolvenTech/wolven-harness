import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { readConfig } from '../src/setup/config.js';
import { HARNESS_SCORE_VERSION } from '../src/setup/harness-score.js';
import { runSetup } from '../src/setup/index.js';
import type { Io } from '../src/setup/types.js';
import { makeRepo } from './helpers/fixture.js';
import { makeIo } from './helpers/io.js';

const flags = ['--git-host', 'gh', '--runtimes', 'claude', '--skills', 'none'];

function capture(io: Io): { out: () => string; err: () => string } {
  let out = '';
  let err = '';
  io.stdout.on('data', (chunk) => {
    out += String(chunk);
  });
  io.stderr.on('data', (chunk) => {
    err += String(chunk);
  });
  return { out: () => out, err: () => err };
}

test('proof-iter1-quiet-hints / proof-iter1-terminal-text: a quiet run names the global install and the pinned score command with no backticks', async () => {
  const root = await makeRepo({ 'package.json': '{"name":"client"}\n' }, { git: true });
  const io = { ...makeIo(root), execPath: '/client/node_modules/.bin/wolven-harness' };
  const seen = capture(io);
  assert.equal(await runSetup([...flags, '--package-manager', 'pnpm'], io), 0);
  const text = `${seen.out()}${seen.err()}`;

  assert.match(text, /pnpm add -g @wolven-tech\/harness/);
  assert.match(
    text,
    new RegExp(`pnpm dlx harness-score@${HARNESS_SCORE_VERSION} --config \\.wolven-harness/\\.harness-score\\.json`),
  );
  assert.doesNotMatch(text, /`/);
  assert.equal(JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')).scripts, undefined);
});

test('proof-iter1-no-pm-prompt: a quiet run on a terminal asks no package-manager question and still records a valid config', async () => {
  const root = await makeRepo({ 'package.json': '{"name":"client"}\n' }, { git: true });
  const asked: string[] = [];
  const io: Io = {
    ...makeIo(root),
    isTTY: true,
    prompts: {
      async select(o) {
        asked.push(o.message);
        return undefined;
      },
      async multiselect(o) {
        asked.push(o.message);
        return undefined;
      },
    },
  };
  assert.equal(await runSetup([...flags, '--package-manager', 'bogus'], io), 0);
  assert.deepEqual(asked, []);
  const config = await readConfig(root);
  assert.equal(config?.layout, 'linked');
  assert.equal(config.packageManager, 'npm');
});

test('proof-iter1-no-pm-prompt: several lockfiles neither ask nor stop a quiet run', async () => {
  const root = await makeRepo({ 'package-lock.json': '{}\n', 'pnpm-lock.yaml': '' }, { git: true });
  assert.equal(await runSetup(flags, makeIo(root)), 0);
  assert.equal((await readConfig(root))?.packageManager, 'none');
});

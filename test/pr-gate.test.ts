import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function readWorkflow(): Promise<Record<string, any>> {
  return parseYaml(await readFile(path.join(repoRoot, '.github/workflows/ci.yml'), 'utf8'));
}

test('pr-gate: triggers on pull_request to main', async () => {
  const workflow = await readWorkflow();

  assert.deepEqual(workflow.on, { pull_request: { branches: ['main'] } });
});

test('pr-gate: workflow permissions are exactly contents read, with no job widening them', async () => {
  const workflow = await readWorkflow();

  assert.deepEqual(workflow.permissions, { contents: 'read' });
  for (const job of Object.values<Record<string, any>>(workflow.jobs)) {
    assert.equal(job.permissions, undefined, 'no job sets its own permissions');
  }
});

test('pr-gate: the package-gate job runs install, build, test, validate, comments, then packs with the release npm', async () => {
  const workflow = await readWorkflow();
  const job = workflow.jobs['package-gate'];

  assert.ok(job, 'package-gate job present');

  const runs = job.steps.filter((s: Record<string, any>) => s.run).map((s: Record<string, any>) => String(s.run));
  assert.deepEqual(runs, [
    'pnpm install --frozen-lockfile',
    'pnpm build',
    'pnpm test',
    'pnpm validate',
    'pnpm comments',
    'npm install -g npm@11.20.0',
    'npm pack --dry-run',
  ]);
});

test('pr-gate: pnpm is pinned to an exact version and node-version is set', async () => {
  const workflow = await readWorkflow();
  const steps: Record<string, any>[] = workflow.jobs['package-gate'].steps;

  const pnpmSetup = steps.find((s) => String(s.uses ?? '').startsWith('pnpm/action-setup@'));
  assert.ok(pnpmSetup, 'pnpm/action-setup step present');
  assert.match(String(pnpmSetup.with?.version), /^\d+\.\d+\.\d+$/);

  const nodeSetup = steps.find((s) => String(s.uses ?? '').startsWith('actions/setup-node@'));
  assert.ok(nodeSetup, 'actions/setup-node step present');
  assert.ok(nodeSetup.with?.['node-version'], 'node-version present');
});

test('pr-gate: the workflow names no secret', async () => {
  const raw = await readFile(path.join(repoRoot, '.github/workflows/ci.yml'), 'utf8');

  assert.doesNotMatch(raw, /secrets\./);
});

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

/** The `run` commands of a job's steps, in order. */
function runsOf(job: Record<string, any>): string[] {
  return job.steps.filter((s: Record<string, any>) => s.run).map((s: Record<string, any>) => String(s.run));
}

test('pr-gate: the lint job builds, validates the harness, and checks comments on full history', async () => {
  const workflow = await readWorkflow();
  const job = workflow.jobs.lint;

  assert.ok(job, 'lint job present');
  assert.deepEqual(runsOf(job), ['pnpm install --frozen-lockfile', 'pnpm build', 'pnpm validate', 'pnpm comments']);

  const checkout = job.steps.find((s: Record<string, any>) => String(s.uses ?? '').startsWith('actions/checkout@'));
  assert.equal(checkout?.with?.['fetch-depth'], 0);
});

test('pr-gate: the test job builds and tests on Node 22 and 24', async () => {
  const workflow = await readWorkflow();
  const job = workflow.jobs.test;

  assert.ok(job, 'test job present');
  assert.deepEqual(runsOf(job), ['pnpm install --frozen-lockfile', 'pnpm build', 'pnpm test']);

  const matrix: unknown[] = job.strategy?.matrix?.node ?? [];
  assert.ok(matrix.includes(22), 'node 22 in matrix');
  assert.ok(matrix.includes(24), 'node 24 in matrix');

  const nodeSetup = job.steps.find((s: Record<string, any>) => String(s.uses ?? '').startsWith('actions/setup-node@'));
  assert.equal(nodeSetup?.with?.['node-version'], '${{ matrix.node }}');
});

test('pr-gate: the package job runs after lint and test, packs with the release npm, and smoke-tests the tarball', async () => {
  const workflow = await readWorkflow();
  const job = workflow.jobs.package;

  assert.ok(job, 'package job present');
  assert.deepEqual(job.needs, ['lint', 'test']);

  const runs = runsOf(job);
  assert.ok(runs.includes('npm install -g npm@11.20.0'), 'release npm pinned');
  const joined = runs.join('\n');
  assert.match(joined, /npm pack/);
  assert.match(joined, /wolven-harness setup/);
  assert.match(joined, /wolven-harness validate/);
});

test('pr-gate: every job pins pnpm to an exact version, sets node-version, and names every step', async () => {
  const workflow = await readWorkflow();

  for (const [id, job] of Object.entries<Record<string, any>>(workflow.jobs)) {
    assert.ok(job.name, `${id} has a display name`);
    const steps: Record<string, any>[] = job.steps;

    const pnpmSetup = steps.find((s) => String(s.uses ?? '').startsWith('pnpm/action-setup@'));
    assert.match(String(pnpmSetup?.with?.version), /^\d+\.\d+\.\d+$/, `${id} pins pnpm`);

    const nodeSetup = steps.find((s) => String(s.uses ?? '').startsWith('actions/setup-node@'));
    assert.ok(nodeSetup?.with?.['node-version'], `${id} sets node-version`);

    for (const step of steps) assert.ok(step.name, `${id} names every step`);
  }
});

test('pr-gate: the workflow names no secret', async () => {
  const raw = await readFile(path.join(repoRoot, '.github/workflows/ci.yml'), 'utf8');

  assert.doesNotMatch(raw, /secrets\./);
});

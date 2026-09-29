import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function readWorkflow(): Promise<Record<string, any>> {
  return parseYaml(await readFile(path.join(repoRoot, '.github/workflows/ci.yml'), 'utf8'));
}

test('pr-gate: triggers on pull requests to main, including title edits', async () => {
  const workflow = await readWorkflow();

  assert.deepEqual(workflow.on, {
    pull_request: { branches: ['main'], types: ['opened', 'edited', 'synchronize', 'reopened'] },
  });
});

test('pr-gate: workflow permissions are exactly contents, pull-requests and checks read, with no job widening them', async () => {
  const workflow = await readWorkflow();

  assert.deepEqual(workflow.permissions, { contents: 'read', 'pull-requests': 'read', checks: 'read' });
  for (const job of Object.values<Record<string, any>>(workflow.jobs)) {
    assert.equal(job.permissions, undefined, 'no job sets its own permissions');
  }
});

/** The `run` commands of a job's steps, in order. */
function runsOf(job: Record<string, any>): string[] {
  return job.steps.filter((s: Record<string, any>) => s.run).map((s: Record<string, any>) => String(s.run));
}

test('pr-gate: the lint job builds, validates the harness, checks comments on full history, and scores the harness', async () => {
  const workflow = await readWorkflow();
  const job = workflow.jobs.lint;

  assert.ok(job, 'lint job present');
  assert.deepEqual(runsOf(job), [
    'pnpm install --frozen-lockfile',
    'pnpm build',
    'pnpm lint',
    'pnpm validate',
    'pnpm comments',
    'pnpm score',
  ]);

  const checkout = job.steps.find((s: Record<string, any>) => String(s.uses ?? '').startsWith('actions/checkout@'));
  assert.equal(checkout?.with?.['fetch-depth'], 0);
});

test('pr-gate: the test job tests from source on Node 22 and 24', async () => {
  const workflow = await readWorkflow();
  const job = workflow.jobs.test;

  assert.ok(job, 'test job present');
  assert.deepEqual(runsOf(job), ['pnpm install --frozen-lockfile', 'pnpm test']);

  const matrix: unknown[] = job.strategy?.matrix?.node ?? [];
  assert.ok(matrix.includes(22), 'node 22 in matrix');
  assert.ok(matrix.includes(24), 'node 24 in matrix');

  const nodeSetup = job.steps.find((s: Record<string, any>) => String(s.uses ?? '').startsWith('actions/setup-node@'));
  assert.equal(nodeSetup?.with?.['node-version'], '${{ matrix.node }}');
});

test('pr-gate: the package job runs in parallel, packs with the release npm, and smoke-tests the tarball', async () => {
  const workflow = await readWorkflow();
  const job = workflow.jobs.package;

  assert.ok(job, 'package job present');
  assert.equal(job.needs, undefined, 'package waits on no other job');

  const runs = runsOf(job);
  assert.ok(runs.includes('npm install -g npm@11.20.0'), 'release npm pinned');
  const joined = runs.join('\n');
  assert.match(joined, /npm pack/);
  assert.match(joined, /wolven-harness setup/);
  assert.match(joined, /wolven-harness validate/);
  assert.match(joined, /pnpm harness:score/);
});

test('pr-gate: every job has a display name and names every step; every job that installs pins pnpm and node', async () => {
  const workflow = await readWorkflow();

  for (const [id, job] of Object.entries<Record<string, any>>(workflow.jobs)) {
    assert.ok(job.name, `${id} has a display name`);
    const steps: Record<string, any>[] = job.steps;
    for (const step of steps) assert.ok(step.name, `${id} names every step`);
    if (!runsOf(job).includes('pnpm install --frozen-lockfile')) continue;

    const pnpmSetup = steps.find((s) => String(s.uses ?? '').startsWith('pnpm/action-setup@'));
    assert.match(String(pnpmSetup?.with?.version), /^\d+\.\d+\.\d+$/, `${id} pins pnpm`);

    const nodeSetup = steps.find((s) => String(s.uses ?? '').startsWith('actions/setup-node@'));
    assert.ok(nodeSetup?.with?.['node-version'], `${id} sets node-version`);
  }
});

test('pr-gate: the title job checks the PR title against Conventional Commits', async () => {
  const workflow = await readWorkflow();
  const job = workflow.jobs.title;

  assert.ok(job, 'title job present');
  const check = job.steps.find((s: Record<string, any>) =>
    String(s.uses ?? '').startsWith('amannn/action-semantic-pull-request@'),
  );
  assert.ok(check, 'Conventional Commits title check present');
  assert.equal(check.env?.GITHUB_TOKEN, '${{ secrets.GITHUB_TOKEN }}');
});

const EDIT_ONLY_SKIP = "${{ github.event.action != 'edited' || github.event.changes.base }}";

test('pr-gate: edit runs and code runs use separate concurrency groups and cancel in progress', async () => {
  const workflow = await readWorkflow();

  assert.match(workflow.concurrency.group, /'edit'/);
  assert.match(workflow.concurrency.group, /'code'/);
  assert.match(workflow.concurrency.group, /github\.event\.changes\.base/);
  assert.equal(workflow.concurrency['cancel-in-progress'], true);
});

test('pr-gate: lint, test and package skip on edit-only runs; title always runs', async () => {
  const workflow = await readWorkflow();

  for (const id of ['lint', 'test', 'package'])
    assert.equal(workflow.jobs[id].if, EDIT_ONLY_SKIP, `${id} skips edit-only runs`);
  assert.equal(workflow.jobs.title.if, undefined);
});

test('pr-gate: the CI job fans in every other job, always runs, and checks the required runs by display name', async () => {
  const workflow = await readWorkflow();
  const job = workflow.jobs.ci;

  assert.ok(job, 'ci gate job present');
  assert.equal(job.name, 'CI');
  const others = Object.keys(workflow.jobs).filter((id) => id !== 'ci');
  assert.deepEqual([...job.needs].sort(), others.sort(), 'the gate needs every other job');
  assert.equal(job.if, '${{ always() }}');

  const step = job.steps[0];
  assert.equal(step.env?.RESULTS, "${{ join(needs.*.result, ' ') }}");
  assert.equal(step.env?.EDIT_ONLY, "${{ github.event.action == 'edited' && !github.event.changes.base }}");
  assert.equal(step.env?.GH_TOKEN, '${{ github.token }}');
  assert.match(String(step.run), /\[\[ "\$result" == success \]\] \|\| exit 1/);
  assert.doesNotMatch(String(step.run), /\$\{\{/, 'the script interpolates no expressions');

  const expected = [
    workflow.jobs.lint.name,
    ...workflow.jobs.test.strategy.matrix.node.map((n: number) =>
      workflow.jobs.test.name.replace('${{ matrix.node }}', String(n)),
    ),
    workflow.jobs.package.name,
  ];
  const required = String(step.env?.REQUIRED)
    .split('\n')
    .filter((line) => line.length > 0);
  assert.deepEqual([...required].sort(), [...expected].sort(), 'required names match the job display names');
});

test('pr-gate: the workflow names no secret beyond the built-in GITHUB_TOKEN', async () => {
  const raw = await readFile(path.join(repoRoot, '.github/workflows/ci.yml'), 'utf8');

  const secrets = [...raw.matchAll(/secrets\.(\w+)/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(secrets)], ['GITHUB_TOKEN']);
});

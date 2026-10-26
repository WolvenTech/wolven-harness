import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
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

  const include: Record<string, unknown>[] = job.strategy?.matrix?.include ?? [];
  assert.deepEqual(
    include.map((entry) => entry.line),
    [22, 24],
    'node 22 and 24 lines in matrix',
  );
  for (const entry of include) {
    assert.match(
      String(entry.node),
      new RegExp(`^${entry.line}\\.\\d+\\.\\d+$`),
      `node ${entry.line} is an exact patch`,
    );
  }
  assert.equal(job.name, 'Test (Node ${{ matrix.line }})');

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

/** The jq program the title-only gate uses to read code-job conclusions. */
function editDecisionProgram(run: string): string {
  const match = run.match(/jq -s -r '([\s\S]*?)'\n/);
  assert.ok(match, 'title-only gate embeds a jq program');
  return match[1];
}

function decideEdit(program: string, body: string): string {
  const result = spawnSync('jq', ['-s', '-r', program], { input: body, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

test('pr-gate: title-only edits still report CI and do not pass on the title alone', async () => {
  const workflow = await readWorkflow();
  const job = workflow.jobs.ci;

  assert.ok(job, 'ci gate job present');
  assert.equal(job.name, 'CI');
  const others = Object.keys(workflow.jobs).filter((id) => id !== 'ci');
  assert.deepEqual([...job.needs].sort(), others.sort(), 'the gate needs every other job');
  assert.equal(job.if, '${{ always() }}');

  const step = job.steps[0];
  const run = String(step.run);
  assert.equal(step.env?.GH_TOKEN, '${{ secrets.GITHUB_TOKEN }}');
  assert.equal(step.env?.HEAD_SHA, '${{ github.event.pull_request.head.sha }}');
  assert.equal(step.env?.RESULTS, "${{ join(needs.*.result, ' ') }}");
  assert.equal(step.env?.EDIT_ONLY, "${{ github.event.action == 'edited' && !github.event.changes.base }}");
  assert.equal(step.env?.TITLE_RESULT, '${{ needs.title.result }}');
  assert.match(run, /if \[\[ "\$EDIT_ONLY" == true \]\]; then[\s\S]*Title: \$TITLE_RESULT/);
  assert.match(run, /for result in \$RESULTS; do \[\[ "\$result" == success \]\] \|\| exit 1; done/);
  assert.doesNotMatch(run, /\$\{\{/, 'the script interpolates no expressions');

  const titleAt = run.indexOf('Title: $TITLE_RESULT');
  const decisionAt = run.indexOf('jq -s -r');
  assert.ok(titleAt >= 0 && decisionAt > titleAt, 'code-job mirror follows the title check');
  assert.doesNotMatch(run.slice(titleAt, decisionAt), /exit 0/);

  const program = editDecisionProgram(run);
  const pass = JSON.stringify({
    check_runs: [
      { name: 'Lint', status: 'completed', conclusion: 'failure', started_at: '2026-10-23T21:00:00Z' },
      { name: 'Lint', status: 'completed', conclusion: 'success', started_at: '2026-10-23T21:20:00Z' },
      { name: 'Lint', status: 'completed', conclusion: 'skipped', started_at: '2026-10-23T21:30:00Z' },
      { name: 'Test (Node 22)', status: 'completed', conclusion: 'success', started_at: '2026-10-23T21:00:00Z' },
      { name: 'Test (Node 24)', status: 'completed', conclusion: 'success', started_at: '2026-10-23T21:00:00Z' },
      { name: 'Package', status: 'completed', conclusion: 'success', started_at: '2026-10-23T21:00:00Z' },
      {
        name: 'Test (Node ${{ matrix.node }})',
        status: 'completed',
        conclusion: 'skipped',
        started_at: '2026-10-23T21:30:00Z',
      },
    ],
  });
  assert.equal(decideEdit(program, pass), 'pass');

  const waiting = JSON.stringify({
    check_runs: [
      { name: 'Lint', status: 'completed', conclusion: 'success', started_at: '2026-10-23T21:00:00Z' },
      { name: 'Test (Node 22)', status: 'in_progress', conclusion: null, started_at: '2026-10-23T21:11:00Z' },
      { name: 'Test (Node 24)', status: 'completed', conclusion: 'success', started_at: '2026-10-23T21:00:00Z' },
      { name: 'Package', status: 'completed', conclusion: 'success', started_at: '2026-10-23T21:00:00Z' },
    ],
  });
  assert.equal(decideEdit(program, waiting), 'wait');

  const failed = JSON.stringify({
    check_runs: [
      { name: 'Lint', status: 'completed', conclusion: 'failure', started_at: '2026-10-23T21:00:00Z' },
      { name: 'Test (Node 22)', status: 'completed', conclusion: 'success', started_at: '2026-10-23T21:00:00Z' },
      { name: 'Test (Node 24)', status: 'completed', conclusion: 'success', started_at: '2026-10-23T21:00:00Z' },
      { name: 'Package', status: 'completed', conclusion: 'success', started_at: '2026-10-23T21:00:00Z' },
    ],
  });
  assert.equal(decideEdit(program, failed), 'fail');
});

test('pr-gate: the workflow names no secret beyond the built-in GITHUB_TOKEN', async () => {
  const raw = await readFile(path.join(repoRoot, '.github/workflows/ci.yml'), 'utf8');

  const secrets = [...raw.matchAll(/secrets\.(\w+)/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(secrets)], ['GITHUB_TOKEN']);
});

test('pr-gate: every job sets explicit timeout-minutes to prevent stale hanging runs', async () => {
  const workflow = await readWorkflow();

  for (const [id, job] of Object.entries<Record<string, any>>(workflow.jobs)) {
    assert.ok(typeof job['timeout-minutes'] === 'number', `${id} defines timeout-minutes`);
    assert.ok(job['timeout-minutes'] <= 15, `${id} timeout is at most 15 minutes`);
  }
});

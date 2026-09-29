import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function readWorkflow(): Promise<Record<string, any>> {
  return parseYaml(await readFile(path.join(repoRoot, '.github/workflows/pr-title.yml'), 'utf8'));
}

test('pr-title: runs on opened, edited, synchronize and reopened pull requests', async () => {
  const workflow = await readWorkflow();

  assert.deepEqual(workflow.on, {
    pull_request: { types: ['opened', 'edited', 'synchronize', 'reopened'] },
  });
});

test('pr-title: holds pull-requests read and nothing else', async () => {
  const workflow = await readWorkflow();

  assert.deepEqual(workflow.permissions, { 'pull-requests': 'read' });
  for (const job of Object.values<Record<string, any>>(workflow.jobs)) {
    assert.equal(job.permissions, undefined, 'no job widens the workflow permissions');
  }
});

test('pr-title: checks the title against Conventional Commits', async () => {
  const workflow = await readWorkflow();
  const steps: Record<string, any>[] = Object.values<Record<string, any>>(workflow.jobs).flatMap((j) => j.steps);
  const check = steps.find((s) => String(s.uses ?? '').startsWith('amannn/action-semantic-pull-request@'));

  assert.ok(check, 'Conventional Commits title check present');
  assert.equal(check.env?.GITHUB_TOKEN, '${{ secrets.GITHUB_TOKEN }}');
});

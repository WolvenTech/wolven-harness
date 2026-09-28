import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function readJson(rel: string): Promise<Record<string, any>> {
  return JSON.parse(await readFile(path.join(repoRoot, rel), 'utf8'));
}

async function readWorkflow(): Promise<Record<string, any>> {
  return parseYaml(await readFile(path.join(repoRoot, '.github/workflows/release.yml'), 'utf8'));
}

test('package-manifest: publishes to GitHub Packages from the WolvenTech repository', async () => {
  const pkg = await readJson('package.json');

  assert.equal(pkg.name, '@wolventech/wolven-harness');
  assert.equal(pkg.publishConfig?.registry, 'https://npm.pkg.github.com');
  assert.equal(pkg.repository?.url, 'https://github.com/WolvenTech/wolven-harness.git');
});

test('package-manifest: the tarball ships only dist and templates beside the default files', async () => {
  const pkg = await readJson('package.json');

  assert.deepEqual(pkg.files, ['dist', 'templates']);
});

test('release-workflow: release-please runs on push to main with the manifest config', async () => {
  const workflow = await readWorkflow();

  assert.deepEqual(workflow.on, { push: { branches: ['main'] } });

  const steps: Record<string, any>[] = workflow.jobs['release-please'].steps;
  const release = steps.find((s) => String(s.uses ?? '').startsWith('googleapis/release-please-action@'));
  assert.ok(release, 'release-please step present');
  assert.equal(release.id, 'release');
  assert.equal(release.with['config-file'], 'release-please-config.json');
  assert.equal(release.with['manifest-file'], '.release-please-manifest.json');
});

test('release-workflow: permissions are exactly contents, pull-requests and packages write', async () => {
  const workflow = await readWorkflow();

  assert.deepEqual(workflow.permissions, {
    contents: 'write',
    'pull-requests': 'write',
    packages: 'write',
  });
  for (const job of Object.values<Record<string, any>>(workflow.jobs)) {
    assert.equal(job.permissions, undefined, 'no job widens the workflow permissions');
  }
});

test('release-workflow: on a created release it installs, builds, tests, then publishes with GITHUB_TOKEN', async () => {
  const workflow = await readWorkflow();
  const steps: Record<string, any>[] = workflow.jobs['release-please'].steps;
  const releaseIndex = steps.findIndex((s) => s.id === 'release');

  const after = steps.slice(releaseIndex + 1);
  for (const step of after) {
    assert.match(String(step.if), /steps\.release\.outputs\.release_created/);
  }

  const runs = after.filter((s) => s.run).map((s) => String(s.run));
  assert.deepEqual(runs, ['pnpm install --frozen-lockfile', 'pnpm build', 'pnpm test', 'pnpm publish --no-git-checks']);

  const publish = after.find((s) => String(s.run ?? '').startsWith('pnpm publish'));
  assert.equal(publish?.env?.NODE_AUTH_TOKEN, '${{ secrets.GITHUB_TOKEN }}');

  const setupNode = after.find((s) => String(s.uses ?? '').startsWith('actions/setup-node@'));
  assert.equal(setupNode?.with?.['registry-url'], 'https://npm.pkg.github.com');
});

test('release-workflow: the workflow names no secret beyond GITHUB_TOKEN', async () => {
  const raw = await readFile(path.join(repoRoot, '.github/workflows/release.yml'), 'utf8');
  const secrets = [...raw.matchAll(/secrets\.([A-Za-z_]+)/g)].map((m) => m[1]);

  assert.ok(secrets.length > 0);
  assert.deepEqual([...new Set(secrets)], ['GITHUB_TOKEN']);
});

test('release-workflow: with no release tag yet the first release is 0.1.0, with minor bumps before 1.0', async () => {
  const config = await readJson('release-please-config.json');
  const manifest = await readJson('.release-please-manifest.json');

  assert.equal(config['release-type'], 'node');
  assert.equal(config['bump-minor-pre-major'], true);
  assert.equal(config['include-component-in-tag'], false);
  assert.ok(config.packages?.['.'], 'root package configured');
  // why: release-please ignores the manifest's 0.0.0 until a tag exists and defaults the first release to 1.0.0.
  assert.equal(config.packages['.']['initial-version'], '0.1.0');
  assert.deepEqual(manifest, { '.': '0.0.0' });
});

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

test('package-name: publishes publicly to npmjs as @wolven/harness from the WolvenTech repository', async () => {
  const pkg = await readJson('package.json');
  const releaseConfig = await readJson('release-please-config.json');

  assert.equal(pkg.name, '@wolven/harness');
  assert.equal(pkg.bin['wolven-harness'], 'dist/cli.js');
  assert.deepEqual(pkg.publishConfig, { access: 'public' });
  assert.equal(pkg.repository?.url, 'https://github.com/WolvenTech/wolven-harness.git');
  assert.equal(releaseConfig.packages['.']['package-name'], pkg.name);
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

test('release-oidc: permissions are exactly contents, pull-requests write and id-token write', async () => {
  const workflow = await readWorkflow();

  assert.deepEqual(workflow.permissions, {
    contents: 'write',
    'pull-requests': 'write',
    'id-token': 'write',
  });
  for (const job of Object.values<Record<string, any>>(workflow.jobs)) {
    assert.equal(job.permissions, undefined, 'no job widens the workflow permissions');
  }
});

test('release-oidc: on a created release it upgrades npm, installs, builds, tests, then publishes with the npm CLI', async () => {
  const workflow = await readWorkflow();
  const steps: Record<string, any>[] = workflow.jobs['release-please'].steps;
  const releaseIndex = steps.findIndex((s) => s.id === 'release');

  const after = steps.slice(releaseIndex + 1);
  for (const step of after) {
    assert.match(String(step.if), /steps\.release\.outputs\.release_created/);
  }

  const runs = after.filter((s) => s.run).map((s) => String(s.run));
  assert.deepEqual(runs, [
    'npm install -g npm@11.20.0',
    'pnpm install --frozen-lockfile',
    'pnpm build',
    'pnpm test',
    'npm publish --access public',
  ]);

  const publish = after.find((s) => String(s.run ?? '').startsWith('npm publish'));
  assert.equal(publish?.env?.NODE_AUTH_TOKEN, undefined);

  const setupNode = after.find((s) => String(s.uses ?? '').startsWith('actions/setup-node@'));
  assert.equal(setupNode?.with?.['registry-url'], undefined);
  assert.equal(setupNode?.with?.scope, undefined);
});

test('release-oidc: the workflow stores no secret and names no GitHub Packages registry', async () => {
  const raw = await readFile(path.join(repoRoot, '.github/workflows/release.yml'), 'utf8');

  assert.doesNotMatch(raw, /secrets\./);
  assert.doesNotMatch(raw, /npm\.pkg\.github\.com/);
  assert.doesNotMatch(raw, /packages:\s*(read|write)/);
});

test('release-oidc: the npm upgrade pin is at least 11.5.1, the minimum for OIDC trusted publishing', async () => {
  const workflow = await readWorkflow();
  const steps: Record<string, any>[] = workflow.jobs['release-please'].steps;

  const npmUpgrade = steps.find((s) => /npm install -g npm@/.test(String(s.run ?? '')));
  assert.ok(npmUpgrade, 'an npm upgrade step is present');

  const match = String(npmUpgrade!.run).match(/npm@(\d+)\.(\d+)\.(\d+)/);
  assert.ok(match, 'the pin is an exact semver version');
  const [, major, minor, patch] = match!.map(Number) as unknown as [never, number, number, number];

  const meetsMinimum =
    major > 11 || (major === 11 && (minor > 5 || (minor === 5 && patch >= 1)));
  assert.ok(meetsMinimum, `npm@${major}.${minor}.${patch} must be >= 11.5.1`);
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
  // why: release-please rewrites the manifest on every release, so only its shape is stable.
  assert.deepEqual(Object.keys(manifest), ['.']);
  assert.match(manifest['.'], /^\d+\.\d+\.\d+$/);
});

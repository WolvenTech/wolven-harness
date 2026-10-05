import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function readJson(rel: string): Promise<Record<string, any>> {
  return JSON.parse(await readFile(path.join(repoRoot, rel), 'utf8'));
}

async function readWorkflow(): Promise<Record<string, any>> {
  return parseYaml(await readFile(path.join(repoRoot, '.github/workflows/release.yml'), 'utf8'));
}

test('package-name: publishes publicly to npmjs as @wolven-tech/harness from the WolvenTech repository', async () => {
  const pkg = await readJson('package.json');
  const releaseConfig = await readJson('release-please-config.json');

  assert.equal(pkg.name, '@wolven-tech/harness');
  assert.equal(pkg.bin['wolven-harness'], 'dist/cli.js');
  assert.deepEqual(pkg.publishConfig, { access: 'public' });
  assert.equal(pkg.repository?.url, 'https://github.com/WolvenTech/wolven-harness.git');
  assert.equal(releaseConfig.packages['.']['package-name'], pkg.name);
});

test('package-manifest: the tarball ships only dist and templates beside the default files', async () => {
  const pkg = await readJson('package.json');

  assert.deepEqual(pkg.files, ['dist', 'templates']);
});

test('release-workflow: a push to main only opens the release PR; a manual run creates the release', async () => {
  const workflow = await readWorkflow();

  assert.deepEqual(workflow.on.push, { branches: ['main'] });
  assert.equal(workflow.on.workflow_dispatch?.inputs?.tag?.required, false);
  assert.equal(workflow.on.workflow_dispatch?.inputs?.tag?.default, '');

  const job = workflow.jobs['release-please'];
  assert.match(String(job.if), /github\.event_name == 'push'/);
  assert.match(String(job.if), /github\.event_name == 'workflow_dispatch' && inputs\.tag == ''/);
  const release = job.steps.find((s: Record<string, any>) =>
    String(s.uses ?? '').startsWith('googleapis/release-please-action@'),
  );
  assert.ok(release, 'release-please step present');
  assert.equal(release.id, 'release');
  assert.equal(release.with['config-file'], 'release-please-config.json');
  assert.equal(release.with['manifest-file'], '.release-please-manifest.json');
  assert.equal(release.with['skip-github-release'], "${{ github.event_name == 'push' }}");

  const releaseDoc = await readFile(path.join(repoRoot, 'site/release.md'), 'utf8');
  assert.match(releaseDoc, /push to `main` does not create the GitHub Release and does not publish/);
  assert.match(releaseDoc, /Run the `release` workflow by hand with the tag left empty/);
  assert.doesNotMatch(releaseDoc, /Merging the release PR tags/);
});

test('release-oidc: only the publish job can mint an OIDC token; release-please alone writes to the repo', async () => {
  const workflow = await readWorkflow();

  assert.deepEqual(workflow.permissions, { contents: 'read' });
  assert.deepEqual(workflow.jobs['release-please'].permissions, { contents: 'write', 'pull-requests': 'write' });
  assert.equal(workflow.jobs.build.permissions, undefined, 'build keeps the read-only default');
  assert.deepEqual(workflow.jobs.publish.permissions, { contents: 'read', 'id-token': 'write' });
});

test('release-oidc: build installs, builds and tests the release tag, then hands dist to publish', async () => {
  const workflow = await readWorkflow();
  const build = workflow.jobs.build;

  assert.match(String(build.if), /needs\.release-please\.outputs\.release_created == 'true'/);
  const runs = build.steps
    .filter((s: Record<string, any>) => s.run && s.name !== 'Verify manual retry targets a published release')
    .map((s: Record<string, any>) => String(s.run));
  assert.deepEqual(runs, [
    'node -e \'if (`v${require("./package.json").version}` !== process.env.RELEASE_TAG) process.exit(1)\'',
    'pnpm install --frozen-lockfile',
    'pnpm build',
    'pnpm test',
  ]);

  const upload = build.steps.find((s: Record<string, any>) =>
    String(s.uses ?? '').startsWith('actions/upload-artifact@'),
  );
  assert.equal(upload?.with?.path, 'dist');
});

test('release-oidc: publish runs no project install and publishes with the npm CLI', async () => {
  const workflow = await readWorkflow();
  const publish = workflow.jobs.publish;

  assert.deepEqual(publish.needs, ['release-please', 'build']);
  assert.match(String(publish.if), /needs\.build\.result == 'success'/);

  const runs = publish.steps.filter((s: Record<string, any>) => s.run).map((s: Record<string, any>) => String(s.run));
  assert.deepEqual(runs, ['npm install -g npm@11.20.0', 'npm publish --access public --ignore-scripts']);
  assert.ok(
    !publish.steps.some((s: Record<string, any>) => String(s.uses ?? '').startsWith('pnpm/action-setup@')),
    'no package manager for project dependencies in the publish job',
  );

  const setupNode = publish.steps.find((s: Record<string, any>) =>
    String(s.uses ?? '').startsWith('actions/setup-node@'),
  );
  assert.equal(setupNode?.with?.['registry-url'], undefined);
  assert.equal(setupNode?.with?.scope, undefined);
  for (const step of publish.steps) {
    assert.equal(step.env?.NODE_AUTH_TOKEN, undefined);
  }
});

test('release-oidc: a failed publish can be re-run by hand for an existing tag', async () => {
  const workflow = await readWorkflow();

  assert.equal(workflow.on.workflow_dispatch?.inputs?.tag?.required, false);
  assert.match(String(workflow.jobs.build.if), /github\.event_name == 'workflow_dispatch'/);
  const verifyRelease = workflow.jobs.build.steps.find(
    (s: Record<string, any>) => s.name === 'Verify manual retry targets a published release',
  );
  assert.match(String(verifyRelease.if), /github\.event_name == 'workflow_dispatch'/);
  assert.match(String(verifyRelease.if), /startsWith\(inputs\.tag, 'v'\)/);
  assert.equal(verifyRelease.env.GH_REPO, '${{ github.repository }}');
  assert.equal(verifyRelease.env.RELEASE_TAG, '${{ inputs.tag }}');
  assert.match(String(verifyRelease.run), /gh release view "\$RELEASE_TAG" --json tagName,isDraft/);
  assert.match(String(verifyRelease.run), /test "\$actual" = "\$RELEASE_TAG"/);
  const verifyVersion = workflow.jobs.build.steps.find(
    (s: Record<string, any>) => s.name === 'Verify release tag matches package version',
  );
  assert.equal(verifyVersion.env.RELEASE_TAG, '${{ needs.release-please.outputs.tag_name || inputs.tag }}');
  for (const job of ['build', 'publish']) {
    const checkout = workflow.jobs[job].steps.find((s: Record<string, any>) =>
      String(s.uses ?? '').startsWith('actions/checkout@'),
    );
    assert.match(String(checkout?.with?.ref), /inputs\.tag/);
  }
});

test('release-oidc: the workflow stores no secret', async () => {
  const raw = await readFile(path.join(repoRoot, '.github/workflows/release.yml'), 'utf8');

  assert.doesNotMatch(raw, /secrets\./);
});

test('release-oidc: the npm pin is at least 11.5.1, the minimum for OIDC trusted publishing', async () => {
  const workflow = await readWorkflow();
  const run = String(
    workflow.jobs.publish.steps.find((s: Record<string, any>) => /npm install -g npm@/.test(String(s.run ?? '')))?.run,
  );

  const version = run.match(/npm@(\d+\.\d+\.\d+)$/)?.[1];
  assert.ok(version, 'the pin is an exact version');
  assert.ok(version.localeCompare('11.5.1', undefined, { numeric: true }) >= 0, `npm@${version} must be >= 11.5.1`);
});

test('release-oidc: the PR gate and the release use the same pnpm and npm pins', async () => {
  const release = await readWorkflow();
  const ci = parseYaml(await readFile(path.join(repoRoot, '.github/workflows/ci.yml'), 'utf8'));

  const pnpmPin = (steps: Record<string, any>[]) =>
    steps.find((s) => String(s.uses ?? '').startsWith('pnpm/action-setup@'))?.with?.version;
  const npmPin = (steps: Record<string, any>[]) =>
    steps.find((s) => /npm install -g npm@/.test(String(s.run ?? '')))?.run;

  assert.equal(pnpmPin(release.jobs.build.steps), pnpmPin(ci.jobs.package.steps));
  assert.equal(npmPin(release.jobs.publish.steps), npmPin(ci.jobs.package.steps));
});

test('release-workflow: below 1.0 a feat bumps the patch and a breaking change bumps the minor', async () => {
  const config = await readJson('release-please-config.json');
  const manifest = await readJson('.release-please-manifest.json');

  assert.equal(config['release-type'], 'node');
  assert.equal(config['bump-minor-pre-major'], true);
  // why: without this flag a feat still bumps the minor before 1.0, and the assertion above would stay green.
  assert.equal(config['bump-patch-for-minor-pre-major'], true);
  assert.equal(config['include-component-in-tag'], false);
  assert.equal(config.packages?.['.']?.['package-name'], '@wolven-tech/harness');
  assert.equal(config.packages['.']['initial-version'], undefined);
  // why: release-please rewrites the manifest on every release, so only its shape is stable.
  assert.deepEqual(Object.keys(manifest), ['.']);
  assert.match(manifest['.'], /^\d+\.\d+\.\d+$/);
});

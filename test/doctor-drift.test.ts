import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { appendFile, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { runDriftChecks } from '../src/doctor/drift.js';
import type { DoctorContext } from '../src/doctor/index.js';
import type { DoctorFinding } from '../src/doctor/report.js';
import { readConfig } from '../src/setup/config.js';
import { MANIFEST_FILENAME } from '../src/setup/manifest.js';
import { makeRepo, run } from './helpers/fixture.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const templatesDir = path.join(repoRoot, 'templates');

/** A git repo with a full install written by the real `setup`. */
async function install(): Promise<string> {
  const dir = await makeRepo({}, { git: true });
  const result = await run(['setup', '--git-host', 'gh', '--runtimes', 'claude'], { cwd: dir });
  assert.equal(result.code, 0, result.stderr);
  return dir;
}

/** The doctor context for `root`, at the running package's version. */
async function contextFor(root: string): Promise<DoctorContext> {
  const config = await readConfig(root);
  assert.ok(config, 'the fixture has a config');
  const own = JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8')) as { version: string };
  return { root, harnessHome: root, config, env: {}, templatesDir, packageVersion: own.version };
}

function codes(findings: DoctorFinding[]): string[] {
  return findings.map((finding) => finding.code);
}

async function manifestFiles(root: string): Promise<Record<string, string>> {
  const body = JSON.parse(await readFile(path.join(root, MANIFEST_FILENAME), 'utf8')) as {
    files: Record<string, string>;
  };
  return body.files;
}

test('proof-install-experience-drift: a clean install reports no drift', async () => {
  const findings = await runDriftChecks(await contextFor(await install()));

  assert.deepEqual(findings, []);
});

test('proof-install-experience-drift: an edited file is doctor-drift-edited', async () => {
  const dir = await install();
  const rel = '.agents/rules/qmd-first.md';
  await appendFile(path.join(dir, rel), '\nAn extra local paragraph.\n', 'utf8');

  const findings = await runDriftChecks(await contextFor(dir));

  assert.deepEqual(codes(findings), ['doctor-drift-edited']);
  assert.match(findings[0].message, /qmd-first\.md/);
});

test('proof-install-experience-drift: a file matching its old manifest entry but not the template is doctor-drift-stale', async () => {
  const dir = await install();
  const rel = '.agents/rules/comments.md';
  const older = 'an older shipped copy of the rule\n';
  await writeFile(path.join(dir, rel), older, 'utf8');

  const manifest = await manifestFiles(dir);
  manifest[rel] = createHash('sha256').update(older).digest('hex');
  const body = { version: 1, packageVersion: (await contextFor(dir)).config.packageVersion, files: manifest };
  await writeFile(path.join(dir, MANIFEST_FILENAME), `${JSON.stringify(body, null, 2)}\n`, 'utf8');

  const findings = await runDriftChecks(await contextFor(dir));

  assert.deepEqual(codes(findings), ['doctor-drift-stale']);
  assert.match(findings[0].message, /comments\.md/);
});

test('proof-install-experience-drift: a missing template file is doctor-drift-missing', async () => {
  const dir = await install();
  await rm(path.join(dir, '.agents/rules/yagni-strict.md'));

  const findings = await runDriftChecks(await contextFor(dir));

  assert.deepEqual(codes(findings), ['doctor-drift-missing']);
  assert.match(findings[0].message, /yagni-strict\.md/);
});

test('proof-install-experience-drift: without a manifest a changed file is doctor-drift-edited', async () => {
  const dir = await install();
  await rm(path.join(dir, MANIFEST_FILENAME));
  await writeFile(path.join(dir, '.agents/rules/qmd-first.md'), 'a changed rule\n', 'utf8');

  const findings = await runDriftChecks(await contextFor(dir));

  assert.deepEqual(codes(findings), ['doctor-drift-edited']);
  assert.match(findings[0].message, /qmd-first\.md/);
});

test('proof-install-experience-drift: an older recorded packageVersion is doctor-version-behind', async () => {
  const dir = await install();
  const ctx = await contextFor(dir);

  const older = await runDriftChecks({ ...ctx, config: { ...ctx.config, packageVersion: '0.0.1' } });
  assert.deepEqual(codes(older), ['doctor-version-behind']);
  assert.match(older[0].message, /0\.0\.1/);

  assert.deepEqual(await runDriftChecks(ctx), []);
});

test('proof-install-experience-drift-deferral: the setup-drift-check deferral folder is gone', () => {
  assert.equal(existsSync(path.join(repoRoot, 'docs', 'deferrals', 'setup-drift-check')), false);
});

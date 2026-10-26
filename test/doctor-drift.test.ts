import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { appendFile, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { runDriftChecks } from '../src/doctor/drift.js';
import type { DoctorContext } from '../src/doctor/index.js';
import type { DoctorFinding } from '../src/doctor/report.js';
import { selectTemplateFiles } from '../src/setup/apply.js';
import { readConfig } from '../src/setup/config.js';
import { type SkillSet, skillFolders } from '../src/setup/skill-sets.js';
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

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

async function makeEarlierFixture(): Promise<{ dir: string; stale: string[]; edited: string }> {
  const dir = await install();
  const ctx = await contextFor(dir);
  const sets = (ctx.config.skillSets ?? []) as readonly SkillSet[];
  const selected = await selectTemplateFiles(ctx.templatesDir, skillFolders(sets), sets);
  const known = JSON.parse(await readFile(path.join(repoRoot, 'known-forms.json'), 'utf8')) as {
    forms: Record<string, string[]>;
  };
  const stale: string[] = [];

  for (const { source, installed } of selected) {
    if (installed === 'AGENTS.md' || installed === 'WOLVEN.md' || installed === '.qmd/index.yml') continue;

    let earlier: Buffer;
    try {
      earlier = execFileSync('git', ['show', `v0.3.2:templates/${source}`], {
        cwd: repoRoot,
        stdio: ['ignore', 'pipe', 'ignore'],
      });
    } catch {
      continue;
    }

    await writeFile(path.join(dir, ...installed.split('/')), earlier);
    const current = await readFile(path.join(templatesDir, ...source.split('/')));
    if (!earlier.equals(current) && known.forms[installed]?.includes(sha256(earlier))) stale.push(installed);
  }

  assert.ok(stale.length > 1, 'the v0.3.2 fixture contains multiple known stale forms');
  const edited = stale[0];
  assert.ok(edited);
  await appendFile(path.join(dir, ...edited.split('/')), '\nA local edit.\n', 'utf8');
  return { dir, stale, edited };
}

function selectedTemplateSource(
  installed: string,
  files: Awaited<ReturnType<typeof selectTemplateFiles>>,
): string | undefined {
  return files.find((file) => file.installed === installed)?.source;
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

test('proof-install-experience-drift-earlier / proof-install-experience-drift-after-refresh: v0.3.2 classification and refresh', async () => {
  const { dir, stale, edited } = await makeEarlierFixture();
  const manifest = path.join(dir, '.wolven-harness.manifest.json');

  assert.equal(existsSync(manifest), false);
  const findings = await runDriftChecks(await contextFor(dir));
  const staleFindings = findings.filter((finding) => finding.code === 'doctor-drift-stale');
  const editedFindings = findings.filter((finding) => finding.code === 'doctor-drift-edited');

  assert.equal(staleFindings.length, stale.length - 1);
  assert.equal(editedFindings.length, 1);
  assert.ok(editedFindings[0].message.includes(edited));
  assert.equal(
    findings.some((finding) => finding.code === 'doctor-drift-missing'),
    false,
  );

  const ctx = await contextFor(dir);
  const currentTemplates = await selectTemplateFiles(
    ctx.templatesDir,
    skillFolders(ctx.config.skillSets ?? []),
    ctx.config.skillSets ?? [],
  );
  for (const rel of stale.filter((file) => file !== edited)) {
    const template = selectedTemplateSource(rel, currentTemplates);
    assert.ok(template, `the stale path ${rel} has a current template`);
    await writeFile(
      path.join(dir, ...rel.split('/')),
      await readFile(path.join(ctx.templatesDir, ...template.split('/'))),
    );
  }

  const afterRefresh = await runDriftChecks(ctx);
  assert.deepEqual(codes(afterRefresh), ['doctor-drift-edited']);
  assert.ok(afterRefresh[0].message.includes(edited));
});

test('proof-install-experience-drift: a missing template file is doctor-drift-missing', async () => {
  const dir = await install();
  await rm(path.join(dir, '.agents/rules/yagni-strict.md'));

  const findings = await runDriftChecks(await contextFor(dir));

  assert.deepEqual(codes(findings), ['doctor-drift-missing']);
  assert.match(findings[0].message, /yagni-strict\.md/);
});

test('proof-install-experience-drift: a changed file with no known form is doctor-drift-edited', async () => {
  const dir = await install();
  await writeFile(path.join(dir, '.agents/rules/qmd-first.md'), 'a changed rule\n', 'utf8');

  const findings = await runDriftChecks(await contextFor(dir));

  assert.deepEqual(codes(findings), ['doctor-drift-edited']);
  assert.match(findings[0].message, /qmd-first\.md/);
});

test('runDriftChecks returns findings instead of throwing when known-forms.json is missing or malformed', async () => {
  const dir = await install();
  await writeFile(path.join(dir, '.agents/rules/qmd-first.md'), 'a changed rule\n', 'utf8');
  const malformed = path.join(dir, 'known-forms.json');
  await writeFile(malformed, '{ not json', 'utf8');
  const ctx = await contextFor(dir);

  for (const file of [malformed, path.join(dir, 'absent-known-forms.json')]) {
    const findings = await runDriftChecks(ctx, file);
    assert.deepEqual(codes(findings), ['doctor-drift-edited']);
  }
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

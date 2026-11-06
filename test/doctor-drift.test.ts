import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { appendFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { currentForms } from '../scripts/known-forms.mjs';
import { runDriftChecks } from '../src/doctor/drift.js';
import type { DoctorContext } from '../src/doctor/index.js';
import type { DoctorFinding } from '../src/doctor/report.js';
import { isQuietMapped, selectTemplateFiles } from '../src/setup/apply.js';
import { readConfig } from '../src/setup/config.js';
import { runSetup } from '../src/setup/index.js';
import { mapQuietInstallPaths } from '../src/setup/path-map.js';
import { renderQmdIndex } from '../src/setup/render-wolven.js';
import { type SkillSet, skillFolders } from '../src/setup/skill-sets.js';
import { makeRepo, run } from './helpers/fixture.js';
import { makeIo } from './helpers/io.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const templatesDir = path.join(repoRoot, 'templates');

/** A git repo with a full install written by the real `setup`. */
async function install(): Promise<string> {
  const dir = await makeRepo({}, { git: true, layout: 'home' });
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

/** A linked, quiet install whose files are the mapped current templates. */
async function makeQuietFixture(): Promise<{ ctx: DoctorContext; harnessHome: string; edited: string }> {
  const root = await install();
  const harnessHome = path.join(root, '.wolven-harness');
  await mkdir(harnessHome);
  const homeContext = await contextFor(root);
  const ctx: DoctorContext = {
    ...homeContext,
    root,
    harnessHome,
    config: { ...homeContext.config, layout: 'linked', harnessHome: '.wolven-harness' },
  };
  const selected = await selectTemplateFiles(
    templatesDir,
    skillFolders(ctx.config.skillSets ?? []),
    ctx.config.skillSets ?? [],
  );
  let edited: string | undefined;
  for (const { installed } of selected) {
    if (installed === 'AGENTS.md') continue;
    const file = path.join(harnessHome, installed);
    await mkdir(path.dirname(file), { recursive: true });
    const text = await readFile(path.join(root, installed), 'utf8');
    const mapped = isQuietMapped(installed)
      ? mapQuietInstallPaths(text)
      : installed === '.qmd/index.yml'
        ? renderQmdIndex(text, ctx.config.skillSets, true)
        : text;
    await writeFile(file, mapped);
    if (mapped !== text && installed.startsWith('.agents/skills/')) edited = installed;
  }
  assert.ok(edited, 'the fixture includes a skill with mapped paths');
  return { ctx, harnessHome, edited };
}

test('proof-quiet-install-drift-pathmap: mapped skills compare cleanly and hand edits remain visible', async () => {
  const { ctx, harnessHome, edited } = await makeQuietFixture();
  assert.deepEqual(await runDriftChecks(ctx), []);
  await appendFile(path.join(harnessHome, edited), '\nA local edit.\n');
  const findings = await runDriftChecks(ctx);
  assert.deepEqual(codes(findings), ['doctor-drift-edited']);
  assert.ok(findings[0].message.includes(edited));

  const externalRoot = await makeRepo({}, { git: true });
  const external = { ...ctx, root: externalRoot };
  const externalFindings = await runDriftChecks(external);
  // invariant: a home outside the repository gets no quiet comparison, so mapped files are never silent there.
  assert.ok(externalFindings.filter((finding) => finding.code.startsWith('doctor-drift-')).length > 1);
});

test('doctor-drift: the models block qmd update writes to the index is not a hand edit', async () => {
  const { ctx, harnessHome } = await makeQuietFixture();
  const file = path.join(harnessHome, '.qmd/index.yml');
  await appendFile(file, 'models:\n  embed: hf:example/model.gguf\n');
  assert.deepEqual(await runDriftChecks(ctx), []);

  await appendFile(file, 'extra: true\n');
  assert.deepEqual(codes(await runDriftChecks(ctx)), ['doctor-drift-edited']);
});

test('proof-iter1-quiet-stale: a stale unedited quiet file is doctor-drift-stale and a hand edit is doctor-drift-edited', async () => {
  const { ctx, harnessHome, edited } = await makeQuietFixture();
  const earlier = path.join(await mkdtemp(path.join(tmpdir(), 'known-forms-')), 'earlier');
  const earlierTemplate = path.join(earlier, 'templates', ...edited.split('/'));
  const current = await readFile(path.join(templatesDir, ...edited.split('/')), 'utf8');
  await mkdir(path.dirname(earlierTemplate), { recursive: true });
  await writeFile(earlierTemplate, `${current}\nAn earlier line.\n`);
  const table = path.join(earlier, 'known-forms.json');
  await writeFile(table, JSON.stringify(currentForms(earlier)));

  const file = path.join(harnessHome, ...edited.split('/'));
  await writeFile(file, mapQuietInstallPaths(await readFile(earlierTemplate, 'utf8')));
  const stale = await runDriftChecks(ctx, table);
  assert.deepEqual(codes(stale), ['doctor-drift-stale']);
  assert.ok(stale[0].message.includes(edited));

  await appendFile(file, '\nA local edit.\n');
  assert.deepEqual(codes(await runDriftChecks(ctx, table)), ['doctor-drift-edited']);
});

test('proof-iter1-refresh-rerun: deleting a stale quiet file and rerunning setup restores its mapped bytes', async () => {
  const root = await makeRepo({ 'AGENTS.md': 'Client instructions.\n' }, { git: true });
  await mkdir(path.join(root, 'docs'));
  await writeFile(path.join(root, 'docs', 'client.md'), '# Client\n', 'utf8');
  const flags = ['--git-host', 'gh', '--runtimes', 'claude', '--skills', 'none'];
  assert.equal(await runSetup(flags, makeIo(root)), 0);

  const rel = '.agents/rules/yagni-strict.md';
  const file = path.join(root, '.wolven-harness', rel);
  const expected = mapQuietInstallPaths(await readFile(path.join(templatesDir, rel), 'utf8'));
  assert.equal(await readFile(file, 'utf8'), expected);

  await writeFile(file, `${expected}\nAn earlier line.\n`);
  await rm(file);
  assert.equal(await runSetup(flags, makeIo(root)), 0);
  assert.equal(await readFile(file, 'utf8'), expected);
});

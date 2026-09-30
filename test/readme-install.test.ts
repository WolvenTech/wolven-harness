import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const readmePath = path.join(here, '..', 'README.md');

/** why: one read backs every phrase assertion below, so a single file miss fails loudly instead of once per test. */
async function readReadme(): Promise<string> {
  return readFile(readmePath, 'utf8');
}

async function readDoc(rel: string): Promise<string> {
  return readFile(path.join(here, '..', rel), 'utf8');
}

function section(doc: string, heading: string): string {
  const match = new RegExp(`^#{1,2} ${heading}\\s*$`, 'm').exec(doc);
  assert.ok(match, `missing heading "${heading}"`);
  const rest = doc.slice(match.index);
  const next = rest.indexOf('\n## ', 1);
  return next === -1 ? rest : rest.slice(0, next);
}

test('readme-install: the add and setup commands appear, in that order', async () => {
  const readme = await readReadme();

  const addIndex = readme.indexOf('pnpm add -D @wolven-tech/harness');
  const setupIndex = readme.indexOf('pnpm exec wolven-harness setup');

  assert.ok(addIndex !== -1, 'pnpm add -D @wolven-tech/harness not found');
  assert.ok(setupIndex !== -1, 'pnpm exec wolven-harness setup not found');
  assert.ok(addIndex < setupIndex, 'install command must appear before the setup command');
});

test('readme-install: no GitHub Packages registry residue', async () => {
  const readme = await readReadme();

  assert.doesNotMatch(readme, /\.npmrc/);
  assert.doesNotMatch(readme, /npm\.pkg\.github\.com/);
  assert.doesNotMatch(readme, /NODE_AUTH_TOKEN/);
  assert.doesNotMatch(readme, /packages: read/);
  assert.doesNotMatch(readme, /read:packages/);
  assert.doesNotMatch(readme, /@wolventech/);
  assert.doesNotMatch(readme, /_authToken/);
});

test('readme-install: the release page covers trusted publishing, its npm-side setup and the manual re-run', async () => {
  const releaseSection = await readDoc('site/release.md');

  assert.match(releaseSection, /trusted publish/i);
  assert.match(releaseSection, /seed/i);
  assert.match(releaseSection, /workflow `release\.yml`/);
  assert.match(releaseSection, /disallow tokens/);
  assert.match(releaseSection, /run the `release` workflow by hand/);
  assert.match(releaseSection, /Allow direct `npm publish`/);
  assert.match(releaseSection, /After the first OIDC release succeeds/);
});

test('readme-install: the release page says to close and reopen the release PR before merging', async () => {
  const release = await readDoc('site/release.md');

  assert.match(release, /[Cc]lose and reopen the release PR before merging/);
});

test('readme-install: the contributing page keeps clone-and-build with pnpm build', async () => {
  const contributingSection = section(await readDoc('site/contributing.md'), 'Contributing');

  assert.match(contributingSection, /pnpm build/);
});

test('readme-install: README covers lean harness-init, --list-skills, --skill, and --skills sets', async () => {
  const readme = await readReadme();
  const setup = section(readme, 'Setup');
  const next = section(readme, 'What to do next');

  assert.match(setup, /--skills ship,discovery/);
  assert.match(setup, /--skills none/);
  assert.match(setup, /setup --list-skills/);
  assert.match(setup, /--skill <name>/);
  assert.match(setup, /--skill create-prd/);
  assert.match(setup, /`setup --skill` still runs all of `setup`/);
  assert.match(next, /lean path/i);
  assert.match(next, /thin-evidence/i);
  assert.match(next, /skill proposals still run/i);
});

test('readme-install: harness-init page documents the lean path and recorded deferrals', async () => {
  const doc = await readDoc('site/harness-init.md');
  const lean = section(doc, 'Lean path');

  assert.match(lean, /thin-evidence/i);
  assert.match(lean, /deep discovery Q&A beyond files/i);
  assert.match(lean, /optional web research/i);
  assert.match(lean, /per-dimension score-gap keep\/drop questions/i);
  assert.match(lean, /validate-wiring question/i);
  assert.match(lean, /immediate goal/i);
  assert.match(lean, /Deferred \/ skipped steps/);
  assert.match(lean, /Skill proposals always run/i);
});

test('readme-install: skills and commands pages show --list-skills and non-interactive --skill', async () => {
  const skills = await readDoc('site/skills.md');
  const commands = await readDoc('site/commands.md');

  for (const doc of [skills, commands]) {
    assert.match(doc, /pnpm exec wolven-harness setup --list-skills/);
    assert.match(
      doc,
      /pnpm exec wolven-harness setup --git-host gh --runtimes cursor --skills none --skill create-prd/,
    );
    assert.doesNotMatch(doc, /--runtimes cursor --skill create-prd/);
    assert.match(doc, /`setup --skill` still runs all of `setup`/);
    assert.match(doc, /refreshes `\.wolven-harness\.json`/);
  }
});

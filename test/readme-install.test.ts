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

const GLOBAL_INSTALL_FORMS = [
  'npm install -g @wolven-tech/harness',
  'yarn global add @wolven-tech/harness',
  'pnpm add -g @wolven-tech/harness',
];

test('readme-install: the global install appears in npm, yarn and pnpm forms before setup', async () => {
  const readme = await readReadme();

  for (const form of GLOBAL_INSTALL_FORMS) assert.ok(readme.includes(form), `${form} not found`);

  const installIndex = readme.indexOf(GLOBAL_INSTALL_FORMS[0]);
  const setupIndex = readme.indexOf('wolven-harness setup');

  assert.ok(setupIndex !== -1, 'wolven-harness setup not found');
  assert.ok(installIndex < setupIndex, 'the global install must appear before the setup command');
  assert.match(readme, /from the folder you want your agent to work in/i);
});

test('readme-install: the README and the site install page cover setup from any folder and doctor', async () => {
  for (const doc of [await readReadme(), await readDoc('site/index.md')]) {
    for (const form of GLOBAL_INSTALL_FORMS) assert.ok(doc.includes(form), `${form} missing`);

    assert.match(doc, /from any folder|anywhere else|any other folder/i);
    assert.match(doc, /wolven-harness doctor/);
    assert.match(doc, /harness-doctor/);
  }
});

test('readme-install: the runtimes page lists the nine registry runtimes and their wiring', async () => {
  const page = await readDoc('site/runtimes.md');

  for (const id of ['claude', 'codex', 'cursor', 'opencode', 'amp', 'copilot', 'gemini', 'kiro', 'antigravity']) {
    assert.match(page, new RegExp(`\`${id}\``), `missing runtime ${id}`);
  }
  assert.match(page, /\.claude\/rules/);
  assert.match(page, /wolven-harness:rules:start/);
  assert.match(page, /\.cursor\/rules/);
});

test('readme-install: the CLI reference documents doctor, its output and its config finding', async () => {
  const page = await readDoc('site/commands.md');

  assert.match(page, /## `doctor`/);
  assert.match(page, /doctor: ok/);
  assert.match(page, /doctor-config/);
  assert.match(page, /exits 0 with no errors and 1 otherwise/i);
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

test('proof-docs-basics-path: README and the harness-init page explain the basics path and the full tour', async () => {
  const readme = await readReadme();
  const page = await readDoc('site/harness-init.md');
  const basics = section(page, 'Basics path');

  assert.match(readme, /basics path/i);
  assert.match(readme, /full tour opens with one checklist/i);
  assert.match(basics, /asking how much setup you want right now/);
  assert.match(basics, /\*\*Just the basics\*\* asks for your first goal in one sentence/);
  assert.match(basics, /"What should this run cover\?"/);
  assert.match(basics, /\*\*Left for later\*\*/);
  for (const doc of [readme, basics]) {
    assert.match(doc, /references\/lean-path\.md/);
    assert.doesNotMatch(doc, /thin-evidence/i);
    assert.doesNotMatch(doc, /skill proposals (always|still) run/i);
    assert.doesNotMatch(doc, /lean-init-walkthrough/);
  }
});

test('proof-walkthrough-deprecated: the lean walkthrough note is retired', async () => {
  const note = await readDoc('docs/notes/lean-init-walkthrough/lean-init-walkthrough-note.md');

  assert.match(note.split('\n---')[0] ?? '', /^status: deprecated$/m);
});

test('readme-install: the contributing page keeps clone-and-build with pnpm build', async () => {
  const contributingSection = section(await readDoc('site/contributing.md'), 'Contributing');

  assert.match(contributingSection, /pnpm build/);
});

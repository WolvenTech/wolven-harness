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

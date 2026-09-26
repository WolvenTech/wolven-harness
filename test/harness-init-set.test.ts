import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PassThrough } from 'node:stream';
import { renderWolven } from '../src/init/render-wolven.js';
import { readSkill } from './helpers/skill-contract.js';
import type { Context, Io } from '../src/init/types.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const repoTemplatesDir = path.join(repoRoot, 'templates');
const skillsRoot = path.join(repoTemplatesDir, '.agents', 'skills');

const EXPECTED_ASK_ONLY = ['code-ci', 'code-pr', 'code-review', 'handoff'].sort();

function makeIo(cwd: string): Io {
  return {
    cwd,
    stdin: new PassThrough(),
    stdout: new PassThrough(),
    stderr: new PassThrough(),
    isTTY: false,
  };
}

async function listSkillDirs(): Promise<string[]> {
  const entries = await readdir(skillsRoot, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

async function readReadme(): Promise<string> {
  return readFile(path.join(repoRoot, 'README.md'), 'utf8');
}

/** Slices the README between a `## <heading>` line and the next `## ` line (or end of file). */
function extractSection(doc: string, heading: string): string {
  const start = doc.indexOf(`## ${heading}`);
  assert.ok(start >= 0, `README missing heading "## ${heading}"`);
  const rest = doc.slice(start + `## ${heading}`.length);
  const next = rest.search(/\n## /);
  return next === -1 ? rest : rest.slice(0, next);
}

// why: prose in the README wraps across lines, so a phrase spanning
// several words is matched against whitespace-collapsed text instead of
// the raw body, which would otherwise break on an arbitrary line wrap.
function flatten(text: string): string {
  return text.replace(/\s+/g, ' ');
}

test('skill-set: the template skill folder count is 16', async () => {
  const dirs = await listSkillDirs();
  assert.equal(dirs.length, 16, dirs.join(', '));
});

test('skill-set: harness-init is model-invocable, with no ask-only flag and no agents/openai.yaml', async () => {
  const skill = await readSkill('harness-init');

  assert.equal(Object.prototype.hasOwnProperty.call(skill.frontmatter, 'disable-model-invocation'), false);
  assert.ok(!skill.files.includes('agents/openai.yaml'));
});

test('skill-set: the ask-only set is exactly code-pr, code-review, code-ci, and handoff', async () => {
  const names = await listSkillDirs();

  const askOnly: string[] = [];
  for (const name of names) {
    const skill = await readSkill(name);
    if (skill.frontmatter['disable-model-invocation'] === true) askOnly.push(name);
  }

  assert.deepEqual(askOnly.sort(), EXPECTED_ASK_ONLY);
});

test('skill-set: renderWolven over the real templates produces a skills table row for harness-init', async () => {
  const ctx: Context = { root: '/unused', templatesDir: repoTemplatesDir, io: makeIo('/unused') };
  const rendered = await renderWolven(ctx);
  const skill = await readSkill('harness-init');

  assert.match(rendered, /\|\s*harness-init\s*\|/);
  assert.ok(
    rendered.includes(String(skill.frontmatter.description)),
    "rendered table row carries harness-init's own frontmatter description",
  );
});

test('skill-set: the README has a wizard section naming steps 0 through 6', async () => {
  const section = extractSection(await readReadme(), 'Setting up with harness-init');

  for (const label of ['Step 0', 'Step 1', 'Steps 2', 'Step 5', 'Step 6']) {
    assert.match(section, new RegExp(`${label}\\b`), `missing "${label}"`);
  }
});

test('skill-set: the wizard section names the three entry modes', async () => {
  const section = flatten(extractSection(await readReadme(), 'Setting up with harness-init'));

  assert.match(section, /full, light, or mention-only/i);
});

test('skill-set: the wizard section says migration is done only at a clean validate with no legacy warnings', async () => {
  const section = flatten(extractSection(await readReadme(), 'Setting up with harness-init'));

  assert.match(section, /done only once `?harness:validate`? exits 0 with no legacy warnings left/i);
});

test('skill-set: the wizard section covers stubs and the skill-stub-open warning', async () => {
  const section = flatten(extractSection(await readReadme(), 'Setting up with harness-init'));

  assert.match(section, /\bstubs?\b/i);
  assert.match(section, /`skill-stub-open`/);
});

test('skill-set: the wizard section covers the phased commits', async () => {
  const section = flatten(extractSection(await readReadme(), 'Setting up with harness-init'));

  assert.match(section, /three commits/i);
  assert.match(section, /entry, migration, setup/i);
  assert.match(section, /only if you say yes/i);
});

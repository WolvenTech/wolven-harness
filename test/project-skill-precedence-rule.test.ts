import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { pathExists } from '../src/path-exists.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RULE = '.agents/rules/project-skill-precedence.md';

const templateRule = path.join(repoRoot, 'templates', RULE);
const installedRule = path.join(repoRoot, RULE);
const wolven = path.join(repoRoot, 'templates', 'WOLVEN.md');
const agentsMd = path.join(repoRoot, 'AGENTS.md');

/** The bullet list under `WOLVEN.md`'s Standing rules heading, which harness-init copies verbatim. */
async function standingRules(): Promise<string> {
  const raw = await readFile(wolven, 'utf8');
  return raw.split('## Standing rules')[1]?.split('\n## ')[0] ?? '';
}

test('proof-project-skill-precedence-rule-file', async () => {
  const raw = await readFile(templateRule, 'utf8');
  const frontmatter = raw.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(frontmatter, 'the rule carries frontmatter');

  const parsed = parseYaml(frontmatter[1] ?? '') as { description?: string; alwaysApply?: boolean };
  assert.equal(typeof parsed.description, 'string');
  assert.ok((parsed.description ?? '').length > 0);
  assert.equal(parsed.alwaysApply, true);

  const body = raw.slice(frontmatter[0].length);
  assert.match(body, /^# /m);
});

test('proof-project-skill-precedence-rule-imperative', async () => {
  const body = await readFile(templateRule, 'utf8');

  assert.match(body, /\.agents\/skills\/<name>\/SKILL\.md/);
  assert.match(body, /\.claude\/skills\/<name>\/SKILL\.md/);
  assert.match(body, /base directory/i);
  assert.match(body, /read that file and follow it instead/i);
  assert.match(body, /project copy is authoritative/i);
});

test('proof-project-skill-precedence-rule-remedy', async () => {
  const body = await readFile(templateRule, 'utf8');

  assert.match(body, /rename or delete the user-level copy/i);
  assert.match(body, /skillOverrides/);
  assert.match(body, /symlink[\s\S]{0,40}project tree/i);
});

test('proof-project-skill-precedence-router', async () => {
  const bullets = await standingRules();

  assert.ok(bullets.includes(RULE), 'the Standing rules list cites the rule file');
  assert.match(bullets, /follow that copy instead/);
});

test('proof-project-skill-precedence-harness-init-fold', async () => {
  const bullets = await standingRules();
  const cited = [...bullets.matchAll(/\.agents\/rules\/[a-z0-9-]+\.md/g)].map((m) => m[0]);
  assert.ok(cited.includes(RULE), 'the standing rules list cites every rule the fold copies');

  for (const rel of cited) {
    assert.equal(await pathExists(path.join(repoRoot, 'templates', rel)), true, `${rel} ships for the fold`);
  }
});

test('proof-project-skill-precedence-self-install', async () => {
  const [template, installed, agents] = await Promise.all([
    readFile(templateRule),
    readFile(installedRule),
    readFile(agentsMd, 'utf8'),
  ]);

  assert.deepEqual(installed, template, 'this repo installs the shipped rule byte for byte');
  assert.ok(agents.includes(RULE), 'AGENTS.md cites the installed rule');
  assert.match(agents, /read `\.agents\/skills\/<name>\/SKILL\.md` and follow that copy instead/);
});

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

test('proof-project-skill-precedence-iteration-1-selection', async () => {
  const body = await readFile(templateRule, 'utf8');

  assert.match(body, /Before using a skill/i);
  assert.match(body, /\.agents\/skills\/<name>\/SKILL\.md/);
  assert.match(body, /\.claude\/skills\/<name>\/SKILL\.md/);
  assert.match(body, /Follow an\s+available project copy/i);
  assert.match(body, /user-level copy only when neither project\s+copy exists/i);
});

test('proof-project-skill-precedence-iteration-1-relative-references', async () => {
  const body = await readFile(templateRule, 'utf8');

  assert.match(body, /Resolve relative references from the directory containing the selected\s+`SKILL\.md`/i);
});

test('proof-project-skill-precedence-iteration-1-entry-delivery', async () => {
  const [template, installed, agents] = await Promise.all([
    readFile(templateRule),
    readFile(installedRule),
    readFile(agentsMd, 'utf8'),
  ]);

  assert.deepEqual(installed, template, 'this repo installs the shipped rule byte for byte');
  const bullets = await standingRules();
  for (const [name, entry] of [
    ['WOLVEN.md', bullets],
    ['AGENTS.md', agents],
  ] as const) {
    assert.ok(entry.includes(RULE), `${name} cites the project-skill-precedence rule`);
    assert.match(
      entry,
      /before using a skill, check `\.agents\/skills\/<name>\/SKILL\.md` and `\.claude\/skills\/<name>\/SKILL\.md`/i,
    );
    assert.match(entry, /follow an available project copy, use the user-level copy only when neither exists/i);
    assert.match(entry, /resolve relative references from the selected skill directory/i);
  }
});

test('proof-project-skill-precedence-iteration-1-fold', async () => {
  const bullets = await standingRules();
  const cited = [...bullets.matchAll(/\.agents\/rules\/[a-z0-9-]+\.md/g)].map((m) => m[0]);
  assert.ok(cited.includes(RULE), 'the Standing rules list cites the rule file');

  for (const rel of cited) {
    assert.equal(await pathExists(path.join(repoRoot, 'templates', rel)), true, `${rel} ships for the fold`);
  }

  assert.match(
    bullets,
    /before using a skill, check `\.agents\/skills\/<name>\/SKILL\.md` and `\.claude\/skills\/<name>\/SKILL\.md`/i,
  );
  assert.match(bullets, /follow an available project copy, use the user-level copy only when neither exists/i);
  assert.match(bullets, /resolve relative references from the selected skill directory/i);
});

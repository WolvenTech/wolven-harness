import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PassThrough } from 'node:stream';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { parse } from 'yaml';
import { makeRepo, run } from './helpers/fixture.js';
import { renderWolven } from '../src/init/render-wolven.js';
import type { Context, Io } from '../src/init/types.js';

const execFileAsync = promisify(execFile);

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const repoTemplatesDir = path.join(repoRoot, 'templates');

function makeIo(cwd: string): Io {
  return {
    cwd,
    stdin: new PassThrough(),
    stdout: new PassThrough(),
    stderr: new PassThrough(),
    isTTY: false,
  };
}

/** Recursively lists every file under `dir`, relative to `dir`, posix-joined, skipping `.git`. */
function walkFiles(dir: string): string[] {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const entry of entries) {
    if (entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkFiles(full).map((rel) => path.join(entry.name, rel)));
    } else if (entry.isFile()) {
      out.push(entry.name);
    }
  }
  return out;
}

function toPosix(relFsPath: string): string {
  return relFsPath.split(path.sep).join('/');
}

/** Every skill file the real `templates/.agents/skills/*` manifest carries, prefixed for the consumer root. */
function templateSkillFiles(): string[] {
  const skillsDir = path.join(repoTemplatesDir, '.agents', 'skills');
  return walkFiles(skillsDir).map((rel) => `.agents/skills/${toPosix(rel)}`);
}

function templateSkillNames(): string[] {
  const skillsDir = path.join(repoTemplatesDir, '.agents', 'skills');
  let entries;
  try {
    entries = readdirSync(skillsDir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

// --- init-surfaces: created-path manifest ---

test('init-surfaces: creates exactly the expected paths', async () => {
  const dir = await makeRepo({}, { git: true });

  const result = await run(['init', '--git-host', 'gh', '--runtimes', 'codex'], { cwd: dir });
  assert.equal(result.code, 0, result.stderr);

  const nonSkillFiles = [
    'WOLVEN.md',
    '.agents/rules/comments.md',
    '.agents/rules/qmd-first.md',
    '.agents/rules/yagni-strict.md',
    '.agents/hooks/README.md',
    'docs/WRITING-PROFILE.md',
    'docs/adrs/adr-000-record-architecture-decisions.md',
    'docs/prds/.gitkeep',
    'docs/specs/.gitkeep',
    'docs/notes/.gitkeep',
    'docs/deferrals/.gitkeep',
    '.qmd/index.yml',
    '.wolven-harness.json',
  ];

  const expected = [...nonSkillFiles, ...templateSkillFiles()].sort();
  const actual = walkFiles(dir).sort();

  assert.deepEqual(actual, expected);
});

// --- wolven-template: rendered content ---

test('wolven-template: first line points to harness-init step 0', async () => {
  const raw = await readFile(path.join(repoTemplatesDir, 'WOLVEN.md'), 'utf8');
  const firstLine = raw.split('\n')[0];

  assert.match(firstLine, /harness-init/);
  assert.match(firstLine, /step 0/);
});

test('wolven-template: has router, QMD-first, standing rules, claim rule, validate command', async () => {
  const ctx: Context = { root: '/unused', templatesDir: repoTemplatesDir, io: makeIo('/unused') };
  const rendered = await renderWolven(ctx);

  // Entry router
  for (const surface of [
    '.agents/skills',
    '.agents/rules',
    '.agents/hooks',
    'docs/adrs',
    'docs/specs',
    'docs/notes',
    'docs/deferrals',
    'docs/WRITING-PROFILE.md',
  ]) {
    assert.ok(rendered.includes(surface), `router mentions ${surface}`);
  }

  // Before-you-answer-from-memory / QMD-first
  assert.match(rendered, /before you answer from memory/i);
  assert.match(rendered, /qmd query -c adrs/);

  // Standing rules, linked by exact path
  assert.ok(rendered.includes('.agents/rules/qmd-first.md'));
  assert.ok(rendered.includes('.agents/rules/yagni-strict.md'));

  // Architecture claims rule
  assert.match(rendered, /ADR-NNN/);
  assert.match(rendered, /adr-NNN-<slug>/);
  assert.match(rendered, /docs\/adrs\//);
  assert.match(rendered, /stable/);
  assert.match(rendered, /harness-init/);

  // Validate command
  assert.ok(rendered.includes('pnpm harness:validate'));
  assert.ok(rendered.includes('wolven-harness validate'));
});

test('wolven-template: skills table lists every template skill', async () => {
  const ctx: Context = { root: '/unused', templatesDir: repoTemplatesDir, io: makeIo('/unused') };
  const rendered = await renderWolven(ctx);

  assert.match(rendered, /\| Skill \| Use when \|/);

  for (const name of templateSkillNames()) {
    const skillMd = readFileSync(
      path.join(repoTemplatesDir, '.agents', 'skills', name, 'SKILL.md'),
      'utf8',
    );
    const frontmatter = skillMd.match(/^---\n([\s\S]*?)\n---/)![1];
    const parsed = parse(frontmatter) as { name: string; description: string };

    assert.ok(rendered.includes(parsed.name), `skills table lists ${parsed.name}`);
    assert.ok(rendered.includes(parsed.description), `skills table lists ${parsed.name}'s description`);
  }
});

test('wolven-template: new skill folder appears without code change', async () => {
  const tempTemplatesDir = await makeRepo({
    'WOLVEN.md': 'intro\n\n{{skills_table}}\n\nend\n',
    '.agents/skills/existing-skill/SKILL.md':
      '---\nname: existing-skill\ndescription: An existing skill.\n---\n\nbody\n',
    '.agents/skills/brand-new-skill/SKILL.md':
      '---\nname: brand-new-skill\ndescription: A skill added only as a template folder.\n---\n\nbody\n',
  });

  const ctx: Context = { root: '/unused', templatesDir: tempTemplatesDir, io: makeIo('/unused') };
  const rendered = await renderWolven(ctx);

  assert.ok(rendered.includes('brand-new-skill'));
  assert.ok(rendered.includes('A skill added only as a template folder.'));
  assert.ok(rendered.includes('existing-skill'));

  // Sorted by name: brand-new-skill before existing-skill
  assert.ok(rendered.indexOf('brand-new-skill') < rendered.indexOf('existing-skill'));
});

// --- init-surfaces: docs templates ---

test('init-surfaces: adr-000 is a stable profile ADR', () => {
  const raw = readFileSync(
    path.join(repoTemplatesDir, 'docs', 'adrs', 'adr-000-record-architecture-decisions.md'),
    'utf8',
  );
  const frontmatter = raw.match(/^---\n([\s\S]*?)\n---/)![1];
  const parsed = parse(frontmatter) as Record<string, unknown>;

  assert.equal(parsed.type, 'adr');
  assert.equal(parsed.status, 'stable');
  assert.ok(typeof parsed.title === 'string' && parsed.title.length > 0);
  assert.ok(typeof parsed.description === 'string' && parsed.description.length > 0);
});

test('init-surfaces: WRITING-PROFILE.md ≤ 80 lines', () => {
  const raw = readFileSync(path.join(repoTemplatesDir, 'docs', 'WRITING-PROFILE.md'), 'utf8');
  const lineCount = raw.split('\n').length;

  assert.ok(lineCount <= 80, `WRITING-PROFILE.md is ${lineCount} lines, expected <= 80`);
});

test('init-surfaces: a fresh install passes validate once committed', async () => {
  const dir = await makeRepo({ 'package.json': '{ "name": "consumer", "version": "1.0.0" }\n' }, { git: true });
  const init = await run(['init', '--git-host', 'gh', '--runtimes', 'claude'], { cwd: dir });
  assert.equal(init.code, 0, init.stderr);

  // why: the claim gate scans tracked files only, so shipped examples are judged once a consumer commits them.
  const env = { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@example.com', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@example.com' };
  await execFileAsync('git', ['add', '-A'], { cwd: dir, env });
  await execFileAsync('git', ['commit', '-q', '-m', 'install'], { cwd: dir, env });

  const result = await run(['validate'], { cwd: dir });
  assert.doesNotMatch(result.stdout, /claim-/, result.stdout);
  assert.match(result.stdout, /claims: \d+ ok, 0 legacy-warn, 0 fail/);
});

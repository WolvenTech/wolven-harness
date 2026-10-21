import assert from 'node:assert/strict';
import { lstat, mkdir, readdir, readFile, readlink } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { CORE_SKILLS } from '../src/setup/skill-sets.js';
import { makeRepo, type RunResult, run } from './helpers/fixture.js';
import { walkFiles } from './helpers/walk.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const templatesSkills = path.join(repoRoot, 'templates', '.agents', 'skills');

/** The template files of the core skills, as paths relative to the install root. */
async function coreSkillFiles(): Promise<string[]> {
  const files = await walkFiles(templatesSkills);
  return files
    .map((rel) => `.agents/skills/${rel}`)
    .filter((rel) => (CORE_SKILLS as readonly string[]).includes(rel.split('/')[2]));
}

/** The exact file set the outside mode writes: the core skills, the config. */
async function outsideFileSet(): Promise<string[]> {
  return [...(await coreSkillFiles()), '.wolven-harness.json'].sort();
}

/** Captures files, symlinks, and directories so a refusal can prove no tree mutation. */
async function treeSnapshot(root: string): Promise<string[]> {
  const entries: string[] = [];
  async function walk(dir: string, rel = ''): Promise<void> {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const child = path.join(dir, entry.name);
      const childRel = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        entries.push(`dir:${childRel}`);
        await walk(child, childRel);
      } else if (entry.isSymbolicLink()) {
        entries.push(`link:${childRel}:${await readlink(child)}`);
      } else if (entry.isFile()) {
        entries.push(`file:${childRel}:${(await readFile(child)).toString('base64')}`);
      }
    }
  }
  await walk(root);
  return entries.sort();
}

test('proof-install-experience-outside-root: outside a repository setup writes only the core skills, the links, the config', async () => {
  const dir = await makeRepo({});

  const result = await run(['setup', '--git-host', 'gh', '--runtimes', 'claude'], { cwd: dir });

  assert.equal(result.code, 0, result.stderr);
  assert.deepEqual((await walkFiles(dir)).sort(), await outsideFileSet());

  const skillsLink = path.join(dir, '.claude', 'skills');
  assert.equal((await lstat(skillsLink)).isSymbolicLink(), true);
  assert.equal(await readlink(skillsLink), '../.agents/skills');

  for (const absent of ['WOLVEN.md', '.agents/rules', '.qmd', '.harness-score.json', 'CLAUDE.md', 'docs']) {
    await assert.rejects(lstat(path.join(dir, absent)), `${absent} must not exist`);
  }

  const output = result.stdout + result.stderr;
  assert.match(output, /"harness-init"/);
  assert.match(output, /in this folder/);
});

test('proof-install-experience-outside-root: a package.json beside the install keeps its scripts', async () => {
  const packageJson = `${JSON.stringify({ name: 'client', version: '1.0.0', scripts: { build: 'tsc' } }, null, 2)}\n`;
  const dir = await makeRepo({ 'package.json': packageJson });

  const result = await run(['setup', '--git-host', 'gh', '--runtimes', 'claude'], { cwd: dir });

  assert.equal(result.code, 0, result.stderr);
  assert.equal(await readFile(path.join(dir, 'package.json'), 'utf8'), packageJson, 'package.json is untouched');
});

test('proof-install-experience-subfolder-refused: a repository subfolder is refused without changing any bytes', async () => {
  const parent = await makeRepo({ 'README.md': '# parent\n' }, { git: true });
  const subdir = path.join(parent, 'client');
  await mkdir(subdir);
  const before = await treeSnapshot(parent);
  let promptCalls = 0;

  const result = await run(
    ['setup', '--git-host', 'gh', '--runtimes', 'claude', '--skills', 'none', '--package-manager', 'none'],
    {
      cwd: subdir,
      isTTY: true,
      prompts: {
        async select() {
          promptCalls++;
          return undefined;
        },
        async multiselect() {
          promptCalls++;
          return undefined;
        },
      },
    },
  );

  assert.equal(result.code, 1, result.stderr);
  assert.equal(promptCalls, 0, 'refusal happens before prompts');
  assert.match(result.stderr, new RegExp(parent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(result.stderr, /run setup at .* or in a folder outside the repository/i);
  assert.deepEqual(await treeSnapshot(parent), before);
});

test('proof-install-experience-subfolder-refused: ancestor .git detection works when git is not on PATH', async () => {
  const parent = await makeRepo({}, { git: true });
  const subdir = path.join(parent, 'nested', 'client');
  await mkdir(subdir, { recursive: true });
  const before = await treeSnapshot(parent);
  const originalPath = process.env.PATH;
  let result: RunResult;
  try {
    process.env.PATH = '';
    result = await run(
      ['setup', '--git-host', 'gh', '--runtimes', 'claude', '--skills', 'none', '--package-manager', 'none'],
      { cwd: subdir },
    );
  } finally {
    if (originalPath === undefined) delete process.env.PATH;
    else process.env.PATH = originalPath;
  }
  assert.equal(result.code, 1, result.stderr);
  assert.match(result.stderr, new RegExp(parent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.deepEqual(await treeSnapshot(parent), before);
});

test('proof-install-experience-global-hint: a local or cached executable recommends the global install', async () => {
  const localDir = await makeRepo({ 'pnpm-lock.yaml': 'lockfileVersion: 9.0\n' });
  const local = await run(['setup', '--git-host', 'gh', '--runtimes', 'claude'], {
    cwd: localDir,
    execPath:
      '/work/client/node_modules/.pnpm/@wolven-tech+harness@1.2.3/node_modules/@wolven-tech/harness/dist/cli.js',
  });
  assert.equal(local.code, 0, local.stderr);
  assert.match(local.stderr, /pnpm add -g @wolven-tech\/harness/);

  const dlxDir = await makeRepo({ 'pnpm-lock.yaml': 'lockfileVersion: 9.0\n' });
  const dlx = await run(['setup', '--git-host', 'gh', '--runtimes', 'claude'], {
    cwd: dlxDir,
    execPath: '/home/client/.cache/pnpm/dlx/1a2b3c/node_modules/@wolven-tech/harness/dist/cli.js',
  });
  assert.equal(dlx.code, 0, dlx.stderr);
  assert.match(dlx.stderr, /pnpm add -g @wolven-tech\/harness/);

  const cachedDir = await makeRepo({ 'package-lock.json': '{}\n' });
  const cached = await run(['setup', '--git-host', 'gh', '--runtimes', 'claude'], {
    cwd: cachedDir,
    execPath: '/home/client/.npm/_npx/1a2b/node_modules/.bin/wolven-harness',
  });
  assert.equal(cached.code, 0, cached.stderr);
  assert.match(cached.stderr, /npm install -g @wolven-tech\/harness/);

  const globalDir = await makeRepo({});
  const global = await run(['setup', '--git-host', 'gh', '--runtimes', 'claude'], {
    cwd: globalDir,
    execPath: '/usr/local/bin/wolven-harness',
  });
  assert.equal(global.code, 0, global.stderr);
  assert.doesNotMatch(global.stdout + global.stderr, /install -g/);
});

test('proof-install-experience-root-unchanged: a git top-level still gets the full scaffold and its next steps', async () => {
  const dir = await makeRepo({}, { git: true });

  const result = await run(['setup', '--git-host', 'gh', '--runtimes', 'claude'], { cwd: dir });

  assert.equal(result.code, 0, result.stderr);
  for (const rel of ['WOLVEN.md', '.agents/rules/qmd-first.md', '.qmd/index.yml', '.harness-score.json']) {
    assert.ok((await lstat(path.join(dir, rel))).isFile(), `${rel} is scaffolded`);
  }
  assert.equal((await lstat(path.join(dir, '.claude', 'rules'))).isSymbolicLink(), true);
  assert.match(result.stdout, /in this repo/);
  assert.doesNotMatch(result.stdout + result.stderr, /not a git top-level/);
});

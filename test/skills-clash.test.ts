import assert from 'node:assert/strict';
import { chmod, mkdir, mkdtemp, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { clashNotes, findSkillClashes, PROJECT_SKILL_ROOTS, USER_SKILL_ROOTS } from '../src/skills/clash.js';
import { makeRepo, run } from './helpers/fixture.js';

/** Creates `<dir>/<name>/SKILL.md` and returns the skill folder. */
async function skillAt(dir: string, name: string, body = `# ${name}\n`): Promise<string> {
  const folder = path.join(dir, name);
  await mkdir(folder, { recursive: true });
  await writeFile(path.join(folder, 'SKILL.md'), body, 'utf8');
  return folder;
}

/** A project root and a home, both empty. */
async function fixture(): Promise<{ root: string; home: string }> {
  const base = await mkdtemp(path.join(tmpdir(), 'wolven-harness-clash-'));
  const root = path.join(base, 'project');
  const home = path.join(base, 'home');
  await mkdir(root, { recursive: true });
  await mkdir(home, { recursive: true });
  return { root, home };
}

/** Every path under `dir`, relative and sorted, for a before/after comparison. */
async function tree(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries.map((entry) => `${entry.parentPath}/${entry.name}`).sort();
}

test('proof-project-skill-precedence-project-roots', async () => {
  const { root, home } = await fixture();
  await skillAt(path.join(root, '.agents', 'skills'), 'grilling', 'project body\n');
  await skillAt(path.join(root, '.claude', 'skills'), 'other');
  await mkdir(path.join(home, '.claude', 'skills'), { recursive: true });
  await symlink(path.join(home, '.agents', 'skills', 'grilling'), path.join(home, '.claude', 'skills', 'grilling'));
  await skillAt(path.join(home, '.agents', 'skills'), 'grilling', 'user body\n');

  const clashes = await findSkillClashes({ root, home });

  assert.equal(clashes.length, 1);
  assert.equal(clashes[0]?.projectPath, path.join(root, '.agents', 'skills', 'grilling'));
  assert.equal(clashes[0]?.userPath, path.join(home, '.claude', 'skills', 'grilling'));
});

test('proof-project-skill-precedence-project-roots: a wired .claude/skills symlink is one tree', async () => {
  const { root, home } = await fixture();
  await skillAt(path.join(root, '.agents', 'skills'), 'grilling', 'project body\n');
  await mkdir(path.join(root, '.claude'), { recursive: true });
  await symlink(path.join('..', '.agents', 'skills'), path.join(root, '.claude', 'skills'));
  await skillAt(path.join(home, '.agents', 'skills'), 'grilling', 'user body\n');

  const clashes = await findSkillClashes({ root, home });

  assert.equal(clashes.length, 1);
  assert.equal(clashes[0]?.projectPath, path.join(root, '.agents', 'skills', 'grilling'));
});

test('proof-project-skill-precedence-user-roots', async () => {
  const { root, home } = await fixture();
  const names = ['alpha', 'bravo', 'charlie', 'delta'];
  for (const name of names) await skillAt(path.join(root, '.agents', 'skills'), name);
  for (let i = 0; i < USER_SKILL_ROOTS.length; i++) {
    await skillAt(path.join(home, USER_SKILL_ROOTS[i] ?? ''), names[i] ?? '', `${names[i]} user body\n`);
  }
  await skillAt(path.join(home, '.claude', 'skills'), 'only-user');

  const clashes = await findSkillClashes({ root, home });

  assert.deepEqual(
    clashes.map((clash) => clash.skill),
    names,
  );
  for (let i = 0; i < USER_SKILL_ROOTS.length; i++) {
    assert.equal(clashes[i]?.userPath, path.join(home, USER_SKILL_ROOTS[i] ?? '', names[i] ?? ''));
  }
});

test('proof-project-skill-precedence-user-entry-guard', async () => {
  const { root, home } = await fixture();
  await skillAt(path.join(root, '.agents', 'skills'), 'synced');
  await mkdir(path.join(home, '.claude', 'skills', 'synced'), { recursive: true });
  await writeFile(path.join(home, '.claude', 'skills', 'synced', 'notes.md'), 'not a skill\n', 'utf8');
  await mkdir(path.join(home, '.agents', 'skills', 'synced'), { recursive: true });

  assert.deepEqual(await findSkillClashes({ root, home }), []);
});

test('proof-project-skill-precedence-identical-silent', async () => {
  const { root, home } = await fixture();
  await skillAt(path.join(root, '.agents', 'skills'), 'grilling', 'same body\n');
  await skillAt(path.join(home, '.agents', 'skills'), 'grilling', 'same body\n');

  assert.deepEqual(await findSkillClashes({ root, home }), []);

  await writeFile(path.join(home, '.agents', 'skills', 'grilling', 'SKILL.md'), 'different body\n', 'utf8');
  const clashes = await findSkillClashes({ root, home });

  assert.equal(clashes.length, 1);
});

test('proof-project-skill-precedence-scan-safety', async () => {
  const { root, home } = await fixture();
  await skillAt(path.join(root, '.agents', 'skills'), 'grilling', 'project body\n');
  await mkdir(path.join(home, '.agents', 'skills'), { recursive: true });
  await symlink(path.join(home, 'gone'), path.join(home, '.agents', 'skills', 'dangling'));
  await skillAt(path.join(home, '.cursor', 'skills'), 'locked', 'user body\n');
  await chmod(path.join(home, '.cursor', 'skills', 'locked'), 0o000);

  const before = await tree(root);
  const clashes = await findSkillClashes({ root, home });

  assert.deepEqual(clashes, []);
  assert.deepEqual(await tree(root), before);
  await chmod(path.join(home, '.cursor', 'skills', 'locked'), 0o700);
});

test('proof-project-skill-precedence-scan-order', async () => {
  const { root, home } = await fixture();
  for (const name of ['zulu', 'alpha', 'mike']) {
    await skillAt(path.join(root, '.agents', 'skills'), name);
    await skillAt(path.join(home, '.agents', 'skills'), name, `${name} user body\n`);
  }
  await skillAt(path.join(home, '.codex', 'skills'), 'alpha', 'alpha codex body\n');

  const clashes = await findSkillClashes({ root, home });
  const again = await findSkillClashes({ root, home });

  assert.deepEqual(
    clashes.map((clash) => `${clash.skill} ${path.relative(home, clash.userPath)}`),
    ['alpha .agents/skills/alpha', 'alpha .codex/skills/alpha', 'mike .agents/skills/mike', 'zulu .agents/skills/zulu'],
  );
  assert.deepEqual(clashes, again);
});

test('proof-project-skill-precedence-clash-shape', async () => {
  const { root, home } = await fixture();
  await skillAt(path.join(root, '.agents', 'skills'), 'grilling', 'project body\n');
  await skillAt(path.join(home, '.claude', 'skills'), 'grilling', 'user body\n');

  const notes = clashNotes(await findSkillClashes({ root, home }));

  assert.equal(notes.length, 1);
  const note = notes[0] ?? '';
  assert.match(note, /"grilling"/);
  assert.match(
    note,
    new RegExp(path.join(root, '.agents', 'skills', 'grilling').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
  );
  assert.match(
    note,
    new RegExp(path.join(home, '.claude', 'skills', 'grilling').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
  );
  assert.match(note, /Claude Code loads the user-level copy first/);
  assert.match(note, /project-skill-precedence\.md/);
  assert.match(note, /home directory as it is now/);
  assert.doesNotMatch(note, /\brm\b|delete|remove/i);
  assert.deepEqual(await findSkillClashes({ root: path.join(root, 'nowhere'), home }), []);
});

test('proof-project-skill-precedence-single-source', async () => {
  const [cli, skills, setup] = await Promise.all([
    readFile(new URL('../src/skills/clash.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/skills/index.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/setup/index.ts', import.meta.url), 'utf8'),
  ]);

  assert.match(skills, /from '\.\/clash\.js'/);
  assert.match(setup, /from '\.\.\/skills\/clash\.js'/);
  assert.equal(PROJECT_SKILL_ROOTS.length, 2);
  assert.equal(USER_SKILL_ROOTS.length, 4);

  const roots = [...cli.matchAll(/'\.(claude|agents|cursor|codex)\/skills'/g)].map((match) => match[0]);
  assert.equal(roots.length, 6, 'the module declares the only copy of the six root strings');
});

test('proof-project-skill-precedence-no-deps', async () => {
  const source = await readFile(new URL('../src/skills/clash.ts', import.meta.url), 'utf8');
  const specifiers = [...source.matchAll(/from '([^']+)'/g)].map((match) => match[1] ?? '');

  assert.ok(specifiers.length > 0);
  for (const specifier of specifiers) {
    assert.ok(specifier.startsWith('node:') || specifier.startsWith('.'), `unexpected import ${specifier}`);
  }
});

test('proof-project-skill-precedence-skills-scope-independent', async () => {
  const dir = await makeRepo({});
  const home = await mkdtemp(path.join(tmpdir(), 'wolven-harness-home-'));
  await skillAt(path.join(home, '.claude', 'skills'), 'create-prd', 'a user-level create-prd\n');

  const result = await run(['skills', '--skills', 'create-prd', '--runtimes', 'claude', '--scope', 'project'], {
    cwd: dir,
    env: { HOME: home },
  });

  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stderr, /"create-prd" is installed at/);
  assert.ok(result.stderr.includes(path.join(home, '.claude', 'skills', 'create-prd')));
});

test('proof-project-skill-precedence-skills-stream', async () => {
  const dir = await makeRepo({});
  const home = await mkdtemp(path.join(tmpdir(), 'wolven-harness-home-'));
  await skillAt(path.join(home, '.claude', 'skills'), 'create-prd', 'a user-level create-prd\n');

  const result = await run(['skills', '--skills', 'create-prd', '--runtimes', 'claude', '--scope', 'project'], {
    cwd: dir,
    env: { HOME: home },
  });

  assert.equal(result.code, 0, result.stderr);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr.split('\n').filter((line) => line.includes('is installed at')).length, 1);
  assert.match(result.stderr, /^wolven-harness skills: warning: "create-prd" is installed at /m);
});

test('proof-project-skill-precedence-skills-after-copy', async () => {
  const dir = await makeRepo({});
  const home = await mkdtemp(path.join(tmpdir(), 'wolven-harness-home-'));
  const args = ['skills', '--skills', 'create-prd', '--runtimes', 'claude'];

  await run([...args, '--scope', 'project'], { cwd: dir, env: { HOME: home } });
  await writeFile(path.join(dir, '.claude', 'skills', 'create-prd', 'SKILL.md'), '# project tweak\n', 'utf8');

  const created = await run([...args, '--scope', 'global'], { cwd: dir, env: { HOME: home } });

  assert.equal(created.code, 0, created.stderr);
  assert.match(created.stderr, /"create-prd" is installed at/);

  await rm(path.join(home, '.claude', 'skills', 'create-prd'), { recursive: true, force: true });
  const cleared = await run([...args, '--scope', 'project'], { cwd: dir, env: { HOME: home } });

  assert.equal(cleared.code, 0, cleared.stderr);
  assert.doesNotMatch(cleared.stderr, /is installed at/);
});

test('proof-project-skill-precedence-skills-help', async () => {
  const dir = await makeRepo({});

  const result = await run(['skills', '--help'], { cwd: dir });

  assert.equal(result.code, 0, result.stderr);
  assert.equal(result.stderr, '');
  for (const root of USER_SKILL_ROOTS) {
    assert.ok(result.stdout.includes(`~/${root}`), `help names ~/${root}`);
  }
});

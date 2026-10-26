import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { MANIFEST } from '../renderer/sync.mjs';
import { findCommentFindings } from '../src/comments/index.js';
import { makeRepo, run } from './helpers/fixture.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixtures = path.join(root, 'test', 'fixtures');

/** Installs one skill into a fresh git repo through the `skills` command and returns the repo and skill folder. */
async function install(skill: string) {
  const dir = await makeRepo({ 'README.md': 'base\n' }, { git: true });
  const result = await run(['skills', '--skills', skill, '--runtimes', 'codex', '--scope', 'project'], { cwd: dir });
  assert.equal(result.code, 0, result.stderr);
  const skillsDir = path.join(dir, '.agents', 'skills');
  return { dir, skillsDir, folder: path.join(skillsDir, skill) };
}

/** Places the skill's fixture in the install repo and runs the installed build script on it. */
function buildInstalled(skill: string, dir: string, folder: string) {
  if (skill === 'journey-map') {
    const input = path.join(dir, 'lotr-map.json');
    cpSync(path.join(fixtures, 'journey-map', 'lotr-map.json'), input);
    const result = spawnSync(process.execPath, [path.join(folder, 'scripts', 'build-map.mjs'), input], {
      encoding: 'utf8',
    });
    return { result, page: path.join(dir, 'lotr-map.html') };
  }
  const maps = path.join(dir, 'docs', 'maps');
  mkdirSync(maps, { recursive: true });
  writeFileSync(path.join(maps, '.gitignore'), '*-canvas.json\n*-canvas.html\n');
  const mapDir = path.join(maps, 'billing-30');
  cpSync(path.join(fixtures, 'wayfinder', 'billing-30'), mapDir, { recursive: true });
  const input = path.join(mapDir, 'billing-30-map.md');
  const result = spawnSync(process.execPath, [path.join(folder, 'scripts', 'build-canvas.mjs'), input], {
    encoding: 'utf8',
  });
  return { result, page: path.join(mapDir, 'billing-30-canvas.html') };
}

/** Commits the skill's shipped JS under `.agents/skills` and returns findings from the consumer comment check. */
async function commentFindingsForSkill(skill: string, dir: string) {
  const git = (...args: string[]) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' }).trim();
  const base = git('rev-parse', 'HEAD');
  const source = path.join(root, 'templates', '.agents', 'skills', skill);
  const shipped = [
    ...MANIFEST[skill].filter((file: string) => file.endsWith('.js')).map((file: string) => `renderer/${file}`),
    ...readdirSync(path.join(source, 'scripts'))
      .filter((file) => file.endsWith('.mjs'))
      .map((file) => `scripts/${file}`),
  ];
  for (const rel of shipped) {
    const target = path.join(dir, '.agents', 'skills', skill, rel);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, readFileSync(path.join(source, rel), 'utf8'));
  }
  git('add', '-A');
  git('-c', 'user.name=t', '-c', 'user.email=t@example.com', 'commit', '-m', `add ${skill}`);
  return findCommentFindings({ root: dir, base });
}

test('proof-wayfinder-lanes-standalone (R2.8): wayfinder installs alone, builds a lanes page holding lanes scripts, and shipped scripts pass comment check', async () => {
  const { dir, skillsDir, folder } = await install('wayfinder');
  assert.deepEqual(readdirSync(skillsDir), ['wayfinder']);

  const { result, page } = buildInstalled('wayfinder', dir, folder);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(existsSync(page), 'build wrote the lanes page');
  const html = readFileSync(page, 'utf8');
  assert.ok(html.includes('Wayfinder map as lanes'));
  for (const file of ['lanes.js', 'lanes-draw.js'] as const) {
    assert.ok(html.includes(readFileSync(path.join(folder, 'renderer', file), 'utf8')), `page holds ${file}`);
  }

  assert.deepEqual(await commentFindingsForSkill('wayfinder', dir), []);
});

test('proof-wayfinder-standalone: journey-map installs alone and builds a page holding its manifest scripts', async () => {
  const { dir, skillsDir, folder } = await install('journey-map');
  assert.deepEqual(readdirSync(skillsDir), ['journey-map']);

  const { result, page } = buildInstalled('journey-map', dir, folder);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(existsSync(page), 'build wrote the page');
  const html = readFileSync(page, 'utf8');
  const scripts = MANIFEST['journey-map'].filter((file: string) => file.endsWith('.js'));
  assert.ok(scripts.length > 0);
  for (const file of scripts) {
    assert.ok(html.includes(readFileSync(path.join(folder, 'renderer', file), 'utf8')), `page holds ${file}`);
  }
});

test(`proof-wayfinder-comments-clean: journey-map's shipped scripts pass a consumer comment check`, async () => {
  const dir = await makeRepo({ 'README.md': 'base\n' }, { git: true });
  assert.deepEqual(await commentFindingsForSkill('journey-map', dir), []);
});

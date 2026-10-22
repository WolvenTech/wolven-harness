import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { chmod, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import { test } from 'node:test';
import { promisify } from 'node:util';
import { DEFAULT_CHECKS, type DoctorCheck, type DoctorContext, runDoctor } from '../src/doctor/index.js';
import type { Io } from '../src/setup/types.js';
import { makeRepo, run } from './helpers/fixture.js';
import { walkFiles } from './helpers/walk.js';

const CONFIG = {
  version: 1,
  gitHost: 'gh',
  runtimes: ['claude'],
};

const CONFIG_TEXT = `${JSON.stringify(CONFIG, null, 2)}\n`;
const execFileAsync = promisify(execFile);

/** A captured `Io` for calling `runDoctor` directly. */
function doctorIo(cwd: string): { io: Io; stdout: () => string; stderr: () => string } {
  const out = new PassThrough();
  const err = new PassThrough();
  let stdout = '';
  let stderr = '';
  out.on('data', (chunk) => {
    stdout += chunk.toString();
  });
  err.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  const io: Io = { cwd, stdin: new PassThrough(), stdout: out, stderr: err, isTTY: false, env: {} };
  return { io, stdout: () => stdout, stderr: () => stderr };
}

/** Runs `runDoctor` with injected checks and the output captured. */
async function runChecks(
  dir: string,
  args: string[],
  checks: readonly DoctorCheck[],
): Promise<{ code: number; stdout: string; stderr: string }> {
  const { io, stdout, stderr } = doctorIo(dir);
  const code = await runDoctor(args, io, checks);
  await new Promise((resolve) => setImmediate(resolve));
  return { code, stdout: stdout(), stderr: stderr() };
}

/** Relative path to sha-256 of every regular file under `root`, for the read-only proof. */
async function treeHashes(root: string): Promise<Record<string, string>> {
  const hashes: Record<string, string> = {};
  for (const rel of (await walkFiles(root)).sort()) {
    hashes[rel] = createHash('sha256')
      .update(await readFile(path.join(root, rel)))
      .digest('hex');
  }
  return hashes;
}

/** The finding codes in the order they printed. */
function printedCodes(text: string): string[] {
  return [...text.matchAll(/\[(doctor-[a-z-]+)\]/g)].map((match) => match[1]);
}

test('doctor: findings print one per line, errors carry a fix line, and the summary counts both levels', async () => {
  const dir = await makeRepo({ '.wolven-harness.json': CONFIG_TEXT });
  const checks: DoctorCheck[] = [
    () => [{ level: 'warn', code: 'doctor-not-global', message: 'wolven-harness is not on PATH' }],
    () => [{ level: 'error', code: 'doctor-qmd', message: 'qmd is not on PATH', fix: 'install qmd' }],
  ];

  const result = await runChecks(dir, [], checks);

  assert.equal(result.code, 1);
  assert.deepEqual(result.stdout.trimEnd().split('\n'), [
    'warn [doctor-not-global] wolven-harness is not on PATH',
    'error [doctor-qmd] qmd is not on PATH',
    'fix: install qmd',
    'doctor: 1 error(s), 1 warning(s)',
  ]);
  assert.equal(result.stderr, '');
});

test('doctor: warnings alone still print doctor: ok and exit 0', async () => {
  const dir = await makeRepo({ '.wolven-harness.json': CONFIG_TEXT });
  const checks: DoctorCheck[] = [
    () => [{ level: 'warn', code: 'doctor-version-behind', message: 'the recorded version is older' }],
  ];

  const result = await runChecks(dir, [], checks);

  assert.equal(result.code, 0);
  assert.deepEqual(result.stdout.trimEnd().split('\n'), [
    'warn [doctor-version-behind] the recorded version is older',
    'doctor: ok',
  ]);
});

test('doctor: a folder with no config yields only doctor-config', async () => {
  const dir = await makeRepo({});

  const result = await run(['doctor'], { cwd: dir });

  assert.equal(result.code, 1);
  assert.deepEqual(printedCodes(result.stdout), ['doctor-config']);
  assert.match(result.stdout, /^error \[doctor-config\] .*\.wolven-harness\.json/m);
  assert.match(result.stdout, /^fix: /m);
  assert.match(result.stdout, /^doctor: 1 error\(s\), 0 warning\(s\)$/m);
});

test('doctor: an invalid config yields only doctor-config, naming the key', async () => {
  const dir = await makeRepo({ '.wolven-harness.json': '{"version": 2}\n' });

  const result = await run(['doctor'], { cwd: dir });

  assert.equal(result.code, 1);
  assert.deepEqual(printedCodes(result.stdout), ['doctor-config']);
  assert.match(result.stdout, /"version"/);
  assert.match(result.stdout, /^doctor: 1 error\(s\), 0 warning\(s\)$/m);
});

test('doctor: --dir and --dir= select another folder, and the default is the working directory', async () => {
  const target = await makeRepo({ '.wolven-harness.json': CONFIG_TEXT });
  const elsewhere = await makeRepo({});
  const seen: string[] = [];
  const checks: DoctorCheck[] = [
    (ctx) => {
      seen.push(ctx.root);
      return [];
    },
  ];

  const spaced = await runChecks(elsewhere, ['--dir', target], checks);
  const equals = await runChecks(elsewhere, [`--dir=${target}`], checks);
  const current = await runChecks(target, [], checks);

  for (const result of [spaced, equals, current]) {
    assert.equal(result.code, 0);
    assert.equal(result.stdout, 'doctor: ok\n');
  }
  assert.deepEqual(seen, [target, target, target]);
});

test('doctor: an unknown argument and a missing --dir value exit 1 before any check', async () => {
  const dir = await makeRepo({ '.wolven-harness.json': CONFIG_TEXT });
  const checks: DoctorCheck[] = [() => assert.fail('no check may run')];

  const unknown = await runChecks(dir, ['--bogus'], checks);
  const missing = await runChecks(dir, ['--dir'], checks);

  for (const result of [unknown, missing]) {
    assert.equal(result.code, 1);
    assert.match(result.stderr, /Usage: wolven-harness doctor \[--dir <path>\]/);
    assert.equal(result.stdout, '');
  }
});

test('doctor: a linked layout hands checks the harness home, a home layout hands the root', async () => {
  const linkedDir = await makeRepo({
    '.wolven-harness.json': `${JSON.stringify({ ...CONFIG, layout: 'linked', harnessHome: 'harness' }, null, 2)}\n`,
  });
  const homeDir = await makeRepo({ '.wolven-harness.json': CONFIG_TEXT });
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8')) as {
    version: string;
  };
  const seen: DoctorContext[] = [];
  const checks: DoctorCheck[] = [
    (ctx) => {
      seen.push(ctx);
      return [];
    },
  ];

  await runChecks(linkedDir, [], checks);
  await runChecks(homeDir, [], checks);

  assert.equal(seen[0].root, linkedDir);
  assert.equal(seen[0].harnessHome, path.resolve(linkedDir, 'harness'));
  assert.equal(seen[0].packageVersion, pkg.version);
  assert.ok(
    existsSync(path.join(seen[0].templatesDir, 'WOLVEN.md')),
    'templates dir resolves to the package templates',
  );
  assert.equal(seen[1].harnessHome, homeDir);
});

test('doctor: a run changes no file in the tree', async () => {
  const dir = await makeRepo({
    '.wolven-harness.json': CONFIG_TEXT,
    '.agents/skills/demo/SKILL.md': '---\nname: demo\ndescription: A demo skill.\n---\n\n# Demo\n',
    'docs/notes/demo/demo-note.md': '---\ntype: note\ntitle: Demo\n---\n\n# Demo\n',
  });
  const before = await treeHashes(dir);

  const result = await run(['doctor'], { cwd: dir });
  const after = await treeHashes(dir);

  assert.deepEqual(after, before);
  assert.match(result.stdout, /^doctor: /m);
  assert.ok(result.code === 0 || result.code === 1);
});

test('proof-install-experience-global-hint (doctor): a local executable names the global install command', async () => {
  const dir = await makeRepo({
    '.wolven-harness.json': `${JSON.stringify({ ...CONFIG, packageManager: 'pnpm' }, null, 2)}\n`,
  });

  const result = await run(['doctor'], {
    cwd: dir,
    env: { PATH: '' },
    execPath: '/repo/node_modules/.pnpm/@wolven-tech+harness@0.3.2/node_modules/@wolven-tech/harness/dist/cli.js',
  });

  assert.ok(result.stdout.includes('warn [doctor-not-global]'), result.stdout);
  assert.ok(result.stdout.includes('Install it globally: pnpm add -g @wolven-tech/harness'), result.stdout);
});

test('doctor: the default run wires the three check modules in order', () => {
  assert.deepEqual(
    DEFAULT_CHECKS.map((check) => check.name),
    ['runRuntimeChecks', 'runEnvChecks', 'runDriftChecks'],
  );
});

test('doctor: a claude-and-codex install with a complete inline block exits 0', async () => {
  const dir = await makeRepo({}, { git: true });
  const setup = await run(['setup', '--git-host', 'gh', '--runtimes', 'claude,codex'], { cwd: dir });
  assert.equal(setup.code, 0, setup.stderr);

  const ruleNames = (await readdir(path.join(dir, '.agents', 'rules'))).filter((name) => name.endsWith('.md')).sort();
  const bodies: string[] = [];
  for (const name of ruleNames) {
    const raw = await readFile(path.join(dir, '.agents', 'rules', name), 'utf8');
    const body = raw.replace(/^---\n[\s\S]*?\n---\n?/, '');
    bodies.push(
      body.replace(
        /^(#{1,6})([ \t]+.*)$/gm,
        (_heading, hashes: string, rest: string) =>
          `${hashes.length === 1 ? '###' : '#'.repeat(Math.min(hashes.length + 1, 6))}${rest}`,
      ),
    );
  }
  const block = `<!-- wolven-harness:rules:start -->\n\n${bodies.join('\n\n')}\n\n<!-- wolven-harness:rules:end -->`;
  const agents = `<!-- wolven-harness:start -->\n\n# Agents\n\n${block}\n\n<!-- wolven-harness:end -->\n`;
  await writeFile(path.join(dir, 'AGENTS.md'), agents, 'utf8');

  await writeFile(path.join(dir, '.qmd', 'index.sqlite'), 'fixture index', 'utf8');
  const tools = await makeRepo({ qmd: '#!/bin/sh\nexit 0\n', 'wolven-harness': '#!/bin/sh\nexit 0\n' });
  for (const name of ['qmd', 'wolven-harness']) await chmod(path.join(tools, name), 0o755);
  const result = await run(['doctor'], { cwd: dir, env: { PATH: `${tools}:${process.env.PATH ?? ''}` } });

  assert.equal(result.code, 0, result.stdout);
  assert.equal(result.stdout, 'doctor: ok\n');
});

test('proof-install-experience-doctor-gemini: a gemini-and-codex install passes until GEMINI.md is removed', async () => {
  const dir = await makeRepo({}, { git: true });
  const setup = await run(['setup', '--git-host', 'gh', '--runtimes', 'gemini,codex'], { cwd: dir });
  assert.equal(setup.code, 0, setup.stderr);

  const ruleNames = (await readdir(path.join(dir, '.agents', 'rules'))).filter((name) => name.endsWith('.md')).sort();
  const bodies: string[] = [];
  for (const name of ruleNames) {
    const raw = await readFile(path.join(dir, '.agents', 'rules', name), 'utf8');
    const body = raw.replace(/^---\n[\s\S]*?\n---\n?/, '');
    bodies.push(
      body.replace(
        /^(#{1,6})([ \t]+.*)$/gm,
        (_heading, hashes: string, rest: string) =>
          `${hashes.length === 1 ? '###' : '#'.repeat(Math.min(hashes.length + 1, 6))}${rest}`,
      ),
    );
  }
  const block = `<!-- wolven-harness:rules:start -->\n\n${bodies.join('\n\n')}\n\n<!-- wolven-harness:rules:end -->`;
  const agents = `<!-- wolven-harness:start -->\n\n# Agents\n\n${block}\n\n<!-- wolven-harness:end -->\n`;
  await writeFile(path.join(dir, 'AGENTS.md'), agents, 'utf8');
  await mkdir(path.join(dir, '.qmd'), { recursive: true });
  await writeFile(path.join(dir, '.qmd', 'index.sqlite'), 'fixture index', 'utf8');

  const gitEnv = {
    ...process.env,
    GIT_AUTHOR_NAME: 'Wolven Test',
    GIT_AUTHOR_EMAIL: 'wolven-test@example.com',
    GIT_COMMITTER_NAME: 'Wolven Test',
    GIT_COMMITTER_EMAIL: 'wolven-test@example.com',
  };
  await execFileAsync('git', ['add', '-A'], { cwd: dir, env: gitEnv });
  await execFileAsync('git', ['commit', '-q', '-m', 'install'], { cwd: dir, env: gitEnv });

  const tools = await makeRepo({ qmd: '#!/bin/sh\nexit 0\n', 'wolven-harness': '#!/bin/sh\nexit 0\n' });
  for (const name of ['qmd', 'wolven-harness']) await chmod(path.join(tools, name), 0o755);
  const options = { cwd: dir, env: { PATH: `${tools}:${process.env.PATH ?? ''}` } };
  const installed = await run(['doctor'], options);

  assert.equal(installed.code, 0, installed.stdout);
  assert.equal(installed.stdout, 'doctor: ok\n');

  await rm(path.join(dir, 'GEMINI.md'));
  await execFileAsync('git', ['add', '-A'], { cwd: dir, env: gitEnv });
  await execFileAsync('git', ['commit', '-q', '-m', 'remove Gemini entry'], { cwd: dir, env: gitEnv });
  const missing = await run(['doctor'], options);

  assert.equal(missing.code, 1, missing.stdout);
  assert.ok(printedCodes(missing.stdout).includes('doctor-entry'), missing.stdout);
  assert.match(missing.stdout, /doctor-entry[^\n]*Gemini/i);
});

test('proof-install-experience-no-code-writes: doctor reports .agents inside codeRepo', async () => {
  const dir = await makeRepo({
    '.wolven-harness.json': `${JSON.stringify({ ...CONFIG, codeRepo: 'client' }, null, 2)}\n`,
    'client/.agents/skills/demo/SKILL.md': '---\nname: demo\ndescription: Demo.\n---\n\n# Demo\n',
  });

  const result = await run(['doctor'], { cwd: dir });

  assert.equal(result.code, 1);
  assert.ok(printedCodes(result.stdout).includes('doctor-code-repo'), result.stdout);
  assert.match(result.stdout, /^error \[doctor-code-repo\].*\.agents/m);
  assert.match(result.stdout, /^fix: /m);
});

test('doctor: --help lists the command', async () => {
  const result = await run(['--help'], { cwd: await makeRepo({}) });

  assert.equal(result.code, 0);
  assert.match(result.stdout, /^\s+doctor\s/m);
});

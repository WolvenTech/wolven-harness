import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { chmod, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { runEnvChecks } from '../src/doctor/env-checks.js';
import type { DoctorContext } from '../src/doctor/index.js';
import { runDoctor } from '../src/doctor/index.js';
import type { DoctorFinding } from '../src/doctor/report.js';
import type { Config } from '../src/setup/config.js';
import type { Io } from '../src/setup/types.js';
import { makeRepo } from './helpers/fixture.js';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const CONFIG: Config = { version: 1, gitHost: 'gh', runtimes: ['claude'] };

function configText(extra: Partial<Config> = {}): string {
  return `${JSON.stringify({ ...CONFIG, ...extra }, null, 2)}\n`;
}

/** A temp folder holding executable stub commands. */
async function stubBin(...names: string[]): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'doctor-bin-'));
  for (const name of names) {
    const file = path.join(dir, name);
    await writeFile(file, '#!/bin/sh\nexit 0\n');
    await chmod(file, 0o755);
  }
  return dir;
}

function ctxFor(dir: string, overrides: Partial<DoctorContext> = {}): DoctorContext {
  return {
    root: dir,
    harnessHome: dir,
    config: CONFIG,
    env: {},
    templatesDir: path.join(repoRoot, 'templates'),
    packageVersion: '0.0.0-test',
    ...overrides,
  };
}

function codes(findings: readonly DoctorFinding[]): string[] {
  return findings.map((finding) => finding.code);
}

/** A fixture whose environment checks all pass, except as `files` and `extra` change it. */
async function healthyRepo(files: Record<string, string> = {}, extra: Partial<Config> = {}): Promise<string> {
  return makeRepo(
    {
      '.wolven-harness.json': configText(extra),
      'docs/notes/demo/demo-note.md': '---\ntype: note\ntitle: Demo\n---\n\n# Demo\n',
      '.qmd/index.yaml': 'collections: []\n',
      '.qmd/index.sqlite': 'index\n',
      'client/README.md': '# client\n',
      ...files,
    },
    { git: true },
  );
}

/** Runs `doctor` with only the environment checks, capturing its output. */
async function runEnvDoctor(
  dir: string,
  env: Record<string, string | undefined>,
  execPath?: string,
): Promise<{ code: number; stdout: string; stderr: string }> {
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

  const io: Io = {
    cwd: dir,
    stdin: new PassThrough(),
    stdout: out,
    stderr: err,
    isTTY: false,
    env,
    ...(execPath === undefined ? {} : { execPath }),
  };
  const code = await runDoctor([], io, [runEnvChecks]);
  await new Promise((resolve) => setImmediate(resolve));
  return { code, stdout, stderr };
}

/** The finding codes a doctor run printed, in order. */
function printedCodes(stdout: string): string[] {
  return [...stdout.matchAll(/\[(doctor-[a-z-]+)\]/g)].map((match) => match[1]);
}

test('doctor-env: a healthy environment yields no findings', async () => {
  const bin = await stubBin('qmd', 'wolven-harness');
  const dir = await healthyRepo({}, { codeRepo: 'client' });

  const findings = await runEnvChecks(ctxFor(dir, { config: { ...CONFIG, codeRepo: 'client' }, env: { PATH: bin } }));

  assert.deepEqual(findings, []);
});

test('doctor-env: a missing docs folder is an error naming setup and harness-init', async () => {
  const bin = await stubBin('qmd', 'wolven-harness');
  const dir = await makeRepo(
    { '.wolven-harness.json': configText(), '.qmd/index.yaml': 'collections: []\n', '.qmd/index.sqlite': 'index\n' },
    { git: true },
  );

  const findings = await runEnvChecks(ctxFor(dir, { env: { PATH: bin } }));

  assert.deepEqual(codes(findings), ['doctor-docs']);
  assert.match(findings[0].message, /docs\/ is missing/);
  assert.match(findings[0].fix ?? '', /setup/);
});

test('doctor-env: docs outside a git repository is an error naming git init', async () => {
  const bin = await stubBin('qmd', 'wolven-harness');
  const dir = await makeRepo({
    '.wolven-harness.json': configText(),
    'docs/notes/demo/demo-note.md': '# Demo\n',
    '.qmd/index.yaml': 'collections: []\n',
    '.qmd/index.sqlite': 'index\n',
  });

  const findings = await runEnvChecks(ctxFor(dir, { env: { PATH: bin } }));

  assert.deepEqual(codes(findings), ['doctor-docs']);
  assert.match(findings[0].message, /not inside a git repository/);
});

test('doctor-env: a docs repository without commits is an error', async () => {
  const bin = await stubBin('qmd', 'wolven-harness');
  const dir = await makeRepo({
    '.wolven-harness.json': configText(),
    'docs/notes/demo/demo-note.md': '# Demo\n',
    '.qmd/index.yaml': 'collections: []\n',
    '.qmd/index.sqlite': 'index\n',
  });
  await execFileAsync('git', ['init', '-q'], { cwd: dir });

  const findings = await runEnvChecks(ctxFor(dir, { env: { PATH: bin } }));

  assert.deepEqual(codes(findings), ['doctor-docs']);
  assert.match(findings[0].message, /no commits/);
});

test('doctor-env: docs excluded by an ignore rule is an error naming check-ignore', async () => {
  const bin = await stubBin('qmd', 'wolven-harness');
  const dir = await healthyRepo({ '.gitignore': 'docs/\n' });

  const findings = await runEnvChecks(ctxFor(dir, { env: { PATH: bin } }));

  assert.deepEqual(codes(findings), ['doctor-docs']);
  assert.match(findings[0].message, /ignored/);
  assert.match(findings[0].fix ?? '', /check-ignore/);
});

test('doctor-env: qmd absent from PATH is an error naming the install and update steps', async () => {
  const bin = await stubBin('wolven-harness');
  const dir = await healthyRepo();

  const findings = await runEnvChecks(ctxFor(dir, { env: { PATH: bin } }));

  assert.deepEqual(codes(findings), ['doctor-qmd']);
  assert.match(findings[0].message, /not on PATH/);
  assert.match(findings[0].fix ?? '', /qmd update/);
});

test('doctor-env: a missing .qmd/index.sqlite is an error naming qmd update', async () => {
  const bin = await stubBin('qmd', 'wolven-harness');
  const dir = await healthyRepo();
  await rm(path.join(dir, '.qmd/index.sqlite'));

  const findings = await runEnvChecks(ctxFor(dir, { env: { PATH: bin } }));

  assert.deepEqual(codes(findings), ['doctor-qmd']);
  assert.match(findings[0].message, /index\.sqlite is missing/);
  assert.match(findings[0].fix ?? '', /qmd update/);
});

test('proof-install-experience-qmd-reach: qmd follows the linked .qmd from the open folder', async () => {
  const bin = await stubBin('qmd', 'wolven-harness');
  const home = await healthyRepo();
  const open = await makeRepo({});
  const ctx = ctxFor(open, { harnessHome: home, env: { PATH: bin } });

  const missingLink = await runEnvChecks(ctx);
  assert.deepEqual(codes(missingLink), ['doctor-qmd']);
  assert.match(missingLink[0].fix ?? '', /link \.qmd/);

  await symlink(path.join(home, '.qmd'), path.join(open, '.qmd'));
  assert.deepEqual(await runEnvChecks(ctx), []);
});

test('doctor-env: a nearer qmd index from another folder is an error', async () => {
  const bin = await stubBin('qmd', 'wolven-harness');
  const home = await healthyRepo();
  const open = await makeRepo({ '.qmd/index.yml': 'collections: []\n' });

  const findings = await runEnvChecks(ctxFor(open, { harnessHome: home, env: { PATH: bin } }));

  assert.deepEqual(codes(findings), ['doctor-qmd']);
  assert.match(findings[0].message, /does not belong to the harness home/);
  assert.match(findings[0].fix ?? '', /remove or move the nearer \.qmd/);
});

test('doctor-env: no harness path under codeRepo yields nothing, a .agents folder fires', async () => {
  const bin = await stubBin('qmd', 'wolven-harness');
  const clean = await healthyRepo({}, { codeRepo: 'client' });
  const dirty = await healthyRepo({ 'client/.agents/skills/demo/SKILL.md': 'x\n' }, { codeRepo: 'client' });

  const cleanFindings = await runEnvChecks(
    ctxFor(clean, { config: { ...CONFIG, codeRepo: 'client' }, env: { PATH: bin } }),
  );
  const dirtyFindings = await runEnvChecks(
    ctxFor(dirty, { config: { ...CONFIG, codeRepo: 'client' }, env: { PATH: bin } }),
  );

  assert.deepEqual(cleanFindings, []);
  assert.deepEqual(codes(dirtyFindings), ['doctor-code-repo']);
  assert.match(dirtyFindings[0].message, /\.agents/);
  assert.match(dirtyFindings[0].fix ?? '', /move \.agents/);
});

test('doctor-env: a code repository holding its own .claude settings gives no finding', async () => {
  const bin = await stubBin('qmd', 'wolven-harness');
  const dir = await healthyRepo(
    { 'client/.claude/settings.json': '{}\n', 'client/.kiro/steering/team-style.md': 'x\n' },
    { codeRepo: 'client' },
  );

  const findings = await runEnvChecks(ctxFor(dir, { config: { ...CONFIG, codeRepo: 'client' }, env: { PATH: bin } }));

  assert.deepEqual(findings, []);
});

test('doctor-env: every harness-owned path under codeRepo gives a finding', async () => {
  const bin = await stubBin('qmd', 'wolven-harness');
  const dir = await healthyRepo(
    {
      'client/.agents/skills/demo/SKILL.md': 'x\n',
      'client/.wolven-harness.json': '{}\n',
      'client/WOLVEN.md': 'x\n',
      'client/.qmd/index.sqlite': 'x\n',
      'client/.kiro/steering/wolven-first.md': 'x\n',
      '.agents/skills/demo/SKILL.md': 'x\n',
      '.agents/rules/first.md': 'x\n',
    },
    { codeRepo: 'client' },
  );
  await mkdir(path.join(dir, 'client/.claude'), { recursive: true });
  await symlink(path.join(dir, '.agents/skills'), path.join(dir, 'client/.claude/skills'));
  await symlink(path.join(dir, '.agents/rules'), path.join(dir, 'client/.claude/rules'));

  const findings = await runEnvChecks(ctxFor(dir, { config: { ...CONFIG, codeRepo: 'client' }, env: { PATH: bin } }));

  const named = findings.map((finding) => finding.message.split(': ')[1]).sort();
  assert.deepEqual(named, [
    '.agents',
    '.claude/rules',
    '.claude/skills',
    '.kiro/steering/wolven-first.md',
    '.qmd',
    '.wolven-harness.json',
    'WOLVEN.md',
  ]);
});

test('doctor-env: no codeRepo key means no code-repo check', async () => {
  const bin = await stubBin('qmd', 'wolven-harness');
  const dir = await healthyRepo({ '.agents/skills/demo/SKILL.md': 'x\n' });

  const findings = await runEnvChecks(ctxFor(dir, { env: { PATH: bin } }));

  assert.deepEqual(findings, []);
});

test('doctor-env: wolven-harness absent from PATH warns and never fails the run', async () => {
  const bin = await stubBin('qmd');
  const dir = await healthyRepo();

  const findings = await runEnvChecks(ctxFor(dir, { env: { PATH: bin } }));

  assert.deepEqual(codes(findings), ['doctor-not-global']);
  assert.equal(findings[0].level, 'warn');
  assert.equal('fix' in findings[0], false, 'a warning carries no fix line');
});

test('doctor-env: a missing PATH means not found, not a crash', async () => {
  const dir = await healthyRepo();

  const findings = await runEnvChecks(ctxFor(dir, { env: {} }));

  assert.deepEqual(codes(findings), ['doctor-qmd', 'doctor-not-global']);
});

test('proof-install-experience-global-hint: local and cache executables print the resolved manager command', async () => {
  const bin = await stubBin('qmd');
  const cases = [
    {
      manager: 'pnpm' as const,
      execPath: '/repo/node_modules/.pnpm/@wolven-tech+harness@0.3.2/node_modules/@wolven-tech/harness/dist/cli.js',
      command: 'pnpm add -g @wolven-tech/harness',
    },
    {
      manager: 'npm' as const,
      execPath: '/home/user/.npm/_npx/123/node_modules/@wolven-tech/harness/dist/cli.js',
      command: 'npm install -g @wolven-tech/harness',
    },
  ];

  for (const { manager, execPath, command } of cases) {
    const dir = await healthyRepo({}, { packageManager: manager });
    const result = await runEnvDoctor(dir, { PATH: bin }, execPath);

    assert.equal(result.code, 0, result.stdout);
    assert.ok(result.stdout.includes(`warn [doctor-not-global]`));
    assert.ok(result.stdout.includes(command), result.stdout);
  }
});

test('proof-install-experience-doctor-checks (environment): the audited shape exits 1 with its codes', async () => {
  const bin = await stubBin();
  const dir = await makeRepo({
    '.wolven-harness.json': configText({ codeRepo: 'client' }),
    'client/.agents/skills/demo/SKILL.md': 'x\n',
  });

  const result = await runEnvDoctor(dir, { PATH: bin });

  assert.equal(result.code, 1);
  assert.deepEqual(printedCodes(result.stdout), [
    'doctor-docs',
    'doctor-qmd',
    'doctor-qmd',
    'doctor-qmd',
    'doctor-code-repo',
    'doctor-not-global',
  ]);
  assert.match(result.stdout, /^doctor: 5 error\(s\), 1 warning\(s\)$/m);
});

test('proof-install-experience-doctor-checks (environment): the repaired shape exits 0', async () => {
  const bin = await stubBin('qmd', 'wolven-harness');
  const dir = await healthyRepo({}, { codeRepo: 'client' });

  const result = await runEnvDoctor(dir, { PATH: bin });

  assert.equal(result.code, 0, result.stdout);
  assert.equal(result.stdout.trimEnd(), 'doctor: ok');
});

test('proof-install-experience-pm-global: the PATH lookup accepts a binary any manager installed', async () => {
  const bin = await stubBin('qmd', 'wolven-harness');
  const dir = await healthyRepo();

  const found = await runEnvChecks(ctxFor(dir, { env: { PATH: `${bin}${path.delimiter}/nonexistent` } }));

  assert.deepEqual(found, []);
});

test('doctor-env: every error carries a non-empty fix and every warning omits one', async () => {
  const bin = await stubBin();
  const dir = await makeRepo({ '.wolven-harness.json': configText({ codeRepo: 'client' }) });

  const findings = await runEnvChecks(ctxFor(dir, { config: { ...CONFIG, codeRepo: 'client' }, env: { PATH: bin } }));

  assert.ok(findings.some((finding) => finding.level === 'error'));
  assert.ok(findings.some((finding) => finding.level === 'warn'));
  for (const finding of findings) {
    if (finding.level === 'error') assert.ok(finding.fix.length > 0, `${finding.code} has a fix`);
    else assert.equal('fix' in finding, false, `${finding.code} has no fix`);
  }
});

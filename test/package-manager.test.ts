import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import type { PackageManager } from '../src/setup/config.js';
import { HARNESS_SCORE_VERSION, harnessScoreWarning } from '../src/setup/harness-score.js';
import { devDependencyWarning } from '../src/setup/own-package.js';
import {
  buildCommand,
  COMMAND_KINDS,
  type CommandKind,
  recordedPackageManager,
  resolvePackageManager,
} from '../src/setup/package-manager.js';
import type { Context, Prompter } from '../src/setup/types.js';
import { SetupError } from '../src/setup/types.js';
import { makeRepo, run } from './helpers/fixture.js';
import { makeIo } from './helpers/io.js';
import { walkFiles } from './helpers/walk.js';

const MANAGERS: readonly PackageManager[] = ['npm', 'yarn', 'pnpm', 'none'];
const ARGUMENTS: Record<CommandKind, string> = {
  'run-script': 'harness:validate',
  'exec-binary': 'wolven-harness',
  'execute-package': 'harness-score@1.6.5',
  'add-dev-dependency': '@wolven-tech/harness',
  'add-dev-dependency-exact': 'harness-score@1.6.5',
  'remove-dependency': '@wolven-tech/harness',
  'global-add': 'wolven-harness',
};

const EXPECTED: Record<PackageManager, Record<CommandKind, string>> = {
  npm: {
    'run-script': 'npm run harness:validate',
    'exec-binary': 'npx wolven-harness',
    'execute-package': 'npx harness-score@1.6.5',
    'add-dev-dependency': 'npm install -D @wolven-tech/harness',
    'add-dev-dependency-exact': 'npm install -D -E harness-score@1.6.5',
    'remove-dependency': 'npm uninstall @wolven-tech/harness',
    'global-add': 'npm install -g wolven-harness',
  },
  yarn: {
    'run-script': 'yarn harness:validate',
    'exec-binary': 'yarn exec wolven-harness',
    'execute-package': 'yarn dlx harness-score@1.6.5',
    'add-dev-dependency': 'yarn add -D @wolven-tech/harness',
    'add-dev-dependency-exact': 'yarn add -D --exact harness-score@1.6.5',
    'remove-dependency': 'yarn remove @wolven-tech/harness',
    'global-add': 'yarn global add wolven-harness',
  },
  pnpm: {
    'run-script': 'pnpm harness:validate',
    'exec-binary': 'pnpm exec wolven-harness',
    'execute-package': 'pnpm dlx harness-score@1.6.5',
    'add-dev-dependency': 'pnpm add -D @wolven-tech/harness',
    'add-dev-dependency-exact': 'pnpm add -D -E harness-score@1.6.5',
    'remove-dependency': 'pnpm remove @wolven-tech/harness',
    'global-add': 'pnpm add -g wolven-harness',
  },
  none: {
    'run-script': 'harness:validate',
    'exec-binary': 'wolven-harness',
    'execute-package': 'harness-score@1.6.5',
    'add-dev-dependency': '@wolven-tech/harness',
    'add-dev-dependency-exact': 'harness-score@1.6.5',
    'remove-dependency': '@wolven-tech/harness',
    'global-add': 'npm install -g wolven-harness',
  },
};

function packageJson(extra: Record<string, unknown> = {}): string {
  return `${JSON.stringify({ name: 'consumer', version: '1.0.0', ...extra }, null, 2)}\n`;
}

async function readConfigFile(dir: string): Promise<Record<string, unknown>> {
  const raw = await readFile(path.join(dir, '.wolven-harness.json'), 'utf8');
  return JSON.parse(raw) as Record<string, unknown>;
}

function makeCtx(root: string): Context {
  return { root, templatesDir: path.join(root, 'templates'), io: makeIo(root) };
}

/** A prompter that answers the package-manager question and records every message it is asked. */
function managerPrompter(answer: 'npm' | 'yarn' | 'pnpm', asked: string[] = []): Prompter {
  return {
    async select(o) {
      asked.push(o.message);
      return answer as never;
    },
    async multiselect() {
      throw new Error('multiselect should not be asked');
    },
  };
}

/** A prompter that fails the test if setup asks anything. */
function silentPrompter(): Prompter {
  return {
    async select() {
      throw new Error('select should not be asked');
    },
    async multiselect() {
      throw new Error('multiselect should not be asked');
    },
  };
}

test('pm-detect: the flag wins over the recorded value, the field and a lockfile', async () => {
  const dir = await makeRepo({
    'package.json': packageJson({ packageManager: 'yarn@4.0.0' }),
    'package-lock.json': '',
  });

  assert.equal(await resolvePackageManager(dir, { flag: 'npm', recorded: 'pnpm' }), 'npm');
});

test('pm-detect: the recorded value wins over the field and a lockfile', async () => {
  const dir = await makeRepo({
    'package.json': packageJson({ packageManager: 'yarn@4.0.0' }),
    'package-lock.json': '',
  });

  assert.equal(await resolvePackageManager(dir, { recorded: 'pnpm' }), 'pnpm');
});

test('pm-detect: package.json packageManager names the manager before its @ version', async () => {
  const dir = await makeRepo({ 'package.json': packageJson({ packageManager: 'pnpm@9.1.0' }), 'yarn.lock': '' });

  assert.equal(await resolvePackageManager(dir), 'pnpm');
});

test('pm-detect: an unsupported field name falls through to the lockfile', async () => {
  const dir = await makeRepo({ 'package.json': packageJson({ packageManager: 'bun@1.2.0' }), 'yarn.lock': '' });

  assert.equal(await resolvePackageManager(dir), 'yarn');
});

test('pm-detect: each single lockfile resolves its manager', async () => {
  for (const [lockfile, manager] of [
    ['pnpm-lock.yaml', 'pnpm'],
    ['yarn.lock', 'yarn'],
    ['package-lock.json', 'npm'],
  ] as const) {
    const dir = await makeRepo({ 'package.json': packageJson(), [lockfile]: '' });
    assert.equal(await resolvePackageManager(dir), manager, lockfile);
  }
});

test('pm-detect: no package.json resolves none', async () => {
  assert.equal(await resolvePackageManager(await makeRepo({ 'README.md': '# x\n' })), 'none');
});

test('pm-detect: a package.json with no other signal resolves npm', async () => {
  assert.equal(await resolvePackageManager(await makeRepo({ 'package.json': packageJson() })), 'npm');
});

test('pm-detect: several lockfiles with no one to ask fails naming --package-manager', async () => {
  const dir = await makeRepo({ 'package.json': packageJson(), 'pnpm-lock.yaml': '', 'yarn.lock': '' });

  await assert.rejects(resolvePackageManager(dir), (err: unknown) => {
    assert.ok(err instanceof SetupError, 'throws SetupError');
    assert.match((err as Error).message, /pnpm, yarn/);
    assert.match((err as SetupError).hint ?? '', /--package-manager/);
    return true;
  });
});

test('pm-detect: several lockfiles ask once', async () => {
  const dir = await makeRepo({
    'package.json': packageJson(),
    'pnpm-lock.yaml': '',
    'package-lock.json': '',
  });
  let asked = 0;

  const manager = await resolvePackageManager(dir, {}, async () => {
    asked += 1;
    return 'yarn';
  });

  assert.equal(manager, 'yarn');
  assert.equal(asked, 1);
});

test('pm-detect: setup records the flag value and skips the prompt', async () => {
  const dir = await makeRepo({ 'package.json': packageJson(), 'pnpm-lock.yaml': '' }, { git: true });

  const result = await run(
    ['setup', '--git-host', 'gh', '--runtimes', 'codex', '--skills', 'none', '--package-manager', 'npm'],
    { cwd: dir, isTTY: true, prompts: silentPrompter() },
  );

  assert.equal(result.code, 0, result.stderr);
  assert.equal((await readConfigFile(dir)).packageManager, 'npm');
});

test('pm-detect: setup records the recorded config value', async () => {
  const existing = {
    version: 1,
    gitHost: 'gh',
    runtimes: ['codex'],
    packageManager: 'yarn',
  };
  const dir = await makeRepo(
    { 'package.json': packageJson(), 'pnpm-lock.yaml': '', '.wolven-harness.json': JSON.stringify(existing) },
    { git: true },
  );

  const result = await run(['setup', '--skills', 'none'], { cwd: dir });

  assert.equal(result.code, 0, result.stderr);
  assert.equal((await readConfigFile(dir)).packageManager, 'yarn');
});

test('pm-detect: setup records a lockfile and a package.json field', async () => {
  const byLockfile = await makeRepo({ 'package.json': packageJson(), 'yarn.lock': '' }, { git: true });
  const lockfileRun = await run(['setup', '--git-host', 'gh', '--runtimes', 'codex', '--skills', 'none'], {
    cwd: byLockfile,
  });
  assert.equal(lockfileRun.code, 0, lockfileRun.stderr);
  assert.equal((await readConfigFile(byLockfile)).packageManager, 'yarn');

  const byField = await makeRepo(
    { 'package.json': packageJson({ packageManager: 'pnpm@9' }), 'yarn.lock': '' },
    { git: true },
  );
  const fieldRun = await run(['setup', '--git-host', 'gh', '--runtimes', 'codex', '--skills', 'none'], {
    cwd: byField,
  });
  assert.equal(fieldRun.code, 0, fieldRun.stderr);
  assert.equal((await readConfigFile(byField)).packageManager, 'pnpm');
});

test('pm-detect: setup records none without a package.json and npm with no other signal', async () => {
  const withoutPackage = await makeRepo({}, { git: true });
  const noneRun = await run(['setup', '--git-host', 'gh', '--runtimes', 'codex', '--skills', 'none'], {
    cwd: withoutPackage,
  });
  assert.equal(noneRun.code, 0, noneRun.stderr);
  assert.equal((await readConfigFile(withoutPackage)).packageManager, 'none');

  const withPackage = await makeRepo({ 'package.json': packageJson() }, { git: true });
  const npmRun = await run(['setup', '--git-host', 'gh', '--runtimes', 'codex', '--skills', 'none'], {
    cwd: withPackage,
  });
  assert.equal(npmRun.code, 0, npmRun.stderr);
  assert.equal((await readConfigFile(withPackage)).packageManager, 'npm');
});

test('pm-detect: several lockfiles off a terminal exit 1 naming --package-manager', async () => {
  const dir = await makeRepo({ 'package.json': packageJson(), 'pnpm-lock.yaml': '', 'yarn.lock': '' }, { git: true });

  const result = await run(['setup', '--git-host', 'gh', '--runtimes', 'codex', '--skills', 'none'], { cwd: dir });

  assert.equal(result.code, 1);
  assert.match(result.stderr, /--package-manager/);
  await assert.rejects(readConfigFile(dir), 'nothing is written on a failed resolution');
});

test('pm-detect: several lockfiles on a terminal ask once and record the answer', async () => {
  const dir = await makeRepo({ 'package.json': packageJson(), 'pnpm-lock.yaml': '', 'yarn.lock': '' }, { git: true });
  const asked: string[] = [];

  const result = await run(['setup', '--git-host', 'gh', '--runtimes', 'codex', '--skills', 'none'], {
    cwd: dir,
    isTTY: true,
    prompts: managerPrompter('yarn', asked),
  });

  assert.equal(result.code, 0, result.stderr);
  assert.equal(asked.length, 1, 'one question');
  assert.match(asked[0], /Which package manager does this project use\?/);
  assert.equal((await readConfigFile(dir)).packageManager, 'yarn');
});

test('pm-detect: an invalid flag value on a terminal is asked again', async () => {
  const dir = await makeRepo({ 'package.json': packageJson() }, { git: true });
  const asked: string[] = [];

  const result = await run(
    ['setup', '--git-host', 'gh', '--runtimes', 'codex', '--skills', 'none', '--package-manager', 'bun'],
    { cwd: dir, isTTY: true, prompts: managerPrompter('pnpm', asked) },
  );

  assert.equal(result.code, 0, result.stderr);
  assert.match(asked[0], /^Invalid value for --package-manager: "bun"; pick from the list instead\./);
  assert.equal((await readConfigFile(dir)).packageManager, 'pnpm');
});

test('pm-detect: an invalid flag value off a terminal exits 1 naming the flag', async () => {
  const dir = await makeRepo({ 'package.json': packageJson() }, { git: true });

  const result = await run(
    ['setup', '--git-host', 'gh', '--runtimes', 'codex', '--skills', 'none', '--package-manager', 'bun'],
    { cwd: dir },
  );

  assert.equal(result.code, 1);
  assert.match(result.stderr, /invalid value for --package-manager: "bun"/);
});

test('pm-commands: every kind matches the manager table', () => {
  for (const kind of COMMAND_KINDS) {
    for (const manager of MANAGERS) {
      assert.equal(buildCommand(manager, kind, ARGUMENTS[kind]), EXPECTED[manager][kind], `${manager} ${kind}`);
    }
  }
});

test('pm-commands: the devDependency warning uses the resolved manager add form', async () => {
  for (const manager of ['npm', 'yarn', 'pnpm'] as const) {
    const ctx = makeCtx(await makeRepo({ 'package.json': packageJson() }));

    const warning = await devDependencyWarning(ctx, manager);

    assert.ok(warning, `${manager} warns`);
    assert.ok(
      warning.includes(EXPECTED[manager]['add-dev-dependency']),
      `${manager} adds with its own form: ${warning}`,
    );
  }
});

test('pm-commands: the move hint uses the resolved manager remove and add forms', async () => {
  for (const manager of ['npm', 'yarn', 'pnpm'] as const) {
    const ctx = makeCtx(
      await makeRepo({ 'package.json': packageJson({ dependencies: { '@wolven-tech/harness': '^0.1.0' } }) }),
    );

    const warning = await devDependencyWarning(ctx, manager);

    assert.ok(warning, `${manager} warns`);
    assert.ok(
      warning.includes(
        `Fix it with: ${EXPECTED[manager]['remove-dependency']} && ${EXPECTED[manager]['add-dev-dependency']}`,
      ),
      `${manager} moves with its own forms: ${warning}`,
    );
  }
});

test('pm-commands: the harness-score warning uses the resolved manager exact add form', async () => {
  for (const manager of ['npm', 'yarn', 'pnpm'] as const) {
    const ctx = makeCtx(await makeRepo({ 'package.json': packageJson() }));

    const warning = await harnessScoreWarning(ctx, manager);

    assert.ok(warning, `${manager} warns`);
    assert.ok(warning.includes(`harness-score@${HARNESS_SCORE_VERSION}`), `${manager} pins the version: ${warning}`);
    assert.ok(warning.includes(EXPECTED[manager]['add-dev-dependency-exact']), `${manager} adds exactly: ${warning}`);
  }
});

test('pm-commands: the warnings default to the recorded manager', async () => {
  const config = { version: 1, gitHost: 'gh', runtimes: ['codex'], packageManager: 'yarn' };
  const ctx = makeCtx(
    await makeRepo({
      'package.json': packageJson(),
      '.wolven-harness.json': JSON.stringify(config),
    }),
  );

  assert.equal(await recordedPackageManager(ctx.root), 'yarn');
  const warning = await devDependencyWarning(ctx);
  assert.ok(warning?.includes('yarn add -D @wolven-tech/harness'), warning);
});

const TEMPLATES_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'templates');
const VALIDATE_WIRING = '.agents/skills/harness-init/references/validate-wiring.md';

test('pm-templates: no template command hard-codes a package manager', async () => {
  const offenders: string[] = [];

  for (const rel of await walkFiles(TEMPLATES_ROOT)) {
    const lines = (await readFile(path.join(TEMPLATES_ROOT, rel), 'utf8')).split('\n');
    for (const [index, line] of lines.entries()) {
      if (!line.includes('pnpm ')) continue;
      // why: the CI wiring reference is the one place each manager's own commands belong.
      if (rel === VALIDATE_WIRING && line.trimStart().startsWith('|')) continue;
      offenders.push(`${rel}:${index + 1}: ${line.trim()}`);
    }
  }

  assert.deepEqual(offenders, []);
});

test('pm-templates: the CI wiring reference has a branch for every package manager', async () => {
  const wiring = await readFile(path.join(TEMPLATES_ROOT, VALIDATE_WIRING), 'utf8');

  assert.match(wiring, /recorded `packageManager`/);
  for (const manager of ['npm', 'yarn', 'pnpm', 'none']) {
    assert.match(wiring, new RegExp(`\\| \`${manager}\` \\|`), `${manager} has a branch`);
  }
  assert.match(wiring, /`npm ci`/);
  assert.match(wiring, /`npm run harness:validate`/);
  assert.match(wiring, /`yarn install --frozen-lockfile`/);
  assert.match(wiring, /`yarn harness:validate`/);
  assert.match(wiring, /`pnpm\/action-setup`/);
  assert.match(wiring, /`pnpm install --frozen-lockfile`/);
  assert.match(wiring, /`pnpm harness:validate`/);
  assert.match(wiring, /no install step/);
  assert.match(wiring, /globally installed `wolven-harness validate`/);
  assert.match(wiring, /`corepack enable`/);
  assert.match(wiring, /`actions\/setup-node`/);
});

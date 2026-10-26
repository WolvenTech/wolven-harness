import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmod, lstat, mkdir, mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const launcher = path.join(root, '.cursor', 'qmd-mcp.sh');

async function fakeQmd(dir: string, label: string): Promise<string> {
  const bin = path.join(dir, 'qmd');
  await writeFile(
    bin,
    `#!/bin/sh
if [ "$1" = mcp ]; then echo ${label}; exit 0; fi
exit 1
`,
    'utf8',
  );
  await chmod(bin, 0o755);
  return bin;
}

test('cloud-agent-environment: bootstrap files wire install, rules, and QMD MCP', async () => {
  const env = JSON.parse(await readFile(path.join(root, '.cursor', 'environment.json'), 'utf8')) as {
    install?: string;
    name?: string;
  };
  assert.equal(env.install, './.cursor/install.sh');
  assert.equal(env.name, 'wolven-harness');

  const installSh = await readFile(path.join(root, '.cursor', 'install.sh'), 'utf8');
  assert.match(installSh, /pnpm install/);
  assert.match(installSh, /"\$\{QMD_BIN\}" update/);
  assert.match(installSh, /embed --timeout 0/);
  assert.match(installSh, /@tobilu\/qmd/);

  const mcp = JSON.parse(await readFile(path.join(root, '.cursor', 'mcp.json'), 'utf8')) as {
    mcpServers: Record<string, { type: string; command: string; args: string[] }>;
  };
  const qmd = mcp.mcpServers.qmd;
  assert.ok(qmd, 'qmd MCP server entry');
  assert.equal(qmd.type, 'stdio');
  assert.equal(qmd.command, 'bash');
  assert.deepEqual(qmd.args, ['${workspaceFolder}/.cursor/qmd-mcp.sh']);

  const launcherSh = await readFile(launcher, 'utf8');
  assert.match(launcherSh, /QMD_LOCAL="\$\{HOME\}\/\.local\/bin\/qmd"/);
  assert.match(launcherSh, /-x "\$\{QMD_LOCAL\}"/);
  assert.match(launcherSh, /exec qmd mcp/);

  const ruleBases = (await readdir(path.join(root, '.agents', 'rules')))
    .filter((name) => name.endsWith('.md'))
    .map((name) => name.replace(/\.md$/, ''));
  assert.ok(ruleBases.length > 0);
  for (const base of ruleBases) {
    const mdcPath = path.join(root, '.cursor', 'rules', `wolven-${base}.mdc`);
    const raw = await readFile(mdcPath, 'utf8');
    assert.match(raw, /^---\nalwaysApply: true\n---\n/m, `${base} is always applied in Cursor`);
    assert.match(raw, /^# /m, `${base} keeps a heading in the rule body`);
  }

  assert.ok(await readFile(path.join(root, 'CLAUDE.md'), 'utf8').then((s) => s.includes('@AGENTS.md')));
  const skills = await readdir(path.join(root, '.agents', 'skills'));
  assert.ok(skills.includes('qmd'));
  assert.ok((await lstat(path.join(root, '.claude', 'skills'))).isSymbolicLink());
});

test('qmd-mcp launcher: uses ~/.local/bin/qmd when executable', async () => {
  const home = await mkdtemp(path.join(os.tmpdir(), 'qmd-home-local-'));
  const localBin = path.join(home, '.local', 'bin');
  await mkdir(localBin, { recursive: true });
  await fakeQmd(localBin, 'LOCAL_QMD');

  const pathBin = await mkdtemp(path.join(os.tmpdir(), 'qmd-path-fallback-'));
  await fakeQmd(pathBin, 'PATH_QMD');

  const result = spawnSync('bash', [launcher], {
    env: { ...process.env, HOME: home, PATH: `${pathBin}:${process.env.PATH ?? ''}` },
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /LOCAL_QMD/);
  assert.doesNotMatch(result.stdout, /PATH_QMD/);
});

test('qmd-mcp launcher: falls back to qmd on PATH when ~/.local copy is absent', async () => {
  const home = await mkdtemp(path.join(os.tmpdir(), 'qmd-home-empty-'));
  const pathBin = await mkdtemp(path.join(os.tmpdir(), 'qmd-path-only-'));
  await fakeQmd(pathBin, 'PATH_QMD');

  const result = spawnSync('bash', [launcher], {
    env: { ...process.env, HOME: home, PATH: `${pathBin}:${process.env.PATH ?? ''}` },
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /PATH_QMD/);
});

import assert from 'node:assert/strict';
import { lstat, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

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
  assert.equal(qmd.command, 'sh');
  const joined = qmd.args.join(' ');
  assert.match(joined, /\$\{workspaceFolder\}/);
  assert.match(joined, /\$\{userHome\}\/\.local\/bin\/qmd/);
  assert.match(joined, /\.local\/bin\/qmd" mcp/);

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

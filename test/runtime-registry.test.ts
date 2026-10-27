import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import type { RuntimeEnv } from '../src/setup/runtimes.js';
import { RUNTIME_REGISTRY, rulesMode, runtimeRow, wireRuntimes } from '../src/setup/runtimes.js';
import type { Context, Options, Runtime } from '../src/setup/types.js';

const CONTRACT_IDS: readonly Runtime[] = [
  'claude',
  'codex',
  'cursor',
  'opencode',
  'amp',
  'copilot',
  'gemini',
  'kiro',
  'antigravity',
];

const FAKE_ENV: RuntimeEnv = {
  HOME: '/fake/home',
  XDG_CONFIG_HOME: '/fake/xdg',
  CODEX_HOME: '/fake/codex',
};

const EXPECTED_MACHINE_MARKERS: Record<Runtime, string[]> = {
  claude: ['/fake/home/.claude'],
  codex: ['/fake/codex'],
  cursor: ['/fake/home/.cursor'],
  opencode: ['/fake/xdg/opencode'],
  amp: ['/fake/xdg/amp'],
  copilot: ['/fake/home/.copilot'],
  gemini: ['/fake/home/.gemini'],
  kiro: ['/fake/home/.kiro'],
  antigravity: [],
};

const EXPECTED_DEFAULT_MARKERS: Record<Runtime, string[]> = {
  claude: ['/fake/home/.claude'],
  codex: ['/fake/home/.codex'],
  cursor: ['/fake/home/.cursor'],
  opencode: ['/fake/home/.config/opencode'],
  amp: ['/fake/home/.config/amp'],
  copilot: ['/fake/home/.copilot'],
  gemini: ['/fake/home/.gemini'],
  kiro: ['/fake/home/.kiro'],
  antigravity: [],
};

const EXPECTED_FOLDER_MARKERS: Record<Runtime, string[]> = {
  claude: ['CLAUDE.md', '.claude'],
  codex: ['.codex'],
  cursor: ['.cursor', '.cursorrules'],
  opencode: ['opencode.json'],
  amp: [],
  copilot: ['.github/copilot-instructions.md'],
  gemini: ['GEMINI.md', '.gemini'],
  kiro: ['.kiro'],
  antigravity: [],
};

const SYMLINKED_SKILLS: Partial<Record<Runtime, string>> = {
  claude: '.claude/skills',
  kiro: '.kiro/skills',
};

async function sourceFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await sourceFiles(full)));
    else if (entry.isFile() && entry.name.endsWith('.ts')) files.push(full);
  }
  return files;
}

function registryLiterals(): Set<string> {
  const literals = new Set(RUNTIME_REGISTRY.map((row) => row.name));
  for (const row of RUNTIME_REGISTRY) {
    for (const marker of row.folderMarkers) literals.add(marker);
    if (row.skills.path !== '.agents/skills') literals.add(row.skills.path);
    if (row.entryFile !== undefined) literals.add(row.entryFile.path);
    const wiring = row.rules;
    if (wiring.kind === 'link' || wiring.kind === 'file') literals.add(wiring.path);
    if (wiring.kind === 'per-rule') literals.add(wiring.pattern.slice(0, wiring.pattern.indexOf('{rule}')));
    if (wiring.kind === 'imports') literals.add(wiring.source);
  }
  return literals;
}

test('runtime-registry: exports the nine rows in contract order', () => {
  assert.deepEqual(
    RUNTIME_REGISTRY.map((row) => row.id),
    CONTRACT_IDS,
  );
});

test('runtime-registry: every row is complete', () => {
  const seen = new Set<string>();

  for (const row of RUNTIME_REGISTRY) {
    assert.ok(row.id.length > 0, 'id is non-empty');
    assert.equal(seen.has(row.id), false, `${row.id} appears once`);
    seen.add(row.id);

    assert.ok(row.name.trim().length > 0, `${row.id} has a name`);
    assert.equal(typeof row.machineMarkers, 'function', `${row.id} has machine markers`);
    assert.ok(Array.isArray(row.folderMarkers), `${row.id} has folder markers`);

    for (const marker of row.folderMarkers) {
      assert.ok(marker.length > 0, `${row.id} folder marker is non-empty`);
      assert.equal(path.isAbsolute(marker), false, `${row.id} folder marker ${marker} is relative`);
      assert.doesNotMatch(marker, /\\/, `${row.id} folder marker ${marker} is posix`);
      assert.equal(marker.startsWith('../'), false, `${row.id} folder marker ${marker} stays in the repo`);
    }

    assert.ok(row.skills.path.length > 0, `${row.id} has a skills path`);
    if (row.skills.kind === 'symlink') {
      assert.ok(row.skills.target.length > 0, `${row.id} has a symlink target`);
      assert.equal(path.isAbsolute(row.skills.target), false, `${row.id} symlink target is relative`);
    } else {
      assert.equal(row.skills.kind, 'direct', `${row.id} skills path is direct or a symlink`);
    }

    assert.ok(
      ['link', 'per-rule', 'file', 'imports', 'inline'].includes(row.rules.kind),
      `${row.id} has rules wiring data`,
    );
  }
});

test('runtime-registry: rules wiring is data for every row', () => {
  assert.deepEqual(
    RUNTIME_REGISTRY.map(({ id, rules }) => [id, rules.kind]),
    [
      ['claude', 'link'],
      ['codex', 'inline'],
      ['cursor', 'per-rule'],
      ['opencode', 'file'],
      ['amp', 'imports'],
      ['copilot', 'per-rule'],
      ['gemini', 'file'],
      ['kiro', 'per-rule'],
      ['antigravity', 'inline'],
    ],
  );
});

test('proof-install-experience-rules-mode', () => {
  const cases: Array<[Runtime[], 'native' | 'inline']> = [
    [['claude', 'cursor', 'kiro'], 'native'],
    [['claude', 'antigravity'], 'inline'],
    [['claude', 'codex'], 'inline'],
    [[], 'native'],
  ];
  for (const [runtimes, expected] of cases) assert.equal(rulesMode(runtimes), expected);
});

test('proof-install-experience-rules-mode: no duplicated mode derivation', async () => {
  const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src');
  const comparisons: string[] = [];
  for (const file of await sourceFiles(sourceRoot)) {
    const rel = path.relative(sourceRoot, file);
    const lines = (await fs.readFile(file, 'utf8')).split(/\r?\n/);
    lines.forEach((line, index) => {
      if (/\.rules\s*===/.test(line)) comparisons.push(`${rel}:${index + 1}`);
    });
  }
  assert.deepEqual(comparisons, [], 'rules mode comparisons belong in rulesMode() only');
});

test('proof-install-experience-registry-data', async () => {
  const ruleNames = ['first', 'second'];
  for (const row of RUNTIME_REGISTRY) {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'runtime-registry-'));
    try {
      await fs.mkdir(path.join(root, '.agents/rules'), { recursive: true });
      for (const name of ruleNames) await fs.writeFile(path.join(root, `.agents/rules/${name}.md`), `# ${name}\n`);
      const ctx = { root, templatesDir: '', io: {} } as Context;
      const result = await wireRuntimes({ runtimes: [row.id] } as Options, ctx);
      const expected = [
        ...(row.skills.kind === 'symlink' ? [row.skills.path] : []),
        ...(row.entryFile === undefined ? [] : [row.entryFile.path]),
        ...(row.hookConfig === undefined ? [] : [row.hookConfig.path]),
      ];
      if (rulesMode([row.id]) === 'native') {
        if (row.rules.kind === 'link') expected.push(row.rules.path);
        if (row.rules.kind === 'per-rule') {
          expected.push(...ruleNames.map((name) => row.rules.pattern.replace('{rule}', name)));
        }
        if (row.rules.kind === 'file') expected.push(row.rules.path);
      }
      assert.deepEqual([...result.created].sort(), [...new Set(expected)].sort(), row.id);
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  }

  const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src');
  const registryPath = path.join(sourceRoot, 'setup/runtimes.ts');
  const literals = registryLiterals();
  const violations: string[] = [];
  for (const file of await sourceFiles(sourceRoot)) {
    if (file === registryPath) continue;
    const rel = path.relative(sourceRoot, file);
    const lines = (await fs.readFile(file, 'utf8')).split(/\r?\n/);
    lines.forEach((line, index) => {
      const found = [...literals].filter((literal) => line.includes(literal));
      for (const runtime of CONTRACT_IDS) {
        if (new RegExp(`\\bcase\\s+['"]${runtime}['"]`).test(line)) found.push(`case ${runtime}`);
      }
      if (found.length > 0) violations.push(`${rel}:${index + 1}: ${[...new Set(found)].join(', ')}`);
    });
  }
  assert.equal(violations.length, 0, `runtime knowledge outside the registry: ${violations.join('; ')}`);
});

test('runtime-registry: skills descriptors match the contract', () => {
  for (const row of RUNTIME_REGISTRY) {
    const symlinkPath = SYMLINKED_SKILLS[row.id];
    if (symlinkPath === undefined) {
      assert.deepEqual(row.skills, { kind: 'direct', path: '.agents/skills' }, `${row.id} reads .agents/skills`);
    } else {
      assert.equal(row.skills.kind, 'symlink', `${row.id} skills is a symlink`);
      assert.equal(row.skills.path, symlinkPath, `${row.id} symlink path`);
      if (row.skills.kind === 'symlink') {
        assert.equal(row.skills.target, '../.agents/skills', `${row.id} symlink target`);
      }
    }
  }
});

test('runtime-registry: folder markers match the contract', () => {
  for (const row of RUNTIME_REGISTRY) {
    assert.deepEqual([...row.folderMarkers], EXPECTED_FOLDER_MARKERS[row.id], `${row.id} folder markers`);
  }
});

test('runtime-registry: machine markers honour the overridden environment', () => {
  for (const row of RUNTIME_REGISTRY) {
    assert.deepEqual(row.machineMarkers(FAKE_ENV), EXPECTED_MACHINE_MARKERS[row.id], `${row.id} machine markers`);
  }
});

test('runtime-registry: XDG_CONFIG_HOME and CODEX_HOME default under HOME', () => {
  const env: RuntimeEnv = { HOME: '/fake/home' };

  for (const row of RUNTIME_REGISTRY) {
    assert.deepEqual(row.machineMarkers(env), EXPECTED_DEFAULT_MARKERS[row.id], `${row.id} default markers`);
  }
});

test('runtime-registry: no real home is used when the environment is empty', () => {
  for (const row of RUNTIME_REGISTRY) {
    assert.deepEqual(row.machineMarkers({}), [], `${row.id} has no marker without its variables`);
  }
});

test('runtime-registry: runtimeRow finds every row', () => {
  for (const id of CONTRACT_IDS) {
    assert.equal(runtimeRow(id).id, id);
  }
});

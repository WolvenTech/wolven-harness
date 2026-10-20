import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';
import type { RuntimeEnv } from '../src/setup/runtimes.js';
import { RUNTIME_REGISTRY, runtimeRow } from '../src/setup/runtimes.js';
import type { Runtime } from '../src/setup/types.js';

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
  antigravity: ['.agents/rules'],
};

const SYMLINKED_SKILLS: Partial<Record<Runtime, string>> = {
  claude: '.claude/skills',
  kiro: '.kiro/skills',
};

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

    assert.ok(row.rules === 'native' || row.rules === 'inline', `${row.id} has a native or inline rules strategy`);
  }
});

test('runtime-registry: only codex is inline', () => {
  assert.deepEqual(
    RUNTIME_REGISTRY.filter((row) => row.rules === 'inline').map((row) => row.id),
    ['codex'],
  );
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

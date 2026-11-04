import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { pathExists } from '../src/path-exists.js';
import { removeHarnessInstall, removeLandscapes } from '../src/uninstall/remove.js';
import type { DiscoveredInstall } from '../src/uninstall/types.js';
import { run } from './helpers/fixture.js';

/**
 * Creates a temporary fixture directory populated with the given relative file mapping.
 */
async function makeFixtureDir(files: Record<string, string>, baseDir?: string): Promise<string> {
  const dir = baseDir ?? (await mkdtemp(path.join(tmpdir(), 'uninstall-remove-test-')));
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(dir, rel);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, content, 'utf8');
  }
  return dir;
}

/**
 * Computes sha256 hash of a file buffer or string.
 */
function sha256(content: Buffer | string): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Recursively maps relative file paths to their sha256 hashes within a directory.
 */
async function collectFileHashes(dir: string): Promise<Map<string, string>> {
  const hashes = new Map<string, string>();
  async function walk(current: string, prefix: string): Promise<void> {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const rel = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full, rel);
      } else if (entry.isFile()) {
        const content = await readFile(full);
        hashes.set(rel, sha256(content));
      }
    }
  }
  if (await pathExists(dir)) {
    await walk(dir, '');
  }
  return hashes;
}

test('proof-uninstall-cli-args: parses valid options and rejects unknown flags or missing arguments with exit 1', async () => {
  const cleanDir = await makeFixtureDir({
    'src/index.js': 'console.log("clean");\n',
  });

  try {
    // why: test --help and -h options output usage and exit 0.
    const helpRes = await run(['uninstall', '--help'], { cwd: cleanDir });
    assert.equal(helpRes.code, 0);
    assert.match(helpRes.stdout, /Usage: wolven-harness uninstall \[options\]/);

    const shortHelpRes = await run(['uninstall', '-h'], { cwd: cleanDir });
    assert.equal(shortHelpRes.code, 0);
    assert.match(shortHelpRes.stdout, /Usage: wolven-harness uninstall \[options\]/);

    // why: test missing --dir argument value rejects with exit 1.
    const missingDirRes = await run(['uninstall', '--dir'], { cwd: cleanDir });
    assert.equal(missingDirRes.code, 1);
    assert.match(missingDirRes.stderr, /missing value for --dir/);
    assert.match(missingDirRes.stdout, /Usage: wolven-harness uninstall \[options\]/);

    // why: test empty --dir= argument value rejects with exit 1.
    const emptyDirRes = await run(['uninstall', '--dir='], { cwd: cleanDir });
    assert.equal(emptyDirRes.code, 1);
    assert.match(emptyDirRes.stderr, /missing value for --dir/);

    // why: test unknown flag rejects with exit 1.
    const unknownRes = await run(['uninstall', '--unsupported-flag'], { cwd: cleanDir });
    assert.equal(unknownRes.code, 1);
    assert.match(unknownRes.stderr, /unknown option "--unsupported-flag"/);
    assert.match(unknownRes.stdout, /Usage: wolven-harness uninstall \[options\]/);

    // why: test short unknown flag rejects with exit 1.
    const shortUnknownRes = await run(['uninstall', '-x'], { cwd: cleanDir });
    assert.equal(shortUnknownRes.code, 1);
    assert.match(shortUnknownRes.stderr, /unknown option "-x"/);

    // why: test valid --dir pointing to another directory parses successfully.
    const otherDir = await makeFixtureDir({
      'README.md': '# Other\n',
    });
    try {
      const validDirRes = await run(['uninstall', '--dir', otherDir], { cwd: cleanDir });
      assert.equal(validDirRes.code, 0);
      assert.match(validDirRes.stdout, /no harness installs found/);

      const validDirEqualsRes = await run(['uninstall', `--dir=${otherDir}`], { cwd: cleanDir });
      assert.equal(validDirEqualsRes.code, 0);
      assert.match(validDirEqualsRes.stdout, /no harness installs found/);
    } finally {
      await rm(otherDir, { recursive: true, force: true });
    }
  } finally {
    await rm(cleanDir, { recursive: true, force: true });
  }
});

test('proof-uninstall-cli-noop-exit0: clean target reports no install found, prompts nothing, modifies 0 files, exits 0', async () => {
  const root = await makeFixtureDir({
    'src/index.js': 'export const ok = true;\n',
    'package.json': '{"name": "unrelated-app", "version": "1.0.0"}\n',
    'README.md': '# Unrelated App\nNo harness content here.\n',
  });

  try {
    const beforeHashes = await collectFileHashes(root);
    let promptInvoked = false;
    const promptMock = {
      confirm: async () => {
        promptInvoked = true;
        return true;
      },
    };

    const result = await run(['uninstall'], { cwd: root, prompts: promptMock });

    assert.equal(result.code, 0);
    assert.match(result.stdout, /wolven-harness uninstall: no harness installs found in/);
    assert.equal(promptInvoked, false);

    // invariant: clean directory must not have any files modified or deleted.
    const afterHashes = await collectFileHashes(root);
    assert.deepEqual(afterHashes, beforeHashes);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('proof-uninstall-cli-dry-list: shows discovered artifacts and preserved paths before deletion', async () => {
  const root = await makeFixtureDir({
    '.wolven-harness.json': JSON.stringify({
      version: 1,
      gitHost: 'gh',
      runtimes: ['claude'],
      layout: 'linked',
      harnessHome: '.wolven-harness',
    }),
    '.wolven-harness/.agents/skills/adr/SKILL.md': '# adr\n',
    '.wolven-harness/.qmd/index.yml': 'title: QMD\n',
    '.wolven-harness/.gitignore': 'skills/\n',
    '.wolven-harness/AGENTS.md': '# Quiet AGENTS\n',
    '.wolven-harness/docs/adrs/adr-001.md': '# ADR 001\n',
    'package.json': '{"name": "demo-app"}\n',
    'AGENTS.md': '# Root AGENTS\n',
    '.gitignore': 'node_modules\n',
  });

  try {
    // why: test dry manifest listing output when user declines confirmation.
    const result = await run(['uninstall'], {
      cwd: root,
      prompts: {
        confirm: async () => false,
      },
    });

    assert.equal(result.code, 0);
    assert.match(result.stdout, /Discovered harness installations:/);
    assert.match(result.stdout, /\(quiet layout\)/);
    assert.match(result.stdout, /Artifacts slated for deletion:/);
    assert.match(result.stdout, /- .*?\.wolven-harness\.json/);
    assert.match(result.stdout, /- .*?\.wolven-harness\/\.agents/);
    assert.match(result.stdout, /- .*?\.wolven-harness\/\.qmd/);
    assert.match(result.stdout, /- .*?\.wolven-harness\/AGENTS\.md/);
    assert.match(result.stdout, /Preserved documentation \(will not be touched\):/);
    assert.match(result.stdout, /✔ .*?\.wolven-harness\/docs/);
    assert.match(result.stdout, /Remaining intertwined shared files \(untouched\):/);
    assert.match(result.stdout, /• .*?package\.json/);
    assert.match(result.stdout, /• .*?AGENTS\.md/);
    assert.match(result.stdout, /cancelled — no changes made/);

    // invariant: no artifacts were removed during dry list display and decline.
    assert.equal(await pathExists(path.join(root, '.wolven-harness.json')), true);
    assert.equal(await pathExists(path.join(root, '.wolven-harness', '.agents')), true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('proof-uninstall-cli-cancel-abort: declining or cancelling prompt aborts without touching disk (exit 0)', async () => {
  const root = await makeFixtureDir({
    '.wolven-harness.json': JSON.stringify({
      version: 1,
      gitHost: 'gh',
      runtimes: ['claude'],
      layout: 'linked',
      harnessHome: '.wolven-harness',
    }),
    '.wolven-harness/.agents/skills/adr/SKILL.md': '# adr\n',
    '.wolven-harness/docs/adrs/adr-001.md': '# ADR 001\n',
    'package.json': '{"name": "demo-app"}\n',
  });

  try {
    const beforeHashes = await collectFileHashes(root);

    // why: test declining confirmation via confirm returning false.
    const resDecline = await run(['uninstall'], {
      cwd: root,
      prompts: { confirm: async () => false },
    });
    assert.equal(resDecline.code, 0);
    assert.match(resDecline.stdout, /cancelled — no changes made/);
    assert.deepEqual(await collectFileHashes(root), beforeHashes);

    // why: test cancelling confirmation via confirm returning undefined.
    const resCancel = await run(['uninstall'], {
      cwd: root,
      prompts: { confirm: async () => undefined },
    });
    assert.equal(resCancel.code, 0);
    assert.match(resCancel.stdout, /cancelled — no changes made/);
    assert.deepEqual(await collectFileHashes(root), beforeHashes);

    // why: test selecting 'no' via select prompter.
    const resSelectNo = await run(['uninstall'], {
      cwd: root,
      prompts: { select: async () => 'no' as const },
    });
    assert.equal(resSelectNo.code, 0);
    assert.match(resSelectNo.stdout, /cancelled — no changes made/);
    assert.deepEqual(await collectFileHashes(root), beforeHashes);

    // why: test non-interactive run without --yes aborts cleanly.
    const resNonInteractive = await run(['uninstall'], {
      cwd: root,
      isTTY: false,
    });
    assert.equal(resNonInteractive.code, 0);
    assert.match(resNonInteractive.stdout, /cancelled — no changes made/);
    assert.deepEqual(await collectFileHashes(root), beforeHashes);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('proof-uninstall-remove-new-landscape: confirmed removal removes quiet install scaffolding, config, and symlinks', async () => {
  const root = await makeFixtureDir({
    '.wolven-harness.json': JSON.stringify({
      version: 1,
      gitHost: 'gh',
      runtimes: ['claude'],
      layout: 'linked',
      harnessHome: '.wolven-harness',
    }),
    '.wolven-harness/.agents/skills/adr/SKILL.md': '# adr\n',
    '.wolven-harness/.agents/skills/harness-init/SKILL.md': '# harness-init\n',
    '.wolven-harness/.qmd/index.yml': 'title: QMD\n',
    '.wolven-harness/.gitignore': 'skills/\n',
    '.wolven-harness/AGENTS.md': '# Quiet AGENTS\n',
    '.cursor/rules/wolven-agents.mdc': '# Cursor rule\n',
    'package.json': '{"name": "new-landscape-app"}\n',
    'AGENTS.md': '# Main AGENTS\n',
    '.gitignore': 'node_modules\n',
    '.github/workflows/ci.yml': 'name: CI\n',
  });

  try {
    await mkdir(path.join(root, '.claude/skills'), { recursive: true });
    await symlink('../../.wolven-harness/.agents/skills/harness-init', path.join(root, '.claude/skills/harness-init'));

    const result = await run(['uninstall', '--yes', '--verbose'], { cwd: root });

    assert.equal(result.code, 0);
    assert.match(result.stdout, /Uninstall complete: removed/);
    assert.match(result.stdout, /Removed: .*?\.wolven-harness\.json/);

    // invariant: all quiet harness scaffolding and symlinks must be deleted.
    assert.equal(await pathExists(path.join(root, '.wolven-harness.json')), false);
    assert.equal(await pathExists(path.join(root, '.wolven-harness', '.agents')), false);
    assert.equal(await pathExists(path.join(root, '.wolven-harness', '.qmd')), false);
    assert.equal(await pathExists(path.join(root, '.wolven-harness', 'AGENTS.md')), false);
    assert.equal(await pathExists(path.join(root, '.wolven-harness', '.gitignore')), false);
    assert.equal(await pathExists(path.join(root, '.claude', 'skills', 'harness-init')), false);
    assert.equal(await pathExists(path.join(root, '.cursor', 'rules', 'wolven-agents.mdc')), false);

    // why: empty parent directories created for harness artifacts should be pruned.
    assert.equal(await pathExists(path.join(root, '.wolven-harness')), false);
    assert.equal(await pathExists(path.join(root, '.claude')), false);
    assert.equal(await pathExists(path.join(root, '.cursor')), false);

    // invariant: shared user files must remain intact.
    assert.equal(await pathExists(path.join(root, 'package.json')), true);
    assert.equal(await pathExists(path.join(root, 'AGENTS.md')), true);
    assert.equal(await pathExists(path.join(root, '.gitignore')), true);
    assert.equal(await pathExists(path.join(root, '.github/workflows/ci.yml')), true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('proof-uninstall-preserve-quiet-docs: preserves .wolven-harness/docs/ byte-identical', async () => {
  const root = await makeFixtureDir({
    '.wolven-harness.json': JSON.stringify({
      version: 1,
      gitHost: 'gh',
      runtimes: ['claude'],
      layout: 'linked',
      harnessHome: '.wolven-harness',
    }),
    '.wolven-harness/.agents/skills/adr/SKILL.md': '# adr\n',
    '.wolven-harness/.qmd/index.yml': 'title: QMD\n',
    '.wolven-harness/.gitignore': 'skills/\n',
    '.wolven-harness/AGENTS.md': '# Quiet AGENTS\n',
    '.wolven-harness/docs/adrs/adr-001-setup.md': '# ADR 001\nImportant decision text.\n',
    '.wolven-harness/docs/prds/core/core-prd.md': '# Core PRD\nUser requirements.\n',
    '.wolven-harness/docs/specs/core/core-spec.md': '# Core Spec\nEngineering design.\n',
    '.wolven-harness/docs/notes/idea/idea-note.md': '# Idea Note\nResearch thoughts.\n',
    '.wolven-harness/docs/deferrals/backlog/backlog-deferral.md': '# Deferral\nDeferred scope.\n',
    '.wolven-harness/docs/WRITING-PROFILE.md': '# Writing Profile\nStandard rules.\n',
    'package.json': '{"name": "quiet-docs-app"}\n',
  });

  try {
    const docsDir = path.join(root, '.wolven-harness', 'docs');
    const beforeHashes = await collectFileHashes(docsDir);
    assert.ok(beforeHashes.size >= 6);

    const result = await run(['uninstall', '-y'], { cwd: root });

    assert.equal(result.code, 0);
    assert.match(result.stdout, /Preserved documentation:/);
    assert.match(result.stdout, /✔ .*?\.wolven-harness\/docs/);

    // invariant: quiet scaffolding is removed but .wolven-harness/docs must be preserved byte-identical.
    assert.equal(await pathExists(path.join(root, '.wolven-harness.json')), false);
    assert.equal(await pathExists(path.join(root, '.wolven-harness', '.agents')), false);
    assert.equal(await pathExists(path.join(root, '.wolven-harness', '.qmd')), false);
    assert.equal(await pathExists(path.join(root, '.wolven-harness', 'AGENTS.md')), false);
    assert.equal(await pathExists(path.join(root, '.wolven-harness', '.gitignore')), false);

    assert.equal(await pathExists(docsDir), true);
    const afterHashes = await collectFileHashes(docsDir);
    assert.deepEqual(afterHashes, beforeHashes);

    for (const [relFile, hash] of beforeHashes) {
      const fullPath = path.join(docsDir, relFile);
      const currentContent = await readFile(fullPath);
      assert.equal(sha256(currentContent), hash);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('proof-uninstall-remove-old-landscape: confirmed removal removes full install artifacts, rules, hooks, and shipped skills', async () => {
  const root = await makeFixtureDir({
    '.wolven-harness.json': JSON.stringify({
      version: 1,
      gitHost: 'gh',
      runtimes: ['claude'],
      layout: 'home',
    }),
    'WOLVEN.md': '# Central Wolven Index\n',
    '.qmd/index.yml': 'title: QMD\n',
    '.agents/rules/adr.md': '# ADR Rule\n',
    '.agents/hooks/pre-commit': '#!/bin/sh\nexit 0\n',
    '.agents/skills/adr/SKILL.md': '# adr skill\n',
    '.agents/skills/code-review/SKILL.md': '# code-review skill\n',
    '.agents/skills/custom-team-tool/SKILL.md': '# Custom team proprietary tool\n',
    '.harness-score.json': '{"score": 4}\n',
    'CLAUDE.md': '@AGENTS.md\n',
    '.cursor/rules/wolven-agents.mdc': '# Cursor rule\n',
    'package.json': '{"name": "old-landscape-app"}\n',
    'AGENTS.md': '# Full App Instructions\n',
    '.gitignore': 'node_modules\n.agents/skills/\n',
    '.github/workflows/harness.yml': 'name: CI\n',
  });

  try {
    await mkdir(path.join(root, '.claude'), { recursive: true });
    await symlink('../.agents/skills', path.join(root, '.claude/skills'));

    const result = await run(['uninstall', '--yes'], { cwd: root });

    assert.equal(result.code, 0);

    // invariant: all deterministic full install harness artifacts are removed.
    assert.equal(await pathExists(path.join(root, '.wolven-harness.json')), false);
    assert.equal(await pathExists(path.join(root, 'WOLVEN.md')), false);
    assert.equal(await pathExists(path.join(root, '.qmd')), false);
    assert.equal(await pathExists(path.join(root, '.agents', 'rules')), false);
    assert.equal(await pathExists(path.join(root, '.agents', 'hooks')), false);
    assert.equal(await pathExists(path.join(root, '.agents', 'skills', 'adr')), false);
    assert.equal(await pathExists(path.join(root, '.agents', 'skills', 'code-review')), false);
    assert.equal(await pathExists(path.join(root, '.harness-score.json')), false);
    assert.equal(await pathExists(path.join(root, 'CLAUDE.md')), false);
    assert.equal(await pathExists(path.join(root, '.claude', 'skills')), false);
    assert.equal(await pathExists(path.join(root, '.cursor', 'rules', 'wolven-agents.mdc')), false);

    // invariant: custom user skills must be retained and never deleted.
    const customSkillPath = path.join(root, '.agents', 'skills', 'custom-team-tool', 'SKILL.md');
    assert.equal(await pathExists(customSkillPath), true);
    assert.equal(await readFile(customSkillPath, 'utf8'), '# Custom team proprietary tool\n');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('proof-uninstall-preserve-root-docs: preserves root docs/ byte-identical', async () => {
  const root = await makeFixtureDir({
    '.wolven-harness.json': JSON.stringify({
      version: 1,
      gitHost: 'gh',
      runtimes: ['claude'],
      layout: 'home',
    }),
    'WOLVEN.md': '# Wolven Index\n',
    '.agents/skills/adr/SKILL.md': '# adr\n',
    'docs/adrs/adr-000-init.md': '# ADR 000\nFoundation architecture choice.\n',
    'docs/prds/alpha/alpha-prd.md': '# Alpha PRD\nProduct definition.\n',
    'docs/specs/alpha/alpha-spec.md': '# Alpha Spec\nSystem specification.\n',
    'docs/notes/bench/bench-note.md': '# Bench Note\nMeasurement results.\n',
    'docs/deferrals/perf/perf-deferral.md': '# Deferral\nFuture scaling note.\n',
    'docs/maps/plan/plan-map.json': '{"title": "Map"}\n',
    'docs/WRITING-PROFILE.md': '# Writing Profile\nDocumentation standard.\n',
    'package.json': '{"name": "root-docs-app"}\n',
    'AGENTS.md': '# Root AGENTS\n',
  });

  try {
    const docsDir = path.join(root, 'docs');
    const beforeHashes = await collectFileHashes(docsDir);
    assert.ok(beforeHashes.size >= 7);

    const result = await run(['uninstall', '--yes'], { cwd: root });

    assert.equal(result.code, 0);
    assert.match(result.stdout, /Preserved documentation:/);
    assert.match(result.stdout, /✔ .*?docs/);

    // invariant: harness files are removed but root docs must remain completely intact.
    assert.equal(await pathExists(path.join(root, '.wolven-harness.json')), false);
    assert.equal(await pathExists(path.join(root, 'WOLVEN.md')), false);
    assert.equal(await pathExists(path.join(root, '.agents')), false);

    assert.equal(await pathExists(docsDir), true);
    const afterHashes = await collectFileHashes(docsDir);
    assert.deepEqual(afterHashes, beforeHashes);

    for (const [relFile, hash] of beforeHashes) {
      const fullPath = path.join(docsDir, relFile);
      const currentContent = await readFile(fullPath);
      assert.equal(sha256(currentContent), hash);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('proof-uninstall-remove-global-skills: confirmed removal removes standalone skills from global skill paths', async () => {
  const root = await makeFixtureDir({
    'package.json': '{"name": "app-without-local-harness"}\n',
  });
  const fakeHome = await makeFixtureDir({
    '.claude/skills/adr/SKILL.md': '# global adr\n',
    '.claude/skills/grilling/SKILL.md': '# global grilling\n',
    '.claude/skills/personal-custom-skill/SKILL.md': '# user private skill\n',
    '.agents/skills/code-review/SKILL.md': '# global code-review\n',
    '.agents/skills/another-user-skill/SKILL.md': '# another private skill\n',
  });

  try {
    const result = await run(['uninstall', '--yes'], {
      cwd: root,
      env: { HOME: fakeHome },
    });

    assert.equal(result.code, 0);

    // invariant: shipped harness skills in global load paths are deleted.
    assert.equal(await pathExists(path.join(fakeHome, '.claude/skills/adr')), false);
    assert.equal(await pathExists(path.join(fakeHome, '.claude/skills/grilling')), false);
    assert.equal(await pathExists(path.join(fakeHome, '.agents/skills/code-review')), false);

    // invariant: user custom non-harness skills in global load paths are preserved untouched.
    assert.equal(await pathExists(path.join(fakeHome, '.claude/skills/personal-custom-skill/SKILL.md')), true);
    assert.equal(await pathExists(path.join(fakeHome, '.agents/skills/another-user-skill/SKILL.md')), true);
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(fakeHome, { recursive: true, force: true });
  }
});

test('proof-uninstall-leave-intertwined-files: intertwined shared files remain completely intact on disk', async () => {
  const root = await makeFixtureDir({
    '.wolven-harness.json': JSON.stringify({
      version: 1,
      gitHost: 'gh',
      runtimes: ['claude'],
      layout: 'linked',
      harnessHome: '.wolven-harness',
    }),
    '.wolven-harness/.agents/skills/adr/SKILL.md': '# adr\n',
    'package.json': `${JSON.stringify(
      {
        name: 'intertwined-app',
        scripts: {
          test: 'node --test',
          'harness:validate': 'wolven-harness validate',
        },
      },
      null,
      2,
    )}\n`,
    'AGENTS.md': '# Project Instructions\n\n## Wolven Harness\nHarness configuration section.\n',
    '.gitignore': 'node_modules/\n.wolven-harness/\n.DS_Store\n',
    '.github/workflows/ci.yml': 'name: CI\njobs:\n  validate:\n    steps:\n      - run: wolven-harness validate\n',
  });

  try {
    const sharedFiles = ['package.json', 'AGENTS.md', '.gitignore', '.github/workflows/ci.yml'];
    const beforeContents = new Map<string, string>();
    for (const rel of sharedFiles) {
      beforeContents.set(rel, await readFile(path.join(root, rel), 'utf8'));
    }

    const result = await run(['uninstall', '--yes'], { cwd: root });

    assert.equal(result.code, 0);
    assert.match(result.stdout, /Remaining intertwined shared files \(left untouched\):/);

    // invariant: intertwined shared files must remain byte-identical after deterministic uninstall.
    for (const rel of sharedFiles) {
      const fullPath = path.join(root, rel);
      assert.equal(await pathExists(fullPath), true);
      const currentContent = await readFile(fullPath, 'utf8');
      assert.equal(currentContent, beforeContents.get(rel));
      assert.match(result.stdout, new RegExp(`• .*?${path.basename(rel)}`));
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('removeHarnessInstall: protects docs and shared files even if passed in artifacts array', async () => {
  const root = await makeFixtureDir({
    'docs/adrs/adr-001.md': '# ADR 001\n',
    'package.json': '{"name": "test-pkg"}\n',
    'AGENTS.md': '# Agents\n',
    '.gitignore': 'node_modules\n',
    'stray-artifact.txt': 'harness temp file\n',
  });

  try {
    const install: DiscoveredInstall = {
      kind: 'full',
      root,
      harnessHome: root,
      artifacts: [
        path.join(root, 'docs/adrs/adr-001.md'),
        path.join(root, 'docs'),
        path.join(root, 'package.json'),
        path.join(root, 'AGENTS.md'),
        path.join(root, '.gitignore'),
        path.join(root, 'stray-artifact.txt'),
      ],
      preservedDocs: [path.join(root, 'docs')],
      intertwinedFiles: [path.join(root, 'package.json'), path.join(root, 'AGENTS.md'), path.join(root, '.gitignore')],
    };

    const res = await removeHarnessInstall(install);

    assert.equal(res.failed.length, 0);
    assert.deepEqual(res.removed, [path.join(root, 'stray-artifact.txt')]);

    // invariant: protected paths must not be deleted despite presence in artifacts.
    assert.equal(await pathExists(path.join(root, 'docs/adrs/adr-001.md')), true);
    assert.equal(await pathExists(path.join(root, 'package.json')), true);
    assert.equal(await pathExists(path.join(root, 'AGENTS.md')), true);
    assert.equal(await pathExists(path.join(root, '.gitignore')), true);
    assert.equal(await pathExists(path.join(root, 'stray-artifact.txt')), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('removeLandscapes: executes removal across multiple discovered installs and reports failed entries', async () => {
  const rootA = await makeFixtureDir({
    'artifactA.txt': 'harness file A\n',
  });
  const rootB = await makeFixtureDir({
    'artifactB.txt': 'harness file B\n',
  });

  try {
    const installs: DiscoveredInstall[] = [
      {
        kind: 'standalone',
        root: rootA,
        harnessHome: rootA,
        artifacts: [path.join(rootA, 'artifactA.txt')],
        preservedDocs: [],
        intertwinedFiles: [],
      },
      {
        kind: 'standalone',
        root: rootB,
        harnessHome: rootB,
        artifacts: [path.join(rootB, 'artifactB.txt'), path.join(rootB, 'non-existent.txt')],
        preservedDocs: [],
        intertwinedFiles: [],
      },
    ];

    const results = await removeLandscapes(installs);

    assert.equal(results.length, 2);
    assert.equal(await pathExists(path.join(rootA, 'artifactA.txt')), false);
    assert.equal(await pathExists(path.join(rootB, 'artifactB.txt')), false);

    // why: verify non-existent artifact reports failure entry without throwing unhandled error.
    const resultB = results.find((r) => r.root === rootB);
    assert.ok(resultB);
    assert.equal(resultB.failed.length, 1);
    assert.match(resultB.failed[0]?.path ?? '', /non-existent\.txt/);
  } finally {
    await rm(rootA, { recursive: true, force: true });
    await rm(rootB, { recursive: true, force: true });
  }
});

test('cli debug and verbose options output detailed traces to streams', async () => {
  const root = await makeFixtureDir({
    '.wolven-harness.json': JSON.stringify({
      version: 1,
      layout: 'home',
      gitHost: 'gh',
      runtimes: ['claude'],
    }),
    'WOLVEN.md': '# Index\n',
  });

  try {
    // why: test --debug outputs scanning and removal step tracing to stderr.
    const resDebug = await run(['uninstall', '--yes', '--debug'], { cwd: root });
    assert.equal(resDebug.code, 0);
    assert.match(resDebug.stderr, /\[wolven-harness:uninstall\] scanning landscape in/);
    assert.match(resDebug.stderr, /\[wolven-harness:uninstall\] removing artifacts across/);

    // why: test WOLVEN_HARNESS_DEBUG=1 environment variable activates debug mode.
    const rootEnv = await makeFixtureDir({
      '.wolven-harness.json': JSON.stringify({
        version: 1,
        layout: 'home',
        gitHost: 'gh',
        runtimes: ['claude'],
      }),
      'WOLVEN.md': '# Index\n',
    });
    try {
      const resEnv = await run(['uninstall', '--yes'], {
        cwd: rootEnv,
        env: { WOLVEN_HARNESS_DEBUG: '1' },
      });
      assert.equal(resEnv.code, 0);
      assert.match(resEnv.stderr, /\[wolven-harness:uninstall\] scanning landscape in/);
    } finally {
      await rm(rootEnv, { recursive: true, force: true });
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { discoverLandscape, isKnownHarnessSkill } from '../src/uninstall/discover.js';

/**
 * Creates a temporary fixture directory populated with the given relative file mapping.
 */
async function makeFixtureDir(files: Record<string, string>, baseDir?: string): Promise<string> {
  const dir = baseDir ?? (await mkdtemp(path.join(tmpdir(), 'uninstall-test-')));
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(dir, rel);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, content, 'utf8');
  }
  return dir;
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Reads a shipped template SKILL.md so a fixture skill matches this package's copy. */
async function shippedSkill(name: string): Promise<string> {
  return readFile(path.join(repoRoot, 'templates', '.agents', 'skills', name, 'SKILL.md'), 'utf8');
}

test('proof-uninstall-discover-new-landscape: quiet install with .wolven-harness, linked layout, bootstrap symlinks, preserved docs, and intertwined files', async () => {
  const root = await makeFixtureDir({
    '.wolven-harness.json': JSON.stringify(
      {
        version: 1,
        gitHost: 'gh',
        runtimes: ['claude'],
        layout: 'linked',
        harnessHome: '.wolven-harness',
      },
      null,
      2,
    ),
    '.wolven-harness/.agents/skills/adr/SKILL.md': '# adr skill\n',
    '.wolven-harness/.agents/skills/harness-init/SKILL.md': '# harness-init skill\n',
    '.wolven-harness/.qmd/index.yml': 'title: QMD\n',
    '.wolven-harness/.gitignore': 'skills/\n',
    '.wolven-harness/AGENTS.md': '# Harness instructions\n',
    '.wolven-harness/docs/adrs/adr-001-setup.md': '# ADR 001\n',
    '.wolven-harness/docs/WRITING-PROFILE.md': '# Writing profile\n',
    'package.json': '{"name": "quiet-app", "version": "1.0.0"}\n',
    'AGENTS.md': '# App instructions\nAuthor instructions.\n',
    '.gitignore': 'node_modules\n.DS_Store\n',
    '.github/workflows/ci.yml': 'name: CI\njobs:\n  check:\n    steps:\n      - run: wolven-harness validate\n',
    '.cursor/rules/wolven-agents.mdc': '# Cursor rule\n',
  });

  try {
    await mkdir(path.join(root, '.claude/skills'), { recursive: true });
    await symlink('../../.wolven-harness/.agents/skills/harness-init', path.join(root, '.claude/skills/harness-init'));

    const installs = await discoverLandscape(root);

    assert.equal(installs.length, 1);
    const [install] = installs;

    assert.equal(install.kind, 'quiet');
    assert.equal(install.root, root);
    assert.equal(install.harnessHome, path.join(root, '.wolven-harness'));
    assert.equal(install.configPath, path.join(root, '.wolven-harness.json'));
    assert.equal(install.config?.layout, 'linked');

    assert.ok(install.artifacts.includes(path.join(root, '.wolven-harness.json')));
    assert.ok(install.artifacts.includes(path.join(root, '.claude/skills/harness-init')));
    assert.ok(install.artifacts.includes(path.join(root, '.cursor/rules/wolven-agents.mdc')));
    assert.ok(install.artifacts.includes(path.join(root, '.wolven-harness/.agents')));
    assert.ok(install.artifacts.includes(path.join(root, '.wolven-harness/.qmd')));
    assert.ok(install.artifacts.includes(path.join(root, '.wolven-harness/.gitignore')));
    assert.ok(install.artifacts.includes(path.join(root, '.wolven-harness/AGENTS.md')));

    // invariant: authored docs must never be marked as artifacts for deletion.
    assert.equal(
      install.artifacts.some((a) => a.includes('.wolven-harness/docs')),
      false,
    );
    assert.deepEqual(install.preservedDocs, [path.join(root, '.wolven-harness/docs')]);

    assert.ok(install.intertwinedFiles.includes(path.join(root, 'package.json')));
    assert.ok(install.intertwinedFiles.includes(path.join(root, 'AGENTS.md')));
    assert.ok(install.intertwinedFiles.includes(path.join(root, '.gitignore')));
    assert.ok(install.intertwinedFiles.includes(path.join(root, '.github/workflows/ci.yml')));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('proof-uninstall-discover-old-landscape: full install with root .agents, .qmd, WOLVEN.md, config, preserved docs, and intertwined files', async () => {
  const root = await makeFixtureDir({
    '.wolven-harness.json': JSON.stringify(
      {
        version: 1,
        gitHost: 'gh',
        runtimes: ['claude'],
        layout: 'home',
      },
      null,
      2,
    ),
    'WOLVEN.md': '# Wolven index\n',
    '.qmd/index.yml': 'title: QMD\n',
    '.agents/rules/adr.md': '# ADR rule\n',
    '.agents/hooks/pre-commit': '#!/bin/sh\nexit 0\n',
    '.agents/skills/adr/SKILL.md': '# adr skill\n',
    '.agents/skills/code-review/SKILL.md': '# code-review skill\n',
    '.agents/skills/custom-team-skill/SKILL.md': '# custom team skill\n',
    '.harness-score.json': '{"score": 4}\n',
    'CLAUDE.md': '@AGENTS.md\n',
    '.cursor/rules/wolven-agents.mdc': '# Cursor rule\n',
    'docs/adrs/adr-000-init.md': '# ADR 000\n',
    'docs/WRITING-PROFILE.md': '# Writing Profile\n',
    'package.json': '{"name": "old-app", "scripts": {"harness:validate": "wolven-harness validate"}}\n',
    'AGENTS.md': '# Full App Instructions\n',
    '.gitignore': 'node_modules\n.agents/skills/\n',
    '.github/workflows/harness.yml': 'name: CI\n- run: wolven-harness validate\n',
  });

  try {
    await mkdir(path.join(root, '.claude'), { recursive: true });
    await symlink('../.agents/skills', path.join(root, '.claude/skills'));

    const installs = await discoverLandscape(root);

    assert.equal(installs.length, 1);
    const [install] = installs;

    assert.equal(install.kind, 'full');
    assert.equal(install.root, root);
    assert.equal(install.harnessHome, root);
    assert.equal(install.configPath, path.join(root, '.wolven-harness.json'));

    assert.ok(install.artifacts.includes(path.join(root, '.wolven-harness.json')));
    assert.ok(install.artifacts.includes(path.join(root, 'WOLVEN.md')));
    assert.ok(install.artifacts.includes(path.join(root, '.qmd')));
    assert.ok(install.artifacts.includes(path.join(root, '.agents/rules')));
    assert.ok(install.artifacts.includes(path.join(root, '.agents/hooks')));
    assert.ok(install.artifacts.includes(path.join(root, '.agents/skills/adr')));
    assert.ok(install.artifacts.includes(path.join(root, '.agents/skills/code-review')));
    assert.ok(install.artifacts.includes(path.join(root, '.harness-score.json')));
    assert.ok(install.artifacts.includes(path.join(root, 'CLAUDE.md')));
    assert.ok(install.artifacts.includes(path.join(root, '.claude/skills')));
    assert.ok(install.artifacts.includes(path.join(root, '.cursor/rules/wolven-agents.mdc')));

    // invariant: custom user skills must never be classified as harness artifacts.
    assert.equal(install.artifacts.includes(path.join(root, '.agents/skills/custom-team-skill')), false);

    // invariant: root docs must be preserved and never slated for deletion.
    assert.equal(
      install.artifacts.some((a) => a.includes(path.join(root, 'docs'))),
      false,
    );
    assert.deepEqual(install.preservedDocs, [path.join(root, 'docs')]);

    assert.ok(install.intertwinedFiles.includes(path.join(root, 'package.json')));
    assert.ok(install.intertwinedFiles.includes(path.join(root, 'AGENTS.md')));
    assert.ok(install.intertwinedFiles.includes(path.join(root, '.gitignore')));
    assert.ok(install.intertwinedFiles.includes(path.join(root, '.github/workflows/harness.yml')));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('proof-uninstall-discover-linked-landscape: linked homes in sibling, parent, or nested child directories', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'uninstall-linked-workspace-'));

  try {
    const consumer = path.join(workspace, 'consumer');
    const harnessHub = path.join(workspace, 'harness-hub');

    await makeFixtureDir(
      {
        'consumer/.wolven-harness.json': JSON.stringify({
          version: 1,
          gitHost: 'gh',
          runtimes: ['claude'],
          layout: 'linked',
          harnessHome: '../harness-hub',
        }),
        'consumer/package.json': '{"name": "consumer"}\n',
        'consumer/AGENTS.md': '# Consumer instructions\n',
        'harness-hub/.wolven-harness.json': JSON.stringify({
          version: 1,
          gitHost: 'gh',
          runtimes: ['claude'],
          layout: 'home',
          codeRepo: '../consumer',
        }),
        'harness-hub/WOLVEN.md': '# Central Hub\n',
        'harness-hub/.agents/skills/adr/SKILL.md': '# adr\n',
        'harness-hub/docs/adrs/adr-001.md': '# Hub ADR\n',
      },
      workspace,
    );

    // why: test linked landscape discovery from consumer referencing sibling harness home.
    const siblingInstalls = await discoverLandscape(consumer);
    assert.equal(siblingInstalls.length, 2);

    const consumerInstall = siblingInstalls.find((i) => i.root === consumer);
    assert.ok(consumerInstall);
    assert.equal(consumerInstall.kind, 'linked');
    assert.equal(consumerInstall.harnessHome, harnessHub);

    const hubInstall = siblingInstalls.find((i) => i.root === harnessHub);
    assert.ok(hubInstall);
    assert.ok(hubInstall.preservedDocs.includes(path.join(harnessHub, 'docs')));

    // why: test nested child repository discovery.
    const monorepo = path.join(workspace, 'monorepo');
    const nestedChild = path.join(monorepo, 'child-pkg');
    await mkdir(path.join(monorepo, '.git'), { recursive: true });
    await writeFile(path.join(monorepo, '.git', 'HEAD'), 'ref: refs/heads/main\n');
    await mkdir(path.join(nestedChild, '.git'), { recursive: true });
    await writeFile(path.join(nestedChild, '.git', 'HEAD'), 'ref: refs/heads/main\n');
    await writeFile(
      path.join(nestedChild, '.wolven-harness.json'),
      JSON.stringify({ version: 1, layout: 'linked', harnessHome: '.wolven-harness' }),
    );
    await mkdir(path.join(nestedChild, '.wolven-harness', 'docs'), { recursive: true });
    await writeFile(path.join(nestedChild, '.wolven-harness', 'docs', 'adr-001.md'), '# Child ADR\n');

    const monorepoInstalls = await discoverLandscape(monorepo);
    const foundNested = monorepoInstalls.find((i) => i.root === nestedChild);
    assert.ok(foundNested);
    assert.ok(foundNested.preservedDocs.includes(path.join(nestedChild, '.wolven-harness', 'docs')));

    // why: test parent repository linking down to child root.
    const parentRepo = path.join(workspace, 'parent-repo');
    const childApp = path.join(parentRepo, 'child-app');
    await mkdir(parentRepo, { recursive: true });
    await writeFile(
      path.join(parentRepo, '.wolven-harness.json'),
      JSON.stringify({ version: 1, layout: 'home', codeRepo: './child-app' }),
    );
    await writeFile(path.join(parentRepo, 'WOLVEN.md'), '# Parent\n');
    await mkdir(childApp, { recursive: true });
    await writeFile(path.join(childApp, 'package.json'), '{"name": "child-app"}\n');

    const parentLinkedInstalls = await discoverLandscape(childApp);
    const foundParent = parentLinkedInstalls.find((i) => i.root === parentRepo);
    assert.ok(foundParent);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test('proof-uninstall-discover-global-skills: standalone skills in global skill load paths using env.HOME', async () => {
  const root = await makeFixtureDir({
    'package.json': '{"name": "clean-app"}\n',
  });
  const fakeHome = await makeFixtureDir({
    '.claude/skills/adr/SKILL.md': await shippedSkill('adr'),
    '.claude/skills/grilling/SKILL.md': await shippedSkill('grilling'),
    '.claude/skills/personal-custom-skill/SKILL.md': '# custom\n',
    '.agents/skills/code-review/SKILL.md': await shippedSkill('code-review'),
    '.agents/skills/another-custom-skill/SKILL.md': '# another custom\n',
  });

  try {
    const installs = await discoverLandscape(root, { HOME: fakeHome });

    assert.equal(installs.length, 1);
    const [globalInstall] = installs;

    assert.equal(globalInstall.kind, 'standalone');
    assert.equal(globalInstall.root, fakeHome);
    assert.equal(globalInstall.harnessHome, fakeHome);
    assert.deepEqual(globalInstall.preservedDocs, []);
    assert.deepEqual(globalInstall.intertwinedFiles, []);

    assert.ok(globalInstall.artifacts.includes(path.join(fakeHome, '.claude/skills/adr')));
    assert.ok(globalInstall.artifacts.includes(path.join(fakeHome, '.claude/skills/grilling')));
    assert.ok(globalInstall.artifacts.includes(path.join(fakeHome, '.agents/skills/code-review')));

    // invariant: non-harness custom skills in global load paths are untouched.
    assert.equal(globalInstall.artifacts.includes(path.join(fakeHome, '.claude/skills/personal-custom-skill')), false);
    assert.equal(globalInstall.artifacts.includes(path.join(fakeHome, '.agents/skills/another-custom-skill')), false);

    // why: test project-level standalone skills when repo has no harness config.
    const standaloneRoot = await makeFixtureDir({
      '.claude/skills/adr/SKILL.md': await shippedSkill('adr'),
    });
    try {
      const localStandalone = await discoverLandscape(standaloneRoot, {});
      assert.equal(localStandalone.length, 1);
      assert.equal(localStandalone[0].kind, 'standalone');
      assert.equal(localStandalone[0].root, standaloneRoot);
      assert.ok(localStandalone[0].artifacts.includes(path.join(standaloneRoot, '.claude/skills/adr')));
    } finally {
      await rm(standaloneRoot, { recursive: true, force: true });
    }
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(fakeHome, { recursive: true, force: true });
  }
});

test('proof-uninstall-discover-empty: clean directory returns empty results array', async () => {
  const root = await makeFixtureDir({
    'src/index.js': 'console.log("clean");\n',
    'README.md': '# Clean App\n',
    'package.json': '{"name": "clean-app"}\n',
  });
  const fakeHome = await makeFixtureDir({
    '.bashrc': 'export PATH=$PATH\n',
    '.claude/skills/unrelated-tool/SKILL.md': '# unrelated\n',
  });

  try {
    const installs = await discoverLandscape(root, { HOME: fakeHome });
    assert.deepEqual(installs, []);

    const emptyDir = await mkdtemp(path.join(tmpdir(), 'uninstall-empty-'));
    try {
      assert.deepEqual(await discoverLandscape(emptyDir), []);
    } finally {
      await rm(emptyDir, { recursive: true, force: true });
    }

    const nonExistent = path.join(tmpdir(), `non-existent-${Date.now()}`);
    assert.deepEqual(await discoverLandscape(nonExistent), []);
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(fakeHome, { recursive: true, force: true });
  }
});

test('proof-uninstall-iter1-third-party-skill: a colliding-name skill is not this package copy', async () => {
  const root = await makeFixtureDir({ 'package.json': '{"name":"app"}\n' });
  const fakeHome = await makeFixtureDir({
    '.claude/skills/qmd/SKILL.md': '---\nname: qmd\ndescription: not wolven\n---\n# not wolven\n',
  });
  try {
    assert.deepEqual(await discoverLandscape(root, { HOME: fakeHome }), []);
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(fakeHome, { recursive: true, force: true });
  }
});

test('proof-uninstall-iter1-idempotent: a .wolven-harness holding only docs is not an install', async () => {
  const root = await makeFixtureDir({
    '.wolven-harness/docs/adrs/adr-001.md': '# ADR 001\n',
    'package.json': '{"name":"post-uninstall-app"}\n',
  });
  try {
    assert.deepEqual(await discoverLandscape(root, {}), []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('isKnownHarnessSkill: identifies shipped harness skills and rejects arbitrary names', () => {
  assert.equal(isKnownHarnessSkill('adr'), true);
  assert.equal(isKnownHarnessSkill('code-review'), true);
  assert.equal(isKnownHarnessSkill('harness-doctor'), true);
  assert.equal(isKnownHarnessSkill('harness-remove'), true);
  assert.equal(isKnownHarnessSkill('custom-tool'), false);
  assert.equal(isKnownHarnessSkill('my-private-skill'), false);
});

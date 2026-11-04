import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { pathExists } from '../src/path-exists.js';
import { runtimeRow } from '../src/setup/runtimes.js';
import type { Runtime } from '../src/setup/types.js';
import { installHarnessRemoveSkill } from '../src/uninstall/skill-handoff.js';
import { run } from './helpers/fixture.js';
import { flatten } from './helpers/prose.js';
import { assertSkillBasics, readSkill } from './helpers/skill-contract.js';

/**
 * Creates a temporary fixture directory populated with the given relative file mapping.
 */
async function makeFixtureDir(files: Record<string, string>): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'harness-remove-skill-test-'));
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

test('proof-harness-remove-template-frontmatter: templates/.agents/skills/harness-remove/SKILL.md has name: harness-remove and non-empty description', async () => {
  await assertSkillBasics('harness-remove');

  const templateSkill = await readSkill('harness-remove');
  assert.equal(templateSkill.frontmatter.name, 'harness-remove');
  assert.equal(typeof templateSkill.frontmatter.description, 'string');
  assert.ok((templateSkill.frontmatter.description as string).length > 0, 'description must be a non-empty string');
  assert.ok(
    !(templateSkill.frontmatter.description as string).includes('|'),
    'description must not contain pipe characters',
  );

  // invariant: repo mirror .agents/skills/harness-remove matches template exactly.
  const repoMirrorContent = await readFile(
    path.resolve(templateSkill.dir, '..', '..', '..', '.agents', 'skills', 'harness-remove', 'SKILL.md'),
    'utf8',
  );
  const templateRaw = await readFile(path.join(templateSkill.dir, 'SKILL.md'), 'utf8');
  assert.equal(repoMirrorContent, templateRaw);
});

test('proof-harness-remove-skill-instructions: instructions detail human-supervised cleanup of package.json, AGENTS.md, .gitignore, and CI workflows, refusal to touch docs/, and self-deletion', async () => {
  const skill = await readSkill('harness-remove');
  const flat = flatten(skill.body);

  // why: human-supervised cleanup requires explicit confirmation before every modification.
  assert.match(flat, /Human approval before every write/i);
  assert.match(flat, /Ask the Human for explicit approval/i);

  // why: verified cleanup scope covers package.json, AGENTS.md, .gitignore, and CI workflows.
  assert.match(flat, /package\.json/);
  assert.match(flat, /AGENTS\.md/);
  assert.match(flat, /\.gitignore/);
  assert.match(flat, /CI workflows|\.github\/workflows/i);

  // why: strict preservation of docs/ is a hard gate.
  assert.match(flat, /Strictly preserve `docs\/`/i);
  assert.match(flat, /Verify `docs\/` integrity/i);
  assert.match(flat, /docs\/adrs/);
  assert.match(flat, /docs\/prds/);
  assert.match(flat, /docs\/specs/);
  assert.match(flat, /docs\/notes/);
  assert.match(flat, /docs\/deferrals/);
  assert.match(flat, /WRITING-PROFILE\.md/);

  // why: self-deletion of harness-remove directory is the final closing action.
  assert.match(flat, /Self-delete as final step/i);
  assert.match(flat, /delete the `harness-remove` skill directory/i);
});

test('proof-uninstall-handoff-install-skill: installHarnessRemoveSkill installs harness-remove/SKILL.md into the target runtime skill directory', async () => {
  const root = await makeFixtureDir({
    'src/index.js': 'console.log("hello");\n',
  });

  try {
    const templateContent = await readFile(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        '..',
        'templates',
        '.agents',
        'skills',
        'harness-remove',
        'SKILL.md',
      ),
      'utf8',
    );

    // why: test installation across representative direct and separate skill paths.
    const testRuntimes: Runtime[] = ['claude', 'antigravity', 'kiro'];
    for (const runtime of testRuntimes) {
      const row = runtimeRow(runtime);
      const installedDir = await installHarnessRemoveSkill(root, runtime);
      const expectedSkillPath = path.join(root, ...row.skills.path.split('/'), 'harness-remove');
      assert.equal(installedDir, expectedSkillPath);

      const installedSkillFile = path.join(installedDir, 'SKILL.md');
      assert.equal(await pathExists(installedSkillFile), true);
      const installedContent = await readFile(installedSkillFile, 'utf8');
      assert.equal(installedContent, templateContent);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('proof-uninstall-handoff-install-skill: CLI prompts and installs harness-remove when confirmed', async () => {
  const root = await makeFixtureDir({
    '.wolven-harness.json': JSON.stringify({
      version: 1,
      gitHost: 'gh',
      runtimes: ['claude'],
      layout: 'linked',
      harnessHome: '.wolven-harness',
    }),
    '.wolven-harness/.agents/skills/adr/SKILL.md': '# adr\n',
    '.wolven-harness/AGENTS.md': '# AGENTS\n',
    'package.json': '{"name": "prompt-install-app"}\n',
  });

  try {
    // why: simulate confirmation of handoff prompt and selection of claude runtime.
    const result = await run(['uninstall', '--yes'], {
      cwd: root,
      prompts: {
        confirm: async () => true,
        select: async () => 'claude',
      },
    });

    assert.equal(result.code, 0);
    assert.match(result.stdout, /Installed harness-remove skill to /);
    assert.match(result.stdout, /Ask your agent: "Run the harness-remove skill/);

    const installedFile = path.join(root, '.claude', 'skills', 'harness-remove', 'SKILL.md');
    assert.equal(await pathExists(installedFile), true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('proof-uninstall-handoff-decline: when skill install is declined in CLI, no skill files are written and CLI exits 0', async () => {
  const root = await makeFixtureDir({
    '.wolven-harness.json': JSON.stringify({
      version: 1,
      gitHost: 'gh',
      runtimes: ['claude'],
      layout: 'linked',
      harnessHome: '.wolven-harness',
    }),
    '.wolven-harness/.agents/skills/adr/SKILL.md': '# adr\n',
    'package.json': '{"name": "declined-install-app"}\n',
  });

  try {
    // why: simulate declining the harness-remove handoff confirmation prompt.
    const result = await run(['uninstall', '--yes'], {
      cwd: root,
      prompts: {
        confirm: async () => false,
      },
    });

    assert.equal(result.code, 0);
    assert.doesNotMatch(result.stdout, /Installed harness-remove skill/);

    assert.equal(await pathExists(path.join(root, '.claude', 'skills', 'harness-remove')), false);
    assert.equal(await pathExists(path.join(root, '.agents', 'skills', 'harness-remove')), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('proof-uninstall-handoff-decline: non-interactive invocation skips skill install cleanly with exit 0', async () => {
  const root = await makeFixtureDir({
    '.wolven-harness.json': JSON.stringify({
      version: 1,
      gitHost: 'gh',
      runtimes: ['claude'],
      layout: 'linked',
      harnessHome: '.wolven-harness',
    }),
    '.wolven-harness/.agents/skills/adr/SKILL.md': '# adr\n',
    'package.json': '{"name": "noninteractive-app"}\n',
  });

  try {
    // why: non-interactive run without prompts does not attempt handoff and exits 0.
    const result = await run(['uninstall', '--yes'], {
      cwd: root,
      isTTY: false,
    });

    assert.equal(result.code, 0);
    assert.doesNotMatch(result.stdout, /Installed harness-remove skill/);
    assert.equal(await pathExists(path.join(root, '.claude', 'skills', 'harness-remove')), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('proof-uninstall-handoff-e2e: end-to-end quiet uninstall with skill handoff preserves docs and shared files', async () => {
  const root = await makeFixtureDir({
    '.wolven-harness.json': JSON.stringify({
      version: 1,
      gitHost: 'gh',
      runtimes: ['claude'],
      layout: 'linked',
      harnessHome: '.wolven-harness',
    }),
    '.wolven-harness/.agents/skills/adr/SKILL.md': '# ADR skill\n',
    '.wolven-harness/.qmd/index.yml': 'title: QMD\n',
    '.wolven-harness/AGENTS.md': '# Quiet AGENTS\n',
    '.wolven-harness/.gitignore': 'skills/\n',
    '.wolven-harness/docs/adrs/adr-001-setup.md': '# ADR 001\nArchitecture decision.\n',
    '.wolven-harness/docs/prds/alpha/alpha-prd.md': '# Alpha PRD\nRequirements.\n',
    '.wolven-harness/docs/specs/alpha/alpha-spec.md': '# Alpha Spec\nSystem spec.\n',
    '.wolven-harness/docs/notes/perf/perf-note.md': '# Perf Note\nBench notes.\n',
    '.wolven-harness/docs/deferrals/scale/scale-deferral.md': '# Deferral\nScale later.\n',
    '.wolven-harness/docs/WRITING-PROFILE.md': '# Writing Profile\nRules.\n',
    'package.json':
      '{\n  "name": "e2e-quiet-app",\n  "scripts": {\n    "harness:validate": "wolven-harness validate"\n  }\n}\n',
    'AGENTS.md': '# Project\n\n## Wolven harness\nStanding instructions.\n',
    '.gitignore': 'node_modules/\n.wolven-harness/\n',
    '.github/workflows/ci.yml': 'name: CI\njobs:\n  check:\n    runs-on: ubuntu-latest\n',
  });

  try {
    const docsDir = path.join(root, '.wolven-harness', 'docs');
    const beforeDocsHashes = await collectFileHashes(docsDir);
    assert.ok(beforeDocsHashes.size >= 6);

    const beforePackageJson = await readFile(path.join(root, 'package.json'), 'utf8');
    const beforeAgentsMd = await readFile(path.join(root, 'AGENTS.md'), 'utf8');
    const beforeGitignore = await readFile(path.join(root, '.gitignore'), 'utf8');
    const beforeCiWorkflow = await readFile(path.join(root, '.github', 'workflows', 'ci.yml'), 'utf8');

    const result = await run(['uninstall', '--yes'], {
      cwd: root,
      prompts: {
        confirm: async () => true,
        select: async () => 'claude',
      },
    });

    assert.equal(result.code, 0);
    assert.match(result.stdout, /Uninstall complete: removed/);
    assert.match(result.stdout, /Preserved documentation:/);
    assert.match(result.stdout, /Remaining intertwined shared files/);
    assert.match(result.stdout, /Installed harness-remove skill to /);

    // invariant: deterministic harness scaffolding is removed.
    assert.equal(await pathExists(path.join(root, '.wolven-harness.json')), false);
    assert.equal(await pathExists(path.join(root, '.wolven-harness', '.agents')), false);
    assert.equal(await pathExists(path.join(root, '.wolven-harness', '.qmd')), false);
    assert.equal(await pathExists(path.join(root, '.wolven-harness', 'AGENTS.md')), false);
    assert.equal(await pathExists(path.join(root, '.wolven-harness', '.gitignore')), false);

    // invariant: all docs are preserved byte-identical.
    assert.equal(await pathExists(docsDir), true);
    const afterDocsHashes = await collectFileHashes(docsDir);
    assert.deepEqual(afterDocsHashes, beforeDocsHashes);

    // invariant: shared intertwined files remain completely untouched.
    assert.equal(await readFile(path.join(root, 'package.json'), 'utf8'), beforePackageJson);
    assert.equal(await readFile(path.join(root, 'AGENTS.md'), 'utf8'), beforeAgentsMd);
    assert.equal(await readFile(path.join(root, '.gitignore'), 'utf8'), beforeGitignore);
    assert.equal(await readFile(path.join(root, '.github', 'workflows', 'ci.yml'), 'utf8'), beforeCiWorkflow);

    // invariant: harness-remove skill is installed in the selected runtime.
    const installedSkill = path.join(root, '.claude', 'skills', 'harness-remove', 'SKILL.md');
    assert.equal(await pathExists(installedSkill), true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('proof-uninstall-handoff-e2e: end-to-end full/home uninstall with skill handoff preserves root docs', async () => {
  const root = await makeFixtureDir({
    '.wolven-harness.json': JSON.stringify({
      version: 1,
      gitHost: 'gh',
      runtimes: ['cursor'],
      layout: 'home',
    }),
    'WOLVEN.md': '# Wolven\n',
    '.agents/skills/adr/SKILL.md': '# ADR skill\n',
    '.agents/rules/test.md': '# Rule\n',
    '.qmd/index.yml': 'title: QMD\n',
    'docs/adrs/adr-000-init.md': '# ADR 000\nFoundation.\n',
    'docs/prds/core/core-prd.md': '# Core PRD\n',
    'docs/specs/core/core-spec.md': '# Core Spec\n',
    'docs/notes/audit/audit-note.md': '# Audit\n',
    'docs/deferrals/scope/scope-deferral.md': '# Scope\n',
    'docs/WRITING-PROFILE.md': '# Writing Profile\n',
    'package.json': '{\n  "name": "e2e-home-app",\n  "scripts": {\n    "test": "node --test"\n  }\n}\n',
    'AGENTS.md': '# Home App\n## Wolven harness\n',
  });

  try {
    const docsDir = path.join(root, 'docs');
    const beforeDocsHashes = await collectFileHashes(docsDir);
    assert.ok(beforeDocsHashes.size >= 6);

    const beforePackageJson = await readFile(path.join(root, 'package.json'), 'utf8');
    const beforeAgentsMd = await readFile(path.join(root, 'AGENTS.md'), 'utf8');

    const result = await run(['uninstall', '--yes'], {
      cwd: root,
      prompts: {
        confirm: async () => true,
        select: async () => 'cursor',
      },
    });

    assert.equal(result.code, 0);

    // invariant: deterministic harness scaffolding is removed.
    assert.equal(await pathExists(path.join(root, '.wolven-harness.json')), false);
    assert.equal(await pathExists(path.join(root, 'WOLVEN.md')), false);
    assert.equal(await pathExists(path.join(root, '.qmd')), false);
    assert.equal(await pathExists(path.join(root, '.agents', 'rules')), false);
    assert.equal(await pathExists(path.join(root, '.agents', 'skills', 'adr')), false);

    // invariant: root docs/ preserved byte-identical.
    assert.equal(await pathExists(docsDir), true);
    const afterDocsHashes = await collectFileHashes(docsDir);
    assert.deepEqual(afterDocsHashes, beforeDocsHashes);

    // invariant: intertwined files left untouched.
    assert.equal(await readFile(path.join(root, 'package.json'), 'utf8'), beforePackageJson);
    assert.equal(await readFile(path.join(root, 'AGENTS.md'), 'utf8'), beforeAgentsMd);

    // invariant: harness-remove skill installed into cursor runtime path (.agents/skills/harness-remove).
    const installedSkill = path.join(root, '.agents', 'skills', 'harness-remove', 'SKILL.md');
    assert.equal(await pathExists(installedSkill), true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

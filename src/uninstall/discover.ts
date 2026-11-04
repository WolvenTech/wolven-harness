import { existsSync } from 'node:fs';
import { readdir, readFile, readlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathExists } from '../path-exists.js';
import { CONFIG_FILENAME, type Config, homeInsideRoot, readConfig } from '../setup/config.js';
import { quietGeneratedFiles, RUNTIME_REGISTRY } from '../setup/runtimes.js';
import type { DiscoveredInstall, HarnessLandscapeKind } from './types.js';

const KNOWN_HARNESS_SKILLS = new Set([
  'adr',
  'code-ci',
  'code-commit',
  'code-execute',
  'code-plan',
  'code-pr',
  'code-review',
  'code-spec',
  'create-prd',
  'grilling',
  'handoff',
  'harness-doctor',
  'harness-init',
  'harness-remove',
  'journey-map',
  'pragmatic-guard',
  'prototype',
  'qmd',
  'research',
  'the-fool',
  'the-jury',
  'wayfinder',
]);

/** Resolves the shipped templates skill directory. */
function resolveTemplatesSkillsDir(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '..', '..', 'templates', '.agents', 'skills');
}

/** True when a skill directory name matches a known shipped harness skill. */
export function isKnownHarnessSkill(name: string): boolean {
  if (KNOWN_HARNESS_SKILLS.has(name)) return true;
  try {
    const templatesDir = resolveTemplatesSkillsDir();
    return existsSync(path.join(templatesDir, name));
  } catch {
    return false;
  }
}

/** Extracts the name and description scalars from a SKILL.md frontmatter for identity comparison. */
function skillIdentity(raw: string): { name?: string; description?: string } {
  const name = /^name:\s*(.+?)\s*$/m.exec(raw)?.[1];
  const description = /^description:\s*(.+?)\s*$/m.exec(raw)?.[1];
  return { name, description };
}

/** True when a skill directory is this package's shipped copy, by frontmatter identity. */
async function isShippedHarnessSkill(dir: string, name: string): Promise<boolean> {
  if (!KNOWN_HARNESS_SKILLS.has(name)) return false;
  const candidate = await safeReadFile(path.join(dir, name, 'SKILL.md'));
  const template = await safeReadFile(path.join(resolveTemplatesSkillsDir(), name, 'SKILL.md'));
  if (!candidate || !template) return false;
  const candidateId = skillIdentity(candidate);
  const templateId = skillIdentity(template);
  return candidateId.name === templateId.name && candidateId.description === templateId.description;
}

/** True when text content contains harness-related keywords or markers. */
export function hasHarnessReferences(content: string): boolean {
  return /wolven|\bharness\b|\.wolven-harness|\.agents|\.qmd|@AGENTS\.md/i.test(content);
}

/** Reads a text file, returning undefined on ENOENT or read failure. */
async function safeReadFile(filePath: string): Promise<string | undefined> {
  try {
    return await readFile(filePath, 'utf8');
  } catch {
    return undefined;
  }
}

/** Reads a symbolic link target, returning undefined on failure. */
async function safeReadlink(linkPath: string): Promise<string | undefined> {
  try {
    return await readlink(linkPath);
  } catch {
    return undefined;
  }
}

/** Lists matching files in a directory matching a regular expression. */
async function findMatchingFiles(dir: string, pattern: RegExp): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries.filter((e) => e.isFile() && pattern.test(e.name)).map((e) => path.join(dir, e.name));
  } catch {
    return [];
  }
}

/** Collects all runtime-managed hook config paths in a directory. */
function getRuntimeHookConfigs(baseDir: string): string[] {
  const configs: string[] = [];
  for (const row of RUNTIME_REGISTRY) {
    if (row.hookConfig !== undefined) {
      configs.push(path.join(baseDir, ...row.hookConfig.path.split('/')));
    }
  }
  return [...new Set(configs)];
}

/** Collects all runtime-managed skill directories across runtimes. */
function getRuntimeSkillDirs(baseDir: string): string[] {
  const dirs: string[] = [];
  for (const row of RUNTIME_REGISTRY) {
    dirs.push(path.join(baseDir, ...row.skills.path.split('/')));
  }
  return [...new Set(dirs)];
}

/** Collects all runtime-managed rule stubs or link paths. */
async function getRuntimeRuleArtifacts(baseDir: string): Promise<string[]> {
  const artifacts: string[] = [];
  for (const row of RUNTIME_REGISTRY) {
    if (row.rules.kind === 'link') {
      const linkPath = path.join(baseDir, ...row.rules.path.split('/'));
      const link = await safeReadlink(linkPath);
      if (link && (link.includes('.agents/skills') || link.includes('.agents/rules'))) {
        artifacts.push(linkPath);
      }
    } else if (row.rules.kind === 'per-rule') {
      const parts = row.rules.pattern.split('{rule}');
      const prefix = parts[0] ?? '';
      const suffix = parts[1] ?? '';
      const dir = path.join(baseDir, ...path.dirname(prefix).split('/'));
      const basePrefix = path.basename(prefix);
      const escapedPrefix = basePrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedSuffix = suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`^${escapedPrefix}.*${escapedSuffix}$`);
      const matched = await findMatchingFiles(dir, regex);
      artifacts.push(...matched);
    }
  }
  return [...new Set(artifacts)];
}

/** Collects runtime entry files (e.g. entry stubs that point to @AGENTS.md). */
function getRuntimeEntryFiles(baseDir: string): string[] {
  const files: string[] = [];
  for (const row of RUNTIME_REGISTRY) {
    if (row.entryFile !== undefined) {
      files.push(path.join(baseDir, ...row.entryFile.path.split('/')));
    }
  }
  return [...new Set(files)];
}

/** Collects quiet install generated files for all runtimes. */
function getQuietGeneratedFiles(baseDir: string, home: string): string[] {
  const files: string[] = [];
  for (const row of RUNTIME_REGISTRY) {
    const generated = quietGeneratedFiles(row, [], '', home);
    for (const rel of generated.keys()) {
      files.push(path.join(baseDir, ...rel.split('/')));
    }
  }
  return [...new Set(files)];
}

/** True when a .wolven-harness directory holds anything besides preserved docs. */
async function quietDirHasHarnessArtifacts(quietDir: string): Promise<boolean> {
  try {
    const entries = await readdir(quietDir, { withFileTypes: true });
    return entries.some((entry) => entry.name !== 'docs');
  } catch {
    return false;
  }
}

/**
 * Inspects a single directory for harness installation artifacts, configuration,
 * preserved documentation, and intertwined shared files.
 */
async function inspectDirectory(
  dir: string,
  options: { isLinked?: boolean } = {},
): Promise<DiscoveredInstall | undefined> {
  const resolvedDir = path.resolve(dir);
  if (!(await pathExists(resolvedDir))) return undefined;

  const configPath = path.join(resolvedDir, CONFIG_FILENAME);
  const hasConfigFile = await pathExists(configPath);
  let config: Config | undefined;
  if (hasConfigFile) {
    try {
      config = await readConfig(resolvedDir);
    } catch {
      // why: if config breaks strict schema, attempt raw JSON parse to salvage layout hints.
      const raw = await safeReadFile(configPath);
      if (raw) {
        try {
          config = JSON.parse(raw) as Config;
        } catch {
          config = undefined;
        }
      }
    }
  }

  const quietDir = path.join(resolvedDir, '.wolven-harness');
  const hasQuietDir = (await pathExists(quietDir)) && (await quietDirHasHarnessArtifacts(quietDir));
  const wolvenMd = path.join(resolvedDir, 'WOLVEN.md');
  const hasWolvenMd = await pathExists(wolvenMd);
  const qmdDir = path.join(resolvedDir, '.qmd');
  const hasQmdDir = await pathExists(qmdDir);
  const agentsDir = path.join(resolvedDir, '.agents');
  const hasAgentsDir = await pathExists(agentsDir);

  const bootstrapSymlinks: string[] = [];
  for (const row of RUNTIME_REGISTRY) {
    const skillsRel = row.quietInstall.skillsPath;
    const initPath = path.join(resolvedDir, skillsRel, 'harness-init');
    if (await pathExists(initPath)) {
      bootstrapSymlinks.push(initPath);
    }
    const skillsFull = path.join(resolvedDir, skillsRel);
    try {
      const entries = await readdir(skillsFull, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isSymbolicLink()) {
          const entryPath = path.join(skillsFull, entry.name);
          const target = await safeReadlink(entryPath);
          if (target !== undefined) {
            const resolvedTarget = path.resolve(skillsFull, target);
            if (hasQuietDir && resolvedTarget.startsWith(quietDir)) {
              if (!bootstrapSymlinks.includes(entryPath)) {
                bootstrapSymlinks.push(entryPath);
              }
            }
          }
        }
      }
    } catch {
      // why: runtime skills folder may not exist yet in clean directories.
    }
  }

  const hasAnyHarnessArtifact =
    hasConfigFile || hasQuietDir || hasWolvenMd || hasQmdDir || hasAgentsDir || bootstrapSymlinks.length > 0;

  if (!hasAnyHarnessArtifact) return undefined;

  let kind: HarnessLandscapeKind;
  let harnessHome: string;

  if (
    hasQuietDir ||
    (config?.layout === 'linked' &&
      (config.harnessHome === undefined ||
        config.harnessHome === '.wolven-harness' ||
        homeInsideRoot(resolvedDir, path.resolve(resolvedDir, config.harnessHome)) !== undefined))
  ) {
    kind = 'quiet';
    harnessHome = path.resolve(resolvedDir, config?.harnessHome ?? '.wolven-harness');
  } else if (
    options.isLinked ||
    (config?.layout === 'linked' &&
      config.harnessHome !== undefined &&
      homeInsideRoot(resolvedDir, path.resolve(resolvedDir, config.harnessHome)) === undefined) ||
    (config?.codeRepo !== undefined &&
      homeInsideRoot(resolvedDir, path.resolve(resolvedDir, config.codeRepo)) === undefined)
  ) {
    kind = 'linked';
    harnessHome = config?.harnessHome ? path.resolve(resolvedDir, config.harnessHome) : resolvedDir;
  } else {
    kind = 'full';
    harnessHome = resolvedDir;
  }

  const artifacts: string[] = [];

  if (hasConfigFile) {
    artifacts.push(configPath);
  }

  if (kind === 'quiet') {
    for (const symlink of bootstrapSymlinks) {
      if (!artifacts.includes(symlink)) artifacts.push(symlink);
    }

    const homeRel = path.relative(resolvedDir, harnessHome).split(path.sep).join('/');
    const hookConfigPaths = new Set(getRuntimeHookConfigs(resolvedDir));
    const generated = getQuietGeneratedFiles(resolvedDir, homeRel);
    for (const genFile of generated) {
      if (hookConfigPaths.has(genFile)) continue;
      if ((await pathExists(genFile)) && !artifacts.includes(genFile)) {
        artifacts.push(genFile);
      }
    }

    const ruleArtifacts = await getRuntimeRuleArtifacts(resolvedDir);
    for (const rulePath of ruleArtifacts) {
      if ((await pathExists(rulePath)) && !artifacts.includes(rulePath)) {
        artifacts.push(rulePath);
      }
    }

    if (await pathExists(harnessHome)) {
      try {
        const homeEntries = await readdir(harnessHome, { withFileTypes: true });
        for (const entry of homeEntries) {
          // invariant: docs/ is strictly preserved and must never be slated for deletion.
          if (entry.name === 'docs') continue;
          const entryPath = path.join(harnessHome, entry.name);
          if (!artifacts.includes(entryPath)) {
            artifacts.push(entryPath);
          }
        }
      } catch {
        // why: ignore readdir failure on harnessHome if unreadable.
      }
    }
  } else if (kind === 'full' || (kind === 'linked' && harnessHome === resolvedDir)) {
    if (hasWolvenMd) artifacts.push(wolvenMd);
    if (hasQmdDir) artifacts.push(qmdDir);

    const rulesDir = path.join(resolvedDir, '.agents', 'rules');
    if (await pathExists(rulesDir)) artifacts.push(rulesDir);

    const hooksDir = path.join(resolvedDir, '.agents', 'hooks');
    if (await pathExists(hooksDir)) artifacts.push(hooksDir);

    const skillsDir = path.join(resolvedDir, '.agents', 'skills');
    if (await pathExists(skillsDir)) {
      try {
        const skillEntries = await readdir(skillsDir, { withFileTypes: true });
        for (const entry of skillEntries) {
          if (isKnownHarnessSkill(entry.name)) {
            artifacts.push(path.join(skillsDir, entry.name));
          }
        }
      } catch {
        // why: ignore readdir failure on skillsDir if unreadable.
      }
    }

    const scoreFile = path.join(resolvedDir, '.harness-score.json');
    if (await pathExists(scoreFile)) artifacts.push(scoreFile);

    for (const row of RUNTIME_REGISTRY) {
      if (row.skills.kind === 'symlink') {
        const stub = path.join(resolvedDir, ...row.skills.path.split('/'));
        if (await pathExists(stub)) {
          const link = await safeReadlink(stub);
          if (link && (link.includes('.agents/skills') || link.includes('.agents/rules'))) {
            if (!artifacts.includes(stub)) artifacts.push(stub);
          }
        }
      }
      if (row.rules.kind === 'link') {
        const stub = path.join(resolvedDir, ...row.rules.path.split('/'));
        if (await pathExists(stub)) {
          const link = await safeReadlink(stub);
          if (link && (link.includes('.agents/skills') || link.includes('.agents/rules'))) {
            if (!artifacts.includes(stub)) artifacts.push(stub);
          }
        }
      }
    }

    const entryFiles = getRuntimeEntryFiles(resolvedDir);
    for (const stub of entryFiles) {
      if (await pathExists(stub)) {
        const content = await safeReadFile(stub);
        if (content && content.trim() === '@AGENTS.md') {
          if (!artifacts.includes(stub)) artifacts.push(stub);
        }
      }
    }

    const ruleArtifacts = await getRuntimeRuleArtifacts(resolvedDir);
    for (const rulePath of ruleArtifacts) {
      if ((await pathExists(rulePath)) && !artifacts.includes(rulePath)) {
        artifacts.push(rulePath);
      }
    }
  } else if (kind === 'linked' && harnessHome !== resolvedDir) {
    for (const symlink of bootstrapSymlinks) {
      if (!artifacts.includes(symlink)) artifacts.push(symlink);
    }
    const ruleArtifacts = await getRuntimeRuleArtifacts(resolvedDir);
    for (const rulePath of ruleArtifacts) {
      if ((await pathExists(rulePath)) && !artifacts.includes(rulePath)) {
        artifacts.push(rulePath);
      }
    }
  }

  const preservedDocs: string[] = [];
  const rootDocs = path.join(resolvedDir, 'docs');
  if (await pathExists(rootDocs)) {
    preservedDocs.push(rootDocs);
  }
  if (harnessHome !== resolvedDir) {
    const homeDocs = path.join(harnessHome, 'docs');
    if ((await pathExists(homeDocs)) && !preservedDocs.includes(homeDocs)) {
      preservedDocs.push(homeDocs);
    }
  }

  const intertwinedFiles: string[] = [];
  const candidateShared = [
    path.join(resolvedDir, 'package.json'),
    path.join(resolvedDir, 'AGENTS.md'),
    path.join(resolvedDir, '.gitignore'),
  ];
  for (const candidate of candidateShared) {
    if (await pathExists(candidate)) {
      intertwinedFiles.push(candidate);
    }
  }

  const entryFiles = getRuntimeEntryFiles(resolvedDir);
  for (const stub of entryFiles) {
    if ((await pathExists(stub)) && !artifacts.includes(stub)) {
      const content = await safeReadFile(stub);
      if (content && hasHarnessReferences(content)) {
        intertwinedFiles.push(stub);
      }
    }
  }

  const workflowsDir = path.join(resolvedDir, '.github', 'workflows');
  if (await pathExists(workflowsDir)) {
    try {
      const entries = await readdir(workflowsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && (entry.name.endsWith('.yml') || entry.name.endsWith('.yaml'))) {
          const wfPath = path.join(workflowsDir, entry.name);
          const content = await safeReadFile(wfPath);
          if (content && hasHarnessReferences(content)) {
            intertwinedFiles.push(wfPath);
          }
        }
      }
    } catch {
      // why: ignore readdir failure on .github/workflows if unreadable.
    }
  }

  for (const hookFile of getRuntimeHookConfigs(resolvedDir)) {
    if (await pathExists(hookFile)) {
      const content = await safeReadFile(hookFile);
      if (content && hasHarnessReferences(content) && !intertwinedFiles.includes(hookFile)) {
        intertwinedFiles.push(hookFile);
      }
    }
  }

  return {
    kind,
    root: resolvedDir,
    harnessHome,
    ...(hasConfigFile ? { configPath } : {}),
    ...(config ? { config } : {}),
    artifacts: [...new Set(artifacts)].sort(),
    preservedDocs: [...new Set(preservedDocs)].sort(),
    intertwinedFiles: [...new Set(intertwinedFiles)].sort(),
  };
}

/**
 * Scans the local landscape around a target directory for harness installations.
 * Discovers quiet, full, linked, and standalone skill installations.
 */
export async function discoverLandscape(
  targetDir: string,
  env: Record<string, string | undefined> = {},
): Promise<DiscoveredInstall[]> {
  const resolvedRoot = path.resolve(targetDir);
  const discovered: DiscoveredInstall[] = [];
  const visitedRoots = new Set<string>();

  const rootInstall = await inspectDirectory(resolvedRoot);
  if (rootInstall) {
    visitedRoots.add(rootInstall.root);
    if (homeInsideRoot(resolvedRoot, rootInstall.harnessHome) !== undefined) {
      visitedRoots.add(rootInstall.harnessHome);
    }
    discovered.push(rootInstall);

    if (rootInstall.config?.harnessHome) {
      const linkedHome = path.resolve(resolvedRoot, rootInstall.config.harnessHome);
      if (homeInsideRoot(resolvedRoot, linkedHome) === undefined && !visitedRoots.has(linkedHome)) {
        visitedRoots.add(linkedHome);
        const linkedInstall = await inspectDirectory(linkedHome, { isLinked: true });
        if (linkedInstall) discovered.push(linkedInstall);
      }
    }
    if (rootInstall.config?.codeRepo) {
      const linkedRepo = path.resolve(resolvedRoot, rootInstall.config.codeRepo);
      if (homeInsideRoot(resolvedRoot, linkedRepo) === undefined && !visitedRoots.has(linkedRepo)) {
        visitedRoots.add(linkedRepo);
        const linkedInstall = await inspectDirectory(linkedRepo, { isLinked: true });
        if (linkedInstall) discovered.push(linkedInstall);
      }
    }
  } else {
    // why: check for standalone project skills when no harness install was found.
    const localStandalone: string[] = [];
    const localSkillDirs = getRuntimeSkillDirs(resolvedRoot);
    for (const sDir of localSkillDirs) {
      if (await pathExists(sDir)) {
        try {
          const entries = await readdir(sDir, { withFileTypes: true });
          for (const entry of entries) {
            if (await isShippedHarnessSkill(sDir, entry.name)) {
              localStandalone.push(path.join(sDir, entry.name));
            }
          }
        } catch {
          // why: ignore readdir failure on local skill dirs.
        }
      }
    }
    if (localStandalone.length > 0) {
      visitedRoots.add(resolvedRoot);
      discovered.push({
        kind: 'standalone',
        root: resolvedRoot,
        harnessHome: resolvedRoot,
        artifacts: [...new Set(localStandalone)].sort(),
        preservedDocs: [],
        intertwinedFiles: [],
      });
    }
  }

  const parentDir = path.dirname(resolvedRoot);
  if (parentDir !== resolvedRoot && !visitedRoots.has(parentDir)) {
    const parentConfigPath = path.join(parentDir, CONFIG_FILENAME);
    let parentLinksToRoot = false;
    let parentConfig: Config | undefined;
    if (await pathExists(parentConfigPath)) {
      try {
        parentConfig = await readConfig(parentDir);
      } catch {
        const raw = await safeReadFile(parentConfigPath);
        if (raw) {
          try {
            parentConfig = JSON.parse(raw) as Config;
          } catch {
            parentConfig = undefined;
          }
        }
      }
      if (parentConfig?.codeRepo) {
        parentLinksToRoot = path.resolve(parentDir, parentConfig.codeRepo) === resolvedRoot;
      }
      if (parentConfig?.harnessHome) {
        parentLinksToRoot = parentLinksToRoot || path.resolve(parentDir, parentConfig.harnessHome) === resolvedRoot;
      }
    }

    if (parentLinksToRoot) {
      visitedRoots.add(parentDir);
      const parentInstall = await inspectDirectory(parentDir, { isLinked: true });
      if (parentInstall) {
        discovered.push(parentInstall);
      }
    }
  }

  try {
    const entries = await readdir(resolvedRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === '.wolven-harness') continue;
      const childDir = path.join(resolvedRoot, entry.name);
      if (visitedRoots.has(childDir)) continue;

      const isGit = await pathExists(path.join(childDir, '.git'));
      const hasConfig = await pathExists(path.join(childDir, CONFIG_FILENAME));
      const hasQuiet = await pathExists(path.join(childDir, '.wolven-harness'));
      if (isGit || hasConfig || hasQuiet) {
        visitedRoots.add(childDir);
        const childInstall = await inspectDirectory(childDir, { isLinked: true });
        if (childInstall) {
          discovered.push(childInstall);
        }
      }
    }
  } catch {
    // why: ignore readdir failure on resolvedRoot if inaccessible.
  }

  const home = env.HOME;
  if (home && (await pathExists(home))) {
    const globalArtifacts: string[] = [];
    const globalDirs = getRuntimeSkillDirs(home);

    for (const gDir of globalDirs) {
      if (await pathExists(gDir)) {
        try {
          const entries = await readdir(gDir, { withFileTypes: true });
          for (const entry of entries) {
            if (await isShippedHarnessSkill(gDir, entry.name)) {
              globalArtifacts.push(path.join(gDir, entry.name));
            }
          }
        } catch {
          // why: ignore readdir failure on global skill dirs.
        }
      }
    }

    if (globalArtifacts.length > 0) {
      discovered.push({
        kind: 'standalone',
        root: home,
        harnessHome: home,
        artifacts: [...new Set(globalArtifacts)].sort(),
        preservedDocs: [],
        intertwinedFiles: [],
      });
    }
  }

  return discovered;
}

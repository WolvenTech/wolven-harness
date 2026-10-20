import type { Dirent } from 'node:fs';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { pathExists } from '../path-exists.js';
import type { WriteRecorder } from './manifest.js';
import type { Context, Options, Runtime, StepResult } from './types.js';
import { SetupError } from './types.js';

/** How a runtime gets the standing rules into context. */
export type RulesStrategy = 'native' | 'inline';

/**
 * Where a runtime reads project skills: the shared folder directly, or a
 * project-relative symlink to it.
 */
export type ProjectSkills = { kind: 'direct'; path: string } | { kind: 'symlink'; path: string; target: string };

/** The environment a machine marker is computed from. */
export type RuntimeEnv = Record<string, string | undefined>;

/** One row of the runtime registry. */
export interface RuntimeRegistryRow {
  id: Runtime;
  /** Human name, as used in prompts and summaries. */
  name: string;
  /**
   * Absolute paths that exist only when the runtime is configured on this
   * machine. Empty when the runtime documents no home path or the
   * environment lacks the variable it needs.
   */
  machineMarkers(env: RuntimeEnv): string[];
  /** Project-relative posix paths that mark the runtime in a repository. */
  folderMarkers: readonly string[];
  skills: ProjectSkills;
  rules: RulesStrategy;
}

function envDir(env: RuntimeEnv, key: string): string | undefined {
  const value = env[key];
  return value === undefined || value === '' ? undefined : value;
}

/** `XDG_CONFIG_HOME`, defaulting to `<HOME>/.config`. */
function xdgConfigDir(env: RuntimeEnv): string | undefined {
  const xdg = envDir(env, 'XDG_CONFIG_HOME');
  if (xdg !== undefined) return xdg;
  const home = envDir(env, 'HOME');
  return home === undefined ? undefined : path.join(home, '.config');
}

/** `CODEX_HOME`, defaulting to `<HOME>/.codex`. */
function codexDir(env: RuntimeEnv): string | undefined {
  const codex = envDir(env, 'CODEX_HOME');
  if (codex !== undefined) return codex;
  const home = envDir(env, 'HOME');
  return home === undefined ? undefined : path.join(home, '.codex');
}

/** Marker paths under `base`; empty when `base` is unknown. */
function markerUnder(base: string | undefined, ...segments: string[]): string[] {
  return base === undefined ? [] : [path.join(base, ...segments)];
}

const homeDir = (env: RuntimeEnv): string | undefined => envDir(env, 'HOME');

/**
 * One row per supported runtime, in the order `setup` offers them. Each
 * row states detection markers, the skills path and the rules strategy;
 * the wiring itself lives below.
 */
export const RUNTIME_REGISTRY: readonly RuntimeRegistryRow[] = [
  {
    id: 'claude',
    name: 'Claude Code',
    machineMarkers: (env) => markerUnder(homeDir(env), '.claude'),
    folderMarkers: ['CLAUDE.md', '.claude'],
    skills: { kind: 'symlink', path: '.claude/skills', target: '../.agents/skills' },
    rules: 'native',
  },
  {
    id: 'codex',
    name: 'Codex',
    machineMarkers: (env) => markerUnder(codexDir(env)),
    folderMarkers: ['.codex'],
    skills: { kind: 'direct', path: '.agents/skills' },
    rules: 'inline',
  },
  {
    id: 'cursor',
    name: 'Cursor',
    machineMarkers: (env) => markerUnder(homeDir(env), '.cursor'),
    folderMarkers: ['.cursor', '.cursorrules'],
    skills: { kind: 'direct', path: '.agents/skills' },
    rules: 'native',
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    machineMarkers: (env) => markerUnder(xdgConfigDir(env), 'opencode'),
    folderMarkers: ['opencode.json'],
    skills: { kind: 'direct', path: '.agents/skills' },
    rules: 'native',
  },
  {
    id: 'amp',
    name: 'Amp',
    machineMarkers: (env) => markerUnder(xdgConfigDir(env), 'amp'),
    folderMarkers: [],
    skills: { kind: 'direct', path: '.agents/skills' },
    rules: 'native',
  },
  {
    id: 'copilot',
    name: 'GitHub Copilot',
    machineMarkers: (env) => markerUnder(homeDir(env), '.copilot'),
    folderMarkers: ['.github/copilot-instructions.md'],
    skills: { kind: 'direct', path: '.agents/skills' },
    rules: 'native',
  },
  {
    id: 'gemini',
    name: 'Gemini CLI',
    machineMarkers: (env) => markerUnder(homeDir(env), '.gemini'),
    folderMarkers: ['GEMINI.md', '.gemini'],
    skills: { kind: 'direct', path: '.agents/skills' },
    rules: 'native',
  },
  {
    id: 'kiro',
    name: 'Kiro',
    machineMarkers: (env) => markerUnder(homeDir(env), '.kiro'),
    folderMarkers: ['.kiro'],
    skills: { kind: 'symlink', path: '.kiro/skills', target: '../.agents/skills' },
    rules: 'native',
  },
  {
    id: 'antigravity',
    name: 'Antigravity',
    // hazard: Antigravity documents no home directory, so it reports no machine marker.
    machineMarkers: () => [],
    folderMarkers: ['.agents/rules'],
    skills: { kind: 'direct', path: '.agents/skills' },
    rules: 'native',
  },
];

/** The registry row for `id`; every `Runtime` has one. */
export function runtimeRow(id: Runtime): RuntimeRegistryRow {
  const row = RUNTIME_REGISTRY.find((candidate) => candidate.id === id);
  if (row === undefined) throw new Error(`unknown runtime: ${id}`);
  return row;
}

/** True when `value` is one of the registry's runtime ids. */
export function isRuntimeId(value: unknown): value is Runtime {
  return typeof value === 'string' && RUNTIME_REGISTRY.some((row) => row.id === value);
}

/**
 * Injectable indirection over `fs.symlink`, so the forced-failure test can
 * simulate a platform that cannot create symlinks (e.g. EPERM on Windows)
 * without touching the real filesystem's permissions.
 */
type SymlinkImpl = (target: string, path: string, type?: 'dir' | 'file' | 'junction') => Promise<void>;

let symlinkImpl: SymlinkImpl = fs.symlink;

/** Test-only: override the symlink call. Pass `undefined` to restore the default. */
export function setSymlinkImpl(impl?: SymlinkImpl): void {
  symlinkImpl = impl ?? fs.symlink;
}

const RULES_DIR = '.agents/rules';

/** One rule file under `.agents/rules/`, with its YAML frontmatter removed. */
interface RuleSource {
  /** File name without the `.md` suffix, used in generated file names. */
  base: string;
  body: string;
}

/** Rule sources under `.agents/rules/`, sorted by name; empty when the folder is absent. */
async function readRules(root: string): Promise<RuleSource[]> {
  const dir = path.join(root, ...RULES_DIR.split('/'));

  let entries: Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }

  const rules: RuleSource[] = [];
  for (const entry of entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    const raw = await fs.readFile(path.join(dir, entry.name), 'utf8');
    rules.push({ base: entry.name.slice(0, -'.md'.length), body: stripFrontmatter(raw) });
  }
  return rules;
}

function stripFrontmatter(raw: string): string {
  return raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').replace(/^\r?\n/, '');
}

/** A generated runtime rule file: its runtime frontmatter plus the source rule body. */
function wrapRule(rule: RuleSource, frontmatter: string): string {
  const body = rule.body.endsWith('\n') ? rule.body : `${rule.body}\n`;
  return `---\n${frontmatter}\n---\n\n${body}`;
}

function opencodeJson(rules: RuleSource[]): string {
  const instructions = rules.map((rule) => `${RULES_DIR}/${rule.base}.md`);
  return `${JSON.stringify({ instructions }, null, 2)}\n`;
}

function geminiMd(rules: RuleSource[]): string {
  return `${['@AGENTS.md', '', ...rules.map((rule) => `@${RULES_DIR}/${rule.base}.md`)].join('\n')}\n`;
}

async function createFile(
  ctx: Context,
  rel: string,
  content: string,
  created: string[],
  skipped: string[],
  recorder?: WriteRecorder,
): Promise<void> {
  const full = path.join(ctx.root, ...rel.split('/'));
  if (await pathExists(full)) {
    skipped.push(rel);
    return;
  }

  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, content, 'utf8');
  recorder?.record(rel, content);
  created.push(rel);
}

/**
 * Creates a relative symlink. A symlink is not a regular file, so it is
 * never recorded in the install manifest.
 */
async function createSymlink(
  ctx: Context,
  rel: string,
  target: string,
  runtimeName: string,
  created: string[],
  skipped: string[],
): Promise<void> {
  const full = path.join(ctx.root, ...rel.split('/'));
  if (await pathExists(full)) {
    skipped.push(rel);
    return;
  }

  await fs.mkdir(path.dirname(full), { recursive: true });

  try {
    await symlinkImpl(target, full, 'dir');
  } catch {
    throw new SetupError(
      `could not create the ${rel} symlink: symlinks are required to wire the ${runtimeName} runtime, and only macOS and Linux are supported.`,
    );
  }

  created.push(rel);
}

/**
 * Creates the rules wiring a native row names in the registry. Rows that
 * read the rules elsewhere (the harness section, or `.agents/rules/` itself)
 * create nothing, and an absent rules folder generates nothing.
 */
async function wireNativeRules(
  row: RuntimeRegistryRow,
  rules: RuleSource[],
  ctx: Context,
  created: string[],
  skipped: string[],
  recorder?: WriteRecorder,
): Promise<void> {
  if (rules.length === 0) return;

  switch (row.id) {
    case 'claude':
      await createSymlink(ctx, '.claude/rules', '../.agents/rules', row.name, created, skipped);
      return;
    case 'cursor':
      for (const rule of rules) {
        await createFile(
          ctx,
          `.cursor/rules/wolven-${rule.base}.mdc`,
          wrapRule(rule, 'alwaysApply: true'),
          created,
          skipped,
          recorder,
        );
      }
      return;
    case 'opencode':
      await createFile(ctx, 'opencode.json', opencodeJson(rules), created, skipped, recorder);
      return;
    case 'copilot':
      for (const rule of rules) {
        await createFile(
          ctx,
          `.github/instructions/wolven-${rule.base}.instructions.md`,
          wrapRule(rule, 'applyTo: "**"'),
          created,
          skipped,
          recorder,
        );
      }
      return;
    case 'gemini':
      await createFile(ctx, 'GEMINI.md', geminiMd(rules), created, skipped, recorder);
      return;
    case 'kiro':
      for (const rule of rules) {
        await createFile(
          ctx,
          `.kiro/steering/wolven-${rule.base}.md`,
          wrapRule(rule, 'inclusion: always'),
          created,
          skipped,
          recorder,
        );
      }
      return;
    case 'amp':
    case 'antigravity':
    case 'codex':
      return;
  }
}

/**
 * Wires only the selected runtimes' skills paths, for the mode that runs
 * outside a git top-level. Direct rows create nothing, and no entry file,
 * rules wiring or config is written here.
 */
export async function wireRuntimeSkills(opts: Options, ctx: Context): Promise<StepResult> {
  const created: string[] = [];
  const skipped: string[] = [];
  await wireSkillsPaths(opts.runtimes.map(runtimeRow), ctx, created, skipped);
  return { created, skipped };
}

/** Creates the skills symlink each `symlink` row names, skipping any path that already exists. */
async function wireSkillsPaths(
  rows: readonly RuntimeRegistryRow[],
  ctx: Context,
  created: string[],
  skipped: string[],
): Promise<void> {
  for (const row of rows) {
    if (row.skills.kind === 'symlink') {
      await createSymlink(ctx, row.skills.path, row.skills.target, row.name, created, skipped);
    }
  }
}

/**
 * Wires the selected runtimes: skills paths that are symlinks, the
 * `CLAUDE.md` stub, and each native row's rules wiring. When any selected
 * runtime is `inline`, the harness section carries the rules, so no native
 * rules wiring is created for any runtime. With `recorder`, every regular
 * file created here is handed over for the install manifest.
 */
export async function wireRuntimes(opts: Options, ctx: Context, recorder?: WriteRecorder): Promise<StepResult> {
  const created: string[] = [];
  const skipped: string[] = [];
  const rows = opts.runtimes.map(runtimeRow);
  const inline = rows.some((row) => row.rules === 'inline');

  await wireSkillsPaths(rows, ctx, created, skipped);
  if (opts.runtimes.includes('claude')) await wireClaudeMd(ctx, created, skipped, recorder);

  if (!inline) {
    const rules = await readRules(ctx.root);
    for (const row of rows) {
      if (row.rules === 'native') await wireNativeRules(row, rules, ctx, created, skipped, recorder);
    }
  }

  return { created, skipped };
}

async function wireClaudeMd(
  ctx: Context,
  created: string[],
  skipped: string[],
  recorder?: WriteRecorder,
): Promise<void> {
  const claudeMdPath = path.join(ctx.root, 'CLAUDE.md');

  const exists = await pathExists(claudeMdPath);
  if (exists) {
    skipped.push('CLAUDE.md');
    return;
  }

  const content = '@AGENTS.md\n';
  await fs.writeFile(claudeMdPath, content, 'utf8');
  recorder?.record('CLAUDE.md', content);
  created.push('CLAUDE.md');
}

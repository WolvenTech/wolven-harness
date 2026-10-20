import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathExists } from '../path-exists.js';
import type { PackageManager } from './config.js';
import { readConfig } from './config.js';
import { SetupError } from './types.js';

/** A consumer `package.json`, parsed; only the object-valued fields setup reads are typed. */
export type PackageJson = Record<string, Record<string, unknown> | undefined>;

/** Reads and parses `<root>/package.json`; a missing file gives `undefined`. */
export async function readPackageJson(root: string): Promise<PackageJson | undefined> {
  let raw: string;
  try {
    raw = await readFile(path.join(root, 'package.json'), 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw err;
  }
  return JSON.parse(raw) as PackageJson;
}

/** Every shape of command the CLI prints, one form per kind. */
export type CommandKind =
  | 'run-script'
  | 'exec-binary'
  | 'execute-package'
  | 'add-dev-dependency'
  | 'add-dev-dependency-exact'
  | 'remove-dependency'
  | 'global-add';

/**
 * The command each package manager uses for each kind. `none` means the
 * folder has no `package.json`, so it has no scripts to run: `run-script`
 * is unreachable there and falls back to the bare token.
 */
const FORMS: Record<CommandKind, Record<PackageManager, (arg: string) => string>> = {
  'run-script': {
    npm: (script) => `npm run ${script}`,
    yarn: (script) => `yarn ${script}`,
    pnpm: (script) => `pnpm ${script}`,
    none: (script) => script,
  },
  'exec-binary': {
    npm: (binary) => `npx ${binary}`,
    yarn: (binary) => `yarn exec ${binary}`,
    pnpm: (binary) => `pnpm exec ${binary}`,
    none: (binary) => binary,
  },
  'execute-package': {
    npm: (spec) => `npx ${spec}`,
    yarn: (spec) => `yarn dlx ${spec}`,
    pnpm: (spec) => `pnpm dlx ${spec}`,
    none: (spec) => spec,
  },
  'add-dev-dependency': {
    npm: (spec) => `npm install -D ${spec}`,
    yarn: (spec) => `yarn add -D ${spec}`,
    pnpm: (spec) => `pnpm add -D ${spec}`,
    none: (spec) => spec,
  },
  'add-dev-dependency-exact': {
    npm: (spec) => `npm install -D -E ${spec}`,
    yarn: (spec) => `yarn add -D --exact ${spec}`,
    pnpm: (spec) => `pnpm add -D -E ${spec}`,
    none: (spec) => spec,
  },
  'remove-dependency': {
    npm: (spec) => `npm uninstall ${spec}`,
    yarn: (spec) => `yarn remove ${spec}`,
    pnpm: (spec) => `pnpm remove ${spec}`,
    none: (spec) => spec,
  },
  'global-add': {
    npm: (spec) => `npm install -g ${spec}`,
    yarn: (spec) => `yarn global add ${spec}`,
    pnpm: (spec) => `pnpm add -g ${spec}`,
    none: (spec) => `npm install -g ${spec}`,
  },
};

/** Every command kind, for a table test over the forms. */
export const COMMAND_KINDS = Object.keys(FORMS) as CommandKind[];

/** One printed command for `manager` and `kind`, with `arg` filled in. */
export function buildCommand(manager: PackageManager, kind: CommandKind, arg: string): string {
  return FORMS[kind][manager](arg);
}

export function runScript(manager: PackageManager, script: string): string {
  return buildCommand(manager, 'run-script', script);
}

export function execBinary(manager: PackageManager, binary: string): string {
  return buildCommand(manager, 'exec-binary', binary);
}

/** Runs a package's binary without installing it, e.g. `pnpm dlx harness-score@1.6.5`. */
export function executePackage(manager: PackageManager, spec: string): string {
  return buildCommand(manager, 'execute-package', spec);
}

export function addDevDependency(manager: PackageManager, spec: string): string {
  return buildCommand(manager, 'add-dev-dependency', spec);
}

export function addDevDependencyExact(manager: PackageManager, spec: string): string {
  return buildCommand(manager, 'add-dev-dependency-exact', spec);
}

export function removeDependency(manager: PackageManager, spec: string): string {
  return buildCommand(manager, 'remove-dependency', spec);
}

export function globalAdd(manager: PackageManager, spec: string): string {
  return buildCommand(manager, 'global-add', spec);
}

/** Lockfiles that name a manager, in the order the contract lists them. */
const LOCKFILES: readonly (readonly [string, PackageManager])[] = [
  ['pnpm-lock.yaml', 'pnpm'],
  ['yarn.lock', 'yarn'],
  ['package-lock.json', 'npm'],
];

/** The manager `package.json`'s `packageManager` field names, when it names a supported one. */
function fieldPackageManager(pkg: PackageJson | undefined): PackageManager | undefined {
  if (pkg === undefined) return undefined;
  const raw: unknown = (pkg as unknown as Record<string, unknown>).packageManager;
  if (typeof raw !== 'string') return undefined;
  const name = raw.split('@')[0]?.trim();
  return name === 'npm' || name === 'yarn' || name === 'pnpm' ? name : undefined;
}

/** Every lockfile present under `root`, as managers, in the contract's order. */
async function lockfileManagers(root: string): Promise<PackageManager[]> {
  const found: PackageManager[] = [];
  for (const [file, manager] of LOCKFILES) {
    if (await pathExists(path.join(root, file))) found.push(manager);
  }
  return found;
}

/** What a caller already knows about the manager before detection. */
export interface PackageManagerSignals {
  /** A validated `--package-manager` value. */
  flag?: PackageManager;
  /** The value recorded in `.wolven-harness.json`. */
  recorded?: PackageManager;
}

/**
 * Resolves the project's package manager: the flag, then the recorded
 * config value, then `package.json`'s `packageManager` field, then the one
 * lockfile present, then `none` only when there is no `package.json`.
 * Several lockfiles ask through `ask`, or fail naming `--package-manager`
 * when there is no one to ask.
 */
export async function resolvePackageManager(
  root: string,
  signals: PackageManagerSignals = {},
  ask?: () => Promise<PackageManager>,
): Promise<PackageManager> {
  if (signals.flag !== undefined) return signals.flag;
  if (signals.recorded !== undefined) return signals.recorded;

  const pkg = await readPackageJson(root);
  const field = fieldPackageManager(pkg);
  if (field !== undefined) return field;

  const lockfiles = await lockfileManagers(root);
  if (lockfiles.length === 1) return lockfiles[0];

  if (lockfiles.length > 1) {
    if (ask !== undefined) return ask();
    throw new SetupError(
      `several package managers seem to be in use here: ${lockfiles.join(', ')}`,
      'Pass --package-manager npm, --package-manager yarn or --package-manager pnpm.',
    );
  }

  return pkg === undefined ? 'none' : 'npm';
}

/** The manager an install recorded, else the one detection finds with no flag. */
export async function recordedPackageManager(root: string): Promise<PackageManager> {
  const config = await readConfig(root);
  return resolvePackageManager(root, { recorded: config?.packageManager });
}

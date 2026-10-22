import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { isRuntimeId, RUNTIME_REGISTRY } from './runtimes.js';
import type { SkillSet } from './skill-sets.js';
import { isSkillSet } from './skill-sets.js';
import type { GitHost, Runtime } from './types.js';
import { SetupError } from './types.js';

/** The package manager a project resolves to; `none` when there is no `package.json`. */
export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'none';

/** The supported harness layout: the open folder is the harness home. */
export type HarnessLayout = 'home';

/** The subject shape `code-commit` and `code-pr` apply to `codeRepo` work. */
export type CommitConvention = { style: 'conventional' } | { style: 'pattern'; pattern: string; example: string };

/**
 * Shape of `.wolven-harness.json`. `version` is the config schema version
 * (currently `1`), not the package version.
 */
export interface Config {
  version: 1;
  gitHost: GitHost;
  runtimes: Runtime[];
  /** Optional skill sets installed so far; absent in configs written before sets existed. */
  skillSets?: SkillSet[];
  ignore?: string[];
  /** This package's own version, resolved and rewritten on every `setup` run. */
  packageVersion?: string;
  packageManager?: PackageManager;
  layout?: HarnessLayout;
  /** The one code repository this install serves; a path relative to the config file's folder. */
  codeRepo?: string;
  commitConvention?: CommitConvention;
  /**
   * Any other top-level keys present in the file (e.g. `comments`).
   * `readConfig`/`writeConfig` don't interpret these — they only round-trip
   * them so a re-run doesn't drop keys other steps or a human added.
   */
  extra?: Record<string, unknown>;
}

const KNOWN_KEYS = new Set([
  'version',
  'gitHost',
  'runtimes',
  'skillSets',
  'ignore',
  'packageVersion',
  'packageManager',
  'layout',
  'codeRepo',
  'commitConvention',
]);

export const CONFIG_FILENAME = '.wolven-harness.json';

const GIT_HOSTS: readonly GitHost[] = ['gh', 'bit'];
const PACKAGE_MANAGERS: readonly PackageManager[] = ['npm', 'yarn', 'pnpm', 'none'];
const LAYOUTS: readonly HarnessLayout[] = ['home'];
const RUNTIME_ID_LIST = RUNTIME_REGISTRY.map((row) => row.id).join('", "');

export function isGitHost(value: unknown): value is GitHost {
  return typeof value === 'string' && (GIT_HOSTS as readonly string[]).includes(value);
}

export function isRuntime(value: unknown): value is Runtime {
  return isRuntimeId(value);
}

/** True when `value` is a `packageManager` the contract allows. */
export function isPackageManager(value: unknown): value is PackageManager {
  return typeof value === 'string' && (PACKAGE_MANAGERS as readonly string[]).includes(value);
}

/** True when `value` is a `layout` the contract allows. */
export function isHarnessLayout(value: unknown): value is HarnessLayout {
  return typeof value === 'string' && (LAYOUTS as readonly string[]).includes(value);
}

function isRuntimeArray(value: unknown): value is Runtime[] {
  return Array.isArray(value) && value.length > 0 && value.every((v) => isRuntime(v));
}

/** A non-empty path relative to the config file's folder. */
function readRelativePath(key: string, value: unknown): string {
  if (typeof value !== 'string' || value.length === 0 || path.isAbsolute(value)) {
    throw new SetupError(`${CONFIG_FILENAME} "${key}" must be a non-empty relative path`);
  }
  return value;
}

/**
 * Reads `commitConvention`: `{ "style": "conventional" }`, or a `pattern`
 * shape whose `pattern` compiles as a JavaScript regular expression and whose
 * `example` is a subject string.
 */
function readCommitConvention(value: unknown): CommitConvention {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new SetupError(`${CONFIG_FILENAME} "commitConvention" must be an object`);
  }

  const obj = value as Record<string, unknown>;
  if (obj.style === 'conventional') return { style: 'conventional' };
  if (obj.style !== 'pattern') {
    throw new SetupError(`${CONFIG_FILENAME} "commitConvention" "style" must be "conventional" or "pattern"`);
  }

  if (typeof obj.pattern !== 'string') {
    throw new SetupError(
      `${CONFIG_FILENAME} "commitConvention" "pattern" must be a string that compiles as a regular expression`,
    );
  }
  try {
    RegExp(obj.pattern);
  } catch {
    throw new SetupError(
      `${CONFIG_FILENAME} "commitConvention" "pattern" must be a string that compiles as a regular expression`,
    );
  }

  if (typeof obj.example !== 'string') {
    throw new SetupError(`${CONFIG_FILENAME} "commitConvention" "example" must be a string`);
  }

  return { style: 'pattern', pattern: obj.pattern, example: obj.example };
}

/**
 * Reads and validates `.wolven-harness.json` from `root`. Returns
 * `undefined` when the file is absent. Throws `SetupError` when the file
 * exists but is not valid JSON, or its shape breaks the contract: `version`
 * is not `1`; `gitHost`/`runtimes` are missing or hold unknown values;
 * `ignore` is not an array of strings; `packageVersion` is not a string;
 * `packageManager`/`layout` hold an unknown value; `harnessHome` is present; `codeRepo` is not
 * a relative path; `commitConvention` is not one of its two shapes. Any
 * other top-level key is preserved in `extra`, untyped.
 */
export async function readConfig(root: string): Promise<Config | undefined> {
  const file = path.join(root, CONFIG_FILENAME);

  let raw: string;
  try {
    raw = await readFile(file, 'utf8');
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT') {
      return undefined;
    }
    throw err;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new SetupError(`${CONFIG_FILENAME} is not valid JSON`);
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new SetupError(`${CONFIG_FILENAME} must contain a JSON object`);
  }

  const obj = parsed as Record<string, unknown>;

  if (obj.version !== 1) {
    throw new SetupError(`${CONFIG_FILENAME} "version" must be 1`);
  }
  if (!isGitHost(obj.gitHost)) {
    throw new SetupError(`${CONFIG_FILENAME} "gitHost" must be "gh" or "bit"`);
  }
  if (!isRuntimeArray(obj.runtimes)) {
    throw new SetupError(`${CONFIG_FILENAME} "runtimes" must be a non-empty array of "${RUNTIME_ID_LIST}"`);
  }

  const config: Config = {
    version: 1,
    gitHost: obj.gitHost,
    runtimes: obj.runtimes,
  };

  if (obj.skillSets !== undefined) {
    if (!Array.isArray(obj.skillSets) || !obj.skillSets.every(isSkillSet)) {
      throw new SetupError(`${CONFIG_FILENAME} "skillSets" must be an array of "ship", "discovery"`);
    }
    config.skillSets = obj.skillSets;
  }

  if (obj.ignore !== undefined) {
    if (!Array.isArray(obj.ignore) || !obj.ignore.every((v) => typeof v === 'string')) {
      throw new SetupError(`${CONFIG_FILENAME} "ignore" must be an array of strings`);
    }
    config.ignore = obj.ignore as string[];
  }

  if (obj.packageVersion !== undefined) {
    if (typeof obj.packageVersion !== 'string') {
      throw new SetupError(`${CONFIG_FILENAME} "packageVersion" must be a string`);
    }
    config.packageVersion = obj.packageVersion;
  }

  if (obj.packageManager !== undefined) {
    if (!isPackageManager(obj.packageManager)) {
      throw new SetupError(`${CONFIG_FILENAME} "packageManager" must be "npm", "yarn", "pnpm" or "none"`);
    }
    config.packageManager = obj.packageManager;
  }

  if (obj.layout !== undefined) {
    if (!isHarnessLayout(obj.layout)) {
      throw new SetupError(`${CONFIG_FILENAME} "layout" must be "home"`);
    }
    config.layout = obj.layout;
  }

  if (Object.hasOwn(obj, 'harnessHome')) {
    throw new SetupError(`${CONFIG_FILENAME} "harnessHome" is not supported`);
  }

  if (obj.codeRepo !== undefined) {
    config.codeRepo = readRelativePath('codeRepo', obj.codeRepo);
  }

  if (obj.commitConvention !== undefined) {
    config.commitConvention = readCommitConvention(obj.commitConvention);
  }

  const extraEntries = Object.entries(obj).filter(([key]) => !KNOWN_KEYS.has(key));
  if (extraEntries.length > 0) {
    config.extra = Object.fromEntries(extraEntries);
  }

  return config;
}

/** Top-level keys of the existing `.wolven-harness.json`, in file order; empty when absent or unreadable. */
async function existingKeyOrder(file: string): Promise<string[]> {
  try {
    const parsed: unknown = JSON.parse(await readFile(file, 'utf8'));
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return [];
    return Object.keys(parsed);
  } catch {
    return [];
  }
}

/**
 * Writes `.wolven-harness.json` at `root` as 2-space JSON with a trailing
 * newline: `{ "version", "gitHost", "runtimes" }`, plus `skillSets`,
 * `packageVersion`, `ignore`, `packageManager`, `layout`,
 * `codeRepo` and `commitConvention` when set, plus every key in
 * `config.extra` (e.g. `comments`). Keys already in the file keep their
 * order; new keys follow in the order above. Callers are responsible for
 * carrying an existing `ignore`/`extra` value forward — `writeConfig` never
 * invents or drops them itself, it only writes what it is given.
 */
export async function writeConfig(root: string, config: Config): Promise<void> {
  const file = path.join(root, CONFIG_FILENAME);

  const fresh: Record<string, unknown> = {
    version: config.version,
    gitHost: config.gitHost,
    runtimes: config.runtimes,
  };
  if (config.skillSets !== undefined) {
    fresh.skillSets = config.skillSets;
  }
  if (config.packageVersion !== undefined) {
    fresh.packageVersion = config.packageVersion;
  }
  if (config.ignore !== undefined) {
    fresh.ignore = config.ignore;
  }
  if (config.packageManager !== undefined) {
    fresh.packageManager = config.packageManager;
  }
  if (config.layout !== undefined) {
    fresh.layout = config.layout;
  }
  if (config.codeRepo !== undefined) {
    fresh.codeRepo = config.codeRepo;
  }
  if (config.commitConvention !== undefined) {
    fresh.commitConvention = config.commitConvention;
  }
  if (config.extra !== undefined) {
    for (const [key, value] of Object.entries(config.extra)) {
      fresh[key] = value;
    }
  }

  // why: a re-run that only refreshes packageVersion should diff on that line alone.
  const order = [...(await existingKeyOrder(file)).filter((key) => Object.hasOwn(fresh, key)), ...Object.keys(fresh)];
  const body: Record<string, unknown> = {};
  for (const key of order) {
    if (!Object.hasOwn(body, key)) body[key] = fresh[key];
  }

  const json = `${JSON.stringify(body, null, 2)}\n`;
  await writeFile(file, json, 'utf8');
}

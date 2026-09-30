import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { SkillSet } from './skill-sets.js';
import { isSkillSet } from './skill-sets.js';
import type { GitHost, Runtime } from './types.js';
import { SetupError } from './types.js';

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
  /**
   * Individually installed skill folder names (via `--skill`); whole sets
   * stay in `skillSets` only — a lone discovery skill must not list `discovery` there.
   */
  skills?: string[];
  ignore?: string[];
  /** This package's own version, resolved and rewritten on every `setup` run. */
  packageVersion?: string;
  /**
   * Any other top-level keys present in the file (e.g. `comments`).
   * `readConfig`/`writeConfig` don't interpret these — they only round-trip
   * them so a re-run doesn't drop keys other steps or a human added.
   */
  extra?: Record<string, unknown>;
}

const KNOWN_KEYS = new Set(['version', 'gitHost', 'runtimes', 'skillSets', 'skills', 'ignore', 'packageVersion']);

export const CONFIG_FILENAME = '.wolven-harness.json';

const GIT_HOSTS: readonly GitHost[] = ['gh', 'bit'];
const RUNTIMES: readonly Runtime[] = ['claude', 'codex', 'cursor'];

export function isGitHost(value: unknown): value is GitHost {
  return typeof value === 'string' && (GIT_HOSTS as readonly string[]).includes(value);
}

export function isRuntime(value: unknown): value is Runtime {
  return typeof value === 'string' && (RUNTIMES as readonly string[]).includes(value);
}

function isRuntimeArray(value: unknown): value is Runtime[] {
  return Array.isArray(value) && value.length > 0 && value.every((v) => isRuntime(v));
}

/**
 * Reads and validates `.wolven-harness.json` from `root`. Returns
 * `undefined` when the file is absent. Throws `SetupError` when the file
 * exists but is not valid JSON, or its shape is invalid (`version` is not
 * `1`, `gitHost`/`runtimes` are missing or hold unknown values, `ignore` is
 * present but not an array of strings, or `packageVersion` is present but
 * not a string). Any other top-level key is preserved in `extra`, untyped.
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
    throw new SetupError(`${CONFIG_FILENAME} "runtimes" must be a non-empty array of "claude", "codex", "cursor"`);
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

  if (obj.skills !== undefined) {
    // why: the skill catalog may change in any release, so a name this release lacks must not reject the file.
    if (!Array.isArray(obj.skills) || !obj.skills.every((v) => typeof v === 'string' && v.length > 0)) {
      throw new SetupError(`${CONFIG_FILENAME} "skills" must be an array of non-empty skill folder names`);
    }
    config.skills = obj.skills;
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
 * newline: `{ "version", "gitHost", "runtimes" }`, plus `skillSets`, `skills`,
 * `packageVersion` and `ignore` when set, plus every key in `config.extra`
 * (e.g. `comments`). Keys already in the file keep their order; new keys
 * follow in the order above. Callers are responsible for carrying an existing
 * `ignore`/`extra` value forward — `writeConfig` never invents or drops them
 * itself, it only writes what it is given.
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
  if (config.skills !== undefined) {
    fresh.skills = config.skills;
  }
  if (config.packageVersion !== undefined) {
    fresh.packageVersion = config.packageVersion;
  }
  if (config.ignore !== undefined) {
    fresh.ignore = config.ignore;
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

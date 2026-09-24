import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { GitHost, Runtime } from './types.js';
import { InitError } from './types.js';

/**
 * Shape of `.wolven-harness.json`. `version` is the config schema version
 * (currently `1`), not the package version.
 */
export interface Config {
  version: 1;
  gitHost: GitHost;
  runtimes: Runtime[];
  ignore?: string[];
}

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
 * `undefined` when the file is absent. Throws `InitError` when the file
 * exists but is not valid JSON, or its shape is invalid (`version` is not
 * `1`, `gitHost`/`runtimes` are missing or hold unknown values, or `ignore`
 * is present but not an array of strings).
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
    throw new InitError(`${CONFIG_FILENAME} is not valid JSON`);
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new InitError(`${CONFIG_FILENAME} must contain a JSON object`);
  }

  const obj = parsed as Record<string, unknown>;

  if (obj.version !== 1) {
    throw new InitError(`${CONFIG_FILENAME} "version" must be 1`);
  }
  if (!isGitHost(obj.gitHost)) {
    throw new InitError(`${CONFIG_FILENAME} "gitHost" must be "gh" or "bit"`);
  }
  if (!isRuntimeArray(obj.runtimes)) {
    throw new InitError(
      `${CONFIG_FILENAME} "runtimes" must be a non-empty array of "claude", "codex", "cursor"`,
    );
  }

  const config: Config = {
    version: 1,
    gitHost: obj.gitHost,
    runtimes: obj.runtimes,
  };

  if (obj.ignore !== undefined) {
    if (!Array.isArray(obj.ignore) || !obj.ignore.every((v) => typeof v === 'string')) {
      throw new InitError(`${CONFIG_FILENAME} "ignore" must be an array of strings`);
    }
    config.ignore = obj.ignore as string[];
  }

  return config;
}

/**
 * Writes `.wolven-harness.json` at `root` as 2-space JSON with a trailing
 * newline: `{ "version", "gitHost", "runtimes" }`, plus `ignore` when
 * `config.ignore` is set. Callers are responsible for carrying an existing
 * `ignore` value forward — `writeConfig` never invents or drops it itself,
 * it only writes what it is given.
 */
export async function writeConfig(root: string, config: Config): Promise<void> {
  const file = path.join(root, CONFIG_FILENAME);

  const body: Record<string, unknown> = {
    version: config.version,
    gitHost: config.gitHost,
    runtimes: config.runtimes,
  };
  if (config.ignore !== undefined) {
    body.ignore = config.ignore;
  }

  const json = `${JSON.stringify(body, null, 2)}\n`;
  await writeFile(file, json, 'utf8');
}

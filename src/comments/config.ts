import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { CONFIG_FILENAME } from '../init/config.js';
import { loadIgnoreConfig } from '../validate/config.js';

/** Extensions judged without any config, e.g. `.ts`. */
export const BUILTIN_EXTENSIONS: readonly string[] = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];

/** One `comments.languages` entry: a required line marker and an optional block pair. */
export interface LanguageSyntax {
  line: string;
  block?: readonly [string, string];
}

/** The `comments` scope resolved from `.wolven-harness.json`. */
export interface CommentsScope {
  /** Extension (e.g. `.py`) to syntax, for extensions beyond the built-ins. */
  languages: ReadonlyMap<string, LanguageSyntax>;
  /** `<dir>` prefixes that replace the default file-selection scope, when set. */
  paths?: readonly string[];
  /** `<dir>` prefixes to exclude, from the top-level `ignore` key. */
  ignoreDirs: readonly string[];
}

/** Thrown when `.wolven-harness.json`'s `comments` key does not match its shape. */
export class CommentsConfigError extends Error {}

function isUnderDir(file: string, dir: string): boolean {
  return file.startsWith(`${dir}/`);
}

/** True when `file`'s extension is a built-in or a configured `comments.languages` entry. */
export function hasKnownSyntax(file: string, scope: CommentsScope): boolean {
  if (BUILTIN_EXTENSIONS.some((ext) => file.endsWith(ext))) return true;
  for (const ext of scope.languages.keys()) {
    if (file.endsWith(ext)) return true;
  }
  return false;
}

/**
 * True when `file` is in the judged scope: under a `comments.paths` prefix
 * when one is configured, otherwise not under an `ignore` dir. A configured
 * `comments.paths` replaces the default scope, `ignore` included, so a repo
 * can judge a directory it hides from the claim scan.
 */
export function isInScope(file: string, scope: CommentsScope): boolean {
  if (scope.paths) return scope.paths.some((dir) => isUnderDir(file, dir));
  return !scope.ignoreDirs.some((dir) => isUnderDir(file, dir));
}

function parseLanguageSyntax(ext: string, value: unknown): LanguageSyntax {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new CommentsConfigError(`${CONFIG_FILENAME} "comments.languages[${JSON.stringify(ext)}]" must be an object`);
  }
  const obj = value as Record<string, unknown>;
  if (typeof obj.line !== 'string' || obj.line === '') {
    throw new CommentsConfigError(
      `${CONFIG_FILENAME} "comments.languages[${JSON.stringify(ext)}]" must have a non-empty "line" string`,
    );
  }
  const syntax: LanguageSyntax = { line: obj.line };
  if (obj.block !== undefined) {
    if (
      !Array.isArray(obj.block) ||
      obj.block.length !== 2 ||
      typeof obj.block[0] !== 'string' ||
      typeof obj.block[1] !== 'string'
    ) {
      throw new CommentsConfigError(
        `${CONFIG_FILENAME} "comments.languages[${JSON.stringify(ext)}].block" must be a [open, close] pair of strings`,
      );
    }
    syntax.block = [obj.block[0], obj.block[1]];
  }
  return syntax;
}

function parseLanguages(value: unknown): Map<string, LanguageSyntax> {
  const languages = new Map<string, LanguageSyntax>();
  if (value === undefined) return languages;
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new CommentsConfigError(`${CONFIG_FILENAME} "comments.languages" must be an object`);
  }
  for (const [ext, syntax] of Object.entries(value as Record<string, unknown>)) {
    languages.set(ext, parseLanguageSyntax(ext, syntax));
  }
  return languages;
}

function parsePaths(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length === 0 || !value.every((v) => typeof v === 'string')) {
    throw new CommentsConfigError(`${CONFIG_FILENAME} "comments.paths" must be a non-empty array of strings`);
  }
  return value;
}

async function readRawConfig(root: string): Promise<Record<string, unknown> | undefined> {
  let raw: string;
  try {
    raw = await readFile(path.join(root, CONFIG_FILENAME), 'utf8');
  } catch {
    return undefined;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return undefined;
    return parsed as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

/**
 * Reads `.wolven-harness.json` at `root` and resolves the `comments` scope:
 * configured languages, the path scope (unset means the default), and the
 * `ignore` dirs to exclude. Throws `CommentsConfigError`, naming the key,
 * when `comments` does not match its shape.
 */
export async function loadCommentsScope(root: string): Promise<CommentsScope> {
  const { entries } = await loadIgnoreConfig(root);
  const ignoreDirs = entries.map((entry) => entry.slice(0, -'/**'.length));

  const config = await readRawConfig(root);
  const comments = config?.comments;
  if (comments === undefined) {
    return { languages: new Map(), ignoreDirs };
  }
  if (typeof comments !== 'object' || comments === null || Array.isArray(comments)) {
    throw new CommentsConfigError(`${CONFIG_FILENAME} "comments" must be an object`);
  }
  const obj = comments as Record<string, unknown>;

  return {
    languages: parseLanguages(obj.languages),
    paths: parsePaths(obj.paths),
    ignoreDirs,
  };
}

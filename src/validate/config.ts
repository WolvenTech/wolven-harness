import { readConfig } from '../setup/config.js';
import type { Finding } from './report.js';

const GLOB_CHARS = /[*?[\]{}]/;
const GUARDED_DIRS = ['docs', '.agents'];

/**
 * Validates one `ignore` entry: it must be `<dir>/**`, `dir`
 * must be a relative path with no glob characters, no leading `/`, no
 * `..` segment, and not empty or `.`, and `dir` must not be `docs` or
 * `.agents`, or a path under either.
 */
function isValidEntry(entry: string): boolean {
  const suffix = '/**';
  if (!entry.endsWith(suffix)) return false;

  const dir = entry.slice(0, -suffix.length);
  if (dir.length === 0 || dir === '.') return false;
  if (dir.startsWith('/')) return false;
  if (GLOB_CHARS.test(dir)) return false;

  const segments = dir.split('/');
  if (segments.some((s) => s === '' || s === '..')) return false;

  if (GUARDED_DIRS.some((guarded) => dir === guarded || dir.startsWith(`${guarded}/`))) return false;

  return true;
}

/** The result of loading and validating `.wolven-harness.json`'s `ignore` entries. */
export interface IgnoreConfig {
  /** Valid entries, in file order. */
  entries: string[];
  /** One `error` finding per invalid entry, naming it verbatim. */
  findings: Finding[];
}

/**
 * Reads `.wolven-harness.json` at `root` and validates its `ignore`
 * entries. A missing file, or a missing `ignore` key, means no entries and
 * no findings.
 */
export function partitionIgnore(raw: readonly string[]): IgnoreConfig {
  const entries: string[] = [];
  const findings: Finding[] = [];

  for (const entry of raw) {
    if (isValidEntry(entry)) {
      entries.push(entry);
    } else {
      findings.push({
        level: 'error',
        rule: 'ignore-entry',
        message: `invalid "ignore" entry: "${entry}"`,
      });
    }
  }

  return { entries, findings };
}

/** Reads `.wolven-harness.json` at `root` and validates its `ignore` entries. */
export async function loadIgnoreConfig(root: string): Promise<IgnoreConfig> {
  const config = await readConfig(root);
  return partitionIgnore(config?.ignore ?? []);
}

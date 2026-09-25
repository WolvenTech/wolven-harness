import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Context, StepResult } from './types.js';

type ScriptEntry = { key: string; value: string };

const HARNESS_SCRIPTS: readonly ScriptEntry[] = [
  { key: 'harness:validate', value: 'wolven-harness validate' },
  { key: 'harness:comments', value: 'wolven-harness comments' },
];

function reportId(key: string): string {
  return `package.json#scripts.${key}`;
}

/** Indent string used by the first indented line, defaulting to two spaces. */
function detectIndent(raw: string): string {
  const match = raw.match(/^([ \t]+)\S/m);
  return match ? match[1] : '  ';
}

function hasTrailingNewline(raw: string): boolean {
  return raw.endsWith('\n');
}

/**
 * Adds each entry in `HARNESS_SCRIPTS` to a consumer `package.json`'s
 * `scripts`, only when that key is absent. Every other key, and the
 * original key order, is preserved — `JSON.parse` keeps source insertion
 * order for string keys, and re-serializing after adding only the missing
 * keys changes nothing else. Indentation and a trailing newline are
 * detected from the source file rather than assumed. Missing
 * `package.json` is not an error: this step simply does nothing.
 */
export async function addValidateScript(ctx: Context): Promise<StepResult> {
  const pkgPath = path.join(ctx.root, 'package.json');

  let raw: string;
  try {
    raw = await readFile(pkgPath, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return { created: [], skipped: [] };
    throw err;
  }

  const pkg = JSON.parse(raw) as { scripts?: Record<string, string> };
  const created: string[] = [];
  const skipped: string[] = [];

  for (const { key, value } of HARNESS_SCRIPTS) {
    if (pkg.scripts && Object.prototype.hasOwnProperty.call(pkg.scripts, key)) {
      skipped.push(reportId(key));
      continue;
    }
    if (!pkg.scripts) pkg.scripts = {};
    pkg.scripts[key] = value;
    created.push(reportId(key));
  }

  if (created.length === 0) return { created, skipped };

  const indent = detectIndent(raw);
  let output = JSON.stringify(pkg, null, indent);
  if (hasTrailingNewline(raw)) output += '\n';

  await writeFile(pkgPath, output, 'utf8');
  return { created, skipped };
}

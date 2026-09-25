import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Context, StepResult } from './types.js';

const SCRIPT_KEY = 'harness:validate';
const SCRIPT_VALUE = 'wolven-harness validate';
const REPORT_ID = `package.json#scripts.${SCRIPT_KEY}`;

/** Indent string used by the first indented line, defaulting to two spaces. */
function detectIndent(raw: string): string {
  const match = raw.match(/^([ \t]+)\S/m);
  return match ? match[1] : '  ';
}

function hasTrailingNewline(raw: string): boolean {
  return raw.endsWith('\n');
}

/**
 * Adds `"harness:validate": "wolven-harness validate"` to a consumer
 * `package.json`'s `scripts`, only when that key is absent. Every other
 * key, and the original key order, is preserved — `JSON.parse` keeps
 * source insertion order for string keys, and re-serializing after adding
 * exactly one new key changes nothing else. Indentation and a trailing
 * newline are detected from the source file rather than assumed. Missing
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

  if (pkg.scripts && Object.prototype.hasOwnProperty.call(pkg.scripts, SCRIPT_KEY)) {
    return { created: [], skipped: [REPORT_ID] };
  }

  if (!pkg.scripts) pkg.scripts = {};
  pkg.scripts[SCRIPT_KEY] = SCRIPT_VALUE;

  const indent = detectIndent(raw);
  let output = JSON.stringify(pkg, null, indent);
  if (hasTrailingNewline(raw)) output += '\n';

  await writeFile(pkgPath, output, 'utf8');
  return { created: [REPORT_ID], skipped: [] };
}

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Context } from './types.js';

/**
 * The harness-score release the templates and the starter
 * `.harness-score.json` are checked against. It matches this package's own
 * pinned devDependency, so the fix command setup prints installs the
 * version CI scores this repo with.
 */
export const HARNESS_SCORE_VERSION = '1.6.5';

const HARNESS_SCORE = 'harness-score';

/**
 * Returns a one-line warning with the exact fix command when the target
 * root has a `package.json` that lists `harness-score` in neither
 * `devDependencies` nor `dependencies`, so its `harness:score` script
 * cannot run. Writes nothing; a missing `package.json` gives `undefined`.
 */
export async function harnessScoreWarning(ctx: Context): Promise<string | undefined> {
  let raw: string;
  try {
    raw = await readFile(path.join(ctx.root, 'package.json'), 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw err;
  }

  const pkg = JSON.parse(raw) as Record<string, Record<string, unknown> | undefined>;
  const listed = ['devDependencies', 'dependencies'].some((field) => Object.hasOwn(pkg[field] ?? {}, HARNESS_SCORE));
  if (listed) return undefined;

  return `${HARNESS_SCORE} is not in your devDependencies, so harness:score cannot run. Fix it with: pnpm add -D -E ${HARNESS_SCORE}@${HARNESS_SCORE_VERSION}`;
}

import { readPackageJson } from './own-package.js';
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
 * root has a `package.json` whose `harness:score` script calls
 * `harness-score` (or is absent) while `harness-score` is in neither
 * `devDependencies` nor `dependencies`. A kept `harness:score` script that
 * runs something else gets no warning. Writes nothing; a missing
 * `package.json` gives `undefined`.
 */
export async function harnessScoreWarning(ctx: Context): Promise<string | undefined> {
  const pkg = await readPackageJson(ctx.root);
  if (pkg === undefined) return undefined;

  const script = pkg.scripts?.['harness:score'];
  if (typeof script === 'string' && !script.includes(HARNESS_SCORE)) return undefined;

  const listed = ['devDependencies', 'dependencies'].some((field) => Object.hasOwn(pkg[field] ?? {}, HARNESS_SCORE));
  if (listed) return undefined;

  return `${HARNESS_SCORE} is not in your dependencies, so harness:score cannot run. Fix it with: pnpm add -D -E ${HARNESS_SCORE}@${HARNESS_SCORE_VERSION}`;
}

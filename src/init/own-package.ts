import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Context } from './types.js';

/** This running package's own `name` and `version`, from its `package.json`. */
export interface OwnPackage {
  name: string;
  version: string;
}

let ownPackage: Promise<OwnPackage> | undefined;

/**
 * Resolves this package's own `package.json`, relative to this module the
 * same way `resolveTemplatesDir` (in `src/init/index.ts`) resolves
 * `templates/` — both sit two directories below the package root, so this
 * works both under `tsx` and from the built `dist/`. Read once per process;
 * later calls share the first result.
 */
export function resolveOwnPackage(): Promise<OwnPackage> {
  ownPackage ??= (async () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const pkgPath = path.resolve(here, '..', '..', 'package.json');
    const raw = await readFile(pkgPath, 'utf8');
    const pkg = JSON.parse(raw) as { name: string; version: string };
    return { name: pkg.name, version: pkg.version };
  })();
  return ownPackage;
}

/**
 * Warns on `ctx.io.stderr` when the target root has a `package.json` and
 * this package is not in its `devDependencies`: listed under `dependencies`
 * or `optionalDependencies`, the warning says to move it; absent, to add
 * it. Writes nothing to the file itself — a missing `package.json`, or the
 * dependency already in `devDependencies`, is silent.
 */
export async function warnMissingDevDependency(ctx: Context): Promise<void> {
  const pkgPath = path.join(ctx.root, 'package.json');

  let raw: string;
  try {
    raw = await readFile(pkgPath, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return;
    throw err;
  }

  const pkg = JSON.parse(raw) as Record<string, Record<string, unknown> | undefined>;
  const { name } = await resolveOwnPackage();
  const has = (field: string): boolean => Object.prototype.hasOwnProperty.call(pkg[field] ?? {}, name);

  if (has('devDependencies')) return;

  const otherField = ['dependencies', 'optionalDependencies'].find(has);
  if (otherField !== undefined) {
    ctx.io.stderr.write(
      `wolven-harness init: ${name} is in ${otherField}, not devDependencies — run "pnpm remove ${name} && pnpm add -D ${name}".\n`,
    );
    return;
  }

  ctx.io.stderr.write(
    `wolven-harness init: ${name} is not in devDependencies — run "pnpm add -D ${name}".\n`,
  );
}

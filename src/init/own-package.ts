import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Context } from './types.js';

/** This running package's own `name` and `version`, from its `package.json`. */
interface OwnPackage {
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
 * Returns a kind, one-line warning (with the exact fix command) when the
 * target root has a `package.json` and this package is not in its
 * `devDependencies`: listed under `dependencies` or `optionalDependencies`
 * the fix is to move it, absent it is to add it. Writes nothing; a missing
 * `package.json`, or the dependency already in `devDependencies`, gives
 * `undefined`.
 */
export async function devDependencyWarning(ctx: Context): Promise<string | undefined> {
  const pkgPath = path.join(ctx.root, 'package.json');

  let raw: string;
  try {
    raw = await readFile(pkgPath, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw err;
  }

  const pkg = JSON.parse(raw) as Record<string, Record<string, unknown> | undefined>;
  const { name } = await resolveOwnPackage();
  const has = (field: string): boolean => Object.prototype.hasOwnProperty.call(pkg[field] ?? {}, name);

  if (has('devDependencies')) return undefined;

  const otherField = ['dependencies', 'optionalDependencies'].find(has);
  if (otherField !== undefined) {
    return `${name} is listed under ${otherField}; it belongs in devDependencies. Fix it with: pnpm remove ${name} && pnpm add -D ${name}`;
  }

  return `${name} is not in your devDependencies yet, so teammates and CI will not get it. Fix it with: pnpm add -D ${name}`;
}

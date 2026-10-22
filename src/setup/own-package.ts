import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PackageManager } from './config.js';
import { addDevDependency, readPackageJson, recordedPackageManager, removeDependency } from './package-manager.js';
import type { Context } from './types.js';

/** This running package's own `name` and `version`, from its `package.json`. */
interface OwnPackage {
  name: string;
  version: string;
}

let ownPackage: Promise<OwnPackage> | undefined;

/**
 * Resolves this package's own `package.json`, relative to this module the
 * same way `resolveTemplatesDir` (in `src/setup/index.ts`) resolves
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
 * the fix is to move it, absent it is to add it. The fix commands use
 * `packageManager` when given, else the manager the install recorded.
 * Writes nothing; a missing `package.json`, or the dependency already in
 * `devDependencies`, gives `undefined`.
 */
export async function devDependencyWarning(ctx: Context, packageManager?: PackageManager): Promise<string | undefined> {
  const pkg = await readPackageJson(ctx.root);
  if (pkg === undefined) return undefined;

  const { name } = await resolveOwnPackage();
  const has = (field: string): boolean => Object.hasOwn(pkg[field] ?? {}, name);

  if (has('devDependencies')) return undefined;

  const manager = packageManager ?? (await recordedPackageManager(ctx.root));

  const otherField = ['dependencies', 'optionalDependencies'].find(has);
  if (otherField !== undefined) {
    return `${name} is listed under ${otherField}; it belongs in devDependencies. Fix it with: ${removeDependency(manager, name)} && ${addDevDependency(manager, name)}`;
  }

  return `${name} is not in your devDependencies yet, so teammates and CI will not get it. Fix it with: ${addDevDependency(manager, name)}`;
}

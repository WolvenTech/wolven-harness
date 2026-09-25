import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveOptions } from './options.js';
import { applyTemplates } from './apply.js';
import { wireRuntimes } from './runtimes.js';
import { addValidateScript } from './package-script.js';
import { InitError } from './types.js';
import type { Io, Context, StepResult } from './types.js';

/**
 * Resolves `templates/` relative to this package, working both when run
 * under `tsx` from `src/init/index.ts` and when run from the built
 * `dist/init/index.js` — both sit two directories below the package root.
 */
function resolveTemplatesDir(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '..', '..', 'templates');
}

async function traced<T>(io: Io, name: string, fn: () => Promise<T>): Promise<T> {
  io.stderr.write(`[wolven-harness:init] step ${name}\n`);
  return fn();
}

/**
 * Runs `init`'s steps in a fixed order: resolve options, apply templates,
 * wire runtimes, add the validate script.
 */
export async function runInit(argv: string[], io: Io): Promise<number> {
  const ctx: Context = {
    root: io.cwd,
    templatesDir: resolveTemplatesDir(),
    io,
  };

  let results: StepResult[];
  try {
    const opts = await traced(io, 'resolveOptions', () => resolveOptions(argv, io, ctx));
    const applyResult = await traced(io, 'applyTemplates', () => applyTemplates(opts, ctx));
    const runtimeResult = await traced(io, 'wireRuntimes', () => wireRuntimes(opts, ctx));
    const scriptResult = await traced(io, 'addValidateScript', () => addValidateScript(ctx));
    results = [applyResult, runtimeResult, scriptResult];
  } catch (err) {
    if (!(err instanceof InitError)) throw err;
    io.stderr.write(`wolven-harness init: ${err.message}\n`);
    return 1;
  }

  const created = results.flatMap((r) => r.created);
  const skipped = results.flatMap((r) => r.skipped);

  io.stdout.write('created:\n');
  for (const file of created) io.stdout.write(`  ${file}\n`);
  io.stdout.write('skipped (exists):\n');
  for (const file of skipped) io.stdout.write(`  ${file}\n`);
  io.stdout.write('\nNext: run the "harness-init" skill to integrate WOLVEN.md into AGENTS.md.\n');

  return 0;
}

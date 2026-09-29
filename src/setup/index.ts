import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyTemplates } from './apply.js';
import { HARNESS_SCORE_VERSION, harnessScoreWarning } from './harness-score.js';
import { resolveOptions } from './options.js';
import { devDependencyWarning, resolveOwnPackage } from './own-package.js';
import { addValidateScript } from './package-script.js';
import { wireRuntimes } from './runtimes.js';
import { skillFolders } from './skill-sets.js';
import { buildSummary, joinNames, runtimeName } from './summary.js';
import type { Context, Io, Runtime } from './types.js';
import { SetupCancelled, SetupError } from './types.js';
import { createUi } from './ui.js';

/**
 * Resolves `templates/` relative to this package, working both when run
 * under `tsx` from `src/setup/index.ts` and when run from the built
 * `dist/setup/index.js` — both sit two directories below the package root.
 */
function resolveTemplatesDir(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '..', '..', 'templates');
}

/**
 * Runs one step, first writing `[wolven-harness:setup] step <name>` to
 * stderr when `debug` is on; silent otherwise.
 */
async function traced<T>(io: Io, debug: boolean, name: string, fn: () => Promise<T>): Promise<T> {
  if (debug) io.stderr.write(`[wolven-harness:setup] step ${name}\n`);
  return fn();
}

function nextSteps(runtimes: Runtime[], hasScripts: boolean): string[] {
  const names = joinNames(runtimes.map(runtimeName));
  const validate = hasScripts ? 'pnpm harness:validate' : 'pnpm exec wolven-harness validate';
  const score = hasScripts ? 'pnpm harness:score' : `pnpm dlx harness-score@${HARNESS_SCORE_VERSION}`;
  return [
    'Review and commit the new files (git status shows them all).',
    `Open a fresh ${names} session in this repo and run the "harness-init" skill. It integrates WOLVEN.md into AGENTS.md, migrates any legacy ADRs, scores the harness, and asks before anything ambiguous.`,
    `Run \`${validate}\` any time to check the repo, and \`${score}\` to see how mature its harness is.`,
  ];
}

/**
 * Runs `setup`'s steps in a fixed order: resolve options (prompting on a
 * TTY), apply templates, wire runtimes, add the harness scripts, then
 * report a grouped summary, any missing-devDependency warning, and next
 * steps. `--verbose` also lists every file; `--debug` (or
 * `WOLVEN_HARNESS_DEBUG=1`) traces each step on stderr.
 */
export async function runSetup(argv: string[], io: Io): Promise<number> {
  const ctx: Context = {
    root: io.cwd,
    templatesDir: resolveTemplatesDir(),
    io,
  };
  const debug = argv.includes('--debug') || io.env?.WOLVEN_HARNESS_DEBUG === '1';
  const verbose = argv.includes('--verbose');
  const ui = createUi(io);

  const { name, version } = await resolveOwnPackage();
  ui.intro(`${name} ${version}`, [
    "I'll set up the .agents/ source tree (skills and rules), the docs/ folders and WOLVEN.md,",
    'wire your agent runtimes, and add harness:validate, harness:comments and harness:score scripts.',
    'Nothing is committed, and existing files are never overwritten.',
  ]);

  try {
    const opts = await traced(io, debug, 'resolveOptions', () => resolveOptions(argv, ctx));
    const wiredNames = opts.runtimes.map(runtimeName).join(' / ');

    const applyResult = await ui.phase('Copying skills and rules', 'Copied skills and rules', () =>
      traced(io, debug, 'applyTemplates', () => applyTemplates(ctx, skillFolders(opts.skillSets))),
    );
    const runtimeResult = await ui.phase(`Wiring ${wiredNames}`, `Wired ${wiredNames}`, () =>
      traced(io, debug, 'wireRuntimes', () => wireRuntimes(opts, ctx)),
    );
    const scriptResult = await ui.phase('Adding package scripts', 'Checked package scripts', () =>
      traced(io, debug, 'addValidateScript', () => addValidateScript(ctx)),
    );
    const warning = await traced(io, debug, 'devDependencyWarning', () => devDependencyWarning(ctx));
    const scoreWarning = await traced(io, debug, 'harnessScoreWarning', () => harnessScoreWarning(ctx));

    ui.summary(buildSummary(applyResult, runtimeResult, scriptResult, opts.runtimes, opts.keptSets));
    if (verbose) {
      const results = [applyResult, runtimeResult, scriptResult];
      ui.files(
        results.flatMap((r) => r.created),
        results.flatMap((r) => r.skipped),
      );
    }
    if (warning !== undefined) ui.warn(warning);
    if (scoreWarning !== undefined) ui.warn(scoreWarning);
    const hasScripts = scriptResult.created.length + scriptResult.skipped.length > 0;
    ui.nextSteps(nextSteps(opts.runtimes, hasScripts));
  } catch (err) {
    if (err instanceof SetupCancelled) {
      ui.cancelled();
      return 1;
    }
    if (!(err instanceof SetupError)) throw err;
    ui.error(err.message, err.hint);
    return 1;
  }

  return 0;
}

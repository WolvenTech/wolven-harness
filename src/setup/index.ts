import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyTemplates } from './apply.js';
import type { PackageManager } from './config.js';
import { HARNESS_SCORE_VERSION, harnessScoreWarning } from './harness-score.js';
import { resolveOptions } from './options.js';
import { devDependencyWarning, resolveOwnPackage } from './own-package.js';
import { execBinary, executePackage, globalAdd, recordedPackageManager, runScript } from './package-manager.js';
import { addValidateScript } from './package-script.js';
import { wireRuntimeSkills, wireRuntimes } from './runtimes.js';
import { CORE_SKILLS, skillFolders } from './skill-sets.js';
import type { Summary } from './summary.js';
import { buildSummary, joinNames, runtimeName } from './summary.js';
import type { Context, Io, Runtime, StepResult } from './types.js';
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

/** What the person runs after a full scaffold: commit, initialize with `harness-init`, then check. */
function nextSteps(runtimes: Runtime[], hasScripts: boolean, manager: PackageManager): string[] {
  const names = joinNames(runtimes.map(runtimeName));
  const validate = hasScripts
    ? runScript(manager, 'harness:validate')
    : `${execBinary(manager, 'wolven-harness')} validate`;
  const score = hasScripts
    ? runScript(manager, 'harness:score')
    : executePackage(manager, manager === 'none' ? 'harness-score' : `harness-score@${HARNESS_SCORE_VERSION}`);
  return [
    'Review and commit the new files (git status shows them all).',
    `Open a fresh ${names} session in this repo and run the "harness-init" skill. It integrates WOLVEN.md into AGENTS.md, migrates any legacy ADRs, scores the harness, and asks before anything ambiguous.`,
    `Run \`${validate}\` any time to check the repo, and \`${score}\` to see how mature its harness is.`,
  ];
}

/** What the person runs outside a git top-level: `harness-init` turns the folder into the harness home. */
function outsideNextSteps(runtimes: Runtime[]): string[] {
  const names = joinNames(runtimes.map(runtimeName));
  return [
    `Open a fresh ${names} session in this folder and run the "harness-init" skill. It asks before "git init", then scaffolds the docs, rules and router around these skills.`,
    'The core skills are already in .agents/skills/, so the skill can run here.',
  ];
}

/** Paths that place this run outside a global install: a project binary folder or a package-manager cache. */
const NON_GLOBAL_EXEC = [
  /[/\\]node_modules[/\\]\.bin[/\\]/,
  /[/\\]node_modules[/\\]\.pnpm[/\\]/,
  /[/\\]pnpm[/\\]dlx[/\\]/,
  /[/\\]_npx[/\\]/,
  /[/\\]_cacache[/\\]/,
];

/**
 * A hint naming the global install when the running script is a project
 * copy or a package-manager cache copy. A global install, or a runtime that
 * reports no executable path, gets no hint.
 */
export function globalInstallHint(execPath: string | undefined, manager: PackageManager): string | undefined {
  if (execPath === undefined) return undefined;
  if (!NON_GLOBAL_EXEC.some((pattern) => pattern.test(execPath))) return undefined;
  return `wolven-harness is running from a local copy, so it will not stay on PATH. Install it globally: ${globalAdd(manager, '@wolven-tech/harness')}`;
}

/** Summary for the outside mode: only the skills and skills links it wrote, with no docs or rules claims. */
function outsideSummary(apply: StepResult, wiring: StepResult): Summary {
  const done: string[] = [];
  const kept: string[] = [];

  const skills = new Set<string>();
  for (const rel of apply.created) {
    const name = /^\.agents\/skills\/([^/]+)\//.exec(rel)?.[1];
    if (name !== undefined) skills.add(name);
  }
  if (skills.size > 0) done.push(`${skills.size} core ${skills.size === 1 ? 'skill' : 'skills'} in .agents/skills/`);
  if (apply.skipped.length > 0) kept.push('.agents/skills (kept the files that already existed)');

  if (wiring.created.length > 0) done.push(`skills wired (${wiring.created.join(', ')})`);
  if (wiring.skipped.length > 0) kept.push(wiring.skipped.join(', '));

  return { done, kept, notes: [] };
}

/**
 * Runs `setup`'s steps in a fixed order: resolve options (prompting on a
 * TTY), then either the full scaffold at a git top-level or, outside one,
 * only the core skills, the runtime skills wiring and the config. The full scaffold applies the templates, wires the runtimes,
 * adds the harness scripts; both modes then report
 * a grouped summary, any warnings, and the commands to run after setup.
 * `--verbose` also lists every file; `--debug` (or `WOLVEN_HARNESS_DEBUG=1`)
 * traces each step on stderr.
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
    "I'll set up your agent harness here: the .agents/ source tree, the docs/ folders and WOLVEN.md at a git top-level,",
    'or only the core skills and their runtime links outside one. Nothing is committed, and existing files are never overwritten.',
  ]);

  try {
    const opts = await traced(io, debug, 'resolveOptions', () => resolveOptions(argv, ctx));
    const outside = opts.mode === 'outside';
    const manager = await traced(io, debug, 'recordedPackageManager', () => recordedPackageManager(ctx.root));
    const wiredNames = opts.runtimes.map(runtimeName).join(' / ');

    if (outside) {
      ui.warn(
        'This folder is not a git top-level, so setup writes only the core skills, the runtime skills wiring, .wolven-harness.json. Run the "harness-init" skill here to scaffold the rest.',
      );
    }

    const applyResult = await ui.phase(
      outside ? 'Copying the core skills' : 'Copying skills and rules',
      outside ? 'Copied the core skills' : 'Copied skills and rules',
      () =>
        traced(io, debug, 'applyTemplates', () =>
          outside
            ? applyTemplates(ctx, CORE_SKILLS, undefined, { skillsOnly: true })
            : applyTemplates(ctx, skillFolders(opts.skillSets), opts.skillSets),
        ),
    );
    const runtimeResult = await ui.phase(`Wiring ${wiredNames}`, `Wired ${wiredNames}`, () =>
      traced(io, debug, 'wireRuntimes', () => (outside ? wireRuntimeSkills(opts, ctx) : wireRuntimes(opts, ctx))),
    );

    if (outside) {
      ui.summary(outsideSummary(applyResult, runtimeResult));
      if (verbose)
        ui.files(
          [...applyResult.created, ...runtimeResult.created],
          [...applyResult.skipped, ...runtimeResult.skipped],
        );
      const hint = globalInstallHint(io.execPath, manager);
      if (hint !== undefined) ui.warn(hint);
      ui.nextSteps(outsideNextSteps(opts.runtimes));
      return 0;
    }

    const scriptResult = await ui.phase('Adding package scripts', 'Checked package scripts', () =>
      traced(io, debug, 'addValidateScript', () => addValidateScript(ctx)),
    );
    const warning = await traced(io, debug, 'devDependencyWarning', () => devDependencyWarning(ctx, manager));
    const scoreWarning = await traced(io, debug, 'harnessScoreWarning', () => harnessScoreWarning(ctx, manager));
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
    const hint = globalInstallHint(io.execPath, manager);
    if (hint !== undefined) ui.warn(hint);
    const hasScripts = scriptResult.created.length + scriptResult.skipped.length > 0;
    ui.nextSteps(nextSteps(opts.runtimes, hasScripts, manager));
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

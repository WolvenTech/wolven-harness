import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONFIG_FILENAME, type Config, readConfig } from '../setup/config.js';
import { resolveOwnPackage } from '../setup/own-package.js';
import type { Io } from '../setup/types.js';
import { SetupError } from '../setup/types.js';
import { runDriftChecks } from './drift.js';
import { runEnvChecks } from './env-checks.js';
import type { DoctorFinding } from './report.js';
import { exitCode, formatFinding, summaryLine } from './report.js';
import { runRuntimeChecks } from './runtime-checks.js';

const USAGE = 'Usage: wolven-harness doctor [--dir <path>]';

/** Everything a check may read; it writes nothing. */
export interface DoctorContext {
  /** The folder doctor ran in. */
  root: string;
  /** The folder holding `.agents/`, `docs/` and `.qmd/`: `root`, or `harnessHome` for a linked layout. */
  harnessHome: string;
  config: Config;
  /** Environment variables; the real CLI passes `process.env`. */
  env: Record<string, string | undefined>;
  /** The running script's path, when one was reported. */
  execPath?: string;
  /** The package's `templates/` folder, for the current shipped copy of each file. */
  templatesDir: string;
  /** This CLI's own version, for the version-behind warning. */
  packageVersion: string;
}

/** One read-only check: it returns findings instead of throwing. */
export type DoctorCheck = (ctx: DoctorContext) => Promise<DoctorFinding[]> | DoctorFinding[];

/** The checks a default run executes, in output order. */
export const DEFAULT_CHECKS: readonly DoctorCheck[] = [runRuntimeChecks, runEnvChecks, runDriftChecks];

/** Resolves `templates/` the way `setup` does: two directories below the package root. */
function resolveTemplatesDir(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '..', '..', 'templates');
}

interface DoctorArgs {
  dir?: string;
}

/** Parses `[--dir <path>]`; a string return is the error to print. */
function parseArgs(argv: string[]): DoctorArgs | string {
  let dir: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] ?? '';

    if (arg === '--dir') {
      const value = argv[++i];
      if (value === undefined || value.length === 0) return 'missing value for --dir';
      dir = value;
    } else if (arg.startsWith('--dir=')) {
      const value = arg.slice('--dir='.length);
      if (value.length === 0) return 'missing value for --dir';
      dir = value;
    } else {
      return `unknown option "${arg}"`;
    }
  }

  return { dir };
}

/** Reads the config, turning the missing and invalid cases into the one `doctor-config` finding. */
async function readDoctorConfig(root: string): Promise<{ config: Config } | { finding: DoctorFinding }> {
  try {
    const config = await readConfig(root);
    if (config !== undefined) return { config };
    return {
      finding: {
        level: 'error',
        code: 'doctor-config',
        message: `${CONFIG_FILENAME} not found in ${root}`,
        fix: 'run "wolven-harness setup" in this folder first',
      },
    };
  } catch (err) {
    const message = err instanceof SetupError ? err.message : `${CONFIG_FILENAME} could not be read`;
    return {
      finding: {
        level: 'error',
        code: 'doctor-config',
        message,
        fix: `fix ${CONFIG_FILENAME} and re-run "wolven-harness doctor"`,
      },
    };
  }
}

/**
 * Runs `doctor`: parses the one flag, reads the config, runs the checks in
 * order, prints each finding then the summary line, and returns the exit
 * code. A missing or invalid config prints only `doctor-config` and stops.
 */
export async function runDoctor(
  argv: string[],
  io: Io,
  checks: readonly DoctorCheck[] = DEFAULT_CHECKS,
): Promise<number> {
  const parsed = parseArgs(argv);
  if (typeof parsed === 'string') {
    io.stderr.write(`wolven-harness doctor: ${parsed}\n${USAGE}\n`);
    return 1;
  }

  const root = path.resolve(io.cwd, parsed.dir ?? '.');
  const findings: DoctorFinding[] = [];
  const read = await readDoctorConfig(root);

  if ('finding' in read) {
    findings.push(read.finding);
  } else {
    const { config } = read;
    const harnessHome =
      config.layout === 'linked' && config.harnessHome !== undefined ? path.resolve(root, config.harnessHome) : root;
    const { version } = await resolveOwnPackage();
    const ctx: DoctorContext = {
      root,
      harnessHome,
      config,
      env: io.env ?? {},
      execPath: io.execPath,
      templatesDir: resolveTemplatesDir(),
      packageVersion: version,
    };

    for (const check of checks) {
      findings.push(...(await check(ctx)));
    }
  }

  for (const finding of findings) {
    io.stdout.write(`${formatFinding(finding).join('\n')}\n`);
  }
  io.stdout.write(`${summaryLine(findings)}\n`);

  return exitCode(findings);
}

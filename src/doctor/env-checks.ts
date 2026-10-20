import { constants } from 'node:fs';
import { access, stat } from 'node:fs/promises';
import path from 'node:path';
import { execGit } from '../git.js';
import { pathExists } from '../path-exists.js';
import type { DoctorContext } from './index.js';
import type { DoctorCode, DoctorFinding } from './report.js';

/**
 * Paths only the harness writes. Finding one inside the code repository
 * means the harness home and the repository overlap, which no harness step
 * may create.
 */
const HARNESS_PATHS = [
  '.agents',
  '.claude',
  '.kiro',
  '.wolven-harness.json',
  '.wolven-harness.manifest.json',
  'WOLVEN.md',
  '.qmd',
];

function failed(code: DoctorCode, message: string, fix: string): DoctorFinding {
  return { level: 'error', code, message, fix };
}

/** True when `name` resolves to an executable file in one of the injected `PATH` folders. */
async function findOnPath(name: string, env: Record<string, string | undefined>): Promise<string | undefined> {
  const raw = env.PATH;
  if (raw === undefined || raw.length === 0) return undefined;

  for (const dir of raw.split(path.delimiter)) {
    if (dir.length === 0) continue;
    const candidate = path.join(dir, name);
    try {
      if (!(await stat(candidate)).isFile()) continue;
      await access(candidate, constants.X_OK);
      return candidate;
    } catch {
      // why: a missing or non-executable candidate is not this tool; the next PATH entry may be.
    }
  }
  return undefined;
}

/** `doctor-docs`: `docs/` is a committed, unignored path inside a git repository. */
async function checkDocs(harnessHome: string): Promise<DoctorFinding[]> {
  const docs = path.join(harnessHome, 'docs');
  if (!(await pathExists(docs))) {
    return [
      failed(
        'doctor-docs',
        'docs/ is missing from the harness home',
        'run "wolven-harness setup", then "harness-init"',
      ),
    ];
  }

  try {
    await execGit(docs, ['rev-parse', '--show-toplevel']);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return [
        failed(
          'doctor-docs',
          'git is not installed or not on PATH',
          'install git, then run "wolven-harness doctor" again',
        ),
      ];
    }
    return [
      failed(
        'doctor-docs',
        'docs/ is not inside a git repository',
        'run "git init" in the harness home and commit once',
      ),
    ];
  }

  try {
    await execGit(docs, ['rev-parse', '--verify', 'HEAD']);
  } catch {
    return [
      failed(
        'doctor-docs',
        'the docs repository has no commits yet',
        'commit the harness files once, then run doctor again',
      ),
    ];
  }

  let ignored: string | undefined;
  try {
    const { stdout } = await execGit(harnessHome, ['check-ignore', '--', 'docs']);
    ignored = stdout.trim() || undefined;
  } catch {
    // why: check-ignore exits 1 when the path is not ignored, which is the healthy case.
  }

  if (ignored !== undefined) {
    return [
      failed(
        'doctor-docs',
        'docs/ is ignored, so teammates and CI never get it',
        'remove the ignore rule for docs/ ("git check-ignore -v docs" names it)',
      ),
    ];
  }
  return [];
}

/** `doctor-qmd`: the `qmd` binary is on `PATH` and the knowledge index exists in the harness home. */
async function checkQmd(ctx: DoctorContext): Promise<DoctorFinding[]> {
  const findings: DoctorFinding[] = [];

  if ((await findOnPath('qmd', ctx.env)) === undefined) {
    findings.push(
      failed(
        'doctor-qmd',
        'qmd is not on PATH, so the knowledge index cannot be searched',
        'install qmd and run "qmd update"',
      ),
    );
  }

  if (!(await pathExists(path.join(ctx.harnessHome, '.qmd', 'index.sqlite')))) {
    findings.push(
      failed(
        'doctor-qmd',
        '.qmd/index.sqlite is missing, so the index has no content',
        'run "qmd update", then "qmd embed"',
      ),
    );
  }

  return findings;
}

/** `doctor-code-repo`: no harness path sits inside the code repository the install serves. */
async function checkCodeRepo(ctx: DoctorContext): Promise<DoctorFinding[]> {
  if (ctx.config.codeRepo === undefined) return [];

  const codeRepo = path.resolve(ctx.root, ctx.config.codeRepo);
  const findings: DoctorFinding[] = [];

  for (const rel of HARNESS_PATHS) {
    if (!(await pathExists(path.join(codeRepo, rel)))) continue;
    findings.push(
      failed(
        'doctor-code-repo',
        `a harness path exists inside the code repository: ${rel}`,
        `move ${rel} out of ${codeRepo}; the harness home must sit outside it`,
      ),
    );
  }

  return findings;
}

/** `doctor-not-global`: warn when `wolven-harness` is not reachable from `PATH`. */
async function checkNotGlobal(ctx: DoctorContext): Promise<DoctorFinding[]> {
  if ((await findOnPath('wolven-harness', ctx.env)) !== undefined) return [];
  return [
    {
      level: 'warn',
      code: 'doctor-not-global',
      message: 'wolven-harness is not on PATH, so a fresh terminal cannot run it',
    },
  ];
}

/**
 * Checks the docs repository, `qmd`, the code repository and the global
 * install: the environment an install needs outside its own files. A missing
 * tool or unreadable path is a finding, never a throw.
 */
export async function runEnvChecks(ctx: DoctorContext): Promise<DoctorFinding[]> {
  const docs = await checkDocs(ctx.harnessHome);
  const qmd = await checkQmd(ctx);
  const codeRepo = await checkCodeRepo(ctx);
  const notGlobal = await checkNotGlobal(ctx);

  return [...docs, ...qmd, ...codeRepo, ...notGlobal];
}

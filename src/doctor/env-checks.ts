import { constants } from 'node:fs';
import { access, readdir, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { execGit } from '../git.js';
import { pathExists } from '../path-exists.js';
import { globalInstallHint } from '../setup/index.js';
import { recordedPackageManager } from '../setup/package-manager.js';
import { RUNTIME_REGISTRY } from '../setup/runtimes.js';
import type { DoctorContext } from './index.js';
import type { DoctorCode, DoctorFinding } from './report.js';

/** The harness's own files; runtime wiring comes from the registry. */
const HARNESS_PATHS = ['.agents', '.wolven-harness.json', 'WOLVEN.md', '.qmd'];

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

/** `doctor-qmd`: qmd can reach the harness home's configured index from the open folder. */
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

  const homeQmd = path.join(ctx.harnessHome, '.qmd');
  if (!(await pathExists(path.join(homeQmd, 'index.sqlite')))) {
    findings.push(
      failed(
        'doctor-qmd',
        '.qmd/index.sqlite is missing, so the index has no content',
        'run "qmd update", then "qmd embed"',
      ),
    );
  }

  let nearestQmd: string | undefined;
  let folder = path.resolve(ctx.root);
  while (true) {
    const qmd = path.join(folder, '.qmd');
    if ((await pathExists(path.join(qmd, 'index.yaml'))) || (await pathExists(path.join(qmd, 'index.yml')))) {
      nearestQmd = qmd;
      break;
    }
    const parent = path.dirname(folder);
    if (parent === folder) break;
    folder = parent;
  }

  if (nearestQmd === undefined) {
    findings.push(
      failed(
        'doctor-qmd',
        'qmd cannot find .qmd/index.yaml or .qmd/index.yml from the open folder',
        'link .qmd from the harness home into the open folder, or run "qmd update" in the open folder',
      ),
    );
  } else {
    try {
      const [found, expected] = await Promise.all([realpath(nearestQmd), realpath(homeQmd)]);
      if (found !== expected) {
        findings.push(
          failed(
            'doctor-qmd',
            'qmd finds a .qmd index that does not belong to the harness home',
            'remove or move the nearer .qmd folder, then link .qmd from the harness home into the open folder',
          ),
        );
      }
    } catch {
      findings.push(
        failed(
          'doctor-qmd',
          'qmd cannot resolve the .qmd index from the open folder',
          'link .qmd from the harness home into the open folder, then run "qmd update"',
        ),
      );
    }
  }

  return findings;
}

/** True when `link` resolves to a location inside `home`. */
async function resolvesInto(link: string, home: string): Promise<boolean> {
  try {
    const [target, base] = await Promise.all([realpath(link), realpath(home)]);
    const rel = path.relative(base, target);
    return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
  } catch {
    // why: a dangling link or unreadable path cannot be shown to point at the harness home.
    return false;
  }
}

/** Project-relative paths in `codeRepo` that the registry says setup writes for a runtime. */
async function runtimeWiringPaths(codeRepo: string, harnessHome: string): Promise<string[]> {
  const found = new Set<string>();

  for (const row of RUNTIME_REGISTRY) {
    const links = [row.skills, row.rules].flatMap((wiring) =>
      wiring.kind === 'symlink' || wiring.kind === 'link' ? [wiring.path] : [],
    );
    for (const rel of links) {
      if (await resolvesInto(path.join(codeRepo, rel), harnessHome)) found.add(rel);
    }

    if (row.rules.kind !== 'per-rule') continue;
    const slash = row.rules.pattern.lastIndexOf('/');
    const dir = row.rules.pattern.slice(0, slash);
    const [prefix, suffix] = row.rules.pattern.slice(slash + 1).split('{rule}');
    let names: string[] = [];
    try {
      names = await readdir(path.join(codeRepo, dir));
    } catch {
      // why: a missing wiring folder means no wiring files, not a failure.
    }
    for (const name of names) {
      if (name.startsWith(prefix) && name.endsWith(suffix) && name.length > prefix.length + suffix.length) {
        found.add(`${dir}/${name}`);
      }
    }
  }

  return [...found];
}

/** `doctor-code-repo`: no harness-owned path sits inside the code repository the install serves. */
async function checkCodeRepo(ctx: DoctorContext): Promise<DoctorFinding[]> {
  if (ctx.config.codeRepo === undefined) return [];

  const codeRepo = path.resolve(ctx.root, ctx.config.codeRepo);
  const owned: string[] = [];

  for (const rel of HARNESS_PATHS) {
    if (await pathExists(path.join(codeRepo, rel))) owned.push(rel);
  }
  owned.push(...(await runtimeWiringPaths(codeRepo, ctx.harnessHome)));

  return owned.map((rel) =>
    failed(
      'doctor-code-repo',
      `a harness path exists inside the code repository: ${rel}`,
      `move ${rel} out of ${codeRepo}; the harness home must sit outside it`,
    ),
  );
}

/** `doctor-not-global`: warn when `wolven-harness` is not reachable from `PATH`. */
async function checkNotGlobal(ctx: DoctorContext): Promise<DoctorFinding[]> {
  if ((await findOnPath('wolven-harness', ctx.env)) !== undefined) return [];
  const hint = globalInstallHint(ctx.execPath, await recordedPackageManager(ctx.root));
  return [
    {
      level: 'warn',
      code: 'doctor-not-global',
      message: `wolven-harness is not on PATH, so a fresh terminal cannot run it${hint === undefined ? '' : `. ${hint}`}`,
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

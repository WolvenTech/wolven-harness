import { createHash } from 'node:crypto';
import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gitTopLevel } from '../git.js';
import { isQuietMapped, type SelectedTemplateFile, selectTemplateFiles } from '../setup/apply.js';
import { homeInsideRoot } from '../setup/config.js';
import { mapQuietInstallPaths } from '../setup/path-map.js';
import { renderQmdIndex } from '../setup/render-wolven.js';
import { type SkillSet, skillFolders } from '../setup/skill-sets.js';
import type { DoctorContext } from './index.js';
import type { DoctorFinding } from './report.js';

/** The router file `harness-init` folds into `AGENTS.md` and then deletes. */
const WOLVEN_MD = 'WOLVEN.md';

/** The template `setup` renders with `applySetMarkers` rather than copying. */
const QMD_INDEX = '.qmd/index.yml';

interface KnownForms {
  forms: Record<string, string[]>;
}

/** sha-256 hex of installed bytes. */
function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

/** Resolves the package data file from either `src/doctor` or `dist/doctor`. */
function knownFormsPath(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'known-forms.json');
}

/** Files `setup` selected for this install, excluding its discovery-only path. */
async function expectedFiles(ctx: DoctorContext): Promise<SelectedTemplateFile[]> {
  const sets = (ctx.config.skillSets ?? []) as readonly SkillSet[];
  return (await selectTemplateFiles(ctx.templatesDir, skillFolders(sets), sets)).filter(
    ({ installed }) => installed !== 'AGENTS.md',
  );
}

/** Reads a file's bytes, or `undefined` when it is absent or unreadable. */
async function readBytes(file: string): Promise<Buffer | undefined> {
  try {
    return await readFile(file);
  } catch {
    return undefined;
  }
}

/** Reads a file's text, or `undefined` when it is absent or unreadable. */
async function readText(file: string): Promise<string | undefined> {
  try {
    return await readFile(file, 'utf8');
  } catch {
    return undefined;
  }
}

/** A dotted numeric version as numbers, or `undefined` when any part is not a number. */
function versionParts(version: string): number[] | undefined {
  const parts = version.split('.');
  if (parts.length === 0 || !parts.every((part) => /^\d+$/.test(part))) return undefined;
  return parts.map(Number);
}

/** True when `recorded` is a dotted numeric version older than `running`; unparseable either side is `false`. */
function isOlder(recorded: string, running: string): boolean {
  const left = versionParts(recorded);
  const right = versionParts(running);
  if (left === undefined || right === undefined) return false;

  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const a = left[i] ?? 0;
    const b = right[i] ?? 0;
    if (a !== b) return a < b;
  }
  return false;
}

/** The shipped historical forms; an unreadable or malformed file holds none. */
async function readKnownForms(file: string): Promise<KnownForms> {
  try {
    const parsed = JSON.parse(await readFile(file, 'utf8')) as Partial<KnownForms> | null;
    return { forms: parsed?.forms ?? {} };
  } catch {
    return { forms: {} };
  }
}

/**
 * Compares installed files with current templates and shipped historical
 * forms. All findings are warnings, so they never change the exit code.
 * Without readable known forms, a changed file is reported as edited.
 */
export async function runDriftChecks(
  ctx: DoctorContext,
  knownFormsFile: string = knownFormsPath(),
): Promise<DoctorFinding[]> {
  const findings: DoctorFinding[] = [];
  const linked = ctx.config.layout === 'linked' && ctx.harnessHome !== ctx.root;
  const baseDir = linked ? ctx.harnessHome : ctx.root;
  let quiet = false;
  if (linked) {
    try {
      const root = await realpath(await gitTopLevel(ctx.root));
      quiet = homeInsideRoot(root, await realpath(ctx.harnessHome)) !== undefined;
    } catch {
      quiet = false;
    }
  }
  const sets = (ctx.config.skillSets ?? []) as readonly SkillSet[];
  const known = await readKnownForms(knownFormsFile);

  const recorded = ctx.config.packageVersion;
  if (recorded !== undefined && isOlder(recorded, ctx.packageVersion)) {
    findings.push({
      level: 'warn',
      code: 'doctor-version-behind',
      message: `the install records version ${recorded}, older than this CLI's ${ctx.packageVersion}; run "wolven-harness setup" to refresh it`,
    });
  }

  for (const { source, installed } of await expectedFiles(ctx)) {
    const bytes = await readBytes(path.join(baseDir, ...installed.split('/')));
    const templateText = await readText(path.join(ctx.templatesDir, ...source.split('/')));

    // why: setup renders WOLVEN.md's skills table and harness-init deletes it
    // after the fold, so neither its absence nor its bytes say anything.
    if (installed === WOLVEN_MD) continue;

    if (bytes === undefined) {
      findings.push({
        level: 'warn',
        code: 'doctor-drift-missing',
        message: `${installed} is missing; the current template ships it`,
      });
      continue;
    }

    const expectedText =
      quiet && isQuietMapped(installed) && templateText !== undefined
        ? mapQuietInstallPaths(templateText)
        : templateText;
    const expectedBytes =
      installed === QMD_INDEX && templateText !== undefined
        ? Buffer.from(renderQmdIndex(templateText, sets, quiet), 'utf8')
        : expectedText === undefined
          ? undefined
          : Buffer.from(expectedText, 'utf8');
    if (expectedBytes !== undefined && bytes.equals(expectedBytes)) continue;

    const forms = known.forms[installed] ?? [];
    if (forms.includes(sha256(bytes))) {
      findings.push({
        level: 'warn',
        code: 'doctor-drift-stale',
        message: `${installed} matches a previous template; ask your agent to run the harness-doctor skill to refresh it`,
      });
    } else {
      findings.push({
        level: 'warn',
        code: 'doctor-drift-edited',
        message: `${installed} differs from the current template`,
      });
    }
  }

  return findings;
}

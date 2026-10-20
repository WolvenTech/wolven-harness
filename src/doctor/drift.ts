import { createHash } from 'node:crypto';
import type { Dirent } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { MANIFEST_FILENAME, type ManifestFiles } from '../setup/manifest.js';
import { applySetMarkers } from '../setup/render-wolven.js';
import { SET_PATHS, SKILL_SETS, type SkillSet, skillFolders } from '../setup/skill-sets.js';
import type { DoctorContext } from './index.js';
import type { DoctorFinding } from './report.js';

/** Template files that ship under a different installed name, as `setup` maps them. */
const INSTALLED_AS: Record<string, string> = {
  '.qmd/gitignore': '.qmd/.gitignore',
  'docs/maps/gitignore': 'docs/maps/.gitignore',
};

/** The router file `harness-init` folds into `AGENTS.md` and then deletes. */
const WOLVEN_MD = 'WOLVEN.md';

/** The template `setup` renders with `applySetMarkers` rather than copying. */
const QMD_INDEX = '.qmd/index.yml';

/** One template file and the path it installs to, relative to the install root. */
interface ExpectedFile {
  template: string;
  installed: string;
}

function toPosix(rel: string): string {
  return rel.split(path.sep).join('/');
}

/** Regular files under `dir`, `/`-joined and sorted; an absent or unreadable folder yields none. */
async function listFiles(dir: string): Promise<string[]> {
  let entries: Dirent[];
  try {
    entries = await readdir(dir, { recursive: true, withFileTypes: true });
  } catch {
    return [];
  }

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => toPosix(path.relative(dir, path.join(entry.parentPath, entry.name))))
    .sort();
}

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
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

/**
 * The manifest's `files` map beside `dir`, or `undefined` when the manifest
 * is absent or malformed. why: a consumer may delete or edit the manifest,
 * and the contract then treats every differing file as edited.
 */
async function readManifest(dir: string): Promise<ManifestFiles | undefined> {
  const raw = await readText(path.join(dir, MANIFEST_FILENAME));
  if (raw === undefined) return undefined;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return undefined;
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return undefined;
  const files = (parsed as { files?: unknown }).files;
  if (typeof files !== 'object' || files === null || Array.isArray(files)) return undefined;

  return Object.fromEntries(
    Object.entries(files).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  );
}

/**
 * The files this install is expected to hold, mapped from the current
 * templates the way `setup` maps them: skill folders the config does not
 * select and the discovery-only paths are left out, because `setup` never
 * wrote them.
 */
async function expectedFiles(ctx: DoctorContext): Promise<ExpectedFile[]> {
  const sets = (ctx.config.skillSets ?? []) as readonly SkillSet[];
  const chosenSkills = new Set(skillFolders(sets));
  const files: ExpectedFile[] = [];

  for (const template of await listFiles(ctx.templatesDir)) {
    const installed = INSTALLED_AS[template] ?? template;
    if (installed === 'AGENTS.md') continue;

    const skill = /^\.agents\/skills\/([^/]+)\//.exec(installed)?.[1];
    if (skill !== undefined && !chosenSkills.has(skill)) continue;

    const unchosen = SKILL_SETS.some(
      (set) => !sets.includes(set) && SET_PATHS[set].some((p) => installed.startsWith(p)),
    );
    if (unchosen) continue;

    files.push({ template, installed });
  }

  return files;
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

/**
 * Compares installed files with their manifest entries and the current
 * templates, and reports the version-behind warning. All findings are
 * warnings, so they never change the exit code.
 */
export async function runDriftChecks(ctx: DoctorContext): Promise<DoctorFinding[]> {
  const findings: DoctorFinding[] = [];
  const linked = ctx.config.layout === 'linked' && ctx.harnessHome !== ctx.root;
  const rootManifest = await readManifest(ctx.root);
  const manifest = rootManifest ?? (linked ? await readManifest(ctx.harnessHome) : undefined);
  const baseDir = rootManifest !== undefined || !linked ? ctx.root : ctx.harnessHome;
  const sets = (ctx.config.skillSets ?? []) as readonly SkillSet[];

  const recorded = ctx.config.packageVersion;
  if (recorded !== undefined && isOlder(recorded, ctx.packageVersion)) {
    findings.push({
      level: 'warn',
      code: 'doctor-version-behind',
      message: `the install records version ${recorded}, older than this CLI's ${ctx.packageVersion}; run "wolven-harness setup" to refresh it`,
    });
  }

  for (const { template, installed } of await expectedFiles(ctx)) {
    const bytes = await readBytes(path.join(baseDir, ...installed.split('/')));
    const templateText = await readText(path.join(ctx.templatesDir, ...template.split('/')));

    // why: setup renders WOLVEN.md's skills table and harness-init deletes it
    // after the fold, so its absence is healthy and its bytes never equal the
    // raw template; only a consumer edit is worth reporting.
    if (installed === WOLVEN_MD) {
      if (bytes !== undefined && manifest !== undefined) {
        const entry = manifest[installed];
        if (entry !== undefined && sha256(bytes) !== entry) {
          findings.push({
            level: 'warn',
            code: 'doctor-drift-edited',
            message: `${installed} was edited after setup wrote it`,
          });
        }
      }
      continue;
    }

    if (bytes === undefined) {
      findings.push({
        level: 'warn',
        code: 'doctor-drift-missing',
        message: `${installed} is missing; the current template ships it`,
      });
      continue;
    }

    const expectedText =
      installed === QMD_INDEX && templateText !== undefined ? applySetMarkers(templateText, sets) : templateText;
    const matchesTemplate = expectedText !== undefined && bytes.equals(Buffer.from(expectedText, 'utf8'));
    const entry = manifest?.[installed];

    if (entry !== undefined) {
      if (sha256(bytes) !== entry) {
        findings.push({
          level: 'warn',
          code: 'doctor-drift-edited',
          message: `${installed} was edited after setup wrote it`,
        });
      } else if (expectedText !== undefined && !matchesTemplate) {
        findings.push({
          level: 'warn',
          code: 'doctor-drift-stale',
          message: `${installed} matches what setup wrote but not the current template; harness-doctor can refresh it`,
        });
      }
    } else if (expectedText !== undefined && !matchesTemplate) {
      findings.push({
        level: 'warn',
        code: 'doctor-drift-edited',
        message: `${installed} differs from the current template`,
      });
    }
  }

  return findings;
}

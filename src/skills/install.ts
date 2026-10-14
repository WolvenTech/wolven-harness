import type { Dirent } from 'node:fs';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathExists } from '../path-exists.js';
import { canPrompt } from '../setup/options.js';
import type { Io } from '../setup/types.js';
import { clackPrompter } from '../setup/ui.js';
import type { SkillChoices, SkillScope } from './parse.js';

/**
 * Home for global load paths. `io.env.HOME` is the value the CLI passes from
 * the environment; `os.homedir()` applies when that variable is unset.
 */
function globalHome(io: Io): string {
  const home = io.env?.HOME;
  if (home !== undefined && home.length > 0) return home;
  return homedir();
}

/** Package tree `templates/.agents/skills`, two directories above this module. */
function resolvePackageSkillsDir(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '..', '..', 'templates', '.agents', 'skills');
}

function loadRoot(scope: SkillScope, projectRoot: string, home: string): string {
  return scope === 'project' ? projectRoot : home;
}

/**
 * Directories a runtime already reads for one skill. Claude uses
 * `.claude/skills/<skill>/`; Codex and Cursor share `.agents/skills/<skill>/`.
 * Project paths are under `projectRoot` and global paths under `home`.
 * The same directory is listed once.
 */
function destinationDirs(choices: SkillChoices, projectRoot: string, home: string): string[] {
  const dirs: string[] = [];
  for (const skill of choices.skills) {
    for (const scope of choices.scopes) {
      const root = loadRoot(scope, projectRoot, home);
      for (const runtime of choices.runtimes) {
        const base = runtime === 'claude' ? '.claude' : '.agents';
        const dir = path.join(root, base, 'skills', skill);
        if (!dirs.includes(dir)) dirs.push(dir);
      }
    }
  }
  return dirs;
}

async function copyTree(source: string, dest: string): Promise<void> {
  await mkdir(dest, { recursive: true });
  const entries: Dirent[] = await readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    const from = path.join(source, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyTree(from, to);
      continue;
    }
    // why: a symlink in the package skill tree is not a file to copy.
    if (entry.isFile()) await writeFile(to, await readFile(from));
  }
}

async function listFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(current: string, prefix: string): Promise<void> {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const rel = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
      if (entry.isDirectory()) await walk(path.join(current, entry.name), rel);
      else if (entry.isFile()) out.push(rel);
    }
  }
  await walk(dir, '');
  out.sort();
  return out;
}

/** True when every relative path and file byte in `dest` matches `source`. */
async function sameTree(source: string, dest: string): Promise<boolean> {
  const sourceFiles = await listFiles(source);
  const destFiles = await listFiles(dest);
  if (sourceFiles.length !== destFiles.length) return false;
  for (let i = 0; i < sourceFiles.length; i++) {
    if (sourceFiles[i] !== destFiles[i]) return false;
    const from = path.join(source, sourceFiles[i] ?? '');
    const to = path.join(dest, destFiles[i] ?? '');
    if (!Buffer.from(await readFile(from)).equals(Buffer.from(await readFile(to)))) return false;
  }
  return true;
}

/**
 * Copies missing skill folders. A differing folder is replaced only after a
 * yes for that path. Questions run before any write. A cancel writes nothing.
 * With no terminal, a differing folder stays and a missing one is still added.
 */
export async function installChoices(choices: SkillChoices, io: Io): Promise<'ok' | 'cancelled'> {
  const packageSkills = resolvePackageSkillsDir();
  const home = globalHome(io);
  const copies: { source: string; dest: string; replace: boolean }[] = [];
  const asks: { source: string; dest: string }[] = [];

  for (const dest of destinationDirs(choices, io.cwd, home).sort()) {
    const source = path.join(packageSkills, path.basename(dest));
    if (!(await pathExists(dest))) {
      copies.push({ source, dest, replace: false });
      continue;
    }
    if (await sameTree(source, dest)) continue;
    if (!canPrompt(io)) continue;
    asks.push({ source, dest });
  }

  const prompter = io.prompts ?? clackPrompter(io);
  for (const ask of asks) {
    const answer = await prompter.select<'yes' | 'no'>({
      message: `Replace ${ask.dest}?`,
      options: [
        { value: 'yes', label: 'yes' },
        { value: 'no', label: 'no' },
      ],
    });
    if (answer === undefined) return 'cancelled';
    if (answer === 'yes') copies.push({ source: ask.source, dest: ask.dest, replace: true });
  }

  for (const copy of copies) {
    if (copy.replace) await rm(copy.dest, { recursive: true, force: true });
    await copyTree(copy.source, copy.dest);
  }
  return 'ok';
}

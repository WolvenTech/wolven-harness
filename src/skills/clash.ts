import { readdir, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { sameTree } from './install.js';

/**
 * Project-relative roots a runtime reads this project's skills from, in the
 * order a clash is reported against. `setup` wires the second as a symlink to
 * the first, so a wired repo resolves both to one tree.
 */
export const PROJECT_SKILL_ROOTS = ['.agents/skills', '.claude/skills'] as const;

/**
 * Home-relative roots scanned for a same-named copy. `.codex/skills` is read
 * by Cursor for compatibility and is not a documented Codex location; it is
 * scanned because a copy there can still be the one a runtime loads.
 */
export const USER_SKILL_ROOTS = ['.claude/skills', '.agents/skills', '.cursor/skills', '.codex/skills'] as const;

/** One same-named pair: a project skill and the user-level copy that may shadow it. */
export interface SkillClash {
  skill: string;
  projectPath: string;
  userPath: string;
}

/** The project root and the home directory a scan reads. */
export interface ClashScan {
  root: string;
  home: string;
}

interface Candidate {
  skill: string;
  literal: string;
  real: string;
}

/** True when `dir` resolves to a directory holding a readable `SKILL.md`. */
async function isSkillDir(dir: string): Promise<boolean> {
  try {
    if (!(await stat(dir)).isDirectory()) return false;
    await stat(path.join(dir, 'SKILL.md'));
    return true;
  } catch {
    return false;
  }
}

/** Every skill folder directly under `root`, following a symlinked entry or root. */
async function candidatesIn(root: string): Promise<Candidate[]> {
  const entries = await readdir(root, { withFileTypes: true }).catch(() => []);
  const out: Candidate[] = [];
  for (const entry of entries) {
    const literal = path.join(root, entry.name);
    if (!(await isSkillDir(literal))) continue;
    const real = await realpath(literal).catch(() => undefined);
    if (real === undefined) continue;
    out.push({ skill: entry.name, literal, real });
  }
  return out;
}

/**
 * Same-named project and user-level skills, sorted by skill name and then by
 * the user root order above. Three shapes are deliberately silent: a user
 * entry that resolves to the project's own file, a copy byte-identical to the
 * project's, and any entry that is not a skill folder. Every filesystem read
 * is best-effort, so a missing, unreadable or dangling directory contributes
 * nothing.
 */
export async function findSkillClashes({ root, home }: ClashScan): Promise<SkillClash[]> {
  const project: Candidate[] = [];
  for (const rel of PROJECT_SKILL_ROOTS) {
    for (const candidate of await candidatesIn(path.join(root, rel))) {
      if (!project.some((seen) => seen.real === candidate.real)) project.push(candidate);
    }
  }
  if (project.length === 0) return [];

  const byName = new Map<string, Candidate[]>();
  const seen = new Set<string>();
  for (const rel of USER_SKILL_ROOTS) {
    for (const candidate of await candidatesIn(path.join(home, rel))) {
      if (seen.has(candidate.real)) continue;
      seen.add(candidate.real);
      const list = byName.get(candidate.skill) ?? [];
      list.push(candidate);
      byName.set(candidate.skill, list);
    }
  }

  const clashes: SkillClash[] = [];
  for (const skill of [...byName.keys()].sort()) {
    const projectCopies = project.filter((candidate) => candidate.skill === skill);
    const projectCopy = projectCopies[0];
    if (projectCopy === undefined) continue;
    for (const user of byName.get(skill) ?? []) {
      if (projectCopies.some((copy) => copy.real === user.real)) continue;
      if (await sameTree(projectCopy.real, user.real)) continue;
      clashes.push({ skill, projectPath: projectCopy.literal, userPath: user.literal });
    }
  }
  return clashes;
}

/**
 * One note per clash for a human to act on: the skill, both paths, and the
 * order Claude Code documents. It names no removal command, because the
 * harness cannot tell a deliberate user-level install from a mistake, and it
 * says the scan is a snapshot so a later install is not read as clearance.
 */
export function clashNotes(clashes: SkillClash[]): string[] {
  return clashes.map(
    (clash) =>
      `"${clash.skill}" is installed at ${clash.projectPath} and at ${clash.userPath}. Claude Code loads the user-level copy first; .agents/rules/project-skill-precedence.md tells an agent to follow the project copy instead. This is your home directory as it is now, so a copy installed later goes unreported.`,
  );
}

/**
 * Clash notes for a project root and a home, or none. Never throws: both
 * callers promise an exit code, and a scan of someone's home directory is not
 * allowed to break it.
 */
export async function clashNotesFor({ root, home }: ClashScan): Promise<string[]> {
  try {
    return clashNotes(await findSkillClashes({ root, home }));
  } catch {
    return [];
  }
}

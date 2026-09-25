import { promises as fs } from 'node:fs';
import path from 'node:path';
import { InitError } from './types.js';
import type { Options, Context, StepResult } from './types.js';

/**
 * Injectable indirection over `fs.symlink`, so the forced-failure test can
 * simulate a platform that cannot create symlinks (e.g. EPERM on Windows)
 * without touching the real filesystem's permissions.
 */
type SymlinkImpl = (target: string, path: string, type?: 'dir' | 'file' | 'junction') => Promise<void>;

let symlinkImpl: SymlinkImpl = fs.symlink;

/** Test-only: override the symlink call. Pass `undefined` to restore the default. */
export function setSymlinkImpl(impl?: SymlinkImpl): void {
  symlinkImpl = impl ?? fs.symlink;
}

/**
 * Wires supported runtimes. Only `claude` needs anything: it
 * cannot read `.agents/skills/` natively, so it gets a relative directory
 * symlink `.claude/skills -> ../.agents/skills` and a `CLAUDE.md` stub.
 * `codex` and `cursor` read `.agents/skills/` natively — nothing is
 * created for them, and `.codex/`/`.cursor/` must never appear.
 */
export async function wireRuntimes(opts: Options, ctx: Context): Promise<StepResult> {
  const created: string[] = [];
  const skipped: string[] = [];

  if (opts.runtimes.includes('claude')) {
    await wireClaudeSkillsSymlink(ctx, created, skipped);
    await wireClaudeMd(ctx, created, skipped);
  }

  return { created, skipped };
}

async function wireClaudeSkillsSymlink(ctx: Context, created: string[], skipped: string[]): Promise<void> {
  const claudeDir = path.join(ctx.root, '.claude');
  const skillsLink = path.join(claudeDir, 'skills');

  const exists = await pathExists(skillsLink);
  if (exists) {
    skipped.push('.claude/skills');
    return;
  }

  await fs.mkdir(claudeDir, { recursive: true });

  try {
    await symlinkImpl('../.agents/skills', skillsLink, 'dir');
  } catch {
    throw new InitError(
      'could not create the .claude/skills symlink: symlinks are required to wire the claude runtime, and v0 supports macOS and Linux only.',
    );
  }

  created.push('.claude/skills');
}

async function wireClaudeMd(ctx: Context, created: string[], skipped: string[]): Promise<void> {
  const claudeMdPath = path.join(ctx.root, 'CLAUDE.md');

  const exists = await pathExists(claudeMdPath);
  if (exists) {
    skipped.push('CLAUDE.md');
    return;
  }

  await fs.writeFile(claudeMdPath, '@AGENTS.md\n', 'utf8');
  created.push('CLAUDE.md');
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.lstat(target);
    return true;
  } catch {
    return false;
  }
}

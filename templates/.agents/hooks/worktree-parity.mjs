// why: usage is `node .agents/hooks/worktree-parity.mjs` as a SessionStart hook; it warns and never blocks, so it always exits 0.
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ENTRY_POINTS = [
  { rel: 'CLAUDE.local.md', what: 'the `CLAUDE.local.md` symlink' },
  { rel: path.join('.claude', 'rules'), what: 'the `.claude/rules/` folder of rule symlinks' },
];

/** The warning lines for each symlink the project folder lacks; empty when it is complete. */
export function warnings(projectDir) {
  return ENTRY_POINTS.filter(({ rel }) => !existsSync(path.join(projectDir, rel))).map(
    ({ rel, what }) =>
      `worktree-parity: ${what} is missing in ${projectDir}, so this session does not read the harness. ` +
      `Nothing changed. Next: copy \`${rel}\` from your main checkout, or ask your agent to run the \`harness-init\` skill to set up the symlinks and \`.worktreeinclude\`, which copies them into new worktrees.`,
  );
}

try {
  const lines = warnings(process.env.CLAUDE_PROJECT_DIR || process.cwd());
  if (lines.length > 0) process.stdout.write(`${lines.join('\n')}\n`);
} catch {
  // invariant: a failed check never blocks the session.
}
process.exit(0);

// why: usage is `node .agents/hooks/worktree-parity.mjs` as a SessionStart hook; it warns and never blocks, so it always exits 0.
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ENTRY_POINTS = ['CLAUDE.local.md', '.claude/rules/'];

/** The one warning naming every entry point the project folder lacks; empty when it is complete. */
export function warnings(projectDir) {
  const missing = ENTRY_POINTS.filter((rel) => !existsSync(path.join(projectDir, rel)));
  if (missing.length === 0) return [];
  const files = missing.join(', ');
  return [
    `This worktree is missing ${files}, so your agent may not have the harness here. Next: open a new worktree, or copy ${files} from your main checkout.`,
  ];
}

try {
  const [systemMessage] = warnings(process.env.CLAUDE_PROJECT_DIR || process.cwd());
  if (systemMessage) process.stdout.write(`${JSON.stringify({ systemMessage })}\n`);
} catch {
  // invariant: a failed check never blocks the session.
}
process.exit(0);

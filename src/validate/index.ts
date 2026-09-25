import type { Io } from '../init/types.js';
import { loadIgnoreConfig } from './config.js';
import { checkClaims } from './claims.js';
import { checkProfile } from './profile.js';
import { buildRepoContext, resolveGitRoot } from './repo.js';
import { summarizeFindings } from './report.js';
import type { Finding } from './report.js';
import { checkSpine } from './spine.js';

type ParsedArgs = { verbose: boolean } | { error: string };

/** Parses `--verbose`. Any other argument is an unknown-flag error. */
function parseArgs(argv: string[]): ParsedArgs {
  let verbose = false;
  for (const arg of argv) {
    if (arg === '--verbose') {
      verbose = true;
    } else {
      return { error: arg };
    }
  }
  return { verbose };
}

/**
 * Runs `validate`: resolves the git top-level (the claim gate requires
 * git), loads and guards the `ignore` config, builds the `RepoContext`, runs the
 * profile/spine/claims checks, and prints the report. Every path printed
 * is root-relative, so output is identical from any subdirectory.
 */
export async function runValidate(argv: string[], io: Io): Promise<number> {
  const parsed = parseArgs(argv);
  if ('error' in parsed) {
    io.stderr.write(`wolven-harness validate: unknown option "${parsed.error}"\n`);
    return 1;
  }
  const { verbose } = parsed;

  let root: string;
  try {
    root = await resolveGitRoot(io.cwd);
  } catch {
    io.stderr.write('wolven-harness validate: claim gate requires git\n');
    return 1;
  }

  const ignoreConfig = await loadIgnoreConfig(root);
  if (ignoreConfig.findings.length > 0) {
    const summary = summarizeFindings(ignoreConfig.findings, verbose);
    for (const line of summary.lines) io.stdout.write(`${line}\n`);
    io.stdout.write(`validate: ${summary.errorCount} error(s), ${summary.warnCount} warning(s)\n`);
    return 1;
  }

  const ctx = await buildRepoContext(root, { ignoreEntries: ignoreConfig.entries, verbose });

  const profileFindings = await checkProfile(ctx);
  const spineFindings = await checkSpine(ctx);
  const claimsResult = await checkClaims(ctx, profileFindings);

  const allFindings: Finding[] = [...profileFindings, ...spineFindings, ...claimsResult.findings];
  const summary = summarizeFindings(allFindings, verbose);

  for (const line of summary.lines) io.stdout.write(`${line}\n`);

  const { ok, legacyWarn, fail } = claimsResult.counts;
  io.stdout.write(`claims: ${ok} ok, ${legacyWarn} legacy-warn, ${fail} fail\n`);

  if (ctx.ignore.entries.length > 0) {
    io.stdout.write(`ignored: ${ctx.ignore.entries.join(', ')} (${ctx.ignore.count} files)\n`);
  }

  if (summary.errorCount === 0) {
    io.stdout.write('validate: ok\n');
  } else {
    io.stdout.write(`validate: ${summary.errorCount} error(s), ${summary.warnCount} warning(s)\n`);
  }

  return summary.errorCount > 0 ? 1 : 0;
}

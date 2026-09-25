import type { Io } from '../init/types.js';
import { resolveGitRoot } from '../validate/repo.js';
import { listChangedFiles, listAddedLines, resolveDefaultBase } from './diff.js';
import { scanAddedLines, BUILTIN_SYNTAX } from './rules.js';
import type { CommentFinding, CommentSyntax, SyntaxFor } from './rules.js';
import { loadCommentsScope, hasKnownSyntax, isInScope, CommentsConfigError, BUILTIN_EXTENSIONS } from './config.js';
import type { CommentsScope, LanguageSyntax } from './config.js';

type FileSelection = { files: string[]; skipped: number; syntaxFor: SyntaxFor };

function toCommentSyntax(syntax: LanguageSyntax): CommentSyntax {
  return { line: [syntax.line], block: syntax.block ? [syntax.block] : [], middle: [] };
}

/** Resolves the `CommentSyntax` a file is scanned with: the built-in syntax for a built-in extension, else its `comments.languages` entry. */
function syntaxForScope(scope: CommentsScope): SyntaxFor {
  return (file: string): CommentSyntax => {
    if (BUILTIN_EXTENSIONS.some((ext) => file.endsWith(ext))) return BUILTIN_SYNTAX;
    for (const [ext, syntax] of scope.languages) {
      if (file.endsWith(ext)) return toCommentSyntax(syntax);
    }
    return BUILTIN_SYNTAX;
  };
}

/**
 * Selects the files `comments` judges: every changed-or-untracked file that
 * is in the configured scope (the `comments.paths` prefixes, minus `ignore`
 * dirs, or every changed file when `paths` is unset) and whose extension
 * carries a known comment syntax. `skipped` counts in-scope files dropped
 * only for lacking a syntax.
 */
async function selectFiles(root: string, base: string): Promise<FileSelection> {
  const scope = await loadCommentsScope(root);
  const changed = await listChangedFiles(root, base);
  const scoped = changed.filter((file) => isInScope(file, scope));
  const files = scoped.filter((file) => hasKnownSyntax(file, scope));
  return { files, skipped: scoped.length - files.length, syntaxFor: syntaxForScope(scope) };
}

export type CommentsScanOptions = { root: string; base: string };

/** Lists every finding among the lines added since `base`. */
export async function findCommentFindings(opts: CommentsScanOptions): Promise<CommentFinding[]> {
  const { files, syntaxFor } = await selectFiles(opts.root, opts.base);
  const added = await listAddedLines(opts.root, files, opts.base);
  return scanAddedLines(added, opts.root, syntaxFor);
}

type ParsedArgs = { base?: string } | { error: string };

function parseArgs(argv: string[]): ParsedArgs {
  let base: string | undefined;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--base') {
      const value = argv[i + 1];
      if (value === undefined) return { error: '--base requires a value' };
      base = value;
      i += 1;
      continue;
    }
    return { error: arg as string };
  }
  return { base };
}

/**
 * Runs `comments`: resolves the git top-level, resolves the base ref (an
 * explicit `--base`, or the merge-base with `origin/HEAD`, `origin/main`,
 * or `main`, in that order), and prints one line per finding plus a
 * summary line.
 */
export async function runComments(argv: string[], io: Io): Promise<number> {
  const parsed = parseArgs(argv);
  if ('error' in parsed) {
    io.stderr.write(`wolven-harness comments: unknown option "${parsed.error}"\n`);
    return 1;
  }

  let root: string;
  try {
    root = await resolveGitRoot(io.cwd);
  } catch {
    io.stderr.write('wolven-harness comments: requires git\n');
    return 1;
  }

  let base: string;
  if (parsed.base !== undefined) {
    base = parsed.base;
  } else {
    const resolved = await resolveDefaultBase(root);
    if (resolved === null) {
      io.stderr.write(
        'wolven-harness comments: no origin/HEAD, origin/main, or main ref found to compute a base; pass --base <ref>.\n',
      );
      return 1;
    }
    base = resolved;
  }

  let selection: FileSelection;
  try {
    selection = await selectFiles(root, base);
  } catch (err) {
    if (err instanceof CommentsConfigError) {
      io.stderr.write(`wolven-harness comments: ${err.message}\n`);
      return 1;
    }
    throw err;
  }

  const added = await listAddedLines(root, selection.files, base);
  const findings = scanAddedLines(added, root, selection.syntaxFor);

  for (const finding of findings) {
    io.stdout.write(`${finding.file}:${finding.line}: [${finding.kind}] ${finding.reason}\n`);
  }

  const skippedNote = selection.skipped > 0 ? `, ${selection.skipped} skipped: no syntax` : '';
  if (findings.length === 0) {
    io.stdout.write(`comments: ok (0 findings${skippedNote})\n`);
    return 0;
  }
  const skippedSuffix = selection.skipped > 0 ? ` (${selection.skipped} skipped: no syntax)` : '';
  io.stdout.write(`comments: ${findings.length} finding(s)${skippedSuffix}\n`);
  return 1;
}

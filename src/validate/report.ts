export type Level = 'error' | 'warn';

/**
 * One check result. `file`/`line` are omitted for repo- or config-level
 * findings that aren't tied to a location. `verboseOnly` findings must be
 * level `warn`, print only with `--verbose`, and never count toward the
 * exit code.
 */
export interface Finding {
  level: Level;
  rule: string;
  file?: string;
  line?: number;
  message: string;
  verboseOnly?: boolean;
}

/**
 * Formats one finding as a single line: `level [rule] file:line: message`.
 * The `:line` segment is omitted when `line` is absent, and the whole
 * location segment (and its trailing colon) is omitted when `file` is
 * absent.
 */
export function formatFinding(finding: Finding): string {
  const location =
    finding.file !== undefined
      ? finding.line !== undefined
        ? `${finding.file}:${finding.line}`
        : finding.file
      : undefined;

  const head = `${finding.level} [${finding.rule}]`;
  return location !== undefined ? `${head} ${location}: ${finding.message}` : `${head} ${finding.message}`;
}

/** Formatted, ordered findings plus the counts that drive the exit code. */
export interface FindingsSummary {
  lines: string[];
  errorCount: number;
  warnCount: number;
}

/**
 * Filters out `verboseOnly` findings unless `verbose`, then stable-sorts
 * the rest errors-before-warns, then by `file` (findings without a file
 * sort first) then `line` (findings without a line sort first). Counts
 * reflect only the findings that were kept.
 */
export function summarizeFindings(findings: Finding[], verbose: boolean): FindingsSummary {
  const visible = findings.filter((f) => verbose || !f.verboseOnly);

  const levelRank = (level: Level): number => (level === 'error' ? 0 : 1);

  const sorted = [...visible].sort((a, b) => {
    const levelDiff = levelRank(a.level) - levelRank(b.level);
    if (levelDiff !== 0) return levelDiff;
    const fileDiff = (a.file ?? '').localeCompare(b.file ?? '');
    if (fileDiff !== 0) return fileDiff;
    return (a.line ?? 0) - (b.line ?? 0);
  });

  return {
    lines: sorted.map(formatFinding),
    errorCount: visible.filter((f) => f.level === 'error').length,
    warnCount: visible.filter((f) => f.level === 'warn').length,
  };
}

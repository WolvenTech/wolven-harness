/** Level of a doctor finding; only error-level findings change the exit code. */
export type DoctorLevel = 'error' | 'warn';

/** Every finding code the `doctor` contract names. */
export type DoctorCode =
  | 'doctor-config'
  | 'doctor-entry'
  | 'doctor-rules'
  | 'doctor-skills'
  | 'doctor-docs'
  | 'doctor-qmd'
  | 'doctor-code-repo'
  | 'doctor-not-global'
  | 'doctor-version-behind'
  | 'doctor-drift-edited'
  | 'doctor-drift-stale'
  | 'doctor-drift-missing';

/**
 * One finding. An error must carry the `fix:` line the output contract
 * prints after it; a warning never does.
 */
export type DoctorFinding =
  | { level: 'error'; code: DoctorCode; message: string; fix: string }
  | { level: 'warn'; code: DoctorCode; message: string };

/** The lines one finding prints: its own line, then `fix:` for an error. */
export function formatFinding(finding: DoctorFinding): string[] {
  const line = `${finding.level} [${finding.code}] ${finding.message}`;
  return finding.level === 'error' ? [line, `fix: ${finding.fix}`] : [line];
}

/** How many findings sit at each level. */
export function countFindings(findings: readonly DoctorFinding[]): { errors: number; warnings: number } {
  let errors = 0;
  let warnings = 0;
  for (const finding of findings) {
    if (finding.level === 'error') errors++;
    else warnings++;
  }
  return { errors, warnings };
}

/** The contract's last line: `doctor: ok` without errors, else both counts. */
export function summaryLine(findings: readonly DoctorFinding[]): string {
  const { errors, warnings } = countFindings(findings);
  return errors === 0 ? 'doctor: ok' : `doctor: ${errors} error(s), ${warnings} warning(s)`;
}

/** Exit code for a finished run: 1 with any error-level finding, 0 otherwise. */
export function exitCode(findings: readonly DoctorFinding[]): 0 | 1 {
  return findings.some((finding) => finding.level === 'error') ? 1 : 0;
}

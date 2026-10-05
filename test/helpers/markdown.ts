/** One parsed GitHub-flavored markdown table: header cells and data rows, cell text trimmed. */
export interface MdTable {
  headers: string[];
  rows: string[][];
}

function isTableRow(line: string): boolean {
  return /^\s*\|.*\|\s*$/.test(line);
}

function isSeparatorRow(line: string): boolean {
  return isTableRow(line) && /^[\s|:-]+$/.test(line) && line.includes('-');
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

/** Parses every `| … |` table (header + separator + data rows) out of a markdown document. */
export function parseMarkdownTables(md: string): MdTable[] {
  const lines = md.split('\n');
  const tables: MdTable[] = [];
  let i = 0;
  while (i < lines.length) {
    if (isTableRow(lines[i]) && i + 1 < lines.length && isSeparatorRow(lines[i + 1])) {
      const headers = splitRow(lines[i]);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && isTableRow(lines[i])) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      tables.push({ headers, rows });
    } else {
      i++;
    }
  }
  return tables;
}

/**
 * Returns the text under the first line that starts with `heading` (e.g. `'## Lean path'`),
 * from the line after it up to the next heading of the same or a higher level, or to the
 * end of `body`; `''` when no line matches. Lines inside fenced code blocks are never headings.
 */
export function section(body: string, heading: string): string {
  const level = /^#+/.exec(heading)?.[0].length ?? 0;
  const lines = body.split('\n');
  const start = lines.findIndex((line) => line.startsWith(heading));
  if (start === -1) return '';
  let inFence = false;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^\s*(```|~~~)/.test(lines[i])) inFence = !inFence;
    const depth = /^(#+)\s/.exec(lines[i])?.[1].length;
    if (!inFence && depth !== undefined && depth <= level) {
      end = i;
      break;
    }
  }
  return lines.slice(start + 1, end).join('\n');
}

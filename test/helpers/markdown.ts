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

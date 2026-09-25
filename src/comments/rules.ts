import { readFileSync } from 'node:fs';
import path from 'node:path';
import { firstLeak, leakReason } from './leak-rules.js';
import type { LeakKind } from './leak-rules.js';

export type AddedLine = { file: string; line: number; text: string };

export type FindingKind = 'untagged' | 'over-length' | LeakKind;

export type CommentFinding = {
  file: string;
  line: number;
  kind: FindingKind;
  reason: string;
  text: string;
};

export type CommentSyntax = {
  line: readonly string[];
  block: readonly (readonly [string, string])[];
  middle: readonly string[];
};

/** The comment syntax judged without any config: line, block, and continuation-line markers. */
export const BUILTIN_SYNTAX: CommentSyntax = {
  line: ['//'],
  block: [['/*', '*/']],
  middle: ['*'],
};

const TOOL_DIRECTIVE =
  /^\s*(?:\/\/|\/\*|\*|#)\s*(?:biome-ignore|eslint|@ts-|prettier-ignore|noqa|type:|shellcheck|!)/;
const GENERATED_PRAGMA = /^@generated\b/i;
const GENERATED_NEAR_START = /^.{0,20}?\bgenerat\w*\b/i;
const GENERATED_DO_NOT_EDIT = /\bgenerat\w*\b.{0,20}\bdo[\s-]?not[\s-]?edit\b/i;
const COMMENT_PREFIX = /^\s*(?:\/\/|\/\*|\*|#)\s*/;
const DECLARED_REASON = /^\s*(?:\/\/|\/\*|\*|#)\s*(?:why|hazard|invariant):\s*\S/i;
const CLOSER_OR_CONTINUATION = /^\s*(?:\*\/|\*|\/\/)/;

export const COMMENT_MARKERS = ['why:', 'hazard:', 'invariant:'] as const;
export const MAX_DECLARED_LINES = 4;

function matchesSyntax(text: string, syntax: CommentSyntax): boolean {
  const trimmed = text.trimStart();
  if (trimmed === '') return false;
  if (syntax.line.some((prefix) => prefix !== '' && trimmed.startsWith(prefix))) return true;
  for (const [open, close] of syntax.block) {
    if (trimmed.startsWith(open)) return true;
    if (open !== close && trimmed.startsWith(close)) return false;
  }
  return syntax.middle.some(
    (middle) => trimmed.startsWith(middle) && !trimmed.startsWith(middle + middle),
  );
}

function isGeneratedFileBanner(text: string): boolean {
  if (DECLARED_REASON.test(text)) return false;
  const body = text.replace(COMMENT_PREFIX, '');
  if (GENERATED_PRAGMA.test(body)) return true;
  return body.length <= 90 && GENERATED_NEAR_START.test(body) && GENERATED_DO_NOT_EDIT.test(body);
}

/** A file's `CommentSyntax`, looked up by its (root-relative) path. */
export type SyntaxFor = (file: string) => CommentSyntax;

const defaultSyntaxFor: SyntaxFor = () => BUILTIN_SYNTAX;

export function isCommentLine(text: string, syntax: CommentSyntax = BUILTIN_SYNTAX): boolean {
  return matchesSyntax(text, syntax) && !TOOL_DIRECTIVE.test(text) && !isGeneratedFileBanner(text);
}

export function declaresReason(text: string): boolean {
  return DECLARED_REASON.test(text);
}

const DECLARATION =
  /^\s*(?:(?:export|declare|public|private|protected|readonly|static|async|abstract)\s+)*(?:class|function|const|let|var|type|interface|enum|namespace)\s+([A-Za-z_$][\w$]*)|^\s*(?:readonly\s+)?([A-Za-z_$][\w$]*)\??\s*[:(<]/;

export function attachedIdentifier(codeLine: string | undefined): string | null {
  const match = codeLine === undefined ? null : DECLARATION.exec(codeLine);
  return match ? (match[1] ?? match[2] ?? null) : null;
}

export function groupCommentBlocks(added: AddedLine[], syntaxFor: SyntaxFor = defaultSyntaxFor): AddedLine[][] {
  const blocks: AddedLine[][] = [];
  let block: AddedLine[] = [];

  for (const line of added) {
    if (!isCommentLine(line.text, syntaxFor(line.file))) {
      block = [];
      continue;
    }
    const previous = block.at(-1);
    if (previous && previous.file === line.file && previous.line === line.line - 1) {
      block.push(line);
      continue;
    }
    block = [line];
    blocks.push(block);
  }
  return blocks;
}

type NextCodeLine = (file: string, line: number) => string | undefined;

function declarationAfter(file: string, tailLine: number, nextCodeLine: NextCodeLine): string | undefined {
  for (let line = tailLine + 1; line <= tailLine + 4; line += 1) {
    const text = nextCodeLine(file, line);
    if (text === undefined) continue;
    if (text.trim() === '' || CLOSER_OR_CONTINUATION.test(text)) continue;
    return text;
  }
  return undefined;
}

/**
 * Finds the true start and end of the comment block around a diff hunk by
 * reading the file on disk: an edit to one interior line of a multi-line
 * comment leaves the surrounding lines outside that hunk.
 */
function expandToEnclosingBlock(
  file: string,
  seedHeadLine: number,
  seedTailLine: number,
  nextCodeLine: NextCodeLine,
  syntaxFor: SyntaxFor = defaultSyntaxFor,
): { headLine: number; tailLine: number } {
  const syntax = syntaxFor(file);
  let headLine = seedHeadLine;
  while (true) {
    const prev = nextCodeLine(file, headLine - 1);
    if (prev === undefined || !isCommentLine(prev, syntax)) break;
    headLine -= 1;
  }
  let tailLine = seedTailLine;
  while (true) {
    const next = nextCodeLine(file, tailLine + 1);
    if (next === undefined || !isCommentLine(next, syntax)) break;
    tailLine += 1;
  }
  return { headLine, tailLine };
}

/** Reads disk lines `headLine..tailLine` of `file` as a synthetic comment block. */
function readFullBlockText(
  file: string,
  headLine: number,
  tailLine: number,
  nextCodeLine: NextCodeLine,
): AddedLine[] {
  const lines: AddedLine[] = [];
  for (let line = headLine; line <= tailLine; line += 1) {
    const text = nextCodeLine(file, line);
    if (text !== undefined) lines.push({ file, line, text });
  }
  return lines;
}

type MergedBlock = { file: string; headLine: number; tailLine: number; addedLines: AddedLine[] };

/**
 * Classifies one comment block: a JSDoc block directly above a declaration
 * passes the tag rule and is judged only by the leak rules; any other block
 * needs a declared why:/hazard:/invariant: tag within the length limit.
 */
function judgeBlock(
  entry: MergedBlock,
  nextCodeLine?: NextCodeLine,
  syntaxFor: SyntaxFor = defaultSyntaxFor,
): { violates: boolean; kind: FindingKind; reason: string } {
  const fullBlock = nextCodeLine
    ? readFullBlockText(entry.file, entry.headLine, entry.tailLine, nextCodeLine)
    : entry.addedLines;
  const head = fullBlock[0];
  const tail = fullBlock.at(-1);
  if (head === undefined || tail === undefined) return { violates: false, kind: 'untagged', reason: '' };
  const addedText = entry.addedLines.map((line) => line.text).join(' ');

  const isBuiltinFile = syntaxFor(entry.file) === BUILTIN_SYNTAX;
  if (head.text.trimStart().startsWith('/**') && nextCodeLine && isBuiltinFile) {
    const identifier = attachedIdentifier(declarationAfter(entry.file, tail.line, nextCodeLine));
    if (identifier !== null) {
      const leak = firstLeak(addedText);
      return leak === null
        ? { violates: false, kind: 'untagged', reason: '' }
        : { violates: true, kind: leak.kind, reason: leakReason(leak) };
    }
  }

  if (!declaresReason(head.text)) {
    return { violates: true, kind: 'untagged', reason: 'undeclared comment added since the base' };
  }
  if (fullBlock.length > MAX_DECLARED_LINES) {
    return {
      violates: true,
      kind: 'over-length',
      reason: `declared comment runs past ${MAX_DECLARED_LINES} lines`,
    };
  }
  const leak = firstLeak(addedText);
  if (leak !== null) {
    return { violates: true, kind: leak.kind, reason: leakReason(leak) };
  }
  return { violates: false, kind: 'untagged', reason: '' };
}

export function findAddedComments(
  added: AddedLine[],
  nextCodeLine?: NextCodeLine,
  syntaxFor: SyntaxFor = defaultSyntaxFor,
): CommentFinding[] {
  const merged = new Map<string, MergedBlock>();

  for (const block of groupCommentBlocks(added, syntaxFor)) {
    const head = block[0];
    const tail = block.at(-1);
    if (head === undefined || tail === undefined) continue;
    const range = nextCodeLine
      ? expandToEnclosingBlock(head.file, head.line, tail.line, nextCodeLine, syntaxFor)
      : { headLine: head.line, tailLine: tail.line };
    const key = `${head.file}#${range.headLine}-${range.tailLine}`;
    const entry = merged.get(key);
    if (entry) {
      entry.addedLines.push(...block);
    } else {
      merged.set(key, { file: head.file, headLine: range.headLine, tailLine: range.tailLine, addedLines: [...block] });
    }
  }

  const findings: CommentFinding[] = [];
  for (const entry of merged.values()) {
    const verdict = judgeBlock(entry, nextCodeLine, syntaxFor);
    if (!verdict.violates) continue;
    const first = entry.addedLines.reduce((min, line) => (line.line < min.line ? line : min));
    findings.push({
      file: entry.file,
      line: first.line,
      kind: verdict.kind,
      reason: verdict.reason,
      text: first.text.trim().slice(0, 120),
    });
  }
  return findings;
}

function diskLineReader(projectDir: string): NextCodeLine {
  const cache = new Map<string, string[]>();
  return (file, line) => {
    let lines = cache.get(file);
    if (lines === undefined) {
      try {
        lines = readFileSync(path.join(projectDir, file), 'utf8').split('\n');
      } catch {
        lines = [];
      }
      cache.set(file, lines);
    }
    return lines[line - 1];
  };
}

/** Scans already-collected added lines, resolving JSDoc declarations from disk. */
export function scanAddedLines(
  added: AddedLine[],
  projectDir: string,
  syntaxFor: SyntaxFor = defaultSyntaxFor,
): CommentFinding[] {
  return findAddedComments(added, diskLineReader(projectDir), syntaxFor);
}

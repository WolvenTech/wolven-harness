#!/usr/bin/env tsx
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { firstLeak, leakReason } from './comment-leak-rules.js';
import type { LeakKind } from './comment-leak-rules.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const TS_SYNTAX = {
  line: ['//'] as const,
  block: [['/*', '*/']] as const,
  middle: ['*'] as const,
};

export type AddedLine = { file: string; line: number; text: string };

export type FindingKind = 'untagged' | 'over-length' | 'doc-uninformative' | LeakKind;

export type CommentFinding = {
  file: string;
  line: number;
  kind: FindingKind;
  reason: string;
  text: string;
};

type CommentGateConfig = { enabled: boolean; codePaths: string[]; baseline?: string };

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

type CommentSyntax = {
  line: readonly string[];
  block: readonly (readonly [string, string])[];
  middle: readonly string[];
};

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

function isTsFile(file: string): boolean {
  return /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/.test(file);
}

export function isCommentLine(text: string, file = ''): boolean {
  if (file !== '' && !isTsFile(file)) return false;
  return matchesSyntax(text, TS_SYNTAX) && !TOOL_DIRECTIVE.test(text) && !isGeneratedFileBanner(text);
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

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'get', 'gets', 'has', 'in',
  'into', 'is', 'it', 'its', 'of', 'on', 'or', 'return', 'returns', 'set', 'sets', 'that', 'the',
  'then', 'this', 'to', 'true', 'when', 'which', 'with',
]);

function words(text: string): string[] {
  return text
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 1);
}

export const MIN_INFORMATIVE_WORDS = 3;

export function isInformativeDoc(commentText: string, identifier: string): boolean {
  const named = new Set(words(identifier));
  const remaining = words(commentText.replace(/^[\s/*]+|[\s*/]+$/g, '')).filter(
    (word) => !named.has(word) && !STOPWORDS.has(word),
  );
  return new Set(remaining).size >= MIN_INFORMATIVE_WORDS;
}

export function groupCommentBlocks(added: AddedLine[]): AddedLine[][] {
  const blocks: AddedLine[][] = [];
  let block: AddedLine[] = [];

  for (const line of added) {
    if (!isCommentLine(line.text, line.file)) {
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
): { headLine: number; tailLine: number } {
  let headLine = seedHeadLine;
  while (true) {
    const prev = nextCodeLine(file, headLine - 1);
    if (prev === undefined || !isCommentLine(prev, file)) break;
    headLine -= 1;
  }
  let tailLine = seedTailLine;
  while (true) {
    const next = nextCodeLine(file, tailLine + 1);
    if (next === undefined || !isCommentLine(next, file)) break;
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
 * Classifies one comment block: an attached JSDoc or a short tagged comment
 * passes; anything else, or a leak in the lines actually added, fails.
 */
function judgeBlock(
  entry: MergedBlock,
  nextCodeLine?: NextCodeLine,
): { violates: boolean; kind: FindingKind; reason: string } {
  const fullBlock = nextCodeLine
    ? readFullBlockText(entry.file, entry.headLine, entry.tailLine, nextCodeLine)
    : entry.addedLines;
  const head = fullBlock[0];
  const tail = fullBlock.at(-1);
  if (head === undefined || tail === undefined) return { violates: false, kind: 'untagged', reason: '' };
  const addedText = entry.addedLines.map((line) => line.text).join(' ');

  if (head.text.trimStart().startsWith('/**') && nextCodeLine) {
    const identifier = attachedIdentifier(declarationAfter(entry.file, tail.line, nextCodeLine));
    if (identifier !== null) {
      const body = fullBlock.map((line) => line.text).join(' ');
      if (!isInformativeDoc(body, identifier)) {
        return {
          violates: true,
          kind: 'doc-uninformative',
          reason: `doc comment only restates ${identifier}`,
        };
      }
      const docLeak = firstLeak(addedText);
      return docLeak === null
        ? { violates: false, kind: 'untagged', reason: '' }
        : { violates: true, kind: docLeak.kind, reason: leakReason(docLeak) };
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
): CommentFinding[] {
  const merged = new Map<string, MergedBlock>();

  for (const block of groupCommentBlocks(added)) {
    const head = block[0];
    const tail = block.at(-1);
    if (head === undefined || tail === undefined) continue;
    const range = nextCodeLine
      ? expandToEnclosingBlock(head.file, head.line, tail.line, nextCodeLine)
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
    const verdict = judgeBlock(entry, nextCodeLine);
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
export function scanAddedLines(added: AddedLine[], projectDir: string = ROOT): CommentFinding[] {
  return findAddedComments(added, diskLineReader(projectDir));
}

export function commentViolationMessage(hits: CommentFinding[]): string {
  return [
    `comment-gate: ${hits.length} finding(s) in added comment lines.`,
    'Use why:/hazard:/invariant: (at most 4 lines) or an informative JSDoc comment on the',
    'declaration below it. Delete the line if nothing survives that rewrite.',
    '',
    ...hits.map((h) => `${h.file}:${h.line}  [${h.kind}]  ${h.text}`),
  ].join('\n');
}

function loadConfig(root: string): CommentGateConfig {
  const raw = readFileSync(path.join(root, '.comment-gate.json'), 'utf8');
  const data = JSON.parse(raw) as CommentGateConfig;
  if (typeof data.enabled !== 'boolean' || !Array.isArray(data.codePaths)) {
    throw new Error('.comment-gate.json must declare enabled (boolean) and codePaths (array)');
  }
  return data;
}

function gitLines(root: string, args: string[]): string[] {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8' })
      .split(/\r?\n/)
      .filter(Boolean);
  } catch {
    return [];
  }
}

function isUnderCodePaths(relativePath: string, codePaths: string[]): boolean {
  const normalized = relativePath.replace(/\\/g, '/');
  return codePaths.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`));
}

function listChangedFiles(root: string, base: string): string[] {
  const diffed = gitLines(root, ['diff', '--name-only', base]);
  const untracked = gitLines(root, ['ls-files', '--others', '--exclude-standard']);
  return [...new Set([...diffed, ...untracked])];
}

function listAddedLines(root: string, relativePaths: string[], base: string): AddedLine[] {
  if (relativePaths.length === 0) return [];
  const tracked = new Set(gitLines(root, ['ls-files', '--', ...relativePaths]));
  const out: AddedLine[] = [];

  for (const file of relativePaths) {
    if (!tracked.has(file)) {
      let raw = '';
      try {
        raw = readFileSync(path.join(root, file), 'utf8');
      } catch {
        continue;
      }
      raw.split(/\r?\n/).forEach((text, index) => {
        out.push({ file, line: index + 1, text });
      });
      continue;
    }
    const diff = gitLines(root, ['diff', '--unified=0', base, '--', file]);
    let lineNo = 0;
    for (const row of diff) {
      const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(row);
      if (hunk) {
        lineNo = Number(hunk[1]);
        continue;
      }
      if (row.startsWith('+++')) continue;
      if (row.startsWith('+')) {
        out.push({ file, line: lineNo, text: row.slice(1) });
        lineNo += 1;
      }
    }
  }
  return out;
}

function refExists(root: string, ref: string): boolean {
  try {
    execFileSync('git', ['rev-parse', '--verify', '--quiet', ref], {
      cwd: root,
      stdio: ['ignore', 'ignore', 'ignore'],
    });
    return true;
  } catch {
    return false;
  }
}

function isAncestor(root: string, ancestor: string, descendant: string): boolean {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', ancestor, descendant], {
      cwd: root,
      stdio: ['ignore', 'ignore', 'ignore'],
    });
    return true;
  } catch {
    return false;
  }
}

function mergeBaseSha(root: string, a: string, b: string): string | null {
  try {
    return execFileSync('git', ['merge-base', a, b], { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

/**
 * Resolves the base commit for "added lines": the merge-base with
 * `origin/main` (or `main`), replaced by the configured baseline when the
 * baseline sits between that merge-base and `HEAD`.
 */
export function resolveCommentGateBase(root: string): string {
  let mergeBase: string | null = null;
  if (refExists(root, 'origin/main')) {
    mergeBase = mergeBaseSha(root, 'HEAD', 'origin/main');
  }
  if (mergeBase === null && refExists(root, 'main')) {
    mergeBase = mergeBaseSha(root, 'HEAD', 'main');
  }
  if (mergeBase === null) {
    throw new Error(
      'comment-gate: no origin/main or main ref found to compute a base; pass --base <ref>.',
    );
  }

  // why: main here is an empty root commit, so without a grandfather point
  // every pre-existing comment in the tree would count as newly added.
  const baseline = loadConfig(root).baseline;
  if (
    baseline !== undefined &&
    refExists(root, baseline) &&
    isAncestor(root, baseline, 'HEAD') &&
    isAncestor(root, mergeBase, baseline)
  ) {
    return baseline;
  }
  return mergeBase;
}

export type RunCommentGateOptions = { root: string; base: string };

/**
 * Loads `.comment-gate.json`, lists changed files, and reports every added
 * comment line under the configured code paths that fails the gate.
 */
export async function runCommentGate(opts: RunCommentGateOptions): Promise<CommentFinding[]> {
  const config = loadConfig(opts.root);
  if (!config.enabled) return [];

  const changed = listChangedFiles(opts.root, opts.base);
  const scope = changed.filter((f) => isUnderCodePaths(f, config.codePaths) && isTsFile(f));
  if (scope.length === 0) return [];

  const added = listAddedLines(opts.root, scope, opts.base);
  return scanAddedLines(added, opts.root);
}

function parseArgs(argv: string[]): { base?: string } {
  const idx = argv.indexOf('--base');
  if (idx === -1) return {};
  const value = argv[idx + 1];
  if (value === undefined) throw new Error('comment-gate: --base requires a value');
  return { base: value };
}

async function main(): Promise<void> {
  const { base: overrideBase } = parseArgs(process.argv.slice(2));

  let base: string;
  try {
    base = overrideBase ?? resolveCommentGateBase(ROOT);
  } catch (err) {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    process.exitCode = 1;
    return;
  }

  const hits = await runCommentGate({ root: ROOT, base });
  if (hits.length === 0) {
    process.stdout.write('comments: ok (0 findings)\n');
    process.exitCode = 0;
    return;
  }

  process.stderr.write(`${commentViolationMessage(hits)}\n`);
  process.exitCode = 1;
}

const invokedAsCli =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (invokedAsCli) {
  main().catch((err) => {
    console.error(String(err));
    process.exitCode = 1;
  });
}

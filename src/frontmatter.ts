import { parse } from 'yaml';

/** Leading `---\n … \n---` YAML block. */
export const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---/;

export type FrontmatterRead =
  | { kind: 'missing' }
  | { kind: 'unparseable' }
  | { kind: 'ok'; value: Record<string, unknown> };

/**
 * Classifies the leading frontmatter block: missing, unparseable (including
 * a value that is not an object), or the parsed object.
 */
export function classifyFrontmatter(content: string): FrontmatterRead {
  const match = content.match(FRONTMATTER_RE);
  if (!match) return { kind: 'missing' };

  let parsed: unknown;
  try {
    parsed = parse(match[1]);
  } catch {
    return { kind: 'unparseable' };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { kind: 'unparseable' };
  }
  return { kind: 'ok', value: parsed as Record<string, unknown> };
}

/**
 * Parses the leading frontmatter block. Returns `undefined` when the block
 * is missing, unparseable, or does not parse to an object.
 */
export function parseFrontmatter(content: string): Record<string, unknown> | undefined {
  const read = classifyFrontmatter(content);
  return read.kind === 'ok' ? read.value : undefined;
}

/** Non-empty string `name` and `description` from a parsed skill frontmatter object. */
export function skillIdentity(value: Record<string, unknown>): { name?: string; description?: string } {
  const name = typeof value.name === 'string' && value.name.length > 0 ? value.name : undefined;
  const description =
    typeof value.description === 'string' && value.description.length > 0 ? value.description : undefined;
  return { name, description };
}

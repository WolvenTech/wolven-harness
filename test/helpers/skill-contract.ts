import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { parse as parseYaml } from 'yaml';
import { makeRepo } from './fixture.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');
const templatesRoot = path.join(repoRoot, 'templates');
const skillsRoot = path.join(templatesRoot, '.agents', 'skills');

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\r?\n?([\s\S]*)$/;
const HEADING_RE = /^#{1,6}\s+(.+?)\s*$/gm;
const LINK_RE = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

/** One skill folder's parsed contract, as read from `templates/.agents/skills/<name>/`. */
export interface SkillContract {
  /** Absolute path to the skill's folder. */
  dir: string;
  /** Parsed YAML frontmatter of `SKILL.md` (empty object if the block is empty). */
  frontmatter: Record<string, unknown>;
  /** `SKILL.md` content after the frontmatter block. */
  body: string;
  /** Every markdown heading in `SKILL.md`'s body, in document order, `#` markers stripped. */
  headings: string[];
  /** Every file under the skill folder, as posix-style paths relative to it, sorted. */
  files: string[];
  /** Reads one file inside the skill folder, `rel` given the same way `files` reports it. */
  read(rel: string): Promise<string>;
}

async function listFiles(dir: string, base: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await listFiles(full, base)));
    } else {
      out.push(path.relative(base, full).split(path.sep).join('/'));
    }
  }
  return out.sort();
}

/**
 * Reads a template skill's folder (`templates/.agents/skills/<name>/`) and
 * returns its frontmatter, body, headings, and file list. Throws if
 * `SKILL.md` is missing or has no frontmatter block.
 */
export async function readSkill(name: string): Promise<SkillContract> {
  const dir = path.join(skillsRoot, name);
  const raw = await readFile(path.join(dir, 'SKILL.md'), 'utf8');

  const match = raw.match(FRONTMATTER_RE);
  if (!match) throw new Error(`skill "${name}": SKILL.md has no frontmatter block`);

  const frontmatter = (parseYaml(match[1]) ?? {}) as Record<string, unknown>;
  const body = match[2] ?? '';
  const headings = [...body.matchAll(HEADING_RE)].map((m) => m[1]);
  const files = await listFiles(dir, dir);

  return {
    dir,
    frontmatter,
    body,
    headings,
    files,
    read: (rel: string) => readFile(path.join(dir, rel), 'utf8'),
  };
}

/** The shared git-host operations table, relative to the skills root: the only link a skill may make into another skill's folder. */
const SHARED_HOST_TABLE = ['code-pr', 'references', 'host-operations.md'];

function isExternalLink(url: string): boolean {
  return /^([a-z][a-z0-9+.-]*:)/i.test(url) || url.startsWith('#');
}

/**
 * Fails if a relative markdown link in `content` (found in `rel`, inside
 * `skillDir`) resolves to a missing file, or outside the skill folder unless
 * it targets the one file every ship skill shares for git-host steps.
 */
function assertLocalLinksResolve(skillDir: string, rel: string, content: string): void {
  for (const match of content.matchAll(LINK_RE)) {
    const url = match[1];
    if (isExternalLink(url)) continue;

    const withoutAnchor = url.split('#')[0];
    if (withoutAnchor.length === 0) continue; // pure in-file anchor

    const fileDir = path.dirname(path.join(skillDir, rel));
    const resolved = path.resolve(fileDir, withoutAnchor);
    const withinSkill = resolved === skillDir || resolved.startsWith(skillDir + path.sep);
    const isSharedHostTable = resolved === path.join(path.dirname(skillDir), ...SHARED_HOST_TABLE);

    assert.ok(withinSkill || isSharedHostTable, `${rel}: link "${url}" leaves the skill folder`);
    assert.ok(existsSync(resolved), `${rel}: link "${url}" does not resolve to an existing file`);
  }
}

/** Options for {@link assertSkillBasics}. */
export interface SkillBasicsOptions {
  /**
   * When true, also requires that some file in the skill mentions
   * `harness:validate`. Only meaningful for a skill that actually tells a
   * consumer to run validate; most skills don't and should leave this off.
   */
  requireHarnessValidate?: boolean;
}

/**
 * Checks the basics every template skill must satisfy: frontmatter `name`
 * equals the folder name, `description` is a non-empty string with no `|`,
 * every relative markdown link across the skill's `.md` files resolves to
 * an existing file inside the skill folder, and no file says
 * `pnpm validate` (consumers run `harness:validate`). With
 * `requireHarnessValidate`, also asserts `harness:validate` appears
 * somewhere in the skill.
 */
export async function assertSkillBasics(name: string, opts: SkillBasicsOptions = {}): Promise<void> {
  const skill = await readSkill(name);

  assert.equal(skill.frontmatter.name, name, `frontmatter "name" must equal "${name}"`);

  const description = skill.frontmatter.description;
  assert.ok(typeof description === 'string' && description.length > 0, 'frontmatter "description" must be a non-empty string');
  assert.ok(!(description as string).includes('|'), 'frontmatter "description" must not contain "|"');

  const mdFiles = skill.files.filter((f) => f.endsWith('.md'));
  let mentionsHarnessValidate = false;

  for (const rel of mdFiles) {
    const content = await skill.read(rel);
    assertLocalLinksResolve(skill.dir, rel, content);
    assert.ok(!content.includes('pnpm validate'), `${rel} must not say "pnpm validate" (say "harness:validate" instead)`);
    if (content.includes('harness:validate')) mentionsHarnessValidate = true;
  }

  if (opts.requireHarnessValidate) {
    assert.ok(mentionsHarnessValidate, `skill "${name}" must mention "harness:validate" somewhere`);
  }
}

const DEFAULT_RUNTIME_TOOL_NAMES = ['AskQuestion', 'AskUserQuestion', 'request_user_input'];
// why: a guard clause states the condition under which a runtime tool name
// is safe to print; matched over the same paragraph as the name itself.
const GUARD_RE = /\b(when|if)\b[^.\n]{0,80}\b(available|your runtime|runtime has|runtime's)\b/i;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Fails if `text` names a runtime-specific question tool (`AskQuestion`,
 * `AskUserQuestion`, `request_user_input`, or any of `extraNames`) in a
 * paragraph that doesn't also state the condition — a phrase like "when
 * available" or "if your runtime" — under which that name applies.
 */
export function assertNoRuntimeToolNames(text: string, opts: { extraNames?: string[] } = {}): void {
  const names = [...DEFAULT_RUNTIME_TOOL_NAMES, ...(opts.extraNames ?? [])];
  const paragraphs = text.split(/\n\s*\n/);
  const violations: string[] = [];

  for (const paragraph of paragraphs) {
    for (const name of names) {
      const nameRe = new RegExp(`\\b${escapeRegExp(name)}\\b`);
      if (nameRe.test(paragraph) && !GUARD_RE.test(paragraph)) {
        violations.push(`"${name}" appears without a "when available" / "if your runtime" guard: ${paragraph.trim().slice(0, 120)}`);
      }
    }
  }

  assert.equal(violations.length, 0, violations.join('\n'));
}

/**
 * Builds the smallest fixture that passes `validate` on its own (a git
 * repo with no other spine files required), merged with `files`. Saves
 * every skill test from re-deriving what a passing fixture needs.
 */
export async function minimalValidateFixture(files: Record<string, string> = {}): Promise<string> {
  return makeRepo(files, { git: true });
}

/**
 * Renders a template file by replacing `<key>` and `{{key}}` placeholders
 * with `vars[key]` (both spellings are supported; a skill's own template
 * may use either), writes the result at `dest` inside a fresh fixture
 * built from `fixtureFiles` plus the spine `makeRepo` provides, and
 * returns the fixture's directory so the caller can `run(['validate'], {
 * cwd })` against it.
 *
 * `templatePath` is either an absolute path (a caller-built temp file), or
 * a path relative to this package's `templates/` folder — which covers
 * both a skill's own template (`.agents/skills/<name>/<file>`) and a
 * top-level seed template (`docs/<dir>/<file>`).
 */
export async function renderInto(
  fixtureFiles: Record<string, string>,
  templatePath: string,
  dest: string,
  vars: Record<string, string> = {},
): Promise<string> {
  const sourcePath = path.isAbsolute(templatePath) ? templatePath : path.join(templatesRoot, templatePath);
  const raw = await readFile(sourcePath, 'utf8');

  let rendered = raw;
  for (const [key, value] of Object.entries(vars)) {
    rendered = rendered.split(`{{${key}}}`).join(value).split(`<${key}>`).join(value);
  }

  return makeRepo({ ...fixtureFiles, [dest]: rendered }, { git: true });
}

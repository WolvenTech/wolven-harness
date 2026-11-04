import type { Dirent } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { classifyFrontmatter, skillIdentity } from '../frontmatter.js';
import { mapQuietInstallPaths } from './path-map.js';
import { isSkillSet, type SkillSet } from './skill-sets.js';
import type { Context } from './types.js';

const SKILLS_TABLE_PLACEHOLDER = '{{skills_table}}';

interface SkillFrontmatter {
  name: string;
  description: string;
}

/**
 * Reads a `SKILL.md` file's frontmatter and returns its `name` and
 * `description` when both are non-empty strings. Missing file, missing
 * frontmatter, or missing fields all resolve to `undefined` rather than
 * throwing — a malformed skill folder is skipped, not fatal.
 */
async function readSkillFrontmatter(skillMdPath: string): Promise<SkillFrontmatter | undefined> {
  let raw: string;
  try {
    raw = await readFile(skillMdPath, 'utf8');
  } catch {
    return undefined;
  }

  const classified = classifyFrontmatter(raw);
  if (classified.kind !== 'ok') return undefined;
  const { name, description } = skillIdentity(classified.value);
  if (!name || !description) return undefined;

  return { name, description };
}

const SET_MARKER = /\s*(?:<!-- set:([a-z]+) -->|# set:([a-z]+))$/;

/**
 * Applies the set-marker rule: a line ending in `<!-- set:NAME -->` or
 * `# set:NAME` is written without the marker when NAME is in `sets` (or
 * `sets` is undefined, meaning every set), and dropped otherwise.
 */
export function applySetMarkers(text: string, sets?: readonly SkillSet[]): string {
  const out: string[] = [];
  for (const line of text.split('\n')) {
    const m = SET_MARKER.exec(line);
    const name = m?.[1] ?? m?.[2];
    if (m === null || name === undefined) {
      out.push(line);
    } else if (sets === undefined || (isSkillSet(name) && sets.includes(name))) {
      out.push(line.slice(0, m.index));
    }
  }
  return out.join('\n');
}

/**
 * Renders `.qmd/index.yml` from its template for setup, drift and known forms.
 * A quiet install indexes `./.wolven-harness/docs/...`, so a client `docs/` is never a collection.
 */
export function renderQmdIndex(template: string, sets?: readonly SkillSet[], quiet = false): string {
  const rendered = applySetMarkers(template, sets);
  return quiet ? rendered.replace(/^(\s*path: )\.\/docs\//gm, '$1./.wolven-harness/docs/') : rendered;
}

/**
 * Walks `templatesDir/.agents/skills/*` for each skill folder's
 * `SKILL.md`, and returns every skill's frontmatter, sorted by name. A new
 * skill folder is picked up automatically — no code change needed here.
 */
async function collectSkills(templatesDir: string, only?: readonly string[]): Promise<SkillFrontmatter[]> {
  const skillsDir = path.join(templatesDir, '.agents', 'skills');

  let entries: Dirent[];
  try {
    entries = await readdir(skillsDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const skills: SkillFrontmatter[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (only !== undefined && !only.includes(entry.name)) continue;
    const fm = await readSkillFrontmatter(path.join(skillsDir, entry.name, 'SKILL.md'));
    if (fm) skills.push(fm);
  }

  skills.sort((a, b) => a.name.localeCompare(b.name));
  return skills;
}

function renderSkillsTable(skills: SkillFrontmatter[]): string {
  const header = '| Skill | Description |\n| --- | --- |';
  const rows = skills.map((s) => `| ${s.name} | ${s.description} |`);
  return [header, ...rows].join('\n');
}

/**
 * Renders `WOLVEN.md` from `ctx.templatesDir/WOLVEN.md`: builds a skills
 * table from every installed skill's `SKILL.md` frontmatter under the same
 * templates dir (each skill folder under `.agents/skills`), and substitutes
 * it for the `{{skills_table}}` placeholder. When `only` is given, the
 * table lists just those skill folders.
 */
export async function renderWolven(
  ctx: Context,
  only?: readonly string[],
  sets?: readonly SkillSet[],
  quiet = false,
): Promise<string> {
  const templatePath = path.join(ctx.templatesDir, 'WOLVEN.md');
  const template = await readFile(templatePath, 'utf8');

  const skills = await collectSkills(ctx.templatesDir, only);
  const table = renderSkillsTable(skills);

  const rendered = applySetMarkers(template.split(SKILLS_TABLE_PLACEHOLDER).join(table), sets);
  if (!quiet) return rendered;
  return mapQuietInstallPaths(rendered.slice(rendered.indexOf('<!-- wolven-harness:start -->')), 'linked').replaceAll(
    '`.harness-score.json`',
    '`.wolven-harness/.harness-score.json`',
  );
}

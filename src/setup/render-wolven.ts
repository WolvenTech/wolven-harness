import type { Dirent } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { classifyFrontmatter, skillIdentity } from '../frontmatter.js';
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
  const header = '| Skill | Use when |\n| --- | --- |';
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
export async function renderWolven(ctx: Context, only?: readonly string[]): Promise<string> {
  const templatePath = path.join(ctx.templatesDir, 'WOLVEN.md');
  const template = await readFile(templatePath, 'utf8');

  const skills = await collectSkills(ctx.templatesDir, only);
  const table = renderSkillsTable(skills);

  return template.split(SKILLS_TABLE_PLACEHOLDER).join(table);
}

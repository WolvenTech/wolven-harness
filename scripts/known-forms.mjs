import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applySetMarkers } from '../src/setup/render-wolven.ts';
import { SKILL_SETS } from '../src/setup/skill-sets.ts';

/** Release tags whose templates `setup` once copied into consumer repos. */
export const TAGS = ['v0.1.0', 'v0.1.1', 'v0.2.0', 'v0.3.0', 'v0.3.1', 'v0.3.2'];

/** Where the table lives; it ships through `"files"` in `package.json`. */
export const TABLE_PATH = 'known-forms.json';

/** Template files `setup` installs under a different name, as `INSTALLED_AS` in `src/setup/apply.ts` maps them. */
const INSTALLED_AS = {
  '.qmd/gitignore': '.qmd/.gitignore',
  'docs/maps/gitignore': 'docs/maps/.gitignore',
};

/** The one template whose installed bytes depend on the skill-set choice. */
const QMD_INDEX = '.qmd/index.yml';

/** Never classified: `setup` renders it per install and `harness-init` deletes it after the fold. */
const UNCLASSIFIED = new Set(['WOLVEN.md', 'AGENTS.md']);

const here = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.resolve(here, '..');

/** sha-256 hex of the given bytes. */
export function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

/** Every subset of the optional skill sets, since each choice renders `.qmd/index.yml` differently. */
function setChoices() {
  return Array.from({ length: 2 ** SKILL_SETS.length }, (_, mask) => SKILL_SETS.filter((_set, i) => (mask >> i) & 1));
}

/** Adds the installed-path forms of one template file to `forms`. */
function addTemplate(forms, template, bytes, renderQmd = false) {
  const installed = INSTALLED_AS[template] ?? template;
  if (UNCLASSIFIED.has(installed)) return;
  const shas = installed === QMD_INDEX && renderQmd ? setChoices().map((sets) => renderIndex(bytes, sets)) : [sha256(bytes)];
  for (const sha of shas) {
    if (!forms.has(installed)) forms.set(installed, new Set());
    forms.get(installed).add(sha);
  }
}

/** sha-256 of `.qmd/index.yml` as `setup` renders it for the chosen `sets`. */
function renderIndex(bytes, sets) {
  return sha256(Buffer.from(applySetMarkers(bytes.toString('utf8'), sets), 'utf8'));
}

/** True when `tag` resolves in the repository at `root`. */
function hasTag(root, tag) {
  try {
    execFileSync('git', ['rev-parse', '--verify', '--quiet', `refs/tags/${tag}`], { cwd: root, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/** Template paths under `templates/` at `tag`, read from git without a checkout. */
function tagTemplates(root, tag) {
  const out = execFileSync('git', ['ls-tree', '-r', '--name-only', tag, '--', 'templates/'], {
    cwd: root,
    encoding: 'utf8',
  });
  return out.split('\n').filter((line) => line !== '');
}

/** Regular files under `dir`, `/`-joined and sorted. */
function walk(dir) {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(dir, path.join(entry.parentPath, entry.name)).split(path.sep).join('/'))
    .sort();
}

/** The forms the working tree's `templates/` writes now, as `{ installed path: [sha-256] }`. */
export function currentForms(root = defaultRoot) {
  const forms = new Map();
  for (const template of walk(path.join(root, 'templates'))) {
    addTemplate(forms, template, readFileSync(path.join(root, 'templates', template)), true);
  }
  return toTable(forms);
}

/** Reads the committed table, or an empty one when it does not exist yet. */
export function readTable(root = defaultRoot) {
  const file = path.join(root, TABLE_PATH);
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { forms: {} };
}

function toTable(forms) {
  const sorted = {};
  for (const installed of [...forms.keys()].sort()) sorted[installed] = [...forms.get(installed)].sort();
  return { forms: sorted };
}

/**
 * The table the generator would write: the committed forms, every form each
 * release tag present in the repository wrote, and the working tree's.
 * invariant: a form already in the table is never dropped, so the table only grows.
 */
export function build(root = defaultRoot) {
  const forms = new Map();
  const add = (table) => {
    for (const [installed, shas] of Object.entries(table.forms)) {
      if (!forms.has(installed)) forms.set(installed, new Set());
      for (const sha of shas) forms.get(installed).add(sha);
    }
  };
  add(readTable(root));
  add(currentForms(root));
  for (const tag of TAGS) {
    if (!hasTag(root, tag)) continue;
    const tagForms = new Map();
    for (const file of tagTemplates(root, tag)) {
      const bytes = execFileSync('git', ['show', `${tag}:${file}`], { cwd: root, maxBuffer: 64 * 1024 * 1024 });
      addTemplate(tagForms, file.slice('templates/'.length), bytes);
    }
    add(toTable(tagForms));
  }
  return toTable(forms);
}

/** The table as committed text. */
export function serialize(table) {
  return `${JSON.stringify(table, null, 2)}\n`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const table = build();
  writeFileSync(path.join(defaultRoot, TABLE_PATH), serialize(table));
  const paths = Object.keys(table.forms);
  console.log(`wrote ${TABLE_PATH}: ${paths.length} paths, ${paths.reduce((n, p) => n + table.forms[p].length, 0)} forms`);
}

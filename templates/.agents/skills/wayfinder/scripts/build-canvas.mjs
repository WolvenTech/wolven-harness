// why: usage is `node build-canvas.mjs <dir>/<slug>-map.md`; the canvas JSON and page are written next to the input.
import { existsSync, readFileSync } from 'node:fs';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const INPUT_SUFFIX = '-map.md';
const TICKET_FILE = /^(\d+)-.+\.md$/;
// why: built from code points so no raw separator character sits in this source file.
const LINE_SEPARATOR = String.fromCharCode(0x2028);
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);

/** Reads a renderer file from the nearest `renderer/` folder walking up from this script. */
function readRenderer(name) {
  let dir = path.dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 10; i++) {
    const file = path.join(dir, 'renderer', name);
    if (existsSync(file)) return readFileSync(file, 'utf8');
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`renderer/${name} not found`);
}

/**
 * Serialises a value as JSON that is safe inside an inline script element:
 * `<` (so `</script>` cannot close it) and the line separators U+2028 and U+2029.
 */
function escapeJson(value) {
  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll(LINE_SEPARATOR, '\\u2028')
    .replaceAll(PARAGRAPH_SEPARATOR, '\\u2029');
}

const isScalar = (value) => value === null || typeof value !== 'object';

/** Pretty JSON with two-space indents where an array of scalars stays on one line, as `["01", "03"]`. */
function stringify(value, indent = '') {
  if (Array.isArray(value)) {
    if (value.every(isScalar)) return `[${value.map((item) => JSON.stringify(item)).join(', ')}]`;
    const inner = `${indent}  `;
    return `[\n${value.map((item) => inner + stringify(item, inner)).join(',\n')}\n${indent}]`;
  }
  if (value && typeof value === 'object') {
    const inner = `${indent}  `;
    const entries = Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .map(([key, item]) => `${inner}${JSON.stringify(key)}: ${stringify(item, inner)}`);
    return `{\n${entries.join(',\n')}\n${indent}}`;
  }
  return JSON.stringify(value);
}

/** One frontmatter value: a quoted or plain string. */
function parseScalar(text) {
  const value = text.trim();
  if (value.startsWith('"') && value.endsWith('"') && value.length > 1) return JSON.parse(value);
  if (value.startsWith("'") && value.endsWith("'") && value.length > 1) return value.slice(1, -1);
  return value;
}

/** A flat inline list such as `["01", "03"]`; a bracket inside an item is not supported. */
function parseList(text) {
  const inner = text.trim().slice(1, -1).trim();
  if (inner === '') return [];
  return inner.split(',').map(parseScalar);
}

/**
 * Splits a Markdown file into its flat frontmatter and body. Frontmatter holds `key: value`
 * scalars and inline lists only; anything else throws naming the file and line.
 */
function parseDocument(text, file) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const meta = {};
  if (lines[0] !== '---') return { meta, body: lines.join('\n') };
  const end = lines.indexOf('---', 1);
  if (end === -1) throw new Error(`${file}:1: frontmatter is not closed`);
  for (let i = 1; i < end; i++) {
    const line = lines[i];
    if (line.trim() === '' || line.trimStart().startsWith('#')) continue;
    const match = /^([A-Za-z_][\w-]*):(?:\s+(.*))?$/.exec(line);
    if (!match) throw new Error(`${file}:${i + 1}: frontmatter must be flat \`key: value\` lines`);
    const raw = (match[2] ?? '').trim();
    if (raw.startsWith('[') && !raw.endsWith(']')) throw new Error(`${file}:${i + 1}: unterminated inline list`);
    if (raw.startsWith('{') || raw === '|' || raw === '>' || raw === '') {
      throw new Error(`${file}:${i + 1}: frontmatter value for ${match[1]} must be a scalar or an inline list`);
    }
    meta[match[1]] = raw.startsWith('[') ? parseList(raw) : parseScalar(raw);
  }
  return { meta, body: lines.slice(end + 1).join('\n') };
}

/** The body's `## ` sections, each as the lines under its heading; a heading name may repeat. */
function sections(body) {
  const found = [];
  for (const line of body.split('\n')) {
    const heading = /^## (.+?)\s*$/.exec(line);
    if (heading) found.push({ name: heading[1], lines: [] });
    else found.at(-1)?.lines.push(line);
  }
  return found;
}

const sectionText = (section) => section.lines.join('\n').trim();
const firstSection = (list, name) => list.find((section) => section.name === name);

/** Text of a list item with each Markdown link replaced by its link text. */
const itemText = (item) => item.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').trim();

const listItems = (section) =>
  (section?.lines ?? []).filter((line) => /^[-*] /.test(line)).map((line) => line.slice(2));

/** The first paragraph under a section, with its lines joined by single spaces. */
function firstParagraph(section) {
  const paragraph = [];
  for (const line of section?.lines ?? []) {
    if (line.trim() === '') {
      if (paragraph.length) break;
    } else paragraph.push(line.trim());
  }
  return paragraph.join(' ');
}

/** Which Decisions so far item links to `file`, as its text; undefined when none does. */
function gistFor(decisions, file) {
  const item = listItems(decisions).find((entry) =>
    [...entry.matchAll(/\]\(([^)]*)\)/g)].some((link) => link[1].replace(/^\.\//, '') === file),
  );
  return item === undefined ? undefined : itemText(item);
}

/** Status rule: open has no resolution, closed and out_of_scope have one, claimed has one only when undermined. */
function statusErrors(id, node, hasResolution) {
  const { status } = node;
  if (status === 'open' && hasResolution) return [`${id}: an open ticket must not have a ## Resolution`];
  if ((status === 'closed' || status === 'out_of_scope') && !hasResolution) {
    return [`${id}: a ${status} ticket needs a ## Resolution`];
  }
  if (status === 'claimed' && hasResolution && node.undermined_by.length === 0) {
    return [`${id}: a claimed ticket has a ## Resolution only when undermined_by is set`];
  }
  return [];
}

async function readTicket(folder, file, decisions) {
  const id = TICKET_FILE.exec(file)[1];
  const { meta, body } = parseDocument(await readFile(path.join(folder, file), 'utf8'), file);
  const parts = sections(body);
  const question = firstSection(parts, 'Question');
  const resolution = firstSection(parts, 'Resolution');
  const gist = gistFor(decisions, file);
  const node = {
    id,
    kind: 'ticket',
    label: meta.title,
    ticket: meta.ticket,
    status: meta.status,
    blocked_by: meta.blocked_by ?? [],
    undermined_by: meta.undermined_by ?? [],
  };
  if (meta.claimed_by !== undefined) node.claimed_by = meta.claimed_by;
  if (meta.claimed_at !== undefined) node.claimed_at = meta.claimed_at;
  node.file = file;
  node.question = question ? sectionText(question) : '';
  if (gist !== undefined) node.gist = gist;
  if (resolution) node.resolution = sectionText(resolution);
  return { node, errors: statusErrors(id, node, Boolean(resolution)) };
}

/** Whether a `docs/maps/.gitignore` sits above the folder, so generated canvases are never tracked. */
function hasMapsIgnore(folder) {
  for (let dir = path.resolve(folder); dir !== path.dirname(dir); dir = path.dirname(dir)) {
    if (path.basename(dir) === 'maps' && path.basename(path.dirname(dir)) === 'docs') {
      return existsSync(path.join(dir, '.gitignore'));
    }
  }
  return false;
}

/** Runs the shared validator with ticket nodes allowed; its errors read `<id>: message`. */
function validateMap(logic, map) {
  const context = vm.createContext({});
  vm.runInContext(logic, context);
  return context.JourneyMapLogic.validate(map, { kinds: ['ticket'] });
}

/** Parses `process.argv` after the script name; only `--radial` is allowed besides the map path. */
function parseArgv(argv) {
  let radial = false;
  const inputs = [];
  for (const arg of argv) {
    if (arg === '--radial') radial = true;
    else if (arg.startsWith('-')) throw new Error(`unknown flag ${arg}`);
    else inputs.push(arg);
  }
  if (inputs.length !== 1) throw new Error(`input must end in ${INPUT_SUFFIX}`);
  return { radial, inputPath: inputs[0] };
}

async function build(inputPath, { radial = false } = {}) {
  if (!inputPath?.endsWith(INPUT_SUFFIX)) throw new Error(`input must end in ${INPUT_SUFFIX}`);
  const folder = path.dirname(inputPath);
  if (!hasMapsIgnore(folder)) {
    throw new Error('no docs/maps/.gitignore above the map folder; add one listing *-canvas.json and *-canvas.html');
  }
  const slug = path.basename(inputPath).slice(0, -INPUT_SUFFIX.length);

  const { meta, body } = parseDocument(await readFile(inputPath, 'utf8'), path.basename(inputPath));
  const parts = sections(body);
  const decisions = firstSection(parts, 'Decisions so far');
  const files = (await readdir(folder)).filter((name) => TICKET_FILE.test(name)).sort();
  const tickets = [];
  for (const file of files) tickets.push(await readTicket(folder, file, decisions));

  const map = {
    version: 1,
    title: meta.title,
    destination: firstParagraph(firstSection(parts, 'Destination')),
    fog: listItems(firstSection(parts, 'Not yet specified')).map((label) => ({ label: itemText(label) })),
    dir: `docs/maps/${slug}`,
    trees: [{ id: 'tickets', nodes: tickets.map((ticket) => ticket.node) }],
  };

  const base = inputPath.slice(0, -INPUT_SUFFIX.length);
  const logic = await readRenderer('logic.js');
  const canvas = await readRenderer('canvas.js');
  const radialJs = await readRenderer('radial.js');
  const errors = [...tickets.flatMap((ticket) => ticket.errors), ...validateMap(logic, map)];
  if (!meta.title) errors.unshift(`${path.basename(inputPath)}: the map needs a title in its frontmatter`);

  // why: a map with errors writes only the page, whose data carries the errors so it shows the error panel.
  const data = errors.length ? { version: 1, title: map.title, errors } : map;
  let shell;
  let renderer;
  let output;
  if (radial) {
    const draw = await readRenderer('radial-draw.js');
    shell = await readRenderer('radial.html');
    renderer = logic + canvas + radialJs + draw;
    output = `${base}-radial-canvas.html`;
  } else {
    const lanes = await readRenderer('lanes.js');
    const draw = await readRenderer('lanes-draw.js');
    shell = await readRenderer('lanes.html');
    renderer = logic + canvas + radialJs + lanes + draw;
    output = `${base}-canvas.html`;
  }
  // hazard: a replacer function keeps `$` sequences in the data from being read as replacement patterns.
  const html = shell.replace(/@@DATA@@|@@RENDERER@@/g, (slot) =>
    slot === '@@DATA@@' ? escapeJson(data) : renderer,
  );
  await writeFile(output, html);

  if (errors.length) {
    for (const error of errors) console.error(error);
    process.exitCode = 1;
    return;
  }
  await writeFile(`${base}-canvas.json`, `${stringify(map)}\n`);
  console.log(`wayfinder: wrote ${output} (${tickets.length} tickets)`);
}

try {
  const { radial, inputPath } = parseArgv(process.argv.slice(2));
  await build(inputPath, { radial });
} catch (error) {
  console.error(`wayfinder: ${error.message}`);
  process.exitCode = 1;
}

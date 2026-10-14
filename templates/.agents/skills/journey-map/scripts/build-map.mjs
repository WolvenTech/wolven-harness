// why: usage is `node build-map.mjs <dir>/<slug>-map.json`; the page is written next to the input.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const INPUT_SUFFIX = '-map.json';
// why: built from code points so no raw separator character sits in this source file.
const LINE_SEPARATOR = String.fromCharCode(0x2028);
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);

const readRenderer = (name) => readFile(fileURLToPath(new URL(`../renderer/${name}`, import.meta.url)), 'utf8');

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

/** The input as the agent can open it from where the build ran; never an absolute path, since the page may be published. */
function pagePath(inputPath) {
  const relative = path.relative(process.cwd(), path.resolve(inputPath));
  return relative.startsWith('..') ? path.basename(inputPath) : relative;
}

const countNodes = (map) => map.trees.reduce((sum, tree) => sum + tree.nodes.length, 0);

async function build(inputPath) {
  if (!inputPath?.endsWith(INPUT_SUFFIX)) throw new Error(`input must end in ${INPUT_SUFFIX}`);
  const map = JSON.parse(await readFile(inputPath, 'utf8'));

  const [logic, canvas, draw, shell] = await Promise.all([
    readRenderer('logic.js'),
    readRenderer('canvas.js'),
    readRenderer('draw.js'),
    readRenderer('page.html'),
  ]);
  const context = vm.createContext({});
  vm.runInContext(logic, context);
  const errors = context.JourneyMapLogic.validate(map);

  // hazard: a replacer function keeps `$` sequences in the data from being read as replacement patterns.
  const html = shell.replace(/@@DATA@@|@@RENDERER@@/g, (slot) =>
    slot === '@@DATA@@' ? escapeJson({ tree: map, path: pagePath(inputPath) }) : logic + canvas + draw,
  );
  const output = `${inputPath.slice(0, -'.json'.length)}.html`;
  // why: an invalid map still writes the page so it can show the error panel.
  await writeFile(output, html);

  if (errors.length) {
    for (const error of errors) console.error(error);
    process.exitCode = 1;
    return;
  }
  console.log(`journey-map: wrote ${output} (${countNodes(map)} nodes)`);
}

try {
  await build(process.argv[2]);
} catch (error) {
  console.error(`journey-map: ${error.message}`);
  process.exitCode = 1;
}

// PROTOTYPE — throwaway. Usage: node prototypes/journey-details/build.mjs [input.json]
import { readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
const read = (name) => readFile(resolve(here, 'renderer', name), 'utf8');
const escapeJson = (value) =>
  JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll(String.fromCharCode(0x2028), '\\u2028')
    .replaceAll(String.fromCharCode(0x2029), '\\u2029');

async function build(arg) {
  const input = arg ? resolve(arg) : resolve(here, 'cj-001-journey.json');
  const output = arg ? input.replace(/\.json$/, '.html') : resolve(here, 'cj-001-journey-details.html');
  const map = JSON.parse(await readFile(input, 'utf8'));
  const [logic, draw, shell] = await Promise.all([read('logic.js'), read('draw.js'), read('page.html')]);
  const context = vm.createContext({});
  vm.runInContext(logic, context);
  const errors = context.JourneyMapLogic.validate(map);
  if (errors.length) {
    for (const error of errors) console.error(`journey-details: ${error}`);
    process.exitCode = 1;
    return;
  }
  const html = shell.replace(/@@DATA@@|@@RENDERER@@/g, (slot) =>
    slot === '@@DATA@@' ? escapeJson({ tree: map, path: basename(input) }) : logic + draw,
  );
  await writeFile(output, html);
  console.log(`journey-details: wrote ${output}`);
}

try {
  await build(process.argv[2]);
} catch (error) {
  console.error(`journey-details: ${error.message}`);
  process.exitCode = 1;
}

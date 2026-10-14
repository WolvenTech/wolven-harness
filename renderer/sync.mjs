import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** The renderer files each skill loads; a skill's `renderer/` folder holds exactly these. */
export const MANIFEST = {
  'journey-map': ['logic.js', 'canvas.js', 'draw.js', 'page.html'],
  wayfinder: ['logic.js', 'canvas.js', 'radial.js', 'radial-draw.js', 'radial.html'],
};

/** Where each skill's copy lives: the shipped template and this repo's installed copy. */
export const COPY_ROOTS = ['templates/.agents/skills', '.agents/skills'];

const here = path.dirname(fileURLToPath(import.meta.url));

/** Each copy that differs from the source, is missing, or is outside the manifest, as `<problem>: <path>`. */
export function drift(root = path.resolve(here, '..')) {
  const problems = [];
  for (const [skill, files] of Object.entries(MANIFEST)) {
    for (const copyRoot of COPY_ROOTS) {
      const dir = path.join(copyRoot, skill, 'renderer');
      for (const file of files) {
        const copy = path.join(root, dir, file);
        if (!existsSync(copy)) problems.push(`missing: ${path.join(dir, file)}`);
        else if (!readFileSync(copy).equals(readFileSync(path.join(root, 'renderer', file)))) {
          problems.push(`changed: ${path.join(dir, file)}`);
        }
      }
      if (!existsSync(path.join(root, dir))) continue;
      for (const file of readdirSync(path.join(root, dir)).sort()) {
        if (!files.includes(file)) problems.push(`stray: ${path.join(dir, file)}`);
      }
    }
  }
  return problems;
}

/** Overwrites every copy from the source and removes strays; returns one line per path it changed. */
export function sync(root = path.resolve(here, '..')) {
  const changed = [];
  for (const problem of drift(root)) {
    const [kind, rel] = problem.split(': ');
    const target = path.join(root, rel);
    if (kind === 'stray') rmSync(target, { recursive: true, force: true });
    else {
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, readFileSync(path.join(root, 'renderer', path.basename(rel))));
    }
    changed.push(`${kind === 'stray' ? 'removed' : 'wrote'} ${rel}`);
  }
  return changed;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const line of sync()) console.log(line);
}

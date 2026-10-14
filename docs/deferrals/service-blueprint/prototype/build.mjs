// PROTOTYPE — throwaway.
// why: usage is `node build.mjs <dir>/<name>.json`; the page is written beside it as `<name>-map.html`.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const here = (name) => fileURLToPath(new URL(name, import.meta.url));
const LS = String.fromCharCode(0x2028);
const PS = String.fromCharCode(0x2029);

// hazard: `<` and the line separators would break out of the inline JSON script element.
const escapeJson = (v) => JSON.stringify(v).replaceAll('<', '\\u003c').replaceAll(LS, '\\u2028').replaceAll(PS, '\\u2029');

const FIELDS = {
  top: ['//', 'version', 'kind', 'title', 'subtitle', 'walk', 'scale', 'scenario', 'personas', 'stages', 'lanes', 'mood', 'cells', 'lines', 'annotations'],
  scale: ['min', 'max'],
  persona: ['id', 'name', 'role', 'goal', 'color', 'illustrative'],
  stage: ['id', 'label', 'steps'],
  step: ['id', 'label'],
  lane: ['id', 'label', 'type', 'illustrative'],
  cell: ['lane', 'at', 'text', 'items', 'illustrative'],
  line: ['id', 'type', 'between', 'label', 'illustrative'],
  annotation: ['on', 'text'],
};
const LANE_TYPES = ['text', 'mood', 'frontstage', 'backstage', 'process'];
const LINE_TYPES = ['interaction', 'visibility', 'internal'];
const ID = /^[a-z0-9][a-z0-9-]*$/;

function validate(j) {
  const errors = [];
  const err = (id, msg) => errors.push(`journey ${id}: ${msg}`);
  const unknown = (id, obj, allowed) => {
    for (const k of Object.keys(obj)) if (!allowed.includes(k)) err(id, `unknown field "${k}"`);
  };
  const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
  if (!isObj(j)) return ['journey (file): must be a JSON object'];
  unknown('(file)', j, FIELDS.top);
  if (j.version !== 1) err('(file)', 'version must be 1');
  if (j.kind !== 'journey') err('(file)', 'kind must be "journey"');
  if (typeof j.title !== 'string' || !j.title) err('(file)', 'title is required');
  if (j.walk !== undefined && !['steps', 'whole'].includes(j.walk)) err('walk', 'must be "steps" or "whole"');
  if (typeof j.scenario !== 'string' || !j.scenario) err('scenario', 'is required');

  let scale = { min: -2, max: 2 };
  if (j.scale !== undefined) {
    if (!isObj(j.scale) || typeof j.scale.min !== 'number' || typeof j.scale.max !== 'number' || j.scale.min >= j.scale.max) {
      err('scale', 'needs numbers min < max');
    } else {
      unknown('scale', j.scale, FIELDS.scale);
      scale = j.scale;
    }
  }

  const ids = new Map();
  const claim = (id, what) => {
    if (typeof id !== 'string' || !ID.test(id)) return err(String(id), `${what} id must match ${ID} (missing or malformed)`);
    if (ids.has(id)) return err(id, `${what} id duplicates a ${ids.get(id)}`);
    ids.set(id, what);
  };
  const list = (key) => (j[key] === undefined && ['cells', 'lines', 'annotations'].includes(key) ? [] : Array.isArray(j[key]) ? j[key] : (err(key, 'must be an array'), []));

  const personas = list('personas');
  if (!personas.length) err('personas', 'needs at least one persona');
  for (const p of personas) {
    if (!isObj(p)) { err('personas', 'entry must be an object'); continue; }
    unknown(p.id ?? '(persona)', p, FIELDS.persona);
    claim(p.id, 'persona');
    if (typeof p.name !== 'string' || !p.name) err(String(p.id), 'name is required');
  }

  const stageOf = new Map();
  const stepIds = new Set();
  const stageIds = new Set();
  const stages = list('stages');
  if (!stages.length) err('stages', 'needs at least one stage');
  for (const s of stages) {
    if (!isObj(s)) { err('stages', 'entry must be an object'); continue; }
    unknown(s.id ?? '(stage)', s, FIELDS.stage);
    claim(s.id, 'stage');
    stageIds.add(s.id);
    if (typeof s.label !== 'string' || !s.label) err(String(s.id), 'label is required');
    if (!Array.isArray(s.steps) || !s.steps.length) { err(String(s.id), 'needs at least one step'); continue; }
    for (const st of s.steps) {
      if (!isObj(st)) { err(String(s.id), 'step must be an object'); continue; }
      unknown(st.id ?? '(step)', st, FIELDS.step);
      claim(st.id, 'step');
      stepIds.add(st.id);
      stageOf.set(st.id, s.id);
      if (typeof st.label !== 'string' || !st.label) err(String(st.id), 'label is required');
    }
  }

  const laneIdx = new Map();
  const lanes = list('lanes');
  let moodLanes = 0;
  lanes.forEach((l, i) => {
    if (!isObj(l)) return err('lanes', 'entry must be an object');
    unknown(l.id ?? '(lane)', l, FIELDS.lane);
    claim(l.id, 'lane');
    laneIdx.set(l.id, i);
    if (typeof l.label !== 'string' || !l.label) err(String(l.id), 'label is required');
    if (!LANE_TYPES.includes(l.type)) err(String(l.id), `type must be one of ${LANE_TYPES.join(', ')}`);
    if (l.type === 'mood') moodLanes++;
  });
  if (moodLanes > 1) err('lanes', 'at most one lane may have type "mood"');
  const laneType = (id) => lanes.find((l) => l?.id === id)?.type;

  const mood = j.mood ?? {};
  if (!isObj(mood)) err('mood', 'must be an object of personaId -> { stageOrStepId: number }');
  else {
    if (Object.keys(mood).length && !moodLanes) err('mood', 'values need a lane with type "mood"');
    for (const [pid, vals] of Object.entries(mood)) {
      if (ids.get(pid) !== 'persona') { err(pid, 'mood names a missing persona'); continue; }
      if (!isObj(vals)) { err(pid, 'mood must be an object of stage or step id -> number'); continue; }
      for (const [at, v] of Object.entries(vals)) {
        const where = `mood ${pid}.${at}`;
        if (!stageIds.has(at) && !stepIds.has(at)) err(where, 'names a missing stage or step');
        else if (typeof v !== 'number' || Number.isNaN(v)) err(where, `${JSON.stringify(v)} is not a number`);
        else if (v < scale.min || v > scale.max) err(where, `${v} is outside scale ${scale.min}..${scale.max}`);
      }
    }
  }

  const cellIds = new Set();
  const cellAt = new Set();
  for (const c of list('cells')) {
    if (!isObj(c)) { err('cells', 'entry must be an object'); continue; }
    const cid = `${c.lane}:${c.at}`;
    unknown(cid, c, FIELDS.cell);
    if (!laneIdx.has(c.lane)) err(cid, `cell names a missing lane "${c.lane}"`);
    else if (laneType(c.lane) === 'mood') err(cid, 'mood lane takes values in "mood", not cells');
    if (!stageIds.has(c.at) && !stepIds.has(c.at)) err(cid, `cell names a missing step or stage "${c.at}"`);
    if (cellIds.has(cid)) err(cid, 'duplicate cell');
    cellIds.add(cid);
    const stageId = stepIds.has(c.at) ? stageOf.get(c.at) : c.at;
    cellAt.add(`${c.lane}:${stageId}:${stepIds.has(c.at) ? 'step' : 'stage'}`);
    if ((c.text === undefined) === (c.items === undefined)) err(cid, 'needs exactly one of "text" or "items"');
    if (c.text !== undefined && typeof c.text !== 'string') err(cid, 'text must be a string');
    if (c.items !== undefined && (!Array.isArray(c.items) || c.items.some((x) => typeof x !== 'string'))) err(cid, 'items must be an array of strings');
  }
  for (const k of cellAt) {
    const [lane, stage, kind] = k.split(':');
    if (kind === 'stage' && cellAt.has(`${lane}:${stage}:step`)) err(`${lane}:${stage}`, 'stage-wide cell overlaps step cells in the same lane');
  }

  for (const l of list('lines')) {
    if (!isObj(l)) { err('lines', 'entry must be an object'); continue; }
    unknown(l.id ?? '(line)', l, FIELDS.line);
    claim(l.id, 'line');
    if (!LINE_TYPES.includes(l.type)) err(String(l.id), `type must be one of ${LINE_TYPES.join(', ')}`);
    const b = l.between;
    if (!Array.isArray(b) || b.length !== 2) { err(String(l.id), '"between" needs [laneAbove, laneBelow]'); continue; }
    for (const x of b) if (!laneIdx.has(x)) err(String(l.id), `between names a missing lane "${x}"`);
    if (laneIdx.has(b[0]) && laneIdx.has(b[1]) && laneIdx.get(b[0]) >= laneIdx.get(b[1])) err(String(l.id), 'first lane must sit above the second');
  }

  const targets = new Set([...ids].filter(([, w]) => ['persona', 'stage', 'step'].includes(w)).map(([k]) => k));
  for (const c of cellIds) targets.add(c);
  if (moodLanes) for (const s of stepIds) targets.add(`mood:${s}`);
  for (const a of list('annotations')) {
    if (!isObj(a)) { err('annotations', 'entry must be an object'); continue; }
    unknown(String(a.on), a, FIELDS.annotation);
    if (!targets.has(a.on)) err(String(a.on), 'annotation names a missing element');
    if (typeof a.text !== 'string' || !a.text) err(String(a.on), 'annotation needs text');
  }
  return errors;
}

async function build(input) {
  if (!input?.endsWith('.json')) throw new Error('usage: node build.mjs <file>.json');
  const raw = await readFile(input, 'utf8');
  let map;
  let errors;
  try {
    map = JSON.parse(raw);
    errors = validate(map);
  } catch (e) {
    map = null;
    errors = [`journey (file): not valid JSON: ${e.message}`];
  }
  const [shell, core, layouts] = await Promise.all(['page.html', 'renderer.js', 'layouts.js'].map((n) => readFile(here(n), 'utf8')));
  // hazard: a replacer function stops `$` sequences in the data being read as replacement patterns.
  const html = shell.replace(/@@DATA@@|@@RENDERER@@/g, (slot) => (slot === '@@DATA@@' ? escapeJson({ map, path: input, errors }) : `${layouts}\n${core}`));
  const output = `${input.slice(0, -'.json'.length)}-map.html`;
  // why: an invalid file still writes the page so the Human sees the errors there too.
  await writeFile(output, html);
  if (errors.length) {
    for (const e of errors) console.error(e);
    process.exitCode = 1;
    return;
  }
  console.log(`visual-map: wrote ${output}`);
}

try {
  await build(process.argv[2]);
} catch (e) {
  console.error(`visual-map: ${e.message}`);
  process.exitCode = 1;
}

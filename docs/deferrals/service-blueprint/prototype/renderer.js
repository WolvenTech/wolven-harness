// PROTOTYPE — throwaway.
// Shared by every variant: model, camera, reveal, notes, Copy for agent, variant switcher.
const DATA = JSON.parse(document.getElementById('map-data').textContent);
const $ = (id) => document.getElementById(id);
const SVGNS = 'http://www.w3.org/2000/svg';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const world = $('world');
const fx = $('fx');
const notesLayer = $('notes');
const stageEl = $('stage');
const PEN = '<svg viewBox="0 0 20 20"><path d="M3 17l1-4L14 3l3 3L7 16z"/><path d="M12 5l3 3"/></svg>';
const fmt = (v) => (v > 0 ? `+${v}` : String(v).replace('-', '−'));

function buildModel(j) {
  const scale = j.scale || { min: -2, max: 2 };
  const palette = ['#5b5bd6', '#e11d74', '#0f766e', '#c2410c'];
  const personas = j.personas.map((p, i) => ({ ...p, color: p.color || palette[i % palette.length] }));
  const stages = [];
  const steps = [];
  j.stages.forEach((s, i) => {
    const st = { id: s.id, label: s.label, index: i, steps: [] };
    for (const x of s.steps) {
      const step = { id: x.id, label: x.label, stage: st, si: steps.length };
      st.steps.push(step);
      steps.push(step);
    }
    stages.push(st);
  });
  const cells = {};
  for (const c of j.cells || []) cells[`${c.lane}:${c.at}`] = c;
  const lanes = j.lanes.map((l) => ({ ...l, bp: ['frontstage', 'backstage', 'process'].includes(l.type) }));
  const moodIdx = lanes.findIndex((l) => l.type === 'mood');
  const order = [...personas.map((p) => p.id)];
  const labels = new Map(personas.map((p) => [p.id, p.name]));
  for (const s of stages) {
    order.push(s.id);
    labels.set(s.id, s.label);
    for (const st of s.steps) {
      order.push(st.id);
      labels.set(st.id, st.label);
    }
  }
  for (const l of lanes) {
    if (l.type === 'mood') {
      for (const st of steps) {
        order.push(`mood:${st.id}`);
        labels.set(`mood:${st.id}`, `${l.label} · ${st.label}`);
      }
      continue;
    }
    for (const s of stages) {
      const names = [s, ...s.steps];
      for (const n of names) {
        if (cells[`${l.id}:${n.id}`]) {
          order.push(`${l.id}:${n.id}`);
          labels.set(`${l.id}:${n.id}`, `${l.label} · ${n.label}`);
        }
      }
    }
  }
  const moodOf = (p, step) => {
    const m = (j.mood || {})[p.id] || {};
    return m[step.id] ?? m[step.stage.id];
  };
  const hasIllus = personas.some((p) => p.illustrative) || lanes.some((l) => l.illustrative) || (j.lines || []).some((l) => l.illustrative) || (j.cells || []).some((c) => c.illustrative);
  return {
    j, scale, personas, stages, steps, lanes, cells, moodIdx, order, labels, moodOf, hasIllus,
    lines: j.lines || [],
    cellFor: (laneId, step) => cells[`${laneId}:${step.id}`] || cells[`${laneId}:${step.stage.id}`] || null,
    yOf: (v, top, bottom) => top + ((scale.max - v) / (scale.max - scale.min)) * (bottom - top),
  };
}

let M;
const targets = new Map();
const notes = {};
let editing = null;
let cur = 0;
let whole = false;
let variant = 'A';
let layout = null;
let cam = { x: 0, y: 0, k: 1 };
const moved = { v: false };

// ---------- building blocks used by the layouts ----------
function box(cls, x, y, w, h, html, stage) {
  const d = document.createElement('div');
  d.className = `box ${cls || ''}`;
  d.style.left = `${x}px`;
  d.style.top = `${y}px`;
  if (w != null) d.style.width = `${w}px`;
  if (h != null) d.style.height = `${h}px`;
  if (stage != null) d.dataset.stage = stage;
  if (html) d.innerHTML = html;
  world.insertBefore(d, notesLayer);
  return d;
}
function svgEl(tag, attrs, parent) {
  const e = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, v);
  (parent || fx).appendChild(e);
  return e;
}
const stageGroups = new Map();
function sg(stage) {
  if (!stageGroups.has(stage)) {
    const g = svgEl('g', {});
    if (stage != null) g.dataset.stage = stage;
    stageGroups.set(stage, g);
  }
  return stageGroups.get(stage);
}
function target(el, id, label, stage, self) {
  const t = { id, label, el, stage };
  targets.set(id, t);
  if (self) {
    el.classList.add('selfpen');
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `Note on ${label}`);
    el.addEventListener('click', () => addNote(id));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        addNote(id);
      }
    });
  } else {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pen';
    b.innerHTML = PEN;
    b.setAttribute('aria-label', `Add note: ${label}`);
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      addNote(id);
    });
    el.appendChild(b);
    t.pen = b;
  }
  return t;
}
function curve(pts, color, dashed) {
  for (let j = 0; j < pts.length; j++) {
    const p = pts[j];
    if (p.v == null) continue;
    const g = sg(p.stage);
    const a = pts[j - 1];
    if (a && a.v != null) {
      const dx = (p.x - a.x) / 2;
      svgEl('path', {
        d: `M${a.x} ${a.y} C${a.x + dx} ${a.y} ${p.x - dx} ${p.y} ${p.x} ${p.y}`,
        fill: 'none', stroke: color, 'stroke-width': 3.5, 'stroke-linecap': 'round', ...(dashed ? { 'stroke-dasharray': '7 6' } : {}),
      }, g);
    }
    svgEl('circle', { cx: p.x, cy: p.y, r: 5, fill: color, stroke: '#fff', 'stroke-width': 2 }, g);
    svgEl('text', { x: p.x, y: p.y - 11, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 600, fill: color }, g).textContent = fmt(p.v);
  }
}
function arrow(x1, y1, x2, y2, color, stage) {
  const g = svgEl('g', {});
  if (stage != null) g.dataset.stage = stage;
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const L = 9;
  const segs = [[x1, y1, x2, y2], [x2, y2, x2 - L * Math.cos(ang - 0.5), y2 - L * Math.sin(ang - 0.5)], [x2, y2, x2 - L * Math.cos(ang + 0.5), y2 - L * Math.sin(ang + 0.5)]];
  // why: rough.js is a CDN script; offline the arrows fall back to plain lines.
  const rc = window.rough ? window.rough.svg(fx) : null;
  for (const s of segs) {
    if (rc) g.appendChild(rc.line(s[0], s[1], s[2], s[3], { stroke: color, strokeWidth: 1.6, roughness: 1.2, bowing: 1, seed: 7 }));
    else svgEl('line', { x1: s[0], y1: s[1], x2: s[2], y2: s[3], stroke: color, 'stroke-width': 1.6, 'stroke-linecap': 'round' }, g);
  }
}
function personaEntry(p) {
  const d = document.createElement('div');
  d.className = 'who';
  const ini = p.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('');
  d.innerHTML = `<div class="av" style="background:${p.color}">${esc(ini)}</div><div><b>${esc(p.name)}</b>${p.illustrative ? '<em class="tag-ill">illustrative</em>' : ''}<span>${esc(p.role || '')}</span><span>Goal: ${esc(p.goal || '')}</span></div>`;
  d.style.flex = '1 1 280px';
  target(d, p.id, p.name, undefined, false);
  return d;
}
function personaCard(x, y, w, cls) {
  const card = box(`card persona-card ${cls || ''}`, x, y, w, null, '<h3>Persona and scenario</h3>');
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px 16px';
  for (const p of M.personas) row.appendChild(personaEntry(p));
  card.appendChild(row);
  const sc = document.createElement('p');
  sc.innerHTML = `<b>Scenario.</b> ${esc(M.j.scenario)}`;
  card.appendChild(sc);
  const lg = document.createElement('div');
  lg.className = 'legend';
  lg.innerHTML = `Mood scale ${fmt(M.scale.min)} to ${fmt(M.scale.max)}.${M.hasIllus ? ' <span class="tag-ill" style="margin:0 4px 0 0">illustrative</span>dashed and hatched = invented to exercise the layout, not research data.' : ''}`;
  card.appendChild(lg);
  return card;
}
const LINE_META = { interaction: ['Line of interaction', '#2563eb'], visibility: ['Line of visibility', '#c2410c'], internal: ['Line of internal interaction', '#0f766e'] };
const lineLabel = (l) => `${l.label || LINE_META[l.type][0]}${l.illustrative ? ' · illustrative' : ''}`;
function cellHtml(lane, cell, extraCap) {
  const ill = lane.illustrative || cell.illustrative;
  const body = cell.items ? `<ul>${cell.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : `<div class="${lane.id === 'thoughts' ? 'quote' : ''}">${esc(cell.text)}</div>`;
  return { ill, html: `<div class="cap">${esc(lane.label)}${extraCap ? ` · ${esc(extraCap)}` : ''}${ill ? '<em class="tag-ill">illustrative</em>' : ''}</div>${body}` };
}
function estimate(cell, width) {
  const cpl = Math.max(8, (width - 28) / 6.4);
  const lines = cell.items ? cell.items.reduce((n, t) => n + Math.ceil((t.length + 2) / cpl), 0) : Math.ceil(cell.text.length / cpl);
  return 38 + lines * 17.5;
}

// ---------- notes ----------
function worldRect(el) {
  let x = 0;
  let y = 0;
  for (let e = el; e && e !== world; e = e.offsetParent) {
    x += e.offsetLeft;
    y += e.offsetTop;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}
function placeNotes() {
  notesLayer.innerHTML = '';
  const placed = [];
  const rank = (id) => M.order.indexOf(id);
  const ordered = [...targets.values()].sort((a, b) => rank(a.id) - rank(b.id));
  for (const t of ordered) {
    const r = worldRect(t.el);
    const list = [];
    for (const a of M.j.annotations || []) if (a.on === t.id) list.push({ kind: 'agent', text: a.text });
    if (t.id in notes) list.push({ kind: 'human', text: notes[t.id] });
    if (t.pen) t.pen.classList.toggle('has', Boolean(notes[t.id]) || editing === t.id);
    // invariant: agent stickies are placed before the Human one, and every sticky avoids all earlier ones, so a Human note never covers an annotation.
    for (const s of list) {
      const el = document.createElement('div');
      el.className = `sticky ${s.kind}`;
      if (t.stage != null) el.dataset.stage = t.stage;
      if (s.kind === 'agent') {
        el.innerHTML = `<b>Agent annotation</b>${esc(s.text)}`;
      } else if (editing === t.id) {
        const ta = document.createElement('textarea');
        ta.value = s.text;
        ta.setAttribute('aria-label', `Note on ${t.label}`);
        ta.placeholder = 'Note for your agent…';
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          commit(t.id, ta.value);
        };
        ta.addEventListener('blur', finish);
        ta.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' || (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) ta.blur();
        });
        el.appendChild(ta);
        el.dataset.editing = '1';
      } else {
        el.tabIndex = 0;
        el.setAttribute('role', 'button');
        el.setAttribute('aria-label', `Edit note: ${t.label}`);
        el.textContent = s.text;
        el.addEventListener('click', () => addNote(t.id));
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            addNote(t.id);
          }
        });
      }
      el.dataset.on = t.id;
      notesLayer.appendChild(el);
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      let x = r.x + 10;
      let y = r.y + r.h - 4;
      for (let guard = 0; guard < 60; guard++) {
        const hit = placed.find((p) => x < p.x + p.w + 8 && x + w + 8 > p.x && y < p.y + p.h + 8 && y + h + 8 > p.y);
        if (!hit) break;
        y = hit.y + hit.h + 10;
      }
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      placed.push({ x, y, w, h });
    }
  }
  applyReveal();
  const ta = notesLayer.querySelector('textarea');
  if (ta && document.activeElement !== ta) ta.focus();
}
function addNote(id) {
  if (moved.v) return;
  if (!(id in notes)) notes[id] = '';
  editing = id;
  placeNotes();
}
function commit(id, value) {
  const v = value.trim();
  if (v) notes[id] = v;
  else delete notes[id];
  if (editing === id) editing = null;
  placeNotes();
  updateStatus();
}

// ---------- reveal, stepper, camera ----------
function applyReveal() {
  document.body.classList.toggle('whole', whole);
  for (const e of document.querySelectorAll('#world [data-stage]')) e.classList.toggle('unreached', !(Number(e.dataset.stage) <= cur));
  const n = M.stages.length;
  $('stagelabel').textContent = `Stage ${cur + 1} of ${n} · ${M.stages[cur].label}`;
  $('back').disabled = cur === 0;
  $('next').disabled = cur === n - 1;
  $('show-all').setAttribute('aria-pressed', String(whole));
  updateStatus();
}
let statusTimer = 0;
function setStatus(msg) {
  $('status').textContent = msg;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(updateStatus, 3500);
}
function updateStatus() {
  const n = Object.values(notes).filter(Boolean).length;
  $('status').textContent = `${whole ? 'Whole map' : `${cur + 1} of ${M.stages.length} stages`} · ${n} note${n === 1 ? '' : 's'}`;
}
function setCam(c, animate) {
  cam = c;
  world.style.transition = animate ? 'transform .35s ease' : 'none';
  world.style.transform = `translate(${c.x}px,${c.y}px) scale(${c.k})`;
  $('pct').textContent = `${Math.round(c.k * 100)}%`;
}
function fitRect(r, animate) {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const top = $('top').getBoundingClientRect().bottom + 12;
  const bottom = 64;
  const aw = W - 32;
  const ah = H - top - bottom;
  const k = Math.max(0.12, Math.min(aw / r.w, ah / r.h, 1.15));
  setCam({ k, x: (W - r.w * k) / 2 - r.x * k, y: top + (ah - r.h * k) / 2 - r.y * k }, animate);
}
function focusCam(animate) {
  if (!layout) return;
  fitRect(whole ? layout.whole : layout.focus(cur), animate);
}
function zoomAt(px, py, factor) {
  const k = Math.min(3, Math.max(0.1, cam.k * factor));
  const f = k / cam.k;
  setCam({ k, x: px - (px - cam.x) * f, y: py - (py - cam.y) * f }, false);
}
function go(delta) {
  cur = Math.min(M.stages.length - 1, Math.max(0, cur + delta));
  applyReveal();
  focusCam(true);
}

// ---------- pan, zoom, keys ----------
let drag = null;
stageEl.addEventListener('pointerdown', (e) => {
  if (e.button !== 0 || e.target.closest('button,textarea,.selfpen,.sticky')) return;
  drag = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y };
  moved.v = false;
});
window.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.x;
  const dy = e.clientY - drag.y;
  if (!moved.v && Math.hypot(dx, dy) > 4) {
    moved.v = true;
    stageEl.classList.add('panning');
  }
  if (moved.v) setCam({ ...cam, x: drag.cx + dx, y: drag.cy + dy }, false);
});
window.addEventListener('pointerup', () => {
  drag = null;
  stageEl.classList.remove('panning');
  setTimeout(() => { moved.v = false; }, 0);
});
stageEl.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (e.ctrlKey || e.metaKey) zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.01));
  else setCam({ ...cam, x: cam.x - e.deltaX, y: cam.y - e.deltaY }, false);
}, { passive: false });

// ---------- Copy for agent ----------
function feedbackText() {
  const lines = [`visual-map feedback for ${DATA.path}`];
  const ordered = [...targets.values()].filter((t) => notes[t.id]).sort((a, b) => M.order.indexOf(a.id) - M.order.indexOf(b.id));
  for (const t of ordered) lines.push(`${t.id} ${JSON.stringify(t.label)}: note ${JSON.stringify(notes[t.id])}`);
  return { text: lines.join('\n'), count: ordered.length };
}
async function copyFeedback() {
  if (editing) document.activeElement?.blur?.();
  const { text, count } = feedbackText();
  if (!count) return setStatus('Add a note first, then copy.');
  try {
    await navigator.clipboard.writeText(text);
    $('feedback-panel').hidden = true;
    setStatus(`Copied ${count} note${count === 1 ? '' : 's'} for your agent.`);
  } catch {
    $('feedback').value = text;
    $('feedback-panel').hidden = false;
    $('feedback').focus();
    $('feedback').select();
    setStatus('Clipboard blocked. Copy from the box.');
  }
}

// ---------- variants ----------
const VARIANTS = { A: ['Classic grid', () => layoutA(M)], B: ['Mood spine', () => layoutB(M)], C: ['Stage cards', () => layoutC(M)] };
function render() {
  for (const e of [...world.children]) if (e !== fx && e !== notesLayer) e.remove();
  fx.innerHTML = '';
  stageGroups.clear();
  targets.clear();
  layout = VARIANTS[variant][1]();
  $('vlabel').textContent = `${variant} · ${VARIANTS[variant][0]}`;
  placeNotes();
}
function setVariant(v, replace) {
  variant = v;
  const u = new URL(location.href);
  u.searchParams.set('variant', v);
  if (replace !== false) history.replaceState(null, '', u);
  render();
  focusCam(true);
}
const keys = Object.keys(VARIANTS);
const stepVariant = (d) => setVariant(keys[(keys.indexOf(variant) + d + keys.length) % keys.length]);
window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.('input,textarea,select,[contenteditable]')) return;
  if (e.key === 'ArrowLeft') stepVariant(-1);
  else if (e.key === 'ArrowRight') stepVariant(1);
});

function main() {
  if (DATA.errors.length) {
    $('title').textContent = 'This map needs a fix';
    $('error-text').textContent = DATA.errors.join('\n');
    $('errors').hidden = false;
    for (const id of ['back', 'next', 'show-all', 'copy', 'zoom', 'variants', 'status']) $(id).hidden = true;
    stageEl.hidden = true;
    return;
  }
  M = buildModel(DATA.map);
  document.title = M.j.title;
  $('title').textContent = M.j.title;
  $('subtitle').textContent = M.j.subtitle || '';
  whole = M.j.walk === 'whole';
  const q = new URLSearchParams(location.search).get('variant');
  variant = VARIANTS[q] ? q : 'A';
  $('back').addEventListener('click', () => go(-1));
  $('next').addEventListener('click', () => go(1));
  $('show-all').addEventListener('click', () => {
    whole = !whole;
    applyReveal();
    focusCam(true);
  });
  $('copy').addEventListener('click', copyFeedback);
  $('close-feedback').addEventListener('click', () => { $('feedback-panel').hidden = true; });
  $('zin').addEventListener('click', () => zoomAt(innerWidth / 2, innerHeight / 2, 1.2));
  $('zout').addEventListener('click', () => zoomAt(innerWidth / 2, innerHeight / 2, 1 / 1.2));
  $('pct').addEventListener('click', () => zoomAt(innerWidth / 2, innerHeight / 2, 1 / cam.k));
  $('fit').addEventListener('click', () => focusCam(true));
  $('vprev').addEventListener('click', () => stepVariant(-1));
  $('vnext').addEventListener('click', () => stepVariant(1));
  window.addEventListener('resize', () => focusCam(false));
  render();
  focusCam(false);
  document.fonts?.ready.then(() => {
    render();
    focusCam(false);
  });
}
main();

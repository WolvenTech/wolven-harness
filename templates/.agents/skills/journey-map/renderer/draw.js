(() => {
  const L = globalThis.JourneyMapLogic;
  const { showErrors, el } = globalThis.CanvasCore;
  const M = L.M;
  const { tree: map, path } = JSON.parse(document.getElementById('map-data').textContent);
  const ROUGH_URL = 'https://cdn.jsdelivr.net/npm/roughjs@4.6.6/bundled/rough.js';

  const statusEl = document.getElementById('status');
  const feedbackPanel = document.getElementById('feedback-panel');
  const feedbackBox = document.getElementById('feedback');
  const copyButton = document.getElementById('copy');

  document.getElementById('title').textContent = map?.title || 'Journey map';
  document.title = map?.title || 'Journey map';
  document.getElementById('subtitle').textContent = map?.subtitle || '';

  const errors = L.validate(map);
  if (errors.length) {
    showErrors(errors);
    return;
  }
  if (!globalThis.rough) {
    showErrors([`Unable to load rough.js: ${ROUGH_URL}`]);
    return;
  }

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const HTML_NS = 'http://www.w3.org/1999/xhtml';
  const stage = document.getElementById('stage');
  const timelineEl = document.getElementById('timeline');
  const svg = document.getElementById('canvas');
  const world = document.getElementById('world');
  const rc = rough.svg(svg);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const FONT = {
    eyebrow: '600 11px Inter, system-ui, sans-serif',
    title: '600 16px Inter, system-ui, sans-serif',
    start: '600 18px Inter, system-ui, sans-serif',
    label: '500 14.5px Inter, system-ui, sans-serif',
    body: '400 13.5px Inter, system-ui, sans-serif',
    small: '500 12px Inter, system-ui, sans-serif',
    hand: '500 21px Caveat, cursive',
    tree: '600 12px Inter, system-ui, sans-serif',
    band: '600 13px Inter, system-ui, sans-serif',
    face: '18px "Apple Color Emoji", "Segoe UI Emoji", system-ui, sans-serif',
    icon: '12px "Apple Color Emoji", "Segoe UI Emoji", sans-serif',
  };
  const KIND = {
    choice: ['Question', '--k-choice'],
    checklist: ['Checklist', '--k-check'],
    text: ['Your answer', '--k-text'],
    waypoint: ['Step', '--k-step'],
    card: ['Summary', '--k-card'],
  };
  const persistLoc = { pathname: globalThis.location?.pathname ?? '' };
  let state = Object.create(null);
  const restored = L.loadWalkState(globalThis.localStorage, path, map, persistLoc);
  if (restored) {
    for (const id of Object.keys(restored)) state[id] = restored[id];
  }
  let noteOpen = new Set();
  const open = new Set();
  let showAll = false;
  let rects = {};
  let anchors = {};
  let shownBefore = new Set();
  const byId = new Map(L.all(map).map((n) => [n.id, n]));
  // why: step by step holds the reveal at each waypoint, which only suits a map that is a journey.
  const canStep = L.all(map).some((n) => L.isStep(n, map));
  let stepwise = canStep;
  const revealOpts = () => ({ stepwise });
  const layoutOpts = () => ({ open });
  let plan = L.layout(map, layoutOpts());

  function text(parent, x, y, str, font, color = 'var(--ink)', anchor = 'start') {
    const t = el('text', { x, y, 'text-anchor': anchor }, parent);
    t.style.font = font;
    t.style.fill = color;
    t.textContent = str;
    return t;
  }

  /** Writes wrapped lines of `str` and returns the height they took. */
  function para(parent, x, y, str, font, color, chars, lineHeight, anchor = 'start') {
    const wrapped = L.lines(str, chars);
    wrapped.forEach((line, i) => {
      text(parent, x, y + i * lineHeight, line, font, color, anchor);
    });
    return wrapped.length * lineHeight;
  }

  /** Derives a stable rough.js seed from an id so edges keep their wobble across renders. */
  function seed(id) {
    let h = 7;
    for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 2147483;
    return h + 1;
  }

  const measureCtx = document.createElement('canvas').getContext('2d');
  function textWidth(str, font) {
    measureCtx.font = font;
    return measureCtx.measureText(str).width;
  }

  function pill(parent, x, y, str, fg, bg) {
    const w = textWidth(str, FONT.small) + 16;
    el('rect', { x, y, width: w, height: 20, rx: 10, style: `fill:${bg}` }, parent);
    text(parent, x + 8, y + 14, str, FONT.small, fg);
    return w;
  }

  function hit(parent, act, label, role = 'button', checked) {
    const g = el(
      'g',
      { class: 'hit', tabindex: 0, role, 'aria-label': label, 'data-act': act },
      parent,
    );
    if (checked !== undefined) g.setAttribute('aria-checked', String(checked));
    return g;
  }

  const SENTINEL = '#000001';

  function arrowHead(pts, opts) {
    const [ex, ey] = pts[pts.length - 1];
    const [px, py] = pts[pts.length - 2];
    const angle = Math.atan2(ey - py, ex - px);
    const wing = (da) => [
      ex + 10 * Math.cos(angle + Math.PI + da),
      ey + 10 * Math.sin(angle + Math.PI + da),
    ];
    return rc.polygon([[ex, ey], wing(-0.42), wing(0.42)], {
      ...opts,
      strokeLineDash: undefined,
      fill: SENTINEL,
      fillStyle: 'solid',
      roughness: 0.3,
    });
  }

  function arrow(parent, id, pts, o = {}) {
    const stroke = o.stroke ?? 'var(--edge)';
    const opts = {
      seed: seed(id),
      stroke: SENTINEL,
      strokeWidth: o.sw ?? 1.5,
      roughness: 0.55,
      bowing: 0.6,
      strokeLineDash: o.dash,
    };
    const g = el('g', { class: 'edge' }, parent);
    g.appendChild(o.linear ? rc.linearPath(pts, opts) : rc.curve(pts, opts));
    g.appendChild(arrowHead(pts, opts));
    // why: rough.js writes colours as attributes, which cannot read CSS variables, so the sentinel is swapped for a style.
    g.querySelectorAll('path').forEach((p) => {
      for (const attr of ['stroke', 'fill']) {
        if (p.getAttribute(attr) === SENTINEL) {
          p.removeAttribute(attr);
          p.style[attr] = stroke;
        }
      }
    });
    if (o.faded) g.classList.add('faded');
    return g;
  }

  function curve(parent, id, x0, y0, x1, y1, o) {
    const dx = Math.max(40, (x1 - x0) * 0.45);
    const dy = (y1 - y0) * 0.08;
    arrow(
      parent,
      id,
      [
        [x0, y0],
        [x0 + dx * 0.6, y0 + dy],
        [x1 - dx * 0.6, y1 - dy],
        [x1, y1],
      ],
      o,
    );
  }

  const pct = document.getElementById('pct');
  const canvas = globalThis.CanvasCore.create({ svg, world, stage, pct, reduceMotion });
  const { cam, applyCam, animateTo, fitTarget, zoomAt, centerZoom } = canvas;

  function union(ids, pad = 40) {
    const rs = ids.map((id) => rects[id]).filter(Boolean);
    if (!rs.length) return null;
    const x0 = Math.min(...rs.map((r) => r.x)) - pad;
    const y0 = Math.min(...rs.map((r) => r.y)) - pad;
    const x1 = Math.max(...rs.map((r) => r.x + r.w)) + pad;
    const y1 = Math.max(...rs.map((r) => r.y + r.h)) + pad + 40;
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  function focusOn(ids) {
    const b = union(ids);
    if (b) animateTo(fitTarget(b));
  }

  function fitAll() {
    const b = world.getBBox();
    animateTo(fitTarget({ x: b.x - 30, y: b.y - 30, w: b.width + 60, h: b.height + 60 }));
  }

  function input(g, id, x, y, w, value, placeholder, isNote = false) {
    const fo = el('foreignObject', { x, y, width: w, height: 38 }, g);
    const field = document.createElementNS(HTML_NS, 'input');
    field.className = isNote ? 'node-input note-input' : 'node-input';
    const label = byId.get(id).label;
    field.setAttribute('aria-label', isNote ? `Note for ${label}` : label);
    field.placeholder = placeholder || '';
    field.value = value || '';
    field.dataset.node = id;
    field.dataset.field = isNote ? 'note' : 'text';
    fo.appendChild(field);
    field.addEventListener('keydown', (e) => {
      // why: Enter that confirms an input-method composition must not also submit the field.
      if (e.isComposing) return;
      if (!isNote && e.key === 'Enter' && !state[id]?.done) {
        e.preventDefault();
        act(JSON.stringify(['done', id]));
      }
      if (isNote && (e.key === 'Enter' || e.key === 'Escape')) {
        e.preventDefault();
        noteOpen.delete(id);
        render(`note-${id}`);
      }
    });
    field.addEventListener('input', () => {
      state[id] ||= {};
      state[id][isNote ? 'note' : 'text'] = field.value;
      updateStatus();
    });
    return field;
  }

  const hasDetails = (n) => Boolean(n.touchpoints?.length || n.pains?.length || n.opportunities?.length);
  const moodLabel = (m) => `${m.name} (${m.value > 0 ? '+' : ''}${m.value})`;

  function frame(g, n, b) {
    const { x, y, w, h } = b;
    if (n.kind === 'start') {
      const persona = map.persona && n.id === L.ctx(map).personaFor;
      el('rect', { x, y, width: w, height: h, rx: persona ? 18 : h / 2, class: 'card start' }, g);
      return;
    }
    if (L.isStep(n, map)) {
      el('rect', { x, y, width: w, height: h, rx: 14, class: 'card k-step' }, g);
      drawBand(g, n, b, L.moodOf(n));
      return;
    }
    el('rect', { x, y, width: w, height: h, rx: 14, class: `card k-${n.kind}` }, g);
    if (n.kind === 'card') {
      el(
        'rect',
        { x: x + 1, y: y + 1, width: w - 2, height: 5, rx: 2.5, style: 'fill:var(--accent)' },
        g,
      );
    }
  }

  // why: node ids may hold spaces or quotes, which break a url(#…) reference, so clip paths get their own ids.
  const clipIds = new Map();
  const clipId = (id) => {
    if (!clipIds.has(id)) clipIds.set(id, `clip-${clipIds.size}`);
    return clipIds.get(id);
  };

  /** The 32px header band of a step: the mood colour with face and first name, or neutral grey; the face alone with no persona. */
  function drawBand(g, n, b, m) {
    const { x, y, w, h } = b;
    const clip = el('clipPath', { id: clipId(n.id) }, g);
    el('rect', { x, y, width: w, height: h, rx: 14 }, clip);
    el(
      'rect',
      { x, y, width: w, height: 32, 'clip-path': `url(#${clipId(n.id)})`, style: `fill:${m ? m.color : '#e9eaf0'}` },
      g,
    );
    const first = (map.persona?.name || '').split(' ')[0];
    if (m) {
      const face = text(g, x + 12, y + 23, m.face, FONT.face, '#fff');
      el('title', {}, face).textContent = moodLabel(m);
      if (first) text(g, x + 40, y + 21, first, FONT.band, '#fff').setAttribute('aria-label', `${first} feels ${m.name}`);
    } else if (first) {
      text(g, x + 14, y + 21, first, FONT.band, 'var(--muted)');
    }
  }

  /** The chevron and the pencil at the band's right end; the chevron is dimmed and inert on a step with nothing to expand. */
  function drawBandActions(g, n, b, a) {
    const { x, y, w } = b;
    const m = L.moodOf(n);
    const ink = m ? '#fff' : 'var(--muted)';
    const neu = m ? '' : ' neu';
    const isOpen = open.has(n.id);
    const cx = x + w - 62;
    const cy = y + 4;
    const chevD = isOpen ? `M${cx + 7} ${cy + 9} l5 6 l5 -6` : `M${cx + 9} ${cy + 6} l6 6 l-6 6`;
    if (hasDetails(n)) {
      const hg = hit(g, JSON.stringify(['open', n.id]), `${isOpen ? 'Collapse' : 'Expand'} details: ${n.label}`);
      hg.dataset.focus = `open-${n.id}`;
      el('rect', { x: cx, y: cy, width: 26, height: 24, rx: 7, class: `bband${neu}` }, hg);
      el('path', { d: chevD, class: 'band-ico', style: `stroke:${ink}` }, hg);
    } else {
      const dg = el('g', { opacity: 0.35 }, g);
      el('path', { d: chevD, class: 'band-ico', style: `stroke:${ink}` }, dg);
      el('title', {}, dg).textContent = 'Nothing to expand';
    }
    const nh = hit(g, JSON.stringify(['note', n.id]), a.note ? `Edit note: ${n.label}` : `Add note: ${n.label}`);
    nh.dataset.focus = `note-${n.id}`;
    const nx = x + w - 34;
    el('rect', { x: nx, y: cy, width: 24, height: 24, rx: 7, class: a.note ? 'bband has' : `bband${neu}` }, nh);
    el(
      'path',
      { d: `M${nx + 7} ${cy + 17} l1 -4 l7 -7 l3 3 l-7 7 z`, class: 'band-ico', style: `stroke:${a.note ? '#6b4e00' : ink}` },
      nh,
    );
  }

  /** The thought cloud above a card: a rounded rectangle with three shrinking circles trailing down to it. */
  function drawCloud(g, b, r, top, n) {
    const x0 = b.x + 12;
    const ry = top + 14;
    const bodyH = r.h - 14 - 38;
    const cg = el('g', { class: 'cloud' }, g);
    const shadow = el('g', { class: 'cloud-shadow' }, cg);
    el('rect', { x: x0, y: ry, width: b.w - 24, height: bodyH, rx: 24, class: 'cloud-edge' }, shadow);
    el('rect', { x: x0, y: ry, width: b.w - 24, height: bodyH, rx: 24, class: 'cloud-fill' }, cg);
    for (const [dx, dy, rr] of [
      [46, 16, 7],
      [34, 27, 5],
      [26, 35, 3.5],
    ]) {
      el('circle', { cx: x0 + dx, cy: ry + bodyH + dy, r: rr, class: 'cloud-dot' }, cg);
    }
    para(cg, x0 + 22, ry + 28, n.thought, FONT.hand, 'var(--ink)', M.cloudChars, 22);
  }

  /** The eyebrow: a step's tag in its mood colour, otherwise the kind's name. */
  function drawEyebrow(g, n, x, top) {
    const [name, color] = KIND[n.kind];
    const step = L.isStep(n, map);
    const m = step ? L.moodOf(n) : null;
    const full = (step ? n.tag : name).toUpperCase();
    const shown = full.length > M.eyebrowChars ? `${full.slice(0, M.eyebrowChars - 1)}…` : full;
    const t = text(g, x, top + 17, shown, FONT.eyebrow, m ? m.color : `var(${color})`);
    t.style.letterSpacing = '0.08em';
    if (shown !== full) el('title', {}, t).textContent = full;
  }

  /** The persona header, goal and scenario that sit in the first start card. */
  function drawPersona(g, b, r, top) {
    const p = map.persona;
    const x = b.x;
    if (r.kind === 'pheader') {
      const cy = top + 28;
      el('circle', { cx: x + 42, cy, r: 20, style: 'fill:var(--select)' }, g);
      const initials = p.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2);
      text(g, x + 42, cy + 5, initials, FONT.label, '#fff', 'middle');
      r.name.forEach((line, i) => text(g, x + 74, top + 25 + i * M.personaName, line, FONT.title, 'var(--ink)'));
      const roleTop = top + 23 + r.name.length * M.personaName;
      r.role.forEach((line, i) => text(g, x + 74, roleTop + i * M.personaRole, line, FONT.body, 'var(--muted)'));
    }
    if (r.kind === 'pgoal') {
      text(g, x + M.pad, top + 14, 'GOAL', FONT.eyebrow, 'var(--select)').style.letterSpacing = '0.08em';
      para(g, x + M.pad, top + 32, p.goal, FONT.body, 'var(--ink)', 34, M.body);
    }
    if (r.kind === 'pscen') para(g, x + M.pad, top + 16, map.scenario, FONT.body, 'var(--muted)', 36, M.body);
  }

  /** The collapsed row of icon counts, shown only for the lists present; it expands the card. */
  function drawDbar(g, n, b, r, top) {
    const hg = hit(g, JSON.stringify(['open', n.id]), `Expand details: ${n.label}`);
    hg.dataset.focus = `open-${n.id}`;
    el('rect', { x: b.x + 12, y: top + 2, width: b.w - 24, height: r.h - 6, rx: 8, class: 'row bar' }, hg);
    const counts = [
      ['\u{1F4CD}', n.touchpoints, 'tag'],
      ['⚠', n.pains, 'pain'],
      ['\u{1F4A1}', n.opportunities, 'idea'],
    ].filter(([, list]) => list?.length);
    let cx = b.x + 22;
    for (const [icon, list, tone] of counts) {
      const bg = tone === 'pain' ? 'var(--pain-bg)' : tone === 'idea' ? 'var(--opp-bg)' : 'var(--tag-bg)';
      const fg = tone === 'pain' ? 'var(--pain)' : tone === 'idea' ? 'var(--opp)' : 'var(--tag-ink)';
      el('rect', { x: cx, y: top + 5, width: 38, height: 20, rx: 10, style: `fill:${bg}` }, hg);
      text(hg, cx + 8, top + 19, icon, FONT.icon, fg);
      text(hg, cx + 24, top + 19, String(list.length), FONT.small, fg);
      cx += 44;
    }
  }

  /** The expanded touchpoint chips, under a heading. */
  function drawChips(g, b, r, top) {
    const x = b.x + M.pad;
    text(g, x, top + 14, '\u{1F4CD}', FONT.icon, 'var(--muted)');
    text(g, x + 20, top + 14, 'TOUCHPOINTS', FONT.eyebrow, 'var(--muted)').style.letterSpacing = '0.08em';
    let rowY = top + 24;
    const rowsOfChips = L.chipRows(r.items);
    L.chipRowHeights(rowsOfChips).forEach((rowH, i) => {
      let cx = x;
      for (const c of rowsOfChips[i]) {
        el('rect', { x: cx, y: rowY, width: c.w, height: c.h, rx: 11, style: 'fill:var(--tag-bg)' }, g);
        c.lines.forEach((line, k) => {
          text(g, cx + 10, rowY + 15 + k * M.chipTextLine, line, FONT.small, 'var(--tag-ink)');
        });
        cx += c.w + 6;
      }
      rowY += rowH;
    });
  }

  const STICKY = {
    pain: ['var(--pain-bg)', '#f3b9b9', 'PAINS', '✕'],
    idea: ['var(--opp-bg)', '#aedfc4', 'OPPORTUNITIES', '✦'],
  };

  /** A slightly rotated red (pain) or green (idea) sticky below the card. */
  function drawSticky(g, n, b, r, top, index) {
    const [fill, stroke, head, mark] = STICKY[r.tone];
    const rot = ((seed(n.id + r.tone) % 5) - 2) * 0.9;
    const sx = b.x + 14 + (index % 2) * 6;
    const sw = b.w - 32;
    // why: 8px of clearance under the card keeps a rotated corner off it.
    const sy = top + 12;
    const sh = r.h - 16;
    const sg = el('g', { transform: `rotate(${rot} ${sx + sw / 2} ${sy + sh / 2})` }, g);
    el('rect', { x: sx, y: sy, width: sw, height: sh, rx: 4, style: `fill:${fill};stroke:${stroke}`, class: 'stickybox' }, sg);
    text(sg, sx + 12, sy + 18, head, FONT.eyebrow, 'var(--muted)').style.letterSpacing = '0.08em';
    let ty = sy + 38;
    for (const item of r.items) {
      text(sg, sx + 12, ty, mark, FONT.small, 'var(--muted)');
      ty += para(sg, sx + 28, ty, item, FONT.body, 'var(--ink)', 30, M.body) + 2;
    }
  }

  function drawTitle(g, n, b, r, top) {
    if (n.kind === 'start') {
      para(g, b.x + b.w / 2, top + 20, n.label, FONT.start, 'var(--ink)', r.chars, 24, 'middle');
      return;
    }
    para(g, b.x + M.pad, top + 16, n.label, FONT.title, 'var(--ink)', M.titleChars, M.title);
  }

  function drawSub(g, n, b, r, top) {
    if (n.kind === 'start') {
      para(g, b.x + b.w / 2, top + 14, n.sub, FONT.body, 'var(--muted)', r.chars, M.body, 'middle');
      return;
    }
    para(g, b.x + M.pad, top + 14, n.sub, FONT.body, 'var(--muted)', M.bodyChars, M.body);
  }

  function drawOption(g, n, b, r, top, a) {
    const { x, w } = b;
    const o = n.options.find((opt) => opt.key === r.key);
    const chosen = a.choice === o.key;
    const optHeight = r.h - M.optGap;
    const label = `${n.label}: ${o.label}${chosen ? ', chosen' : ''}`;
    const hg = hit(g, JSON.stringify(['choice', n.id, o.key]), label, 'radio', chosen);
    hg.dataset.focus = `choice-${n.id}-${o.key}`;
    if (a.choice !== undefined && !chosen) hg.classList.add('dim');
    el(
      'rect',
      { x: x + 12, y: top, width: w - 24, height: optHeight, rx: 10, class: chosen ? 'opt chosen' : 'opt' },
      hg,
    );
    const dotY = top + M.optPad + 10;
    el('circle', { cx: x + 30, cy: dotY, r: 7, class: chosen ? 'radio on' : 'radio' }, hg);
    if (chosen) el('circle', { cx: x + 30, cy: dotY, r: 3, class: 'radio-dot' }, hg);
    let ty = top + M.optPad + 15;
    ty += para(hg, x + 46, ty, o.label, FONT.label, 'var(--ink)', M.optChars, M.optLabel);
    if (o.hint) {
      ty += para(hg, x + 46, ty - 2, o.hint, FONT.body, 'var(--muted)', M.optHintChars, M.optHint);
    }
    if (o.badge || n.default === o.key) {
      let px = x + 46;
      if (n.default === o.key) {
        px += pill(hg, px, ty - 8, 'recommended', 'var(--rec-ink)', 'var(--rec-bg)') + 6;
      }
      if (o.badge) pill(hg, px, ty - 8, o.badge, 'var(--tag-ink)', 'var(--tag-bg)');
    }
    anchors[n.id][o.key] = top + optHeight / 2;
  }

  function drawItem(g, n, b, r, top, a) {
    const { x, w } = b;
    const item = n.items.find((i) => i.key === r.key);
    const on = a.checks?.[item.key] ?? item.on ?? true;
    const hg = hit(
      g,
      JSON.stringify(['check', n.id, item.key]),
      `${n.label}: ${item.label}`,
      'checkbox',
      on,
    );
    hg.dataset.focus = `check-${n.id}-${item.key}`;
    el('rect', { x: x + 12, y: top + 2, width: w - 24, height: r.h - 4, rx: 8, class: 'row' }, hg);
    el(
      'rect',
      { x: x + 22, y: top + M.itemPad + 2, width: 16, height: 16, rx: 4, class: on ? 'box on' : 'box' },
      hg,
    );
    if (on) {
      el('path', { d: `M${x + 26} ${top + M.itemPad + 10} l3 3 l6 -7`, class: 'tick' }, hg);
    }
    let ty = top + M.itemPad + 15;
    const color = on ? 'var(--ink)' : 'var(--muted)';
    ty += para(hg, x + 48, ty, item.label, FONT.label, color, M.optChars, M.optLabel);
    if (item.hint) {
      para(hg, x + 48, ty - 2, item.hint, FONT.body, 'var(--muted)', M.optHintChars, M.optHint);
    }
  }

  function drawContinue(g, n, b, top, a) {
    const { x, w } = b;
    if (a.done) {
      text(g, x + w - M.pad, top + 30, 'continued ✓', FONT.small, 'var(--muted)', 'end');
      return;
    }
    const hg = hit(g, JSON.stringify(['done', n.id]), `Continue from ${n.label}`);
    hg.dataset.focus = `done-${n.id}`;
    const bw = 108;
    const bx = x + w - M.pad - bw;
    el('rect', { x: bx, y: top + 10, width: bw, height: 32, rx: 16, class: 'primary' }, hg);
    text(hg, bx + bw / 2, top + 31, 'Continue →', FONT.small, '#fff', 'middle');
  }

  function drawSection(g, n, b, r, top) {
    const { x, w } = b;
    const s = r.section;
    let ty = top + 16;
    ty += para(g, x + M.pad, ty, s.head, FONT.eyebrow, 'var(--accent)', M.sectionChars, M.sectionHead);
    s.items.forEach((item, i) => {
      text(g, x + M.pad, ty, s.numbered ? `${i + 1}.` : '•', FONT.body, 'var(--muted)');
      ty +=
        para(g, x + M.pad + 16, ty, item, FONT.body, 'var(--ink)', M.sectionChars, M.sectionItem) + 4;
    });
    if (n.sections.indexOf(s) < n.sections.length - 1) {
      const ruleY = top + r.h - 4;
      el('line', { x1: x + M.pad, x2: x + w - M.pad, y1: ruleY, y2: ruleY, class: 'rule' }, g);
    }
  }

  /** One annotation under the node: its text in the margin hand, with an arrow up at what is above it. */
  function drawAnnotation(g, b, r, top) {
    const ty = top + 24;
    para(g, b.x + 34, ty, r.text.join('\n'), FONT.hand, 'var(--muted)', M.annoChars, M.annoLine);
    arrow(
      g,
      r.id,
      [
        [b.x + 28, ty - 6],
        [b.x + 16, ty - 12],
        [b.x + 18, top + 2],
      ],
      { stroke: 'var(--muted)', sw: 1.1 },
    );
  }

  /** The note a person typed: an input while editing, a sticky once set. */
  function drawNoteBox(g, n, b, y, a) {
    if (noteOpen.has(n.id)) {
      input(g, n.id, b.x + 14, y, b.w - 28, a.note, 'Note for your agent…', true);
    } else if (a.note) {
      el('rect', { x: b.x + 14, y, width: b.w - 28, height: 34, rx: 6, class: 'sticky' }, g);
      text(g, b.x + 24, y + 23, L.lines(a.note, 30)[0], FONT.hand, 'var(--sticky-ink)');
    }
  }

  function drawRow(g, n, b, r, top, a) {
    const { x } = b;
    if (r.kind === 'cloud') drawCloud(g, b, r, top, n);
    if (r.kind === 'eyebrow') drawEyebrow(g, n, x + M.pad, top);
    if (['pheader', 'pgoal', 'pscen'].includes(r.kind)) drawPersona(g, b, r, top);
    if (r.kind === 'dbar') drawDbar(g, n, b, r, top);
    if (r.kind === 'chips') drawChips(g, b, r, top);
    if (r.kind === 'sticky') drawSticky(g, n, b, r, top, r.index);
    if (r.kind === 'noteslot') drawNoteBox(g, n, b, top + 4, a);
    if (r.kind === 'annotation') drawAnnotation(g, b, r, top);
    if (r.kind === 'title') drawTitle(g, n, b, r, top);
    if (r.kind === 'sub') drawSub(g, n, b, r, top);
    if (r.kind === 'note') {
      para(g, x + M.pad, top + 14, n.note, FONT.body, 'var(--muted)', M.bodyChars, M.body);
    }
    if (r.kind === 'tag') pill(g, x + M.pad, top + 4, n.tag, 'var(--tag-ink)', 'var(--tag-bg)');
    if (r.kind === 'option') drawOption(g, n, b, r, top, a);
    if (r.kind === 'item') drawItem(g, n, b, r, top, a);
    if (r.kind === 'input') input(g, n.id, x + M.pad, top + 4, b.w - 2 * M.pad, a.text, n.placeholder);
    if (r.kind === 'continue') drawContinue(g, n, b, top, a);
    if (r.kind === 'section') drawSection(g, n, b, r, top);
  }

  /** The pencil: in the band of a step, on the card's right end otherwise. */
  function drawPencil(g, n, b, a) {
    if (L.isStep(n, map)) {
      drawBandActions(g, n, b, a);
      return;
    }
    const nh = hit(g, JSON.stringify(['note', n.id]), a.note ? `Edit note: ${n.label}` : `Add note: ${n.label}`);
    nh.dataset.focus = `note-${n.id}`;
    const nx = b.x + b.w - 34;
    const ny = b.y + (n.kind === 'start' ? b.h / 2 - 12 : 10);
    el('rect', { x: nx, y: ny, width: 24, height: 24, rx: 7, class: a.note ? 'note-btn has' : 'note-btn' }, nh);
    el('path', { d: `M${nx + 7} ${ny + 17} l1 -4 l7 -7 l3 3 l-7 7 z`, class: 'pencil' }, nh);
  }

  function node(layer, n, b, fade, ghost) {
    const a = state[n.id] || {};
    const cls = ghost ? 'ghost' : fade.faded.has(n.id) ? 'faded' : '';
    const g = el('g', { 'data-node': n.id, class: cls }, layer);
    const P = L.parts(n, L.ctx(map, layoutOpts()));
    // invariant: the framed card is the middle of the box, between the inset (above) and tail (below) rows.
    const cb = { ...b, y: b.y + P.inset, h: P.card };
    frame(g, n, cb);
    anchors[n.id] = {};
    const next = { top: b.y, card: cb.y + (n.kind === 'start' ? M.pad : 14), bottom: cb.y + cb.h };
    let stickyIndex = 0;
    for (const r of P.rows) {
      const zone = r.zone || 'card';
      if (r.kind === 'sticky') r.index = stickyIndex++;
      drawRow(g, n, cb, r, next[zone], a);
      next[zone] += r.h;
    }
    if (fade.later.has(n.id)) pill(g, b.x + b.w - 62, b.y - 10, 'later', 'var(--rec-ink)', 'var(--rec-bg)');
    drawPencil(g, n, cb, a);
    // hazard: a note on an unannotated node has no reserved slot, so it hangs in the gap below the box.
    if (!P.rows.some((r) => r.kind === 'noteslot')) drawNoteBox(g, n, cb, b.y + b.h + 10, a);
  }

  function drawTreeLabels(notes, visible) {
    for (const t of map.trees) {
      const bs = plan.boxes.filter((b) => b.tree === t.id && visible(b.id));
      const start = t.nodes.find((n) => n.kind === 'start');
      if (!bs.length || (start && (t.label || t.id) === start.label)) continue;
      const label = text(
        notes,
        Math.min(...bs.map((b) => b.x)),
        Math.min(...bs.map((b) => b.y)) - 26,
        (t.label || t.id).toUpperCase(),
        FONT.tree,
        'var(--muted)',
      );
      label.style.letterSpacing = '0.1em';
    }
  }

  function drawLink(edgeLayer, notes, e) {
    const route = L.linkRoute(plan, e);
    arrow(edgeLayer, `${e.from}-${e.to}`, route.points, {
      stroke: 'var(--link)',
      dash: [6, 7],
      linear: true,
      sw: 1.3,
    });
    if (e.label) pill(notes, route.label.x, route.label.y, e.label, 'var(--link)', 'var(--paper)');
  }

  function drawEdges(edgeLayer, notes, fade, shown, visible) {
    for (const e of plan.edges) {
      if (!visible(e.from) || !visible(e.to)) continue;
      const from = rects[e.from];
      const to = rects[e.to];
      const dim = fade.faded.has(e.to) || !shown.has(e.to);
      if (e.link) {
        drawLink(edgeLayer, notes, e);
        continue;
      }
      const n = byId.get(e.from);
      if (n.kind === 'choice') {
        for (const o of n.options.filter((opt) => opt.next === e.to)) {
          const chosen = state[n.id]?.choice === o.key;
          if (!showAll && !chosen) continue;
          curve(
            edgeLayer,
            `${e.from}-${o.key}`,
            from.x + from.w - 12,
            anchors[n.id][o.key],
            to.x - 6,
            to.ay,
            { faded: !chosen && dim, stroke: chosen ? 'var(--select)' : undefined },
          );
        }
        continue;
      }
      const into = L.isStep(byId.get(e.to), map) ? L.moodOf(byId.get(e.to)) : null;
      curve(edgeLayer, `${e.from}-${e.to}`, from.x + from.w + 2, from.ay, to.x - 6, to.ay, {
        faded: dim,
        ...(into ? { stroke: into.color, sw: 3.2 } : {}),
      });
    }
  }

  /** Redraws the whole map and returns the ids that appeared since the previous render. */
  function render(refocus) {
    world.replaceChildren();
    plan = L.layout(map, layoutOpts());
    rects = Object.fromEntries(plan.boxes.map((b) => [b.id, b]));
    anchors = {};
    const shown = L.revealed(map, state, revealOpts());
    const fade = L.faded(map, state);
    const visible = (id) => showAll || shown.has(id);
    const edgeLayer = el('g', {}, world);
    const nodeLayer = el('g', {}, world);
    const notes = el('g', {}, world);
    drawTreeLabels(notes, visible);
    for (const b of plan.boxes) {
      if (visible(b.id)) node(nodeLayer, byId.get(b.id), b, fade, !shown.has(b.id));
    }
    drawEdges(edgeLayer, notes, fade, shown, visible);
    if (refocus) {
      const target = [...world.querySelectorAll('[data-focus]')].find((e) => e.dataset.focus === refocus);
      target?.focus({ preventScroll: true });
    }
    updateStatus();
    const fresh = [...shown].filter((id) => !shownBefore.has(id));
    shownBefore = shown;
    L.saveWalkState(globalThis.localStorage, path, map, persistLoc, state);
    return fresh;
  }

  function updateStatus() {
    const shown = L.revealed(map, state, revealOpts());
    const noteCount = Object.values(state).filter((a) => a.note).length;
    drawChrome();
    drawTimeline();
    statusEl.textContent = `${shown.size} of ${plan.boxes.length} nodes revealed · ${noteCount} note${noteCount === 1 ? '' : 's'}`;
  }

  const focus0 = () => document.activeElement?.dataset?.focus;

  function act(serialized) {
    const [kind, id, key] = JSON.parse(serialized);
    const n = byId.get(id);
    // invariant: acting anywhere else turns each other written note from an input into its sticky.
    for (const other of [...noteOpen]) if (other !== id && state[other]?.note) noteOpen.delete(other);
    if (kind === 'open') {
      if (open.has(id)) open.delete(id);
      else open.add(id);
      render(focus0());
      focusOn([id]);
      return;
    }
    state[id] ||= {};
    const a = state[id];
    if (kind === 'choice') a.choice = key;
    if (kind === 'check') {
      a.checks ||= {};
      const current = a.checks[key] ?? n.items.find((i) => i.key === key).on ?? true;
      a.checks[key] = !current;
    }
    if (kind === 'done') a.done = true;
    if (kind === 'note') {
      noteOpen.add(id);
      render();
      const field = [...world.querySelectorAll('input')].find(
        (i) => i.dataset.node === id && i.dataset.field === 'note',
      );
      field?.focus({ preventScroll: true });
      return;
    }
    const focus = document.activeElement?.dataset?.focus;
    const fresh = render(kind === 'done' ? null : focus);
    if (kind === 'choice') focusOn([id, n.options.find((o) => o.key === key).next, ...fresh]);
    else if (fresh.length) focusOn([id, ...fresh]);
    if (kind === 'done') {
      const next = [...world.querySelectorAll('[data-focus]')].find((e) =>
        fresh.includes(e.closest('[data-node]')?.dataset.node),
      );
      next?.focus({ preventScroll: true });
    }
  }

  canvas.bindInput();

  svg.addEventListener('click', (e) => {
    if (canvas.moved) return;
    const h = e.target.closest('.hit');
    if (h) act(h.dataset.act);
  });

  svg.addEventListener('keydown', (e) => {
    if (e.target.closest('input')) return;
    const h = e.target.closest('.hit');
    if (h && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      act(h.dataset.act);
    }
  });

  svg.addEventListener('focusin', (e) => {
    const g = e.target.closest('[data-node]');
    if (!g || !e.target.matches('.hit, input')) return;
    const r = rects[g.dataset.node];
    const vw = svg.clientWidth;
    const vh = svg.clientHeight;
    const sx = r.x * cam.k + cam.x;
    const sy = r.y * cam.k + cam.y;
    if (sx < 0 || sy < 70 || sx + r.w * cam.k > vw || sy + r.h * cam.k > vh - 60) {
      focusOn([g.dataset.node]);
    }
  });

  const startIds = () =>
    plan.boxes.filter((b) => b.column <= 1 && b.tree === map.trees[0].id).map((b) => b.id);
  const nextBtn = document.getElementById('next');
  const prevBtn = document.getElementById('prev');
  const moreBtn = document.getElementById('more');
  const menuEl = document.getElementById('menu');
  const pathNow = () => L.walked(map, state, showAll, { stepwise });
  const shownNow = () => (showAll ? [...byId.keys()] : [...L.revealed(map, state, revealOpts())]);
  const detailIds = () => [...byId.values()].filter((n) => L.isStep(n, map) && hasDetails(n)).map((n) => n.id);
  const allOpen = () => detailIds().every((id) => open.has(id));

  function nextStep() {
    const id = showAll ? null : L.pending(map, state);
    if (id && stepwise) act(JSON.stringify(['done', id]));
  }

  /** Clears the answer that revealed the last node shown, so the walk steps back one node. */
  function prevStep() {
    const id = L.prevTarget(map, state, { stepwise, showAll });
    if (!id) return;
    if (byId.get(id).kind === 'choice') delete state[id].choice;
    else state[id].done = false;
    render();
    focusOn(pathNow().slice(-3));
  }

  function toggleStepwise() {
    if (!canStep) return;
    stepwise = !stepwise;
    render();
    focusOn(pathNow().slice(-3));
  }

  function toggleShowAll() {
    showAll = !showAll;
    render();
    if (showAll) fitAll();
    else focusOn(shownNow());
  }

  function toggleExpandAll() {
    if (allOpen()) open.clear();
    else for (const id of detailIds()) open.add(id);
    render();
    if (showAll) fitAll();
    else focusOn(shownNow());
  }

  // why: one stray R would wipe every answer and note, so the shortcut needs a second press within 3s.
  let resetArmedAt = 0;
  function resetFromKey() {
    if (!Object.keys(state).length || Date.now() - resetArmedAt < 3000) {
      resetArmedAt = 0;
      resetWalk();
      return;
    }
    resetArmedAt = Date.now();
    statusEl.textContent = 'Press R again to clear every answer and note';
  }

  function resetWalk() {
    state = Object.create(null);
    noteOpen.clear();
    L.clearWalkState(globalThis.localStorage, path, map, persistLoc);
    render();
    focusOn(startIds());
  }

  const MENU = [
    ['Step by step', 'P', () => toggleStepwise(), () => !canStep, () => stepwise],
    ['Show whole map', 'W', () => toggleShowAll(), () => false, () => showAll],
    ['Expand all', 'E', () => toggleExpandAll(), () => !detailIds().length, () => null],
  ];

  function closeMenu() {
    menuEl.hidden = true;
    moreBtn.setAttribute('aria-expanded', 'false');
  }

  function renderMenu() {
    menuEl.replaceChildren();
    for (const [label, key, run, off, on] of MENU) {
      const b = document.createElement('button');
      b.type = 'button';
      b.disabled = off();
      const checked = on();
      b.setAttribute('role', checked === null ? 'menuitem' : 'menuitemcheckbox');
      if (checked !== null) b.setAttribute('aria-checked', String(checked));
      const name = document.createElement('span');
      name.textContent = label === 'Expand all' && allOpen() ? 'Collapse all' : label;
      const kbd = document.createElement('kbd');
      kbd.textContent = key;
      b.append(name, kbd);
      b.onclick = () => {
        closeMenu();
        run();
      };
      menuEl.appendChild(b);
    }
  }

  // why: the toolbar wraps on narrow viewports, so the button can sit near the left edge and a right-aligned menu would clip.
  function placeMenu() {
    menuEl.style.right = '0px';
    menuEl.style.left = 'auto';
    const r = menuEl.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const room = 8;
    let dx = 0;
    if (r.left < room) dx = room - r.left;
    else if (r.right > vw - room) dx = vw - room - r.right;
    menuEl.style.right = `${-dx}px`;
  }

  moreBtn.onclick = (e) => {
    e.stopPropagation();
    const willOpen = menuEl.hidden;
    if (willOpen) renderMenu();
    menuEl.hidden = !willOpen;
    moreBtn.setAttribute('aria-expanded', String(willOpen));
    if (willOpen) placeMenu();
  };
  document.addEventListener('pointerdown', (e) => {
    if (!menuEl.hidden && !e.target.closest?.('#menu, #more')) closeMenu();
  });

  /** Syncs the toolbar with the walk: Prev and Next show only while step by step is on. */
  function drawChrome() {
    if (!menuEl.hidden) {
      renderMenu();
      placeMenu();
    }
    nextBtn.hidden = !stepwise;
    prevBtn.hidden = !stepwise;
    nextBtn.disabled = showAll || !L.pending(map, state);
    prevBtn.disabled = !L.prevTarget(map, state, { stepwise, showAll });
  }

  /** Draws the mood timeline island from the walked path, with DOM calls only. */
  function drawTimeline() {
    const pts = pathNow()
      .map((id) => byId.get(id))
      .filter((n) => L.moodOf(n))
      .map((n) => ({ n, m: L.moodOf(n) }));
    timelineEl.hidden = !pts.length;
    canvas.dockH = pts.length ? 66 + 120 + 12 : 0;
    if (!pts.length) return;
    const sp = 58;
    const w = Math.max(220, pts.length * sp + 56);
    const xOf = (i) => 40 + i * sp;
    const yOf = (v) => 22 + (2 - v) * 15;
    const g = document.createElementNS(SVG_NS, 'svg');
    for (const [k, v] of Object.entries({ width: w, height: 120, viewBox: `0 0 ${w} 120`, role: 'img', 'aria-label': 'Mood along the walk' })) {
      g.setAttribute(k, v);
    }
    el('line', { x1: 14, x2: w - 14, y1: yOf(0), y2: yOf(0), class: 'tl-zero' }, g);
    const cap = el('text', { x: 14, y: 114, class: 'tl-cap' }, g);
    cap.textContent = 'MOOD ALONG THE WALK';
    pts.forEach((p, i) => {
      if (i) el('line', { x1: xOf(i - 1), y1: yOf(pts[i - 1].m.value), x2: xOf(i), y2: yOf(p.m.value), class: 'tl-seg', style: `stroke:${p.m.color}` }, g);
    });
    pts.forEach((p, i) => {
      const pg = el('g', { class: 'tl-pt', 'data-id': p.n.id }, g);
      const tip = el('title', {}, pg);
      tip.textContent = `${p.n.label} - ${p.m.name}`;
      if (i === pts.length - 1) el('circle', { cx: xOf(i), cy: yOf(p.m.value), r: 17, class: 'tl-newest' }, pg);
      el('circle', { cx: xOf(i), cy: yOf(p.m.value), r: 12, class: 'tl-dot', style: `fill:${p.m.soft};stroke:${p.m.color}` }, pg);
      const face = el('text', { x: xOf(i), y: yOf(p.m.value) + 5, 'text-anchor': 'middle', class: 'tl-face' }, pg);
      face.textContent = p.m.face;
    });
    timelineEl.replaceChildren(g);
    timelineEl.scrollLeft = timelineEl.scrollWidth;
  }

  timelineEl.addEventListener('click', (e) => {
    const t = e.target.closest('[data-id]');
    if (t) focusOn([t.dataset.id]);
  });
  nextBtn.onclick = nextStep;
  prevBtn.onclick = prevStep;
  // why: listening on window and focusing the stage on load lets shortcuts work before the first click.
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menuEl.hidden) {
      closeMenu();
      moreBtn.focus();
      return;
    }
    if (e.target.closest?.('input, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 'n') nextStep();
    else if (k === 'b') prevStep();
    else if (k === 'r') resetFromKey();
    else if (k === 'p') toggleStepwise();
    else if (k === 'w') toggleShowAll();
    else if (k === 'e') toggleExpandAll();
  });
  document.getElementById('zin').onclick = () => centerZoom(1.2);
  document.getElementById('zout').onclick = () => centerZoom(1 / 1.2);
  pct.onclick = () => centerZoom(1 / cam.k);
  document.getElementById('fit').onclick = fitAll;
  document.getElementById('reset').onclick = resetWalk;

  const emptyCopyMessage =
    'Nothing to copy yet. Pick an option on the map or use the pencil on a card to add a note for your agent.';
  copyButton.onclick = async () => {
    if (L.feedbackIsEmpty(map, state, path)) {
      feedbackPanel.hidden = false;
      feedbackBox.value = emptyCopyMessage;
      feedbackBox.focus();
      return;
    }
    const value = L.feedback(map, state, path);
    if (await globalThis.CanvasCore.copyText(value, { panel: feedbackPanel, box: feedbackBox })) {
      statusEl.textContent = 'Copied. Paste it into your agent chat.';
    }
  };
  document.getElementById('close-feedback').onclick = () => {
    feedbackPanel.hidden = true;
    copyButton.focus();
  };

  render();

  // hazard: a pane that is still hidden or sizing reports a zero-width canvas, which would fit the camera to the minimum zoom.
  function place() {
    if (!svg.clientWidth || !svg.clientHeight) {
      requestAnimationFrame(place);
      return;
    }
    Object.assign(cam, fitTarget(union(startIds())));
    applyCam();
  }
  place();
  stage.tabIndex = -1;
  window.focus();
  stage.focus({ preventScroll: true });
})();

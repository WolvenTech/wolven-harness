(() => {
  const L = globalThis.JourneyMapLogic;
  const M = L.M;
  const { tree: map, path } = JSON.parse(document.getElementById('map-data').textContent);
  const ROUGH_URL = 'https://cdn.jsdelivr.net/npm/roughjs@4.6.6/bundled/rough.js';

  const errorPanel = document.getElementById('errors');
  const statusEl = document.getElementById('status');
  const feedbackPanel = document.getElementById('feedback-panel');
  const feedbackBox = document.getElementById('feedback');
  const copyButton = document.getElementById('copy');

  function showErrors(messages) {
    errorPanel.hidden = false;
    document.getElementById('error-text').textContent = messages.join('\n');
    document.getElementById('stage').hidden = true;
  }

  document.getElementById('title').textContent = map.title || 'Journey map';
  document.title = map.title || 'Journey map';
  document.getElementById('subtitle').textContent = map.subtitle || '';

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
  };
  const KIND = {
    choice: ['Question', '--k-choice'],
    checklist: ['Checklist', '--k-check'],
    text: ['Your answer', '--k-text'],
    waypoint: ['Step', '--k-step'],
    card: ['Summary', '--k-card'],
    ticket: ['Ticket', '--k-ticket'],
  };
  const STATUS = {
    open: ['Open', '--s-open'],
    claimed: ['Claimed', '--s-claimed'],
    closed: ['Closed', '--s-closed'],
  };

  // PROTOTYPE — throwaway. Four takes on journey details; the layer is marked PROTOTYPE below.
  FONT.face = '20px "Apple Color Emoji", "Segoe UI Emoji", system-ui, sans-serif';
  const VARIANTS_RAW = {
    A: { name: 'Compact', caption: 'Face + mood edge. Details collapsed to a chip bar; click to open. Dock sparkline.', strip: 'dock' },
    B: { name: 'All open', caption: 'Thought bubble above, chips, pain and idea blocks always shown. Lane under the path.', strip: 'lane' },
    C: { name: 'Inspector', caption: 'Card = face + thought. Click a step; the right panel has the rest. Ribbon of chips.', strip: 'ribbon' },
    E: { name: 'Header band', caption: 'Collapsible details; mood band as the card header (face + Alex); mood arrows; dock timeline.', strip: 'dock' },
    F: { name: 'Footer band', caption: 'Collapsible details; mood band as the card footer; mood arrows; dock timeline.', strip: 'dock' },
    H: { name: 'Header band + cloud', caption: 'Header band with chevron and note; thought cloud above; expanded pains and ideas hang below as stickies; mood arrows; dock.', strip: 'dock' },
    D: { name: 'Stickies', caption: 'Mood-coloured path; details hang under the card as sticky notes. Lane under the path.', strip: 'lane' },
  };
  const VARIANTS = Object.fromEntries(Object.keys(VARIANTS_RAW).sort().map((k) => [k, VARIANTS_RAW[k]]));
  const RICH = ['E', 'F', 'H'];
  let expandAll = false;
  const params = new URLSearchParams(location.search);
  let variant = VARIANTS[params.get('variant')] ? params.get('variant') : 'H';
  let stripOverride = ['dock', 'lane', 'ribbon'].includes(params.get('strip')) ? params.get('strip') : null;
  let stepwise = params.get('pace') !== 'choices';
  let selected = null;
  const open = new Set();
  const stripForm = () => stripOverride || VARIANTS[variant].strip;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  let state = Object.create(null);
  let noteOpen = new Set();
  let showAll = false;
  let rects = {};
  let anchors = {};
  let shownBefore = new Set();
  const layoutOpts = () => ({ variant, open });
  let plan = L.layout(map, layoutOpts());
  const byId = new Map(L.all(map).map((n) => [n.id, n]));
  const shownSet = () => L.revealed(map, state, { stepwise });
  const pathIds = () => L.walked(map, state, showAll, { stepwise });
  const pendingId = () => (stepwise && !showAll ? L.pending(map, state) : null);

  function el(tag, attrs, parent) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const key in attrs) node.setAttribute(key, attrs[key]);
    if (parent) parent.appendChild(node);
    return node;
  }

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

  const cam = { x: 0, y: 0, k: 1 };
  const pct = document.getElementById('pct');

  function applyCam() {
    world.setAttribute('transform', `translate(${cam.x} ${cam.y}) scale(${cam.k})`);
    const cell = 24 * cam.k;
    stage.style.backgroundSize = `${cell}px ${cell}px`;
    stage.style.backgroundPosition = `${cam.x}px ${cam.y}px`;
    pct.textContent = `${Math.round(cam.k * 100)}%`;
  }

  let anim = 0;
  function animateTo(target) {
    cancelAnimationFrame(anim);
    if (reduceMotion) {
      Object.assign(cam, target);
      applyCam();
      return;
    }
    const from = { ...cam };
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / 460);
      const ease = 1 - (1 - p) ** 3;
      cam.x = from.x + (target.x - from.x) * ease;
      cam.y = from.y + (target.y - from.y) * ease;
      cam.k = from.k + (target.k - from.k) * ease;
      applyCam();
      if (p < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  function fitTarget(b, maxK = 1) {
    const vw = svg.clientWidth;
    const vh = svg.clientHeight;
    const top = 84;
    const form = stripForm();
    const bottom = form === 'dock' ? 216 : form === 'ribbon' ? 140 : 80;
    const side = 32;
    const right = variant === 'C' ? 370 : 0;
    const k = Math.max(0.05, Math.min(maxK, (vw - 2 * side - right) / b.w, (vh - top - bottom) / b.h));
    return {
      k,
      x: side + (vw - 2 * side - right - b.w * k) / 2 - b.x * k,
      y: top + (vh - top - bottom - b.h * k) / 2 - b.y * k,
    };
  }

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

  function zoomAt(factor, sx, sy) {
    const k = Math.max(0.05, Math.min(3, cam.k * factor));
    cam.x = sx - (sx - cam.x) * (k / cam.k);
    cam.y = sy - (sy - cam.y) * (k / cam.k);
    cam.k = k;
    applyCam();
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
    field.addEventListener('input', () => {
      state[id] ||= {};
      state[id][isNote ? 'note' : 'text'] = field.value;
      updateStatus();
    });
    return field;
  }

  function frame(g, n, b) {
    const { x, y, w, h } = b;
    const illus = n.illustrative ? ' illus' : '';
    if (n.kind === 'start') {
      const persona = map.persona && n.id === L.ctx(map).personaFor;
      el('rect', { x, y, width: w, height: h, rx: persona ? 18 : h / 2, class: `card start${illus}` }, g);
      return;
    }
    if (L.isStep(n)) {
      const m = L.moodOf(n);
      const card = el('rect', { x, y, width: w, height: h, rx: 14, class: `card k-step${illus}` }, g);
      if (m && variant === 'B') card.style.fill = m.soft;
      if (variant === 'H') drawBand(g, n, b, m);
      if (m && (variant === 'E' || variant === 'F')) {
        const bh = 32;
        const by = variant === 'E' ? y : y + h - bh;
        const clip = el('clipPath', { id: `clip-${n.id}` }, g);
        el('rect', { x, y, width: w, height: h, rx: 14 }, clip);
        el('rect', { x, y: by, width: w, height: bh, 'clip-path': `url(#clip-${n.id})`, style: `fill:${m.color}` }, g);
        const first = (map.persona?.name || '').split(' ')[0];
        const face = text(g, x + 12, by + 23, m.face, '18px "Apple Color Emoji", "Segoe UI Emoji", system-ui, sans-serif', '#fff');
        el('title', {}, face).textContent = `${m.name} (${m.value > 0 ? '+' : ''}${m.value})`;
        const nm = text(g, x + 40, by + 21, first, '600 13px Inter, system-ui, sans-serif', '#fff');
        text(g, x + 40 + textWidth(first, '600 13px Inter, system-ui, sans-serif') + 8, by + 21, m.name, '500 11px Inter, system-ui, sans-serif', 'rgba(255,255,255,.85)');
        nm.setAttribute('aria-label', `${first} feels ${m.name}`);
      }
      if (m && variant === 'A') {
        const clip = el('clipPath', { id: `clip-${n.id}` }, g);
        el('rect', { x, y, width: w, height: h, rx: 14 }, clip);
        el('rect', { x, y, width: 9, height: h, 'clip-path': `url(#clip-${n.id})`, style: `fill:${m.color}` }, g);
      }
      if (variant === 'C') {
        if (selId() === n.id) {
          el('rect', { x: x - 4, y: y - 4, width: w + 8, height: h + 8, rx: 17, class: 'selring' }, g);
        }
        const hg = hit(g, JSON.stringify(['select', n.id]), `Show details: ${n.label}`);
        hg.dataset.focus = `select-${n.id}`;
        el('rect', { x, y, width: w, height: h, rx: 14, class: 'selhit' }, hg);
      }
      return;
    }
    el('rect', { x, y, width: w, height: h, rx: 14, class: `card k-${n.kind}${illus}` }, g);
    if (n.kind === 'ticket') {
      const [, color] = STATUS[n.status];
      const d = `M${x + 14} ${y} H${x + 6} Q${x} ${y} ${x} ${y + 6} V${y + h - 6} Q${x} ${y + h} ${x + 6} ${y + h} H${x + 14} Z`;
      el('path', { d, style: `fill:var(${color})` }, g);
    }
    if (n.kind === 'card') {
      el(
        'rect',
        { x: x + 1, y: y + 1, width: w - 2, height: 5, rx: 2.5, style: 'fill:var(--accent)' },
        g,
      );
    }
  }

  // PROTOTYPE: variant H header band, mood-coloured, or neutral grey when the step has no mood.
  function drawBand(g, n, b, m) {
    const { x, y, w, h } = b;
    const bh = 32;
    const clip = el('clipPath', { id: `clip-${n.id}` }, g);
    el('rect', { x, y, width: w, height: h, rx: 14 }, clip);
    el('rect', { x, y, width: w, height: bh, 'clip-path': `url(#clip-${n.id})`, style: `fill:${m ? m.color : '#e9eaf0'}` }, g);
    const first = (map.persona?.name || '').split(' ')[0];
    const font = '600 13px Inter, system-ui, sans-serif';
    if (m) {
      const face = text(g, x + 12, y + 23, m.face, '18px "Apple Color Emoji", "Segoe UI Emoji", system-ui, sans-serif', '#fff');
      el('title', {}, face).textContent = `${m.name} (${m.value > 0 ? '+' : ''}${m.value})`;
      text(g, x + 40, y + 21, first, font, '#fff').setAttribute('aria-label', `${first} feels ${m.name}`);
    } else {
      text(g, x + 14, y + 21, first, font, 'var(--muted)');
    }
  }

  const hasDetails = (n) => Boolean(n.touchpoints?.length || n.pains?.length || n.opportunities?.length);
  /** Chevron and pencil docked on the right of the H band; the chevron is inert (dimmed) on a step with nothing to expand. */
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
    el('path', { d: `M${nx + 7} ${cy + 17} l1 -4 l7 -7 l3 3 l-7 7 z`, class: 'band-ico', style: `stroke:${a.note ? '#6b4e00' : ink}` }, nh);
  }

  // PROTOTYPE: variant H thought cloud, drawn above the card with trailing circles pointing down at it.
  function drawCloud(g, b, r, top, n) {
    const x0 = b.x + 12;
    const bw = b.w - 24;
    const ry = top + 14;
    const bodyH = r.h - 14 - 38;
    const shapes = [];
    shapes.push(['rect', { x: x0, y: ry, width: bw, height: bodyH, rx: 24 }]);
    const cg = el('g', { class: 'cloud' }, g);
    const sh = el('g', { class: 'cloud-shadow' }, cg);
    for (const [tag, at] of shapes) el(tag, { ...at, class: 'cloud-edge' }, sh);
    for (const [tag, at] of shapes) el(tag, { ...at, class: 'cloud-fill' }, cg);
    const by = ry + bodyH;
    for (const [dx, dy, rr] of [[46, 16, 7], [34, 27, 5], [26, 35, 3.5]]) {
      el('circle', { cx: x0 + dx, cy: by + dy, r: rr, class: 'cloud-dot' }, cg);
    }
    para(cg, x0 + 22, ry + 28, n.thought, FONT.hand, 'var(--ink)', 26, 22);
  }

  function drawEyebrow(g, n, x, top, b) {
    const [name, color] = KIND[n.kind];
    const step = L.isStep(n);
    const label = n.kind === 'ticket' ? `${n.ticket} ticket` : step ? n.tag : name;
    const m = step ? L.moodOf(n) : null;
    const t = text(g, x, top + 17, label.toUpperCase(), FONT.eyebrow, m ? m.color : `var(${color})`);
    t.style.letterSpacing = '0.08em';
    if (n.illustrative) {
      const px = x + label.length * 8.6 + 12;
      pill(g, px, top + 3, 'illustrative', 'var(--select)', 'var(--select-soft)');
    }
    if (m && variant !== 'E' && variant !== 'F' && variant !== 'H') {
      const fx = b.x + b.w - 44;
      if (variant === 'C') el('circle', { cx: fx - 10, cy: top + 12, r: 15, style: `fill:${m.soft};stroke:${m.color}` }, g);
      const face = text(g, fx - 10, top + 19, m.face, FONT.face, 'var(--ink)', 'middle');
      face.setAttribute('aria-label', m.name);
      const tip = el('title', {}, face);
      tip.textContent = `${m.name} (${m.value > 0 ? '+' : ''}${m.value})`;
    }
  }

  // PROTOTYPE: persona header, drawn as the start card's rows.
  function drawPersona(g, b, r, top) {
    const p = map.persona;
    const x = b.x;
    if (r.kind === 'pheader') {
      const ar = r.full ? 24 : 20;
      const cy = top + (r.full ? 34 : 28);
      el('circle', { cx: x + 22 + ar, cy, r: ar, style: 'fill:var(--select)' }, g);
      const initials = p.name.split(' ').map((s) => s[0]).join('').slice(0, 2);
      text(g, x + 22 + ar, cy + 5, initials, r.full ? FONT.start : FONT.label, '#fff', 'middle');
      const tx = x + 34 + ar * 2;
      text(g, tx, cy - 3, p.name, r.full ? FONT.start : FONT.title, 'var(--ink)');
      if (p.role) text(g, tx, cy + 15, p.role, FONT.body, 'var(--muted)');
    }
    if (r.kind === 'pgoal') {
      if (r.full) {
        el('rect', { x: x + 12, y: top + 2, width: b.w - 24, height: r.h - 6, rx: 8, style: 'fill:var(--select-soft)' }, g);
        text(g, x + 22, top + 19, 'GOAL', FONT.eyebrow, 'var(--select)').style.letterSpacing = '0.08em';
        para(g, x + 22, top + 38, p.goal, FONT.body, 'var(--ink)', 32, M.body);
      } else {
        text(g, x + M.pad, top + 14, 'GOAL', FONT.eyebrow, 'var(--select)').style.letterSpacing = '0.08em';
        para(g, x + M.pad, top + 32, p.goal, FONT.body, 'var(--ink)', 34, M.body);
      }
    }
    if (r.kind === 'pscen') {
      if (r.full) para(g, x + 22, top + 20, map.scenario, FONT.hand, 'var(--muted)', 26, 22);
      else para(g, x + M.pad, top + 16, map.scenario, FONT.body, 'var(--muted)', 36, M.body);
    }
  }

  // PROTOTYPE: journey detail rows.
  function drawChipbar(g, n, b, r, top) {
    const isOpen = open.has(n.id);
    const parts = [];
    if (n.thought) parts.push('thought');
    const count = (list, one, many) => list?.length && parts.push(`${list.length} ${list.length === 1 ? one : many}`);
    count(n.touchpoints, 'touchpoint', 'touchpoints');
    count(n.pains, 'pain', 'pains');
    count(n.opportunities, 'idea', 'ideas');
    const hg = hit(g, JSON.stringify(['open', n.id]), `${isOpen ? 'Collapse' : 'Expand'} details: ${n.label}`);
    hg.dataset.focus = `open-${n.id}`;
    el('rect', { x: b.x + 12, y: top + 2, width: b.w - 24, height: r.h - 6, rx: 8, class: 'row bar' }, hg);
    text(hg, b.x + 22, top + 20, `${isOpen ? '▾' : '▸'} ${parts.join(' · ')}`, FONT.small, 'var(--muted)');
  }

  // PROTOTYPE: ClickUp-style task-card details for E, F and H.
  function drawDbar(g, n, b, r, top) {
    const isOpen = open.has(n.id);
    const hg = hit(g, JSON.stringify(['open', n.id]), `${isOpen ? 'Collapse' : 'Expand'} details: ${n.label}`);
    hg.dataset.focus = `open-${n.id}`;
    el('rect', { x: b.x + 12, y: top + 2, width: b.w - 24, height: r.h - 6, rx: 8, class: 'row bar' }, hg);
    const h = variant === 'H';
    if (!h) el('path', { d: isOpen ? `M${b.x + 22} ${top + 12} l5 6 l5 -6` : `M${b.x + 24} ${top + 9} l6 6 l-6 6`, class: 'chev' }, hg);
    if (isOpen) {
      text(hg, b.x + 42, top + 20, 'Details', FONT.small, 'var(--muted)');
      return;
    }
    let cx = h ? b.x + 22 : b.x + 42;
    const chips = [];
    if (n.thought && !h) chips.push(['\u{1F4AD}', 1, 'tag']);
    if (n.touchpoints?.length) chips.push(['\u{1F4CD}', n.touchpoints.length, 'tag']);
    if (n.pains?.length) chips.push(['\u26A0', n.pains.length, 'pain']);
    if (n.opportunities?.length) chips.push(['\u{1F4A1}', n.opportunities.length, 'idea']);
    for (const [icon, count, tone] of chips) {
      const bg = tone === 'pain' ? 'var(--pain-bg)' : tone === 'idea' ? 'var(--opp-bg)' : 'var(--tag-bg)';
      const fg = tone === 'pain' ? 'var(--pain)' : tone === 'idea' ? 'var(--opp)' : 'var(--tag-ink)';
      el('rect', { x: cx, y: top + 5, width: 38, height: 20, rx: 10, style: `fill:${bg}` }, hg);
      text(hg, cx + 8, top + 19, icon, '12px "Apple Color Emoji", "Segoe UI Emoji", sans-serif', fg);
      text(hg, cx + 24, top + 19, String(count), FONT.small, fg);
      cx += 44;
    }
  }

  const DSEC = {
    thought: ['\u{1F4AD}', 'THOUGHT', 'var(--muted)'],
    touch: ['\u{1F4CD}', 'TOUCHPOINTS', 'var(--muted)'],
    pain: ['\u26A0', 'PAINS', 'var(--pain)'],
    idea: ['\u{1F4A1}', 'IDEAS', 'var(--opp)'],
  };
  function drawDsec(g, n, b, r, top) {
    const [icon, head, color] = DSEC[r.tone];
    const x = b.x + M.pad;
    text(g, x, top + 14, icon, '12px "Apple Color Emoji", "Segoe UI Emoji", sans-serif', color);
    text(g, x + 20, top + 14, head, FONT.eyebrow, color).style.letterSpacing = '0.08em';
    const y0 = top + 24;
    if (r.tone === 'thought') {
      para(g, x, y0 + 14, r.items[0], FONT.hand, 'var(--ink)', 28, 22);
    } else if (r.tone === 'touch') {
      chipLayout(r.items).forEach((line, i) => {
        let cx = x;
        for (const c of line) {
          el('rect', { x: cx, y: y0 + i * 28, width: c.w, height: 22, rx: 11, style: 'fill:var(--tag-bg)' }, g);
          text(g, cx + 10, y0 + 15 + i * 28, c.t, FONT.small, 'var(--tag-ink)');
          cx += c.w + 6;
        }
      });
    } else {
      const col = r.tone === 'pain' ? 'var(--pain)' : 'var(--opp)';
      const lines = r.items.reduce((h, i) => h + L.lines(i, 32).length * M.body + 3, 0);
      el('rect', { x: x - 2, y: y0 - 2, width: 3, height: lines + 1, rx: 1.5, style: `fill:${col}` }, g);
      let ty = y0 + 12;
      for (const item of r.items) {
        text(g, x + 8, ty, r.tone === 'pain' ? '\u2715' : '\u2726', FONT.small, col);
        ty += para(g, x + 24, ty, item, FONT.body, 'var(--ink)', 32, M.body) + 3;
      }
    }
  }

  function drawThought(g, b, r, top, n) {
    text(g, b.x + M.pad - 2, top + 26, '“', '600 30px Caveat, cursive', 'var(--edge)');
    para(g, b.x + M.pad + 12, top + 18, n.thought, FONT.hand, 'var(--ink)', 28, 22);
  }

  function drawChips(g, b, r, top) {
    chipLayout(r.items).forEach((line, i) => {
      let cx = b.x + M.pad;
      for (const c of line) {
        el('rect', { x: cx, y: top + 2 + i * 28, width: c.w, height: 22, rx: 11, style: 'fill:var(--tag-bg)' }, g);
        text(g, cx + 10, top + 17 + i * 28, c.t, FONT.small, 'var(--tag-ink)');
        cx += c.w + 6;
      }
    });
  }
  const chipLayout = (items) => L.chipRows(items);

  function drawBlock(g, b, r, top) {
    const pain = r.tone === 'pain';
    const color = pain ? 'var(--pain)' : 'var(--opp)';
    el('rect', { x: b.x + 12, y: top + 2, width: b.w - 24, height: r.h - 6, rx: 8, style: `fill:${pain ? 'var(--pain-bg)' : 'var(--opp-bg)'}` }, g);
    text(g, b.x + 22, top + 19, pain ? 'PAINS' : 'OPPORTUNITIES', FONT.eyebrow, color).style.letterSpacing = '0.08em';
    let ty = top + 40;
    for (const item of r.items) {
      text(g, b.x + 22, ty, pain ? '✕' : '✦', FONT.small, color);
      ty += para(g, b.x + 38, ty, item, FONT.body, 'var(--ink)', 32, M.body) + 3;
    }
  }

  function drawBubble(g, b, r, top, n) {
    const bh = r.h - 16;
    el('rect', { x: b.x, y: top + 2, width: b.w, height: bh, rx: 14, class: 'bubble' }, g);
    el('path', { d: `M${b.x + 30} ${top + 2 + bh - 1} L${b.x + 52} ${top + 2 + bh - 1} L${b.x + 36} ${top + r.h - 1} Z`, class: 'bubble tailp' }, g);
    para(g, b.x + 16, top + 22, n.thought, FONT.hand, 'var(--ink)', 28, 22);
  }

  const STICKY = {
    thought: ['var(--sticky-bg)', '#f1df8a', ''],
    touch: ['#e3eefc', '#b9d3f5', 'TOUCHPOINTS'],
    pain: ['var(--pain-bg)', '#f3b9b9', 'PAINS'],
    idea: ['var(--opp-bg)', '#aedfc4', 'OPPORTUNITIES'],
  };
  function drawSticky(g, n, b, r, top, index) {
    const [fill, stroke, head] = STICKY[r.tone];
    const rot = ((seed(n.id + r.tone) % 5) - 2) * 0.9;
    const sx = b.x + 14 + (index % 2) * 6;
    const sw = b.w - 32;
    // why: H reserves 8 extra px under the card so a rotated corner never touches it.
    if (variant === 'H') top += 8;
    const sh = r.h - 8 - (variant === 'H' ? 8 : 0);
    const sg = el('g', { transform: `rotate(${rot} ${sx + sw / 2} ${top + 4 + sh / 2})` }, g);
    el('rect', { x: sx, y: top + 4, width: sw, height: sh, rx: 4, style: `fill:${fill};stroke:${stroke}`, class: 'stickybox' }, sg);
    if (r.tone === 'thought') {
      para(sg, sx + 12, top + 26, r.items[0], FONT.hand, 'var(--sticky-ink)', 22, 22);
      return;
    }
    text(sg, sx + 12, top + 22, head, FONT.eyebrow, 'var(--muted)').style.letterSpacing = '0.08em';
    let ty = top + 42;
    for (const item of r.items) {
      text(sg, sx + 12, ty, r.tone === 'touch' ? '◎' : r.tone === 'pain' ? '✕' : '✦', FONT.small, 'var(--muted)');
      ty += para(sg, sx + 28, ty, item, FONT.body, 'var(--ink)', 30, M.body) + 2;
    }
  }

  function drawTitle(g, n, b, r, top) {
    if (n.kind !== 'start' && L.isStep(n)) {
      para(g, b.x + M.pad, top + 16, n.label, FONT.title, 'var(--ink)', M.titleChars, M.title);
      return;
    }
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

  function drawStatus(g, n, x, top) {
    const [name, color] = STATUS[n.status];
    el('circle', { cx: x + M.pad + 5, cy: top + 13, r: 5, style: `fill:var(${color})` }, g);
    text(g, x + M.pad + 16, top + 18, name, FONT.label, 'var(--ink)');
  }

  function drawClaimed(g, n, x, top) {
    el('circle', { cx: x + M.pad + 10, cy: top + 13, r: 10, class: 'avatar' }, g);
    text(g, x + M.pad + 10, top + 17.5, n.claimed_by.slice(0, 1).toUpperCase(), FONT.small, '#fff', 'middle');
    text(g, x + M.pad + 28, top + 18, n.claimed_by, FONT.body, 'var(--ink)');
  }

  function drawBlocked(g, n, x, top) {
    const waiting = L.blocked(map, n);
    pill(
      g,
      x + M.pad,
      top + 3,
      waiting ? 'blocked: waiting on a ticket' : 'dependencies closed',
      waiting ? 'var(--warn)' : 'var(--muted)',
      waiting ? 'var(--warn-bg)' : 'var(--tag-bg)',
    );
  }

  function drawRow(g, n, b, r, top, a) {
    const { x } = b;
    if (r.kind === 'eyebrow') drawEyebrow(g, n, x + M.pad, top, b);
    if (['pheader', 'pgoal', 'pscen'].includes(r.kind)) drawPersona(g, b, r, top);
    if (r.kind === 'chipbar') drawChipbar(g, n, b, r, top);
    if (r.kind === 'dbar') drawDbar(g, n, b, r, top);
    if (r.kind === 'dsec') drawDsec(g, n, b, r, top);
    if (r.kind === 'thought') drawThought(g, b, r, top, n);
    if (r.kind === 'chips') drawChips(g, b, r, top);
    if (r.kind === 'block') drawBlock(g, b, r, top);
    if (r.kind === 'bubble') drawBubble(g, b, r, top, n);
    if (r.kind === 'cloud') drawCloud(g, b, r, top, n);
    if (r.kind === 'sticky') drawSticky(g, n, b, r, top, r.index);
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
    if (r.kind === 'status') drawStatus(g, n, x, top);
    if (r.kind === 'claimed') drawClaimed(g, n, x, top);
    if (r.kind === 'blocked') drawBlocked(g, n, x, top);
  }

  function drawNote(g, n, b, a, noteY = b.y + b.h) {
    const { x, y, w } = b;
    if (variant === 'H' && L.isStep(n)) {
      drawBandActions(g, n, b, a);
    } else {
      const nh = hit(
        g,
        JSON.stringify(['note', n.id]),
        a.note ? `Edit note: ${n.label}` : `Add note: ${n.label}`,
      );
      nh.dataset.focus = `note-${n.id}`;
      const nx = x + w - 34;
      const ny = y + (n.kind === 'start' ? b.h / 2 - 12 : 10);
      el(
        'rect',
        { x: nx, y: ny, width: 24, height: 24, rx: 7, class: a.note ? 'note-btn has' : 'note-btn' },
        nh,
      );
      el('path', { d: `M${nx + 7} ${ny + 17} l1 -4 l7 -7 l3 3 l-7 7 z`, class: 'pencil' }, nh);
    }
    if (noteOpen.has(n.id)) {
      input(g, n.id, x + 14, noteY + 10, w - 28, a.note, 'Note for your agent…', true);
    } else if (a.note) {
      el('rect', { x: x + 14, y: noteY + 10, width: w - 28, height: 34, rx: 6, class: 'sticky' }, g);
      text(g, x + 24, noteY + 33, L.lines(a.note, 30)[0], FONT.hand, 'var(--sticky-ink)');
    }
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
    let topY = b.y;
    let cardY = cb.y + (n.kind === 'start' ? M.pad : 14);
    let tailY = cb.y + cb.h;
    let stickyIndex = 0;
    for (const r of P.rows) {
      const zone = r.zone || 'card';
      if (r.kind === 'sticky') r.index = stickyIndex++;
      if (zone === 'top') {
        drawRow(g, n, cb, r, topY, a);
        topY += r.h;
      } else if (zone === 'bottom') {
        drawRow(g, n, cb, r, tailY, a);
        tailY += r.h;
      } else {
        drawRow(g, n, cb, r, cardY, a);
        cardY += r.h;
      }
    }
    if (fade.later.has(n.id)) pill(g, b.x + b.w - 62, b.y - 10, 'later', 'var(--rec-ink)', 'var(--rec-bg)');
    drawNote(g, n, cb, a, b.y + b.h);
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
      // PROTOTYPE: variant D colours each path edge by the mood it leads into.
      const tm = ['D', 'E', 'F', 'H'].includes(variant) ? L.moodOf(byId.get(e.to)) : null;
      curve(edgeLayer, `${e.from}-${e.to}`, from.x + from.w + 2, from.ay, to.x - 6, to.ay, {
        faded: dim,
        ...(tm ? { stroke: tm.color, sw: 3.2 } : {}),
      });
    }
  }

  function drawAnnotations(notes, visible) {
    for (const a of map.annotations || []) {
      const b = rects[a.target];
      if (!visible(a.target)) continue;
      const ty = b.y + b.h + 44;
      para(notes, b.x + 34, ty, a.text, FONT.hand, 'var(--muted)', 32, 22);
      arrow(
        notes,
        a.id,
        [
          [b.x + 26, ty - 8],
          [b.x + 14, ty - 18],
          [b.x + 18, b.y + b.h + 6],
        ],
        { stroke: 'var(--muted)', sw: 1.1 },
      );
    }
  }

  /** Redraws the whole map and returns the ids that appeared since the previous render. */
  function render(refocus) {
    world.replaceChildren();
    plan = L.layout(map, layoutOpts());
    rects = Object.fromEntries(plan.boxes.map((b) => [b.id, b]));
    anchors = {};
    const shown = shownSet();
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
    drawAnnotations(notes, visible);
    if (stripForm() === 'lane') drawLane(notes);
    if (refocus) {
      const target = [...world.querySelectorAll('[data-focus]')].find((e) => e.dataset.focus === refocus);
      target?.focus({ preventScroll: true });
    }
    updateStatus();
    drawChrome();
    const fresh = [...shown].filter((id) => !shownBefore.has(id));
    shownBefore = shown;
    return fresh;
  }

  function updateStatus() {
    const shown = shownSet();
    const noteCount = Object.values(state).filter((a) => a.note).length;
    statusEl.textContent = `${shown.size} of ${plan.boxes.length} nodes revealed · ${noteCount} note${noteCount === 1 ? '' : 's'}`;
  }

  function act(serialized) {
    const [kind, id, key] = JSON.parse(serialized);
    const n = byId.get(id);
    if (kind === 'open' || kind === 'select') {
      if (kind === 'open') (open.has(id) ? open.delete(id) : open.add(id));
      else selected = id;
      render(`${kind}-${id}`);
      if (kind === 'open') ensureVisible(id);
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
        fresh.some((f) => e.closest(`[data-node="${f}"]`)),
      );
      next?.focus({ preventScroll: true });
    }
  }

  const pointers = new Map();
  let moved = false;
  let pinch = null;

  svg.addEventListener('pointerdown', (e) => {
    if (e.target.closest('input')) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, ox: e.clientX, oy: e.clientY });
    if (pointers.size === 1) moved = false;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
      moved = true;
    }
  });

  svg.addEventListener('pointermove', (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    const cur = { ...prev, x: e.clientX, y: e.clientY };
    if (pointers.size === 2 && pinch) {
      pointers.set(e.pointerId, cur);
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      cancelAnimationFrame(anim);
      zoomAt(d / Math.max(1, pinch.d), mx, my);
      cam.x += mx - pinch.mx;
      cam.y += my - pinch.my;
      applyCam();
      pinch = { d, mx, my };
      return;
    }
    if (!moved && Math.hypot(cur.x - prev.ox, cur.y - prev.oy) < 4) return;
    cancelAnimationFrame(anim);
    svg.setPointerCapture(e.pointerId);
    stage.classList.add('panning');
    cam.x += cur.x - prev.x;
    cam.y += cur.y - prev.y;
    moved = true;
    applyCam();
    pointers.set(e.pointerId, cur);
  });

  function endPointer(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (!pointers.size) stage.classList.remove('panning');
  }
  svg.addEventListener('pointerup', endPointer);
  svg.addEventListener('pointercancel', endPointer);

  svg.addEventListener('click', (e) => {
    if (moved) return;
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

  svg.addEventListener(
    'wheel',
    (e) => {
      if (e.target.closest('input')) return;
      e.preventDefault();
      cancelAnimationFrame(anim);
      if (e.ctrlKey || e.metaKey) {
        zoomAt(Math.exp(-e.deltaY * 0.01), e.clientX, e.clientY);
      } else {
        cam.x -= e.deltaX;
        cam.y -= e.deltaY;
        applyCam();
      }
    },
    { passive: false },
  );

  const startIds = () =>
    plan.boxes.filter((b) => b.column <= 1 && b.tree === map.trees[0].id).map((b) => b.id);
  const centerZoom = (factor) => zoomAt(factor, svg.clientWidth / 2, svg.clientHeight / 2);

  const toggle = document.getElementById('show-all');
  toggle.onclick = () => {
    showAll = !showAll;
    toggle.setAttribute('aria-pressed', String(showAll));
    toggle.textContent = showAll ? 'Hide upcoming' : 'Show whole map';
    render();
    if (showAll) fitAll();
    else focusOn([...shownSet()]);
  };
  document.getElementById('zin').onclick = () => centerZoom(1.2);
  document.getElementById('zout').onclick = () => centerZoom(1 / 1.2);
  pct.onclick = () => centerZoom(1 / cam.k);
  document.getElementById('fit').onclick = fitAll;
  document.getElementById('reset').onclick = () => {
    state = Object.create(null);
    noteOpen.clear();
    open.clear();
    selected = null;
    render();
    focusOn(startIds());
  };

  copyButton.onclick = async () => {
    const value = L.feedback(map, state, path);
    try {
      await navigator.clipboard.writeText(value);
      statusEl.textContent = 'Copied. Paste it into your agent chat.';
    } catch {
      feedbackPanel.hidden = false;
      feedbackBox.value = value;
      feedbackBox.focus();
      feedbackBox.select();
    }
  };
  document.getElementById('close-feedback').onclick = () => {
    feedbackPanel.hidden = true;
    copyButton.focus();
  };

  // PROTOTYPE: walk pacing, mood strips, inspector and the variant bar.
  const stripEl = document.getElementById('strip');
  const inspectorEl = document.getElementById('inspector');
  const nextBtn = document.getElementById('next');
  const prevBtn = document.getElementById('prev');
  const paceBtn = document.getElementById('pace');
  const vcap = document.getElementById('vcap');

  /** Strip points: path nodes that carry a mood, in walk order. */
  function stripPoints() {
    return pathIds()
      .map((id) => byId.get(id))
      .filter((n) => n.mood !== undefined)
      .map((n, i) => ({ n, id: n.id, m: L.moodOf(n), i }));
  }

  function selId() {
    if (selected && byId.has(selected) && (showAll || shownSet().has(selected))) return selected;
    const steps = pathIds().filter((id) => L.isStep(byId.get(id)));
    return steps[steps.length - 1] || null;
  }

  function nextStep() {
    const id = pendingId();
    if (!id) return;
    state[id] ||= {};
    state[id].done = true;
    selected = null;
    const fresh = render();
    focusOn([id, ...fresh]);
  }

  /** The path index whose answer "Prev" would clear: the nearest answered choice or done step before the last revealed node, or -1. */
  function prevTarget() {
    if (!stepwise || showAll) return -1;
    const path = pathIds();
    for (let i = path.length - 2; i >= 0; i--) {
      const nd = byId.get(path[i]);
      const a = state[nd.id];
      if (nd.kind === 'choice' && a?.choice !== undefined) return i;
      if ((L.isStep(nd) || nd.kind === 'checklist' || nd.kind === 'text') && a?.done) return i;
    }
    return -1;
  }

  /** Hides the last revealed node by clearing the answer that revealed it; the dock follows because it reads the walked path. */
  function prevStep() {
    const i = prevTarget();
    if (i < 0) return;
    const nd = byId.get(pathIds()[i]);
    if (nd.kind === 'choice') delete state[nd.id].choice;
    else state[nd.id].done = false;
    selected = null;
    render();
    focusOn(pathIds().slice(-3));
  }

  /** Lane strip, drawn in the world under the tree so it pans and zooms with it. */
  function drawLane(layer) {
    const pts = stripPoints();
    const bottom = Math.max(...plan.boxes.map((b) => b.y + b.h));
    const top = bottom + 90;
    const gap = 28;
    const yOf = (v) => top + (2 - v) * gap;
    const x0 = 30;
    const x1 = plan.width - 30;
    const head = text(layer, 60, top - 26, 'MOOD ALONG THE WALK', FONT.tree, 'var(--muted)');
    head.style.letterSpacing = '0.1em';
    el('rect', { x: x0, y: top - 14, width: x1 - x0, height: 4 * gap + 28, rx: 14, class: 'lane' }, layer);
    for (const m of L.MOOD) {
      el('line', { x1: x0 + 34, x2: x1 - 10, y1: yOf(m.value), y2: yOf(m.value), class: m.value === 0 ? 'lane-zero' : 'lane-line' }, layer);
      text(layer, x0 + 18, yOf(m.value) + 6, m.face, '14px "Apple Color Emoji", system-ui', 'var(--ink)', 'middle');
    }
    const at = (p) => [rects[p.id].x + rects[p.id].w / 2, yOf(p.m.value)];
    pts.forEach((p, i) => {
      if (!i) return;
      const [ax, ay] = at(pts[i - 1]);
      const [bx, by] = at(p);
      el('line', { x1: ax, y1: ay, x2: bx, y2: by, style: `stroke:${p.m.color}`, class: 'lane-seg' }, layer);
    });
    pts.forEach((p, i) => {
      const [px, py] = at(p);
      const newest = i === pts.length - 1;
      const g = el('g', { class: 'lane-pt' }, layer);
      if (newest) el('circle', { cx: px, cy: py, r: 17, class: 'newest' }, g);
      el('circle', { cx: px, cy: py, r: 12, style: `fill:${p.m.soft};stroke:${p.m.color}`, class: p.n.illustrative ? 'pt illus' : 'pt' }, g);
      text(g, px, py + 5, p.m.face, '14px "Apple Color Emoji", system-ui', 'var(--ink)', 'middle');
    });
  }

  function drawStrip() {
    const form = stripForm();
    const pts = stripPoints();
    stripEl.hidden = form === 'lane' || !pts.length;
    stripEl.className = `island strip-${form}`;
    if (stripEl.hidden) return;
    if (form === 'ribbon') {
      stripEl.innerHTML = `<span class="strip-title">Mood</span>${pts
        .map(
          (p, i) =>
            `<button type="button" class="chip${i === pts.length - 1 ? ' newest' : ''}${p.n.illustrative ? ' illus' : ''}" data-id="${esc(p.id)}" style="background:${p.m.soft};border-color:${p.m.color}" title="${esc(p.n.label)} - ${p.m.name}"><span class="cf">${p.m.face}</span><span class="cn">${i + 1}</span></button>`,
        )
        .join('<span class="chip-sep"></span>')}`;
      return;
    }
    const sp = 58;
    const w = Math.max(220, pts.length * sp + 56);
    const yOf = (v) => 22 + (2 - v) * 15;
    const xOf = (i) => 40 + i * sp;
    let s = `<svg width="${w}" height="120" viewBox="0 0 ${w} 120" role="img" aria-label="Mood along the walk">`;
    s += `<line x1="14" x2="${w - 14}" y1="${yOf(0)}" y2="${yOf(0)}" class="lane-zero"/>`;
    s += `<text x="14" y="114" class="dock-cap">MOOD ALONG THE WALK</text>`;
    pts.forEach((p, i) => {
      if (i) s += `<line x1="${xOf(i - 1)}" y1="${yOf(pts[i - 1].m.value)}" x2="${xOf(i)}" y2="${yOf(p.m.value)}" class="lane-seg" style="stroke:${p.m.color}"/>`;
    });
    pts.forEach((p, i) => {
      const newest = i === pts.length - 1;
      s += `<g class="dock-pt" data-id="${esc(p.id)}"><title>${esc(p.n.label)} - ${p.m.name}</title>`;
      if (newest) s += `<circle cx="${xOf(i)}" cy="${yOf(p.m.value)}" r="17" class="newest"/>`;
      s += `<circle cx="${xOf(i)}" cy="${yOf(p.m.value)}" r="12" class="pt${p.n.illustrative ? ' illus' : ''}" style="fill:${p.m.soft};stroke:${p.m.color}"/>`;
      s += `<text x="${xOf(i)}" y="${yOf(p.m.value) + 5}" text-anchor="middle" class="dock-face">${p.m.face}</text></g>`;
    });
    stripEl.innerHTML = `${s}</svg>`;
  }

  function drawInspector() {
    inspectorEl.hidden = variant !== 'C';
    if (variant !== 'C') return;
    const n = byId.get(selId());
    if (!n) {
      inspectorEl.innerHTML = '<p class="muted">Walk to a step, then click it.</p>';
      return;
    }
    const m = L.moodOf(n);
    const list = (cls, head, items) =>
      items?.length ? `<section class="ins-block ${cls}"><h3>${head}</h3><ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></section>` : '';
    inspectorEl.innerHTML = `
      <div class="ins-eyebrow">${esc(n.tag)}${n.illustrative ? ' <span class="ins-illus">illustrative</span>' : ''}</div>
      <h2>${esc(n.label)}</h2>
      ${m ? `<div class="ins-mood" style="background:${m.soft};color:${m.color}"><span class="cf">${m.face}</span> ${m.name} (${m.value > 0 ? '+' : ''}${m.value})</div>` : ''}
      ${n.thought ? `<p class="ins-thought">“${esc(n.thought)}”</p>` : ''}
      ${n.touchpoints?.length ? `<section class="ins-block"><h3>Touchpoints</h3><div class="ins-chips">${n.touchpoints.map((t) => `<span>${esc(t)}</span>`).join('')}</div></section>` : ''}
      ${list('pain', 'Pains', n.pains)}
      ${list('idea', 'Opportunities', n.opportunities)}`;
  }

  function drawChrome() {
    document.getElementById('top').classList.toggle('rich', RICH.includes(variant));
    document.getElementById('top').classList.toggle('hbar', variant === 'H');
    if (!menuEl.hidden) renderMenu();
    drawStrip();
    drawInspector();
    const pid = pendingId();
    const h = variant === 'H';
    nextBtn.hidden = h ? !stepwise : !stepwise || showAll;
    nextBtn.disabled = !pid || showAll;
    nextBtn.textContent = h ? 'Next \u25B6' : 'Next step \u2192';
    prevBtn.hidden = !h || !stepwise;
    prevBtn.disabled = showAll || prevTarget() < 0;
    paceBtn.setAttribute('aria-pressed', String(stepwise));
    paceBtn.textContent = stepwise ? 'Step by step: on' : 'Step by step: off';
    document.querySelectorAll('.vbtn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === variant)));
    vcap.textContent = `${variant} · ${VARIANTS[variant].name} — ${VARIANTS[variant].caption}`;
  }

  const detailIds = () =>
    [...byId.values()]
      .filter((n) => L.isStep(n) && (n.thought || n.touchpoints?.length || n.pains?.length || n.opportunities?.length))
      .map((n) => n.id);
  const allOpen = () => detailIds().every((id) => open.has(id));
  function toggleExpandAll() {
    if (allOpen()) open.clear();
    else for (const id of detailIds()) open.add(id);
    render();
    focusOn([...shownSet()]);
  }

  /** Pans (never rezooms) so a card that grew stays inside the viewport. */
  function ensureVisible(id) {
    const r = rects[id];
    if (!r) return;
    const vw = svg.clientWidth;
    const vh = svg.clientHeight;
    const botM = stripForm() === 'dock' ? 216 : 90;
    const t = cam.y + r.y * cam.k;
    const bt = cam.y + (r.y + r.h) * cam.k;
    let dy = 0;
    if (bt > vh - botM) dy = vh - botM - bt;
    if (t + dy < 90) dy = 90 - t;
    let dx = 0;
    const l = cam.x + r.x * cam.k;
    const rt = cam.x + (r.x + r.w) * cam.k;
    if (rt > vw - 24) dx = vw - 24 - rt;
    if (l + dx < 24) dx = 24 - l;
    animateTo({ k: cam.k, x: cam.x + dx, y: cam.y + dy });
  }

  // PROTOTYPE: overflow menu for E, F and H; entries click the hidden toolbar buttons so every handler stays shared.
  const moreBtn = document.getElementById('more');
  const menuEl = document.getElementById('menu');
  const showAllBtn = document.getElementById('show-all');
  const resetBtn = document.getElementById('reset');
  const MENU_ALL = [
    ['pace', 'P', () => (stepwise ? 'Step by step: on' : 'Step by step: off'), () => paceBtn.click(), () => false],
    ['next', 'N', () => 'Next step', () => nextStep(), () => nextBtn.disabled || !stepwise || showAll],
    ['all', 'W', () => showAllBtn.textContent, () => showAllBtn.click(), () => false],
    ['expand', 'E', () => (allOpen() ? 'Collapse all' : 'Expand all'), () => toggleExpandAll(), () => false],
    ['reset', 'R', () => 'Start over', () => resetBtn.click(), () => false],
  ];
  const menuItems = () => (variant === 'H' ? MENU_ALL.filter(([id]) => id !== 'next' && id !== 'reset') : MENU_ALL);
  function closeMenu() {
    menuEl.hidden = true;
    moreBtn.setAttribute('aria-expanded', 'false');
  }
  function renderMenu() {
    menuEl.replaceChildren();
    for (const [, key, label, run, off] of menuItems()) {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'menuitem');
      b.disabled = off();
      b.innerHTML = `<span>${esc(label())}</span><kbd>${key}</kbd>`;
      b.onclick = () => {
        closeMenu();
        run();
      };
      menuEl.appendChild(b);
    }
  }
  moreBtn.onclick = (e) => {
    e.stopPropagation();
    const willOpen = menuEl.hidden;
    if (willOpen) renderMenu();
    menuEl.hidden = !willOpen;
    moreBtn.setAttribute('aria-expanded', String(willOpen));
  };
  document.addEventListener('pointerdown', (e) => {
    if (!menuEl.hidden && !e.target.closest?.('#menu, #more')) closeMenu();
  });

  function setVariant(v) {
    if (!VARIANTS[v] || v === variant) return;
    variant = v;
    if (!params.get('strip')) stripOverride = null;
    try {
      const url = new URL(location.href);
      url.searchParams.set('variant', v);
      history.replaceState(null, '', url);
    } catch {
      // why: file:// pages may refuse replaceState; the switch still works without the URL update.
    }
    render();
    focusOn(pathIds().slice(-3));
  }
  const cycleVariant = (d) => {
    const keys = Object.keys(VARIANTS);
    setVariant(keys[(keys.indexOf(variant) + d + keys.length) % keys.length]);
  };

  stripEl.addEventListener('click', (e) => {
    const t = e.target.closest('[data-id]');
    if (t) focusOn([t.dataset.id]);
  });
  document.querySelectorAll('.vbtn').forEach((b) => {
    b.onclick = () => setVariant(b.dataset.v);
  });
  document.getElementById('vprev').onclick = () => cycleVariant(-1);
  document.getElementById('vnext').onclick = () => cycleVariant(1);
  nextBtn.onclick = nextStep;
  prevBtn.onclick = prevStep;
  paceBtn.onclick = () => {
    stepwise = !stepwise;
    render();
    focusOn(pathIds().slice(-3));
  };
  // why: listening on window (not document) and focusing the stage on load lets shortcuts work before the first click.
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menuEl.hidden) {
      closeMenu();
      moreBtn.focus();
      return;
    }
    if (e.target.closest?.('input, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 'e') toggleExpandAll();
    if (k === 'w') showAllBtn.click();
    if (k === 'r') resetBtn.click();
    if (k === 'p') paceBtn.click();
    if (k === 'b') prevStep();
    if (e.key === 'ArrowRight') cycleVariant(1);
    if (e.key === 'ArrowLeft') cycleVariant(-1);
    if (e.key === 'n' || e.key === 'N') nextStep();
  });

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

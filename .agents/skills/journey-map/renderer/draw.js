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

  let state = Object.create(null);
  let noteOpen = new Set();
  let showAll = false;
  let rects = {};
  let anchors = {};
  let shownBefore = new Set();
  const plan = L.layout(map);
  const byId = new Map(L.all(map).map((n) => [n.id, n]));

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
    const bottom = 70;
    const side = 32;
    const k = Math.max(0.05, Math.min(maxK, (vw - 2 * side) / b.w, (vh - top - bottom) / b.h));
    return {
      k,
      x: side + (vw - 2 * side - b.w * k) / 2 - b.x * k,
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
    if (n.kind === 'start') {
      el('rect', { x, y, width: w, height: h, rx: h / 2, class: 'card start' }, g);
      return;
    }
    el('rect', { x, y, width: w, height: h, rx: 14, class: `card k-${n.kind}` }, g);
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

  function drawEyebrow(g, n, x, top) {
    const [name, color] = KIND[n.kind];
    const label = n.kind === 'ticket' ? `${n.ticket} ticket` : name;
    const t = text(g, x, top + 17, label.toUpperCase(), FONT.eyebrow, `var(${color})`);
    t.style.letterSpacing = '0.08em';
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
    if (r.kind === 'eyebrow') drawEyebrow(g, n, x + M.pad, top);
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

  function drawNote(g, n, b, a) {
    const { x, y, w } = b;
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
    if (noteOpen.has(n.id)) {
      input(g, n.id, x + 14, y + b.h + 10, w - 28, a.note, 'Note for your agent…', true);
    } else if (a.note) {
      el('rect', { x: x + 14, y: y + b.h + 10, width: w - 28, height: 34, rx: 6, class: 'sticky' }, g);
      text(g, x + 24, y + b.h + 33, L.lines(a.note, 30)[0], FONT.hand, 'var(--sticky-ink)');
    }
  }

  function node(layer, n, b, fade, ghost) {
    const a = state[n.id] || {};
    const cls = ghost ? 'ghost' : fade.faded.has(n.id) ? 'faded' : '';
    const g = el('g', { 'data-node': n.id, class: cls }, layer);
    frame(g, n, b);
    anchors[n.id] = {};
    let cy = b.y + (n.kind === 'start' ? M.pad : 14);
    for (const r of L.rows(n)) {
      drawRow(g, n, b, r, cy, a);
      cy += r.h;
    }
    if (fade.later.has(n.id)) pill(g, b.x + b.w - 62, b.y - 10, 'later', 'var(--rec-ink)', 'var(--rec-bg)');
    drawNote(g, n, b, a);
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
            to.y + to.h / 2,
            { faded: !chosen && dim, stroke: chosen ? 'var(--select)' : undefined },
          );
        }
        continue;
      }
      curve(edgeLayer, `${e.from}-${e.to}`, from.x + from.w + 2, from.y + from.h / 2, to.x - 6, to.y + to.h / 2, {
        faded: dim,
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
    rects = Object.fromEntries(plan.boxes.map((b) => [b.id, b]));
    anchors = {};
    const shown = L.revealed(map, state);
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
    if (refocus) {
      const target = [...world.querySelectorAll('[data-focus]')].find((e) => e.dataset.focus === refocus);
      target?.focus({ preventScroll: true });
    }
    updateStatus();
    const fresh = [...shown].filter((id) => !shownBefore.has(id));
    shownBefore = shown;
    return fresh;
  }

  function updateStatus() {
    const shown = L.revealed(map, state);
    const noteCount = Object.values(state).filter((a) => a.note).length;
    statusEl.textContent = `${shown.size} of ${plan.boxes.length} nodes revealed · ${noteCount} note${noteCount === 1 ? '' : 's'}`;
  }

  function act(serialized) {
    const [kind, id, key] = JSON.parse(serialized);
    const n = byId.get(id);
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
    else focusOn([...L.revealed(map, state)]);
  };
  document.getElementById('zin').onclick = () => centerZoom(1.2);
  document.getElementById('zout').onclick = () => centerZoom(1 / 1.2);
  pct.onclick = () => centerZoom(1 / cam.k);
  document.getElementById('fit').onclick = fitAll;
  document.getElementById('reset').onclick = () => {
    state = Object.create(null);
    noteOpen.clear();
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
})();

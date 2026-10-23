(() => {
  const { showErrors, el, copyText, create } = globalThis.CanvasCore;
  const R = globalThis.RadialLayout;
  const L = globalThis.LanesLayout;
  const $ = (id) => document.getElementById(id);

  const STATE_WORD = {
    now: 'Take now',
    redo: 'Redo',
    claimed: 'In progress',
    blocked: 'Waiting in the fog',
    decided: 'Decided',
    oos: 'Out of scope',
  };
  const WIDE = 900;
  const ROW = 40;
  const LW = 20;
  const TX = 38;

  /** Builds an HTML element with a class and text (set through textContent), appended to `parent` when given. */
  function h(tag, cls, text, parent) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    if (parent) parent.appendChild(node);
    return node;
  }

  /** Builds an SVG text element holding `value`. */
  function svgText(cls, value, attrs, parent) {
    const node = el('text', { class: cls, ...attrs }, parent);
    node.textContent = value;
    return node;
  }

  const initials = (name) =>
    String(name ?? '')
      .split(/[^A-Za-z0-9]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('') || '?';

  /** CSS stroke/fill for a layout line; grey out-of-scope lines use the state token. */
  function laneColour(line) {
    if (line.oos) return 'var(--s-oos)';
    return `var(--lane-${line.palette % 12})`;
  }

  let data;
  try {
    data = JSON.parse($('map-data').textContent);
  } catch (error) {
    showErrors([`The map data is not valid JSON: ${error.message}`]);
    return;
  }
  if (Array.isArray(data?.errors) && data.errors.length) {
    showErrors(data.errors.map(String));
    return;
  }

  const model = R.model(data, { now: Date.now() });
  if (!model.tickets.length && !model.fog.length) {
    showErrors(['This canvas has no tickets and no fog patches, so there is nothing to draw.']);
    return;
  }
  const laid = L.layout(model);
  const lineById = new Map(laid.lines.map((line) => [line.id, line]));
  const hasFog = model.fog.length > 0;

  const svg = $('canvas');
  const world = $('world');
  const panel = $('panel');
  const statusEl = $('status');
  const feedbackPanel = $('feedback-panel');
  const feedbackBox = $('feedback');
  const wide = () => window.innerWidth >= WIDE;

  const core = create({
    svg,
    world,
    stage: $('stage'),
    pct: $('pct'),
    reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  });

  document.title = model.title ? `${model.title} — wayfinder` : 'Wayfinder canvas';
  $('title').textContent = model.title;
  $('destination').textContent = model.destination;
  for (const item of model.header) {
    h('span', `chip ${item.key}`, `${item.count} ${item.label}`, $('counts'));
  }

  const laneOf = Object.fromEntries(laid.lines.map((line) => [line.id, line.lane]));
  const lanes = Math.max(...Object.values(laneOf), 0) + 1;
  const LX = (lane) => 30 + lane * LW;
  const Yr = (id) => laid.rowOf[id] * ROW;
  const pos = (id, lineId) => {
    const line = lineById.get(lineId);
    const lane = id === 'S' || id === 'D' ? laneOf[lineId] : laneOf[laid.lineOf[id]];
    return [LX(lane), Yr(id)];
  };
  const textX = LX(lanes) + 16;
  const rowW = textX + 580;

  const ruleLayer = el('g', {}, world);
  const lineLayer = el('g', {}, world);
  const termLayer = el('g', {}, world);
  const nodeLayer = el('g', {}, world);
  const edgeEls = [];
  const nodeEls = new Map();

  function lineEl(e, d) {
    const line = lineById.get(e.lineId);
    const todo = e.track !== 'solid';
    const cls = `ln${e.kind === 'cross' ? ' cross' : ''}${line.oos || e.track === 'dotted' ? ' oos' : todo ? ' todo' : ''}`;
    const p = el('path', { class: cls, d, stroke: laneColour(line) }, lineLayer);
    edgeEls.push({ e, p });
  }

  /** Draws the state marker of a ticket at the origin of `g`. */
  function marker(g, t, lineColour, interchange) {
    const r = 6;
    if (t.state === 'now') {
      el('circle', { class: 'pulse', r: r + 1 }, g);
      el('circle', { r, fill: 'var(--card)', stroke: 'var(--s-open)', 'stroke-width': 3 }, g);
    } else if (t.state === 'claimed') {
      el('circle', { r, fill: 'var(--s-claimed)', stroke: t.stale ? 'var(--s-stale)' : 'var(--card)', 'stroke-width': t.stale ? 3 : 2 }, g);
      const b = r * 0.95;
      el('circle', { cx: b, cy: -b, r: 7, fill: t.stale ? 'var(--s-stale)' : 'var(--ink)' }, g);
      svgText('av', initials(t.claimed_by), { x: b, y: -b + 2.4, 'text-anchor': 'middle' }, g);
    } else if (t.state === 'blocked') {
      el('circle', { r: r - 1, fill: 'var(--card)', stroke: 'var(--muted)', 'stroke-width': 2, 'stroke-dasharray': '3 3' }, g);
    } else if (t.state === 'redo') {
      el('circle', { r, fill: 'var(--card)', stroke: 'var(--s-under)', 'stroke-width': 2.2, 'stroke-dasharray': '3.5 2.5' }, g);
    } else if (t.state === 'oos') {
      el('circle', { r: r - 2, fill: 'var(--card)', stroke: 'var(--s-oos)', 'stroke-width': 2 }, g);
      const s = (r - 2) * 0.7;
      el('line', { class: 'strike', x1: -s, y1: s, x2: s, y2: -s }, g);
    } else if (interchange) {
      el('circle', { r: r - 1, fill: 'var(--card)', stroke: 'var(--ink)', 'stroke-width': 2.5 }, g);
    } else {
      el('circle', { r: r - 2, fill: lineColour, stroke: 'var(--card)', 'stroke-width': 1.5 }, g);
    }
    el('circle', { class: 'focus-ring', r: r + 6 }, g);
  }

  function stationGroup(t, y) {
    const g = el(
      'g',
      {
        class: `node st s-${t.state}${t.stale ? ' stale' : ''}`,
        tabindex: 0,
        role: 'button',
        'aria-label': `${t.id} ${t.label}, ${STATE_WORD[t.state].toLowerCase()}${t.stale ? ', claim may be stale' : ''}`,
        transform: `translate(0 ${y})`,
      },
      nodeLayer,
    );
    nodeEls.set(t.id, g);
    return g;
  }

  const route = (e) => {
    const [x1, y1] = pos(e.from, e.lineId);
    const [x2, y2] = pos(e.to, e.lineId);
    if (Math.abs(x2 - x1) < 1) return `M${x1} ${y1}V${y2}`;
    if (e.kind === 'join') return `M${x1} ${y1}V${y2 - ROW}C${x1} ${y2 - ROW * 0.45} ${x2} ${y2 - ROW * 0.55} ${x2} ${y2}`;
    return `M${x1} ${y1}C${x1} ${y1 + ROW * 0.55} ${x2} ${y1 + ROW * 0.45} ${x2} ${y1 + ROW}V${y2}`;
  };

  const hbar = (id, lineList, key, cls, text) => {
    const xs = (lineList.length ? lineList : [{ id: -1 }]).map((l) => LX(laneOf[l.id] ?? 0));
    const y = Yr(id);
    el('rect', { class: cls, x: Math.min(...xs) - 8, y: y - 5, width: Math.max(...xs) - Math.min(...xs) + 16, height: 10, rx: 5 }, termLayer);
    const k = svgText('term-k', key, { x: textX, y: y + 4 }, termLayer);
    if (text) svgText('term-t', text, { x: textX + keyWidth(k, key) + 14, y: y + 4 }, termLayer);
  };

  // why: measured once at draw time; the web font only ever narrows the caps, so the gap can grow but never overlap.
  const keyWidth = (node, key) => Math.max(node.getComputedTextLength?.() ?? 0, key.length * 8.4);

  for (let i = 0; i < laid.rows.length - 1; i++) {
    const y = (i + 0.5) * ROW;
    el('line', { class: 'rule', x1: textX - 6, y1: y, x2: rowW + 4, y2: y }, ruleLayer);
  }

  if (hasFog) {
    const leafLines = laid.lines.filter((l) => l.end === 'destination');
    const xs = leafLines.map((l) => LX(laneOf[l.id]));
    const g = el('g', {}, lineLayer);
    el('rect', { class: 'fogband', x: Math.min(...xs) - 12, y: Yr('F') - 13, width: Math.max(...xs) - Math.min(...xs) + 24, height: 26, rx: 13 }, g);
    el('title', {}, g).textContent = `Not yet specified:\n${model.fog.map((f) => `• ${f.label}`).join('\n')}`;
    const fogKey = `FOG ×${model.fog.length}`;
    const k = svgText('term-k', fogKey, { x: textX, y: Yr('F') + 4 }, termLayer);
    svgText('lab patch', model.fog.map((f) => f.label).join(' · '), { x: textX + keyWidth(k, fogKey) + 14, y: Yr('F') + 4 }, termLayer);
  }
  for (const e of laid.edges) lineEl(e, route(e));
  for (const line of laid.lines) {
    if (line.end !== 'buffer') continue;
    const [x, y] = pos(line.tail, line.id);
    el('path', { d: `M${x} ${y}V${y + 14}M${x - 7} ${y + 14}H${x + 7}`, stroke: 'var(--s-oos)', 'stroke-width': 2.6, fill: 'none' }, lineLayer);
  }
  hbar('S', laid.lines.filter((l) => l.from === 'S'), 'START', 'term');
  hbar(
    'D',
    laid.lines.filter((l) => l.end === 'destination'),
    model.reached ? 'DESTINATION REACHED' : 'DESTINATION',
    model.reached ? 'term reached' : 'term',
    model.destination,
  );

  function rowLabels(g, t) {
    const extra =
      t.state === 'claimed' ? ` · ${t.claimed_by}` : t.state === 'blocked' ? ` · waits on ${t.waitsOn.join(', ')}` : '';
    const state = `${STATE_WORD[t.state]}${extra}`;
    const line = lineById.get(laid.lineOf[t.id]);
    el('rect', { class: 'l-box', x: textX, y: -8.5, width: 28, height: 17, rx: 3, stroke: laneColour(line) }, g);
    svgText('l-num', String(t.id), { x: textX + 14, y: 4, 'text-anchor': 'middle' }, g);
    if (wide()) {
      // invariant: the leader is drawn before the text, whose --ground stroke masks it under the glyphs.
      el('line', { class: 'l-lead', x1: textX + TX, y1: 4.5, x2: rowW - 10, y2: 4.5 }, g);
      svgText('l-title', t.label, { x: textX + TX, y: 5 }, g);
      svgText('l-state', state, { x: rowW - 10, y: 5, 'text-anchor': 'end' }, g);
    } else {
      svgText('l-title', t.label, { x: textX + TX, y: -2 }, g);
      svgText('l-state narrow', state, { x: textX + TX, y: 13 }, g);
    }
  }

  for (const id of laid.rows) {
    if (id === 'S' || id === 'F' || id === 'D') continue;
    const t = model.byId[id];
    const y = Yr(id);
    const g = stationGroup(t, y);
    el('rect', { class: 'row-bg', x: 4, y: -ROW / 2 + 2, width: rowW, height: ROW - 4 }, g);
    const line = lineById.get(laid.lineOf[id]);
    const m = el('g', { transform: `translate(${LX(laneOf[line.id])} 0)` }, g);
    marker(m, t, laneColour(line), laid.interchange.includes(id));
    rowLabels(g, t);
  }

  const fitBox = { x: 0, y: -40, w: rowW + 16, h: laid.rows.length * ROW + 40 };

  let hover = null;
  let focus = null;
  let selected = null;
  let statusTimer = 0;
  const current = () => hover ?? focus ?? selected;

  function say(message) {
    statusEl.textContent = message;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => {
      statusEl.textContent = '';
    }, 4000);
  }

  function refresh() {
    const id = current();
    const t = model.byId[id];
    const nodes = t ? new Set([id, ...t.blocked_by, ...t.dependents]) : new Set();
    svg.classList.toggle('dimmed', Boolean(t));
    for (const [key, g] of nodeEls) {
      g.classList.toggle('me', key === id);
      g.classList.toggle('rel', nodes.has(key));
    }
    for (const { e, p } of edgeEls) {
      const rel =
        Boolean(t) &&
        ((nodes.has(e.from) && nodes.has(e.to)) ||
          (nodes.has(e.from) && (e.to === 'D' || e.to === 'S')) ||
          (nodes.has(e.to) && (e.from === 'D' || e.from === 'S')));
      p.classList.toggle('rel', rel);
    }
  }

  function ticketRow(id, parent) {
    const ticket = model.byId[id];
    const row = h('button', 'p-row', undefined, parent);
    row.type = 'button';
    h('span', `pd ${ticket.state}`, undefined, row);
    h('span', 'p-rn', String(ticket.id), row);
    h('span', 'p-rt', ticket.label, row);
    h('span', 'p-rs', STATE_WORD[ticket.state], row);
    row.addEventListener('click', () => {
      open(id);
      panel.querySelector('.p-x')?.focus();
    });
    return row;
  }

  function ticketList(ids, parent) {
    ids.filter((tid) => model.byId[tid]).forEach((tid) => ticketRow(tid, parent));
  }

  function section(title, parent) {
    const s = h('section', '', undefined, parent);
    h('h3', '', title, s);
    return s;
  }

  function renderOverview() {
    const head = h('div', 'p-head', undefined, panel);
    const top = h('div', 'p-top', undefined, head);
    h('span', 'p-kind', model.reached ? 'Destination reached' : 'Overview', top);
    h('h2', '', 'On the frontier', head);
    const body = h('div', 'p-body', undefined, panel);
    if (model.reached) {
      const done = h('div', 'p-reached', undefined, body);
      done.textContent =
        'Every ticket is decided and no fog remains. Next step: run create-prd to turn these decisions into a PRD, or code-spec to freeze them into a spec.';
    }
    const items = R.frontierList(model);
    if (items.length) {
      ticketList(
        items.map((i) => i.id),
        section('Tickets a session can work on', body),
      );
    } else if (!model.reached) {
      h('p', 'p-empty', 'Nothing is on the frontier yet: every open ticket waits on a decision in the fog.', body);
    }
    h('div', 'keys', undefined, panel).textContent =
      'Tab walks the rows, Enter opens one, Esc closes it. Scroll to move down the lanes. Double-click fits the width.';
  }

  function renderTicket(id) {
    const t = model.byId[id];
    const head = h('div', `p-head ${t.state}`, undefined, panel);
    const top = h('div', 'p-top', undefined, head);
    h('span', 'p-num', String(t.id), top);
    h('span', 'p-kind', STATE_WORD[t.state], top);
    const x = h('button', 'p-x', '×', top);
    x.type = 'button';
    x.setAttribute('aria-label', 'Close');
    x.addEventListener('click', close);
    h('h2', '', t.label, head);
    if (t.state === 'claimed') h('div', 'p-state', `Claimed by ${t.claimed_by} at ${t.claimed_at}`, head);
    else if (t.state === 'blocked') h('div', 'p-state', `Waiting on ${t.waitsOn.join(', ')}`, head);

    const body = h('div', 'p-body', undefined, panel);
    if (t.state === 'redo') {
      const c = h('div', 'p-callout', undefined, body);
      c.textContent = `Its premise was broken by ${t.undermined_by.map((u) => `${u} ${model.byId[u]?.label ?? ''}`.trim()).join('; ')}. Re-resolve it in place.`;
    }
    if (t.stale) {
      h('div', 'p-callout stale', 'This claim is more than three days old. Confirm with the claimer before taking the ticket over.', body);
    }
    if (t.question) h('p', '', t.question, section('Question', body));
    if (t.gist) h('p', 'p-gist', t.gist, section('Gist', body));
    if (t.resolution) h('p', '', t.resolution, section('Resolution', body));
    if (t.blocked_by.length) ticketList(t.blocked_by, section('Depends on', body));
    if (t.dependents.length) ticketList(t.dependents, section('Unblocks', body));
    if (t.file) h('p', 'p-meta', `${model.dir}/${t.file}`, section('File', body));

    const foot = h('div', 'p-foot', undefined, panel);
    const label = h('label', '', 'Note for the agent (optional)', foot);
    const note = h('textarea', '', undefined, foot);
    note.id = 'note';
    label.setAttribute('for', 'note');
    const onFrontier = t.ring === 'frontier';
    const act = h('button', 'p-act', onFrontier ? 'Take this ticket' : 'Copy for agent', foot);
    act.type = 'button';
    act.addEventListener('click', async () => {
      const text = onFrontier ? R.handoff(model, id, note.value) : R.copyText(model, id, note.value);
      const ok = await copyText(text, { panel: feedbackPanel, box: feedbackBox });
      say(
        ok
          ? onFrontier
            ? `Copied the hand-off for ${id}. Paste it into your agent chat.`
            : `Copied the note for ${id}.`
          : 'Copy blocked: select the text in the box and copy it.',
      );
    });
    h('div', 'p-hint', onFrontier ? 'Copies a prompt for your agent chat.' : 'Copies a short note to paste to your agent.', foot);
  }

  function renderPanel() {
    panel.textContent = '';
    if (selected && model.byId[selected]) renderTicket(selected);
    else renderOverview();
  }

  function open(id) {
    selected = id;
    panel.classList.add('open');
    $('frontier-btn').setAttribute('aria-expanded', 'true');
    renderPanel();
    refresh();
  }

  function close() {
    selected = null;
    panel.classList.remove('open');
    $('frontier-btn').setAttribute('aria-expanded', 'false');
    renderPanel();
    refresh();
  }

  /** Fits content width under the header; zoom never exceeds 1. */
  function fitCam() {
    const strip = wide() ? panel.offsetWidth + 14 : 0;
    const header = $('top').getBoundingClientRect().bottom - svg.getBoundingClientRect().top + 16;
    const k = Math.min(1, (svg.clientWidth - strip - 48) / fitBox.w);
    return { k, x: 24 - fitBox.x * k, y: header - fitBox.y * k };
  }

  function place() {
    if (!svg.clientWidth || !svg.clientHeight) {
      requestAnimationFrame(place);
      return;
    }
    Object.assign(core.cam, fitCam());
    core.applyCam();
  }

  core.bindInput();

  for (const [id, g] of nodeEls) {
    g.addEventListener('pointerenter', () => {
      hover = id;
      refresh();
    });
    g.addEventListener('pointerleave', () => {
      if (hover === id) hover = null;
      refresh();
    });
    g.addEventListener('focus', () => {
      focus = id;
      refresh();
    });
    g.addEventListener('blur', () => {
      if (focus === id) focus = null;
      refresh();
    });
    g.addEventListener('click', () => {
      if (!core.moved) open(id);
    });
    g.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open(id);
      }
    });
  }

  svg.addEventListener('click', (e) => {
    if (!core.moved && !e.target.closest('.node')) close();
  });
  svg.addEventListener('dblclick', (e) => {
    if (e.target.closest('.node')) return;
    e.preventDefault();
    core.animateTo(fitCam());
  });

  $('zin').addEventListener('click', () => core.centerZoom(1.25));
  $('zout').addEventListener('click', () => core.centerZoom(0.8));
  $('pct').addEventListener('click', () => core.centerZoom(1 / core.cam.k));
  $('fit').addEventListener('click', () => core.animateTo(fitCam()));
  $('frontier-btn').addEventListener('click', () => {
    if (panel.classList.contains('open') && !selected) {
      close();
      return;
    }
    selected = null;
    panel.classList.add('open');
    $('frontier-btn').setAttribute('aria-expanded', 'true');
    renderPanel();
    refresh();
  });
  $('close-feedback').addEventListener('click', () => {
    feedbackPanel.hidden = true;
  });

  document.addEventListener('keydown', (e) => {
    if (e.target.closest?.('textarea, input')) {
      if (e.key === 'Escape') e.target.blur();
      return;
    }
    if (e.key === 'Escape') {
      if (!feedbackPanel.hidden) feedbackPanel.hidden = true;
      else close();
    }
  });

  // why: Tab follows document order, so rows are appended in layout row order.
  for (const id of laid.rows) {
    if (id === 'S' || id === 'F' || id === 'D') continue;
    const node = nodeEls.get(id);
    if (node) nodeLayer.appendChild(node);
  }

  window.addEventListener('resize', () => {
    for (const id of nodeEls.keys()) {
      const g = nodeEls.get(id);
      g.querySelectorAll('.l-box, .l-num, .l-lead, .l-title, .l-state').forEach((n) => n.remove());
      rowLabels(g, model.byId[id]);
    }
    place();
  });

  renderPanel();
  refresh();
  place();
})();

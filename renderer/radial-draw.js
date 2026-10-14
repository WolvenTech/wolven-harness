(() => {
  const { showErrors, el, copyText, create } = globalThis.CanvasCore;
  const R = globalThis.RadialLayout;
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
  const MAX_FIT_K = 1.25;

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

  /** Splits `text` into at most `maxLines` lines of about `width` characters, ending in an ellipsis when cut. */
  function wrap(text, width, maxLines) {
    const lines = [];
    let line = '';
    for (const word of String(text).split(/\s+/).filter(Boolean)) {
      if (line && `${line} ${word}`.length > width) {
        lines.push(line);
        line = word;
      } else line = line ? `${line} ${word}` : word;
    }
    if (line) lines.push(line);
    if (lines.length <= maxLines) return lines;
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = `${kept[maxLines - 1].slice(0, Math.max(1, width - 1))}…`;
    return kept;
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
  const placed = R.layout(model);
  const order = R.focusOrder(model, placed);
  const at = new Map(placed.tickets.map((t) => [t.id, t]));

  const svg = $('canvas');
  const world = $('world');
  const labelLayer = $('labels');
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

  /* ---- header ---- */
  document.title = model.title ? `${model.title} — wayfinder` : 'Wayfinder canvas';
  $('title').textContent = model.title;
  $('destination').textContent = model.destination;
  for (const item of model.header) {
    h('span', `chip ${item.key}`, `${item.count} ${item.label}`, $('counts'));
  }

  /* ---- world ---- */
  const { rings } = placed;
  const bands = el('g', {}, world);
  if (placed.hasOos) el('circle', { class: 'band band-oos', r: rings.outer }, bands);
  el('circle', { class: 'band band-decided', r: rings.decidedEdge }, bands);
  el('circle', { class: 'band band-frontier', r: rings.frontierEdge }, bands);
  el('circle', { class: 'band band-fog', r: rings.fogEdge }, bands);
  el('circle', { class: 'scope', r: rings.scope }, bands);
  svgText('ring-l', 'FOG', { x: 0, y: -(rings.fogEdge - 12), 'text-anchor': 'middle' }, bands);
  svgText('ring-l', 'FRONTIER', { x: 0, y: -(rings.frontierEdge - 12), 'text-anchor': 'middle' }, bands);
  svgText('ring-l', 'DECIDED', { x: 0, y: -(rings.decidedEdge - 12), 'text-anchor': 'middle' }, bands);
  svgText('ring-l', 'SCOPE', { x: 0, y: -(rings.scope + 6), 'text-anchor': 'middle' }, bands);
  if (placed.hasOos) svgText('ring-l', 'OUT OF SCOPE', { x: 0, y: -(rings.outer - 12), 'text-anchor': 'middle' }, bands);

  const dest = el('g', { class: model.reached ? 'dest reached' : 'dest' }, world);
  el('circle', { class: 'dest-disc', r: rings.destination }, dest);
  svgText('dest-k', model.reached ? 'DESTINATION REACHED' : 'DESTINATION', { x: 0, y: -34, 'text-anchor': 'middle' }, dest);
  wrap(model.destination, 21, 4).forEach((line, i) => {
    svgText('dest-t', line, { x: 0, y: -14 + i * 14, 'text-anchor': 'middle' }, dest);
  });
  if (model.reached) el('path', { class: 'dest-check', d: 'M-9 44 L-3 50 L9 37' }, dest);

  const underLayer = el('g', {}, world);
  const edgeLayer = el('g', {}, world);
  const patchLayer = el('g', {}, world);
  const nodeLayer = el('g', {}, world);

  /** The arc along the frontier ring from an undermined ticket to the angle of the ticket that broke it, then straight in to that ticket. */
  function underArc(from, to) {
    const turn = Math.atan2(Math.sin(to.angle - from.angle), Math.cos(to.angle - from.angle));
    const f = rings.frontier;
    const end = { x: Math.cos(to.angle) * f, y: Math.sin(to.angle) * f };
    const arc = Math.abs(turn) < 1e-6 ? '' : ` A ${f} ${f} 0 0 ${turn > 0 ? 1 : 0} ${end.x} ${end.y}`;
    return `M ${from.x} ${from.y}${arc} L ${to.x} ${to.y}`;
  }
  for (const t of model.tickets) {
    for (const u of t.undermined_by) {
      if (at.has(t.id) && at.has(u)) el('path', { class: 'underarc', d: underArc(at.get(t.id), at.get(u)) }, underLayer);
    }
  }

  /** The curve between two placed circles, pulled toward the destination so edges read as arcs. */
  function curve(p, q) {
    const cx = ((p.x + q.x) / 2) * 0.4;
    const cy = ((p.y + q.y) / 2) * 0.4;
    return `M ${p.x} ${p.y} Q ${cx} ${cy} ${q.x} ${q.y}`;
  }

  const patchEls = new Map();
  for (const p of placed.patches) {
    const g = el(
      'g',
      { class: 'fogp', tabindex: 0, role: 'img', 'aria-label': `Fog patch: ${p.label}`, transform: `translate(${p.x} ${p.y})` },
      patchLayer,
    );
    el('circle', { class: 'cloud', r: p.radius }, g);
    svgText('q', '?', { x: 0, y: 4, 'text-anchor': 'middle' }, g);
    g.addEventListener('pointerenter', () => g.classList.add('me'));
    g.addEventListener('pointerleave', () => g.classList.remove('me'));
    patchEls.set(p.index, g);
  }

  const nodeEls = new Map();
  for (const spot of placed.tickets) {
    const t = model.byId[spot.id];
    const cls = `node s-${t.state}${t.stale ? ' stale' : ''}`;
    const g = el(
      'g',
      {
        class: cls,
        tabindex: 0,
        role: 'button',
        'aria-label': `${t.id} ${t.label}, ${STATE_WORD[t.state].toLowerCase()}${t.stale ? ', claim may be stale' : ''}`,
        transform: `translate(${spot.x} ${spot.y})`,
      },
      nodeLayer,
    );
    if (t.state === 'now') el('circle', { class: 'halo pulse', r: spot.radius + 6 }, g);
    else if (t.state === 'claimed' || t.state === 'redo') el('circle', { class: 'halo', r: spot.radius + 5 }, g);
    el('circle', { class: 'dot', r: spot.radius }, g);
    el('circle', { class: 'focus-ring', r: spot.radius + 6 }, g);
    svgText('num', String(t.id), { x: 0, y: spot.radius < 10 ? 2.5 : 3.5, 'text-anchor': 'middle' }, g);
    if (t.state === 'oos') {
      const d = spot.radius * 0.7;
      el('line', { class: 'strike', x1: -d, y1: d, x2: d, y2: -d }, g);
    }
    if (t.state === 'claimed') {
      const b = spot.radius * 0.72;
      el('circle', { class: 'badge', cx: b, cy: -b, r: 7.5 }, g);
      svgText('av', initials(t.claimed_by), { x: b, y: -b + 2.4, 'text-anchor': 'middle' }, g);
    }
    nodeEls.set(t.id, g);
  }

  /* ---- interaction state ---- */
  let hover = null;
  let focus = null;
  let selected = null;
  let allLabels = false;
  let statusTimer = 0;

  const current = () => hover ?? focus ?? selected;

  function say(message) {
    statusEl.textContent = message;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => {
      statusEl.textContent = '';
    }, 4000);
  }

  function drawEdges(id) {
    edgeLayer.textContent = '';
    const t = model.byId[id];
    if (!t) return new Set();
    const rel = new Set([id]);
    const decided = (other) => model.byId[other]?.state === 'decided';
    for (const b of t.blocked_by) {
      if (!at.has(b)) continue;
      rel.add(b);
      el('path', { class: decided(b) ? 'edge in' : 'edge waits', d: curve(at.get(b), at.get(id)) }, edgeLayer);
    }
    for (const d of t.dependents) {
      if (!at.has(d)) continue;
      rel.add(d);
      el('path', { class: 'edge out', d: curve(at.get(id), at.get(d)) }, edgeLayer);
    }
    return rel;
  }

  function drawLabels() {
    labelLayer.textContent = '';
    const list = R.labels(model, placed, { k: core.cam.k, active: current(), all: allLabels });
    for (const c of list) {
      if (!c.shown) continue;
      const node = svgText(
        c.kind === 'patch' ? 'lab patch' : 'lab',
        c.text,
        { x: core.cam.x + c.x, y: core.cam.y + c.y + 11 },
        labelLayer,
      );
      node.setAttribute('data-key', c.key);
    }
  }

  function refresh() {
    const id = current();
    const rel = drawEdges(id);
    svg.classList.toggle('dimmed', Boolean(id));
    for (const [key, g] of nodeEls) {
      g.classList.toggle('me', key === id);
      g.classList.toggle('rel', rel.has(key));
    }
    drawLabels();
  }

  const baseApply = core.applyCam;
  core.applyCam = () => {
    baseApply();
    drawLabels();
  };

  /* ---- panel ---- */
  function ticketRow(id, parent) {
    const t = model.byId[id];
    const row = h('button', 'p-row', undefined, parent);
    row.type = 'button';
    h('span', `pd ${t.state}`, undefined, row);
    h('span', 'p-rn', String(t.id), row);
    h('span', 'p-rt', t.label, row);
    h('span', 'p-rs', STATE_WORD[t.state], row);
    row.addEventListener('click', () => {
      open(id);
      panel.querySelector('.p-x')?.focus();
    });
    return row;
  }

  function ticketList(ids, parent) {
    ids.filter((id) => model.byId[id]).forEach((id) => ticketRow(id, parent));
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
      const s = section('Tickets a session can work on', body);
      ticketList(
        items.map((i) => i.id),
        s,
      );
    } else if (!model.reached) {
      h('p', 'p-empty', 'Nothing is on the frontier yet: every open ticket waits on a decision in the fog.', body);
    }
    h('div', 'keys', undefined, panel).textContent = 'Tab walks the tickets, Enter opens one, Esc closes it. L shows every label. Double-click fits the map.';
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
      say(ok ? (onFrontier ? `Copied the hand-off for ${id}. Paste it into your agent chat.` : `Copied the note for ${id}.`) : 'Copy blocked: select the text in the box and copy it.');
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

  /* ---- camera ---- */
  /** The camera that fits the whole layout beside the side panel, widening the fitted box until the map clears the panel. */
  function fitCam() {
    const e = placed.extent;
    const box = { x: -e, y: -e, w: e * 2, h: e * 2 };
    const strip = wide() ? panel.offsetWidth + 14 : 0;
    let target = core.fitTarget(box, MAX_FIT_K);
    for (let i = 0; i < 3 && strip; i++) {
      target = core.fitTarget({ ...box, w: box.w + strip / target.k }, MAX_FIT_K);
    }
    return target;
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

  /* ---- events ---- */
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
    if (!core.moved && !e.target.closest('.node, .fogp')) close();
  });
  svg.addEventListener('dblclick', (e) => {
    if (e.target.closest('.node')) return;
    e.preventDefault();
    core.animateTo(fitCam());
  });

  const toggleLabels = () => {
    allLabels = !allLabels;
    $('all-labels').setAttribute('aria-pressed', String(allLabels));
    drawLabels();
  };
  $('all-labels').addEventListener('click', toggleLabels);
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
    } else if ((e.key === 'l' || e.key === 'L') && !e.metaKey && !e.ctrlKey && !e.altKey) toggleLabels();
  });

  // why: Tab follows document order, so the focusable groups are re-appended in focusOrder.
  for (const entry of order) {
    const node = entry.kind === 'patch' ? patchEls.get(entry.index) : nodeEls.get(entry.id);
    if (node) nodeLayer.appendChild(node);
  }

  renderPanel();
  refresh();
  place();
})();

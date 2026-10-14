// why: a classic script with no DOM and no modules, so the page inlines it and node:vm loads it unchanged.
(() => {
  const STALE_HOURS = 72;

  const HEADER = [
    ['now', 'take now'],
    ['redo', 'redo'],
    ['claimed', 'in progress'],
    ['blocked', 'waiting in the fog'],
    ['patches', 'fog patches'],
    ['decided', 'decided'],
    ['oos', 'out of scope'],
  ];

  const RING_OF = { now: 'frontier', redo: 'frontier', claimed: 'frontier', blocked: 'fog', decided: 'decided', oos: 'oos' };

  /** Circle radius of a ticket by ring, and the least distance between two circle centres on one ring. */
  const TICKET_RADIUS = { frontier: 15, fog: 11, decided: 11, oos: 8 };
  const PATCH_RADIUS = 20;
  const MIN_DISTANCE = { frontier: 60, fog: 50, decided: 36, oos: 40, patch: 110 };
  const DESTINATION_RADIUS = 66;
  // invariant: every spacing is scaled by this so rounding the output to two decimals never closes a gap.
  const SLACK = 1.001;

  const list = (value) => (Array.isArray(value) ? value : []);

  const ticketsOf = (canvas) => list(canvas?.trees).flatMap((tree) => list(tree?.nodes).filter((node) => node?.kind === 'ticket'));

  /**
   * Derives what the canvas draws from a canvas JSON. A ticket's `state` is `now`, `redo`, `claimed`,
   * `blocked`, `decided` or `oos`; it is never stored. `frontier` holds the ids a session may take now
   * (open with every blocker decided, plus every undermined ticket); `ring` holds the ids drawn on the
   * frontier ring, which also carries every claimed ticket. A blocker only counts when it is `closed`
   * and not undermined, so an undermined blocker keeps its open dependents off the frontier.
   * `opts.now` (milliseconds) lets a claim report `stale`; without it nothing is stale.
   */
  function model(canvas, opts = {}) {
    const tickets = ticketsOf(canvas).map((node) => ({
      ...node,
      blocked_by: list(node.blocked_by),
      undermined_by: list(node.undermined_by),
    }));
    const byId = {};
    for (const ticket of tickets) byId[ticket.id] = ticket;
    const decidedId = (id) => byId[id]?.status === 'closed' && list(byId[id].undermined_by).length === 0;

    for (const ticket of tickets) {
      const undermined = ticket.undermined_by.length > 0;
      ticket.waitsOn = ticket.blocked_by.filter((id) => !decidedId(id));
      if (ticket.status === 'out_of_scope') ticket.state = 'oos';
      else if (ticket.status === 'claimed') ticket.state = 'claimed';
      else if (ticket.status === 'closed') ticket.state = undermined ? 'redo' : 'decided';
      else ticket.state = ticket.waitsOn.length ? 'blocked' : 'now';
      ticket.ring = RING_OF[ticket.state];
      ticket.dependents = tickets.filter((other) => other.blocked_by.includes(ticket.id)).map((other) => other.id);
      const claimedMs = Date.parse(ticket.claimed_at);
      ticket.stale =
        ticket.state === 'claimed' && typeof opts.now === 'number' && !Number.isNaN(claimedMs)
          ? (opts.now - claimedMs) / 36e5 > STALE_HOURS
          : false;
    }

    const fog = list(canvas?.fog).map((patch) => ({ label: String(patch?.label ?? '') }));
    const counts = { now: 0, redo: 0, claimed: 0, blocked: 0, patches: fog.length, decided: 0, oos: 0 };
    for (const ticket of tickets) counts[ticket.state] += 1;

    return {
      title: canvas?.title ?? '',
      destination: canvas?.destination ?? '',
      dir: canvas?.dir ?? '',
      tickets,
      byId,
      fog,
      counts,
      header: HEADER.filter(([key]) => counts[key] > 0).map(([key, label]) => ({ key, label, count: counts[key] })),
      frontier: tickets.filter((t) => t.state === 'now' || t.state === 'redo' || t.undermined_by.length > 0).map((t) => t.id),
      ring: tickets.filter((t) => t.ring === 'frontier').map((t) => t.id),
      reached: counts.now + counts.redo + counts.claimed + counts.blocked + counts.patches === 0,
    };
  }

  /** Radius at which `count` points sit `distance` apart on a circle (the smallest ring that holds them). */
  const ringFor = (count, distance) => (count < 2 ? 0 : (distance * SLACK) / (2 * Math.sin(Math.PI / count)));

  /**
   * Gives sorted angles at least `need` radians between neighbours, moving each as little as the order
   * allows (pool-adjacent-violators on the angles minus their rank times `need`). When the gap from the
   * last to the first across the seam is still short, the ring is spaced evenly instead.
   */
  function spread(angles, need) {
    const n = angles.length;
    const blocks = [];
    angles.forEach((angle, i) => {
      blocks.push({ sum: angle - i * need, count: 1 });
      while (blocks.length > 1) {
        const last = blocks[blocks.length - 1];
        const prev = blocks[blocks.length - 2];
        if (prev.sum / prev.count <= last.sum / last.count) break;
        blocks.splice(-2, 2, { sum: prev.sum + last.sum, count: prev.count + last.count });
      }
    });
    const out = [];
    for (const block of blocks) for (let k = 0; k < block.count; k++) out.push(block.sum / block.count + out.length * need);
    const wraps = n < 2 || out[n - 1] + need <= out[0] + Math.PI * 2 + 1e-9;
    return wraps ? out : angles.map((_, i) => -Math.PI / 2 + (i / n) * Math.PI * 2);
  }

  const byIdOrder = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

  const round = (value) => Math.round(value * 100) / 100;

  /**
   * Places a model (or a canvas, which it first runs through `model`) on concentric rings around the
   * destination at the origin, from the inside out: the fog patches and blocked tickets, the frontier
   * ring, the decided ring, a dashed scope ring, then the out-of-scope tickets. Within a ring the
   * order around the circle follows a depth-first walk along `blocked_by` from the root tickets, so a
   * chain shares a sector, and neighbours are kept apart so no two circles overlap. The result is
   * deterministic: `rings` (radii of each band edge), `tickets` and `patches` (centre `x`, `y`, `angle`,
   * polar `dist` and circle `radius`), and `extent`, the radius that holds everything.
   */
  function layout(input) {
    const m = input && input.counts && input.byId ? input : model(input);
    const order = [];
    const seen = new Set();
    const visit = (ticket) => {
      if (seen.has(ticket.id)) return;
      seen.add(ticket.id);
      order.push(ticket);
      ticket.dependents.map((id) => m.byId[id]).sort(byIdOrder).forEach(visit);
    };
    m.tickets
      .filter((t) => t.blocked_by.length === 0)
      .sort(byIdOrder)
      .forEach(visit);
    [...m.tickets].sort(byIdOrder).forEach(visit);
    const want = new Map(order.map((t, i) => [t.id, -Math.PI / 2 + ((i + 0.5) / order.length) * Math.PI * 2]));

    const inRing = (ring) => m.tickets.filter((t) => t.ring === ring);
    const patch = Math.max(DESTINATION_RADIUS + 56, ringFor(m.fog.length, MIN_DISTANCE.patch));
    const fog = Math.max(patch + 74, ringFor(inRing('fog').length, MIN_DISTANCE.fog));
    const fogEdge = fog + 46;
    const frontier = Math.max(fogEdge + 90, ringFor(inRing('frontier').length, MIN_DISTANCE.frontier));
    const frontierEdge = frontier + 86;
    const decided = Math.max(frontierEdge + 46, ringFor(inRing('decided').length, MIN_DISTANCE.decided));
    const decidedEdge = decided + 48;
    const scope = decidedEdge + 30;
    const oos = Math.max(scope + 40, ringFor(inRing('oos').length, MIN_DISTANCE.oos));
    const hasOos = inRing('oos').length > 0;
    const outer = oos + 28;
    const rings = {
      destination: DESTINATION_RADIUS,
      patch,
      fog,
      fogEdge,
      frontier,
      frontierEdge,
      decided,
      decidedEdge,
      scope,
      oos,
      outer,
    };

    const placed = (items, dist, distance) => {
      const sorted = [...items].sort((a, b) => a.angle - b.angle || a.order - b.order);
      const need = dist > 0 ? 2 * Math.asin(Math.min(1, (distance * SLACK) / (2 * dist))) : 0;
      const angles = spread(
        sorted.map((item) => item.angle),
        need,
      );
      return sorted.map((item, i) => ({
        ...item,
        angle: angles[i],
        dist,
        x: round(Math.cos(angles[i]) * dist),
        y: round(Math.sin(angles[i]) * dist),
      }));
    };

    const tickets = [];
    for (const ring of ['frontier', 'fog', 'decided', 'oos']) {
      const dist = { frontier, fog, decided, oos }[ring];
      const items = inRing(ring).map((t) => ({ id: t.id, state: t.state, ring, radius: TICKET_RADIUS[ring], angle: want.get(t.id), order: Number(t.id) }));
      tickets.push(...placed(items, dist, MIN_DISTANCE[ring]));
    }
    const patches = placed(
      m.fog.map((p, i) => ({
        index: i,
        label: p.label,
        radius: PATCH_RADIUS,
        angle: -Math.PI / 2 + ((i + 0.5) / m.fog.length) * Math.PI * 2,
        order: i,
      })),
      patch,
      MIN_DISTANCE.patch,
    );

    return {
      rings,
      hasOos,
      extent: hasOos ? outer : decidedEdge + 30,
      tickets: tickets.map(({ order: _order, ...t }) => t).sort((a, b) => (a.id < b.id ? -1 : 1)),
      patches: patches.map(({ order: _order, ...p }) => p).sort((a, b) => a.index - b.index),
    };
  }

  /** Width budget of one label character and the height of a label box, in screen pixels. */
  const LABEL_CHAR_W = 6.5;
  const LABEL_H = 14;
  const LABEL_GAP = 4;
  const FIT_MARGIN = 0.92;

  const boxesOverlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

  /** Zoom at which the whole layout (`extent`) fits a viewport `{ width, height }` with a small margin. */
  function fitZoom(placed, viewport) {
    const half = Math.min(viewport.width, viewport.height) / 2;
    return placed.extent > 0 ? (half * FIT_MARGIN) / placed.extent : 1;
  }

  /**
   * Decides which labels show at zoom `k`. A label box is its character count times a fixed width budget,
   * centred under its circle, in screen pixels around the destination, so the boxes do not scale with `k`
   * while the circles' positions do. Candidates are taken in priority order: the `active` (hovered or
   * focused) ticket, then frontier-ring tickets by id, then fog patches by index, then, only when
   * `opts.all` is set, the rest by id. A candidate is hidden only when it overlaps a label already shown.
   * Returns every candidate as `{ key, kind, id | index, text, default, shown, x, y, w, h }`.
   */
  function labels(m, placed, opts = {}) {
    const k = opts.k ?? 1;
    const at = new Map(placed.tickets.map((t) => [t.id, t]));
    const candidate = (kind, id, index, text, spot, isDefault) => ({
      key: kind === 'patch' ? `patch:${index}` : `ticket:${id}`,
      kind,
      ...(kind === 'patch' ? { index } : { id }),
      text,
      default: isDefault,
      x: spot.x * k - (text.length * LABEL_CHAR_W) / 2,
      y: spot.y * k + spot.radius + LABEL_GAP,
      w: text.length * LABEL_CHAR_W,
      h: LABEL_H,
    });
    const ticketCandidate = (t) => candidate('ticket', t.id, undefined, `${t.id} ${t.label}`, at.get(t.id), t.ring === 'frontier');
    const byId = [...m.tickets].sort(byIdOrder);
    const active = opts.active ? m.byId[opts.active] : undefined;
    const ordered = [
      ...(active ? [ticketCandidate(active)] : []),
      ...byId.filter((t) => t.ring === 'frontier').map(ticketCandidate),
      ...placed.patches.map((p) => candidate('patch', undefined, p.index, p.label, p, true)),
      ...(opts.all ? byId.filter((t) => t.ring !== 'frontier').map(ticketCandidate) : []),
    ];
    const seenKeys = new Set();
    const shown = [];
    const out = [];
    for (const c of ordered) {
      if (seenKeys.has(c.key)) continue;
      seenKeys.add(c.key);
      c.shown = !shown.some((other) => boxesOverlap(c, other));
      if (c.shown) shown.push(c);
      out.push(c);
    }
    return out;
  }

  /**
   * The Tab order as `{ kind, id | index }` entries: the frontier ring, then the fog (its patches, then
   * the blocked tickets), the decided ring, then the out-of-scope tickets. Within a ring the order is
   * clockwise from the top, ties by id.
   */
  function focusOrder(m, placed) {
    const turn = (angle) => (((angle + Math.PI / 2) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const ring = (name) =>
      placed.tickets
        .filter((t) => t.ring === name)
        .sort((a, b) => turn(a.angle) - turn(b.angle) || byIdOrder(a, b))
        .map((t) => ({ kind: 'ticket', id: t.id }));
    const patches = [...placed.patches].sort((a, b) => turn(a.angle) - turn(b.angle) || a.index - b.index);
    return [
      ...ring('frontier'),
      ...patches.map((p) => ({ kind: 'patch', index: p.index })),
      ...ring('fog'),
      ...ring('decided'),
      ...ring('oos'),
    ];
  }

  /** The panel's "On the frontier" list: every ticket drawn on the frontier ring, by id, as `{ id, title, state }`. */
  function frontierList(m) {
    return [...m.ring]
      .sort()
      .map((id) => ({ id, title: m.byId[id].label, state: m.byId[id].state }));
  }

  const path = (m, t) => `${m.dir}/${t.file}`;
  const lineOf = (m, t) => (t.gist ? `${path(m, t)} \u2014 ${t.label} \u2014 ${t.gist}` : `${path(m, t)} \u2014 ${t.label}`);
  const noteLine = (note) => (typeof note === 'string' && note.trim() ? ['', `Note from the Human: ${note.trim()}`] : []);

  /** The "Take this ticket" text for ticket `id`, or an empty string when the id is unknown. */
  function handoff(m, id, note) {
    const t = m.byId[id];
    if (!t) return '';
    const lead =
      t.state === 'redo'
        ? `re-resolve ticket ${t.id} in place`
        : t.state === 'claimed'
          ? `take ticket ${t.id}, which ${t.claimed_by} claimed at ${t.claimed_at}; confirm with me before taking it over`
          : `take ticket ${t.id}`;
    const lines = [
      `Use the wayfinder skill to ${lead} on ${m.dir}/.`,
      '',
      `Ticket: ${path(m, t)} \u2014 ${t.label} (${t.ticket})`,
      `Destination: ${m.destination}`,
      `Question: ${t.question}`,
      ...t.undermined_by.map((u) => `Premise broken by: ${lineOf(m, m.byId[u])}`),
      ...(t.blocked_by.length ? ['Decided blockers:', ...t.blocked_by.map((b) => `- ${lineOf(m, m.byId[b])}`)] : []),
      ...(t.dependents.length ? [`Unblocks: ${t.dependents.map((d) => `${d} ${m.byId[d].label}`).join('; ')}`] : []),
      ...noteLine(note),
    ];
    return lines.join('\n');
  }

  const STATE_WORD = { blocked: 'blocked', decided: 'decided', oos: 'out of scope' };

  /** The "Copy for agent" text for ticket `id`, or an empty string when the id is unknown. */
  function copyText(m, id, note) {
    const t = m.byId[id];
    if (!t) return '';
    const lines = [
      `wayfinder feedback for ${m.dir}/`,
      `Ticket: ${path(m, t)} \u2014 ${t.label} (${t.ticket}), ${STATE_WORD[t.state] ?? t.state}`,
      ...noteLine(note).slice(1),
    ];
    return lines.join('\n');
  }

  globalThis.RadialLayout = { model, layout, fitZoom, labels, focusOrder, frontierList, handoff, copyText };
})();

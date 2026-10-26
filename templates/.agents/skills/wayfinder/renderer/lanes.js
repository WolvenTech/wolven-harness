// why: a classic script with no DOM and no modules, so the page inlines it and node:vm loads it unchanged.
(() => {
  const SOLID = new Set(['decided', 'now', 'claimed', 'redo']);

  /** @param {ReturnType<typeof RadialLayout.model>} model */
  function layout(model) {
    const { byId } = model;
    const depth = {};
    const d = (id) => {
      if (depth[id] === undefined) {
        const bs = byId[id].blocked_by.filter((b) => byId[b]);
        depth[id] = bs.length ? 1 + Math.max(...bs.map(d)) : 1;
      }
      return depth[id];
    };
    for (const t of model.tickets) d(t.id);

    const ticketOrder = [...model.tickets].sort(
      (a, b) => depth[a.id] - depth[b.id] || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    );

    const hasFog = model.fog.length > 0;
    const rows = ['S', ...ticketOrder.map((t) => t.id), ...(hasFog ? ['F'] : []), 'D'];
    const rowOf = Object.fromEntries(rows.map((id, i) => [id, i]));

    const lines = [];
    const lineOf = {};
    const edges = [];
    let paletteIndex = 0;

    const trackInto = (to) => {
      if (to === 'D') return model.reached ? 'solid' : 'dashed';
      const t = byId[to];
      return t && SOLID.has(t.state) ? 'solid' : 'dashed';
    };

    for (const t of ticketOrder) {
      const bs = t.blocked_by
        .filter((b) => byId[b])
        .sort((a, b) => depth[b] - depth[a] || (a < b ? -1 : a > b ? 1 : 0));
      const primary = bs[0];
      const oos = t.state === 'oos';
      let line;
      if (primary && !oos && lineOf[primary] && !lineOf[primary].oos && lineOf[primary].tail === primary) {
        line = lineOf[primary];
        edges.push({ from: primary, to: t.id, lineId: line.id, kind: 'run', track: line.oos ? 'dotted' : trackInto(t.id) });
      } else {
        const slot = oos ? 'grey' : paletteIndex++ % 12;
        line = {
          id: lines.length,
          from: primary ?? 'S',
          stations: [],
          tail: null,
          end: null,
          oos,
          palette: slot,
          lane: 0,
          startRow: rowOf[primary ?? 'S'],
          endRow: 0,
        };
        lines.push(line);
        edges.push({
          from: primary ?? 'S',
          to: t.id,
          lineId: line.id,
          kind: primary ? 'fork' : 'root',
          track: oos ? 'dotted' : trackInto(t.id),
        });
      }
      line.stations.push(t.id);
      line.tail = t.id;
      lineOf[t.id] = line;
      for (const b of bs.slice(1)) {
        const other = lineOf[b];
        if (other && other.tail === b && !other.oos) {
          other.tail = null;
          other.end = t.id;
          edges.push({ from: b, to: t.id, lineId: other.id, kind: 'join', track: other.oos ? 'dotted' : trackInto(t.id) });
        } else {
          edges.push({ from: b, to: t.id, lineId: line.id, kind: 'cross', track: line.oos ? 'dotted' : trackInto(t.id) });
        }
      }
    }

    for (const line of lines) {
      if (line.tail === null) continue;
      if (line.oos) {
        line.end = 'buffer';
        line.endRow = rowOf[line.tail];
      } else {
        line.end = 'destination';
        line.endRow = rowOf.D;
        edges.push({
          from: line.tail,
          to: 'D',
          lineId: line.id,
          kind: 'leaf',
          track: model.reached ? 'solid' : 'dashed',
        });
      }
    }

    const spanEnd = (line) => {
      if (line.end === 'destination') return rowOf.D;
      if (line.end === 'buffer') return rowOf[line.tail];
      return rowOf[line.end];
    };

    const spans = [...lines]
      .sort((a, b) => a.startRow - b.startRow || a.id - b.id)
      .map((line) => {
        const start = rowOf[line.from === 'S' ? 'S' : line.from];
        const end = spanEnd(line);
        line.startRow = start;
        line.endRow = end;
        return { id: line.id, start, end };
      });

    const laneAt = {};
    const slots = new Map();
    for (const span of spans) {
      for (let lane = 0; lane < 400; lane++) {
        const taken = slots.get(lane) ?? [];
        if (taken.some((o) => span.start < o.end && o.start < span.end)) continue;
        taken.push(span);
        slots.set(lane, taken);
        laneAt[span.id] = lane;
        break;
      }
    }
    for (const line of lines) line.lane = laneAt[line.id] ?? 0;

    const touching = {};
    for (const e of edges) {
      for (const id of [e.from, e.to]) {
        if (id === 'S' || id === 'D') continue;
        (touching[id] ??= new Set()).add(e.lineId);
      }
    }
    const interchange = Object.keys(touching).filter((id) => touching[id].size > 1);

    return {
      rows,
      rowOf,
      depth,
      lines,
      edges,
      lineOf: Object.fromEntries(Object.entries(lineOf).map(([id, line]) => [id, line.id])),
      interchange,
    };
  }

  globalThis.LanesLayout = { layout };
})();

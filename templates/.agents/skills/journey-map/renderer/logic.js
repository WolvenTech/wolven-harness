// why: a classic script with no DOM and no modules, so the page inlines it and node:vm loads it unchanged.
(() => {
  const KINDS = ['start', 'choice', 'checklist', 'text', 'waypoint', 'card', 'ticket'];
  const TICKET_TYPES = ['research', 'prototype', 'grilling', 'task'];
  const TICKET_STATUSES = ['open', 'claimed', 'closed'];

  const all = (map) => (map.trees || []).flatMap((tree) => tree.nodes || []);

  /** Ids a node leads to: each option of a choice, otherwise its single `next`. */
  const outgoing = (node) => {
    if (node.kind === 'choice') return (node.options || []).map((option) => option.next);
    return node.next ? [node.next] : [];
  };

  /**
   * Checks a map and returns one error string per problem. Every string starts
   * with `<nodeId>:` (or `<treeId>:` for a tree, `map:` for the whole map), so a
   * reader can find the bad node without searching.
   */
  function validate(map) {
    const errors = [];
    const nodes = all(map);
    const byId = new Map();
    const fail = (id, message) => errors.push(`${id || '(missing id)'}: ${message}`);

    if (map.version !== 1) errors.push('map: version must be 1');
    if (!Array.isArray(map.trees) || !map.trees.length) errors.push('map: trees must be a nonempty array');

    for (const node of nodes) {
      if (typeof node.id !== 'string' || !node.id) fail(node.id, 'missing id');
      if (byId.has(node.id)) fail(node.id, 'duplicate id');
      byId.set(node.id, node);
      if (!KINDS.includes(node.kind)) fail(node.id, `unknown kind ${node.kind}`);
      if (typeof node.label !== 'string' || !node.label.trim()) fail(node.id, 'missing label');
    }

    /**
     * Checks that `value` names a node. `ticketOnly` demands a ticket; `local`,
     * when given, is the set of ids in the source node's own tree.
     */
    const checkTarget = (id, field, value, { ticketOnly = false, local = null } = {}) => {
      const target = byId.get(value);
      if (!target) fail(id, `${field} target ${value} does not exist`);
      else if (ticketOnly && target.kind !== 'ticket') fail(id, `${field} target ${value} is not a ticket`);
      else if (local && !local.has(value)) fail(id, `${field} crosses trees; use links`);
    };

    /** Keys must be non-empty and unique; every entry needs a string label. */
    const checkKeyedEntries = (node, entries, noun) => {
      const keys = new Set();
      for (const entry of entries) {
        if (!entry.key || keys.has(entry.key)) fail(node.id, `missing or duplicate ${noun} key`);
        keys.add(entry.key);
        if (typeof entry.label !== 'string') fail(node.id, `missing ${noun} label`);
      }
      return keys;
    };

    const checkChoice = (node) => {
      if (!Array.isArray(node.options) || !node.options.length) fail(node.id, 'missing options');
      const keys = checkKeyedEntries(node, node.options || [], 'option');
      if (node.default !== undefined && !keys.has(node.default)) fail(node.id, 'default is not an option key');
    };

    const checkChecklist = (node, local) => {
      if (!Array.isArray(node.items)) fail(node.id, 'missing items');
      checkKeyedEntries(node, node.items || [], 'item');
      for (const item of node.items || []) {
        for (const gated of item.gates || []) {
          checkTarget(node.id, 'gates', gated, { local });
          if (byId.has(gated) && byId.get(gated).kind !== 'waypoint') {
            fail(node.id, `gates target ${gated} is not a waypoint`);
          }
        }
      }
    };

    const checkTicket = (node, local) => {
      if (!TICKET_TYPES.includes(node.ticket)) fail(node.id, `bad ticket ${node.ticket}`);
      if (!TICKET_STATUSES.includes(node.status)) fail(node.id, `bad status ${node.status}`);
      for (const blocker of node.blocked_by || []) {
        checkTarget(node.id, 'blocked_by', blocker, { ticketOnly: true, local });
      }
    };

    const checkNode = (node, local) => {
      if (['start', 'checklist'].includes(node.kind) && !node.next) fail(node.id, 'missing next');
      for (const next of outgoing(node)) checkTarget(node.id, 'next', next, { local });
      if (node.kind === 'choice') checkChoice(node);
      if (node.kind === 'checklist') checkChecklist(node, local);
      if (node.kind === 'waypoint' && typeof node.tag !== 'string') fail(node.id, 'missing tag');
      if (node.kind === 'card' && !Array.isArray(node.sections)) fail(node.id, 'missing sections');
      if (node.kind === 'ticket') checkTicket(node, local);
    };

    /** Depth-first walk over next/option/blocked_by edges inside one tree; reaching a node already on the path is a cycle. */
    const checkCycles = (treeNodes, local) => {
      const onPath = new Set();
      const done = new Set();
      const visit = (id) => {
        if (onPath.has(id)) {
          fail(id, 'cycle in tree');
          return;
        }
        if (done.has(id)) return;
        onPath.add(id);
        const node = byId.get(id);
        if (node) {
          const next = node.kind === 'ticket' ? node.blocked_by || [] : outgoing(node);
          for (const to of next) if (local.has(to)) visit(to);
        }
        onPath.delete(id);
        done.add(id);
      };
      for (const node of treeNodes) visit(node.id);
    };

    for (const tree of map.trees || []) {
      const treeNodes = tree.nodes || [];
      const local = new Set(treeNodes.map((node) => node.id));
      if (!treeNodes.length) fail(tree.id, 'empty tree');
      // why: a tree made only of tickets is a dependency board and has no start.
      const isFlow = treeNodes.some((node) => node.kind !== 'ticket');
      if (isFlow && treeNodes.filter((node) => node.kind === 'start').length !== 1) {
        fail(tree.id, 'tree requires exactly one start');
      }
      for (const node of treeNodes) checkNode(node, local);
      checkCycles(treeNodes, local);
    }

    for (const link of map.links || []) {
      checkTarget(link.from, 'link from', link.from);
      checkTarget(link.from, 'link to', link.to);
    }
    for (const annotation of map.annotations || []) checkTarget(annotation.id, 'annotation', annotation.target);

    return [...new Set(errors)];
  }

  /** Every edge the page draws: ticket dependencies (blocker to ticket), flow edges, then cross-tree links. */
  function edges(map) {
    const fromNodes = all(map).flatMap((node) => {
      if (node.kind === 'ticket') {
        return (node.blocked_by || []).map((from) => ({ from, to: node.id, dependency: true }));
      }
      return outgoing(node).map((to) => ({ from: node.id, to }));
    });
    return [...fromNodes, ...(map.links || []).map((link) => ({ ...link, link: true }))];
  }

  /** Splits text on newlines and wraps each paragraph at `width` characters, breaking words longer than a line. */
  function lines(text, width = 34) {
    const result = [];
    for (const paragraph of String(text || '').split('\n')) {
      let line = '';
      for (const word of paragraph.split(' ')) {
        for (let i = 0; i < word.length || i === 0; i += width) {
          const chunk = word.slice(i, i + width);
          if (line && `${line} ${chunk}`.length > width) {
            result.push(line);
            line = '';
          }
          line += (line ? ' ' : '') + chunk;
        }
      }
      result.push(line);
    }
    return result;
  }

  // invariant: draw.js places every row from this table, so a card's drawn height always equals its layout height.
  const M = {
    w: 300,
    pad: 20,
    col: 390,
    rowGap: 72,
    treeGap: 150,
    eyebrow: 26,
    title: 22,
    titleChars: 30,
    body: 19,
    bodyChars: 38,
    tag: 30,
    optLabel: 20,
    optChars: 28,
    optHint: 18,
    optHintChars: 34,
    optPill: 24,
    optPad: 12,
    optGap: 8,
    itemPad: 10,
    button: 50,
    input: 50,
    sectionHead: 24,
    sectionItem: 19,
    sectionChars: 36,
    ticketRow: 30,
  };

  /** Height of a label plus its optional hint, wrapped the way option and checklist rows are drawn. */
  const labelAndHint = (entry) =>
    lines(entry.label, M.optChars).length * M.optLabel +
    (entry.hint ? lines(entry.hint, M.optHintChars).length * M.optHint : 0);

  /** The ordered rows a node is drawn as, each `{ kind, h, ...extra }`; `height` sums them. */
  function rows(node) {
    const result = [];
    const add = (kind, h, extra = {}) => result.push({ kind, h, ...extra });

    if (node.kind === 'start') {
      add('title', lines(node.label, 24).length * 24 + 4, { chars: 24 });
      if (node.sub) add('sub', lines(node.sub, 30).length * M.body + 4, { chars: 30 });
      return result;
    }

    add('eyebrow', M.eyebrow);
    add('title', lines(node.label, M.titleChars).length * M.title + 6);
    if (node.sub) add('sub', lines(node.sub, M.bodyChars).length * M.body + 6);
    if (node.note) add('note', lines(node.note, M.bodyChars).length * M.body + 6);
    if (node.tag) add('tag', M.tag);

    if (node.kind === 'choice') {
      for (const option of node.options || []) {
        const pill = option.badge || node.default === option.key ? M.optPill : 0;
        add('option', 2 * M.optPad + labelAndHint(option) + pill + M.optGap, { key: option.key });
      }
    }
    if (node.kind === 'checklist') {
      for (const item of node.items || []) {
        add('item', 2 * M.itemPad + labelAndHint(item), { key: item.key });
      }
      add('continue', M.button);
    }
    if (node.kind === 'text') {
      add('input', M.input);
      add('continue', M.button);
    }
    if (node.kind === 'card') {
      for (const section of node.sections || []) {
        const itemsHeight = section.items.reduce(
          (h, item) => h + lines(item, M.sectionChars).length * M.sectionItem + 4,
          0,
        );
        add('section', lines(section.head, M.sectionChars).length * M.sectionHead + itemsHeight + 10, { section });
      }
    }
    if (node.kind === 'ticket') {
      add('status', M.ticketRow);
      if (node.claimed_by) add('claimed', M.ticketRow);
      if (node.blocked_by?.length) add('blocked', M.ticketRow);
    }
    return result;
  }

  /** A node's box height: its rows plus padding; a start node has a minimum. */
  function height(node) {
    const body = rows(node).reduce((h, row) => h + row.h, 0);
    return node.kind === 'start' ? Math.max(76, body + 2 * M.pad) : body + M.pad + 14;
  }

  /**
   * Column of each node in one tree, by longest path: a ticket sits one column
   * right of its deepest blocker; a flow node one right of its deepest parent.
   * Cycles are rejected by `validate`, so the ticket recursion terminates.
   */
  function columnDepths(treeNodes, byId, isTicketTree) {
    const depths = new Map();
    if (isTicketTree) {
      const depthOf = (id) => {
        if (depths.has(id)) return depths.get(id);
        const blockers = byId.get(id).blocked_by || [];
        const depth = blockers.length ? 1 + Math.max(...blockers.map(depthOf)) : 0;
        depths.set(id, depth);
        return depth;
      };
      for (const node of treeNodes) depthOf(node.id);
      return depths;
    }
    for (const node of treeNodes) depths.set(node.id, 0);
    // why: relaxing once per node bounds the passes for any acyclic tree, so no topological sort is needed.
    for (let pass = 0; pass < treeNodes.length; pass++) {
      for (const node of treeNodes) {
        for (const to of outgoing(node)) {
          depths.set(to, Math.max(depths.get(to) || 0, (depths.get(node.id) || 0) + 1));
        }
      }
    }
    return depths;
  }

  /** Ids in drawing order: a depth-first walk from the start (every ticket, for a ticket tree), then any unreachable node. */
  function drawOrder(treeNodes, byId, isTicketTree) {
    const order = [];
    const visited = new Set();
    const walk = (id) => {
      if (visited.has(id)) return;
      visited.add(id);
      const node = byId.get(id);
      if (!node) return;
      order.push(id);
      for (const to of outgoing(node)) walk(to);
    };
    if (isTicketTree) order.push(...treeNodes.map((node) => node.id));
    else walk(treeNodes.find((node) => node.kind === 'start').id);
    for (const node of treeNodes) if (!order.includes(node.id)) order.push(node.id);
    return order;
  }

  /**
   * Places every node: trees stack top to bottom, columns run left to right, and
   * each column is centred on its tree's midline. Returns `{ boxes, edges, width, height }`.
   */
  function layout(map) {
    const boxes = [];
    const byId = new Map(all(map).map((node) => [node.id, node]));
    let top = 110;

    for (const tree of map.trees) {
      const treeNodes = tree.nodes;
      const isTicketTree = treeNodes.every((node) => node.kind === 'ticket');
      const depths = columnDepths(treeNodes, byId, isTicketTree);
      const columns = new Map();
      drawOrder(treeNodes, byId, isTicketTree).forEach((id, index) => {
        const column = depths.get(id);
        if (!columns.has(column)) columns.set(column, []);
        columns.get(column).push({ id, index, h: height(byId.get(id)) });
      });

      const stackHeight = (list) => list.reduce((sum, b) => sum + b.h, 0) + M.rowGap * (list.length - 1);
      const tallest = Math.max(...[...columns.values()].map(stackHeight));
      const midline = top + tallest / 2;
      for (const [column, list] of columns) {
        let y = midline - stackHeight(list) / 2;
        for (const b of list) {
          boxes.push({ id: b.id, tree: tree.id, column, row: b.index, x: 60 + column * M.col, y, w: M.w, h: b.h });
          y += b.h + M.rowGap;
        }
      }
      top += tallest + M.treeGap;
    }
    return {
      boxes,
      edges: edges(map),
      width: Math.max(...boxes.map((b) => b.x + b.w)) + 60,
      height: top,
    };
  }

  /** True while any of the ticket's blockers is not closed. */
  function blocked(map, node) {
    const byId = new Map(all(map).map((n) => [n.id, n]));
    return (node.blocked_by || []).some((id) => byId.get(id)?.status !== 'closed');
  }

  /** Fill and stroke palette names for a ticket status; the three statuses never share a pair. */
  function ticketStyle(status) {
    return {
      open: { fill: 'yellow', stroke: 'ink' },
      claimed: { fill: 'blue', stroke: 'select' },
      closed: { fill: 'green', stroke: 'muted' },
    }[status];
  }

  const isTicketTree = (tree) => tree.nodes.every((node) => node.kind === 'ticket');
  const startOf = (tree) => tree.nodes.find((node) => node.kind === 'start');

  /**
   * Node ids shown before "show whole map". A flow tree stops at each
   * unanswered choice and at each checklist or text box not yet continued;
   * ticket trees always show in full.
   */
  function revealed(map, answers = {}) {
    const shown = new Set();
    for (const tree of map.trees) {
      if (isTicketTree(tree)) {
        for (const node of tree.nodes) shown.add(node.id);
        continue;
      }
      const byId = new Map(tree.nodes.map((node) => [node.id, node]));
      const walk = (id) => {
        const node = byId.get(id);
        if (!node || shown.has(id)) return;
        shown.add(id);
        const answer = answers[id] || {};
        if (node.kind === 'choice') {
          if (answer.choice !== undefined) walk(node.options.find((option) => option.key === answer.choice)?.next);
        } else if (node.kind === 'checklist' || node.kind === 'text') {
          if (answer.done) walk(node.next);
        } else if (node.next) {
          walk(node.next);
        }
      };
      walk(startOf(tree).id);
    }
    return shown;
  }

  /** Whether a checklist item counts as ticked: the answer wins, then the item's `on`, then true. */
  const isTicked = (item, answer) => (answer?.checks?.[item.key] ?? item.on ?? true) !== false;

  /**
   * Nodes to draw faded. `faded` holds nodes off the chosen path and waypoints
   * gated by an unticked checklist item; `later` holds only the gated ones, so
   * the page can label them "later" instead of "not taken".
   */
  function faded(map, answers = {}) {
    const fade = new Set();
    const later = new Set();
    for (const tree of map.trees) {
      if (isTicketTree(tree)) continue;
      const byId = new Map(tree.nodes.map((node) => [node.id, node]));
      const reachable = new Set();
      const walk = (id) => {
        const node = byId.get(id);
        if (!node || reachable.has(id)) return;
        reachable.add(id);
        const choice = answers[id]?.choice;
        const targets =
          node.kind === 'choice' && choice
            ? node.options.filter((option) => option.key === choice).map((option) => option.next)
            : outgoing(node);
        for (const to of targets) walk(to);
      };
      walk(startOf(tree).id);
      for (const node of tree.nodes) {
        if (!reachable.has(node.id)) fade.add(node.id);
        if (node.kind !== 'checklist') continue;
        for (const item of node.items) {
          if (isTicked(item, answers[node.id])) continue;
          for (const gated of item.gates || []) {
            fade.add(gated);
            later.add(gated);
          }
        }
      }
    }
    return { faded: fade, later };
  }

  /**
   * The "Copy for agent" text: a header, then one line per answer or note on
   * each touched node, in layout order. Labels and typed text are JSON-escaped.
   */
  function feedback(map, state, path) {
    const result = [`journey-map feedback for ${path}`];
    const byId = new Map(all(map).map((node) => [node.id, node]));
    for (const box of layout(map).boxes) {
      const node = byId.get(box.id);
      const answer = state[box.id];
      if (!answer) continue;
      const prefix = `${node.id} ${JSON.stringify(node.label)}: `;
      if (answer.choice !== undefined) {
        const option = node.options.find((o) => o.key === answer.choice);
        result.push(`${prefix}chose ${option.key} ${JSON.stringify(option.label)}`);
      }
      if (answer.checks !== undefined) {
        const ticked = node.items.filter((item) => isTicked(item, answer)).map((item) => item.key);
        const unticked = node.items.filter((item) => !isTicked(item, answer)).map((item) => item.key);
        result.push(`${prefix}ticked ${ticked.join(', ')}; unticked ${unticked.join(', ')}`);
      }
      if (answer.text !== undefined) result.push(`${prefix}typed ${JSON.stringify(answer.text)}`);
      if (answer.note !== undefined) result.push(`${prefix}note ${JSON.stringify(answer.note)}`);
    }
    return result.join('\n');
  }

  /**
   * Route of a cross-tree link as polyline points plus a label anchor. It leaves
   * the source's left edge into the column gutter, crosses to the target's
   * gutter along the gap between the two trees, and enters the target from the
   * left, so it never passes through a card. `plan` is the result of `layout`.
   */
  function linkRoute(plan, link) {
    const from = plan.boxes.find((b) => b.id === link.from);
    const to = plan.boxes.find((b) => b.id === link.to);
    const extent = (treeId) => {
      const own = plan.boxes.filter((b) => b.tree === treeId);
      return { top: Math.min(...own.map((b) => b.y)), bottom: Math.max(...own.map((b) => b.y + b.h)) };
    };
    const source = extent(from.tree);
    const target = extent(to.tree);
    let gapY;
    if (from.tree === to.tree) gapY = source.bottom + M.treeGap / 2;
    else if (to.y > from.y) gapY = (source.bottom + target.top) / 2;
    else gapY = (target.bottom + source.top) / 2;

    const startY = from.y + 30;
    const points = [
      [from.x, startY],
      [from.x - 30, startY],
      [from.x - 30, gapY],
      [to.x - 30, gapY],
      [to.x - 30, to.y + 30],
      [to.x - 6, to.y + 30],
    ];
    return { points, label: { x: to.x - 22, y: gapY - 26 } };
  }

  globalThis.JourneyMapLogic = { validate, linkRoute, revealed, faded, feedback, layout, edges, blocked, ticketStyle, lines, all, outgoing, rows, height, M };
})();

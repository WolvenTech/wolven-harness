// why: a classic script with no DOM and no modules, so the page inlines it and node:vm loads it unchanged.
(() => {
  const KINDS = ['start', 'choice', 'checklist', 'text', 'waypoint', 'card'];

  const JOURNEY_FIELDS = ['mood', 'thought', 'touchpoints', 'pains', 'opportunities'];

  const MOOD = [
    { value: -2, face: '\u{1F641}', name: 'Frustrated', color: '#dc2626', soft: '#fde4e4' },
    { value: -1, face: '\u{1F615}', name: 'Uneasy', color: '#ea7a1a', soft: '#fdeedd' },
    { value: 0, face: '\u{1F610}', name: 'Neutral', color: '#8b8fa3', soft: '#eceef3' },
    { value: 1, face: '\u{1F642}', name: 'Positive', color: '#65a30d', soft: '#ecf7d6' },
    { value: 2, face: '\u{1F603}', name: 'Delighted', color: '#12a150', soft: '#dcf5e7' },
  ];

  /** The MOOD entry for a node's `mood`, or null when it has none. */
  const moodOf = (node) => (node.mood === undefined ? null : MOOD[node.mood + 2]);

  /** A waypoint is a journey step on a map (or layout options) with a persona, or when it carries any journey field. */
  const isStep = (node, map) =>
    node.kind === 'waypoint' && (map?.persona !== undefined || JOURNEY_FIELDS.some((field) => node[field] !== undefined));

  const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
  const isList = Array.isArray;

  const all = (map) => (map.trees || []).flatMap((tree) => tree.nodes || []);

  /** Ids a node leads to: each option of a choice, otherwise its single `next`. */
  const outgoing = (node) => {
    if (node.kind === 'choice') return isList(node.options) ? node.options.filter(isRecord).map((option) => option.next) : [];
    return node.next ? [node.next] : [];
  };

  /**
   * Checks a map and returns one error string per problem. Every string starts
   * with `<nodeId>:` (or `<treeId>:` for a tree, `map:` for the whole map), so a
   * reader can find the bad node without searching.
   */
  function validate(map) {
    if (!isRecord(map)) return ['map: must be a JSON object'];
    const errors = [];
    // hazard: a shape this check did not foresee must still reach the error panel, not throw past it.
    try {
      checkMap(map, errors);
    } catch (error) {
      errors.push(`map: could not check the map (${error.message})`);
    }
    return [...new Set(errors)];
  }

  function checkMap(map, errors) {
    const byId = new Map();
    const fail = (id, message) => errors.push(`${id || '(missing id)'}: ${message}`);

    /** The object entries of a list; any other entry is named as an error and skipped. */
    const objects = (value, owner, noun) =>
      (isList(value) ? value : []).filter((entry, i) => {
        if (!isRecord(entry)) fail(owner, `${noun} ${i + 1} must be an object`);
        return isRecord(entry);
      });
    /** Like `objects`, and a value that is present but not a list is an error too. */
    const list = (value, owner, noun) => {
      if (value !== undefined && !isList(value)) fail(owner, `${noun}s must be a list`);
      return objects(value, owner, noun);
    };

    if (map.version !== 1) errors.push('map: version must be 1');
    if (!isList(map.trees) || !map.trees.length) errors.push('map: trees must be a nonempty array');

    const trees = objects(map.trees, 'map', 'tree');
    const treeIds = new Set();
    trees.forEach((tree) => {
      if (typeof tree.id !== 'string' || !tree.id) fail('map', `tree ${map.trees.indexOf(tree) + 1} has no id`);
      else if (treeIds.has(tree.id)) fail(tree.id, 'duplicate tree id');
      treeIds.add(tree.id);
    });
    const nodesOf = new Map(trees.map((tree) => [tree, list(tree.nodes, tree.id, 'node')]));
    const nodes = [...nodesOf.values()].flat();

    if (map.persona !== undefined && typeof map.persona?.name !== 'string') {
      errors.push('map: persona.name must be a string');
    }

    for (const node of nodes) {
      if (typeof node.id !== 'string' || !node.id) fail(node.id, 'missing id');
      if (byId.has(node.id)) fail(node.id, 'duplicate id');
      byId.set(node.id, node);
      if (!KINDS.includes(node.kind)) fail(node.id, `unknown kind ${node.kind}`);
      if (typeof node.label !== 'string' || !node.label.trim()) fail(node.id, 'missing label');
    }

    /** Checks that `value` names a node; `local`, when given, is the set of ids in the source node's own tree. */
    const checkTarget = (id, field, value, { local = null } = {}) => {
      const target = byId.get(value);
      if (!target) fail(id, `${field} target ${value} does not exist`);
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
      if (!isList(node.options) || !node.options.length) fail(node.id, 'missing options');
      const keys = checkKeyedEntries(node, objects(node.options, node.id, 'option'), 'option');
      if (node.default !== undefined && !keys.has(node.default)) fail(node.id, 'default is not an option key');
    };

    const checkChecklist = (node, local) => {
      if (!isList(node.items)) fail(node.id, 'missing items');
      const items = objects(node.items, node.id, 'item');
      checkKeyedEntries(node, items, 'item');
      for (const item of items) {
        if (item.gates !== undefined && (!isList(item.gates) || item.gates.some((id) => typeof id !== 'string'))) {
          fail(node.id, 'gates must be a list of waypoint ids');
          continue;
        }
        for (const gated of item.gates || []) {
          checkTarget(node.id, 'gates', gated, { local });
          if (byId.has(gated) && byId.get(gated).kind !== 'waypoint') {
            fail(node.id, `gates target ${gated} is not a waypoint`);
          }
        }
      }
    };

    /** Journey fields belong on a waypoint; each is checked for shape. */
    const checkJourney = (node) => {
      const present = JOURNEY_FIELDS.filter((field) => node[field] !== undefined);
      if (present.length && node.kind !== 'waypoint') fail(node.id, `${present.join(', ')} only on a waypoint`);
      if (node.mood !== undefined && (!Number.isInteger(node.mood) || node.mood < -2 || node.mood > 2)) {
        fail(node.id, `mood must be a whole number from -2 to 2 (got ${JSON.stringify(node.mood)})`);
      }
      if (node.thought !== undefined && typeof node.thought !== 'string') fail(node.id, 'thought must be a string');
      for (const field of ['touchpoints', 'pains', 'opportunities']) {
        const value = node[field];
        if (value !== undefined && (!Array.isArray(value) || value.some((item) => typeof item !== 'string'))) {
          fail(node.id, `${field} must be a list of strings`);
        }
      }
    };

    const checkSections = (node) => {
      if (!Array.isArray(node.sections)) return fail(node.id, 'missing sections');
      node.sections.forEach((section, i) => {
        const where = `section ${i + 1}`;
        if (section === null || typeof section !== 'object') return fail(node.id, `${where} must be an object`);
        if (typeof section.head !== 'string') fail(node.id, `${where} head must be a string`);
        if (!Array.isArray(section.items) || section.items.some((item) => typeof item !== 'string')) {
          fail(node.id, `${where} items must be an array of strings`);
        }
        if (section.numbered !== undefined && typeof section.numbered !== 'boolean') {
          fail(node.id, `${where} numbered must be a boolean`);
        }
      });
    };

    const checkNode = (node, local) => {
      checkJourney(node);
      if (['start', 'checklist'].includes(node.kind) && !node.next) fail(node.id, 'missing next');
      for (const next of outgoing(node)) checkTarget(node.id, 'next', next, { local });
      if (node.kind === 'choice') checkChoice(node);
      if (node.kind === 'checklist') checkChecklist(node, local);
      if (node.kind === 'waypoint' && typeof node.tag !== 'string') fail(node.id, 'missing tag');
      if (node.kind === 'card') checkSections(node);
      if (node.kind === 'card' && node.next !== undefined) fail(node.id, 'a card has no next');
    };

    /** Depth-first walk over next/option edges inside one tree; reaching a node already on the path is a cycle. */
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
          for (const to of outgoing(node)) if (local.has(to)) visit(to);
        }
        onPath.delete(id);
        done.add(id);
      };
      for (const node of treeNodes) visit(node.id);
    };

    for (const tree of trees) {
      const treeNodes = nodesOf.get(tree);
      const local = new Set(treeNodes.map((node) => node.id));
      if (!treeNodes.length) fail(tree.id, 'empty tree');
      if (treeNodes.filter((node) => node.kind === 'start').length !== 1) {
        fail(tree.id, 'tree requires exactly one start');
      }
      for (const node of treeNodes) checkNode(node, local);
      checkCycles(treeNodes, local);
    }

    for (const link of list(map.links, 'map', 'link')) {
      checkTarget(link.from, 'link from', link.from);
      checkTarget(link.from, 'link to', link.to);
    }
    const annotationIds = new Set();
    for (const annotation of list(map.annotations, 'map', 'annotation')) {
      const { id } = annotation;
      if (typeof id !== 'string' || !id) fail('map', `annotation ${map.annotations.indexOf(annotation) + 1} has no id`);
      else if (annotationIds.has(id)) fail(id, 'duplicate annotation id');
      annotationIds.add(id);
      if (typeof annotation.text !== 'string') fail(id, 'annotation text must be a string');
      checkTarget(id, 'annotation', annotation.target);
    }
  }

  /** Every edge the page draws: flow edges, then cross-tree links. */
  function edges(map) {
    const fromNodes = all(map).flatMap((node) => outgoing(node).map((to) => ({ from: node.id, to })));
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
    band: 22,
    dbar: 32,
    chipH: 22,
    chipTextChars: 36,
    chipTextLine: 15,
    chipChars: 260,
    cloudChars: 26,
    noteSlot: 48,
    annoChars: 32,
    annoLine: 22,
    personaNameChars: 20,
    personaName: 20,
    personaRoleChars: 26,
    personaRole: 18,
    eyebrowChars: 30,
  };

  /**
   * Greedy wrap of touchpoint chips into rows no wider than `width`, each chip `{ t, w, h, lines }`.
   * A chip whose text is longer than the row wraps its words across lines, so no chip is wider than the card.
   */
  function chipRows(items, width = M.chipChars) {
    const result = [[]];
    let used = 0;
    for (const t of items) {
      const wrapped = lines(t, M.chipTextChars);
      const w = Math.round(Math.max(...wrapped.map((line) => line.length)) * 6.6 + 20);
      const chip = { t, w, h: M.chipH + (wrapped.length - 1) * M.chipTextLine, lines: wrapped };
      if (used && used + w + 6 > width) {
        result.push([]);
        used = 0;
      }
      result[result.length - 1].push(chip);
      used += w + 6;
    }
    return result;
  }

  /** The height of each chip row: its tallest chip plus the row gap. */
  const chipRowHeights = (rowsOfChips) => rowsOfChips.map((row) => Math.max(...row.map((c) => c.h)) + 6);

  const stickyH = (items) => 22 + items.reduce((h, item) => h + lines(item, 30).length * M.body + 2, 0) + 20;

  /** Height of a label plus its optional hint, wrapped the way option and checklist rows are drawn. */
  const labelAndHint = (entry) =>
    lines(entry.label, M.optChars).length * M.optLabel +
    (entry.hint ? lines(entry.hint, M.optHintChars).length * M.optHint : 0);

  /** The rows of a plain node, each `{ kind, h, ...extra }`. */
  function baseRows(node) {
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
    return result;
  }

  /**
   * The rows of a journey step, each `{ zone, kind, h, ...extra }`. `opts.open` is the set
   * of expanded step ids. invariant: the cloud is a top row and the stickies are bottom rows, so
   * layout reserves both and no neighbour can be covered.
   */
  function stepRows(node, opts) {
    const result = [];
    const add = (zone, kind, h, extra = {}) => result.push({ zone, kind, h, ...extra });
    const touchpoints = node.touchpoints || [];
    const pains = node.pains || [];
    const opportunities = node.opportunities || [];
    const hasLists = touchpoints.length + pains.length + opportunities.length > 0;
    const isOpen = Boolean(opts.open?.has(node.id));

    if (node.thought) add('top', 'cloud', lines(node.thought, M.cloudChars).length * 22 + 24 + 14 + 38);
    add('card', 'band', M.band);
    add('card', 'eyebrow', M.eyebrow);
    add('card', 'title', lines(node.label, M.titleChars).length * M.title + 6);
    if (hasLists && !isOpen) add('card', 'dbar', M.dbar);
    if (isOpen && touchpoints.length) {
      add('card', 'chips', 24 + chipRowHeights(chipRows(touchpoints)).reduce((a, b) => a + b, 0) + 2, {
        items: touchpoints,
      });
    }
    if (isOpen && pains.length) add('bottom', 'sticky', stickyH(pains) + 8, { tone: 'pain', items: pains });
    if (isOpen && opportunities.length) {
      add('bottom', 'sticky', stickyH(opportunities) + 8, { tone: 'idea', items: opportunities });
    }
    return result;
  }

  /** The persona header rows that sit in the first tree's start node. */
  function personaRows(opts) {
    const { persona } = opts;
    const name = lines(persona.name, M.personaNameChars);
    const role = persona.role ? lines(persona.role, M.personaRoleChars) : [];
    const h = Math.max(54, 16 + name.length * M.personaName + role.length * M.personaRole);
    const result = [{ kind: 'pheader', h, name, role }];
    if (persona.goal) result.push({ kind: 'pgoal', h: 20 + lines(persona.goal, 34).length * M.body + 6 });
    if (opts.scenario) result.push({ kind: 'pscen', h: lines(opts.scenario, 36).length * M.body + 8 });
    return result;
  }

  /**
   * Options every layout and draw call shares: the persona header belongs to the
   * first tree's start, and `annotations` maps a target id to the annotations on it.
   */
  function ctx(map, extra = {}) {
    const first = map.trees?.[0]?.nodes?.find((node) => node.kind === 'start');
    const annotations = new Map();
    for (const annotation of map.annotations || []) {
      if (!annotations.has(annotation.target)) annotations.set(annotation.target, []);
      annotations.get(annotation.target).push(annotation);
    }
    return { persona: map.persona, scenario: map.scenario, personaFor: first?.id, annotations, ...extra };
  }

  /**
   * The ordered rows a node is drawn as, each `{ kind, h, zone?, ...extra }`; a row with no
   * zone is in the card. An annotated node ends with a note slot and one row per annotation,
   * both in the bottom zone, so the room is reserved whatever the answers are.
   */
  function rows(node, opts = {}) {
    let result;
    if (node.kind === 'start' && opts.persona && opts.personaFor === node.id) result = personaRows(opts);
    else if (isStep(node, opts)) result = stepRows(node, opts);
    else result = baseRows(node);
    const annotations = opts.annotations?.get(node.id) || [];
    if (annotations.length) {
      result = [...result, { zone: 'bottom', kind: 'noteslot', h: M.noteSlot }];
      for (const annotation of annotations) {
        const text = lines(annotation.text, M.annoChars);
        result.push({ zone: 'bottom', kind: 'annotation', h: text.length * M.annoLine + 16, id: annotation.id, text });
      }
    }
    return result;
  }

  /** Box geometry: `inset` rows sit above the card, `tail` rows below it, `card` is the framed part. */
  function parts(node, opts = {}) {
    const result = rows(node, opts);
    const sum = (zone) => result.filter((row) => (row.zone || 'card') === zone).reduce((h, row) => h + row.h, 0);
    const body = sum('card');
    const card = node.kind === 'start' ? Math.max(76, body + 2 * M.pad) : body + M.pad + 14;
    const inset = sum('top');
    const tail = sum('bottom');
    return { rows: result, inset, card, tail, h: inset + card + tail };
  }

  /** A node's box height: the top zone, the card (its rows plus padding, with a minimum for a start) and the bottom zone. */
  const height = (node, opts) => parts(node, opts).h;

  /** Column of each node in one tree, by longest path: a node sits one column right of its deepest parent. */
  function columnDepths(treeNodes) {
    const depths = new Map();
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

  /** Ids in drawing order: a depth-first walk from the start, then any unreachable node. */
  function drawOrder(treeNodes, byId) {
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
    walk(treeNodes.find((node) => node.kind === 'start').id);
    for (const node of treeNodes) if (!order.includes(node.id)) order.push(node.id);
    return order;
  }

  /**
   * Places every node: trees stack top to bottom, columns run left to right, and
   * each column is centred on its tree's midline. Returns `{ boxes, edges, width, height }`.
   */
  function layout(map, extra = {}) {
    const opts = ctx(map, extra);
    const boxes = [];
    const byId = new Map(all(map).map((node) => [node.id, node]));
    let top = 110;

    for (const tree of map.trees) {
      const treeNodes = tree.nodes;
      const depths = columnDepths(treeNodes);
      const columns = new Map();
      drawOrder(treeNodes, byId).forEach((id, index) => {
        const column = depths.get(id);
        if (!columns.has(column)) columns.set(column, []);
        columns.get(column).push({ id, index, ...parts(byId.get(id), opts) });
      });

      const stackHeight = (list) => list.reduce((sum, b) => sum + b.h, 0) + M.rowGap * (list.length - 1);
      const tallest = Math.max(...[...columns.values()].map(stackHeight));
      const midline = top + tallest / 2;
      for (const [column, list] of columns) {
        let y = midline - stackHeight(list) / 2;
        for (const b of list) {
          boxes.push({
            id: b.id,
            tree: tree.id,
            column,
            row: b.index,
            x: 60 + column * M.col,
            y,
            w: M.w,
            h: b.h,
            inset: b.inset,
            tail: b.tail,
            ay: y + b.inset + b.card / 2,
          });
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

  const startOf = (tree) => tree.nodes.find((node) => node.kind === 'start');

  /**
   * Node ids shown before "show whole map". A flow tree stops at each
   * unanswered choice and at each checklist or text box not yet continued. With
   * `opts.stepwise` it also stops at each waypoint until that waypoint carries `done`.
   */
  function revealed(map, answers = {}, opts = {}) {
    const shown = new Set();
    for (const tree of map.trees) {
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
          if (!(opts.stepwise && node.kind === 'waypoint' && !answer.done)) walk(node.next);
        }
      };
      walk(startOf(tree).id);
    }
    return shown;
  }

  /**
   * Ordered node ids along the walk of one tree. At a choice it follows the answer, or
   * under `showAll` the default option; it stops at an unanswered choice, and with `opts.stepwise` at the first undone waypoint.
   */
  function walkTree(tree, answers, showAll, opts) {
    const byId = new Map(tree.nodes.map((node) => [node.id, node]));
    const path = [];
    const seen = new Set();
    let id = startOf(tree).id;
    while (id && !seen.has(id) && byId.has(id)) {
      seen.add(id);
      path.push(id);
      const node = byId.get(id);
      const answer = answers[id] || {};
      if (node.kind === 'choice') {
        const key = answer.choice ?? (showAll ? (node.default ?? node.options[0].key) : undefined);
        id = node.options.find((option) => option.key === key)?.next;
        continue;
      }
      if ((node.kind === 'checklist' || node.kind === 'text') && !answer.done && !showAll) break;
      if (opts.stepwise && !showAll && node.kind === 'waypoint' && !answer.done) break;
      id = node.next;
    }
    return path;
  }

  // why: the mood timeline plots one line, so the walk is each tree's path joined in tree order, the same order `pending` and `prevTarget` use.
  /** Ordered node ids along the walk: each tree's path, in tree order. */
  const walked = (map, answers = {}, showAll = false, opts = {}) =>
    map.trees.flatMap((tree) => walkTree(tree, answers, showAll, opts));

  /** The first waypoint, in tree order, that the stepwise walk is holding at (the one a forward step would release), or null. */
  function pending(map, answers = {}) {
    for (const tree of map.trees) {
      const id = walkTree(tree, answers, false, { stepwise: true }).pop();
      const node = tree.nodes.find((n) => n.id === id);
      if (node?.kind === 'waypoint' && node.next && !answers[id]?.done) return id;
    }
    return null;
  }

  /**
   * The id of the node whose answer "Prev" clears so the last node shown is hidden, or null
   * when nothing can be undone. Only a stepwise, not show-all, walk has a Prev. It undoes the
   * latest answer of the last tree that has one, so the trees unwind in reverse tree order.
   */
  function prevTarget(map, answers = {}, opts = {}) {
    if (!opts.stepwise || opts.showAll) return null;
    for (const tree of [...map.trees].reverse()) {
      const byId = new Map(tree.nodes.map((node) => [node.id, node]));
      const path = walkTree(tree, answers, false, { stepwise: true });
      for (let i = path.length - 2; i >= 0; i--) {
        const node = byId.get(path[i]);
        const answer = answers[node.id];
        if (node.kind === 'choice' ? answer?.choice !== undefined : node.kind !== 'start' && answer?.done) {
          return node.id;
        }
      }
    }
    return null;
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
      } else if (node.kind === 'checklist' && answer.done) {
        result.push(`${prefix}continued with no change`);
      }
      if (answer.text !== undefined) result.push(`${prefix}typed ${JSON.stringify(answer.text)}`);
      if (answer.note !== undefined) result.push(`${prefix}note ${JSON.stringify(answer.note)}`);
    }
    return result.join('\n');
  }

  /**
   * Route of a cross-tree link as polyline points plus a label anchor. It leaves
   * the source's left edge into the column gutter, crosses to the target's
   * gutter along the gap just beside the source tree, and enters the target from the
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
    // why: the gap just beside the source tree holds no box of any tree, and the vertical runs sit in column gutters, so trees in between stay clear.
    let gapY;
    if (from.tree === to.tree || target.top > source.top) gapY = source.bottom + M.treeGap / 2;
    else gapY = source.top - M.treeGap / 2;

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

  globalThis.JourneyMapLogic = { validate, linkRoute, revealed, walked, pending, prevTarget, faded, feedback, layout, edges, isStep, MOOD, moodOf, chipRows, chipRowHeights, ctx, parts, lines, all, outgoing, rows, height, M };
})();

// PROTOTYPE — throwaway.
// Three structurally different layouts. Each takes the model and returns { focus(stageIndex) -> rect, whole -> rect }.
const legendHtml = (M) => M.personas.map((p) => `<span class="val"><i style="background:${p.color}"></i>${esc(p.name)}${p.illustrative ? '<em class="tag-ill">illustrative</em>' : ''}</span>`).join('');
const ruleStyle = (ln) => {
  const c = LINE_META[ln.type][1];
  return `border-color:${c};color:${c}`;
};

// ---------- A: Classic grid ----------
// why: lanes are rows and steps are columns, so every cell has one fixed address and the eye reads across a lane.
function layoutA(M) {
  const LW = 150;
  const CW = 200;
  const G = 10;
  const colX = (si) => LW + G + si * (CW + G);
  const TW = colX(M.steps.length) - G;
  const stageX = (s) => colX(s.steps[0].si);
  const stageW = (s) => s.steps.length * CW + (s.steps.length - 1) * G;
  const isStage = (id) => M.stages.some((s) => s.id === id);
  const pc = personaCard(0, 0, stageX(M.stages[0]) + stageW(M.stages[0]));
  let y = pc.offsetHeight + 18;
  const headY = y;
  for (const s of M.stages) {
    const h = box('stage-h', stageX(s), y, stageW(s), 36, `<span class="n">${s.index + 1}</span>${esc(s.label)}`, s.index);
    h.style.paddingRight = '30px';
    target(h, s.id, s.label, s.index, false);
    for (const st of s.steps) {
      const sh = box('step-h', colX(st.si), y + 44, CW, 32, esc(st.label), s.index);
      sh.style.paddingRight = '28px';
      target(sh, st.id, st.label, s.index, false);
    }
  }
  y += 88;
  const laneH = (l) => {
    if (l.type === 'mood') return 190;
    let h = 44;
    for (const c of M.j.cells) if (c.lane === l.id) h = Math.max(h, estimate(c, isStage(c.at) ? CW * 2 + G : CW) + 4);
    return h;
  };
  for (const l of M.lanes) {
    const h = laneH(l);
    for (const ln of M.lines.filter((x) => x.between[1] === l.id)) {
      for (const s of M.stages) {
        const r = box('rule', stageX(s) - 5, y - 5, stageW(s) + 10, 0, '', s.index);
        r.style.cssText += `;${ruleStyle(ln)};background:none`;
        const p = box('rule-label', stageX(s) + 8, y - 17, null, null, esc(lineLabel(ln)), s.index);
        p.style.cssText += `;${ruleStyle(ln)}`;
      }
    }
    box(`lane-bg${l.bp ? ' bp' : ''}`, 0, y, TW, h);
    const small = l.type === 'mood' ? `${fmt(M.scale.max)} to ${fmt(M.scale.min)}<br>${legendHtml(M).replaceAll('class="val"', 'class="val" style="margin:2px 0;display:flex"')}` : l.illustrative ? '<em class="tag-ill" style="margin:3px 0 0">illustrative</em>' : '';
    box('lane-label', 0, y, LW, h, `${esc(l.label)}<small>${small}</small>`);
    for (const s of M.stages) {
      if (l.type === 'mood') {
        const top = y + 30;
        const bottom = y + h - 14;
        s.steps.forEach((st, k) => {
          const m = box('', colX(st.si), y, CW, h, k === 0 ? `<div class="cap" style="padding:4px 8px">Mood</div>` : '', s.index);
          target(m, `mood:${st.id}`, M.labels.get(`mood:${st.id}`), s.index, false);
        });
        const zy = M.yOf(0, top, bottom);
        svgEl('line', { x1: stageX(s) - 4, x2: stageX(s) + stageW(s) + 4, y1: zy, y2: zy, stroke: '#b9bbc8', 'stroke-dasharray': '4 4' }, sg(s.index));
        continue;
      }
      const sc = M.cells[`${l.id}:${s.id}`];
      if (sc) {
        const { ill, html } = cellHtml(l, sc);
        const el = box(`card${ill ? ' illus' : ''}`, stageX(s), y, stageW(s), h, html, s.index);
        target(el, `${l.id}:${s.id}`, M.labels.get(`${l.id}:${s.id}`), s.index, false);
        continue;
      }
      for (const st of s.steps) {
        const c = M.cells[`${l.id}:${st.id}`];
        if (!c) {
          box('empty', colX(st.si), y, CW, h, '', s.index);
          continue;
        }
        const { ill, html } = cellHtml(l, c);
        const el = box(`card${ill ? ' illus' : ''}`, colX(st.si), y, CW, h, html, s.index);
        target(el, `${l.id}:${st.id}`, M.labels.get(`${l.id}:${st.id}`), s.index, false);
      }
    }
    if (l.type === 'mood') {
      const top = y + 30;
      const bottom = y + h - 14;
      for (const p of M.personas) {
        curve(M.steps.map((st) => ({ x: colX(st.si) + CW / 2, y: M.moodOf(p, st) == null ? 0 : M.yOf(M.moodOf(p, st), top, bottom), v: M.moodOf(p, st), stage: st.stage.index })), p.color, p.illustrative);
      }
    }
    y += h + G;
  }
  const H = y - G;
  return {
    focus: (i) => {
      const s = M.stages[i];
      if (i === 0) return { x: -12, y: -12, w: stageX(s) + stageW(s) + 24, h: H + 130 };
      return { x: stageX(s) - 12, y: headY - 12, w: stageW(s) + 24, h: H - headY + 130 };
    },
    whole: { x: -12, y: -12, w: TW + 24, h: H + 130 },
  };
}

// ---------- B: Mood spine ----------
// why: the mood curve is the page's spine; context hangs above it and consequences below it, so the story reads as one emotional line instead of a table.
function layoutB(M) {
  const SW = 236;
  const GAP = 48;
  const PW = 330;
  const ZH = 290;
  const CARD = SW - 12;
  const sx = [];
  let x = PW + 56;
  for (const s of M.stages) {
    sx.push(x);
    x += s.steps.length * SW + GAP;
  }
  const totalW = x - GAP;
  const sW = (s) => s.steps.length * SW;
  const colL = (st) => sx[st.stage.index] + st.stage.steps.indexOf(st) * SW;
  const above = M.lanes.filter((l, i) => i < M.moodIdx && !l.bp);
  const below = M.lanes.filter((l, i) => i > M.moodIdx && !l.bp);
  const bps = M.lanes.filter((l) => l.bp);
  const items = (l, s) => {
    const sc = M.cells[`${l.id}:${s.id}`];
    if (sc) return [{ c: sc, id: `${l.id}:${s.id}`, x: sx[s.index] + 6, w: sW(s) - 12, cap: '' }];
    return s.steps.filter((st) => M.cells[`${l.id}:${st.id}`]).map((st) => ({ c: M.cells[`${l.id}:${st.id}`], id: `${l.id}:${st.id}`, x: colL(st) + 6, w: CARD, cap: st.label }));
  };
  const rowH = (l, s) => {
    const it = items(l, s);
    return it.length ? Math.max(...it.map((o) => estimate(o.c, o.w))) + 4 : 0;
  };
  const stackH = (lanes, s) => lanes.reduce((n, l) => n + (rowH(l, s) ? rowH(l, s) + 10 : 0), 0);
  const AH = Math.max(0, ...M.stages.map((s) => stackH(above, s)));
  const spineY = AH + 96;
  const put = (l, s, it, y, h) => {
    const { ill, html } = cellHtml(l, it.c, it.cap);
    const el = box(`card${ill ? ' illus' : ''}`, it.x, y, it.w, h, html, s.index);
    target(el, it.id, M.labels.get(it.id), s.index, false);
  };
  pcAt(M, 0, spineY - 70, PW);
  const tops = [];
  const zy = M.yOf(0, spineY + 36, spineY + ZH - 16);
  for (const s of M.stages) {
    const h = box('stage-h', sx[s.index], spineY - 84, sW(s), 34, `<span class="n">${s.index + 1}</span>${esc(s.label)}`, s.index);
    h.style.paddingRight = '30px';
    target(h, s.id, s.label, s.index, false);
    box('zone pos', sx[s.index] - 4, spineY, sW(s) + 8, zy - spineY, '', s.index);
    box('zone neg', sx[s.index] - 4, zy, sW(s) + 8, spineY + ZH - zy, '', s.index);
    svgEl('line', { x1: sx[s.index] - 4, x2: sx[s.index] + sW(s) + 4, y1: zy, y2: zy, stroke: '#9a9cac', 'stroke-dasharray': '4 4' }, sg(s.index));
    s.steps.forEach((st, k) => {
      const sh = box('step-h', colL(st) + 6, spineY - 42, CARD, 32, esc(st.label), s.index);
      sh.style.paddingRight = '28px';
      target(sh, st.id, st.label, s.index, false);
      const m = box('', colL(st), spineY, SW, ZH, k === 0 ? `<div style="padding:6px 10px">${legendHtml(M)}</div>` : '', s.index);
      target(m, `mood:${st.id}`, M.labels.get(`mood:${st.id}`), s.index, false);
    });
    let yb = spineY - 96;
    for (const l of [...above].reverse()) {
      const h2 = rowH(l, s);
      if (!h2) continue;
      for (const it of items(l, s)) put(l, s, it, yb - h2, h2);
      yb -= h2 + 10;
    }
    tops[s.index] = yb;
  }
  for (const p of M.personas) {
    curve(M.steps.map((st) => ({ x: colL(st) + SW / 2, y: M.moodOf(p, st) == null ? 0 : M.yOf(M.moodOf(p, st), spineY + 36, spineY + ZH - 16), v: M.moodOf(p, st), stage: st.stage.index })), p.color, p.illustrative);
  }
  let belowEnd = spineY + ZH + 16;
  const bottoms = [];
  for (const s of M.stages) {
    let yy = spineY + ZH + 16;
    for (const l of below) {
      const h2 = rowH(l, s);
      if (!h2) continue;
      for (const it of items(l, s)) put(l, s, it, yy, h2);
      yy += h2 + 10;
    }
    bottoms[s.index] = yy;
    belowEnd = Math.max(belowEnd, yy);
  }
  let by = belowEnd + 22;
  for (const l of bps) {
    const h2 = Math.max(44, ...M.stages.map((s) => rowH(l, s)));
    for (const ln of M.lines.filter((q) => q.between[1] === l.id)) {
      for (const s of M.stages) {
        const r = box('rule', sx[s.index] - 5, by - 6, sW(s) + 10, 0, '', s.index);
        r.style.cssText += `;${ruleStyle(ln)};background:none`;
        const p = box('rule-label', sx[s.index] + 8, by - 18, null, null, esc(lineLabel(ln)), s.index);
        p.style.cssText += `;${ruleStyle(ln)}`;
      }
    }
    for (const s of M.stages) {
      box('lane-bg bp', sx[s.index] - 4, by - 2, sW(s) + 8, h2 + 4, '', s.index);
      for (const it of items(l, s)) put(l, s, it, by, h2);
    }
    by += h2 + 22;
  }
  const bottom = by + 120;
  const top = Math.min(0, ...tops) - 14;
  return {
    focus: (i) => {
      const s = M.stages[i];
      const t = Math.min(tops[i], spineY - 100) - 14;
      if (i === 0) return { x: -12, y: t, w: sx[0] + sW(s) + 28, h: bottom - t };
      return { x: sx[i] - 16, y: t, w: sW(s) + 32, h: bottom - t };
    },
    whole: { x: -12, y: top, w: totalW + 28, h: bottom - top },
  };
}
function pcAt(M, x, y, w) {
  return personaCard(x, y, w);
}

// ---------- C: Stage cards ----------
// why: one self-contained card per stage and a gauge instead of a curve, so a stage can be read, reordered or quoted on its own.
function layoutC(M) {
  const CWD = 420;
  const GAP = 80;
  const PW = 340;
  const X0 = PW + 80;
  personaCard(0, 0, PW);
  const cards = [];
  const mk = (tag, cls, html) => {
    const d = document.createElement(tag);
    d.className = cls;
    if (html) d.innerHTML = html;
    return d;
  };
  M.stages.forEach((s, i) => {
    const x = X0 + i * (CWD + GAP);
    const card = box('card cardc', x, 0, CWD, null, '', s.index);
    card.style.overflow = 'visible';
    const head = mk('div', 'stage-h', `<span class="n">${i + 1}</span>${esc(s.label)}`);
    head.style.cssText = 'position:relative;height:40px;padding-right:30px;margin-bottom:6px';
    card.appendChild(head);
    target(head, s.id, s.label, s.index, false);
    for (const l of M.lanes) {
      for (const ln of M.lines.filter((q) => q.between[1] === l.id)) {
        const r = mk('div', 'rule', `<span class="rule-label" style="position:absolute;left:8px;top:-11px;${ruleStyle(ln)}">${esc(lineLabel(ln))}</span>`);
        r.style.cssText += `;position:relative;margin:18px 0 8px;${ruleStyle(ln)}`;
        card.appendChild(r);
      }
      if (l.type === 'mood') {
        const sec = mk('div', 'sect', `<div class="cap">${esc(l.label)} · ${fmt(M.scale.min)} to ${fmt(M.scale.max)}</div><div style="margin-bottom:2px">${legendHtml(M)}</div>`);
        for (const st of s.steps) {
          const sh = mk('div', '', `<b style="font-size:12.5px">${esc(st.label)}</b>`);
          sh.style.cssText = 'position:relative;margin-top:8px;padding-right:26px';
          target(sh, st.id, st.label, s.index, false);
          sec.appendChild(sh);
          const gw = mk('div', '');
          gw.style.cssText = 'position:relative;padding-right:26px';
          for (const p of M.personas) {
            const v = M.moodOf(p, st);
            if (v == null) continue;
            const pos = ((v - M.scale.min) / (M.scale.max - M.scale.min)) * 100;
            const zero = ((0 - M.scale.min) / (M.scale.max - M.scale.min)) * 100;
            const row = mk('div', '', `<span class="val" style="min-width:34px"><i style="background:${p.color}"></i>${fmt(v)}</span><div class="gauge" style="flex:1;margin:12px 6px"><span class="z" style="left:${zero}%"></span><span class="m" style="left:${pos}%;background:${p.color}${p.illustrative ? ';border-style:dashed;border-color:' + p.color : ''}"></span></div>`);
            row.style.cssText = 'display:flex;align-items:center';
            gw.appendChild(row);
          }
          sec.appendChild(gw);
          target(gw, `mood:${st.id}`, M.labels.get(`mood:${st.id}`), s.index, false);
        }
        card.appendChild(sec);
        continue;
      }
      const sc = M.cells[`${l.id}:${s.id}`];
      const list = sc ? [{ c: sc, id: `${l.id}:${s.id}`, cap: '' }] : s.steps.filter((st) => M.cells[`${l.id}:${st.id}`]).map((st) => ({ c: M.cells[`${l.id}:${st.id}`], id: `${l.id}:${st.id}`, cap: st.label }));
      for (const it of list) {
        const { ill, html } = cellHtml(l, it.c, it.cap);
        const sec = mk('div', `sect${l.bp ? ' bp' : ''}${ill ? ' illus' : ''}`, html);
        sec.style.paddingRight = '28px';
        card.appendChild(sec);
        target(sec, it.id, M.labels.get(it.id), s.index, false);
      }
    }
    cards.push(card);
    if (i === 0) arrow(PW + 10, 24, x - 10, 24, '#1d1d27', 0);
    else arrow(x - GAP + 10, 24, x - 10, 24, '#1d1d27', i);
  });
  const hMax = () => Math.max(...cards.map((c) => c.offsetHeight));
  return {
    focus: (i) => {
      const c = cards[i];
      if (i === 0) return { x: -12, y: -14, w: c.offsetLeft + CWD + 28, h: hMax() + 130 };
      return { x: c.offsetLeft - 16, y: -14, w: CWD + 32, h: hMax() + 130 };
    },
    whole: { x: -12, y: -14, w: X0 + M.stages.length * (CWD + GAP) - GAP + 28, h: hMax() + 130 },
  };
}

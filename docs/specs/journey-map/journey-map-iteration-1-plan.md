---
type: spec
title: Journey Map Skill, Iteration 1 plan
description: Ordered units that apply the journey-map iteration 1 spec in three gated waves — logic and tests, then drawing and skill text, then a fresh-agent cj_001 map and a browser smoke.
status: stable
---

# Journey Map Skill, Iteration 1 — plan

**Source:** `docs/specs/journey-map/journey-map-iteration-1-spec.md` (status `stable`).
**Base plan:** `docs/specs/journey-map/journey-map-plan.md`, units 01–16, all done. Numbering continues from 17.
**Prototype:** `docs/notes/visual-map-kinds/journey-details-prototype/`, layout H.
**Next:** After the Human approves → `code-execute`, wave 4 first.

## Structural gate

Each of the 18 J-rows in the locked spec names a proof, and each proof has an acceptance box. Eleven are checked by `pnpm test` or a skill-contract test. Six are browser checks recorded in the smoke note in unit 29. Three proofs are split between parts, and the units below name which part each one closes:

- `proof-journey-map-iter1-no-tickets`: a test part, plus the `rg` part at the wave 5 gate.
- `proof-journey-map-iter1-note-annotation`: a test part, plus a smoke part.
- `proof-journey-map-iter1-toolbar`: a test part, plus a smoke part.

`proof-journey-map-iter1-spec-obligations` is the spec's own structural check, and it held when this plan was written. No obligation is left without a check.

## Work units

All paths under `templates/.agents/skills/journey-map/` are written as `jm/` below. `render test` is `test/journey-map-render.test.ts`, and `fx/` is `test/fixtures/journey-map/`.

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 17 | Tickets leave the skill | — | `jm/renderer/logic.js`, `jm/renderer/draw.js` and `jm/renderer/page.html` (ticket code and tokens only), `jm/references/tree-format.md` (ticket rows only), `fx/lotr-map.json`, `fx/malformed-map.json`, render test | `spawn` | [ ] `validate` reports a `ticket` node as `unknown kind ticket`, naming it. A tree needs exactly one `start` with no ticket-only exception. `blocked`, `ticketStyle` and the ticket layout, reveal and draw branches are gone. The LotR fixture has no ticket nodes, and the ticket tests are replaced by the unknown-kind test. The remaining base tests pass, and `harness-init-redesign-map.json` still builds. Proof: `proof-journey-map-iter1-no-tickets` (test part) |
| 18 | Journey fields validate, and the persona rule picks journey steps | 17 | `jm/renderer/logic.js` (`validate`, `isStep`), `fx/malformed-map.json`, new `fx/cj-001-map.json`, render test | `spawn` | [ ] `fx/cj-001-map.json` is written by hand from the prototype's `cj-001-journey.json`, without its `journey` flag and with one annotation added. It gives no errors. Each J4.1 case in `malformed-map.json` names its node, or `map:` for a persona with no name. `isStep` is true for a waypoint on a persona map or one with a journey field, and false for the LotR fixture's plain waypoint. Proof: `proof-journey-map-iter1-journey-validate`, `proof-journey-map-iter1-journey-step` |
| 19 | Journey cards get their zones, and an annotated node keeps room for a note | 18 | `jm/renderer/logic.js` (`M`, `rows`, `parts`, `height`, `layout`), render test | `spawn` | [ ] `rows` puts the cloud in the top zone; the band, eyebrow, title and count row or chips in the card zone; and pains and opportunities in the bottom zone only when expanded. On `cj-001-map.json` with every step expanded, no two boxes overlap, counting clouds and stickies. `height` equals the sum of the zones. An annotated node's box leaves the note slot and the annotation's lines under the card. Proof: `proof-journey-map-iter1-journey-layout`, `proof-journey-map-iter1-note-annotation` (test part) |
| 20 | Step by step holds the walk, and the walked path follows the choices | 19 | `jm/renderer/logic.js` (`revealed`, `walked`, `pending`, the Prev target), render test | `spawn` | [ ] With `stepwise`, empty answers on `cj-001-map.json` show `start` and the first step, and `done` on it adds the next. `pending` names the held step. Clearing the latest answer hides exactly the last node shown. Without `stepwise`, the LotR reveal matches the base expectation. `walked` gives the walk order before and after choosing the competitor branch, and with show-all it follows `default`. Proof: `proof-journey-map-iter1-step-by-step`, `proof-journey-map-iter1-walked-path` |
| 21 | Feedback names an unchanged checklist and ignores pacing | 20 | `jm/renderer/logic.js` (`feedback`), render test | `spawn` | [ ] A checklist with `done` and no `checks` gives exactly `<id> "<label>": continued with no change`. A waypoint with only `done` adds no line. The base feedback string still matches. Proof: `proof-journey-map-iter1-feedback-lines` |
| 22 | **Wave 4 gate** | 17–21 | — | `inline` | [ ] `pnpm test` and `pnpm lint` exit 0. Every wave 4 acceptance box in the spec has its evidence. Failure → **abort** before wave 5 |
| 23 | Journey cards draw as layout H | 22 | `jm/renderer/draw.js`, `jm/renderer/page.html` (mood, band, cloud and sticky tokens), render test (draw-level assertions only) | `spawn` | [ ] A built `cj-001-map.json` page draws: <ul><li>the band in the mood colour with face and first name and no mood word; grey with no mood; face only with no persona</li><li>the chevron (inert with nothing to expand) and the pencil in the band only</li><li>the cloud without bumps</li><li>the count row when collapsed, and chips plus red and green stickies when expanded</li><li>mood-coloured flow edges at 3.2px</li><li>the persona header on the first start</li></ul> Checked by opening the built page in the browser tool once, with no console errors. The prototype's A–F, G and `?variant=` code isn't ported. Every comment follows the comment rule. Proof: behaviour checked fully in 29 (`proof-journey-map-iter1-journey-smoke`); this unit's gate is the console-clean open |
| 24 | The page chrome walks, menus and plots mood | 23 | `jm/renderer/draw.js`, `jm/renderer/page.html` (toolbar, menu, Prev, timeline island), render test (toolbar assertions) | `spawn` | [ ] The toolbar holds "Copy for agent", "Start over" and ⋯, plus "Prev" and "Next" while step by step is on. The menu lists Step by step (P), Show whole map (W) and Expand all (E), and closes on Escape and an outside click. The page also has: <ul><li>shortcuts `n`, `b`, `r`, `p`, `w` and `e` on `window`, with the stage focused on load</li><li>the 120px timeline with no clipping at −2, which follows the walked path</li><li>"Expand all" with a refit, and "Show whole map" refitting both ways</li><li>Enter in a text box acting as Continue</li><li>the note drawn between the card and its annotation</li></ul> A render test asserts the built page's toolbar buttons and menu entries. The timeline and all journey text use DOM calls or `textContent`, and `draw.js` has no `innerHTML`. Proof: `proof-journey-map-iter1-toolbar` (test part), `proof-journey-map-iter1-no-html-injection` |
| 25 | Skill text and listings describe journeys | 22 | `jm/SKILL.md`, `jm/references/tree-format.md` (persona and journey fields), `test/skill-journey-map.test.ts`, `AGENTS.md` (journey-map row), `site/skills.md` (journey-map row) | `spawn` | [ ] The description reads "a flow, a set of options, or a user journey", and `AGENTS.md` and `site/skills.md` repeat it. `SKILL.md` says to publish an artifact without asking in Claude, to republish to the same URL on a comment, and to hand over the local file when the Human said not to publish, the runtime isn't Claude, or publishing fails (saying what blocked it, and asking whether to retry or stay local). Both files tell the agent to map a source's mood onto −2 to +2 and write the mapping in the doc beside the map. `tree-format.md` documents `persona`, `scenario`, the journey fields and the persona rule, with the spec's example. The skill-contract test's kind list drops `ticket`. Proof: `proof-journey-map-iter1-artifact-default`, `proof-journey-map-iter1-mood-mapping`, `proof-journey-map-iter1-listings` (text part) |
| 26 | This repo's copy matches the template | 23, 24, 25 | `.agents/skills/journey-map/**` | `inline` | [ ] `diff -rq templates/.agents/skills/journey-map .agents/skills/journey-map` is empty, and `test/skill-copies.test.ts` passes. Proof: `proof-journey-map-iter1-listings` (copy part) |
| 27 | **Wave 5 gate** | 26 | — | `inline` | [ ] `pnpm build`, `pnpm test`, `pnpm lint`, `node dist/cli.js validate` and `pnpm comments` pass. `rg -n -i "ticket\|claimed_by\|blocked_by" templates/.agents/skills/journey-map test/fixtures/journey-map` and `rg -n "ticket graph" AGENTS.md site/skills.md templates .agents` are empty. Every wave 5 acceptance box has its evidence. Failure → **abort** before wave 6. Proof: `proof-journey-map-iter1-no-tickets` (`rg` part) |
| 28 | A fresh agent maps cj_001 from the skill alone | 27 | new `fx/cj-001-reference-map.json`, render test | `spawn` | [ ] A subagent given only the installed skill folder and `docs/notes/visual-map-kinds/cj-001-source.json` writes a map and its note. The build exits 0. The note states the mood mapping. The JSON is committed as `fx/cj-001-reference-map.json`. A test asserts: the build exits 0; the persona name matches; there is one step per source user action, each with a mood; and every source thought, touchpoint, pain and opportunity appears. Proof: `proof-journey-map-iter1-cj001-reference` |
| 29 | Browser smoke is recorded | 28 | `docs/notes/journey-map-smoke/journey-map-smoke-note.md` | `spawn` | [ ] Over a loopback server, at 1440px and 800px wide, using the fixture that carries each feature (`cj-001-reference-map.json`, `cj-001-map.json` for the branch and annotation, `lotr-map.json` for the text box), each step and its result go into a new "Iteration 1" section of the note: <ul><li>every J4.5 item, one line each</li><li>Next and `n`, Prev and `b`</li><li>a shortcut on a fresh load before any click</li><li>Enter in a text box</li><li>"Show whole map" refitting with no Fit press</li><li>a note beside an annotation, both readable</li></ul> Proof: `proof-journey-map-iter1-journey-smoke`, `proof-journey-map-iter1-prev-next-smoke`, `proof-journey-map-iter1-toolbar` (smoke part), `proof-journey-map-iter1-enter-continues`, `proof-journey-map-iter1-whole-map-refit`, `proof-journey-map-iter1-note-annotation` (smoke part) |
| 30 | **Ship gate** | 29 | — | `inline` | [ ] `pnpm test` and `node dist/cli.js validate` pass. Every iteration 1 acceptance box is ticked with evidence. `git diff` against `main` shows no change under `src/`, `scripts/build-map.mjs`, `docs/adrs/` or any other shipped skill folder. Failure → **abort**; do not hand off |

## Wave stops

| Stop | After | Gate |
|------|-------|------|
| **4** | 22 | `pnpm test` + `pnpm lint` PASS. **Abort before wave 5** on failure |
| **5** | 27 | `pnpm build`, `pnpm test`, `pnpm lint`, `validate`, `pnpm comments` PASS; both `rg` checks empty. **Abort before wave 6** on failure |
| **Ship** | 30 | `pnpm test` + `validate` PASS; all acceptance boxes ticked; the unchanged surfaces are unchanged |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
|---|---|---|---|---|---|
| — | None carried: the spec's Unresolved table is empty | — | — | — | — |

## Frontier order

**Wave 4:**
```
17 → 18 → 19 → 20 → 21 → 22 STOP
```
- All five units extend `logic.js` and the render test in turn, so they run in order on one warm agent.
- 17 also strips the ticket drawing and tokens from `draw.js` and `page.html`. That's deletion only, so wave 5's drawing units start from ticket-free files.

**Wave 5:**
```
(23 → 24  ∥  25) → 26 → 27 STOP
```
- 23 and 24 share `draw.js` and `page.html`, so they run in order.
- 25 owns only skill text, its test and two listing rows, so it runs in parallel.
- 26 copies the finished skill, so it waits for all three.

**Wave 6:**
```
28 → 29 → 30 STOP
```
- 28 must be a fresh subagent: proving the skill works alone is its whole point.

## Dispatch and token budget

The orchestrator is the Opus session that runs `code-execute`. It keeps its context for decisions, gates and commits. Sonnet subagents do every unit that reads or writes renderer code or skill text.

| Agent | Model | Units, in order | How it starts | Why this grouping |
|---|---|---|---|---|
| A, logic | `sonnet` | 17 → 18 → 19 → 20 → 21, then the 28 test assertion | Spawned for 17, then continued with `SendMessage` | All share `logic.js` and the render test. A warm agent reads the spec and the prototype's `logic.js` once |
| B, page | `sonnet` | 23 → 24 | Spawned at the start of wave 5 | Owns `draw.js` and `page.html` and reads the prototype's drawing, the largest files. Keeps them out of A's and the orchestrator's context |
| C, skill | `sonnet` | 25 | Spawned at the start of wave 5, in parallel with B | Small, disjoint skill-text unit |
| D, fresh reader | `sonnet` | 28 (writes the JSON and note only) | Spawned with only the installed skill folder path and `cj-001-source.json`. No spec, plan, prototype or tests | The proof is that the skill stands on its own. A then adds the test through `SendMessage` |
| E, smoke | `sonnet` | 29 | Spawned with the browser tools | Keeps screenshots out of the orchestrator's context. If a subagent can't reach the browser, 29 runs inline, and the plan records that |
| Orchestrator | `opus` | 22, 26, 27, 30, and every commit | Inline | Gates and commits must be trusted, and they're cheap when output is trimmed |

**Orchestrator rules**

- Before wave 4, run `pnpm build` once so `dist/` exists for every subagent's final check. No unit changes `src/`, so that build stays current.
- Don't read renderer, prototype or test files yourself. Read only the subagent reports, `git diff --stat`, and gate output trimmed with `| tail -20`.
- Write briefs that point to paths and spec sections (Design and the unit's J-rows) instead of pasting their content. Paste only the unit row, as the builder brief requires.
- Ask every subagent to keep its report to about 25 lines: pass or fail per Done-when item with the command that proved it, the files changed, and blockers.
- Re-brief the same agent with `SendMessage` whenever the next unit shares its files.
- Commit once per wave, at its gate unit, through `code-commit`, with that wave's plan-completion marks in the same commit. The Human asked for this cadence in the base plan's wave 2. `.agents/code-commit.config.yml` is absent, so `code-execute` confirms the cadence with the Human before the first commit.

Never pack a later wave into an earlier wave's batch to skip its gate unit.

## Execution / resume section

### Unit 17 — wave 4, frontier head

| Field | Value |
|-------|-------|
| Unit identifier | 17 — Tickets leave the skill (agent A; then 18 → 21 on the same agent) |
| Spec/plan paths | `docs/specs/journey-map/journey-map-iteration-1-spec.md` / `docs/specs/journey-map/journey-map-iteration-1-plan.md` |
| Obligation / proof status | J1.1 `proof-journey-map-iter1-no-tickets` (test part) — pending |
| `HEAD` commit | `2238220` |
| `git status` summary | dirty, all outside unit 17's Owns: the amended PRD, the base spec's pointer line, the iteration spec and plan, `docs/deferrals/{architectural-map,service-blueprint}/`, `docs/notes/visual-map-kinds/`, and the untracked `.claude/launch.json` |
| Intended diff scope | `templates/.agents/skills/journey-map/renderer/{logic.js,draw.js,page.html}`, `templates/.agents/skills/journey-map/references/tree-format.md`, `test/fixtures/journey-map/{lotr-map,malformed-map}.json`, `test/journey-map-render.test.ts` |
| Decision on every discrepancy | Resolved: the planning docs are isolated, and no unit touches them. `.agents/code-commit.config.yml` is absent, so `autocommit: false` by default; the per-wave commit is confirmed with the Human at the wave 4 gate. `pnpm build` ran before wave 4 |

### Unit 17 — paused by the Human at 17:52

| Field | Value |
|-------|-------|
| Unit identifier | 17 — Tickets leave the skill, stopped mid-unit (agent A) |
| Spec/plan paths | `docs/specs/journey-map/journey-map-iteration-1-spec.md` / `docs/specs/journey-map/journey-map-iteration-1-plan.md` |
| Obligation / proof status | J1.1 `proof-journey-map-iter1-no-tickets` (test part) — pending; not verified |
| `HEAD` commit | `2238220` |
| `git status` summary | dirty: partial unit 17 edits inside its Owns (`logic.js`, `draw.js`, `page.html`, `tree-format.md`, `lotr-map.json`, `malformed-map.json`; the render test not yet edited), plus the planning docs outside Owns |
| Intended diff scope | unchanged from the unit 17 entry above |
| Decision on every discrepancy | Resolved: the Human asked to stop and resume after 18:50. The partial edits stay in place, unverified. On resume, a re-briefed agent A finishes unit 17 from the current files and runs the Done-when checks before unit 18 |

### Wave 4 gate (unit 22) — passed, not committed

| Field | Value |
|-------|-------|
| Unit identifier | 22 — Wave 4 gate, after units 17–21 |
| Spec/plan paths | `docs/specs/journey-map/journey-map-iteration-1-spec.md` / `docs/specs/journey-map/journey-map-iteration-1-plan.md` |
| Obligation / proof status | Done: J1.1 (test part), J2.3, J3.1, J3.2 (test part), J4.1, J4.2, J4.3, J4.4. Pending: wave 5 (23–27) and wave 6 |
| `HEAD` commit | `2238220` |
| `git status` summary | dirty: wave 4 work in `templates/.agents/skills/journey-map/renderer/logic.js`, `draw.js` and `page.html` (ticket removal), `references/tree-format.md`, `test/journey-map-render.test.ts`, `test/fixtures/journey-map/`, plus the gate's two fixes below and the uncommitted planning docs |
| Intended diff scope | the Owns of units 17–21, plus the two gate fixes |
| Decision on every discrepancy | Resolved (orchestrator): unit 17's ticket removal broke two tests that later units own, so the gate could not pass in plan order. The gate dropped `ticket` from the kind list in `test/skill-journey-map.test.ts` (unit 25's file) and synced `.agents/skills/journey-map/**` from the template (unit 26's action, repeated in wave 5). Resolved: unit 17 added two in-tree links to the LotR fixture (`doom→shire`, `halt→route`) so link tests keep covering it. Gate run in this session: `pnpm test` 659/659, `pnpm lint` clean, `pnpm comments` ok, `validate` ok, repo copy identical. Commit cadence awaits the Human |

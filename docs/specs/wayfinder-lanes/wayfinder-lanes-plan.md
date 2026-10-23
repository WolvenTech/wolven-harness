---
type: spec
title: Wayfinder lanes canvas — plan
description: Three gated waves. Wave 1 lands lanes layout and fixtures. Wave 2 lands the lanes page, build modes, manifest, synced copies, and skill text. Wave 3 lands the browser smoke note.
status: draft
---

# Wayfinder lanes canvas — plan

**Spec:** `docs/specs/wayfinder-lanes/wayfinder-lanes-spec.md` (status `stable`).

## Structural gate

The spec's own gate (`proof-wayfinder-lanes-spec-obligations`) holds: 29 R
rows, 29 unique named proofs, each acceptance box names exactly one proof, no
proof serves two rows, all nine landings are present, and both `n/a` landings
cite an unchanged surface. Every proof below maps to one implementation unit
or one wave gate check; none are orphaned.

R1.1–R1.7 are one `layout(model)` outcome exercised in
`test/lanes-layout.test.ts`, not seven separate features — they stay in unit
01. R5.1–R5.6 are rows of one smoke note, not six features — they stay in
unit 08. R2.3 and R4.1 are verified at the wave 2 gate (unit 07) via the
spec's `git diff --exit-code` commands; no feature unit mutates those paths.

Every template path a unit edits has a byte-identical copy under `.agents/`
(`test/skill-copies.test.ts`). The unit owns both copies. Lanes renderer
files under the wayfinder skill copies come from `pnpm sync:renderer` only
(unit 05 updates `renderer/sync.mjs`; never hand-edit the synced lanes
copies).

**Frozen (no unit owns):** `renderer/radial.js`, `renderer/radial-draw.js`,
`renderer/radial.html`, `renderer/logic.js`, `renderer/canvas.js`,
`renderer/draw.js`, `renderer/page.html`, both `journey-map` skill folders,
`src/`, `prototypes/`, `.claude/launch.json`. The in-page toggle and the
unprompted radial offer stay in
`docs/deferrals/canvas-view-toggle/canvas-view-toggle-deferral.md`. No unit
deletes the prototype.

**Pragmatic-guard:** This plan adds nothing beyond the locked spec — no
shared panel module, layout options object, theme switcher, palette config,
second JSON format, edge routing beyond layout rules 3 and 4, or in-page
toggle. No new deferral.

## Work units

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 01 | Lanes layout and the four fixtures | — | `renderer/lanes.js`, `test/lanes-layout.test.ts`, `test/fixtures/wayfinder/starter-canvas.json`, `test/fixtures/wayfinder/medium-canvas.json` (read-only source: `prototypes/wayfinder-metro/maps/starter-canvas.json` and `medium-canvas.json`; do not copy `lines.js`; do not commit `prototypes/`) | `spawn` | [x] `lanes.js` loads under `node:vm` with no DOM and exposes `LanesLayout.layout`. On starter, medium, billing-30 and reached fixtures, layout assigns one row per ticket below blockers, lines and lanes match layout rules 3–4, track solidity and the billing-30 ticket 27 out-of-scope-blocker case match rule 6, and two calls deep-equal without mutating the model. Proofs: `proof-wayfinder-lanes-vm`, `proof-wayfinder-lanes-rows`, `proof-wayfinder-lanes-lines`, `proof-wayfinder-lanes-packing`, `proof-wayfinder-lanes-track`, `proof-wayfinder-lanes-oos-blocker`, `proof-wayfinder-lanes-deterministic` (R1.1–R1.7) |
| 02 | **Wave 1 gate** | 01 | — | `inline` | [x] Unit 01 proofs PASS. `pnpm test`, `pnpm lint`, `pnpm build && pnpm comments`, and `pnpm build && pnpm validate` exit 0. On failure, **abort before wave 2** |
| 03 | Lanes page, drawing, and the default build | 02 | `renderer/lanes-draw.js`, `renderer/lanes.html`, `templates/.agents/skills/wayfinder/scripts/build-canvas.mjs`, `.agents/skills/wayfinder/scripts/build-canvas.mjs`, `test/wayfinder-canvas.test.ts`, `test/lanes-layout.test.ts` (R2.6 grep only) | `spawn` | [ ] Default `build-canvas.mjs <map>` writes `<slug>-canvas.html` from `lanes.html` inlining `lanes.js` and `lanes-draw.js` without `radial-draw.js`. The built page declares `color-scheme: light dark`, defines `--lane-0` through `--lane-11` in light and dark token sets, and has no remote script tags. `lanes-draw.js` calls only `RadialLayout.handoff`, `copyText`, and `frontierList` for panel text (grep in `test/lanes-layout.test.ts`; no "Use the wayfinder skill" in the draw file). Proofs: `proof-wayfinder-lanes-default-build` (R2.1), `proof-wayfinder-lanes-handoff-reuse` (R2.6), `proof-wayfinder-lanes-shell` (R2.9) |
| 04 | Radial build mode, errors, flags, ignore, determinism | 03 | Both `build-canvas.mjs` copies, `test/wayfinder-canvas.test.ts` | `spawn` | [ ] `--radial <map>` writes `<slug>-radial-canvas.html` from `radial.html` with `radial-draw.js` and prints its path. Error maps exit 1 naming the ticket in both modes with error data on each page. An unknown flag exits 1 naming the flag and writes nothing. `git check-ignore` reports the radial page ignored per setup's `docs/maps/.gitignore`. Two builds in either mode yield identical page and JSON bytes. Proofs: `proof-wayfinder-radial-on-ask` (R2.2), `proof-wayfinder-lanes-build-errors` (R2.4), `proof-wayfinder-lanes-bad-flag` (R2.5), `proof-wayfinder-radial-ignored` (R2.10), `proof-wayfinder-lanes-build-deterministic` (R2.11) |
| 05 | Manifest, synced copies, standalone install | 04 | `renderer/sync.mjs`, `test/renderer-copies.test.ts`, `test/wayfinder-install.test.ts` | `spawn` | [ ] `MANIFEST.wayfinder` lists `lanes.js`, `lanes-draw.js`, and `lanes.html`; `test/renderer-copies.test.ts` asserts that set (replacing the current radial-only list assertion). After `pnpm sync:renderer`, every wayfinder skill copy matches `renderer/` byte for byte. A standalone wayfinder install builds a lanes page with the lanes scripts and passes the consumer comment check. A wayfinder-only renderer change still leaves journey-map copies byte-identical. Proofs: `proof-wayfinder-lanes-manifest` (R2.7), `proof-wayfinder-lanes-standalone` (R2.8), `proof-wayfinder-subset-isolation` (R4.2) |
| 06 | Wayfinder skill canvas text | 02 | `templates/.agents/skills/wayfinder/SKILL.md`, `.agents/skills/wayfinder/SKILL.md`, `test/skill-wayfinder.test.ts`, `test/skill-copies.test.ts` | `spawn` | [ ] "The canvas" names lanes as the default view, documents `--radial` and `<slug>-radial-canvas.html` as built only when the Human asks, and states the radial view is never offered. The one-line canvas offer after charting and close names only the canvas with no "radial" inside it. Template and installed skill copies stay identical. Proofs: `proof-wayfinder-skill-radial-ask` (R3.1), `proof-wayfinder-skill-offer-unchanged` (R3.2), `proof-lean-init-copies-identical` (R3.3) |
| 07 | **Wave 2 gate** | 05, 06 | — | `inline` | [ ] Units 03–06 proofs PASS. `pnpm sync:renderer` prints nothing on a second run and `git status` shows no drift under the wayfinder skill renderer copies. `pnpm test`, `pnpm lint`, `pnpm build && pnpm comments`, and `pnpm build && pnpm validate` exit 0. `git diff --exit-code origin/main -- renderer/radial.js renderer/radial-draw.js renderer/radial.html` exits 0 (`proof-wayfinder-radial-unchanged`, R2.3). `git diff --exit-code origin/main -- renderer/logic.js renderer/canvas.js renderer/draw.js renderer/page.html templates/.agents/skills/journey-map .agents/skills/journey-map` exits 0 (`proof-wayfinder-lanes-journey-map-untouched`, R4.1). On failure, **abort before wave 3** |
| 08 | Browser smoke note | 07 | `docs/notes/wayfinder-lanes-smoke/wayfinder-lanes-smoke-note.md` | `spawn` | [ ] The smoke note follows the shape of `docs/notes/wayfinder-smoke/wayfinder-smoke-note.md` and records PASS for desktop billing-30 layout, starter/medium/reached bars and panel next step, panel parity with radial for tickets 16, 21, 09 and 24, dim behaviour, OS dark and light recolour without reload, and 375px phone layout with bottom-sheet panel. Proofs: `proof-wayfinder-lanes-smoke-desktop` (R5.1), `proof-wayfinder-lanes-smoke-maps` (R5.2), `proof-wayfinder-lanes-smoke-panel` (R5.3), `proof-wayfinder-lanes-smoke-dim` (R5.4), `proof-wayfinder-lanes-smoke-dark` (R5.5), `proof-wayfinder-lanes-smoke-phone` (R5.6) |
| 09 | **Ship gate** | 08 | — | `inline` | [ ] `pnpm build && pnpm validate` exit 0. Every smoke note row for R5.1–R5.6 is PASS. On failure, **abort before handoff** |

## Wave stops

| Stop | After | Gate |
|------|-------|------|
| **1** | 02 | Unit 01 proofs (R1.1–R1.7). `pnpm test`, `pnpm lint`, `pnpm build && pnpm comments`, `pnpm build && pnpm validate` PASS. **Abort before wave 2** |
| **2** | 07 | Units 03–06 proofs. `pnpm sync:renderer` clean. `pnpm test`, `pnpm lint`, `pnpm build && pnpm comments`, and `pnpm build && pnpm validate` PASS. R2.3 and R4.1 `git diff --exit-code` PASS. **Abort before wave 3** |
| **Ship** | 09 | `pnpm build && pnpm validate` PASS; every R5 smoke row PASS in the note |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
|---|---|---|---|---|---|
| `U-prototype-disposal` | Keep the untracked prototype files on the throwaway branch as a primary source, or delete them | Human | Non-blocking | Delete the untracked `prototypes/` tree once unit 09 passes and the smoke rows are PASS. Do not keep it. | none — resolve before pre-merge closure of the implementing PR, not by a plan unit |

## Frontier order

Spawn units (`Subagent: spawn`) are the ones `code-execute` dispatches to
Composer agents. Gate units are `inline` and own no feature diff.

**Wave 1:** 01 → **02 STOP**

**Wave 2:** (03 ∥ 06) → 04 → 05 → **07 STOP**

**Wave 3:** 08 → **09 STOP**

Units 03 and 06 are the only parallel pair in the plan: their Owns are
disjoint (renderer and build scripts versus skill markdown and skill tests).
Unit 04 waits on 03 because both own `build-canvas.mjs` and
`test/wayfinder-canvas.test.ts`. Unit 05 does not edit those files; it waits
on 04 so the standalone install proof runs `build-canvas.mjs` only after
unit 04 has finished it. Unit 06 depends only on the wave 1 gate (02), not
on 03, so it can run beside 03 after wave 1 passes.

Do not mix waves in one batch to skip a gate unit.

## Decisions

`U-prototype-disposal` is decided. The untracked prototype under `prototypes/` is removed once the ship gate (unit 09) passes, after the smoke check is PASS. It is not kept.

## Approval

Rafael approved this plan on October 23, 2026, as-is, including the prototype deletion decision recorded above.

## Execution / resume section

### Unit 01 — Lanes layout and the four fixtures

| Field | Value |
|-------|-------|
| Unit identifier | 01 — Lanes layout and the four fixtures (wave 1 frontier) |
| Spec/plan paths | `docs/specs/wayfinder-lanes/wayfinder-lanes-spec.md` / `docs/specs/wayfinder-lanes/wayfinder-lanes-plan.md` |
| Obligation / proof status | R1.1–R1.7 — done (`pnpm exec tsx --test test/lanes-layout.test.ts`: 13/13 pass) |
| `HEAD` commit | `419bb01` from `git rev-parse --short HEAD` |
| `git status` summary | dirty — this unit: `renderer/lanes.js`, `test/lanes-layout.test.ts`, `test/fixtures/wayfinder/starter-canvas.json`, `test/fixtures/wayfinder/medium-canvas.json`, plan resume/Approval; unrelated: `?? .claude/launch.json`, `?? prototypes/` |
| Intended diff scope | `renderer/lanes.js`, `test/lanes-layout.test.ts`, `test/fixtures/wayfinder/starter-canvas.json`, `test/fixtures/wayfinder/medium-canvas.json`, plan resume section only |
| Decision on every discrepancy | none — unrelated untracked paths isolated; no commit per wave cadence and explicit no-commit ask |

---
type: spec
title: Wayfinder Skill
description: Ordered units that build the shared renderer and its canvas core, the radial layout, the wayfinder skill and build script, the ADR-004 amendment with the maps validate check and set-dependent setup paths, and the closing smoke, in four gated waves.
status: stable
---

# Wayfinder Skill — plan

**Source:** `docs/specs/wayfinder/wayfinder-spec.md` (status `stable`).
**Next:** All 23 units are done. Before merge, run the pre-merge closure: archive the spec, plan and PRD, then run `harness:validate`.

## Structural gate

Every obligation R1.1–R5.1 in the locked spec names a proof, and each proof has an acceptance box: 38 in all. Thirty-five are checked by `pnpm test`. Three are recorded by hand: `proof-wayfinder-browser-smoke` and `proof-wayfinder-journey-map-smoke` in the smoke note, and `proof-wayfinder-adr-amendment`'s ADR text by inspection. No obligation is left without a check.

Two proofs close one wave later than the spec's acceptance lists, for a reason the spec didn't foresee. `test/skill-sets.test.ts` fails on any template skill folder that no set owns. So `templates/.agents/skills/wayfinder/` can only appear in unit 09, when wave 2 registers the skill. Until then the radial files live in `renderer/` alone, and wave 1 tests them there. That moves two things to unit 09: the wayfinder half of `proof-wayfinder-renderer-copies`, and all of `proof-wayfinder-subset-isolation`. Neither is skipped, and no wave gate is weakened.

Where the spec names one test file, `test/wayfinder-canvas.test.ts`, the plan splits it by unit, so parallel units never own the same file.

## Work units

Paths: `jm/` is `templates/.agents/skills/journey-map/` and `wf/` is `templates/.agents/skills/wayfinder/`. "Synced copies" means the files `pnpm sync:renderer` writes, under both `templates/.agents/skills/<skill>/renderer/` and `.agents/skills/<skill>/renderer/`.

Every `spawn` unit runs as a Sonnet subagent.

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 01 | journey-map's output on `main` is pinned | — | `test/fixtures/journey-map/baseline.json`, `test/renderer-baseline.test.ts` | `inline` | [x] Before any renderer file changes, `baseline.json` holds `validate(map)` and `layout(map)` for every `jm` fixture, computed with `main`'s `logic.js`. The new test recomputes them and passes on the unchanged tree. Proof: `proof-wayfinder-journey-map-unchanged` (baseline part) |
| 02 | One renderer source feeds journey-map | 01 | `renderer/{logic.js,draw.js,page.html,sync.mjs}`, `package.json` (`sync:renderer`), `AGENTS.md` (Layout line), `test/renderer-copies.test.ts`, synced copies | `inline` | [x] `renderer/` holds journey-map's three files, moved byte for byte. `sync.mjs` carries the manifest, with journey-map's entry only, and `pnpm sync:renderer` reports no change. The drift test passes, and in a temp tree it fails naming a changed file, a missing one and a stray `radial.js`, then passes after sync. Proof: `proof-wayfinder-renderer-copies` (journey-map part) |
| 03 | journey-map runs on the extracted canvas core | 02 | `renderer/{canvas.js,draw.js}`, `jm/scripts/build-map.mjs` (inline list), `test/journey-map-render.test.ts` (renderer-region assertion only), `test/canvas-core.test.ts`, synced copies | `spawn` | [x] `canvas.js` holds `showErrors`, `el`, the camera functions, pointer and wheel input and the clipboard write with its fallback, moved from `draw.js` with no behaviour change. `draw.js` calls them through `CanvasCore`. `build-map.mjs` inlines `logic.js`, `canvas.js` and `draw.js`. `baseline.json` still matches, every `jm` render test passes, and the only render-test change is the widened region assertion. No `jm` file names `wayfinder` or `docs/maps`. Proof: `proof-wayfinder-canvas-core` (journey-map part), `proof-wayfinder-journey-map-unchanged`, `proof-wayfinder-journey-map-silent` |
| 04 | Validation allows tickets only when asked | 03 | `renderer/logic.js` (`validate` and the ticket checks), `test/renderer-kinds.test.ts`, synced copies | `spawn` | [x] With the default kinds, `validate` names a `ticket` node as an unknown kind, and `build-map.mjs` exits 1 on it. With `{ kinds: ["ticket"] }`, a ticket-only tree with no `start` passes, and each ticket fault the spec lists names its node. `baseline.json` still matches. Proof: `proof-wayfinder-kinds-gate`, `proof-wayfinder-ticket-checks` |
| 05 | The radial model places every ticket | 02 | `renderer/radial.js` (`model`, `layout`), `test/fixtures/wayfinder/billing-30-canvas.json`, `test/fixtures/wayfinder/billing-30-reached-canvas.json`, `test/radial-model.test.ts` | `spawn` | [x] `radial.js` runs in `node:vm` with no DOM. On the 30-ticket fixture, `model` gives the exact count per state, the frontier, and `reached` false; on the reached variant `reached` is true. An undermined blocker keeps its open dependents off the frontier. `layout` puts each state in its ring, out-of-scope tickets beyond the scope ring and one patch per fog item, with no two circles overlapping. Proof: `proof-wayfinder-model-states`, `proof-wayfinder-layout-rings` |
| 06 | Labels, focus order and copy text hold at 30 tickets | 05 | `renderer/radial.js` (`labels`, `focusOrder`, `handoff`, `copyText`), `test/radial-text.test.ts` | `spawn` | [x] At fitted zoom on the 30-ticket fixture, no two shown labels overlap, and a frontier-ring or patch label is hidden only when it would overlap. The frontier list names every ticket on the frontier ring. `focusOrder` puts the frontier ring first. `handoff` and `copyText` return the spec's exact text for the six ticket states, with and without a note. Proof: `proof-wayfinder-labels-30`, `proof-wayfinder-focus-order`, `proof-wayfinder-copy-text` |
| 07 | The radial page draws through the canvas core | 03, 06 | `renderer/{radial-draw.js,radial.html}`, `test/canvas-core.test.ts` (radial part) | `spawn` | [x] `radial-draw.js` draws the rings, circles, hover, focus and tap edges, the always-drawn undermined arcs, the header counts, the panel, the "All labels" toggle and the keys. It uses `CanvasCore` for the camera, the error panel and copy, and defines none of its own. It has no `innerHTML`. `radial.html` loads only Google Fonts. Proof: `proof-wayfinder-canvas-core` (radial part), `proof-wayfinder-no-html-injection` (grep part) |
| 08 | **Wave 1 gate** | 04, 07 | — | `inline` | [x] `pnpm test` and `pnpm lint` exit 0. `pnpm sync:renderer` reports no change. Every wave 1 proof above has its evidence. Failure → **abort** before wave 2 |
| 09 | wayfinder registers with its own renderer files | 08 | `wf/SKILL.md` (frontmatter, purpose, credit line), `src/setup/skill-sets.ts` (`discovery`), `test/skill-sets.test.ts`, `test/setup-skill-sets.test.ts`, `test/ask-only.test.ts` if it lists skills, `renderer/sync.mjs` (wayfinder manifest), `test/renderer-copies.test.ts` (wayfinder and isolation cases), `test/skill-wayfinder.test.ts` (basics), synced copies | `inline` | [x] `wayfinder` is in `SET_SKILLS.discovery`, the partition test passes with 20 folders, and each count of 19 is now 20. `wf/renderer/` holds exactly wayfinder's five manifest files. In a temp copy, editing `renderer/radial-draw.js` and syncing changes wayfinder's copy and leaves journey-map's folder byte-identical. `SKILL.md` passes `assertSkillBasics` with a third-person "Use when" description, isn't ask-only, runs on an ask or an accepted one-line offer, and credits the method's origin. Proof: `proof-wayfinder-partition`, `proof-wayfinder-renderer-copies`, `proof-wayfinder-subset-isolation`, `proof-wayfinder-skill-basics` |
| 10 | The skill charts and works one ticket per session | 09 | `wf/SKILL.md` (chart, work, checklist), `wf/references/ticket-format.md`, `test/skill-wayfinder.test.ts` | `spawn` | [x] The skill text covers charting (the destination through `grilling`, the five sections, tickets numbered from `01`, answers recorded as closed tickets, resuming an existing slug) and working (claiming first, resolving by kind, one ticket then stop, stale claims past 72 hours, a missing resolving skill). It lists every check in the pre-commit checklist. `ticket-format.md` documents the frontmatter subset and the section rules the build reads. Proof: `proof-wayfinder-skill-chart`, `proof-wayfinder-skill-work`, `proof-wayfinder-skill-checklist` |
| 11 | The skill keeps the map current, offers the canvas and hands off | 10 | `wf/SKILL.md` (update, canvas, handoff, missing pieces), `test/skill-wayfinder.test.ts` | `spawn` | [x] The skill text covers new unknowns, ruling a ticket out, undermining and re-resolving in place, the canvas offer and its rules, feedback editing ticket files, a challenging note starting the undermine step, handoff and archive with link rewriting, and the exact lines to add for each missing install piece. It never tells the agent to edit `.qmd/index.yml` or `AGENTS.md`. Proof: `proof-wayfinder-skill-update`, `proof-wayfinder-skill-canvas`, `proof-wayfinder-skill-handoff`, `proof-wayfinder-skill-missing-pieces` |
| 12 | One command builds a ticket map's canvas | 09 | `wf/scripts/build-canvas.mjs`, `test/fixtures/wayfinder/billing-migration/**` and its error-case folders, `test/wayfinder-canvas.test.ts` | `spawn` | [x] Building the `billing-migration` folder exits 0 with the `wrote` line, writes `<slug>-canvas.json`, equal to `billing-30-canvas.json`, and `<slug>-canvas.html` beside the map. The page loads only Google Fonts. Two builds give the same bytes. A broken `blocked_by`, a cycle and each status-rule breach exit 1 naming the ticket, and the page shows the error panel. A non-flat frontmatter value, a wrong input suffix and a missing `docs/maps/.gitignore` each exit 1 and write nothing. An injected title stays escaped. Proof: `proof-wayfinder-build-writes-canvas`, `proof-wayfinder-build-errors`, `proof-wayfinder-build-input-errors`, `proof-wayfinder-build-deterministic`, `proof-wayfinder-no-html-injection` |
| 13 | Each skill installs and builds alone, and passes a consumer's comment check | 12 | `test/wayfinder-install.test.ts` | `spawn` | [x] `skills --skills wayfinder` and `skills --skills journey-map`, each into a temp dir, copy only the chosen folder. That skill's build runs there and writes a page holding every manifest script's bytes. `findCommentFindings` returns `[]` for both skills' shipped `.js` and `.mjs` files. Proof: `proof-wayfinder-standalone`, `proof-wayfinder-comments-clean` |
| 14 | Listings and this repo's copy include wayfinder | 11, 12 | `README.md`, `site/skills.md`, `.agents/skills/wayfinder/**` (non-renderer files), `AGENTS.md` (skills table row) | `spawn` | [x] `README.md` and `site/skills.md` list `wayfinder` in the discovery set and say twenty skills. `AGENTS.md` lists it. The repo's installed copy is byte-identical to the template. Proof: `proof-wayfinder-listings` |
| 15 | **Wave 2 gate** | 13, 14 | — | `inline` | [x] `pnpm build`, `pnpm test`, `pnpm lint`, `node dist/cli.js validate` and `pnpm comments` pass, and `pnpm sync:renderer` reports no change. Every wave 2 proof has its evidence. Failure → **abort** before wave 3 |
| 16 | ADR-004 records the maps check and set-dependent paths | 15 | `docs/adrs/adr-004-standalone-skills-contract.md` | `inline` | [x] Through the `adr` skill, ADR-004 gains a dated amendment: `profile-map-doc` as a warning code in the finding-code table, and `setup` paths that depend on the chosen skill set, starting with `docs/maps/`, its `.gitignore`, the `maps` collection and the router row. The Human approves the amendment text before the unit closes. `validate` resolves every ADR-004 claim. Proof: `proof-wayfinder-adr-amendment` (ADR part) |
| 17 | `validate` warns on map docs and skips tickets | 16 | `src/validate/profile.ts`, `test/validate-maps.test.ts`, `test/contract.test.ts` (the new code) | `spawn` | [x] With `type: map`, the main doc passes. Another type, a missing `<slug>-map.md` and a flat file under `docs/maps/` each warn `profile-map-doc` and exit 0. Ticket files and `docs/maps/archived/**` give no finding. The contract test lists the code as a warning. Proof: `proof-wayfinder-validate-maps`, `proof-wayfinder-adr-amendment` (contract-test part) |
| 18 | `setup` adds maps pieces only with discovery | 16 | `src/setup/{skill-sets.ts,apply.ts,render-wolven.ts}`, `templates/docs/maps/{.gitkeep,gitignore}`, `templates/WOLVEN.md`, `templates/.qmd/index.yml`, `test/setup-maps.test.ts` | `spawn` | [x] `setup --skills discovery` creates `docs/maps/.gitkeep`, a `docs/maps/.gitignore` holding exactly the two canvas lines, the `maps` collection and the maps row, with no marker text left. `ship` and `none` create none of them. A second run leaves every existing file byte-identical. Proof: `proof-wayfinder-setup-discovery`, `proof-wayfinder-setup-absent`, `proof-wayfinder-setup-rerun` |
| 19 | The writing profile documents maps | 16 | `templates/docs/WRITING-PROFILE.md`, `docs/WRITING-PROFILE.md`, `test/writing-profile-maps.test.ts` | `spawn` | [x] Both profiles document `docs/maps/<slug>/<slug>-map.md` and `type: map`. Proof: `proof-wayfinder-writing-profile` |
| 20 | **Wave 3 gate** | 17, 18, 19 | — | `inline` | [x] `pnpm build`, `pnpm test`, `pnpm lint`, `node dist/cli.js validate` and `pnpm comments` pass. Every wave 3 proof has its evidence. Failure → **abort** before wave 4 |
| 21 | A fresh agent charts a map from the skill alone | 20 | `test/fixtures/wayfinder/reference/**`, `test/wayfinder-canvas.test.ts` (reference case) | `spawn` | [x] A subagent given only the installed `wayfinder` folder charts a map with five tickets, one blocker chain and one Not yet specified item. Its folder is committed as the fixture, and a test asserts the build exits 0. Proof: `proof-wayfinder-reference-map` |
| 22 | Both canvases are smoke-tested in a browser | 21 | `docs/notes/wayfinder-smoke/wayfinder-smoke-note.md` | `spawn` | [x] Over a loopback server, each step and its result is written into the note. For the wayfinder canvas: Tab, Enter, Escape and `L`; a tap opening the panel and showing edges; edges on hover only; undermined arcs always drawn; "Take this ticket" copying, and the fallback under a `clipboard-write` denial; the fonts falling back when Google Fonts is blocked; the reached map. For journey-map, the LotR fixture and `malformed-map.json` built from `main` and from the branch, compared side by side: pan, zoom, fit, the camera moving on a choice, the error panel, and copy with its fallback. Proof: `proof-wayfinder-browser-smoke`, `proof-wayfinder-journey-map-smoke` |
| 23 | **Ship gate** | 22 | — | `inline` | [x] `pnpm test` and `node dist/cli.js validate` pass, and every acceptance box in the spec is ticked with evidence. `git diff main` shows no change to `jm/SKILL.md`, `jm/references/**`, `src/comments/**` or any other shipped skill folder. Failure → **abort**; do not hand off |

## Wave stops

| Stop | After | Gate |
|------|-------|------|
| **1** | 08 | `pnpm test` + `pnpm lint` PASS; sync reports no change; wave 1 proofs inspectable. **Abort before wave 2** on failure |
| **2** | 15 | `pnpm build`, `pnpm test`, `pnpm lint`, `validate`, `pnpm comments` PASS; sync reports no change. **Abort before wave 3** on failure |
| **3** | 20 | The same five commands PASS, with ADR-004 amended first. **Abort before wave 4** on failure |
| **Ship** | 23 | `pnpm test` + `validate` PASS; every acceptance box ticked; the unchanged surfaces unchanged |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
|---|---|---|---|---|---|
| `U-first-real-map` | Whether the UX engagement goes ahead and supplies the first real map | Rafael | Non-blocking: unit 21 uses a map a subagent charts from the skill alone | *(empty until decided)* | — |

## Frontier order

**Wave 1:**
```
01 → 02 → ((03 → 04) ∥ (05 → 06)) → 07 → 08 STOP
```
Units 03 and 04 both run the sync over journey-map's copies, so they go in sequence. Units 05 and 06 touch only `renderer/radial.js` and their own tests, so they run beside them.

**Wave 2:**
```
09 → ((10 → 11) ∥ (12 → 13)) → 14 → 15 STOP
```
Unit 09 is inline because the partition test, the counts and the first wayfinder copy must land together.

**Wave 3:**
```
16 → (17 ∥ 18 ∥ 19) → 20 STOP
```
Unit 16 waits for the Human to approve the amendment.

**Wave 4:**
```
21 → 22 → 23 STOP
```

Never pack a later wave into an earlier wave's mutate batch to skip its gate.

## Execution / resume section

Cadence: the Human chose a commit per wave, after each wave gate passes. Unit 01 was committed on its own first (`93b2d28`). Wave 1 (units 02 to 08) is committed together after its gate passed. Decisions taken during wave 1:
- Unit 03 also owned journey-map's manifest entry in `renderer/sync.mjs`. It hand-copied `build-map.mjs` into `.agents/skills/journey-map/scripts/` so `test/skill-copies.test.ts` keeps the installed copy identical.
- Unit 04: `kinds` replaces the six flow kinds rather than adding to them, and the wayfinder build passes `["ticket"]`. The parent reworded the `undermined_by` status error.
- Unit 05 fixed the canvas JSON shape, which `build-canvas.mjs` must reproduce in unit 12. Scalar arrays are written inline, so biome accepts the fixtures.
- Unit 07's page reads a non-empty `errors` array in the canvas JSON and shows it through `CanvasCore.showErrors`. Unit 12's build writes the error page that way.
- Wave 1 gate: `test/setup-skill-sets.test.ts` and `test/skills-command.test.ts` list journey-map's installed files. No unit owned those lists, so `renderer/canvas.js` was added to them at the gate.
- A visual note for unit 22: labels sit about 10px left of their circle's centre, and at 1280x800 the outer ring can meet the header when its counts wrap.

Wave 2 (units 09 to 15) is committed together after its gate passed: build, 782 tests, lint, validate and comments clean, and sync reported no change. Decisions taken during wave 2:
- `.agents/skills/wayfinder/` exists from unit 09, and `test/skill-copies.test.ts` needs it to equal the template. Each unit copied the wayfinder files it wrote into that installed folder, and unit 14 found no difference between the two.
- The discovery install line in `test/setup-skill-sets.test.ts` now says 7 skills.
- Unit 12's source fixture folder is `test/fixtures/wayfinder/billing-30/`, not `billing-migration/`, because the expected JSON's `dir` is `docs/maps/billing-30`. On a build error, only the page is written, and its map data carries `errors`. No `<slug>-canvas.json` is written.
- The parent changed unit 11's text so the router row goes in `WOLVEN.md`, as the PRD's AC-6.1 says. The skill now also forbids editing `WOLVEN.md` itself.
- Unit 18 must write the router row in `templates/WOLVEN.md` exactly as the skill prints it: `` | `docs/maps/<slug>/` | Maps of a large decision: `docs/maps/<slug>/<slug>-map.md` plus one file per ticket | ``. If the wording changes, the skill and `test/skill-wayfinder.test.ts` change with it.
- Unit 13's consumer comment check found six `/* ---- … ---- */` banners in `renderer/radial-draw.js`. This repo's `pnpm comments` doesn't scan `renderer/`, so it had missed them. The parent removed the banners and re-synced the copies.
- No unit owned the `proof-wayfinder-listings` test, so the parent added it to `test/skill-wayfinder.test.ts` at the gate.

Wave 3 (units 16 to 20) is committed together after its gate passed: build, 792 tests, lint, validate and comments clean, and sync reported no change. Decisions taken during wave 3:
- Unit 16: the `adr` skill has create, promote and supersede, but no amend. So ADR-004 is amended in place, following its earlier dated entries, and stays `stable`. The Human approved the text as written on 2026-10-14.
- Unit 17 changes maps findings in one pass at the end of the profile check, because the flat-layout and missing-main-doc findings come from outside the per-file loop. `test/contract.test.ts` reads the codes from ADR-004's table, so it needed no edit.
- Unit 18 also changed `src/setup/index.ts` by one line, to pass the chosen sets to `applyTemplates`. It updated the expected file and collection lists in `test/setup-surfaces.test.ts` and `test/setup-layout.test.ts`.
- At the gate, both writing profiles' list of checked folders gained `maps`.

### Unit 21 — A fresh agent charts a map from the skill alone

| Field | Value |
|-------|-------|
| Unit identifier | 21 — A fresh agent charts a map from the skill alone (wave 4, first unit) |
| Spec/plan paths | `docs/specs/wayfinder/wayfinder-spec.md` / `docs/specs/wayfinder/wayfinder-plan.md` |
| Obligation / proof status | R3.9 `proof-wayfinder-reference-map`: done. The fixture is at `test/fixtures/wayfinder/reference/`, and its build test passes |
| `HEAD` commit | `9a54aae` |
| `git status` summary | dirty: this plan only |
| Intended diff scope | `test/fixtures/wayfinder/reference/**`, `test/wayfinder-canvas.test.ts` (reference case) |
| Decision on every discrepancy | A spawned agent that sees the repo's spec and tests isn't working "from the skill alone". Resolved: the charting agent works in a scratch repo that holds only the installed skill and the `docs/maps/` pieces. It plays both sides of the `grilling` step, with the destination given. The parent copies its folder into the fixture and adds the test |

Unit 21 found three gaps in the skill, all fixed:
- The map's frontmatter had no `title`, and the build wrote `"title": undefined`, which is invalid JSON, yet still exited 0. Now:
  - `ticket-format.md` and charting step 3 require `title` and `description`, as the writing profile does.
  - The build exits 1 naming the map file, and a test covers this.
  - The JSON writer skips keys whose value is `undefined`.
- Charting had no rule for a missing `grilling`. The agent now asks the same questions itself and names the install command.
- The format didn't say what to do with an empty section, or what a Decisions-so-far item looks like. It now says.

Wave 4 (units 21 to 23) is committed together after the ship gate passed:
- build, 794 tests, lint, validate and comments clean, and sync reported no change
- no change against the merge base to journey-map's `SKILL.md` or `references/`, to `src/comments/`, or to any other shipped skill
- all 38 acceptance boxes in the spec ticked, each with its evidence

Unit 22's smoke found two layout faults in `radial-draw.js`, both now fixed and re-checked in the browser:
- Labels were drawn from the left edge of an estimated width. They now sit centred, 0 px from their circle.
- The fitted camera ignored a header whose counts wrap. It now keeps the map below the header: at 1280x800 the header ends at y=129 and the ring starts at y=140.

The smoke note records two untested checks with their reasons: a real clipboard success, which the pane denies, and journey-map's pinch zoom, which needs multi-touch.

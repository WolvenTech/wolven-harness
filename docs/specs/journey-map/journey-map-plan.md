---
type: spec
title: Journey Map Skill
description: Ordered units that port the accepted journey-map prototype into a discovery-set skill, in three gated waves — renderer and build script, skill text and install, then the reference map and browser smoke.
status: stable
---

# Journey Map Skill — plan

**Source:** `docs/specs/journey-map/journey-map-spec.md` (status `stable`).
**Prototype:** ported in wave 1; the record is `docs/notes/journey-map-prototype/journey-map-prototype-note.md`.
**Next:** After the Human approves → `code-execute`, wave 1 first.

## Structural gate

Every obligation R1.1–R7.4 in the locked spec names a proof. There are 28 proofs, each with an acceptance box. Twenty-two are checked by `pnpm test`. Six are manual browser checks, recorded in the smoke note in unit 14. Three proofs (`proof-journey-map-malformed`, `proof-journey-map-ticket-status`, `proof-journey-map-cdn-failure`) are split between a test part and a build or smoke part, and the units below name which part they close. No obligation is left without a check.

## Work units

All paths under `templates/.agents/skills/journey-map/` are written as `jm/` below.

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 01 | Tree validation names the bad node | — | `jm/renderer/logic.js` (`validate`), `test/journey-map-render.test.ts`, `test/fixtures/journey-map/lotr-map.json`, `test/fixtures/journey-map/malformed-map.json` | `spawn` | [ ] `JourneyMapLogic.validate`, run in `node:vm`, returns one error per bad node for every case R1.3 lists, and `[]` for the LotR fixture. The code is readable and every comment is `why:`/`hazard:`/`invariant:` or JSDoc. Proof: `proof-journey-map-malformed` (validate part) |
| 02 | Layout places every node, and tickets show their state | 01 | `jm/renderer/logic.js` (`M`, `rows`, `height`, `layout`, `blocked`, `ticketStyle`), `test/journey-map-render.test.ts` | `spawn` | [ ] On both fixtures: no two boxes overlap, a shared node sits at its longest-path column, and `height(n)` matches `rows(n)` for every node. The three statuses give distinct styles, the dependency edges exist, and `blocked` flips when a blocker closes. Proof: `proof-journey-map-layout`, `proof-journey-map-ticket-status` (test part), `proof-journey-map-ticket-blocked` |
| 03 | Reveal and fading follow the Human's answers | 02 | `jm/renderer/logic.js` (`revealed`, `faded`), `test/journey-map-render.test.ts` | `spawn` | [ ] Empty answers reveal `shire`, `route` and the four tickets only. `route: road` adds `bree`, `rivendell` and `pack` and not `forest`. `pack` waits for `done`. `faded` spares `rivendell`, and unticking `rope` fades `descent` as "later" and ticking restores it. Proof: `proof-journey-map-reveal-choice`, `proof-journey-map-reveal-continue`, `proof-journey-map-fade-choice`, `proof-journey-map-fade-checklist` |
| 04 | Feedback text names each touched node | 03 | `jm/renderer/logic.js` (`feedback`), `test/journey-map-render.test.ts` | `spawn` | [ ] Answers with a choice and a note on one node, a checklist toggle and a typed text give the spec's exact string: separate answer and note lines, comma-and-space keys, JSON-escaped text, layout order, untouched nodes left out. Proof: `proof-journey-map-feedback-text` |
| 05 | The page draws, reveals and toggles | — | `jm/renderer/page.html`, `jm/renderer/draw.js` | `spawn` | [ ] The ported page shell and drawing match the prototype's look and behaviour: reveal on choice and Continue, the "Show whole map" toggle, notes, Copy for agent with the textarea fallback, the camera wait, and the error panel and CDN message. `draw.js` has no `innerHTML`, and the rough.js tag carries the pinned `integrity` and `crossorigin`. Every comment follows the comment rule. Proof: `proof-journey-map-no-html-injection` (grep part), `proof-journey-map-cdn-failure` (tag part) |
| 06 | One command builds a self-contained page | 04, 05 | `jm/scripts/build-map.mjs`, `test/journey-map-render.test.ts` | `spawn` | [ ] Building the LotR fixture and a second fixture exits 0 with the `wrote` line. Both pages carry a byte-identical renderer and load only the three allowed hosts. Two builds give the same bytes. A malformed tree writes the error page, prints node-named lines and exits 1. A bad path, missing file or invalid JSON exits 1 and writes nothing. An injected label stays escaped. Proof: `proof-journey-map-build-writes-page`, `proof-journey-map-renderer-identical`, `proof-journey-map-malformed` (build part), `proof-journey-map-deterministic`, `proof-journey-map-build-input-errors`, `proof-journey-map-no-html-injection` (build part); the integrity hash matches the fetched rough.js file for `proof-journey-map-cdn-failure` (test part) |
| 16 | The new folder is a registered discovery skill | — | `src/setup/skill-sets.ts`, `test/skill-sets.test.ts`, `test/setup-skill-sets.test.ts`, `test/ask-only.test.ts` | `inline` | [ ] `journey-map` is in `SET_SKILLS.discovery` and in `test/ask-only.test.ts`'s expected list. The partition test passes with 19 template folders, and every hard-coded count of 18 is now 19. Proof: `proof-journey-map-partition` |
| 07 | **Wave 1 gate** | 06, 08, 16 | — | `inline` | [ ] `pnpm test` and `pnpm lint` exit 0. Every wave 1 acceptance box in the spec has its evidence. Failure → **abort** before wave 2 |
| 08 | Skill text drives the build and the feedback loop | — | `jm/SKILL.md`, `jm/references/tree-format.md`, `test/skill-journey-map.test.ts` | `spawn` | [ ] `SKILL.md` passes `assertSkillBasics` with a third-person "Use when" description, and isn't ask-only. It runs when the Human asks or accepts a one-line offer. It covers: <ul><li>writing beside the served doc, or a draft note first, then `harness:validate`</li><li>writing only the JSON and running `build-map.mjs` after every write</li><li>fixing the tree on exit 1</li><li>opening the page in a browser tool when there is one</li><li>Copy for agent, then revise and rebuild</li><li>in Claude, publishing and republishing to the same URL</li><li>a map is a design aid that moves with its doc folder</li></ul> `tree-format.md` documents every field and rule in the spec's Map tree section with one small example. Neither file names `wayfinder` or `docs/maps/`. Proof: `proof-journey-map-skill-basics`, `proof-journey-map-skill-placement`, `proof-journey-map-skill-build-step`, `proof-journey-map-skill-feedback-loop`, `proof-journey-map-skill-lifecycle` |
| 09 | `discovery` installs the skill, and other sets don't | 07 | `test/skills-command.test.ts`, `test/setup-skill-sets.test.ts` | `spawn` | [ ] `setup --skills discovery` and `skills --skills journey-map` write `journey-map/` with `SKILL.md`, the renderer and the script. `--skills ship` and `--skills none` don't. Proof: `proof-journey-map-install` |
| 10 | Shipped scripts pass a consumer's comment check | 07 | `test/journey-map-render.test.ts` | `spawn` | [ ] A temp repo that commits a base, then adds the skill's `.js` and `.mjs` files, gets `[]` from `findCommentFindings`. Proof: `proof-journey-map-comments-clean` |
| 11 | Listings and this repo's copy include the skill | 09 | `README.md`, `site/skills.md`, `.agents/skills/journey-map/**`, `AGENTS.md` (skills table row) | `spawn` | [ ] `README.md` and `site/skills.md` list `journey-map` in the discovery set, with the new skill count. The repo copy is byte-identical to the template, and `AGENTS.md` lists the skill. Proof: `proof-journey-map-listings` |
| 12 | **Wave 2 gate** | 09, 10, 11 | — | `inline` | [ ] `pnpm build`, `pnpm test`, `pnpm lint`, `node dist/cli.js validate` and `pnpm comments` all pass. Every wave 2 acceptance box has its evidence. Failure → **abort** before wave 3 |
| 13 | A fresh agent draws the reference map from the skill alone | 12 | `test/fixtures/journey-map/harness-init-redesign-map.json`, `test/journey-map-render.test.ts` | `spawn` | [ ] A subagent given only the installed skill folder and the step list from the published `harness-init` prototype writes the tree. It builds with exit 0. A test asserts each node R6.5 lists exists, reached from a `setup` tree by a link. Proof: `proof-journey-map-reference-map` |
| 14 | Browser smoke is recorded | 13 | `docs/notes/journey-map-smoke/journey-map-smoke-note.md` | `spawn` | [ ] Over a loopback server, with each step and its result written into the note: <ul><li>reveal on choice and on Continue, with the camera move</li><li>"Show whole map" on and off, keeping answers</li><li>a full Tab, Enter and Space pass, including the toggle</li><li>a 4px drag that chooses nothing</li><li>an upward link that crosses no card</li><li>the clipboard fallback under a `clipboard-write` denial</li><li>a pane still sizing that opens at a readable zoom</li><li>the ticket look</li><li>the blocked-CDN message under a test CSP</li></ul> Proof: `proof-journey-map-browser-smoke`, `proof-journey-map-clipboard-fallback`, `proof-journey-map-camera-wait`, `proof-journey-map-ticket-status` (smoke part), `proof-journey-map-cdn-failure` (smoke part) |
| 15 | **Ship gate** | 14 | — | `inline` | [ ] `pnpm test` and `node dist/cli.js validate` pass. Every spec acceptance box is ticked with evidence. `git diff` against `main` shows no change under `src/validate/`, `src/comments/`, `docs/adrs/` or any other shipped skill folder. Failure → **abort**; do not hand off |

## Wave stops

| Stop | After | Gate |
|------|-------|------|
| **1** | 07 | `pnpm test` + `pnpm lint` PASS; wave 1 proofs inspectable. **Abort before wave 2** on failure |
| **2** | 12 | `pnpm build`, `pnpm test`, `pnpm lint`, `validate`, `pnpm comments` PASS. **Abort before wave 3** on failure |
| **Ship** | 15 | `pnpm test` + `validate` PASS; all acceptance boxes ticked; the unchanged surfaces are unchanged |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
|---|---|---|---|---|---|
| `U-cdn-client-repos` | Whether maps that load jsDelivr and Google Fonts are acceptable in a client's repo for the UX engagement | Rafael | Non-blocking | Decided 2026-10-13 by Rafael: CDNs are acceptable in a client's repo. A client that restricts them vendors rough.js and the fonts by hand; the skill doesn't change | — |

## Frontier order

**Wave 1:**
```
(01 → 02 → 03 → 04  ∥  05  ∥  08) → 06 → 16 → 07 STOP
```
- 16 runs once 01 has created the skill folder. It goes right before the gate, so the partition test sees the folder registered.
- 08 moved into wave 1 because `test/ask-only.test.ts` reads every registered skill's `SKILL.md`. It owns only the skill text and its test, so it runs in parallel with A and B.
- 01–04 extend `logic.js` and its test file in turn, so they run in order.
- 05 owns only the page shell and `draw.js`, which call the logic API the spec freezes, so it runs in parallel from the start.

**Wave 2:**
```
(09 → 11  ∥  10) → 12 STOP
```
- 10 owns only the comment test, so it runs alongside 09 and 11.
- 11 copies the finished skill, so it waits for 09.

**Wave 3:**
```
13 → 14 → 15 STOP
```
- 13 must be a fresh subagent: proving the skill works alone is its whole point.

## Dispatch and token budget

The orchestrator is the Opus session that runs `code-execute`. It keeps its context for decisions, gates and commits. Sonnet subagents do every unit that reads or writes renderer code or skill text. Each `spawn` unit still gets its own builder brief and returns its own report. The table below sets which agent receives that brief.

| Agent | Model | Units, in order | How it starts | Why this grouping |
|---|---|---|---|---|
| A, logic | `sonnet` | 01 → 02 → 03 → 04 → 06, then 10 in wave 2 | Spawned for 01, then continued with `SendMessage` for each next unit's brief | All six units share `logic.js` and `test/journey-map-render.test.ts`. A warm agent reads the prototype and spec once instead of six times |
| B, page | `sonnet` | 05 | Spawned at the start of wave 1, in parallel with A | Owns only `page.html` and `draw.js`, the largest prototype files. Keeps them out of A's and the orchestrator's context |
| C, skill | `sonnet` | 08 (wave 1), then 09 → 11 (wave 2) | Spawned for 08 in wave 1, then continued with `SendMessage` | 09 and 11 are small and need to know the finished skill folder that C just wrote |
| D, fresh reader | `sonnet` | 13 (writes the fixture JSON only) | Spawned with only the installed skill folder path and the `harness-init` step list. No spec, plan, prototype or tests | The proof is that the skill stands on its own. A then adds the 13 test assertion through `SendMessage` |
| E, smoke | `sonnet` | 14 | Spawned with the browser tools | Keeps screenshots, the heaviest output, out of the orchestrator's context. If a subagent can't reach the browser, 14 runs inline instead, and the plan records that |
| Orchestrator | `opus` | 16, 07, 12, 15, and every commit | Inline | Gates and commits must be trusted, and they're cheap when output is trimmed |

**Orchestrator rules**

- Before wave 1, run `pnpm build` once so `dist/` exists for every subagent's `harness:comments` and `harness:validate` final check. No unit changes `src/validate/` or `src/comments/`, so that build stays current.
- Don't read renderer, prototype or test files yourself. Read only the subagent reports, `git diff --stat`, and gate output trimmed with `| tail -20`.
- Write briefs that point to paths and spec sections (the Design section and the unit's R-rows) instead of pasting their content. Paste only the unit row, as the builder brief requires.
- Ask every subagent to keep its report to about 25 lines: pass or fail per Done-when item with the command that proved it, the files changed, and blockers. It pastes only the last lines of test output, plus the two final-check outputs the brief requires.
- Re-brief the same agent with `SendMessage` rather than spawning a new one whenever the next unit shares its files. Spawn a new agent only for the reasons in the table.
- Commit once per wave, at its gate unit, through `code-commit`, with that wave's plan-completion marks in the same commit.

Never pack a later wave into an earlier wave's batch to skip its gate unit.

## Execution / resume section

### Units 01 and 05 — wave 1, started in parallel

| Field | Value |
|-------|-------|
| Unit identifier | 01 — Tree validation names the bad node (agent A, frontier head); 05 — The page draws, reveals and toggles (agent B, parallel) |
| Spec/plan paths | `docs/specs/journey-map/journey-map-spec.md` / `docs/specs/journey-map/journey-map-plan.md` |
| Obligation / proof status | R1.3 `proof-journey-map-malformed` (validate part) — pending; R2.6 `proof-journey-map-no-html-injection` (grep part), R7.3 `proof-journey-map-cdn-failure` (tag part) — pending |
| `HEAD` commit | `898d2c2` |
| `git status` summary | dirty, all outside both units' Owns: the PRD amendment, the stable spec, this plan and `docs/notes/journey-map-prototype/`, from the planning session |
| Intended diff scope | 01: `templates/.agents/skills/journey-map/renderer/logic.js`, `test/journey-map-render.test.ts`, `test/fixtures/journey-map/{lotr-map,malformed-map}.json`; 05: `templates/.agents/skills/journey-map/renderer/{page.html,draw.js}` |
| Decision on every discrepancy | Resolved: unit 08 moved into wave 1 (agent C, in parallel), because `test/ask-only.test.ts` reads every registered skill's `SKILL.md`; this follows from the Human-approved registration fix. Resolved: the planning docs are isolated, and no unit touches them. Resolved: the wave 1 partition gap was fixed by adding unit 16, approved by the Human. Commit cadence: `.agents/code-commit.config.yml` is absent, so `autocommit: false` by default. No automatic commits; the plan's "commit once per wave" applies only if the Human asks |

### Wave 1 gate (unit 07) — passed, not committed

| Field | Value |
|-------|-------|
| Unit identifier | 07 — Wave 1 gate, after units 01–06, 08 and 16 |
| Spec/plan paths | `docs/specs/journey-map/journey-map-spec.md` / `docs/specs/journey-map/journey-map-plan.md` |
| Obligation / proof status | Done: R1.1, R1.2, R1.3 (validate and build parts), R1.4, R2.1–R2.4, R2.6, R3.1, R4.1 (partition, moved into wave 1), R5.1 and R5.2 (test parts), R6.1–R6.4 and R3.3 (skill text, moved into wave 1), R7.1, R7.2, R7.3 (tag and hash). The rough.js sha384 was verified against the CDN file. Pending: wave 2 (09, 10, 11) and wave 3 |
| `HEAD` commit | `898d2c2` |
| `git status` summary | dirty: wave 1 work (`templates/.agents/skills/journey-map/`, `src/setup/skill-sets.ts`, four test files, `test/fixtures/`) plus the uncommitted planning docs |
| Intended diff scope | matches the Owns of units 01–06, 08 and 16 |
| Decision on every discrepancy | Gate run in this session: `pnpm test` 641/641, `pnpm lint` clean, `pnpm comments` ok, `pnpm validate` ok. A browser check of a page built with the ported renderer showed reveal on choice and no console errors. `autocommit: false` (default), so the plan marks stay unflipped and nothing is committed until the Human asks. A stray `lotr-map.html` and a `.DS_Store` in `docs/notes/journey-map-prototype/prototype/` were removed |

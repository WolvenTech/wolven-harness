---
type: spec
title: Journey-map reload persistence — plan
description: Work-unit plan for localStorage persistence, empty-copy UX, and journey-map skill doc updates.
status: stable
---

# Journey-map reload persistence — plan

**Spec:** `docs/specs/journey-map-reload-persistence/journey-map-reload-persistence-spec.md` (status `stable`)

## Structural gate

Confirmed: obligations R1.1–R8.1 each map to a named proof (`proof-journey-map-reload-three-notes` through `proof-journey-map-reload-gates-pass`). No gaps.

## Work units

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 01 | Persistence helpers in `logic.js` (hash, storage key, load/save payload, empty-copy detection) | — | `renderer/logic.js`, `test/journey-map-render.test.ts` | `spawn` | [x] `mapContentHash`, `storageIdentity`, and `storageKey` match Design (path → pathname → `(no-path)`); load rejects wrong hash and accepts matching blob; empty-copy helper detects header-only `feedback()`; unrevealed-node note still in layout order (`proof-journey-map-reload-hash-invalidate`, `proof-journey-map-storage-key-fallback`, `proof-journey-map-empty-copy-message`, `proof-journey-map-reload-unrevealed-note`, `proof-journey-map-copy-header-unchanged`) |
| 02 | Storage throw fallbacks on pure load/save helpers | 01 | `renderer/logic.js`, `test/journey-map-render.test.ts` | `spawn` | [x] Mocked `localStorage` that throws on `getItem` yields empty state; throws on `setItem` do not propagate (`proof-journey-map-storage-read-fallback`, `proof-journey-map-storage-write-fallback`) |
| 03 | **Wave 1 gate** | 01, 02 | — | `inline` | [x] `pnpm build && pnpm test && pnpm lint && pnpm validate` exit 0; Wave 1 spec acceptance rows verifiable — **abort before Wave 2** on failure |
| 04 | Wire `draw.js`: restore on load, persist on change, clear on **Start over**, sticky notes without `noteOpen` | 03 | `renderer/draw.js`, `test/journey-map-render.test.ts` | `spawn` | [x] Three-note round-trip through save/load path; reset removes storage entry; restored notes show sticky preview only (`proof-journey-map-reload-three-notes`, `proof-journey-map-reload-start-over-clears`, `proof-journey-map-restore-sticky-not-editor`) |
| 05 | Empty-copy panel UX on **Copy for agent** | 04 | `renderer/draw.js`, `test/journey-map-render.test.ts` | `inline` | [x] Empty walk opens feedback panel with explicit message and does not copy header-only text; non-empty copy unchanged (`proof-journey-map-empty-copy-message`, `proof-journey-map-copy-header-unchanged`) |
| 06 | Skill docs and renderer sync | 05 | `templates/.agents/skills/journey-map/SKILL.md`, `templates/.agents/skills/journey-map/references/tree-format.md`, `test/skill-journey-map.test.ts` | `inline` | [x] Skill text documents persistence, hash invalidation, and empty copy; drops "not saved across reloads"; `pnpm sync:renderer` copies `logic.js` and `draw.js` with no drift (`proof-journey-map-skill-persistence-docs`) |
| 07 | **Wave 2 / ship gate** | 06 | `docs/specs/journey-map-reload-persistence/journey-map-reload-persistence-spec.md` (acceptance boxes) | `inline` | [x] `pnpm build && pnpm test && pnpm lint && pnpm sync:renderer && pnpm validate` exit 0; Wave 2 acceptance evidence ready (`proof-journey-map-reload-gates-pass`) |

## Wave stops

| Stop | After | Gate |
|------|-------|------|
| **1** | Unit 03 | `pnpm build && pnpm test && pnpm lint && pnpm validate` PASS — **abort before Wave 2** |
| **Ship** | Unit 07 | Same commands plus `pnpm sync:renderer` (no drift) PASS — hand off to `code-execute` closeout / commit cadence |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
|---|---|---|---|---|---|
| `U-storage-prune` | Maximum keys or size policy when many maps share an origin | Rafael | Non-blocking | Defer until a reported `QuotaExceededError` or support ticket. No LRU in this initiative. | — |
| `U-host-remount` | Whether claude.ai iframe remount clears `localStorage` | n/a | Non-blocking | Out of PRD scope — renderer restores when the page loads with storage available. | — |

## Frontier order

**Wave 1:** 01 → 02 → **03 STOP**

**Wave 2:** 04 → 05 → 06 → **07 STOP**

Units 01 and 02 are sequential so storage I/O tests call the same exported helpers added in 01. Unit 05 depends on 04 because empty-copy runs in the copy handler beside persistence. Unit 06 runs after renderer behavior is final so skill copy matches shipped behavior.

## Execution / resume section

### Unit 03 — Wave 1 gate

| Field | Value |
|-------|-------|
| Unit identifier | 03 — Wave 1 gate (Wave 1 complete) |
| Spec/plan paths | `docs/specs/journey-map-reload-persistence/journey-map-reload-persistence-spec.md` / `docs/specs/journey-map-reload-persistence/journey-map-reload-persistence-plan.md` |
| Obligation / proof status | R1.2, R2.1, R3.1, R4.1–R4.2, R5.1 — done via logic helpers and tests |
| `HEAD` commit | `b5237e4` (pre-wave-1 commit) |
| `git status` summary | dirty — wave 1 Owns pending commit |
| Intended diff scope | `renderer/logic.js`, `test/journey-map-render.test.ts` (persistence tests) |
| Decision on every discrepancy | none |

### Unit 07 — Wave 2 / ship gate

| Field | Value |
|-------|-------|
| Unit identifier | 07 — Wave 2 / ship gate |
| Spec/plan paths | same as above |
| Obligation / proof status | R1.1, R1.3, R3.1–R3.2, R6.1, R7.1, R8.1 — done |
| `HEAD` commit | after wave 1 commit |
| `git status` summary | dirty — wave 2 Owns pending commit |
| Intended diff scope | `renderer/draw.js`, skill templates and mirrors, `known-forms.json`, `test/skill-journey-map.test.ts`, spec acceptance, plan marks |
| Decision on every discrepancy | Resolved: `pnpm gen:known-forms` after SKILL.md edit; copied skill docs to `.agents` and `.claude` for lean-init parity |

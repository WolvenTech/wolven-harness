---
type: spec
title: Install and use experience — iteration 2 plan
description: Work units for the iteration-2 spec. Wave 1 fixes the config rerun and Gemini's entry on PR 75's branch. Wave 2 merges that branch into PR 76's and adds the linked-key and doctor proofs. A finding map and a closing unit re-report F15 and F16.
status: stable
---

# Install and use experience — iteration 2 plan

**Spec:** `docs/specs/install-experience/install-experience-iteration-2-spec.md` (`stable`), which amends the iteration-1 spec.
**Next:** after the Human approves → `code-execute` in Codex, wave 1, then wave 2.

## Structural gate

- Every row the spec adds or amends (R2.3, R15.1, R15.2, R16.1, R16.2, R16.3) names one proof that no other row uses.
- Each wave's gate is named in the spec's Eval / gates table.
- F15 and F16 each map to rows, and so to units below.

Gate passed.

## Branches and commits

- **Wave 1** runs on `claude/install-wiring` (PR 75).
- **Wave 2** runs on `claude/install-check-and-repair` (PR 76), after unit 05 merges `claude/install-wiring` into it.
- `.agents/code-commit.config.yml` sets `autocommit: true` and `autocommit-rule: wave`, so `code-execute` commits once at each wave gate. Unit 05's merge is its own commit.
- Pushing both branches and refreshing the PR bodies belong to `code-pr`; replying to and resolving the two review threads on PR 75 belong to `code-ci`. Both run on the Human's ask.

## Work units

### Wave 1 — PR 75's branch

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 01 | A rerun keeps the config keys setup does not own | — | The config rebuild in `resolveOptions`, `src/setup/options.ts`; a rerun case in `test/setup-options.test.ts` | `spawn` | [ ] A `setup` rerun over a config holding `ignore`, `layout: "home"`, `codeRepo`, a `pattern` `commitConvention`, `comments.paths` and an unknown key exits 0, and every one of those keys keeps its value and relative order. Setup still sets its six owned keys. The rebuild copies the existing config rather than naming keys (D1). Proof: `proof-install-experience-config-rerun` PASS (R15.1; F15) |
| 02 | Gemini gets its entry in both modes | — | The Gemini row and `wireRuntimes` in `src/setup/runtimes.ts`; `src/setup/summary.ts` only if `GEMINI.md` would be listed twice; `test/setup-native-wiring.test.ts`; `test/runtime-registry.test.ts` only if its path scan needs the new field | `spawn` | [ ] `--runtimes gemini,codex` and `--runtimes gemini,antigravity` create `GEMINI.md` equal to `@AGENTS.md` and a newline, with no rule import and no `.claude/rules`. `--runtimes gemini` still writes `@AGENTS.md` plus every rule import, and a second run creates nothing. The summary names `GEMINI.md` once. No runtime path appears outside the registry. Proofs: `proof-install-experience-gemini-entry` (R2.3) and `proof-install-experience-shared-entry` (R16.1) PASS; F16 |
| 03 | The guide describes both Gemini modes | — | The Gemini row and section of `site/runtimes.md`; a Gemini case in `test/readme-install.test.ts` | `spawn` | [ ] `site/runtimes.md` says `GEMINI.md` imports `@AGENTS.md` and every rule in native mode, and `@AGENTS.md` only in inline mode. `pnpm docs:build` exits 0. Proof: `proof-install-experience-gemini-docs` PASS (R16.3) |
| 04 | **Wave 1 gate** | 01, 02, 03 | — | `inline` | [ ] `pnpm build && pnpm test && pnpm lint && pnpm validate && pnpm comments` exit 0, with 0 `todo`. Each box under the spec's Acceptance › Wave 1 is ticked. The repro holds with the built CLI: in a fresh `git init` folder, `setup --runtimes gemini,codex` leaves `GEMINI.md` as `@AGENTS.md`, and a rerun over a config holding `codeRepo` keeps it. The wave's commit lands here. On failure, **abort** before wave 2 |

### Wave 2 — PR 76's branch

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 05 | Merge PR 75's branch into PR 76's | 04 | The merge commit on `claude/install-check-and-repair`; `known-forms.json` only if the merge changes a template | `inline` | [ ] `claude/install-wiring` is an ancestor of `claude/install-check-and-repair`. No conflict marker remains. If any template changed, `pnpm gen:known-forms` has run and no earlier form was dropped. `pnpm build` and `pnpm test` exit 0 |
| 06 | A rerun keeps the linked layout's keys | 05 | A linked rerun case in `test/setup-options.test.ts` | `spawn` | [ ] A `setup` rerun over a config holding `layout: "linked"` and `harnessHome: ".."` exits 0, and both keys keep their values. No source change is needed if unit 01's copy covers it. If one is, report it rather than editing outside Owns. Proof: `proof-install-experience-config-rerun-linked` PASS (R15.2; F15) |
| 07 | `doctor` passes a Gemini and Codex install | 05 | A Gemini case in `test/doctor.test.ts` | `spawn` | [ ] `setup --runtimes gemini,codex`, then a complete inline block in `AGENTS.md` and a commit: `doctor` exits 0. With `GEMINI.md` deleted, `doctor` exits 1 with `doctor-entry` naming Gemini. `src/doctor/**` is unchanged (D4). Proof: `proof-install-experience-doctor-gemini` PASS (R16.2; F16) |
| 08 | **Wave 2 gate** | 05, 06, 07 | — | `inline` | [ ] `pnpm build && pnpm test && pnpm lint && pnpm validate && pnpm comments` exit 0, with 0 `todo`. Each box under the spec's Acceptance › Wave 2 is ticked. The wave's commit lands here. On failure, **abort** |
| 09 | **Ship gate:** re-report every finding | 08 | This plan's Finding map (Outcome column) | `inline` | [ ] F15 and F16 are each marked `fixed`, `skipped` or `no_change_needed`, with the units and passing proofs that closed them. A `skipped` names a reason the Human accepted. `harness:validate` PASS |

## Finding map

| Finding | Units | Proofs that close it | Outcome |
|---|---|---|---|
| F15 A setup rerun drops typed config keys | 01, 06 | `proof-install-experience-config-rerun`, `proof-install-experience-config-rerun-linked` | |
| F16 Gemini gets no `GEMINI.md` in inline mode | 02, 03, 07 | `proof-install-experience-gemini-entry`, `proof-install-experience-shared-entry`, `proof-install-experience-gemini-docs`, `proof-install-experience-doctor-gemini` | |

## Wave stops

| Stop | After | Gate |
|------|-------|------|
| **1** | 04 | The spec's Wave 1 acceptance, the repro and `harness:validate` PASS. **Abort before wave 2** |
| **2** | 08 | The spec's Wave 2 acceptance and `harness:validate` PASS. **Abort** |
| **Ship** | 09 | Both findings re-reported; `harness:validate` PASS |

## Unresolved

None. The spec has no open row.

## Frontier order

**Wave 1:** (01 ∥ 02 ∥ 03) → **04 STOP**

**Wave 2:** 05 → (06 ∥ 07) → **08 STOP** → **09 ship**

Units in one parallel batch have disjoint Owns. Wave 2 never starts in wave 1's batch.

## Pragmatic-guard check

Each unit maps to a spec row. No unit adds a command, flag, dependency, config key or runtime. Unit 06 adds a test only, since unit 01's copy should already keep `harnessHome`.

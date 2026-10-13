---
type: spec
title: Harness-init basics path and a trimmable full tour
description: Work units for the harness-init basics path spec, in two waves, with the skill and its tests first and the README, guide page and retired walkthrough second.
status: stable
---

# Harness-init basics path and a trimmable full tour: plan

## Structural gate

Every obligation in `harness-init-basics-path-spec.md` (R1.1–R9.4) maps to one named proof:

- **Wave 1 proofs:** new test titles in `test/skill-harness-init.test.ts`, `test/harness-init-note.test.ts`, `test/harness-init-discovery.test.ts` and `test/harness-init-entry.test.ts`, plus the existing `proof-lean-init-copies-identical` in `test/skill-copies.test.ts`.
- **Wave 2 proofs:** new test titles in `test/readme-install.test.ts`.

The spec's Unresolved table is empty, so the gate holds.

**Copy rule for every wave 1 unit.** A unit that edits a file under `templates/.agents/skills/harness-init/` copies it byte for byte to `.agents/skills/harness-init/` in the same unit. `proof-lean-init-copies-identical` must pass at the end of each unit, not only at the gate.

**Tests rule.** Units that retire or rewrite tests consult `test-sync`, and the comment rule in `AGENTS.md` applies to every added test comment.

## Work units

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 01 | Basics path replaces the thin-evidence lean path | — | `harness-init/references/lean-path.md`; the `## Lean path` section of `harness-init/SKILL.md` (both copies); the lean tests in `test/skill-harness-init.test.ts` | `inline` | [x] Several things hold. The run asks "How much setup do you want right now?" with "Just the basics" first. Basics asks only the path, goal and AGENTS.md questions. It records an empty goal as "none given". It writes only the step 0 change and the note. A draft note resumes its path. Every stale lean test is retired. Proofs: `proof-basics-path-question`, `proof-basics-resume`, `proof-basics-three-questions`, `proof-basics-skips`, `proof-basics-empty-goal`, `proof-basics-writes` and `proof-no-stale-lean-tests` pass, as does `proof-lean-init-copies-identical`. |
| 02 | Leaked-credential checks run on every path | 01 | `harness-init/references/harness-score.md`; the leak-check paragraph in `lean-path.md` (both copies); its test in `test/skill-harness-init.test.ts` | `inline` | [x] On basics, and with the score uncovered, the run still reads `HYG-03`, `HYG-04` and `HYG-06`, and a failure stops it. A declined install continues the run and lists the checks under later. Proof: `proof-leak-checks-every-path` passes. |
| 03 | Coverage checklist trims the full tour | 02 | `harness-init/SKILL.md` (the coverage table and the step 1–6 conditions, both copies); its tests in `test/skill-harness-init.test.ts` | `inline` | [x] On the full path the run shows "What should this run cover?" with six items ticked, mapped to their steps. An unticked item is never asked about and is recorded as later. Step 1 runs only when covered and legacy ADRs are reported. Proofs: `proof-full-coverage-checklist`, `proof-full-unticked-is-later` and `proof-full-step1-covered` pass. |
| 04 | Skill proposals only for a new or unexplored repo | — | `harness-init/references/discovery.md` Suggestions (both copies); `test/harness-init-discovery.test.ts` | `spawn` | [x] Step 4 states whether the repo is new or well understood from the named signals. It skips proposals on a well-understood repo unless the Human overrules. Proofs: `proof-skills-gate-call` and `proof-skills-gate-skip-and-overrule` pass. |
| 05 | Session note records path, goal, later and the hand-back | 01 | `harness-init/references/session-note-template.md` (both copies); `test/harness-init-note.test.ts` | `spawn` | [x] The note template has a `Left for later` section with `**Path:**`, `**Goal:**`, `**Covered:**` and the `Step \| Name \| Remaining work` table. Choices are recorded as label first with the mode in brackets. `Next steps for the Human` records the spec offer and the answer. Proofs: `proof-note-left-for-later`, `proof-note-label-and-mode` and `proof-note-handback` pass. |
| 06 | Plain-language entry and wiring questions | 03 | `harness-init/references/entry-modes.md` and `validate-wiring.md` (both copies); `test/harness-init-entry.test.ts`; the wiring test in `test/skill-harness-init.test.ts` | `inline` | [x] Step 0 asks "How much should we change your current AGENTS.md?" with "Just one line", "A short section" and "The whole guide". The wiring question is "How should we check the harness?" with its three labels. Proofs: `proof-entry-plain-labels` and `proof-wiring-plain-labels` pass. |
| 07 | Hand-back says what's installed and offers the next spec | 06 | `harness-init/SKILL.md` step 6 hand-back (both copies); its tests in `test/skill-harness-init.test.ts` | `inline` | [x] The hand-back has What's installed, Left for later and numbered next steps. It ends with "Should we start with a spec for “<goal>”?", or "What should we build first?" when there is no goal, and starts nothing without a yes. Proofs: `proof-handback-three-parts` and `proof-handback-spec-offer` pass. |
| 08 | **Wave 1 gate** | 04, 05, 07 | — | `inline` | [x] Every wave 1 proof (R1.1–R8.2, R9.1, R9.4) passes, and `pnpm test`, `pnpm lint`, `pnpm build && pnpm validate` and `pnpm comments` all exit 0. A failure aborts before wave 2. |
| 09 | README and guide page describe the basics path | 08 | `README.md` (the harness-init paragraph); `site/harness-init.md` (the `Lean path` section, renamed `Basics path`); the lean test in `test/readme-install.test.ts`; `test/harness-init-set.test.ts` only if its page assertions break | `inline` | [x] Both docs describe the path question, basics and the coverage checklist, link `references/lean-path.md`, and no longer say "thin-evidence", say "Skill proposals always run", or link the walkthrough note. Proof: `proof-docs-basics-path` passes. |
| 10 | Lean walkthrough note is retired | 09 | `docs/notes/lean-init-walkthrough/lean-init-walkthrough-note.md` (frontmatter only); its test in `test/readme-install.test.ts` | `inline` | [x] The note has `status: deprecated`, and no test reads it as current behavior. Proof: `proof-walkthrough-deprecated` passes. |
| 11 | **Wave 2 gate and ship gate** | 10 | — | `inline` | [x] `proof-docs-basics-path` and `proof-walkthrough-deprecated` pass, and the full gate set exits 0: `pnpm test`, `pnpm lint`, `pnpm build && pnpm validate` and `pnpm comments`. |

## Wave stops

| Stop | After | Gate |
|------|-------|------|
| **1** | 08 | Wave 1 proofs plus `pnpm test`, `pnpm lint`, `pnpm build && pnpm validate` and `pnpm comments` all PASS. **Abort before wave 2** on failure. |
| **2 / Ship** | 11 | Wave 2 proofs plus the same gate set all PASS before handing off to `code-pr`. |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
|---|---|---|---|---|---|
| None | The spec's Unresolved table is empty; `U-leak-check-unavailable` was resolved into R3.1 on 2026-10-13. | — | Non-blocking | — | — |

## Frontier order

**Wave 1:** 01 → (02 → 03 → 06 → 07) ∥ 04 ∥ 05 → **08 STOP**

- 04 has no dependency and can start alongside 01: its files (`discovery.md` and `test/harness-init-discovery.test.ts`) are disjoint from every other unit's.
- 05 starts once 01 lands: 01 retires the lean tests that read the note template, and 05 owns that template and `test/harness-init-note.test.ts` alone.
- 02, 03, 06 and 07 run inline in sequence because they share `test/skill-harness-init.test.ts`, and 03 and 07 both edit `SKILL.md`.

**Wave 2:** 09 → 10 → **11 STOP**. Both units share `test/readme-install.test.ts`, so they run in sequence.

Never pack wave 2 into the wave 1 batch to skip unit 08.

## Execution / resume section

Resolved opt: `autocommit: false` (default; `.agents/code-commit.config.yml` absent), so units stay uncommitted until the Human asks.

### Unit 01 — Basics path replaces the thin-evidence lean path

| Field | Value |
|-------|-------|
| Unit identifier | 01 — Basics path replaces the thin-evidence lean path (wave 1, first on the frontier) |
| Spec/plan paths | `docs/specs/harness-init-basics-path/harness-init-basics-path-spec.md` / `docs/specs/harness-init-basics-path/harness-init-basics-path-plan.md` |
| Obligation / proof status | R1.1, R1.2, R2.1–R2.4, R9.4 — done (proofs pass; lint, comments, validate PASS; uncommitted per opt) |
| `HEAD` commit | `69697f0` |
| `git status` summary | dirty: only this plan file (status `stable` plus this section), the plan's own record |
| Intended diff scope | `{templates/,}.agents/skills/harness-init/references/lean-path.md`, `{templates/,}.agents/skills/harness-init/SKILL.md` (Lean path section), `test/skill-harness-init.test.ts` (lean tests) |
| Decision on every discrepancy | none |

### Unit 04 — Skill proposals only for a new or unexplored repo

| Field | Value |
|-------|-------|
| Unit identifier | 04 — Skill proposals only for a new or unexplored repo (wave 1, parallel with 01) |
| Spec/plan paths | `docs/specs/harness-init-basics-path/harness-init-basics-path-spec.md` / `docs/specs/harness-init-basics-path/harness-init-basics-path-plan.md` |
| Obligation / proof status | R5.1, R5.2 — done per subagent return; re-verified at the wave 1 gate |
| `HEAD` commit | `69697f0` |
| `git status` summary | dirty: only this plan file; Owns disjoint from unit 01 |
| Intended diff scope | `{templates/,}.agents/skills/harness-init/references/discovery.md`, `test/harness-init-discovery.test.ts` |
| Decision on every discrepancy | none |

### Unit 02 — Leaked-credential checks run on every path

| Field | Value |
|-------|-------|
| Unit identifier | 02 — Leaked-credential checks run on every path (wave 1, after 01) |
| Spec/plan paths | `docs/specs/harness-init-basics-path/harness-init-basics-path-spec.md` / `docs/specs/harness-init-basics-path/harness-init-basics-path-plan.md` |
| Obligation / proof status | R3.1 — done (`proof-leak-checks-every-path` passes; comments, validate PASS) |
| `HEAD` commit | `69697f0` |
| `git status` summary | dirty: units 01 and 04 work (uncommitted per opt) and this plan; no unrelated paths |
| Intended diff scope | `{templates/,}.agents/skills/harness-init/references/harness-score.md`, the leak-check line in `lean-path.md`, one test in `test/skill-harness-init.test.ts` |
| Decision on every discrepancy | none: dirt is earlier units' Owns, left as is |

### Unit 05 — Session note records path, goal, later and the hand-back

| Field | Value |
|-------|-------|
| Unit identifier | 05 — Session note records path, goal, later and the hand-back (wave 1, spawned in parallel with 02) |
| Spec/plan paths | `docs/specs/harness-init-basics-path/harness-init-basics-path-spec.md` / `docs/specs/harness-init-basics-path/harness-init-basics-path-plan.md` |
| Obligation / proof status | R6.3, R8.1, R8.2 — done per subagent return; re-verified at the wave 1 gate |
| `HEAD` commit | `69697f0` |
| `git status` summary | dirty: units 01 and 04 work and this plan; Owns disjoint from unit 02 |
| Intended diff scope | `{templates/,}.agents/skills/harness-init/references/session-note-template.md`, `test/harness-init-note.test.ts` |
| Decision on every discrepancy | none |

### Units 03, 06, 07, 08 (wave 1) and 09, 10, 11 (wave 2)

| Field | Value |
|-------|-------|
| Unit identifier | 03 coverage checklist, 06 plain labels, 07 hand-back, 08 wave 1 gate; 09 docs, 10 walkthrough retired, 11 wave 2 and ship gate |
| Spec/plan paths | `docs/specs/harness-init-basics-path/harness-init-basics-path-spec.md` / `docs/specs/harness-init-basics-path/harness-init-basics-path-plan.md` |
| Obligation / proof status | R4.1–R4.3, R6.1, R6.2, R7.1, R7.2, R9.2, R9.3 — done. Wave 1 gate: 604 tests pass, with all 21 wave 1 proofs. Ship gate: 605 tests pass; `pnpm lint`, `pnpm build && pnpm validate` and `pnpm comments` PASS |
| `HEAD` commit | `69697f0` |
| `git status` summary | dirty: only this plan's Owns across units 01–11, plus this plan file; no unrelated paths |
| Intended diff scope | every Owns path in the units table; nothing outside it |
| Decision on every discrepancy | none. Plan marks stay `[ ]` and the work stays uncommitted, because `autocommit: false` |

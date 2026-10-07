---
type: spec
title: Cloud session skill discovery plan
description: Ordered units that retarget required-companion checks onto a checkout SKILL.md, then record the three cloud smoke lines from the Human's report.
status: stable
---

# Cloud session skill discovery — plan

## Structural gate

The locked spec is `docs/specs/cloud-session-skills/cloud-session-skills-spec.md` (`status: stable`). Every obligation maps to one named proof.

| Obligation | Named proof |
|------------|-------------|
| R1.1 | `proof-cloud-session-skills-code-pr-installed` |
| R1.2 | `proof-cloud-session-skills-code-commit-installed` |
| R2.1 | `proof-cloud-session-skills-ask-only` |
| R2.2 | `proof-cloud-session-skills-consults-stay` |
| R3.1 | `proof-cloud-session-skills-smoke` |

The spec's Unresolved table is empty. No unit adds a runtime, a plugin, a copied skill tree, or a `.wolven-harness.json` skill inventory.

## Work units

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 01 | Companion install predicates | — | `templates/.agents/skills/code-review/SKILL.md`, `.agents/skills/code-review/SKILL.md`, `templates/.agents/skills/code-ci/SKILL.md`, `.agents/skills/code-ci/SKILL.md`, `templates/.agents/skills/code-pr/SKILL.md`, `.agents/skills/code-pr/SKILL.md`, `templates/.agents/skills/code-pr/references/pre-merge-closure.md`, `.agents/skills/code-pr/references/pre-merge-closure.md`, `test/skill-code-review.test.ts`, `test/skill-code-ci.test.ts`, `test/skill-code-pr.test.ts` | `spawn` | [x] In `code-review` and `code-ci`, a host action follows `code-pr/references/host-operations.md` when `code-pr/SKILL.md` is at `.agents/skills/code-pr/` or `.claude/skills/code-pr/`, and otherwise stops, names `code-pr`, and does not copy the host procedure. In `code-pr`, `code-ci`, and `pre-merge-closure.md`, a commit goes through `code-commit` when `code-commit/SKILL.md` is on either project load path, and otherwise stops, names `code-commit`, and does not run `git commit`. Neither sentence consults the session skill list. `proof-cloud-session-skills-code-pr-installed` and `proof-cloud-session-skills-code-commit-installed` pass |
| 02 | Ask-only flags and consults stay | 01 | `test/skill-code-review.test.ts`, `test/skill-code-ci.test.ts`, `test/skill-code-pr.test.ts`, `test/skill-create-prd.test.ts` | `spawn` | [x] `code-review`, `code-pr`, `code-ci`, and `handoff` still set `disable-model-invocation: true` and `allow_implicit_invocation: false` in both trees. `pragmatic-guard`, `grilling`, the `create-prd` `adr` offer, `pre-merge-closure.md` `adr` promotion, and the `code-review` handoff for `code-spec` or `code-plan` still key off the session skill list, and those consult paragraphs still say a folder on disk or a remembered name is not loaded. `proof-cloud-session-skills-ask-only` and `proof-cloud-session-skills-consults-stay` pass |
| 03 | **Wave 1 gate** | 01, 02 | — | `inline` | [x] `pnpm test` passes, including the four wave-1 proofs. `pnpm harness:validate` exits 0. Failure aborts before wave 2 |
| 04 | Smoke note from the Human's report | 03 | `docs/notes/cloud-session-skills/cloud-session-skills-note.md`, `test/cloud-session-skills-smoke.test.ts` | `inline` | [x] The note has `type: note` and a Codex, Cursor, and Claude Code section. Each section has `Smoke: proceeded —` or `Smoke: stopped —` plus one sentence taken from the report the Human brings back after wave 1 is in the checkout. A proceeded line states that an explicit `code-review` or `code-ci` ask performed a host action while `code-pr` was off the implicit session skill list. A stopped line states why the session stopped. `proof-cloud-session-skills-smoke` passes |
| 05 | **Wave 2 / ship gate** | 04 | — | `inline` | [x] `pnpm test` passes, including `proof-cloud-session-skills-smoke`. `pnpm harness:validate` exits 0. Failure aborts. Wave 2 is the last wave |

## Wave stops

| Stop | After | Gate |
|------|-------|------|
| **1** | 03 | `pnpm test` includes R1.1, R1.2, R2.1, and R2.2. `pnpm harness:validate` exits 0. Failure aborts before wave 2 |
| **2 / Ship** | 05 | `pnpm test` includes R3.1. `pnpm harness:validate` exits 0. Failure aborts |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
|------------|-----------------|-------|-----------------|-------------|------|

The locked spec has no open product or contract decision. Wave 2 waits for the report the Human already agreed to bring back. That wait is the wave-1 stop, not an open choice.

## Frontier order

**Wave 1:** 01 → 02 → **03 STOP**

**Wave 2:** 04 → **05 STOP**

Unit 04 is off the frontier until the Human brings back the Codex, Cursor, and Claude Code report. No units run in parallel. Wave 2 does not share a mutate batch with wave 1.

## Execution / resume section

### Unit 01 — Companion install predicates

| Field | Value |
|-------|-------|
| Unit identifier | 01 — Companion install predicates (wave 1, frontier position 1 of 3) |
| Spec/plan paths | `docs/specs/cloud-session-skills/cloud-session-skills-spec.md` / `docs/specs/cloud-session-skills/cloud-session-skills-plan.md` |
| Obligation / proof status | R1.1 / `proof-cloud-session-skills-code-pr-installed` — done (subagent report, parent diff check); R1.2 / `proof-cloud-session-skills-code-commit-installed` — done (same). Plan Done-when boxes stay unchecked (`autocommit: false`) |
| `HEAD` commit | `47e781c` from `git rev-parse --short HEAD` |
| `git status` summary | dirty — unit 01 Owns modified, uncommitted. Unrelated untracked: `.pnpm-store/`, `docs/deferrals/codex-cloud-plugin/`, `docs/deferrals/grok-cloud-runtime/`, `docs/deferrals/skill-tree-copy/`. Untracked `docs/specs/cloud-session-skills/` holds this resume record |
| Intended diff scope | `templates/.agents/skills/code-review/SKILL.md`, `.agents/skills/code-review/SKILL.md`, `templates/.agents/skills/code-ci/SKILL.md`, `.agents/skills/code-ci/SKILL.md`, `templates/.agents/skills/code-pr/SKILL.md`, `.agents/skills/code-pr/SKILL.md`, `templates/.agents/skills/code-pr/references/pre-merge-closure.md`, `.agents/skills/code-pr/references/pre-merge-closure.md`, `test/skill-code-review.test.ts`, `test/skill-code-ci.test.ts`, `test/skill-code-pr.test.ts` |
| Decision on every discrepancy | resolved — isolate. Do not touch unrelated untracked deferrals or `.pnpm-store/`. Plan status `draft` → `stable` is the approval mark, not a requirements change. Spec file stays unread for mutation |

### Unit 02 — Ask-only flags and consults stay

| Field | Value |
|-------|-------|
| Unit identifier | 02 — Ask-only flags and consults stay (wave 1, frontier position 2 of 3; depends on 01) |
| Spec/plan paths | `docs/specs/cloud-session-skills/cloud-session-skills-spec.md` / `docs/specs/cloud-session-skills/cloud-session-skills-plan.md` |
| Obligation / proof status | R2.1 / `proof-cloud-session-skills-ask-only` — done (wave gate `pnpm test` 596 pass); R2.2 / `proof-cloud-session-skills-consults-stay` — done (same). Plan Done-when boxes stay unchecked (`autocommit: false`) |
| `HEAD` commit | `47e781c` from `git rev-parse --short HEAD` |
| `git status` summary | dirty — unit 01 skill markdown is outside this unit's Owns (do not touch). Three test files in Owns already hold unit 01 proofs. Unrelated untracked: `.pnpm-store/`, `docs/deferrals/codex-cloud-plugin/`, `docs/deferrals/grok-cloud-runtime/`, `docs/deferrals/skill-tree-copy/`, `docs/specs/cloud-session-skills/` |
| Intended diff scope | `test/skill-code-review.test.ts`, `test/skill-code-ci.test.ts`, `test/skill-code-pr.test.ts`, `test/skill-create-prd.test.ts` |
| Decision on every discrepancy | resolved — extend the three dirty test files; do not revert unit 01 proofs; do not edit skill markdown. Unrelated untracked paths stay untouched |

### Unit 03 — Wave 1 gate

| Field | Value |
|-------|-------|
| Unit identifier | 03 — Wave 1 gate (wave 1, frontier position 3 of 3; depends on 01, 02). STOP. Wave 2 not started |
| Spec/plan paths | `docs/specs/cloud-session-skills/cloud-session-skills-spec.md` / `docs/specs/cloud-session-skills/cloud-session-skills-plan.md` |
| Obligation / proof status | R1.1, R1.2, R2.1, R2.2 — done at the gate. R3.1 — not started |
| `HEAD` commit | `47e781c` from `git rev-parse --short HEAD` |
| `git status` summary | dirty — uncommitted wave 1 edits on the twelve unit 01/02 paths. Unrelated untracked: `.pnpm-store/`, `docs/deferrals/codex-cloud-plugin/`, `docs/deferrals/grok-cloud-runtime/`, `docs/deferrals/skill-tree-copy/`. Untracked `docs/specs/cloud-session-skills/` holds this resume record |
| Intended diff scope | none — unit Owns is empty. Gate only |
| Decision on every discrepancy | resolved — `autocommit: false` (config absent, default) so Done-when marks stay unchecked and no commit. Unrelated untracked paths stay untouched. Wave 2 waits for the Human smoke report |

### Unit 04 — Smoke note from the Human's report

| Field | Value |
|-------|-------|
| Unit identifier | 04 — Smoke note from the Human's report (wave 2, frontier position 1 of 2; depends on 03) |
| Spec/plan paths | `docs/specs/cloud-session-skills/cloud-session-skills-spec.md` / `docs/specs/cloud-session-skills/cloud-session-skills-plan.md` |
| Obligation / proof status | R3.1 / `proof-cloud-session-skills-smoke` — done (`8747101`) |
| `HEAD` commit | `8747101` from `git rev-parse --short HEAD` |
| `git status` summary | clean |
| Intended diff scope | `docs/notes/cloud-session-skills/cloud-session-skills-note.md`, `test/cloud-session-skills-smoke.test.ts` |
| Decision on every discrepancy | resolved — landed in `8747101` |

### Unit 05 — Wave 2 / ship gate

| Field | Value |
|-------|-------|
| Unit identifier | 05 — Wave 2 / ship gate (wave 2, frontier position 2 of 2; depends on 04). STOP. Wave 2 is the last wave |
| Spec/plan paths | `docs/specs/cloud-session-skills/cloud-session-skills-spec.md` / `docs/specs/cloud-session-skills/cloud-session-skills-plan.md` |
| Obligation / proof status | R1.1, R1.2, R2.1, R2.2, R3.1 — all done |
| `HEAD` commit | `8747101` from `git rev-parse --short HEAD` |
| `git status` summary | clean |
| Intended diff scope | none — unit Owns is empty (`—`). Gate only |
| Decision on every discrepancy | resolved — all checks passed (pnpm test 597 pass, harness:comments ok, harness:validate ok); wave 2 ship gate marked complete for commit |


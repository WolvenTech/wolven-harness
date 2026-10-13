---
type: spec
title: Harness-init basics path, review fix iteration 1
description: Moves the leaked-credential check before step 0 on every path, so a leak stops the run before anything is written, as R3.1 already requires.
status: stable
---

# Harness-init basics path, review fix iteration 1: plan

## Structural gate

The fix needs no new obligation. Spec R3.1 already says a leaked credential stops the run "before anything else is written", and PRD AC-1.2 says the same. The finding shows that the shipped text runs the check too late, and that `proof-leak-checks-every-path` only matches the wording, not the position. The fix keeps R3.1 and its named proof, and strengthens the proof so that it rejects the current order.

## Finding → unit map

| Finding | Source | Severity | Unit |
|---|---|---|---|
| F1: the leaked-credential check runs at step 6, after step 0 writes AGENTS.md, `WOLVEN.md` and the draft note and offers a commit. On the full tour, migration and stubs also land first. The basics list in `references/lean-path.md` puts entry integration before the check. | PR #56 review, inline on `templates/.agents/skills/harness-init/SKILL.md` | Blocking | 01 |

## Work units

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 01 | The leaked-credential check runs before step 0 on every path | — | `harness-init/SKILL.md` (a "before step 0" section and the step 6 wording), `references/lean-path.md` ("What the lean path runs" order), `references/harness-score.md` ("Leaked-credential checks on every path"), all in both copies; `proof-leak-checks-every-path` in `test/skill-harness-init.test.ts` | `inline` | [x] On both paths the run reads `HYG-03`, `HYG-04` and `HYG-06` after the path and goal or coverage questions and before step 0, before the note or any file is written. Step 6 no longer schedules the check. The proof fails if `SKILL.md` places the check after `### 0. Entry integration`, if `lean-path.md` lists it after step 0, or if `harness-score.md` does not say it runs before step 0. Proofs: `proof-leak-checks-every-path` and `proof-lean-init-copies-identical` pass. |
| 02 | **Iteration gate and finding report** | 01 | — | `inline` | [x] `pnpm test`, `pnpm lint`, `pnpm build && pnpm validate` and `pnpm comments` all exit 0, and F1 is re-reported as `fixed`, `skipped` or `no_change_needed`, with evidence. |

## Wave stops

| Stop | After | Gate |
|------|-------|------|
| **Ship** | 02 | The full gate set PASS, and F1 is re-reported before pre-merge closure runs |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
|---|---|---|---|---|---|
| None | The finding names its fix, and R3.1 already fixes the required behavior. | — | Non-blocking | — | — |

## Frontier order

01 → **02 STOP**. Then pre-merge closure, as a separate batch.

## Execution / resume section

The Human approved the commit and push for this iteration in chat on 2026-10-13. There is no `.agents/code-commit.config.yml`.

### Unit 01 — The leaked-credential check runs before step 0 on every path

| Field | Value |
|-------|-------|
| Unit identifier | 01 — The leaked-credential check runs before step 0 on every path (first on the frontier) |
| Spec/plan paths | `docs/specs/harness-init-basics-path/harness-init-basics-path-spec.md` / `docs/specs/harness-init-basics-path/harness-init-basics-path-iteration-1-plan.md` |
| Obligation / proof status | R3.1 (F1) — done |
| `HEAD` commit | `f589b37` |
| `git status` summary | dirty: this unit's Owns plus this iteration plan (untracked); nothing unrelated |
| Intended diff scope | `{templates/,}.agents/skills/harness-init/SKILL.md`, `references/lean-path.md`, `references/harness-score.md`, `test/skill-harness-init.test.ts` |
| Decision on every discrepancy | none |

### Finding report

| Finding | Outcome | Evidence |
|---|---|---|
| F1 | `fixed` | `SKILL.md` gains "Leaked credentials before step 0" ahead of `### 0. Entry integration`. Step 6 now says the checks already ran. `lean-path.md` lists the checks before step 0, and `harness-score.md` says they run before step 0. `proof-leak-checks-every-path` asserts all three positions. `pnpm test` gives 605 pass and 0 fail; `pnpm lint`, `pnpm validate` and `pnpm comments` give 0 findings. |

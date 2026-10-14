---
type: spec
title: Pragmatic-guard consult alignment plan
description: Work-unit plan to align pragmatic-guard consultation and remove mandatory negative boilerplate across ship skills and tests.
status: stable
---

# Pragmatic-guard consult alignment plan

## Structural gate

Confirmed: every obligation in `docs/specs/pragmatic-guard-consult/pragmatic-guard-consult-spec.md` (R1.1 through R1.4) pairs with a named proof (`proof-guard-consult-no-negative-commit-pr`, `proof-guard-consult-no-negative-review-ci`, `proof-guard-consult-mirrors-match`, `proof-guard-consult-tests-verify`). No gaps exist.

## Work units

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 01 | Align `code-commit` and `code-pr` consult text and tests | — | `templates/.agents/skills/code-commit/SKILL.md`<br>`templates/.agents/skills/code-pr/SKILL.md`<br>`.agents/skills/code-commit/SKILL.md`<br>`.agents/skills/code-pr/SKILL.md`<br>`test/skill-code-pr.test.ts`<br>`test/skill-code-commit.test.ts` | `inline` | [x] `code-commit` and `code-pr` remove mandatory `pragmatic-guard was not consulted` boilerplate while preserving that runtime session list governs loading and no claim of execution is made when unrun; tests in `test/skill-code-pr.test.ts` pass verifying consult contract and that the negative phrase is not required (`proof-guard-consult-no-negative-commit-pr`, `proof-guard-consult-mirrors-match`). |
| 02 | Align `code-review` and `code-ci` consult text and tests | — | `templates/.agents/skills/code-review/SKILL.md`<br>`templates/.agents/skills/code-ci/SKILL.md`<br>`.agents/skills/code-review/SKILL.md`<br>`.agents/skills/code-ci/SKILL.md`<br>`test/skill-code-review.test.ts`<br>`test/skill-code-ci.test.ts` | `inline` | [x] `code-review` and `code-ci` remove mandatory negative boilerplate while preserving reader safety (reading a prior note does not treat guard as run); tests in `test/skill-code-review.test.ts` and `test/skill-code-ci.test.ts` pass (`proof-guard-consult-no-negative-review-ci`, `proof-guard-consult-mirrors-match`). |
| 03 | Wave 1 closeout, validation, and acceptance verification | 01, 02 | `docs/specs/pragmatic-guard-consult/pragmatic-guard-consult-spec.md` | `inline` | [x] Full test suite (`pnpm test`), lint (`pnpm lint`), and doc validation (`node dist/cli.js validate`) pass with exit 0; acceptance checkboxes in `pragmatic-guard-consult-spec.md` are verified and ticked (`proof-guard-consult-tests-verify`, `proof-pragmatic-guard-consult-spec-obligations`). |

## Wave stops

| Stop | After | Gate |
|------|-------|------|
| **1** | Unit 03 | `pnpm test && pnpm lint && node dist/cli.js validate` PASS (exit 0) — ready for commit and PR |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
|---|---|---|---|---|---|
| None | None pending | Human | Non-blocking | *(empty)* | — |

## Frontier order

Units 01 and 02 have disjoint ownership and can run in either order or in parallel. Unit 03 depends on 01 and 02 to run final wave verification.

## Execution / resume section

### Wave 1 Summary

| Field | Value |
|---|---|
| Unit identifier | 01, 02, 03 — Wave 1 complete |
| Spec/plan paths | `docs/specs/pragmatic-guard-consult/pragmatic-guard-consult-spec.md` / `docs/specs/pragmatic-guard-consult/pragmatic-guard-consult-plan.md` |
| Obligation / proof status | R1.1 (`proof-guard-consult-no-negative-commit-pr`) — done; R1.2 (`proof-guard-consult-no-negative-review-ci`) — done; R1.3 (`proof-guard-consult-mirrors-match`) — done; R1.4 (`proof-guard-consult-tests-verify`) — done |
| `HEAD` commit | `be4b740` |
| `git status` summary | dirty — unit modifications validated in worktree, uncommitted |
| Intended diff scope | `templates/.agents/skills/{code-commit,code-pr,code-review,code-ci}/SKILL.md`, `.agents/skills/{code-commit,code-pr,code-review,code-ci}/SKILL.md`, `test/skill-code-pr.test.ts`, `test/skill-code-ci.test.ts`, `test/skill-code-review.test.ts`, `test/skill-code-commit.test.ts`, `docs/prds/pragmatic-guard-consult/`, `docs/specs/pragmatic-guard-consult/` |
| Decision on every discrepancy | none |


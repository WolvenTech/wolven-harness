---
type: spec
title: Include untracked files in validate scans — plan
description: Work units to merge untracked paths into RepoContext and prove with tests.
status: stable
---

# Include untracked files in validate scans — plan

## Structural gate

All obligations in `validate-untracked-spec.md` map to named proofs below.

## Work units

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 01 | Merge untracked into RepoContext | — | `src/validate/repo.ts` | inline | `buildRepoContext` unions tracked and untracked non-ignored paths; `proof-validate-untracked-union` and `proof-validate-untracked-ignore` pass via `pnpm test` |
| 02 | End-to-end and successor tests | 01 | `test/validate-repo.test.ts`, `test/validate-untracked.test.ts`, `test/validate-successor.test.ts` | inline | Issue #34 repro exits 1 without git add; untracked stable successor passes; `pnpm test`, `pnpm build`, `pnpm validate`, `pnpm lint` exit 0 |

## Wave stops

| Stop | After | Gate |
|------|-------|------|
| **1** | Unit 02 | `pnpm test && pnpm build && pnpm validate && pnpm lint` |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
|---|---|---|---|---|---|
| — | — | — | — | — | — |

## Frontier order

01 → 02

## Execution / resume section

### Unit 01 — Merge untracked into RepoContext

| Field | Value |
|-------|-------|
| Unit | 01 — Merge untracked into RepoContext |
| Spec / plan | `docs/specs/validate-untracked/validate-untracked-spec.md` / `docs/specs/validate-untracked/validate-untracked-plan.md` |
| Obligations | R1.1, R1.2 — done |
| `HEAD` | *(see git)* |
| `git status` | dirty — unit 02 owns tests |
| Intended diff | `src/validate/repo.ts` |
| Discrepancies | none |

### Unit 02 — End-to-end and successor tests

| Field | Value |
|-------|-------|
| Unit | 02 — End-to-end and successor tests |
| Spec / plan | same as unit 01 |
| Obligations | R1.3, R2.1 — done |
| `HEAD` | *(see git)* |
| `git status` | clean after unit 02 commit |
| Intended diff | `test/*` |
| Discrepancies | none |

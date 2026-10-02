---
type: spec
title: WRITING-PROFILE architecture-claims text survives harness-init — plan
description: Work units to remove the WOLVEN.md pointer from WRITING-PROFILE copies and guard with a profile test.
status: deprecated
---

# WRITING-PROFILE architecture-claims text survives harness-init — plan

**Spec:** [writing-profile-wolven-ref-spec.md](./writing-profile-wolven-ref-spec.md) (status `deprecated`, archived)

## Structural gate

All obligations R1.1–R3.1 map to named proofs in the spec. Proceed.

## Work units

| # | Unit | Depends | Owns | Subagent | Done when |
| --- | --- | --- | --- | --- | --- |
| 01 | Restate architecture claims in template WRITING-PROFILE | — | `templates/docs/WRITING-PROFILE.md` | inline | "Why this matters" matches light-block claim semantics; `rg 'WOLVEN\.md' templates/docs/WRITING-PROFILE.md` empty; still mentions validate and `docs/adrs/` (R1.1, R1.2) |
| 02 | Align package WRITING-PROFILE copy | 01 | `docs/WRITING-PROFILE.md` | inline | Same prose as unit 01; `rg 'WOLVEN\.md' docs/WRITING-PROFILE.md` empty (R2.1) |
| 03 | Add profile regression test | 01 | `test/profile.test.ts` | inline | Test fails on `WOLVEN.md` in template profile guidance; `pnpm test` PASS for profile suite (R3.1) |
| 04 | Wave 1 gate | 01, 02, 03 | — | inline | `pnpm lint`, `pnpm test`, `pnpm harness:validate` exit 0 |

## Wave stops

| Stop | After | Gate |
| --- | --- | --- |
| **1** | 04 | `pnpm lint` + `pnpm test` + `pnpm harness:validate` PASS — abort before commit if any fail |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
| --- | --- | --- | --- | --- | --- |
| *(none)* | — | — | — | — | — |

## Frontier order

01 → 02 → 03 → 04 (serial; small doc + test slice)

## Execution / resume

### Unit 01 — Restate architecture claims in template WRITING-PROFILE

| Field | Value |
| --- | --- |
| Unit | 01 — Restate architecture claims in template WRITING-PROFILE |
| Spec / plan | `docs/specs/archived/writing-profile-wolven-ref/writing-profile-wolven-ref-spec.md` / `docs/specs/archived/writing-profile-wolven-ref/writing-profile-wolven-ref-plan.md` |
| Obligations | R1.1, R1.2 — done |
| `HEAD` | *(pre-commit)* |
| `git status` | dirty — template + spec/plan |
| Intended diff | `templates/docs/WRITING-PROFILE.md` |
| Discrepancies | None |

### Unit 03 — Add profile regression test

| Field | Value |
| --- | --- |
| Unit | 03 — Add profile regression test |
| Obligations | R3.1 — done |
| `HEAD` | 41d291e |
| `git status` | dirty — test + spec acceptance |
| Intended diff | `test/profile.test.ts`, spec acceptance |
| Discrepancies | None |

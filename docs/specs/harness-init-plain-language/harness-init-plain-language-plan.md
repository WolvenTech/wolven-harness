---
type: spec
title: Plain-Language Questions for Harness Init — plan
description: Work-unit index and execution plan for plain-language question guidance in harness-init.
status: draft
---

# Plain-Language Questions for Harness Init — plan

**Spec:** `docs/specs/harness-init-plain-language/harness-init-plain-language-spec.md` (status `stable`)
**Named proof:** `proof-harness-init-plain-language-spec-obligations`

## Structural gate

All nine spec obligations (`R1.1`–`R1.5`, `R2.1`–`R2.3`, `R3.1`–`R3.2`) map to named test proofs in `test/skill-harness-init.test.ts`, `test/harness-init-migration.test.ts`, and `test/skill-copies.test.ts` or integrity gates (`pnpm validate`). The structural gate passes.

## Execution / resume section

### Unit 05 — Ship gate

| Field | Value |
|---|---|
| Unit identifier | 05 — Ship gate (frontier position: complete) |
| Spec/plan paths | `docs/specs/harness-init-plain-language/harness-init-plain-language-spec.md` / `docs/specs/harness-init-plain-language/harness-init-plain-language-plan.md` |
| Obligation / proof status | `R1.1`–`R1.5`, `R2.1`–`R2.3`, `R3.1`–`R3.2` — done |
| `HEAD` commit | `b46fed8` |
| `git status` summary | dirty — untracked plan and spec files |
| Intended diff scope | `.agents/skills/harness-init/**`, `templates/.agents/skills/harness-init/**`, `test/skill-harness-init.test.ts`, `test/harness-init-migration.test.ts`, `docs/prds/harness-init-plain-language/**`, `docs/specs/harness-init-plain-language/**` |
| Decision on every discrepancy | none |

## Work units

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 01 | Update Hard gate 2 and Step 6 in `SKILL.md` | — | `.agents/skills/harness-init/SKILL.md`, `templates/.agents/skills/harness-init/SKILL.md` | `inline` | [x] Hard gate rule 2 mandates plain-language capability phrasing; step 6 requires plain-language scoring questions and stating maturity caps; template and installed copies identical; proofs `proof-harness-init-plain-language-gates` and `proof-harness-init-plain-language-step6` pass |
| 02 | Update scoring reference in `references/harness-score.md` | — | `.agents/skills/harness-init/references/harness-score.md`, `templates/.agents/skills/harness-init/references/harness-score.md` | `inline` | [x] Scoring questions lead with missing capabilities; check IDs are placed as supporting references; non-obvious failures are explained; drop costs on maturity caps are spelled out; template and installed copies identical; proofs `proof-harness-init-plain-language-score-ref`, `proof-harness-init-plain-language-failure-causes`, and `proof-harness-init-plain-language-drop-costs` pass |
| 03 | Update entry mode, ADR migration, and validate wiring references | — | `.agents/skills/harness-init/references/entry-modes.md`, `templates/.agents/skills/harness-init/references/entry-modes.md`, `.agents/skills/harness-init/references/adr-migration.md`, `templates/.agents/skills/harness-init/references/adr-migration.md`, `.agents/skills/harness-init/references/validate-wiring.md`, `templates/.agents/skills/harness-init/references/validate-wiring.md` | `inline` | [x] Entry mode explains instruction structure in plain language; ADR migration explains status mapping and claim mismatches in plain language; validate wiring explains PR automation vs script chaining vs manual invocation; template and installed copies identical; proofs `proof-harness-init-plain-language-entry-modes`, `proof-harness-init-plain-language-adr-migration`, and `proof-harness-init-plain-language-validate-wiring` pass |
| 04 | Add assertions in test suites | 01, 02, 03 | `test/skill-harness-init.test.ts`, `test/harness-init-migration.test.ts` | `inline` | [x] Test suites assert plain-language phrasing for Hard gates, scoring rules, drop costs, entry modes, validate wiring, and ADR status mappings; `pnpm test` runs green with all assertions passing |
| 05 | **Ship gate** | 04 | — | `inline` | [x] Template and installed copies remain identical (`proof-lean-init-copies-identical`); `pnpm validate` exits 0 with 0 legacy warnings (`proof-harness-init-plain-language-validate`); `pnpm lint`, `pnpm comments`, and `pnpm score` pass |

## Wave stops

| Stop | After | Gate |
|------|-------|------|
| **Ship** | 05 | `pnpm test` (all 588 tests pass) + `pnpm validate` (exit 0, 0 legacy-warn) + `pnpm lint` + `pnpm comments` + `pnpm score` |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
|------------|-------------------|-------|-------------------|--------------|------|
| None | None | None | Non-blocking | Resolved | — |

## Frontier order

(01 ∥ 02 ∥ 03) → 04 → **05 STOP**

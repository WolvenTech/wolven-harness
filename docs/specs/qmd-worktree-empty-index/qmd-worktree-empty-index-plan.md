---
type: spec
title: QMD empty index handling in fresh worktrees — plan
description: Work-unit plan to align qmd-first and the qmd skill for qmd status–gated empty-index bootstrap, contract tests, and contributor docs.
status: draft
---

# QMD empty index handling in fresh worktrees — plan

**Spec:** `docs/specs/qmd-worktree-empty-index/qmd-worktree-empty-index-spec.md` (status `stable`)

## Structural gate

Confirmed: obligations R1.1–R1.3, R2.1–R2.2, and R3.1–R3.3 each map to named proofs in the locked spec. Readiness detection is settled: **`qmd status`** (Documents → Total indexed files). No obligation lacks a verification path.

## Work units

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 01 | Standing rule: `qmd status` readiness before search | — | `.agents/rules/qmd-first.md`<br>`templates/.agents/rules/qmd-first.md` | `inline` | [ ] Rule text tells agents to run `qmd status` before treating zero hits as missing decisions; when Total is `0 files indexed`, run `qmd update` then continue ADR-first search; populated index stays query-only; template and live copies match (`proof-qmd-empty-index-readiness-guidance`, `proof-qmd-empty-index-rule-procedure`, `proof-qmd-empty-index-populated-no-mutate`, `proof-qmd-empty-index-mirrors-match` for the rule pair) |
| 02 | QMD skill: empty-index bootstrap vs populated anti-patterns | — | `.agents/skills/qmd/SKILL.md`<br>`templates/.agents/skills/qmd/SKILL.md` | `inline` | [ ] Skill Setup and Anti-patterns allow unasked `qmd update` only when `qmd status` shows zero indexed files; still forbid unasked `qmd collection add` and unasked `qmd embed`; populated-index routine search stays read-only; template and live copies match (`proof-qmd-empty-index-skill-antipattern-refine`, `proof-qmd-empty-index-readiness-guidance`, `proof-qmd-empty-index-populated-no-mutate`, `proof-qmd-empty-index-mirrors-match` for the skill pair) |
| 03 | Contract tests for empty-index guidance | 01, 02 | `test/skill-qmd-empty-index.test.ts` (new) | `inline` | [ ] New tests assert `qmd status` readiness wording, empty-index `qmd update` authorization, populated-index no-mutate language, and template/live byte parity for rule and skill; `pnpm test test/skill-qmd-empty-index.test.ts` and `pnpm test test/seed-extract.test.ts` exit 0 (`proof-qmd-empty-index-seed-extract-adrs-first` and Wave 1 proofs) |
| 04 | **Wave 1 gate** | 03 | — | `inline` | [ ] `pnpm test` and `node dist/cli.js validate` exit 0; Wave 1 acceptance boxes in the spec may be ticked; manual spot-check optional: empty worktree path `qmd status` → `qmd update` → ADR query returns hits — **abort before Wave 2** on failure |
| 05 | Contributor docs: worktree index lifecycle | 04 | `site/search.md`<br>`CONTRIBUTING.md` | `inline` | [ ] Index lifecycle sections state that git worktrees do not share the gitignored SQLite index, name `qmd status` and `qmd update` / agent self-repair as the intended fresh-worktree workflow, and keep Cloud Agent bootstrap text consistent with `.cursor/install.sh` (`proof-qmd-empty-index-site-search`, `proof-qmd-empty-index-contributing`) |
| 06 | **Wave 2 ship gate** | 05 | `docs/specs/qmd-worktree-empty-index/qmd-worktree-empty-index-spec.md` (acceptance checkboxes only) | `inline` | [ ] `pnpm test`, `pnpm lint`, `pnpm harness:comments`, and `node dist/cli.js validate` exit 0; Wave 2 acceptance boxes ticked; `proof-qmd-worktree-empty-index-spec-obligations` holds — ready for `code-commit` / PR update |

## Wave stops

| Stop | After | Gate |
|------|-------|------|
| **1** | Unit 04 | Wave 1 proofs PASS; `pnpm test` and `node dist/cli.js validate` PASS — **abort before Wave 2** on failure |
| **Ship** | Unit 06 | Wave 2 proofs PASS; `pnpm lint` and `pnpm harness:comments` PASS; `node dist/cli.js validate` PASS |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
|---|---|---|---|---|---|
| None | — | — | Non-blocking | Readiness uses `qmd status` (Rafael, 2026-10-26) | — |
| `U-worktree-hook` | Auto `qmd update` on worktree creation | Rafael | Non-blocking | Out of scope for this initiative (2026-10-26) | — |
| `U-harness-init-qmd` | `harness-init` step 0 offers `qmd update` | Rafael | Non-blocking | Out of scope for this initiative (2026-10-26) | — |

## Frontier order

**Wave 1:** (01 ∥ 02) → 03 → **04 STOP**

**Wave 2:** 05 → **06 STOP (ship)**

Units 01 and 02 are disjoint in Owns and may run in parallel. Unit 03 requires both contract texts before tests can lock them.

## Execution / resume section

*(Filled by `code-execute` as units complete.)*

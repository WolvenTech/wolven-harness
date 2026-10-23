---
type: spec
title: Artifact approval summary plan
description: Ordered units to add the shared artifact approval summary reference and workflow steps to create-prd, code-spec, and code-plan.
status: stable
---

# Artifact approval summary — plan

**Source:** `docs/specs/artifact-approval-summary/artifact-approval-summary-spec.md` (status `stable`).

## Units

| # | Title | Depends | Owns | Subagent | Done when |
|---|-------|---------|------|----------|-----------|
| 01 | Shared reference file | — | `templates/.agents/skills/create-prd/references/artifact-approval-summary.md`, same path under `code-spec` and `code-plan`, and mirrored under `.agents/skills/` for all three | `inline` | [x] The three template reference files exist, are byte-identical, and define all five summary sections plus skill-specific table rules. Installed copies match templates. Proofs: `proof-artifact-approval-summary-reference`, `proof-artifact-approval-summary-identical`, `proof-lean-init-copies-identical` |
| 02 | SKILL workflow steps | 01 | Six `SKILL.md` files (three skills × two trees) | `inline` | [x] Each skill cites `references/artifact-approval-summary.md`, requires the summary after first draft and after every material revision before approval, and forbids full-artifact re-paste. Proofs: `proof-artifact-approval-summary-create-prd-step`, `proof-artifact-approval-summary-code-spec-step`, `proof-artifact-approval-summary-code-plan-step`, `proof-artifact-approval-summary-anti-dump` |
| 03 | Skill tests | 02 | `test/skill-artifact-approval-summary.test.ts`, updates to `test/skill-create-prd.test.ts` if workflow numbering shifts | `inline` | [x] New test file passes; create-prd step-order test updated if needed. All proofs in R2 and R1.2 covered |
| 04 | **Wave 1 gate** | 01, 02, 03 | — | `inline` | [x] `pnpm test test/skill-artifact-approval-summary.test.ts test/skill-copies.test.ts` exits 0 |
| 05 | Spec/plan stable + full gate | 04 | `docs/specs/artifact-approval-summary/**` | `inline` | [x] Spec and plan status `stable`; `pnpm test`, `pnpm lint`, `pnpm build`, `pnpm validate` exit 0. Proof: `proof-artifact-approval-summary-validate` |
| 06 | **Ship gate** | 05 | — | `inline` | [x] Wave 2 complete; branch ready for `code-review` and draft `code-pr` with `Fixes #81` |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
|------------|-------------------|-------|-------------------|-------------|------|
| U1 | code-review / code-execute adoption | Human | non-blocking | deferred | — |
| U2 | PR body copy | Human | non-blocking | deferred | — |

## Wave stops

| Stop | After | Gate |
|------|-------|------|
| Wave 1 | unit 04 | Targeted tests PASS |
| Ship | unit 06 | Full test + validate PASS |

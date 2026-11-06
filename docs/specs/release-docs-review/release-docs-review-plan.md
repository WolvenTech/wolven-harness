---
type: spec
title: Review the README and guide for the 0.4.0 release — plan
description: Work-unit plan for correcting the README, the eight Guide pages and the CLI help, checking every statement, and proving the quickstart before the release.
status: draft
---

# Review the README and guide for the 0.4.0 release — plan

**Spec:** `docs/specs/release-docs-review/release-docs-review-spec.md` (status `stable`)

## Structural gate

Confirmed: obligations R1.1–R4.5 each map to one named proof, and `proof-release-docs-review-spec-obligations` prints nothing. The spec is one wave.

R4.1, R4.2 and R4.5 are pull request and merge steps. `code-execute` never opens a pull request, so they sit outside the units below and close when the Human asks for `code-pr`. Their acceptance boxes stay unticked until then.

The ledger lives only in the pull request description. Until that pull request exists, `code-execute` keeps the draft in the session scratchpad, not in the repository.

## Work units

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 01 | Correct the README and Overview entry path | — | `README.md`, `site/index.md`, `test/readme-install.test.ts` where a pinned phrase is stale | `inline` | [x] The README lists the shipped skill sets, names `uninstall`, and both pages put `doctor` after `harness-init` and the first index build; `proof-release-docs-review-readme-skill-sets`, `proof-release-docs-review-readme-uninstall` and `proof-release-docs-review-doctor-order` PASS |
| 02 | Document `uninstall` in the Guide | 01 | `site/install.md` uninstall section, `site/layout.md:22` if the anchor moves, `site/commands.md`, `test/full-install-route.test.ts` where a pinned phrase is stale | `inline` | [x] A reader finds the command, its four flags and what it leaves for `harness-remove`; `proof-release-docs-review-install-uninstall` and `proof-release-docs-review-commands-uninstall` PASS |
| 03 | Correct rule counts and `doctor-entry` levels | 02 | `site/layout.md`, `site/skills.md`, `site/install.md`, `site/runtimes.md`, `site/commands.md` | `inline` | [x] The Guide pages name five rules and the `doctor-entry` row states both levels; `proof-release-docs-review-rule-counts` and `proof-release-docs-review-doctor-levels` PASS |
| 04 | Separate quiet and full install text | 03 | `site/layout.md`, `site/install.md`, `site/commands.md`, `test/harness-init-set.test.ts` where a pinned phrase is stale | `inline` | [x] Each setup statement says which install it describes and matches a clean-repository `git status --short -uall`; `proof-release-docs-review-install-kinds` PASS |
| 05 | Correct the CLI help wording | 04 | `printUsage` in `src/cli.ts` | `inline` | [x] `--help` agrees with the `site/commands.md` overview and behaviour is unchanged; `proof-release-docs-review-help-setup`, `proof-release-docs-review-help-summaries` and `proof-release-docs-review-help-wording-only` PASS |
| 06 | Check every statement and the wording on the eight Guide pages | 05 | `README.md` and the eight Guide pages, for what units 01–05 did not reach | `inline` | [x] Each page has a ledger row, none `open`, each `defect`, including the `.qmd/index.yml` warning if it is one, carries the Human's decision, and a first-time installer can follow the wording; `proof-release-docs-review-guide-ledger`, `proof-release-docs-review-defect-reported` and `proof-release-docs-review-plain-language` PASS |
| 07 | Prove the quickstart end to end | 06 | `README.md` only if a step fails | `spawn` | [x] In a new clean repository, a real `harness-init` Quick setup and `qmd update` lead to `doctor` exit 0, on the last commit state of `README.md`; `proof-release-docs-review-quickstart` and `proof-release-docs-review-quickstart-rerun` PASS |
| 08 | **Ship gate** | 07 | — | `inline` | [x] `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm validate` and `pnpm comments` exit 0; `proof-release-docs-review-docs-build` and `proof-release-docs-review-external-links` PASS |

## Wave stops

| Stop | After | Gate |
|------|-------|------|
| **Ship** | Unit 08 | `pnpm build && pnpm test && pnpm lint && pnpm validate && pnpm comments && pnpm docs:build` PASS, and the external link check is clean — stop here. The pull request is a separate ask |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
|---|---|---|---|---|---|
| `U-site-npm-gap` | The Guide pages go live at the docs merge, ahead of the npm publish. Is a short gap acceptable, or should the two merges happen back to back? | Rafael | Non-blocking for the units; blocks the merge in R4.2 | *(empty until decided)* | R4.2 |

## Frontier order

Units run strictly in order. Units 02, 03 and 04 share pages, and unit 06 must read the corrected text. Unit 07 runs after every README edit, because R1.4 needs a full run on the final README. If unit 07 changes `README.md`, it restarts from setup in a new directory.

## Execution / resume section

### Units 01–06 — README, Guide pages and CLI help

| Field | Value |
|-------|-------|
| Unit identifier | 01–06, run in order, inline, on one set of pages |
| Spec/plan paths | `docs/specs/release-docs-review/release-docs-review-spec.md` / `docs/specs/release-docs-review/release-docs-review-plan.md` |
| Obligation / proof status | R1.1, R1.2, R1.5, R2.1–R2.6, R2.8, R3.1–R3.3 — done; R2.7 — done, the Human held the release for the fix; R1.3, R1.4 — done on the final `README.md`; R4.3, R4.4 — done; R4.1, R4.2, R4.5 — pending the pull request |
| `HEAD` commit | `7275eef` |
| `git status` summary | dirty — only this initiative's PRD, spec and plan |
| Intended diff scope | `README.md`, the eight Guide pages, `src/cli.ts`, the three named tests where a pinned phrase is stale |
| Decision on every discrepancy | R2.8 added on the Human's word during execution, with AC-2.4 in the PRD — resolved. `qmd update` adds a `models:` block to `.qmd/index.yml`, so `doctor` warned `doctor-drift-edited` on every install that followed the README — the Human chose to fix it before the release, as its own change outside this wave's commit |

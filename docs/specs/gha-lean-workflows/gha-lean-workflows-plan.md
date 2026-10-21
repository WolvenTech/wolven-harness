---
type: spec
title: Lean GitHub Actions Workflows Plan
description: Work-unit plan for auditing and optimizing repository GitHub Actions workflows and aligning test assertions.
status: stable
---

# Lean GitHub Actions Workflows Plan

## Structural gate

Confirmed: every obligation in `docs/specs/gha-lean-workflows/gha-lean-workflows-spec.md` (R1.1 through R5.1) pairs with a named proof (`proof-gha-action-versions-pinned`, `proof-gha-ci-concurrency`, `proof-gha-ci-caching`, `proof-gha-ci-gate-integrity`, `proof-gha-ci-least-privilege`, `proof-gha-job-timeouts`, `proof-gha-pages-minimal`, `proof-gha-pages-concurrency`, `proof-gha-release-oidc`, `proof-gha-release-build-artifact`, `proof-gha-tests-pass`). No gaps exist.

## Work units

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 01 | Normalize action versions to Node 24, pin ubuntu-24.04 runner, and add fail-fast job timeouts across all workflows | — | `.github/workflows/ci.yml`<br>`.github/workflows/pages.yml`<br>`.github/workflows/release.yml` | `inline` | [x] All workflow YAML files reference verified Node 24 upstream major versions (`actions/checkout@v7`, `actions/setup-node@v7`, `pnpm/action-setup@v6`, `actions/upload-artifact@v7`, `actions/download-artifact@v8`, `actions/configure-pages@v6`, `actions/upload-pages-artifact@v5`, `actions/deploy-pages@v5`), runners pin `ubuntu-24.04` to eliminate migration notices, and every job specifies explicit `timeout-minutes` (5m for title, 10m for test/lint/package/build) to prevent stale 6-hour hangs (`proof-gha-action-versions-pinned`, `proof-gha-job-timeouts`, `proof-gha-pages-minimal`, `proof-gha-release-oidc`). |
| 02 | Align test suite assertions with workflow optimizations | 01 | `test/pr-gate.test.ts`<br>`test/release.test.ts` | `inline` | [x] `test/pr-gate.test.ts` and `test/release.test.ts` pass cleanly with exit code 0; assertions verify pinned pnpm/Node versions, explicit job timeouts, step naming, and least-privilege permissions without secret leaks (`proof-gha-ci-least-privilege`, `proof-gha-ci-caching`, `proof-gha-tests-pass`). |
| 03 | Wave 1 closeout, harness validation, and spec acceptance verification | 02 | `docs/specs/gha-lean-workflows/gha-lean-workflows-spec.md` | `inline` | [x] Full test suite (`pnpm test`), lint (`pnpm lint`), and doc validation (`node dist/cli.js validate`) pass with exit 0; acceptance checkboxes in `gha-lean-workflows-spec.md` are verified and ticked (`proof-gha-tests-pass`, `proof-gha-lean-workflows-spec-obligations`). |

## Wave stops

| Stop | After | Gate |
|------|-------|------|
| **1** | Unit 03 | `pnpm test && pnpm lint && pnpm validate` PASS (exit 0) — ready for commit and PR |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
|---|---|---|---|---|---|
| `U-artifact-reuse` | Should `package` job reuse build artifact or build independently? | Human / Settled | Non-blocking | Settled: Keep independent build in `package` to maintain full parallel job isolation without pipeline serialization. | 01 |
| `U-action-versions` | Should action versions be aligned with Node 24 runtime? | Human / Settled | Non-blocking | Settled: Align action versions to Node 24 upstream releases (`actions/checkout@v7`, `actions/setup-node@v7`, `pnpm/action-setup@v6`, `actions/upload-artifact@v7`, `actions/download-artifact@v8`, `actions/configure-pages@v6`, `actions/upload-pages-artifact@v5`, `actions/deploy-pages@v5`) and pin `ubuntu-24.04` to eliminate runner deprecation/migration warnings. | 01 |

## Frontier order

**Wave 1:** 01 → 02 → **03 STOP**

Unit 01 updates the workflow YAML contracts, Unit 02 verifies and aligns test suite assertions, and Unit 03 runs the final full gate closeout (`test`, `lint`, `validate`) and ticks spec acceptance checkboxes.

## Execution / resume section

### Wave 1 Summary

| Field | Value |
|---|---|
| Unit identifier | 01, 02, 03 — Wave 1 complete |
| Spec/plan paths | `docs/specs/gha-lean-workflows/gha-lean-workflows-spec.md` / `docs/specs/gha-lean-workflows/gha-lean-workflows-plan.md` |
| Obligation / proof status | R1.1 (`proof-gha-action-versions-pinned`) — done; R2.1 (`proof-gha-ci-concurrency`) — done; R2.2 (`proof-gha-ci-caching`) — done; R2.3 (`proof-gha-ci-gate-integrity`) — done; R2.4 (`proof-gha-ci-least-privilege`) — done; R2.5 (`proof-gha-job-timeouts`) — done; R3.1 (`proof-gha-pages-minimal`) — done; R3.2 (`proof-gha-pages-concurrency`) — done; R4.1 (`proof-gha-release-oidc`) — done; R4.2 (`proof-gha-release-build-artifact`) — done; R5.1 (`proof-gha-tests-pass`) — done |
| `HEAD` commit | `18d7adb` |
| `git status` summary | modified `.github/workflows/{ci,pages,release}.yml`, `test/pr-gate.test.ts`, `test/release.test.ts`, `docs/specs/gha-lean-workflows/` |
| Intended diff scope | `.github/workflows/{ci,pages,release}.yml`, `test/pr-gate.test.ts`, `test/release.test.ts`, `docs/specs/gha-lean-workflows/` |
| Decision on every discrepancy | none |

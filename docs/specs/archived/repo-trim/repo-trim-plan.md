---
type: spec
title: Drop duplicate tests and finished migration checks — plan
description: One mutate batch that deletes the duplicate tests and finished migration pins named in the repo-trim spec, then one gate over the eight proofs.
status: deprecated
source_spec: docs/specs/archived/repo-trim/repo-trim-spec.md
---

# Drop duplicate tests and finished migration checks — plan

**Input:** `docs/specs/archived/repo-trim/repo-trim-spec.md` (status `stable`). The Human approved it on 2026-10-02.
**Next:** after the Human approves this plan → `code-execute`. Pushing and opening a review are a separate `code-pr` ask.

## Structural gate

`proof-repo-trim-spec-obligations` holds. Each acceptance box pairs with one obligation. All nine landings are present. Each `n/a` cites an unchanged surface.

| Acceptance proof | Obligation |
|---|---|
| `proof-repo-trim-copy-check` | R1.1 |
| `proof-repo-trim-help-version` | R1.2 |
| `proof-repo-trim-unknown-command` | R1.3 |
| `proof-repo-trim-template-files` | R1.4 |
| `proof-repo-trim-init-pin` | R2.1 |
| `proof-repo-trim-packages-readme` | R2.2 |
| `proof-repo-trim-packages-workflow` | R2.3 |
| `proof-repo-trim-template-residue` | R2.4 |

`n/a` surfaces: `.github/workflows/ci.yml` permissions and its `concurrency` group, `package.json` `dependencies`, `docs/WRITING-PROFILE.md` statuses, and the `validate: ok` / `comments: ok` lines in [ADR-003](../../../adrs/adr-003-public-contract.md).

The spec's Unresolved table is empty. This plan adds no blocker.

## Work units

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 01 | Drop the harness-init copy duplicate | — | `test/harness-init-stub.test.ts` | `spawn` | The `test()` titled `stub-template: the installed harness-init copy matches the template` is absent. The other `stub-template` tests in that file remain. `proof-lean-init-copies-identical` is still in `test/skill-copies.test.ts` — proof: `proof-repo-trim-copy-check` (`rg` half) |
| 02 | Drop the cli duplicates and the retired `init` pins | — | `test/cli.test.ts` | `spawn` | `usage lists --version`, `unknown command exits 1`, and `setup-dispatch: init is an unknown command and exits 1` are absent. The file no longer asserts `/\binit\b/`. `--help lists setup, validate, and comments` and `no args prints usage listing setup, validate, and comments` still require `setup`, `validate`, and `comments`. `test/contract.test.ts` is byte-identical — proof: `proof-repo-trim-help-version`, `proof-repo-trim-unknown-command`, `proof-repo-trim-init-pin` (`rg` half) |
| 03 | Drop the template-existence duplicate | — | `test/seed-extract.test.ts` | `spawn` | `seed-extract: template files exist` is absent. The other tests in that file remain. `setup-surfaces: creates exactly the expected paths`, `assertSkillBasics('qmd')`, and `assertSkillBasics('pragmatic-guard')` are still present — proof: `proof-repo-trim-template-files` (`rg` half) |
| 04 | Drop the README registry-residue test | — | `test/readme-install.test.ts` | `spawn` | `readme-install: no GitHub Packages registry residue` is absent. `readme-install: the add and setup commands appear, in that order` remains, and the file still contains `pnpm add -D @wolven-tech/harness` — proof: `proof-repo-trim-packages-readme` (`rg` half) |
| 05 | Drop the release-workflow registry pins | — | `test/release.test.ts` | `spawn` | The file no longer mentions GitHub Packages, `npm.pkg.github.com`, or `packages: read\|write`. The test that asserted those lines is retitled `release-oidc: the workflow stores no secret` and still asserts no `secrets.` reference. The other tests in the file stay — proof: `proof-repo-trim-packages-workflow` (`rg` half) |
| 06 | Drop the extract-vocabulary bans | — | `test/template-residue.test.ts` | `spawn` | `canon`, `clickup`, and `cynefin` are gone from the file. The remaining `test()` is titled `template-residue: copied skills contain no concrete ADR token` and still fails on `ADR-` plus three digits under `templates/.agents/skills/adr/`, `templates/.agents/skills/code-review/`, and `templates/.agents/skills/code-spec/references/TEMPLATE.md` — proof: `proof-repo-trim-template-residue` (`rg` half) |
| 07 | **Batch gate** | 01, 02, 03, 04, 05, 06 | `docs/specs/archived/repo-trim/repo-trim-spec.md` (Acceptance boxes only), `docs/specs/archived/repo-trim/repo-trim-plan.md` (resume marks only) | `inline` | All eight `rg` proofs from R1.1–R2.4 pass on the tree. `pnpm test`, `pnpm validate`, and `pnpm comments` exit 0. The spec's Acceptance boxes are checked. Failure → **abort**. Do not start another mutate wave |

## Wave stops

The spec names one mutate batch and no second wave. Units 01–06 are that batch. Unit 07 is the spec's end-of-batch eval, not a second mutate wave.

| Stop | After | Gate |
|------|-------|------|
| **Ship** | 01–06 | Unit 07: the eight `rg` proofs, `pnpm test`, `pnpm validate`, `pnpm comments` — **abort** on failure. Then stop. `code-pr` is a separate ask |

## Unresolved

None. The locked spec's Unresolved table is empty. The consumer legacy-ADR path stays because [ADR-001](../../../adrs/adr-001-claim-path.md) and [ADR-003](../../../adrs/adr-003-public-contract.md) still define it.

## Frontier order

**(01 ∥ 02 ∥ 03 ∥ 04 ∥ 05 ∥ 06) → 07 STOP**

Parallel only while Owns stay disjoint. Unit 02 is the only writer of `test/cli.test.ts`. No unit rewrites `test/contract.test.ts`, `test/skill-copies.test.ts`, `test/setup-surfaces.test.ts`, `src/**`, `templates/**`, `.agents/skills/test-sync/SKILL.md`, or the four consumer legacy-ADR suites.

## Must not touch

- `test/legacy.test.ts`, `test/validate-legacy-folders.test.ts`, `test/harness-init-migration.test.ts`, `test/behaviour-brownfield.test.ts`
- `--version and -v print the package name and version` in `test/cli.test.ts`
- The tests that remain in `test/seed-extract.test.ts` after unit 03
- `src/**`, `templates/**`, `.github/workflows/**`, `docs/adrs/**`, `video/**`, `site/**`
- `.agents/skills/test-sync/SKILL.md`
- This spec's obligation rows. Unit 07 may check Acceptance boxes only

## Execution / resume section

Resolved opt, read before mutate: `.agents/code-commit.config.yml` is absent. `autocommit: false` (default). `autocommit-rule: wave` (default). `code-commit` is installed at `.claude/skills/code-commit/` and is not invoked for this wave.

Pre-start: frontier is units 01–06 in parallel, then unit 07. Spec `docs/specs/archived/repo-trim/repo-trim-spec.md`. Plan `docs/specs/archived/repo-trim/repo-trim-plan.md`. Ship gate is unit 07 (`pnpm test`, `pnpm validate`, `pnpm comments`, and the eight `rg` proofs). No second mutate wave. The Human approved execution on 2026-10-02. Plan `status` stays `draft` because the spec says the mutate batch moves no profile doc between statuses.

### Unit 01 — Drop the harness-init copy duplicate

| Field | Value |
|-------|-------|
| Unit | 01 — Drop the harness-init copy duplicate (frontier, parallel with 02–06) |
| Spec / plan | `docs/specs/archived/repo-trim/repo-trim-spec.md` / `docs/specs/archived/repo-trim/repo-trim-plan.md` |
| Obligations | R1.1 / `proof-repo-trim-copy-check` — done |
| `HEAD` | `e9ad58b` |
| `git status` | dirty — `docs/specs/archived/repo-trim/repo-trim-plan.md` resume section only; isolated from Owns; decision: resolved, do not revert |
| Intended diff | `test/harness-init-stub.test.ts` |
| Discrepancies | none |

### Unit 02 — Drop the cli duplicates and the retired `init` pins

| Field | Value |
|-------|-------|
| Unit | 02 — Drop the cli duplicates and the retired `init` pins (frontier, parallel with 01, 03–06) |
| Spec / plan | `docs/specs/archived/repo-trim/repo-trim-spec.md` / `docs/specs/archived/repo-trim/repo-trim-plan.md` |
| Obligations | R1.2 / `proof-repo-trim-help-version`, R1.3 / `proof-repo-trim-unknown-command`, R2.1 / `proof-repo-trim-init-pin` — done |
| `HEAD` | `e9ad58b` |
| `git status` | dirty — `docs/specs/archived/repo-trim/repo-trim-plan.md` resume section only; isolated from Owns; decision: resolved, do not revert |
| Intended diff | `test/cli.test.ts` |
| Discrepancies | none |

### Unit 03 — Drop the template-existence duplicate

| Field | Value |
|-------|-------|
| Unit | 03 — Drop the template-existence duplicate (frontier, parallel with 01–02, 04–06) |
| Spec / plan | `docs/specs/archived/repo-trim/repo-trim-spec.md` / `docs/specs/archived/repo-trim/repo-trim-plan.md` |
| Obligations | R1.4 / `proof-repo-trim-template-files` — done |
| `HEAD` | `e9ad58b` |
| `git status` | dirty — `docs/specs/archived/repo-trim/repo-trim-plan.md` resume section only; isolated from Owns; decision: resolved, do not revert |
| Intended diff | `test/seed-extract.test.ts` |
| Discrepancies | none |

### Unit 04 — Drop the README registry-residue test

| Field | Value |
|-------|-------|
| Unit | 04 — Drop the README registry-residue test (frontier, parallel with 01–03, 05–06) |
| Spec / plan | `docs/specs/archived/repo-trim/repo-trim-spec.md` / `docs/specs/archived/repo-trim/repo-trim-plan.md` |
| Obligations | R2.2 / `proof-repo-trim-packages-readme` — done |
| `HEAD` | `e9ad58b` |
| `git status` | dirty — `docs/specs/archived/repo-trim/repo-trim-plan.md` resume section only; isolated from Owns; decision: resolved, do not revert |
| Intended diff | `test/readme-install.test.ts` |
| Discrepancies | none |

### Unit 05 — Drop the release-workflow registry pins

| Field | Value |
|-------|-------|
| Unit | 05 — Drop the release-workflow registry pins (frontier, parallel with 01–04, 06) |
| Spec / plan | `docs/specs/archived/repo-trim/repo-trim-spec.md` / `docs/specs/archived/repo-trim/repo-trim-plan.md` |
| Obligations | R2.3 / `proof-repo-trim-packages-workflow` — done |
| `HEAD` | `e9ad58b` |
| `git status` | dirty — `docs/specs/archived/repo-trim/repo-trim-plan.md` resume section only; isolated from Owns; decision: resolved, do not revert |
| Intended diff | `test/release.test.ts` |
| Discrepancies | none |

### Unit 06 — Drop the extract-vocabulary bans

| Field | Value |
|-------|-------|
| Unit | 06 — Drop the extract-vocabulary bans (frontier, parallel with 01–05) |
| Spec / plan | `docs/specs/archived/repo-trim/repo-trim-spec.md` / `docs/specs/archived/repo-trim/repo-trim-plan.md` |
| Obligations | R2.4 / `proof-repo-trim-template-residue` — done |
| `HEAD` | `e9ad58b` |
| `git status` | dirty — `docs/specs/archived/repo-trim/repo-trim-plan.md` resume section only; isolated from Owns; decision: resolved, do not revert |
| Intended diff | `test/template-residue.test.ts` |
| Discrepancies | none |

### Unit 07 — Batch gate

| Field | Value |
|-------|-------|
| Unit | 07 — Batch gate (after 01–06) |
| Spec / plan | `docs/specs/archived/repo-trim/repo-trim-spec.md` / `docs/specs/archived/repo-trim/repo-trim-plan.md` |
| Obligations | R1.1–R2.4 — done. Acceptance boxes checked. |
| `HEAD` | `e9ad58b` |
| `git status` | dirty — the six test files plus this plan and the spec Acceptance boxes; all in this wave; decision: resolved |
| Intended diff | `docs/specs/archived/repo-trim/repo-trim-spec.md` (Acceptance boxes only), `docs/specs/archived/repo-trim/repo-trim-plan.md` (resume marks only) |
| Discrepancies | none |

Wave gate evidence, this session: eight `rg` proofs passed; `test/contract.test.ts` byte-identical; `pnpm test` 552 pass, 0 fail; `pnpm validate` `validate: ok` (93 claims, 0 failures); `pnpm comments` `comments: ok (0 findings)`. One wave, so one commit covers units 01–07.

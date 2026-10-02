---
type: spec
title: Include untracked files in validate scans
description: RepoContext lists tracked and untracked non-ignored paths so validate catches new docs before git add.
status: stable
---

# Include untracked files in validate scans

**Source:** confirmed ask — GitHub issue #34; merge untracked non-ignored paths into validate the way `comments` already does.
**Next:** After approval → `code-plan` → `code-execute`.
**Named proof (structural gate):** `proof-validate-untracked-spec-obligations`

## Repository grounding

| Surface | Present today | Role for this initiative |
|---------|----------------|---------------------------|
| `src/validate/repo.ts` | yes | Builds `RepoContext.files` from tracked paths only |
| `src/comments/diff.ts` | yes | `listChangedFiles` unions diff + `git ls-files --others --exclude-standard` |
| `src/validate/profile.ts` | yes | `listUntrackedAdrFiles` for superseded_by messaging when successor is untracked |
| `test/validate-repo.test.ts` | yes | Covers ignore filtering on `buildRepoContext` |
| `test/validate-successor.test.ts` | yes | Expects git-add hint when successor is untracked — updates with new behavior |

## Surface walk

- **In scope:** `src/validate/repo.ts`; tests under `test/` that assert file-list behavior; successor test adjusted for untracked ADRs in `ctx.files`.
- **Out of mutate scope:** `comments` command, spine on-disk reads, ADR profile, claim modules, `.wolven-harness.json` schema.

## Requirements (obligation ↔ proof)

### R1 — RepoContext includes untracked non-ignored files

| ID | Obligation | Named proof | Evidence shape |
|----|------------|-------------|------------------|
| R1.1 | `buildRepoContext` unions tracked `git ls-files -z` with `git ls-files --others --exclude-standard`, deduped and sorted | `proof-validate-untracked-union` | Unit test on `buildRepoContext` with an untracked file under the repo root |
| R1.2 | Harness `ignore` entries drop untracked paths the same way they drop tracked paths | `proof-validate-untracked-ignore` | Extend ignore test with an untracked file under `vendor/` |
| R1.3 | End-to-end validate fails on an untracked bad doc without `git add` | `proof-validate-untracked-e2e` | CLI test mirroring issue #34 repro (bad note + claim) exits 1 |

### R2 — Superseded-by behavior stays correct

| ID | Obligation | Named proof | Evidence shape |
|----|------------|-------------|------------------|
| R2.1 | A deprecated ADR whose stable successor exists only on disk (untracked) passes validate | `proof-validate-untracked-successor` | Update successor test to expect exit 0 |

## Nine-dimension landings

| Dimension | Landing kind | Landing |
|-----------|---------------|---------|
| validation | obligation | R1 proofs via `pnpm test` and `pnpm validate` |
| failure modes | obligation | Git unavailable still fails claim gate as today; empty untracked list is a no-op |
| idempotency and retry | n/a | Read-only git queries; unchanged |
| authorization | n/a | Local git read; unchanged |
| concurrency and ordering | n/a | Single-process CLI; unchanged |
| data lifecycle | obligation | Untracked files read from disk via existing `ctx.read`; no writes |
| external-dependency failure | n/a | Same `execGit` behavior as tracked listing |
| state transitions | obligation | After `git add`, file stays in list (tracked); validate result stable |
| observability | n/a | No new stdout lines required beyond existing error output |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition |
|------------|-------------------|-------|-------------------|-------------|
| — | — | — | — | — |

## Out of scope

- Warning-only mode for skipped untracked files
- Changing `comments` base resolution
- New ADR for scan semantics (behavior matches existing `comments` precedent)

## Pragmatic-guard refuses

- Scanning gitignored paths (must keep `--exclude-standard`)
- Docs-only filter (full repo union, same as tracked list today)

## Acceptance

### Wave 1

- [x] `proof-validate-untracked-union`, `proof-validate-untracked-ignore`, and `proof-validate-untracked-e2e` pass in `pnpm test`
- [x] `proof-validate-untracked-successor` passes in `pnpm test`
- [x] `pnpm build`, `pnpm validate`, and `pnpm lint` exit 0

## Eval / gates

| Gate | Command / check | When | PASS | Abort |
|------|-------------------|------|------|-------|
| Integrity | `pnpm test` | End of wave 1 | exit 0 | Fix before commit |
| Harness | `pnpm build && pnpm validate` | End of wave 1 | exit 0 | Fix before commit |
| Spec obligations | All R* rows have named proofs | Before `code-plan` | all hold | Do not plan |

## Cross-domain leak table

| Leak | Refuse |
|------|--------|
| Publish npm release | out of scope |
| Executable plan from this skill | `code-plan` only |

## ADR

No new ADR — aligns validate with existing `comments` untracked handling; no durable architecture fork.

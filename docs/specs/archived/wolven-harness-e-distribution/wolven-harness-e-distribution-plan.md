---
type: spec
title: Wolven harness E — Public npm distribution (Code plan)
description: Ordered work units for spec E — rename, OIDC release job, PR gate job and README in one package PR (E1); npm org, seed publish, trusted publisher, the 0.2.0 release and a zero-config install (E2); ruleset and spec C records (E3).
status: archived
tags: [spec, code-plan, harness, release, npm, wolven]
generated: { by: claude-code/code-plan, at: 2026-09-28T22:00:00Z }
updated: { by: claude-code/code-execute, at: 2026-09-28T23:30:00Z, note: "E3 STOP passed: ruleset requires package-gate, spec C records superseded, PR #10 closed; spec C resumes at unit 12" }
---

# Wolven harness E — Public npm distribution (Code plan)

- **Spec:** docs/specs/archived/wolven-harness-e-distribution/wolven-harness-e-distribution-spec.md (`stable`, approved 2026-09-28)
- **Sibling plan:** docs/specs/archived/wolven-harness-c-dogfood/wolven-harness-c-dogfood-plan.md. Its unit 12 waits on this plan's E3.
- **Next:** Approved 2026-09-28 → `code-execute` from unit 01.

## Structural gate (before planning)

`proof-whe-spec-obligations`: PASS 2026-09-28. 11 R rows carry 11 distinct proof ids, each once. The 11 acceptance boxes name the same set. All nine landings are `obligation / proof`, with no `n/a`. The 4 Unresolved rows are typed.

## Execution setup

| Item | Value |
|------|-------|
| Package clone | `/Users/rafael/Desktop/wolven-harness`, clean at `origin/main` `ee173aa` (0.1.1) |
| Package branch | `feat/npm-public`, cut from `origin/main` |
| PRs | Ask-only (`code-pr`), with Conventional Commit titles. The Human merges every PR, release PRs included |
| Builders | `builder` with `model: sonnet`. The parent runs the gates and checks each return against Done when |
| Commits | `autocommit-rule: wave`: one package commit at the E1 gate, and one OMT commit per wave for this plan and the records. OMT commits ride PR #30 |

### Seams fixed by the plan

- **Version.** The E1 PR is titled `feat(release): …`. With manifest `0.1.1` and `bump-minor-pre-major`, release-please proposes `0.2.0`. The seed `0.2.0-seed.0` sorts below it.
- **Seed build.** After E1 merges, the parent prepares a throwaway worktree of `main` in the scratchpad, sets `0.2.0-seed.0` with `npm version --no-git-tag-version` and builds it. The Human runs `npm publish --tag seed --access public` there with their 2FA login. Nothing is committed, and the seed has no provenance.
- **npm CLI in the release job.** Node 22's bundled npm is 10.x. The builder either installs npm ≥ 11.5.1 in the job or uses a Node line that bundles it, and the test pins whichever choice it makes. `package.json` `repository.url` already names `WolvenTech/wolven-harness`, which provenance needs.
- **Required check name.** Unit 03 names the PR gate job. Unit 14 adds that exact name to the ruleset.
- **Release PR checks.** As in spec C, release PRs opened by `GITHUB_TOKEN` start no workflows. The parent closes and reopens the release PR so both required checks run.
- **Test names.** Each unit's tests start with its proof's short id (`package-name:`, `release-oidc:`, `pr-gate:`, `readme-install:`), without the `proof-whe` prefix, as in spec C.

## Wave stops

| Stop | After unit | Gate |
|------|------------|------|
| **E1** | 07 | Package gate, residue grep, PR gate green on the E1 PR, and the Human's merge — **abort before E2** |
| **E2** | 13 | Release run green; `0.2.0` is `latest` with provenance; seed deprecated; zero-config install passes — **no C3 otherwise** |
| **E3** | 16 | OMT `pnpm docs:index && pnpm validate` PASS — spec C resumes at C3 |

## Unresolved

Dispositions are the ones in the approved spec.

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
|---|---|---|---|---|---|
| `U-e-npm-org` | Create npm org `wolven-tech` (free, public packages) under the Human's npm account with 2FA | Human | **Blocks E2** | **Resolved 2026-09-28:** `wolven` was taken; the Human created org `wolven-tech` and chose `@wolven-tech/harness`. Renamed on PR #11 in `b58e7bf` | 08 |
| `U-e-ghp-cleanup` | Delete or keep `@wolventech/wolven-harness@0.1.1` on GitHub Packages, and agentic-mkt's grant on it | Human | Non-blocking | Keep untouched; decide at spec C's closure | — |
| `U-e-adr` | Record the npm distribution decision as an ADR in the package repo | Human | Non-blocking | Offer at E1 | 05 |
| `U-e-pr9-order` | Merge PR #9 before or after E1 | Human | Non-blocking | Either order works. If #9 lands first, E1's gate also runs its `harness:validate` | 06 |

## Work units

### Wave E1 — one package PR

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 01 | Rename and publish config (R1.1) | — | `package.json` (`name`, `publishConfig`), `release-please-config.json`, `AGENTS.md`, `test/init-install.test.ts`, the manifest assertions in `test/release.test.ts` | *(omit)* | The manifest is named `@wolven-tech/harness`, `bin.wolven-harness` is unchanged, `publishConfig` is `{ "access": "public" }`, and `package-name` matches. `init`'s missing- and misplaced-devDependency hints name `@wolven-tech/harness`. `package-name:` and `init-install` tests pass — `proof-whe-package-name` |
| 02 | OIDC release job (R1.2) | 01 | `.github/workflows/release.yml`, the workflow assertions in `test/release.test.ts` | *(omit)* | The job publishes with the npm CLI ≥ 11.5.1 and `--access public`. Permissions per R1.2 as amended by E-Q5: only a publish job with no project install holds `id-token: write`; a tag `workflow_dispatch` re-runs it. There is no `registry-url`, `NODE_AUTH_TOKEN` or secret, and install, build and test still run first. `release-oidc:` tests pass — `proof-whe-release-oidc` |
| 03 | PR gate job (R1.3) | 01 | `.github/workflows/ci.yml`, a `pr-gate:` test | *(omit)* | On `pull_request`, the job runs `pnpm install --frozen-lockfile`, build, test, `validate` and `comments`, with pnpm and Node pinned and read-only permissions. Its job name is recorded in the resume for unit 14. `pr-gate:` tests pass. The live run is checked at 07 — `proof-whe-pr-gate` |
| 04 | README install and release (R1.4) | 01 | `README.md`, `test/readme-install.test.ts` | *(omit)* | Install is `pnpm add -D @wolven-tech/harness`, then `pnpm exec wolven-harness init`, with no `.npmrc`, token, `packages: read` or Actions-access text. The Release section covers the trusted publisher and the first-publish seed. `readme-install:` tests assert both the presence and the absence — `proof-whe-readme-install` |
| 05 | ADR offer (`U-e-adr`) | — | package `docs/adrs/adr-002-*.md` only on a yes | `inline` | The Human answers. On a yes, the ADR records public npmjs with OIDC and passes the package's own `validate`. On a no, the resume says "declined" |
| 06 | **E1 gate** and commit | 02, 03, 04, 05 | — | `inline` | `rm -rf dist && pnpm build && pnpm test && pnpm validate && pnpm comments` exits 0. R1.5's `rg` prints nothing (`proof-whe-residue`). If PR #9 is on `main`, `pnpm harness:validate` also exits 0. One `feat(release): …` commit on `feat/npm-public`. Failure → **abort** |
| 07 | **E1 STOP** — PR, checks, merge | 06, Human asks `code-pr`, Human merges | OMT spec E (E1 boxes), this plan | `inline` | `gh pr checks` shows the PR gate and `conventional-title` green on the E1 PR (`proof-whe-pr-gate`, live half). The Human merges, and the squash SHA goes in the resume. E1 boxes are ticked and OMT validate exits 0 |

### Wave E2 — first npm release

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 08 | npm org (`U-e-npm-org`) | 07 | this plan (Unresolved, resume) | `inline` | The Human creates org `wolven-tech` with 2FA on. `npm org ls wolven` or the Human's confirmation is in the resume. If the scope is taken → stop and re-decide |
| 09 | Seed publish (R2.1) | 08 | scratchpad worktree only | `inline` | Following the seed seam, the Human publishes `0.2.0-seed.0` under `seed`. `npm view @wolven-tech/harness dist-tags` shows `seed` and no `latest` — `proof-whe-seed` |
| 10 | Trusted publisher (R2.2) | 09 | — (npmjs settings, Human) | `inline` | The trusted publisher names `WolvenTech/wolven-harness` and `release.yml`. Publishing access is "Require two-factor authentication and disallow tokens". The Human's confirmation or `npm trust` output is in the resume — `proof-whe-trusted-publisher` |
| 11 | Release 0.2.0 (R2.3) | 10, Human merges | this plan (resume) | `inline` | The release PR shows `0.2.0`. After the parent closes and reopens it, both checks are green and the Human merges. The release run is green, and `v0.2.0` and its Release exist. `npm view @wolven-tech/harness@0.2.0 --json` shows `latest` with a provenance attestation. The Human deprecates `0.2.0-seed.0` with a pointer to `0.2.0` and removes the `seed` tag. If publish fails after tagging and nothing published, the parent runs `release` by hand for `v0.2.0`; a version that published is never republished — `proof-whe-first-npm-release` |
| 12 | Zero-config install (R2.4) | 11 | scratchpad repo only | `inline` | Current pnpm, no `.npmrc` and no token in the env. `pnpm add -D @wolven-tech/harness@0.2.0` and `pnpm exec wolven-harness init --git-host gh --runtimes claude` exit 0. `.wolven-harness.json` has `packageVersion: "0.2.0"` and there is no devDependency warning. Any `minimumReleaseAgeExclude` entry goes in the resume — `proof-whe-zero-config-install` |
| 13 | **E2 STOP** | 12 | OMT spec E (E2 boxes), this plan | `inline` | Units 09–12's evidence is in the resume, E2 boxes are ticked, and OMT validate exits 0. Failure → **no C3** |

### Wave E3 — records

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 14 | Ruleset requires the PR gate (R3.1) | 13, Human OK | ruleset 24128126 | `inline` | With the Human's OK, the ruleset's required checks are `conventional-title` and unit 03's job name. `gh api repos/WolvenTech/wolven-harness/rules/branches/main` shows both — `proof-whe-ruleset` |
| 15 | Spec C records and PR #10 (R3.2) | 13 | OMT `docs/specs/archived/wolven-harness-c-dogfood/wolven-harness-c-dogfood-spec.md`, `docs/specs/archived/wolven-harness-c-dogfood/wolven-harness-c-dogfood-plan.md` (unit 12 row) | `inline` | Spec C marks C-Q10, R1.3, R2.1's registry, R2.2's permissions, R2.5's privacy and R3.1's auth clause as superseded by spec E. Plan C's unit 12 installs `@wolven-tech/harness` with no `.npmrc`, token or `packages: read`. On the Human's OK, PR #10 is closed with a pointer to spec E — `proof-whe-records` |
| 16 | **E3 STOP** | 14, 15 | OMT spec E (E3 boxes), this plan | `inline` | `pnpm docs:index && pnpm validate` prints `validate-harness: ok`, E3 boxes are ticked, and there is one OMT commit. Spec C resumes at unit 12. Spec E's closure rides spec C's unit 24 |

## Frontier

**E1:** 01 → (02 ∥ 03 ∥ 04) ∥ 05 → **06** → **07 STOP**

**E2:** 08 → 09 → 10 → 11 → 12 → **13 STOP**. Strictly serial: a trusted publisher needs an existing package.

**E3:** (14 ∥ 15) → **16 STOP**

02–04 have disjoint Owns, so they can run as parallel builders. 01 and 02 share `test/release.test.ts`; 01 runs first. Never start 08 before the E1 merge.

## Execution / resume section

### Wave E1 — units 01–07

| Field | Value |
|-------|-------|
| Unit | E1: 01 → (02 ∥ 03 ∥ 04) ∥ 05 → 06 → 07 |
| Spec / plan | `docs/specs/archived/wolven-harness-e-distribution/wolven-harness-e-distribution-spec.md` / `docs/specs/archived/wolven-harness-e-distribution/wolven-harness-e-distribution-plan.md` |
| Obligations | `proof-whe-package-name`, `proof-whe-release-oidc`, `proof-whe-pr-gate`, `proof-whe-readme-install`, `proof-whe-residue` — done at 06; `proof-whe-pr-gate` live half at 07 |
| `HEAD` | OMT `509340b` + this record; package `feat/npm-public` at `b58e7bf` (pushed; PR #11 open) → merged to `main` as `6b2a362` |
| `git status` | OMT: this plan only; package clean |
| Intended diff | Package: `package.json`, `release-please-config.json`, `AGENTS.md`, `.github/workflows/{release,ci}.yml`, `README.md`, `test/{release,readme-install,init-install}.test.ts`, new `pr-gate:` and `package-name:` tests. OMT: this plan and spec E's E1 boxes |
| Discrepancies | (1) Before E1, the residue `rg` hits release.yml, release-please-config.json, AGENTS.md, package.json and README — the expected starting state. (2) `feat/npm-public` tracks `origin/main`; `code-pr` pushes with `-u origin HEAD`, which resets the upstream — resolved |

**Evidence (01–06):**

- **01:** name `@wolven-tech/harness`, `publishConfig` `{ access: public }`, `package-name` matches; `init`'s hints name the new package. `package-name:` and `init-install` tests pass.
- **02:** permissions `contents`/`pull-requests: write` + `id-token: write`; a gated `npm install -g npm@11.20.0` step (Node 22 bundles npm 10.x), then install, build, test, `npm publish --access public`; no `registry-url`, `NODE_AUTH_TOKEN` or `secrets.`. `release-oidc:` tests pass.
- **03:** `ci.yml`, job id **`package-gate`** (unit 14's required check), `contents: read`, pnpm `11.28.2`, Node 22, `fetch-depth: 0` because `comments` diffs against the merge-base with `origin/main`. `pr-gate:` tests pass.
- **04:** README install is two commands; the Release section covers the PR gate, trusted publishing, provenance and the seed. The parent fixed the seed sentence's tense and "required checks" (plural). `readme-install:` tests pass.
- **05:** Human said yes → `docs/adrs/adr-002-public-npm-oidc.md` (`stable`); package `validate` shows `claims: 2 ok`.
- **06:** `rm -rf dist && pnpm build && pnpm test && pnpm validate && pnpm comments` → 482/482 pass, `validate: ok`, `comments: ok (0 findings)`. R1.5's `rg` → no output (`proof-whe-residue`). No dev-time ids in the added lines. `npm pack --dry-run` → `@wolven-tech/harness`, 79 files. PR #9 not on `main`, so no `harness:validate`. Commit `d49a3b4 feat(release): publish publicly to npmjs as @wolven-tech/harness`.
- **Review (PR #11, Human agreed to fix all seven kept findings):** `code-review` found the publish unretryable after tagging and the OIDC grant shared with release-please, install and tests. Fixed in `f55f214 fix(release): isolate the OIDC publish job and allow a manual re-run`: three jobs (release-please; read-only build uploading `dist`; publish with `id-token: write`, no project install, `npm publish --access public --ignore-scripts`); `workflow_dispatch` with a `tag` input; `ci.yml` adds the npm 11.20.0 pin and `npm pack --dry-run` (`npm publish --dry-run` fails once the version on `main` is published — checked with npm 11.20.0); the release build pins pnpm `11.28.2` like CI; README Release lists the trusted-publisher fields, "disallow tokens" and the manual re-run; ADR-002 says those npm settings live on npmjs; the README test slices the Release section to the next heading. Spec E gained E-Q5 and amended R1.2, R1.3 and the retry landings. Package gate: 485/485, `validate: ok`, `comments: ok`, residue empty; PR checks green again (`package-gate` 36s). New actions (`upload-artifact`, `download-artifact`) are GitHub-owned, which the repo's selected-actions policy allows.
- **Rename (U-e-npm-org):** `b58e7bf fix(release): publish under the wolven-tech npm scope` — gate 485/485, pack names `@wolven-tech/harness`, PR checks green; PR title now `feat(release): publish publicly to npmjs as @wolven-tech/harness`. Spec E's E-Q2 amended.
- **Lean cut before merge (Human, 2026-09-28):** fold a dead-code and stale-docs cleanup into PR #11 before merging it — dedupe and consolidate tests (keep single-owner wording pins), add an MIT license. Handed off to Cursor; the checklist is in the session handoff.
- **07:** PR [#11](https://github.com/WolvenTech/wolven-harness/pull/11) opened on the Human's `code-pr`. `gh pr checks 11`: `package-gate` pass (24s, run 36472954487) and `conventional-title` pass — the live half of `proof-whe-pr-gate`. The Human merged PR #11 on 2026-09-28 as **`6b2a362`** (squash, with the lean cut folded in: shared test helpers, deduped skill-contract tests, `LICENSE` MIT). **E1 STOP passed.**
- **Gate re-run on `main` `6b2a362` (2026-09-28):** `rm -rf dist && pnpm build && pnpm test` → 465/465 (down from 485 by the dedupe; every proof prefix still has passing tests); `validate: ok` (`claims: 2 ok`); `comments: ok (0 findings)`; R1.5's `rg` → no output.
- **Outside the plan:** PR [#12](https://github.com/WolvenTech/wolven-harness/pull/12) `fix(init): reject incomplete and unknown input` merged before #11 as `c262c70` (`src/init/options.ts` and its tests). It lands in the 0.2.0 changelog next to #11. PR #9 is still not on `main`.
- **Discrepancy for unit 15:** the lean cut's `LICENSE` contradicts spec D R4.1 ("`LICENSE` is absent", already merged) and spec C R6.1 and Out of scope ("no `LICENSE`"). The Human chose the license, so spec C's R6.1 must drop the `LICENSE` clause before the C1/C4 residue gate re-runs; unit 15 amends it with the other spec C records. Spec D carries a post-merge note.

### Wave E2 — units 08–13 (opened 2026-09-28)

| Field | Value |
|-------|-------|
| Unit | E2: 08 → 09 → 10 → 11 → 12 → 13 |
| Obligations | `proof-whe-seed`, `proof-whe-trusted-publisher`, `proof-whe-first-npm-release`, `proof-whe-zero-config-install` |
| `HEAD` | OMT PR #30 head; package `main` `6b2a362` |
| Discrepancies | (1) release-please already opened the 0.2.0 release PR (`chore(main): release 0.2.0`, branch head `46d8332`: manifest, `package.json` and the changelog for #11 and #12). **Do not merge it before units 09 and 10:** OIDC trusted publishing needs the package to exist on npmjs, so merging first tags `v0.2.0` with nothing published (recoverable only through the tag `workflow_dispatch`). (2) `npm view @wolven-tech/harness` → 404 on 2026-09-28: nothing published yet, `seed` included |

**Evidence:**

- **08:** done at E1 (`U-e-npm-org` resolved: org `wolven-tech`).
- **09:** the parent rehearsed the seed in a scratchpad worktree of `6b2a362` (`npm publish --tag seed --access public --dry-run` → `@wolven-tech/harness@0.2.0-seed.0`, 83 files, 99.3 kB). The Human published it from a local worktree with their 2FA login (`+ @wolven-tech/harness@0.2.0-seed.0`; the `npm view` right after returned 404 while the new package propagated). Registry on 2026-09-28: versions `["0.2.0-seed.0"]`, dist-tags `{ seed: 0.2.0-seed.0, latest: 0.2.0-seed.0 }`. **Discrepancy:** npm points `latest` at a package's first version whatever `--tag` says, so "no `latest`" cannot hold. It is harmless: unit 11's `npm publish` moves `latest` to `0.2.0`, and unit 11 then checks that. `proof-whe-seed` PASS with that amendment.
- **10:** the Human added the trusted publisher on npmjs: GitHub Actions, `WolvenTech/wolven-harness`, `release.yml`, no environment (the `publish` job declares none), permissions `npm publish` and `npm stage publish` ("Allow npm publish" is needed because the job runs `npm publish`). Screenshot confirmed 2026-09-28. Pending: publishing access "Require two-factor authentication and disallow tokens".
- **11:** the Human closed and reopened the release PR, then merged it as `5ef7d19` (#14, `chore(main): release 0.2.0`, changelog for #11 and #12). **Discrepancy:** the unit's text assumed the merge tags and publishes, but the `release.yml` that #11 shipped skips the GitHub Release on push, and its README says so. The Human then ran `release` by hand with the tag empty: `v0.2.0` and its Release appeared at 21:46 UTC, and the publish job followed. Registry: dist-tags `{ latest: 0.2.0, seed: 0.2.0-seed.0 }`, and `0.2.0` carries an SLSA v1 provenance attestation. Pending: deprecate `0.2.0-seed.0`, remove the `seed` tag, and set publishing access to "Require two-factor authentication and disallow tokens" (the README places this after the first OIDC release).
- **12:** run in a scratchpad repo with pnpm 10.33.0, no `.npmrc` and no npm token in the env. `pnpm add -D @wolven-tech/harness@0.2.0` and `pnpm exec wolven-harness init --git-host gh --runtimes claude` both exit 0. `.wolven-harness.json` has `packageVersion: "0.2.0"`, there is no devDependency warning (only the `warnMissingDevDependency` step trace), and `pnpm harness:validate` prints `validate: ok`. No `minimumReleaseAgeExclude` was needed. `proof-whe-zero-config-install` PASS.
- **10/11 close-out (Human, 2026-09-28):** publishing access set to "Require two-factor authentication and disallow tokens" (Human's confirmation). Seed cleaned up: `0.2.0-seed.0` is deprecated ("Placeholder for trusted publishing; use 0.2.0 or later") and dist-tags are `{ latest: 0.2.0 }`. `proof-whe-trusted-publisher` and `proof-whe-first-npm-release` PASS.
- **13:** **E2 STOP passed.** Units 09–12 evidence above; E2 boxes ticked; OMT validate exits 0. E3 opens at units 14 ∥ 15.

### Wave E3 — units 14–16 (opened 2026-09-28)

- **14:** the Human set the ruleset's required checks to `conventional-title` and `package-gate` (Human's confirmation, 2026-09-28). `proof-whe-ruleset` PASS.
- **15:** spec C marks C-Q7, C-Q10, R1.3, R2.1's registry, R2.2's permissions and publish clauses, R2.5's privacy and R3.1's auth clause as superseded by spec E, keeping the original text. C-Q7 is added to R3.2's list because it says merging publishes privately. R6.1 drops the `LICENSE` clause, and Out of scope and the leak table no longer list public publishing or a `LICENSE`. Plan C unit 12 installs `@wolven-tech/harness` with no `.npmrc`, token or CI auth change and now depends on E3. Plan C's finished units 06 and 11 keep their historical wording. OMT `pnpm docs:index && pnpm validate` → `validate-harness: ok`. The Human closed PR #10 with a pointer to spec E (2026-09-28). `proof-whe-records` PASS.
- **16:** **E3 STOP passed.** All 11 spec E boxes ticked; OMT validate exits 0. Spec C resumes at unit 12. Spec E's closure rides spec C's unit 24.

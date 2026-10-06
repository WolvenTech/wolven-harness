---
type: spec
title: Wolven harness C — Distribution and dogfood (Code plan)
description: Ordered work units for Entrega C — validate and init fixes, manifest, release and PR-title workflows and the install README in C1; the 0.1.0 release in C2; the agentic-mkt install and harness-init run in C3; defect patches and behavioural fixtures in C4; evidence, records and initiative closure in C5.
status: stable
tags: [spec, code-plan, harness, dogfood, release, wolven]
generated: { by: claude-code/code-plan, at: 2026-09-28T21:00:00Z }
---

# Wolven harness C — Distribution and dogfood (Code plan)

- **Spec:** docs/specs/archived/wolven-harness-c-dogfood/wolven-harness-c-dogfood-spec.md (`stable`, approved 2026-09-28)
- **PRD:** docs/prds/archived/wolven-ai-assisted-dev-harness/wolven-ai-assisted-dev-harness-prd.md (notes "shipped-artifact language" and "merges, versions, and changelog")
- **Projeto:** docs/prds/archived/wolven-ai-assisted-dev-harness/wolven-ai-assisted-dev-harness-project.md — Entrega C
- **Sibling plans:** docs/specs/archived/wolven-harness-a-core/wolven-harness-a-core-plan.md · docs/specs/archived/wolven-harness-b-wizard/wolven-harness-b-wizard-plan.md · docs/specs/archived/wolven-harness-d-code-lane/wolven-harness-d-code-lane-plan.md
- **Next:** Approved 2026-09-28 → `code-execute` from unit 01, run by the Human.
- **Handed off (2026-10-06):** the open C3 and C5 units are tracked in [#46](https://github.com/WolvenTech/wolven-harness/issues/46).

## Structural gate (before planning)

`proof-whc-spec-obligations`: PASS 2026-09-28. 23 R rows carry 23 distinct proof ids, each once; the 23 acceptance boxes name the same set; nine landings; the only `n/a` is in the gate's own text.

## Execution setup

| Item | Value |
|------|-------|
| Package clone | `/Users/rafael/Desktop/wolven-harness`, clean on `main` at `4af0e7c` |
| Package branches | Each cut from `origin/main`: `feat/c-release` (C1), `fix/<topic>` per defect (unit 18), `test/behaviour-fixtures` (C4) |
| agentic-mkt clone | Cloned by unit 12 to `/Users/rafael/Desktop/agentic-mkt`; branch `chore/wolven-harness` from `origin/main` (`531652f` today) |
| PRs | Ask-only (`code-pr`), titled as Conventional Commits. The Human merges every PR, including release PRs |
| Builders | `builder` with `model: sonnet` and `code-execute`'s brief; the parent runs gates and reviews each return against Done when |
| Commits | `autocommit-rule: wave`: one package commit per package wave gate, one OMT commit per wave for this plan's marks and records; OMT rides PR #30 |

### Seams fixed by the plan

- **The run happens in a fresh session.** Units 13–15 run in a new agent session opened in the agentic-mkt clone, where the Human invokes `harness-init` as any consumer would. This session knows the traps (a)–(i), so running the wizard here would prove nothing about whether the wizard asks. This session checks the result afterwards (unit 16).
- **First version.** `.release-please-manifest.json` starts at `0.0.0` with `bump-minor-pre-major: true`, so the `feat` commits already on `main` produce `0.1.0`.
- **Release PR title check.** Release PRs are opened by `GITHUB_TOKEN` and start no workflows. The parent closes and reopens each one with the Human's `gh` login so the required check runs, then the Human merges.
- **Defects before fixtures.** The run can't resume until a fix is published, so each defect gets its own `fix:` PR and patch release (unit 18) during C3. The fixtures for the whole run land after C3 in one `test:` PR (unit 19), which triggers no release. This is how the plan reads R4.2's "same C4 branch".
- **Test files and prefixes.** Each unit adds its own test file; test names start with the proof's short id (`superseded-resolves:`, `legacy-archived:`, …) so gates map proofs by `grep`, as in B.

## Wave stops

| Stop | After | Gate |
|------|-------|------|
| **C1** | 09 | Package gate + greps green; title check proven; ruleset on; PR squash-merged — **no release otherwise** |
| **C2** | 11 | `v0.1.0` released private; agentic-mkt granted; scratch install and `init` succeed — **no dogfood otherwise** |
| **C3** | 17 | agentic-mkt PR CI green; honest green reviewed; (a)–(i) checked; Human merged — **a package defect goes to unit 18 first** |
| **C4** | 20 | Package gate + greps green; fixture PR merged — **no closure otherwise** |
| **Ship** | 24 | Pre-merge closure on the follow-up OMT PR; `pnpm docs:index && pnpm validate` PASS |

Package gate = `rm -rf dist && pnpm build && pnpm test && pnpm validate && pnpm comments` exit 0. Greps = PRD sweep and spec C's R6.1 greps, all `--hidden --glob '!.git'`, empty apart from named hand-reviewed hits; no `LICENSE`.

## Unresolved

Carried from the spec with its dispositions; neither blocks.

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
|---|---|---|---|---|---|
| `U-c-org-admin` | Admin steps on WolvenTech (done 2026-09-28 apart from two) | Human (repo admin) | Non-blocking | Ruleset in C1, package Actions access in C2, `gh api` output as evidence | 08, 11 |
| `U-a-cloud-app` | Claude GitHub App on WolvenTech | Human (org admin) | Non-blocking | Carried from spec A, still deferred | — |

## Work units

Subagent *(omit)* = spawn `builder` (sonnet). `writer` = spawn `writer` (sonnet). `inline` = the parent runs it.

### Wave C1 — package fixes, manifest, workflows, README

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 01 | Successor must resolve (R0.1) | — | `src/validate/profile.ts`, `test/validate-successor.test.ts` | *(omit)* | A deprecated ADR whose `superseded_by` names no `docs/adrs/<value>.md` fails `profile-superseded-by`, naming the value; an existing successor, even a deprecated one, passes. Tests: missing → error; existing → none; deprecated → deprecated → stable → none — `proof-whc-superseded-resolves` |
| 02 | Archived legacy and unrecognized ADR folders (R0.2, R0.3) | — | `src/validate/legacy.ts`, `src/validate/index.ts`, a new check module if cleaner, `test/validate-legacy-folders.test.ts` | *(omit)* | Legacy detection skips any `archived` segment. A tracked `adr`/`adrs`/`decisions` folder with `NNNN-*.md` files raises one `adr-unrecognized` warning (exit 0) naming the folder, the count, and that 4-digit numbers aren't checked. Tests: the R0.2 and R0.3 fixtures — `proof-whc-legacy-archived`, `proof-whc-adr-unrecognized` |
| 03 | Install warning and config carry-forward (R1.1, R1.2) | — | `src/init/{config,index}.ts`, a new init module if cleaner, `test/init-install.test.ts` | *(omit)* | `init` warns (exit 0, writes nothing) when `package.json` lacks the package in `devDependencies`, and not when there is no `package.json`. Every run writes `packageVersion` and keeps all existing keys, `comments` and unknown ones included; `readConfig` accepts `packageVersion`. Tests: the R1.1 and R1.2 fixtures — `proof-whc-init-devdep`, `proof-whc-init-config` |
| 04 | Manifest and release workflow (R2.1, R2.2) | — | `package.json`, `.github/workflows/release.yml`, `release-please-config.json`, `.release-please-manifest.json`, `test/release.test.ts` | `inline` | `publishConfig.registry` and `repository.url` set; `pnpm pack --dry-run` lists only `dist/`, `templates/`, `package.json`, `README.md`. The workflow runs release-please on push to `main` and, on `release_created`, installs, builds, tests and publishes with `GITHUB_TOKEN`; permissions are exactly `contents: write`, `pull-requests: write`, `packages: write`. Tests read the manifest, config and workflow — `proof-whc-package-manifest`, `proof-whc-release-workflow` (inspection; green run at unit 10) |
| 05 | PR-title workflow (R2.3) | — | `.github/workflows/pr-title.yml`, `test/pr-title.test.ts` | `inline` | Runs on `opened`, `edited`, `synchronize`, `reopened`; checks Conventional Commits; `pull-requests: read` only. Test reads the triggers and permissions — `proof-whc-pr-title` (live half at unit 08) |
| 06 | Install and release sections of the README (R1.3, R2.3) | — | `README.md`, `test/readme-install.test.ts` | *(omit)* | Install covers the two `.npmrc` lines, `NODE_AUTH_TOKEN` locally (`read:packages`) and in CI (`packages: read`, the package's Actions access), `pnpm add -D`, `pnpm exec wolven-harness init`. A release section says to close and reopen the release PR before merging. Clone-and-build moves to a contributor section. No dev-time ids. Test asserts the phrases — `proof-whc-readme-install` |
| 07 | **C1 package gate** and commit | 01–06 | — | `inline` | Package gate and greps green (`proof-whc-no-residue`, `proof-whc-sweep`, C1 half); each C1 proof maps to passing tests by prefix. One package commit on `feat/c-release` through `code-commit` |
| 08 | PR, live title check, ruleset (R2.3, R2.4) | 07 | GitHub PR and repo ruleset | `inline` | On the Human's ask, the PR is open with a Conventional title and the title check green. Editing the title to a bad one fails the check; restoring it passes. With the Human's OK, a ruleset on `main` requires that check; `gh api …/rulesets` output goes to the resume |
| 09 | **C1 STOP** — merge and record | 08, Human squash-merge | OMT spec C (C1 boxes), this plan | `inline` | Squash SHA on `main`; package gate re-run on `main` green; C1 boxes ticked with test counts; OMT `pnpm docs:index && pnpm validate` exit 0; PR #30 amended |

### Wave C2 — first release

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 10 | Release PR 0.1.0 | 09 | GitHub release PR (read and reopen only) | `inline` | The release PR bumps to `0.1.0` with a `CHANGELOG.md` of the squash commits; after close and reopen its title check is green; the Human merges; the release run is green (`gh run list --workflow release.yml`) — `proof-whc-release-workflow` (green run) |
| 11 | **C2 STOP** — release, access, scratch install | 10 | OMT spec C (C2 boxes), this plan | `inline` | `gh release view v0.1.0` shows the Release. The Human confirms the package is private, grants agentic-mkt Actions read access, and runs `gh auth refresh -s read:packages`. In the scratchpad, `pnpm add -D @wolventech/wolven-harness@0.1.0` with `NODE_AUTH_TOKEN` and `pnpm exec wolven-harness init --git-host gh --runtimes claude` succeed. Repo settings via `gh api` in the resume. Boxes ticked; OMT validate exit 0 — `proof-whc-repo-settings`, `proof-whc-first-release` |

### Wave C3 — dogfood run in agentic-mkt

Units 13–15 are the wizard's own phases (entry, migration, setup) in the fresh session. The traps listed are checked afterwards, not prompted.

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 12 | Install (R3.1, as amended by spec E) | 11, spec E's E3 | agentic-mkt `package.json`, `pnpm-lock.yaml` | `inline` | Branch cut from `origin/main`; `pnpm add -D @wolven-tech/harness` updates the lockfile, with no `.npmrc`, token, `packages: read` or CI auth change. The Human runs `pnpm exec wolven-harness init` and picks the runtimes; `.wolven-harness.json` has `packageVersion`. Install files committed; `init` output left for the wizard's phases. Feeds `proof-whc-dogfood-install` (CI green at 17) |
| 13 | Step 0 — entry (fresh session) | 12 | agentic-mkt `AGENTS.md`, `CLAUDE.md`, `.gitignore`, `WOLVEN.md`, session note | `inline` | `harness:validate` shows no `step0-pending`; entry phase committed on the Human's yes. Traps expected here: (a) ignored adapters, (b) the "never versioned" rule, (c) the mode |
| 14 | Step 1 — ADR migration (fresh session) | 13 | agentic-mkt `adrs/**` → `docs/adrs/**`, files whose links or claims move, session note | `inline` | Migration phase committed at `validate` exit 0 with `0 legacy-warn`. Traps expected here: (e) ADR-001, (f) pinned test tokens, (g) ADR-003, (h) pre-renumbering citations, (i) `adrs/README.md`. Feeds `proof-whc-honest-green` (checked at 16) |
| 15 | Steps 2–6 — setup (fresh session) | 14 | agentic-mkt `docs/**`, `.agents/**`, runtime wiring, session note | `inline` | Session note `stable` with seven sections; 2–4 stubs (or the B-Q10 reason), each one `skill-stub-open`; setup phase committed. Trap (d), the `harness:validate` wiring, asked at any step. Feeds `proof-whc-wizard-landing` (checked at 17) |
| 16 | Independent check, ADR-999, PR (R3.2–R3.4) | 15 | agentic-mkt PR (on the Human's ask), this plan's resume | `inline` | This session reads the session note and ticks (a)–(i) with the line of each question and answer; any trap without its question → C3 fails and unit 18 fixes the wizard. Every per-ADR row checked against its ADR body; `pnpm harness:validate` exit 0 with `0 legacy-warn, 0 fail`; an uncommitted `ADR-999` claim → exit 1 `claim-missing`, removed → exit 0. PR open, table review in its body — `proof-whc-expected-questions`, `proof-whc-honest-green`, `proof-whc-adr999` |
| 17 | **C3 STOP** — CI and merge | 16, Human review and merge | OMT spec C (C3 boxes), this plan | `inline` | PR checks green (`proof-whc-dogfood-install`); the Human reviews the table and merges; phased commits and the merge SHA in the resume (`proof-whc-wizard-landing`); boxes ticked; OMT validate exit 0 |

### Wave C4 — defects and fixtures

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 18 | Defect fix and patch release (R4.2) — only if the run hits one | a defect in 12–16 | `fix/<topic>` branch: the fix, its fixture test | *(omit)* | Per defect: fix plus a fixture named for the case; package gate green; PR merged by the Human; release PR reopened and merged; patch published; agentic-mkt bumps with `pnpm up`; the step re-runs from the `draft` note. Defect → SHA → version → re-run in the resume — `proof-whc-run-defects` |
| 19 | Behavioural fixtures (R4.1) | 17 | `test/behaviour-*.test.ts` on `test/behaviour-fixtures` | *(omit)* | Every case (a)–(i) that `validate` can show has a fixture with its expected output, named for the case; `rg -i agentic-mkt test` empty; case → test table in the resume — `proof-whc-behaviour-fixtures` |
| 20 | **C4 STOP** — gate, PR, merge | 19 (and 18 if it ran) | OMT spec C (C4 boxes), this plan | `inline` | Package gate and greps green (`proof-whc-no-residue`, `proof-whc-sweep`, C4 half); `test:` PR merged by the Human (no release); boxes ticked; OMT validate exit 0 |

### Wave C5 — evidence and closure (OMT)

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 21 | Evidence note (R5.1), follow-up PR | 20 | `docs/notes/wolven-harness-agentic-mkt-dogfood.md` | `writer` | The note records versions, the agentic-mkt PR and merge SHA, the live answers, the (a)–(i) checklist, the per-ADR summary, the `validate` and ADR-999 outputs, the stubs, and defects (or "none"), sourced from the session note and this resume. OMT validate exit 0 — `proof-whc-evidence-note` |
| 22 | Records (R5.2) | 21 | PRD acceptance boxes, TAP ("C pronta", closing condition), spec C acceptance | `inline` | Each box ticked with its cite; OMT validate exit 0 — `proof-whc-records` |
| 23 | Initiative closure (R5.3) | 22 | `git mv` of spec C and plan C to `docs/specs/archived/` (A, B, D, E archived in PR #30), the PRD folder to `docs/prds/archived/`; pointers that name the old paths | `inline` | All moved files `status: archived`; no active doc points at an old path; no OMT ADR for this initiative; OMT `pnpm docs:index && pnpm validate` exit 0 — `proof-whc-closure` |
| 24 | **Ship gate** | 23 | follow-up OMT PR body | `inline` | Pre-merge closure per `pre-merge-closure.md` holds; the follow-up PR body is current; `qmd update`. Stop for the Human's merge |

## Frontier

- **C1:** (01 ∥ 02 ∥ 03 ∥ 04 ∥ 05 ∥ 06) → **07** → 08 → **09 STOP**
- **C2:** 10 → **11 STOP**
- **C3:** 12 → 13 → 14 → 15 → 16 → **17 STOP**; unit 18 interrupts whenever a defect appears
- **C4:** 19 (after 17) → **20 STOP**
- **C5 (follow-up OMT PR, after C3 closes):** 21 → 22 → 23 → **24 Ship**

C1 Owns are disjoint, so 01–06 run together. Builders run `pnpm test` only (never `pnpm build`), never edit `test/helpers/**`, and never run `init` outside a fixture.

## Builder brief additions

- No dev-time ids (R, C-Q, unit, wave, proof ids) and no consumer names in code, tests, messages or README.
- Before returning: `pnpm comments` and the PRD sweep over the touched files, outputs pasted.
- Fixtures use `makeRepo` / `minimalValidateFixture` from `test/helpers/fixture.ts`.

## Execution / resume section

*(Filled as waves close: gate output, SHAs, `gh api` output, live answers, the case → test table.)*

### PR #30 merges at partial closure (Human, 2026-09-29)

- A, B, D and E are archived in PR #30 with `status: archived`.
- Spec C, plan C, the PRD, the TAP, the ideas and the deferrals stay active.
- C3 resumes after the wolven-harness fix for (g) and (h) ships and agentic-mkt re-runs.
- Units 21–24 (C5) move to a follow-up OMT PR: evidence note, records, archiving C and the PRD.

### Wave C1 — units 01–09

| Field | Value |
|-------|-------|
| Unit | C1 done: 01–07 (package commit `95065e4`, review fixes `fbc7113`, `907356e`), 08 (PR #4, title check proven both ways, ruleset 24128126), 09 (squash `3f424b3` on `main`, gate re-run green). C2 next: unit 10 waits on the release-version fix PR |
| Spec / plan | `docs/specs/archived/wolven-harness-c-dogfood/wolven-harness-c-dogfood-spec.md` / `docs/specs/archived/wolven-harness-c-dogfood/wolven-harness-c-dogfood-plan.md` |
| Obligations | done: `proof-whc-superseded-resolves`, `-legacy-archived`, `-adr-unrecognized`, `-init-devdep`, `-init-config`, `-readme-install`, `-package-manifest`, `-pr-title`, and the C1 half of `-no-residue` and `-sweep`. `proof-whc-release-workflow`: fail at inspection (discrepancy (6)), carried to unit 10 |
| `HEAD` | OMT `a74ef70` (`cursor/wolven-ai-harness-idea-084a`); package `main` `3f424b3`, fix branch `fix/release-initial-version` at `fbbe26e` (local) |
| `git status` | OMT dirty: this plan and spec C's C1 boxes (Owns of unit 09). Package clean |
| Intended diff | Package: `src/validate/{profile,legacy,index}.ts` (+ a check module), `src/init/{config,options,index}.ts` (+ an init module), `package.json`, `.github/workflows/{release,pr-title}.yml`, `release-please-config.json`, `.release-please-manifest.json`, `README.md`, `test/{validate-successor,validate-legacy-folders,init-install,release,pr-title,readme-install}.test.ts`. OMT: this section, then spec C's C1 boxes at 09 |
| Discrepancies | Resolved: (1) unit 03 also owns `src/init/options.ts`, which builds the config `writeConfig` writes. Spec C's surface walk lists it; no other C1 unit touches it. (2) `test/claims.test.ts`'s `claim-deprecated` fixture pointed `superseded_by` at a missing ADR, so unit 01's rule stopped it at the profile; the parent added the successor ADR to the fixture, intent unchanged. (3) Parent review tightened unit 01 to `docs/adrs/<value>.md` only (the `adr` skill's "filename without `.md`"), gave unit 02's helper a plain JSDoc and a warning text naming "4-digit ADR numbering", and fixed the README contributor command to run the clone's `dist/cli.js` by absolute path. (4) The R6.1 consumer-name grep over `test` hits two absence checks already on `main` (`test/skill-harness-init.test.ts:23`, `test/harness-init-discovery.test.ts:68`): named hand-reviewed hits under the plan's greps rule; unit 19's `rg -i agentic-mkt test` treats the first the same way. (5) `/code-review` on #4 raised 10 findings; the Human had all of them fixed in #4 (package `fbc7113`, `907356e`). Two go past spec C's wording and are kept on the Human's call. R0.2: a claim whose only match is an archived legacy copy warns instead of failing `claim-missing`; the archived copy still raises no `legacy-adr` and no `claim-duplicate`. R0.3: `docs/adrs/` is skipped, since the profile already rejects a 4-digit name there. Folder names match in any case, archived paths are skipped, and `adr-NNNN-*.md` names count. All R0.2/R0.3 fixtures still pass. (6) Escalated to the Human: after the squash, release-please opened #5 as `chore(main): release 1.0.0`. With no earlier release tag, release-please ignores the manifest's `0.0.0` and uses `initial-version`, which defaults to `1.0.0` (`strategies/base.ts`, `initialReleaseVersion()`). So `bump-minor-pre-major` never applied, and unit 04's inspection test checked a setting that doesn't decide the first version. Fix: `initial-version: "0.1.0"` on the root package plus the test assertion, package `fbbe26e` `fix(release): start the first release at 0.1.0` on `fix/release-initial-version`, gate green (480 pass). #5 must not be merged at 1.0.0. Once the fix merges, release-please should rewrite #5 at 0.1.0, and unit 10 starts there |

**C1 gate (unit 07, 2026-09-28):** `rm -rf dist && pnpm build && pnpm test && pnpm validate && pnpm comments` → exit 0; 471 tests pass, 0 fail; `validate: ok` (`claims: 2 ok, 0 legacy-warn, 0 fail`); `comments: ok (0 findings)`. Proof → tests by prefix: `superseded-resolves:` 3, `legacy-archived:` 1, `adr-unrecognized:` 3, `init-devdep:` 3, `init-config:` 2 new (+6 on `main`), `readme-install:` 9, `package-manifest:` 2, `release-workflow:` 5 (inspection; green run at unit 10), `pr-title:` 3 (live half at unit 08). `pnpm pack --dry-run` → `package.json`, `README.md`, `dist/**`, `templates/**` only. PRD sweep → only the hand-reviewed hits named at B2 (Code-lane tests, `test/skill-harness-init.test.ts`'s consumer-name regex); spec D's R4.1 and R4.3 greps over `templates src .github` empty; consumer-name grep → the two absence checks in (4); no `LICENSE`. Package commit `95065e4` on `feat/c-release`.

**Unit 08 (2026-09-28):** PR [WolvenTech/wolven-harness#4](https://github.com/WolvenTech/wolven-harness/pull/4) opened on the Human's `/code-pr`, titled `feat: publish to GitHub Packages through release-please, with install and validate fixes`. The `pr-title` run ended `startup_failure`: `gh api repos/WolvenTech/wolven-harness/actions/permissions` → `allowed_actions: local_only`, so every non-local action (including `actions/*` and the release-please action) is blocked; the org policy returns 403 to this token. Escalated; the Human chose the admin fix: Allowed actions → selected, GitHub-owned actions plus `googleapis/release-please-action@*`, `pnpm/action-setup@*`, `amannn/action-semantic-pull-request@*` (free, within C-Q14). Workflows unchanged. After the org change the repo still read `local_only`; on the Human's OK the parent set it with the repo-admin token (`PUT …/actions/permissions allowed_actions=selected`), and the repo now reads `allowed_actions: selected`, `github_owned_allowed: true`, `patterns_allowed: [googleapis/release-please-action@*, pnpm/action-setup@*, amannn/action-semantic-pull-request@*]` (inherited from the org).
Live title check: the title without its type (edited at 16:17) → `conventional-title` fail, run 36450170557 (`No release type found in pull request title`); the Conventional title restored → pass, run 36450272292.
Ruleset (on the Human's OK): `gh api repos/WolvenTech/wolven-harness/rulesets` → id 24128126, "main: conventional PR title", `target: branch`, `enforcement: active`; `gh api …/rules/branches/main` → `required_status_checks` `[{context: conventional-title, integration_id: 15368}]`. Repo merge settings: `allow_squash_merge: true`, `allow_merge_commit: false`, `allow_rebase_merge: false`, `squash_merge_commit_title: PR_TITLE`, `delete_branch_on_merge: true`. PR #4 `MERGEABLE`, `CLEAN`. Unit 08 done; unit 09 waits on the Human's squash-merge.

**Review fixes (2026-09-28):** the Human ran `/code-review` on #4 and asked for every finding to be fixed in the PR (discrepancy (5)). Package `fbc7113` `fix(validate): …` and `907356e` `fix(init): …` on `feat/c-release`. Gate `rm -rf dist && pnpm build && pnpm test && pnpm validate && pnpm comments` → exit 0; 480 tests pass, 0 fail (9 new: `legacy-archived:` +2, `adr-unrecognized:` +3, `superseded-resolves:` +1, `init-devdep:` +1, `init-config:` +1, `ignore:` +1); `validate: ok`; `comments: ok (0 findings)`. Diff grep for dev-time ids and banned names: empty.

**Unit 09 (2026-09-28):** the Human squash-merged #4 at 16:52 as `3f424b3` on `main`. On `main`, `pnpm install --frozen-lockfile && rm -rf dist && pnpm build && pnpm test && pnpm validate && pnpm comments` → exit 0; 480 pass, 0 fail; `validate: ok`; `comments: ok (0 findings)`. Tests by prefix: `superseded-resolves:` 4, `legacy-archived:` 3, `adr-unrecognized:` 6, `init-devdep:` 4, `init-config:` 9, `readme-install:` 9, `package-manifest:` 2, `release-workflow:` 5, `pr-title:` 3. The release run on the squash push was green (run 36454145988, 22s) and published nothing. It opened release PR #5 at 1.0.0: discrepancy (6). Spec C's C1 boxes are ticked except `proof-whc-release-workflow`, which closes at unit 10. C1 STOP met.

### Wave C2 — units 10–11

| Field | Value |
|-------|-------|
| Unit | C2 done: 10 (release `v0.1.1`, green run), 11 (settings, grant, scratch install and `init`). C3 next: unit 12 waits on the README fix PR (discrepancy (9)) |
| Spec / plan | `docs/specs/archived/wolven-harness-c-dogfood/wolven-harness-c-dogfood-spec.md` / `docs/specs/archived/wolven-harness-c-dogfood/wolven-harness-c-dogfood-plan.md` |
| Obligations | done: `proof-whc-release-workflow` (green run), `proof-whc-repo-settings`, `proof-whc-first-release` (at `v0.1.1`) |
| `HEAD` | OMT `0d9558c`; package `main` `ee173aa`, README fix branch `docs/readme-user-level-auth` at `b41a5f7` (local); agentic-mkt cloned at `/Users/rafael/Desktop/agentic-mkt`, `main` `531652f` |
| `git status` | OMT dirty: this plan and spec C (C2 boxes; C-Q10, R1.3 and R3.1 amended per (9)). Package clean |
| Intended diff | GitHub release PRs (read and reopen only); package fixes (discrepancies (8), (9)); this plan; spec C's C2 boxes and C-Q10 |
| Discrepancies | Resolved: (7) #6 (`initial-version: "0.1.0"`) squash-merged as `42325f8`. release-please then rewrote #5 as `chore(main): release 0.1.0` (manifest `0.1.0` plus `CHANGELOG.md` of #2, #3, #4 and #6; `package.json` was already `0.1.0`). (8) The Human's call: ship 0.1.1. #5 merged as `f1dd917`; run 36458953370 tagged `v0.1.0` and created the Release, then `pnpm test` failed (`release-workflow:` pinned the manifest at `0.0.0`, which the release rewrites) and publish was skipped, so no package exists (`gh api orgs/WolvenTech/packages/npm/wolven-harness` → 404). The Human chose 0.1.1 over deleting the tag. The v0.1.0 Release notes now say it isn't published. Fix: package `e9d94ba` `fix(release): stop pinning the release manifest version in tests` (manifest checked by shape only); gate green (480 pass, `validate: ok`, `comments: ok`). Unit 10's "bumps to `0.1.0`" and unit 11's `@0.1.0` become `0.1.1`. #7 merged as `cf6c2ed`. (9) The Human's call: fix consumer auth now. The scratch install with the README's committed token line failed: pnpm 11.24.0 printed "Ignored project-level auth setting … environment variables are not expanded in registry credentials that come from a project .npmrc", then `ERR_PNPM_FETCH_401`. With fresh stores, pnpm 11.5.1 (agentic-mkt's pin) installs from the same `.npmrc` and 11.24.0 fails. The same token line in user-level config passes on 11.24.0. C-Q10, R1.3 and R3.1 in spec C are amended: the committed `.npmrc` keeps only the registry line; the token line goes in `~/.npmrc` locally and comes from `setup-node` (`registry-url`, `scope`) in CI. Package `b41a5f7` `docs(readme): keep the registry token line in user-level config` on `docs/readme-user-level-auth`: gate green (481 pass, one new `readme-install:` test). It is docs-only, so no release. It merges before unit 12 |

**Unit 10 (2026-09-28):** #5 had no checks; after close and reopen, `conventional-title` passed (run 36458803755), `CLEAN`. The #6 push's release run was green (36458741164) and published nothing, as expected. The #5 merge run is discrepancy (8).

**Unit 10, continued (2026-09-28):** #8 `chore(main): release 0.1.1` had `package.json` and the manifest at `0.1.0 → 0.1.1` and a `CHANGELOG.md` entry for #7. It had no checks; after close and reopen, `conventional-title` passed (run 36464753764). Build and tests on its head `7965633` → 480 pass, `validate: ok`. The Human merged it as `ee173aa`; release run 36465035308 passed (`pnpm test` and `pnpm publish` both `success`). `gh release view v0.1.1` → published 18:25:15Z. `proof-whc-release-workflow` done.

**Unit 11 (2026-09-28):** The Human granted agentic-mkt Actions read access and ran `gh auth refresh -s read:packages` (scopes now include `read:packages`). `gh api orgs/WolvenTech/packages/npm/wolven-harness` → `visibility: private`, repository `WolvenTech/wolven-harness`; versions `["0.1.1"]`. The Human confirmed private visibility on the settings page, the agentic-mkt grant (no REST endpoint lists it) and a $0 budget or no payment method. Repo settings (`gh api repos/WolvenTech/wolven-harness`): `allow_squash_merge: true`, `allow_merge_commit: false`, `allow_rebase_merge: false`, `squash_merge_commit_title: PR_TITLE`, `delete_branch_on_merge: true`. `…/actions/permissions/workflow` → `can_approve_pull_request_reviews: true`. Ruleset 24128126 is `active` and requires `conventional-title` (integration 15368). The org-level Actions-PR and private-package settings need `admin:org` to read. They are shown in effect: release-please opened #5 and #8, and the workflow published a private package. The repo itself is `public`; only the package is private. Scratch install in the scratchpad (pnpm 11.24.0, registry line in the project `.npmrc`, token line in a user-level config, `NODE_AUTH_TOKEN=$(gh auth token)`): `pnpm add -D @wolventech/wolven-harness@0.1.1` → exit 0. `pnpm exec wolven-harness init --git-host gh --runtimes claude` → exit 0; 57 paths created; no devDependency warning. `.wolven-harness.json` has `packageVersion: "0.1.1"`. `harness:validate` → `validate: ok` (only `step0-pending` warns). pnpm 11 also added the new package to `minimumReleaseAgeExclude` in a `pnpm-workspace.yaml`; unit 12 will see the same in agentic-mkt. C2 STOP met.

### Wave C3 — units 12–17 (opened 2026-09-28)

**Unit 12 (2026-09-28):** The Human installed `@wolven-tech/harness@0.2.0` in agentic-mkt and ran `init` (spec E's zero-config path). The wizard phases then ran in fresh sessions on agentic-mkt branch `chore/wolven-harness` (not pushed at the time of the report).

**Units 13–15 (Human's run report, 2026-09-28):** three phased commits, each shown as a diff and committed on the Human's yes.

| Unit | Commit | Phase | Outcome |
|---|---|---|---|
| 13 | `5959774` | Entry (step 0), 62 files | Light mode (388-line curated `AGENTS.md`); WOLVEN.md folded and deleted. Re-include rules for `.agents/{skills,rules,hooks}` and `.claude/skills`; the "never versioned" policy names them as its one exception. The standing rules are adopted by reference. The Human dropped Compozy, so deferrals go to `docs/deferrals/` and stale task-ID notes were rewritten to the code's real state. The run wrote `! git check-ignore -q` with several paths (git rejects `-q` with more than one, and `!` hid the error) and then fixed it itself; the pattern is not in the templates |
| 14 | `895a639` | ADR migration, 26 files | 002 and 004–009 → `stable`. 001 → deprecated → 004, with its still-binding idempotency deferral split into new ADR-010 (which records the best-effort dedup the code already has). 003 → deprecated → new ADR-011 (OpenAI gpt-4.1-mini). 10 failing references resolved (the 6 idempotency references include `harness.test.ts` ×2, whose test name and token changed). A meaning check caught pre-renumbering citations in `AGENTS.md` and the workflow builders, and 18 other references were read as correct. `adrs/README.md` was deleted on the Human's choice. `harness:comments` caught an untagged edited comment |
| 15 | `0eec788` | Setup (steps 2–6), 6 files | QMD built (13 docs, no embeddings). Lifecycle: prototype. Research: repo-only. 3 suggestions, 2 stubs (`n8n-workflow-builders`, `clickup-contract`), each `skill-stub-open`. `.qmd/index.sqlite*` added to `.gitignore` on the Human's choice. Session note `stable` |

Final state per the report: `harness:validate` exits 0, 48 references resolve, 0 fail, and the only warnings are the 2 `skill-stub-open`. agentic-mkt's `pnpm test` (494 pass, 5 skipped), `build:workflows:check`, `lint:code-nodes` and `harness:comments` pass.

**Unit 16, provisional (from the report; the independent read of the session note and the ADR-999 check wait on the branch being pushed):**

| Trap | Asked? | Evidence in the report |
|---|---|---|
| (a) ignored adapters + re-include | yes | Phase 1 check 2 |
| (b) "never versioned" rule overlap | yes | Phase 1 check 2 |
| (c) entry mode | probably | Light mode is recorded, but the report doesn't show the question; confirm in the note |
| (d) `harness:validate` wiring (C-Q11) | **no** | Not raised in any phase, and `harness-init` has no such step → **wizard defect**; unit 18 fixes it |
| (e) ADR-001 partial supersession | yes | Split into ADR-010 on the Human's choice |
| (f) pinned test tokens | yes | `harness.test.ts` ×2 repointed to 010, name and token changed |
| (g) ADR-003 without a successor | yes | Successor ADR-011 recorded on the Human's choice |
| (h) pre-renumbering citations | yes | Meaning check with git history |
| (i) `adrs/README.md` | yes | Deleted on the Human's choice |

Per the unit's rule, the missing (d) fails C3 until unit 18's fix and a re-run of the setup question.

**Unit 16, independent check (2026-09-28, agentic-mkt `chore/wolven-harness` at `7dcaf14`, pushed; no PR yet):**

- **Session note** `docs/notes/harness-init-2026-09-28/harness-init-2026-09-28-note.md` (174 lines; Entry integration, ADR migration, Discovery, Research, Suggestions, Stubs, Next steps). It confirms (a), (b), (e)–(i) as questions with the Human's answers. For **(c)** it records only "Mode: **light**, chosen because `AGENTS.md` was a long, curated policy file", with no question or answer, so (c) is **not evidenced**. That's a wizard defect: step 0 must put the mode to the Human and the note must record it. The fix joins unit 18. The branch also carries the Human's run report as a second note (`7dcaf14`).
- **Honest green:** after `pnpm install --frozen-lockfile` (pnpm 11.5.1), `pnpm harness:validate` → `claims: 48 ok, 0 legacy-warn, 0 fail`, `validate: ok`, exit 0, with 2 `skill-stub-open` warnings. ADR frontmatter matches the note's table: 000, 002, 004–011 `stable`; 001 `deprecated` → `adr-004-…`; 003 `deprecated` → `adr-011-…`. No code or doc outside `docs/adrs/` and `docs/notes/` cites ADR-001 or ADR-003. The Human still reviews the table against the ADR bodies on the dogfood PR.
- **ADR-999:** an uncommitted `// why: see ADR-999 …` in `src/call-agent/logic.ts` → `error [claim-missing] … ADR-999: no profile or legacy ADR found`, exit 1; reverted → exit 0. `proof-whc-adr999` PASS.
- **Verdict:** C3 holds at unit 16 on (c) and (d). Both fixes ride `feat/friendly-init`; after `0.2.1`, agentic-mkt bumps and re-runs step 0's mode question and the setup wiring question from a `draft` note.

**Units 18–19 on `feat/friendly-init` (2026-09-28; a `builder` (sonnet), checked by the parent in a clean worktree):**

- `a409b91 fix(harness-init): ask how harness:validate is wired and ignore the QMD index`. Step 6 opens with the wiring question: (a) a CI job on PRs, (b) chained into an existing `validate`/`test` script, (c) local only. It detects first, puts the recommended option first, and writes nothing without a yes (`references/validate-wiring.md`). The note template gains a `## Validate wiring` section. `init` installs `.qmd/.gitignore` (`index.sqlite*`) from `templates/.qmd/gitignore`, because npm strips `.gitignore` files from tarballs.
- `8e8e4a0 fix(harness-init): ask the entry mode and record the answer in the session note`. Step 0 always puts the mode as one question, with the recommendation and its reason first, and never picks silently. The note records the question, the recommendation and the answer.
- `ca4b06b test(validate): add behaviour fixtures for brownfield migration cases` (`proof-whc-behaviour-fixtures`):

| Case | Test (`test/behaviour-brownfield.test.ts`) |
|---|---|
| (a) ignored adapters | `behaviour: ignored adapter folders fail harness-ignored until re-include rules follow the broad ignore` |
| (e) partly binding superseded ADR | `behaviour: a partly binding superseded ADR is split into a stable successor and references repointed` |
| (f) pinned test token | `behaviour: a test file pinning a deprecated ADR token fails claim-deprecated until repointed to the successor` |
| (g) successor recorded / missing | `behaviour: a superseded ADR is resolved by a recorded successor, and a missing successor file is a profile error` |
| (i) legacy index left behind | `behaviour: a legacy index file left beside migrated ADRs is invisible to validate until it cites a deprecated ADR` |
| (h) wrong-decision citation | not visible to `validate`; no test |

- Parent gate on `8e8e4a0`: 497/497, `validate: ok`, `comments: ok (0 findings)`, `npm pack --dry-run` lists `templates/.qmd/gitignore` (88 files), and the residue `rg` hits only the pre-existing detection patterns.
- **PR:** opened on the Human's `code-pr` as [WolvenTech/wolven-harness#16](https://github.com/WolvenTech/wolven-harness/pull/16), titled `fix(init): guided setup, skill sets and harness-init fixes from the first brownfield run`. **Versioning (Human, 2026-09-28):** patch-only releases were the plan; superseded by the 0.3.0 release record below. After release, agentic-mkt bumps and re-runs step 0's mode question and the setup wiring question from a `draft` note, then units 16–17 close.

**Release (2026-09-29): `0.3.0`, not `0.2.1`.** The Human merged #16 (`cd7a19c`), then [#15](https://github.com/WolvenTech/wolven-harness/pull/15) (`feat(cli)!`, `init` renamed to `setup`) and [#18](https://github.com/WolvenTech/wolven-harness/pull/18) (ADR-003 public CLI contract, `--version`, `harness:score`) before cutting a release. release-please rolled all three into `v0.3.0` (#19, `9442cfc`), which supersedes the patch-only rule above. Checks:

- `npm view @wolven-tech/harness`: `latest` is `0.3.0`, with SLSA provenance and `gitHead` `9442cfc`. No `0.2.1` exists.
- Scratch repo: `wolven-harness --version` prints `0.3.0` and `init` exits `unknown command`. `setup --git-host gh --runtimes claude --skills ship` exits 0 with a missing `harness-score` note, and `harness:validate` prints `validate: ok`.
- **agentic-mkt re-run:** `pnpm up @wolven-tech/harness@0.3.0`, then `pnpm exec wolven-harness setup`, which only adds files. Then `pnpm add -D -E harness-score@1.6.5` if the score is wanted. Last, re-run step 0's mode question and step 6's wiring question from a `draft` note. Units 16–17 close on that.

**Unit 16 re-run, independent check (2026-09-29; agentic-mkt [#6](https://github.com/WolvenTech/agentic-mkt/pull/6), `chore/harness-init` at `fca3fc3`; run on Antigravity + Gemini; checked against the branch and the agent's report):**

- **Passes:**
  - (c): mode question, recommendation (Light, 388-line `AGENTS.md`) and answer are at note line 12.
  - (d): wiring question with (a) recommended; the Human picked (b), chaining it into `validate` in `56cd9c1` (note lines 98–104).
  - (a) and (i): approved and applied.
  - Local run: `pnpm install --frozen-lockfile` (pnpm 11.5.1), then `harness:validate` → `claims: 57 ok, 0 legacy-warn, 0 fail`, exit 0.
  - PR CI: 6/6 green, per the report.
- **Fails:**
  - **(g) honest green:** ADR-003 is `stable`, but its body says `Superseded` and that the provider is now OpenAI. It is a no-successor case, so `adr-migration.md` sends it to the Human with "only the options that would pass `harness:validate`". With 4 claims citing it, that steers towards `stable`. Validate reads frontmatter only, so the false binding shows green. The first run wrote successor ADR-011 instead. ADR-001 `stable` follows the "part still applies" row, a Human choice recorded in the note.
  - **(h):** `src/types/agent-config.ts:9` still cites "ADR-003: Role-Focused Self-Contained Stage Agents", which is not ADR-003's title. The run did no meaning check.
- **Out of wizard scope:**
  - `9eeee9a` and `fca3fc3` fill both stubs and add a subagent, three commands, Biome, Lefthook and `.agents/mcp_config.json`. That brings `harness:score` to 92/92, though the note says those gaps were kept.
  - The MCP entry `clickup` runs `@modelcontextprotocol/server-fetch` with `CLICKUP_API_TOKEN`: the wrong server, given a token.
  - The note's Next steps are stale.
- **Report friction triage:**
  - Package: none of the seven items is a package defect. Ignored adapters is `harness-ignored` working. Lefthook builds and Biome placeholders come from the out-of-scope commit. HYG-08 belongs to harness-score. Stub `disable-model-invocation` is by design, and the filled skills dropped it.
  - Runtime: Antigravity loads `.agents/` natively, so no adapter is missing.
- **Verdict:** C3 holds on (g) and (h). The defect goes to a `fix(harness-init)` PR (unit 18):
  - superseded with no successor: offer a successor ADR or `deprecated` with claims repointed, never `stable` over a body that says the decision no longer holds;
  - a meaning check on every citation's title;
  - step 6 records score gaps and does not fill them in the same run.

**Unit 18 fix for (g) and (h) (2026-09-29):** package PR [WolvenTech/wolven-harness#20](https://github.com/WolvenTech/wolven-harness/pull/20), `feat(validate): catch superseded ADRs kept stable in migration`, from `main` `9442cfc`. Squash-merged as `9c993fd` on `main`; release PR #21 (`0.4.0`) left open, so the fix stays unreleased until the next work.
- New warning `adr-status-mismatch` (ADR-003 row and amendment); warnings never change the exit code.
- `adr-migration.md`: superseded ADRs are never `stable`; the meaning check lists each `file:line`; `harness-init` ends at hand-back.
- Gate: build, `pnpm test` (532 pass), lint, validate, comments, score all green; residue `rg` hits only detection patterns.
- Tarball check on agentic-mkt #6 (`fca3fc3`): `warn [adr-status-mismatch]` for ADR-001 and ADR-003, `57 ok`, exit 0. Nothing pushed to agentic-mkt.
- Open: the release of the fix is deferred to the next work; C3 stays open until it ships and agentic-mkt bumps.

**Other defect:** `init` ships `.qmd/index.yml`, but nothing ignores the `.qmd/index.sqlite*` that `qmd update` writes next to it. Unit 18 fixes it.

**Consumer follow-ups (the Human's, in agentic-mkt; not harness defects):** define the two stubs; decide on the `runGate()` gaps in `green-run.ts`/`verify-clickup.ts` and the missing gitleaks CI step (fix, or a deferral with an owner and trigger); drop the stale `GOOGLE_API_KEY` and the task-ID comments; `qmd embed`.

**C4 plan change (Human, 2026-09-28):** units 18 and 19 don't get their own `fix/`/`test/` PRs. They ride `feat/friendly-init` with the `init` polish and skill sets, as one package PR (`fix(init)` → `0.2.1`). agentic-mkt then bumps with `pnpm up` and re-runs the setup phase's wiring question from a `draft` note.

**Dogfood finding before C4 (Human, at unit 12):** `init` read as abrupt. It printed internal step traces, a 54-path file dump, a `skipped (exists):` list and a one-line next step, and its prompts were bare. The Human also asked to choose skill sets, which fires docs/deferrals/skills-catalogue/skills-catalogue-deferral.md (Core always; Ship pre-selected, opt out; Discovery opt in). Both are built on package branch `feat/friendly-init` by a `builder` (sonnet) and checked by the parent:

- `3bf2702 feat(init): friendlier guided setup with prompts, summary and next steps`: `@clack/prompts` intro, host select and runtime multiselect preselected from the origin remote and repo files, spinners, a grouped summary (`--verbose` for the file list), numbered next steps, plain text with no ANSI off a TTY, `--debug` for the step trace, errors with a hint.
- `c12ac00 feat(init): let init install core, ship and discovery skill sets`: `--skills ship,discovery|none` and a multiselect. The default off a TTY is `["ship"]`. `.wolven-harness.json` `skillSets` records the union, re-runs never delete, and WOLVEN.md lists only installed skills. `harness-init`, `code-execute` and `code-spec` word the fallbacks for absent optional skills, and a `skill-sets:` test keeps the sets a partition of the template skills.
- Parent gate on `c12ac00`: 488/488, `validate: ok`, `comments: ok (0 findings)`. A scratch `init` with no `--skills` installs 13 skills and records `skillSets: ["ship"]`.
- **Held, by the Human's call:** no PR until the C4 fixes joined; the combined PR is #16 (see units 18–19 below), released as `0.2.1`.

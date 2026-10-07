---
type: spec
title: Wolven harness E — Public npm distribution (Code spec)
description: Frozen requirements for moving the package to public npmjs.org as @wolven-tech/harness with OIDC trusted publishing, zero-config consumer install, and a CI job that runs the package gate on every pull request — before spec C's dogfood wave.
status: archived
tags: [spec, harness, release, npm, wolven]
generated: { by: claude-code/code-spec, at: 2026-09-28T19:30:00Z }
updated: { by: claude-code/code-execute, at: 2026-09-28T23:30:00Z, note: "E1–E3 closed: 6b2a362 merged; 0.2.0 on npmjs with provenance; ruleset and spec C records done; all 11 boxes ticked" }
---

# Wolven harness E — Public npm distribution (Code spec)

**Decision.** The package moves from private GitHub Packages (`@wolventech/wolven-harness`) to public npmjs.org as **`@wolven-tech/harness`**. It is published by release-please's job through OIDC trusted publishing, so no token is stored anywhere and each version carries provenance. Consumers install with `pnpm add -D @wolven-tech/harness`, with no `.npmrc`, token, access grant or `packages: read`. A new CI job runs the package gate on every pull request. The command stays `wolven-harness`.

- **Source PRD:** docs/prds/archived/wolven-ai-assisted-dev-harness/wolven-ai-assisted-dev-harness-prd.md (`Executor: code`, `stable`)
- **Prior:** docs/specs/archived/wolven-harness-c-dogfood/wolven-harness-c-dogfood-spec.md: waves C1 and C2 done; C3 waits on this spec. Its plan's C2 resume holds the evidence below.
- **Artifact rule:** Package work lands in `WolvenTech/wolven-harness` on branches cut from `origin/main`. One-Man-Team records ride PR #30.
- **Next:** Approved 2026-09-28 → `code-plan` (docs/specs/archived/wolven-harness-e-distribution/wolven-harness-e-distribution-plan.md) → `code-execute`, waves **E1 → E2 → E3**. Spec C then resumes at C3.
- **Named proof (structural gate):** `proof-whe-spec-obligations`

## Spec-session decisions (2026-09-28)

| ID | Decision | Source |
|----|----------|--------|
| E-Q1 | **Public npmjs.org with OIDC trusted publishing.** This reverses spec C's "the package stays private". The source repo and agentic-mkt are already public, and the shipped files hold no private names or hosts (scan of `dist/`, `templates/`, README on `ee173aa`). | Human, after a 5-juror verdict (B 193 vs A 132, MEDIUM; dissent: keep private with PR #10 amended) |
| E-Q2 | **Name `@wolven-tech/harness`** under the npm org `wolven-tech`. The bin stays `wolven-harness`. First decided as `@wolven/harness`; the `wolven` scope was unclaimed at spec time but taken by E2's start, so the Human created `wolven-tech` and chose `@wolven-tech/harness` (2026-09-28, `U-e-npm-org`). | Human |
| E-Q3 | **A PR job runs the package gate on every pull request.** The failed 0.1.0 publish came from a broken test that merged because tests first ran inside the release job. | Human; PR #9's report, friction 6 |
| E-Q4 | **Spec E is a new spec.** It supersedes spec C's C-Q10, R1.3, R2.1 (registry), R2.2 (permissions) and R2.5 (private), and R3.1's auth clause. | Human |
| E-Q5 | **Amended at E1 review (PR #11).** Only a separate publish job holds `id-token: write` and it installs no project dependencies; a `workflow_dispatch` with a tag re-runs build and publish when a publish fails after tagging; the PR gate packs with the release job's npm and both workflows pin the same pnpm. Changes R1.2, R1.3 and the retry landings. | Human, after `code-review` of PR #11 |

## Repository grounding

| Surface | Present today | Role |
|---------|---------------|------|
| wolven-harness `main` `ee173aa` | `package.json` name `@wolventech/wolven-harness` 0.1.1, `publishConfig.registry` GitHub Packages | Renamed; the registry line goes |
| `.github/workflows/release.yml` | release-please, then install, build, test and `pnpm publish` with `GITHUB_TOKEN`; `packages: write`; `setup-node` `registry-url` | Publishes to npmjs through OIDC |
| `.github/workflows/pr-title.yml` | Only PR check; ruleset 24128126 requires `conventional-title` | Joined by the PR gate job |
| `release-please-config.json` | `package-name`, `initial-version: 0.1.0` | `package-name` renamed |
| `README.md` Install section | GitHub Packages `.npmrc`, token, grant, `packages: read` | Becomes a two-command install |
| `test/{release,readme-install,init-install}.test.ts` | Pin the old name, registry and permissions | Updated with the new shape |
| `src/init/own-package.ts` | Reads its own name from `package.json` | Unchanged; the new name flows through |
| PR #10 (open) | README moves the token line to user-level config | Closed unmerged; superseded |
| PR #9 (open) | `init` and `harness-init` on the package repo itself | Independent; either merge order works (`U-e-pr9-order`) |
| GitHub Packages `@wolventech/wolven-harness@0.1.1` (private), tag and Release `v0.1.0` (unpublished) | Published history | Left in place (`U-e-ghp-cleanup`) |
| npm docs: [trusted publishers](https://docs.npmjs.com/trusted-publishers), [`npm trust`](https://docs.npmjs.com/cli/v11/commands/npm-trust/) | npm CLI ≥ 11.5.1, Node ≥ 22.14.0, `id-token: write`, provenance automatic. A trusted publisher can only be set on a package that already exists, and only with account 2FA | Drives E2's order |
| pnpm [#9812](https://github.com/pnpm/pnpm/issues/9812) | pnpm OIDC publish fixes landed in 11.0.7 and 11.1.3 | The publish step uses the npm CLI, the documented path |

## Surface walk

- **In scope (wolven-harness):** `package.json` (`name`, `publishConfig`), `release-please-config.json`, `.github/workflows/release.yml`, a new `.github/workflows/ci.yml`, `README.md` (Install, Release), `AGENTS.md` (package name), the three tests above, and ruleset 24128126 (with the Human's OK).
- **In scope (npmjs, Human-owned):** org `wolven-tech`, the seed publish, the trusted-publisher entry for `@wolven-tech/harness`, the publishing-access setting.
- **In scope (One-Man-Team):** this spec and its plan; supersession pointers in spec C and its plan.
- **Out of mutate scope (unchanged):** `src/**` (except what a rename test proves needs no change), `templates/**`, `pr-title.yml`, `.release-please-manifest.json`, agentic-mkt (C3 installs from npmjs), the GitHub Packages package and its agentic-mkt grant.

## Waves

| Wave | Content | Gate | Stop |
|------|---------|------|------|
| **E1** | Rename, publish config, OIDC release job, PR gate job, README, tests; one package PR | Package gate plus residue grep; PR gate job green on its own PR; the Human merges | No npm step otherwise |
| **E2** | npm org, seed publish, trusted publisher, release PR `0.2.0`, OIDC publish, zero-config install | Release run green; `npm view` shows `0.2.0` `latest` with provenance; scratch install and `init` pass | No C3 otherwise |
| **E3** | Records: spec C pointers, PR #10 closed, ruleset requires the PR gate | OMT `pnpm docs:index && pnpm validate` | Spec C resumes at C3 |

Abort before the next wave on any gate failure.

## Requirements (obligation ↔ proof)

### R1 — Package (E1)

| ID | Obligation | Named proof | Evidence shape |
|----|------------|-------------|----------------|
| R1.1 | `package.json` `name` is `@wolven-tech/harness` and `bin` still maps `wolven-harness`; `publishConfig` is `{ "access": "public" }` with no `registry`; `release-please-config.json` `package-name` matches. `AGENTS.md` and tests use the new name | `proof-whe-package-name` | Tests read the manifest and config |
| R1.2 | `release.yml` publishes to npmjs.org through OIDC with the npm CLI ≥ 11.5.1 and `--access public`. Workflow permissions are `contents: read`; the release-please job alone adds `contents: write` and `pull-requests: write`; only the publish job holds `id-token: write`, and it installs no project dependencies (it takes `dist` from a read-only build job). A `workflow_dispatch` with a tag input re-runs build and publish for an existing tag. No `packages: write`, no `registry-url`, no `NODE_AUTH_TOKEN`, no secret. Install, build and test still run before publish (E-Q5) | `proof-whe-release-oidc` | Tests parse the workflow |
| R1.3 | `ci.yml` runs on `pull_request` and does `pnpm install --frozen-lockfile`, build, test, `validate`, `comments`, then `npm pack --dry-run` with the release job's npm pin, against the PR base. pnpm and Node versions are pinned, pnpm to the same version as the release job; permissions are read-only (E-Q5) | `proof-whe-pr-gate` | Tests parse the workflow; a live run is green on the E1 PR |
| R1.4 | README Install is `pnpm add -D @wolven-tech/harness` then `pnpm exec wolven-harness init`, and says nothing of `.npmrc`, tokens, `packages: read` or Actions access. The Release section describes the trusted publisher and the first-publish seed | `proof-whe-readme-install` | Tests assert the presence and the absence |
| R1.5 | No stale distribution text ships: `rg -n 'npm\.pkg\.github\.com\|NODE_AUTH_TOKEN\|@wolventech/wolven-harness\|packages: (read\|write)' README.md AGENTS.md src templates .github package.json release-please-config.json` returns nothing. `test/` is left out: it asserts these strings are absent | `proof-whe-residue` | Command output empty |

### R2 — First npm release (E2)

| ID | Obligation | Named proof | Evidence shape |
|----|------------|-------------|----------------|
| R2.1 | The Human owns npm org `wolven-tech` with account 2FA. `@wolven-tech/harness` exists on npmjs through one manual seed publish of a prerelease (`0.2.0-seed.0`, dist-tag `seed`, never `latest`) cut from `main` after E1 | `proof-whe-seed` | `npm view @wolven-tech/harness dist-tags` → `seed` only |
| R2.2 | A trusted publisher for `@wolven-tech/harness` names `WolvenTech/wolven-harness` and `release.yml`. Token publishing is then set to "Require two-factor authentication and disallow tokens" | `proof-whe-trusted-publisher` | Settings page confirmed by the Human, or `npm trust` output |
| R2.3 | release-please's PR bumps to `0.2.0`. After close and reopen, its checks are green; the Human merges; the release run is green; tag `v0.2.0` and its Release exist; `npm view @wolven-tech/harness@0.2.0` shows `latest` with a provenance attestation. The seed version is deprecated with a pointer to `0.2.0` and its `seed` tag removed | `proof-whe-first-npm-release` | `gh run view`, `gh release view v0.2.0`, `npm view … --json` |
| R2.4 | In a scratch repo on current pnpm with no `.npmrc` and no token in the environment, `pnpm add -D @wolven-tech/harness@0.2.0` and `pnpm exec wolven-harness init --git-host gh --runtimes claude` exit 0. `.wolven-harness.json` records `packageVersion: "0.2.0"`, and `init` gives no devDependency warning | `proof-whe-zero-config-install` | Command output |

### R3 — Records (E3)

| ID | Obligation | Named proof | Evidence shape |
|----|------------|-------------|----------------|
| R3.1 | Ruleset 24128126 requires the PR gate job next to `conventional-title` (the Human's OK) | `proof-whe-ruleset` | `gh api …/rules/branches/main` |
| R3.2 | Spec C marks C-Q10, R1.3, R2.1's registry, R2.2's permissions, R2.5's privacy and R3.1's auth clause as superseded by this spec. Spec C's plan unit 12 installs `@wolven-tech/harness` with no auth steps. PR #10 is closed with a pointer here. OMT `pnpm docs:index && pnpm validate` exit 0 | `proof-whe-records` | Diff and validate output |

## Nine-dimension landings

| Dimension | Landing kind | Landing |
|-----------|--------------|---------|
| validation | obligation / proof | R1.4 / `proof-whe-readme-install` and R1.5 / `proof-whe-residue` reject stale auth text; R1.3 / `proof-whe-pr-gate` runs the gate before merge |
| failure modes | obligation / proof | A release PR merged before a trusted publisher exists fails to publish: R2.1–R2.3 fix the order. A broken test can no longer reach the release job: R1.3 |
| idempotency and retry | obligation / proof | npm versions can't be republished. If the publish fails after tagging and nothing published, the `release` workflow is run by hand for that tag; a version that did publish is never republished, and a fix ships as the next patch (the 0.1.1 precedent) — R1.2 / `proof-whe-release-oidc`, R2.3 / `proof-whe-first-npm-release` |
| authorization | obligation / proof | OIDC `id-token: write` only, no stored token (R1.2 / `proof-whe-release-oidc`); 2FA on the npm account and tokens disallowed (R2.2 / `proof-whe-trusted-publisher`); consumers need no credential (R2.4) |
| concurrency and ordering | obligation / proof | E2 is strictly org → seed → trusted publisher → release PR merge (R2.1–R2.3) |
| data lifecycle | obligation / proof | Public versions persist; npm unpublish is limited. The seed is deprecated and untagged (R2.3). The GitHub Packages package stays (`U-e-ghp-cleanup`) |
| external-dependency failure | obligation / proof | npmjs or OIDC down → the publish job goes red and is run by hand for the tag once nothing published (R1.2, R2.3). A new version inside pnpm 11's `minimumReleaseAge` window gets a `minimumReleaseAgeExclude` entry in the consumer — expected, noted in R2.4's evidence |
| state transitions | obligation / proof | Release PR → tag and Release → OIDC publish → `latest` (R2.3); seed → deprecated (R2.3) |
| observability | obligation / proof | Release run log, `npm view` dist-tags and attestations, and the npmjs provenance badge (R2.3); PR gate check on every PR (R1.3) |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition |
|------------|------------------|-------|------------------|------------|
| `U-e-npm-org` | Create npm org `wolven-tech` (free, public packages) under the Human's npm account with 2FA | Human | Blocks E2 | Resolve at E2's start. If the scope is taken by then, stop and re-decide the name |
| `U-e-ghp-cleanup` | Delete or keep `@wolventech/wolven-harness@0.1.1` on GitHub Packages, and agentic-mkt's grant on it | Human | Non-blocking | Keep untouched; decide at spec C's closure |
| `U-e-adr` | Record the npm distribution decision as an ADR in the package repo | Human | Non-blocking | Offer at E1; the package repo has `docs/adrs/` |
| `U-e-pr9-order` | Merge PR #9 before or after E1 | Human | Non-blocking | Either works; if #9 lands first, E1's gate also runs its `harness:validate` |

## Out of scope

- The `harness-init` defects PR #9's report found (full-fold validate trap, the `WOLVEN.md` pointer in the writing profile, branch check, QMD ignore): spec C's C3/C4
- `init` writing `node dist/cli.js` scripts in its own repo (PR #9, friction 2)
- Deleting the GitHub Packages package, the `v0.1.0` Release or the GitHub Packages grant
- A `wolven-harness upgrade` command, Renovate or Dependabot config

## Pragmatic-guard refuses

- A stored npm token, or a granular token "just for CI"
- Publishing to both registries
- Keeping `@wolventech/wolven-harness` as an alias or a deprecated redirect package
- Folding PR #9's harness-init fixes into this spec

## Acceptance

### Wave E1

Evidence: package `main` at `6b2a362` (PR #11 squash), re-run 2026-09-28: `rm -rf dist && pnpm build && pnpm test` → 465 pass, 0 fail; `pnpm validate` → `validate: ok`; `pnpm comments` → `comments: ok (0 findings)`. Per-unit evidence is in the plan's E1 resume.

- [x] `proof-whe-package-name` PASS
- [x] `proof-whe-release-oidc` PASS
- [x] `proof-whe-pr-gate` PASS (tests, then the live run on the E1 PR)
- [x] `proof-whe-readme-install` PASS
- [x] `proof-whe-residue` PASS — R1.5's `rg` on `6b2a362` prints nothing

### Wave E2

- [x] `proof-whe-seed` PASS — `0.2.0-seed.0` under `seed`; npm also set `latest` on the first version, which unit 11 moves to `0.2.0` (plan E2 resume)
- [x] `proof-whe-trusted-publisher` PASS — `release.yml`, no environment, `npm publish` allowed; publishing access disallows tokens
- [x] `proof-whe-first-npm-release` PASS — `v0.2.0` by a manual `release` run; `latest: 0.2.0` with SLSA provenance; seed deprecated and its tag removed
- [x] `proof-whe-zero-config-install` PASS — `0.2.0` from npmjs, no `.npmrc` or token; `init` and `harness:validate` exit 0

### Wave E3

- [x] `proof-whe-ruleset` PASS — required checks `conventional-title` and `package-gate` (Human's confirmation)
- [x] `proof-whe-records` PASS — spec C and plan C unit 12 amended in `75678e6`; PR #10 closed

Pre-merge closure runs with spec C's closure on OMT PR #30 (spec C's unit 24), not here.

## Eval / gates

| Gate | Command / check | When | PASS | Abort |
|------|-----------------|------|------|-------|
| Package gate | `rm -rf dist && pnpm build && pnpm test && pnpm validate && pnpm comments` | E1, before the PR | exit 0 | Fix; no PR |
| Residue | R1.5's `rg` | E1 | empty | Fix |
| PR gate live | `gh pr checks <E1 PR>` | E1 | PR gate and `conventional-title` pass | Fix; no merge |
| Release | `gh run list --workflow release.yml`; `npm view @wolven-tech/harness@0.2.0 --json` | E2 | run green; `latest` is `0.2.0` with an attestation | Stop; no C3 |
| Zero-config install | R2.4's commands in the scratchpad | E2 | exit 0 | Stop; package defect |
| OMT | `pnpm docs:index && pnpm validate` | E3 | `validate-harness: ok` | Fix records |
| Spec obligations | `proof-whe-spec-obligations`: every acceptance box pairs one R row and one proof; nine landings valid; Unresolved typed | Before `code-plan` | all paired | Do not plan |

## Cross-domain leak ID

| Leak | Refuse |
|------|--------|
| Board/ClickUp for this work | No Tickets; Executor is code |
| harness-init fixes from PR #9 | Spec C's C3/C4 |
| Consumer changes in agentic-mkt | Spec C's C3 |
| Executable plan from this skill | Handoff to `code-plan` only |

## ADR

The distribution decision is repo infra policy in the package repo, so an ADR is offered there at E1 (`U-e-adr`). No One-Man-Team ADR: nothing here changes this repo's harness wiring.

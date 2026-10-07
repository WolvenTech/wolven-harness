---
type: spec
title: Wolven harness A — Core (Code plan)
description: Ordered work units for Entrega A — wolven-harness scaffold, init, templates and runtime wiring in Wave A1, then profile rules, ADR claim gate with legacy mode and validate spine in Wave A2 — executed by Sonnet builder subagents with parent-run wave gates.
status: archived
tags: [spec, code-plan, harness, npm, wolven, corporate, adr]
generated: { by: claude-code/code-plan, at: 2026-09-24T21:44:55Z }
updated: { by: claude-code/code-execute, at: 2026-09-24T22:39:47Z, note: "Waves A1 and A2 gates PASS; A recorded green in the TAP (unit 14)" }
---

# Wolven harness A — Core (Code plan)

- **Spec:** docs/specs/archived/wolven-harness-a-core/wolven-harness-a-core-spec.md (`stable`, approved 2026-09-24)
- **PRD:** docs/prds/archived/wolven-ai-assisted-dev-harness/wolven-ai-assisted-dev-harness-prd.md (`Executor: code`, `stable`)
- **Projeto:** docs/prds/archived/wolven-ai-assisted-dev-harness/wolven-ai-assisted-dev-harness-project.md — A green target 2026-10-09
- **Next:** Approved 2026-09-24 → `code-execute` in progress, Wave **A1 → A2**.

## Execution setup

| Item | Value |
|------|-------|
| Package clone | `/Users/rafael/Desktop/wolven-harness`, cloned from `WolvenTech/wolven-harness` (public, empty) |
| Branches | Unit 01 makes an empty root commit on `main`, then branches `feat/a-core`; every unit commits to `feat/a-core` |
| Push / PR | Ask-only (`code-pr`). No push to `WolvenTech/wolven-harness` from `code-execute` (S2: the Human's local `gh` auth) |
| Builder model | Builder units spawn `builder` with `model: sonnet`. The parent (orchestrator) runs gate units, commits, and reviews each builder return against Done when |
| Parallel builders | Share one clone; Owns are disjoint by design. Builders run `pnpm test` only — never `pnpm build` (shared `dist/`); the parent builds at gates |
| Commits | Parent runs `code-commit` per unit after that unit's tests PASS; builders never commit |
| OMT | Read-only extract source (unit 04 reads OMT `.agents/**`); the only OMT write is unit 14 |
| Local toolchain | Node v26.8.1, pnpm 11.24.0 (verified 2026-09-24); `engines.node` stays `>=22` |

### Seams fixed by unit 01

Unit 01 writes stub modules with final signatures so later units fill disjoint files instead of editing one orchestrator:

- `src/cli.ts` → `main(argv, io): Promise<number>` where `io = { cwd, stdin, stdout, stderr, isTTY }`; `bin` calls it and exits with the result
- `src/init/index.ts` runs, in order: `resolveOptions` (`options.ts`), `applyTemplates` (`apply.ts`), `wireRuntimes` (`runtimes.ts`), `addValidateScript` (`package-script.ts`), then prints the lists and the `harness-init` closing line
- `src/validate/index.ts` in A1 exits 0; unit 08 replaces it with the A2 orchestrator
- `test/helpers/fixture.ts` → `makeRepo(files, { git })` (mkdtemp; `git init` + commit when `git: true`) and `run(args, { cwd, isTTY, input })` calling `main` in-process

## Wave stops

| Stop | After unit | Gate |
|------|------------|------|
| **A1** | 07 | `pnpm build && pnpm test && pnpm validate` exit 0; `proof-wha-no-residue` grep empty; every A1 proof maps to a named passing test — **abort before A2 on failure** |
| **A2** | 13 | Same command, with every `claim-*`, `legacy-*`, and `ignore-*` fixture included; `pnpm validate` prints `claims: 1 ok` or more — **no handoff to B/D on failure** |
| **Record** | 14 | Wave A2 PASS recorded in the TAP; OMT `pnpm validate` PASS |

Initiative pre-merge closure lives in spec C; this plan has no ship unit.

## Unresolved

The spec has no blocking rows. It carries one non-blocking row:

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
|---|---|---|---|---|---|
| `U-a-cloud-app` | Install the Claude GitHub App on WolvenTech | Human (org admin) | Non-blocking — execute runs locally (S2) | Defer — trigger: first cloud execute or review session on a WolvenTech repo | — |

## Work units

Subagent *(omit)* = the builder default (ADR-004/ADR-005), spawned with `model: sonnet`.

### Wave A1 — scaffold, init, templates, runtime wiring

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 01 | Scaffold + seams (R0.1) | — | `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `.gitignore`, `.wolven-harness.json` (`version`, `gitHost`, `runtimes` only), `src/cli.ts`, `src/init/*.ts` stubs, `src/validate/index.ts`, `test/helpers/fixture.ts`, `test/cli.test.ts`, `README.md` (skeleton), `AGENTS.md` + `CLAUDE.md` (package dev entry) | *(omit)* | `wolven-harness --help` lists `init` and `validate`; the stub `init` runs its steps in order; `pnpm build && pnpm test && pnpm validate` exit 0; `package.json` shows `engines.node >=22`, runtime deps `yaml` only, and devDeps `typescript`, `tsx`, `@types/node` — `proof-wha-scaffold` |
| 02 | Prompts, flags, config, top-level guard (R1.1, R1.2) | 01 | `src/init/options.ts`, `src/init/config.ts`, `test/init-options.test.ts` | *(omit)* | Tests show: flags-only run succeeds; no TTY + missing flag → exit 1 naming the flag; subdir and non-git runs → exit 1, nothing created; TTY run asks host, then runtimes, one at a time; re-run reads `.wolven-harness.json` without prompting; a hand-added `ignore` survives; `version` is `1` — `proof-wha-init-prompts`, `proof-wha-init-config` |
| 03 | Create-only-missing apply + validate script (R1.4, R1.6) | 01 | `src/init/apply.ts`, `src/init/package-script.ts`, `test/init-apply.test.ts` | *(omit)* | Against a test template root: existing `AGENTS.md`, `CLAUDE.md`, and `.claude/skills/` stay byte-identical and show under `skipped (exists):`; `AGENTS.md` is never created; the closing line names `harness-init`; a second run creates nothing; `package.json` diff is exactly `harness:validate` when absent, and none when present — `proof-wha-init-skip`, `proof-wha-init-script` |
| 04 | Seed extract templates (R1.8) | 01 | `templates/.agents/skills/{qmd,pragmatic-guard}/**`, `templates/.agents/rules/{qmd-first,yagni-strict}.md`, `templates/.agents/hooks/README.md`, `test/seed-extract.test.ts` | *(omit)* | The portable rewrites search `-c adrs` first, record deferrals under `docs/deferrals/` as `type: deferral`, cite no config file, and the hooks README names no hook; the test asserts `rg -n "canon\|concepts\|sources\|config.yml" templates/.agents` is empty and the residue grep over `templates/.agents` is empty — `proof-wha-seed-extract` |
| 05 | Runtime wiring + README (R1.5) | 01 | `src/init/runtimes.ts`, `test/init-runtimes.test.ts`, `README.md` (runtime section) | *(omit)* | `--runtimes claude` creates `.claude/skills` resolving to `.agents/skills`, plus `CLAUDE.md` = `@AGENTS.md` only when absent; `--runtimes codex,cursor` creates no `.claude/`, `.codex/`, or `.cursor/` path; a forced symlink failure → exit 1 naming the macOS/Linux limit; README carries the three discovery-doc URLs and the macOS/Linux line — `proof-wha-runtime-wiring` |
| 06 | Docs/WOLVEN templates + manifest proof (R1.3, R1.7) | 03, 04 | `templates/WOLVEN.md`, `templates/docs/**` (`WRITING-PROFILE.md` per R2.1, `adrs/adr-000-record-architecture-decisions.md` `stable`, `{specs,notes,deferrals}/.gitkeep`), `templates/.qmd/index.yml`, `src/init/render-wolven.ts`, `test/init-surfaces.test.ts` | *(omit)* | `init --git-host gh --runtimes codex` on an empty git fixture creates exactly the R1.3 list; the rendered `WOLVEN.md` opens with the `harness-init` step-0 line and has the router, QMD-first, standing rules, claim rule, and validate command, plus a skills table built from `templates/.agents/skills/*/SKILL.md` frontmatter (so B/D skills appear with no code change) — `proof-wha-init-surfaces`, `proof-wha-wolven-template` |
| 07 | **Wave A1 gate** | 02, 03, 04, 05, 06 | — | `inline` | Parent runs `pnpm build && pnpm test && pnpm validate` (exit 0), then `rg -i "clickup\|board-\|area-context\|wayfind\|okf-qmd-kit\|docs/canon\|pragmatic-guard.config" src templates` (empty), and checks `LICENSE` is absent — `proof-wha-no-residue`; the ten A1 proofs each map to a passing test; failure → **abort before A2** |

### Wave A2 — profile, claim gate, legacy mode, spine

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 08 | Validate orchestrator: git root, ignore, output (R3.5, R3.7 guard) | 07 | `src/validate/index.ts`, `src/validate/repo.ts`, `src/validate/config.ts`, `src/validate/report.ts`, stubs `src/validate/{profile,claims,legacy,spine}.ts`, `.wolven-harness.json` (`ignore: ["templates/**","test/**"]`), `test/validate-repo.test.ts` | *(omit)* | A non-git dir → exit 1 "claim gate requires git"; a subdirectory run prints the same as the top-level; `ignore` entries `*.md`, `docs/**`, `docs/adrs/**`, `.agents/**` → exit 1 naming the entry; valid entries print `ignored: <entries> (<n> files)` and drop those files from the tracked-file list handed to checks; findings carry `{level, rule, file, line, message}` and the exit code is 1 iff any `error` — `proof-wha-claim-no-git` |
| 09 | Profile rules + profile doc (R2.1, R2.2) | 08 | `src/validate/profile.ts`, `test/profile.test.ts`, `templates/docs/WRITING-PROFILE.md` (align only) | *(omit)* | One failing fixture per rule (frontmatter fields, status set, type↔dir for `adrs`/`specs`/`notes`/`deferrals`, kebab ASCII filename, ADR name shape, `superseded_by` when `deprecated`) exits 1 naming the rule; the clean fixture exits 0; the profile doc is ≤80 lines and matches the implemented rules — `proof-wha-profile-rules`, `proof-wha-profile-doc` |
| 10 | Validate spine (R4.1, R4.2) | 08 | `src/validate/spine.ts`, `test/spine.test.ts` | *(omit)* | A `SKILL.md` missing `name` or `description` → exit 1; a `.agents/rules/<name>.md` cited in `WOLVEN.md`/`AGENTS.md` but missing → exit 1; a fresh `init` fixture warns "harness-init step 0 pending" at exit 0, and adding a `WOLVEN.md` mention to `AGENTS.md` clears it — `proof-wha-skill-frontmatter`, `proof-wha-step0-pending` |
| 11 | Claim scan + normal mode + self-claim (R3.1, R3.2, R3.6) | 09 | `src/validate/claims.ts`, `test/claims.test.ts`, `docs/adrs/adr-001-claim-path.md` (`stable`), `AGENTS.md` (cite `ADR-001`) | *(omit)* | Tokens in `src/*.ts`, `AGENTS.md`, and `docs/specs/*.md` are reported, but not those in ADR files, `/archived/`, or ignored paths, and a bare `adr-NNN` is not a claim; fixtures `claim-missing`, `claim-duplicate`, `claim-draft`, `claim-deprecated` (names `superseded_by`), and `claim-slug-mismatch` exit 1 with file:line + ADR id; `claim-ok` exits 0; package `pnpm validate` prints `claims: 1 ok` or more — `proof-wha-claim-scan`, `proof-wha-claim-fail-closed`, `proof-wha-self-claim` |
| 12 | Legacy detection + legacy mode + ignore end-to-end (R3.3, R3.4, R3.7) | 11 | `src/validate/legacy.ts`, `test/legacy.test.ts`, `test/ignore.test.ts` | *(omit)* | An agentic-mkt-shaped fixture (`adrs/adr-00{1,2}.md` Nygard + `adrs/README.md`) prints exactly two `legacy ADR-NNN (<path>): <n> claims in <m> files — migrate via harness-init` lines at exit 0, without README; `ADR-002` in `AGENTS.md` warns, with file:line only under `--verbose`; `ADR-999` → exit 1; a number with both a profile and a legacy ADR → duplicate, exit 1; `ADR-999` under an ignored dir → exit 0 with the `ignored:` line — `proof-wha-legacy-detect`, `proof-wha-legacy-claims`, `proof-wha-ignore` |
| 13 | **Wave A2 gate** | 09, 10, 11, 12 | — | `inline` | Parent runs `pnpm build && pnpm test && pnpm validate` (exit 0; output shows `claims: <n≥1> ok, 0 legacy-warn, 0 fail` and the `ignored:` line), re-runs the unit 07 residue grep (empty), and maps all 21 spec proofs to passing tests; failure → **no handoff to B/D** |
| 14 | Record A green in OMT | 13 | `docs/prds/archived/wolven-ai-assisted-dev-harness/wolven-ai-assisted-dev-harness-project.md` (milestone note), `docs/specs/archived/wolven-harness-a-core/wolven-harness-a-core-spec.md` (acceptance boxes ticked) | `inline` | TAP milestone "A pronta" cites the `feat/a-core` head SHA and the gate date; the spec's 21 acceptance boxes are ticked with evidence; OMT `pnpm docs:index && pnpm validate` exit 0 |
| 15 | Comment gate port (addendum, PR #1 review) | 14 | `scripts/comment-gate.ts`, `scripts/comment-leak-rules.ts`, `test/comment-gate.test.ts`, `.comment-gate.json`, `package.json` (`comments` script only), `AGENTS.md` (comment rule), `src/init/index.ts` (line 27 comment) | *(omit)* | `pnpm comments` checks added comment lines under `src/`, `test/`, `scripts/` since the merge-base with `origin/main`: an untagged `//` comment, a tagged comment over 4 lines, a change-narration line, a dead citation, and a planning id (`R3.1`, `S1`, `proof-x`, `unit 08`, "later unit") each exit 1 naming file:line and kind; `why:`/`hazard:`/`invariant:` comments and JSDoc on declarations pass; a clean tree exits 0; `src/init/index.ts:27` no longer narrates units; `pnpm comments` and the PRD sweep are empty on `feat/a-core` — gate check (no spec proof; PRD note "shipped-artifact language") |

## Frontier order

**Wave A1:** 01 → (02 ∥ 03 ∥ 04 ∥ 05) → 06 → **07 STOP**

**Wave A2:** 08 → (09 ∥ 10) → 11 → 12 → **13 STOP** → 14

**Addendum:** 15 (comment gate port, from the PR #1 review) — parent re-runs `pnpm build && pnpm test && pnpm validate`, `pnpm comments`, and the PRD sweep before committing

Up to four Sonnet builders run at once, in the A1 fan-out after 01. Never pack A2 units into the A1 batch to skip unit 07.

## Builder brief (every spawned unit)

Each builder prompt carries: the unit row verbatim; the spec path and the R rows it owns; the seams list above; "edit only your Owns; stubs outside them are read-only"; "run `pnpm test` only — no build, no commit, no push"; and the return contract: changed files, test names mapped to proof ids, `pnpm test` tail, and any Owns it could not stay within. The parent rejects a return that edits outside Owns or maps no test to a proof.

## Pragmatic-guard refuses

- Extra runtime deps (glob matchers, prompt libraries, chalk) — `yaml` only
- Builders touching `package.json` after unit 01 — dependency needs escalate to the parent
- A per-unit markdown farm or ClickUp cards for these units
- Starting spec B or D work before unit 13 PASS

## Execution / resume section

Work lands in `/Users/rafael/Desktop/wolven-harness` (`feat/a-core`); this section is the only resume record.

### Unit 01 — Scaffold + seams

| Field | Value |
|-------|-------|
| Unit | 01 — Scaffold + seams (Wave A1, frontier head) |
| Spec / plan | `docs/specs/archived/wolven-harness-a-core/wolven-harness-a-core-spec.md` / `docs/specs/archived/wolven-harness-a-core/wolven-harness-a-core-plan.md` |
| Obligations | R0.1 `proof-wha-scaffold` — done (parent re-ran `pnpm build && pnpm test && pnpm validate`: 5/5 tests, exit 0; residue grep over `src` empty) — uncommitted: `code-commit` is Human-invoked only |
| `HEAD` | package `3023f47` (empty root on `main`, branched to `feat/a-core`); OMT `3e1f2d8` |
| `git status` | package clean; OMT dirty — this plan file only (resume section) |
| Intended diff | unit 01 Owns in the package repo |
| Discrepancies | Builder added `pnpm-workspace.yaml` (`allowBuilds: esbuild`) outside Owns — pnpm 11 stores build approval only there; a clean install fails without it. Decision: kept, companion of `pnpm-lock.yaml` — resolved. `code-commit` cannot be model-invoked. Human decision 2026-09-24: commit once after the A1 gate (unit 07) via `/code-commit`, then again after A2 — resolved. Two repos: the plan mark cannot share the package commit. Decision: package commit per unit via `code-commit`; this OMT plan records the package SHA and is committed at each wave gate (units 07, 13) and at unit 14 — resolved |

### Units 02–05 — Wave A1 fan-out (parallel)

| Field | Value |
|-------|-------|
| Unit | 02 options/config ∥ 03 apply + script ∥ 04 seed templates ∥ 05 runtime wiring |
| Spec / plan | `docs/specs/archived/wolven-harness-a-core/wolven-harness-a-core-spec.md` / `docs/specs/archived/wolven-harness-a-core/wolven-harness-a-core-plan.md` |
| Obligations | R1.1, R1.2 (02); R1.4, R1.6 (03); R1.8 (04); R1.5 (05) — done: parent `pnpm test` 45/45 after reconciling |
| `HEAD` | package `3023f47` + unit 01 uncommitted |
| `git status` | package dirty — unit 01 Owns only; OMT dirty — this plan file only |
| Intended diff | Owns of units 02–05 (disjoint) |
| Discrepancies | Unit 01 uncommitted under the fan-out — isolated by disjoint Owns — resolved. Unit 02 builder ran `init` against the real package repo: it added `harness:validate` to `package.json`, rewrote `.wolven-harness.json`, and created untracked `.agents/` + `.claude/skills` (byte-identical to `templates/.agents/`). Parent restored `package.json` and `.wolven-harness.json`, added `.DS_Store` to `.gitignore`. The builder's `rm` of `.agents/`/`.claude/` was denied by the permission classifier — escalated to the Human, not retried by the parent. `test/cli.test.ts` updated to pass flags (unit 02 made the flagless no-TTY run exit 1 per R1.1) — resolved. R1.4 aggregate skip-list check for `CLAUDE.md`/`.claude/skills` deferred to unit 07 |

### Unit 06 — Docs/WOLVEN templates + manifest proof

| Field | Value |
|-------|-------|
| Unit | 06 (Wave A1, after the fan-out) |
| Spec / plan | `docs/specs/archived/wolven-harness-a-core/wolven-harness-a-core-spec.md` / `docs/specs/archived/wolven-harness-a-core/wolven-harness-a-core-plan.md` |
| Obligations | R1.3 `proof-wha-init-surfaces`, R1.7 `proof-wha-wolven-template` — done (7 tests) |
| `HEAD` | package `3023f47` + units 01–05 uncommitted |
| `git status` | package dirty — units 01–05 Owns, plus stray `.agents/`, `.claude/` awaiting Human cleanup |
| Intended diff | unit 06 Owns |
| Discrepancies | Stray dirs outside every Owns — isolated: builder told not to touch them and never to run `init` outside fixtures — resolved |

### Unit 07 — Wave A1 gate

| Field | Value |
|-------|-------|
| Unit | 07 — Wave A1 gate (STOP) |
| Spec / plan | `docs/specs/archived/wolven-harness-a-core/wolven-harness-a-core-spec.md` / `docs/specs/archived/wolven-harness-a-core/wolven-harness-a-core-plan.md` |
| Obligations | A1 proofs — PASS 2026-09-24: `rm -rf dist && pnpm build` clean; `pnpm test` 52/52; `pnpm validate` exit 0; residue `rg` over `src templates` empty; no `LICENSE` (`proof-wha-no-residue`). Test prefixes per proof: init-prompts 8, init-config 6, init-skip 5, init-script 4, seed-extract 7, runtime-wiring 7, init-surfaces 3, wolven-template 4; `proof-wha-scaffold` = `test/cli.test.ts` (5) + gate command |
| `HEAD` | package `3023f47` + units 01–06 uncommitted; OMT `3e1f2d8` + this plan |
| `git status` | package dirty — units 01–06 Owns only (stray `.agents/`, `.claude/` removed by the Human); OMT dirty — this plan file |
| Intended diff | none (gate) — plus parent test fixes below |
| Discrepancies | `test/init-apply.test.ts` asserted the `renderWolven` stub output (`''`); parent changed the fixture to carry `{{skills_table}}` and a described skill, asserting the table is rendered — resolved. R1.4 skip-list check added: the end-to-end skip test now runs `--runtimes claude` and asserts `CLAUDE.md` and `.claude/skills` under `skipped (exists):` — resolved. Commit: Human ran `/code-commit` — package `3e2a640` on `feat/a-core` (38 files, Wave A1) — resolved |

### Unit 08 — Validate orchestrator

| Field | Value |
|-------|-------|
| Unit | 08 — Validate orchestrator: git root, ignore, output (Wave A2, frontier head) |
| Spec / plan | `docs/specs/archived/wolven-harness-a-core/wolven-harness-a-core-spec.md` / `docs/specs/archived/wolven-harness-a-core/wolven-harness-a-core-plan.md` |
| Obligations | R3.5 `proof-wha-claim-no-git`; R3.7 entry guard (malformed / `docs/` / `.agents/` entries fail) — done: parent `pnpm test` 63/63, `tsc --noEmit` clean; tests `claim-no-git:` (3), `ignore-guard:` (8) |
| `HEAD` | package `3e2a640` (`feat/a-core`); OMT `d9204ba` |
| `git status` | package clean at start; after: dirty — unit 08 Owns only (`.wolven-harness.json`, `src/validate/*`, `test/validate-repo.test.ts`); OMT dirty — this plan file only |
| Intended diff | unit 08 Owns; the stubs fix the check seams for 09–12: `checkProfile(ctx)`, `checkSpine(ctx)` → `Finding[]`; `checkClaims(ctx, profileFindings)` → `{findings, counts}`; `detectLegacy(ctx)` → `LegacyAdr[]` |
| Discrepancies | Builder choices within the spec: finding line `<level> [<rule>] <file>:<line>: <message>`; a bad `ignore` entry prints only its finding and the summary line; rule id `ignore-entry` — accepted |

### Units 09 ∥ 10 — Profile rules and spine (parallel)

| Field | Value |
|-------|-------|
| Unit | 09 profile rules + doc ∥ 10 validate spine (Wave A2, after 08) |
| Spec / plan | `docs/specs/archived/wolven-harness-a-core/wolven-harness-a-core-spec.md` / `docs/specs/archived/wolven-harness-a-core/wolven-harness-a-core-plan.md` |
| Obligations | R2.1 `proof-wha-profile-doc`, R2.2 `proof-wha-profile-rules` (09); R4.1 `proof-wha-skill-frontmatter`, R4.2 `proof-wha-step0-pending` (10) — done: parent `pnpm test` 87/87, `tsc --noEmit` clean; tests `profile-rules:` (13), `profile-doc:` (2), `skill-frontmatter:` (7, incl. `rule-missing`), `step0-pending:` (2). `WRITING-PROFILE.md` already matched the rules — unchanged |
| `HEAD` | package `3e2a640` + unit 08 uncommitted |
| `git status` | package dirty — unit 08 Owns only |
| Intended diff | 09: `src/validate/profile.ts`, `test/profile.test.ts`, `templates/docs/WRITING-PROFILE.md`; 10: `src/validate/spine.ts`, `test/spine.test.ts` (disjoint) |
| Discrepancies | Unit 08 uncommitted under the pair — isolated by disjoint Owns. Spine reads the working tree, not `git ls-files`: R4.2 says "while `WOLVEN.md` exists", and a fresh `init` leaves files untracked until the Human commits. Profile and claims stay on tracked files (R3.1) — resolved |

### Unit 11 — Claim scan + normal mode + self-claim

| Field | Value |
|-------|-------|
| Unit | 11 — Claim scan + normal mode + self-claim (Wave A2, after 09) |
| Spec / plan | `docs/specs/archived/wolven-harness-a-core/wolven-harness-a-core-spec.md` / `docs/specs/archived/wolven-harness-a-core/wolven-harness-a-core-plan.md` |
| Obligations | R3.1 `proof-wha-claim-scan`, R3.2 `proof-wha-claim-fail-closed`, R3.6 `proof-wha-self-claim` — done: parent `pnpm test` 101/101, `tsc --noEmit` clean; tests `claim-scan:` (6), `claim-fail-closed:` (7), `self-claim:` (1, fixture copy of the package ADR + `AGENTS.md`); leak grep outside `templates/`, `test/`, `docs/adrs/` finds only `AGENTS.md:24`. Builder choices: slug mismatch checked only once the ADR is `stable`; any number with more than one ADR (profile or legacy) is `claim-duplicate` — accepted |
| `HEAD` | package `3e2a640` + units 08–10 uncommitted |
| `git status` | package dirty — units 08–10 Owns only |
| Intended diff | `src/validate/claims.ts`, `test/claims.test.ts`, `docs/adrs/adr-001-claim-path.md`, `AGENTS.md` |
| Discrepancies | The R3.3 summary line and R3.4 legacy-claim warnings need claim counts, so they live in `claims.ts` (unit 11), which consumes `detectLegacy`; unit 12 implements `detectLegacy` and may fix the legacy branch of `claims.ts` — Owns extension, resolved. Claims read tracked files (R3.1), so the new `adr-001-claim-path.md` counts only once it is in the index; the unit 13 gate stages it (`git add -N`) before `pnpm validate` — resolved |

### Unit 12 — Legacy detection + ignore end-to-end

| Field | Value |
|-------|-------|
| Unit | 12 — Legacy detection + legacy mode + ignore end-to-end (Wave A2, after 11) |
| Spec / plan | `docs/specs/archived/wolven-harness-a-core/wolven-harness-a-core-spec.md` / `docs/specs/archived/wolven-harness-a-core/wolven-harness-a-core-plan.md` |
| Obligations | R3.3 `proof-wha-legacy-detect`, R3.4 `proof-wha-legacy-claims`, R3.7 `proof-wha-ignore` — done: parent `pnpm test` 114/114; tests `legacy-detect:` (2), `legacy-claims:` (4), `ignore:` (7); `claims.ts` unchanged |
| `HEAD` | package `3e2a640` + units 08–11 uncommitted |
| `git status` | package dirty — units 08–11 Owns only |
| Intended diff | `src/validate/legacy.ts`, `test/legacy.test.ts`, `test/ignore.test.ts`; legacy branch of `src/validate/claims.ts` only if a test exposes a bug (Owns extension recorded at unit 11) |
| Discrepancies | None |

### Unit 13 — Wave A2 gate

| Field | Value |
|-------|-------|
| Unit | 13 — Wave A2 gate (STOP) |
| Spec / plan | `docs/specs/archived/wolven-harness-a-core/wolven-harness-a-core-spec.md` / `docs/specs/archived/wolven-harness-a-core/wolven-harness-a-core-plan.md` |
| Obligations | A2 proofs — PASS 2026-09-24: `rm -rf dist && pnpm build` clean; `pnpm test` 114/114; `pnpm validate` exit 0 printing `claims: 2 ok, 0 legacy-warn, 0 fail` and `ignored: templates/**, test/** (19 files)` (`proof-wha-self-claim`); residue `rg` over `src templates` empty; no `LICENSE`. Test prefixes per proof: profile-doc 2, profile-rules 13, claim-scan 6, claim-fail-closed 7, legacy-detect 2, legacy-claims 4, claim-no-git 3, self-claim 1, ignore 7 + ignore-guard 8, skill-frontmatter 7, step0-pending 2 |
| `HEAD` | package `3e2a640` + units 08–12 uncommitted; OMT `d9204ba` + this plan |
| `git status` | package dirty — units 08–12 Owns only; `docs/adrs/adr-001-claim-path.md` staged intent-to-add (`git add -N`) so the claim gate sees it; OMT dirty — this plan file |
| Intended diff | none (gate) |
| Discrepancies | `ignored:` counts tracked files only, so the new A2 test files are not in the 19 until committed — expected under R3.1. Commit: Human ran `/code-commit` — package `29f8841` on `feat/a-core` (17 files, Wave A2); post-commit `pnpm validate` prints `ignored: templates/**, test/** (25 files)` — resolved |

### Unit 14 — Record A green in OMT

| Field | Value |
|-------|-------|
| Unit | 14 — Record A green in OMT (last unit) |
| Spec / plan | `docs/specs/archived/wolven-harness-a-core/wolven-harness-a-core-spec.md` / `docs/specs/archived/wolven-harness-a-core/wolven-harness-a-core-plan.md` |
| Obligations | TAP milestone "A pronta" cites `feat/a-core` `29f8841` and gate date 2026-09-24; spec's 21 acceptance boxes ticked with test evidence; OMT `pnpm docs:index && pnpm validate` — done |
| `HEAD` | package `29f8841`; OMT `a84af5b` |
| `git status` | package clean; OMT dirty — this plan, the spec, the TAP |
| Intended diff | `docs/prds/archived/wolven-ai-assisted-dev-harness/wolven-ai-assisted-dev-harness-project.md`, `docs/specs/archived/wolven-harness-a-core/wolven-harness-a-core-spec.md`, this plan |
| Discrepancies | Gate and approval dates were recorded as 2026-09-25 and frontmatter times were not real; corrected to 2026-09-24 using the commit times of `30aed4b` and `3e1f2d8` — resolved |

### Unit 15 — Comment gate port (addendum)

| Field | Value |
|-------|-------|
| Unit | 15 — Comment gate port (addendum after A green, from the WolvenTech/wolven-harness#1 review and grilling 2026-09-25) |
| Spec / plan | `docs/specs/archived/wolven-harness-a-core/wolven-harness-a-core-spec.md` / `docs/specs/archived/wolven-harness-a-core/wolven-harness-a-core-plan.md`; rule in the PRD note "shipped-artifact language"; deferral docs/deferrals/wolven-harness-comment-ruleset.md |
| Obligations | Gate check only (no spec proof added; spec A stays frozen) — done, package `4293e56`: parent `rm -rf dist && pnpm build` clean, `pnpm test` 131/131 (17 `comment-gate:`), `pnpm validate` ok, `pnpm comments` 0 findings, PRD sweep empty outside the gate's rule and test files. Parent review found interior edits of a multi-line JSDoc flagged as untagged (the diff hunk misses the `/**` opener); the builder first collapsed `src/init/index.ts`'s JSDoc to one line, then, on the parent's instruction, fixed the gate to classify the whole enclosing block while running leak rules on added lines only; the JSDoc is multi-line again. The One-Man-Team gate has the same flaw — out of scope here |
| `HEAD` | package `c90bed7` (`feat/a-core`, PR #1); OMT `cfe093a` |
| `git status` | package clean; OMT dirty — PRD note, new deferral, spec D stub, this plan |
| Intended diff | unit 15 Owns in the package repo |
| Discrepancies | Builders touch `package.json` only to add the `comments` script (plan refuse "no `package.json` after unit 01" — Human-approved exception via the grilling) — resolved. The One-Man-Team gate reads a Cursor turn-base SHA; the port uses `git merge-base HEAD origin/main` instead, since the package has no hooks — resolved. `main` holds only the empty root commit, so merge-base alone would flag all 51 pre-existing untagged `//` comments (the Human chose no retrofit). Decision: `.comment-gate.json` records `baseline: c90bed7`; when the baseline is an ancestor of `HEAD` and descends from the merge-base, lines present at the baseline are grandfathered — resolved |

**Merge:** WolvenTech/wolven-harness#1 squash-merged to `main` as `f33de1d` on 2026-09-25; the tree matches `feat/a-core` `4293e56`. On `main`: build clean, `pnpm test` 131/131, `pnpm validate` ok, `pnpm comments` 0 findings. The squash drops `c90bed7` from `main`'s history, so the comment-gate baseline no longer applies; merged code is covered by the merge-base.

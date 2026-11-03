---
type: spec
title: Quiet install — plan
description: Work-unit plan for the quiet install, in four waves (validate and doctor, setup, harness-init and guides, desktop proof), with an explicit subagent model per unit.
status: stable
---

# Quiet install — plan

**Spec:** `docs/specs/quiet-install/quiet-install-spec.md` (status `stable`)

## Structural gate

Confirmed: every obligation in the spec maps to one named proof. That is 54
R rows (R1.1–R11.3) against 54 acceptance boxes, paired one to one and
checked by script on 2026-11-03. No gaps. The spec's own gate,
`proof-quiet-install-spec-obligations`, holds:

- every box names one R row, and every R row has one box;
- all nine dimension landings are present;
- each `n/a` cites an unchanged surface.

## Model column

The skill's Subagent column says whether a unit spawns. This plan adds a
Model column, at the Human's direction, so the choice of model is made
here, not at run time:

- **`sol`** for every spawned unit, at the Human's direction on 2026-11-03.
- **`—`** for `inline` units, which run in the executing session.

For Codex dispatch, `sol` means `gpt-6.1-sol`. Builder subagents use low
reasoning effort. The executing session handles inline units.

## Work units

Every edit to a skill under `templates/.agents/skills/` is mirrored into
`.agents/skills/` in the same unit, because `test/skill-copies.test.ts`
fails on any difference. Owns lists the template path only.

| # | Unit | Depends | Owns | Subagent | Model | Done when |
|---|------|---------|------|----------|-------|-----------|
| 01 | Amend ADR-007 in place | — | `docs/adrs/adr-007-quiet-install-contract.md`, `test/contract.test.ts` | `inline` | — | [x] ADR-007 carries every item in the spec's ADR section: the quiet-install term, the fixed map, the home `AGENTS.md`, the bootstrap link, no deprecation release, the dropped entry-point commit choice, and the wiring record. The Human confirms through the `adr` skill. Its config table is unchanged, and `contract.test.ts` passes (`proof-quiet-install-contract`) |
| 02 | Fixed path map | — | `src/setup/path-map.ts` (new), `test/path-map.test.ts` (new) | `spawn` | sol | [x] One function maps the `docs/` and `.agents/` prefixes only where a path token starts, returns text unchanged for a `home` install, and has an inverse for the layout switch (`proof-quiet-install-fixed-map`, `proof-quiet-install-pathmap-boundary`) |
| 03 | Validate roots a quiet install at its home | — | `src/validate/{index,repo,profile,claims,adr-folders,config}.ts`, `test/validate-quiet-install.test.ts` (new) | `spawn` | sol | [x] Run anywhere in a quiet-install fixture, validate checks only files under `.wolven-harness/`, ignored ones included, prints home-prefixed paths, and ignores client claims and the client's `docs/`. `ignore` entries are home-relative, and other layouts validate as before (`proof-quiet-install-validate-root`, `-validate-scan`, `-client-claims`, `-client-docs`, `-ignore-entries`, `-validate-unchanged`) |
| 04 | `harness-ignored` scope and `harness-misplaced` | 03 | `src/validate/spine.ts`, `src/validate/report.ts`, `test/validate-quiet-install.test.ts` | `spawn` | sol | [x] `harness-ignored` checks only the re-included paths and names a root rule that hides them. A profile-typed `.md` outside the home raises one `harness-misplaced` warning, exit 0, that names the home path (`proof-quiet-install-ignored-scope`, `proof-quiet-install-misplaced`) |
| 05 | Doctor docs, Claude wiring, `codeRepo` and the wiring record | — | `src/doctor/{index,env-checks,runtime-checks}.ts`, `test/doctor-env.test.ts`, `test/doctor-runtime.test.ts` | `spawn` | sol | [x] `doctor-docs` checks `.wolven-harness/docs/adrs/`. The per-skill and per-rule Claude links satisfy the runtime checks, and `doctor-code-repo` is skipped. A recorded `skipped`, `merged` or `prefixed` entry warns instead of erroring (`proof-quiet-install-doctor-docs`, `-doctor-claude`, `-no-code-repo`, `-doctor-record`) |
| 06 | Quiet-install rows in the registry, and doctor per runtime | 05 | `src/setup/runtimes.ts`, `src/doctor/runtime-checks.ts`, `test/doctor-runtime.test.ts`, `test/runtime-registry.test.ts` | `spawn` | sol | [x] Each non-Claude registry row carries its quiet-install entry points, tracked-edit offer and manual step, copied from `docs/notes/quiet-install-runtimes/quiet-install-runtimes-note.md`. Doctor passes a fixture wired per row, and fails an unwired Codex with the manual step as `fix:` (`proof-quiet-install-doctor-runtimes`) |
| 07 | Drift applies the path map | 02 | `src/doctor/drift.ts`, `test/doctor-drift.test.ts` | `spawn` | sol | [x] A mapped skill is not reported as edited; mapped plus hand-edited is `doctor-drift-edited` (`proof-quiet-install-drift-pathmap`) |
| 08 | **Wave 1 gate** | 01, 03, 04, 06, 07 | `docs/specs/quiet-install/quiet-install-spec.md` (Wave 1 boxes) | `inline` | — | [x] `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm comments` and `node dist/cli.js validate` exit 0; Wave 1 boxes ticked with evidence — **abort before Wave 2** |
| 09 | Setup writes the quiet-install scaffold | 08 | `src/setup/{options,index,apply,render-wolven}.ts`, `templates/.wolven-harness/gitignore` (new), `test/setup-quiet-install.test.ts` (new), `test/setup-layout.test.ts` | `spawn` | sol | [x] At a top-level with no config, setup writes the nested `.gitignore` first, then the home with the map applied, the home `AGENTS.md` (no `WOLVEN.md`), and the config. A `home` config keeps today's scaffold (`proof-quiet-install-setup-default`, `-nested-gitignore`, `-render`, `-setup-unchanged`) |
| 10 | Bootstrap links and rerun | 09 | `src/setup/index.ts`, `src/setup/runtimes.ts`, `test/setup-quiet-install.test.ts` | `spawn` | sol | [x] Setup links `<skills folder>/harness-init` per runtime, unignored, and keeps an existing path. A rerun restores missing home files and links with the map applied and leaves edits alone. A fresh clone plus setup shows no drift (R4.1 bootstrap part; `proof-quiet-install-setup-rerun`) |
| 11 | Setup summary and next steps | 10 | `src/setup/summary.ts`, `src/setup/ui.ts`, `test/setup-quiet-install.test.ts` (stdout snapshots) | `spawn` | sol | [x] stdout names the quiet install with its description and never prints `linked` or `home`. The next step is the wording table's, with the untracked-link and remove-instead lines and the `SKILL.md` path for a runtime with no skills folder. `package.json` is unchanged (`proof-quiet-install-setup-scope`, `-setup-wording`) |
| 12 | **Wave 2 gate** | 11 | `docs/specs/quiet-install/quiet-install-spec.md` (Wave 2 boxes) | `inline` | — | [x] The same five gates exit 0; Wave 2 boxes ticked; wave 2's flip commit carries `BREAKING CHANGE:` naming the new default — **abort before Wave 3** |
| 13 | Worktree parity hook | 12 | `templates/.agents/hooks/worktree-parity.mjs` (new), `test/worktree-parity.test.ts` (new), `test/setup-hook-wiring.test.ts` | `spawn` | sol | [x] The hook exits 0 always and warns per missing entry point with a next step. Every install gets the script, and the root scaffold wires no `SessionStart` (`proof-quiet-install-parity-hook`, `-parity-wiring`) |
| 14 | layout.md: quiet-install versioning and wiring | 12 | `templates/.agents/skills/harness-init/references/layout.md`, `test/harness-init-layout.test.ts` | `spawn` | sol | [x] The quiet-install section states its place on both paths. It has the versioning question with six items and its footer, the ignore and wiring questions with one diff and one approval, the Claude entry-point table, and the hook paths, all in the wording table's text with both layout names (`proof-quiet-install-init-section`, `-init-version`, `-init-wire`, `-init-wording`, `-claude-entry`, `-hook-paths`) |
| 15 | layout.md: occupied paths, wiring record, runtime table | 14 | `templates/.agents/skills/harness-init/references/layout.md`, `test/harness-init-layout.test.ts` | `spawn` | sol | [x] The check before the diff keeps client paths and asks the three-way question; the kept-folder line and per-skill links are present. The wiring record has its fields and rerun rule. The eight runtime rows match the research note, each tracked-edit offer is in the wording table's text, and Codex's manual step is named (`proof-quiet-install-occupied`, `-wiring-record`, `-runtime-table`) |
| 16 | layout.md: layout switch | 15 | `templates/.agents/skills/harness-init/references/layout.md`, `test/harness-init-layout.test.ts` | `spawn` | sol | [x] The keep-or-switch question comes before the section. The switch diff carries edited and added files with the map reversed and removes owned wiring by the record. It checks for leftover links after the rerun. The confirm, blocked and unclear-entry messages are in the wording table's text (`proof-quiet-install-init-fork`, `-switch-keeps`, `-switch-unwires`) |
| 17 | SKILL.md opening, paths and harness block | 12 | `templates/.agents/skills/harness-init/SKILL.md`, `references/lean-path.md`, `references/entry-modes.md`, `test/skill-harness-init.test.ts` | `spawn` | sol | [x] The skill opens with the introduction and skips step 0 in a quiet install. Quick setup asks no goal; guided setup opens with repo and role and asks one step question per phase, with no checklist. The harness block is plain text of three lines at most, plus the `@` line only after Amp's offer, with Yes and No only (`proof-quiet-install-init-step0`, `-lean-path`, `-init-agents-conflict`) |
| 18 | SKILL.md closing: one commit offer | 17 | `templates/.agents/skills/harness-init/SKILL.md`, `references/session-note-template.md`, `test/skill-harness-init.test.ts` | `spawn` | sol | [x] One offer at the end, listing only trackable paths, with the branch and "Nothing is pushed". It shows the local-only and kept-path lines and the session-note rule, hands off to `code-commit`, uses the no-remote text, gives the packaging line by its `.dockerignore` condition, and states the worktree limit (`proof-quiet-install-init-statement`) |
| 19 | Migration copy and checks question | 12 | `templates/.agents/skills/harness-init/references/{adr-migration,validate-wiring}.md`, `test/harness-init-migration.test.ts`, `test/skill-harness-init.test.ts` | `spawn` | sol | [x] In a quiet install, migration copies and never moves, and asks in the wording table's text. The checks question offers "Only when I run it" first, then "On every pull request", plus Skip on guided setup (`proof-quiet-install-migration-copy`, `-checks-question`) |
| 20 | Commit convention and staging in a quiet install | 12 | `templates/.agents/skills/harness-init/references/convention.md`, `templates/.agents/skills/{code-commit,code-pr}/SKILL.md`, `test/convention-skills.test.ts` | `spawn` | sol | [x] The convention is recorded at the root with no `codeRepo` and applies to harness paths. Both skills stage a home path only when named, and never use `add -A` or `add .` (`proof-quiet-install-convention`, `-no-home-staging`) |
| 21 | harness-doctor refresh uses the path map | 12 | `templates/.agents/skills/harness-doctor/SKILL.md`, `test/harness-doctor-skill.test.ts` | `spawn` | sol | [x] The refresh step in a quiet install compares and rewrites through the fixed map, as R1.3 requires; a text check in `harness-doctor-skill.test.ts` passes |
| 22 | Site guide, layout page and docs-root deferral | 12 | `site/install.md`, `site/layout.md`, `docs/deferrals/docs-root/docs-root-deferral.md` | `spawn` | sol | [x] The uninstall guide keeps edited files and docs before removal. The layout page names the quiet install as the default and the full install by name. The deferral fixes the docs root at `<harnessHome>/docs/`. `pnpm docs:build` and validate exit 0 (`proof-quiet-install-uninstall-guide`, `-layout-page`, `-deferral`) |
| 23 | Copy rules pass | 11, 13, 16, 18, 19, 22 | `test/quiet-install-copy.test.ts` (new); edits limited to the strings checked, in the files units 04–05, 11, 13–19 and 22 own | `inline` | — | [x] Every question that writes outside the home names its tracked change. No "the Human" or glossary term is left in text people read, and the introduction comes first. Every stop says "Nothing changed." when true and names the next step, including wave 1–2 messages (`proof-quiet-install-tracked-changes`, `-terms-first`, `-next-step`) |
| 24 | **Wave 3 gate** | 20, 21, 23 | `docs/specs/quiet-install/quiet-install-spec.md` (Wave 3 boxes) | `inline` | — | [x] The five gates plus `pnpm docs:build` exit 0; Wave 3 boxes ticked — **abort before Wave 4** |
| 25 | Desktop worktree proof run | 24 | `docs/notes/quiet-install-proof/quiet-install-proof-note.md` (new) | `inline` | — | [ ] With the Human watching, a fixture made by the built setup and a harness-init run loads skills, `AGENTS.md`, rules and the guard in a desktop worktree. A home ADR stays untracked with no prompt, root `git status` is empty, and deleting `CLAUDE.local.md` shows the parity warning. Cursor and other runtimes are probed where at hand (`proof-quiet-install-worktree-run`, `-worktree-warning`) |
| 26 | **Ship gate** | 25 | `docs/specs/quiet-install/quiet-install-spec.md` (Wave 4 boxes) | `inline` | — | [ ] Every acceptance box ticked; the breaking-marker gate exits 0; `node dist/cli.js validate` PASS — hand off to `code-pr` only on the Human's ask |

Unit 23 is `inline` although its strings are copy. It edits strings
across files that eight earlier units own, so it must share the session
that can see all of them. The executing session uses Sol.

## Wave stops

| Stop | After | Gate |
|------|-------|------|
| **1** | Unit 08 | `pnpm build && pnpm test && pnpm lint && pnpm comments && node dist/cli.js validate` PASS — **abort before Wave 2** |
| **2** | Unit 12 | Same gate PASS, and the flip commit carries `BREAKING CHANGE:` — **abort before Wave 3** |
| **3** | Unit 24 | Same gate plus `pnpm docs:build` PASS — **abort before Wave 4** |
| **Ship** | Unit 26 | Desktop checks observed by the Human; every box ticked; the breaking-marker gate and validate PASS |

## Unresolved

None blocks a wave. Each disposition is copied from the spec.

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
|---|---|---|---|---|---|
| `U-cursor-ignored-rules` | Whether Cursor loads rules from a gitignored `.cursor/rules/` | maintainer | Non-blocking: R6.2 wires from Cursor's docs | Probe during wave 4 if Cursor is at hand; record the result in the proof note | 25 |
| `U-runtimes-ignored-load` | Whether each non-Claude runtime loads its entry points from ignored paths | maintainer | Non-blocking: doctor checks only that the paths exist | Probe in wave 4 for each runtime at hand; record the results in the proof note | 25 |
| `U-score-quiet` | How `harness-score` rates a quiet install | maintainer | Non-blocking: harness-init's score step may report low | Defer with a trigger: a score report on a quiet install that misleads the Human | — |
| `U-sibling-verdict` | Whether the second Jury's sibling-folder verdict and its deferrals are dropped | Human | Non-blocking | Resolve before archiving `docs/notes/jury-verdict-journeys/` | — |

## Frontier order

**Wave 1:** (01 ∥ 02 ∥ 03 ∥ 05) → (04 after 03; 06 after 05; 07 after 02) → **08 STOP**

**Wave 2:** 09 → 10 → 11 → **12 STOP**

**Wave 3:** (13 ∥ 14 ∥ 17 ∥ 19 ∥ 20 ∥ 21 ∥ 22) → (15 → 16 after 14; 18 after 17) → 23 → **24 STOP**

**Wave 4:** 25 → **26 STOP**

Parallel units have disjoint Owns:

- **Wave 1:** units 03 and 04 share `test/validate-quiet-install.test.ts`,
  and units 05 and 06 share `runtime-checks.ts`, so each pair runs in order.
- **Wave 2:** units 09–11 all touch `src/setup/index.ts` or the same test
  file, so the wave is a chain.
- **Wave 3:** units 14–16 each edit `layout.md`, and units 17 and 18 each
  edit `SKILL.md`, so each group runs in order. Unit 23 waits for every
  copy unit.

## Execution / resume section

Models: every builder uses `gpt-6.1-sol`, low reasoning effort, as requested.
Commit cadence: `autocommit: true`, `autocommit-rule: wave`, both from
`.agents/code-commit.config.yml`. Active batch: Wave 2, units 09–12. Stop after unit 12; no push or PR.

### Unit 01 — Amend ADR-007 in place

| Field | Value |
|-------|-------|
| Unit identifier | 01 — Amend ADR-007 in place; Wave 1 frontier |
| Spec/plan paths | `docs/specs/quiet-install/quiet-install-spec.md` / `docs/specs/quiet-install/quiet-install-plan.md` |
| Obligation / proof status | R1.2 / proof-quiet-install-contract — done; Human confirmed amendment on 2026-11-03; contract tests and Wave 1 gate PASS |
| `HEAD` commit | `e8a5878` |
| `git status` summary | dirty — proven Wave 1 Owns, spec acceptance and plan only; reconciled at gate before commit |
| Intended diff scope | `docs/adrs/adr-007-quiet-install-contract.md`, `test/contract.test.ts` |
| Decision on every discrepancy | Resolved: model selection authorized; parallel units isolated to Owns; parent owns plan |

### Unit 02 — Fixed path map

| Field | Value |
|-------|-------|
| Unit identifier | 02 — Fixed path map; Wave 1 frontier |
| Spec/plan paths | `docs/specs/quiet-install/quiet-install-spec.md` / `docs/specs/quiet-install/quiet-install-plan.md` |
| Obligation / proof status | R1.1, R1.3 — done; Wave 1 gate PASS |
| `HEAD` commit | `e8a5878` |
| `git status` summary | dirty — proven Wave 1 Owns, spec acceptance and plan only; reconciled at gate before commit |
| Intended diff scope | `src/setup/path-map.ts`, `test/path-map.test.ts` |
| Decision on every discrepancy | Resolved: model selection authorized; parallel units isolated to Owns; parent owns plan |

### Unit 03 — Validate roots a quiet install at its home

| Field | Value |
|-------|-------|
| Unit identifier | 03 — Validate roots a quiet install at its home; Wave 1 frontier |
| Spec/plan paths | `docs/specs/quiet-install/quiet-install-spec.md` / `docs/specs/quiet-install/quiet-install-plan.md` |
| Obligation / proof status | R2.1–R2.4, R2.6–R2.7 — done; Wave 1 gate PASS |
| `HEAD` commit | `e8a5878` |
| `git status` summary | dirty — proven Wave 1 Owns, spec acceptance and plan only; reconciled at gate before commit |
| Intended diff scope | `src/validate/{index,repo,profile,claims,adr-folders,config}.ts`, `test/validate-quiet-install.test.ts` |
| Decision on every discrepancy | Resolved: model selection authorized; parallel units isolated to Owns; parent owns plan |

### Unit 05 — Doctor quiet install

| Field | Value |
|-------|-------|
| Unit identifier | 05 — Doctor quiet install; Wave 1 frontier |
| Spec/plan paths | `docs/specs/quiet-install/quiet-install-spec.md` / `docs/specs/quiet-install/quiet-install-plan.md` |
| Obligation / proof status | R3.1, R3.2, R3.5, R3.6 — done; Wave 1 gate PASS |
| `HEAD` commit | `e8a5878` |
| `git status` summary | dirty — proven Wave 1 Owns, spec acceptance and plan only; reconciled at gate before commit |
| Intended diff scope | `src/doctor/{index,env-checks,runtime-checks}.ts`, `test/doctor-env.test.ts`, `test/doctor-runtime.test.ts` |
| Decision on every discrepancy | Resolved: model selection authorized; parallel units isolated to Owns; parent owns plan |

### Unit 07 — Drift applies the path map

| Field | Value |
|-------|-------|
| Unit identifier | 07 — Drift applies the path map; after 02 |
| Spec/plan paths | `docs/specs/quiet-install/quiet-install-spec.md` / `docs/specs/quiet-install/quiet-install-plan.md` |
| Obligation / proof status | R3.4 / proof-quiet-install-drift-pathmap — done; Wave 1 gate PASS |
| `HEAD` commit | `e8a5878` |
| `git status` summary | dirty — proven Wave 1 Owns, spec acceptance and plan only; reconciled at gate before commit |
| Intended diff scope | `src/doctor/drift.ts`, `test/doctor-drift.test.ts` |
| Decision on every discrepancy | Resolved: 02 proven; Wave 1 marks and work land together; isolated scope |

### Unit 04 — Ignored scope and misplaced docs

| Field | Value |
|-------|-------|
| Unit identifier | 04 — Ignored scope and misplaced docs; after 03 |
| Spec/plan paths | `docs/specs/quiet-install/quiet-install-spec.md` / `docs/specs/quiet-install/quiet-install-plan.md` |
| Obligation / proof status | R2.5, R2.8 — done; Wave 1 gate PASS |
| `HEAD` commit | `e8a5878` |
| `git status` summary | dirty — proven Wave 1 Owns, spec acceptance and plan only; reconciled at gate before commit |
| Intended diff scope | `src/validate/spine.ts`, `src/validate/report.ts`, `test/validate-quiet-install.test.ts` |
| Decision on every discrepancy | Resolved: preceding builder finishes before dispatch; shared test/source changes retained; parent owns plan |

### Unit 06 — Registry and doctor per runtime

| Field | Value |
|-------|-------|
| Unit identifier | 06 — Registry and doctor per runtime; after 05 |
| Spec/plan paths | `docs/specs/quiet-install/quiet-install-spec.md` / `docs/specs/quiet-install/quiet-install-plan.md` |
| Obligation / proof status | R3.3 / proof-quiet-install-doctor-runtimes — done; Wave 1 gate PASS |
| `HEAD` commit | `e8a5878` |
| `git status` summary | dirty — proven Wave 1 Owns, spec acceptance and plan only; reconciled at gate before commit |
| Intended diff scope | `src/setup/runtimes.ts`, `src/doctor/runtime-checks.ts`, `test/doctor-runtime.test.ts`, `test/runtime-registry.test.ts` |
| Decision on every discrepancy | Resolved: preceding builder finishes before dispatch; shared test/source changes retained; parent owns plan |

### Unit 08 — Wave 1 gate

| Field | Value |
|-------|-------|
| Unit identifier | 08 — Wave 1 gate; STOP before Wave 2 |
| Spec/plan paths | `docs/specs/quiet-install/quiet-install-spec.md` / `docs/specs/quiet-install/quiet-install-plan.md` |
| Obligation / proof status | Wave 1 acceptance boxes — done; Wave 1 gate PASS |
| `HEAD` commit | `e8a5878` |
| `git status` summary | dirty — proven Wave 1 Owns, spec acceptance and plan only; reconciled at gate before commit |
| Intended diff scope | `docs/specs/quiet-install/quiet-install-spec.md` Wave 1 acceptance; plan marks in same wave commit |
| Decision on every discrepancy | Resolved: Codex skills are checked, but its instruction row has no automatic wiring; doctor-entry reports its manual step. All seven other non-Claude runtimes receive passing wired fixtures. No Wave 2 work authorized in this batch. |

### Wave 1 evidence and next frontier

On 2026-11-03, `pnpm build`, `pnpm test` (1,065 passed, zero failed),
`pnpm lint`, `pnpm comments` and `node dist/cli.js validate` all exited 0
on the final code. Comments reported zero findings; validate reported
66 valid claims and zero failures. The full test run includes every Wave 1
proof, the unchanged-layout suites and orphan generated-rule regressions.
The ADR config table is byte-for-byte unchanged from the pre-execution HEAD.

The Human confirmed the ADR amendment in this chat. CLI checks used
`node dist/cli.js` because `wolven-harness` was not on PATH. All builders
used `gpt-6.1-sol` with low reasoning effort. No runtime-loading probe is
claimed by these filesystem tests.

Units 01–08 and the Wave 1 acceptance marks land with their implementation
in one local commit. STOP at unit 08. Wave 2 was resumed by the Human on 2026-11-03; its first frontier is unit 09. Nothing is pushed; no PR is opened.

### Unit 09 — Setup writes the quiet-install scaffold

| Field | Value |
|-------|-------|
| Unit identifier | 09 — Setup writes the quiet-install scaffold; first Wave 2 frontier |
| Spec/plan paths | `docs/specs/quiet-install/quiet-install-spec.md` / `docs/specs/quiet-install/quiet-install-plan.md` |
| Obligation / proof status | R4.1 scaffold, R4.2, R4.4, R4.6 — done; Wave 2 gate PASS |
| `HEAD` commit | `ea1a4a2` |
| `git status` summary | dirty — proven Wave 2 paths and plan only; clean at batch start |
| Intended diff scope | `src/setup/{options,index,apply,render-wolven}.ts`, `templates/.wolven-harness/gitignore`, `test/setup-quiet-install.test.ts`, `test/setup-layout.test.ts` |
| Decision on every discrepancy | Resolved: unit 09 also owns a minimal `src/setup/config.ts` writer injection so the required write-order proof reuses the config serializer. No contract or config-key change. Parent also owns `test/helpers/fixture.ts` and existing setup regression fixtures that require `layout: home`; these fixtures opt into the unchanged full install, with original behavior assertions preserved. New-default and prompt-detection fixtures remain config-free. Units 09–11 run serially on shared Owns |

### Unit 10 — Bootstrap links and rerun

| Field | Value |
|-------|-------|
| Unit identifier | 10 — Bootstrap links and rerun; after 09 focused proofs |
| Spec/plan paths | `docs/specs/quiet-install/quiet-install-spec.md` / `docs/specs/quiet-install/quiet-install-plan.md` |
| Obligation / proof status | R4.1 bootstrap, R4.5 — done; Wave 2 gate PASS |
| `HEAD` commit | `ea1a4a2` |
| `git status` summary | dirty — unit 09 source, template, tests and plan; parent owns explicit-home regression fixtures |
| Intended diff scope | `src/setup/index.ts`, `src/setup/runtimes.ts`, `test/setup-quiet-install.test.ts` |
| Decision on every discrepancy | Resolved: unit 09 targeted checks passed; old full-install fixture failures are being migrated by parent. Parent also owns generated `known-forms.json`, required by the new template. Keep unit 09 writer ordering proof; bootstrap follows config. |

### Unit 11 — Setup summary and next steps

| Field | Value |
|-------|-------|
| Unit identifier | 11 — Setup summary and next steps; after 10 focused proofs |
| Spec/plan paths | `docs/specs/quiet-install/quiet-install-spec.md` / `docs/specs/quiet-install/quiet-install-plan.md` |
| Obligation / proof status | R4.3, R4.7 — done; Wave 2 gate PASS |
| `HEAD` commit | `ea1a4a2` |
| `git status` summary | dirty — units 09–10 plus explicit-home regression fixtures and known-forms generation |
| Intended diff scope | `src/setup/summary.ts`, `src/setup/ui.ts`, `test/setup-quiet-install.test.ts`; `src/setup/index.ts` orchestration exception |
| Decision on every discrepancy | Resolved: index must call the new summary and pass bootstrap outcomes; this orchestration is necessary for the listed stdout proof. Existing full/outside copy assertions stay intact; quiet copy follows the frozen wording table. |

### Unit 12 — Wave 2 gate

| Field | Value |
|-------|-------|
| Unit identifier | 12 — Wave 2 gate; STOP before Wave 3 |
| Spec/plan paths | `docs/specs/quiet-install/quiet-install-spec.md` / `docs/specs/quiet-install/quiet-install-plan.md` |
| Obligation / proof status | Wave 2 acceptance boxes — done; Wave 2 gate PASS |
| `HEAD` commit | `ea1a4a2` |
| `git status` summary | dirty — Wave 2 Owns, explicit-home regression fixture migrations, generated template forms and plan |
| Intended diff scope | `docs/specs/quiet-install/quiet-install-spec.md` Wave 2 acceptance, plan completion marks, atomic wave commit with breaking footer |
| Decision on every discrepancy | Resolved: full-install fixtures opt into home so original assertions remain; prompt/invalid/new-default tests remain config-free. The template mapping is mirrored in `scripts/known-forms.mjs`, its test and generated `known-forms.json`. Index orchestration and config writer seam are recorded under units 09 and 11. |

### Wave 2 evidence and next frontier

On 2026-11-03, `pnpm build`, `pnpm test` (1,076 passed, zero failed),
`pnpm lint`, `pnpm comments` and `node dist/cli.js validate` all exited 0
on the final code. Comments reported zero findings; validate reported
66 valid claims and zero failures. The suite proves all R4 obligations,
including write order, ignored/bootstrap footprint, occupied paths,
create-only reruns, clone restoration without drift, stdout and unchanged
client package bytes. Existing full-install regressions use explicit home
fixtures; outside, prompt and refusal tests continue to exercise their
original cases. No acceptance assertion was relaxed for the default flip.

One local wave commit carries units 09–12, their acceptance marks and the
`BREAKING CHANGE:` footer naming the quiet-install default. The new nested
ignore template's installed-path hash is generated with the existing tool.
All builders used `gpt-6.1-sol` with low reasoning effort. No desktop
runtime-loading result is claimed by these tests.

STOP at unit 12. Next frontier: Wave 3 (units 13, 14, 17, 19, 20, 21, 22),
only after the Human resumes it. Nothing is pushed; no PR is opened.

### Wave 3 batch

The Human resumed Wave 3 in Claude Code on 2026-11-03 and chose the builder
model there. Claude Code cannot dispatch Sol, so every Wave 3 builder runs
on Claude Sonnet (`sonnet`), in place of the Model column's `sol`. Inline
units run in the executing session on Claude Opus 5.5. Commit cadence is
unchanged: `autocommit: true`, `autocommit-rule: wave`, both from
`.agents/code-commit.config.yml`. Active batch: Wave 3, units 13–24. Stop
after unit 24; no push or PR.

Units 17–18 and unit 19 share `test/skill-harness-init.test.ts`, so unit
19 runs after unit 18 rather than in parallel with 17. Every other Wave 3
lane has disjoint Owns. The parent owns `known-forms.json` and
`scripts/known-forms.mjs` regeneration for the new hook template, as it did
for the Wave 2 template.

| Field | Value |
|-------|-------|
| Unit identifier | 13, 14, 17, 20, 21, 22 — first Wave 3 frontier; 15 → 16 after 14; 18 → 19 after 17; 23 inline after all copy units; 24 gate |
| Spec/plan paths | `docs/specs/quiet-install/quiet-install-spec.md` / `docs/specs/quiet-install/quiet-install-plan.md` |
| Obligation / proof status | R5.1–R5.15, R6.1–R6.3, R7.1–R7.2, R8.1–R8.2, R9.1–R9.3, R11.1–R11.3 — done; Wave 3 gate PASS |
| `HEAD` commit | `8ddb866` |
| `git status` summary | clean at batch start; this plan file is the only dirt before builders start |
| Intended diff scope | Each unit's Owns from the Work units table, each template skill edit mirrored into `.agents/skills/`, plus parent-owned `known-forms.json` regeneration |
| Decision on every discrepancy | Resolved: builder model is `sonnet` by the Human's choice, not `sol`; unit 19 serialized after 18 on the shared test file; older resume rows are historical snapshots, superseded by this record |

### Unit 23 — Copy rules pass

| Field | Value |
|-------|-------|
| Unit identifier | 23 — Copy rules pass; inline, after units 13–22 returned complete |
| Spec/plan paths | `docs/specs/quiet-install/quiet-install-spec.md` / `docs/specs/quiet-install/quiet-install-plan.md` |
| Obligation / proof status | R11.1–R11.3 — done; Wave 3 gate PASS |
| `HEAD` commit | `8ddb866` |
| `git status` summary | dirty — Wave 3 builder Owns, their skill mirrors, `known-forms.json`, and parent follow-ups listed below; no unrelated paths |
| Intended diff scope | `test/quiet-install-copy.test.ts` (new); string edits only in files units 04–05, 11, 13–19 and 22 own |
| Decision on every discrepancy | Resolved: the parent took follow-ups the builders reported outside their Owns, each forced by a Wave 3 behavior change. The new hook needed `templates/.agents/hooks/README.md` and the path lists in `test/setup-surfaces.test.ts` and `test/seed-extract.test.ts`. The single commit offer and the Quick/Guided paths needed `README.md`, `site/install.md`, `references/stub-template.md`, `references/lean-path.md`, `test/harness-init-note.test.ts`, `test/harness-init-stub.test.ts`, `test/harness-init-set.test.ts`, `test/readme-install.test.ts` and `proof-basics-writes`. `known-forms.json` was regenerated with `pnpm gen:known-forms`. Each assertion was rewritten to the new text, not loosened |

### Wave 3 evidence and next frontier

On 2026-11-03, `pnpm build`, `pnpm test` (1,111 passed, zero failed),
`pnpm lint`, `pnpm comments`, `node dist/cli.js validate` and
`pnpm docs:build` all exited 0 on the final code. Comments reported zero
findings; validate reported 66 valid claims and zero failures. Every builder
returned complete with its own comments and validate outputs, and the parent
re-ran the whole gate over the full repo after unit 23.

Unit 23 added `test/quiet-install-copy.test.ts`. To meet R11.1, it named the
tracked change in the full-install questions: the `AGENTS.md` mode, the
`CLAUDE.md` import, re-include rules, CI and script wiring, and the decision
record move. To meet R11.2, it switched the rendered stub to "you". To meet
R11.3, it gave the credential, layout-switch and no-moves stops their next
step. Wave 1–2 doctor and validate messages already met R11.3 and needed no
edit.

Builders 13–22 used Claude Sonnet (`sonnet`) in place of `sol`, at the
Human's direction; units 23 and 24 ran inline on Claude Opus 5.5. No desktop
runtime-loading result is claimed by these text and filesystem tests.

One local wave commit carries units 13–24 and their acceptance marks. STOP
at unit 24. Next frontier: Wave 4 (unit 25, the desktop worktree proof),
only with the Human watching. Nothing is pushed; no PR is opened.

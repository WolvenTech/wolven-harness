---
type: spec
title: Quiet install — plan
description: Work-unit plan for the quiet install, in four waves (validate and doctor, setup, harness-init and guides, desktop proof), with an explicit subagent model per unit.
status: draft
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

- **`opus`** for units whose main output is text a person reads. That means
  harness-init's questions and closings, setup's summary, the site guide,
  and the copy-rules pass. The spec's wording table and copy rules (R11)
  are the bar these units are judged by.
- **`sonnet`** for code, tests, and skill text that only agents read.
- **`—`** for `inline` units, which run in the executing session.

## Work units

Every edit to a skill under `templates/.agents/skills/` is mirrored into
`.agents/skills/` in the same unit, because `test/skill-copies.test.ts`
fails on any difference. Owns lists the template path only.

| # | Unit | Depends | Owns | Subagent | Model | Done when |
|---|------|---------|------|----------|-------|-----------|
| 01 | Amend ADR-007 in place | — | `docs/adrs/adr-007-quiet-install-contract.md`, `test/contract.test.ts` | `inline` | — | [ ] ADR-007 carries every item in the spec's ADR section: the quiet-install term, the fixed map, the home `AGENTS.md`, the bootstrap link, no deprecation release, the dropped entry-point commit choice, and the wiring record. The Human confirms through the `adr` skill. Its config table is unchanged, and `contract.test.ts` passes (`proof-quiet-install-contract`) |
| 02 | Fixed path map | — | `src/setup/path-map.ts` (new), `test/path-map.test.ts` (new) | `spawn` | sonnet | [ ] One function maps the `docs/` and `.agents/` prefixes only where a path token starts, returns text unchanged for a `home` install, and has an inverse for the layout switch (`proof-quiet-install-fixed-map`, `proof-quiet-install-pathmap-boundary`) |
| 03 | Validate roots a quiet install at its home | — | `src/validate/{index,repo,profile,claims,adr-folders,config}.ts`, `test/validate-quiet-install.test.ts` (new) | `spawn` | sonnet | [ ] Run anywhere in a quiet-install fixture, validate checks only files under `.wolven-harness/`, ignored ones included, prints home-prefixed paths, and ignores client claims and the client's `docs/`. `ignore` entries are home-relative, and other layouts validate as before (`proof-quiet-install-validate-root`, `-validate-scan`, `-client-claims`, `-client-docs`, `-ignore-entries`, `-validate-unchanged`) |
| 04 | `harness-ignored` scope and `harness-misplaced` | 03 | `src/validate/spine.ts`, `src/validate/report.ts`, `test/validate-quiet-install.test.ts` | `spawn` | sonnet | [ ] `harness-ignored` checks only the re-included paths and names a root rule that hides them. A profile-typed `.md` outside the home raises one `harness-misplaced` warning, exit 0, that names the home path (`proof-quiet-install-ignored-scope`, `proof-quiet-install-misplaced`) |
| 05 | Doctor docs, Claude wiring, `codeRepo` and the wiring record | — | `src/doctor/{index,env-checks,runtime-checks}.ts`, `test/doctor-env.test.ts`, `test/doctor-runtime.test.ts` | `spawn` | sonnet | [ ] `doctor-docs` checks `.wolven-harness/docs/adrs/`. The per-skill and per-rule Claude links satisfy the runtime checks, and `doctor-code-repo` is skipped. A recorded `skipped`, `merged` or `prefixed` entry warns instead of erroring (`proof-quiet-install-doctor-docs`, `-doctor-claude`, `-no-code-repo`, `-doctor-record`) |
| 06 | Quiet-install rows in the registry, and doctor per runtime | 05 | `src/setup/runtimes.ts`, `src/doctor/runtime-checks.ts`, `test/doctor-runtime.test.ts`, `test/runtime-registry.test.ts` | `spawn` | sonnet | [ ] Each non-Claude registry row carries its quiet-install entry points, tracked-edit offer and manual step, copied from `docs/notes/quiet-install-runtimes/quiet-install-runtimes-note.md`. Doctor passes a fixture wired per row, and fails an unwired Codex with the manual step as `fix:` (`proof-quiet-install-doctor-runtimes`) |
| 07 | Drift applies the path map | 02 | `src/doctor/drift.ts`, `test/doctor-drift.test.ts` | `spawn` | sonnet | [ ] A mapped skill is not reported as edited; mapped plus hand-edited is `doctor-drift-edited` (`proof-quiet-install-drift-pathmap`) |
| 08 | **Wave 1 gate** | 01, 03, 04, 06, 07 | `docs/specs/quiet-install/quiet-install-spec.md` (Wave 1 boxes) | `inline` | — | [ ] `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm comments` and `node dist/cli.js validate` exit 0; Wave 1 boxes ticked with evidence — **abort before Wave 2** |
| 09 | Setup writes the quiet-install scaffold | 08 | `src/setup/{options,index,apply,render-wolven}.ts`, `templates/.wolven-harness/gitignore` (new), `test/setup-quiet-install.test.ts` (new), `test/setup-layout.test.ts` | `spawn` | sonnet | [ ] At a top-level with no config, setup writes the nested `.gitignore` first, then the home with the map applied, the home `AGENTS.md` (no `WOLVEN.md`), and the config. A `home` config keeps today's scaffold (`proof-quiet-install-setup-default`, `-nested-gitignore`, `-render`, `-setup-unchanged`) |
| 10 | Bootstrap links and rerun | 09 | `src/setup/index.ts`, `src/setup/runtimes.ts`, `test/setup-quiet-install.test.ts` | `spawn` | sonnet | [ ] Setup links `<skills folder>/harness-init` per runtime, unignored, and keeps an existing path. A rerun restores missing home files and links with the map applied and leaves edits alone. A fresh clone plus setup shows no drift (R4.1 bootstrap part; `proof-quiet-install-setup-rerun`) |
| 11 | Setup summary and next steps | 10 | `src/setup/summary.ts`, `src/setup/ui.ts`, `test/setup-quiet-install.test.ts` (stdout snapshots) | `spawn` | opus | [ ] stdout names the quiet install with its description and never prints `linked` or `home`. The next step is the wording table's, with the untracked-link and remove-instead lines and the `SKILL.md` path for a runtime with no skills folder. `package.json` is unchanged (`proof-quiet-install-setup-scope`, `-setup-wording`) |
| 12 | **Wave 2 gate** | 11 | `docs/specs/quiet-install/quiet-install-spec.md` (Wave 2 boxes) | `inline` | — | [ ] The same five gates exit 0; Wave 2 boxes ticked; wave 2's flip commit carries `BREAKING CHANGE:` naming the new default — **abort before Wave 3** |
| 13 | Worktree parity hook | 12 | `templates/.agents/hooks/worktree-parity.mjs` (new), `test/worktree-parity.test.ts` (new), `test/setup-hook-wiring.test.ts` | `spawn` | sonnet | [ ] The hook exits 0 always and warns per missing entry point with a next step. Every install gets the script, and the root scaffold wires no `SessionStart` (`proof-quiet-install-parity-hook`, `-parity-wiring`) |
| 14 | layout.md: quiet-install versioning and wiring | 12 | `templates/.agents/skills/harness-init/references/layout.md`, `test/harness-init-layout.test.ts` | `spawn` | opus | [ ] The quiet-install section states its place on both paths. It has the versioning question with six items and its footer, the ignore and wiring questions with one diff and one approval, the Claude entry-point table, and the hook paths, all in the wording table's text with both layout names (`proof-quiet-install-init-section`, `-init-version`, `-init-wire`, `-init-wording`, `-claude-entry`, `-hook-paths`) |
| 15 | layout.md: occupied paths, wiring record, runtime table | 14 | `templates/.agents/skills/harness-init/references/layout.md`, `test/harness-init-layout.test.ts` | `spawn` | opus | [ ] The check before the diff keeps client paths and asks the three-way question; the kept-folder line and per-skill links are present. The wiring record has its fields and rerun rule. The eight runtime rows match the research note, each tracked-edit offer is in the wording table's text, and Codex's manual step is named (`proof-quiet-install-occupied`, `-wiring-record`, `-runtime-table`) |
| 16 | layout.md: layout switch | 15 | `templates/.agents/skills/harness-init/references/layout.md`, `test/harness-init-layout.test.ts` | `spawn` | opus | [ ] The keep-or-switch question comes before the section. The switch diff carries edited and added files with the map reversed and removes owned wiring by the record. It checks for leftover links after the rerun. The confirm, blocked and unclear-entry messages are in the wording table's text (`proof-quiet-install-init-fork`, `-switch-keeps`, `-switch-unwires`) |
| 17 | SKILL.md opening, paths and harness block | 12 | `templates/.agents/skills/harness-init/SKILL.md`, `references/lean-path.md`, `references/entry-modes.md`, `test/skill-harness-init.test.ts` | `spawn` | opus | [ ] The skill opens with the introduction and skips step 0 in a quiet install. Quick setup asks no goal; guided setup opens with repo and role and asks one step question per phase, with no checklist. The harness block is plain text of three lines at most, plus the `@` line only after Amp's offer, with Yes and No only (`proof-quiet-install-init-step0`, `-lean-path`, `-init-agents-conflict`) |
| 18 | SKILL.md closing: one commit offer | 17 | `templates/.agents/skills/harness-init/SKILL.md`, `references/session-note-template.md`, `test/skill-harness-init.test.ts` | `spawn` | opus | [ ] One offer at the end, listing only trackable paths, with the branch and "Nothing is pushed". It shows the local-only and kept-path lines and the session-note rule, hands off to `code-commit`, uses the no-remote text, gives the packaging line by its `.dockerignore` condition, and states the worktree limit (`proof-quiet-install-init-statement`) |
| 19 | Migration copy and checks question | 12 | `templates/.agents/skills/harness-init/references/{adr-migration,validate-wiring}.md`, `test/harness-init-migration.test.ts`, `test/skill-harness-init.test.ts` | `spawn` | opus | [ ] In a quiet install, migration copies and never moves, and asks in the wording table's text. The checks question offers "Only when I run it" first, then "On every pull request", plus Skip on guided setup (`proof-quiet-install-migration-copy`, `-checks-question`) |
| 20 | Commit convention and staging in a quiet install | 12 | `templates/.agents/skills/harness-init/references/convention.md`, `templates/.agents/skills/{code-commit,code-pr}/SKILL.md`, `test/convention-skills.test.ts` | `spawn` | sonnet | [ ] The convention is recorded at the root with no `codeRepo` and applies to harness paths. Both skills stage a home path only when named, and never use `add -A` or `add .` (`proof-quiet-install-convention`, `-no-home-staging`) |
| 21 | harness-doctor refresh uses the path map | 12 | `templates/.agents/skills/harness-doctor/SKILL.md`, `test/harness-doctor-skill.test.ts` | `spawn` | sonnet | [ ] The refresh step in a quiet install compares and rewrites through the fixed map, as R1.3 requires; a text check in `harness-doctor-skill.test.ts` passes |
| 22 | Site guide, layout page and docs-root deferral | 12 | `site/install.md`, `site/layout.md`, `docs/deferrals/docs-root/docs-root-deferral.md` | `spawn` | opus | [ ] The uninstall guide keeps edited files and docs before removal. The layout page names the quiet install as the default and the full install by name. The deferral fixes the docs root at `<harnessHome>/docs/`. `pnpm docs:build` and validate exit 0 (`proof-quiet-install-uninstall-guide`, `-layout-page`, `-deferral`) |
| 23 | Copy rules pass | 11, 13, 16, 18, 19, 22 | `test/quiet-install-copy.test.ts` (new); edits limited to the strings checked, in the files units 04–05, 11, 13–19 and 22 own | `inline` | — | [ ] Every question that writes outside the home names its tracked change. No "the Human" or glossary term is left in text people read, and the introduction comes first. Every stop says "Nothing changed." when true and names the next step, including wave 1–2 messages (`proof-quiet-install-tracked-changes`, `-terms-first`, `-next-step`) |
| 24 | **Wave 3 gate** | 20, 21, 23 | `docs/specs/quiet-install/quiet-install-spec.md` (Wave 3 boxes) | `inline` | — | [ ] The five gates plus `pnpm docs:build` exit 0; Wave 3 boxes ticked — **abort before Wave 4** |
| 25 | Desktop worktree proof run | 24 | `docs/notes/quiet-install-proof/quiet-install-proof-note.md` (new) | `inline` | — | [ ] With the Human watching, a fixture made by the built setup and a harness-init run loads skills, `AGENTS.md`, rules and the guard in a desktop worktree. A home ADR stays untracked with no prompt, root `git status` is empty, and deleting `CLAUDE.local.md` shows the parity warning. Cursor and other runtimes are probed where at hand (`proof-quiet-install-worktree-run`, `-worktree-warning`) |
| 26 | **Ship gate** | 25 | `docs/specs/quiet-install/quiet-install-spec.md` (Wave 4 boxes) | `inline` | — | [ ] Every acceptance box ticked; the breaking-marker gate exits 0; `node dist/cli.js validate` PASS — hand off to `code-pr` only on the Human's ask |

Unit 23 is `inline` although its strings are copy. It edits strings
across files that eight earlier units own, so it must share the session
that can see all of them. The executing session should be opus.

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

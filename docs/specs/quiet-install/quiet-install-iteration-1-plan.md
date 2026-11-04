---
type: spec
title: Quiet install — iteration 1 plan
description: Work units that close the independent review of the quiet-install pull request in five waves, run by an Opus orchestrator with Sonnet implementers, with a finding-to-unit map and a closing report.
status: stable
---

# Quiet install — iteration 1 plan

**Spec:** `docs/specs/quiet-install/quiet-install-iteration-1-spec.md` (status
`stable`). The Human approved the spec and this plan on 2026-11-04, including
the spec's three defaults and the commit cadence.

## Structural gate

Every I row in the spec names one proof and has one acceptance box: 31 rows
(I1.1–I7.2) against 31 boxes. All nine dimension landings are present, and the
one `n/a` cites the unchanged `wiring.json` format.

## How this runs

- **Orchestrator:** one Opus session runs `inline` units, spawns the others,
  reads each result, and owns every wave gate. It never accepts a unit on the
  implementer's report alone: it reads the diff and reruns the proof.
- **Model column:** `sonnet` for every `spawn` unit, passed as `model: "sonnet"`
  on the Agent call. `—` for `inline` units.
- **Parallel spawns:** units with no dependency between them in one wave may run
  at once; their Owns lists do not overlap.
- **Skill mirrors:** every edit under `templates/.agents/skills/` is mirrored
  into `.agents/skills/` in the same unit, because `test/skill-copies.test.ts`
  fails on any difference. Owns lists the template path only.
- **Known forms:** `known-forms.json` is regenerated only at wave gates, with
  `pnpm gen:known-forms`, so parallel units never collide on it.
- **Commit cadence:** one commit per wave at its gate, through `code-commit`,
  as the base plan ran. Nothing is pushed until the Human asks.

## Work units

| # | Unit | Depends | Owns | Subagent | Model | Done when |
|---|------|---------|------|----------|-------|-----------|
| 01 | Smoke test both layouts | — | `.github/workflows/ci.yml` | `spawn` | sonnet | [ ] The smoke step, run by hand in a temp repo from a packed tarball, scores a quiet install with `pnpm exec harness-score`, and a second leg builds a full install by editing the config setup wrote: `proof-iter1-ci-smoke` (local half) |
| 02 | True root paths survive the map | — | `templates/.agents/skills/harness-init/references/layout.md`, `templates/.agents/skills/harness-doctor/SKILL.md`, `test/path-map.test.ts` | `spawn` | sonnet | [ ] Mapping the real `layout.md` and `harness-doctor/SKILL.md` leaves every true root path pointing at the root: `proof-iter1-root-paths` |
| 03 | Rules and the `.qmd` index install in their quiet form | — | `src/setup/apply.ts`, `src/setup/render-wolven.ts`, `src/doctor/drift.ts`, `test/doctor-drift.test.ts`, `test/quiet-install-qmd.test.ts` (new) | `spawn` | sonnet | [ ] A quiet install's rules name home paths, its `.qmd` collections resolve under `.wolven-harness/docs/` from the root, a client `docs/` is not indexed, and drift stays silent on both: `proof-iter1-rules-mapped`, `proof-iter1-qmd-paths` |
| 04 | Guard refusal wording | — | `templates/.agents/hooks/secret-path-guard.mjs`, its repo copy if one exists, `test/secret-path-guard.test.ts` | `spawn` | sonnet | [ ] A refused read prints the spec's **Guard refusal** row: `proof-iter1-guard-message` |
| 05 | Quiet known forms | 02, 03, 04 | `scripts/known-forms.mjs`, `test/doctor-drift.test.ts` | `spawn` | sonnet | [ ] A stale, unedited quiet file reports `doctor-drift-stale`, and a hand edit reports `doctor-drift-edited`: `proof-iter1-quiet-stale` |
| 06 | Wave 1 gate | 01–05 | `known-forms.json`, spec boxes, plan marks | `inline` | — | [ ] `pnpm gen:known-forms` is run, the full gate exits 0, the diffs are read, and the wave is committed |
| 07 | Doctor findings | 06 | `src/doctor/runtime-checks.ts`, `src/doctor/env-checks.ts`, `src/validate/report.ts`, `test/doctor-runtime.test.ts`, `test/doctor-env.test.ts` | `spawn` | sonnet | [ ] A fresh tree gives one line per runtime, Codex warns and clears, shared paths report once, and rendered findings carry the new voice with a next step: `proof-iter1-codex-warning`, `proof-iter1-fresh-tree`, `proof-iter1-doctor-voice` |
| 08 | Setup's quiet output | 06 | `src/setup/index.ts`, `src/setup/summary.ts`, `src/setup/options.ts`, `test/setup-quiet-output.test.ts` (new) | `spawn` | sonnet | [ ] A quiet run prints both hints, asks no package-manager question, and prints no literal backticks: `proof-iter1-quiet-hints`, `proof-iter1-no-pm-prompt`, `proof-iter1-terminal-text` |
| 09 | Rerun link and setup voice | 06 | `src/setup/runtimes.ts`, `test/runtime-registry.test.ts` | `spawn` | sonnet | [ ] A rerun counts its own link as wired, a foreign link stays occupied, and setup's strings say to ask your agent to run the `harness-init` skill: `proof-iter1-rerun-link` |
| 10 | Wave 2 gate | 07–09 | Spec boxes, plan marks | `inline` | — | [ ] The full gate exits 0, the diffs are read, and the wave is committed |
| 11 | Cut the switch; always track hooks | 10 | `templates/.agents/skills/harness-init/SKILL.md`, `references/layout.md`, `references/lean-path.md`, `templates/.wolven-harness/`, `src/setup/runtimes.ts`, `docs/deferrals/quiet-to-full-switch/quiet-to-full-switch-deferral.md` (new), `test/harness-init-layout.test.ts` | `spawn` | sonnet | [ ] harness-init has no layout question or switch, hooks are not a checkbox, `.worktreeinclude` lists the hooks folder, and a declined commit gets the guard warning: `proof-iter1-switch-cut` (skill half), `proof-iter1-hooks-tracked` |
| 12 | Audit, missing CLI and score file | 11 | `templates/.agents/skills/harness-init/SKILL.md`, `references/harness-score.md`, `references/lean-path.md`, `docs/deferrals/score-quiet/score-quiet-deferral.md` (new), `test/skill-harness-init.test.ts` | `spawn` | sonnet | [ ] The audit uses the spec's row and pinned command, a missing CLI stops with its row, and quiet scoring reads the home's config through `--config`: `proof-iter1-audit-wording`, `proof-iter1-missing-cli`, `proof-iter1-score-config` |
| 13 | Voice and one home per passage | 12 | `templates/.agents/skills/harness-init/SKILL.md`, `references/{layout,entry-modes,harness-score,lean-path,stub-template}.md` | `spawn` | sonnet | [ ] Each T2 passage has one home, by grep count, and the listed voice lines read as the spec says: `proof-iter1-init-voice`, `proof-iter1-one-home` |
| 14 | Refresh by delete and rerun | 10 | `templates/.agents/skills/harness-doctor/SKILL.md`, `test/doctor-drift.test.ts` | `spawn` | sonnet | [ ] Deleting a stale quiet file and rerunning setup restores its mapped bytes, and no skill text asks an agent to rewrite paths: `proof-iter1-refresh-rerun` |
| 15 | Parity warning | 10 | `templates/.agents/hooks/worktree-parity.mjs`, its repo copy if one exists, `test/worktree-parity.test.ts` | `spawn` | sonnet | [ ] The hook prints `systemMessage` JSON with the spec's row: `proof-iter1-parity-message` |
| 16 | Amend ADR-007 | 11, 12 | `docs/adrs/adr-007-quiet-install-contract.md`, `test/contract.test.ts` | `inline` | — | [ ] The `adr` skill lands each item in I5.2, and validate passes: `proof-iter1-adr` |
| 17 | Guides | 11, 12 | `README.md`, `AGENTS.md`, `site/commands.md`, `site/install.md`, `site/layout.md`, `test/full-install-route.test.ts` (new) | `spawn` | sonnet | [ ] B10's lines match the shipped default, `harness-misplaced` is listed, and a test runs the **Full install guide** steps and validates: `proof-iter1-guides`, `proof-iter1-switch-cut` (guide half) |
| 18 | Wave 3 gate | 13–17 | `known-forms.json`, spec boxes, plan marks | `inline` | — | [ ] `pnpm gen:known-forms` is run, the full gate exits 0, the diffs are read, and the wave is committed |
| 19 | One predicate and YAGNI cuts | 18 | `src/doctor/drift.ts`, `src/doctor/index.ts`, `src/setup/options.ts`, `src/setup/path-map.ts`, `src/setup/runtimes.ts`, `src/setup/apply.ts`, `src/validate/config.ts`, `templates/.agents/hooks/worktree-parity.mjs`, their tests | `spawn` | sonnet | [ ] One helper serves all four sites, and each I6.3 item is gone or its present caller is named in the unit's evidence: `proof-iter1-one-predicate`, `proof-iter1-yagni-cuts` |
| 20 | Re-check `harness-misplaced` | 18 | `src/validate/spine.ts`, `src/validate/report.ts`, `test/validate-quiet-install.test.ts` | `spawn` | sonnet | [ ] The check catches a named real case with the fewest reads, or it is removed with the reason recorded: `proof-iter1-misplaced` |
| 21 | Stale artifacts | 18 | The paths in I6.5 | `spawn` | sonnet | [ ] The listed files are gone, the three notes are `stable`, and validate passes: `proof-iter1-artifacts` |
| 22 | Trim prose-pinning tests | 19, 20 | `test/harness-init-layout.test.ts`, `test/skill-harness-init.test.ts`, `test/quiet-install-copy.test.ts` | `spawn` | sonnet | [ ] Through `test-sync`: order, option, gate and mapped-output checks stay, each kept wording row has at most one test, and the lines removed are in the evidence: `proof-iter1-test-trim` |
| 23 | Wave 4 gate | 19–22 | Spec boxes, plan marks | `inline` | — | [ ] The full gate exits 0, the diffs are read, and the wave is committed |
| 24 | Live worktree check | 23 | `docs/notes/quiet-install-proof/quiet-install-proof-note.md` | `inline` | — | [ ] STOP for the Human. Every check in I7.1 is observed in a fixture built from this head, `U-worktree-untracked-hooks` is answered, and the Human accepts the note: `proof-iter1-live-worktree` |
| 25 | Close the findings | 24 | This plan's closing table, spec boxes | `inline` | — | [ ] Every row below has an outcome and evidence: `proof-iter1-findings-closed`. STOP: `Package` and `CI` turn green only after a push, which waits for the Human's ask through `code-pr` |

## Wave stops

| Stop | After | Gate |
|------|-------|------|
| **1** | 06 | Full gate; wave 1 boxes |
| **2** | 10 | Full gate; wave 2 boxes |
| **3** | 18 | Full gate; wave 3 boxes |
| **4** | 23 | Full gate; wave 4 boxes |
| **5** | 25 | Human accepts the live check; every finding reported |

The full gate is `pnpm build && pnpm test && pnpm lint && pnpm comments && node
dist/cli.js validate && pnpm docs:build`.

## Finding → unit map and closing report

Unit 25 fills Outcome with `fixed`, `skipped` or `no_change_needed`, and Evidence
with a proof name, commit or reason.

| Finding | Units | Outcome | Evidence |
|---------|-------|---------|----------|
| B1 | 01, 25 | | |
| B2 | 02 | | |
| B3 | 03, 24 | | |
| B4 | 05 | | |
| B5 | 03, 04 | | |
| B6 | 07 | | |
| B7 | 08, 12 | | |
| B8 | 11, 24 | | |
| B9 | 07 | | |
| B10 | 17 | | |
| B11 | 11, 14 | | |
| C1 | 09 | | |
| C2 | 11 | | |
| C3 | 08 | | |
| V1 | 13 | | |
| V2 | 13 | | |
| V3 | 07 | | |
| V4 | 07, 09 | | |
| V5 | 07 | | |
| V6 | 12, 13 | | |
| V7 | 07 | | |
| V8 | 08 | | |
| V9 | 13 | | |
| V10 | 15 | | |
| V11 | 11 | | |
| T1 | 22 | | |
| T2 | 13 | | |
| T3 | 25 | | |
| Y1 | 19 | | |
| Y2 | 19 | | |
| Y3 | 20 | | |
| S1 | 21 | | |
| P1 | 04, 09, 12, 15 | | |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
|---|---|---|---|---|---|
| `U-sibling-verdict` | Drop the second Jury's sibling-folder verdict and its proposed deferrals? | Human | Non-blocking until closure | *(empty until decided)* | closure |
| `U-worktree-untracked-hooks` | Does `.worktreeinclude` copy an untracked, non-ignored hooks folder? | maintainer | Non-blocking | *(empty until decided)* | 24 |
| `U-cursor-ignored-rules` | Carried from the base spec | maintainer | Non-blocking | *(empty until decided)* | 24, if at hand |
| `U-runtimes-ignored-load` | Carried from the base spec | maintainer | Non-blocking | *(empty until decided)* | 24, if at hand |

## Frontier order

Start with 01, 02, 03 and 04 in parallel, then 05, then the gate at 06. Wave 2
runs 07, 08 and 09 in parallel. Wave 3 chains 11 → 12 → 13, because they share
harness-init's files, while 14 and 15 run beside them, and 16 and 17 follow 12.
Unit 11 owns `runtimes.ts` only once 09 has landed, which wave 2's gate ensures.
Wave 4 runs 19, 20 and 21 in parallel, then 22, because 19 removes code that
trimmed tests may touch. Wave 5 stays inline.

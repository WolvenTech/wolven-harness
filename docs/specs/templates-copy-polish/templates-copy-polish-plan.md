---
type: spec
title: Polish the copy PR #67's template trim left behind — plan
description: Ordered work units for the eleven copy-pair polishes, the Risk line render fix and the Human read-through, with spawned units run on Sonnet agents.
status: stable
---

# Polish the copy PR #67's template trim left behind — plan

**Spec:** `docs/specs/templates-copy-polish/templates-copy-polish-spec.md` (status `stable`)
**Baseline:** `b965ae9` (PR #67's head); **trim base:** `d7cb269`.
**Agents:** every `spawn` unit runs as a Sonnet subagent (`model: "sonnet"`),
briefed from `code-execute/references/builder-brief.md` plus the spec's
definitions of trim fallout, voice, neighbour and changed section.

## Structural gate

Every obligation R1.1–R6.1 names a proof with a command, a test, an
inspection of the batch diff, or (R5.1) the Human's explicit approval, and
`proof-templates-copy-polish-spec-obligations` holds: each acceptance box
pairs with one R row and one proof, all nine landings are present, and each
`n/a` cites an unchanged surface. No gap blocks slicing.

**Owns convention:** each path below is written once under `.agents/`; the
unit also owns its `templates/.agents/` twin and changes both together, so
R4.1 (`proof-templates-copy-polish-copies`) holds after every unit.

**Every spawned unit also must:** edit only sections that hold a hunk of
`git diff d7cb269 b965ae9` for its file (R2.3); keep pinned text and every
test untouched (R1.4); use the term its skill's `SKILL.md` already uses
(R2.4); and return a list of each polish hunk's heading, plus any idea it
restored with the sentence that pointed at it, and any spot where a pin
blocked a fix.

## Work units

The per-unit gate in a Done when is
`pnpm test && pnpm build && node dist/cli.js validate && pnpm comments && pnpm lint`,
run by the parent when the unit returns, plus `git diff --name-only` on the
unit's changes listing only its copy pair.

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 01 | Polish `qmd-first` | — | `.agents/rules/qmd-first.md` | `spawn` | [x] Item 2 reads as one sentence per rule and still states both rules (read the file before treating the indexed body as the decision; name neither number when index and file disagree) — `proof-templates-copy-polish-qmd-split`; "research for no effort" is gone — `-fragments`; `cmp` on the pair is clean — `-copies`; `-sections-only`, `-terms`, `-pins-held` hold; per-unit gate exit 0 |
| 02 | Polish the `code-commit` wave rule | — | `.agents/skills/code-commit/SKILL.md` | `spawn` | [x] The `### Wave batch` section reads in the skill's voice with every pinned phrase intact and `## Atomic commit gate` byte-identical — `-pins-held`; `-sections-only`, `-terms`, `-copies` hold; per-unit gate exit 0 |
| 03 | Neutral wave examples | — | `.agents/skills/code-commit/references/commit-examples.md` | `spawn` | [x] Both wave examples describe avatar-upload and name neither Wave A, the PR body nor the wave commit rule — `proof-templates-copy-polish-neutral-examples`; the pinned shape holds — `proof-templates-trim-wave-examples`; the Contents line matches the sections; `-sections-only`, `-copies` hold; per-unit gate exit 0 |
| 04 | Polish the builder brief | — | `.agents/skills/code-execute/references/builder-brief.md` | `spawn` | [x] Changed sections read as full sentences in the brief's voice, with every placeholder and pinned section intact — `-pins-held`; `-sections-only`, `-terms`, `-copies` hold; per-unit gate exit 0 |
| 05 | Polish the plan example | — | `.agents/skills/code-plan/references/EXAMPLE-units.md` | `spawn` | [x] The intro and clipped Done when cells read as full sentences; the Mega-unit example stays cut (`grep -c "Mega-unit"` is 0) — `-restore-scope`; row kinds `spawn`, `inline`, `STOP`, "empty until decided" and `(bad — re-slice)` still present; `-sections-only`, `-terms`, `-copies` hold; per-unit gate exit 0 |
| 06 | Polish the `code-pr` skill body | — | `.agents/skills/code-pr/SKILL.md` | `spawn` | [x] Pragmatic-guard names the one Pre-merge closure box in the singular (`grep -c "closure boxes"` is 0) — `proof-templates-copy-polish-counts`; gates 9, 10, 12 and the EXAMPLE read in the skill's voice; `-pins-held`, `-sections-only`, `-terms`, `-copies` hold; per-unit gate exit 0 |
| 07 | Polish the PR body template | — | `.agents/skills/code-pr/references/pr-body-template.md` | `spawn` | [x] The intro, caps paragraph and scenario examples read as full sentences in the skill's voice; the fenced body's pinned lines unchanged — `-pins-held`; `-sections-only`, `-terms`, `-copies` hold; the `**Risk:**` line is left for unit 12; per-unit gate exit 0 |
| 08 | Polish the spec example | — | `.agents/skills/code-spec/references/EXAMPLE.md` | `spawn` | [x] Every cited `R[0-9]+\.[0-9]+` is a table row ID or named in an elision line — `proof-templates-copy-polish-refs-resolve`; the `n/a` landings and Unresolved row kinds still present; `-pins-held`, `-sections-only`, `-terms`, `-copies` hold; per-unit gate exit 0 |
| 09 | Polish the spec template | — | `.agents/skills/code-spec/references/TEMPLATE.md` | `spawn` | [x] "a failed gate stops the next" and "tick only with evidence" are gone and their comments and cells read as full sentences — `-fragments`; every heading and all nine dimension rows stay — `-pins-held`; `-sections-only`, `-terms`, `-copies` hold; per-unit gate exit 0 |
| 10 | Polish the session-note template | — | `.agents/skills/harness-init/references/session-note-template.md` | `spawn` | [x] The prose after the fence says again what **Left for later** holds; the Anti-patterns section stays cut (`grep -c "## Anti-patterns"` is 0) — `-restore-scope`; the fenced note diffs empty against `b965ae9` — `-pins-held`; `-sections-only`, `-terms`, `-copies` hold; per-unit gate exit 0 |
| 11 | Polish the stub template | — | `.agents/skills/harness-init/references/stub-template.md` | `spawn` | [x] The "Either way" paragraph and the warning paragraph read clearly in the file's voice, with no text a `harness-init-stub` test matches changed — `-pins-held`; `-sections-only`, `-terms`, `-copies` hold; per-unit gate exit 0 |
| 12 | Risk line render fix | 07 | `.agents/skills/code-pr/references/pr-body-template.md` | `inline` | [x] A blank line sits before `**Risk:**` in the fenced body and no other line moves — `proof-templates-copy-polish-risk-line`; `proof-templates-trim-pr-caps` passes unchanged; `-copies` holds; per-unit gate exit 0 |
| 13 | **Wave 1 gate** | 01–12 | — | `inline` | [x] Every wave 1 acceptance box in the spec PASS; `git diff --name-only b965ae9` lists only the eleven copy pairs and this initiative's PRD, spec and plan, nothing under `test/` or `src/`; `pnpm test` and `node dist/cli.js validate` PASS on the combined tree; failure → **abort before wave 2** |
| 14 | **Wave 2 gate — Human read-through** | 13 | — | `inline` | [ ] The Human reads `git diff b965ae9` for the eleven pairs, with each unit's hunk headings, restored ideas and pin-blocked spots listed beside it, and explicitly approves — `proof-templates-copy-polish-read-through`; changes asked → back to the named unit, then units 13 and 14 again |

## Wave stops

| Stop | After | Gate |
|------|-------|------|
| **1** | 13 | Every wave 1 proof PASS, the scope check is clean, and the repo gates pass on the combined tree — **abort before wave 2** |
| **Ship** | 14 | The Human's explicit approval of the read-through; `harness:validate` PASS — then hand back so `code-pr` amends PR #67 |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
|---|---|---|---|---|---|
| `U-risk-line-render` | Fix the `**Risk:**` render in this round? | Human (maintainer) | Non-blocking | Resolved: yes, as the last wave 1 change (carried from the spec) | 12 |
| `U-pr-amend` | Do PR #67's title and body change once the polish lands? | Human (maintainer) | Non-blocking: belongs to `code-pr` | Resolved: yes, `code-pr` amends after wave 2 (carried from the spec) | — |

## Frontier order

**Wave 1:** (01 ∥ 02 ∥ 03 ∥ 04 ∥ 05 ∥ 06 ∥ 07 ∥ 08 ∥ 09 ∥ 10 ∥ 11) → 12 → **13 STOP**

**Wave 2:** **14 STOP** (Human)

Units 01–11 own disjoint copy pairs, so all eleven may spawn at once. The
parent runs each unit's gate as it returns, one at a time, so a red gate is
traced to one pair and that pair alone is reverted. Unit 12 waits for 07
because both own `pr-body-template.md`. Amending PR #67 is a separate ask to
`code-pr` after unit 14.

## Execution / resume section

Spec/plan paths for every unit:
`docs/specs/templates-copy-polish/templates-copy-polish-spec.md` /
`docs/specs/templates-copy-polish/templates-copy-polish-plan.md`. Resolved
opt: `autocommit: false`, `autocommit-rule: wave` (defaults; no
`.agents/code-commit.config.yml`), so no commit follows and no Done-when
mark flips.

### Wave 1 — units 01–11 (spawned in parallel)

| Unit identifier | Obligation / proof status | `HEAD` commit | `git status` summary | Intended diff scope | Decision on every discrepancy |
|---|---|---|---|---|---|
| 01 — Polish `qmd-first` | R2.1, R2.2, R2.3, R2.4, R1.4, R4.1 — pass | `b965ae9` | dirty — only this initiative's untracked PRD, spec and plan, outside every unit's Owns | `.agents/rules/qmd-first.md` + `templates/` twin | none |
| 02 — Polish the `code-commit` wave rule | R1.4, R2.3, R2.4, R4.1 — pass | `b965ae9` | as 01 | `.agents/skills/code-commit/SKILL.md` + twin | no change needed; `Common types` line now under `### Wave batch` flagged for the read-through (outside changed-section scope) |
| 03 — Neutral wave examples | R3.1, R3.2, R2.3, R4.1 — pass | `b965ae9` | as 01 | `.agents/skills/code-commit/references/commit-examples.md` + twin | none |
| 04 — Polish the builder brief | R1.4, R2.3, R2.4, R4.1 — pass | `b965ae9` | as 01 | `.agents/skills/code-execute/references/builder-brief.md` + twin | no change needed: the changed sections already read in voice (unit report) |
| 05 — Polish the plan example | R1.3, R2.3, R2.4, R4.1 — pass | `b965ae9` | as 01 | `.agents/skills/code-plan/references/EXAMPLE-units.md` + twin | none |
| 06 — Polish the `code-pr` skill body | R1.2, R1.4, R2.3, R2.4, R4.1 — pass | `b965ae9` | as 01 | `.agents/skills/code-pr/SKILL.md` + twin | none |
| 07 — Polish the PR body template | R1.4, R2.3, R2.4, R4.1 — pass | `b965ae9` | as 01 | `.agents/skills/code-pr/references/pr-body-template.md` + twin | none |
| 08 — Polish the spec example | R1.1, R1.4, R2.3, R2.4, R4.1 — pass | `b965ae9` | as 01 | `.agents/skills/code-spec/references/EXAMPLE.md` + twin | none |
| 09 — Polish the spec template | R2.1, R1.4, R2.3, R2.4, R4.1 — pass | `b965ae9` | as 01 | `.agents/skills/code-spec/references/TEMPLATE.md` + twin | none |
| 10 — Polish the session-note template | R1.3, R1.4, R2.3, R2.4, R4.1 — pass | `b965ae9` | as 01 | `.agents/skills/harness-init/references/session-note-template.md` + twin | none |
| 11 — Polish the stub template | R1.4, R2.3, R2.4, R4.1 — pass | `b965ae9` | as 01 | `.agents/skills/harness-init/references/stub-template.md` + twin | none |
| 12 — Risk line render fix | R6.1, R4.1 — pass | `b965ae9` | dirty — units 01–11's copy pairs, this unit's file already polished by 07 | `.agents/skills/code-pr/references/pr-body-template.md` + twin | none |
| 13 — Wave 1 gate | all wave 1 proofs — pass (`pnpm test` 810/810, build, validate, comments, lint exit 0; scope: nine changed copy pairs plus this initiative's docs, nothing under `test/` or `src/`) | `b965ae9` | dirty — the nine polished copy pairs and this initiative's docs | — | none |
| 14 — Human read-through | R5.1 — pending | `b965ae9` | as 13 | — | awaiting the Human |

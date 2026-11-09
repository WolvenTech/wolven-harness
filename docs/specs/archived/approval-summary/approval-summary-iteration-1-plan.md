---
type: spec
title: Approval summaries and execution checkpoints, review fix iteration 1
description: Moves the Human-gate rule into the shared approval summary and closes three smaller gaps found in the PR review, under obligations the spec already names.
status: deprecated
---

# Approval summaries and execution checkpoints, review fix iteration 1: plan

**Source** — [Approval summaries and execution checkpoints](approval-summary-spec.md), approved before archival, and the [PR #101 review](https://github.com/WolvenTech/wolven-harness/pull/101#pullrequestreview-5807697463) of `199db3b`.

**Human gate** — The Human approves this plan and gives a separate go-ahead before any unit starts.

## Structural gate

No finding adds an obligation, so this iteration has no spec. Each one closes a gap against text the locked spec or PRD already holds, and each maps to an existing named proof:

- **F1** — R1.3 and AC-1.3 already apply the Human-gate rule to all three skills. `proof-approval-summary-human-gate` passes on the wrong placement because it flattens the file, so unit 01 scopes it to the shared section.
- **F2** — AC-1.1 already requires the wave on each unit row. R1.1's field list omits it but does not exclude it, so adding it satisfies both.
- **F3** — R4.6 already names the Portuguese headings and their chat-language equivalents.
- **F4** — R6.1 already requires Task links that resolve at a revision.

## Finding → unit map

| Finding | Source | Severity | Unit |
| --- | --- | --- | --- |
| F1: the Human-gate rule sits under `## Plan`, so PRD and spec summaries don't pick it up. | Review, `code-spec/references/approval-summary.md:35` | Blocking | 01 |
| F2: unit rows omit the wave that AC-1.1 asks for. | Review, `code-spec/references/approval-summary.md:32` | Nit | 01 |
| F3: the checkpoint table headings are fixed in English, and the skill never mentions the chat language. | Review, `code-execute/SKILL.md:145` | Nit | 02 |
| F4: the docs-only scenario says Task points at a path, which contradicts the new link rule. | Review, `code-pr/references/pr-body-template.md:77` | Nit | 03 |

## Work units

All units are in one wave. In Owns, a path prefixed by `{.,templates}/.agents/skills/` means the equivalent paths in the repo and shipped skill trees.

| # | Unit | Depends | Owns | Subagent | Done when |
| --- | --- | --- | --- | --- | --- |
| 01 | Every approval summary carries the Human-gate rule and the unit wave | — | `{.,templates}/.agents/skills/{code-spec,create-prd}/references/approval-summary.md`; `test/skill-copies.test.ts` | `inline` | [x] The rule that states who decides, what they decide and what waits sits before `## PRD`, so it applies to PRD, spec and plan summaries. `## Plan` keeps only the automatic checks and stop conditions. Unit rows name the wave. `proof-approval-summary-human-gate` is its own test, scoped to the text before `## PRD`, and it fails on the `199db3b` reference before the move. `proof-approval-summary-format` asserts the wave. All four copies stay byte-identical, and **Approval contracts** pass. |
| 02 | Checkpoint headings follow the chat language | — | `{.,templates}/.agents/skills/code-execute/SKILL.md`; `test/skill-code-execute.test.ts` | `inline` | [x] The checkpoint instruction tells the agent to use equivalent headings in the chat language and names `Unidade / Quem executa / Estado / Última atividade ou resultado` for Portuguese. `proof-execution-chat-checkpoint` asserts both in both copies, and **Execution contracts** pass. |
| 03 | The docs-only scenario links Task at a revision | — | `{.,templates}/.agents/skills/code-pr/references/pr-body-template.md`; `test/skill-code-pr.test.ts` | `inline` | [x] The scenario tells the author to link the relevant spec or plan at a revision, matching the rule at the top of the template. `proof-pr-body-artifact-context` fails if `Task points at` returns, and **PR contracts** pass. |
| 04 | Preserve template recognition on upgrade | 01, 02, 03 | `known-forms.json` | `inline` | [x] `pnpm gen:known-forms` records the changed forms and keeps every prior entry, including the unreleased `199db3b` forms, because the table only grows. **Template fingerprints** pass. |
| 05 | **Iteration gate and finding report** | 04 | — | `inline` | [x] All suites below, `pnpm build`, `pnpm lint`, `pnpm validate` and `pnpm comments` exit 0. F1–F4 are each re-reported as `fixed`, `skipped` or `no_change_needed`, with evidence, in this plan. A failure stops closeout. |

### Verification commands

| Suite | Command |
| --- | --- |
| Approval contracts | `pnpm exec tsx --test test/skill-create-prd.test.ts test/skill-code-spec.test.ts test/skill-code-plan.test.ts test/skill-copies.test.ts test/skills-command.test.ts` |
| Execution contracts | `pnpm exec tsx --test test/skill-code-execute.test.ts` |
| PR contracts | `pnpm exec tsx --test test/skill-code-pr.test.ts` |
| Template fingerprints | `pnpm exec tsx --test test/known-forms.test.ts test/doctor-drift.test.ts` |

## Wave stops

| Stop | After | Gate |
| --- | --- | --- |
| **Ship** | 05 | The full gate set passes and F1–F4 are re-reported. Stop on any failure. Apply the resolved commit cadence after PASS. |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
| --- | --- | --- | --- | --- | --- |
| None | Each finding names its fix, and the spec or PRD already fixes the required behavior. | — | Non-blocking | — | — |

## Frontier order

**Wave 1** — `(01 ∥ 02 ∥ 03) → 04 → 05 STOP`.

Units 01–03 have no dependency between them, and all are `inline`, so they run in order in one session. Execution runs on `codex/issue-81-approval-summary`. Amending the PR and pre-merge closure are separate asks after the gate.

## Execution / resume section

### Unit 01 — Every approval summary carries the Human-gate rule and the unit wave

| Field | Value |
| --- | --- |
| Unit identifier | 01 — Every approval summary carries the Human-gate rule and the unit wave (Wave 1) |
| Spec/plan paths | `docs/specs/archived/approval-summary/approval-summary-spec.md` / `docs/specs/archived/approval-summary/approval-summary-iteration-1-plan.md` |
| Obligation / proof status | F1–F2, R1.3 and AC-1.1 — done. Scoped proof failed on the unchanged 199db3b reference before the move and passed afterward. All 62 approval tests passed, and the four copies matched byte for byte. |
| HEAD commit | `199db3b` |
| Git status summary | Dirty — `docs/specs/approval-summary/approval-summary-iteration-1-plan.md`. |
| Intended diff scope | `{.,templates}/.agents/skills/{code-spec,create-prd}/references/approval-summary.md`; `test/skill-copies.test.ts` |
| Decision on every discrepancy | The untracked iteration plan is the released input. Prior unit edits belong to this iteration. Only this unit's Owns and the plan's execution record are writable. |

### Unit 02 — Checkpoint headings follow the chat language

| Field | Value |
| --- | --- |
| Unit identifier | 02 — Checkpoint headings follow the chat language (Wave 1) |
| Spec/plan paths | `docs/specs/archived/approval-summary/approval-summary-spec.md` / `docs/specs/archived/approval-summary/approval-summary-iteration-1-plan.md` |
| Obligation / proof status | F3, R4.6 — done. The checkpoint proof verifies chat-language headings and the Portuguese labels in both copies. All 25 execution tests passed. |
| HEAD commit | `199db3b` |
| Git status summary | Dirty — `.agents/skills/code-spec/references/approval-summary.md`, `.agents/skills/create-prd/references/approval-summary.md`, `templates/.agents/skills/code-spec/references/approval-summary.md`, `templates/.agents/skills/create-prd/references/approval-summary.md`, `test/skill-copies.test.ts`, `docs/specs/approval-summary/approval-summary-iteration-1-plan.md`. |
| Intended diff scope | `{.,templates}/.agents/skills/code-execute/SKILL.md`; `test/skill-code-execute.test.ts` |
| Decision on every discrepancy | The untracked iteration plan is the released input. Prior unit edits belong to this iteration. Only this unit's Owns and the plan's execution record are writable. |

### Unit 03 — The docs-only scenario links Task at a revision

| Field | Value |
| --- | --- |
| Unit identifier | 03 — The docs-only scenario links Task at a revision (Wave 1) |
| Spec/plan paths | `docs/specs/archived/approval-summary/approval-summary-spec.md` / `docs/specs/archived/approval-summary/approval-summary-iteration-1-plan.md` |
| Obligation / proof status | F4, R6.1 — done. The docs-only scenario requires a link at a revision and the proof rejects the old wording. All 26 PR contract tests passed. |
| HEAD commit | `199db3b` |
| Git status summary | Dirty — `.agents/skills/code-execute/SKILL.md`, `.agents/skills/code-spec/references/approval-summary.md`, `.agents/skills/create-prd/references/approval-summary.md`, `templates/.agents/skills/code-execute/SKILL.md`, `templates/.agents/skills/code-spec/references/approval-summary.md`, `templates/.agents/skills/create-prd/references/approval-summary.md`, `test/skill-code-execute.test.ts`, `test/skill-copies.test.ts`, `docs/specs/approval-summary/approval-summary-iteration-1-plan.md`. |
| Intended diff scope | `{.,templates}/.agents/skills/code-pr/references/pr-body-template.md`; `test/skill-code-pr.test.ts` |
| Decision on every discrepancy | The untracked iteration plan is the released input. Prior unit edits belong to this iteration. Only this unit's Owns and the plan's execution record are writable. |

### Unit 04 — Preserve template recognition on upgrade

| Field | Value |
| --- | --- |
| Unit identifier | 04 — Preserve template recognition on upgrade (Wave 1) |
| Spec/plan paths | `docs/specs/archived/approval-summary/approval-summary-spec.md` / `docs/specs/archived/approval-summary/approval-summary-iteration-1-plan.md` |
| Obligation / proof status | Template fingerprints — done. Regeneration retained all 322 entries from 199db3b, and all 17 fingerprint and doctor-drift tests passed. |
| HEAD commit | `199db3b` |
| Git status summary | Dirty — `.agents/skills/code-execute/SKILL.md`, `.agents/skills/code-pr/references/pr-body-template.md`, `.agents/skills/code-spec/references/approval-summary.md`, `.agents/skills/create-prd/references/approval-summary.md`, `templates/.agents/skills/code-execute/SKILL.md`, `templates/.agents/skills/code-pr/references/pr-body-template.md`, `templates/.agents/skills/code-spec/references/approval-summary.md`, `templates/.agents/skills/create-prd/references/approval-summary.md`, `test/skill-code-execute.test.ts`, `test/skill-code-pr.test.ts`, `test/skill-copies.test.ts`, `docs/specs/approval-summary/approval-summary-iteration-1-plan.md`. |
| Intended diff scope | `known-forms.json` |
| Decision on every discrepancy | The untracked iteration plan is the released input. Prior unit edits belong to this iteration. Only this unit's Owns and the plan's execution record are writable. |

### Unit 05 — **Iteration gate and finding report**

| Field | Value |
| --- | --- |
| Unit identifier | 05 — **Iteration gate and finding report** (Wave 1) |
| Spec/plan paths | `docs/specs/archived/approval-summary/approval-summary-spec.md` / `docs/specs/archived/approval-summary/approval-summary-iteration-1-plan.md` |
| Obligation / proof status | All suites and F1–F4 re-report — done. The full suite passed 1,175 tests. Build, lint, validate, comments, and the diff whitespace check passed. |
| HEAD commit | `199db3b` |
| Git status summary | Dirty — `.agents/skills/code-execute/SKILL.md`, `.agents/skills/code-pr/references/pr-body-template.md`, `.agents/skills/code-spec/references/approval-summary.md`, `.agents/skills/create-prd/references/approval-summary.md`, `known-forms.json`, `templates/.agents/skills/code-execute/SKILL.md`, `templates/.agents/skills/code-pr/references/pr-body-template.md`, `templates/.agents/skills/code-spec/references/approval-summary.md`, `templates/.agents/skills/create-prd/references/approval-summary.md`, `test/skill-code-execute.test.ts`, `test/skill-code-pr.test.ts`, `test/skill-copies.test.ts`, `docs/specs/approval-summary/approval-summary-iteration-1-plan.md`. |
| Intended diff scope | — |
| Decision on every discrepancy | The untracked iteration plan is the released input. Prior unit edits belong to this iteration. Only this unit's Owns and the plan's execution record are writable. |

## Finding re-report

| Finding | Disposition | Evidence |
| --- | --- | --- |
| F1 | `fixed` | `proof-approval-summary-human-gate` failed against the unchanged `199db3b` reference before the move, then passed. The rule is shared above `## PRD`, and the plan section retains the automatic gate checks. All four copies match. |
| F2 | `fixed` | `proof-approval-summary-format` passed with the wave required in each displayed unit row. |
| F3 | `fixed` | `proof-execution-chat-checkpoint` passed in both copies with chat-language headings and the four Portuguese labels. |
| F4 | `fixed` | `proof-pr-body-artifact-context` passed with a revision link required for Task in the docs-only scenario and with the old wording rejected. |

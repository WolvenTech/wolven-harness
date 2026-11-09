---
type: spec
title: Approval summaries and execution checkpoints plan
description: Order the work for shared approval summaries, execution checkpoints, review closeout, and the pull request body.
status: deprecated
---

# Approval summaries and execution checkpoints — plan

**Source** — [Approval summaries and execution checkpoints](approval-summary-spec.md), approved before archival.

**Human gate** — The plan is stable. The Human gives a separate go-ahead before any implementation unit starts.

## Structural gate

`proof-approval-summary-spec-obligations` passed against the locked spec. Its 18 obligations have distinct proofs and matching acceptance boxes, and all nine dimensions have a landing. The spec has no unresolved rows and defines one mutate batch.

## Work units

All units are in Wave 1. In Owns, a path prefixed by `{.,templates}/.agents/skills/` means the equivalent paths in the repo and shipped skill trees.

| # | Unit | Depends | Owns | Subagent | Done when |
| --- | --- | --- | --- | --- | --- |
| 01 | Present artifact approval summaries | — | `{.,templates}/.agents/skills/{create-prd,code-spec,code-plan}/SKILL.md`; `{.,templates}/.agents/skills/{create-prd,code-spec}/references/approval-summary.md`; `test/helpers/skill-contract.ts`, `test/skill-{create-prd,code-spec,code-plan,copies}.test.ts`, `test/skills-command.test.ts` | `spawn` | [x] All three workflows link the real artifact and use the shared format at first draft and material revision. The plan shows gates, dividers and the approved unit cutoff. The standalone PRD reference resolves, and missing workflow instructions or reference drift identify the affected copy. R1.1–R3.2 pass in **Approval contracts**. |
| 02 | Report execution progress and checkpoints | — | `{.,templates}/.agents/skills/code-execute/SKILL.md`; `test/skill-code-execute.test.ts` | `spawn` | [x] The skill uses the available Claude, Cursor or Codex tracker according to R4.2, with chat fallback. At each checkpoint, chat shows the relevant wave, units, actual executor, state, result and next action or Human decision. R4.1–R4.6 pass in **Execution contracts**, including the three runtime rules and the Codex limit on active checklist entries. |
| 03 | Summarize review closeout in chat | — | `{.,templates}/.agents/skills/code-review/SKILL.md`; `test/skill-code-review.test.ts` | `inline` | [x] The closeout links the PR and shows its verdict, blocking findings, “Ajustes menores” or “Non-blockers”, and next action. Empty categories and material verification gaps stay visible. R5.1–R5.2 pass in **Review contracts**. |
| 04 | Format and link the PR body | — | `{.,templates}/.agents/skills/code-pr/SKILL.md`, `{.,templates}/.agents/skills/code-pr/references/pr-body-template.md`; `test/skill-code-pr.test.ts` | `spawn` | [x] The body carries relevant artifact links and decisions in the existing fields. Before merge is last and its nested Manual test heading has one checkbox per scenario. The template and filled example render the same structure. R6.1–R6.3 pass in **PR contracts**. |
| 05 | Preserve template recognition on upgrade | 01, 02, 03, 04 | `known-forms.json` | `inline` | [x] `pnpm gen:known-forms` records the changed and new template forms while retaining previous entries. The existing **Template fingerprints** tests pass. This completes the packaging part of R3.1. |
| 06 | **Wave 1 and final gate** | 01, 02, 03, 04, 05 | — | `inline` | [x] All contract checks and the spec's scenario review pass against the integrated wave. Repository build, lint, validation and comments pass. A failure stops closeout. |

Unit 01 covers the reference and the standalone install check for R3.1. Unit 05 covers the final generated fingerprints after the template paths settle.

For unit 02, use [the runtime research](../../../notes/native-progress-tools/native-progress-tools-note.md) as implementation context for the locked R4.2 rules. The contract checks exercise the written instructions. The scenario review checks how they apply across the supported runtimes.

### Verification commands

Run the named suite for each unit and re-run all suites at the final gate.

| Suite | Command |
| --- | --- |
| Approval contracts | `pnpm exec tsx --test test/skill-create-prd.test.ts test/skill-code-spec.test.ts test/skill-code-plan.test.ts test/skill-copies.test.ts test/skills-command.test.ts` |
| Execution contracts | `pnpm exec tsx --test test/skill-code-execute.test.ts` |
| Review contracts | `pnpm exec tsx --test test/skill-code-review.test.ts` |
| PR contracts | `pnpm exec tsx --test test/skill-code-pr.test.ts` |
| Template fingerprints | `pnpm exec tsx --test test/known-forms.test.ts test/doctor-drift.test.ts` |
| Repository integrity | `pnpm build`, `pnpm lint`, `pnpm validate`, `pnpm comments` |

At the gate, run the spec's Acceptance scenario review, including the nine-versus-ten-unit plan boundary, parallel units with one active Codex tracker item, an absent or failed tracker, a blocked Human gate, a review with no minor adjustments, and a rendered PR body with and without artifact links.

## Wave stops

| Stop | After | Gate |
| --- | --- | --- |
| **Wave 1 and final handoff** | Unit 06 | All contract checks, scenario review and repository integrity pass. Stop on any failure. Apply the resolved commit cadence after PASS. |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
| --- | --- | --- | --- | --- | --- |

## Frontier order

**Wave 1** — `(01 ∥ 02 ∥ 03 ∥ 04) → 05 → 06 STOP`.

Units 01–04 are independently ready after the Human go-ahead. Run them in parallel only when their owned paths can be isolated. Use GPT-6.1 Terra with high reasoning effort for units 01, 02, and 04, as requested for this run. Unit 03 runs inline. The shared contract helper is owned by unit 01 and must be rechecked at the integrated gate. Unit 05 regenerates the single shared table from the combined templates. Unit 06 runs in the parent session against the combined diff.

## Execution / resume section

### Unit 01 — Present artifact approval summaries

| Field | Value |
| --- | --- |
| Unit identifier | 01 — Present artifact approval summaries (Wave 1 frontier) |
| Spec/plan paths | `docs/specs/archived/approval-summary/approval-summary-spec.md` / `docs/specs/archived/approval-summary/approval-summary-plan.md` |
| Obligation / proof status | R1.1–R3.2 — done. 61 approval contract tests passed. |
| `HEAD` commit | `7275eef` |
| `git status` summary | Dirty — untracked PRD, spec, plan, and runtime research note. No implementation edits. |
| Intended diff scope | `{.,templates}/.agents/skills/{create-prd,code-spec,code-plan}/SKILL.md`; `{.,templates}/.agents/skills/{create-prd,code-spec}/references/approval-summary.md`; `test/helpers/skill-contract.ts`, `test/skill-{create-prd,code-spec,code-plan,copies}.test.ts`, `test/skills-command.test.ts` |
| Decision on every discrepancy | The four documents belong to this initiative. The Human invoked code-execute and released dispatch. The parent owns documentation and resume updates. Parallel writes stay within each unit's distinct Owns. |

### Unit 02 — Report execution progress and checkpoints

| Field | Value |
| --- | --- |
| Unit identifier | 02 — Report execution progress and checkpoints (Wave 1 frontier) |
| Spec/plan paths | `docs/specs/archived/approval-summary/approval-summary-spec.md` / `docs/specs/archived/approval-summary/approval-summary-plan.md` |
| Obligation / proof status | R4.1–R4.6 — done. 25 execution contract tests passed. |
| `HEAD` commit | `7275eef` |
| `git status` summary | Dirty — untracked PRD, spec, plan, and runtime research note. No implementation edits. |
| Intended diff scope | `{.,templates}/.agents/skills/code-execute/SKILL.md`; `test/skill-code-execute.test.ts` |
| Decision on every discrepancy | The four documents belong to this initiative. The Human invoked code-execute and released dispatch. The parent owns documentation and resume updates. Parallel writes stay within each unit's distinct Owns. |

### Unit 03 — Summarize review closeout in chat

| Field | Value |
| --- | --- |
| Unit identifier | 03 — Summarize review closeout in chat (Wave 1 frontier) |
| Spec/plan paths | `docs/specs/archived/approval-summary/approval-summary-spec.md` / `docs/specs/archived/approval-summary/approval-summary-plan.md` |
| Obligation / proof status | R5.1–R5.2 — done. Both named proofs passed in the 15-test review suite. |
| `HEAD` commit | `7275eef` |
| `git status` summary | Dirty — untracked PRD, spec, plan, and runtime research note. No implementation edits. |
| Intended diff scope | `{.,templates}/.agents/skills/code-review/SKILL.md`; `test/skill-code-review.test.ts` |
| Decision on every discrepancy | The four documents belong to this initiative. The Human invoked code-execute and released dispatch. The parent owns documentation and resume updates. Parallel writes stay within each unit's distinct Owns. |

### Unit 04 — Format and link the PR body

| Field | Value |
| --- | --- |
| Unit identifier | 04 — Format and link the PR body (Wave 1 frontier) |
| Spec/plan paths | `docs/specs/archived/approval-summary/approval-summary-spec.md` / `docs/specs/archived/approval-summary/approval-summary-plan.md` |
| Obligation / proof status | R6.1–R6.3 — done. 26 PR contract tests passed after verifying the linked PRD at the pinned revision. |
| `HEAD` commit | `7275eef` |
| `git status` summary | Dirty — untracked PRD, spec, plan, and runtime research note. No implementation edits. |
| Intended diff scope | `{.,templates}/.agents/skills/code-pr/SKILL.md`, `{.,templates}/.agents/skills/code-pr/references/pr-body-template.md`; `test/skill-code-pr.test.ts` |
| Decision on every discrepancy | The four documents belong to this initiative. The Human invoked code-execute and released dispatch. The parent owns documentation and resume updates. Parallel writes stay within each unit's distinct Owns. |

### Unit 05 — Preserve template recognition on upgrade

| Field | Value |
| --- | --- |
| Unit identifier | 05 — Preserve template recognition on upgrade (Wave 1 frontier) |
| Spec/plan paths | `docs/specs/archived/approval-summary/approval-summary-spec.md` / `docs/specs/archived/approval-summary/approval-summary-plan.md` |
| Obligation / proof status | R3.1 template fingerprints — done. All 17 known-forms and doctor-drift tests passed, and all previous fingerprints were preserved. |
| `HEAD` commit | `7275eef` |
| `git status` summary | Dirty — four initiative documents and validated unit 01–04 edits. No existing `known-forms.json` edits. |
| Intended diff scope | `known-forms.json` |
| Decision on every discrepancy | Unit 01–04 edits are the settled inputs for regeneration. Unit 05 writes only the generated table. |

### Unit 06 — Wave 1 and final gate

| Field | Value |
| --- | --- |
| Unit identifier | 06 — Wave 1 and final gate (Wave 1 frontier) |
| Spec/plan paths | `docs/specs/archived/approval-summary/approval-summary-spec.md` / `docs/specs/archived/approval-summary/approval-summary-plan.md` |
| Obligation / proof status | Wave 1 integrated checks and scenario review — done. All 1,174 tests passed, plus build, lint, validate and comments. PR Markdown rendered with and without Task. |
| `HEAD` commit | `7275eef` |
| `git status` summary | Dirty — four initiative documents, six skill updates and tests, and generated template fingerprints. |
| Intended diff scope | No feature edits. Verify the combined wave and record its result in this plan. |
| Decision on every discrepancy | All feature edits match units 01–05. The parent owns the integrated validation and wave commit. |

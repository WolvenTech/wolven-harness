---
type: spec
title: Install ship and discovery skills without the harness — iteration 1 plan
description: Ordered work units that fix the four code-review nits on PR 33 at bfa454b; the code-review handoff names an absent planning skill and runs before the verdict, and an unknown skill name gets its own diagnostic.
status: stable
source_spec: docs/specs/archived/skills-command/skills-command-iteration-1-spec.md
source_pr: https://github.com/WolvenTech/wolven-harness/pull/33
---

# Install ship and discovery skills without the harness — iteration 1 plan

**Input:** `skills-command-iteration-1-spec.md` in this folder (status
`stable`), which holds the delta obligations R7.1 and R8.1 from the code
review of PR 33 at `bfa454b`.
**Next:** after the Human approves this plan → `code-execute`. Pushing to
PR 33 and refreshing its body are a separate `code-pr` ask.

## Structural gate

Both delta obligations map to a named proof:

| Obligation | Named proof | Kind |
|---|---|---|
| R7.1 | `proof-skills-command-handoff-absent` | New `pnpm test` case in `test/skill-code-review.test.ts` |
| R8.1 | `proof-skills-command-unknown-skill` | New `pnpm test` case in `test/skills-command.test.ts` |

F2 adds no obligation. It reorders two existing steps, and the Done when for
unit 01 checks the new order. F4 is not repository work.

## Work units

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 01 | The review-fix handoff names an absent planning skill and runs before the verdict | — | `templates/.agents/skills/code-review/SKILL.md` and `.agents/skills/code-review/SKILL.md` (**Findings** list and **Hard gates** only), `test/skill-code-review.test.ts` | `spawn` | [x] In both copies, **Findings** step 4 is the **Review-fix handoff** and step 5 is the verdict step ("End with one verdict …"). The handoff step adds a sentence: when `code-spec` or `code-plan` is absent from the session skill list, name it and the next free N, do not draft the iteration spec or plan or copy that skill's procedure, and name no install command. **Hard gates** gains a matching **Missing `code-spec` / `code-plan`** gate. The two copies are byte-identical. Proof: `proof-skills-command-handoff-absent` passes; it matches the absent-skill sentence and checks that the handoff step comes before the verdict step. `test/skill-copies.test.ts` and the existing `skill-code-review` tests pass |
| 02 | An unknown skill name gets its own diagnostic | — | `src/skills/parse.ts` (`expandSkills` and its JSDoc, and the `resolveSkills` JSDoc), `test/skills-command.test.ts` | `spawn` | [x] `--skills code-reviw` and `--skills create-prd,code-reviw`, run non-TTY against an empty temp dir, each exit 1 and leave the dir empty. Their stderr names `code-reviw` and `setup` and does not contain `code-reviw is installed by setup`; the suggested wording is `code-reviw is not a ship or discovery skill; core skills are installed by setup`. `--skills adr` still prints `adr is installed by setup`. Proof: `proof-skills-command-unknown-skill` passes, and `proof-skills-command-core-flag` still passes |
| 03 | **Ship gate** | 01, 02 | `skills-command-iteration-1-spec.md` (Acceptance boxes), this plan (unit boxes, status, resume section) | `inline` | [x] `pnpm test`, `pnpm lint`, `pnpm build`, `pnpm validate` and `node dist/cli.js comments` exit 0, with 0 comment findings. The spec's two Acceptance boxes are ticked against those runs. F1–F4 are re-reported with one outcome each (`fixed`, `skipped` or `no_change_needed`), and F4 is `skipped` with `code-pr` named. This plan's status matches. On failure, do not hand off to `code-pr` |

Finding → unit: F1 → 01 · F2 → 01 · F3 → 02 · F4 → 03 (re-reported as
`skipped`, owned by `code-pr`).

## Wave stops

| Stop | After | Gate |
|------|-------|------|
| **Ship** | 01, 02 | Unit 03: the full local gate passes and the findings are re-reported; a separate `code-pr` ask follows |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
|---|---|---|---|---|---|
| — | — | — | — | None. The spec carries no open question. | — |

## Frontier order

**Wave 1:** (01 ∥ 02) → **03 STOP**

- 01 and 02 own disjoint files and run in parallel as spawned subagents, at
  the Human's ask.
- 01 edits both `code-review` copies and keeps them identical;
  `test/skill-copies.test.ts` catches drift.
- Unit 03 changes no source file. It ticks the Acceptance boxes only after
  the gate commands pass in this session.

## Execution / resume section

### Unit 01 — The review-fix handoff names an absent planning skill and runs before the verdict

| Field | Value |
|-------|-------|
| Unit | 01 — The review-fix handoff names an absent planning skill and runs before the verdict (Wave 1, frontier 1, parallel with 02) |
| Spec / plan | `docs/specs/archived/skills-command/skills-command-iteration-1-spec.md` / `docs/specs/archived/skills-command/skills-command-iteration-1-plan.md` |
| Obligations | R7.1 (`proof-skills-command-handoff-absent`), F2 order — done; proof passes, copies identical (`cmp`) |
| `HEAD` | `bfa454b` |
| `git status` | dirty — this iteration's spec and plan (untracked), both this initiative's docs |
| Intended diff | both `code-review/SKILL.md` copies, `test/skill-code-review.test.ts` |
| Discrepancies | The plan said `inline`; the Human asked for Sonnet subagents, so 01 and 02 became `spawn` — resolved |

### Unit 02 — An unknown skill name gets its own diagnostic

| Field | Value |
|-------|-------|
| Unit | 02 — An unknown skill name gets its own diagnostic (Wave 1, frontier 1, parallel with 01) |
| Spec / plan | `docs/specs/archived/skills-command/skills-command-iteration-1-spec.md` / `docs/specs/archived/skills-command/skills-command-iteration-1-plan.md` |
| Obligations | R8.1 (`proof-skills-command-unknown-skill`) — done; proof and `proof-skills-command-core-flag` pass |
| `HEAD` | `bfa454b` |
| `git status` | dirty — this iteration's spec and plan (untracked), both this initiative's docs |
| Intended diff | `src/skills/parse.ts`, `test/skills-command.test.ts` |
| Discrepancies | Same `inline` → `spawn` change as unit 01 — resolved |

### Unit 03 — Ship gate

| Field | Value |
|-------|-------|
| Unit | 03 — Ship gate (Wave 1 stop) |
| Spec / plan | `docs/specs/archived/skills-command/skills-command-iteration-1-spec.md` / `docs/specs/archived/skills-command/skills-command-iteration-1-plan.md` |
| Obligations | Gate PASS: `pnpm test` 588/588, `pnpm lint` ok, `pnpm build` ok, `pnpm validate` ok (54 claims), `node dist/cli.js comments` 0 findings. F1 `fixed` (01), F2 `fixed` (01), F3 `fixed` (02), F4 `skipped`, owned by `code-pr`. spec Acceptance boxes ticked and plan status `stable`; unit Done-when boxes flipped for the Human-asked commit |
| `HEAD` | `bfa454b` |
| `git status` | dirty — units 01 and 02 Owns, plus this iteration's spec and plan; nothing unrelated |
| Intended diff | none (gate) |
| Discrepancies | `autocommit` is `false` by default; the Human then asked for `code-commit`, so the unit Done-when marks flip in that commit — resolved |

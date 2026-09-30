---
type: spec
title: Fool and Jury discovery skills — plan
description: Ordered work units to add the-fool and the-jury to the discovery set with catalog updates.
status: deprecated
---

# Fool and Jury discovery skills — plan

## Structural gate

Every obligation in `fool-jury-skills-spec.md` (R1.1–R5.2) names a proof. Nine-dimension landings are complete. Unresolved is empty. Ready to slice.

## Work units

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 01 | Add `the-fool` skill package (MIT-adapted) | — | `templates/.agents/skills/the-fool/**` | `spawn` | Fool SKILL.md + refs + attribution satisfy R2.1–R2.3 (`proof-fool-workflow`, `proof-fool-modes`, `proof-fool-attribution`) |
| 02 | Add `the-jury` skill package (harness-authored, five juror agents) | — | `templates/.agents/skills/the-jury/**` | `spawn` | Jury SKILL.md + five `agents/juror-*.md` artifacts satisfy R3.1–R3.5 (`proof-jury-independence`, `proof-jury-verdict`, `proof-jury-authorship`, `proof-jury-no-persona-fallback`, `proof-jury-human-authority`) |
| 03 | Wire discovery membership + count/ask-only tests | 01, 02 | `src/setup/skill-sets.ts`, `src/setup/options.ts`, `test/ask-only.test.ts`, `test/skill-sets.test.ts`, `test/setup-skill-sets.test.ts`, `test/skill-fool-jury.test.ts` | `inline` | R1.1–R1.3, R3.1/R3.4, R4.2–R4.3, R5.2 hold; `pnpm test` covers membership/eighteen folders/invocable/five juror agents |
| 04 | Wave 1 gate | 03 | — (gate only) | `inline` | `pnpm test` exit 0 |
| 05 | Update catalog docs (site + README) | 04 | `site/skills.md`, `site/layout.md`, `README.md` | `inline` | R4.1 holds (`proof-fool-jury-catalog`) |
| 06 | Land PRD/spec/plan docs already drafted | 04 | `docs/prds/archived/fool-jury-skills/**`, `docs/specs/archived/fool-jury-skills/**` | `inline` | Profile docs present with `status: stable` and five-agent obligations locked |
| 07 | Wave 2 gate + full validate | 05, 06 | — (gate only) | `inline` | `pnpm lint && pnpm build && pnpm test && pnpm validate` exit 0; R5.1 holds |
| 08 | Rework Jury independence (five agents + isolation proofs) | 07 | `templates/.agents/skills/the-jury/**`, `test/skill-fool-jury.test.ts`, `docs/prds/archived/fool-jury-skills/**`, `docs/specs/archived/fool-jury-skills/**`, `site/skills.md` | `inline` | R3.1–R3.5 hold with agent artifacts and tests that reject persona-only independence; full gate green |

## Wave stops

| Stop | After | Gate |
|------|-------|------|
| **1** | 04 | `pnpm test` |
| **2** | 07 | `pnpm lint && pnpm build && pnpm test && pnpm validate` |
| **3** | 08 | `pnpm lint && pnpm build && pnpm test && pnpm validate` |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
|---|---|---|---|---|---|
| *(none)* | | | | | |

## Frontier order

Parallel: 01 ∥ 02 → 03 → 04 (wave 1 stop) → 05 ∥ 06 → 07 (wave 2 stop) → 08 (independence rework stop).

## Execution / resume

| Field | Value |
|-------|-------|
| active_unit | — |
| status | complete |
| last_completed_unit | 08 |
| wave | 3 |
| notes | Unit 08 done: five juror agent artifacts, spawn-isolation protocol, persona-simulation refusal, advisory Human authority, strengthened tests; full gate green |
| blockers | — |
| next_action | push to PR #26 (`cursor/issue-23-fool-jury-277f`) |

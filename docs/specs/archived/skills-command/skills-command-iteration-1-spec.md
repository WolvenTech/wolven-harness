---
type: spec
title: Install ship and discovery skills without the harness — iteration 1 spec
description: Delta obligations from the code review of PR 33 at bfa454b; the code-review handoff names an absent code-spec or code-plan, and an unknown skill name is not reported as installed by setup.
status: deprecated
source_spec: docs/specs/archived/skills-command/skills-command-spec.md
source_pr: https://github.com/WolvenTech/wolven-harness/pull/33
---

# Install ship and discovery skills without the harness — iteration 1 spec

**Source:** the code review of PR 33 at `bfa454b` (four nits, no blocking
finding) against `skills-command-spec.md` in this folder. This file holds
only the delta obligations; R1–R6 stay as the base spec states them.
**Next:** After the Human approves → `code-plan` writes
`skills-command-iteration-1-plan.md` in this folder → `code-execute`.
**Named proof (this spec's own structural gate):** `proof-skills-command-iteration-1-spec-obligations`

## Findings in this round

| Finding | Where | Kind | Lands in |
|---|---|---|---|
| F1 | `templates/.agents/skills/code-review/SKILL.md:74-76` | Adds an obligation | R7 below |
| F2 | `templates/.agents/skills/code-review/SKILL.md:72-76` | Plan-only: step 5 moves before the verdict step | `code-plan` |
| F3 | `src/skills/parse.ts:123-124` | Adds an obligation | R8 below |
| F4 | PR 33 body | Not repository work | `code-pr`, see Cross-domain leak table |

## Repository grounding

| Surface | Present today | Role for this initiative |
|---------|----------------|----------------------------|
| `templates/.agents/skills/code-review/SKILL.md` and `.agents/skills/code-review/SKILL.md` | yes | Step 5 **Review-fix handoff** came in from main's #43 and names `code-spec` and `code-plan` with no rule for when they are absent |
| `CORE_SKILLS` in `src/setup/skill-sets.ts` | yes | Lists `code-spec` and `code-plan` as core, so the `skills` command never installs them |
| R6.5 and R6.6 in the base spec | yes | The pattern R7 copies: absent from the session skill list → stop, name the owner, do not copy its procedure |
| `expandSkills` in `src/skills/parse.ts` | yes | Gives core and unknown names the same diagnostic, `<name> is installed by setup` |
| ADR-004, `skills` contract | yes, `stable` | Requires core and unknown names to exit 1 before any write, with a diagnostic that names the choice and `setup`. The rest of the wording is not part of the contract |
| `test/skills-command.test.ts` `proof-skills-command-core-flag` | yes | Pins the core-name case; no test pins an unknown name |
| `test/skill-code-review.test.ts` | yes | Pins the iteration path from #43 |
| `test/skill-copies.test.ts` | yes | Keeps the two `code-review` copies identical |

## Surface walk

- **In scope:** both `code-review/SKILL.md` copies; `src/skills/parse.ts`
  (`expandSkills` and its JSDoc, and the `resolveSkills` JSDoc);
  `test/skills-command.test.ts`; `test/skill-code-review.test.ts`.
- **Out of mutate scope (unchanged):** `src/skills/install.ts` and
  `src/skills/index.ts`; `src/setup/**`; ADR-004 and ADR-003; the other
  ship and discovery `SKILL.md` files; `code-spec` and `code-plan`
  themselves; `templates/.agents/skills/prototype/`, `the-fool/`,
  `the-jury/` and `handoff/`.

## Requirements (obligation ↔ proof)

### R7 — The review-fix handoff names an absent planning skill

| ID | Obligation | Named proof | Evidence shape |
|----|------------|--------------|------------------|
| R7.1 | Both `code-review/SKILL.md` copies say, at the review-fix handoff: when `code-spec` or `code-plan` is absent from the session skill list, the review names the absent skill and the next free N. It does not draft the iteration spec or plan itself or copy that skill's procedure. It names no install command. A folder on disk or a remembered name does not count as loaded | `proof-skills-command-handoff-absent` | `pnpm test`: a `test/skill-code-review.test.ts` case matches the absent-skill sentence; `test/skill-copies.test.ts` keeps both copies equal |

### R8 — An unknown skill name is not reported as installed by setup

| ID | Obligation | Named proof | Evidence shape |
|----|------------|--------------|------------------|
| R8.1 | `skills --skills <name>`, where `<name>` is neither a set, a ship or discovery skill, nor a core skill, exits 1 and writes nothing. Its stderr names `<name>` and `setup` (ADR-004) and does not contain `<name> is installed by setup`. Core names keep the R2.4 diagnostic | `proof-skills-command-unknown-skill` | `pnpm test`: non-TTY, `--skills code-reviw` and `--skills create-prd,code-reviw` against an empty temp dir, which is still empty afterwards; `proof-skills-command-core-flag` still passes |

## Nine-dimension landings

| Dimension | Landing kind | Landing |
|-----------|---------------|---------|
| validation | obligation ↔ proof | R8.1 / `proof-skills-command-unknown-skill`: an unknown name still fails before any write |
| failure modes | obligation ↔ proof | R7.1 / `proof-skills-command-handoff-absent`: a missing planning skill is named, not copied |
| idempotency and retry | `n/a` | Unchanged surface: the copy and compare logic in `src/skills/install.ts` |
| authorization | `n/a` | Unchanged surface: `src/cli.ts` and `src/skills/**` have no auth check, and none is added |
| concurrency and ordering | `n/a` | Unchanged surface: one process; `src/skills/index.ts` still parses, then resolves, then installs |
| data lifecycle | `n/a` | Unchanged surface: `installChoices` in `src/skills/install.ts`. R8.1 fails before that function runs |
| external-dependency failure | `n/a` | Unchanged surface: skill bytes still come from `templates/.agents/skills/` and no network call is made |
| state transitions | `n/a` | Unchanged surface: the folder states in R1 and R3 of the base spec |
| observability | obligation ↔ proof | R8.1 / `proof-skills-command-unknown-skill`: stderr tells a mistyped name apart from a core one |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition |
|------------|-------------------|-------|-------------------|--------------|
| — | — | — | — | None. ADR-004 already allows the R8.1 wording. |

## Out of scope

- Any change to the core-name diagnostic or to the prompt text in
  `resolveSkills`.
- Absent-skill rules for `code-execute`, `code-spec` or `code-plan`
  themselves. They are core skills, so `setup` always installs them.
- Updating the PR 33 body (F4).

## Pragmatic-guard refuses

- A "did you mean" suggestion or fuzzy match for a mistyped name: `skills
  --help` already lists every valid name.
- Listing every valid skill name in the error.
- An ADR or ADR-004 amendment: R8.1 stays inside the existing contract
  sentence.

## Acceptance

### Wave 1

- [x] R7.1: `proof-skills-command-handoff-absent` passes in `pnpm test`, and
      `test/skill-copies.test.ts` passes
- [x] R8.1: `proof-skills-command-unknown-skill` passes in `pnpm test`, and
      `proof-skills-command-core-flag` still passes

## Eval / gates

| Gate | Command / check | When | PASS | Abort |
|------|-------------------|------|------|-------|
| Tests | `pnpm test` | End of wave 1 | exit 0 | Fix; do not hand back |
| Lint and build | `pnpm lint` and `pnpm build` | End of wave 1 | exit 0 | Fix |
| Integrity | `pnpm validate` after `pnpm build` | End of wave 1 | exit 0 | Fix |
| Comments | `node dist/cli.js comments` | End of wave 1 | 0 findings | Fix the added comment |
| Spec obligations | `proof-skills-command-iteration-1-spec-obligations`: R7.1 and R8.1 each pair with one proof; all nine landings; every `n/a` cites an unchanged surface. This folder is under `archived/`, so `validate` does not scan it; check it by reading | Before `code-plan` | all hold | Do not plan |

## Cross-domain leak table

| Leak | Refuse |
|------|--------|
| F4, the stale PR 33 body | `code-pr`, on its own ask, after this round lands |
| Pushing the fixes or replying on the review | `code-pr` and `code-ci`, each on its own ask |
| An executable plan from this skill | `code-plan` only |

## ADR

None needed this round. R8.1 meets ADR-004's existing diagnostic sentence.

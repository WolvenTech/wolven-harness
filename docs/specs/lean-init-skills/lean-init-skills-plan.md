---
type: spec
title: Lean new-repo init and individually installable skills — plan
description: Ordered units for lean harness-init and setup --skill / --list-skills.
status: stable
source_spec: docs/specs/lean-init-skills/lean-init-skills-spec.md
---

# Lean new-repo init and individually installable skills — plan

## Structural gate

Every obligation in `lean-init-skills-spec.md` maps to a named proof (`proof-setup-skill-*`, `proof-config-skills-partial`, `proof-setup-list-skills`, `proof-harness-init-*`, `proof-contract-skills-amend`, `proof-docs-lean-skill`). Nine landings present; Unresolved empty. Ready to slice.

## Work units

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 01 | Catalog + config `skills` + `--skill` / `--list-skills` wiring | — | `src/setup/skill-sets.ts`, `src/setup/config.ts`, `src/setup/options.ts`, `src/setup/types.ts`, `src/setup/index.ts`, `src/setup/summary.ts` (if needed), `test/setup-skill-sets.test.ts`, `test/setup-options.test.ts`, new/extended setup tests for proofs R1.* / R2.1 | `spawn` | `--skill create-prd` with `--skills none` installs core+create-prd only; config has `skills` not `discovery` in `skillSets`; unknown skill exits 1; `--list-skills` prints groups and exits 0 without writes; re-run idempotent — `proof-setup-skill-flag`, `proof-setup-skill-union`, `proof-config-skills-partial`, `proof-setup-skill-rerun`, `proof-setup-skill-with-none`, `proof-setup-list-skills` |
| 02 | Amend ADR-003 for new flags + optional `skills` | 01 | `docs/adrs/adr-003-public-contract.md`, `test/contract.test.ts` (and related contract pins) | `spawn` | ADR Decision tables + Amendments document `--skill`, `--list-skills`, optional `skills`; contract tests pass — `proof-contract-skills-amend` |
| 03 | Wave 1 gate | 01, 02 | _(none — gate)_ | `inline` | `pnpm build && pnpm test && pnpm lint` PASS; abort before wave 2 on failure |
| 04 | Lean harness-init playbook + session-note deferral record | 03 | `templates/.agents/skills/harness-init/SKILL.md`, `templates/.agents/skills/harness-init/references/**` (session-note and discovery refs as needed), `test/skill-harness-init.test.ts` and/or `test/harness-init-*.test.ts` | `spawn` | Skill text encodes lean deferrals, never-defer proposals, must-run steps, and explicit deferral presentation; session-note template has deferred-steps section — `proof-harness-init-lean-rules`, `proof-harness-init-deferral-record`, `proof-harness-init-proposals-always`, `proof-harness-init-lean-must-run` |
| 05 | Wave 2 gate | 04 | _(none — gate)_ | `inline` | `pnpm test && pnpm lint` PASS; abort before wave 3 on failure |
| 06 | Document lean init + individual skill install | 05 | `README.md`, `site/harness-init.md`, `site/skills.md`, `site/commands.md`, tests that pin docs if present (`test/readme-install.test.ts` etc.) | `spawn` | Docs explain lean flow, `--list-skills`, and `setup --skill`; proofs green — `proof-docs-lean-skill` |
| 07 | Ship gate | 06 | _(none — gate)_ | `inline` | `pnpm build && pnpm test && pnpm lint && pnpm validate` PASS; `pnpm comments` clean for added comment lines |

## Wave stops

| Stop | After | Gate |
|------|-------|------|
| **1** | 03 | Unit 03 checks PASS — abort before unit 04 |
| **2** | 05 | Unit 05 checks PASS — abort before unit 06 |
| **3** | 07 | Unit 07 ship gate PASS — ready for `code-pr` |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
|---|---|---|---|---|---|
| _(none from spec)_ | — | — | — | — | — |

## Frontier order

1. Pull **01** (spawn). After 01 completes, pull **02** (spawn; can follow immediately; Owns disjoint from most of 01’s src if ADR/tests only — still Depends 01 so sequential).
2. **03** inline gate.
3. **04** spawn lean harness-init.
4. **05** inline gate.
5. **06** spawn docs.
6. **07** inline ship gate.

Parallelism: within wave 1, 01 then 02 (02 depends on 01 behavior existing for honest ADR wording). No cross-wave mixing.

## Commit cadence

Per assignment: invoke `code-commit` after each executed mutate unit (01, 02, 04, 06). Gate units do not commit unless there are local fixes.

## Execution / resume section

### Unit 01 — Catalog + config `skills` + `--skill` / `--list-skills` wiring

| Field | Value |
|-------|-------|
| Unit | 01 — Catalog + config `skills` + `--skill` / `--list-skills` wiring |
| Spec / plan | `docs/specs/lean-init-skills/lean-init-skills-spec.md` / `docs/specs/lean-init-skills/lean-init-skills-plan.md` |
| Obligations | R1.1–R1.5, R2.1 — done |
| `HEAD` | `9a0eb6b` |
| `git status` | dirty — docs/prds + docs/specs lean-init-skills artifacts (orchestration; outside 01 Owns; leave for later commit or isolate) |
| Intended diff | `src/setup/skill-sets.ts`, `config.ts`, `options.ts`, `types.ts`, `index.ts`, `summary.ts` (if needed), `test/setup-skill-sets.test.ts`, `test/setup-options.test.ts`, new skill tests |
| Discrepancies | docs artifacts dirty outside Owns — resolved: do not include in unit 01 commit; commit docs in a separate hygiene commit or with ship docs unit |

**Unit 01 status:** complete (proofs R1.* / R2.1 PASS)

### Unit 02 — Amend ADR-003

| Field | Value |
|-------|-------|
| Unit | 02 — Amend ADR-003 |
| Spec / plan | docs/specs/lean-init-skills/* |
| Obligations | R4.1 — done |
| `HEAD` | (see git) |
| `git status` | dirty — ADR only |
| Intended diff | docs/adrs/adr-003-public-contract.md |
| Discrepancies | none |

**Unit 02 status:** complete (proof-contract-skills-amend PASS)

### Unit 04 — Lean harness-init

| Field | Value |
|-------|-------|
| Unit | 04 — Lean harness-init |
| Obligations | R3.1–R3.4 — done |
| Discrepancies | none |

**Unit 04 status:** complete

### Unit 06 — Docs

| Field | Value |
|-------|-------|
| Unit | 06 — Document lean init + individual skill install |
| Obligations | R4.2 — done |
| Discrepancies | none |

**Unit 06 status:** complete

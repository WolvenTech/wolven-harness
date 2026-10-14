---
type: spec
title: Project skill precedence — iteration 1 remediation — plan
description: One-wave review remediation plan for project-first skill instructions and removal of clash scanning.
status: stable
---

# Project skill precedence — iteration 1 remediation — plan

## Structural gate

The locked iteration spec is `docs/specs/project-skill-precedence/project-skill-precedence-iteration-1-spec.md` (status `stable`). Every requirement has a distinct named proof: R1.1–R1.4 cover project-root selection, relative-reference resolution, entry delivery and fold; R2.1–R2.3 cover scanner removal, test scope and docs; R3.1–R3.2 cover preserved contracts and no scope expansion. Its acceptance items map to those rows, all nine dimensions land, and there are no unresolved choices. Tests prove instruction delivery and retained command contracts; they do not prove a runtime's skill-resolution behavior.

## Finding → unit map

| Finding | Review issue | Unit | Closeout states |
|---------|--------------|------|-----------------|
| F1 | Rule lookup omits standalone `.claude/skills` before falling back to user-level skills | 01 | `fixed`, `skipped`, or `no_change_needed`, with evidence |
| F2 | One unreadable skill file suppresses all scanner warnings | 02 | `fixed`, `skipped`, or `no_change_needed`, with evidence |
| F3 | Scanner, command integrations, help changes and scanner-only tests exceed the Human's narrowed rule-only scope | 02, 03 | `fixed`, `skipped`, or `no_change_needed`, with evidence |

## Work units

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|-----------|-----------|
| 01 | Make project-first selection explicit in rule delivery | — | `templates/.agents/rules/project-skill-precedence.md`, `.agents/rules/project-skill-precedence.md`, `templates/WOLVEN.md`, `AGENTS.md`, `test/project-skill-precedence-rule.test.ts`, focused assertions in `test/harness-init-entry.test.ts` | spawn | [x] Before skill use, the rule and both entry bullets check `.agents/skills/<name>/SKILL.md` and `.claude/skills/<name>/SKILL.md`, follow an available project copy and fall back to the user copy only when neither exists; relative references use the selected directory. Template and installed rule match, the fold retains the instruction, and proofs `proof-project-skill-precedence-iteration-1-selection`, `proof-project-skill-precedence-iteration-1-relative-references`, `proof-project-skill-precedence-iteration-1-entry-delivery`, and `proof-project-skill-precedence-iteration-1-fold` pass. |
| 02 | Remove clash scanning without changing command/install contracts | — | `src/skills/clash.ts`, `src/setup/index.ts`, `src/skills/index.ts`, `src/skills/parse.ts`, `src/skills/install.ts`, `test/setup-clash.test.ts`, scanner-only cases in `test/skills-clash.test.ts`, any affected `test/skills-command.test.ts` assertions | spawn | [x] No clash scanner, setup/skills integration, scanner-only help text, or scanner-only export remains; scanner-only tests are deleted and retained command/install tests still pin existing destinations, copy behavior, streams, flags and exit codes. Proofs `proof-project-skill-precedence-iteration-1-scanner-removal`, `proof-project-skill-precedence-iteration-1-test-scope`, and `proof-project-skill-precedence-iteration-1-contracts` pass; no dependency or test infrastructure is added (`proof-project-skill-precedence-iteration-1-no-expansion`). |
| 03 | Remove stale scanner promises from supporting documentation | — | `docs/deferrals/skill-clash-standing-check/`, `docs/deferrals/skill-clash-symlink-repair/`, scanner-promising text in `docs/deferrals/skill-self-identification/`, scanner-specific claims in `docs/specs/project-skill-precedence/project-skill-precedence-plan.md` | spawn | [x] A targeted search and inspection finds no active documentation promising clash scanning or command warnings; the old plan clearly points to iteration 1 for the replacement scope, while the locked original spec remains historical context and explicitly marks its scanner obligations superseded. Proof `proof-project-skill-precedence-iteration-1-docs` passes, with no new deferral for discarded scanner scope. |
| 04 | Review finding closeout and Wave 1 gate | 01, 02, 03 | `docs/specs/project-skill-precedence/project-skill-precedence-iteration-1-plan.md` | inline | [x] F1–F3 are each re-reported as `fixed`, `skipped`, or `no_change_needed` with evidence; all proofs from R1–R3 pass; `pnpm test`, `pnpm lint`, `pnpm build`, `pnpm validate`, and `pnpm comments` pass; `git diff --check` is clean. Failure aborts handoff to `code-execute`. |

## Wave stops

| Stop | After | Gate |
|------|-------|------|
| **Wave 1 / Ship** | 04 | Units 01–03 proofs pass; F1–F3 each have a closeout status and evidence; `pnpm test`, `pnpm lint`, `pnpm build`, `pnpm validate`, `pnpm comments`, and `git diff --check` pass — **abort before handoff on failure** |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
|------------|----------------|-------|-----------------|-------------|------|
| — | None; the locked spec has no open decisions | Human | None | None | — |

## Frontier order

**Wave 1:** (01 ∥ 02 ∥ 03) → **04 STOP**.

The Human directed `code-execute` on this plan, approving execution. Units 01,
02 and 03 own disjoint files and ran as spawned workers. Unit 04 is inline
because it inspects the combined work, records every review finding's
disposition, and runs the final gates. There is one implementation wave.

## Execution / resume section

### Unit 01 — Make project-first selection explicit in rule delivery

| Field | Value |
|-------|-------|
| Unit identifier | 01 — Make project-first selection explicit in rule delivery (frontier) |
| Spec/plan paths | `docs/specs/project-skill-precedence/project-skill-precedence-iteration-1-spec.md` / `docs/specs/project-skill-precedence/project-skill-precedence-iteration-1-plan.md` |
| Obligation / proof status | R1.1–R1.4 — done; proofs `proof-project-skill-precedence-iteration-1-selection`, `proof-project-skill-precedence-iteration-1-relative-references`, `proof-project-skill-precedence-iteration-1-entry-delivery`, `proof-project-skill-precedence-iteration-1-fold` passed; follow-up Biome formatting fixed and lint passed |
| `HEAD` commit | `4df114d` |
| `git status` summary | dirty — Unit 01 Owns rule/router/test paths contain completed changes; Unit 02 and 03 paths, the approved iteration spec, and this untracked plan also contain their completed changes |
| Intended diff scope | `templates/.agents/rules/project-skill-precedence.md`, `.agents/rules/project-skill-precedence.md`, `templates/WOLVEN.md`, `AGENTS.md`, `test/project-skill-precedence-rule.test.ts`, focused assertions in `test/harness-init-entry.test.ts`; plan resume record only |
| Decision on every discrepancy | resolved — Biome formatting follow-up touched only Unit 01's two owned test files; all other unit changes stayed isolated |

### Unit 02 — Remove clash scanning without changing command/install contracts

| Field | Value |
|-------|-------|
| Unit identifier | 02 — Remove clash scanning without changing command/install contracts (frontier) |
| Spec/plan paths | `docs/specs/project-skill-precedence/project-skill-precedence-iteration-1-spec.md` / `docs/specs/project-skill-precedence/project-skill-precedence-iteration-1-plan.md` |
| Obligation / proof status | R2.1–R2.2, R3.1–R3.2 — done; proofs `proof-project-skill-precedence-iteration-1-scanner-removal`, `proof-project-skill-precedence-iteration-1-test-scope`, `proof-project-skill-precedence-iteration-1-contracts`, `proof-project-skill-precedence-iteration-1-no-expansion` passed |
| `HEAD` commit | `4df114d` |
| `git status` summary | dirty — Unit 02 Owns source/test paths contain completed scanner removal; Unit 01 and 03 paths, the approved iteration spec, and this untracked plan also contain their completed changes |
| Intended diff scope | `src/skills/clash.ts`, `src/setup/index.ts`, `src/skills/index.ts`, `src/skills/parse.ts`, `src/skills/install.ts`, `test/setup-clash.test.ts`, scanner-only cases in `test/skills-clash.test.ts`, affected assertions in `test/skills-command.test.ts`; plan resume section only |
| Decision on every discrepancy | resolved — Unit 02 changed only its source/test Owns; retained command/install tests and full suite pass; other unit paths untouched |

### Unit 03 — Remove stale scanner promises from supporting documentation

| Field | Value |
|-------|-------|
| Unit identifier | 03 — Remove stale scanner promises from supporting documentation (frontier) |
| Spec/plan paths | `docs/specs/project-skill-precedence/project-skill-precedence-iteration-1-spec.md` / `docs/specs/project-skill-precedence/project-skill-precedence-iteration-1-plan.md` |
| Obligation / proof status | R2.3 — done; proof `proof-project-skill-precedence-iteration-1-docs` passed |
| `HEAD` commit | `4df114d` |
| `git status` summary | dirty — Unit 03 Owns deferrals and old-plan paths contain completed changes; Unit 01/02 paths, approved iteration spec, and this untracked plan also contain their completed changes |
| Intended diff scope | scanner-specific deferral docs and scanner-specific claims in `docs/specs/project-skill-precedence/project-skill-precedence-plan.md`; plan resume section only |
| Decision on every discrepancy | resolved — Unit 03 retained deprecated notices required by existing spec links, marked the old plan deprecated, and did not alter the locked original spec or Unit 01/02 paths |

### Unit 04 — Review finding closeout and Wave 1 gate

| Field | Value |
|-------|-------|
| Unit identifier | 04 — Review finding closeout and Wave 1 gate (final unit) |
| Spec/plan paths | `docs/specs/project-skill-precedence/project-skill-precedence-iteration-1-spec.md` / `docs/specs/project-skill-precedence/project-skill-precedence-iteration-1-plan.md` |
| Obligation / proof status | R1.1–R3.2 and all nine named proofs — done; F1–F3 closeout — done |
| `HEAD` commit | `4df114d` |
| `git status` summary | dirty — all unit changes, approved spec status change, and this untracked plan remain uncommitted; Unit 04 changed only this plan |
| Intended diff scope | `docs/specs/project-skill-precedence/project-skill-precedence-iteration-1-plan.md` only |
| Decision on every discrepancy | resolved — all whole-repo gates passed; the finding dispositions and evidence are recorded below; no implementation, test, deferral, original-plan or approved-spec files changed during closeout |

## Review finding closeout

| Finding | Status | Evidence |
|---------|--------|----------|
| F1 — standalone `.claude/skills` project copy was omitted before user-level fallback | fixed | Rule, both entry bullets and folded-context assertions name both project roots and project-first selection; focused rule/fold tests pass (18/18) |
| F2 — one unreadable skill file suppressed every scanner warning | fixed | Scanner and whole-scan catch removed; scanner-only suites deleted. Full `pnpm test` passes (701 tests) |
| F3 — scanner, integrations, help changes and scanner-only tests exceeded the Human's narrowed scope | fixed | Scanner module, integrations, help text and scanner-only tests removed; scanner-specific docs are superseded/deprecated. Search found no active scanner integration. Full lint, build, validate, comments and diff-check pass |

Wave gate evidence: `pnpm test` — 701 passed, 0 failed; `pnpm lint` — exit 0;
`pnpm build` — exit 0; `pnpm validate` — `claims: 74 ok, 0 legacy-warn, 0
fail`, `validate: ok`; `pnpm comments` — `comments: ok (0 findings)`;
`git diff --check` — clean. The completion marks are checked for the
PR-required commit of this completed wave; `.agents/code-commit.config.yml` is
absent, so code-execute itself did not commit the work.

## Post-plan follow-up

At the Human's direction, the three deferral records created by the original
initiative were removed after this wave. The scanner and marker proposals are
not tracked for future work.

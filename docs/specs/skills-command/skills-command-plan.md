---
type: spec
title: Install ship and discovery skills without the harness
description: Ordered units for the skills command and the one package copy that skips a missing consult and stops when the next procedure lives elsewhere.
status: draft
---

# Install ship and discovery skills without the harness — plan

**Source:** `docs/specs/skills-command/skills-command-spec.md` (status `stable`).
**Next:** `code-execute` is in progress on an explicit ask. One mutate batch. Units 09 and 10 wait until 08 lands. Unit 12 is the ship gate.

## Structural gate

Every obligation R1.1–R6.11 in the locked spec already names a proof. No obligation is sliced without that proof. R6 proofs are reads of the package copy. Command proofs are `pnpm test`.

## Work units

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 01 | `create-prd` names a missing grill | — | `templates/.agents/skills/create-prd/SKILL.md` | `spawn` | With `grilling` on the session skill list the text runs it before drafting; with it absent the text drafts from the ask, the PRD file and the reply include `grilling did not run`, and no install command is named for `grilling`. With `adr` absent at the ADR offer, no decision record is written and the reply names `adr`. Proof: `proof-skills-command-grilling-skip` |
| 02 | `code-commit` names a missing guard | — | `templates/.agents/skills/code-commit/SKILL.md` | `spawn` | With `pragmatic-guard` on the session skill list the text consults it; with it absent the text follows its own steps, the reply and the commit message include `pragmatic-guard was not consulted`, a folder or a remembered name is not loaded, no install command is named, and the run writes no deferral and no sentence that the guard ran. Proof: `proof-skills-command-guard-skip`, `proof-skills-command-no-guard-artifact` for this file |
| 03 | `code-pr` names a missing guard and a missing commit | — | `templates/.agents/skills/code-pr/SKILL.md` | `spawn` | Same guard sentences as unit 02, on this file. When `code-commit` is absent and the next step is a commit, the text stops, names `code-commit`, and does not run `git commit`. Proof: `proof-skills-command-guard-skip`, `proof-skills-command-no-guard-artifact`, `proof-skills-command-commit-coupled` for this file |
| 04 | Host action stops without `gitHost` | — | `templates/.agents/skills/code-pr/references/host-operations.md` | `spawn` | When `.wolven-harness.json` has no `gitHost`, the host action does not happen, the reply names `setup`, and the text does not assume GitHub. Proof: `proof-skills-command-githost` |
| 05 | Closure stops on a missing procedure | — | `templates/.agents/skills/code-pr/references/pre-merge-closure.md` | `spawn` | A missing `code-commit` stops before the commit and does not run `git commit`. A missing `harness:validate` stops that step, names `setup`, and does not claim a pass or merge-ready. A missing `adr` leaves ADR status as it is and does not claim merge-ready. A review that says the ADR-claims axis was not checked is not a passed axis and is not merge-ready. Proof: `proof-skills-command-commit-coupled`, `proof-skills-command-validate-stop`, `proof-skills-command-adr-promote`, `proof-skills-command-adr-axis` for this file |
| 06 | `code-review` names a missing guard, a missing host skill, and a skipped axis | — | `templates/.agents/skills/code-review/SKILL.md` | `spawn` | Same guard sentences as unit 02. Reading `pragmatic-guard was not consulted` does not treat the guard as having run and does not claim merge-ready. When `code-pr` is absent, the text stops before a host action, names `code-pr`, and does not copy the host procedure. When `harness:validate` cannot be run, other findings are posted, the posted review says the ADR-claims axis was not checked, and those claims are not judged by eye. Proof: `proof-skills-command-guard-skip`, `proof-skills-command-no-guard-artifact`, `proof-skills-command-skip-reader`, `proof-skills-command-host-coupled`, `proof-skills-command-adr-axis` for this file |
| 07 | `code-ci` names a missing guard and the coupled stops | — | `templates/.agents/skills/code-ci/SKILL.md` | `spawn` | Same guard and reader sentences as unit 06. When `code-pr` is absent, stop before a host action and name `code-pr`. When `code-commit` is absent and the next step is a commit, stop and do not run `git commit`. When `harness:validate` cannot be run, stop, name `setup`, and do not claim a pass or merge-ready. A review that says the ADR-claims axis was not checked is not a passed axis and is not merge-ready. Proof: `proof-skills-command-guard-skip`, `proof-skills-command-no-guard-artifact`, `proof-skills-command-skip-reader`, `proof-skills-command-host-coupled`, `proof-skills-command-commit-coupled`, `proof-skills-command-validate-stop`, `proof-skills-command-adr-axis` for this file |
| 08 | `skills` writes the chosen folders and is a command | — | `src/cli.ts`, `src/skills/**`, `test/**` for R1 and R4.1 and R4.5 | `spawn` | A non-git directory with no harness files gets `./.claude/skills/create-prd/SKILL.md` from the package copy and no harness files. `claude`+`codex` with `project,global` writes the four load paths. `cursor`+`codex` project writes `./.agents/skills/create-prd/` once and does not create `./.cursor/skills/`. A non-terminal `wolven-harness skills --skills create-prd --runtimes codex --scope project` exits 0 and writes that folder. `wolven-harness --help` and no-argument usage list `skills` and exit 0. An unknown command still exits 1. Proof: `proof-skills-command-claude-project`, `proof-skills-command-multi-path`, `proof-skills-command-shared-agents`, `proof-skills-command-nontty-ok`, `proof-skills-command-usage` |
| 09 | Choices accept sets and refuse core | 08 | `src/skills/**`, `test/**` for R2 and R4.2–R4.4 and R4.6 | `inline` | A checked `discovery` selects that set; checking only `create-prd` leaves the other four unselected. The prompt lists the nine core skills, they are not options, and none of those folders are written. `--skills ship` writes every ship skill, `--skills create-prd` writes only that skill, `--skills ship,code-pr` writes each ship skill once. `--skills adr` writes nothing, exits 1, and names `adr` and `setup`. No terminal and no `--runtimes` writes nothing, exits 1, and names `--runtimes`. `--scope both` writes nothing and names `both`; `project,global` and `global,project` both mean both scopes. `--runtimes foo` on a terminal asks again, and choosing `codex` writes the folder without re-asking the supplied flags. `skills --help` and `skills -h` exit 0, write nothing, and name the flags, values, every ship and discovery skill, and that core skills are installed by `setup`. Proof: `proof-skills-command-set-select`, `proof-skills-command-core-disabled`, `proof-skills-command-flag-expand`, `proof-skills-command-core-flag`, `proof-skills-command-missing-flag`, `proof-skills-command-scope-both`, `proof-skills-command-reask`, `proof-skills-command-help` |
| 10 | An existing folder changes only after a yes, and a write error exits 1 | 09 | `src/skills/**`, `test/**` for R3 and R5.1 | `inline` | A decline leaves that folder and still adds a missing chosen skill, and every question is asked before any write. A yes replaces the folder and deletes an extra file. Project and global are separate questions. No terminal leaves an existing folder and still adds a missing one, exit 0. An identical folder is not prompted and not rewritten. Cancelling any prompt writes nothing and exits 1. A filesystem error exits 1, does not roll back folders already written, and does not delete a folder it was not replacing. Proof: `proof-skills-command-decline`, `proof-skills-command-replace`, `proof-skills-command-per-folder`, `proof-skills-command-no-tty-keep`, `proof-skills-command-identical`, `proof-skills-command-cancel-atomic`, `proof-skills-command-write-error` |
| 11 | The guide names `skills` | — | `site/commands.md`, `site/index.md` | `spawn` | `site/commands.md` documents `wolven-harness skills` and does not say `setup` is the only command that writes. `site/index.md` names `skills` among the terminal commands. Proof: `proof-skills-command-site` |
| 12 | **Ship gate** | 01, 02, 03, 04, 05, 06, 07, 10, 11 | — | `inline` | `pnpm test` exits 0. `pnpm exec tsx src/cli.ts validate` exits 0. Each R6 proof reads as passed across the files units 01–07 own. `git diff` against the base shows no change under `templates/.agents/skills/prototype/`, `the-fool/`, `the-jury/`, or `handoff/`. Proof: `proof-skills-command-discovery-unchanged` and the spec eval gates. Failure aborts the batch. |

## Wave stops

The spec is one mutate batch. There is no second wave.

| Stop | After | Gate |
|------|-------|------|
| **Ship** | 12 | `pnpm test` exits 0; `pnpm exec tsx src/cli.ts validate` exits 0; R6 reads pass; `proof-skills-command-discovery-unchanged` passes. Failure aborts. Do not hand off. |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
|---|---|---|---|---|---|
| — | — | — | non-blocking | None. The locked spec's open questions are settled. | — |

## Frontier order

**(01 ∥ 02 ∥ 03 ∥ 04 ∥ 05 ∥ 06 ∥ 07 ∥ 08 ∥ 11) → 09 → 10 → 12 STOP**

Units 01–07 and 11 own disjoint paths and can run with unit 08. Units 09 and 10 own `src/skills/**` after 08 and run inline, in that order. Unit 12 is the only stop.

## Execution / resume section

Unrelated untracked paths are isolated and not owned by any unit: `.pnpm-store/`, `.scratch/`, and one untracked draft record under `docs/adrs/`. Decision: leave them untouched.

Resolved opt: `autocommit: false` (default, no `.agents/code-commit.config.yml`), `autocommit-rule: wave` (default). `code-commit` is installed at `.agents/skills/code-commit/`. No automatic commit.

### Unit 01 — create-prd names a missing grill

| Field | Value |
|-------|-------|
| Unit | 01 — `create-prd` names a missing grill. Frontier, in flight. |
| Spec / plan | `docs/specs/skills-command/skills-command-spec.md` / `docs/specs/skills-command/skills-command-plan.md` |
| Obligations | R6.4 — done |
| `HEAD` | `af39585` |
| `git status` | dirty — untracked `.pnpm-store/`, `.scratch/`, and one untracked draft record under `docs/adrs/` (unrelated); this unit's Owns clean |
| Intended diff | `templates/.agents/skills/create-prd/SKILL.md` |
| Discrepancies | Unrelated untracked paths — resolved: isolate, do not touch |

### Unit 02 — code-commit names a missing guard

| Field | Value |
|-------|-------|
| Unit | 02 — `code-commit` names a missing guard. Frontier, in flight. |
| Spec / plan | `docs/specs/skills-command/skills-command-spec.md` / `docs/specs/skills-command/skills-command-plan.md` |
| Obligations | R6.1, R6.2 — done |
| `HEAD` | `af39585` |
| `git status` | dirty — unrelated untracked paths only; this unit's Owns clean |
| Intended diff | `templates/.agents/skills/code-commit/SKILL.md` |
| Discrepancies | Unrelated untracked paths — resolved: isolate, do not touch |

### Unit 03 — code-pr names a missing guard and a missing commit

| Field | Value |
|-------|-------|
| Unit | 03 — `code-pr` names a missing guard and a missing commit. Frontier, in flight. |
| Spec / plan | `docs/specs/skills-command/skills-command-spec.md` / `docs/specs/skills-command/skills-command-plan.md` |
| Obligations | R6.1, R6.2, R6.6 — done |
| `HEAD` | `af39585` |
| `git status` | dirty — unrelated untracked paths only; this unit's Owns clean |
| Intended diff | `templates/.agents/skills/code-pr/SKILL.md` |
| Discrepancies | Unrelated untracked paths — resolved: isolate, do not touch |

### Unit 04 — Host action stops without gitHost

| Field | Value |
|-------|-------|
| Unit | 04 — Host action stops without `gitHost`. Frontier, in flight. |
| Spec / plan | `docs/specs/skills-command/skills-command-spec.md` / `docs/specs/skills-command/skills-command-plan.md` |
| Obligations | R6.7 — done |
| `HEAD` | `af39585` |
| `git status` | dirty — unrelated untracked paths only; this unit's Owns clean |
| Intended diff | `templates/.agents/skills/code-pr/references/host-operations.md` |
| Discrepancies | Unrelated untracked paths — resolved: isolate, do not touch |

### Unit 05 — Closure stops on a missing procedure

| Field | Value |
|-------|-------|
| Unit | 05 — Closure stops on a missing procedure. Frontier, in flight. |
| Spec / plan | `docs/specs/skills-command/skills-command-spec.md` / `docs/specs/skills-command/skills-command-plan.md` |
| Obligations | R6.6, R6.8, R6.9, R6.10 — done |
| `HEAD` | `af39585` |
| `git status` | dirty — unrelated untracked paths only; this unit's Owns clean |
| Intended diff | `templates/.agents/skills/code-pr/references/pre-merge-closure.md` |
| Discrepancies | Unrelated untracked paths — resolved: isolate, do not touch |

### Unit 06 — code-review names a missing guard, a missing host skill, and a skipped axis

| Field | Value |
|-------|-------|
| Unit | 06 — `code-review` names a missing guard, a missing host skill, and a skipped axis. Frontier, in flight. |
| Spec / plan | `docs/specs/skills-command/skills-command-spec.md` / `docs/specs/skills-command/skills-command-plan.md` |
| Obligations | R6.1, R6.2, R6.3, R6.5, R6.10 — done |
| `HEAD` | `af39585` |
| `git status` | dirty — unrelated untracked paths only; this unit's Owns clean |
| Intended diff | `templates/.agents/skills/code-review/SKILL.md` |
| Discrepancies | Unrelated untracked paths — resolved: isolate, do not touch |

### Unit 07 — code-ci names a missing guard and the coupled stops

| Field | Value |
|-------|-------|
| Unit | 07 — `code-ci` names a missing guard and the coupled stops. Frontier, in flight. |
| Spec / plan | `docs/specs/skills-command/skills-command-spec.md` / `docs/specs/skills-command/skills-command-plan.md` |
| Obligations | R6.1, R6.2, R6.3, R6.5, R6.6, R6.8, R6.10 — done |
| `HEAD` | `af39585` |
| `git status` | dirty — unrelated untracked paths only; this unit's Owns clean |
| Intended diff | `templates/.agents/skills/code-ci/SKILL.md` |
| Discrepancies | Unrelated untracked paths — resolved: isolate, do not touch |

### Unit 08 — skills writes the chosen folders and is a command

| Field | Value |
|-------|-------|
| Unit | 08 — `skills` writes the chosen folders and is a command. Frontier, in flight. |
| Spec / plan | `docs/specs/skills-command/skills-command-spec.md` / `docs/specs/skills-command/skills-command-plan.md` |
| Obligations | R1.1, R1.2, R1.3, R4.1, R4.5 — done |
| `HEAD` | `af39585` |
| `git status` | dirty — unrelated untracked paths only; this unit's Owns clean |
| Intended diff | `src/cli.ts`, `src/skills/**`, `test/**` for R1 and R4.1 and R4.5 |
| Discrepancies | Unrelated untracked paths — resolved: isolate, do not touch |

### Unit 09 — Choices accept sets and refuse core

| Field | Value |
|-------|-------|
| Unit | 09 — Choices accept sets and refuse core. After 08, in flight. |
| Spec / plan | `docs/specs/skills-command/skills-command-spec.md` / `docs/specs/skills-command/skills-command-plan.md` |
| Obligations | R2.1, R2.2, R2.3, R2.4, R4.2, R4.3, R4.4, R4.6 — done |
| `HEAD` | `af39585` |
| `git status` | dirty — frontier units 01–08 and 11 edited their Owns; unrelated untracked paths isolated |
| Intended diff | `src/skills/**`, `test/**` for R2 and R4.2–R4.4 and R4.6 |
| Discrepancies | Unrelated untracked paths — resolved: isolate, do not touch |

### Unit 10 — An existing folder changes only after a yes, and a write error exits 1

| Field | Value |
|-------|-------|
| Unit | 10 — replacement and write error. After 09, not started. |
| Spec / plan | `docs/specs/skills-command/skills-command-spec.md` / `docs/specs/skills-command/skills-command-plan.md` |
| Obligations | R3.1–R3.6, R5.1 — done |
| `HEAD` | `af39585` |
| `git status` | dirty — earlier units' Owns plus unit 09 when it edits `src/skills/**` |
| Intended diff | `src/skills/**`, `test/**` for R3 and R5.1 |
| Discrepancies | Shared `src/skills/**` with unit 09 — resolved: run inline after 09, not in parallel |

### Unit 11 — The guide names skills

| Field | Value |
|-------|-------|
| Unit | 11 — The guide names `skills`. Frontier, in flight. |
| Spec / plan | `docs/specs/skills-command/skills-command-spec.md` / `docs/specs/skills-command/skills-command-plan.md` |
| Obligations | R5.2 — done |
| `HEAD` | `af39585` |
| `git status` | dirty — unrelated untracked paths only; this unit's Owns clean |
| Intended diff | `site/commands.md`, `site/index.md` |
| Discrepancies | Unrelated untracked paths — resolved: isolate, do not touch |

### Unit 12 — Ship gate

| Field | Value |
|-------|-------|
| Unit | 12 — Ship gate. After 01–11. |
| Spec / plan | `docs/specs/skills-command/skills-command-spec.md` / `docs/specs/skills-command/skills-command-plan.md` |
| Obligations | R6.11 and the spec eval gates — done |
| `HEAD` | `af39585` |
| `git status` | dirty — units 01–11 Owns; unrelated untracked paths isolated |
| Intended diff | none — gate only |
| Discrepancies | `autocommit: false` — resolved: leave the batch uncommitted |

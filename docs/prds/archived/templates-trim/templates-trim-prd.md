---
type: prd
title: Trim the shipped templates without cutting contract
description: Cut the verbose prose in the templates this package ships, make the PR body and the wave commit message lean, and keep every pinned heading, phrase and n/a row outside the PR body.
status: deprecated
---

# Trim the shipped templates without cutting contract

## Problem

- **Who:** the maintainer, and the agents in consumer repos that fill these templates.
- **Pain:** the templates under `templates/` read as verbose. Most of the weight sits in worked examples, restated lists and checklist tables. The maintainer wants them shorter and will not accept losing anything important.
- **Priority pain 1, PRs:** a filled PR body is far too long. `code-pr/references/pr-body-template.md` has nine sections that overlap: Summary Overview, What, Why and How say the same thing four ways, Changes Made restates them, and Checklist restates Verification & Testing. The four Pre-merge closure boxes ride along in every body.
- **Priority pain 2, wave commits:** when `code-execute` commits a wave, the message is often the per-unit Conventional Commit messages concatenated. `code-commit` says a batch is one atomic commit, but nothing says how to write its message, so concatenation is the default.
- **Why now:** the skill set keeps growing (journey-map, wayfinder), and each new template is written against the existing ones, so the verbosity compounds.
- **Evidence:** three five-seat jury runs (template trim, approach comparison against OpenSpec and tlc-spec-driven, and this PRD's review) plus a pin audit of `test/` and `src/`. The runs are not recorded in the repo; their conclusions are the decisions below. Nothing was measured on agent output quality; that is an assumption (see Open questions).

## Goals

- A filled PR body is lean. Signal: a feature PR body made of Summary with three What/Why/How bullets, up to three Verification bullets and the Before merge boxes comes to about 20 lines, at most 25.
- A wave commit carries one lean message. Signal: a wave of N units yields one subject plus a body of at most three lines, never N joined messages.
- The templates shrink. Signal: the files named in AC-1.1 plus `pr-body-template.md` (32.5 KB together) shrink by 15–20% (4.9–6.5 KB), measured by total bytes before and after.
- No contract is lost. Signal: `pnpm test`, `pnpm build`, `pnpm validate` and `pnpm comments` pass after each file is trimmed.
- Agent output keeps its shape. Signal: one spec and one plan filled from the skills before the trim and again after it keep the same headings, table columns and `n/a` reasons when the two fills are compared.

**Non-goals**

- Redesigning the pipeline. The OpenSpec shape (tiny templates, no examples) and the tlc-spec-driven shape (auto-sizing by scope, on-demand references, scripts for gates) were weighed and rejected: they delete or restructure what the tests pin, and add surface with no present need.
- Trimming any `SKILL.md` other than `code-commit` and `code-pr`. `harness-init/SKILL.md` and `code-execute/SKILL.md` (about 12 KB each) are a follow-up, not this PRD.
- Touching `WOLVEN.md`, `docs/WRITING-PROFILE.md`, or the small templates (`adr-template`, `prd-template`, `TEMPLATE-plan`, `note-template`, `ticket-format`).
- Touching the vendor skills `prototype`, `the-fool`, `the-jury` and `handoff`.
- Omitting empty sections, or adding HTML-comment guidance to any template other than the PR body. The PR body is the one exception: its lines appear only when they have content for the diff.

## User stories

### US-1: Shorter templates, same contract

**As a** maintainer,
**I want** the verbose examples, restated lists and checklist tables cut,
**so that** each template is quicker to read and review without losing a required heading, column, phrase or `n/a` reason.

Traces to goal: The templates shrink; No contract is lost.

#### AC-1.1: Targeted files shrink within budget

**Given** `code-spec/references/EXAMPLE.md` (5,232 B), `code-plan/references/EXAMPLE-units.md` (4,857 B), `harness-init/references/session-note-template.md` (5,702 B, outside the fenced block), `code-spec/references/TEMPLATE.md` (4,385 B), `code-execute/references/builder-brief.md` (2,773 B), `harness-init/references/stub-template.md` (5,016 B) and `qmd-first.md` (1,717 B), 29.7 KB together
**When** each is trimmed
**Then** it shrinks by its budget (EXAMPLE.md about 30%, EXAMPLE-units about 25%, session-note 15–20%, TEMPLATE.md 10–15%, builder-brief about 10%, stub-template at most 10%, qmd-first 15–20%), and with `pr-body-template.md` (2,870 B, governed by US-3, counted in the total but not held to a per-file budget) the total reduction stays between 15% and 20% of the 32.5 KB.

#### AC-1.2: Pinned content survives

**Given** a trimmed file whose headings, table columns or phrases are matched by `test/` or `src/`
**When** `pnpm test`, `pnpm build`, `pnpm validate` and `pnpm comments` run
**Then** all four pass, and every `n/a — reason` and `N/A … docs-only` string is still present.

#### AC-1.3: Each file reverts alone

**Given** each file is trimmed independently
**When** a check fails after one file
**Then** undoing that file's trim restores a green run without touching the other files.

### US-2: Agents still learn the shape

**As an** agent filling a spec or plan in a consumer repo,
**I want** at least one worked row of each kind left in the examples,
**so that** I can still infer the obligation-to-proof table, the nine-dimension landings, the Unresolved row and the STOP wave row.

Traces to goal: Agent output keeps its shape.

#### AC-2.1: Examples keep one row per kind

**Given** the trimmed `EXAMPLE.md` and `EXAMPLE-units.md`
**When** an agent reads them
**Then** `EXAMPLE.md` still holds, as present today, the `## Obligation ↔ proof` table with acceptance boxes, one `n/a` landing citing an unchanged surface, one Unresolved row with an empty Disposition and the Waves diagram, and `EXAMPLE-units.md` still holds the work-units table with `spawn`/`inline` Subagent cells, a `STOP` row, an Unresolved table with an "empty until decided" Disposition, and one bad re-slice example.

#### AC-2.2: A repeated rule has one copy

**Given** a trimmed template that stated a rule in two sections
**When** the file is searched for the rule's wording
**Then** the copy a test pins is kept and the restatement is gone.

#### AC-2.3: A lost kind is restored

**Given** a trimmed example no longer holds one of the row kinds in AC-2.1
**When** the review or a test finds it
**Then** that row kind is restored before the trim is accepted.

### US-3: A lean PR body

**As a** reviewer,
**I want** a PR body that says what changed, why, and how it was verified, once each,
**so that** I can read it in under a minute.

Traces to goal: A filled PR body is lean.

#### AC-3.1: Shape

**Given** the PR body template
**When** a feature PR is filled from it
**Then** the body is three parts: Summary, with two or three lines and three bullets What, Why and How underneath; Verification; and Before merge. It has no Agent/Model line, Overview, Changes Made, Checklist or Risk & Reviewer Notes section, and does not re-list acceptance criteria.

#### AC-3.2: Caps and optional lines

**Given** a filled body
**When** its lines are counted
**Then** each What, Why and How bullet is at most 140 characters; Verification has one to three command bullets; a `Task:` line (a spec, plan or ticket reference) is present only when one exists, and a `Risk:` line only when the risk is Medium or High; no empty placeholder is left behind.

#### AC-3.3: Before merge is three checkboxes

**Given** a filled body
**When** it is written
**Then** Before merge holds `[ ] Manual test` and `[ ] CI green`, plus `[ ] Pre-merge closure` only when the diff adds or changes files under `docs/specs`, `docs/prds` or `docs/adrs`; the four-box closure block is gone from the body, its steps stay in `pre-merge-closure.md`, and every box starts as `[ ]` and is ticked only from this session's evidence.

#### AC-3.4: Evidence rule survives

**Given** a docs-only change with no gate to run
**When** Verification is filled
**Then** `N/A` with a stated reason is still allowed, and any gate that ran is still named with its command.

#### AC-3.5: Template, skill and tests agree

**Given** the lean shape
**When** `pr-body-template.md`, the `code-pr/SKILL.md` lines that restate it (including its EXAMPLE section) and `test/skill-code-pr.test.ts` are updated together
**Then** `pnpm test` passes, the tests pin the new headings, and no old heading (What/Why/How as sections, Changes Made, Checklist, Risk & Reviewer Notes) is still required.

### US-4: One lean message per commit batch

**As a** maintainer reading `git log`,
**I want** a wave commit to carry one subject and a short body for the whole batch,
**so that** history is not a pile of joined per-unit messages.

Traces to goal: A wave commit carries one lean message.

#### AC-4.1: A wave batch gets one message

**Given** `code-execute` commits a wave of several units
**When** `code-commit` writes the message
**Then** it is one Conventional Commit whose subject states the batch's outcome and whose body is at most three lines, with no per-unit subjects joined together.

#### AC-4.2: A single unit or a standalone commit is unchanged

**Given** a wave of one unit, or a standalone commit
**When** `code-commit` writes the message
**Then** the existing message rules apply, no batch summary is invented, and the three-line cap is not imposed on a standalone commit. A batch that holds unrelated contexts may still split, as `code-commit/SKILL.md` already says.

#### AC-4.3: The atomic plan-mark rule is unchanged

**Given** the same wave commit
**When** it stages
**Then** the work and only that batch's plan-completion marks still land in that one commit.

#### AC-4.4: The skill shows the bad case

**Given** `code-commit/references/commit-examples.md`
**When** an agent reads it
**Then** it holds one good wave message and one bad concatenated one, and `test/skill-code-commit.test.ts` pins them.

## Scope

**In**

- The files named in AC-1.1, including `qmd-first.md` prose, which is loaded on every run.
- `code-pr/references/pr-body-template.md`, the `code-pr/SKILL.md` lines that restate it, and `test/skill-code-pr.test.ts`, changed together to the lean shape.
- `code-commit/SKILL.md`, `code-commit/references/commit-examples.md` and `test/skill-code-commit.test.ts`: a rule and example for the wave-batch message.

**Out**

- Everything listed under Non-goals.

## Open questions

- Is 15–20% enough for the non-PR templates, or does the maintainer expect a deeper cut and accept more risk? Owner: maintainer.
- Does a trimmed example make agent output worse where no test would notice? Owner: maintainer; the before and after fill in the last goal is the check.
- Does the `harness-init` and `code-execute` `SKILL.md` trim (about 12 KB each) become its own PRD? Owner: maintainer. Default taken: yes, later.

Settled in the grilling and the reviews: the lean PR shape (AC-3.1 to AC-3.3), the Pre-merge closure trigger (the three `docs/` folders in AC-3.3), the wave message cap (one subject, body at most three lines), `qmd-first.md` in scope, `WRITING-PROFILE.md` and `WOLVEN.md` out, and the byte baseline of 32.5 KB.

## Handoff

After approval → `code-spec`. This PRD does not authorize implementation.

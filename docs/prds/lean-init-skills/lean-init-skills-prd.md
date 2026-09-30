---
type: prd
title: Lean new-repo init and individually installable skills
description: Fresh repos finish a lean harness-init path and can install one skill without taking a whole skill set.
status: stable
source_issue: https://github.com/WolvenTech/wolven-harness/issues/22
---

# Lean new-repo init and individually installable skills

## Problem

- **Who:** Developers creating a mostly empty new repository who want to reach first useful work (first build or first spec) quickly.
- **Pain:** Fresh-repo developers cannot reach first useful work quickly because `harness-init` forces deep discovery, research, and score-gap questioning before skills are available, and installing one needed skill requires taking the whole `discovery` skill set.
- **Why now:** Target the next release; empty-repo onboarding is the first impression of the harness, and the issue’s example (sales proposal decks) shows users blocked before they can write a PRD.
- **Evidence:** [Issue #22](https://github.com/WolvenTech/wolven-harness/issues/22); current `harness-init` steps 2–6 in `templates/.agents/skills/harness-init/SKILL.md`; skill membership in `src/setup/skill-sets.ts` and public docs (`README.md`, `site/skills.md`).

## Goals

- G1: A fresh repository can finish a lean `harness-init` run that uses present evidence, captures the immediate goal and essential choices, and reaches skill proposals without mandatory deep research or a question for every score gap — success signal: a fresh-repo test or documented walkthrough completes lean init and leaves a usable entry guide / session note that records chosen and deferred steps.
- G2: Whenever the agent proposes skipping or deferring a step, the user sees that step named, the reason, and remaining work before the run proceeds; the final record preserves those choices — success signal: session note (or equivalent) lists each deferred/skipped step with reason.
- G3: Skill proposals always run on the lean path, grounded in the stated goal and available references (or explicit thin-evidence basis) — success signal: lean-path tests/docs show proposals even with no application files.
- G4: A user can install any one supported skill without installing the rest of its skill set, without removing or overwriting other installed skills or setup selections; list and non-interactive install are documented — success signal: installing only `create-prd` leaves other discovery skills absent, and a repeat install is a no-op for already-present skills.

**Non-goals**

- Abolishing skill sets (`ship` / `discovery`) as the default bulk opt-in mechanism.
- Redesigning brownfield re-run as the primary UX (re-run safety is required; lean defaults for existing heavy installs are out).
- Automatically completing stubs or building harness-score gaps during init.
- Changing the public contract that `setup` never creates or edits consumer `AGENTS.md`.

## User stories

### US-1: Lean init on a fresh repo

**As a** developer with a mostly empty new repository,
**I want** a lean `harness-init` path that captures my goal and essential choices and defers deep discovery/research/score-gap Q&A when evidence is thin,
**so that** I can reach first useful work without answering questions the repo cannot yet support.

Traces to goal: G1, G2

#### AC-1.1: Fresh repo completes lean init

**Given** a fresh repository with harness files from `setup` and a stated immediate goal
**When** the agent runs `harness-init` on the lean path
**Then** the run finishes without mandatory deep web research and without a question for every score-gap dimension, still produces a usable entry guide / session note, and records chosen and deferred steps

#### AC-1.2: Deferred steps are explicit before proceeding

**Given** the lean path proposes to skip or defer one or more named steps (by number/name)
**When** the agent presents that proposal
**Then** each deferred/skipped step is listed with why and what work remains, the user sees that list before the run proceeds, and the final session note preserves those choices

### US-2: Skill proposals always happen

**As a** developer on the lean init path,
**I want** skill proposals based on my stated goal even when the repo has little or no application code,
**so that** I can start with the tools I need instead of inventing architecture decisions.

Traces to goal: G3

#### AC-2.1: Goal-grounded proposals on thin evidence

**Given** a fresh repo with a stated goal and little or no application files
**When** lean `harness-init` reaches skill proposals
**Then** the agent proposes relevant skills citing the goal and available references (or states the thin-evidence basis), and unsupported tool or architecture decisions remain open

#### AC-2.2: Proposals are not skippable as a lean deferral

**Given** a lean init run that defers deeper discovery or research
**When** the run decides which steps to defer
**Then** skill proposals are never among the deferred/skipped steps

### US-3: Install one skill without the whole set

**As a** harness user who needs one skill (for example `create-prd`),
**I want** to install that skill alone without installing the rest of its skill set,
**so that** I do not take `prototype` and `handoff` just to draft a PRD.

Traces to goal: G4

#### AC-3.1: Single-skill install

**Given** a repo that already ran `setup` with some skill sets (or core only)
**When** the user installs only `create-prd` (or any one supported skill) via the documented command
**Then** that skill’s files are present, other skills from the same set that were not selected remain absent, and existing installed skills and setup selections are preserved

#### AC-3.2: Repeat install is safe

**Given** a skill is already installed
**When** the user repeats the single-skill install for that skill
**Then** the command does not remove or overwrite other installed skills or setup selections (idempotent / additive)

#### AC-3.3: List and non-interactive paths are documented

**Given** a user reading CLI help or package docs
**When** they look up individual skill installation
**Then** docs explain how to list available skills and how to install one non-interactively, and tests cover fresh-repo lean behavior and repeat-install behavior

## Scope

**In**

- Lean behavior for `harness-init` on new/mostly empty repos (deferrals, explicit skip list, always-on skill proposals, session-note recording).
- CLI `setup` surface: additive `--skill <name>` for individual skills (sets stay on `--skills`); listing via help / `--list-skills`.
- Docs (`README`, Pages/site, CLI help) for lean flow and individual skill install.
- Tests for fresh-repo lean path and repeat single-skill install.

**Out**

- Removing skill sets as a concept.
- Forcing existing repos that already completed full init to re-run lean mode.
- Auto-filling stubs or score gaps.
- Editing consumer `AGENTS.md` from `setup`.
- Issue #23 (The Fool / The Jury discovery skills).

## Open questions

None — resolved with Human (impersonator) before approval:

- **CLI:** Extend `setup` with additive `--skill <name>` (sets stay on `--skills`); document listing via help / `--list-skills`.
- **Lean deferrals:** May defer deep discovery Q&A, web research, and per-dimension score-gap questions; must still reach skill proposals (never deferred); record deferred steps in the session note.
- **Config:** Keep `skillSets` for whole opted-in sets; add additive individual `skills` list; do not mark a set installed from a single skill.

## Handoff

After approval → `code-spec`. This PRD does not authorize implementation.
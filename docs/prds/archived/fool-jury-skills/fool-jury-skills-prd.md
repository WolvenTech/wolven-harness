---
type: prd
title: Add The Fool and The Jury as optional discovery skills
description: Discovery workers get structured critique without a forced decision and a dissent-preserving verdict process via two new optional discovery skills.
status: deprecated
---

# Add The Fool and The Jury as optional discovery skills

## Problem

- **Who:** Discovery workers using the harness to shape ideas and decide between options before shipping work.
- **Pain:** Discovery workers using the harness cannot run a structured critique without a forced decision, or a dissent-preserving verdict process, because the optional discovery skill set does not include The Fool or The Jury.
- **Why now:** Discovery work needs both modes for the next release; grilling, create-prd, and research sit nearby but do not cover critique-without-decision or dissent-preserving verdict.
- **Evidence:** [Issue #23](https://github.com/WolvenTech/wolven-harness/issues/23); current `discovery` membership in `src/setup/skill-sets.ts` (`create-prd`, `prototype`, `handoff`); public inventory in `site/skills.md` and `README.md`.

## Goals

- G1: Installing the optional `discovery` skill set places `the-fool` and `the-jury` under `.agents/skills/` — success signal: setup with `--skills discovery` installs both folders; skill-set partition tests pass.
- G2: The skill catalog and generated agent entry guide state when to use each skill and how they differ from each other and from core `grilling` — success signal: `site/skills.md`, `README.md`, and rendered `WOLVEN.md` skills table describe Fool, Jury, and the distinction.
- G3: The Fool returns actionable challenges and supports a follow-up synthesis after the user responds — success signal: `the-fool` skill text requires challenges then user engagement then synthesis.
- G4: The Jury ships **five distinct juror agents**, runs them in a **parallel isolated** first round (no access to each other's first-round opinions), then runs a deliberation where jurors **can see each other's recorded verdicts**, and returns a dissent-preserving final verdict with confidence and one concrete test — success signal: five juror agent artifacts under `the-jury/agents/`, spawn-isolation instructions in the skill, and tests that reject single-agent persona simulation as the independence path.
- G5: Installation and validation work across the supported runtimes (claude, codex, cursor) — success signal: `pnpm test`, `pnpm validate` (after build), and skill-frontmatter checks pass with both skills present.

**Non-goals**

- Implementing #22 individual skill install (`setup --skill` / `--list-skills`).
- Changing or folding core `grilling`.
- Adding a new runtime dependency.
- Creating or editing a consumer's `AGENTS.md`.
- Copying unknown-license Jury source text (design may align with a known multi-juror protocol; the shipped text is harness-authored).

## User stories

### US-1: Install Fool and Jury with discovery

**As a** discovery worker,
**I want** The Fool and The Jury installed when I opt into the discovery skill set,
**so that** critique and verdict modes are available without taking unrelated ship skills.

Traces to goal: G1, G5

#### AC-1.1: Discovery set installs both skills

**Given** a git repo ready for setup
**When** I run `pnpm exec wolven-harness setup` with `--skills discovery` (plus required host/runtime flags)
**Then** `.agents/skills/the-fool/` and `.agents/skills/the-jury/` exist with valid `SKILL.md` frontmatter (`name`, `description`)

#### AC-1.2: Core-only install excludes them

**Given** a git repo ready for setup
**When** I run setup with `--skills none`
**Then** neither `the-fool` nor `the-jury` is installed under `.agents/skills/`

### US-2: Catalog distinguishes the modes

**As a** discovery worker,
**I want** the catalog and entry guide to say when to use Fool vs Jury vs grilling,
**so that** I pick critique, verdict, or interview deliberately.

Traces to goal: G2

#### AC-2.1: Public skills inventory names both

**Given** the published skills guide
**When** I read `site/skills.md` (and the README skill-set list)
**Then** both skills appear under discovery, with descriptions that state Fool challenges without forcing a decision and Jury delivers a dissent-preserving verdict, and grilling remains a distinct core skill

#### AC-2.2: Generated skills table includes both when installed

**Given** discovery skills are installed
**When** `WOLVEN.md` is rendered from skill frontmatter
**Then** the skills table includes `the-fool` and `the-jury` with their descriptions

### US-3: Run The Fool for critique

**As a** discovery worker with an idea still taking shape,
**I want** The Fool to challenge it with actionable points and then synthesize after I respond,
**so that** weak assumptions surface without being forced into a decision.

Traces to goal: G3

#### AC-3.1: Challenges then synthesis

**Given** the `the-fool` skill is installed
**When** an agent runs it against a thesis or plan
**Then** the skill instructs steelmanning, producing 3–5 concrete challenges, waiting for user response, then synthesizing — and does not require a final decision

#### AC-3.2: Mode selection is explicit

**Given** the `the-fool` skill is installed
**When** an agent starts a Fool session
**Then** the skill requires an explicit mode (or structured recommendation) rather than silently picking critique style

### US-4: Run The Jury for a verdict

**As a** discovery worker with a clear question and evidence,
**I want** The Jury to spawn five distinct juror agents for an isolated first round, then deliberate with shared first-round opinions, preserve dissent, and return a verdict with confidence and a concrete test,
**so that** I can decide between options without erasing disagreement or mistaking one model's persona labels for independent reviewers.

Traces to goal: G4

#### AC-4.1: Five juror agents, isolated first round, then shared deliberation

**Given** the `the-jury` skill is installed
**When** an agent runs it on a decision
**Then** the skill requires exactly five distinct juror agent artifacts, instructs spawning them in parallel with isolated first-round contexts (no juror sees another first-round opinion), records those opinions, then allows a deliberation where jurors can see the recorded first-round verdicts, and keeps dissent in the final output — and refuses single-agent persona simulation as the independence path

#### AC-4.2: Confidence and concrete test

**Given** a Jury run that reaches a verdict
**When** the skill describes the deliverable
**Then** the output must include a confidence statement and one concrete test that would change or confirm the verdict

#### AC-4.3: Verdict is advisory to the Human

**Given** a Jury run that reaches a verdict
**When** the skill describes authority
**Then** the skill states that the Human retains decision authority and the agent must not treat the verdict as authorization to execute side effects

### US-5: Compatible with future individual install

**As a** harness user who may later install one skill at a time,
**I want** Fool and Jury to be ordinary discovery skill folders,
**so that** a future `setup --skill` flow (#22) can install either alone without a second packaging change.

Traces to goal: G1

#### AC-5.1: Folders are first-class skill packages

**Given** the template tree
**When** I inspect `templates/.agents/skills/the-fool` and `templates/.agents/skills/the-jury`
**Then** each is a normal skill folder (not a special-case path), listed in `SET_SKILLS.discovery`, and not ask-only

#### AC-5.2: No pick-skill implementation in this change

**Given** this initiative's mutate scope
**When** the change ships
**Then** it does not add `setup --skill` / `--list-skills` (owned by #22)

## Scope

**In**

- `the-fool` and `the-jury` skill folders under `templates/.agents/skills/`
- Five harness-authored juror agent artifacts under `the-jury/agents/`
- Membership in `SET_SKILLS.discovery` and partition/count tests
- Catalog and README / site / discovery-set prompt copy updates
- MIT-adapted Fool content with attribution; harness-authored Jury aligned to the five-agent isolated-then-shared design
- Runtime-agnostic skill packaging (claude/codex/cursor via existing setup wiring)

**Out**

- #22 lean init and individual skill install CLI
- Changes to `grilling` behavior
- New npm runtime dependencies
- Editing consumer `AGENTS.md`

## Open questions

- None

## Handoff

After approval → `code-spec`. This PRD does not authorize implementation.

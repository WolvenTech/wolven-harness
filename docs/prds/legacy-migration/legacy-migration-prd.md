---
type: prd
title: Add legacy-migration as an optional discovery skill
description: Consumers planning a legacy modernization get a grill-then-explore-then-map discovery skill that delivers a plan-only map under docs/maps/, with no in-skill application-code mutation.
status: draft
---

# Add legacy-migration as an optional discovery skill

## Problem

- **Who:** Consumers planning a legacy modernization of a codebase that uses this harness.
- **Pain:** They cannot get a bound sequence that settles desired shape, then explores the repo, then delivers a phased plan with no in-skill application-code mutation, because `grilling`, `wayfinder`, and `research` exist as separate skills with no locked grill-then-explore-then-map order, and marketplace orchestrators rewrite code in-skill including big-bang cutover.
- **Why now:** Discovery work needs a plan-only modernization path; the separate skills do not lock that order, and marketplace skills stand up gateways and rewrite components in-skill, including a `--big-bang` cutover Fowler says usually fails.
- **Evidence:** [legacy-migration research note](../../notes/legacy-migration/legacy-migration-note.md); [Strangler Fig, Fowler, 22 Aug 2024](https://martinfowler.com/bliki/StranglerFigApplication.html); [Wolven Harness, 16 Oct 2026](https://notes.granola.ai/d/d2a65f61-9ce1-414f-8c6e-a05a36cea5d1); [AI Adoption Audit, 7 Aug 2026](https://notes.granola.ai/d/6f807348-9cdc-48cf-8aa5-62ba6dc1a7cf); [framework-migration-legacy-modernize SKILL.md](https://raw.githubusercontent.com/sickn33/antigravity-awesome-skills/main/skills/framework-migration-legacy-modernize/SKILL.md); current `discovery` membership in `src/setup/skill-sets.ts`; ADR-004.

Grilling ran in the parent session; the Human confirmed the problem as option A (grill-then-explore-then-map, no code mutation).

**Desired shape** means the outcomes the Human wants, not a frozen target stack named before seams exist. A **map** is a `docs/maps/<slug>/` folder: one `<slug>-map.md` holding the destination and what is settled, plus one file per **ticket**. A ticket is one unknown with a kind, a status, and the tickets that block it. This skill writes that shape; it does not run `wayfinder`.

## Goals

- G1: Installing the optional `discovery` skill set places `legacy-migration` under `.agents/skills/` — success signal: setup with `--skills discovery` installs the folder with valid `SKILL.md` frontmatter; skill-set partition tests pass.
- G2: The skill catalog and generated agent entry guide state when to use `legacy-migration` versus `grilling`, `wayfinder`, `research`, and the `code-spec` → `code-plan` → `code-execute` lane — success signal: `site/skills.md`, `README.md`, the setup discovery-set prompt, and rendered `WOLVEN.md` skills table describe the skill and those distinctions.
- G3: A run grills desired shape first, then explores the consumer repo, then writes a map under `docs/maps/` — success signal: skill text requires that order and that deliverable, and forbids a nested `wayfinder` call.
- G4: The skill mutates no application code and refuses big-bang cutover, in-skill rewrite, API-gateway cutover, and a five-phase implementation orchestrator as its job (`pragmatic-guard`) — success signal: skill text forbids those jobs and names a later `code-spec` → `code-plan` → `code-execute` ask for execution.

**Non-goals**

- In-skill application-code mutation.
- Calling `wayfinder` as a nested skill.
- Replacing `code-spec`, `code-plan`, or `code-execute`.
- A five-phase implementation orchestrator.
- A `--big-bang` cutover as this skill's job.
- Implementing `repo-explorer`.
- Working the map's tickets in this skill.
- Changing `grilling`, `wayfinder`, `research`, or `pragmatic-guard`.

## User stories

### US-1: Install legacy-migration with discovery

**As a** consumer who opts into discovery,
**I want** `legacy-migration` installed with the optional `discovery` skill set,
**so that** the grill-then-explore-then-map path is available without taking unrelated ship skills.

Traces to goal: G1

#### AC-1.1: Discovery set installs the skill

**Given** a git repo ready for setup
**When** I run `pnpm exec wolven-harness setup` with `--skills discovery` (plus required host/runtime flags)
**Then** `.agents/skills/legacy-migration/` exists with valid `SKILL.md` frontmatter (`name`, `description`), and `legacy-migration` is a member of `SET_SKILLS.discovery`

#### AC-1.2: Core-only install excludes it

**Given** a git repo ready for setup
**When** I run setup with `--skills none`
**Then** `legacy-migration` is not installed under `.agents/skills/`

### US-2: Catalog distinguishes the modes

**As a** consumer planning a legacy modernization,
**I want** the catalog and entry guide to say when to use `legacy-migration` versus `grilling`, `wayfinder`, `research`, and the code lane,
**so that** I pick a plan-only modernization map instead of an interview alone, a ticket-working map skill, a research note, or an in-skill rewrite.

Traces to goal: G2

#### AC-2.1: Public inventory names the skill and the distinction

**Given** the published skills guide
**When** I read `site/skills.md` and the README skill-set list
**Then** `legacy-migration` appears under discovery, described as grilling desired shape, then exploring the repo, then writing a map under `docs/maps/`, with no application-code mutation, and the copy keeps `grilling`, `wayfinder`, `research`, `code-spec`, `code-plan`, and `code-execute` as distinct skills

#### AC-2.2: Generated skills table includes it when installed

**Given** discovery skills are installed
**When** `WOLVEN.md` is rendered from skill frontmatter
**Then** the skills table includes `legacy-migration` with that description, and does not describe it as a replacement for `wayfinder` or the `code-spec` → `code-plan` → `code-execute` lane

### US-3: Grill desired shape first

**As a** consumer planning a legacy modernization,
**I want** `legacy-migration` to grill desired shape one question at a time before it explores the repo,
**so that** the map is aimed at outcomes I confirmed, not a stack guessed from the tree.

Traces to goal: G3

#### AC-3.1: Outcomes interview before explore or map

**Given** `legacy-migration` is installed
**When** an agent runs it for a legacy modernization
**Then** the skill starts by running `grilling` on desired shape, one question at a time, treats desired shape as outcomes rather than a frozen target stack, and does not explore the repo or write a map until the frontier is empty and the Human confirms

#### AC-3.2: Grilling missing or confirmation withheld

**Given** `grilling` is not installed, or the Human has not confirmed desired shape
**When** the skill would explore the repo or write a map
**Then** it does not; if `grilling` is missing it asks the same questions one at a time and names the command that installs `grilling`, and if confirmation is withheld it continues the interview or stops without a map

### US-4: Explore then write the map

**As a** consumer whose desired shape is confirmed,
**I want** the skill to explore the repo and then write a map under `docs/maps/`,
**so that** I get a phased plan in this harness's existing large-unknown shape, grounded in the tree, without a nested planner skill.

Traces to goal: G3

#### AC-4.1: Explore then map files

**Given** the Human has confirmed desired shape
**When** the run continues
**Then** the skill explores the consumer repo, then writes `docs/maps/<slug>/<slug>-map.md` with `type: map` and `status: draft` and the sections Destination, Notes, Decisions so far, Not yet specified, and Out of scope, writes one `<nn>-<ticket-slug>.md` per unknown numbered from `01` with a `ticket` kind of `research`, `prototype`, `grilling`, or `task`, shows the map path, and stops without claiming a ticket and without starting `code-spec`, `code-plan`, or `code-execute`

#### AC-4.2: No nested wayfinder and no third planner

**Given** a run that is ready to write the plan
**When** the Human asks it to call `wayfinder`, or to use a planner format other than a map under `docs/maps/`
**Then** the skill refuses the nested call and the third format, writes the map itself, and still does not require `wayfinder` to be installed

### US-5: Plan only — refuse rewrite jobs

**As a** consumer who needs a modernization plan,
**I want** this skill to leave application code untouched and refuse in-skill cutover,
**so that** execution stays a later `code-spec` → `code-plan` → `code-execute` ask.

Traces to goal: G4

#### AC-5.1: Map is the plan; application code is unchanged

**Given** a run that reaches a plan
**When** the skill hands back
**Then** no application-code file has been created or edited, and the required plan deliverable is the map under `docs/maps/`

#### AC-5.2: Big-bang, rewrite, gateway, and orchestrator refused

**Given** the Human asks for an in-skill rewrite, an API-gateway cutover, a five-phase implementation orchestrator, or `--big-bang`
**When** the skill would act
**Then** it refuses those as this skill's job, mutates no application code, and names a later `code-spec` → `code-plan` → `code-execute` ask for execution

## Scope

**In**

- The optional `legacy-migration` skill folder under `templates/.agents/skills/`
- Membership in `SET_SKILLS.discovery` and partition/count tests
- Catalog, README, site, setup discovery-set prompt, and generated `WOLVEN.md` copy
- Grill-then-explore-then-map behavior and the plan-only map deliverable under `docs/maps/`

**Out**

- In-skill application-code mutation
- Calling `wayfinder` as a nested skill
- Replacing `code-spec`, `code-plan`, or `code-execute`
- A five-phase implementation orchestrator
- `--big-bang`
- Implementing `repo-explorer`
- Working the map's tickets in this skill

## Open questions

- How `legacy-migration` sequences or hands off relative to `repo-explorer` (same release train; this PRD does not specify `repo-explorer` requirements) — owner: Human
- Whether this skill may also write a research note, draft ADRs, or a PRD besides the map — owner: Human

## Handoff

After approval → `code-spec`. This PRD does not authorize implementation.

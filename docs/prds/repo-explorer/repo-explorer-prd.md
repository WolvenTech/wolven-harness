---
type: prd
title: Add repo-explorer as an optional discovery skill
description: Consumers on undocumented or brownfield repos get a deep dive and a picker of proposed ADRs, then only the Human's picks become draft profile ADRs through adr.
status: draft
---

# Add repo-explorer as an optional discovery skill

## Problem

- **Who:** Consumers on an undocumented or brownfield repo using the harness.
- **Pain:** Consumers on an undocumented or brownfield repo cannot fill the harness's claim-checked ADR collection from a repo deep dive, because `harness-init` writes skill stubs not ADRs, `adr` records one confirmed decision at a time with no candidate menu, and nothing presents a Human-chosen list of draft ADRs for QMD to index after promotion.
- **Why now:** The 16 Oct 2026 harness session named ADR generation from an undocumented codebase, and the 7 Aug 2026 adoption audit required engineers to review those records before they become ground truth. `harness-init` and `adr` still leave that gap.
- **Evidence:** [repo-explorer research note](../../notes/repo-explorer/repo-explorer-note.md); [Wolven Harness, 16 Oct 2026](https://notes.granola.ai/d/d2a65f61-9ce1-414f-8c6e-a05a36cea5d1); [AI Adoption Audit, 7 Aug 2026](https://notes.granola.ai/d/6f807348-9cdc-48cf-8aa5-62ba6dc1a7cf); ADR-000, ADR-001, ADR-004; `.claude/skills/adr/SKILL.md`; `.claude/skills/harness-init/SKILL.md`; `src/setup/skill-sets.ts`.

Grilling ran in the parent session; the Human confirmed this problem as option A (propose-then-choose ADRs).

A **proposed ADR** is one item on the **picker**: a Human-facing list of candidate decisions from the deep dive. The picker is not an ADR file. A proposed ADR consumes no `ADR-NNN` until the Human picks it and the `adr` skill writes a `draft` profile ADR.

## Goals

- G1: Installing the optional `discovery` skill set places `repo-explorer` under `.agents/skills/` — success signal: setup with `--skills discovery` installs the folder with valid `SKILL.md` frontmatter; skill-set partition tests pass.
- G2: The skill catalog and generated agent entry guide state when to use `repo-explorer` versus `harness-init` and `adr` — success signal: `site/skills.md`, `README.md`, the setup discovery-set prompt, and rendered `WOLVEN.md` skills table describe the skill and those distinctions.
- G3: A run deep-dives the consumer repo and presents a picker of proposed ADRs, not ADR files — success signal: a run on an undocumented or brownfield repo shows a Human-facing list grounded in patterns, tools, tech debt, and architecture or design, and writes no `docs/adrs/` file before a pick.
- G4: Picked items become `draft` profile ADRs only through `adr`; nothing auto-promotes or cites them until `stable` — success signal: each pick yields `docs/adrs/adr-NNN-<slug>.md` with `status: draft` via `adr`; `repo-explorer` itself writes no file under `docs/adrs/`; a claim to that number in another tracked file fails `validate` as `claim-draft`.
- G5: Unpicked proposed ADRs consume no `ADR-NNN`, and `qmd update` is later, not in-skill — success signal: after a run where the Human picks a subset or none, unpicked items leave the next free ADR number unchanged, and the skill does not run `qmd update`.

**Non-goals**

- Auto-promoting a `draft` profile ADR to `stable`.
- Writing ADRs without a Human pick.
- Extending `harness-init` to emit ADRs instead of adding `repo-explorer`.
- Mutating application code.
- Running `qmd update` (or `qmd embed`) inside the skill.
- Replacing `adr` as the path that creates, promotes, or supersedes profile ADRs.
- Implementing `legacy-migration`.

## User stories

### US-1: Install repo-explorer with discovery

**As a** consumer who opts into discovery,
**I want** `repo-explorer` installed with the optional `discovery` skill set,
**so that** the deep-dive and picker are available without taking unrelated ship skills.

Traces to goal: G1

#### AC-1.1: Discovery set installs the skill

**Given** a git repo ready for setup
**When** I run `pnpm exec wolven-harness setup` with `--skills discovery` (plus required host/runtime flags)
**Then** `.agents/skills/repo-explorer/` exists with valid `SKILL.md` frontmatter (`name`, `description`), and `repo-explorer` is a member of `SET_SKILLS.discovery`

#### AC-1.2: Core-only install excludes it

**Given** a git repo ready for setup
**When** I run setup with `--skills none`
**Then** `repo-explorer` is not installed under `.agents/skills/`

### US-2: Catalog distinguishes the modes

**As a** consumer choosing how to document architecture,
**I want** the catalog and entry guide to say when to use `repo-explorer` versus `harness-init` and `adr`,
**so that** I do not confuse skill stubs, one confirmed decision, and a propose-then-choose deep dive.

Traces to goal: G2

#### AC-2.1: Public inventory names the skill and the distinction

**Given** the published skills guide
**When** I read `site/skills.md` and the README skill-set list
**Then** `repo-explorer` appears under discovery, described as a deep dive that presents a picker of proposed ADRs and writes picked items through `adr` as `draft`, and the copy states that `harness-init` still writes skill stubs not ADRs and that `adr` still records one confirmed decision at a time

#### AC-2.2: Generated skills table includes it when installed

**Given** discovery skills are installed
**When** `WOLVEN.md` is rendered from skill frontmatter
**Then** the skills table includes `repo-explorer` with that description, and does not describe it as a replacement for `adr` or `harness-init`

### US-3: Deep-dive then picker

**As a** consumer on an undocumented or brownfield repo,
**I want** `repo-explorer` to deep-dive the tree and present a picker of proposed ADRs,
**so that** I can choose which decisions to record without treating the list as an ADR.

Traces to goal: G3

#### AC-3.1: Deep-dive yields a picker, not an ADR file

**Given** `repo-explorer` is installed on an undocumented or brownfield consumer repo
**When** an agent runs it
**Then** the skill instructs a deep dive of patterns, tools, tech debt, and architecture or design, then presents a picker of proposed ADRs each naming a candidate decision and the repo evidence that grounded it, and writes no file under `docs/adrs/` and no application source before the Human picks

#### AC-3.2: Nothing decision-shaped

**Given** a run whose deep dive finds no decision-shaped candidate
**When** the skill would present the picker
**Then** it presents an empty picker, writes no `docs/adrs/` file, consumes no `ADR-NNN`, and does not invent a decision

#### AC-3.3: Existing profile ADRs are not re-proposed

**Given** `docs/adrs/` already holds a profile ADR for a decision the deep dive also found
**When** the skill builds the picker
**Then** that decision is not a proposed ADR, and the run consumes no new `ADR-NNN` for it

### US-4: Picks become drafts through adr

**As a** consumer who has seen the picker,
**I want** only the items I pick written through `adr` as `status: draft`,
**so that** the claim gate still fails closed until I promote a profile ADR to `stable`.

Traces to goal: G4

#### AC-4.1: Picked items go through adr as draft

**Given** a picker of proposed ADRs and an installed `adr` skill
**When** the Human picks one or more items
**Then** each pick is written through `adr` as `docs/adrs/adr-NNN-<slug>.md` with `status: draft`, `repo-explorer` itself creates no file under `docs/adrs/`, and unpicked items are not written

#### AC-4.2: No auto-promote and no cite until stable

**Given** `adr` has just written a `draft` profile ADR from a pick
**When** the run continues
**Then** the skill does not change that file to `status: stable`, and it cites that `ADR-NNN` or `adr-NNN-<slug>` in no other tracked file until the Human later promotes it through `adr`

#### AC-4.3: No write without a pick

**Given** a picker that still has no Human pick
**When** the run would create a profile ADR
**Then** it writes no file under `docs/adrs/` and consumes no `ADR-NNN`

### US-5: Unpicked items and later QMD

**As a** consumer who picks a subset or none,
**I want** unpicked proposed ADRs to take no number and QMD left for later,
**so that** skipped ideas do not burn `ADR-NNN` and drafts are not treated as indexed ground truth in-skill.

Traces to goal: G5

#### AC-5.1: Unpicked candidates consume no number

**Given** a picker of several proposed ADRs
**When** the Human picks a subset or picks none
**Then** each unpicked item leaves no ADR file and does not occupy an `ADR-NNN`, so the next free number is the same as if those items had never been proposed

#### AC-5.2: QMD update is not in-skill

**Given** a run that has written zero or more `draft` profile ADRs through `adr`
**When** the skill reaches hand-back
**Then** it does not run `qmd update` or `qmd embed`, and it tells the Human that QMD indexes those records later, after promotion to `stable` and a later `qmd update`

## Scope

**In**

- The optional `repo-explorer` skill folder under `templates/.agents/skills/`
- Membership in `SET_SKILLS.discovery` and partition/count tests
- Catalog, README, site, setup discovery-set prompt, and generated `WOLVEN.md` copy
- Picker → draft-via-`adr` behavior, including empty pickers, existing profile ADRs, unpicked items, no auto-promote, and no cite until `stable`

**Out**

- Auto-promote, and any cite of a `draft` profile ADR
- Writing ADRs without a Human pick
- Extending `harness-init` to write ADRs or replacing `adr`
- Mutating application code
- In-skill `qmd update` / `qmd embed`
- Implementing `legacy-migration`

## Open questions

- How `repo-explorer` sequences or hands off relative to `legacy-migration` (same release train; this PRD does not specify `legacy-migration` requirements) — owner: Human
- How many proposed ADRs one run may present before the picker stops being choosable — owner: Human

## Handoff

After approval → `code-spec`. This PRD does not authorize implementation.

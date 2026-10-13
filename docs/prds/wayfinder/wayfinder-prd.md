---
type: prd
title: Wayfinder Skill
description: Requires a discovery-set wayfinder skill that charts a decision's open unknowns as ticket files under docs/maps/ and works them one session at a time, drawn on a canvas it shares with journey-map, so their state survives across sessions until the decision is ready for a PRD or spec.
status: draft
---

# Wayfinder Skill

## Problem

- **Who:** A Human in a consumer repo working a decision that is not yet ready for a PRD, because several unknowns each need a research note, a prototype, a grilling or a task outside the chat first.
- **Pain:** The Human loses track, across sessions, of which unknowns are open, what blocks what, and what has been resolved, so research, prototype and grilling work gets redone, skipped or quietly assumed. `grilling` settles only what one conversation can settle.
- **Why now:** The `journey-map` PRD on PR #58 dropped its ticket kind and names planning tickets and the wayfinder map as this PRD's work, so ticket trees have no home until this skill ships. The removed ticket rendering is intact at commit `2238220` on the #58 branch. The Human has decided to build the skill. This PRD meets trigger 2 of the [wayfinder deferral](../../deferrals/wayfinder-maps/wayfinder-maps-deferral.md).
- **Evidence:** One expected case: the UX design engagement with discovery phases named in the `journey-map` PRD, which is still being sold. No map has been charted for it yet, so demand beyond that case is an assumption.

A **map** here is a `docs/maps/<slug>/` folder: one `<slug>-map.md` holding the destination and what is settled, plus one file per ticket. A **ticket** is one unknown with a kind, a status and the tickets that block it. The **canvas** is the pan-and-zoom whiteboard renderer `journey-map` ships, with its notes and "Copy for agent"; this PRD makes it a shared install both skills load. The **frontier** keeps the meaning `grilling` gives it: every `open` ticket whose blockers are all `closed`.

## Goals

- Ticket state survives sessions. — success signal: a fresh session asked to continue a map names the same frontier and claimed tickets the files record, without the Human restating anything.
- Every unknown is resolved through the matching skill and recorded. — success signal: every `closed` ticket has a `## Resolution` that links its note, records its prototype verdict, or states its grilling answer or task outcome.
- The Human sees the plan on a canvas. — success signal: after any ticket change, the map's canvas shows each ticket's status and blocked-by edges exactly as the ticket files hold them.
- One canvas serves both skills. — success signal: `wayfinder` and `journey-map` load the same installed canvas files, installing either skill alone installs the canvas, and every `journey-map` map draws as it did before the move.
- A map ends in a PRD or spec. — success signal: when the destination is reached, wayfinder hands off to `create-prd` or `code-spec` with the map's decisions as input, and the map moves to `docs/maps/archived/<slug>/`.
- The skill and its folder ship with a recorded contract change. — success signal: `setup --skills discovery` installs `wayfinder` and `docs/maps/`, `validate` checks `<slug>-map.md`, ADR-004 is amended for the doc folder and the shared canvas, and an install without discovery has no `docs/maps/`.

**Non-goals**

- Coordinating parallel agents beyond the `claimed` status: no locking, no lease expiry.
- `validate` checks on ticket files: their frontmatter, kinds, statuses or `blocked_by` names.
- Changes to `grilling`, `research`, `prototype`, `create-prd`, `code-spec` or any other shipped skill, and any reference to `wayfinder` from them.
- `setup` editing an existing `.qmd/index.yml` or `AGENTS.md`.
- Changes to how a `journey-map` map looks or behaves. Only where its canvas code is installed from changes.
- A `ticket` kind in `journey-map`'s JSON trees: a ticket node still fails `journey-map` validation.
- The `harness-init` redesign.

## User stories

### US-1: Chart a map

**As a** Human facing a decision with several open unknowns,
**I want** the agent to chart them as tickets with what blocks what,
**so that** the plan exists in files rather than in one conversation.

Traces to goal: Ticket state survives sessions.

#### AC-1.1: First chart

**Given** a consumer repo with `wayfinder` installed and no map for the work
**When** the Human asks for a map, or accepts the agent's one-line offer of one
**Then** the agent runs `grilling` to settle the destination, writes `docs/maps/<slug>/<slug>-map.md` with `type: map` and `status: draft` and the sections Destination, Notes, Decisions so far, Not yet specified and Out of scope, writes one `<nn>-<ticket-slug>.md` per unknown with `title`, `ticket`, `status: open`, `claimed_by` and `blocked_by` frontmatter and a `## Question` body, shows the frontier, and `validate` passes

#### AC-1.2: Settled in the chat

**Given** an unknown that the grilling settles during charting
**When** the agent writes the map
**Then** the answer goes under Decisions so far and no ticket is written for it

#### AC-1.3: Map already exists

**Given** `docs/maps/<slug>/<slug>-map.md` already exists for the work
**When** the Human asks for a map with the same slug
**Then** the agent resumes that map and shows its frontier instead of overwriting any file

### US-2: Work one ticket per session

**As a** Human returning to a map in a new session,
**I want** the agent to pick up a frontier ticket and resolve it through the right skill,
**so that** each unknown is worked once and its answer is recorded.

Traces to goal: Ticket state survives sessions; Every unknown is resolved through the matching skill and recorded.

#### AC-2.1: Claim, resolve, stop

**Given** a map with a frontier ticket
**When** the Human asks to continue the map
**Then** the agent sets the ticket's `status: claimed` and `claimed_by` before any work, resolves it through `research`, `prototype` or `grilling` by its kind (or records the Human's outcome for a `task`), writes `## Resolution`, sets `status: closed`, shows the new frontier and stops; "next" from the Human continues in the same session

#### AC-2.2: Blocked tickets are not offered

**Given** an `open` ticket whose `blocked_by` names a ticket that is not `closed`
**When** the agent shows the frontier
**Then** that ticket is not on it

#### AC-2.3: Claim left by an earlier session

**Given** a ticket with `status: claimed` from a session that did not close it
**When** the Human asks to continue the map
**Then** the agent names the claimed ticket and asks whether to resume or release it, and never takes it over silently

#### AC-2.4: Prototype with no PRD

**Given** a `prototype` ticket on a map with no PRD yet
**When** `prototype` reaches its verdict
**Then** the verdict is recorded in the ticket's `## Resolution`, the place the Human names under `prototype`'s existing no-PRD rule

### US-3: Graduate fog into tickets

**As a** Human whose answers keep revealing new unknowns,
**I want** each resolution to update the map,
**so that** new unknowns become tickets instead of side notes.

Traces to goal: Ticket state survives sessions.

#### AC-3.1: New unknowns

**Given** a resolution that reveals a new unknown, or that settles the prerequisites of an item under Not yet specified
**When** the agent closes the ticket
**Then** it writes a new ticket for each such unknown with its `blocked_by`, and removes a graduated item from Not yet specified

#### AC-3.2: Ticket no longer needed

**Given** a resolution that makes another open ticket moot
**When** the agent closes the first ticket
**Then** it closes the moot ticket with a `## Resolution` that says why it was dropped, after the Human agrees

### US-4: See the plan on the canvas

**As a** Human reviewing a map,
**I want** the tickets drawn on the canvas,
**so that** I see open, claimed, closed and blocked work at once.

Traces to goal: The Human sees the plan on a canvas.

#### AC-4.1: Canvas regenerated from tickets

**Given** a map with ticket files
**When** any ticket is written or changes status
**Then** the agent rewrites `<slug>-map.json` and `<slug>-map.html` beside `<slug>-map.md` from the ticket files alone, the page shows every ticket at once with a status stripe and dot, a `claimed_by` avatar, `blocked_by` edges and a "blocked" pill while any blocker is not `closed`, and a hand edit to the JSON is overwritten by that rewrite

#### AC-4.2: Canvas missing

**Given** the shared canvas is not installed beside `wayfinder`, as in an older install whose differing folders were preserved
**When** the agent charts or works a map
**Then** the tickets, frontier and handoff work unchanged, the agent says once which install command restores the canvas, and no JSON or HTML is written

#### AC-4.3: Feedback names tickets

**Given** the Human left a note on a ticket card
**When** they press "Copy for agent" and paste the text into chat
**Then** each line names the ticket's file name and title, and the agent edits that ticket file, not the JSON

### US-5: Hand off when the destination is reached

**As a** Human whose unknowns are resolved,
**I want** the map handed to the next skill and put away,
**so that** the decision moves on and the frontier scan stops showing it.

Traces to goal: A map ends in a PRD or spec.

#### AC-5.1: Handoff and archive

**Given** a map whose frontier is empty and whose destination the Human confirms is reached
**When** the agent hands off
**Then** it names `create-prd` for a product problem or `code-spec` for a confirmed code-shaped ask, with the map's Decisions so far as input, sets the map's `status: deprecated`, and moves the folder to `docs/maps/archived/<slug>/`, which no frontier scan reads

#### AC-5.2: Open tickets at handoff

**Given** the Human asks to hand off while tickets are still `open` or `claimed`
**When** the agent hands off
**Then** it lists those tickets and asks the Human to confirm before archiving, and the handoff carries them as open questions

### US-6: Install and validate maps

**As a** consumer installing the harness,
**I want** `wayfinder` and `docs/maps/` to arrive with the discovery set and be checked like other doc folders,
**so that** maps follow the same layout rules as PRDs and notes.

Traces to goal: The skill and its folder ship with a recorded contract change.

#### AC-6.1: Installed with discovery

**Given** a repo with no prior install
**When** the Human runs `wolven-harness setup --skills discovery`
**Then** `wayfinder/` lands in each chosen runtime's skills folder, and setup creates `docs/maps/.gitkeep`, a `maps` collection in `.qmd/index.yml`, and a `docs/maps/<slug>/` row in `WOLVEN.md`

#### AC-6.2: Absent without discovery

**Given** a repo with no prior install
**When** the Human runs `setup --skills ship` or `--skills none`
**Then** no `wayfinder/`, no `docs/maps/`, no `maps` collection and no maps row exist, and in the package repo the skill-set partition test passes with `wayfinder` under `discovery`

#### AC-6.3: Main doc checked, tickets not

**Given** `docs/maps/x/x-map.md` and ticket files beside it
**When** `validate` runs
**Then** it passes with `type: map`, fails naming the type rule with any other `type`, fails when the folder has no `x-map.md`, does not check the ticket files, and skips `docs/maps/archived/**`

#### AC-6.4: Existing install missing pieces

**Given** an existing install that lacks `docs/maps/`, the `maps` collection or the maps router row
**When** the agent first charts a map there
**Then** it names each missing piece with the exact lines to add, creates only the map's own folder and files, and edits neither `.qmd/index.yml` nor `AGENTS.md`

### US-7: Share one canvas with journey-map

**As a** consumer who installs `wayfinder`, `journey-map` or both,
**I want** one canvas both skills load,
**so that** a fix to the canvas lands once and neither skill depends on the other being installed.

Traces to goal: One canvas serves both skills; The skill and its folder ship with a recorded contract change.

#### AC-7.1: Either skill brings the canvas

**Given** a directory with no skills installed
**When** the Human runs `wolven-harness skills --skills wayfinder`, or `--skills journey-map`
**Then** the chosen skill and the shared canvas land in each chosen runtime's load path, and its maps draw with no other skill installed

#### AC-7.2: Installed once

**Given** both `wayfinder` and `journey-map` are chosen
**When** `setup --skills discovery` or `skills` runs
**Then** the shared canvas is written once per load path, and both skills load it from there

#### AC-7.3: journey-map unchanged

**Given** the `journey-map` fixtures and tests on `main` when this work starts
**When** `journey-map` loads the shared canvas instead of its own copy
**Then** every fixture draws as before, those tests pass unchanged, and a `ticket` node still fails `journey-map` validation

#### AC-7.4: Canvas differs on disk

**Given** an installed shared canvas whose files differ from the package copy
**When** `skills` runs without a terminal
**Then** the canvas is preserved and the run succeeds, as ADR-004 already treats a differing skill folder

## Scope

**In**

- A `wayfinder` skill under `templates/.agents/skills/`, added to `SET_SKILLS.discovery`, covering chart, claim, resolve, graduate and hand off.
- `docs/maps/<slug>/<slug>-map.md` as a governed doc folder with `type: map`, checked by `validate` for the main doc only, with `archived/` skipped.
- `setup` creating `docs/maps/.gitkeep`, the `maps` QMD collection and the router row only when discovery is installed, and `WRITING-PROFILE.md` documenting the folder and type.
- A shared canvas install, moved out of `journey-map` and loaded by both skills, with the ticket card seeded from commit `2238220`: status stripe and dot, `claimed_by` avatar, `blocked_by` edges with a "blocked" pill, and a ticket tree that is always fully shown.
- `journey-map` loading the shared canvas instead of its own copy.
- An ADR-004 amendment for the new doc folder and type and for the shared canvas, which relaxes "Only chosen skill folders are copied", and a minor release.
- Writing the map's JSON and HTML from the ticket files.
- Closing the wayfinder deferral: tick trigger 2, set `status: deprecated`, and move it to `docs/deferrals/archived/wayfinder-maps/`.

**Out**

- Everything listed under Non-goals.
- Shipping before `journey-map` (PR #58) merges, since the shared canvas moves its renderer.
- Architecture diagrams and service blueprints, deferred to their own skills (`docs/deferrals/architectural-map/`, `docs/deferrals/service-blueprint/` on PR #58).

## Open questions

- The value written to `claimed_by`, and the `<nn>` numbering rule for ticket files. — owner: `code-spec`
- Where the shared canvas installs, its folder name, and how `setup` and `skills` copy it and offer it at the prompt. — owner: `adr`, then `code-spec`
- Whether ticket trees reuse `journey-map`'s JSON format with a `ticket` kind only `wayfinder` may write, or get their own format the canvas reads. — owner: `code-spec`
- Whether `WRITING-PROFILE.md` lists the maps row in every install or only with discovery. — owner: `code-spec`
- Whether the UX engagement goes ahead and supplies the first real map. — owner: Rafael

## Handoff

After approval → `adr` for the shared canvas install, then `code-spec`. This PRD does not authorize implementation.

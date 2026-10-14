---
type: prd
title: Wayfinder Skill
description: Requires a discovery-set wayfinder skill that charts a decision's open unknowns as ticket files under docs/maps/ and works them one session at a time, drawn by a canvas renderer it shares with journey-map, so their state survives across sessions until the decision is ready for a PRD or spec.
status: stable
---

# Wayfinder Skill

## Problem

- **Who:** A Human in a consumer repo working a decision that is not yet ready for a PRD, because several unknowns each need a research note, a prototype, a grilling or a task outside the chat first.
- **Pain:** The Human loses track, across sessions, of which unknowns are open, what blocks what, and what has been resolved, so research, prototype and grilling work gets redone, skipped or quietly assumed. `grilling` settles only what one conversation can settle.
- **Why now:** The [`journey-map` PRD](../archived/journey-map/journey-map-prd.md), shipped on PR #58, dropped its ticket kind and names planning tickets and the wayfinder map as this PRD's work, so ticket trees have no home until this skill ships. The removed ticket rendering is intact at commit `2238220`, which GitHub keeps under `refs/pull/58/head`. The Human has decided to build the skill and the canvas is the reason: without it, adopting the upstream skill would do. Trigger 2 of the [wayfinder deferral](../../deferrals/archived/wayfinder-maps/wayfinder-maps-deferral.md), "The Human opens a spec for it", was met on 2026-10-14, when `code-spec` opened on this PRD.
- **Evidence:** One expected case: the UX design engagement with discovery phases named in the `journey-map` PRD, which is still being sold. No map has been charted for it yet, so demand beyond that case is an assumption.
- **Origin:** The method, with its destination, frontier, fog, claims and four ticket kinds, comes from Matt Pocock's MIT-licensed `wayfinder` skill in `mattpocock/skills`; `rengwu/wayfinder-maps` suggested the stale claim, the out-of-scope status and the undermined mark. This PRD borrows ideas only: the skill's text and file format are written here.

A **map** here is a `docs/maps/<slug>/` folder: one `<slug>-map.md` holding the destination and what is settled, plus one file per ticket. A **ticket** is one unknown with a kind, a status (`open`, `claimed`, `closed` or `out_of_scope`) and the tickets that block it. Ticket numbers start at `01`, are never reused, and a ticket file is never deleted, only closed. A ticket is **undermined** when a later resolution broke its premise: it keeps `status: closed` but no longer counts as closed for the tickets it blocks. The map is an **index**: each decision lives in exactly one ticket, the map holds a one-line gist and a link per decision, and it never writes a progress count. The **canvas** is the renderer `journey-map` ships, with its pan, zoom, notes and "Copy for agent"; this PRD keeps one source of it in the package, ships inside each skill's folder an identical copy of each renderer file that skill loads and no other, and adds a **radial layout** that draws a ticket tree from the destination outward. The **frontier** is every `open` ticket whose blockers are all `closed` and none undermined, plus every undermined ticket.

**Prototype verdict (2026-10-14):** the question was which canvas shows a map's state at a glance. Five throwaway variants were drawn from one real map at three commits and a synthetic 30-ticket map: the ticket card from commit `2238220`, a board, a bubble tree, and two radial layouts. The Human chose the inward radial layout, with the destination at the centre and decided work outside. A jury of five agreed unanimously at medium confidence and required the fixes now written into US-4. The prototype code is discarded; its design is promoted into US-4 and Scope.

## Goals

- Ticket state survives sessions. — success signal: a fresh session asked to continue a map names the same frontier and claimed tickets the files record, without the Human restating anything.
- Every unknown is resolved through the matching skill and recorded. — success signal: every `closed` ticket has a `## Resolution` that links its note, records its prototype verdict, or states its grilling answer or task outcome, and every `out_of_scope` ticket's `## Resolution` says why.
- The map does not drift. — success signal: after every `wayfinder` commit, each `blocked_by` names an existing ticket, each status matches its closing section, and each `closed` ticket appears once under Decisions so far.
- The Human sees the plan on a canvas. — success signal: a canvas built at any moment shows each ticket's status, blocked-by edges and undermined mark exactly as the ticket files hold them.
- One canvas serves both skills. — success signal: `wayfinder` and `journey-map` ship renderer files byte-identical to one source, each skill only the files it loads, a package test fails when a copied file differs or a skill folder holds a file outside its list, either skill draws its maps with the other not installed, and every `journey-map` map draws as it did before.
- A map ends in a PRD or spec. — success signal: when the destination is reached, wayfinder hands off to `create-prd` or `code-spec` with the map's decisions as input, and the map moves to `docs/maps/archived/<slug>/`.
- The skill and its folder ship with a recorded contract change. — success signal: `setup --skills discovery` installs `wayfinder` and `docs/maps/`, `validate` checks `<slug>-map.md` at warning level, ADR-004 is amended for the doc folder, its type and the set-dependent setup paths, and an install without discovery has no `docs/maps/`.

**Non-goals**

- More than one session working a map at once: `claimed`, `claimed_by` and `claimed_at` mark work but lock nothing, and a stale claim is reported, never released on its own.
- `validate` checks on ticket files: their frontmatter, kinds, statuses or `blocked_by` names. The skill's checklist covers them instead (AC-2.5).
- Committing the canvas: its JSON and HTML are built on demand beside the map and ignored by git.
- Changes to `grilling`, `research`, `prototype`, `create-prd`, `code-spec` or any other shipped skill, and any reference to `wayfinder` from them.
- `setup` editing an existing `.qmd/index.yml` or `AGENTS.md`.
- Changes to how a `journey-map` map looks or behaves. The shared renderer gains the radial layout, in its own file and chosen only for a tree of `ticket` nodes, an allowed-kinds parameter, and a canvas core (camera, error panel, copy) moved out of `journey-map`'s drawing code unchanged, so both skills run the same copy of it; the existing layout code is untouched.
- A canvas installed outside a skill folder, or a skill that depends on another being installed.
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
**Then** the agent runs `grilling` to settle the destination, writes `docs/maps/<slug>/<slug>-map.md` with `type: map` and `status: draft` and the sections Destination, Notes, Decisions so far, Not yet specified and Out of scope, writes one `<nn>-<ticket-slug>.md` per unknown, numbered from `01`, with `title`, `ticket`, `status: open` and `blocked_by` frontmatter and a `## Question` body, shows the frontier, and stops without claiming a ticket, and `validate` passes

#### AC-1.2: Settled in the chat

**Given** an unknown the Human answers during the charting grilling
**When** the agent writes the map
**Then** it records the answer as a ticket written with `status: closed` and a `## Resolution` stating it, and adds a one-line gist and a link under Decisions so far; recording an answer already given is not resolving a ticket

#### AC-1.3: Map already exists

**Given** `docs/maps/<slug>/<slug>-map.md` already exists for the work
**When** the Human asks for a map with the same slug
**Then** the agent resumes that map and shows its frontier instead of overwriting any file

### US-2: Work one ticket per session

**As a** Human returning to a map in a new session,
**I want** the agent to pick up a frontier ticket and resolve it through the right skill,
**so that** each unknown is worked once and its answer is recorded.

Traces to goal: Ticket state survives sessions; Every unknown is resolved through the matching skill and recorded; The map does not drift.

#### AC-2.1: Claim, resolve, stop

**Given** a map with a frontier ticket
**When** the Human asks to continue the map
**Then** the agent sets the ticket's `status: claimed`, `claimed_by` to the runtime's session or agent id, or the runtime's name when it exposes no id, and `claimed_at` to the current time before any work, resolves it through `research`, `prototype` or `grilling` by its kind (or records the Human's outcome for a `task`), writes `## Resolution`, sets `status: closed`, adds a one-line gist and a link under Decisions so far, shows the new frontier and stops; the session resolves no second ticket, and continuing means a fresh session

#### AC-2.2: Blocked tickets are not offered

**Given** an `open` ticket whose `blocked_by` names a ticket that is not `closed`, or one that is `closed` and undermined
**When** the agent shows the frontier
**Then** that ticket is not on it

#### AC-2.3: Claim left by an earlier session

**Given** a ticket with `status: claimed` from a session that did not close it
**When** the Human asks to continue the map
**Then** the agent names the claimed ticket and its `claimed_at`, says the claim is stale when it is older than 72 hours, and asks whether to resume or release it, and never takes it over or releases it silently

#### AC-2.4: Prototype with no PRD

**Given** a `prototype` ticket on a map with no PRD yet
**When** `prototype` reaches its verdict
**Then** the verdict is recorded in the ticket's `## Resolution`, the place the Human names under `prototype`'s existing no-PRD rule

#### AC-2.5: Checklist before commit

**Given** a session that changed the map or any ticket
**When** it is about to commit
**Then** the agent runs the skill's checklist and fixes every failure first: each `blocked_by` names an existing ticket other than itself, no `blocked_by` cycle exists, each status matches its closing section, `claimed_by` and `claimed_at` appear together, each `closed` ticket appears once under Decisions so far and each `out_of_scope` ticket once under Out of scope, no ticket number is reused or ticket file deleted, and no progress count is written

#### AC-2.6: Resolving skill not installed

**Given** a frontier ticket whose kind needs `research`, `prototype` or `grilling`, and that skill is not installed
**When** the agent picks the ticket
**Then** it names the missing skill and the command that installs it, and leaves the ticket `open` unless the Human asks to work it in plain conversation, in which case the `## Resolution` says no skill was used

### US-3: Keep the map current as answers land

**As a** Human whose answers keep revealing new unknowns and overturning old ones,
**I want** each resolution to update the map,
**so that** new unknowns become tickets, dead ends are ruled out, and a broken decision is redone instead of trusted.

Traces to goal: Ticket state survives sessions.

#### AC-3.1: New unknowns

**Given** a resolution that reveals a new unknown, or that settles the prerequisites of an item under Not yet specified
**When** the agent closes the ticket
**Then** it writes a new ticket for each such unknown with its `blocked_by`, and removes a graduated item from Not yet specified

#### AC-3.2: Ticket ruled out

**Given** a resolution that makes another open ticket moot or shows it sits beyond the destination
**When** the agent closes the first ticket
**Then**, after the Human agrees, it sets the other ticket's `status: out_of_scope` with a `## Resolution` that says why, lists it under Out of scope and never under Decisions so far, never counts it as closed for the tickets it blocks, and, for each ticket left blocked by it, asks the Human to either remove that `blocked_by` edge or rule the blocked ticket out as well, so no ticket stays off the frontier for good

#### AC-3.3: Decision undermined

**Given** a resolution that breaks the premise of a `closed` ticket
**When** the agent closes the resolving ticket
**Then**, after the Human agrees, it sets `undermined_by` on the broken ticket naming the resolving one, keeps its `status: closed`, takes its dependents off the frontier, and puts the broken ticket on the frontier

#### AC-3.4: Re-resolve in place

**Given** an undermined ticket on the frontier
**When** a session claims it as in AC-2.1
**Then** the agent writes a new `## Resolution` and keeps each earlier one below it under its own `## Superseded resolution` heading, newest first, clears `undermined_by`, sets `status: closed`, and rewrites the ticket's gist under Decisions so far, so its number and every `blocked_by` naming it stay valid

### US-4: See the plan on the canvas

**As a** Human reviewing a map,
**I want** the tickets drawn on the canvas,
**so that** I see open, claimed, closed, ruled-out, undermined and blocked work at once.

Traces to goal: The Human sees the plan on a canvas.

#### AC-4.1: Canvas built on demand

**Given** a map with ticket files
**When** the Human asks to see the map, or accepts the one-line offer of it the agent makes after charting and after each ticket closes
**Then** `wayfinder`'s build script parses the ticket files alone into `<slug>-canvas.json` and `<slug>-canvas.html` beside `<slug>-map.md`, overwriting any earlier build, `docs/maps/.gitignore` keeps both out of git, the build fails naming the ticket on a `blocked_by` that names no ticket, a `blocked_by` cycle, or a status that disagrees with the ticket's closing section, and the page draws every ticket at once in the radial layout of AC-4.4

#### AC-4.2: Offer declined or ignored

**Given** the agent has made its one-line offer to show the map
**When** the Human declines it or moves on
**Then** no canvas is built, and the agent does not repeat the offer until the next chart or ticket close

#### AC-4.3: Take this ticket

**Given** the Human opened a ticket's panel and wrote an optional note
**When** they press "Take this ticket" on a ticket on the frontier ring, or "Copy for agent" on any other ticket, and paste the text into a chat
**Then** the text names the ticket's file name and title and carries the note; "Take this ticket" also carries the destination, the question, each blocker's gist, the tickets it unblocks and, for an undermined ticket, the ticket that broke its premise, so a fresh session can claim it as in AC-2.1, and asks first when the ticket is already `claimed` (AC-2.3); a note that challenges a decided ticket starts AC-3.3; and the agent edits ticket files, never the built canvas

#### AC-4.4: Destination at the centre

**Given** a built canvas whose map has tickets in every status
**When** the page opens
**Then** the destination sits at the centre, and around it, from the inside out, lie the fog, the frontier ring, the decided tickets and, beyond a dashed scope ring, the `out_of_scope` tickets; the fog holds every blocked ticket and one labelled patch per item under Not yet specified, and the frontier ring holds the frontier and every `claimed` ticket; each ticket is a numbered circle whose fill and outline show whether it is take-now, claimed, stale past 72 hours, undermined, blocked, decided or out of scope, with `claimed_by` initials on a claimed one; a ticket's `blocked_by` and dependent edges show only while it is hovered, focused or tapped, except that each undermined ticket's link to the ticket that broke it is always drawn, along the frontier ring; and a header counts take-now, redo, in progress, waiting in the fog, fog patches, decided and out of scope, leaving out any count of zero

#### AC-4.5: Labels stay legible at 30 tickets

**Given** the package's 30-ticket fixture, with 12 tickets on the frontier ring and five fog patches
**When** the canvas draws at its fitted zoom
**Then** no two shown labels overlap, a frontier or fog-patch label is hidden only when it would overlap another, decided and `out_of_scope` labels show on hover, focus or the "All labels" toggle, and the panel's "On the frontier" list names every ticket on the frontier ring, so a hidden label never hides a ticket

#### AC-4.6: Keyboard and touch

**Given** a built canvas
**When** the Human uses only a keyboard, or only taps
**Then** Tab walks the frontier ring first and then the rest, Enter or a tap opens the ticket's panel, Escape closes it, L toggles all labels, and a tap shows a ticket's edges as hover does

#### AC-4.7: Destination reached

**Given** a map with no ticket `open`, `claimed` or undermined and nothing under Not yet specified
**When** the canvas draws
**Then** the centre marks the destination reached, and the panel names `create-prd` or `code-spec` as the next step in place of the frontier list

### US-5: Hand off when the destination is reached

**As a** Human whose unknowns are resolved,
**I want** the map handed to the next skill and put away,
**so that** the decision moves on and the frontier scan stops showing it.

Traces to goal: A map ends in a PRD or spec.

#### AC-5.1: Handoff and archive

**Given** a map whose frontier is empty and whose destination the Human confirms is reached
**When** the agent hands off
**Then** it names `create-prd` for a product problem or `code-spec` for a confirmed code-shaped ask, with the map's Decisions so far as input, sets the map's `status: deprecated`, moves the folder to `docs/maps/archived/<slug>/`, which no frontier scan reads, and rewrites every relative link in a tracked file that pointed into the old folder

#### AC-5.2: Open tickets at handoff

**Given** the Human asks to hand off while tickets are still `open`, `claimed` or undermined
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
**Then** `wayfinder/` lands in each chosen runtime's skills folder, and setup creates `docs/maps/.gitkeep`, a `docs/maps/.gitignore` that ignores `*-canvas.json` and `*-canvas.html`, never a `*-map.*` file `journey-map` treats as source, a `maps` collection in `.qmd/index.yml`, and a `docs/maps/<slug>/` row in `WOLVEN.md`

#### AC-6.2: Absent without discovery

**Given** a repo with no prior install
**When** the Human runs `setup --skills ship` or `--skills none`
**Then** no `wayfinder/`, no `docs/maps/` or its `.gitignore`, no `maps` collection and no maps row exist, and in the package repo the skill-set partition test passes with `wayfinder` under `discovery`

#### AC-6.3: Main doc warned on, tickets not

**Given** `docs/maps/x/x-map.md` and ticket files beside it
**When** `validate` runs
**Then** it passes with `type: map`, warns naming the type rule with any other `type`, warns when the folder has no `x-map.md`, exits as it would without those warnings, does not check the ticket files, and skips `docs/maps/archived/**`; the findings stay warnings, as ADR-004 requires of a new check

#### AC-6.4: Existing install missing pieces

**Given** an existing install that lacks `docs/maps/`, `docs/maps/.gitignore`, the `maps` collection or the maps router row
**When** the agent first charts a map there
**Then** it names each missing piece with the exact lines to add, creates only the map's own folder and files, edits neither `.qmd/index.yml` nor `AGENTS.md`, and builds no canvas until `docs/maps/.gitignore` exists

### US-7: Share one canvas with journey-map

**As a** consumer who installs `wayfinder`, `journey-map` or both,
**I want** both skills to draw with the same canvas,
**so that** a fix to the canvas lands once and neither skill depends on the other being installed.

Traces to goal: One canvas serves both skills.

#### AC-7.1: Either skill stands alone

**Given** a directory with no skills installed
**When** the Human runs `wolven-harness skills --skills wayfinder`, or `--skills journey-map`
**Then** only the chosen skill's folder lands in each chosen runtime's load path, it carries its own renderer copy, and its maps draw with no other skill installed

#### AC-7.2: Copies stay identical

**Given** the package repo with one canvas source and its copies under `journey-map/` and `wayfinder/`
**When** the tests run
**Then** a test fails naming each file that differs from the source, each file a skill loads that its folder lacks, and each file its folder holds that it doesn't load, and the sync script makes the copies match again

#### AC-7.3: journey-map unchanged

**Given** the `journey-map` fixtures and tests on `main` when this work starts
**When** `journey-map` draws with the synced renderer
**Then** for every fixture the renderer's validation result and computed layout equal those of the renderer on `main`, those tests pass unchanged, and a `ticket` node still fails `journey-map`'s build, because its build script does not allow the `ticket` kind that `wayfinder`'s build allows

## Scope

**In**

- A `wayfinder` skill under `templates/.agents/skills/`, added to `SET_SKILLS.discovery`, covering chart, claim, resolve, graduate, rule out, undermine and hand off, with its pre-commit checklist and a one-line credit to the method's origin.
- Ticket frontmatter: `title`, `ticket` (`research`, `prototype`, `grilling` or `task`), `status` (`open`, `claimed`, `closed` or `out_of_scope`), `blocked_by`, `claimed_by`, `claimed_at` and `undermined_by`.
- `docs/maps/<slug>/<slug>-map.md` as a governed doc folder with `type: map`, checked by `validate` for the main doc only, at warning level, with `archived/` skipped.
- `setup` creating `docs/maps/.gitkeep`, `docs/maps/.gitignore` for built canvases, the `maps` QMD collection and the router row only when discovery is installed, and `WRITING-PROFILE.md` documenting the folder and type in every install.
- One canvas source in the package, committed per file into `journey-map/renderer/` and `wayfinder/renderer/`, each skill getting only the files it loads, with a sync script and a test that fails when a copied file differs from its source or a folder holds a file outside its list. A jury chose per-skill files over whole-folder copies on 2026-10-14, so that a fix to one skill's layout never changes another skill's folder.
- A `ticket` kind in the shared tree format, drawn by a radial layout in its own renderer file that only a tree of `ticket` nodes selects, as US-4 describes, with a 30-ticket fixture for AC-4.5. The renderer's validation takes its allowed kinds from the calling build script.
- An ADR-004 amendment for the new doc folder and its type, and for the first setup paths that depend on the chosen skill set (the maps folder, its `.gitignore`, the `maps` collection and the router row), shipped as a `feat` (a patch release below 1.0), since every new finding is a warning.
- A `wayfinder` build script that parses ticket files into tree JSON and HTML on demand, beside the map and ignored by git, failing on broken edges, cycles and status mismatches.
- Closing the wayfinder deferral once `code-spec` opens: tick trigger 2, set `status: deprecated`, and move it to `docs/deferrals/archived/wayfinder-maps/`.

**Out**

- Everything listed under Non-goals.
- Architecture diagrams and service blueprints, deferred to their own skills ([architectural map](../../deferrals/architectural-map/architectural-map-deferral.md), [service blueprint](../../deferrals/service-blueprint/service-blueprint-deferral.md)).

## Open questions

- Whether the UX engagement goes ahead and supplies the first real map. — owner: Rafael

## Handoff

After approval → `adr` for the ADR-004 amendment covering `docs/maps/` and the `map` type, then `code-spec`. This PRD does not authorize implementation.

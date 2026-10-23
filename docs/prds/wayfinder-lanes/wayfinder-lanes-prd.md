---
type: prd
title: Wayfinder lanes canvas
description: Requires the wayfinder canvas to draw a map as git-style lanes from Start to Destination by default, so a Human reads at a glance which ticket unblocks which and what each ticket is, while the radial view stays available on request.
status: stable
---

# Wayfinder lanes canvas

## Problem

- **Who:** A Human reviewing a wayfinder map on its canvas, the page `wayfinder`'s build script writes beside `<slug>-map.md`.
- **Pain:** The Human can't read at a glance which ticket unblocks which on the way to the destination, or what each ticket is. Today's radial layout groups tickets into rings by state. It draws `blocked_by` edges only while a ticket is hovered, focused or tapped, and it shows titles only for the frontier ring and the fog until the Human hovers or presses "All labels".
- **Why now:** The Human prototyped an alternative and approved it for this PRD on 2026-10-23.
- **Evidence:** the prototype verdict below.

**Prototype verdict (2026-10-23):**

- **Question:** does a line-based canvas read a map better than the radial rings, with the same ticket panel?
- **References:** four were drawn from the package's 30-ticket fixture: A, a Beck-style metro map read left to right; B, Mini Metro; C, git-client lanes read top to bottom; D, Vignelli bundled lines.
- **Live variants:** A, C and today's radial layout were built over a 5-ticket starter map, a 12-ticket medium map and the 30-ticket fixture, all with the real ticket panel.
- **Verdict:** the Human found A hard to read and approved C, in both light and dark mode. C is promoted to this PRD, and A, B and D are discarded.
- **Prototype files:** untracked under `prototypes/wayfinder-metro/` in the `claude/wayfinder-map-prototype-0e424f` worktree.

The terms map, ticket, canvas, destination, frontier, fog, undermined and radial layout keep their meanings from the [wayfinder PRD](../archived/wayfinder/wayfinder-prd.md). This PRD adds:

- **Lanes layout:** draws a map as one row per ticket under a **Start** bar at the top, ending at a destination bar at the bottom.
- **Lane:** a coloured vertical track in the gutter beside the rows. It carries a **line**, which is a chain of tickets joined by `blocked_by`.

## Goals

- The Human reads the path and the tickets at a glance.
  - Success signal: on the starter, medium and 30-ticket maps, the default view shows every ticket's number, full title and state with no hover, toggle or zoom.
  - Success signal: each ticket's blockers can be traced along the lanes back to Start.
- Lanes is the default canvas, and radial is still one ask away.
  - Success signal: the page the build writes under `<slug>-canvas.html` draws the lanes layout.
  - Success signal: when the Human asks for the radial view, the agent builds a radial page that behaves as today's canvas does.
- Nothing around the canvas moves.
  - Success signal: every `journey-map` renderer file stays byte-identical.
  - Success signal: "Take this ticket" and "Copy for agent" produce the same text as today for the same ticket and note.

**Non-goals**

- A toggle between lanes and radial inside one page. It is deferred to [canvas-view-toggle](../../deferrals/canvas-view-toggle/canvas-view-toggle-deferral.md).
- The agent offering the radial view unprompted, for example for a large map. It is deferred to the same file.
- Any change to the radial layout, including dark mode for it.
- Any change to `journey-map` maps.
- New ticket fields or map sections. The lanes are drawn from `blocked_by` and `status` alone.

## User stories

### US-1: Read the map as lanes

**As a** Human reviewing a map,
**I want** the canvas drawn as lanes from Start to the destination,
**so that** I can follow what unblocks what and read every ticket without poking at it.

Traces to goal: The Human reads the path and the tickets at a glance.

#### AC-1.1: Lanes by default

**Given** a map with ticket files
**When** the Human asks to see the map, or accepts the agent's one-line offer of it after charting or after a ticket closes
**Then** the canvas is still built:
- `wayfinder`'s build script writes `<slug>-canvas.json` and `<slug>-canvas.html` beside the map.
- The build fails on the same errors as today.

**And** the page draws the lanes layout:
- **Rows:** one row per ticket, each below every ticket it is blocked by. Each row shows the ticket's number, full title and state word. A blocked ticket's state names the tickets it waits on, and a claimed ticket's state names `claimed_by`.
- **Gutter:** each ticket's marker sits in its lane.
  - A lane starts at Start, or at the ticket it depends on.
  - A ticket that unblocks several others starts new lanes beside its own.
  - A ticket blocked by several tickets draws a link from each of them.
- **Track:** solid up to work that is decided, take-now, claimed or redo, and dashed beyond it.
- **Markers:** take-now, claimed (with `claimed_by` initials, and the stale mark past 72 hours), undermined, blocked and decided each look different. An `out_of_scope` ticket is struck through and its lane ends in a buffer stop.
- **Fog:** a fog band above the destination names every item under Not yet specified.
- **Destination:** the bar at the bottom carries the map's destination.
- **Header:** the same counts as today.

#### AC-1.2: The 30-ticket map stays readable

**Given** the package's 30-ticket fixture
**When** the canvas opens at its default view on a desktop window
**Then** the rows still read cleanly:
- Every row's number, title and state show at full text size, and no row's text overlaps another's.
- The Human reaches rows below the fold by scrolling. Nothing shrinks to fit the height.

#### AC-1.3: Destination reached

**Given** a map with no ticket `open`, `claimed` or undermined, and nothing under Not yet specified
**When** the canvas draws
**Then** every lane runs solid into the destination bar. The bar marks the destination reached. The panel names `create-prd` or `code-spec` as the next step, in place of the frontier list.

#### AC-1.4: A ticket waiting on an out-of-scope ticket

**Given** an open ticket blocked by an `out_of_scope` ticket
**When** the canvas draws
**Then** the ticket's lane starts from the out-of-scope ticket's lane, its state reads waiting on that ticket, and its track stays dashed into the destination.

### US-2: Open a ticket from its row

**As a** Human reading the lanes,
**I want** the same ticket panel and hand-off as today,
**so that** I can take or discuss a ticket without learning a new flow.

Traces to goal: Nothing around the canvas moves.

#### AC-2.1: Panel and hand-off

**Given** a built lanes canvas
**When** the Human clicks or taps a ticket's row, or its marker
**Then** the same panel opens as today:
- It shows the state, the claim or the tickets the ticket waits on, the question, the gist, the resolution, "Depends on", "Unblocks", the file and the note box.
- "Take this ticket" (frontier and claimed tickets) or "Copy for agent" (any other ticket) copies text identical to today's for the same ticket and note.

#### AC-2.2: Related work stands out

**Given** a built lanes canvas
**When** the Human hovers, focuses or opens a ticket
**Then** its blockers, its dependents and the tracks joining them stay at full strength, and every other row and track dims until the pointer, focus or panel leaves.

#### AC-2.3: Keyboard and touch

**Given** a built lanes canvas
**When** the Human uses only a keyboard, or only taps
**Then** Tab walks the rows from top to bottom, Enter or a tap opens the panel, and Escape closes it.

#### AC-2.4: A map with errors

**Given** a map whose tickets fail the build, for example a `blocked_by` cycle
**When** the build runs
**Then** it exits 1 naming the ticket, as today, and the page shows the error panel instead of lanes.

### US-3: Ask for the radial view

**As a** Human who wants the rings view of a map,
**I want** to ask the agent for it,
**so that** the radial layout stays available without weighing down the default page.

Traces to goal: Lanes is the default canvas, and radial is still one ask away.

#### AC-3.1: Radial on request

**Given** a map with ticket files
**When** the Human asks for the radial view
**Then** the agent builds the radial page:
- It is a page beside the map, under a name the existing `docs/maps/.gitignore` already ignores.
- It draws exactly as today's canvas does, light mode included.
- The agent tells the Human its path.

#### AC-3.2: Never offered

**Given** any map of any size
**When** the agent charts it, closes a ticket, or builds the lanes canvas
**Then** the agent makes no offer of the radial view. Its one-line offer to show the map names only the canvas.

### US-4: Read it in any light, on any screen

**As a** Human opening the canvas on my own machine or phone,
**I want** the page to follow my colour mode and stay readable on a narrow screen,
**so that** I don't fight the page to read the map.

Traces to goal: The Human reads the path and the tickets at a glance.

#### AC-4.1: Colour mode follows the OS

**Given** an OS set to dark mode
**When** the Human opens a lanes canvas
**Then** the whole page draws in dark colours with every lane, marker and text still distinct, and switching the OS back to light redraws it in light. The radial page stays light-only.

#### AC-4.2: Phone width

**Given** a screen narrower than the desktop layout
**When** the Human opens a lanes canvas
**Then** the page stays readable:
- Row text stays at full size. Each state word moves under its title.
- The gutter stays beside the rows.
- The page scrolls down the rows, and the panel opens as a bottom sheet as today.

## Scope

**In**

- The lanes layout as the page `wayfinder`'s build script writes under `<slug>-canvas.html`.
- A radial page the agent builds only on request, drawn as today.
- `wayfinder`'s skill text, saying the canvas is lanes and the radial view is built when asked and never offered.
- Following the OS colour mode, and a phone-width layout, on the lanes page.

**Out**

- A toggle between views in one page, and any unprompted offer of the radial view (deferred).
- Changes to the radial layout or to `journey-map`.
- Changes to the ticket file format, the map sections or the build's error rules.
- Committing built canvases, which stay derived and gitignored.

## Open questions

- Keep the untracked prototype files on the throwaway branch as a primary source, or delete them once the spec lands? Owner: Human.

## Handoff

After approval → `code-spec`. This PRD does not authorize implementation.

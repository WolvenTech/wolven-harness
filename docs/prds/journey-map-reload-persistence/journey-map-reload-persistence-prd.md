---
type: prd
title: Journey-map reload persistence
description: Persist journey-map answers and notes across reloads, copy every note for the agent, and warn when copy would be header-only.
status: stable
---

# Journey-map reload persistence

## Problem

- **Who:** A Human walking a published journey map (for example a claude.ai artifact or a local `*-map.html`) who adds pencil notes and choices, then uses **Copy for agent** to send feedback back to an agent.
- **Pain:** Answers and notes live only in the page's in-memory `state`. A reload, **Start over**, or the host re-mounting the artifact frame clears that state. **Copy for agent** still succeeds but the textarea holds only the header line (`journey-map feedback for <path>`), so every note looks lost with no warning. The journey-map skill currently tells agents that answers are not saved across reloads and that the copy text is the record — which fails when state is cleared before copy.
- **Why now:** GitHub issue [#92](https://github.com/WolvenTech/wolven-harness/issues/92) reports a real walk where three pencil notes disappeared before copy; the underlying `feedback()` logic already emits note lines when `state` is populated.
- **Evidence:** [wolven-harness#92](https://github.com/WolvenTech/wolven-harness/issues/92); local verification that `JourneyMapLogic.feedback()` in `renderer/logic.js` walks layout boxes and writes `note` lines when `state` holds them.

grilling did not run.

## Goals

- A Human's answers and pencil notes survive a full page reload for the same map file — success signal: after reload, cards show the same choices, text, and notes as before, and **Copy for agent** includes every note line with node id and label.
- **Copy for agent** never silently succeeds with header-only text when there is nothing to copy — success signal: with empty `state`, the feedback panel shows an explicit message instead of a lone header in the textarea.
- Notes off the walked path still appear in the copy text — success signal: a note on a node that was never revealed still appears as `<id> "<label>": note "<text>"` in the copied block (today's `feedback()` rule, preserved).
- Storage failures do not break the map — success signal: when `localStorage` throws or is unavailable, the page loads and behaves as it does today (in-memory only).

**Non-goals**

- Persisting UI chrome across reloads (expanded step details, step-by-step vs whole map, camera position, open note editors).
- Cross-browser or cross-device sync of walks; storage is per origin and per browser profile only.
- Changing the journey-map JSON tree format, build script output shape, or **Copy for agent** line grammar beyond the empty-state message.
- Offline maps, themes, image export, or computed hand-back text (unchanged from the archived journey-map PRD).
- Diagnosing or fixing claude.ai artifact host behavior when the frame re-mounts; this PRD only requires the renderer to restore state when the page loads again with storage available.

## User stories

### US-1: Notes survive reload

**As a** Human reviewing a journey map in a browser,
**I want** my pencil notes and answers to remain after I reload the page,
**so that** I can switch panels or refresh without retyping before I copy feedback for my agent.

Traces to goal: A Human's answers and pencil notes survive a full page reload for the same map file.

#### AC-1.1: Three notes after reload and copy

**Given** a built journey-map page and pencil notes on three different nodes
**When** the Human reloads the page and presses **Copy for agent**
**Then** the copied text includes three lines, each with that node's id, JSON-escaped label, and `note "<text>"`, plus the usual header line

#### AC-1.2: Map content change starts clean

**Given** saved state for a map at path `docs/notes/example/example-map.json`
**When** the map JSON is rebuilt so node ids or structure change (detected by a hash of the embedded map JSON)
**Then** restored state from the prior map does not apply; the walk starts empty

#### AC-1.3: Start over clears storage

**Given** saved answers and notes for the current map
**When** the Human presses **Start over** (toolbar or confirmed **R** shortcut)
**Then** in-memory `state` is empty, the saved storage entry for this map is removed, and a subsequent reload shows an empty walk

### US-2: Copy reflects every note

**As a** Human who annotated nodes the walk never reached,
**I want** those notes in **Copy for agent**,
**so that** the agent sees context I left on branches I did not take.

Traces to goal: Notes off the walked path still appear in the copy text.

#### AC-2.1: Note on an unrevealed node

**Given** a note on a node that is not on the walked path and not revealed
**When** the Human presses **Copy for agent**
**Then** the copied text includes that node's note line in layout order

### US-3: Empty copy is explicit

**As a** Human who opened **Copy for agent** before answering anything,
**I want** a clear message that there is nothing to copy,
**so that** I do not paste a useless header into chat.

Traces to goal: **Copy for agent** never silently succeeds with header-only text when there is nothing to copy.

#### AC-3.1: No answers and no notes

**Given** no node has a choice, check change, typed text, or pencil note
**When** the Human presses **Copy for agent**
**Then** the feedback panel opens with text that tells them to pick options or use the pencil (not header-only silence)

#### AC-3.2: Header plus content unchanged

**Given** at least one answer or note exists
**When** the Human copies
**Then** the first line remains `journey-map feedback for <path>` followed by one line per answer or note as today

### US-4: Blocked storage degrades gracefully

**As a** Human using the map where storage is denied (private mode policy, quota, or sandbox),
**I want** the map to work without persistence,
**so that** I can still walk and copy in the current session.

Traces to goal: Storage failures do not break the map.

#### AC-4.1: Storage throws on write

**Given** `localStorage.setItem` throws for the persistence key
**When** the Human changes an answer
**Then** the page updates in memory with no uncaught error and no broken render

#### AC-4.2: Storage throws on read

**Given** `localStorage.getItem` throws on load
**When** the page opens
**Then** the map renders with empty `state` and remains interactive

## Scope

**In**

- Persist `state` (per-node `choice`, `checks`, `text`, `note`, `done`) to `localStorage` on every change, keyed by the map's `path` from embedded page data plus a hash of the map JSON so content changes invalidate old state.
- Restore saved `state` on load when the key matches; wrap all storage reads and writes in try/catch.
- Clear the saved entry when **Start over** runs (including the double-**R** confirmed reset).
- Empty-copy UX in the feedback panel when `feedback()` would return only the header (message per issue #92 acceptance).
- Updates to journey-map skill docs (`SKILL.md`, `references/tree-format.md` template copies) replacing "Answers are not saved across reloads" with the new persistence rule.
- Automated tests for empty-copy behavior and storage fallback; renderer changes in `renderer/draw.js` and `renderer/logic.js` as needed, then `pnpm sync:renderer`.

**Out**

- Persisting `open`, `showAll`, `stepwise`, `noteOpen`, or camera state.
- Server-side or shared storage; export/import of walks.
- Changes to wayfinder renderers or other skills' copy panels.
- Proving which host action cleared state in the #92 incident (reload vs iframe re-mount).

## Open questions

- Whether the storage key should include only the map `path` string embedded at build time or also the page URL when `path` is missing — owner: implementer during `code-spec`
- Whether restored notes should reopen the pencil editor or only show the sticky preview — owner: Human at spec review
- Maximum size or pruning policy if many maps accumulate keys in `localStorage` — owner: None (defer until a reported quota issue)

## Handoff

After approval → `code-spec`. This PRD does not authorize implementation.

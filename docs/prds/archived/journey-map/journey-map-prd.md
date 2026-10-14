---
type: prd
title: Journey Map Skill
description: Requires a discovery-set journey-map skill that draws a user journey or a branching path as a clickable whiteboard map from a JSON tree, with optional mood, thoughts, touchpoints and pains on each step, so the Human walks it one decision at a time, can see all of it on demand, and sends feedback back to the agent in any runtime.
status: deprecated
---

# Journey Map Skill

## Problem

- **Who:** A Human in a consumer repo who explores a branching path or a user journey with an agent: CLI prompts, a skill's steps, or a persona's path through a product in UX discovery work.
- **Pain:** Prose specs and one-question chat rounds flatten a branching flow. The Human cannot see every branch, default and dead end at once, so gaps and wrong defaults surface only after the flow is built. Drawing every branch at once has the opposite problem: a wall of nodes the Human can't walk through the way the flow's user would. On a user journey, the Human also can't see how the persona feels at each step, or what they think, touch and struggle with, because flow cards hold only labels, choices and notes.
- **Why now:** The `harness-init` redesign is still being settled on a map, and every later change to `setup`, `skills` or `harness-init` meets the same blind spot. The working renderer exists only as a one-off HTML file outside the repo and will be lost if it is not captured. A UX design engagement with discovery phases is being sold and would need it.
- **Evidence:** Four cases. A map of `wolven-harness setup` and a proposed `harness-init` redesign surfaced a redesign that prose rounds had not, across five versions and seven resolved comment threads ([published prototype](https://claude.ai/artifact/34b68WuinuZE25ZtjKS5dt)). A second, data-driven prototype drew a Lord of the Rings mock flow from a JSON tree. Over three feedback rounds in Codex and Claude, every pasted feedback block named its nodes clearly enough to act on, and the Human asked for upcoming nodes to stay hidden until a decision ([prototype note](../../../notes/journey-map-prototype/journey-map-prototype-note.md)). Demand beyond this repo is an assumption. A third case, the cj_001 invoicing journey, was drawn with the shipped skill. Its mood, thoughts and touchpoints had no field, so they were squeezed into subtitles ([cj_001 source](../../../notes/visual-map-kinds/cj-001-source.json), [map](https://github.com/WolvenTech/wolven-harness/blob/385d5fcc88a86d58f448b9f2db3a8199659be84e/docs/notes/visual-map-kinds/cj-001-test-map.json), [research note](../../../notes/visual-map-kinds/visual-map-kinds-note.md)). In the fourth, a throwaway prototype drew cj_001 as an action path over three rounds and eight layouts. The Human approved one: a mood header band, a thought cloud, collapsible details with pains and ideas as stickies, mood-coloured arrows and a docked mood timeline ([prototype](https://github.com/WolvenTech/wolven-harness/tree/385d5fcc88a86d58f448b9f2db3a8199659be84e/docs/notes/visual-map-kinds/journey-details-prototype), [published](https://claude.ai/artifact/XKt1gaaCPo3FwbwGagto4t)).

A **journey map** here is a drawing of a path's branches, choices and steps on a pan-and-zoom whiteboard. A user journey is drawn as an action path: one step per action, with optional mood, thought, touchpoints, pains and opportunities on each step. It is not the swim-lane research grid that often carries the same name, nor a service blueprint. Those are deferred to their own skill, as are architecture diagrams.

## Goals

- The Human walks a branching flow one decision at a time, and can see all of it on demand. — success signal: the `harness-init` redesign map from the prototype is redrawn from a JSON tree alone. Walking it reveals one path step by step, and "Show whole map" puts every path, step and hand-back on one canvas.
- The agent writes data, not HTML. — success signal: two different maps are produced by writing only their JSON trees; the renderer the skill ships is byte-identical in both.
- Feedback on a map reaches the agent in every runtime. — success signal: in Codex or Cursor, one paste of the page's feedback block lets the agent revise the map without asking which node was meant; in Claude, an artifact comment does the same.
- The skill ships to consumers with no contract change. — success signal: `setup --skills discovery` installs it, the skill-set partition test passes, and `validate` and ADR-004 are unchanged.
- The Human sees how a persona feels and what they meet at each step of a user journey. — success signal: cj_001 is redrawn as an action path from a JSON tree alone. Each step shows its mood as a face and a colour, and its thought, touchpoints, pains and opportunities where the source has them. A persona header names Alex and the goal, and the mood timeline follows the walked path. Nothing is pushed into subtitles.

**Non-goals**

- Text computed from answers, such as the prototype's copyable `setup` command or a hand-back card filled from earlier choices.
- Maps that open with no network.
- Any `validate` check on map files, a new governed doc folder, or a new doc `type`.
- Planning tickets and the `wayfinder` map: ticket trees leave this skill for the wayfinder work on PR #57.
- Architecture and system-design diagrams (C4 kinds, nested boundaries, an automatic legend), deferred to an `architectural-map` skill ([deferral](../../../deferrals/architectural-map/architectural-map-deferral.md)).
- Swim-lane journey grids and service blueprints (stages by lanes, frontstage and backstage lanes, lines of visibility, a full-page mood spine), deferred to a `service-blueprint` skill ([deferral](../../../deferrals/service-blueprint/service-blueprint-deferral.md)).
- Mood on any scale other than −2 to +2.
- Changes to `grilling` or to any other shipped skill.
- Updating `harness-init` to match the redesign drawn on the map.
- Keeping a map in sync with the flow after it ships.
- Designing for client stakeholders as users: sharing, access control, or their own feedback loop.
- Saving answers across page reloads. The "Copy for agent" text is the record.
- Themes, dark mode, or exporting a map as an image.

## User stories

### US-1: Draw a flow from a JSON tree

**As a** Human shaping a branching flow,
**I want** the agent to draw it as a journey map from a small JSON tree,
**so that** I see every branch at once instead of reading it in prose.

Traces to goal: The Human walks a branching flow one decision at a time, and can see all of it on demand; The agent writes data, not HTML.

#### AC-1.1: Map beside the doc it serves

**Given** a PRD, spec or note exists for the work under `docs/<folder>/<slug>/`
**When** the Human asks for a map, or accepts the agent's one-line offer of one
**Then** the agent writes `<slug>-map.json` and a self-contained `<slug>-map.html` in that slug folder. The HTML opens in a browser as one pan-and-zoom canvas, and the agent wrote no HTML by hand.

#### AC-1.2: Reference map

**Given** the `harness-init` redesign drawn in the prototype
**When** an agent following only the skill writes its JSON tree, and the Human turns on "Show whole map"
**Then** the map shows both paths, the goal text box, the "How much should we change your current AGENTS.md?" choice, the full-tour checklist, the skills fork, the checks choice, the commits checklist and the hand-back, reached from a `setup` tree by a dashed arrow

#### AC-1.3: No doc yet

**Given** no PRD, spec or note exists for the work
**When** the agent draws a map
**Then** it writes a short `docs/notes/<slug>/<slug>-note.md` with `type: note` and `status: draft` beside the map files, and `validate` passes

#### AC-1.4: Malformed tree

**Given** a JSON tree with an unknown node kind or an edge to a missing node
**When** the page opens
**Then** it shows a readable error naming the bad node instead of a blank canvas, and the skill has the agent open the page once after every write so the agent sees that error before handing back

#### AC-1.5: Archived with its doc

**Given** a map beside a PRD
**When** `code-pr` moves the PRD folder to `docs/prds/archived/<slug>/`
**Then** the map files move with it, and the skill text says a map is a design aid that is not kept in sync with shipped code

### US-2: Click through the flow

**As a** Human reviewing a map,
**I want** to choose, tick and type my way through it as its user would, one decision at a time,
**so that** I find wrong defaults and dead ends before anything is built.

Traces to goal: The Human walks a branching flow one decision at a time, and can see all of it on demand.

#### AC-2.1: Choose a branch

**Given** a single-choice step with several options, and nothing after it shown yet
**When** the Human clicks one option
**Then** the steps after that option appear, the unchosen options dim but stay visible, the steps behind them stay hidden, and the view moves to the newly shown steps

#### AC-2.2: Checklist fades skipped steps

**Given** a checklist whose items each gate a **waypoint** (a step the agent performs with no question to the Human, drawn dashed)
**When** the Human unticks an item
**Then** its waypoint fades and is marked "later", and ticking it again restores it

#### AC-2.3: Keyboard only

**Given** a Human with no pointer device
**When** they use Tab, Enter and Space
**Then** they can reach and operate every choice, checkbox, text box and button on the map, including "Continue" and "Show whole map"

#### AC-2.4: Drag is not a click

**Given** the pointer goes down on an option
**When** the Human drags to pan before releasing
**Then** the canvas pans and no option is chosen

#### AC-2.5: Steps wait for the Human

**Given** a checklist or a text box on the path the Human has reached
**When** the Human has not pressed its "Continue" button
**Then** nothing after it is shown. Pressing "Continue", or Enter inside a text box, shows the next steps and moves the view to them

#### AC-2.6: Show the whole map

**Given** a map with steps the Human has not reached
**When** the Human turns on "Show whole map"
**Then** every node and edge draws, with unreached nodes drawn faint, and the view refits to the whole map. Turning it off hides them again without losing any answer

#### AC-2.7: Step by step

**Given** step by step is on and the path reaches a plain step
**When** the Human presses "Next", or `n`
**Then** one more step appears and the view moves to it. "Prev", or `b`, hides the last step shown and keeps every earlier answer. Both buttons show only while step by step is on

#### AC-2.8: Lean toolbar

**Given** any map
**When** the page opens
**Then** the toolbar shows "Copy for agent" and "Start over", plus "Prev" and "Next" while step by step is on. Step by step, "Show whole map" and "Expand all" sit in a ⋯ menu that names each shortcut and closes on Escape or an outside click. Every shortcut works as soon as the page opens, before any click

### US-3: Send feedback back to the agent

**As a** Human who has clicked through a map,
**I want** my choices and notes to reach the agent in one step,
**so that** the next revision addresses exactly the nodes I meant.

Traces to goal: Feedback on a map reaches the agent in every runtime.

#### AC-3.1: Copy for agent

**Given** the Human chose branches, ticked boxes, typed text and left a note on a node
**When** they press "Copy for agent"
**Then** the clipboard holds plain text naming each touched node by its id and label with its answer or note. A checklist continued with no change gets a line that says so. After the Human pastes the text into chat, the agent revises the JSON and regenerates the map

#### AC-3.2: Artifact by default in Claude

**Given** the agent runs in Claude
**When** it draws or revises a map
**Then** it publishes the HTML as an artifact without asking first, and on a comment it revises the JSON, rebuilds and republishes to the same URL

#### AC-3.3: Clipboard refused

**Given** the browser refuses the clipboard write, as on some `file://` pages
**When** the Human presses "Copy for agent"
**Then** the page shows the same text in a selectable box so the Human can copy it by hand

#### AC-3.4: Note beside an annotation

**Given** a node the agent already annotated
**When** the Human adds a note to it
**Then** both stickies draw without overlapping, and both stay readable

#### AC-3.5: No artifact

**Given** the Human said not to publish, the runtime is not Claude, or publishing fails or can't carry the map
**When** the agent draws or revises a map
**Then** it hands over the local HTML file instead. When publishing failed, it tells the Human what blocked it and asks whether to retry or stay local

### US-4: Install from the discovery set

**As a** consumer installing the harness,
**I want** `journey-map` to arrive with the other discovery skills,
**so that** I get it where I already get `create-prd` and `prototype`.

Traces to goal: The skill ships to consumers with no contract change.

#### AC-4.1: Installed with discovery

**Given** a consumer repo
**When** the Human runs `wolven-harness setup --skills discovery`, or `wolven-harness skills --skills journey-map`
**Then** `journey-map/` lands in each chosen runtime's skills folder with its `SKILL.md` and the renderer

#### AC-4.2: Absent without discovery

**Given** a consumer who runs `setup --skills ship` or `--skills none`
**When** setup finishes
**Then** no `journey-map/` folder exists, and in the package repo the skill-set partition test passes with `journey-map` listed under `discovery`

### US-5: See the persona's experience on a journey

**As a** Human exploring a user journey,
**I want** each step to show how the persona feels and what they think, touch and struggle with,
**so that** I find the low points and the missing steps while the path is still cheap to change.

Traces to goal: The Human sees how a persona feels and what they meet at each step of a user journey.

#### AC-5.1: Mood header

**Given** a step with a `mood` from −2 to +2
**When** the page draws it
**Then** the card's header band takes the mood's colour and shows the matching face (🙁 😕 😐 🙂 😃) and the persona's first name, with no mood word. The arrow into the step takes the same colour. A step with no mood gets a plain grey header with no face

#### AC-5.2: Card actions in the header

**Given** any journey step
**When** the page draws it
**Then** the right end of its header holds the card's only two actions: expand or collapse, and add note. Expand is dimmed on a step with nothing to expand

#### AC-5.3: Thought cloud

**Given** a step with a `thought`
**When** the page draws it
**Then** the thought sits above the card in a rounded thought bubble, in handwriting, with small bubbles trailing down to the card. It shows whether the card is collapsed or expanded

#### AC-5.4: Collapsed and expanded details

**Given** a step with touchpoints, pains or opportunities
**When** the card is collapsed
**Then** it shows one row of icon counts, such as 📍 2 · ⚠ 2 · 💡 1. Expanding it shows the touchpoints as chips inside the card, and the pains and opportunities as red and green sticky notes below it. A step with none of them draws like any other flow step

#### AC-5.5: Expand all

**Given** several steps with details
**When** the Human picks "Expand all", or presses `e`
**Then** every step expands, the layout makes room so no card, sticky, thought or arrow covers another, and the view refits. Doing it again collapses them all

#### AC-5.6: Persona header

**Given** a map with a persona, a goal and a scenario
**When** the page opens
**Then** a header card shows them at the start of the path

#### AC-5.7: Mood timeline follows the walk

**Given** a map whose steps carry a mood
**When** the Human walks a path, or turns on "Show whole map"
**Then** a small timeline docked at the bottom plots the mood of each shown step on the walked path, in order, and moves to the new branch when the Human changes a choice. It keeps the same small height at any window width, and its lowest point is never cut off

#### AC-5.8: Mood out of range

**Given** a step whose `mood` is not a whole number from −2 to +2
**When** the page opens
**Then** it fails as in AC-1.4, naming the step

#### AC-5.9: Source on another scale

**Given** a journey source that scores mood on another scale, as cj_001 does from −1 to 4
**When** the agent writes the JSON tree
**Then** it maps each score onto −2 to +2 and writes the mapping in the doc beside the map

## Scope

**In**

- A `journey-map` skill under `templates/.agents/skills/`, added to `SET_SKILLS.discovery`.
- A shared renderer and a small Node script shipped inside the skill folder. Maps load rough.js and fonts from a CDN, with no npm dependency and no bundler.
- A polished whiteboard look: clean cards with a soft shadow, a hand-drawn line kept only on arrows and notes.
- The JSON tree: single-choice steps, checklists, text boxes, waypoints, leaf and summary cards, free annotations with arrows, and links between trees.
- Journey details: optional mood from −2 to +2 shown in a header band, a thought cloud, touchpoints, pains and opportunities on any step; collapsible details with an "Expand all"; mood-coloured arrows; an optional persona header; a docked mood timeline.
- Step by step with "Prev" and "Next", and a toolbar of "Copy for agent" and "Start over" with the other controls in a ⋯ menu.
- Fixes from the cj_001 test: a note beside an annotation never overlaps it, a checklist continued with no change gets a feedback line, and Enter in a text box continues.
- Click-through that reveals steps as the Human decides, a "Show whole map" toggle that refits the view, checklist fading, per-node notes, "Copy for agent", pan and zoom, and keyboard operation.
- Publishing the map as an artifact by default when the runtime is Claude, unless the Human says not to or publishing fails.
- Map files beside the doc they serve, or beside a new short note.

**Out**

- Everything listed under Non-goals.
- The `wayfinder` skill and its ticket trees, on PR #57.
- The `architectural-map` and `service-blueprint` skills, recorded as deferrals.

## Open questions

None. The journey-details prototype settled the stepper and the card look (Evidence, US-2 and US-5).

## Handoff

After approval → `code-spec`. This PRD does not authorize implementation.

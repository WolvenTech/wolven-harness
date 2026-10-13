---
type: prd
title: Journey Map Skill
description: Requires a discovery-set journey-map skill that draws a branching flow as a clickable whiteboard map from a JSON tree, so the Human sees the whole flow and sends feedback back to the agent in any runtime.
status: stable
---

# Journey Map Skill

## Problem

- **Who:** A Human in a consumer repo who shapes a branching flow with an agent: CLI prompts, a skill's steps, or a product's user journeys in UX discovery work.
- **Pain:** Prose specs and one-question chat rounds flatten a branching flow. The Human cannot see every branch, default and dead end at once, so gaps and wrong defaults surface only after the flow is built.
- **Why now:** The `harness-init` redesign is still being settled on a map, and every later change to `setup`, `skills` or `harness-init` meets the same blind spot. The working renderer exists only as a one-off HTML file outside the repo and will be lost if it is not captured. A UX design engagement with discovery phases is being sold and would need it.
- **Evidence:** One case. A map of `wolven-harness setup` and a proposed `harness-init` redesign surfaced a redesign that prose rounds had not, across five versions and seven resolved comment threads ([published prototype](https://claude.ai/artifact/34b68WuinuZE25ZtjKS5dt)). Demand beyond this repo is an assumption.

A **journey map** here is a drawing of a flow's branches, choices and steps on a pan-and-zoom whiteboard. It is not the UX research artifact of the same name, which charts a persona's stages and emotions; the name was kept by choice.

## Goals

- The Human sees a whole branching flow at once. — success signal: the `harness-init` redesign map from the prototype is redrawn from a JSON tree alone, with every path, step and hand-back on one canvas.
- The agent writes data, not HTML. — success signal: two different maps are produced by writing only their JSON trees; the renderer the skill ships is byte-identical in both.
- Feedback on a map reaches the agent in every runtime. — success signal: in Codex or Cursor, one paste of the page's feedback block lets the agent revise the map without asking which node was meant; in Claude, an artifact comment does the same.
- The skill ships to consumers with no contract change. — success signal: `setup --skills discovery` installs it, the skill-set partition test passes, and `validate` and ADR-004 are unchanged.
- A map can show planning tickets for a later `wayfinder` skill. — success signal: a JSON tree with tickets in each status and blocked-by edges renders each status distinctly.

**Non-goals**

- Text computed from answers, such as the prototype's copyable `setup` command or a hand-back card filled from earlier choices.
- Maps that open with no network.
- Any `validate` check on map files, a new governed doc folder, or a new doc `type`.
- The `wayfinder` skill itself: charting unknowns, writing tickets, claiming and resolving them.
- Changes to `grilling` or to any other shipped skill.
- Updating `harness-init` to match the redesign drawn on the map.
- Keeping a map in sync with the flow after it ships.
- Designing for client stakeholders as users: sharing, access control, or their own feedback loop.

## User stories

### US-1: Draw a flow from a JSON tree

**As a** Human shaping a branching flow,
**I want** the agent to draw it as a journey map from a small JSON tree,
**so that** I see every branch at once instead of reading it in prose.

Traces to goal: The Human sees a whole branching flow at once; The agent writes data, not HTML.

#### AC-1.1: Map beside the doc it serves

**Given** a PRD, spec or note exists for the work under `docs/<folder>/<slug>/`
**When** the Human asks for a map, or accepts the agent's one-line offer of one
**Then** the agent writes `<slug>-map.json` and a self-contained `<slug>-map.html` in that slug folder, the HTML opens in a browser as one pan-and-zoom canvas, and the agent wrote no HTML by hand

#### AC-1.2: Reference map

**Given** the `harness-init` redesign drawn in the prototype
**When** an agent following only the skill writes its JSON tree
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
**I want** to choose, tick and type my way through it as its user would,
**so that** I find wrong defaults and dead ends before anything is built.

Traces to goal: The Human sees a whole branching flow at once.

#### AC-2.1: Choose a branch

**Given** a single-choice step with several options
**When** the Human clicks one option
**Then** the unchosen branches fade but stay visible, and the view moves to the chosen branch's next step

#### AC-2.2: Checklist fades skipped steps

**Given** a checklist whose items each gate a **waypoint** (a step the agent performs with no question to the Human, drawn dashed)
**When** the Human unticks an item
**Then** its waypoint fades and is marked "later", and ticking it again restores it

#### AC-2.3: Keyboard only

**Given** a Human with no pointer device
**When** they use Tab, Enter and Space
**Then** they can reach and operate every choice, checkbox, text box and button on the map

#### AC-2.4: Drag is not a click

**Given** the pointer goes down on an option
**When** the Human drags to pan before releasing
**Then** the canvas pans and no option is chosen

### US-3: Send feedback back to the agent

**As a** Human who has clicked through a map,
**I want** my choices and notes to reach the agent in one step,
**so that** the next revision addresses exactly the nodes I meant.

Traces to goal: Feedback on a map reaches the agent in every runtime.

#### AC-3.1: Copy for agent

**Given** the Human chose branches, ticked boxes, typed text and left a note on a node
**When** they press "Copy for agent"
**Then** the clipboard holds plain text naming each touched node by its id and label with its answer or note, and after the Human pastes it into chat the agent revises the JSON and regenerates the map

#### AC-3.2: Artifact loop in Claude

**Given** the agent runs in Claude with artifact publishing available
**When** it draws or revises a map
**Then** it also publishes the HTML as an artifact, and on a comment it revises the JSON, regenerates and republishes to the same URL

#### AC-3.3: Clipboard refused

**Given** the browser refuses the clipboard write, as on some `file://` pages
**When** the Human presses "Copy for agent"
**Then** the page shows the same text in a selectable box so the Human can copy it by hand

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

### US-5: Show planning tickets

**As a** Human planning work with several open unknowns,
**I want** a map to show tickets and what blocks them,
**so that** a later `wayfinder` skill can draw its plan on the same canvas.

Traces to goal: A map can show planning tickets for a later `wayfinder` skill.

#### AC-5.1: Ticket statuses

**Given** a JSON tree with tickets whose `status` is `open`, `claimed` or `closed`
**When** the page opens
**Then** each status draws distinctly, and a ticket's `claimed_by` shows on a claimed ticket

#### AC-5.2: Blocked tickets

**Given** a ticket whose `blocked_by` names a ticket that is not `closed`
**When** the page opens
**Then** an edge runs from blocker to blocked ticket and the blocked ticket draws as blocked; a `blocked_by` entry naming a missing ticket fails as in AC-1.4

## Scope

**In**

- A `journey-map` skill under `templates/.agents/skills/`, added to `SET_SKILLS.discovery`.
- A shared renderer shipped inside the skill folder; maps load rough.js and fonts from a CDN, with no npm runtime dependency and no build step.
- The JSON tree: single-choice steps, checklists, text boxes, waypoints, leaf and summary cards, free annotations with arrows, links between trees, and tickets with blocked-by edges.
- Click-through, checklist fading, per-node notes, "Copy for agent", pan and zoom, and keyboard operation.
- Publishing the map as an artifact when the runtime is Claude.
- Map files beside the doc they serve, or beside a new short note.

**Out**

- Everything listed under Non-goals.
- The `wayfinder` skill and closing its deferral, which its own PRD does.

## Open questions

- How the HTML is assembled from the renderer and the JSON tree with no build step, for example the agent inlining both or a small script in the skill folder. — owner: `code-spec`
- The JSON tree's exact fields per node kind, and the format of the "Copy for agent" text. — owner: `code-spec`
- Whether maps that load jsDelivr and Google Fonts are acceptable in a client's repo for the UX engagement. — owner: Rafael
- The `wayfinder` PRD, which renders through this skill and closes `docs/deferrals/wayfinder-maps/`. — owner: Rafael

## Handoff

After approval → `code-spec`. This PRD does not authorize implementation.

---
type: note
title: Journey map prototype
description: Records the throwaway journey-map prototype the Human accepted, its feedback rounds, and the PRD and spec changes it forced.
status: stable
---

# Journey map prototype

**Question it answered:** can a JSON map tree drive a clickable map that the Human walks through, and can the "Copy for agent" text tell the agent exactly which node feedback is about?

**Verdict, 2026-10-13: promote.** The Human accepted the prototype ("the current prototype is ok"). Its renderer and build script were ported as readable code into `templates/.agents/skills/journey-map/` (`renderer/` and `scripts/`). Its Lord of the Rings sample became the test fixture `test/fixtures/journey-map/lotr-map.json`. The throwaway source is not kept in the repository: the shipped files replace it.

## What was built

The prototype was built outside the repository, against the draft spec, in two runtimes. Codex built the renderer and ran feedback rounds 1 and 2. Claude ran round 3. The sample map has 20 nodes: a flow tree and a ticket tree.

## Feedback rounds

| Round | Channel | What the Human said | Change |
|---|---|---|---|
| 1 | Copy for agent, in Codex | Choices, notes on Aragorn, the broken rope and the Moria losses | Map tree only |
| 2 | Copy for agent, in Codex | A note on one ticket node | Map tree only |
| 3 | Chat, in Claude | "overall it was ok", improve the visuals, hide upcoming nodes until a decision | Renderer only |

In rounds 1 and 2, every pasted feedback block named its nodes clearly enough to act on with no follow-up question. That meets the PRD's success signal for the feedback goal in Codex.

## What changed the PRD and spec

- **Hidden until decided.** A flow tree shows only what the Human has reached. It stops at each unanswered choice, and at each checklist or text box until the Human presses **Continue**. A **Show whole map** toggle draws every node, with unreached ones faint. Ticket trees always show in full. This replaces the PRD's "see the whole flow at once" default.
- **Polished whiteboard look.** Cards are plain SVG with a soft shadow, and each has a small label for its kind. Options and checklist items are drawn as radio buttons and checkboxes, and the default option carries a "recommended" pill. Interface text is set in Inter; Caveat is used only for notes and annotations. rough.js draws only the arrows.
- **Tree format additions:**
  - an optional tree `label`
  - each tree must be a graph with no cycles
  - `next`, `gates` and `blocked_by` stay inside their own tree; `links` cross between trees
  - `gates` point only at waypoints
  - `default` is a recommendation, not a pre-chosen answer
- **Answers** carry `choice`, `checks`, `text`, `note` and `done`, and live only in the page until it reloads.
- **Feedback text details:** checklist keys are separated by a comma and a space, in item order. An answer and a note on the same node give separate lines, and text is JSON-escaped.
- **Layout:** one metrics table feeds both layout and drawing, so a drawn card is always as tall as its layout box. Columns are centred on their tree's midline.
- **The page must wait** for a non-zero canvas size before placing the camera. Otherwise a pane that is still sizing opens at minimum zoom.
- **rough.js** 4.6.6 is pinned with `integrity="sha384-1NLkwxMO2sOqcq7rQkFBhIAUJtbt8ziLxhVKVgKfFGMEU8pF+GEq5LVogviveup6"`.

## Limits not proven

- Wrapping counts characters, not measured text width. It was checked only on this sample's English labels.
- A link drawn to a tree above its source tree was not exercised.
- Pinch zoom on a real touch device was not exercised.

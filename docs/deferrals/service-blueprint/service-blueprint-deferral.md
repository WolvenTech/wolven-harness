---
type: deferral
title: Service blueprint skill
description: A service-blueprint skill that draws swim-lane journey grids and service blueprints waits until a real discovery engagement needs a lanes grid that journey-map's action paths can't carry.
status: stable
---

# Service blueprint skill

**Deferred:** a `service-blueprint` skill that draws research-style journey grids and service blueprints. The skill would cover:

- **The grid:** stages as columns and typed lanes as rows (actions, touchpoints, thoughts, mood, pain points, opportunities).
- **Blueprint lanes:** frontstage, backstage and support processes.
- **Blueprint lines:** interaction, visibility and internal interaction.
- **Mood:** curves per persona, including a full-page "mood spine" layout.

**Why:** the Human wants a quick tool for exploring journeys and paths. So user journeys are drawn by `journey-map` as action paths, with optional mood, thoughts, touchpoints, pains and opportunities on each step ([PRD](../../prds/journey-map/journey-map-prd.md)). A lanes grid is a heavier research deliverable, with its own layout and its own references:

- [NN/g, UX Mapping Methods Compared](https://www.nngroup.com/articles/ux-mapping-cheat-sheet/)
- [NN/g, Service Blueprints: Definition](https://www.nngroup.com/articles/service-blueprints-definition/)

Building it now would widen `journey-map` past that need ([research note](../../notes/visual-map-kinds/visual-map-kinds-note.md)).

**Today:** `journey-map` draws action paths only. A throwaway prototype of three grid layouts for the cj_001 journey is kept in [prototype/](prototype/README.md) as this deferral's primary source. Its run command still uses the paths from the branch it was built on.

- **A, classic grid:** stages by lanes, with mood curves and blueprint lines.
- **B, mood spine:** the mood curve as the main axis, with lanes hanging above and below.
- **C, stage cards:** one card per stage, with the lanes inside it.

The Human liked all three. B's spine reappears in `journey-map` only as a slim, optional mood strip under the walked path.

## Deferred

- A `service-blueprint` skill with its own JSON format, layouts A to C as starting points, blueprint lanes and lines, and per-persona mood curves.
- **Format questions the prototype raised:**
  - Stages and steps: source data may score mood per stage.
  - Cells may sit at a stage or a step, and the format needs a rule for each.
  - Cell ids.
  - Lane names stay visible while walking.
  - Agent annotations cover cell content.

## Contract impact

A new skill in a skill set is outside the public contract (ADR-004). It needs a set entry, the partition test and listings, like any skill.

Every skill installs on its own, so it can't load `journey-map`'s renderer. It ships its own copy of the canvas, notes and feedback code, or a later decision makes that code a shared install.

## Triggers

- [ ] A discovery engagement needs a journey grid or a service blueprint as a deliverable, not an action path.
- [ ] A team asks `journey-map` for frontstage and backstage lanes, or lines of visibility, on a real map.
- [ ] The Human opens a PRD for it.

## Non-goals while deferred

- No lanes, blueprint lines or stage-by-lane grids in `journey-map`.
- No `service-blueprint` folder in templates, and no mention of it in shipped skills.

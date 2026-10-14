---
type: deferral
title: Architectural map skill
description: An architectural-map skill that draws C4 context, container and dynamic diagrams with nested boundaries and automatic layout waits until a real system map is needed and journey-map's tree layout can't draw it.
status: stable
---

# Architectural map skill

**Deferred:** an `architectural-map` skill that draws C4 diagrams from JSON: context, container and dynamic diagrams. It follows C4's rules:

- Each element states its type, a description and its technology.
- Each arrow is one-way and labelled.
- Boundaries can nest.
- There is a title and an automatic key.

Sources: [C4 notation](https://c4model.com/diagrams/notation), [C4 abstractions](https://c4model.com/abstractions).

**Why:** the Human scoped `journey-map` to a quick tool for journeys, paths and tree-shaped diagrams ([PRD](../../prds/archived/journey-map/journey-map-prd.md)). Architecture graphs have nested boundaries, many-to-many arrows and cycles, which need a layered layout engine. The research found that ELK Layered handles compound graphs, ports and orthogonal routing ([ELK Layered](https://eclipse.dev/elk/reference/algorithms/org-eclipse-elk-layered.html)). The elkjs 0.9.3 bundle is 1,606,238 bytes, or 469,513 bytes gzipped ([research note](../../notes/visual-map-kinds/visual-map-kinds-note.md)). That is a dependency with no present user in this PR.

**Today:** `journey-map` draws tree-shaped flows only, with depth columns and no nested groups. A hand-written system drawing exists in [One-Man-Team PR #39](https://github.com/rafiti052/One-Man-Team/pull/39). It is a tooling landscape, which is a C4 type this deferral would still leave out.

## Deferred

- An `architectural-map` skill with a `c4` JSON format covering context, container and dynamic diagrams, as the research note's "c4" sketch describes.
- ELK Layered from a pinned CDN script, loaded only on its pages, with a readable message when it fails to load.
- A Next and Back stepper over the order of a dynamic diagram.
- The first reference map: one-man-team as context, container and dynamic diagrams.

## Contract impact

A new skill in a skill set is outside the public contract (ADR-004). It needs a set entry, the partition test and listings.

Every skill installs on its own, so it ships its own copy of the canvas, notes and feedback code, or a later decision makes that code a shared install.

## Triggers

- [ ] The first real system map is needed, such as one-man-team's containers or an agent-automation stack, and a tree drawn with `journey-map` can't show its boundaries or cycles.
- [ ] An agent hand-writes HTML for an architecture diagram again, as in One-Man-Team PR #39.
- [ ] The Human opens a PRD for it.

## Non-goals while deferred

- No `c4` kind, nested boundaries or ELK in `journey-map`.
- No `architectural-map` folder in templates, and no mention of it in shipped skills.

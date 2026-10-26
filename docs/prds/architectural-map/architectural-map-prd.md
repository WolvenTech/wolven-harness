---
type: prd
title: Architectural maps for real systems
description: Let a developer explain a system's boundaries, dependencies and component structure without rebuilding an architecture diagram by hand for each request.
status: draft
---

# Architectural maps for real systems

Drafted from the recorded request and fired deferral triggers on 2026-10-22;
grilling did not run because it is absent from the session skill list.

## Problem

- **Who:** a developer explaining the harness or another real system to a collaborator.
- **Pain:** `journey-map`'s tree-shaped action paths cannot show nested system boundaries, cycles or many-to-many dependencies, so the developer needs another hand-written diagram.
- **Why now:** the former architectural-map deferral records a 2026-10-21 request for harness C4 context, container and component views after the install-experience iteration, and another hand-drawn diagram for that request.
- **Evidence:** the [visual-map research](../../notes/visual-map-kinds/visual-map-kinds-note.md), the [journey-map PRD](../archived/journey-map/journey-map-prd.md), and [PR #58](https://github.com/WolvenTech/wolven-harness/pull/58), which delivered journey-map within its action-path scope. [One-Man-Team PR #39](https://github.com/rafiti052/One-Man-Team/pull/39) is earlier evidence of a hand-written system drawing; its tooling-landscape view is not a C4 acceptance fixture. The dated request is repository-recorded evidence, not a fresh user interview.

## Goals

- **G1: Explain the real system.** Success signal: the developer can use the harness's context, container and component views to identify the system boundary, its major parts and their relationships.
- **G2: Revise without rebuilding a diagram by hand.** Success signal: changing a confirmed relationship produces an updated, readable map without hand-positioning HTML elements or inventing missing architecture.

**Non-goals**

- Service-blueprint grids, mood lanes or changes to `journey-map`'s tree format.
- A general diagram editor, automatic codebase discovery or a tooling-landscape format.
- A selected layout engine, dependency, JSON schema or renderer architecture.
- Dynamic-diagram playback in the first deliverable; its need remains an open question.

## User stories

### US-1: Explain system structure at the right level

**As a** developer explaining the harness,
**I want** context, container and component views of its confirmed architecture,
**so that** a collaborator can follow its boundaries and dependencies.

Traces to goal: G1.

#### AC-1.1: Real harness views

**Given** confirmed source material for the harness after the install-experience changes
**When** the developer requests context, container and component views
**Then** each view has a title and key, elements state their type, purpose and technology where applicable, boundaries can nest, and each relationship is directed and labelled, following [C4 notation](https://c4model.com/diagrams/notation).

#### AC-1.2: Missing architecture evidence

**Given** a boundary, component or relationship is not supported by the supplied evidence
**When** the map is prepared
**Then** the missing information is identified for confirmation rather than presented as a settled fact, and confirmed parts remain usable.

### US-2: Keep a graph readable as it changes

**As a** developer revising a system explanation,
**I want** the map to handle cross-boundary relationships and cycles,
**so that** I do not rebuild the drawing by hand.

Traces to goals: G1 and G2.

#### AC-2.1: Update a relationship

**Given** a confirmed map with nested boundaries and many-to-many relationships
**When** the developer adds or changes a relationship
**Then** the updated map keeps labels and arrow directions readable without requiring hand-positioned diagram elements.

#### AC-2.2: Cycles and invalid references

**Given** a relationship creates a cycle or names an element absent from the map
**When** the map is updated
**Then** a valid cycle remains visible, and an absent element is reported with the relationship that needs correction rather than silently dropping it.

## Scope

**In**

- An `architectural-map` capability separate from `journey-map`, grounded in the harness request recorded on 2026-10-21.
- Context, container and component views with nested boundaries and readable graph relationships.
- A repeatable way to revise and share the resulting maps.

**Out**

- Service blueprints, journey grids and a general-purpose canvas editor.
- Choosing ELK, a CDN, shared renderer packaging or skill-set membership before the spec weighs the smallest implementation.
- Automatically converting every repository into a complete architecture model.

## Open questions

- Which merged install-experience state should the first harness map describe, given that check-and-repair PR #76 is still open at this review? — owner: Human.
- Does the first deliverable need a dynamic view as well as the recorded context, container and component request? The original deferral proposed dynamic views before the component request was recorded. — owner: Human.
- What sharing and interaction does the first real reader need beyond readable views? — owner: Human.

## Handoff

After approval → `code-spec`. This PRD does not authorize implementation.
It replaces the architectural-map deferral; requirements remain draft until
the Human explicitly approves them. No architecture decision is settled here.

---
type: deferral
title: Wayfinder skill and maps layout
description: A portable wayfinder skill and a docs/maps doc-folder for fog-of-war planning wait until a consumer meets a decision too foggy for grilling alone.
status: stable
---

# Wayfinder skill and maps layout

**Deferred:** a portable `wayfinder` skill and the `docs/maps/` doc-folder it writes to.

**Why:** `grilling` covers the interviewing every shipped skill needs. A map only pays off when a decision has several open unknowns that each need research or a prototype before a PRD, and no consumer has had one. A `docs/maps/` folder with nothing writing to it would be dead layout in every install.

**Today:** `grilling` is the only interviewing skill. `prototype` records its verdict on the PRD, and no shipped skill names `wayfinder` or maps. The frozen design is in the "Map layout (`wayfinder`)" section of [the spec D record](../../specs/archived/wolven-harness-d-code-lane/wolven-harness-d-code-lane-spec.md).

## Deferred

- A `wayfinder` skill that charts a map (destination through `grilling`, a breadth-first frontier, research tickets through `research`) and works it (claim, resolve one ticket per session, graduate fog), handing off to `create-prd` or `code-spec`.
- `docs/maps/<slug>/<slug>-map.md` with one file per ticket (`title`, `ticket`, `status`, `claimed_by`, `blocked_by`), a `map` type in the writing profile, a `maps` QMD collection and a router row.

## Contract impact

A new skill is outside [ADR-004](../../adrs/adr-004-standalone-skills-contract.md). A sixth governed doc-folder and a new `type` change what `validate` checks in a consumer's `docs/`, so they need an ADR-004 amendment and a minor release.

## Triggers

- [ ] A consumer faces a decision with several open unknowns that need research or prototype tickets before a PRD. Then write a spec for `wayfinder` from that case.
- [ ] The Human opens a spec for it.

## Non-goals while deferred

- No map templates, no `map` type in `validate`, and no `docs/maps/` folder from `setup`.
- No references to `wayfinder` or maps from other shipped skills.

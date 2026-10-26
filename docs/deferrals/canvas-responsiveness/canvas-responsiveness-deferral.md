---
type: deferral
title: Canvas responsiveness
description: Making a canvas usable at phone width without scaling row text down waits for a later iteration whose job is canvas responsiveness, or an explicit ask.
status: stable
---

# Canvas responsiveness

**Deferred:** responsiveness on canvases, so a page stays usable at phone width without scaling row text below the size it states.

**Why:** the present evidence is the lanes page. At 375px wide, fit-to-width shrinks the desktop-wide row until the zoom label reads 35%, so row text draws smaller than its CSS size. The [lanes smoke note](../../notes/wayfinder-lanes-smoke/wayfinder-lanes-smoke-note.md) measured a 375×812 viewport, computed title 14px and state 12px, that 35% zoom label, the state word under the title, and a bottom sheet. Computed CSS size is not the on-screen size. [PR #82](https://github.com/WolvenTech/wolven-harness/pull/82) leaves the current fit behaviour in place. Spec R5.6 and PRD AC-4.2 still name full-size row text; this record is that gap, and it does not change those docs.

**Today:** the lanes camera still fits the row width into the viewport. No canvas refit, reflow, or second layout is part of this change.

## Triggers

- [ ] A later iteration whose job is canvas responsiveness.
- [ ] The Human asks to make a canvas usable at phone width without scaling row text down.

## Non-goals while deferred

- No change to the current fit behaviour on this pull request.
- No in-page radial toggle, theme switcher, or second layout engine.

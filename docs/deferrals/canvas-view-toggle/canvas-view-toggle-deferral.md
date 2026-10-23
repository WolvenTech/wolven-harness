---
type: deferral
title: Lanes and radial toggle in one wayfinder canvas
description: One wayfinder canvas page carrying both the lanes and the radial view behind a toggle waits until Humans keep asking to flip views on the same map; until then radial is a separate page the agent builds only on request.
status: draft
---

# Lanes and radial toggle in one wayfinder canvas

**Deferred:** a toggle inside one wayfinder canvas page that switches between the lanes view and the radial view of the same map.

**Why:** the lanes view becomes the default wayfinder canvas, and the radial view stays available on request. The Human chose "ask is lighter and cheaper" over a toggle. Under `pragmatic-guard`:

- **Need: 2/10.** Nobody has yet needed both views of one map in one sitting. Asking the agent for the radial page covers the occasional look.
- **Complexity: 5/10.** One page would inline both renderers. The skill's renderer manifest would grow, the open ticket would have to be shared across two drawings, and every page would ship code most Humans never run.

**Also deferred:** the agent offering the radial page unprompted, for example for a large map. The prototype's 30-ticket map read fine as lanes, so the Human chose ask-only.

**Once the lanes PRD ships:** `build-canvas.mjs` writes the lanes page, and the agent builds the radial page only when the Human asks for it.

**Primary source:** the throwaway prototype, untracked under `prototypes/wayfinder-metro/` in the `claude/wayfinder-map-prototype-0e424f` worktree, which switched views with `?variant=`. The [wayfinder lanes PRD](../../prds/wayfinder-lanes/wayfinder-lanes-prd.md) records its verdict.

## Revisit triggers

- [ ] Humans ask for the radial page of the same map on two or more separate maps.
- [ ] A Human asks to flip between lanes and radial without asking the agent each time.
- [ ] The lanes view fails to read on a real map, so the radial view is needed side by side to compare.

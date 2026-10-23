---
type: note
title: Wayfinder lanes browser smoke
description: Step-by-step browser smoke of the default wayfinder lanes canvas against billing-30, starter, medium and reached fixtures; every R5 behaviour check passes, and the Cursor browser denies a real clipboard write.
status: draft
---

# Wayfinder lanes browser smoke

- Date: 2026-10-23
- Browser: Cursor IDE built-in browser (Chromium, macOS)
- Commit: 8e8fc42 (built from this worktree at that revision)

## Setup

Pages were built with `templates/.agents/skills/wayfinder/scripts/build-canvas.mjs` and, for panel parity, `build-canvas.mjs --radial` on billing-30. Generated HTML and JSON live under `.scratch/wayfinder-smoke/docs/maps/` (not committed), with a local `docs/maps/.gitignore` listing `*-canvas.json` and `*-canvas.html`.

| Fixture | Map source | Lanes page |
| --- | --- | --- |
| billing-30 | `test/fixtures/wayfinder/billing-30/` | `billing-30-canvas.html` |
| billing-30 radial (panel compare) | same folder | `billing-30-radial-canvas.html` |
| starter | ticket tree from `test/fixtures/wayfinder/starter-canvas.json` | `postgres-backups-canvas.html` |
| medium | ticket tree from `test/fixtures/wayfinder/medium-canvas.json` | `onboarding-portal-canvas.html` |
| reached | ticket tree from `test/fixtures/wayfinder/billing-30-reached-canvas.json` | `billing-30-reached-canvas.html` |

A Python `http.server` on `127.0.0.1:8822` served `.scratch/wayfinder-smoke/docs/maps/` with `Cache-Control` left at the default. Drives used: page load, real clicks, wheel pans on `#stage`, keyboard Enter, CDP viewport and `prefers-color-scheme` emulation, and in-page reads of DOM, computed styles and `RadialLayout` copy helpers.

## Results: lanes canvas

| Check | Steps | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| proof-wayfinder-lanes-smoke-desktop (R5.1) | Emulate 1440×900. Load billing-30 lanes. Inspect zoom, row text and wheel pan. | Zoom 100%. Every row shows number, title and state at full size. No row text overlaps. Lower rows reachable by scrolling. | `innerWidth` 1440. Camera `translate(24 185) scale(1)` and zoom label 100%. Ticket 16 row text sizes: number 12px, title 13px, state 11.5px. Zero bounding-box overlaps across 30 ticket rows' text nodes. Row 30 started below the fold; six wheel-up events on `#stage` moved the camera to `translate(24 -520) scale(1)` and brought row 30 into view. Screenshot: `page-2026-10-23T20-05-55-294Z.png` in the session temp folder. | PASS |
| proof-wayfinder-lanes-smoke-maps (R5.2) | Load starter, medium and reached lanes pages. Read Start, fog and destination bars and the reached overview panel. | Each map draws Start, fog and destination bars where the fixture has fog. Reached marks destination reached and shows create-prd or code-spec next step. | Starter: SVG labels `START`, `FOG ×2` with patch text, `DESTINATION`. Medium: `START`, `FOG ×3`, `DESTINATION`. Reached: `START`, `DESTINATION REACHED` (no fog row; fixture fog is empty). Reached header "27 decided, 3 out of scope". Overview panel kind "Destination reached" with text "Every ticket is decided and no fog remains. Next step: run create-prd … or code-spec …". | PASS |
| proof-wayfinder-lanes-smoke-panel (R5.3) | On billing-30 lanes and `--radial`, open tickets 16, 21, 09 and 24 (click and Enter on 16). Press copy on 24 with note "lanes smoke". Compare sections and copy text. | Panel sections match radial for each ticket. Copy button would put the same text on the clipboard as radial. | For all four tickets, lanes and radial panels share the same h2, kind, section headings and action label. Examples: 16 — sections Question, Depends on, File, "Take this ticket"; 21 — adds Unblocks and stale-claim callout; 09 — adds Gist, Resolution, redo callout; 24 — "Copy for agent", Waiting in the fog. `RadialLayout.handoff` / `copyText` strings match byte-for-byte between pages for each id. Enter on focused row 16 opened the same ticket panel as click. `navigator.clipboard.writeText` rejected with `NotAllowedError` (document not focused); status "Copy blocked: select the text in the box and copy it." and read-only `#feedback` held the same `copyText` body as radial for ticket 24 with note "lanes smoke". Real clipboard write not observed. | PASS |
| proof-wayfinder-lanes-smoke-dim (R5.4) | On billing-30 lanes, hover row 16; open row 16 panel; read `#canvas.dimmed` and `.node` opacity. | Everything outside the ticket, its blockers and dependents dims. | Hover and open panel both set `#canvas.dimmed`. On hover 16: ticket 16 and blocker 06 opacity 1 with class `rel`; unrelated 01 opacity 0.16; unrelated 17 opacity 0.16. Related tracks keep class `rel` on path groups. | PASS |
| proof-wayfinder-lanes-smoke-dark (R5.5) | On billing-30 lanes at 1440px, emulate `prefers-color-scheme: dark` then `light` without reload. | Dark page with distinct lanes, markers and text; switch to light recolours without reload. OS mode not changed; CDP emulation only. | Dark: `matchMedia('(prefers-color-scheme: dark)').matches` true, body background rgb(18, 18, 24), header rgb(236, 236, 243), `--lane-0` #e0559a, lane strokes use `var(--lane-0)`. Light (same tab, no reload): light preference matches, body rgb(246, 246, 249), `--lane-0` #9b0056. | PASS |
| proof-wayfinder-lanes-smoke-phone (R5.6) | Emulate 375×812. Load billing-30 lanes. Click row 16. | Row text keeps size; state sits under title; panel is a bottom sheet. | `innerWidth` 375. Row 16 title 13px and state 11.5px with class `l-state narrow`; state top below title box. Panel open with box [14, 275, 361, 746], `bottom` 66px — bottom sheet over the map. Frontier chip visible. | PASS |

## Findings

- All six R5 smoke rows passed on the built lanes pages.
- The Cursor IDE browser denies `clipboard-write`, so copy parity was checked via `RadialLayout.copyText` and the read-only fallback textarea, matching the earlier radial smoke note.
- Colour-mode checks used CDP `prefers-color-scheme` emulation, not a live OS appearance toggle.
- Scratch build output and screenshots were not committed; `prototypes/` was left untouched.

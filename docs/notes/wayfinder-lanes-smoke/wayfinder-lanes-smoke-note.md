---
type: note
title: Wayfinder lanes browser smoke
description: Browser smoke of the neutral-grey lanes canvas at 7f5b29c against billing-30, starter, medium and reached. R5.1–R5.5 pass. R5.6 keeps the phone measurements and defers on-screen row-text size. The Cursor browser denies a real clipboard write.
status: draft
---

# Wayfinder lanes browser smoke

- Date: 2026-10-23
- Browser: Cursor IDE built-in browser (Chromium, macOS)
- Commit: 7f5b29c (neutral-grey lanes page). `renderer/lanes.html` and `renderer/lanes-draw.js` are unchanged after that commit. Pages were rebuilt from this worktree with the default build. The radial page was built only for the panel comparison.

## Setup

Pages were built with `templates/.agents/skills/wayfinder/scripts/build-canvas.mjs` and, for panel parity, `build-canvas.mjs --radial` on billing-30. Generated HTML and JSON live under `.scratch/wayfinder-smoke/docs/maps/` (not committed), with a local `docs/maps/.gitignore` listing `*-canvas.json` and `*-canvas.html`.

| Fixture | Map source | Lanes page |
| --- | --- | --- |
| billing-30 | `test/fixtures/wayfinder/billing-30/` | `billing-30-canvas.html` |
| billing-30 radial (panel compare) | same folder | `billing-30-radial-canvas.html` |
| starter | ticket tree from `test/fixtures/wayfinder/starter-canvas.json` | `postgres-backups-canvas.html` |
| medium | ticket tree from `test/fixtures/wayfinder/medium-canvas.json` | `onboarding-portal-canvas.html` |
| reached | ticket tree from `test/fixtures/wayfinder/billing-30-reached-canvas.json` | `billing-30-reached-canvas.html` |

A Python `http.server` on `127.0.0.1:8823` served `.scratch/wayfinder-smoke/docs/maps/`. Drives used: page load, real clicks, wheel events on `#canvas`, keyboard Enter and Escape, CDP viewport and `prefers-color-scheme` emulation, and in-page reads of DOM, computed styles and copy fallback text.

The default billing-30 page is the grey page. Light `--paper` is `oklch(96.8% 0 0)` and dark `--paper` is `oklch(20% 0 0)`, both chroma 0. Lane strokes use `var(--lane-0)`, which stays coloured (`oklch(54% 0.19 25)` in light, `oklch(70% 0.16 25)` in dark). The built page has no "ochre" token.

## Results: lanes canvas

| Check | Steps | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| proof-wayfinder-lanes-smoke-desktop (R5.1) | Emulate 1440×900. Load billing-30 lanes. Inspect zoom, row text and wheel pan. | Zoom 100%. Every row shows number, title and state at full size. No row text overlaps. Lower rows reachable by scrolling. | `innerWidth` 1440, `innerHeight` 900. Camera `translate(24 165.46875) scale(1)` and zoom label 100%. Ticket 16 text sizes: number 11px, title 14px, state 12px. Zero bounding-box overlaps across the 30 ticket rows' number, title and state nodes. Twelve rows started below the fold (lowest was ticket 18). Ten wheel events on `#canvas` moved the camera to `translate(24 -1034.53125) scale(1)` at 100% and brought ticket 18 and the DESTINATION bar into view. Screenshots: `lanes-smoke-desktop-1440.png` and `lanes-smoke-desktop-scrolled.png` in the session temp folder. | PASS |
| proof-wayfinder-lanes-smoke-maps (R5.2) | Load starter, medium and reached lanes pages. Read Start, fog and destination bars and the reached overview panel. | Each map draws Start, fog and destination bars where the fixture has fog. Reached marks destination reached and shows create-prd or code-spec next step. | Starter: SVG labels `START`, `FOG ×2`, `DESTINATION` (5 ticket rows). Medium: `START`, `FOG ×3` with patch text "Remote hardware shipping · Buddy programme · Compliance training", `DESTINATION` (12 ticket rows). Reached: `START`, `DESTINATION REACHED`, no fog label. Reached header "27 decided" and "3 out of scope". Overview kind "Destination reached" with text "Every ticket is decided and no fog remains. Next step: run create-prd to turn these decisions into a PRD, or code-spec to freeze them into a spec." Each page's `--paper` is `oklch(96.8% 0 0)`. | PASS |
| proof-wayfinder-lanes-smoke-panel (R5.3) | On billing-30 lanes and `--radial`, open tickets 16, 21, 09 and 24. Press Enter on a focused row. Press copy on 24 with note "lanes smoke". Compare sections and copy text. | Panel sections match radial for each ticket. Copy button would put the same text on the clipboard as radial. | Click on lanes row 16 opened Question, Depends on, File, kind "Take now", action "Take this ticket". Enter on focused lanes row 17 opened that ticket's panel (Question, Depends on, File, "Take this ticket"). Clicked lanes rows 21, 09 and 24. Clicked the same four ids on the radial page. Lanes and radial panels share h2, kind, section headings, callouts and action. 16 — Question, Depends on, File, "Take this ticket". 21 — adds Unblocks, state "Claimed by claude-code-4f2 at 2026-10-14T09:00:00Z", stale-claim callout, "Take this ticket". 09 — adds Gist "First 1000 calls free", Resolution, redo callout "Its premise was broken by 07 Fix the rounding rule. Re-resolve it in place.", Unblocks, "Take this ticket". 24 — kind "Waiting in the fog", Question, Depends on, File, "Copy for agent". Radial 24 also shows state "Waiting on 21". Copy on both pages with note "lanes smoke" wrote the same read-only `#feedback` body: "wayfinder feedback for docs/maps/billing-30/\nTicket: docs/maps/billing-30/24-backfill-run.md — Run the backfill on staging (task), blocked\nNote from the Human: lanes smoke". `navigator.clipboard.writeText` rejected with `NotAllowedError: Failed to execute 'writeText' on 'Clipboard': Document is not focused.` Status: "Copy blocked: select the text in the box and copy it." Real clipboard write not observed. | PASS |
| proof-wayfinder-lanes-smoke-dim (R5.4) | On billing-30 lanes, pointer-enter row 16; open row 16 by click; read `#canvas.dimmed` and `.node` opacity. | Everything outside the ticket, its blockers and dependents dims. | Pointer-enter on row 16, with the panel closed, set `#canvas.dimmed`. Ticket 16 and blocker 06 opacity 1 with class `rel`; unrelated 01 and 17 opacity 0.16. Four elements carried class `rel`. Pointer-leave cleared the dim. A click that opened the ticket 16 panel also set `#canvas.dimmed` with the same opacities for 16, 06, 01 and 17. `element.focus()` and a Tab key from this browser did not emit a focus event. A DOM `focus` event dispatched on row 16 did set `#canvas.dimmed` and class `rel` on that row. | PASS |
| proof-wayfinder-lanes-smoke-dark (R5.5) | On billing-30 lanes at 1440px, emulate `prefers-color-scheme: dark` then `light` without reload. | Dark page with distinct lanes, markers and text; switch to light recolours without reload. OS mode not changed; CDP emulation only. | Dark, same document (`performance` navigation count stayed 1): `matchMedia('(prefers-color-scheme: dark)').matches` true, body background `oklch(0.2 0 0)`, header text `oklch(0.92 0 0)`, `--paper` `oklch(20% 0 0)`, `--ink` `oklch(92% 0 0)`, `--lane-0` `oklch(70% 0.16 25)`, a lane path stroke computed `oklch(0.7 0.16 25)` from `var(--lane-0)`, title fill `oklch(0.92 0 0)`. Light, same tab, no reload: light preference matches, body `oklch(0.968 0 0)`, `--paper` `oklch(96.8% 0 0)`, `--ink` `oklch(23% 0 0)`, `--lane-0` `oklch(54% 0.19 25)`, path stroke `oklch(0.54 0.19 25)`. Chrome stays chroma 0; lane lines stay coloured. Screenshot: `lanes-smoke-dark.png`. | PASS |
| proof-wayfinder-lanes-smoke-phone (R5.6) | Emulate 375×812. Load billing-30 lanes. Click row 16. | Row text keeps size; state sits under title; panel is a bottom sheet. | `innerWidth` 375, `innerHeight` 812. Row 16 title 14px and state 12px, the same computed sizes as the 1440 layout, with class `l-state narrow`. State top meets the title bottom, so the state word sits under the title. Zoom label 35% because the camera fits the row width into 375px. Click opened the panel: fixed, open, box [14, 275, 361, 746], CSS `bottom` 66px, over the map, with the Frontier chip expanded. Screenshot: `lanes-smoke-phone.png`. The 35% zoom is the on-screen scale, so computed CSS size is not the drawn size. That gap is deferred in [canvas responsiveness](../../deferrals/canvas-responsiveness/canvas-responsiveness-deferral.md). No further browser run was made for this correction. | DEFERRED (on-screen text size) |

## Findings

- R5.1–R5.5 passed on the neutral-grey lanes page from 7f5b29c. R5.6 is not a pass for on-screen text size: the measured zoom label was 35%, and that camera scale is the deferred gap in [canvas responsiveness](../../deferrals/canvas-responsiveness/canvas-responsiveness-deferral.md).
- The Cursor IDE browser denies `clipboard-write` (`NotAllowedError`, document not focused), so copy parity was checked via the read-only fallback textarea, which matched the radial page byte for byte for ticket 24 with note "lanes smoke".
- Colour-mode checks used CDP `prefers-color-scheme` emulation, not a live OS appearance toggle. Device metrics were cleared after the phone check.
- Scratch build output and screenshots were not committed.

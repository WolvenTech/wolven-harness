---
type: note
title: Journey map browser smoke
description: Step-by-step browser smoke of the journey-map renderer; eight checks pass, the upward link fails, and the pinch is untested.
status: stable
---

# Journey map browser smoke

- Date: 2026-10-13
- Browser: the Claude desktop app's built-in browser pane (Chrome 152 engine, macOS)
- Commit: 20ec137 (working tree with the uncommitted fixture and test edits)

## Setup

Pages were built with `templates/.agents/skills/journey-map/scripts/build-map.mjs` from two maps, then served from a temp directory by a small Python server on `127.0.0.1`.

- `lotr-map.json`: a flow tree and a ticket tree, with open, claimed and closed tickets.
- An upward-link map: two flow trees of three nodes each, with the link `b2` to `a1` pointing from the lower tree to the upper one.
- Under `/deny-clipboard/` the server sends `Permissions-Policy: clipboard-write=()`.
- Under `/block-cdn/` it sends a CSP that leaves jsDelivr out of `script-src`.
- For the sizing check, a wrapper page holds the map in an iframe of 0x0 and resizes it to 900x600 after 300 ms.

Drives used: `find` and `read` of the page, real clicks and key presses, and `javascript_tool` to read state. Tool click coordinates are in an 800x600 frame; the viewport is 1024x768.

## Results

| Check | Steps | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| Reveal on choice | Load `lotr-map`. Click "The Road". | Bree and Rivendell and the pack checklist appear. The world `transform` changes. | Nodes went from `shire,route` plus tickets to `+bree,rivendell,pack`. `transform` went from `translate(107 -29) scale(1)` to `translate(-221.9 130.9) scale(0.619)`. The Road became `aria-checked=true`. | PASS |
| Reveal on Continue | Press Continue on the pack checklist. | The "pony" text node appears. The camera moves. | `pony` appeared. `transform` became `translate(-1648 -29) scale(1)`. | PASS |
| Show whole map on | Press "Show whole map". | All 20 nodes are drawn, unreached ones faint. The button shows pressed. | 21 `data-node` groups (the text node has a second input group). Unreached nodes had `class=ghost` and opacity 0.32. `aria-pressed=true`, label "Hide upcoming". Camera fitted at 19%. | PASS |
| Show whole map off | Press it again. | Reveal returns. The answer is kept. | `aria-pressed=false`, label "Show whole map". Only the earlier nodes remained. The Road stayed `aria-checked=true`. The checklist ticks were unchanged. | PASS |
| Keyboard Tab pass | Tab from the page top through 16 stops, then 30 stops with all nodes open. | Every option, checkbox, text box, note button, Continue, toggle, Copy, Start over and zoom button takes focus. | All of them took focus, in this order: toggle, Start over, Copy, the canvas itself, then each card in layout order, then zoom out, 100%, zoom in, fit. The canvas `svg` is one extra stop. | PASS |
| Keyboard Enter and Space | Focus an option and press Enter. Focus a checkbox and press Space. Focus an option and press Space. Focus Continue and press Enter. Focus the toggle and press Enter, then Space. | Each operates. | Enter chose "The Old Forest". Space unticked "Rope". Space chose "The Road". Enter on Continue revealed the pony node. The toggle went true on Enter and false on Space. | PASS |
| Drag chooses nothing | Reload. Press on "The Road" and drag 4 px (the pointer lands 5 CSS px away after frame scaling). | The map pans. No option is chosen. | Events: `pointerdown` on the "The Road" radio at (707,384), then `pointerup` and `click` at (712,384) on the canvas. `transform` shifted by 5 px. Both radios stayed `false`. | PASS |
| Upward link | Open the upward-link map. Sample the link path every 4 px. Compute card boxes with `JourneyMapLogic.layout`. | No sample point falls inside a card box. | 621 points. 72 fall inside `b2` and 74 inside `a2`. The link leaves the bottom of `b2` and rises vertically at x=990 through `b2` and `a2` to a shelf at y=50, then runs left to `a1`. | FAIL |
| Upward link, re-run after fix | Rebuild the same upward-link map. Open it with "Show whole map" on. Sample the drawn link every 4 px. Compare against `JourneyMapLogic.layout` boxes. Also open `lotr-map` with the whole map shown and look at the two downward links. | The link rises without crossing a card. The LotR links draw cleanly. | The link now leaves the left edge of `b2` at (840,435), runs left through the column gutter and the gap between the trees, rises at x=420 and enters `a1` from the left at (444,153). `linkRoute` returned the same points. 384 samples: none fall inside any card box with a 2 px inset. The only sample inside a box is the start anchor, 0.07 px past `b2`'s left edge. In `lotr-map`, both downward links ("Back to the Council", "Review the halted journey") draw dashed through the gutters with their label pills, and none of their samples fall inside a card. The ordinary option curves start inside their choice card by design. Commit 20ec137, uncommitted fix. | PASS |
| Clipboard fallback | Open `/deny-clipboard/lotr-map.html`. Choose "The Road". Press "Copy for agent". | A read-only textarea holds the feedback text, selected. | `navigator.clipboard.writeText` rejected with `NotAllowedError`. The panel opened. The textarea was read-only, focused, and selected 0 to 97, the whole text: `journey-map feedback for lotr-map.json` and the `route` line. | PASS |
| Pane still sizing | Open the wrapper. The iframe is 0x0 for 300 ms, then 900x600. Read `#pct` and `transform` in the iframe. | A readable zoom, above 30%. | `#pct` read 100%. `transform` was `translate(45 -113) scale(1)`. The first run was taken with the pane hidden, where animation frames pause, so the result comes from a second run with the pane shown. | PASS |
| Ticket look | Read the ticket cards in `lotr-map`. One screenshot. | Each status is distinct. The claimed ticket shows avatar and name. A blocked ticket shows its pill. | Status stripes: closed `#22c55e`, claimed `#3b82f6`, open `#f59e0b`. "Try a bridge" shows avatar "G" and "Gimli". The two open tickets behind it show the pill "blocked: waiting on a ticket". | PASS |
| Blocked CDN | Open `/block-cdn/lotr-map.html`. | A message names the rough.js URL, not a blank canvas. | The error panel "This map needs a fix" shows `Unable to load rough.js: https://cdn.jsdelivr.net/npm/roughjs@4.6.6/bundled/rough.js`. The canvas is hidden and `rough` is undefined. | PASS |
| Pinch | Not run. | Two-finger pinch zooms the map. | The pane has no multi-touch input. | Untested |

## Findings

- The upward link crosses cards. `drawLink` in `renderer/draw.js` starts the link at the bottom of its source card and runs straight up at the source card's middle x. Any card above it in the same column is crossed, and so is the source card's own body. In the test map the link crossed `b2` and `a2`. This row is the original result. The fix is covered by the re-run row above.
- The drag distance came out as 5 CSS px, not 4, because the tool's 800x600 frame scales to a 1024x768 viewport. The pan threshold itself is not measured by this run.

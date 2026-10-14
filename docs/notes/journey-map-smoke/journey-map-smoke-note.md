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

## Iteration 1

### Setup

- Date: 2026-10-13
- Commit: 656e57c (working tree with the uncommitted skill, template, test and fixture edits)
- Pages were built with `templates/.agents/skills/journey-map/scripts/build-map.mjs` and served from a scratch directory by a Python server on `127.0.0.1:8790`. No HTML went into the repository.
- Fixtures: `cj-001-reference-map.json` for the J4.5 items, the toolbar and the shortcuts. `cj-001-map.json` for the branch, the no-mood step and the annotation. `lotr-map.json` for the text box. Copies of both cj-001 maps with `persona` removed give the face-only case.
- Widths: 1440x900 and 800x900, set with the pane's viewport emulation. The camera animates for 1 to 3 s, so each measure waited 2 to 3 s.
- Drives: real clicks and key presses, `find`, screenshots, and `javascript_tool` to read geometry and state.
- Proof ids: `proof-journey-map-iter1-journey-smoke` covers the J4.5 rows. `-prev-next-smoke` covers the Prev and Next row and the fresh-load shortcut row. `-toolbar` (smoke part) covers the toolbar and menu rows. `-enter-continues` covers the Enter row. `-whole-map-refit` covers the refit row. `-note-annotation` (smoke part) covers the note row.

### Results

Each row lists the 1440 result, then the 800 result.

| Check | Steps | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| J4.5 mood band fill | Open `cj-001-reference-map`. Read the band fill of each step card. | Orange for -1, grey for 0, green for +1 and +2. | 1440 and 800: -1 is `rgb(234,122,26)`, 0 is `rgb(139,143,163)`, +1 is `rgb(101,163,13)`, +2 is `rgb(18,161,80)`. | PASS at 1440, PASS at 800 |
| J4.5 band text | Read the text in a band. | A face and the persona first name, in white. | The band reads the face and "Alex". No mood word is in the visible text. "Uneasy (-1)" appears only in the `<title>` tooltip and the aria-label. | PASS at 1440, PASS at 800 |
| J4.5 face only | Open the copy with `persona` removed. | The band shows the face and no name. | Bands show the face alone at 1440. At 800 (recheck, rebuilt copy) the band shows the face and no name; "Uneasy (-1)" is only the tooltip text. | PASS at 1440, PASS at 800 |
| J4.5 no-mood step | Open `cj-001-map`. Read `co-1b`. | A grey band with muted text. | Fill `rgb(233,234,240)`, text `rgb(110,113,128)`. | PASS at 1440, PASS at 800 |
| J4.5 mood-coloured edges | Read the stroke of edges into steps and of other edges. | Mood-coloured and thick into steps, grey and thin elsewhere. | Edges into steps are mood-coloured at 3.2 px. Other edges are grey at 1.5 px. | PASS at 1440, PASS at 800 |
| J4.5 chevron and pencil in the band | Count chevrons and pencils outside the 32 px band. | None outside. | 0 outside the band. The persona start card keeps its own pencil in its body, which is the persona card and not a step card. | PASS at 1440, PASS at 800 |
| J4.5 thought cloud | Read the 4 clouds. | Above the card, 3 trailing circles. | All 4 sit above their cards with 3 circles each and 0 paths. | PASS at 1440, PASS at 800 |
| J4.5 count row | Read collapsed steps. | A count row where a step has lists, none where it has none. | `aw-1`, `co-1`, `de-1` and `re-1` have no lists and draw no count row. The others do. | PASS at 1440, PASS at 800 |
| J4.5 expanded stickies | Press `e` (Expand all) after revealing every step. | Chips inside the card, red and green stickies below, no overlap, all nodes in view. | 4 steps expanded, 8 sticky boxes, 0 overlaps among 22 boxes. The camera refit puts every node in view at scale 0.355 at 1440 and 0.189 at 800. | PASS at 1440, PASS at 800 |
| J4.5 persona header | Read the start card. | The persona name, role and goal. | "Alex Rivera", "Small Business Owner" and "GOAL" show. At 800 (recheck) the card reads "Alex Rivera", "Small Business Owner" and "GOAL". | PASS at 1440, PASS at 800 |
| J4.5 mood timeline | Measure `#timeline`. | 120 px tall and inside the viewport. | 120 px tall, 522 px wide. At 1440 its bottom is 834. At 800 it is centred (left 139, right 661). | PASS at 1440, PASS at 800 |
| J4.5 timeline follows a branch | Choose "Leaves for a competitor", then "Starts the trial". | Four points per branch, the low point inside the box, no clipping. | The competitor branch gives four points (low mood last), the lowest bottom 813 inside 714 to 834 at 1440 and 754 to 813 at 800. The trial branch removes the low point. Height stays 120. | PASS at 1440, PASS at 800 |
| Next and `n`, Prev and `b` | Click Next and Prev. Press `n` and `b`. | `n` and Next reveal the next step. `b` and Prev hide it, and Prev disables at the first step. | Next and `n` took 2 nodes to 3 and moved the camera. Prev and `b` hid it, disabled Prev, and moved the camera back. Next disables while the walk waits on `co-choice`. | PASS at 1440, PASS at 800 |
| Shortcut on a fresh load | Load the page. Press `n`, then `b`, with no click. | The shortcut acts at once. | `n` revealed `aw-2` with `#stage` focused and no click. `b` hid it. | PASS at 1440, PASS at 800 |
| Toolbar | Read the toolbar buttons. Open lotr. | Prev, Next, Start over, the menu button and Copy for agent. In lotr (no journey steps) step by step is off and Prev and Next are hidden. | The reference map shows exactly those five. In lotr, Prev and Next are hidden. At 800 the toolbar wraps: "Copy for agent" sits on a second row and the top bar is 94 px tall (14 to 108). Every button stays usable. | PASS at 1440, PASS at 800 |
| Menu items | Open the menu button. Press Escape. Click outside. | The items "Step by step P", "Show whole map W" and "Expand all E". Escape closes it. | The three items read correctly. Escape closes it at both widths. An outside click closed it at both widths. At 800 the menu box runs from x -158 to 72, so most of it is off the left edge of the viewport and only the P, W and E hints show. The 1440 box position was not measured in the first run. Recheck after the `draw.js` fix with rebuilt copies: at 1440 the menu is fully visible, left 1056.6 and right 1286.6. At 800 it is fully visible, left 547 and right 777, top 61 and bottom 168.5. All three items read. | PASS at 1440, PASS at 800 after fix (first run FAIL at 800) |
| Enter in a text box | In `lotr-map`: The Road, Continue on the pack checklist, type "Bill" in the pony box, press Enter. | Enter continues. The typed text stays. | At 1440 revealed nodes went 6 to 10 (meal, descent, armor, mountains), the camera moved to scale 0.709, and the input kept "Bill". At 800, 6 to 10 and the camera moved to `translate(-2150 48.5) scale(1)`, and the input kept "Bill". | PASS at 1440, PASS at 800 |
| Show whole map refits | Load fresh. Press `w`. Do not press Fit. Press `w` again. | All 10 nodes fit after the animation, then the view refits to the revealed nodes. | At 1440 all 10 nodes were in view at scale 0.356 with 8 ghosts. At 800, scale 0.19 and nothing sat under the top bar. The second `w` refit to the 2 revealed nodes (scale 1 at 1440, 0.956 at 800). | PASS at 1440, PASS at 800 |
| Note beside an annotation | On `cj-001-map`, type a note on `co-1b`. Read the boxes. Screenshot. | The note box and the annotation text both readable, no overlap. | Card bottom 374, note input 378 to 414, annotation text 426 to 475. Status reads "1 note". Both are readable in the screenshot at both widths. | PASS at 1440, PASS at 800 |

### Findings

- Found and fixed: in the first run at 800 px the menu opened by the "More controls" button was clipped at the left edge. The menu is 230 px wide and aligns its right edge to the button. The wrapped toolbar puts the button at x 33 to 72, so the menu ran from x -158 to 72 and only the P, W and E hints showed. The renderer (`draw.js`) now shifts the menu to stay 8 px inside the viewport. The recheck on rebuilt pages measures it fully visible at both widths (1440: 1056.6 to 1286.6; 800: 547 to 777).
- Not covered: none.

## Review fixes

The pre-merge review of PR #58 found two maps that passed `validate` and then crashed the page, plus several smaller page defects. This run checks the fixed renderer in the desktop browser pane. Every page was built from the branch with `build-map.mjs` and served from a local folder.

The test maps:

- `long-map`: `cj-001-reference-map`, with the persona name set to "Alexandra Montgomery-Rivera de la Cruz", the role set to "Owner of a small bookkeeping and invoicing consultancy", and one tag set to "Consideration and evaluation of the shortlisted vendors".
- `odd-map`: `cj-001-map`, with every waypoint id ending in a space and `"q"`.
- `noannid-map` and `notreeid-map`: `lotr-map`, one with the annotation's `id` removed and one with the tree's `id` and `label` removed.

| Check | Steps | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| Former crash maps | Build and open `noannid-map` and `notreeid-map`. | Exit 1, and the page shows the error panel. | The build exits 1 with `map: annotation 1 has no id` and `map: tree 1 has no id`. Both pages show "This map needs a fix" with that line. The console has no errors. | PASS at 1440 |
| Long persona and tag | Open `long-map`. Measure every text box against its card. | The name and role wrap inside the start card, clear of the pencil. The long tag is cut on one line. | The name wraps to 3 lines and the role to 3. No text box runs past its card's right edge. The tag reads "CONSIDERATION AND EVALUATION …", and its `<title>` holds the full tag. | PASS at 1440 |
| A note becomes a sticky | Click a step's pencil, type a note, press Enter. | The input closes, the note shows as a sticky, and focus returns to the pencil. | 0 note inputs remain, the sticky text shows, and focus is on `note-aw-1`. | PASS at 1440 |
| `r` needs two presses | With a note set, press `r` once, then again. | The first press warns. The second clears. | The first press sets the status to "Press R again to clear every answer and note" and the note stays. The second clears it, and the status reads "2 of 9 nodes revealed · 0 notes". | PASS at 1440 |
| Odd ids | Open `odd-map`. Press `n` three times. | Next moves focus with no error, and band corners clip. | 5 of 13 nodes are revealed, and focus sits in `co-1b "q"`. The clip paths are `clip-0` to `clip-3`, and every `clip-path` reference resolves. The console has no errors. | PASS at 1440 |
| Short window | Open `long-map` at 800 × 260. Press `w`. | The map fits at a usable zoom instead of 5%. | The zoom reads 25%. The timeline overlaps the lower part of the map at this height. | PASS at 800 × 260 |
| Enter during input-method composition | Read the code. | Enter that ends a composition doesn't submit. | The field's keydown handler returns early on `e.isComposing`. The pane has no input method to type with, so this was checked by reading only. | PASS by reading |

---
type: note
title: Wayfinder browser smoke
description: Step-by-step browser smoke of the wayfinder radial canvas and the shared journey-map core; every behaviour check passes, two layout faults were fixed and re-checked, and a real clipboard success and pinch zoom are untested.
status: stable
---

# Wayfinder browser smoke

- Date: 2026-10-14
- Browser: the Claude desktop app's built-in browser pane (Chrome engine, macOS)
- Commit: 9a54aae (working tree with the uncommitted wayfinder, canvas and fixture edits)

## Setup

Pages were built from the working tree and served from the scratch directory by a small Python server on `127.0.0.1:8822`.

- Wayfinder: `build-canvas.mjs <dir>/<slug>-map.md` over three map folders, under a `docs/maps/.gitignore` that ignores the generated `*-canvas.*` files.
  - `billing-30`: 30 tickets, with frontier, redo, in-progress, fog, decided and out-of-scope states, two undermined tickets and a stale claim.
  - `postgres-backups`: 5 tickets.
  - `reached`: a copy of `billing-30` with every ticket except the out-of-scope ones set to `closed` with a `## Resolution`, `undermined_by`, `claimed_by` and `claimed_at` removed, and "Not yet specified" emptied.
- journey-map: `lotr-map.json` and `malformed-map.json`, each built twice with `build-map.mjs`: once from `main` (extracted with `git archive main`) and once from this branch. The branch build of the malformed map exits nonzero by design and still writes its page.
- Under `/deny-clipboard/` the server sends `Permissions-Policy: clipboard-write=()`.
- Under `/block-fonts/` it sends a CSP with `style-src 'self' 'unsafe-inline'; font-src 'self' data:`, which blocks the Google Fonts stylesheet.
- All responses carry `Cache-Control: no-store`.

Drives used: `find` and `read` of the page, real clicks, drags, wheel and key presses, and `javascript_tool` to read state. Tool coordinates are in an 800x500 frame over a 1280x800 viewport. The pane denies `clipboard-write` even on the plain server, so a real clipboard success cannot be observed. A touch-emulated 375x812 run covers the tap on a phone-width page.

## Results: wayfinder (billing-30 at 1280x800 unless noted)

| Check | Steps | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| Header counts and first camera | Load `billing-30`. | Counts match the tickets. The map fits. | "8 take now, 2 redo, 2 in progress, 7 waiting in the fog, 5 fog patches, 8 decided, 3 out of scope". `transform` was `translate(433 407) scale(0.5295)`, shown as 53%. | PASS |
| Tab order | Tab from the page top through every stop. | Every ticket and fog patch takes focus, frontier first. | 35 tabbable `[tabindex]` elements. Order: 12 frontier tickets (18, 16, 19, 10 redo, 14, 17, 15, 09 redo, 21 in progress, 13, 20, 22 "claim may be stale"), 5 fog patches, 7 fog tickets (12, 25, 26, 11, 24, 23, 27), 8 decided (01, 03, 06, 08, 04, 02, 05, 07), 3 out of scope (29, 28, 30), then the panel list buttons. | PASS |
| Enter opens the panel | Focus ticket 18. Press Enter. | The panel shows the ticket. Its edges draw. | Panel read "18 / Take now ... DEPENDS ON 08 ... FILE docs/maps/billing-30/18-plan-change-ux.md ... Take this ticket". One `path.edge.in` was drawn. The camera did not move. | PASS |
| Escape | Press Escape in the panel. | The panel returns to the overview. | The panel read "On the frontier". Focus stayed on the node, so its edge stayed until blur. After blur: 0 edges. | PASS |
| Edges on hover only | Hover 16, then 02, then empty canvas. | Edges draw on hover and clear after. | Hover on 16: 1 `edge in`. Hover on 02: 3 `edge out`. Hover away: 0 edges. | PASS |
| Undermined arcs always drawn | Count `path.underarc` at rest, on hover and after blur. | The two arcs stay drawn. | 2 arcs in every state, opacity 0.75, radius 332 along the frontier ring. | PASS |
| Tap opens the panel and shows edges | Click ticket 21. Move the mouse away and blur. Click empty canvas. | The panel opens with edges that persist until dismissed. | The panel read "Claimed by claude-code-4f2 at 2026-10-14T09:00:00Z". It showed 2 edges (`in` and `out`), which stayed after the mouse moved and after blur. A click on empty canvas cleared the panel and both edges. | PASS |
| Tap at 375x812 | Preset mobile (touch emulated). Tap 09. | A bottom-sheet panel with edges. | Panel at [14,275,361,746] over the map. Text "Its premise was broken by 07 Fix the rounding rule. Re-resolve it in place." and a "Take this ticket" button. 2 edges after blur. The header wrapped to 3 rows. | PASS |
| Labels toggle `L` | Press `L`. Press `L` again. | Labels show for every node, without overlap. The toggle follows. | Labels went from 13 to 23 with `aria-pressed=true`, with 0 bounding-box overlaps. A second press gave 13 and `false`. At 375 wide there were 6 labels with no overlaps, two tightly stacked. | PASS |
| Take this ticket, clipboard allowed | Stub `writeText` to resolve. Press "Take this ticket" on 13. | The status confirms. The feedback panel stays hidden. | Status "Copied the hand-off for 13. Paste it into your agent chat." The feedback panel stayed hidden. | PASS |
| Take this ticket, real clipboard | Press it on the plain server with no stub. | The hand-off lands on the clipboard. | `writeText` rejected with `NotAllowedError` because the pane denies `clipboard-write`. A real success could not be observed. | UNTESTED (pane denies the permission) |
| Take this ticket, textarea fallback | Enter the note "start with Stripe". Press the button with `writeText` rejecting. | A read-only, selected textarea holds the frozen hand-off. | Status "Copy blocked: select the text in the box and copy it." Textarea read-only, focused, selected 0 to 402. Text: "Use the wayfinder skill to take ticket 13 on docs/maps/billing-30/. Ticket: ... (research) / Destination / Question / Unblocks: 23 Run a pilot with the chosen provider / Note from the Human: start with Stripe". | PASS |
| Copy for agent under a policy denial | Open `/deny-clipboard/billing-30/`. Press "Copy for agent" on decided ticket 02 with the note "this was too hasty". | The same fallback. | `featurePolicy.allowsFeature('clipboard-write')` was false. `writeText` rejected with `NotAllowedError` (permissions policy). Textarea held "wayfinder feedback for docs/maps/billing-30/ / Ticket: docs/maps/billing-30/02-pick-meter.md — Pick the usage meter (grilling), decided / Note from the Human: this was too hasty", selected 0 to 173, read-only. Same "Copy blocked" status. | PASS |
| Fonts fall back | Open `/block-fonts/billing-30/`. Compare with the plain page. | The page renders with the system stack. | Console showed the CSP violation. `document.fonts.size` was 0 and the stack was `Inter, system-ui, -apple-system, "Segoe UI", sans-serif`. The page rendered at 53% with 13 labels and no error panel. On the plain page 3 Inter faces loaded. | PASS |
| Reached map | Open `reached`. | Header and panel say the destination is reached. | Header "27 decided, 3 out of scope". Panel "Destination reached / On the frontier / Every ticket is decided and no fog remains. Next step: run create-prd ... or code-spec ...". The destination node had class `dest reached`, a check mark and "DESTINATION REACHED". 30 nodes, 0 arcs, 0 labels. | PASS |
| Small map | Open `postgres-backups`. | A smaller map draws cleanly. | "2 take now, 3 waiting in the fog, 1 fog patches". 5 nodes, 3 labels, no out-of-scope ring, no error panel. The destination line in the header is cut with an ellipsis. | PASS |
| Label offset | Press `L`. Compare label 18 against its dot. | A label centres under its circle. | Label box [474,322,656,337] has centre x=565. The dot box [560,288,591,319] has centre x=575.5. The label sits below the dot and about 10.5 px to its left. After the fix, labels are drawn centred on the box centre: at 1280x800 the first eight shown labels sit 0 px from their circle centres. | PASS after fix |
| Header against the outer ring | Load `billing-30` at 1280x800. Compare the header box with the outer ring. | The header does not cover the ring. | The last count row wraps to two lines, so the header box is [16,14,636,129]. The ring `band-oos` top is at y=84. `elementFromPoint(433,100)` returns the header, which covers the "SCOPE" and "OUT OF SCOPE" ring labels. With `L` on, labels "30 White-label invoices" and "28 Support multiple legal entities" sit at or under the header's bottom edge. `reached` has a one-line header (bottom 78 against ring top 84) and does not overlap. After the fix, the fit keeps clear of the wrapped header: the header ends at y=129 and the outer ring starts at y=140. | PASS after fix |

## Results: journey-map, main against branch (1280x800)

Each row holds both observations, taken on the same fixture. The two builds drew the same results in every row but the copy text.

| Check | Steps | Expected | main | branch | Result |
| --- | --- | --- | --- | --- | --- |
| First camera | Load `lotr-map`. | The same camera. | `translate(235 -1.5) scale(1)`, "2 of 16 nodes revealed · 0 notes" | Same. | PASS |
| Pan by drag | Drag (60,400) to (160,450), which is 160 by 80 px. | The camera moves by the drag. | `translate(395 78.5)` | `translate(395 78.5)` | PASS |
| Pan by wheel | Wheel up 3 ticks. | The plain wheel pans vertically. | `translate(395 378.5)` | `translate(395 378.5)` | PASS |
| Zoom in | Press "Zoom in". | A 120% camera. | `translate(346 374.2) scale(1.2)` | Same. | PASS |
| Fit | Press "Fit everything shown". | Returns to a fitted camera. | `translate(235 18.5) scale(1)` | Same. | PASS |
| Camera on a choice | Click "The Road" and wait 3 s. | The option is checked, 5 nodes show, the camera settles. | `aria-checked` true and false, "5 of 16 nodes revealed", `translate(-289.65 86.53) scale(0.7845)`, 78% | Same values. | PASS |
| Ctrl+wheel zoom | After the camera settles, dispatch a ctrl+wheel with `deltaY` -100 at the viewport centre. | The scale multiplies by e. | From scale 1: 2.718 (main, taken from the fit state). | From 0.7845: 2.1325, which is 0.7845 times e. | PASS |
| Error panel | Open `malformed-map.html`. | "This map needs a fix" and nine lines. | Panel and nine lines: `map: persona.name must be a string`, `bree: unknown kind dragon`, `route: mood only on a waypoint`, `forest: mood must be a whole number from -2 to 2 (got 3)`, `forest: next target lost-rivendell does not exist`, `rivendell: thought must be a string`, `meal: pains must be a list of strings`, `descent: touchpoints must be a list of strings`, `armor: opportunities must be a list of strings`. | The same panel and the same nine lines. | PASS |
| Copy fallback | Open `/deny-clipboard/.../lotr-map.html`. Press "Copy for agent". | A read-only selected textarea. | `journey-map feedback for web/jmm/lotr-map.json`, read-only, selected 0 to 46, focused. | `journey-map feedback for lotr-map.json`, read-only, selected 0 to 38, focused. `writeText` rejected with `NotAllowedError`. | PASS |

## Findings

- The radial header covered the outer ring when its counts wrapped to two lines at 1280x800. `radial-draw.js` now lowers the fitted map below the header, and the re-check passes.
- Radial labels sat about 10.5 px left of their circle's centre, because they were drawn from the left of an estimated width. They are now drawn centred, and the re-check passes.
- The pane denies `clipboard-write` everywhere, so only the fallback path and a stubbed success were observed. A real clipboard success is UNTESTED.
- The shared core preserves journey-map behaviour: pan, zoom, fit, the camera on a choice and the error panel match main to the pixel.
- The copy path differs between builds only in the text: main read the path as `web/jmm/lotr-map.json` and the branch as `lotr-map.json`, because the two builds were run from different working directories.
- One first read of the branch camera after the click gave `scale(3)` before it settled at 0.7845. A rerun with a 3 s wait showed the same settled camera as main, so the 3x reading was a transient and is not recorded as a failure.
- Not exercised: pinch zoom (the pane has no multi-touch input), and the Tab, Enter and Escape keys on the journey-map pages, which the earlier journey-map note covers.

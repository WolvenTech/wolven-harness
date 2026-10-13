<!-- PROTOTYPE — throwaway -->
# Journey details on flow cards (prototype)

Throwaway. Answers one question for `docs/prds/archived/journey-map/journey-map-prd.md` (US-5).

**Verdict (2026-10-13):** Rafael approved layout H, with the thought cloud's scalloped bumps removed. G (tinted cards) was dropped. US-5 and US-2 of the journey-map PRD record the result. Copied here from the throwaway branch `worktree-agent-a02c67d04e97b9a8a`, so the `prototypes/journey-details/` paths below are that branch's. `build.mjs` resolves its own folder, so `node docs/notes/visual-map-kinds/journey-details-prototype/build.mjs` works here too.

**Question:** how should journey details look on a journey-map flow card: which details show by default, the expanded and collapsed states, the persona header, and how the slim mood strip under the walked path looks and behaves?

## Run

```
node prototypes/journey-details/build.mjs
```

Writes the self-contained `prototypes/journey-details/cj-001-journey-details.html` (needs network for rough.js and fonts). Open it directly, or serve the folder and use `?variant=A|B|C|D|E|F|H`. H is the default when `?variant` is absent. Switch variants with the bottom pill bar or the left/right arrow keys. `n` (or "Next step") advances the walk.

Validation check: `node prototypes/journey-details/build.mjs prototypes/journey-details/bad-mood.json` prints a one-line error naming the step (`oops`) and exits 1 without writing HTML.

Extra URL params: `?strip=dock|lane|ribbon` forces a strip form, `?pace=choices` turns off step-by-step pacing.

## Data

`cj-001-journey.json` is `docs/notes/visual-map-kinds/cj-001-source.json` converted to an action path: every `user_action` is a waypoint step, and stage-level touchpoints, thought, pains and opportunities attach to that stage's steps. One illustrative choice ("Ready to start the trial?") and its low-mood branch are invented, flagged `"illustrative": true` in the data and drawn with a dashed blue border and an "illustrative" pill.

New optional step fields: `mood` (integer -2..+2), `thought`, `touchpoints[]`, `pains[]`, `opportunities[]`. Top level: `persona {name, role, goal}` and `scenario`. A step with none of these draws as a plain flow step.

## Emotion mapping (source -1..4 to -2..+2)

| source emotion_score | mood | face |
| --- | --- | --- |
| <= -2 | -2 | frowning (Frustrated) |
| -1 | -1 | unsure (Uneasy) |
| 0 or 1 | 0 | neutral |
| 2 or 3 | +1 | smile (Positive) |
| >= 4 | +2 | grin (Delighted) |

The four stages (-1, 1, 3, 4) become -1, 0, +1, +2. The illustrative competitor step is -2.

## Walk pacing

Journey steps are waypoints, which the existing walk reveals all at once. For the prototype, steps pace one at a time: "Next step" (or `n`) marks the held step done and reveals the following one. Choices still reveal on answer. "Show whole map" shows everything and plots the default path in the strip.

## Variants

- **A, Compact.** Face plus a mood-colour edge stripe. Details are collapsed behind a one-line chip bar that toggles open. Strip: a dock sparkline pinned bottom centre.
- **B, All open.** Thought as a handwritten bubble above the card, touchpoint chips, red pain and green opportunity blocks always open, mood-tinted card fill. Strip: a lane drawn in the map under the tree, so it pans and zooms with it. Full persona header.
- **C, Inspector.** The card stays slim (face, stage, label, thought). Clicking a step opens a right-hand panel with everything else; the newest step is auto-selected. Strip: a ribbon of mood chips docked at the bottom, click to focus.
- **D, Stickies.** The path edges take the mood colour; details hang under the card as rotated sticky notes (yellow thought, blue touchpoints, red pains, green ideas). Strip: lane, as in B. Full persona header.

All four show the persona header at the path start and a mood strip that follows the walk, switches when a choice changes branch, and plots the default path under "Show whole map". Strip forms: dock (A), ribbon (C), lane (B, D).

## Round 2: combined variants E, F (G removed in round 3)

`?variant=E|F`. A to D are unchanged. E and F share:

- Collapsible task-card details. Collapsed: a chip row (thought, touchpoints, pains, ideas, each with a count) and a chevron. Expanded: labelled, icon-headed sections (thought in handwriting, touchpoint chips, red-marked pains, green-marked ideas). The layout reflows when a card opens, so cards do not overlap.
- Expand all / Collapse all, key `e`.
- D's mood-coloured path arrows and A's docked mood timeline.
- No left inner border stripe.
- A card with no mood draws with no band and no tint.

They differ in where the mood band sits:

- **E, header band.** A mood-colour band across the top of the card: face, persona first name, small mood label. The stage tag stays readable below it.
- **F, footer band.** The same band at the bottom of the card.

### Overflow menu (E, F)

The top toolbar shows only "Copy for agent" plus a `...` button. The menu holds, each with its shortcut beside it:

| Entry | Key |
| --- | --- |
| Step by step (on/off) | `P` |
| Next step | `N` |
| Show whole map / Hide upcoming | `W` |
| Expand all / Collapse all | `E` |
| Start over | `R` |

All keys work with the menu closed. The menu closes on Escape and on an outside click. Left and right arrows still cycle variants. A to D keep their original toolbar. H has its own toolbar, below.

## Round 3: variant H (default)

`?variant=H`, or no `?variant` at all. G is gone; A to F are unchanged.

- **Header band.** Emoji and persona first name on the left, no mood word. A collapse/expand chevron and the "add note" pencil dock on the right of the band; they are the only card actions, and the pencil no longer sits in the card body. A step with no mood gets a neutral grey header row with the same two actions (the chevron is dimmed when the step has no details).
- **Thought.** A cloud-style thought bubble above the card with three small trailing circles, handwriting font, soft shadow. Always visible, collapsed or expanded.
- **Expanded.** Pains are red, slightly rotated stickies and ideas are green stickies, both below the card. Touchpoints stay inside the card as chips. Rows reserve their own height, so stickies and the cloud never cover a neighbour, an arrow or the next column.
- **Collapsed.** A chip row as in E (touchpoints, pains, ideas with counts), no thought count.
- D's mood-coloured arrows and A's docked mood timeline carry over.

### Toolbar (H)

Always visible: "Start over" and "Copy for agent". With Step by step on, "Prev" and "Next" are also always visible. Prev hides the last revealed step (or undoes the last answered choice) and the dock follows. Everything else stays in the overflow menu. Shortcuts: `b` Prev, `n` Next, `e`, `w`, `r`, `p` as before.

### Round 2 fixes

- The dock's -2 point no longer clips the box bottom (taller strip, caption moved down).
- Shortcuts work on load, before the first canvas click (the stage takes focus and the listener is on the window).
- At about 800 px the variant bar no longer covers the zoom control or the "N of 13 nodes revealed" counter (narrower bar, and the toolbar buttons wrap as one group).

### Data

New step `co-1b` ("Talks it over with the team") has no mood and no details, marked `"journey": true` so it still counts as a journey step and draws the neutral header. The map now has 13 nodes.

## Not done

No tests, no polish, no mobile layout work. The renderer files under `renderer/` are copies of the shipped ones with prototype edits; nothing under `templates/`, `src/`, `test/` or `.agents/` is touched.

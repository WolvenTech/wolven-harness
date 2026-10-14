<!-- PROTOTYPE — throwaway -->
# visual-map journey prototype

Question: what should the final `visual-map` journey page look like, end to end, from a user need to the built HTML? Throwaway; nothing here is wired into `templates/`, `src/` or the CLI.

## The pipeline

**(a) The need, as a Human types it to their agent.**

> I have a customer-journey research file, `cj-001-source.json`, for Alex who is switching to automated invoicing. I want to walk through it stage by stage with a teammate, see how the mood moves, and drop notes on whatever looks off, then send those notes back to you. If it helps, show how a second persona would compare, and sketch the service blueprint lanes behind the scenes. Mark anything you invent so we do not mistake it for research.

**(b) How the agent turns the source into the typed journey file.** `cj-001-source.json` has one persona, a scenario and four stages. Each stage has `user_actions` (a list), `touchpoints`, `thoughts`, `emotion_score`, `pain_points` and `opportunities`. The agent:

1. Copies persona and scenario into `personas[0]` and `scenario`, unchanged.
2. Makes each stage a `stages[]` entry. Each `user_actions` string becomes one `steps[]` entry with an id and a short label. The stage has no step list in the source, so the actions are the only honest steps.
3. Declares lanes in reading order: actions, touchpoints, thoughts, mood, pain, opportunities.
4. Writes `user_actions` as step-level cells (`at` = a step id), and `touchpoints`, `thoughts`, `pain_points`, `opportunities` as stage-level cells (`at` = a stage id), text unchanged.
5. Writes `emotion_score` into `mood.alex` keyed by stage id. The scale must contain every value, so it is `-5..5` (the source uses `-1..+4`, which is unchanged).
6. Adds what it invented, each flagged `illustrative`: a second persona with step-level mood, three blueprint lanes (frontstage, backstage, support processes) with cells, and the three blueprint lines.
7. Adds four `annotations`, the agent's own observations, shown as purple stickies.

**(c) Build.**

```
node docs/deferrals/service-blueprint/prototype/build.mjs docs/deferrals/service-blueprint/prototype/cj-001-journey.json
```

Node built-ins only. Exits 0 on success. On errors it prints one line per error to stderr (for example `journey mood alex.a: 4 is outside scale -2..2`), still writes the page showing them, and exits 1. `bad-mood.json` is the failing fixture (an out-of-scale mood and a cell naming a missing lane).

**(d) Output.** `cj-001-journey-map.html` beside the JSON, one self-contained file. It loads rough.js (arrows only) and Inter/Caveat from CDNs; offline it falls back to plain lines and system fonts. Open it over `file://` or any static server. `?variant=A|B|C` picks the layout (the bottom pill and the left/right arrow keys switch it).

## The `kind: "journey"` format (as built)

`R` = required, `o` = optional. Unknown fields at any level are errors. Every id matches `^[a-z0-9][a-z0-9-]*$` and is unique across personas, stages, steps, lanes and lines.

| Where | Field | |
| --- | --- | --- |
| top | `//` | o, ignored (the PROTOTYPE header) |
| | `version` | R, `1` |
| | `kind` | R, `"journey"` |
| | `title` | R |
| | `subtitle` | o |
| | `walk` | o, `"steps"` (default) or `"whole"`: whether the page opens walking or showing everything |
| | `scale` | o, `{min, max}`, default `-2..2` |
| | `scenario` | R |
| | `personas` | R, at least 1 |
| | `stages` | R, at least 1 |
| | `lanes` | R |
| | `mood` | o, `{ personaId: { stageOrStepId: number } }`; needs a lane of type `mood` |
| | `cells` | o |
| | `lines` | o |
| | `annotations` | o |
| persona | `id`, `name` | R |
| | `role`, `goal`, `color`, `illustrative` | o (`color` is a hex string; a palette is used if absent) |
| stage | `id`, `label`, `steps` | R (at least 1 step) |
| step | `id`, `label` | R |
| lane | `id`, `label`, `type` | R; `type` is `text`, `mood`, `frontstage`, `backstage` or `process`; at most one `mood` lane |
| | `illustrative` | o |
| cell | `lane`, `at` | R; `lane` names a non-mood lane, `at` names a stage or a step. The cell id is `<lane>:<at>` |
| | `text` or `items` | R, exactly one (string, or array of strings) |
| | `illustrative` | o |
| line | `id`, `type`, `between` | R; `type` is `interaction`, `visibility` or `internal`; `between` is `[laneAbove, laneBelow]`, in lane order |
| | `label`, `illustrative` | o (`label` defaults to the type's name) |
| annotation | `on`, `text` | R; `on` names a persona, stage, step, cell id, or `mood:<stepId>` |

Build errors: unknown field, missing or malformed or duplicate id, a cell naming a missing lane / step / stage, a mood value outside the scale or not a number, mood for a missing persona, a stage-wide cell and step cells in the same lane and stage, a line between missing or misordered lanes, an annotation naming a missing element.

Note ids used by "Copy for agent": persona, stage and step ids as is; cells as `<lane>:<at>`; mood points as `mood:<stepId>`.

## The stage / step / mood decision

The source scores mood once per stage, but a journey drawn as a curve wants points. Decision:

- **Stages hold steps.** Steps are the unit of the page's columns and of the mood curve.
- **A mood value is looked up by step id first, then by the step's stage id.** Both steps of a stage carry a stage-level score unchanged, so the real persona draws a flat segment per stage and the curve joins them. The page says this in an agent annotation rather than hiding it.
- **A persona may score per step.** The illustrative second persona does, which is what makes the comparison worth drawing.
- **Cells follow the same rule.** A cell is stage-wide (`at` is a stage id, spans the stage's columns) or step-level (`at` is a step id). Mixing both in one lane within one stage is an error, so a cell never has two readings.
- **The scale is declared.** `scale` must contain every value, and a value outside it is an error, not a clamp.

## Variants (layouts differ, behaviour does not)

| Key | Layout |
| --- | --- |
| A | Classic grid: a label column, a stage header row, a step header row, then one aligned row per lane. The mood lane is one row with the curve across it. Blueprint lines are rules between rows. |
| B | Mood spine: one tall mood curve across the middle is the page; text lanes before the mood lane hang above it, lanes after it hang below, stacked raggedly per stage with no row alignment and no label column; blueprint lanes sit in a band under everything. |
| C | Stage cards: one self-contained card per stage, a gauge per persona per step instead of a curve, lanes stacked as sections inside the card, rough arrows between cards. |

Shared: top-bar Back/Next walk (one stage at a time, the camera follows), Show whole map (unreached stages faint), pencil notes (Caveat stickies on any stage, step, cell, mood point or persona; the pen also opens on Enter or Space), Copy for agent (notes only, textarea fallback if the clipboard is refused), drag to pan, wheel or buttons to zoom.

Illustrative data is drawn dashed and hatched with an "illustrative" tag, and the persona card says what that means.

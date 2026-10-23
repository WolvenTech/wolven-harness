---
type: note
title: Visual map kinds
description: Researches how the journey-map skill becomes visual-map, drawing decision flows, UX journey maps and C4 architecture diagrams from typed JSON, and records the Human's decisions on scope, layout and helpers.
status: stable
---

# Visual map kinds

## Question

How should the `journey-map` skill grow so that one tool draws three kinds
of map:

- the decision flows it draws today
- UX journey maps, like the `cj_001` invoicing journey
- system design and architecture diagrams

It may also add optional layout helpers, such as a mood score on each step.

An answer names each kind's layout and data shape, the helpers it needs,
and what changes in today's renderer. Each part is grounded in the
references for that kind.

## Findings

### What the tool does today

- **Format.** One map format has seven node kinds: `start`, `choice`,
  `checklist`, `text`, `waypoint`, `card` and `ticket`
  (`templates/.agents/skills/journey-map/renderer/logic.js:3`).
- **Layout.** Trees stack top to bottom. Inside a tree, a node's column is
  its depth along `next` edges, or along `blocked_by` edges for a ticket
  tree (`renderer/logic.js:266`, `renderer/logic.js:313`). The layout has
  no rows, lanes, nested groups or edges that loop back.
- **Scope in the PRD.** The PRD says a journey map here is not the UX
  research artifact of the same name, which charts a persona's stages and
  emotions (`docs/prds/archived/journey-map/journey-map-prd.md:17`).
- **The cj_001 test.** The journey in `cj-001-source.json` was translated
  by hand into today's format, as [`cj-001-test-map.json`](https://github.com/WolvenTech/wolven-harness/blob/385d5fcc88a86d58f448b9f2db3a8199659be84e/docs/notes/visual-map-kinds/cj-001-test-map.json)
  (kept at `385d5fc`, removed before merge).
  - Mood, touchpoints and thoughts became subtitle text and stickies,
    because the format has no field for them.
  - The first version put all 20 steps in one tree. Fit-to-screen then
    dropped to 16% zoom. The skill names this as an anti-pattern
    (`templates/.agents/skills/journey-map/SKILL.md`, Anti-patterns).
  - The test also found three defects in the flow renderer:
    - a Human note is drawn on top of an agent annotation on the same card
    - a checklist that was continued with no change is left out of
      "Copy for agent"
    - Enter in a text box does not press Continue

### UX journey maps

- **The five parts.** NN/g names five key parts: an actor, a scenario with
  expectations, journey phases, then actions, mindsets and emotions, and
  opportunities. Emotions are drawn as a single line across the phases
  ([NN/g, Journey Mapping 101](https://www.nngroup.com/articles/journey-mapping-101/)).
- **Structure.** A customer journey map is chronological and tied to one
  product and one persona. It is structured as swim lanes for phases,
  actions, thoughts, and mindsets and emotions
  ([NN/g, UX Mapping Methods Compared](https://www.nngroup.com/articles/ux-mapping-cheat-sheet/)).
- **Smaply.** It offers "eleven lane types", among them emotions,
  metrics, pain points and channels. It tracks feelings across the journey
  with an Emotion Chart
  ([Smaply journey maps](https://www.smaply.com/tools/journey-maps)).
- **Mermaid.** Its `journey` diagram splits a journey into sections of
  tasks. Each task carries a score from 1 to 5 and a list of actors
  ([Mermaid user journey](https://mermaid.js.org/syntax/userJourney.html)).
- **Scales disagree.** Mermaid scores from 1 to 5, while `cj_001` uses −1
  to +4 with no stated bounds (`cj-001-source.json`).

### Service blueprints

- **Lanes.** A blueprint has these lanes: customer actions, frontstage
  actions, backstage actions, processes and evidence
  ([NN/g, Service Blueprints: Definition](https://www.nngroup.com/articles/service-blueprints-definition/)).
- **Lines.** Three lines separate the lanes: the line of interaction, the
  line of visibility and the line of internal interaction (same source).
- **Extras.** Arrows show dependencies. Optional lanes can add time,
  policy, employee emotion and metrics (same source).
- **Same grid.** The blueprint is chronological and follows the same
  swim-lane shape as a journey map
  ([NN/g cheat sheet](https://www.nngroup.com/articles/ux-mapping-cheat-sheet/)).
- **Origin.** Blueprinting is described as a customer-focused way to
  visualise service processes
  ([Ostrom, Bitner and Morgan, California Management Review 50(3), 2008](https://cmr.berkeley.edu/2008/05/50-3-service-blueprinting-a-practical-technique-for-service-innovation/)).

### Architecture diagrams (C4)

- **Abstractions.** C4 nests four of them: a software system contains
  containers, a container contains components, and code implements
  components. People use the systems
  ([C4 abstractions](https://c4model.com/abstractions)).
- **Diagram types.** There are four core diagrams (context, container,
  component, code) and three supporting ones (landscape, dynamic,
  deployment). Context and container diagrams are enough for most teams
  ([C4 diagrams](https://c4model.com/diagrams)).
- **Notation rules.** C4 doesn't fix a notation, but every diagram should
  follow these rules:
  - It has a title and a key.
  - Each element states its type and a short description, and containers
    and components state their technology.
  - Each line is one-way and carries a specific label, with the protocol
    between containers.
  - Colour is used consistently, and the diagram still reads in black and
    white and for colour-blind readers.

  Source: [C4 notation](https://c4model.com/diagrams/notation).
- **Model and views.** Structurizr keeps the model (elements and
  relationships) apart from the views that include parts of it. Styling
  applies by tag, and `autoLayout` is set per view
  ([Structurizr DSL](https://docs.structurizr.com/dsl/language)).
- **Mermaid's C4.** Its C4 support is experimental. Shapes are placed in
  statement order, and legends and tags are not yet supported
  ([Mermaid C4](https://mermaid.js.org/syntax/c4.html)).
- **Mermaid's `architecture-beta`.** It nests groups, connects edges to
  named sides of a box, and uses a force-directed layout (fcose)
  ([Mermaid architecture](https://mermaid.js.org/syntax/architecture.html)).

### Layout for nested graphs

- **ELK Layered.** It places nodes in layers so that most edges point one
  way. It supports compound (nested) graphs with edges that cross between
  clusters, and ports. Edge routing can be straight, orthogonal or
  splines, and orthogonal is the default
  ([ELK Layered](https://eclipse.dev/elk/reference/algorithms/org-eclipse-elk-layered.html)).
- **Size.** The elkjs 0.9.3 bundle on jsDelivr is 1,606,238 bytes, or
  469,513 bytes gzipped. Measured on 2026-10-13 with `curl` against
  `https://cdn.jsdelivr.net/npm/elkjs@0.9.3/lib/elk.bundled.js`.

### What only this tool adds

Mermaid draws journeys and C4 diagrams as static pictures (sources above).
This tool adds three things:

- walking a map step by step
- a note on any element
- a "Copy for agent" record that names each element by id
  (`templates/.agents/skills/journey-map/references/tree-format.md`,
  "Feedback text")

Those are the reasons to extend it rather than hand architecture to
Mermaid.

## Decisions

Rafael decided these on 2026-10-13 in a one-question-at-a-time grilling
session. R1–R8 below supersede D4–D11 and D13–D15, so read this table as
history; D1 narrows, and D2, D12 and D16 stand.

| # | Decision |
|---|----------|
| D1 | The tool's main goal is UX journey maps and architecture and system-design maps. Decision flows stay. |
| D2 | Ticket trees leave PR #58. The open wayfinder PR, a follow-up to this one, adds them back, and a note is left on that PR. |
| D3 | Each map chooses whether it is walked step by step or shown whole. |
| D4 | A journey map uses a lanes grid when it needs one: stages as columns, typed lanes as rows. Service-blueprint lanes and lines come from the same grid. |
| D5 | Architecture maps use the C4 vocabulary and notation rules, with an automatic legend. |
| D6 | Both journey and C4 kinds are built in this initiative, in the same skill. C4 layout uses ELK Layered from jsDelivr, pinned with SRI like rough.js. |
| D7 | Mood uses a scale the map declares once, defaulting to −2 to +2. |
| D8 | First-version helpers: a persona and scenario header, blueprint lines, an automatic legend, and mood curves compared across personas. |
| D9 | Typed sub-formats, one per kind (`flow`, `journey`, `c4`), each with its own validator. They share the canvas. |
| D10 | One kind per file. Pages refer to each other by plain links. |
| D11 | The skill is renamed `visual-map`. |
| D12 | PR #58 is held and takes the rename, the new kinds and the fixes. |
| D13 | Journey and C4 maps take notes only. Questions stay in flow maps. |
| D14 | A Next and Back stepper walks journey maps stage by stage, and C4 dynamic diagrams hop by hop. |
| D15 | The C4 kind covers context, container and dynamic diagrams. |
| D16 | The three defects from the cj_001 test are fixed. A continued checklist with no change emits a line, which changes the frozen feedback format. |

## Revision after the layout prototype

Rafael revised the scope on 2026-10-13, after reviewing a three-layout
prototype of cj_001 (grid, mood spine, stage cards), now kept in
`docs/deferrals/archived/service-blueprint/prototype/`. These decisions replace
D4–D11, D13–D15 and the Recommendation below. D1 narrows, D2 and D16
stand, and D12 holds without the rename.

| # | Decision |
|---|----------|
| R1 | No rename. The skill stays `journey-map`, a quick tool for journeys, paths and tree-shaped diagrams. |
| R2 | A user journey is a flow: an action path drawn like the CLI prompt tree. There is no separate `journey` kind and no typed sub-formats. |
| R3 | Any step may carry an optional mood from −2 to +2, shown as 🙁 😕 😐 🙂 😃 with a colour, plus an optional thought, touchpoints, pains and opportunities. A map may add a persona header and a slim mood strip under the walked path. |
| R4 | A Next and Back stepper comes in only if the spec finds it cheap. Otherwise it is dropped. |
| R5 | Architecture diagrams stay outside journey-map; their deferral was promoted to the [architectural-map draft PRD](../../prds/architectural-map/architectural-map-prd.md) on 2026-10-22. |
| R6 | Journey grids and service blueprints go to a deferred `service-blueprint` skill (`docs/deferrals/archived/service-blueprint/`). The prototype is its primary source. |
| R7 | A second prototype, on cj_001 drawn as a path, tries combinations of journey details and expanded and collapsed states before the spec. |
| R8 | The second prototype ran three rounds and Rafael approved its layout H ([journey-details-prototype/ at `385d5fc`](https://github.com/WolvenTech/wolven-harness/tree/385d5fcc88a86d58f448b9f2db3a8199659be84e/docs/notes/visual-map-kinds/journey-details-prototype), [published](https://claude.ai/artifact/XKt1gaaCPo3FwbwGagto4t)). A mood header band, a thought cloud above the card, collapsible details with pains and ideas as stickies, mood-coloured arrows, a docked mood timeline, Prev and Next, and a toolbar trimmed to two buttons plus a menu. The journey-map PRD's US-5 records it. |

## Recommendation (superseded by R1–R7)

**One skill, `visual-map`, with one shared canvas and three typed formats.**
The shared part is today's `draw.js` canvas, camera, notes and "Copy for
agent", plus a new stepper and legend. Each format brings its own
validator and its own layout. This follows the split between model, view
and layout that Structurizr uses
([Structurizr DSL](https://docs.structurizr.com/dsl/language)). It keeps
one copy of the shared code, because each skill must install on its own
(`docs/adrs/adr-005-install-anywhere-contract.md`).

Every file carries `version`, `kind`, `title`, `subtitle` and `walk`
(`steps` or `whole`).

### `flow`

Today's tree format, minus `ticket` (D2).

- Walking works as it does today: hidden until decided.
- The three defect fixes land here (D16).

### `journey`

- **Header:** a `persona` (one or more, each with a colour) and a
  `scenario` (D8).
- **Columns:** `stages`, each holding ordered `steps`.
- **Rows:** `lanes`, each with an `id`, a `label` and a `type`.
  - `text` lanes hold actions, touchpoints, thoughts, pain points and
    opportunities.
  - A `mood` lane draws one curve per persona over the declared scale
    (D7, D8).
  - Blueprint lanes are `frontstage`, `backstage` and `process`.
- **Cells:** keyed by lane and step.
- **Lines:** optional `lines` (`interaction`, `visibility`, `internal`)
  sit between named lanes (D4).
- **Walking:** the stepper reveals one stage at a time (D14).

### `c4`

- **Diagram:** `diagram` is `context`, `container` or `dynamic` (D15).
- **Elements:** `person`, `system`, `container`, `component`, each with:
  - `description`
  - `technology`, required on containers and components
  - optional `shape` (`db` or `queue`)
  - optional `external`
  - optional `in`, which names a boundary
- **Boundaries:** may nest.
- **Relationships:** each has `from`, `to`, a required `label`, a
  `technology`, and an `order` on dynamic diagrams.
- **Layout and legend:** ELK Layered with orthogonal routing (D6). The
  legend lists only the types and line styles the map uses (D5).
- **Walking:** the stepper walks relationships in `order` (D14).

### Feedback

- The first line is unchanged.
- Journey and C4 maps emit only `note` lines, which name cells, elements
  and relationships by id (D13).
- Flow maps add a line for a checklist continued with no change (D16).

### Next documents

This changes what the PRD's goals and non-goals cover:

- a UX journey artifact
- a dependency loaded only on C4 pages
- tickets removed
- a rename

So the PRD goes back to `draft` for amendment and approval. Then the spec
and plan are revised on the held branch (D12).

## Sources

| Source | Type | Used for |
|--------|------|----------|
| `templates/.agents/skills/journey-map/renderer/logic.js` | source code | Node kinds and today's layout |
| `templates/.agents/skills/journey-map/references/tree-format.md` | source code | Feedback text format |
| `templates/.agents/skills/journey-map/SKILL.md` | source code | The anti-pattern the first test map broke |
| `docs/prds/archived/journey-map/journey-map-prd.md` | repo doc | The "not the UX artifact" scope line |
| `docs/adrs/adr-005-install-anywhere-contract.md` | ADR | Skills install on their own |
| `docs/notes/visual-map-kinds/cj-001-source.json`, [`cj-001-test-map.json` at `385d5fc`](https://github.com/WolvenTech/wolven-harness/blob/385d5fcc88a86d58f448b9f2db3a8199659be84e/docs/notes/visual-map-kinds/cj-001-test-map.json) | test data | The cj_001 test and its findings |
| https://www.nngroup.com/articles/journey-mapping-101/ | method reference | Journey map parts, emotion line |
| https://www.nngroup.com/articles/ux-mapping-cheat-sheet/ | method reference | Swim-lane structure of journey maps and blueprints |
| https://www.nngroup.com/articles/service-blueprints-definition/ | method reference | Blueprint lanes, lines and extras |
| https://cmr.berkeley.edu/2008/05/50-3-service-blueprinting-a-practical-technique-for-service-innovation/ | journal article | Origin of service blueprinting |
| https://www.smaply.com/tools/journey-maps | product docs | Typed lanes and the Emotion Chart |
| https://mermaid.js.org/syntax/userJourney.html | official docs | Journey scores 1 to 5 |
| https://c4model.com/abstractions | spec | C4 abstractions |
| https://c4model.com/diagrams | spec | C4 diagram types |
| https://c4model.com/diagrams/notation | spec | C4 notation rules |
| https://docs.structurizr.com/dsl/language | official docs | Model, views, styles and autoLayout split |
| https://mermaid.js.org/syntax/c4.html | official docs | Mermaid C4 limits |
| https://mermaid.js.org/syntax/architecture.html | official docs | Groups, edge sides, fcose layout |
| https://eclipse.dev/elk/reference/algorithms/org-eclipse-elk-layered.html | official docs | Layered layout with compound nodes |

## Open questions

- **Smaply's scale is unverified.** A web search summary says Smaply's
  emotion lane runs from −2 to +2 and can compare several personas. That
  is the basis for D7's default and D8's comparison. The helpdesk article
  it cites
  (`https://helpdesk.smaply.com/support/solutions/articles/22000228571-lane-types-emotional-journey-`)
  did not resolve from this machine on 2026-10-13, so the claim isn't
  verified. The default still stands as the Human's decision.
- **Which ELK version to pin.** elkjs 0.9.3 is the version measured here.
  Its SRI hash is computed when the spec pins it.
- **Is ELK fast enough on a phone?** Its layout time on a phone for a
  container diagram of about 30 elements has not been measured.
- **Are typed lanes enough?** Smaply's storyboard and channel lanes were
  not chosen. The first real journey map will show whether typed text
  lanes cover the need.

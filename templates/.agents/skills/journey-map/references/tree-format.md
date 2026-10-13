# Map tree format

The map is one JSON file, `<slug>-map.json`, with `version: 1`.

```json
{
  "version": 1,
  "title": "Pick a setup",
  "subtitle": "Walk the flow, then copy your answers",
  "trees": [
    {
      "id": "setup",
      "label": "Setup",
      "nodes": [
        { "id": "begin", "kind": "start", "label": "Begin", "next": "mode" },
        {
          "id": "mode",
          "kind": "choice",
          "label": "How much should we change?",
          "default": "small",
          "options": [
            { "key": "small", "label": "A little", "next": "done" },
            { "key": "big", "label": "A lot", "next": "done" }
          ]
        },
        {
          "id": "done",
          "kind": "card",
          "label": "All set",
          "sections": [{ "head": "Next", "items": ["Hand back to the agent"] }]
        }
      ]
    }
  ],
  "links": [],
  "annotations": [{ "id": "a1", "target": "mode", "text": "nothing is written yet" }]
}
```

## Top level

| Field | Meaning |
|-------|---------|
| `version` | Always `1` |
| `title`, `subtitle` | Shown in the top bar |
| `trees` | One or more trees, drawn top to bottom |
| `links` | `{ from, to, label? }`. The only edges that cross between trees. Drawn dashed with a label pill |
| `annotations` | `{ id, target, text }`. A sticky attached to the node `target` |

## Tree rules

- Node ids are unique across the whole map. Every node has `id`, `kind`
  and `label`.
- A tree has exactly one `start` node, unless every node in it is a
  `ticket`.
- A tree has no cycles. A flow tree follows `next` edges. A ticket tree
  follows `blocked_by` edges.
- `next`, `gates` and `blocked_by` point only at nodes in their own tree.
  Only `links` cross between trees.
- A tree's optional `label` names it on the canvas. The heading is left
  out when it would repeat the start node's label.
- Keep labels and hints short. Text wraps by counting characters, so a
  very long word breaks mid-word.

## Node kinds

| `kind` | Extra fields | Draws as |
|--------|--------------|----------|
| `start` | `sub?`, `next` | A tinted pill |
| `choice` | `tag?`, `note?`, `default?`, `options` | A card with one radio row per option |
| `checklist` | `sub?`, `items`, `next` | A card of checkboxes and a "Continue" button |
| `text` | `sub?`, `placeholder?`, `next?` | A card with one input and a "Continue" button |
| `waypoint` | `tag`, `next?` | A dashed, muted card |
| `card` | `sub?`, `sections` | A closing card with no outgoing edge |
| `ticket` | `ticket`, `status`, `claimed_by?`, `blocked_by?` | A card with a status stripe |

Field details:

- `choice.options` is a list of `{ key, label, hint?, badge?, next }`.
  `default` is an option `key`. It is a recommendation, shown as a
  "recommended" pill. It is never a pre-chosen answer.
- `checklist.items` is a list of `{ key, label, hint?, on?, gates? }`.
  `on` defaults to `true`. `gates` is a list of `waypoint` ids and may
  point only at waypoints. A waypoint gated by an unticked item fades and
  shows a "later" pill.
- `card.sections` is a list of `{ head, items, numbered? }`, where `items`
  is a list of strings.
- `ticket.ticket` is one of `research`, `prototype`, `grilling`, `task`.
  `status` is one of `open`, `claimed`, `closed`. `blocked_by` is a list of
  ticket ids. A "blocked" pill shows while any blocker isn't `closed`.

## What the page shows

- In a flow tree, the page reveals steps from the start. It passes through
  `start` and `waypoint` nodes. At a `choice` it continues only through
  the chosen option. At a `checklist` or `text` it continues only after
  Continue. Every node in a ticket tree is always shown.
- "Show whole map" draws the unrevealed steps too, faint.
- Answers live only in the page. A reload clears them.

## Feedback text

"Copy for agent" writes plain text. The first line is
`journey-map feedback for <input path>`. Then come the touched nodes in
layout order, one line each. A node with an answer and a note gets two
lines. Labels and typed text are JSON-escaped.

```
<id> "<label>": chose <key> "<option label>"
<id> "<label>": ticked <keys>; unticked <keys>
<id> "<label>": typed "<text>"
<id> "<label>": note "<text>"
```

Keys are separated by a comma and a space, in item order. Untouched nodes
are left out.

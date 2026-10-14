# Map and ticket format

A map is the folder `docs/maps/<slug>/`. It holds `<slug>-map.md` and one
`<nn>-<ticket-slug>.md` per ticket. The canvas build reads these files with
Node built-ins only, so keep to the format below.

## Frontmatter subset

Frontmatter is flat: `key: value` scalars and inline lists, such as
`blocked_by: ["01", "03"]`. No nested keys, block lists or multi-line
values. Anything else fails the build, which names the file and line.

## The map file

`<slug>-map.md` has this frontmatter:

```
---
type: map
status: draft
---
```

It has five sections, in this order:

- `## Destination`: the first paragraph is the destination the build reads.
- `## Notes`: context that is not a decision.
- `## Decisions so far`: one list item per `closed` ticket, a one-line gist
  with a markdown link to the ticket file. The build reads a ticket's gist from the item that links to its file.
- `## Not yet specified`: one list item per area that is not yet a ticket.
  Each item is a fog patch on the canvas.
- `## Out of scope`: one list item per `out_of_scope` ticket, with the
  reason.

The map holds a gist and a link per decision, and never a progress count.

## Ticket files

Name a ticket `<nn>-<ticket-slug>.md`, numbered from `01`. A number is never
reused and a file is never deleted; a ticket is closed or ruled out instead.

| Field | Value |
| --- | --- |
| `title` | A short name for the unknown. |
| `ticket` | The kind: `research`, `prototype`, `grilling` or `task`. |
| `status` | `open`, `claimed`, `closed` or `out_of_scope`. |
| `blocked_by` | Inline list of ticket numbers, such as `["01", "03"]`. Empty is `[]`. |
| `undermined_by` | Optional inline list of the numbers of the tickets whose resolution broke this one's premise. |
| `claimed_by` | Set with `claimed_at`, only while claimed. |
| `claimed_at` | ISO 8601 time of the claim. |

## Ticket body

- `## Question`: the unknown, as the build's `question`.
- `## Resolution`: the answer. When a ticket is re-resolved, the newest
  `## Resolution` comes first and each earlier one stays below it under its
  own `## Superseded resolution` heading, newest first.

## Status rule

- `open` has no `## Resolution`.
- `closed` and `out_of_scope` have one.
- `claimed` has one only when `undermined_by` is set.

Any other pairing is an error naming the ticket.

# Session Note Template

The session note is the run's own record — created before anything else is
written, and the one file every phase adds to.

## Path

The note lives at
`docs/notes/harness-init-<yyyy-mm-dd>/harness-init-<yyyy-mm-dd>-note.md` —
one slug folder, dated the day the run started, holding one main doc. A
second run on the same day does not collide with the first: it uses
`harness-init-<yyyy-mm-dd>-2` as the slug, for both the folder and the file
— `docs/notes/harness-init-<yyyy-mm-dd>-2/harness-init-<yyyy-mm-dd>-2-note.md`
— fitting the same `docs/<folder>/<slug>/<slug>-<type>.md` layout every
other note in this profile uses.

## Template

Hold this note verbatim when creating it, filling each placeholder from
what the run actually did:

```markdown
---
type: note
title: <title>
description: <one-sentence description of what this run did>
status: <status>
---

# <title>

## Entry integration

<the mode chosen (full, light, or mention-only) and any checks step 0 raised>

## ADR migration

<ADRs moved, the statuses asked and how each resolved, and any claim worked through with the Human — or "skipped — no legacy ADRs" when step 1 never ran>

## Discovery

<the context list, the lifecycle note, and the decided-tools list step 2 produced>

## Research

<the sources cited for each finding, or "repo-only" with the reason the web was skipped or unavailable>

## Suggestions

<the two to four skills suggested, and which of them the Human picked>

## Stubs

<the stubs written for the Human's picks>

## Next steps for the Human

<what the Human still has to define in each stub, and anything else left open>
```

Every section heading above stays in the note even when its step was
skipped — a skipped step fills its section with why, rather than leaving
the heading empty or dropping it, so the note always shows the full shape
of the run.

## Lifecycle

- **Created.** The note is created with `status: draft` at the very start
  of step 0, before anything else in the run is written.
- **Grows with the run.** Each phase — entry, migration, setup — adds its
  own section (or sections) to the note before that phase's commit offer,
  so every phase commit carries its own part of the note alongside
  whatever else that phase wrote. No section waits until hand-back to be
  filled in.
- **Closes.** Step 6 fills in whatever sections are still open and sets
  `status: stable` at hand-back.
- **Resuming.** A `draft` note left by an interrupted run is the run's own
  state, not a leftover to clean up: the next run reads it and keeps
  filling it in, rather than starting a second note over it.

## Anti-patterns

- Dropping a section heading for a step that was skipped instead of
  saying so.
- Leaving every section unfilled until hand-back, instead of adding each
  phase's part before that phase's commit offer.
- Starting a new note over a `draft` note left by an interrupted run.

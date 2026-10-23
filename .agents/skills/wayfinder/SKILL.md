---
name: wayfinder
description: Charts a decision that is too big to settle in one session as a map of tickets under docs/maps/, works one ticket per session through the right skill, and hands the settled decisions to a PRD or spec. Use when the Human asks to chart, map or work through a large unknown, to pick up the next ticket on a map, or accepts a one-line offer of a map.
---

# Wayfinder

A map is a folder under `docs/maps/<slug>/`. It holds one `<slug>-map.md`
with the destination and what is settled so far, and one file per ticket.
A ticket is one unknown: a question with a kind, a status, and the tickets
that block it. Each session works one ticket and stops, so the map, not
your memory, carries the work from one session to the next.

The method, with its destination, frontier, fog, claims and four ticket
kinds, comes from Matt Pocock's MIT-licensed `wayfinder` skill in
`mattpocock/skills`; `rengwu/wayfinder-maps` suggested the stale claim, the
out-of-scope status and the undermined mark. This skill's text and file
format are written for this harness.

## When this runs

- The Human asks to chart a large decision, or to continue a map.
- You think a decision is too big for one session and you offer a map in
  one line. Chart it only if the Human accepts.

Other skills don't call this one.

## Chart a map

Chart when the Human asks for a map, or accepts your one-line offer of one.

1. Pick a short `<slug>` for the work. If `docs/maps/<slug>/<slug>-map.md`
   already exists, resume that map: read it and its ticket files, show the
   frontier, and write nothing over any file. Then follow "Work a ticket"
   if the Human wants to continue.
2. Run `grilling` to settle the destination: what the Human wants decided,
   in one paragraph. Keep going until the unknowns are named too. If
   `grilling` is not installed, ask the same questions yourself, one at a
   time, and name its install command,
   `wolven-harness skills --skills grilling`.
3. Write `docs/maps/<slug>/<slug>-map.md` with `title`, `description`,
   `type: map` and `status: draft` in its frontmatter and five sections, in
   this order:
   Destination, Notes, Decisions so far, Not yet specified, Out of scope.
   Put a vague area that is not yet a ticket under Not yet specified.
4. Write one `<nn>-<ticket-slug>.md` per unknown, numbered from `01`. Each
   has `title`, `ticket`, `status: open` and `blocked_by` frontmatter and a
   `## Question` body. `ticket` is one of four kinds: `research`,
   `prototype`, `grilling` or `task`. The fields and rules are in
   [references/ticket-format.md](references/ticket-format.md).
5. Show the frontier: every `open` ticket whose blockers are all `closed`
   and none undermined, plus every undermined ticket. Stop. Do not claim a
   ticket in the charting session.
6. Run `harness:validate`, then the checklist below, before any commit.

### Recording an answer

When the Human answers an unknown while you chart, that is recording an
answer, not resolving a ticket. Write the ticket with `status: closed` and a
`## Resolution` that states the answer. Add a one-line gist and a link to it
under Decisions so far.

## Work a ticket

Work one ticket per session.

1. Read the map and its tickets. Show the frontier. If a ticket is already
   `claimed`, name it and its `claimed_at` first. When the claim is older
   than 72 hours, say it is stale. Ask the Human whether to resume or
   release it. Never take it over or release it silently.
2. Claim before any work. Set `status: claimed`, set `claimed_by` to the
   runtime's session or agent id (the runtime's name if it exposes no id),
   and set `claimed_at` to the current time.
3. Resolve the ticket by its kind:
   - `research`: run `research`.
   - `prototype`: run `prototype`. On a map with no PRD yet, record the
     verdict in the ticket's `## Resolution`, the place the Human names
     under `prototype`'s no-PRD rule.
   - `grilling`: run `grilling`.
   - `task`: do not run a skill. Record the outcome the Human reports.
4. Write `## Resolution`, set `status: closed`, and add a one-line gist and
   a link under Decisions so far.
5. Show the new frontier and stop. Resolve no second ticket. Continuing
   means a fresh session.

### A resolving skill is not installed

When the ticket needs `research`, `prototype` or `grilling` and that skill
has no folder under `.agents/skills/`, name the skill and its install
command, `wolven-harness skills --skills <name>`. Leave the ticket
`open`. Release any claim you made. Work it in plain conversation only if
the Human asks, and then the `## Resolution` says no skill was used.

## Pre-commit checklist

Run this before committing any change to the map or a ticket. Fix each
failure before committing.

- Each `blocked_by` names an existing ticket other than itself.
- No `blocked_by` cycle exists.
- Each status matches its closing section, as the status rule in
  [references/ticket-format.md](references/ticket-format.md) says.
- `claimed_by` and `claimed_at` appear together.
- Each `closed` ticket appears once under Decisions so far, and each
  `out_of_scope` ticket once under Out of scope.
- No ticket number is reused and no ticket file is deleted.
- No progress count is written, such as "3 of 7 closed".

## Keep the map current

Do this when you close a ticket, and again when the Human's note changes
the plan.

- **New unknowns.** When a resolution reveals an unknown, or settles the
  prerequisites of an item under Not yet specified, write a new ticket for
  each, with its `blocked_by`. Remove a graduated item from Not yet
  specified. Never reuse a ticket number.
- **Ruling a ticket out.** When a resolution makes another open ticket moot
  or puts it beyond the destination, ask the Human to agree. Then set that
  ticket's `status: out_of_scope`, write a `## Resolution` that says why,
  and list it under Out of scope, never under Decisions so far. A ticket
  that is out of scope never counts as closed for the tickets it blocks. For
  each ticket left blocked by it, ask the Human to either remove that
  `blocked_by` edge or rule the blocked ticket out as well, so no ticket
  stays off the frontier for good.
- **Undermining.** When a resolution breaks the premise of a `closed`
  ticket, ask the Human to agree. Then set `undermined_by` on the broken
  ticket to the number of the resolving one, and keep its `status: closed`.
  Its dependents leave the frontier, and the broken ticket joins it.
- **Re-resolving in place.** Claim an undermined ticket as in "Work a
  ticket". Write the new `## Resolution` at the top and keep each earlier
  one below it under its own `## Superseded resolution` heading, newest
  first. Clear `undermined_by`, set `status: closed`, and rewrite the
  ticket's gist under Decisions so far. The number stays, so every
  `blocked_by` that names it stays valid.

## The canvas

The canvas is a page that draws the map as lanes from Start to the
destination. Build it only when the
Human asks to see the map, or accepts a one-line offer of it. Make that offer
once after you chart a map and once after you close a ticket. If the Human
declines or moves on, build nothing and do not repeat the offer until the
next chart or close.

1. Check that `docs/maps/.gitignore` exists. If it does not, build nothing
   and follow "Missing install pieces".
2. Run `node <this skill's folder>/scripts/build-canvas.mjs
   docs/maps/<slug>/<slug>-map.md`. It writes `<slug>-canvas.json` and
   `<slug>-canvas.html` beside the map, overwriting any earlier build. On an
   error it exits 1 and names the ticket; fix the ticket file and build
   again.
3. Tell the Human the page path.

When the Human asks for the radial view, run the same script with `--radial`
before the map path. It writes the same `<slug>-canvas.json` and
`<slug>-radial-canvas.html` beside the map. Tell the Human that page path.
Build `--radial` and `<slug>-radial-canvas.html` only when the Human asks.
The radial view is never offered.

The canvas and its JSON are derived and gitignored. Never edit either one.
Feedback goes into the ticket files, then you build again if the Human wants
to see it.

When the Human pastes text from the page:

- Text that begins "Use the wayfinder skill to take ticket" starts a session
  on that ticket. Follow "Work a ticket" on it, and if it names a claimer,
  ask first as that section says. Text that says "re-resolve" starts
  re-resolving that ticket in place.
- Text that begins "wayfinder feedback for" is a "Copy for agent" note. Edit
  the ticket files it points at to carry the note. When the note challenges
  a decided ticket, start the undermine step of "Keep the map current"
  instead of editing that ticket's resolution.

## Hand off

Hand off when the frontier is empty and the Human confirms the destination
is reached.

1. If any ticket is `open`, `claimed` or undermined, list those tickets and
   ask the Human to confirm before archiving. The handoff carries them as
   open questions.
2. Name the next skill: `create-prd` for a product problem, `code-spec` for
   a confirmed code-shaped ask. Give it the map's Decisions so far as its
   input.
3. Set the map's `status: deprecated`.
4. Move the folder to `docs/maps/archived/<slug>/`. No frontier scan reads
   that folder.
5. Rewrite every relative link in a tracked file that pointed into the old
   folder, so it points into the archived one.
6. Run `harness:validate`.

## Missing install pieces

A map needs four pieces that `setup --skills discovery` installs. On an
install that lacks any of them, name each missing piece to the Human with
the exact lines below, the first time you chart a map. Create only the
map's own folder and files. Do not edit `.qmd/index.yml`, `WOLVEN.md` or
`AGENTS.md` yourself; ask the Human to add the lines. Build no canvas until
`docs/maps/.gitignore` exists.

- `docs/maps/`: the folder, with an empty `docs/maps/.gitkeep`.
- `docs/maps/.gitignore`, with exactly these two lines:

  ```
  *-canvas.json
  *-canvas.html
  ```

- The `maps` collection, under `collections:` in `.qmd/index.yml`:

  ```
    maps:
      path: ./docs/maps
      pattern: "!(archived)/**/*.md"
  ```

- The router row, in the table in `WOLVEN.md`:

  ```
  | `docs/maps/<slug>/` | Maps of a large decision: `docs/maps/<slug>/<slug>-map.md` plus one file per ticket |
  ```

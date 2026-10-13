---
name: journey-map
description: Draws a flow, a set of options, or a ticket graph as one interactive HTML page built from a JSON map tree, so the Human can walk it, answer it and send feedback back. Use when the Human asks for a journey map, a flow diagram to click through, or a decision map, or accepts a one-line offer of one.
---

# Journey map

A journey map is one HTML page the Human can walk. It shows a flow as
cards joined by edges. The Human picks options, ticks boxes and types
answers, and the page reveals the next step. When they are done, they copy
a short text record and paste it back to you.

You write only the JSON map tree. A script builds the page from it.

## When this runs

- The Human asks for a map, a flow to click through, or a way to compare
  paths.
- You think a map would help and you offer it in one line. Build it only if
  the Human accepts.

Other skills don't call this one. If a skill's flow would be easier to
judge as a map, the Human decides to ask for one.

## Where the files go

Map files sit beside the doc they serve:

- `docs/<folder>/<slug>/<slug>-map.json` is the source you write.
- `docs/<folder>/<slug>/<slug>-map.html` is the page the script generates.

If no doc exists for the work yet, write one first. Create
`docs/notes/<slug>/<slug>-note.md` with `type: note` and `status: draft`
in its frontmatter, then run `harness:validate`. Put the map files in
that folder.

## Build the map

1. Write the tree as JSON. The fields and rules are in
   [references/tree-format.md](references/tree-format.md).
2. Write only the JSON. Never edit the HTML by hand, because the next build
   overwrites it.
3. Run this after every write:

   ```
   node <this skill's folder>/scripts/build-map.mjs <path>/<slug>-map.json
   ```

   The script needs only Node. It writes `<path>/<slug>-map.html`.
4. On exit 1, the script prints one line per error to stderr. Fix the tree
   and build again. It still writes a page on exit 1, but that page shows
   the error, so don't hand it over.
5. When the build exits 0, open the page once in a browser tool if your
   runtime has one. Check that it draws and that a click reveals the next
   step. If you have no browser tool, give the Human the file path.

## What the Human sees

- Upcoming steps stay hidden until the Human decides. "Show whole map" in
  the top bar shows all of them, faint.
- A pencil on each card adds a one-line note.
- Answers are not saved across reloads. The "Copy for agent" text is the
  record.

## Feedback loop

1. Ask the Human to walk the map and press "Copy for agent", then paste the
   result to you.
2. Read the lines. They name each touched node by id and label.
3. Revise the JSON to match, then rebuild and reopen the page.

In Claude, when artifact publishing is available, also publish the page as
an artifact. When the Human comments on it, revise the JSON, rebuild, and
republish to the same URL so the link stays the same.

## Lifecycle

A map is a design aid. It is not kept in sync with shipped code. The JSON is
the source of truth and the HTML is derived from it. Both files move with
their doc folder when it is archived.

## Anti-patterns

- Editing the HTML instead of the JSON.
- Skipping the build after a write, so the page shows an old tree.
- Handing over a page that the build failed on.
- Treating "recommended" on an option as the Human's answer.
- Putting every step of a long flow in one tree instead of linking trees.
- Expecting the page to remember answers after a reload.

# Lean path

Covers the path question every run asks and the lean path the Human picks
as "Quick setup": connect the harness to the selected runtimes and hand
back. Everything else waits for a later run. The other path, "Guided
setup", runs the workflow in `SKILL.md`, one phase at a time.

## Resume first

Check for an earlier harness-init session note before asking anything:

- A `draft` note that records a **Path:** resumes on that path, with the
  answers it records. Ask none of them again; pick up at the first step
  the note has not recorded.
- A `stable` note means an earlier run finished. It does not block a new
  run: the re-run skips in `SKILL.md` apply, and the path question is
  asked again.

## The path question

After the introduction in `SKILL.md`, the resume check and before step 0,
ask one question: "How much setup do you want right now?" Offer two
answers, the recommended one first, naming the selected runtimes from
`.wolven-harness.json`, such as "Claude Code and Cursor":

1. **Quick setup (recommended)**: connect the harness to <runtime names>;
   everything else can wait. This picks the lean path.
2. **Guided setup**: walk through every step, skipping whatever you don't
   want yet. This picks the guided path.

The Human picks the path, for a brand-new repo or one with code alike.
Never pick it for them from what the tree shows, and never call the second
answer a "full tour": "full install" is a layout name. Record the answer in
the note as the **Path:**.

## What the lean path asks

In this order, and nothing else:

1. The path question above.
2. In a full install, step 0's question about how much to change
   `AGENTS.md`, from [entry-modes.md](entry-modes.md). Its before-writing
   checks become questions only when they find something.
3. In a quiet install, the questions of the quiet-install section of
   [layout.md](layout.md), and no other.

It asks no goal question, in either install.

## What the lean path runs

- In a full install, step 0, entry integration, with the diff shown and the
  Human's yes before anything is written.
- In a quiet install, step 0 is skipped, and the run follows the
  quiet-install section of [layout.md](layout.md) right after the path
  question, then hands back.
- The session note: `draft` at step 0 (or right after the path question in a
  quiet install), `stable` at hand-back.
- The safety audit question from step 6 of `SKILL.md`, as the last step,
  before the commit offer. It runs only on a yes, and no other part of the
  score is recorded or asked about.
- The hand-back at the end of step 6.

## What the lean path does not run

Each of these is recorded under **Left for later** in the note and listed
in the hand-back:

- Step 1, legacy ADR migration.
- Step 2, discovery: neither reading the repo nor its questions.
- Step 3, research.
- Steps 4 and 5, skill proposals and stubs.
- Step 6's score-gap questions.
- Step 6's question about how to check the harness.

## What the lean path writes

In a full install, only step 0's change and the session note. Step 0's
change is the `AGENTS.md` change, the `WOLVEN.md` change that goes with it,
and any re-include rules or `CLAUDE.md` line you agreed to. The run ends
with the one commit offer in `SKILL.md`.

In a quiet install, only what the quiet-install section writes and the
session note.

## Coming back for the rest

A later run that picks "Guided setup" does the rest. Step 0 is skipped by
the re-run skips in `SKILL.md`, so `AGENTS.md` is never folded twice.

# Lean path

Covers the path question every run asks and the lean path the Human picks
as "Just the basics": note the first goal, update `AGENTS.md`, and hand
back. Everything else waits for a later run. The full path, "The full
tour", runs the workflow in `SKILL.md`.

## Resume first

Check for an earlier harness-init session note before asking anything:

- A `draft` note that records a **Path:** resumes on that path, with the
  goal and coverage it records. Ask none of them again; pick up at the
  first step the note has not recorded.
- A `stable` note means an earlier run finished. It does not block a new
  run: the re-run skips in `SKILL.md` apply, and the path question is
  asked again.

## The path question

After the resume check and before step 0, ask one question: "How much
setup do you want right now?" Offer two answers, the recommended one
first:

1. **Just the basics** (recommended): note your first goal and update
   `AGENTS.md`; everything else can wait. This picks the lean path.
2. **The full tour**: go through every step, leaving out whatever you
   don't want yet. This picks the full path.

The Human picks the path, for a brand-new repo or one with code alike.
Never pick it for them from what the tree shows. Record the answer in the
note as the **Path:**.

## What the lean path asks

In this order, and nothing else:

1. The path question above.
2. "What do you want to get done first in this repo? One sentence." Record
   the answer as given; never compose one for the Human. An empty answer
   is recorded as "none given", and the run moves on without asking again.
3. Step 0's question about how much to change `AGENTS.md`, from
   [entry-modes.md](entry-modes.md). Its before-writing checks become
   questions only when they find something.

## What the lean path runs

- The leaked-credential checks from [harness-score.md](harness-score.md),
  after the goal question and before step 0. A leaked credential stops the
  run before anything else is written; no other part of the score is
  recorded or asked about.
- Step 0, entry integration, with the diff shown and the Human's yes
  before anything is written.
- The session note: `draft` at step 0, `stable` at hand-back.
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

Only step 0's change and the session note. Step 0's change is the
`AGENTS.md` change, the `WOLVEN.md` change that goes with it, and any
re-include rules or `CLAUDE.md` line the Human agreed to. The run offers
one commit, for the entry phase, as the phased commits in `SKILL.md`
describe.

## Coming back for the rest

A later run that picks "The full tour" does the rest. Step 0 is skipped by
the re-run skips in `SKILL.md`, so `AGENTS.md` is never folded twice.

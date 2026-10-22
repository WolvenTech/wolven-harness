---
name: harness-init
description: "Guides a repo through initial harness setup: folds the entry file into AGENTS.md, offers legacy ADR migration, discovers the repo, researches its decided tools, suggests skills, writes stubs, scores the harness, and closes with a session note. Use when a repo has just run `wolven-harness setup`, or has only a bare `.agents/skills/` tree."
---

# Harness Init

One guided session that takes a repo from a fresh `wolven-harness setup` (or a
bare `.agents/skills/` tree) to a working setup: the entry file folded into
`AGENTS.md`, any legacy ADRs migrated into `docs/adrs/`, the repo understood,
a short list of suggested skills stubbed out, the harness scored, and a
session note recording what happened. The Human steers every write.

**Consult:** `adr`, `research`, `code-commit` (when installed), `qmd`, `grilling`.

**Docs retrieval:** Follow the [shared QMD routing contract](../qmd/SKILL.md#harness-stage-routing)
for `harness-init`: read exact inputs directly, choose relevant collection scopes,
and preserve this skill's permissions and docs-write handoff/resume boundaries.

## Hard gates

These rules hold across every step below.

1. **`harness:validate` drives what comes next.** Read its output before
   deciding the next move — never guess at a status, a warning, or an exit
   code it would have reported.
2. **One question at a time.** An ambiguity — an entry mode, an ADR status,
   a successor, anything the repo or the Human hasn't settled — becomes a
   single question to the Human, the recommended option listed first (see
   `grilling`). Questions are plain language: phrase each as what the repo
   has or lacks and what the choice means in practice; check IDs, codes,
   and acronyms are supporting detail, never the subject.
3. **Never invent.** No status, successor ADR, entry mode, or decision is
   assumed on the agent's own judgment; each one comes from what the Human
   answers or what `harness:validate` reports. A claim that starts failing
   after migration is expected input to work through with the Human, not a
   defect to paper over.
4. **No consumer names.** This skill names no specific consumer repository
   and carries no steps special-cased for one. The rules hold for any repo it
   meets; when a repo presents something they don't cover, that is a question
   for the Human, not a new rule.

## Session note

`references/session-note-template.md` renders the record of this run at
`docs/notes/harness-init-<yyyy-mm-dd>/harness-init-<yyyy-mm-dd>-note.md`
(a second run on the same day adds `-2`). It is created `draft` at the start
of step 0. Each phase below adds its section to the note before that
phase's commit offer, so every phase commit carries its part of the note,
and the note turns `stable` at hand-back in step 6. A `draft` note left by
an interrupted run is where the next run resumes from — never start a
second note over it.

## Phased commits

The run has three writing phases:

| Phase | Steps |
|-------|-------|
| Entry | 0 |
| Migration | 1 |
| Setup | 2–6 |

At the end of each phase, once `harness:validate` exits 0 — `0 legacy-warn`
as well, for the migration phase — offer one commit of that phase's paths
through `code-commit`, and commit only on the Human's yes. When `code-commit`
is not installed (no `.agents/skills/code-commit/`), ask the Human before each
phase's commit and make it with plain `git commit` of that phase's paths, again
only on their yes. Never a single commit at the end of the whole run, and
never a commit per file, ADR, claim, or stub. A declined commit leaves that
phase uncommitted, and the next phase's offer covers only its own paths —
the two never merge into one.

Every writing step also shows the Human the diff before writing, runs
`harness:validate` right after it writes, and waits for the Human's choice
before moving on.

## Re-run skips

A re-run does not redo what an earlier run already finished:

- Step 0 is skipped when `WOLVEN.md` is already gone, or `AGENTS.md`
  already holds the harness start marker (`<!-- wolven-harness:start -->`).
  A plain mention of `WOLVEN.md` does not count.
- An `AGENTS.md` that already holds the harness section was integrated by
  an earlier run, even when `setup` has since brought `WOLVEN.md` back:
  never fold it a second time; show the diff, ask whether to refresh the
  section, then delete `WOLVEN.md` (see "Already integrated" in
  [references/entry-modes.md](references/entry-modes.md)).
- Step 1 is skipped when there are no legacy-ADR warnings left.
- A `draft` session note from an interrupted run is resumed, not replaced,
  with the path, goal and coverage it already records.

## Lean path

The path question comes after the re-run checks above. Load
[references/lean-path.md](references/lean-path.md) before step 0: it holds
the resume check, the path question ("How much setup do you want right
now?") and the whole lean path. When the Human picks "Just the basics",
follow it and skip the steps it leaves for later. When they pick "The full
tour", run the workflow below, trimmed by the coverage checklist.

## Full tour coverage

On the full path, before step 0, show one checklist: "What should this run
cover?" Every item starts ticked, and the Human unticks whatever should
wait. Record the ticked items in the note as **Covered:**.

| Item | Covers |
|------|--------|
| Move old decision records | Step 1 |
| Ask about the project's stage and plans | Step 2, its two questions |
| Look up your tools on the web | Step 3, the web pass |
| Suggest skills for this repo | Steps 4 and 5 |
| Check the harness score now | Step 6, the score and its questions |
| Set up automatic checks | Step 6, the question about how to check the harness |

An unticked item is never asked about or run: record it under **Left for
later** in the note and list it in the hand-back. File-based discovery and
the repo and `qmd` search still run on the full path, whatever is ticked.
With every item unticked, the run reads the leaked-credential checks, makes
only step 0's change, and hands back.

## Leaked credentials before step 0

On both paths, once the path question and the goal or the coverage are
settled, and before step 0 writes anything (the session note included), run
`harness:score` and read the leaked-credential checks: `HYG-03`, `HYG-04`
and `HYG-06`. A failure stops the run and shows the Human the finding
before any file is written. See
[references/harness-score.md](references/harness-score.md).

## Workflow

### 0. Entry integration

Fold the entry file into `AGENTS.md` in one of two modes — full or light.
Put the mode to the Human as one question, the recommended mode first with
the reason, and the other mode as the remaining option; never pick it
silently. Both modes
write the harness section between `<!-- wolven-harness:start -->` and
`<!-- wolven-harness:end -->`; when `.wolven-harness.json` lists `codex`
under `runtimes`, the section also carries the rule bodies between
`<!-- wolven-harness:rules:start -->` and `<!-- wolven-harness:rules:end -->`.
This step also checks for existing `AGENTS.md` content, an
overlapping router or rule, a `CLAUDE.md` that should import `AGENTS.md`,
any harness path an ignore rule keeps from other clones (proposing
re-include rules), and existing content in the five doc folders the
writing profile governs. See
[references/entry-modes.md](references/entry-modes.md).

### 1. Legacy ADR migration (optional)

Runs when "Move old decision records" is covered and `harness:validate`
reports `legacy-adr`. Turns each
legacy ADR into a profile ADR under `docs/adrs/` — keeping its number,
moving it, prepending frontmatter, mapping its status (asking when part
of a superseded ADR still applies, and searching for the tokens tests pin
first) — and closes the step by recomputing links, working every failing
claim with the Human, and checking that each claim to a touched ADR names
the right decision, until `harness:validate` exits 0 with `0 legacy-warn`. See
[references/adr-migration.md](references/adr-migration.md).

### 2. Discovery

First settle the layout. When this folder is not a git repository, or the
harness reaches it from above through an entry file, load
[references/layout.md](references/layout.md) and follow it before reading
anything else. It asks before `git init`, records `layout` and the harness
paths in `.wolven-harness.json`, and moves no folder.

Then settle the commit convention: read the code repository's last 30 commit
subjects, propose a pattern only at 80% agreement or more, and record
`commitConvention` in the harness home's `.wolven-harness.json` after the
Human confirms. See [references/convention.md](references/convention.md).

Read what the repo already shows — manifests, lockfiles, README, `AGENTS.md`, CI
config, `docs/adrs/`, installed skills, top-level layout. When "Ask about the
project's stage and plans" is covered, also ask the Human for what files
can't show: lifecycle stage and decisions not yet visible in code. Produces a context list, a lifecycle note, and a
decided-tools list. See [references/discovery.md](references/discovery.md).

### 3. Research

Search the repo and `qmd` first. Web research runs only when "Look up your
tools on the web" is covered and the Human says yes, is capped at five primary-source fetches, and covers
decided tools only, with every finding cited in the session note; offer
`research` for depth on one tool. Continue repo-only, and say so in the
note, when the web is unavailable. See
[references/discovery.md](references/discovery.md).

### 4. Suggest 2–4 skills

When "Suggest skills for this repo" is covered, first judge whether the repo
is new or still unexplored, and skip steps 4 and 5 on a well-understood repo
unless the Human overrules. Otherwise suggest two to four architectural
skills, each named for a decided tool or
field and citing the discovery evidence, never duplicating an installed
skill. Say so, rather than padding, if the evidence supports fewer than
two. The Human picks any subset. See
[references/discovery.md](references/discovery.md).

### 5. Write stubs

Render each skill the Human picked by filling the placeholders in
[references/stub-template.md](references/stub-template.md). That file is
the pattern: a trigger `description`, ask-only frontmatter, cited
evidence with a generated-against stamp, and headed prompts, each step
ending on a checkable done. The write is done when both rendered files
exist, no existing skill folder was overwritten, and `harness:validate`
warns `skill-stub-open` once for that `SKILL.md`.

### 6. Score, session note and hand-back

The leaked-credential checks already ran before step 0. When "Check the
harness score now" is covered, run `harness:score` again and record the
level and score. For each dimension with a failing check, ask one question
in plain language: state what the repo lacks and what building it means, with check IDs as supporting references,
and spell out any maturity cap dropping them would cause. Keep its checks as
gaps to build later, or drop them in `.harness-score.json`. Never build a check
in this run, and never drop one without the Human's yes. Score again and record
the level, the score and every drop. See
[references/harness-score.md](references/harness-score.md).

Then, when "Set up automatic checks" is covered, put one question to the
Human: how should `harness:validate` be wired —
(a) as a CI job on pull requests, (b) chained into the repo's existing
`validate` or `test` script, or (c) local only? Detect the CI config and the
existing scripts first, frame the options with that evidence, and list the
recommended option first. Nothing is written without the Human's yes. See
[references/validate-wiring.md](references/validate-wiring.md).

Then add the note's final sections, set it `stable`, and hand the run back to
the Human in one closing message with three parts:

1. **What's installed:** the skills and the runtimes they are ready in, the
   `AGENTS.md` change, anything else this run did, the commits made, and the
   session note.
2. **Left for later:** every step this run did not run.
3. **Next steps:** a numbered list fitted to the installed skill sets.

End the message by offering the next piece of work: "Should we start with a
spec for “<goal>”?" when the Human gave a goal, or "What should we build
first?" when none was given. On a yes, the run ends and `code-spec` starts
as separate work on its own branch. Nothing starts without a yes. See
[references/session-note-template.md](references/session-note-template.md).

The run ends at hand-back. Defining stubs or building score gaps is a
separate change on its own branch, not a commit on the harness-init branch.
If the Human asks for it in the same session, say so and stop.

## Anti-patterns

- Guessing at an ambiguous status, mode, or successor instead of asking the
  Human.
- Special-casing a known repo instead of applying these rules and asking
  the Human.
- One commit at the end of the run, or a commit per file, ADR, claim, or
  stub.
- Writing before showing the diff, or before the Human has chosen.
- Starting a new session note over a `draft` note left by an interrupted
  run.
- Treating a validate failure after migration as this skill's defect
  instead of expected input to work through with the Human.
- Picking the path for the Human from what the tree shows, instead of
  asking the path question.
- Running a step the lean path leaves for later.
- Moving or renaming a folder to make a layout fit instead of linking it.

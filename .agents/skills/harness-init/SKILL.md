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

Before the first question, say this to the Human:

> The harness is the set of instructions, rules and doc folders your coding
> agent follows. In a quiet install it lives in `.wolven-harness/`. Before
> anything outside that folder changes, you see the diff and say yes. Nothing
> is ever pushed.

Then, before the first question, check where the session runs. When
`git rev-parse --git-dir` and `git rev-parse --git-common-dir` differ, it is
in a git worktree. A worktree with no `.wolven-harness.json` has no harness
yet, so stop: write nothing, never write into the main checkout from here,
and never copy the harness in. The main checkout is the first path
`git worktree list` prints. Say:

> This session is in a git worktree, and the harness isn't here yet: it stays
> in your main checkout until you commit it. Nothing changed. Next: open a
> session on `<main checkout path>` with no worktree, then run `harness-init`
> there.

**Consult:** `adr`, `research`, `code-commit` (when installed), `qmd`, `grilling`.

## Hard gates

These rules hold across every step below.

1. **`harness:validate` drives what comes next.** Read its output before
   deciding the next move — never guess at a status, a warning, or an exit
   code it would have reported. In a quiet install the command is
   `wolven-harness validate`. When the CLI is missing, stop and say:

   > I can't find `wolven-harness` on this machine, so I can't check the
   > setup. Next: install it with `<install command>`, then tell me to
   > continue.

   `<install command>` is the global install `setup` prints. Never hunt for
   another build of the CLI.
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
of step 0, or right after the path question in a quiet install, which skips
step 0. Each phase below adds its section to the note, and the
note turns `stable` at hand-back in step 6. A `draft` note left by an
interrupted run is where the next run resumes from — never start a second
note over it.

## Writing steps

Every writing step shows the Human the diff before writing, runs
`harness:validate` right after it writes, and waits for the Human's choice
before moving on. No step offers a commit; the run makes one offer, at the
end (see "Commit offer").

## Commit offer

The run makes exactly one commit offer, at the end, in both installs, once
`harness:validate` exits 0 (`0 legacy-warn` as well, when migration ran). It
comes after step 6 has set the session note `stable` and before the
hand-back message. No phase, step, file, ADR, claim, or stub gets an offer
of its own. Ask, naming the branch `git branch --show-current` prints:

> Commit these <N> files to `<branch>`? Nothing is pushed.

Under the question, list every path, each tagged `(tracked)` when git
already tracks it or `(new)` when the run created it. List only paths git
would track, and never force-add one:

- In a quiet install: `.wolven-harness/.gitignore`, `.wolven-harness/AGENTS.md`,
  the ticked home folders, `.wolven-harness/.agents/hooks/`,
  `.wolven-harness.json`, and each tracked root file
  the run created or edited with the Human's yes, such as the root
  `.gitignore`, `AGENTS.md`, `CLAUDE.md` or `.dockerignore`.
- In a full install: every path the run created or changed that git would
  track.
- The session note is in the list only when the Notes folder is ticked.
  Otherwise the closing message says: "The session note is kept on this
  machine only."

In a quiet install, the closing message also says what stays out of the
commit:

- The ignored paths, in one line: "These stay on this machine, and git
  ignores them: `<paths>`." That covers the symlinks, the Claude Code
  settings and the wiring record. None of them is ever in the list.
- Each kept client path, one line each: "Kept as yours: `<path>` (`<merged /
  saved as wolven-<name> / skipped>`)."
- Packaging, by what the approved wiring diff did. When it added
  `.wolven-harness/` to the root `.dockerignore`: "Docker builds skip the
  harness: your `.dockerignore` now excludes `.wolven-harness/`. Archives and
  rsync deploys need their own exclusion." Otherwise: "Packaging that ignores
  `.gitignore` (a Docker build, an archive, an rsync deploy) picks up the
  whole harness, unticked docs included. Exclude `.wolven-harness/` there."
- The worktree limit: a worktree gets only the folders git tracks. An
  unticked docs folder can't be read from a worktree session, and a write to
  it lands in the worktree's ignored copy, which is lost when the worktree is
  removed.

On a yes, pass the listed paths by name to `code-commit`. When `code-commit`
is not installed (no `.agents/skills/code-commit/`), make the commit with
plain `git commit` of those paths. Never stage with `git add -A` or
`git add .`. On a no, nothing is committed and the changes stay in the
working tree. In a quiet install, a no also says the guard line: "Nothing is
committed, so the secret guard won't reach new worktrees until you commit
`.wolven-harness/.agents/hooks/`."

When `git remote` prints nothing, make no commit offer, since there is no
remote to share the commit with. Say: "This repo has no remote, so no commit
was offered. Your changes stay in the working tree." In a quiet install, also
say the guard line above.

## Re-run skips

A re-run does not redo what an earlier run already finished:

- Step 0 is skipped when `WOLVEN.md` is already gone, or `AGENTS.md`
  already holds the harness start marker (`<!-- wolven-harness:start -->`).
  A plain mention of `WOLVEN.md` does not count. It is also skipped in a
  quiet install, always (see step 0).
- An `AGENTS.md` that already holds the harness section was integrated by
  an earlier run, even when `setup` has since brought `WOLVEN.md` back:
  never fold it a second time; show the diff, ask whether to refresh the
  section, then delete `WOLVEN.md` (see "Already integrated" in
  [references/entry-modes.md](references/entry-modes.md)).
- Step 1 is skipped when there are no legacy-ADR warnings left.
- A `draft` session note from an interrupted run is resumed, not replaced,
  with the path and answers it already records.

## Lean path

The path question comes after the re-run checks above, and after the
introduction at the top. Load
[references/lean-path.md](references/lean-path.md) before step 0: it holds
the resume check, the path question and the whole lean path. When the Human picks "Quick setup", follow
it and skip the steps it leaves for later. When they pick "Guided setup",
follow "Guided setup" below.

## Guided setup

Guided setup asks no coverage checklist. It opens with one question, "What's
this repo for, and what's your role in it?", which replaces the goal
question. Record the answer in the note as given; never compose one for the
Human. Then, in this order, offer each remaining phase on its own with the
guided step question, asked once per phase and never shown as a list:

> Next: <what the step does, in one line, with any tracked change named>. Run
> it, or skip?

The options are "Run it" and "Skip it".

| Phase | Steps | What the question says it does |
|-------|-------|--------------------------------|
| Migration | 1 | Copy your old decision records into the harness; your files are not changed |
| Research | 3 | Look up the tools your repo uses on the web, up to five pages |
| Skill suggestions | 4 and 5 | Suggest template skills for this repo and write the ones you pick |
| Score | 6, the score and its questions | Score the harness and go over the gaps |

The checks question closes the phases and carries its own "Skip it", so it
gets no guided step question (see step 6). A skipped step is never asked
about or run again this session: record it under **Left for later** in the
note and list it in the hand-back. File-based discovery and the repo and
`qmd` search still run, whatever is skipped. In a quiet install, guided
setup then runs the quiet-install section of
[references/layout.md](references/layout.md), after the last phase and
before the hand-back. The closing asks what to work on next.

## Workflow

### 0. Entry integration

Skipped in a quiet install, the `.wolven-harness` folder inside the git
top-level: setup already wrote `.wolven-harness/AGENTS.md`, and there is no
`WOLVEN.md` to fold. The client's root `AGENTS.md` and `CLAUDE.md` get the
harness block instead (a short note in them that points agents to
`.wolven-harness/AGENTS.md`), in the wiring diff of the quiet-install
section (see "Harness block in a quiet install" in
[references/entry-modes.md](references/entry-modes.md)). The rest of this
step is for a full install.

Fold the entry file into `AGENTS.md` in one of two modes — full or light.
Put the mode to the Human as one question, the recommended mode first with
the reason, and the other mode as the remaining option; never pick it
silently. Both modes
write the harness section between `<!-- wolven-harness:start -->` and
`<!-- wolven-harness:end -->`; when `.wolven-harness.json` lists `codex` or
`antigravity` under `runtimes`, the section also carries the rule bodies
between `<!-- wolven-harness:rules:start -->` and
`<!-- wolven-harness:rules:end -->`.
This step also checks for existing `AGENTS.md` content, an
overlapping router or rule, a `CLAUDE.md` that should import `AGENTS.md`,
any harness path an ignore rule keeps from other clones (proposing
re-include rules), and existing content in the five doc folders the
writing profile governs. See
[references/entry-modes.md](references/entry-modes.md).

### 1. Legacy ADR migration (optional)

Runs when `harness:validate` reports `legacy-adr` and the Human runs it at
the guided step question. Turns each
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
config, `docs/adrs/`, installed skills, top-level layout. The
repo-and-role answer stands in for what files can't show, such as the
lifecycle stage; ask no separate stage question. Produces a context list, a
lifecycle note, and a decided-tools list. See [references/discovery.md](references/discovery.md).

### 3. Research

Search the repo and `qmd` first. Web research runs only when the Human runs
the research step, is capped at five primary-source fetches, and covers
decided tools only, with every finding cited in the session note; offer
`research` for depth on one tool. Continue repo-only, and say so in the
note, when the web is unavailable. See
[references/discovery.md](references/discovery.md).

### 4. Suggest 2–4 skills

When the Human runs the skill-suggestion step, first judge whether the repo
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

When the Human runs the
score step, run `harness:score` again and record the
level and score. For each dimension with a failing check, ask one question
in plain language: state what the repo lacks and what building it means, with check IDs as supporting references,
and spell out any maturity cap dropping them would cause. Keep its checks as
gaps to build later, or drop them in `.harness-score.json`. Never build a check
in this run, and never drop one without the Human's yes. Score again and record
the level, the score and every drop. See
[references/harness-score.md](references/harness-score.md).

Then, in guided setup, put the checks question to the Human, with its own
skip: how should `harness:validate` be wired —
(a) as a CI job on pull requests, (b) chained into the repo's existing
`validate` or `test` script, or (c) local only? Detect the CI config and the
existing scripts first, frame the options with that evidence, and list the
recommended option first. Nothing is written without the Human's yes. See
[references/validate-wiring.md](references/validate-wiring.md).

Then, on both paths, offer the safety audit as the last step of setup, before
the commit offer. Ask:

> Last step: do you want a safety audit? The harness never opens your `.env`
> or key files, and it blocks your agent from opening them. This audit checks
> that protection is in place: that git ignores your `.env` files, and that no
> key was pasted into your MCP config or harness files, which your agent loads
> anyway. It reports file names, never values.

For a runtime with no secret guard hook, or when the wiring was declined, say
"and its rules tell your agent not to open them" in place of "and it blocks
your agent from opening them". Options: "Run the audit (recommended)" and
"Skip it". Never run it unasked. On a yes, run the pinned `harness-score`
command `setup` printed (in a quiet install it ends in
`--config .wolven-harness/.harness-score.json`; in a full install it is
`harness:score`) and read only `HYG-03`, `HYG-04` and `HYG-06`. Never open a
`.env` or key file, a flagged file or a secret-shaped file yourself, and never
print a value. When it finds nothing, say so in one line of the closing
message. A finding never stops the run; say:

> The safety audit found a gap: <file and check>. Setup didn't cause this, and
> the audit changed nothing. Next: have git ignore that file, or move the key
> out of it.

Leave any path with a finding out of the commit offer, and say so. "Skip it"
lists "safety audit not run" under **Left for later**. See
[references/harness-score.md](references/harness-score.md).

Then add the note's final sections, set it `stable`, make the one commit
offer (see "Commit offer"), and hand the run back to the Human in one closing
message with three parts:

1. **What's installed:** the skills and the runtimes they are ready in, the
   `AGENTS.md` change, anything else this run did, the commits made, and the
   session note.
2. **Left for later:** every step this run did not run.
3. **Next steps:** a numbered list fitted to the installed skill sets.

End the message by asking what to work on next. When the Human names new
work that needs a spec, the run ends and `code-spec` starts as separate work
on its own branch. Nothing starts without a yes. See
[references/session-note-template.md](references/session-note-template.md).

The run ends at hand-back. Defining stubs or building score gaps is a
separate change on its own branch, not a commit on the harness-init branch.
If the Human asks for it in the same session, say so and stop.

## Anti-patterns

- Guessing at an ambiguous status, mode, or successor instead of asking the
  Human.
- Special-casing a known repo instead of applying these rules and asking
  the Human.
- A commit offer before the end of the run, or a commit per file, ADR,
  claim, or stub.
- Listing an ignored path in the commit offer, or force-adding one.
- Writing before showing the diff, or before the Human has chosen.
- Starting a new session note over a `draft` note left by an interrupted
  run.
- Treating a validate failure after migration as this skill's defect
  instead of expected input to work through with the Human.
- Picking the path for the Human from what the tree shows, instead of
  asking the path question.
- Running a step the lean path leaves for later.
- Moving or renaming a folder to make a layout fit instead of linking it.

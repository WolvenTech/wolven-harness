---
type: note
title: Install copy review
description: A persona review of every user-facing string in setup, harness-init, validate and doctor for the quiet install, read as a senior dev new to agent harnesses working in a client repo.
status: draft
---

# Install copy review

An independent reviewer (Opus, high effort) read the harness-init skill and
its references in full, plus the "Human-facing wording" table and rows R4.7
and R5.1–R5.8 of `docs/specs/quiet-install/quiet-install-spec.md`. It
edited nothing. Nothing here is decided yet.

**Persona:** a senior dev who uses Claude Code daily and knows git well. They
are new to spec-driven engineering and to advanced agent techniques, and they
are wary of touching a client's repo.

Paths below: **S** is `templates/.agents/skills/harness-init/SKILL.md`,
**R/x** is `templates/.agents/skills/harness-init/references/x.md`, and
**SPEC** is the spec above.

Verdicts: **C** clear, **U** unclear, **J** jargon, **A** alarming, **M**
missing information.

## Copy inventory, in the order a user meets it

### Pre-flight

| ID | Text | Source | Verdict |
|---|---|---|---|
| PF1 | Setup summary: "Quiet install" plus "The harness lives in `.wolven-harness/`, and you choose what git tracks." Next steps name `wolven-harness validate` and the harness-init skill. | SPEC R4.3, R4.7 | U: doesn't say that nothing is tracked yet |
| PF2 | described: a draft note from an interrupted run resumes silently, with its path, goal and coverage. | R/lean-path L10-17 | M: no line tells the user it is resuming |
| PF3 | described: when already folded, it shows the diff against the new `WOLVEN.md` and asks whether to refresh the section. | S L81-85; R/entry-modes L174-181 | J. Full install only |
| PF4 | "How much setup do you want right now?" Options: "Just the basics (recommended): note your first goal and update `AGENTS.md`; everything else can wait." / "The full tour: go through every step, leaving out whatever you don't want yet." | R/lean-path L21-28 | A/M: in a quiet install step 0 is skipped, and the basics path skips the step that holds the quiet-install wiring, so the run ends unwired |
| PF5 | "What do you want to get done first in this repo? One sentence." | R/lean-path L39 | C; could say why it asks |
| PF6 | "What should this run cover?" (all ticked): "Move old decision records", "Ask about the project's stage and plans", "Look up your tools on the web", "Suggest skills for this repo", "Check the harness score now", "Set up automatic checks" | S L101-112 | U/A: "automatic checks" hides edits to CI and scripts; "score" is undefined; "web" doesn't say what is sent; "move" moves client files |
| PF7 | described: a failing harness-score secret check stops the run before any write and shows the finding. | S L120-127; R/harness-score L66-83 | M: no stop message |
| PF8 | described: shows the pinned harness-score install command and scores only on a yes; a decline records "leaked-credential checks not run". | R/harness-score L15-20, L80-83 | M/A: doesn't say where it installs; a quiet install has no `harness:score` script |

### Step 0 (Full install only)

| ID | Text | Source | Verdict |
|---|---|---|---|
| E1 | "How much should we change your current AGENTS.md?" Options: "A short section (light)…" / "The whole guide (full)…" | R/entry-modes L202-210 | Mostly C. M: doesn't say "added at the end" or "`WOLVEN.md` is deleted after"; "the Human" should be "your" |
| E2 | described: each clash between a second router or rule and a standing rule is asked one at a time. | R/entry-modes L220-223 | J |
| E3 | described: offers to add `@AGENTS.md` to `CLAUDE.md`. | R/entry-modes L224-226 | U: doesn't say why |
| E4 | described: proposes re-include rules for ignored harness paths ("# Wolven harness: shared skills and rules stay tracked"); on a decline, says `harness:validate` "stays red". | R/entry-modes L227-239, L258, L272-274 | J/A: a tracked `.gitignore` edit; "stays red" is slang |
| E5 | described: lists files in the doc folders and asks, per file, whether to reshape them or move them out. | R/entry-modes L240-248 | A: rewrites or moves client docs; "frontmatter" is jargon |
| E6 | described: shows the diff before every write and waits. | S L70-72 | C |
| E7 | described: one commit offer per phase once validate passes. | S L60-68 | M: no wording, branch, paths, or "not pushed" |

### Step 1: migration

| ID | Text | Source | Verdict |
|---|---|---|---|
| M1 | described: on a number clash, stop and ask. | R/adr-migration L23-27 | J |
| M2 | described: `git mv` to `docs/adrs/adr-NNN-<slug>.md`. | R/adr-migration L28-29 | A: renames client files; the quiet-install target is unspecified |
| M3 | "The caching decision named Memcached, but its status notes Redis replaced it. Should we record Redis as a new decision record and mark Memcached deprecated, or did the decision drop entirely?" | R/adr-migration L54-62 | Good shape; "claim" is jargon |
| M4-M6 | described: options for no successor, split, other statuses. | R/adr-migration L47-49 | J |
| M7 | described: shows every repo hit for the ADR's tokens. | R/adr-migration L64-72 | U |
| M8 | described: for a non-ADR file, "delete it, or keep it where it is with its links rewritten". | R/adr-migration L84-87 | A |
| M9 | described: claim loop: repoint, reword or record a new decision. | R/adr-migration L88-97 | J |
| M10 | described: meaning check: repoint, reword or leave. | R/adr-migration L98-108 | J |
| M11-12 | described: points at the repo's own test and lint; shows the whole diff before commit. | R/adr-migration L111-117 | C |

### Layout (existing `layout.md`)

| ID | Text | Source | Verdict |
|---|---|---|---|
| L1 | described: proposes the linked or home layout and asks to confirm the "harness home". | R/layout L26-28 | J: config values in text people read |
| L2 | described: asks for the code repository's path. | R/layout L34-35 | J |
| L3 | described: asks before `git init` and shows the command. | R/layout L36-38 | C |
| L4 | described: when a `.gitignore` line can't reach the code repo, "say so". | R/layout L39-42 | U |
| L5 | described: diff of `.wolven-harness.json`. | R/layout L43-44 | C |
| L6 | described: asks which harness home when several fit. | R/layout L55-57 | J |
| L7 | described: diff of the symlinks. | R/layout L63-75 | M: tracked or not |
| L8 | described: "name the files that differ, and ask before anything is deleted". | R/layout L86-88 | A |
| L9 | described: when a layout needs a move, "say so and stop". | R/layout L92-95 | M: no next step |

### Quiet-install section (spec only, not yet in `layout.md`)

| ID | Text | Source | Verdict |
|---|---|---|---|
| Q1 | "Keep the quiet install, or switch to a full install?" Picking the switch is the approval: the diff is shown, then applied, then setup reruns. | SPEC R5.5 | A: no second confirmation and the diff deletes things; M: doesn't list what lands at the root or say "only for repos you own" |
| Q2 | described: "the switch stops and names that path". | SPEC R5.5 | M: should say nothing changed and what to do |
| Q3 | "Which harness folders should git track?" Rules, hooks and ADRs on; notes, specs and PRDs, deferrals off. | SPEC R5.2 | J/M |
| Q4 | "Hide the harness links from git for everyone, or only on your machine?" "Everyone (`.gitignore`)" / "Only me (`.git/info/exclude`)" | SPEC R5.3 | J: "links"; M: "Everyone" edits a tracked file; asked before the links are shown |
| Q5 | "Create the harness links for <runtime names>?" One diff with every link, ignore line and `.dockerignore` line. | SPEC R5.3 | M: doesn't mention the `.dockerignore` edit or the Claude Code hooks |
| Q6 | "Add the harness block to <file names>?" Yes / No. Creates a block-only `AGENTS.md` when needed. | SPEC R5.4 | A/M: creates a tracked file in the client repo |
| Q7 | Block text: the repo uses the Wolven harness; instructions in `.wolven-harness/AGENTS.md`; docs under `.wolven-harness/docs/`. | SPEC R5.4 | **Defect:** `.wolven-harness/AGENTS.md` is not re-included (R4.2), so teammates' agents get a pointer to a missing file |
| Q8 | Statement: packaging that ignores `.gitignore` picks up the whole home. | SPEC R5.6 | A: no action, and doesn't mention the `.dockerignore` line already offered |
| Q9 | Statement: a worktree gets only tracked folders; writes to an untracked one are lost. | SPEC R5.6 | A/J |
| Q10 | "Commit the harness setup now?" with the path list; not asked without a remote. | SPEC R5.6 | M: branch, push, message; the no-remote rule is unexplained; clashes with E7 |
| Q11 | Step 0 is skipped silently. | SPEC R5.7 | M |

### Convention, discovery, research

| ID | Text | Source | Verdict |
|---|---|---|---|
| C1 | "Use `<regex>` for `<codeRepo>` commits" / "Use Conventional Commits" / "Use another shape" | R/convention L37-45 | J: a quiet install has no `codeRepo`; "shape"; M: doesn't say it governs only the agent's commits |
| C2 | described: diff of `.wolven-harness.json`. | R/convention L51-53 | C |
| D1 | Lifecycle: "prototype, MVP, production, or maintenance". | R/discovery L23 | C; M: why it asks |
| D2 | "Decisions not yet visible in code". | R/discovery L24-25 | U/J |
| R1 | described: asks before web lookups, capped at 5 fetches. | S L182-186; R/discovery L50-55 | M: what leaves the machine |
| R2 | described: offers `research` for depth; notes "repo-only". | R/discovery L57-62 | J |

### Suggestions, stubs, score

| ID | Text | Source | Verdict |
|---|---|---|---|
| S1 | described: "new or unexplored" vs "well understood" decides whether steps 4-5 run. | R/discovery L66-73 | J |
| S2 | described: suggests 2-4 "architectural skills" with evidence. | R/discovery L75-86 | J/M: doesn't say what a stub is |
| T1 | described: on a name clash, ask for another name or skip. | R/stub-template L12-13 | C |
| T2 | Stub text: "Ask-only: an explicit ask for `<name>` is the only run. `disable-model-invocation: true` stays until the Human removes it…" | R/stub-template L41-45 | J; "the Human" in a file the user reads |
| T3 | "define each stub, then remove the marker." | R/stub-template L127-143 | J |
| H1 | described: records the "before" level L0-L4. | R/harness-score L22 | J |
| H2 | "There is no root README. Should creating one stay on the to-do list, or does this repo not need one?" Options: "Keep as gaps" / "Drop them" / "Split". | R/harness-score L31-59 | A/J: grades the client's README and tests |
| H3 | described: `.harness-score.json` diff, then re-score. | R/harness-score L87-90 | M: location and whether tracked |

### Validate wiring and closing

| ID | Text | Source | Verdict |
|---|---|---|---|
| V1 | "How should we check the harness?" "On every pull request (a CI job)" / "With your existing checks" / "Only when I run it" | R/validate-wiring L21-32 | A: the first two edit the client's CI or test script; broken in a quiet install, which has no `harness:validate` script |
| X1 | Closing message: "What's installed", "Left for later", "Next steps". | S L230-237 | M: tracked files changed, commits made, undo |
| X2 | "Should we start with a spec for "<goal>"?" / "What should we build first?" | S L239-242 | J; M: a yes starts a new branch |
| X3 | described: stub or gap work now is separate work, so it stops. | S L245-247 | U |

### Session note

| ID | Text | Source | Verdict |
|---|---|---|---|
| N1 | Path `docs/notes/harness-init-<date>/…`; phase commits "carry" the note. | S L41-46 | A/M: notes are untracked by default in a quiet install |
| N2 | Fixed headings and strings, including "Next steps for the Human". | R/session-note-template L31-89 | M: no quiet-install section; "the Human" |
| N3 | Names ADRs by bare number. | R/session-note-template L100-107 | C |

## Proposed rewrites

- **PF1:** "Quiet install: the harness is in `.wolven-harness/`, hidden from git. No tracked files changed. Next: `wolven-harness validate` (checks the install), then ask your agent to run harness-init. To remove: delete `.wolven-harness/` and `.wolven-harness.json`."
- **PF2:** "Picking up the harness-init run from <date> (<path>). Nothing will be asked twice."
- **PF4 (quiet install):** "Just the basics: hide or share the harness, connect it to your tools, done." Run the quiet-install section on both paths.
- **PF6:** "Set up automatic checks (may edit CI or package.json)"; "Look up your tools' public docs (sends tool names only)"; "Check how complete the setup is (harness score)".
- **PF7:** "Stopped before writing anything: harness-score found what looks like a committed secret in <file:line>. Rotate it (tell the repo owner if it isn't yours), then run harness-init again."
- **PF8:** "harness-score isn't installed. Install it globally with `<cmd>`? Nothing is added to this repo."
- **E1:** add "added at the end of AGENTS.md; WOLVEN.md is deleted after".
- **E3:** "Add `@AGENTS.md` to CLAUDE.md so Claude Code reads the same instructions?"
- **E4:** "Your .gitignore hides <paths>, so teammates won't get the harness. Add lines that share just those paths (a tracked .gitignore edit)?" On a decline: "validate will keep failing until these are shared."
- **E5:** "<file> sits in a folder the harness checks. Leave it and move the harness's checks off it, reformat it, or move it elsewhere?" Lead with the non-destructive option.
- **E7 / Q10:** "Commit these N files to <branch>? Not pushed. <list>." One offer only in a quiet install.
- **M2:** state the target path; exclude migration from the quiet install or ask about it explicitly.
- **M3 / M9:** "claim" becomes "a reference to decision NNN in <file>".
- **M8:** "keep it where it is (links fixed)" first, "delete" second.
- **L1 / L2 / L6:** never show "harness home", "linked" or "code repository"; say "the folder that holds the harness" and "the project's code folder".
- **L9:** "Can't finish without moving <path>. Nothing changed. Move it yourself, or keep the current layout."
- **Q1:** "Keep the quiet install, or switch to a full install? (Only for repos you own.)" Full-install description: "puts `.agents/`, `docs/` and a harness `AGENTS.md` section at the root, all tracked. You'll see the diff and approve it before anything moves." Keep a confirmation on the diff.
- **Q2:** "Can't switch: `docs/adrs/` already exists at the root. Nothing changed. Rename or move it, then ask again."
- **Q3:** gloss every item: "Rules — instructions your agent always follows", "Hooks — scripts Claude Code runs automatically", "Decision records (ADRs)", "Notes", "Requirements and specs", "Postponed-work notes". Footer: "Ticked folders get committed and shared. Unticked ones stay on this machine only."
- **Q4:** ask after Q5's diff: "These symlinks let Claude Code and Cursor find the harness. Hide them in `.gitignore` (a tracked file your client will see) or only on this machine (`.git/info/exclude`)?"
- **Q5:** name `.dockerignore` and the Claude Code hooks in the question.
- **Q6:** "Add 3 lines to AGENTS.md and CLAUDE.md so Codex and Claude find the harness? (Tracked edits. AGENTS.md is created if missing.)"
- **Q7:** track `.wolven-harness/AGENTS.md`, or word the block as "This repo may contain a local `.wolven-harness/` folder; if present, read `.wolven-harness/AGENTS.md`."
- **Q8:** "If you build Docker images, zip, or rsync this repo, exclude `.wolven-harness/` there (the `.dockerignore` line above does this for Docker)."
- **Q9:** "Unticked folders don't exist in worktrees. Notes written there are deleted with the worktree."
- **Q11:** "Skipping the AGENTS.md step: in a quiet install the harness has its own."
- **C1:** "Use `<regex>` (like `<real subject>`) for commits the agent makes in this repo?"
- **D2:** "Anything your team has decided that the code doesn't show yet?"
- **R1:** "Look up <tools>' public docs (up to 5 pages)? Only the tool names leave this machine."
- **S2:** "Want starter skills (empty templates you fill in; they never run on their own) for <tools>?"
- **T2 / T3 / N2:** "the Human" becomes "you"; "remove the `stub` marker when it's filled in".
- **H2:** in a client repo, frame these as "the harness can't check X"; say where `.harness-score.json` goes and whether it is tracked.
- **V1:** in a quiet install, recommend "Only when I run it"; mark the others "edits your client's CI" and "edits package.json".
- **X1:** add "Tracked files changed:", "Commits:" and "To undo:".
- **X2:** "Want to write a short spec for '<goal>' next? (It starts on a new branch.)"
- **N1:** in a quiet install, keep the note untracked and say so, or put it under ADRs.

## Top 5 problems

1. **A quiet install breaks the run's own structure.** "Just the basics" promises an `AGENTS.md` update, but step 0 is skipped and the quiet-install wiring sits in a step the basics path skips, so the run ends unwired. Phase commits "carry" an untracked note. Validate wiring chains a `harness:validate` script that doesn't exist.
2. **Later steps edit the client's tracked files without warning:** CI and the test script (V1), `.harness-score.json` (H3), doc reshaping and migration (E5, M2, M8), `.gitignore` (E4, Q4), a new `AGENTS.md` (Q6), a new branch (X2). Every question needs a "Tracked changes: …" line, and a quiet install should gate or drop V1, H, M and E5.
3. **Commit count is unclear:** up to four commit offers, with no branch named, no "not pushed", and no single path list. A quiet install should make one offer.
4. **The block (Q7) points teammates at a file they don't have,** because `.wolven-harness/AGENTS.md` is ignored.
5. **Vocabulary arrives before it is explained.** Add a four-line "what the harness is" before PF4 and a gloss on every option; replace "the Human" in every file the user reads.

## Glossary

| Term | Action |
|---|---|
| harness | Define once: "the instructions, rules and doc folders your agent follows" |
| quiet / full install | Define once (PF1, Q1) |
| skills | Define: "instruction files the agent loads on demand" |
| rules, standing rules | Define: "instructions the agent always follows" |
| hooks | Define: "scripts Claude Code runs automatically" |
| ADR | "decision record (ADR)" |
| PRD, spec | "requirements / spec", glossed in X2 |
| deferral | "postponed-work note" |
| claim | "a reference to decision NNN" |
| profile, legacy ADR | "harness-format", "older decision record" |
| frontmatter | Define once: "the header block at the top of the file" |
| slug | Hide |
| links, entry points | "symlinks", with one example |
| block | "3 lines added to AGENTS.md" |
| wired / unwired | "set up to read the harness" |
| harness home, linked, home, codeRepo | Never show |
| router, entry file, WOLVEN.md | "the harness guide" |
| re-include rules | "lines that un-hide these paths" |
| writing profile | "the harness's doc format" |
| QMD | Leave, glossed as "local doc search" |
| stub, marker, ask-only | "template skill", "the `stub` tag", "runs only when you ask" |
| score, level, dimension, gap, drop | Define "score" once; "area", "to-do", "turn off this check" |
| lifecycle stage | Leave, plus why |
| decided tools | "tools the repo already uses" |
| Conventional Commits | Leave, plus an example |
| worktree | Leave |
| drift | "edited since install" |
| the Human | "you" |

## Voice and tone

Keep the plain, recommendation-first, one-question-at-a-time voice. Every
question should also say what changes in tracked files and whether it can be
undone. Drop the internal words: "Human", "red", "drop", "gaps", "home".

## Where the persona can't tell what happens to the client's repo

- PF4: what "Just the basics" writes in a quiet install.
- PF6, V1: edits to the CI workflow or test script.
- PF8: whether harness-score lands in the client's `package.json`.
- E4, Q4: a tracked `.gitignore` edit.
- E3, Q6: a tracked `CLAUDE.md` edit, or a new tracked `AGENTS.md`.
- Q7: what teammates' agents see when the pointed-to file is missing.
- Q5: a tracked `.dockerignore` edit, and Claude Code hooks installed.
- E5, M2, M8, L8: client files reformatted, moved or deleted.
- Q1: files deleted from `.wolven-harness/` and new tracked root folders, with no second yes.
- Q3: that "track" means committed and visible to the client.
- E7, Q10, N1: how many commits, on which branch, whether pushed, whether the note is included.
- H3: where `.harness-score.json` lands, and whether it is tracked.
- C1: which commits the convention governs.
- X2: a new branch in the client repo.
- Everywhere: no undo or uninstall line; the uninstall guide (R9.1) lives only on the site.

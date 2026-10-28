---
type: note
title: Jury verdict journeys
description: The paths a person takes from a global install of the harness through each scenario, as the second Jury's verdict would make them, with the code backstop for a by-hand git init kept for now.
status: draft
---

# Jury verdict journeys

## Question

What does a person meet, from `npm i -g @wolven-tech/harness` onwards, once
the second Jury's verdict is built? The map forks into six scenarios so the
Human can judge the verdict, and the code backstop in particular, before
deciding whether to defer it.

## The verdict the map draws

Advisory, from a five-seat Jury with a pragmatic-guard pass before and after.

- **Git exposure.** `harness-init` recommends a sibling harness folder before
  it asks about `git init`. It refuses `git init` in a folder that holds a
  top-level entry that is neither a harness path nor a folder with `.git`,
  and redirects to the linked layout, with a plain sibling folder as the
  fallback. An allowlist `.gitignore` and a warn-only count were rejected.
- **Code backstop (kept for now).** One top-level read of the git root
  reports entries that are not ignored, not repos and not harness paths. It
  runs only when the config records `codeRepo`. The panel adopted it 5–0;
  the guard vetoed it (need 4, complexity 5). Where it fires, a `doctor`
  warning or a `validate` error, is still open.
- **Several repos.** `codeRepo` stays one path. A list, an absolute path and
  an empty value each get their own message.
- **No git.** `validate` stays git-only, with a message that says to run
  `git init` only in a folder that holds nothing but harness files.
  `harness-init` records `layout` and `codeRepo` before the git question.
- **UX fixes.** A missing or non-directory `codeRepo` becomes a `doctor`
  finding instead of a crash; `doctor` stops telling the Human to move a
  repo's own `.agents`; a kept `.claude/skills` is named as unwired, with the
  manual step.

## Mood scale

The same −2 to +2 scale as `repo-structure-journeys`. The values are the
author's judgement of the verdict as designed, not measured.

| Value | Meaning |
|-------|---------|
| +2 | Delighted: first value with no effort |
| +1 | Relieved: the step went as hoped |
| 0 | Neutral or unsure |
| −1 | Doubtful: a likely friction |
| −2 | Blocked or harmed |

## Assumptions

- Every step describes the verdict as built. Today only the S02 sibling
  shape and the S22 linked layout behave as drawn.
- The refusal and the sibling recommendation live in skill text, so the
  agent applies them; no fixture has driven the skill yet.
- That `hybris/` and `app/` stay usable from the agent through the linked
  layout is unverified.

## Unresolved

- Whether to keep the code backstop, and whether it is a `doctor` warning or
  a `validate` error.
- Proposed deferrals, none written: `code-repo-list`,
  `validate-without-git`, `git-exposure-backstop`, `validate-nested-root`.

## Files

- `jury-verdict-journeys-map.json` is the source.
- `jury-verdict-journeys-map.html` is built from it.

---
type: note
title: Quiet install desktop proof
description: The Human-observed run of a fixture made by the built setup and harness-init, in Claude Code worktree sessions, with the results, what changed during the run, and what it did not cover.
status: stable
---

# Quiet install desktop proof

Run on 2026-11-03 with Claude Code 2.1.312, and observed by the Human. It
covers R10.1 and R10.2 of `docs/specs/quiet-install/quiet-install-spec.md`.

The Human accepted this proof on 2026-11-03, including the limits below.

## Fixture

A throwaway repository, `quiet-install-proof-app`, outside this repository:

- A seeded git repository with a local bare `origin`, so `harness-init` makes
  its commit offer.
- A fake `.env`, ignored by git, for the secret guard.
- `setup --runtimes claude` from this branch's build.
- Three markers in the home: a rule, a skill and a line in `AGENTS.md`.

The Human ran `harness-init` on the main folder: Quick setup, quiet install,
and tracked rules, hooks, decision records, and requirements and specs.

## Checks

| Check | Observed | Result |
| --- | --- | --- |
| `AGENTS.md` loads in a worktree | Marker answered without reading a file, from the copied `CLAUDE.local.md` | pass |
| Rules load in a worktree | Marker answered without reading a file; six rules copied as plain files | pass |
| Skills load in a worktree | Marker skill invoked; it loaded through the main checkout's `.claude/skills/` | pass |
| `.claude/settings.local.json` in the worktree | Present, with both hooks | pass |
| `.wolven-harness/` in the worktree | Only `AGENTS.md`, `.gitignore`, hooks, rules and the tracked docs | pass |
| Decision record write to `.wolven-harness/docs/adrs/` | Written, with no block and no prompt | pass |
| `git status` in the worktree | Only the new record, untracked, on the worktree branch | pass |
| `git status` at the root | Empty | pass |
| Secret guard | The agent first asked, on the rule alone. After the go-ahead, one `Read` of `.env` was blocked by `secret-path-guard` before it ran | pass |
| Parity warning after deleting `CLAUDE.local.md` | The new session received the warning at startup, with "Nothing changed." and its next step | pass, with the limits below |

`node dist/cli.js validate` passed at the root and in the worktree. A second
session forked into a brand-new worktree, `heuristic-mendeleev-778b27`, which
also held its copied `CLAUDE.local.md`. That covers the first worktree being a
folder the app reused.

## Limits of this proof

- **The parity check ran in a terminal, not the desktop app.** The app forked
  a new worktree instead of opening the one with the file deleted, so the
  session was `claude` started in that folder.
- **The parity warning reaches the agent, not the person.** A successful
  `SessionStart` hook's output goes to the session's context. The Human saw it
  only by asking the agent. The hook works as R7.1 states; whether a person
  notices it depends on the agent passing it on.
- **The fixture needed one correction.** `harness-init` committed `.qmd`
  because of the false failure below. The maintainer removed `!.qmd`, stopped
  tracking the symlink and committed that before the worktree checks.
- **Some text had no live run.** The session had an older skill for these, so
  only their text checks cover them: the safety audit's final wording, the
  keep-the-defaults choice, the `.qmd` line, and the rule against re-including
  an entry point. The worktree stop also had no live run.
- **Only Claude Code was wired.** Cursor and the other runtimes were not at
  hand, so `U-cursor-ignored-rules` and `U-runtimes-ignored-load` stay open.

## What changed during the run

The Human directed each of these, and each landed before the proof closed:

- The leaked-credential check no longer ran unasked at the start. It is an
  opt-in safety audit, offered last, that opens with the promise that the
  harness never reads secrets. A finding no longer stops the run.
- `harness-init` stops before its first question in a worktree with no
  harness. The desktop app had opened the first attempt in a worktree, where
  the agent had to improvise.
- The versioning question offers the defaults as one choice first, because
  Claude Code's question tool can't pre-tick items.
- The wiring diff explains `.qmd`, and an entry point is never re-included to
  clear a failed check.

## The false `.qmd` failure

The session reported `harness-ignored` on `.qmd` and added `!.qmd`. It had run
the main checkout's older build, because no `wolven-harness` was on PATH. This
branch's build passes with `.qmd` ignored, so this came from the proof setup.

## Follow-ups

- `secret-path-guard` cites `.agents/rules/secrets.md`, which is the wrong path
  in a quiet install, and says "ask the Human".
- With no `wolven-harness` on PATH, the skill has nothing to run for validate,
  and agents go looking. It should ask for the install.
- A `setup` rerun treats its own `harness-init` symlink as an occupied path, so
  it prints the wrong next step.
- The parity warning says "symlink", but a worktree holds a plain copy.
- The parity warning needs a way to reach the person.

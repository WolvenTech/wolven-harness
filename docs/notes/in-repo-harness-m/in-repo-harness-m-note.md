---
type: note
title: In-repo harness install
description: The install path, from a global install onwards, when the harness lives in app/.wolven-harness/, and the proof runs that moved it from a nested git repo to a plain folder with re-included paths.
status: draft
---

# In-repo harness install

## Question

What does a person meet, from `npm i -g @wolven-tech/harness` to a first
session, when the harness lives in `app/.wolven-harness/` as its own git
repo? This is option M from the fourth Jury, advisory and not built.

## Shape

The current shape, after the fourth run below:

- `app/.wolven-harness/` is a plain folder with no git of its own. The
  harness is local-first: it never pushes anywhere.
- `app/.wolven-harness/.gitignore` ignores everything in the folder and
  re-includes itself plus the paths the user picks: rules, hooks and ADRs
  by default, other docs opt-in. `setup` writes it first. It is versioned,
  so every clone inherits it, and the user can read and edit it. The
  re-included paths are versioned by the client repo's own git.
- The entry points in `app/` are ignored: `CLAUDE.local.md`,
  `.claude/skills`, `.claude/rules/`, `.claude/settings.local.json`,
  `.worktreeinclude`, `.wolven-harness.json`. `harness-init` creates them
  and their ignore lines in one diff. The lines live in `.gitignore` or
  `.git/info/exclude`, as the user picks.
- "Versioned" means the user's own history and PR review. Teammates'
  agents use the rules and hooks only if the user also commits the entry
  points, a separate opt-in.
- It is the `linked` layout with `harnessHome: ".wolven-harness"`.

The first three runs used option M, a nested git repo at
`app/.wolven-harness/`. A client repo cannot track files inside a nested
repo, so M could not version any harness path.

## Proof run

A throwaway fixture on 2026-10-28, Claude Code 2.1.312, desktop app. `app/`
is a git repo. `app/.wolven-harness/` is its own git repo, made with
`wolven-harness setup` 0.3.2. The harness carries an `AGENTS.md` marker, a
rule marker and a marker skill. `app/` holds `.agents`, `.claude/skills` and
`.claude/rules` links, a `CLAUDE.local.md` with an absolute `@` import, and a
`.worktreeinclude` listing `CLAUDE.local.md`. All of these are in
`.git/info/exclude`.

| Check | `app/` opened | Parent folder opened | Worktree of `app/` |
| --- | --- | --- | --- |
| Skills, incl. the marker skill | loaded | not loaded | loaded (fallback to the main checkout) |
| `AGENTS.md` via the `CLAUDE.local.md` import | loaded, no prompt | loaded only after moving into `app/` | not loaded: the copied file kept the line, the import did not expand |
| Rule via the `.claude/rules` link | loaded | loaded only after moving into `app/` | not loaded: the worktree has no `.claude/` |
| `CLAUDE.local.md` in the folder | yes | no | yes: copied by `.worktreeinclude`, though `.worktreeinclude` is untracked and excluded |
| ADR write to `.wolven-harness/docs/adrs/` | written | written | blocked by the desktop app's worktree guard: the path is in the base checkout |
| `git status` in `app/` after the run | empty | empty | empty |

Also found:

- `setup` refuses to run in a subfolder of a git repo. It ran only after
  `git init` inside `.wolven-harness/`.
- With `app/` open, the ADR landed in `.wolven-harness/docs/` because `app/`
  has no `docs/`. A client repo with its own `docs/` would likely get the
  write instead.
- Opening the folder above `app/` gives no worktree and no harness. This is
  the same for every layout.

So M works when `app/` itself is opened. A desktop worktree session gets the
skills but not the instructions or rules, and it cannot write harness docs.

## Same run with a sibling harness

The same fixture shape, with the harness in `../harness/` beside `app/`
instead of inside it: the sibling layout the third Jury recommended.

| Check | Worktree of `app/`, harness in `.wolven-harness/` | Worktree of `app/`, harness in `../harness/` |
| --- | --- | --- |
| Skills | loaded | loaded |
| `AGENTS.md` via the import | not loaded | not loaded |
| Rules via `.claude/rules` | not loaded | not loaded |
| ADR write to the harness | blocked by the worktree guard | written, no block, no prompt |
| `git status` in the client | empty | empty |

The sibling wins on writes from a worktree, because the desktop app's worktree
guard blocks only paths inside the base checkout.

## Second run: absolute symlinks

Both fixtures switched to absolute symlinks. `CLAUDE.local.md` became a link
to the harness `AGENTS.md` instead of an `@` import, and `.worktreeinclude`
listed `CLAUDE.local.md`, `.claude/rules` and `.claude/skills`.

| Check | Worktree, harness in `.wolven-harness/` | Worktree, harness in `../harness/` |
| --- | --- | --- |
| Skills | loaded | loaded |
| `AGENTS.md` | loaded | loaded |
| Rules | not loaded | not loaded |
| ADR write to the harness | blocked by the worktree guard | written, no block, no prompt |
| `CLAUDE.local.md` in the worktree | copied as a plain file | not copied |
| `.claude/` in the worktree | missing | missing |

- A `CLAUDE.local.md` that is a link carries the instructions into a
  worktree. An `@` import did not.
- In the sibling run the file was not copied. The marker still loaded, most
  likely from `app/CLAUDE.local.md`, which sits above the worktree folder.
  Why the copy was skipped is not verified.
- `.worktreeinclude` did not copy the `.claude/rules` and `.claude/skills`
  folder links. Skills still arrive through the main checkout fallback.
  Rules do not.

What is left open for both layouts: rules in a worktree.

## Third run: docs in the client repo, one link per rule

The M fixture changed in two ways:

- `docs/` moved out of `.wolven-harness/` into `app/docs/` and was
  committed in `app/`. These are the docs the user chooses to version.
- `app/.claude/rules/` became a real folder holding one absolute link per
  harness rule. `.worktreeinclude` listed `.claude/rules/` and
  `.claude/rules/*.md`.

| Check | Worktree of `app/` |
| --- | --- |
| Skills | loaded (main checkout fallback, unchanged) |
| `AGENTS.md` | loaded from the copied `CLAUDE.local.md`, before any file read |
| Rules | loaded from `.claude/rules/m-proof-rule.md`, before any file read |
| `.claude/rules/` in the worktree | six rule files, copied as plain files |
| ADR write to `docs/adrs/` | written with the Write tool, no block, no prompt |
| `git status` in the worktree | the new ADR as untracked, on the worktree branch |
| `git status` in `app/` | empty |

With versioned docs and one link per rule, a worktree session gets
skills, instructions, rules and harness doc writes. The rule copies are
taken when the worktree is created, so a rule changed later reaches only
new worktrees. An unversioned `docs/` would not reach a worktree, so the
write result holds only when the user versions the docs.

## Fourth run: a plain folder with re-included paths

A new fixture, with no git inside the harness:

- `app/.wolven-harness/` is a plain folder.
- `app/.git/info/exclude` ignores it with `/.wolven-harness/*`, then
  re-includes `.agents/rules/`, `.agents/hooks/`, `docs/adrs/` and
  `docs/notes/`.
- Only those paths are committed in `app/`.
- The skills, `AGENTS.md`, the qmd index and the other docs stay local.
- The entry points are ignored:
  - `CLAUDE.local.md`, a link to `AGENTS.md`;
  - `.claude/skills`;
  - `.claude/rules/`, with one link per rule.
- The secret guard hook is wired in `.claude/settings.local.json`.

| Check | Worktree of `app/` |
| --- | --- |
| Skills, incl. the marker skill | loaded (main checkout fallback) |
| `AGENTS.md` | loaded from the copied `CLAUDE.local.md` |
| Rules | loaded from `.claude/rules/`, copied as plain files |
| `.wolven-harness/` in the worktree | only `.agents/{rules,hooks}` and `docs/`, from the checkout |
| `.claude/settings.local.json` in the worktree | copied, though `.worktreeinclude` did not list it |
| ADR write to `.wolven-harness/docs/adrs/` | written with the Write tool, no block, no prompt |
| `git status` in the worktree | the new ADR as untracked, ready to commit on the branch |
| `git status` in `app/` | empty |
| Secret guard hook | first refused by the agent on the secrets rule alone; after an explicit go-ahead, the `Read` of `app/.env` was blocked by `secret-path-guard` |

With no git of its own, a harness whose versioned paths are re-included
gives a worktree session the same skills, instructions, rules, hooks and
doc writes as a fully tracked install. The client repo gains only the
re-included harness paths.

## Pre-mortem

A Fool pre-mortem on the fourth-run shape, with the Human agreeing all five
failures hold. Each line names the failure, then its mitigation.

1. **A client ignore rule swallows a re-include.** A probe showed that
   `docs/` in the client's root `.gitignore` beat a re-include written in
   `.git/info/exclude`, and the ADR was ignored. Mitigation: the nested
   `.wolven-harness/.gitignore`. In a second probe its `!/docs/adrs/**`
   lines held against `docs/` and `*.md` in the root `.gitignore`, since a
   deeper ignore file takes precedence. Only a root rule that ignores
   `.wolven-harness/` itself still wins, and `doctor` must report it.
2. **A fresh clone exposes the whole harness.** Without the ignore lines,
   skills and `AGENTS.md` showed as untracked, one `git add -A` away from
   the client repo. Mitigation: the same nested `.gitignore`, written first
   by `setup` and inherited by every clone once committed.
3. **Versioned for nobody.** The versioned rules and hooks reach teammates
   and CI, but no teammate's agent reads them while the entry points are
   local. Mitigation: `harness-init` says plainly what versioning gives,
   and offers committing the entry points as a separate opt-in.
4. **Docs paths and ADR claims collide with the client's.** Skills write
   `docs/adrs/` from the repo root, where a client may keep its own ADRs,
   and the claims rule could fail on the client's own `ADR-NNN` mentions.
   Mitigation, required before shipping: change the docs paths (a template
   sweep or a link), and scope claims to harness files.
5. **Parity is lost silently.** It rests on `.worktreeinclude` copying file
   links, which is undocumented and was skipped once in the sibling run.
   Mitigation: a `SessionStart` hook in `.claude/settings.local.json`
   (read from the main checkout, which is documented) that warns when a
   worktree has no `CLAUDE.local.md` or `.claude/rules/`.

## Map

`in-repo-harness-m-map.json` is the source; `in-repo-harness-m-map.html` is
built from it.

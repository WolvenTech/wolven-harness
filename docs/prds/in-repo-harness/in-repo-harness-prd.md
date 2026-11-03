---
type: prd
title: In-repo harness install
description: Make the linked layout with its harness home at .wolven-harness/ the default at a repository root, so a client repo versions only the harness paths the person picks while every session, worktrees included, gets the whole harness.
status: stable
---

# In-repo harness install

## Problem

A consultant working on a client repo they don't own has no harness layout
that keeps the client's git down to the harness paths they choose while
every session, worktree sessions included, still gets the skills,
instructions, rules, hooks and doc writes.

- **Who:** a consultant who works on a client repo they don't own, with an
  agent runtime, often in Claude Code desktop worktree sessions.
- **Pain:** every layout today trades one half for the other. A `setup` at
  the repo root tracks the whole harness in the client's git. `setup`
  refuses a subfolder of a repo. A harness home beside the repo or inside
  it as its own git repo loses `AGENTS.md` and the rules in a desktop
  worktree session, and the nested repo blocks harness doc writes from a
  worktree.
- **Why now:** a live client engagement needs this layout, and the proof
  runs on 2026-10-28 found a shape that gives both halves.
- **Evidence:**
  - `docs/notes/in-repo-harness-m/in-repo-harness-m-note.md`: four desktop
    proof runs and a five-failure pre-mortem the Human agreed holds.
  - `docs/notes/gitignored-harness-access/gitignored-harness-access-note.md`:
    Claude Code and Cursor load skills and instructions through gitignored
    links; their search tools skip ignored files; qmd must root collections
    inside the harness home.

**In-repo install**, used from here on, is the `linked` layout with
`harnessHome: ".wolven-harness"`: a plain folder at
`<repo>/.wolven-harness/` with no git of its own, holding the harness, and
ignored entry points in the repo root that point into it. It reuses the
`linked` layout and harness home of
[ADR-007](../../adrs/adr-007-in-repo-install-contract.md); it does
not add a layout value.

## Goals

- **G1 Small footprint.** The client's git sees only the harness paths the
  person picks — success signal: on a fresh client repo, after `setup` and
  `harness-init` with the defaults, `git status --porcelain` lists only
  `.wolven-harness/.gitignore` and the ticked paths under
  `.wolven-harness/`, plus the root `.gitignore` when the person put the
  entry-point ignore lines there.
- **G2 Worktree parity in Claude Code.** A desktop worktree session gets
  what a session in the main checkout gets — success signal: the fourth
  proof run's checks repeat on a fixture made by the shipped `setup` and
  `harness-init`: skills, `AGENTS.md`, rules and the secret guard hook load,
  and an ADR written from the worktree lands on its branch with no block or
  prompt.
- **G3 Every runtime wired.** Each registry runtime selected at setup is
  wired through ignored entry points from its documented paths — success
  signal: `doctor` reports no wiring error for any selected runtime id, and
  names any runtime it could not wire.
- **G4 No collision with the client's docs.** Harness docs and claims stay
  apart from the client's own — success signal: in a client repo with its
  own `docs/adrs/` and its own numbered ADR mentions, harness skills write
  under `.wolven-harness/docs/` and `validate` passes without reading the
  client's mentions as claims.
- **G5 Default.** The in-repo install is what a person gets at a repo root
  without asking for it — success signal: `setup` at a repo root with no
  flag and no `.wolven-harness.json` writes `.wolven-harness/` and a
  `.wolven-harness.json` with `layout: "linked"` and
  `harnessHome: ".wolven-harness"`.
- **G6 Safe ignores.** The harness never leaks into the client's git by
  accident — success signal: a fresh clone shows no untracked harness file,
  and `doctor` reports a root ignore rule that ignores `.wolven-harness/`
  itself.

**Non-goals**

- A recorded proof run for each of the eight runtimes other than Claude
  Code. Their wiring follows each runtime's documentation.
- An `uninstall` command, or a migration from a fully tracked install. The
  one other consumer moves by a manual guide.
- Committing the entry points for the person. It stays a separate opt-in
  they make.
- Any change to setup outside a repository.

## User stories

### US-1: Get the in-repo install by default

**As a** consultant on a client repo,
**I want** `setup` at the repo root to put the harness in
`.wolven-harness/` without being asked,
**so that** nothing outside that folder changes before I choose it.

Traces to goal: G5, G1

#### AC-1.1: Setup at a repo root

**Given** a client repo with no `.wolven-harness.json`
**When** the person runs `wolven-harness setup` at its root
**Then** setup writes `.wolven-harness/.gitignore` first, then the harness
inside `.wolven-harness/`, plus a `.wolven-harness.json` recording
`layout: "linked"` and `harnessHome: ".wolven-harness"`. It changes no other
path in the repo and prints one next step: open the agent and run
`harness-init`.

#### AC-1.2: An install that already records its layout

**Given** a repo whose `.wolven-harness.json` records `layout: "home"` or no
layout
**When** the person reruns `setup`
**Then** setup keeps the recorded layout and does not create
`.wolven-harness/`.

#### AC-1.3: A subfolder of a repo

**Given** the person is in a subfolder of a git repo
**When** they run `setup`
**Then** setup still refuses before prompting or writing, as today.

### US-2: Choose which harness paths the client repo versions

**As a** consultant on a client repo,
**I want** to pick which harness paths the client's git may track,
**so that** the client repo gains only what I mean to share.

Traces to goal: G1, G6

#### AC-2.1: Default picks

**Given** a fresh in-repo install
**When** `harness-init` asks which harness paths to version and the person
keeps the defaults
**Then** `.wolven-harness/.gitignore` ignores everything in the folder and
re-includes itself, `.agents/rules/`, `.agents/hooks/` and `docs/adrs/`.
`docs/notes/`, `docs/specs/`, `docs/prds/` and `docs/deferrals/` stay
ignored unless ticked, and the person can edit the file later.

#### AC-2.2: A client ignore rule that would swallow a re-include

**Given** the client's root `.gitignore` ignores `docs/` and `*.md`
**When** the person writes an ADR under `.wolven-harness/docs/adrs/`
**Then** `git status` shows the ADR as untracked, because the nested
`.gitignore` re-includes it.

#### AC-2.3: A client ignore rule that ignores the harness home

**Given** the client's root `.gitignore` ignores `.wolven-harness/` itself
**When** the person runs `doctor`
**Then** `doctor` reports a finding naming that rule, since no nested
re-include can override it.

#### AC-2.4: A fresh clone

**Given** a clone of the client repo after the versioned paths were
committed
**When** the person runs `git status` before any `setup`
**Then** no harness file shows as untracked.

### US-3: Wire the entry points in one reviewable step

**As a** consultant on a client repo,
**I want** every change outside `.wolven-harness/` shown as one diff before
it is applied,
**so that** I know exactly what the harness adds to the client repo.

Traces to goal: G1, G3

#### AC-3.1: Wire and ignore

**Given** a fresh in-repo install with Claude Code selected
**When** `harness-init` shows the wiring diff and the person approves it
**Then** it creates `CLAUDE.local.md` linking to `.wolven-harness/AGENTS.md`,
`.claude/skills` linking to the harness skills, `.claude/rules/` with one
link per harness rule, `.claude/settings.local.json` with the hooks, and
`.worktreeinclude`. Each is ignored by lines in `.gitignore` or
`.git/info/exclude`, as the person picked, and nothing is committed.

#### AC-3.2: The person declines

**Given** a fresh in-repo install
**When** the person declines the wiring diff
**Then** no path outside `.wolven-harness/` changes, and `doctor` reports
the harness as unwired with the step to run `harness-init` again.

#### AC-3.3: Search over the harness

**Given** a wired in-repo install
**When** the agent runs `qmd query -c adrs "<question>"`
**Then** results come from `.wolven-harness/docs/adrs/`, because the qmd
collections are rooted inside the harness home.

### US-4: Get the whole harness in a worktree session

**As a** consultant using Claude Code desktop worktree sessions,
**I want** a worktree session to load the same harness as the main
checkout,
**so that** work on a branch follows the same rules and records its
decisions on that branch.

Traces to goal: G2

#### AC-4.1: A new worktree

**Given** a wired in-repo install in Claude Code
**When** the person starts a desktop worktree session
**Then** the session loads the skills, `AGENTS.md`, the rules and the
secret guard hook, and an ADR written to `.wolven-harness/docs/adrs/` shows
as untracked on the worktree branch, with no block or prompt.

#### AC-4.2: A worktree that lost its entry points

**Given** a worktree that has no `CLAUDE.local.md` or no `.claude/rules/`
**When** a Claude Code session starts in it
**Then** a `SessionStart` hook read from the main checkout warns which
entry point is missing and how to restore it.

### US-5: Keep harness docs and claims apart from the client's

**As a** consultant on a client repo that has its own ADRs,
**I want** harness docs and ADR claims scoped to the harness,
**so that** the harness never writes into the client's docs or fails on the
client's own ADR mentions.

Traces to goal: G4

#### AC-5.1: Harness doc writes

**Given** a wired in-repo install in a client repo with its own
`docs/adrs/`
**When** an agent records a decision with the `adr` skill
**Then** the ADR lands under `.wolven-harness/docs/adrs/`, and the client's
`docs/adrs/` is unchanged.

#### AC-5.2: The client's own ADR mentions

**Given** client source files that mention the client's own numbered ADRs
**When** the person runs `validate`
**Then** `validate` checks claims in harness files only, and the client's
mentions neither pass nor fail as claims.

### US-6: Know what versioning gives teammates

**As a** consultant who versions some harness paths,
**I want** to be told plainly who benefits from them,
**so that** I do not assume teammates' agents follow the rules when they
cannot see them.

Traces to goal: G1

#### AC-6.1: The statement and the opt-in

**Given** the person has ticked paths to version
**When** `harness-init` finishes the wiring
**Then** it says that versioned paths reach history, PR review and CI, and
reach teammates' agents only if the entry points are committed too, and it
offers committing the entry points as a separate choice.

#### AC-6.2: The person keeps the entry points local

**Given** the same statement
**When** the person declines to commit the entry points
**Then** the entry points stay ignored, and `harness-init` commits nothing.

### US-7: Wire every selected runtime

**As a** consultant who uses an agent runtime other than Claude Code,
**I want** the in-repo install to wire my runtime too,
**so that** the default layout does not leave my agent without the harness.

Traces to goal: G3

#### AC-7.1: A runtime with documented paths

**Given** a fresh in-repo install with Cursor selected
**When** `harness-init` wires the entry points
**Then** Cursor's skills and rules entry points are created from its
documented paths, ignored, and `doctor` reports no wiring error for
`cursor`.

#### AC-7.2: A runtime that cannot load from an ignored entry point

**Given** a selected runtime whose documentation gives no way to load the
harness through an ignored entry point
**When** `setup` and `harness-init` run
**Then** the runtime is named as unwired with the manual step, and is not
reported as wired.

### US-8: Move the existing consumer to the in-repo install

**As** the one consumer on a fully tracked install,
**I want** a guide to remove the harness and set it up fresh,
**so that** I end up on the new default without losing my docs.

Traces to goal: G5

#### AC-8.1: Follow the guide

**Given** a repo with a fully tracked install
**When** the consumer follows the manual uninstall guide, then runs `setup`
at the repo root
**Then** the repo has an in-repo install, and their existing harness docs
sit under `.wolven-harness/docs/`.

#### AC-8.2: An edited harness file

**Given** a harness file the consumer edited, such as a skill or a rule
**When** the guide reaches its removal step
**Then** the guide tells them to keep a copy before deleting, and where to
put it back after the fresh setup.

## Scope

**In**

- `setup` at a repo root defaults to the in-repo install, writing
  `.wolven-harness/.gitignore` first.
- `harness-init`: the version checklist, one wiring diff, the choice of
  where the ignore lines live, the statement on what versioning gives, and
  the entry-point commit opt-in.
- Entry points for every registry runtime, from documented paths, all
  ignored.
- Harness docs under `.wolven-harness/docs/`, claims scoped to harness
  files, and qmd collections rooted in the harness home.
- `doctor` findings for a root rule that ignores `.wolven-harness/` and for
  an unwired harness or runtime.
- The `SessionStart` worktree parity warning for Claude Code.
- A manual uninstall guide in the GitHub Pages guide.

**Out**

- Setup outside a repository, which keeps today's behaviour.
- An `uninstall` command and automatic migration.
- Proof runs for runtimes other than Claude Code.
- A configurable docs root such as a `docsDir` key.
- The second Jury's sibling-folder verdict
  (`docs/notes/jury-verdict-journeys/jury-verdict-journeys-note.md`).

## Open questions

- Resolved: making the in-repo install the default at a repo root, and
  moving harness docs under `.wolven-harness/docs/`, change setup and
  `validate` behaviour, so ADR-007 supersedes the previous contract record
  under its change policy. — owner: maintainer.
- Move the docs paths by sweeping the templates or by a link? — owner:
  `code-spec`.
- This PRD fires the `docs-root` deferral's trigger with a fixed path, not a
  config key. Should the deferral be archived or narrowed when this ships?
  — owner: maintainer.
- Worktree parity rests on `.worktreeinclude` copying file links, which is
  undocumented and was skipped once in the sibling run. Is the `SessionStart`
  warning enough, or does it need a repair step? — owner: maintainer.
- Is the second Jury's sibling-folder verdict superseded by this PRD, and
  should its proposed deferrals be dropped? — owner: Human.
- Cursor's rules from a gitignored `.cursor/rules` and its semantic index
  were never probed. — owner: maintainer.

## Handoff

After approval → `code-spec`. This PRD does not authorize implementation.

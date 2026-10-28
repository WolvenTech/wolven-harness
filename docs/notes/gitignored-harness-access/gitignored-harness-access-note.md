---
type: note
title: Gitignored harness access
description: Whether Claude Code, Cursor and qmd load and search harness files that the client repo gitignores, for a harness kept in .wolven-harness/ inside that repo.
status: draft
---

# Gitignored harness access

## Question

A harness kept inside the client repo as `app/.wolven-harness/`, ignored by
the parent with `.wolven-harness/*` and `!.wolven-harness/docs/` re-included,
with runtime paths such as `.claude/skills` as gitignored symlinks into it. Do
Claude Code, Cursor and qmd still load its skills and instructions, and can
the agent find its files by searching?

Answered when each tool's behaviour is known for three acts: loading skills
and instructions, recursive search from the repo root, and indexing.

## Findings

### Layout prerequisite

- The parent repo cannot version files inside a folder that has its own
  `.git`. `git check-ignore` on a file there fails with
  `Pathspec '...' is in submodule '.wolven-harness'`, and `git add -A` adds the
  folder as an embedded repository (mode `160000`) instead of its files
  (`docs/notes/gitignored-harness-access/probe.sh`, first variant, git 2.55.0).
- With the harness git dir kept outside the folder, in
  `.git/wolven-harness.git` with `--work-tree=.wolven-harness`, the parent sees
  plain files and versions only the re-included `docs/`
  (`docs/notes/gitignored-harness-access/probe.sh`).
- From inside `.wolven-harness/`, plain `git rev-parse --show-toplevel`
  resolves to the client repo, so every harness git call needs
  `--git-dir`/`--work-tree` (`docs/notes/gitignored-harness-access/probe.sh`).

### Claude Code

- Skills load from `.claude/skills/<skill-name>/SKILL.md`, and a
  `<skill-name>` entry "can be a symlink to a directory elsewhere on disk"
  ([Claude Code skills](https://code.claude.com/docs/en/skills.md)).
- Observed with Claude Code 2.1.312: with `.claude/` gitignored and
  `.claude/skills` a symlink into the gitignored `.wolven-harness/skills`, the
  session's init event lists `probe-skill`
  (`docs/notes/gitignored-harness-access/probe.sh`).
- Instructions: `CLAUDE.md` "can import additional files using
  `@path/to/import` syntax", and a `CLAUDE.local.md` at the project root "loads
  alongside `CLAUDE.md`"; the docs tell you to add it to `.gitignore`
  ([Claude Code memory](https://code.claude.com/docs/en/memory.md)).
- Observed: a gitignored `CLAUDE.local.md` holding
  `@.wolven-harness/AGENTS.md` made the session answer with the codeword written
  only in the gitignored harness file
  (`docs/notes/gitignored-harness-access/probe.sh`).
- A `CLAUDE.local.md` counts as a `CLAUDE.md` file, so in a repo that relies on
  `AGENTS.md` it stops Claude from reading `AGENTS.md` unless Project
  instructions is set to `claude-md-and-agents-md`
  ([Claude Code memory](https://code.claude.com/docs/en/memory.md)).
- Search: "Grep respects `.gitignore`, so gitignored files are skipped. To
  search a gitignored file, Claude passes its path directly." Glob "doesn't
  respect `.gitignore` by default"
  ([Claude Code tools reference](https://code.claude.com/docs/en/tools-reference.md)).
- On macOS, Linux and WSL the default tool set has no Glob or Grep; Claude
  searches with `find` and `grep` in Bash, which run embedded `bfs` and `ugrep`
  ([Claude Code tools reference](https://code.claude.com/docs/en/tools-reference.md)).
- Observed in Claude Code's Bash tool, where `grep --version` reports ugrep
  7.8.4: `grep -rn` from the repo root finds the re-included ADR and skips the
  ignored rule and skill; `grep -rn` on an explicit path into `.wolven-harness/`
  or through the `.claude/skills` link finds them; `find` ignores `.gitignore`
  and finds everything (`docs/notes/gitignored-harness-access/probe.sh`).
- Outside that tool, a script's system `grep` (BSD grep 2.6.0 on macOS) does not
  read `.gitignore` and finds the ignored rule too, so the skip belongs to the
  embedded grep, not to `grep` in general
  (`docs/notes/gitignored-harness-access/probe.sh`).

### Cursor

- "Cursor automatically ignores files in `.gitignore`", and `.cursorignore`
  blocks files from the Agent, Tab and @ mentions, though "The terminal and MCP
  server tools used by Agent cannot block access"
  ([Cursor ignore files](https://cursor.com/docs/context/ignore-files)).
- Skills load from `.agents/skills/` and `.cursor/skills/`, and "For
  compatibility" from `.claude/skills/` too
  ([Cursor skills](https://cursor.com/docs/context/skills)).
- Observed with cursor-agent 2026.10.14: it reported `probe-skill` available
  through the gitignored `.claude/skills` symlink. Asked to use only its
  built-in search, it reported `TOKEN_ADR` in the re-included ADR and no match
  for `TOKENRULE` in the ignored harness file. Both are the agent's own
  report, not a tool trace (`docs/notes/gitignored-harness-access/probe.sh`).

### qmd

- qmd 2.5.3 scans collections with `followSymbolicLinks: false` and `dot: false`,
  then drops any path with a part that starts with `.`. It does not read
  `.gitignore` (`/opt/homebrew/lib/node_modules/@tobilu/qmd/dist/cli/qmd.js:1552`,
  [upstream](https://github.com/tobi/qmd)).
- Observed: a collection rooted at the repo indexes the gitignored
  `CLAUDE.local.md` and nothing under `.wolven-harness/` or `.claude/`. A
  collection rooted at `.wolven-harness` indexes all of it, ignored files
  included. A collection rooted at `.claude` finds nothing, because the skills
  folder is a symlink (`docs/notes/gitignored-harness-access/probe.sh`).

## What this means for the layout

- **Loading works.** Skills through a gitignored symlink load in Claude Code and
  Cursor, and a gitignored `CLAUDE.local.md` import brings the harness
  instructions into Claude Code.
- **The agents' search tools see only what the client repo versions.** Claude
  Code's grep and Cursor's built-in search find the re-included `docs/`, and
  find ignored harness files (skills, rules, the entry file) only by explicit
  path. That is enough when skills and instructions arrive by loading, not by
  search. A plain shell `grep` or `find` sees everything.
- **qmd collections must be rooted inside `.wolven-harness/`**, not at the
  repo, and never through the symlinks.

## Sources

| Source | Type | Used for |
|--------|------|----------|
| https://code.claude.com/docs/en/skills.md | official docs | Skill locations and symlinked entries |
| https://code.claude.com/docs/en/memory.md | official docs | `@path` imports, `CLAUDE.local.md`, the `AGENTS.md` interaction |
| https://code.claude.com/docs/en/tools-reference.md | official docs | Grep and Glob versus `.gitignore`; embedded `bfs` and `ugrep` |
| https://cursor.com/docs/context/ignore-files | official docs | Cursor's `.gitignore` and `.cursorignore` handling |
| https://cursor.com/docs/context/skills | official docs | Cursor's skill locations |
| `/opt/homebrew/lib/node_modules/@tobilu/qmd/dist/cli/qmd.js:1552` (qmd 2.5.3), https://github.com/tobi/qmd | source code | qmd's scan options |
| `docs/notes/gitignored-harness-access/probe.sh` | reproduction script | Every observed behaviour above |

## Open questions

- Cursor's semantic index: the docs say `.gitignore` files are ignored, but the
  probe did not query semantic search, and whether Cursor rules in a
  gitignored `.cursor/rules` load was not tested.
- Codex, Gemini, Kiro, Copilot and opencode were not tested.
- `.claude/rules` as a symlink: the memory docs treat a symlink whose target is
  outside the working directory as an external import that needs approval; a
  target inside `.wolven-harness/` is inside it, but this was not run.
- The Cursor results are the agent's own report of which tool it used.

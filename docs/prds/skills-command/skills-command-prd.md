---
type: prd
title: Install ship and discovery skills without the harness
description: A skills command writes chosen ship and discovery skill folders into the directories claude, codex, and cursor already load, for global scope, project scope, or both.
status: draft
---

# Install ship and discovery skills without the harness

## Problem

- **Who:** A person who wants `ship` or `discovery` skills and does not want a harness install.
- **Pain:** There is no command that writes only those chosen skill folders into the directories `claude`, `codex`, or `cursor` already load, for global scope, project scope, or both.
- **Why now:** `setup` is the only installer. It always writes the harness (core skills, rules, runtime links, `.wolven-harness.json`, and package scripts), it installs optional skills only as whole sets, and it runs only at a git top-level. [Issue #31](https://github.com/WolvenTech/wolven-harness/issues/31) opened the narrower request to add one skill to an existing harness; this problem is the skills-only command instead.
- **Evidence:** [Issue #31](https://github.com/WolvenTech/wolven-harness/issues/31); [PR #27](https://github.com/WolvenTech/wolven-harness/pull/27) (canceled); [ADR-003](https://github.com/WolvenTech/wolven-harness/blob/main/docs/adrs/adr-003-public-contract.md) (`setup`, `validate`, and `comments` are the commands; `--skills` is `ship`, `discovery`, or `none`); `src/setup/skill-sets.ts`; `src/setup/runtimes.ts`. Load paths below are from each runtime's current docs: [Claude Code skills](https://code.claude.com/docs/en/skills), [Cursor agent skills](https://cursor.com/docs/skills), [Codex skills](https://developers.openai.com/codex/skills).

A **skills command** is a new `wolven-harness` command that installs skill folders and does not run `setup`. **Global** means the user-level directory that runtime already loads. **Project** means the skill directory in the current working directory that runtime already loads. The **load path** for a runtime and a scope is that directory:

| Runtime | Project | Global |
| --- | --- | --- |
| `claude` | `.claude/skills/<skill>/` | `~/.claude/skills/<skill>/` |
| `codex` | `.agents/skills/<skill>/` | `~/.agents/skills/<skill>/` |
| `cursor` | `.agents/skills/<skill>/` or `.cursor/skills/<skill>/` | `~/.agents/skills/<skill>/` or `~/.cursor/skills/<skill>/` |

`cursor` documents two directories for each scope. Which one this command writes is an open question. Codex's current user path is `~/.agents/skills/`; `~/.codex/skills/` is the deprecated user location and is not a target here.

**Code-lane** is this repo's changelog name for the code skills: core `code-spec`, `code-plan`, and `code-execute`, plus ship `code-commit`, `code-pr`, `code-review`, and `code-ci`.

## Goals

- G1: The skills command writes only the chosen `ship` and `discovery` skill folders into the load path for each chosen runtime and scope — success signal: those folders exist at the load path, and the command creates no core skill, rule, runtime link, `.wolven-harness.json`, or package script.
- G2: Core skills are visible and cannot be selected, and the choice list tells the person to install the harness for code-lane, `adr`, and `qmd` — success signal: the nine core skills stay unselected, none of their folders are written, and the note is shown.
- G3: An existing skill folder is replaced only after the person agrees on a terminal; with no terminal it stays as it is — success signal: a repeat run adds missing skills, leaves an existing folder unchanged unless they agree, and never removes a skill.
- G4: The same choices work as prompts on a terminal and as supplied choices with no terminal, and help names those choices — success signal: a non-terminal run with every choice supplied writes the folders; a non-terminal run missing a choice writes nothing and fails; help names the runtimes, both scopes, and the `ship` and `discovery` skills.
- G5: Global works from any directory, and project writes into the current directory — success signal: neither scope requires a git repository.

**Non-goals**

- Running `setup`, or writing core skills, rules, runtime links, `.wolven-harness.json`, or package scripts.
- The [PR #27](https://github.com/WolvenTech/wolven-harness/pull/27) approach: `setup --skill`, `setup --list-skills`, and a `skills` array on `.wolven-harness.json`. That pull request is canceled. Its flag names, config key, and recording of individual skills apart from `skillSets` are not decisions.
- Adding one skill to an existing harness while leaving that harness's other setup choices in place. That remains a separate problem from [issue #31](https://github.com/WolvenTech/wolven-harness/issues/31).
- Changing skill text so a skill works with no other harness files present.
- Writing Codex skills to the deprecated `~/.codex/skills/` location.

## User stories

### US-1: Install chosen skills into load paths

**As a** person who wants `ship` or `discovery` skills without a harness install,
**I want** the skills command to write only the skill folders I choose,
**so that** those skills sit in the directories my runtimes already load.

Traces to goal: G1, G5

#### AC-1.1: One skill, one runtime, project scope

**Given** the current directory is not a git repository and has no harness files
**When** I run the skills command for `create-prd`, runtime `claude`, and project scope
**Then** `./.claude/skills/create-prd/` exists with that skill's `SKILL.md`, and the directory has no `.agents/`, `.wolven-harness.json`, `CLAUDE.md`, `.claude/skills` symlink, rules, or package scripts

#### AC-1.2: Several runtimes and both scopes

**Given** a current directory with no harness files
**When** I run the skills command for `create-prd`, runtimes `claude` and `codex`, and both global and project
**Then** the skill folder exists at `./.claude/skills/create-prd/`, `~/.claude/skills/create-prd/`, `./.agents/skills/create-prd/`, and `~/.agents/skills/create-prd/`, and no other harness files are created

### US-2: Choose a set or individual skills, with core unavailable

**As a** person choosing skills,
**I want** `ship` and `discovery` listed as groups of skill checkboxes, with core visible and disabled,
**so that** I can take a set or a subset, and I am pointed at `setup` when I want the harness.

Traces to goal: G2

#### AC-2.1: A set checkbox selects that set

**Given** an interactive terminal
**When** I check the `discovery` set
**Then** `create-prd`, `prototype`, `handoff`, `the-fool`, and `the-jury` are selected, and checking only `create-prd` leaves the other four unselected

#### AC-2.2: Core stays disabled

**Given** the skill choice list is shown
**When** I look at core
**Then** `harness-init`, `adr`, `grilling`, `pragmatic-guard`, `qmd`, `research`, `code-spec`, `code-plan`, and `code-execute` are visible and cannot be selected, the list tells me to install the harness for code-lane, `adr`, and `qmd`, and a finished run has written none of those nine folders

### US-3: Leave an existing skill folder unless I agree

**As a** person who already has a skill folder at a load path,
**I want** the command to ask before replacing it,
**so that** a repeat run does not discard edits unless I say so.

Traces to goal: G3

#### AC-3.1: A terminal asks, and a refusal keeps the folder

**Given** `./.claude/skills/create-prd/` already exists and differs from the package copy, and stdout is a terminal
**When** I run the skills command for `create-prd`, runtime `claude`, and project scope, and I decline the replacement
**Then** that folder is unchanged, and any other chosen skill that was missing is still added

#### AC-3.2: No terminal leaves the folder untouched

**Given** `./.claude/skills/create-prd/` already exists, and stdout is not a terminal
**When** I run the skills command with `create-prd`, runtime `claude`, and project scope supplied
**Then** that folder is unchanged and the command does not ask

### US-4: Supply the same choices without prompts

**As a** person running the skills command from a script,
**I want** to pass runtime, scope, and skills without being asked,
**so that** a non-interactive run can install the same folders a prompt run would.

Traces to goal: G4

#### AC-4.1: A complete non-terminal run writes the folders

**Given** stdout is not a terminal, and the current directory has no `create-prd` skill folder
**When** I run the skills command with `create-prd`, runtime `codex`, and project scope supplied
**Then** `./.agents/skills/create-prd/` exists and the command exits 0

#### AC-4.2: A missing choice writes nothing

**Given** stdout is not a terminal
**When** I run the skills command with no runtime supplied
**Then** the command writes nothing and exits with a failure that names the missing choice

#### AC-4.3: Help names the choices

**Given** the skills command help
**When** I read it
**Then** it names `claude`, `codex`, and `cursor`, global and project, and every `ship` and `discovery` skill, and it says core skills are installed by `setup`

#### AC-4.4: Cancelling a prompt writes nothing

**Given** an interactive terminal and a prompt still unanswered
**When** I cancel the prompt
**Then** the command writes nothing

## Scope

**In**

- A skills command that installs skill folders from this package's `ship` and `discovery` sets.
- Choosing one or more of `claude`, `codex`, and `cursor`, and global, project, or both, in one run.
- Skill checkboxes grouped under `ship` and `discovery`, with a set checkbox that selects every skill in that set.
- Core skills shown disabled, with a note to install the harness for code-lane, `adr`, and `qmd`.
- Prompts for omitted choices on a terminal, and the same choices supplied without prompts.
- Asking before replacing an existing skill folder; leaving it untouched when there is no terminal.
- Global from any directory, and project into the current directory, with no git requirement.
- Help text that names the runtimes, the two scopes, and the `ship` and `discovery` skills, and says core skills are installed by `setup`.

**Out**

- `setup` and every harness file it writes.
- `setup --skill`, `setup --list-skills`, and a `skills` key on `.wolven-harness.json` ([PR #27](https://github.com/WolvenTech/wolven-harness/pull/27), canceled).
- Installing core skills with this command.
- The separate problem of adding one skill to an existing harness.
- Rewriting skill instructions so they stand alone.
- The deprecated Codex user path `~/.codex/skills/`.

## Open questions

- What word the skills command uses on the CLI, and how a non-terminal run spells runtime, scope, and skills. `setup --skill` and `--list-skills` are not candidates — owner: maintainer
- Which `cursor` directory the command writes for project (`.agents/skills/` or `.cursor/skills/`) and for global (`~/.agents/skills/` or `~/.cursor/skills/`), since Cursor documents both — owner: maintainer
- When several load paths already contain the skill, whether one confirmation covers every existing folder or each folder is asked separately — owner: maintainer

## Handoff

After approval → `code-spec`. This PRD does not authorize implementation.

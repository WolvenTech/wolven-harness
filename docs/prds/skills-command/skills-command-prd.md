---
type: prd
title: Install ship and discovery skills without the harness
description: A skills command writes one package copy of chosen ship and discovery skills into the directories claude, codex, and cursor already load, and that copy skips a missing consult and stops when the next procedure lives elsewhere.
status: stable
---

# Install ship and discovery skills without the harness

## Problem

- **Who:** A person who wants `ship` or `discovery` skills and does not want a harness install.
- **Pain:** There is no command that writes only those chosen skill folders into the directories `claude`, `codex`, or `cursor` already load, and the package copy of a ship skill or `create-prd` stops on a consult that command cannot install.
- **Why now:** `setup` is the only installer. It always writes the harness (core skills, rules, runtime links, `.wolven-harness.json`, and package scripts), it installs optional skills only as whole sets, and it runs only at a git top-level. [Issue #31](https://github.com/WolvenTech/wolven-harness/issues/31) opened the narrower request to add one skill to an existing harness; this problem is the skills-only command instead.
- **Evidence:** [Issue #31](https://github.com/WolvenTech/wolven-harness/issues/31); [PR #27](https://github.com/WolvenTech/wolven-harness/pull/27) (canceled); [ADR-003](https://github.com/WolvenTech/wolven-harness/blob/main/docs/adrs/adr-003-public-contract.md) (`setup`, `validate`, and `comments` are the commands; `--skills` is `ship`, `discovery`, or `none`); `src/setup/skill-sets.ts`; `src/setup/runtimes.ts`. Load paths below are from each runtime's current docs: [Claude Code skills](https://code.claude.com/docs/en/skills), [Cursor agent skills](https://cursor.com/docs/skills), [Codex skills](https://developers.openai.com/codex/skills).

A **skills command** is a new `wolven-harness` command that installs skill folders and does not run `setup`. **Global** means the user-level directory that runtime already loads. **Project** means the skill directory in the current working directory that runtime already loads. The **load path** for a runtime and a scope is that directory:

| Runtime | Project | Global |
| --- | --- | --- |
| `claude` | `.claude/skills/<skill>/` | `~/.claude/skills/<skill>/` |
| `codex` | `.agents/skills/<skill>/` | `~/.agents/skills/<skill>/` |
| `cursor` | `.agents/skills/<skill>/` | `~/.agents/skills/<skill>/` |

Cursor and Codex share `.agents/skills/` and `~/.agents/skills/`, so a run that chooses both writes each skill once. Codex's deprecated user location `~/.codex/skills/` is not a target.

**Code-lane** is this repo's changelog name for the code skills: core `code-spec`, `code-plan`, and `code-execute`, plus ship `code-commit`, `code-pr`, `code-review`, and `code-ci`.

## Goals

- G1: The skills command writes only the chosen `ship` and `discovery` skill folders into the load path for each chosen runtime and scope — success signal: those folders exist at the load path, and the command creates no core skill, rule, runtime link, `.wolven-harness.json`, or package script.
- G2: Core skills are visible and cannot be selected, and the choice list tells the person to install the harness for code-lane, `adr`, and `qmd` — success signal: the nine core skills stay unselected, none of their folders are written, and the note is shown.
- G3: An existing skill folder that differs from the package copy is replaced only after a yes for that folder; with no terminal it stays as it is — success signal: each differing `.../skills/<skill>/` is its own yes/no, yes removes that folder and writes the package copy, no leaves it, a missing folder is added, an identical folder is left with no prompt, and cancelling any prompt writes nothing.
- G4: The same choices work as prompts on a terminal and as `--runtimes`, `--scope`, and `--skills` with no terminal, and help names those choices — success signal: a non-terminal run with every choice supplied writes the folders; a non-terminal run missing a choice or passing an invalid value writes nothing and fails, naming the choice; help names the runtimes, both scopes, and the `ship` and `discovery` skills.
- G5: Global works from any directory, and project writes into the current directory — success signal: neither scope requires a git repository.
- G6: A missing consult is skipped and named on the artifact — success signal: with `pragmatic-guard` or `grilling` absent from the session skill list, the skill does the steps in its own text, and both the reply and the durable text that run writes say that consult did not run.
- G7: A missing procedure stays coupled — success signal: the run stops before a host action whose steps live in `code-pr`, before a commit whose steps live in `code-commit`, before an ADR promotion whose steps live in `adr`, and before a claim that `harness:validate` passed, that an ADR-claims axis passed, or that the pull request is merge-ready.
- G8: `prototype`, `the-fool`, `the-jury`, and `handoff` keep their text — success signal: their package copy is unchanged.

**Best effort** means the skill does the steps in its own text. If a consulted skill is loaded, it uses that skill. If the consult is missing, it continues those steps. The reply names that skill and says the consult did not run. The same sentence is in every durable text that run writes: the PRD file, the commit message, the pull request body, or the posted review. The skill does not reconstruct the missing skill, does not write that skill's artifacts, and does not point at the skills command or at `setup` as the way to install it. A skill in this set that reads that sentence does not treat the named consult as having run, and does not claim the pull request is merge-ready from that text.

**Coupled** means the next step's procedure lives in another skill or in a harness file. The skill stops, names that missing piece, and does not invent a substitute.

**Loaded** means the skill is in the list the runtime provided for this session. A folder on disk does not count. A name remembered from an earlier summary does not count. One package copy at `templates/.agents/skills/<skill>/` is what both `setup` and the skills command install.

**Non-goals**

- Running `setup`, or writing core skills, rules, runtime links, `.wolven-harness.json`, or package scripts.
- The [PR #27](https://github.com/WolvenTech/wolven-harness/pull/27) approach: `setup --skill`, `setup --list-skills`, and a `skills` array on `.wolven-harness.json`. That pull request is canceled. Its flag names, config key, and recording of individual skills apart from `skillSets` are not decisions.
- Adding one skill to an existing harness while leaving that harness's other setup choices in place. That remains a separate problem from [issue #31](https://github.com/WolvenTech/wolven-harness/issues/31).
- A substitute grilling interview, a substitute Conventional Commit, a copied host procedure, or an ADR status change without `adr`.
- A hard stop that names the skills command, or `setup`, as the way to install `pragmatic-guard`, `grilling`, or `adr`.
- Skill packages, or several versions of one skill for levels of harness adoption.
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

#### AC-1.3: Cursor and Codex share one folder

**Given** a current directory with no harness files
**When** I run the skills command for `create-prd`, runtimes `cursor` and `codex`, and project scope
**Then** `./.agents/skills/create-prd/` exists once, and `./.cursor/skills/` does not exist

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

**Given** `./.claude/skills/create-prd/` already exists and differs from the package copy, and stdout and stdin are terminals
**When** I run the skills command for `create-prd`, runtime `claude`, and project scope, and I decline the replacement
**Then** that folder is unchanged, and any other chosen skill that was missing is still added

#### AC-3.2: Yes replaces that folder wholesale

**Given** `./.claude/skills/create-prd/` already exists, differs from the package copy, and contains an extra file the package does not ship, and stdout and stdin are terminals
**When** I run the skills command for `create-prd`, runtime `claude`, and project scope, and I accept the replacement
**Then** that folder is the package copy, and the extra file is gone

#### AC-3.3: Each existing skill folder is its own question

**Given** `./.claude/skills/create-prd/` and `~/.claude/skills/create-prd/` both exist and differ from the package copy, and stdout and stdin are terminals
**When** I decline the project folder and accept the global folder
**Then** the project folder is unchanged and the global folder is the package copy

#### AC-3.4: No terminal leaves the folder untouched

**Given** `./.claude/skills/create-prd/` already exists, and stdout or stdin is not a terminal
**When** I run the skills command with `--skills create-prd --runtimes claude --scope project`
**Then** that folder is unchanged and the command does not ask

### US-4: Supply the same choices without prompts

**As a** person running the skills command from a script,
**I want** to pass runtime, scope, and skills without being asked,
**so that** a non-interactive run can install the same folders a prompt run would.

Traces to goal: G4

#### AC-4.1: A complete non-terminal run writes the folders

**Given** stdout or stdin is not a terminal, and the current directory has no `create-prd` skill folder
**When** I run `wolven-harness skills --skills create-prd --runtimes codex --scope project`
**Then** `./.agents/skills/create-prd/` exists and the command exits 0

#### AC-4.2: A missing choice writes nothing

**Given** stdout or stdin is not a terminal
**When** I run the skills command with no `--runtimes`
**Then** the command writes nothing and exits with a failure that names the missing choice

#### AC-4.3: An invalid value writes nothing without a terminal

**Given** stdout or stdin is not a terminal
**When** I run the skills command with `--scope both`, or with `--skills adr`
**Then** the command writes nothing and exits with a failure that names the bad value, and the `adr` failure points at `setup`

#### AC-4.4: A terminal asks an invalid value again

**Given** stdout and stdin are terminals
**When** I run the skills command with `--runtimes foo` and then choose `codex` at the prompt, with `--scope project` and `--skills create-prd` supplied
**Then** `./.agents/skills/create-prd/` exists and the command exits 0

#### AC-4.5: Help names the choices

**Given** the skills command help
**When** I read it
**Then** it names the `skills` command, `--runtimes`, `--scope`, and `--skills`, the values `claude`, `codex`, `cursor`, `project`, `global`, and `project,global`, and every `ship` and `discovery` skill, and it says core skills are installed by `setup`

#### AC-4.6: Cancelling a prompt writes nothing

**Given** stdout and stdin are terminals, one replacement was already answered yes, and a later prompt is still unanswered
**When** I cancel that prompt
**Then** the command writes nothing: no new skill folder, and no replacement already answered yes

### US-5: Skip a missing guard and leave the skip on the artifact

**As a** person running a ship skill without `pragmatic-guard` loaded,
**I want** that skill to do the steps in its own text and to name the skip on what it writes,
**so that** a later session can see the guard did not run.

Traces to goal: G6

#### AC-5.1: The guard is used when the session lists it

**Given** the session skill list includes `pragmatic-guard`
**When** I ask a ship skill for its job
**Then** that skill consults `pragmatic-guard` and then follows its own text

#### AC-5.2: A missing guard is named, and its artifacts are not written

**Given** `pragmatic-guard` is absent from the session skill list
**When** I ask a ship skill for its job
**Then** the skill follows its own text, the reply and the durable text that run writes say `pragmatic-guard` was not consulted, the run writes no deferral and no sentence that says the guard ran, and the skill does not name an install command for it

#### AC-5.3: A folder or a memory is not loaded

**Given** `pragmatic-guard` is absent from the session skill list, and a folder for it is on disk or an earlier summary names it
**When** I ask a ship skill for its job
**Then** the skill treats `pragmatic-guard` as not loaded

#### AC-5.4: A later skill reads the sentence as a skip

**Given** a commit message, pull request body, or posted review says `pragmatic-guard` was not consulted
**When** `code-review` or `code-ci` reads that text
**Then** it does not treat the guard as having run, and it does not claim the pull request is merge-ready from that text

### US-6: Draft a PRD without a substitute interview

**As a** person with `create-prd` and without `grilling` loaded,
**I want** a draft from the ask I gave, with the skip written in the file,
**so that** the PRD does not wait on a reconstructed grilling session and a later read can see that it was skipped.

Traces to goal: G6

#### AC-6.1: Grilling runs when the session lists it

**Given** the session skill list includes `grilling`
**When** I ask `create-prd` for a PRD
**Then** `create-prd` runs `grilling` before it drafts

#### AC-6.2: A missing grilling skill still drafts, and the file says so

**Given** `grilling` is absent from the session skill list
**When** I ask `create-prd` for a PRD
**Then** `create-prd` drafts from that ask with its own term check and template, the PRD file and the reply say `grilling` did not run, and it does not interview me in place of that skill or name an install command for it

#### AC-6.3: The ADR offer stays coupled to adr

**Given** `create-prd` reaches its ADR offer and `adr` is absent from the session skill list
**When** that offer comes up
**Then** no decision record is written, and the reply names `adr`

### US-7: Stop where the procedure lives somewhere else

**As a** person whose next step is defined in another skill or a harness file,
**I want** the run to stop and name that piece,
**so that** the skill does not invent a second way to do it.

Traces to goal: G7

#### AC-7.1: Host actions stay in code-pr

**Given** `code-review` or `code-ci` is in the session skill list and `code-pr` is not
**When** the next step is a host action
**Then** the skill stops before that action, names `code-pr`, and does not carry a copy of the host procedure

#### AC-7.2: The commit stays in code-commit

**Given** `code-commit` is absent from the session skill list, and `code-pr` has a dirty in-scope tree, or `code-ci` has a conflict resolution to commit, or pre-merge closure has moves to commit
**When** that commit is the next step
**Then** the skill stops before the commit, names `code-commit`, and does not run `git commit` in its place

#### AC-7.3: A missing gitHost stops the host action

**Given** the skill is about to perform a host action and `.wolven-harness.json` has no `gitHost`
**When** it reads that value
**Then** the host action does not happen, the reply names `setup`, and the skill does not assume GitHub

#### AC-7.4: A missing validate script is not claimed

**Given** `code-ci` or pre-merge closure cannot run `harness:validate`
**When** that step arrives
**Then** the skill stops that step, names `setup`, and does not claim the command passed or that the pull request is merge-ready

#### AC-7.5: ADR promotion stays in adr

**Given** pre-merge closure has ADRs to promote and `adr` is absent from the session skill list
**When** promotion is the next step
**Then** ADR status stays as it is, and closure does not claim merge-ready

#### AC-7.6: A review skips the ADR-claims axis

**Given** `code-review` can post and cannot run `harness:validate`
**When** it reaches the ADR-claims axis
**Then** it posts the other findings, the posted review says that axis was not checked, and it does not judge those claims by eye

#### AC-7.7: A skipped ADR-claims axis is not a passed review

**Given** the posted review says the ADR-claims axis was not checked
**When** closure or a later run reads that review
**Then** it does not treat that axis as passed, and it does not claim the pull request is merge-ready

### US-8: Leave the skills that already finish

**As a** person with only `prototype`, `the-fool`, `the-jury`, or `handoff` loaded,
**I want** that skill to behave as its current text says,
**so that** a skill that already finishes is not rewritten.

Traces to goal: G8

#### AC-8.1: Their text stays

**Given** the package copy of `prototype`, `the-fool`, `the-jury`, and `handoff`
**When** this work ships
**Then** that copy is unchanged

## Scope

**In**

- A `skills` command that installs skill folders from this package's `ship` and `discovery` sets.
- Choosing one or more of `claude`, `codex`, and `cursor`, and `project`, `global`, or `project,global`, in one run.
- Flags `--runtimes`, `--scope`, and `--skills`. `--skills` accepts a skill name or a set name; `ship` and `discovery` expand to every skill in that set.
- Skill checkboxes grouped under `ship` and `discovery`, with a set checkbox that selects every skill in that set.
- Core skills shown disabled, with a note to install the harness for code-lane, `adr`, and `qmd`. A core name on `--skills` fails and points at `setup`.
- Prompts only when stdout and stdin are both terminals: an omitted choice is asked, and an invalid value is asked again. Without both terminals, a missing or invalid choice writes nothing and fails.
- One yes/no per differing skill folder. Yes removes that folder and writes the package copy. Cancelling any prompt writes nothing.
- Cursor writes `.agents/skills/<skill>/` and `~/.agents/skills/<skill>/`, the same paths as Codex.
- Global from any directory, and project into the current directory, with no git requirement.
- Help text that names the command, the three flags, their values, and the `ship` and `discovery` skills, and says core skills are installed by `setup`.
- Skill text, in the one package copy, for `code-commit`, `code-pr`, `code-review`, `code-ci`, and `create-prd`. A missing consult is best effort and the skip is on the durable text that run writes. A missing procedure stays coupled.

**Out**

- `setup` and every harness file it writes.
- `setup --skill`, `setup --list-skills`, and a `skills` key on `.wolven-harness.json` ([PR #27](https://github.com/WolvenTech/wolven-harness/pull/27), canceled).
- Installing core skills with this command.
- The separate problem of adding one skill to an existing harness.
- Changing `prototype`, `the-fool`, `the-jury`, or `handoff`.
- A second version of a skill, or a package of skills, for a level of harness adoption.
- Substitute procedures for `grilling`, `code-commit`, `code-pr`'s host steps, `adr`, or `harness:validate`.
- A hard stop whose remedy is the skills command, or `setup`, for `pragmatic-guard`, `grilling`, or `adr`.
- The deprecated Codex user path `~/.codex/skills/`.

## Open questions

None. The command word, the flag spelling, the Cursor paths, and the per-folder replacement are settled in the goals and acceptance criteria above.

## Handoff

Approved, including the skill-text requirements folded into this file. `docs/prds/archived/standalone-completion/standalone-completion-prd.md` is retired. Next is `code-plan` after `docs/specs/skills-command/skills-command-spec.md` is approved. This PRD does not authorize implementation.

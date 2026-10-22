---
type: prd
title: Install and use experience
description: Make a harness install verifiable and adaptive, with a global CLI, setup from any folder, a harness-init that fits the project, and a doctor that finds and repairs a half-working install.
status: stable
---

# Install and use experience

## Problem

- **Who:** anyone who adopts the harness in a project, in any folder layout and any agent runtime: Claude Code, or one of the runtimes that read `AGENTS.md` and `.agents/` natively, such as Codex and Cursor. Also the agent that works there afterwards.
- **Pain:** they can't tell whether the harness is really installed and working. `setup` reports success while the agent doesn't see what the harness offers. The harness doesn't adapt to the project's own way of working. When something is off, nothing points it out or helps repair it.
- **Why now:** the first install by a second user, at a client, ran for four days in a half-working state, and the harness is about to be pitched to another client team that works across several repositories.
- **Evidence:**
  - A field audit of that install (16–20 Oct 2026, 18 Claude Code transcripts, read-only):
    - `validate` was green and the package was current, yet 0 of 4 standing rules reached the agent's context.
    - 0 of 3 `qmd` calls worked; the agent fell back to grep without telling the user.
    - 7 of 20 skills ran. No planning doc was written after the first day.
    - 0 of 11 commits followed the format `code-commit` produces, because the client repo uses `DEV-123: …`.
    - `/code-review` resolved to Claude Code's built-in command instead of the harness skill.
    - The harness git repo had no commits.
  - In this repo:
    - `harness-init`'s mention-only entry mode writes one plain-text line and no import (`templates/.agents/skills/harness-init/references/entry-modes.md`).
    - `checkStep0Pending` in `src/validate/spine.ts` passes as soon as `AGENTS.md` contains the string `WOLVEN.md`.
    - `templates/WOLVEN.md` says `.agents/rules/` load unconditionally, but `src/setup/runtimes.ts` wires Claude only with the `.claude/skills` symlink and an `@AGENTS.md` stub.
    - `setup` never checks that `qmd` is installed.
    - Every command `setup` prints assumes pnpm: `pnpm harness:validate`, `pnpm exec`, `pnpm dlx` and `pnpm add -D` (`src/setup/index.ts`, `src/setup/own-package.ts`, `src/setup/harness-score.ts`). So do `WOLVEN.md`, `wayfinder` and the CI wiring `harness-init` writes (`templates/.agents/skills/harness-init/references/validate-wiring.md`). Only `code-execute` names npm and yarn.
    - `setup` exits 1 when not run at a git top-level ([ADR-005](../../adrs/adr-005-install-anywhere-contract.md)), so a user who cannot commit harness files into the client repo has no supported place to install.
  - The review of the first implementation (PR 71, 20–21 Oct 2026). Each of these was reproduced against that build:
    - `doctor` passed a linked install while every `qmd` call from the open folder searched an empty index.
    - An install made before the manifest existed never got manifest entries, so every file it held read as "edited" and none could be refreshed.
    - The copies of the standing rules made for Cursor, Copilot and Kiro, and the inline block for Codex, stayed old after a rule changed, while `doctor` stayed green.
    - `setup` run in a subfolder of a git repository wrote harness files into that repository.
  - Prior art: Compozy up to v0.2.9 installs its CLI globally, runs `compozy setup` to link skills into each detected agent, and has its run commands refuse missing skill installs and offer to refresh outdated ones ([README at v0.2.9](https://github.com/compozy/compozy/blob/v0.2.9/README.md)).

## Goals

- **The install reports its true state.** Success signal: `wolven-harness doctor` exits 1 on an install shaped like the audited one, names each failing check with the step that fixes it, and exits 0 once those steps are done.
- **The agent sees what the harness offers from its first turn.** Success signal: in a fresh session opened where the harness is wired, the agent can name the router's skills and the standing rules without reading any file, and a `qmd` search returns the project's docs.
- **The harness can be installed from anywhere.** Success signal: after `npm install -g @wolven-tech/harness`, `wolven-harness setup` in a folder that is not a git top-level exits 0, writes only skills and runtime wiring, and prints the next step to take in the agent.
- **The harness fits the project instead of forcing it.** Success signal: on a repo whose commits use `DEV-123: …`, `code-commit` writes that format after `harness-init` records it. An existing install in a non-default layout is repaired in place, without being forced to move. On an npm or yarn project, every command the harness prints or writes runs as-is with that package manager.

**Non-goals**

- One install wiring several code repositories. One install serves one code repository ([deferral](../../deferrals/multi-repo-install/multi-repo-install-deferral.md)).
- A non-interactive `setup` for preinstalled machines ([deferral](../../deferrals/non-interactive-setup/non-interactive-setup-deferral.md)).
- Renaming the harness `code-review` skill or giving it a chat-only mode.
- Having `grilling` hand off to `create-prd` or `code-spec`.
- A configurable docs root. That stays with its existing deferral.

## User stories

### US-1: Install the CLI once, set up from any folder

**As a** developer adopting the harness,
**I want** to install the CLI globally and run `setup` wherever I start,
**so that** I can use the harness in a project whose repository I can't or won't put harness files into.

Traces to goal: The harness can be installed from anywhere.

#### AC-1.1: Setup at a repo root

**Given** the CLI is installed globally and the current folder is a git top-level
**When** the developer runs `wolven-harness setup`
**Then** setup behaves as it does today: it scaffolds the harness, wires the selected runtimes, and creates only missing paths

#### AC-1.2: Setup outside a repo root

**Given** the CLI is installed globally and the current folder is not inside any git repository
**When** the developer runs `wolven-harness setup`
**Then** setup installs only the skills and the runtime wiring that let an agent run `harness-init` in that folder, exits 0, and tells the developer to open their agent runtime there and run `harness-init`

#### AC-1.3: Run through npx

**Given** the developer runs the CLI through `npx` without a global install
**When** setup or doctor runs
**Then** the command still works, and its output recommends a global install with the developer's package manager, such as `npm install -g @wolven-tech/harness`

#### AC-1.4: Runtimes detected, then confirmed

**Given** the developer runs `setup` on a machine with some agent runtimes installed
**When** setup reaches the runtime choice
**Then** it pre-selects the runtimes it detects on the machine or already configured in the folder, and the developer confirms or changes the selection before anything is wired

#### AC-1.5: No runtime detected

**Given** no supported runtime is detected
**When** setup reaches the runtime choice
**Then** it lists every supported runtime with none pre-selected, and wires only what the developer picks

#### AC-1.6: Setup in a subfolder of a repository

**Given** the current folder is inside a git repository but is not its top-level, such as a folder inside a client repository
**When** the developer runs `wolven-harness setup`
**Then** setup writes nothing, exits 1, names the repository's top-level, and tells the developer to run it at that top-level or in a folder outside the repository

### US-2: harness-init fits the folder it finds

**As a** developer who ran `setup` outside a repo root, or has an existing install in a non-default layout,
**I want** `harness-init` to work out with me where the harness lives and which repository it serves,
**so that** the install works without my reorganizing the project around the harness.

Traces to goal: The harness fits the project instead of forcing it.

#### AC-2.1: Default layout from a fresh folder

**Given** setup ran in a folder that is not a git repository and holds no harness yet
**When** the developer runs `harness-init` in the agent
**Then** it proposes the default layout and asks before creating anything: the folder becomes the **harness home**, a git repository that holds the harness files and `docs/`, and the code repository sits inside it and is listed in its `.gitignore`. It creates the harness home's git repository only after the developer agrees.

#### AC-2.2: Existing non-default layout

**Given** an existing install where the harness home sits beside the code instead of above it, reached through a parent folder's agent entry file
**When** the developer runs `harness-init`
**Then** it recognises the layout, keeps it, and wires the runtime so the minimal install holds there. It does not move folders unless the developer asks.

#### AC-2.3: Harness files never land in the code repository

**Given** the developer has said the code repository is not theirs to commit harness files into
**When** `harness-init` scaffolds or wires anything
**Then** no harness file is written inside that repository, and the developer is told where each file went

### US-3: Follow the project's commit and pull request conventions

**As a** developer on a client repository with its own conventions,
**I want** the harness to learn and follow them,
**so that** the commit and PR skills help instead of being read and discarded.

Traces to goal: The harness fits the project instead of forcing it.

#### AC-3.1: Convention learned and confirmed

**Given** the code repository's recent commits follow a pattern, such as `DEV-123: sentence`
**When** `harness-init` runs
**Then** it proposes that pattern as the repository's convention, records it after the developer confirms, and the harness home keeps Conventional Commits for its own commits

#### AC-3.2: Skills follow the recorded convention

**Given** a convention is recorded for the code repository
**When** `code-commit` or `code-pr` acts on that repository
**Then** the commit message or PR title follows the recorded convention, and the rest of each skill's flow (validate, group, verify) is unchanged

#### AC-3.3: No clear pattern

**Given** the repository has no commits, or no consistent pattern
**When** `harness-init` runs
**Then** it asks the developer which convention to use, offering Conventional Commits as the default, and records the answer

### US-4: The agent sees the harness from the first turn

**As** the agent working in a project,
**I want** the router, the standing rules and the search tool in effect from my first turn,
**so that** I follow the harness without the developer reminding me.

Traces to goal: The agent sees what the harness offers from its first turn.

#### AC-4.1: Router and rules loaded in every runtime

**Given** setup and `harness-init` completed for a selected runtime, in any entry mode
**When** a new session starts in that runtime where the harness is wired
**Then** the router (skills, docs layout, validate guidance) and the current text of the four standing rules are in the agent's context without the agent reading a file

#### AC-4.2: A mention is not an install

**Given** `AGENTS.md` names `WOLVEN.md` only in plain text, and the runtime does not load `WOLVEN.md`
**When** `validate` or `doctor` runs
**Then** the check fails or warns instead of passing silently

#### AC-4.3: A missing tool is reported, not routed around

**Given** a harness tool the agent depends on, such as `qmd`, is unavailable
**When** the agent would use it
**Then** the agent tells the developer which tool failed before using a fallback

#### AC-4.4: A changed rule reaches every runtime

**Given** a standing rule changes, because the developer edited it or `harness-doctor` refreshed it, and a wired runtime reads a copy of that rule
**When** `doctor` runs before the copy is updated
**Then** it reports each copy that differs from its rule as failing, naming the runtime, and `harness-doctor` updates the copy only after the developer agrees

### US-5: Doctor finds a half-working install

**As a** developer, or a script checking a machine,
**I want** one command that tells me whether the harness is installed and working,
**so that** I find a half-working install before it costs days of work.

Traces to goal: The install reports its true state.

#### AC-5.1: Minimal install checked

**Given** a folder where the harness is wired
**When** the developer runs `wolven-harness doctor`
**Then** it checks the **minimal install** and reports each check as passing or failing:
- the router and rules load in each wired runtime
- the skills resolve from the folder where the agent opens
- `docs/` lives in a git repository the developer can commit to
- `qmd` is installed, its index is built, and a `qmd` search run from the folder where the agent opens reaches that index

`qmd` has no opt-out. An install without it fails this check.

#### AC-5.2: Each failure names its fix

**Given** at least one check fails
**When** doctor finishes
**Then** it exits 1, and every failing check names the step or skill that fixes it

#### AC-5.3: CLI and skills out of step

**Given** the CLI is not installed globally, or the project's recorded package version is older than the global CLI
**When** doctor runs
**Then** it reports this as a warning with the command that fixes it, and the warning alone does not change the exit code

#### AC-5.5: Drift from the templates

**Given** harness files in the project differ from the shipped templates
**When** doctor runs
**Then** it lists each such file as a warning in one of three groups: edited by the consumer, a stale template the consumer never edited, or a template file missing from the project. It writes nothing, and the warnings alone do not change the exit code. This replaces the deferred `setup --check` ([deferral](../../deferrals/setup-drift-check/setup-drift-check-deferral.md)).

#### AC-5.4: Healthy install

**Given** every minimal-install check passes
**When** doctor runs
**Then** it exits 0 and prints a one-line summary per check

### US-6: A doctor skill repairs with the developer

**As a** developer with a half-working install,
**I want** my agent to read the doctor report and repair it with me,
**so that** I don't have to work out each fix by hand.

Traces to goal: The install reports its true state.

#### AC-6.1: Guided repair

**Given** doctor reports failing checks
**When** the developer runs the `harness-doctor` skill
**Then** it proposes one fix at a time, shows what it will change, applies it only after the developer agrees, and reruns doctor at the end

#### AC-6.2: Repair keeps the developer's layout

**Given** the install uses a non-default layout that meets the minimal install once wired
**When** `harness-doctor` repairs it
**Then** it fixes the wiring in place and does not propose moving folders unless a minimal-install check cannot pass otherwise

#### AC-6.3: Declined fix

**Given** the developer declines a proposed fix
**When** `harness-doctor` continues
**Then** it moves to the next check, and lists the declined check as still failing in its closing summary

#### AC-6.4: Refresh stale templates, keep edits

**Given** doctor lists drift
**When** `harness-doctor` handles it
**Then** it offers to replace each stale template the consumer never edited with the current one, one at a time and after the developer agrees. For a file the consumer edited, it only shows the difference and leaves the file as it is. It never merges.

### US-7: Use the project's package manager

**As a** developer on a project that uses npm or yarn instead of pnpm,
**I want** every command the harness gives me to use my package manager,
**so that** I can copy it and run it without translating.

Traces to goal: The harness fits the project instead of forcing it.

#### AC-7.1: Commands match the detected package manager

**Given** the project uses npm, yarn or pnpm, as its lockfile or the `packageManager` field in `package.json` shows
**When** `setup` or `doctor` prints a command, or a skill writes one into a doc, a script or a CI job
**Then** the command uses that package manager's form for running a script, running a package binary, and adding a dev dependency

#### AC-7.2: No package.json

**Given** the folder has no `package.json`, as in a harness home beside a Java code repository
**When** the harness prints or writes a command
**Then** it uses the globally installed `wolven-harness` binary directly, and `setup` creates no `package.json`

#### AC-7.3: More than one package manager in sight

**Given** the project shows signs of more than one package manager, such as two lockfiles
**When** `setup` or `harness-init` runs
**Then** it asks the developer which one to use, records the answer, and uses it from then on

#### AC-7.4: Global CLI from any package manager

**Given** the CLI was installed globally with npm, yarn or pnpm
**When** `doctor` checks for the global CLI
**Then** it finds the binary on `PATH` whichever package manager installed it

### US-8: Bring an earlier install under the doctor

**As a** developer whose install was set up by an earlier version of the harness,
**I want** `doctor` and `harness-doctor` to tell the files I edited from the ones I never touched,
**so that** my install can be checked and refreshed like a new one, without my editing it by hand.

Traces to goal: The install reports its true state.

#### AC-8.1: An untouched file reads as stale

**Given** an install set up by an earlier version, holding a harness file the developer never edited that differs from the current template
**When** `doctor` runs
**Then** that file is reported as a stale template, not as edited, and `doctor` needs no network to tell the two apart

#### AC-8.2: An edited file reads as edited

**Given** the same install holds a harness file the developer did edit
**When** `doctor` runs
**Then** that file is reported as edited, and `harness-doctor` only shows its difference from the current template

#### AC-8.3: Tracked from then on

**Given** `harness-doctor` has handled each drift finding, refreshing the stale files the developer agreed to
**When** `doctor` runs again
**Then** every harness file is classified the way a file in a new install is, with no "edited" report for a file the developer never touched

## Scope

**In**

- A global CLI install as the documented path, with `npx` still working.
- `setup` in any folder outside a repository: today's behaviour at a git top-level, and skills plus runtime wiring with a next-step message in a folder that is in no repository. A subfolder of a repository is refused.
- `harness-init` choosing or recognising the layout with the developer. The harness home as parent of the code repository is the default, and existing layouts are kept.
- A recorded commit and PR convention for the code repository, which `code-commit` and `code-pr` follow.
- Runtime selection that detects installed agents and asks the developer to confirm. It covers Claude Code and the runtimes that read `AGENTS.md` and `.agents/` natively.
- Router and standing rules loaded in each selected runtime, and `validate` no longer passing on a plain-text mention.
- The `wolven-harness doctor` command, including the drift report that replaces `setup --check`, and the `harness-doctor` skill, including its refresh of unedited stale templates.
- Agents reporting an unavailable harness tool instead of silently routing around it.
- npm, yarn and pnpm as equal package managers, in every command the CLI prints and every command the skills and templates write. A folder with no `package.json` uses the global binary.
- Installs made by earlier versions, checked and refreshed like new ones.
- Copies of the standing rules kept in step with the rules they copy.

**Delivery**

The scope ships in two pull requests, and the second builds on the first:

1. **Wiring.** US-1 (`setup`'s side of AC-1.3), US-2 (AC-2.1 and AC-2.3), US-3, US-4 (AC-4.1, AC-4.3, and `validate`'s side of AC-4.2), and US-7 (AC-7.1 to AC-7.3).
2. **Check and repair.** US-5, US-6, US-8, AC-2.2, `doctor`'s side of AC-1.3, AC-4.2 and AC-4.4, and AC-7.4.

**Out**

- Several code repositories in one install ([deferral](../../deferrals/multi-repo-install/multi-repo-install-deferral.md)).
- A non-interactive `setup` for preinstalled machines ([deferral](../../deferrals/non-interactive-setup/non-interactive-setup-deferral.md)).
- An opt-out from `qmd`.
- Merging consumer edits with new templates.
- Renaming `code-review` or adding a chat-only mode to it.
- A `grilling` hand-off to `create-prd` or `code-spec`.
- A configurable docs root.

## Open questions

None. The supported runtimes and how each one loads the router and rules are answered in `docs/notes/runtime-instruction-loading/runtime-instruction-loading-note.md`.

## Handoff

After approval → `code-spec`, as `install-experience-iteration-1-spec.md`, then `code-plan`, as `install-experience-iteration-1-plan.md`. The iteration amends the spec for AC-1.6, AC-4.4, AC-5.1 and US-8, and for the delivery split. The successor contract ADR then covers what each pull request ships, so the first one does not record `doctor`. This PRD does not authorize implementation.

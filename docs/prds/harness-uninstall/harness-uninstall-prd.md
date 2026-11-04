---
type: prd
title: Harness uninstall and agentic removal
description: Add a wolven-harness uninstall CLI command that discovers, lists, and after confirmation removes harness installs across local repositories and nearby folders while preserving docs/, then offers to install a harness-remove skill into a chosen runtime for thorough agent-assisted cleanup.
status: stable
---

# Harness uninstall and agentic removal

## Problem

- **Who:** Anyone who has installed `wolven-harness` in one or more repositories, nearby folders, or global skill load paths and wants to remove it cleanly — whether to stop using the harness or to clear earlier installs before installing a new release.
- **Pain:** Earlier and current installs scatter harness files, runtime wiring, and entry-file edits across repositories (the current `.wolven-harness/` default and earlier in-repo roots), parent or sibling folders (`home` and `linked` layouts), and global skill directories (`~/.claude/skills/`, `~/.agents/skills/`), with no teardown command and no guided removal skill. Removing them by hand across multiple folders is tedious and risks either leaving stale harness artifacts behind or deleting authored `docs/` history.
- **Why now:** Clean removal across local repositories and nearby folders is a blocker for the next release, because existing installs must be removed before the new version is installed.
- **Evidence:**
  - `setup` is strictly create-only ([ADR-007](../../adrs/adr-007-quiet-install-contract.md)), so installing a newer release over an earlier install leaves obsolete files, rule copies, symlinks, hooks, and entry-file sections in place.
  - Installs span the current `.wolven-harness/` default home (a `linked` layout with `harnessHome: ".wolven-harness"`), earlier in-repo roots, parent `home` folders (`layout: "home"` with `codeRepo`), sibling or parent `linked` folders (`layout: "linked"` with `harnessHome`), standalone `skills` copies (project and global scopes), and shared files edited during `harness-init` (`AGENTS.md`, `package.json`, `.gitignore`, and CI workflows).

The terms **harness home**, **code repository** (`codeRepo`), **linked layout**, **runtime**, and **load path** keep their meanings from [ADR-007](../../adrs/adr-007-quiet-install-contract.md). This PRD introduces:

- **Local landscape:** the target folder (`--dir`, defaulting to the current working directory), its immediate parent, child or nested repositories beneath it, the default `.wolven-harness/` home and any `harnessHome` or `codeRepo` linked from discovered `.wolven-harness.json` files, and the global skill load paths (`~/.claude/skills/`, `~/.agents/skills/`).
- **`harness-remove`:** an ask-only skill that guides an agent and the Human through inspecting and removing remaining or intertwined harness edits that require judgment (such as `AGENTS.md` sections, CI jobs, or customized files), while preserving `docs/`.

## Goals

- **Discover and list every harness footprint across the local landscape before touching disk.** Success signal: running `wolven-harness uninstall` prints every discovered harness location and the items slated for removal (plus any preserved paths such as `docs/`) and exits without deleting anything when the user declines confirmation.
- **Remove deterministic harness installs in one confirmed CLI pass while preserving `docs/`.** Success signal: after the user confirms, `wolven-harness uninstall` removes the listed harness artifacts across the discovered locations, leaves every `docs/` directory and its contents byte-identical, and reports what was removed and what remains for agent-assisted cleanup.
- **Hand off seamlessly to agent-assisted thorough removal via `harness-remove`.** Success signal: at the end of `wolven-harness uninstall`, the CLI offers to install the `harness-remove` skill into a runtime of the user's choice; when the user accepts and picks a runtime, `harness-remove` is installed into that runtime's load path and the CLI prints the exact prompt or command to continue in that runtime.

**Non-goals**

- Deleting `docs/` (`docs/adrs/`, `docs/prds/`, `docs/specs/`, `docs/notes/`, `docs/deferrals/`, `docs/maps/`, or `docs/WRITING-PROFILE.md`) during CLI uninstall.
- Scanning the entire user home directory (`~`) recursively outside the global skill load paths.
- Unattended or silent deletion without listing discovered items and obtaining confirmation.
- Automatically rewriting arbitrary user-authored prose in `AGENTS.md` or CI workflows without Human review in `harness-remove`.

## User stories

### US-1: Discover and remove harness installs across the local landscape

**As a** developer who has installed `wolven-harness` in one or more projects,
**I want** `wolven-harness uninstall` to scan my local landscape, list every harness install it finds, and remove them after I confirm,
**so that** I can clear `wolven-harness` across my repositories and nearby folders in one predictable pass without losing `docs/`.

Traces to goal: Discover and list every harness footprint across the local landscape before touching disk; Remove deterministic harness installs in one confirmed CLI pass while preserving `docs/`.

#### AC-1.1: List discovered installs and remove on confirmation

**Given** a local landscape containing one or more `wolven-harness` installs across repositories, a parent or sibling `harnessHome`, or global skill load paths, along with authored files under `docs/`
**When** the user runs `wolven-harness uninstall` and confirms removal
**Then** the CLI lists every discovered location and the harness items found there before deleting anything, removes the confirmed harness artifacts, leaves all `docs/` directories intact, and prints a summary of what was removed

#### AC-1.2: Abort cleanly when confirmation is declined or cancelled

**Given** a local landscape containing one or more `wolven-harness` installs
**When** the user runs `wolven-harness uninstall` and answers no or cancels the confirmation prompt
**Then** no file, symlink, or configuration is modified or deleted anywhere on disk

#### AC-1.3: No harness install found in the local landscape

**Given** a target folder whose local landscape and global skill load paths hold no `wolven-harness` artifacts
**When** the user runs `wolven-harness uninstall`
**Then** the CLI reports that no `wolven-harness` install was found, prompts for no deletion, writes nothing, and exits 0

### US-2: Offer and install `harness-remove` into a runtime of choice

**As a** developer finishing the CLI uninstall pass (or wanting an agent-assisted deep cleanup),
**I want** the CLI to suggest the `harness-remove` skill and, if I accept, install it directly into the runtime I choose,
**so that** I can immediately open my agent and complete a thorough removal of any remaining harness wiring or shared-file edits.

Traces to goal: Hand off seamlessly to agent-assisted thorough removal via `harness-remove`.

#### AC-2.1: User accepts `harness-remove` and selects a runtime

**Given** `wolven-harness uninstall` has finished its removal pass (or reported remaining intertwined items) and suggests installing `harness-remove`
**When** the user answers yes and selects a target runtime
**Then** the CLI installs only the `harness-remove` skill into that runtime's load path and prints how to invoke `harness-remove` in that runtime to continue

#### AC-2.2: User declines installing `harness-remove`

**Given** `wolven-harness uninstall` suggests installing `harness-remove`
**When** the user answers no
**Then** the CLI installs no skill files, exits 0, and leaves the completed CLI uninstall state untouched

### US-3: Run `harness-remove` for agent-assisted thorough removal

**As a** developer with `harness-remove` installed in my chosen runtime,
**I want** the skill to guide my agent through finding and removing remaining harness traces (such as `AGENTS.md` sections, `package.json` references, `.gitignore` rules, hooks, or CI steps) and cleaning up `harness-remove` itself at the end,
**so that** my repositories and nearby folders are completely free of harness leftovers while keeping `docs/` and my own project configuration safe.

Traces to goal: Hand off seamlessly to agent-assisted thorough removal via `harness-remove`.

#### AC-3.1: Guided cleanup of intertwined harness edits

**Given** a project or local landscape where shared files (such as `AGENTS.md`, `package.json`, `.gitignore`, runtime config files, or CI workflows) still hold harness sections or references
**When** the user invokes `harness-remove` in their agent runtime
**Then** the agent inspects the landscape, shows each proposed edit or file deletion to the Human for confirmation before applying it, preserves `docs/`, and offers to remove the `harness-remove` skill folder itself as the final step

#### AC-3.2: Declined edit or ambiguous shared file

**Given** `harness-remove` finds a shared file where harness content is mixed with user content or the user declines a proposed change
**When** the user says no to that change
**Then** the agent leaves that file untouched, records it as kept in the closing summary, and continues through the remaining items

## Scope

**In**

- A `wolven-harness uninstall` CLI command that scans the local landscape (`--dir`, immediate parent, child/nested repos, linked `harnessHome` / `codeRepo` paths, and global skill load paths), lists discovered harness artifacts, and removes them after confirmation while preserving `docs/`.
- Prompting at the end of `wolven-harness uninstall` to suggest `harness-remove`, and on confirmation installing `harness-remove` into the user's chosen runtime.
- The `harness-remove` skill template for agent-assisted thorough removal of remaining harness edits and self-cleanup once finished.

**Out**

- Removing `docs/` or any profile documents inside it.
- Uninstalling global binaries (`wolven-harness` or `qmd`) from the system package manager automatically.
- Modifying git history or creating automatic commits during CLI uninstall.

## Open questions

- Exact boundary between which shared-file edits (such as marked `<!-- wolven-harness:start -->` blocks in `AGENTS.md` or `harness:*` scripts in `package.json`) the deterministic CLI removes directly versus hands off to `harness-remove` — owner: Rafael (to settle in `code-spec`).

## Handoff

After approval → `code-spec`. This PRD does not authorize implementation.

---
type: prd
title: Review the README and guide for the 0.4.0 release
description: Correct the README, the eight Guide pages and the CLI help so a first-time installer reads what 0.4.0 actually does, before the release merges.
status: stable
---

# Review the README and guide for the 0.4.0 release

## Problem

- **Who:** A developer installing the harness for the first time on 0.4.0, who follows the README, the site's Guide pages and `wolven-harness --help`.
- **Pain:** Those texts diverge from what 0.4.0 does, so the first contact with the product names the wrong skills, rules and setup output.
- **Why now:** [Release PR 86](https://github.com/WolvenTech/wolven-harness/pull/86) is open and mergeable. It carries the quiet-install breaking change plus `doctor`, `uninstall`, nine runtimes and the secret-path guard. The npm package ships the README, so a README fix made after the merge waits for the next release.
- **Evidence:** Checked on `main` at `7275eef`:
  - The README `core` row lists nine skills; `CORE_SKILLS` in `src/setup/skill-sets.ts` holds eleven, adding `harness-doctor` and `harness-remove`.
  - The README never mentions `uninstall`, which is a CLI command.
  - `site/layout.md` names three standing rules and `site/install.md` says four rule bodies; `templates/.agents/rules/` holds five.
  - `--help` says `setup` scaffolds `WOLVEN.md`; `site/commands.md` says only a full install writes it, and a quiet install is the default at a repository root.

## Goals

- Every factual claim in the reviewed texts matches 0.4.0 — success signal: each command, flag, skill, rule and path they name is checked against `src/` and `templates/`, and no mismatch is left open.
- A first-time installer gets through the README quickstart unaided — success signal: its steps, run in a clean Git repository with a build of `main` through `harness-init` and the first QMD index build, leave an install that `wolven-harness doctor` reports no errors on.
- 0.4.0 does not publish with known drift — success signal: the corrections merge before [release PR 86](https://github.com/WolvenTech/wolven-harness/pull/86).

**Non-goals**

- An upgrade guide from 0.3.x. The release changelog covers the breaking change, in line with the [cancelled upgrade guide](../archived/consumer-upgrade-guide/consumer-upgrade-guide-prd.md).
- Rewriting the product positioning or restructuring the onboarding path.
- An automated check that catches future drift.

## User stories

### US-1: Install from the README

**As a** first-time installer,
**I want** the README to describe what 0.4.0 installs and how to run it,
**so that** I reach `harness-init` without guessing.

Traces to goal: A first-time installer gets through the README quickstart unaided

#### AC-1.1: The quickstart works as written

**Given** a clean Git repository and a build of `main`
**When** the installer runs the README's steps in order, through `harness-init` and the first QMD index build
**Then** each step behaves as the README says, and `wolven-harness doctor` reports no errors

#### AC-1.2: The skill sets match what is installed

**Given** the README's skill set table
**When** it is compared with `CORE_SKILLS` and `SET_SKILLS`
**Then** every set lists exactly the skills that ship in it, including `harness-doctor` and `harness-remove`

#### AC-1.3: A step fails in a clean repository

**Given** a README step that does not behave as written
**When** the quickstart is run
**Then** the README is corrected and the quickstart is run again from the start until it passes

### US-2: Look things up in the Guide

**As a** first-time installer,
**I want** the Guide pages to agree with the CLI and the installed files,
**so that** what I read about a command, skill or path holds in my repository.

Traces to goal: Every factual claim in the reviewed texts matches 0.4.0

#### AC-2.1: Every named item exists as described

**Given** the eight Guide pages: Overview, Installation, Development workflow, Search, Files and validation, Skills, Agent runtimes and CLI reference
**When** each command, flag, skill, rule and path they name is checked against `src/` and `templates/`
**Then** every one exists and behaves as the page says

#### AC-2.2: Quiet and full installs are told apart

**Given** a Guide page that describes setup output
**When** the behaviour differs between a quiet and a full install
**Then** the page says which install it describes

#### AC-2.3: The text is right and the code is wrong

**Given** a mismatch where the text states the intended behaviour and the code is the defect
**When** the review reaches it
**Then** the text is not changed to document the defect, and the defect is reported to the Human, who decides whether it holds the release

#### AC-2.4: The text speaks to the reader

**Given** a sentence in the README or a Guide page that a first-time installer reads
**When** it uses a term from inside this project, such as "the Human" or "wired", or a harness term the page has not explained
**Then** it is reworded in the reader's words or explained at first use, and the exact names of commands, flags, finding codes and config keys stay as they are

### US-3: Read the CLI help

**As a** first-time installer,
**I want** `wolven-harness --help` to agree with the docs,
**so that** the terminal does not contradict the guide.

Traces to goal: Every factual claim in the reviewed texts matches 0.4.0

#### AC-3.1: Help describes the default install

**Given** the `--help` output
**When** it is read beside the CLI reference page
**Then** each command's summary matches the page, and `setup` does not imply that the default install writes `WOLVEN.md`

#### AC-3.2: Only wording changes

**Given** the corrected help text
**When** the CLI runs
**Then** commands, flags and exit codes behave as they did before

### US-4: Release with confidence

**As a** maintainer cutting 0.4.0,
**I want** the corrections to land in one reviewable change before the release,
**so that** I can merge the release knowing what was checked.

Traces to goal: 0.4.0 does not publish with known drift

#### AC-4.1: One change lands first

**Given** the review is complete
**When** the corrections are proposed
**Then** they arrive as a single pull request that lists what was checked, and it merges before [release PR 86](https://github.com/WolvenTech/wolven-harness/pull/86)

#### AC-4.2: The site still builds

**Given** the corrected Guide pages
**When** `pnpm docs:build` runs
**Then** it passes, and every link in the README and the Guide resolves

#### AC-4.3: The review is not finished

**Given** a mismatch still open, or a defect the Human chose to hold the release for
**When** the release is ready to merge
**Then** [release PR 86](https://github.com/WolvenTech/wolven-harness/pull/86) stays unmerged until it is resolved

## Scope

**In**

- `README.md`.
- The eight Guide pages under `site/`.
- The summaries in `wolven-harness --help`.

**Out**

- The Project pages, `site/release.md` and `site/contributing.md`.
- `AGENTS.md`, `CONTRIBUTING.md`, the `SKILL.md` files and other shipped templates.
- Any change to CLI behaviour.
- Everything listed under Non-goals.

## Open questions

- The corrected Guide pages reach the live site when they merge to `main`, ahead of the npm publish, so the site describes 0.4.0 while npm still serves 0.3.2. Is a short gap acceptable, or should the two merges happen back to back? — owner: Rafael

## Handoff

After approval → `code-spec`. This PRD does not authorize implementation.

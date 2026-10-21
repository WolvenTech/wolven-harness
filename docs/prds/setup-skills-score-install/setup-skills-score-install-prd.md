---
type: prd
title: Setup Skills Update and Package Manager Aware Harness Score Installation
description: Ensure recent skills (journey-map, wayfinder) are bundled and scaffolded by setup, and tailor harness-score installation guidance to the project's detected package manager.
status: draft
---

# Setup Skills Update and Package Manager Aware Harness Score Installation

> *Note: grilling did not run — drafted from issue #65 and repository context per batch request to open a draft PRD review PR.*

## Problem

- **Who:** Developers and repository maintainers running `wolven-harness setup` to scaffold or update an agent harness in consumer repositories.
- **Pain:** When running `wolven-harness setup`, recent skills (`journey-map` and `wayfinder`) are not scaffolded into consumer repositories unless the optional `discovery` skill set is explicitly enabled (and `wayfinder` is omitted from the discovery prompt description in `options.ts`). Additionally, while setup provisions `"harness:score": "harness-score"` in `package.json#scripts`, `harness-score` is not installed automatically, and setup's warning hardcodes `pnpm add -D -E harness-score@1.6.5`. In npm-managed repositories, running `npm add` in projects with pnpm symlinks crashes npm's arborist with `TypeError: Cannot read properties of null (reading 'matches')`, and in projects using npm, yarn, or bun, recommending `pnpm` fails when pnpm is not installed.
- **Why now:** `journey-map` (#58) and `wayfinder` (#57) recently landed in the repository, and consumers running default setup expect recent decision-charting and flow-mapping skills to be available. Furthermore, developers adopting `wolven-harness` across diverse JavaScript/TypeScript package managers (npm, pnpm, yarn, bun) encounter broken guidance immediately after running setup.
- **Evidence:** Issue [#65](https://github.com/WolvenTech/wolven-harness/issues/65); `src/setup/harness-score.ts` line 32 hardcoding `pnpm add -D -E ${HARNESS_SCORE}@${HARNESS_SCORE_VERSION}`; `src/setup/own-package.ts` lines 66, 69 hardcoding `pnpm`; `src/setup/index.ts` lines 36-37 hardcoding `pnpm`; `src/setup/options.ts` line 296 omitting `wayfinder` from the discovery label; and npm arborist crash reports on mixed lockfile/symlink environments.

## Goals

- Ensure `journey-map` and `wayfinder` are reliably bundled, cataloged, and scaffolded into target repositories by `wolven-harness setup` — success signal: running setup (under the decided skill set configuration) scaffolds `journey-map` and `wayfinder` under `.agents/skills/` with all supporting renderer files, scripts, and prompt descriptions accurate.
- Detect the active project package manager (npm, pnpm, yarn, bun) from repository lockfiles — success signal: a shared detection helper returns the correct package manager when `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, or `bun.lock`/`bun.lockb` is present.
- Provide tailored, executable `harness-score@1.6.5` installation commands based on the detected package manager — success signal: running setup in a project with `pnpm-lock.yaml` outputs `pnpm add -D -E harness-score@1.6.5`, with `package-lock.json` outputs `npm add -D -E harness-score@1.6.5`, with `yarn.lock` outputs `yarn add -D -E harness-score@1.6.5`, and with `bun.lock` outputs `bun add -d -e harness-score@1.6.5`.
- Align setup summary warnings and next steps with the detected package manager — success signal: `devDependencyWarning`, `harnessScoreWarning`, and `nextSteps` in setup output format their commands using the project's detected package manager.

**Non-goals**

- Automatically executing package manager install commands or mutating dependencies without explicit user invocation (preserving ADR-004's guarantee: "It never adds or edits a dependency. When harness-score is missing from package.json, it prints the install command instead.").
- Managing non-JavaScript package managers or system package managers (e.g. brew, apt, pip).
- Modifying `harness-score` rules or scoring criteria.

## User stories

### US-1: Scaffolding recent skills in setup bundle (`journey-map`, `wayfinder`)

**As a** repository maintainer running `wolven-harness setup`,
**I want** recent skills such as `journey-map` and `wayfinder` to be bundled, surfaced, and scaffolded into my repository,
**so that** my agent harness includes the latest workflow mapping and decision charting capabilities.

Traces to goal: Ensure `journey-map` and `wayfinder` are reliably bundled, cataloged, and scaffolded into target repositories by `wolven-harness setup`

#### AC-1.1: Scaffolding includes journey-map and wayfinder

**Given** a repository where `wolven-harness setup` is run with the skill set that owns them (or default setup if promoted to core)
**When** setup finishes copying templates
**Then** `.agents/skills/journey-map` and `.agents/skills/wayfinder` exist in the target repo with their `SKILL.md`, references, scripts, and renderer files intact.

#### AC-1.2: Discovery prompt label includes wayfinder

**Given** an interactive terminal running `wolven-harness setup` prompting for extra skill sets
**When** the skill set multiselect prompt appears
**Then** the `discovery` option label includes `wayfinder` alongside `PRD, prototype, handoff, fool, jury, journey map`.

### US-2: Project package manager detection

**As a** developer running `wolven-harness setup` across repositories using different package managers,
**I want** setup to inspect root lockfiles and detect whether the project uses npm, pnpm, yarn, or bun,
**so that** any suggested commands and warnings use the correct tool syntax.

Traces to goal: Detect the active project package manager (npm, pnpm, yarn, bun) from repository lockfiles

#### AC-2.1: Lockfile detection precedence

**Given** a repository root containing a package lockfile
**When** package manager detection runs
**Then** it resolves `pnpm` if `pnpm-lock.yaml` is present, `yarn` if `yarn.lock` is present, `bun` if `bun.lock` or `bun.lockb` is present, and `npm` if `package-lock.json` is present.

#### AC-2.2: Fallback when lockfile is absent

**Given** a repository with `package.json` but no lockfile
**When** package manager detection runs
**Then** it returns the default fallback package manager (npm) without throwing or halting setup.

### US-3: Package manager aware harness-score installation guidance

**As a** developer running `wolven-harness setup` on a project where `harness-score` is not yet installed,
**I want** setup warnings and next steps to provide the exact installation command for my detected package manager,
**so that** I can install `harness-score@1.6.5` without command failure or arborist symlink conflicts.

Traces to goal: Provide tailored, executable `harness-score@1.6.5` installation commands based on the detected package manager

#### AC-3.1: Tailored missing harness-score warning

**Given** a target repository with a `package.json` whose `harness:score` script calls `harness-score`, but `harness-score` is not in `dependencies` or `devDependencies`
**When** setup completes and displays warnings
**Then** the warning provides the exact command for the detected package manager (e.g. `pnpm add -D -E harness-score@1.6.5` for pnpm, `npm add -D -E harness-score@1.6.5` for npm, `yarn add -D -E harness-score@1.6.5` for yarn, `bun add -d -e harness-score@1.6.5` for bun).

#### AC-3.2: Package manager aware setup next steps and devDependency warning

**Given** setup finishes in a target repository with a detected package manager
**When** setup renders `ui.nextSteps` and `devDependencyWarning`
**Then** the printed validation and execution commands reflect the detected package manager (`npm run harness:validate`, `pnpm harness:validate`, `yarn harness:validate`, or `bun run harness:validate`).

## Scope

**In**

- Package manager detection helper under `src/setup/` identifying `npm`, `pnpm`, `yarn`, and `bun` via repository lockfiles (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lock`, `bun.lockb`).
- Update `harnessScoreWarning` (`src/setup/harness-score.ts`) to format the install command with the detected package manager.
- Update `devDependencyWarning` (`src/setup/own-package.ts`) to format the install command with the detected package manager.
- Update `nextSteps` (`src/setup/index.ts`) to format validation and scoring command suggestions with the detected package manager.
- Update `src/setup/options.ts` prompt label to include `wayfinder` in the discovery set description.
- Settle whether `journey-map` and `wayfinder` are promoted to `CORE_SKILLS` or remain in `discovery` with improved scaffolding visibility.
- Add unit and fixture tests in `test/` proving package manager detection and command rendering.

**Out**

- Running package manager installs automatically during setup.
- Non-JavaScript package managers (Cargo, Pip, Poetry, Go modules).
- Altering the contract or rules of `harness-score`.
- Changes to Git host detection or agent runtime wiring.

## Open questions

- Should `journey-map` and `wayfinder` be promoted to `CORE_SKILLS` (scaffolded unconditionally in all repositories during setup), or remain in `discovery` (requiring discovery set opt-in)? — owner: Human (repo maintainer).
- What should the default fallback package manager be when a `package.json` exists without any lockfile (`npm` vs `pnpm`)? — owner: Human (repo maintainer).
- Should setup offer an interactive confirmation prompt on TTY (`Install harness-score now with <detected_pm>?`), or strictly adhere to ADR-004's passive warning convention? — owner: Human (repo maintainer).

## Handoff

After approval → `code-spec`. This PRD does not authorize implementation.

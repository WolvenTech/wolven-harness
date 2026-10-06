---
type: prd
title: Plain-Language Questions for Harness Init
description: Requires harness-init interactive questions to lead with plain-language explanations of repository needs and impacts rather than check codes or acronyms.
status: stable
---

# Plain-Language Questions for Harness Init

## Problem

- **Who:** Developers and agents running `harness-init` on a repository.
- **Pain:** Prompts lead with check IDs and acronyms (such as `SKL-03`, `SNS-01`, `HYG-02`, `AGT-01`, `CI-01`) that obscure what is actually missing, hide why checks failed, and conceal the maturity level cost of dropping checks.
- **Why now:** Real dogfood runs showed that leading with acronyms hides the real failure reason (e.g., test script naming differences) and causes users to make ill-informed drop decisions that unexpectedly cap their harness maturity level.
- **Evidence:** Issue #48 and dogfood session logs from 2026-10-06.

## Goals

- All interactive prompts in `harness-init` lead with plain language describing repository capability and concrete impact. — success signal: No question begins with a check code or acronym; codes appear only as secondary reference notes.
- Score-gap questions explain non-obvious failure causes and state maturity level consequences. — success signal: Prompts offering to drop checks or dimensions state any resulting maturity level caps (e.g., dropping CI caps level at L2).
- Consistent plain-language guidance across Hard gates, entry modes, ADR status mappings, and validate wiring. — success signal: Every interactive question reference document explicitly mandates plain-language framing and explains practical choices.

**Non-goals**

- Modifying the `harness-score` CLI tool or altering its check definitions.
- Automatically implementing score gaps or authoring missing scripts during `harness-init`.
- Removing check IDs from `.harness-score.json` configuration syntax or rule keys.

## User stories

### US-1: Plain-language scoring decisions

**As a** developer running `harness-init`,
**I want** scoring questions to describe what the repo lacks in plain English and explain what dropping each check costs,
**so that** I can make informed choices about keeping or dropping checks without decoding check acronyms.

Traces to goal: All interactive prompts in `harness-init` lead with plain language describing repository capability and concrete impact.

#### AC-1.1: Missing capability leads prompt

**Given** one or more scoring checks have failed in a dimension
**When** the agent asks whether to keep or drop the checks
**Then** the prompt opens by explaining the missing repository capability in plain language, with check IDs listed parenthetically as supporting references.

#### AC-1.2: Failure cause is non-obvious

**Given** a check fails due to an unexpected detail (e.g., `SNS-01` failing because scripts exist as `deck:test` rather than `test`)
**When** the agent presents the question
**Then** it explains the exact reason for the failure rather than quoting generic rule text.

#### AC-1.3: Dropping checks caps maturity level

**Given** dropping a check or dimension prevents reaching a higher maturity level (e.g., dropping CI caps level at L2 because L3 requires CI ≥ 50%)
**When** the agent presents the option to drop
**Then** it spells out the specific maturity cap before asking for confirmation.

### US-2: Plain-language entry mode and wiring choices

**As a** repository maintainer integrating the harness,
**I want** entry mode and validate wiring prompts to explain how instructions and validation will work,
**so that** I understand the architectural workflow impact of each option.

Traces to goal: Consistent plain-language guidance across Hard gates, entry modes, ADR status mappings, and validate wiring.

#### AC-2.1: Entry mode selection

**Given** `WOLVEN.md` needs integration into `AGENTS.md`
**When** the agent prompts for entry mode
**Then** it explains in plain language what each mode (full, light, mention-only) does to instruction structure, presenting the recommended option first.

#### AC-2.2: Validate wiring selection

**Given** validation must be configured in step 6
**When** the agent prompts for validate wiring
**Then** it explains the practical operational difference between PR automation, local script chaining, and manual runs.

### US-3: Plain-language ADR status mapping

**As a** maintainer migrating legacy decision records,
**I want** ambiguous ADR status prompts to describe the architectural decision and caller impact,
**so that** I can determine whether the decision is superseded or obsolete without guessing.

Traces to goal: Consistent plain-language guidance across Hard gates, entry modes, ADR status mappings, and validate wiring.

#### AC-3.1: Ambiguous status question

**Given** a legacy ADR has an ambiguous status or superseded text without a clear successor
**When** the agent asks how to map its status
**Then** it describes what the decision was about and what choosing each status means for code claims, with the ADR number as supporting reference.

## Scope

**In**

- Updating `harness-init` `SKILL.md` Hard gates (Rule 2) and Step 6 scoring text.
- Updating references: `harness-score.md`, `entry-modes.md`, `adr-migration.md`, and `validate-wiring.md`.
- Synchronizing template copies under `templates/.agents/skills/harness-init/`.
- Adding test coverage in `test/skill-harness-init.test.ts` and `test/harness-init-migration.test.ts`.

**Out**

- Modifying `harness-score` itself or creating new score checks.
- Changing the behavior or options of the underlying CLI commands.
- Auto-fixing repository gaps during the init wizard.

## Open questions

- None — owner: None

## Handoff

After approval → `code-spec`. This PRD does not authorize implementation.

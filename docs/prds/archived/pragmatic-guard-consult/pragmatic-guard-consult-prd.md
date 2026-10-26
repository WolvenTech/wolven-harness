---
type: prd
title: Pragmatic-guard consult alignment
description: Align pragmatic-guard consultation in ship skills by removing mandatory negative boilerplate and scoping consults to pertinent work.
status: deprecated
---

# Pragmatic-guard consult alignment

## Problem

- **Who:** Developers and agents running ship workflow skills (`code-commit`, `code-pr`, `code-review`, `code-ci`).
- **Pain:** Ship skills automatically mandate inserting `pragmatic-guard was not consulted` into commit messages, PR descriptions, and replies when `pragmatic-guard` is absent from the runtime session skill list, even when it was already consulted in an earlier step (such as spec or plan) or when the specific action introduces no new scope to evaluate. This pollutes durable git history with false claims of omitted due diligence.
- **Why now:** Direct friction observed in PR #54 and PR #60, tracked in issue #55, and clarified by repository maintainers: requiring the negative boilerplate by default is the flaw.
- **Evidence:** Issue [#55](https://github.com/WolvenTech/wolven-harness/issues/55), PR [#54](https://github.com/WolvenTech/wolven-harness/pull/54) description, and maintainer commentary on issue #55.

## Goals

- Eliminate mandatory negative boilerplate — success signal: `code-commit`, `code-pr`, `code-review`, and `code-ci` execute without requiring the sentence `pragmatic-guard was not consulted` in commit messages, pull request bodies, or agent replies when the guard is absent from the session catalogue.
- Scope-pertinent consult without false assertions — success signal: skills consult `pragmatic-guard` when relevant to their immediate operational scope, and durable text reflects actual evidence rather than emitting either false positive claims that the guard ran or mandatory negative claims when it did not.

**Non-goals**

- No new session-tracking framework, runtime hook system, or persistent state machine to track prior consult history across process boundaries.
- No mandatory requirement making `pragmatic-guard` consultation universal across all skills.
- No automatic installation or package dependency additions.

## User stories

### US-1: Clean commits and PRs without negative boilerplate

**As a** developer or agent running `code-commit` or `code-pr`,
**I want** to record commits and submit pull requests without forced negative boilerplate about `pragmatic-guard`,
**so that** git history and PR bodies accurately represent the work performed without misleading claims of missed guard checks.

Traces to goal: Eliminate mandatory negative boilerplate

#### AC-1.1: Absent guard creates clean durable text

**Given** `pragmatic-guard` is absent from the runtime session skill list
**When** `code-commit` or `code-pr` runs to record or publish validated work
**Then** the commit message, pull request body, and reply are generated without inserting `pragmatic-guard was not consulted`.

#### AC-1.2: No false positive claim of execution

**Given** `pragmatic-guard` was not consulted for the current execution scope
**When** `code-commit` or `code-pr` writes durable text
**Then** the output contains no statement claiming the guard was executed or applied.

### US-2: Pertinent consult when scope demands evaluation

**As a** developer or agent running a workflow skill where new scope or architectural complexity is introduced,
**I want** `pragmatic-guard` consulted when present in the session,
**so that** strict YAGNI is evaluated where relevant.

Traces to goal: Scope-pertinent consult without false assertions

#### AC-2.1: Consult when pertinent and loaded

**Given** `pragmatic-guard` is on the session skill list and the immediate action introduces new scope or complexity
**When** the skill runs
**Then** it consults `pragmatic-guard` and applies its verdict.

#### AC-2.2: Consistent evidence across artifacts

**Given** a skill execution step completes
**When** durable output is produced (commit, PR description, or review finding)
**Then** the text reports only factual evidence consistent with what actually executed in that scope.

## Scope

**In**

- Update contract and instruction text in `templates/.agents/skills/{code-commit,code-pr,code-review,code-ci}/SKILL.md`.
- Mirror updates to repository copies in `.agents/skills/{code-commit,code-pr,code-review,code-ci}/SKILL.md`.
- Update test assertions in `test/skill-code-pr.test.ts`, `test/skill-code-ci.test.ts`, and `test/skill-code-review.test.ts`.

**Out**

- Changes to `pragmatic-guard`'s internal evaluation rules or scoring mechanism.
- Modifying other core skills that do not enforce the negative boilerplate.
- Adding tracking daemon, database, or runtime state persistence.

## Open questions

- None — settled in issue #55 maintainer clarification and grilling round.

## Handoff

After approval → `code-spec`. This PRD does not authorize implementation.

---
type: prd
title: QMD Empty Index Handling in Fresh Worktrees
description: Ensure agents in fresh worktrees or newly initialized repos can detect and repair an unpopulated QMD index so qmd-first reliably searches local architecture decisions.
status: draft
---

# QMD Empty Index Handling in Fresh Worktrees

> *Note: grilling did not run — drafted from issue #68 and repository context per batch request to open a draft PRD review PR.*

## Problem

- **Who:** AI agents and developers operating in fresh Git worktrees (such as Cursor worktrees) or clean repository checkouts in both this repository and consumer repositories with the harness installed.
- **Pain:** In a fresh worktree, `.qmd/index.yml` and the QMD CLI exist, but `.qmd/index.sqlite` is gitignored (`.qmd/.gitignore` ignores `index.sqlite*`) and starts with zero indexed documents. When an agent obeys the standing rule `qmd-first` (`.agents/rules/qmd-first.md`) and queries architecture decisions (`qmd query -c adrs`), it receives zero hits. Because `.agents/skills/qmd/SKILL.md` labels running `qmd update` / `qmd embed` unasked as an anti-pattern ("outside a setup or maintenance ask"), the agent stops searching, concludes no decisions exist, and answers from memory or the web, risking decision drift and rule violations.
- **Why now:** Git worktrees (including Cursor's background agent worktrees) are increasingly the default working environment. Every fresh worktree starts with a blank SQLite database. Without a mechanism for agents to detect and repair an unpopulated index, the `qmd-first` rule is ineffective on the first turn in any new worktree.
- **Evidence:** Issue [#68](https://github.com/WolvenTech/wolven-harness/issues/68) observed on branch `cursor/40f8092f`; `sqlite3 .qmd/index.sqlite 'SELECT COUNT(*) FROM documents;'` returned 0 despite 5 profile ADRs existing under `docs/adrs/`; `templates/.qmd/gitignore` gitignores `index.sqlite*`; `.agents/skills/qmd/SKILL.md` lines 132-134 and line 152 explicitly classify running `qmd update` outside a setup/maintenance ask as an anti-pattern.

## Goals

- Authorize and guide agents to detect an unpopulated QMD index and self-repair via `qmd update` — success signal: in a worktree with documents on disk but 0 indexed documents, an agent running `qmd-first` checks index readiness, runs `qmd update`, and retrieves matching decision records (e.g. ADR-000, ADR-001) instead of reporting false-negative zero results.
- Distinguish between unprovoked index mutation and necessary unpopulated-index bootstrapping — success signal: `.agents/skills/qmd/SKILL.md` anti-pattern text specifically targets mutating already-populated indexes unasked, while explicitly allowing index initialization when document count is zero.
- Keep standing rule and skill guidance aligned across package templates — success signal: `templates/.agents/rules/qmd-first.md` and `templates/.agents/skills/qmd/SKILL.md` contain identical empty-index recovery instructions so consumer repositories receive the fix upon running `setup`.
- Maintain full compatibility with Cloud Agent bootstrap and CI workflows — success signal: `.cursor/install.sh` and headless environments continue to run `qmd update` and `qmd embed` without error or duplicate indexing steps.

**Non-goals**

- Committing `index.sqlite` to Git (it remains gitignored per ADR-004 to avoid binary churn and merge conflicts).
- Requiring `qmd embed` (vector embeddings) during initial repair (fast lexical indexing via `qmd update` takes seconds and satisfies BM25 search without blocking on model downloads).
- Modifying the upstream `@tobilu/qmd` CLI tool.

## User stories

### US-1: Agent self-repair of an empty QMD index

**As an** AI agent answering a question under the `qmd-first` standing rule,
**I want** to detect when the local QMD index has zero documents and run `qmd update` to build it,
**so that** I search actual stored repository decisions instead of falsely concluding none exist.

Traces to goal: Authorize and guide agents to detect an unpopulated QMD index and self-repair via `qmd update`

#### AC-1.1: Empty index detection and update

**Given** a repository with `.qmd/index.yml` and documents under `docs/`, but `.qmd/index.sqlite` contains 0 indexed documents
**When** the agent invokes `qmd` under the `qmd-first` rule
**Then** the agent detects the unpopulated index state, executes `qmd update` to index declared collections, and proceeds with `qmd query -c adrs "<question>"` returning matching documents.

#### AC-1.2: Populated index is queried without mutation

**Given** a repository with a populated QMD index (`qmd status` shows indexed files > 0)
**When** the agent invokes `qmd query` or `qmd search`
**Then** it executes the query directly without running `qmd update` or `qmd embed`.

### US-2: Harmonized rule and skill contract

**As a** developer or harness author inspecting `.agents/rules/` and `.agents/skills/`,
**I want** `qmd-first.md` and `qmd/SKILL.md` to clearly define when index building is allowed,
**so that** agents are not constrained by contradictory instructions when encountering a fresh worktree.

Traces to goal: Distinguish between unprovoked index mutation and necessary unpopulated-index bootstrapping

#### AC-2.1: Skill anti-pattern refinement

**Given** `.agents/skills/qmd/SKILL.md` and `templates/.agents/skills/qmd/SKILL.md`
**When** inspecting the Anti-patterns and Setup sections
**Then** the text clarifies that `qmd update` is permitted when the local index is empty/missing, while prohibiting unasked updates on an already-populated index during routine queries.

#### AC-2.2: Standing rule guidance

**Given** `.agents/rules/qmd-first.md` and `templates/.agents/rules/qmd-first.md`
**When** an agent reads the search procedure
**Then** it includes a step to verify index readiness (or run `qmd update` if 0 documents are indexed) before concluding that no decision records exist.

### US-3: Worktree documentation and bootstrap ergonomics

**As a** contributor creating fresh worktrees in Cursor or terminal,
**I want** documentation and setup guidance to describe how QMD behaves in worktrees,
**so that** both humans and agent harnesses know how the local index lifecycle operates.

Traces to goal: Maintain full compatibility with Cloud Agent bootstrap and CI workflows

#### AC-3.1: Documentation update

**Given** `site/search.md` and `CONTRIBUTING.md`
**When** a contributor reads the QMD search documentation
**Then** the text explains that fresh git worktrees do not share the gitignored SQLite index, and notes that running `qmd update` or letting the agent self-repair is the intended workflow.

#### AC-3.2: Cloud Agent bootstrap untouched

**Given** `.cursor/install.sh` and `.cursor/environment.json`
**When** Cloud Agents spin up
**Then** the existing `qmd update` and `qmd embed` sequence continues to run cleanly.

## Scope

**In**

- Update `.agents/rules/qmd-first.md` and `templates/.agents/rules/qmd-first.md` to specify empty index detection and `qmd update` authorization.
- Update `.agents/skills/qmd/SKILL.md` and `templates/.agents/skills/qmd/SKILL.md` to refine anti-patterns and setup instructions around empty-index recovery.
- Update `site/search.md` and `CONTRIBUTING.md` to document worktree index lifecycle.
- Update unit tests under `test/` asserting skill and template text invariants.

**Out**

- Committing `.qmd/index.sqlite` or any SQLite binary to version control.
- Automatically running `qmd embed` on unpopulated worktrees without explicit request (embedding remains optional/deferred due to compute time).
- Adding background daemons or file watchers to maintain the index.

## Open questions

- Should empty index detection rely on `qmd status` output (parsing document count), a fast SQLite query, or catching an empty search response and checking if files exist on disk? — owner: Human (repo maintainer).
- Should `qmd update` be run automatically on worktree creation via an automated hook or git worktree script if one exists, or is agent-level self-repair in `qmd-first` sufficient? — owner: Human (repo maintainer).
- Should `harness-init` step 0 also check and offer `qmd update` if it detects an empty index during repo initialization? — owner: Human (repo maintainer).

## Handoff

After approval → `code-spec`. This PRD does not authorize implementation.

---
type: prd
title: Lean harness-init path for thin repos
description: A fresh or mostly empty repo finishes harness-init on a lean path that names what it defers and still proposes skills.
status: deprecated
source_issue: https://github.com/WolvenTech/wolven-harness/issues/30
---

# Lean harness-init path for thin repos

## Problem

- **Who:** Developers who start `harness-init` in a new or mostly empty repository and want to reach first useful work (a first PRD, spec, or build).
- **Pain:** `harness-init` takes a fresh repo through deep discovery, optional research, score-gap questions, and validation wiring before work can begin, and many of those questions have little evidence to answer yet.
- **Why now:** An empty repo is the first impression of the harness, and the lean half was split out of a combined attempt so it can ship on its own.
- **Evidence:** [Issue #30](https://github.com/WolvenTech/wolven-harness/issues/30) (the example is an empty repo for sales proposal decks); the steps in `templates/.agents/skills/harness-init/SKILL.md`.

## Goals

- G1: A fresh repo finishes a lean `harness-init` run that uses the evidence already present, captures the immediate goal, and defers deeper discovery, without mandatory deep research or a question for every score gap — success signal: the lean-path walkthrough completes and leaves an entry guide and a session note that records the chosen and deferred steps.
- G2: Whenever the agent proposes to skip or defer a step, the user sees that step named, with why and what work remains, before the run proceeds, and the final record keeps those choices — success signal: the session note lists each deferred or skipped step with its reason and remaining work.
- G3: Skill proposals always run on the lean path, grounded in the stated goal and available references, or in an explicit thin-evidence basis — success signal: the lean-path docs and tests show proposals even when the repo has no application files.

**Non-goals**

- Installing one skill without its skill set (issue [#31](https://github.com/WolvenTech/wolven-harness/issues/31)).
- Changing `setup`, its flags, or the public contract.
- Automatically completing stubs or building score gaps during init.
- Making existing repos that already finished a full init re-run in lean mode.

## User stories

### US-1: Lean init on a fresh repo

**As a** developer with a mostly empty new repository,
**I want** a lean `harness-init` path that captures my immediate goal and defers deep discovery, research, and score-gap questions when evidence is thin,
**so that** I reach first useful work without answering questions the repo cannot yet support.

Traces to goal: G1, G2

#### AC-1.1: A fresh repo completes lean init

**Given** a fresh repository with the harness files from `setup`
**When** the agent runs `harness-init` and the tree shows thin evidence
**Then** the run captures the immediate goal (one question when the prompt stated none), finishes without mandatory deep web research and without a question for every score-gap dimension, leaves a usable entry guide, and records the chosen and deferred steps in the session note

#### AC-1.2: Deferrals are listed before the run proceeds

**Given** the lean path proposes to defer or skip named steps
**When** the agent presents that proposal
**Then** each step is listed by number and name with why and what work remains, the run waits for the user's yes, and the session note preserves those choices; the user can decline an item, which then runs as on the full path

### US-2: Skill proposals always happen

**As a** developer on the lean path,
**I want** skill proposals based on my stated goal even when the repo has little or no application code,
**so that** I start with the tools I need instead of inventing architecture decisions.

Traces to goal: G3

#### AC-2.1: Proposals on thin evidence

**Given** a fresh repo with a stated goal and little or no application code
**When** lean `harness-init` reaches skill proposals
**Then** the agent proposes relevant skills citing the goal and the available references, or states the thin-evidence basis, and unsupported tool or architecture decisions stay open

#### AC-2.2: Proposals are never a lean deferral

**Given** a lean run that defers deeper discovery or research
**When** the run decides which steps to defer
**Then** skill proposals are never among the deferred or skipped steps, and the lean path defers only four named items: deep discovery Q&A beyond files, optional web research, per-dimension score-gap keep/drop questions, and the validate-wiring question

## Scope

**In**

- The lean path in the `harness-init` skill (installed copy and template copy), its references, and the session-note template.
- A documented lean walkthrough on an empty repo.
- The lean explanation in `README.md` and `site/harness-init.md`.
- Tests for the lean playbook, the session-note fields, and the lean docs.

**Out**

- Installing a single skill (issue #31) and any `setup` change.
- Changes to the public contract or any ADR.
- Automatically filling stubs or score gaps.
- The discovery skills already on `main` (The Fool and The Jury).

## Open questions

None. The four-item deferral boundary is settled for this PRD.

## Handoff

After approval → `code-spec`. This PRD does not authorize implementation.

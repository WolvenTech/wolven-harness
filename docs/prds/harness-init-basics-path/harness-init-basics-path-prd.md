---
type: prd
title: Harness-init basics path and a trimmable full tour
description: harness-init lets anyone reach first real work quickly through a three-step basics path, lets the full tour be trimmed with one checklist, and ends by offering the next piece of work.
status: draft
---

# Harness-init basics path and a trimmable full tour

## Problem

People adopting the harness on any repo have to sit through a long `harness-init` before they can start their first real work, and the run ends without pointing them at it.

- **Who:** Anyone running `harness-init` after `wolven-harness setup`, whether on a brand-new repo or one that already has code, who wants to reach their first real piece of work quickly.
- **Pain:**
  - The lean path in `templates/.agents/skills/harness-init/references/lean-path.md` still runs:
    - entry integration;
    - legacy ADR migration;
    - file-based discovery;
    - skill proposals and stubs;
    - the score;
    - a deferral list to approve.
  - The full path asks even more.
  - The run ends with a summary, not with an offer to start the work the person came for.
  - The deferral list asks people to approve what may *wait*, and that confused the Human in review.
- **Why now:** Plain-language questions shipped in #49, but dogfood runs since then still take too long to reach first work. The map review made a shorter flow concrete enough to approve.
- **Evidence:**
  - The [harness-init flow map review](../../notes/harness-init-flow-map-review/harness-init-flow-map-review-note.md): eight comment threads on the [Harness Setup Map artifact](https://claude.ai/artifact/34b68WuinuZE25ZtjKS5dt).
  - The Human's dogfood runs in October 2026, mostly explaining the harness and starting the Human's own new projects, such as `sales-charter`.

The **lean path** keeps its name in the skill and is shown to people as "Just the basics". The **full path** is shown as "The full tour". Both names already exist in `lean-path.md` and `SKILL.md`. This PRD reverses two requirements of the archived `lean-init` PRD:

- Thin evidence no longer chooses the lean path; the person does.
- The lean path no longer proposes skills.

## Goals

- **G1:** A basics run reaches the hand-back after at most three questions: which path, the first goal, and how much to change AGENTS.md. Success signal: a basics run on a repo with code asks only those three questions. It writes only the AGENTS.md change, the `WOLVEN.md` change that goes with it, and the session note.
- **G2:** A full-tour run can be trimmed up front with one checklist. Success signal: a step left unticked is never asked about or run, and it appears under "later" in both the hand-back and the session note.
- **G3:** Every run ends by saying what was installed, what was left for later, and what to do next, and by offering to start the next piece of work. Success signal: the hand-back has those three parts and ends with a spec offer that names the goal the person gave.
- **G4:** Skill proposals happen only where they help, on a repo that is new or still unexplored. Success signal: on a well-understood repo the full tour skips proposals and says why. The person can overrule that and get proposals.
- **G5:** Every question in the run reads as plain language about the repo, not about harness internals. Success signal: every question and answer label matches the wording approved on the map, or is phrased the same way.

**Non-goals**

- Changing `wolven-harness setup`, its prompts or its flags.
- Changing `harness-score`, its checks, or `.harness-score.json`.
- Building stubs or closing score gaps during init.
- Having the agent choose the path from the repo's evidence.
- The journey-map skill the review also asked for, which is a separate PRD.

## User stories

### US-1: Get started with just the basics

**As a** person who has just run `setup` on any repo,
**I want** a basics path that only notes my first goal and updates AGENTS.md,
**so that** I can start real work right away and do the rest of the setup later.

Traces to goal: G1, G5

#### AC-1.1: A basics run on a repo with code

**Given** a repo with application code and the files `setup` added
**When** the person runs `harness-init` and picks "Just the basics" from "How much setup do you want right now?"
**Then** the agent asks "What do you want to get done first in this repo?" and records the answer as given. It then asks "How much should we change your current AGENTS.md?", offering "Just one line", "A short section" and "The whole guide" with the recommended one first. It shows the diff and writes only on a yes. It runs no legacy ADR migration, discovery questions, research, skill proposals, score questions or wiring question, and it moves to the hand-back.

#### AC-1.2: A leaked credential stops a basics run

**Given** a basics run on a repo where the leaked-credential checks find a secret
**When** the agent runs those checks, the only score checks a basics run makes
**Then** the run stops and shows the finding before anything else is written, as it does on today's paths.

#### AC-1.3: No goal given

**Given** a basics run
**When** the person leaves the goal empty
**Then** the session note records "none given", and the run continues to the AGENTS.md question without asking again.

### US-2: Trim the full tour with one checklist

**As a** person who wants more than the basics but not everything,
**I want** to tick what this run should cover before it starts,
**so that** I only answer the questions I care about now.

Traces to goal: G2, G5

#### AC-2.1: Unticked steps are left for later

**Given** the person picks "The full tour"
**When** the agent shows "What should this run cover?" with every item ticked, and the person unticks "Look up your tools on the web" and "Check the harness score now"
**Then** the agent runs the ticked steps. It never asks about web research or score gaps, and it lists both as "later" in the hand-back and the session note. The six items are:
- move old decision records;
- ask about the project's stage and plans;
- look up your tools on the web;
- suggest skills for this repo;
- check the harness score now;
- set up automatic checks.

#### AC-2.2: Everything unticked

**Given** the person picks "The full tour"
**When** they untick every item
**Then** the run makes only the AGENTS.md change, still runs the leaked-credential checks, and lists all six items as "later" in the hand-back.

### US-3: Skill proposals only where they help

**As a** person on the full tour with "Suggest skills for this repo" ticked,
**I want** skills proposed only when my repo is new or still unexplored,
**so that** a repo the agent already understands is left alone.

Traces to goal: G4, G5

#### AC-3.1: A new repo gets proposals

**Given** a full tour on a repo the agent judges new or unexplored from its files
**When** the run reaches the skills step
**Then** the agent says the repo looks new and proposes two to four skills for the tools it found. Each skill the person picks becomes a stub.

#### AC-3.2: A well-understood repo skips proposals, and the person can overrule

**Given** a full tour on a repo the agent judges well understood
**When** the run reaches the skills step
**Then** the agent says it is skipping skill proposals and why. If the person overrules, it proposes skills as in AC-3.1. If not, nothing is added and the hand-back does not count skills as done.

### US-4: A hand-back that offers the next piece of work

**As a** person finishing `harness-init`,
**I want** the agent to tell me what is set up and offer to start my first piece of work,
**so that** I am not left working out what to do next.

Traces to goal: G3

#### AC-4.1: Goal given

**Given** a run where the person gave the goal "ship the billing API"
**When** the run reaches the hand-back
**Then** the agent's closing message has three parts:
- **What's installed:** the skills and the runtimes they are ready in, the AGENTS.md change, anything else done, what was committed, and the session note.
- **Left for later:** every item that did not run.
- **Numbered next steps** that fit the installed skill sets.

The message ends with "Should we start with a spec for “ship the billing API”?".

#### AC-4.2: No goal, or the person declines

**Given** a run with no goal, or a person who answers no to the spec offer
**When** the hand-back ends
**Then** the agent asks what to build first. It starts no spec, plan or other work without the person's yes.

### US-5: Come back for the rest

**As a** person who finished a basics run,
**I want** to run `harness-init` again later and do the rest,
**so that** starting with the basics never blocks the full setup.

Traces to goal: G1, G2

#### AC-5.1: A second run after basics

**Given** a finished basics run, whose session note is `stable`
**When** the person runs `harness-init` again and picks "The full tour"
**Then** the agent shows the checklist with the items the basics run left for later. It does not redo the AGENTS.md change, and it records the new run as its own session note.

#### AC-5.2: An interrupted run resumes

**Given** a `draft` session note left by an interrupted run
**When** the person runs `harness-init` again
**Then** the run resumes with the path, goal and checklist choices that note records. It asks none of them again.

## Scope

**In**

- The `harness-init` skill: `SKILL.md` and its `references/`. The lean-path rules, the deferral list, entry modes, discovery and skill proposals, the score step, validate wiring, and the hand-back with the session note all change.
- Any tests that pin the wording or step order of the `harness-init` skill.
- Setting the lean-path walkthrough `docs/notes/lean-init-walkthrough/` to `deprecated`, since it shows the lean path this PRD replaces.

**Out**

- `wolven-harness setup` and its prompts.
- `harness-score` and its checks.
- The journey-map skill and the deferred `wayfinder` skill.
- Rewriting that walkthrough for the basics path; the skill documents the new flow.

## Open questions

- How does the agent judge a repo "new or still unexplored", and which signals from the files count? — owner: `code-spec`
- Should the session note record the labels people see ("A short section") or the existing mode names ("light")? — owner: `code-spec`

## Handoff

After approval → `code-spec`. This PRD does not authorize implementation.

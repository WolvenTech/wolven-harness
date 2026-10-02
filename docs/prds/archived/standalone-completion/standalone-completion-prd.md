---
type: prd
title: Best effort when a consult is missing
description: One skill text skips a missing consult, names that skip on the artifact it writes, and stops when the next procedure lives in another skill or a harness file.
status: deprecated
---

# Best effort when a consult is missing

Retired. The requirements live in `docs/prds/skills-command/skills-command-prd.md`. This file is not a second contract.

## Problem

- **Who:** A person who installed a `ship` or `discovery` skill without another skill, or without a harness file, that the text consults.
- **Pain:** The text stops on that consult, or it would need a second version of the skill for each level of harness adoption.
- **Why now:** [Install ship and discovery skills without the harness](../skills-command/skills-command-prd.md) can write one skill folder. A full substitute for every missing skill is not the rewrite. Some couplings stay.
- **Evidence:** `docs/specs/skills-command/skills-command-spec.md` (Standalone use); `src/setup/skill-sets.ts`; grilling recorded in `.scratch/standalone-completion/`.

**Best effort** means the skill does the steps in its own text. If a consulted skill is loaded, it uses that skill. If the consult is missing, it continues those steps. The reply names that skill and says the consult did not run. The same sentence is in every durable text that run writes: the PRD file, the commit message, the pull request body, or the posted review. The skill does not reconstruct the missing skill, does not write that skill's artifacts, and does not point at the skills command or at `setup` as the way to install it.

A skill in this set that reads that sentence does not treat the named consult as having run, and does not claim the pull request is merge-ready from that text.

**Coupled** means the next step's procedure lives in another skill or in a harness file. The skill stops, names that missing piece, and does not invent a substitute.

**Loaded** means the skill is in the list the runtime provided for this session. A folder on disk does not count. A name remembered from an earlier summary does not count.

**Ship** is `code-commit`, `code-pr`, `code-review`, and `code-ci`. **Discovery** is `create-prd`, `prototype`, `handoff`, `the-fool`, and `the-jury`. One package copy is what both `setup` and the skills command install. A stop the skill already defines for a bad ask — no explicit ask, a secret file, more than one open pull request — stays.

## Goals

- G1: A missing consult is skipped and named on the artifact — success signal: with `pragmatic-guard` or `grilling` absent from the session skill list, the skill does the steps in its own text, and both the reply and the durable text that run writes say that consult did not run.
- G2: A missing procedure stays coupled — success signal: the run stops before a host action whose steps live in `code-pr`, before a commit whose steps live in `code-commit`, before an ADR promotion whose steps live in `adr`, and before a claim that `harness:validate` passed, that an ADR-claims axis passed, or that the pull request is merge-ready.
- G3: `prototype`, `the-fool`, `the-jury`, and `handoff` keep their text — success signal: their package copy is unchanged.
- G4: One package copy serves every install — success signal: `setup` and the skills command write the same skill text, and there is no second version for a level of harness adoption.

**Non-goals**

- A substitute grilling interview, a substitute Conventional Commit, a copied host procedure, or an ADR status change without `adr`.
- A hard stop that names the skills command, or `setup`, as the way to install `pragmatic-guard`, `grilling`, or `adr`.
- Skill packages, or several versions of one skill for levels of harness adoption.
- Building the skills command, or changing its flags, paths, prompts, or replacement behavior.
- Installing core skills with the skills command.
- Publishing or a version bump.

## User stories

### US-1: Skip a missing guard and leave the skip on the artifact

**As a** person running a ship skill without `pragmatic-guard` loaded,
**I want** that skill to do the steps in its own text and to name the skip on what it writes,
**so that** a later session can see the guard did not run.

Traces to goal: G1, G4

#### AC-1.1: The guard is used when the session lists it

**Given** the session skill list includes `pragmatic-guard`
**When** I ask a ship skill for its job
**Then** that skill consults `pragmatic-guard` and then follows its own text

#### AC-1.2: A missing guard is named, and its artifacts are not written

**Given** `pragmatic-guard` is absent from the session skill list
**When** I ask a ship skill for its job
**Then** the skill follows its own text, the reply and the durable text that run writes say `pragmatic-guard` was not consulted, the run writes no deferral and no sentence that says the guard ran, and the skill does not name an install command for it

#### AC-1.3: A folder or a memory is not loaded

**Given** `pragmatic-guard` is absent from the session skill list, and a folder for it is on disk or an earlier summary names it
**When** I ask a ship skill for its job
**Then** the skill treats `pragmatic-guard` as not loaded

#### AC-1.4: A later skill reads the sentence as a skip

**Given** a commit message, pull request body, or posted review says `pragmatic-guard` was not consulted
**When** `code-review` or `code-ci` reads that text
**Then** it does not treat the guard as having run, and it does not claim the pull request is merge-ready from that text

### US-2: Draft a PRD without a substitute interview

**As a** person with `create-prd` and without `grilling` loaded,
**I want** a draft from the ask I gave, with the skip written in the file,
**so that** the PRD does not wait on a reconstructed grilling session and a later read can see that it was skipped.

Traces to goal: G1

#### AC-2.1: Grilling runs when the session lists it

**Given** the session skill list includes `grilling`
**When** I ask `create-prd` for a PRD
**Then** `create-prd` runs `grilling` before it drafts

#### AC-2.2: A missing grilling skill still drafts, and the file says so

**Given** `grilling` is absent from the session skill list
**When** I ask `create-prd` for a PRD
**Then** `create-prd` drafts from that ask with its own term check and template, the PRD file and the reply say `grilling` did not run, and it does not interview me in place of that skill or name an install command for it

#### AC-2.3: The ADR offer stays coupled to adr

**Given** `create-prd` reaches its ADR offer and `adr` is absent from the session skill list
**When** that offer comes up
**Then** no decision record is written, and the reply names `adr`

### US-3: Stop where the procedure lives somewhere else

**As a** person whose next step is defined in another skill or a harness file,
**I want** the run to stop and name that piece,
**so that** the skill does not invent a second way to do it.

Traces to goal: G2

#### AC-3.1: Host actions stay in code-pr

**Given** `code-review` or `code-ci` is in the session skill list and `code-pr` is not
**When** the next step is a host action
**Then** the skill stops before that action, names `code-pr`, and does not carry a copy of the host procedure

#### AC-3.2: The commit stays in code-commit

**Given** `code-commit` is absent from the session skill list, and `code-pr` has a dirty in-scope tree, or `code-ci` has a conflict resolution to commit, or pre-merge closure has moves to commit
**When** that commit is the next step
**Then** the skill stops before the commit, names `code-commit`, and does not run `git commit` in its place

#### AC-3.3: A missing gitHost stops the host action

**Given** the skill is about to perform a host action and `.wolven-harness.json` has no `gitHost`
**When** it reads that value
**Then** the host action does not happen, the reply names `setup`, and the skill does not assume GitHub

#### AC-3.4: A missing validate script is not claimed

**Given** `code-ci` or pre-merge closure cannot run `harness:validate`
**When** that step arrives
**Then** the skill stops that step, names `setup`, and does not claim the command passed or that the pull request is merge-ready

#### AC-3.5: ADR promotion stays in adr

**Given** pre-merge closure has ADRs to promote and `adr` is absent from the session skill list
**When** promotion is the next step
**Then** ADR status stays as it is, and closure does not claim merge-ready

#### AC-3.6: A review skips the ADR-claims axis

**Given** `code-review` can post and cannot run `harness:validate`
**When** it reaches the ADR-claims axis
**Then** it posts the other findings, the posted review says that axis was not checked, and it does not judge those claims by eye

#### AC-3.7: A skipped ADR-claims axis is not a passed review

**Given** the posted review says the ADR-claims axis was not checked
**When** closure or a later run reads that review
**Then** it does not treat that axis as passed, and it does not claim the pull request is merge-ready

### US-4: Leave the skills that already finish

**As a** person with only `prototype`, `the-fool`, `the-jury`, or `handoff` loaded,
**I want** that skill to behave as its current text says,
**so that** a skill that already finishes is not rewritten.

Traces to goal: G3

#### AC-4.1: Their text stays

**Given** the package copy of `prototype`, `the-fool`, `the-jury`, and `handoff`
**When** this work ships
**Then** that copy is unchanged

## Scope

**In**

- Skill text, in the one package copy, for `code-commit`, `code-pr`, `code-review`, `code-ci`, and `create-prd`. A missing consult is best effort and the skip is on the durable text that run writes. A missing procedure stays coupled.
- The same text for a harness install and for a skills-command install.

**Out**

- The skills command's flags, paths, prompts, and replacement behavior.
- Installing core skills with that command.
- A hard stop whose remedy is that command, or `setup`, for `pragmatic-guard`, `grilling`, or `adr`.
- Changing `prototype`, `the-fool`, `the-jury`, or `handoff`.
- A second version of a skill, or a package of skills, for a level of harness adoption.
- Substitute procedures for `grilling`, `code-commit`, `code-pr`'s host steps, `adr`, or `harness:validate`.
- Publishing or a version bump.

The stable skills-command PRD still leaves skill text unchanged. This draft is the rewrite, and it does not make a coupled skill stand alone. Those lines change when this PRD is approved.

## Open questions

None.

## Handoff

Draft. Approval locks these requirements. Next is `code-spec`. This PRD does not authorize implementation.

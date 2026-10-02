---
type: prd
title: Default branch safety
description: Prevent agent changes from bypassing the pull request workflow on the default branch.
status: draft
---

# Default branch safety

## Problem

Maintainers cannot rely on the harness and GitHub to prevent agents from
writing directly to the default branch, bypassing the pull request workflow.

- **Who:** Maintainers using agents in wolven-harness.
- **Pain:** Branch safety depends on which skill the agent invokes and which credentials it uses.
- **Why now:** A Claude-authored commit reached main without an associated PR on 2026-10-02.
- **Evidence:** [Incident #40](https://github.com/WolvenTech/wolven-harness/issues/40) records the commit, current protection settings, missing branch guards, and investigation limits. Administrator enforcement is disabled; the actual push credential and historical settings remain unverified.

The default branch is the repository's configured integration branch, currently
`main`. The requirements below are proposed and remain subject to approval.

## Goals

- **G1:** Prevent local agent commits and direct pushes to the default branch — success signal: attempts are rejected with actionable recovery guidance and existing work preserved.
- **G2:** Enforce the PR boundary remotely — success signal: direct updates using agent credentials are rejected, including when local checks are absent or credentials are privileged.
- **G3:** Preserve the approved delivery workflow — success signal: feature-branch commits, pushes, PR creation, and authorized PR merges continue to work.

**Non-goals**

- Review or revert the incident's video changes.
- Redesign the Code lane or introduce a general permissions framework.
- Determine the incident's push actor from commit authorship alone.

## User stories

### US-1: Safe local work

**As a** maintainer, **I want** agents to commit and publish work from feature
branches, **so that** direct default-branch writes cannot skip review.

Traces to goals: G1, G3.

#### AC-1.1: Feature branch workflow

**Given** an agent is on a feature branch with validated work,
**When** it commits and pushes that branch,
**Then** branch safety permits those operations and the agent can open a PR.

#### AC-1.2: Default branch commit

**Given** an agent is on the default branch with uncommitted work,
**When** it attempts a commit,
**Then** the operation is rejected before creating the commit, work is
preserved, and guidance explains how to continue on a feature branch.

#### AC-1.3: Default branch push destination

**Given** an agent is on any local branch,
**When** it attempts to push changes directly to the remote default branch,
**Then** the operation is rejected based on its destination, with recovery
guidance and no loss of local work.

#### AC-1.4: Unresolved branch context

**Given** branch context or the default branch cannot be resolved,
**When** an agent attempts a commit or push,
**Then** it receives guidance to establish a safe branch context before the
operation proceeds; detached execution must not silently permit a default-branch update.

### US-2: Remote enforcement

**As a** maintainer, **I want** GitHub to enforce the PR boundary for agent
credentials, **so that** bypassing local checks cannot publish directly to the
default branch.

Traces to goals: G2, G3.

#### AC-2.1: Approved PR integration

**Given** a feature-branch PR meets the repository's required checks and
approved merge policy,
**When** an authorized actor merges it through that workflow,
**Then** GitHub accepts the update to the default branch.

#### AC-2.2: Privileged direct write

**Given** an agent uses credentials with repository administrator privileges,
**When** it attempts a direct default-branch update outside the approved PR workflow,
**Then** GitHub rejects the update.

#### AC-2.3: Local safeguards bypassed

**Given** local safeguards are missing or bypassed,
**When** an agent attempts a direct default-branch update through Git or an API,
**Then** GitHub rejects the update and the remote branch remains unchanged.

## Scope

**In**

- Standing agent policy and the relevant commit/push skill entry paths.
- Local safeguards for commits and push destinations in this repository.
- GitHub enforcement for this repository and verification of the approved merge path.
- Documented enforcement limits and an explicit exception policy, if exceptions are approved.

**Out**

- Protection changes in other repositories.
- Changes to review counts, merge ownership, or release behavior beyond what the approved safety boundary requires.
- Implementation, specifications, and remediation during this PRD publication.

## Open questions

- Should the harness ship these safeguards to consumer repositories, or initially cover only this package repo? — owner: Rafael.
- Which GitHub protection mechanism and credential permissions should enforce the boundary? — owner: Rafael, with technical evidence during specification.
- Are any human emergency or automation exceptions necessary, and how can they avoid granting agents the same bypass? — owner: Rafael.
- How should detached agent checkouts and unknown default branches recover without blocking legitimate feature work? — owner: Rafael, with technical evidence during specification.
- Do release automation credentials need a distinct integration path under the approved policy? — owner: Rafael.

## Handoff

Review this draft alongside incident #40 and resolve the open questions before
approval. After explicit approval, proceed to `code-spec`. This PRD does not
authorize implementation or live GitHub protection changes.

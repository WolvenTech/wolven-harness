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
`main`. Rafael confirmed the decisions below during the requirements
interview on 2026-10-02 and requested that this document remain a draft.

## Goals

- **G1:** Prevent local agent commits and direct pushes to the default branch — success signal: attempts are rejected with actionable recovery guidance and existing work preserved.
- **G2:** Enforce the PR boundary remotely — success signal: direct updates using agent credentials are rejected, including when local checks are absent or credentials are privileged.
- **G3:** Preserve the approved delivery workflow — success signal: feature-branch commits, pushes, PR creation, and authorized PR merges continue to work.
- **G4:** Ship local protection to consumer repositories by default — success signal: harness setup installs the policy and supported hooks, preserves existing hooks, and clearly reports any missing protection.

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
**When** it prepares to commit,
**Then** the agent creates a feature branch automatically, preserving the
work, and continues there; any commit attempted while still on the default
branch is rejected before creating the commit.

#### AC-1.3: Default branch push destination

**Given** an agent is on any local branch,
**When** it attempts to push changes directly to the remote default branch,
**Then** the operation is rejected based on its destination, with recovery
guidance and no loss of local work.

#### AC-1.4: Detached checkout

**Given** the agent is checked out at a commit without a local branch,
**When** an agent attempts a commit or push,
**Then** it stops and asks Rafael, or the consumer repository's maintainer,
to choose the base for a new branch, preserving the current work until that
choice is made.

#### AC-1.5: Unknown default branch

**Given** the repository's default branch cannot be identified,
**When** the agent attempts a commit or push,
**Then** the operation is blocked until that context is resolved, while
file editing remains available.

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

#### AC-2.4: No direct-write exceptions

**Given** a human, agent, or automation operates on this repository,
**When** it attempts to update the default branch outside the approved PR workflow,
**Then** the update is rejected, with no emergency, administrator, or
automation bypass; release automation must use the approved PR workflow too.

### US-3: Protection included in harness setup

**As a** maintainer installing the harness, **I want** local branch protection
enabled by default, **so that** using a different repository or skill does
not silently remove this safeguard.

Traces to goals: G1, G3, G4.

#### AC-3.1: Default installation

**Given** a repository is configured with the harness,
**When** setup installs or refreshes its protection,
**Then** it provides the standing policy, the relevant skill safeguards,
Git commit and push hooks, and agent hooks for runtimes that support them,
enabled by default and preserving existing hooks.

#### AC-3.2: Existing hook conflict

**Given** an existing hook prevents safe installation of a protection hook,
**When** setup encounters the conflict,
**Then** it preserves the existing hook, completes the remaining setup, and
clearly reports which protection remains pending and how to resolve it;
it does not claim that the missing protection is active.

#### AC-3.3: Runtime without hook support

**Given** a supported agent runtime does not offer the required hook capability,
**When** setup configures that runtime,
**Then** it retains the standing policy and Git hooks and clearly reports
the missing agent-hook layer, without blocking the remaining setup.
Server-side enforcement remains the final barrier wherever configured.

#### AC-3.4: Consumer GitHub configuration

**Given** a consumer repository installs the harness,
**When** setup completes,
**Then** it provides instructions for configuring GitHub protection but
does not inspect or change that repository's GitHub protection settings.

## Scope

**In**

- Standing agent policy and the relevant commit/push skill entry paths, shipped to consumer repositories.
- Git commit/push hooks and supported agent hooks, installed by default in this repository and consumer repositories.
- Automatic feature-branch recovery from the default branch and explicit handling of detached or unknown branch context.
- GitHub enforcement for this repository and verification of the approved merge path.
- No exceptions for direct default-branch writes by humans, agents, or automation.
- Consumer instructions for configuring GitHub protection and clear reporting of missing local hook layers.

**Out**

- Inspection or modification of GitHub protection settings in consumer repositories.
- Changes to review counts, merge ownership, or release behavior beyond what the approved safety boundary requires.
- Implementation, specifications, and remediation during this PRD publication.

## Open questions

None at the product level after Rafael's confirmation on 2026-10-02.
The specification must establish the GitHub enforcement mechanism,
credential permissions, runtime hook capabilities, and release integration
needed to meet these requirements. Technical choices must preserve the
confirmed scope and no-exceptions policy.

## Handoff

Review this updated draft alongside incident #40 before promoting it to
stable. Confirmation of the interview decisions did not approve that
promotion. After explicit approval, proceed to `code-spec`. This PRD does not
authorize implementation or live GitHub protection changes.

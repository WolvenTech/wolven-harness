---
type: prd
title: An upgrade guide for existing harness installs
description: Cancelled on 2026-10-23 because the Human considers existing CLI and release documentation sufficient for upgrades.
status: deprecated
---

# An upgrade guide for existing harness installs

## Cancelled — 2026-10-23

The Human dropped the upgrade-guide requirement during the deferral grilling.
Existing CLI and release documentation are sufficient. No guide, replacement
initiative or implementation handoff is planned. The original draft below
is preserved as history and carries no active requirements.


Drafted from existing consumer evidence on 2026-10-22; grilling did not run
because it is absent from the session skill list.

## Problem

- **Who:** a developer upgrading an existing harness install with local skills and rules.
- **Pain:** upgrading the CLI and rerunning create-only `setup` does not update existing files, so the developer cannot tell which template changes need action or how to preserve local edits.
- **Why now:** the install-experience PRD records an external client install, and [issue #66](https://github.com/WolvenTech/wolven-harness/issues/66) records a 0.3.2 brownfield install with old instructions and new companion files. The former consumer-docs deferral's assumption that no external repo uses the harness is no longer supported.
- **Evidence:** [issue #45](https://github.com/WolvenTech/wolven-harness/issues/45) records template changes after 0.3.0 and is closed as not planned, not delivered; the [install-experience PRD](../../install-experience/install-experience-prd.md) addresses drift through doctor instead. [PR #75](https://github.com/WolvenTech/wolven-harness/pull/75) merged wiring changes; [PR #76](https://github.com/WolvenTech/wolven-harness/pull/76) still holds check and repair. Neither a merged change nor an open PR proves that a package release includes it.

## Goals

- **G1: Make the next template-changing upgrade actionable.** Success signal: a developer starting from a supported published version can find the changed template paths, the action needed for each and the checks that establish completion.
- **G2: Preserve consumer changes.** Success signal: the guide explains how to inspect differing files and retain local additions without treating package installation or `setup` as an overwrite operation.

**Non-goals**

- Building an upgrade CLI, automatic replacement, three-way merges or a migration framework.
- A second normative contract document or a finding-code catalogue.
- Resolving issue #66's whole-folder replacement and local-addition design.

## User stories

### US-1: Upgrade to a published release with changed templates

**As a** developer maintaining an existing install,
**I want** release-specific upgrade instructions,
**so that** I can adopt the changes and check the result.

Traces to goal: G1.

#### AC-1.1: A supported published upgrade

**Given** a published source version and a published target release with changed templates
**When** the developer opens the upgrade guide
**Then** it names both versions, lists the changed template paths or groups with the action required for each, distinguishes updating the CLI from updating project files, and gives verification commands available in that target release.

#### AC-1.2: Work that has not shipped

**Given** a command or repair flow exists only in an open PR or on an unreleased main branch
**When** the guide describes a published target release
**Then** it does not instruct the reader to use that unavailable behavior; upcoming guidance is clearly marked and has an applicable current-release path.

### US-2: Keep local skill and rule additions

**As a** developer whose installed files differ from the templates,
**I want** to compare the release changes with my files before replacing anything,
**so that** the upgrade preserves the repository's own standards.

Traces to goal: G2.

#### AC-2.1: A locally edited file

**Given** a skill or rule contains a local addition
**When** the developer follows the guide
**Then** it tells them to inspect the difference and retain that addition deliberately, and explains that `setup` preserves existing files while adding missing ones.

#### AC-2.2: Unknown origin or mixed versions

**Given** a file's original template version is unknown or its folder mixes old and new files
**When** the guide reaches that case
**Then** it explains how to compare against the target templates and identifies what remains unresolved, without declaring the file unedited or advising blanket deletion of the skill tree.

## Scope

**In**

- One consumer-facing upgrade guide for the next published template-changing release, using real supported starting versions.
- Changed template paths, preservation of local edits and release-appropriate verification.
- Clear separation between released behavior and pending check-and-repair work.

**Out**

- New CLI behavior, automatic refresh or merge tooling.
- Duplicating the normative contract or expanding finding-code documentation without a reader request.
- Replacing the install-experience PRD or claiming issue #66 is solved by documentation.

## Open questions

- Which next published release and starting versions should the first guide cover? The package still records 0.3.2 at this review. — owner: Human.
- What release workflow should keep future upgrade entries current? — owner: Human.

## Handoff

After approval → `code-spec`. This PRD does not authorize implementation.
It promotes the upgrade-guide portion of consumer-docs; contract-page work
remains in the [contract documentation deferral](../../../deferrals/stable-contract-doc/stable-contract-doc-deferral.md).
No architecture decision is settled here.

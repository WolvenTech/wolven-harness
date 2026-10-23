---
type: deferral
title: Template drift reporting pending check and repair
description: The fired setup --check request is covered by the install-experience PRD and open PR 76; retain this record until its doctor replacement merges.
status: stable
---

# Template drift reporting pending check and repair

**Original request:** `setup --check`, comparing installed harness files with templates to report consumer edits, stale templates and missing files. The need has fired; it is now planned work, not a candidate for another PRD or another flag.

**Why:** `setup` creates only missing paths. A changed template never reaches a consumer, while a new reference file does, which can leave a skill folder mixing versions. [Issue #66](https://github.com/WolvenTech/wolven-harness/issues/66) records that mixed-folder problem in a real 0.3.2 install.

**Today:** [issue #45](https://github.com/WolvenTech/wolven-harness/issues/45) was closed as `not_planned` on 2026-10-14, not completed by an implementation. The [install-experience PRD](../../prds/install-experience/install-experience-prd.md), AC-5.5 and US-8, replaces `setup --check` with read-only `doctor` drift reporting. [PR #75](https://github.com/WolvenTech/wolven-harness/pull/75) merged wiring only; [PR #76](https://github.com/WolvenTech/wolven-harness/pull/76) remains open with check and repair. The merged CLI has no `doctor` command.

The [iteration spec](../../specs/install-experience/install-experience-iteration-1-spec.md), R13, classifies files against known released forms without relying on `packageVersion` as a per-file baseline or introducing an install manifest. R14.1 explicitly keeps this deferral in PR 1; R14.2 removes it with PR 2. Retire this record when that replacement merges, and verify the release before telling consumers it is available.

## Contract impact

No additional `setup` flag is proposed. [ADR-005](../../adrs/adr-005-install-anywhere-contract.md) governs the merged wiring release. The check-and-repair PR owns its successor contract, including doctor findings and report-only behavior.

## Triggers

- [x] The first release after 0.3.0 changes a template file. Fired: 0.3.1 changed 50 template files; issue #45 recorded the missed check.
- [x] A consumer reports a skill folder with mixed versions. Recorded in issue #66.
- [ ] Check and repair merges with the drift proofs in R13 and the R14.2 surface proof passing. Then remove this deferral; do not open a duplicate initiative.

## Non-goals while deferred

- No automatic overwrite of consumer files; the existing PRD owns any consent-based refresh.
- No three-way merge tooling.

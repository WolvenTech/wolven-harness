---
type: deferral
title: Template drift check for setup
description: A setup --check that lists consumer files differing from the shipped templates waits until a release changes a template, which is when drift becomes real.
status: stable
---

# Template drift check for setup

**Deferred:** `setup --check`, which compares each harness file with the template of the recorded package version and of the installed one. It lists consumer edits, stale templates and new files.

**Why:** `setup` creates only missing paths. A changed template never reaches a consumer, while a new reference file does, which can leave a skill folder mixing versions. Until a release changes a template, there is nothing to report.

**Today:** `setup` rewrites `packageVersion` in `.wolven-harness.json` on every run, which is the prerequisite for the check. Nothing compares files yet.

## Contract impact

A new `setup` flag is additive under [ADR-004](../../adrs/adr-004-standalone-skills-contract.md) and fits a minor release. `--check` must keep every `setup` guarantee: it reports only and writes nothing.

## Triggers

- [x] The first release after 0.3.0 changes a template file. Then build `setup --check` in that release, so consumers can see what changed. Fired: 0.3.1 changed 50 files under `templates/` and shipped without the check. The build is tracked in [#45](https://github.com/WolvenTech/wolven-harness/issues/45).
- [ ] A consumer reports a skill folder with mixed versions. Then build it and point that consumer at it.

## Non-goals while deferred

- No automatic upgrade or overwrite of consumer files.
- No three-way merge tooling.

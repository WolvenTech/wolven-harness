---
type: deferral
title: Claim false positives and per-line waivers
description: The claim scan treats every ADR token as a local claim, URLs and historical lines included; skipping URLs and a per-line waiver wait until a consumer hits a false positive it cannot reword.
status: stable
---

# Claim false positives and per-line waivers

**Deferred:** skipping ADR tokens inside `http(s)://` URLs, a per-line waiver with a stated reason, and guidance for historical files such as changelogs and release notes.

**Why:** the claim scan treats every `ADR-NNN` and `adr-NNN-<slug>` token in a tracked file as a local claim. Two failures are foreseeable. A URL to another repo's `adr-NNN-use-kafka.md` resolves against this repo's ADRs and raises `claim-slug-mismatch`. A `CHANGELOG.md` line "Dropped ADR-NNN" raises `claim-missing` forever. No consumer has hit either yet.

**Today:** the only escape is an `ignore` entry in `.wolven-harness.json`. It takes a whole `<dir>/**`, which is coarse enough to blind the gate (for example `src/**`). This file writes its examples with `NNN` for the same reason: with real numbers, it failed `validate`.

## Contract impact

A waiver is new syntax, and skipping URLs changes what `claim-missing` catches. [ADR-004](../../adrs/adr-004-standalone-skills-contract.md) freezes neither, but both change which lines fail a run. A new finding for a waiver without a reason must start as a warning.

## Triggers

- [ ] A consumer hits a claim false positive it cannot reword away. Then add the URL skip or the waiver, whichever that case needs.
- [ ] A consumer adds a broad `ignore` entry to silence claims. Then the waiver is overdue: add it and propose removing the entry.

## Non-goals while deferred

- No file-wide or repo-wide claim opt-out.
- No waiver without a reason recorded next to it.

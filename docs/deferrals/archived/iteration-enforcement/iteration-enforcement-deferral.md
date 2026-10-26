---
type: deferral
title: Iteration-doc gap check and error enforcement
description: Retired as not planned after the Human confirmed the deferral cleanup on 2026-10-23.
status: deprecated
---

# Iteration-doc gap check and error enforcement

## Retirement — 2026-10-23

Existing warnings are sufficient; reopen only for a concrete review-round problem or an explicit stricter-CI requirement.

The Human confirmed this retirement during the deferral grilling. The
original scope and triggers below are retained as history, not active work.


**Deferred:** a check that `<slug>-iteration-<N>-{spec,plan}.md` numbers run
from 1 with no gap, and promoting `profile-iteration-doc` from warn to error.

**Why:** the agent picks the next free N, so a gap needs a hand-renamed file,
and none exists yet. Per
[ADR-006](../../../adrs/adr-006-install-check-and-repair-contract.md), an error-level finding is
a breaking change.

## Triggers

- [ ] A real repo has an iteration-number gap that confused a review round
- [ ] Someone asks for iteration-doc violations to fail CI (needs a
  superseding ADR per ADR-006)

---
type: deferral
title: Iteration-doc gap check and error enforcement
description: Validate warns on a malformed review-fix iteration doc but neither checks that N runs contiguously from 1 nor fails the run; both wait for a real case.
status: stable
---

# Iteration-doc gap check and error enforcement

**Deferred:** a check that `<slug>-iteration-<N>-{spec,plan}.md` numbers run
from 1 with no gap, and promoting `profile-iteration-doc` from warn to error.

**Why:** the agent picks the next free N, so a gap needs a hand-renamed file,
and none exists yet. Per
[ADR-003](../../adrs/adr-003-public-contract.md), an error-level finding is
a breaking change.

## Triggers

- [ ] A real repo has an iteration-number gap that confused a review round
- [ ] Someone asks for iteration-doc violations to fail CI (needs a
  superseding ADR per ADR-003)

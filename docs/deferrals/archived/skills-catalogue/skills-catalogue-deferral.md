---
type: deferral
title: Wolven skills catalogue in harness-init
description: Retired as not planned after the Human confirmed the deferral cleanup on 2026-10-23.
status: deprecated
---

# Wolven skills catalogue in harness-init

## Retirement — 2026-10-23

The shipped picker and repo-specific stubs are sufficient; reopen for repeated unmet demand for reusable tool skills.

The Human confirmed this retirement during the deferral grilling. The
original scope and triggers below are retained as history, not active work.


**Deferred:** a Wolven-tailored catalogue of skills that the Human browses and picks from inside `harness-init`.

**Why:** the wizard's job is to fit the harness to one repo's decided tools. A catalogue is only worth building once the tailored flow has shown what it misses.

**Today:** `setup --skills` installs the `ship` or `discovery` set. [PR #33](https://github.com/WolvenTech/wolven-harness/pull/33) completed [issue #31](https://github.com/WolvenTech/wolven-harness/issues/31): `wolven-harness skills` lists and installs individual packaged skills without taking the whole set. That built-in picker is shipped. This deferral concerns a Wolven-tailored catalogue of additional tool-specific skills inside `harness-init`, whose suggest-and-stub flow remains the simpler path.

## Contract impact

None. [ADR-005](../../../adrs/adr-005-install-anywhere-contract.md) leaves the set of skills, the skill sets' membership and prompt wording out of the contract. A new `--skills` value would be an additive change to a flag.

## Triggers

- [x] `harness-init`'s suggest-and-stub flow is proven in at least one brownfield consumer. Then collect the skills Humans stubbed by hand as the catalogue's first entries. Fired: agentic-mkt (WolvenTech/agentic-mkt#6, 2026-09-29) stubbed `n8n-workflow-builders` and `clickup-contract`, which are the first candidate entries. The catalogue still waits for the second trigger.
- [ ] A consumer needs a reusable tool-specific skill that the packaged picker and suggest-and-stub flow cannot provide, or the Human opens a spec for that catalogue. Capture the requested skill and the repeated work before designing the catalogue.

## Non-goals while deferred

- No additional tool-specific catalogue inside `harness-init`. The shipped `skills` picker remains available.

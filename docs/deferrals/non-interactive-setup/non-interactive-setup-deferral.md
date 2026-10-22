---
type: deferral
title: Non-interactive setup for preinstalled machines
description: A setup and harness-init path that takes every decision by flag, with no prompts and no agent, waits until a preinstalled machine image is actually being built.
status: stable
---

# Non-interactive setup for preinstalled machines

**Deferred:** taking every install decision by flag (layout, code repository, commit convention, runtimes) so a script can produce a working install with no prompts and no agent session. This is for a machine image, such as a shared cloud desktop that arrives with the harness ready.

**Why:** the preinstalled machine is an idea with no date. The [install experience PRD](../../prds/install-experience/install-experience-prd.md) moves the layout and convention decisions into `harness-init`, which runs inside an agent, so a script-only path would need a second way to make those decisions before anyone needs it.

**Today:** `setup` already takes its own choices by flag when stdin or stdout is not a terminal. `wolven-harness doctor` exits 0 or 1, so a script can check an install that was finished by hand.

## Contract impact

New `setup` flags are additive. A flag-driven `harness-init` path would be a new contract surface and needs its own ADR.

## Triggers

- [ ] A preinstalled machine image with the harness is being built, for example the shared cloud desktop proposed for a client.
- [ ] A team asks to install the harness from CI or a provisioning script.

## Non-goals while deferred

- No flags that replace `harness-init`'s layout or convention questions.
- No headless `harness-doctor` repair. `doctor` stays report-only.

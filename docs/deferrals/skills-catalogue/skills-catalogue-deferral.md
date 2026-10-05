---
type: deferral
title: Wolven skills catalogue in harness-init
description: Letting the Human pick from a Wolven-tailored skills catalogue inside harness-init waits until the suggest-and-stub flow is proven in a brownfield consumer.
status: stable
---

# Wolven skills catalogue in harness-init

**Deferred:** a Wolven-tailored catalogue of skills that the Human browses and picks from inside `harness-init`.

**Why:** the wizard's job is to fit the harness to one repo's decided tools. A catalogue is only worth building once the tailored flow has shown what it misses.

**Today:** `setup --skills` installs the `ship` or `discovery` set. `harness-init` then suggests two to four architectural skills named for the repo's decided tools and writes each one the Human picks as an ask-only stub.

## Contract impact

None. [ADR-004](../../adrs/adr-004-standalone-skills-contract.md) leaves the set of skills, the skill sets' membership and prompt wording out of the contract. A new `--skills` value would be an additive change to a flag.

## Triggers

- [ ] `harness-init`'s suggest-and-stub flow is proven in at least one brownfield consumer. Then collect the skills Humans stubbed by hand as the catalogue's first entries.
- [ ] The Human opens a spec for the catalogue picker.

## Non-goals while deferred

- No catalogue browsing, and no install from a catalogue.

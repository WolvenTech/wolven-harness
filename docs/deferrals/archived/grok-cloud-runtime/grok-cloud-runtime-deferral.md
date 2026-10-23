---
type: deferral
title: Grok cloud runtime
description: Retired as not planned after the Human confirmed the deferral cleanup on 2026-10-23.
status: deprecated
---

# Grok cloud runtime

## Retirement — 2026-10-23

No current Grok product and consumer were identified; reopen for a concrete product, user and missing documented load path.

The Human confirmed this retirement during the deferral grilling. The
original scope and triggers below are retained as history, not active work.


**Deferred:** a `grok` runtime in setup and the skills command, and a `.grok/skills/` tree in this repository.

**Why:** issue 50 names Grokbot and does not name a product doc or a committed directory. Grok Bot's skills doc describes account plugins. Grok Build's skills doc describes `.grok/skills/` and Claude compatibility. Those are different products. [PR #75](https://github.com/WolvenTech/wolven-harness/pull/75) expanded `setup` to nine runtime ids, none named `grok`; that expansion does not resolve which product the Human wants.

**Today:** this repository has no `.grok/` tree. The Human left Grokbot out of the cloud-session-skills spec.

## Contract impact

The change policy in [ADR-005](../../../adrs/adr-005-install-anywhere-contract.md) explicitly allows a new runtime id as an additive change. A successor is not required solely for a new id; any other behavior must be checked against that policy. `skills --runtimes` still has its separate three-value contract. Nothing here edits that ADR or authorizes either command's expansion.

## Triggers

- [ ] The Human names which product Grokbot is and asks for it in a spec.
- [ ] That product's primary docs name a committed repository directory for skills, and this repository does not already provide that directory through `.agents/skills/` or the `.claude/skills` symlink.

## Non-goals while deferred

- No `.grok/` tree, no Grok plugin, and no new runtime flag value.

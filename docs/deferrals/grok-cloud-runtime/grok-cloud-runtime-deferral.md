---
type: deferral
title: Grok cloud runtime
description: A Grok runtime and a .grok skills tree wait until the Human names the Grokbot product and a committed skill path from its primary docs.
status: draft
---

# Grok cloud runtime

**Deferred:** a `grok` runtime in setup and the skills command, and a `.grok/skills/` tree in this repository.

**Why:** ADR-004 runtimes are `claude`, `codex`, and `cursor`. Issue 50 names Grokbot and does not name a product doc or a committed directory. Grok Bot's skills doc describes account plugins. Grok Build's skills doc describes `.grok/skills/` and Claude compatibility. Those are different products.

**Today:** this repository has no `.grok/` tree. The Human left Grokbot out of the cloud-session-skills spec.

## Contract impact

Adding an allowed `runtimes` entry is a contract change and goes through a successor to [ADR-004](../../adrs/adr-004-standalone-skills-contract.md). Nothing here edits that ADR.

## Triggers

- [ ] The Human names which product Grokbot is and asks for it in a spec.
- [ ] That product's primary docs name a committed repository directory for skills, and this repository does not already provide that directory through `.agents/skills/` or the `.claude/skills` symlink.

## Non-goals while deferred

- No `.grok/` tree, no Grok plugin, and no new runtime flag value.

---
type: deferral
title: Codex cloud plugin packaging
description: Packaging harness skills as a Codex plugin waits until a cloud session omits a repository skill that is not ask-only.
status: draft
---

# Codex cloud plugin packaging

**Deferred:** a plugin manifest or marketplace entry whose purpose is to put this repository's skills on a Codex cloud session skill list.

**Why:** Issue 50's comment says hosts leave ask-only skills off the implicit session catalog on purpose. The companion gate in the cloud-session-skills spec reads the checkout `SKILL.md` instead. A plugin would put those skills on the implicit catalog, which is a second distribution surface and a different choice than that gate.

**Today:** `code-review`, `code-pr`, `code-ci`, and `handoff` set `disable-model-invocation: true`. Skills live in `.agents/skills/`.

## Contract impact

None while deferred. A plugin manifest is outside ADR-004. Adding a command or a runtime would follow that ADR's change policy.

## Triggers

- [ ] A Codex cloud session omits a repository skill that does not set `disable-model-invocation: true`, while `.agents/skills/<skill>/SKILL.md` is in the checkout.
- [ ] A Codex primary doc states that cloud session catalogs load plugins and do not scan `.agents/skills`.

## Non-goals while deferred

- No plugin manifest, marketplace entry, or install step in `.cursor/install.sh`.
- The companion install check belongs to the cloud-session-skills spec, not to a plugin.

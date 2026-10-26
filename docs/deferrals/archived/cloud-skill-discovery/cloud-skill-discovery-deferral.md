---
type: deferral
title: Additional cloud skill discovery mechanisms
description: Retired as not planned after the Human confirmed the deferral cleanup on 2026-10-23.
status: deprecated
---

# Additional cloud skill discovery mechanisms

## Retirement — 2026-10-23

The observed companion-loading failure is fixed; reopen only for a demonstrated project-path failure or concrete global-companion need.

The Human confirmed this retirement during the deferral grilling. The
original scope and triggers below are retained as history, not active work.


**Deferred:** three alternative additions to cloud skill delivery: Codex
plugin packaging, a copied Claude skill tree, and looser or global companion
discovery. They share a problem, but each needs its own evidence before it
can replace the current path.

**Why:** [issue #50](https://github.com/WolvenTech/wolven-harness/issues/50)
was completed by [PR #51](https://github.com/WolvenTech/wolven-harness/pull/51).
The companion gate reads the checkout's `SKILL.md`, even when an ask-only
skill is absent from the implicit session catalog. The
[smoke note](../../../notes/cloud-session-skills/cloud-session-skills-note.md)
records successful PR and diff reads in Codex, Cursor and Claude Code.
Adding three delivery mechanisms to that working path has no demonstrated
present need.

**Today:** companion checks use `.agents/skills/<name>/SKILL.md` or
`.claude/skills/<name>/SKILL.md`. Claude uses the tracked
`.claude/skills` symlink to `../.agents/skills`. [PR #60](https://github.com/WolvenTech/wolven-harness/pull/60)
also made project copies take precedence over user copies; it did not add
global companion discovery. Ask-only catalog omission alone is not a
failure of these paths.

## Alternatives and triggers

### Codex plugin packaging

- [ ] A Codex cloud session omits a repository skill that does not set
      `disable-model-invocation: true`, despite its checkout `SKILL.md`.
- [ ] A Codex primary doc states that cloud catalogs load plugins and do
      not scan `.agents/skills`.

Until then, add no plugin manifest, marketplace entry or bootstrap step.

### Copied Claude skill tree

- [ ] A Claude Code cloud session reports that skills under the committed
      `.claude/skills` symlink are invisible because it is a symlink.

Until then, keep one source tree; do not duplicate every skill edit.

### Loose or global companion discovery

- [ ] An agent fails or misunderstands the concrete project-path check
      despite the companion being present there.
- [ ] A concrete use case needs global companions across repositories
      without repository-level wiring.

Until then, keep the explicit checkout predicate and do not scan home
directories for companion authorization.

## Contract impact

No contract change while deferred. A plugin manifest or copied tree is not
itself a new CLI contract. Any new command, runtime or config value follows
[ADR-006](../../../adrs/adr-006-install-check-and-repair-contract.md)'s change policy.
Changing companion authorization needs its own explicit requirements.

Grok product support remains a separate
[deferral](../grok-cloud-runtime/grok-cloud-runtime-deferral.md): a delivery
mechanism cannot settle which product the Human wants.

## Cleanup record

Consolidated on 2026-10-22 from `codex-cloud-plugin`, `skill-tree-copy` and
`loose-companion-discovery`. This merge retires duplicate tracking, not any
of the three evidence gates.

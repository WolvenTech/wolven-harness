---
type: deferral
title: Loose and global companion discovery
description: Loosening companion install predicates to generic availability or user-global paths waits until checkout load paths prove insufficient or misunderstandings recur in practice.
status: draft
---

# Loose and global companion discovery

**Deferred:** replacing the concrete project load path checks (`.agents/skills/<name>/SKILL.md` or `.claude/skills/<name>/SKILL.md`) with a generic "when the skill is available in repo" phrasing, and expanding discovery to user-global skill locations (`~/.agents/skills/`, `~/.claude/skills/`).

**Why:** The cloud-session-skills spec intentionally grounded companion presence on ADR-004 project load paths (`.agents/skills/` and `.claude/skills/`). Explicit paths give agents a concrete, verifiable predicate to check before invoking companion actions (`code-pr` and `code-commit`). Relaxing the wording to generic availability risks agent ambiguity, and supporting global user installs is outside ADR-004 and the current repo scope.

**Today:** Companion presence checks verify `SKILL.md` on either project load path in the checkout. Ask-only companions stay off the implicit session catalog.

## Contract impact

None while deferred. Expanding companion discovery to global directories or altering companion predicates across skills and templates would require amending the `cloud-session-skills` spec or ADR-004.

## Triggers

- [ ] An agent runtime in a cloud session or local environment fails or misunderstands the concrete project load path predicate despite the companion being present.
- [ ] A concrete use case requires agents to use global/home-directory companion skills (`~/.agents/skills/`, `~/.claude/skills/`) across multiple repositories without repository-level wiring.

## Non-goals while deferred

- No loosening of the load-path predicates in `code-review`, `code-ci`, `code-pr`, or `pre-merge-closure.md`.
- No scanning of user home directories for companion authorization.

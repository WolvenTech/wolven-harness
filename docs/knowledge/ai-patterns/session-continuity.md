---
type: knowledge
title: Session continuity
description: Preserve enough verified project state for useful, bounded work after a session boundary.
status: current
aliases:
  - Handoff
  - long-running agents
checked: 2026-10-22
upstream-date: 2025-11-26 (Anthropic); unknown (book entry)
---

# Session continuity

## Retrieval question

What state must survive a session boundary so the next agent can continue safely without guessing what passed or what remains?

## Source findings

Anthropic describes long-running agents as discrete sessions that begin without prior memory. In its experiment, compaction alone did not reliably carry clear instructions forward. The harness paired Git history with a progress file, asked each session to make incremental progress, and had the next session inspect the working directory, recent history, progress, and remaining features. The article reports a full-stack application experiment; it does not establish that every repository needs the same files, feature tracker, commits, or startup script. It also links continuity to an understandable stopping state and documents premature completion as a separate failure mode. [Effective harnesses for long-running agents](https://www.anthropic.com/research/effective-harnesses-for-long-running-agents) (published 2025-11-26).

The [AI Patterns Book handoff entry](https://aipatternbook.com/handoff) is the discovery source for this topic. Its Markdown endpoint, [handoff.md](https://aipatternbook.com/handoff.md), could not be retrieved during this check; no technical claim below depends on its contents. The book entry's upstream date is unknown.

## Harness assessment

For this repository, preserve the task, approved scope, input artifacts, branch and Git state, completed evidence, unresolved decisions, and next bounded action. Inspect the live plan/spec and worktree; a handoff aids resumption but cannot broaden scope or mark work complete. The [code-execute skill](../../../.agents/skills/code-execute/SKILL.md) requires a seven-field resume section in the plan and reconciliation against Git before mutation. That record fits planned repository execution.

Use the separate [handoff skill](../../../.agents/skills/handoff/SKILL.md) only on direct request: it is ask-only, writes to the OS temporary directory, cites artifacts, and serves runtime, machine, or worktree transitions. Research about progress logs does not authorize automatic handoff generation, another repository execution log, or automatic commits. A plan plus Git may suffice when work stays in the same session; an external handoff helps when the next session cannot inherit that context. Counterexample: a finished change with no unresolved state needs no handoff artifact.

**Checked:** 2026-10-22. **Review state:** current. **Evidence limits:** one Anthropic engineering report from its Claude Agent SDK/full-stack application experiment; it is useful precedent, not a comparative study of handoff formats or evidence that a separate progress file benefits this harness. The book's Markdown page was inaccessible at check time.

---
title: Context selection
aliases: [Context Engineering, Context Rot]
review: current
checked: 2026-10-22
upstream: Anthropic 2025-09-29; Chroma 2025-07-14; book Context Engineering updated 2026-06-25; book Context Rot date not independently verified
---

# Context selection

**Retrieval question:** What information belongs in the current task context, and how should it be selected as work progresses?

## Source findings

Context engineering treats the model's full information environment as a design choice: instructions, tools, external data, and conversation history all shape the next response. Anthropic recommends curating an informative but tight context, using tools to retrieve additional information as needed, and testing a minimal starting prompt against task failures before adding guidance. This is a practice to evaluate against the task, not a fixed token budget. ([Anthropic, *Effective context engineering for AI agents*, 2025-09-29](https://www.anthropic.com/research/effective-context-engineering-for-ai-agents))

The Chroma technical report varied input length while holding several controlled tasks constant. Its 18-model evaluation found nonuniform performance as input length increased, including effects from semantic matching, distractors, and haystack structure. It used selected models and synthetic or benchmark tasks; it does not establish a universal threshold, prove every longer prompt harms every task, or predict performance on an untested model. ([Chroma, *Context Rot*, 2025-07-14](https://www.trychroma.com/research/context-rot))

The AI Patterns entries **[Context Engineering](https://aipatternbook.com/context-engineering)** and **[Context Rot](https://aipatternbook.com/context-rot)** are discovery references; Context Rot is an alias for this card, not a separate recommendation. The Context Engineering entry was updated 2026-06-25. The Context Rot page was not independently retrievable at review time, so its contents and update date remain unchecked.

## Harness assessment

For a task, start with the request, applicable repository instructions and settled decisions, then inspect the smallest relevant files, interfaces, tests, and error evidence. Expand retrieval when a concrete gap appears; keep sources of authority and freshness visible, and summarize durable decisions at session boundaries. The local [QMD skill](../../../.agents/skills/qmd/SKILL.md) already requires searching decisions first, retrieving full documents, and checking live files before relying on indexed copies. These steps apply Anthropic's retrieval guidance while keeping this card advisory; it does not override repository rules or authorize actions.

Tradeoff: focused context reduces irrelevant material but can omit a dependency or edge case. For a cross-cutting change, reading only the named function may miss callers, contracts, or adjacent tests; search those links and widen the inspection when evidence points there. Conversely, loading the whole repository for a narrow edit adds material without showing it is useful. There is no evidence here for a universal context-size cutoff or for transferring Chroma's measured effects to models/tasks it did not test.

**Sources checked:** Anthropic and Chroma URLs above; book URLs above. **Checked:** 2026-10-22. **Review:** current for the checked primary sources; book Context Rot entry needs review because it was inaccessible. **Evidence limits:** findings are advisory and bounded by the models/tasks reported by each source; no local performance measurement was conducted.

**Ingestion provenance:** Unit 02, requested configuration `gpt-6-luna`, reasoning effort `medium`, `fork_turns: none` per approved plan. Independent runtime model/effort confirmation was unavailable in this task environment; requested configuration is not represented as verified runtime identity.

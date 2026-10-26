---
type: knowledge
title: Progressive disclosure
description: Load linked references on-demand while keeping essential constraints in the parent instructions.
status: current
aliases:
  - on-demand references
  - staged context
  - progressive loading
checked: 2026-10-22
---

# Progressive disclosure

**Aliases:** on-demand references, staged context, progressive loading

**Retrieval question:** When should an agent load a linked reference instead of keeping the full material in an always-loaded instruction file?

**Applicability:** Use when authoring or consulting skills, instructions, and other reference material that has task-specific detail.

## Source findings

The [Agent Skills specification](https://agentskills.io/specification) defines a staged skill format: startup metadata (`name` and `description`), the full `SKILL.md` body when activated, and resource files loaded as needed. It says a skill may place documentation in `references/`, recommends focused files, and asks authors to keep file links one level deep from the skill root. The [Anthropic engineering article](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) describes the same sequence and advises moving detail that applies only to specific scenarios into linked files. The [Progressive Disclosure pattern](https://aipatternbook.com/progressive-disclosure.md) frames the design tradeoff: eagerly loaded material is predictable, while on-demand material reduces irrelevant context at the cost of discovery and loading decisions. These are source recommendations; their effectiveness depends on the agent runtime and task.

## Harness assessment

Load a reference when a task reaches the condition named by its parent skill or instruction; keep always-needed constraints in the parent. The local [code-spec skill](../../../.agents/skills/code-spec/SKILL.md) points authors to [TEMPLATE.md](../../../.agents/skills/code-spec/references/TEMPLATE.md) before drafting and to [EXAMPLE.md](../../../.agents/skills/code-spec/references/EXAMPLE.md) only when unsure about specific spec structures. This gives a concrete trigger for each reference, while keeping the entry point discoverable.

The tradeoff is another retrieval step and the risk that a vague pointer or missed trigger hides needed guidance. A counterexample: splitting a short, universally applicable rule into a separate file adds a read and a failure point without making task-specific detail easier to find. Keep such a rule in the main instructions. Do not split every short skill or treat this external pattern as repository policy; local rules and the active task govern.

**Book source:** [Progressive Disclosure](https://aipatternbook.com/progressive-disclosure.md) — discovery material; not policy.

**Primary sources checked:** [Agent Skills specification](https://agentskills.io/specification); [Anthropic engineering article](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills).

**Checked:** 2026-10-22. **Upstream dates:** pattern page created 2026-04-16 and updated 2026-06-14; specification publication date unknown; Anthropic article published 2025-10-16 and notes an open-standard update on 2025-12-18.

**Evidence limits:** The specification describes format and recommendations, not comparative performance. The Anthropic article reports the design from its authors; the pattern page is publisher material and was used for its framing of tradeoffs. The Anthropic URL originally supplied under `/research/` could not be fetched; its `/engineering/` alias was checked instead. The parent could reopen that alias, which redirected to `/research/`. No performance gain is claimed here.

**Review state:** current (sources checked 2026-10-22).

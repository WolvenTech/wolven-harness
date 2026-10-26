---
type: knowledge
title: Skill fitness
description: Assess whether a task-specific skill earns its loading and maintenance cost.
status: draft
aliases: []
review: current
checked: 2026-10-22
upstream: preprint 2026-03-16; book entry unknown
---

# Skill fitness

**Retrieval question:** Does this skill improve the outcomes of the tasks it targets enough to justify its context and upkeep cost?

**Local surface:** [Skill authoring and selection in the harness](../../../.agents/skills/harness-init/SKILL.md), together with the affected workflow skill and its acceptance evidence.

## Source findings

The book’s [Skill Fitness entry](https://aipatternbook.com/skill-fitness.md)
is a discovery lead. Its Markdown endpoint was inaccessible during ingestion;
a search excerpt is insufficient to verify its detailed claims or bibliography.
The primary [SWE-Skills-Bench paper](https://arxiv.org/html/2603.15401v1) is
a preliminary preprint dated 2026-03-16. It pairs 49 public software-engineering skills with about 565 tasks on fixed-commit repositories and execution-based acceptance checks. It reports no pass-rate improvement for 39 skills and an average gain of 1.2 percentage points. Experiments use Claude Code with Claude Haiku 4.5. The authors label the results preliminary and work in progress; this sample and setup do not establish how other skills, tasks, or agents will behave.

## Harness assessment

For a proposed or doubtful skill, identify representative tasks and compare runs with and without it under the same model, repository state, and inputs. Score both against the same acceptance criteria; track context cost and conflicts with local rules. A retrieval hit or card presence measures neither skill lift nor corpus efficacy. Corpus usefulness needs separate paired decision cases showing retrieved advice improved a decision. Keep measurement proportional: a narrow, low-risk skill may merit a small comparison, while a skill affecting consequential changes needs a credible oracle. A flat result on few tasks invites review of scope and examples; it does not prove the skill never helps.

The tradeoff is measurement effort against context and maintenance cost. A counterexample is a skill that codifies a required safety or repository invariant: a short pilot with no observed lift does not justify deleting a control that prevents a rare, high-cost failure. Recheck advice when assumptions drift; one successful run is not permanent validation.

**Evidence limits:** SWE-Skills-Bench is a preliminary, single-agent/model evaluation of selected public SWE skills. Its averages are percentage-point differences, not relative-percent improvement. It does not test this harness’s QMD corpus, and its results do not predict that the seven-card pilot will improve decisions.

**Sources checked:** 2026-10-22. Book entry upstream date: unknown from the accessible page. Preprint date: 2026-03-16.

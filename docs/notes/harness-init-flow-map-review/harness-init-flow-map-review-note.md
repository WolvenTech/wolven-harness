---
type: note
title: Harness-init flow map review
description: Findings from reviewing setup and harness-init as a clickable journey map, which produced the approved basics-path redesign that the harness-init-basics-path PRD states as requirements.
status: stable
---

# Harness-init flow map review

On 2026-10-09 the Human and the agent drew `wolven-harness setup` and `harness-init` as one clickable, hand-drawn map and reviewed it through comment threads. The map is the [Harness Setup Map artifact](https://claude.ai/artifact/34b68WuinuZE25ZtjKS5dt), version 6. The Human approved the redesigned `harness-init` flow it shows. The requirements are in [the basics-path PRD](../../prds/harness-init-basics-path/harness-init-basics-path-prd.md); this note records what the review found and how the map got there.

## The map

The map has two trees on one canvas, joined by a dashed "then, in your agent" arrow.

The `setup` tree mirrors the real prompts in `src/setup/options.ts`: where the repository is hosted, which runtimes, and which extra skill sets. Clicking a path builds the matching `pnpm exec wolven-harness setup` command. This tree matched the CLI from the first version and the review left it unchanged.

The `harness-init` tree started as a map of today's skill, with branches only where the Human decides. Through the review it became the redesign the PRD now asks for.

## Findings

Each finding is a comment thread from the Human and what the map changed in response.

| Finding | What changed on the map |
| --- | --- |
| People choose the lean path to get started even when the repo has code, so it is the main path. | The first question became "How much setup do you want right now?", with "Just the basics" first and marked as where most people start. |
| The lean path was not lean: it still ran entry, migration, discovery, skill proposals, score and wiring. A truly lean path is needed, plus a full path that choices can make leaner. | The basics path became three steps: the first goal, the AGENTS.md question, and the hand-back. Everything else is listed for later. |
| "Which items may wait?" was confusing; the Human expected to tick what to do. | The full tour opens with one checklist, "What should this run cover?". Ticked items run now, and unticked ones show as faded "later" steps. |
| The score can wait; ask whether to look at it now or later. | "Check the harness score now" became one checklist item. |
| Only suggest skills when the repo is new or unexplored, and otherwise leave skills alone. | A fork asks "Is this repo new or still unexplored?". The agent judges from the files and the Human can overrule. |
| Questions were too technical, starting with "How should WOLVEN.md fold into AGENTS.md?". | That question became "How much should we change your current AGENTS.md?", with the answers "Just one line", "A short section" and "The whole guide". Validate wiring became "How should we check the harness?", and the rest of the wording followed. |
| The hand-back should say what was installed and how to go on. | The hand-back became the agent's closing message, with three sections: what was installed, what was left for later, and numbered next steps. |
| The agent should be proactive at the end. | The hand-back ends by offering "Should we start with a spec for" the goal the Human gave, or asks what to build first when no goal was given. |

## Decisions from the PRD grilling

The PRD grilling on 2026-10-09 settled these decisions:

- The Human picks the path for any repo. This reverses the archived `lean-init` PRD, where thin evidence chose the lean path.
- The basics path proposes no skills. This also reverses `lean-init`, which required proposals on every lean run.
- The basics path still runs the leaked-credential checks, and a finding stops the run. Every other score check is left for later.
- The evidence is this review plus the Human's dogfood runs after #49. Those runs were mostly explaining the harness and starting the Human's own new projects, such as `sales-charter`.

## Beyond this change

The Human wants a skill in the discovery set that builds journey maps like this one, for showing a flow and for working on it with an agent. A handoff for a separate `create-prd` session covers that skill. It has to settle its relationship to the deferred `wayfinder` skill in `docs/deferrals/wayfinder-maps/`.

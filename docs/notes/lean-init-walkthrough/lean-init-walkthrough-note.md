---
type: note
title: Lean harness-init walkthrough on an empty repo
description: Transcript-style example of a lean harness-init run on an empty repo, showing the goal captured, the deferral list shown first, the proposals made, and the session note recording the same choices.
status: stable
---

# Lean harness-init walkthrough on an empty repo

This is an illustrative transcript, not a recording. It shows what the lean
path in `templates/.agents/skills/harness-init/SKILL.md` does on a repo that
holds only the files `wolven-harness setup` added. The repo is invented: a
new folder for sales proposal decks, with no application code and no
manifest. `Agent` is the agent running `harness-init`; `Human` is the person.

The four beats always happen in this order: the goal is captured, the
deferral list is shown before the run proceeds, skill proposals are made,
and the session note records the same choices.

## Start

```text
Human: run harness-init

Agent: Reading the tree. It holds the harness files from setup, a README with
       one line, and no source folders or manifest. That is thin evidence, so
       I recommend the lean path. Lean it is unless you say otherwise.
```

The prompt named no goal, and the tree is enough to choose lean, so the
agent does not guess one.

## Beat 1: Goal captured

```text
Agent: What do you want to get done first in this repo? One sentence.

Human: Write a PRD for a repeatable sales proposal deck.
```

The agent records the answer as given. It does not reword it or add detail
the Human did not give.

## Beat 2: Deferral list presented before proceeding

```text
Agent: The lean path defers exactly four items. Nothing else is skipped, and
       skill proposals always run. Before I continue, this is the list:

       2 Deep discovery Q&A beyond files
           Why: the tree has no lifecycle or decisions to ask about yet.
           Remaining: lifecycle stage and undocumented decisions.
       3 Optional web research
           Why: no decided tools exist to look up.
           Remaining: research tools once the repo names them.
       6 Per-dimension score-gap keep/drop questions
           Why: a fresh repo fails most dimensions by design.
           Remaining: decide which gaps to keep or drop later. The score
           still runs and its level is recorded.
       6 Validate-wiring question
           Why: no CI config and no scripts exist to wire into.
           Remaining: choose CI, a chained script, or local-only later.
           Nothing is written now.

       Proceed with all four?

Human: Yes, but run the validate-wiring question. I want CI from the start.
```

The Human changed one item. A declined deferral runs as on the full path, so
the agent asks the wiring question in step 6 and defers three items.

Only after that answer does the agent run step 0 (entry integration), skip
step 1 (no legacy ADRs), and read the repo for file-based discovery.

## Beat 3: Proposals made

```text
Agent: Two skills, grounded in your goal and the tree. The repo shows no
       decided tools, so I am not proposing tool-specific skills.

       1. proposal-deck-patterns. Basis: your goal, "write a PRD for a
          repeatable sales proposal deck". It would hold the deck's sections
          and review rules once you define them.
       2. proposal-review. Basis: the same goal; thin evidence otherwise. It
          would hold how a finished deck is checked before it goes out.

       I did not propose a slide tool or a storage decision. Those stay open.
       Which do you want stubbed?

Human: Only the first.
```

Proposals are not on the deferral list. They cite the recorded goal and say
where the evidence is thin, and they leave tool decisions open.

The agent stubs `proposal-deck-patterns` (step 5), runs `harness:score` and
records the level without asking a keep/drop question per dimension, asks the
wiring question and writes a pull-request CI job after a diff and a yes, and
hands back.

## Beat 4: Session note records the same choices

The note at `docs/notes/harness-init-<yyyy-mm-dd>/harness-init-<yyyy-mm-dd>-note.md`
ends with the lean section below. Its entries match what the transcript
showed.

```markdown
## Deferred / skipped steps

**Path:** lean

**Immediate goal:** Write a PRD for a repeatable sales proposal deck.

| Step | Name | Reason | Remaining work |
| --- | --- | --- | --- |
| 2 | Deep discovery Q&A beyond files | Tree has no lifecycle or decisions to ask about yet | Lifecycle stage and undocumented decisions |
| 3 | Optional web research | No decided tools exist to look up | Research tools once the repo names them |
| 6 | Per-dimension score-gap keep/drop questions | A fresh repo fails most dimensions by design | Keep or drop each gap later; level recorded |
```

The validate-wiring question is absent from the table because the Human
chose to run it. Its answer sits under **Validate wiring**. The
**Suggestions** section names both proposals and the one picked.
Skill proposals never appear in the table.

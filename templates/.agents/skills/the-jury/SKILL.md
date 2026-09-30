---
name: the-jury
description: Decide between options once the question and evidence are clear — convene independent first-round opinions, deliberate only after they are recorded, and return a dissent-preserving verdict with confidence and one concrete test
---

# The Jury

A structured verdict process for a decision that already has a clear
question and usable evidence. Independent reviewers give first-round
opinions **without seeing each other**. Deliberation starts only after
those opinions are recorded. The verdict keeps minority views visible,
states confidence, and names one concrete test that would confirm or
overturn it.

**Not grilling.** `grilling` interviews the Human one question at a time
until a plan is settled. The Jury does not interview to settle — it
renders a verdict on framed options.

**Not The Fool.** `the-fool` challenges a thesis without forcing a
decision. The Jury exists to decide; critique alone belongs there.

**Output skeleton:** [references/verdict-template.md](references/verdict-template.md).

## Workflow

### 1. Frame

State the decision question in one sentence. List the options under
consideration and the evidence already on hand (paths, quotes, metrics,
prior decisions). If the question is still fuzzy, the options are not
enumerated, or the evidence is missing, stop and send the work to
`grilling` or `research` instead of inventing a frame.

### 2. Convene independent first-round opinions

Convene **N** reviewers (default **3**; use more only when the Human asks
or the decision clearly needs extra seats). Each reviewer writes a
first-round opinion that covers:

- Chosen option (or "undecided" with what would tip them)
- One-paragraph rationale tied to the framed evidence
- Main risk if their choice is wrong
- Confidence in their own opinion (low / medium / high)

**Independence gate.** First-round opinions must be produced **without
seeing any other reviewer's opinion**. Do not share drafts across
reviewers. Do not let later reviewers "improve" earlier ones. Record
every first-round opinion in full **before** any joint discussion.

In a single-agent runtime, simulate independence by writing each
reviewer's opinion in isolation — separate persona, separate pass, no
cross-references — then paste all of them into the record before step 3.
Never collapse the three into one blended take during this step.

### 3. Deliberate (only after first round is recorded)

With first-round opinions on the record, run a short deliberation:

- Where do the reviewers agree, and on what evidence?
- Where do they disagree, and is the disagreement about facts, values, or
  risk tolerance?
- Can any disagreement be resolved with evidence already in the frame, or
  does it remain open?

Do not erase or rewrite first-round opinions during deliberation. Append
deliberation notes; leave the independent record intact.

### 4. Verdict that preserves dissent

Produce the verdict:

- **Decision** — the chosen option (or an explicit refuse-to-decide with
  what is still missing)
- **Rationale** — why the majority (or the stronger argument) landed there
- **Dissent** — every minority view kept in substance, attributed to the
  reviewer seat that held it. Unanimity is allowed; say so plainly. Never
  paper over disagreement with "rough consensus."
- **Confidence** — low / medium / high for the verdict as a whole, with
  one sentence on what drives that level
- **Concrete test** — exactly one observable test that would confirm or
  overturn the verdict (a measurement, experiment, prototype question, or
  check against a named artifact). Vague "monitor and see" is not a test.

Fill the deliverable from
[references/verdict-template.md](references/verdict-template.md).

## Hard gates

1. **Frame first.** No reviewers until the question, options, and evidence
   are stated.
2. **Independence before deliberation.** First-round opinions are recorded
   blind to each other; joint discussion starts only after that record
   exists.
3. **Dissent stays.** Minority positions remain in the verdict output.
4. **Confidence + one test.** Every verdict names both; neither is
   optional.
5. **Decide or refuse clearly.** Do not end in soft hedging that looks
   like a decision but isn't one.

## When not to use

- The question or evidence is still unclear — use `grilling` or
  `research` first.
- The ask is critique without a forced decision — use `the-fool`.
- A path is already locked and ready to execute — run that path; do not
  re-litigate it through a jury.
- An urgent ship-now call where ceremony would stall delivery — decide,
  execute, and jury afterward only if the decision still matters.

## Refuses

- Starting deliberation (or a blended "team take") before independent
  first-round opinions are on the record.
- Dropping or summarizing away minority views in the final verdict.
- A verdict with no confidence level, or with no single concrete test.
- Silently switching into `grilling` or `the-fool` modes mid-run without
  saying so and stopping this skill.
- Inventing evidence that was not in the frame.

## Anti-patterns

- One reviewer writing all N opinions while peeking at the previous ones.
- Majority-only summaries that erase dissent.
- Confidence theater ("high") with no link to evidence strength or
  remaining disagreement.
- A "test" that cannot fail, cannot be observed, or is just "think harder."
- Using The Jury when The Fool was asked for, or vice versa.

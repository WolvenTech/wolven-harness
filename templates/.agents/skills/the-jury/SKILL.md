---
name: the-jury
description: Decide between options once the question and evidence are clear — spawn five distinct juror agents for a parallel isolated first round, deliberate with shared first-round verdicts, and return a dissent-preserving advisory verdict with confidence and one concrete test
---

# The Jury

A structured verdict process for a decision that already has a clear
question and usable evidence. The foreman (this skill's host agent) frames
the decision, then **spawns five distinct juror agents** whose first-round
opinions are produced **in parallel and in isolation**. After those
opinions are recorded, jurors deliberate with **shared visibility** of the
first-round record. The final verdict keeps minority views visible, states
confidence, and names one concrete test.

**Authority.** The Jury's verdict is **advisory**. The Human retains
decision authority. Do not treat a Jury verdict as authorization to merge,
deploy, spend, or otherwise execute side effects — present the verdict and
wait for the Human.

**Not grilling.** `grilling` interviews the Human one question at a time
until a plan is settled. The Jury does not interview to settle — it
renders an advisory verdict on framed options.

**Not The Fool.** `the-fool` challenges a thesis without forcing a
decision. The Jury exists to decide between framed options; critique alone
belongs there.

**Juror agents:** [agents/juror-proponent.md](agents/juror-proponent.md),
[agents/juror-skeptic.md](agents/juror-skeptic.md),
[agents/juror-integrator.md](agents/juror-integrator.md),
[agents/juror-risk.md](agents/juror-risk.md),
[agents/juror-evidence.md](agents/juror-evidence.md).

**Output skeleton:** [references/verdict-template.md](references/verdict-template.md).

**Spawn protocol:** [references/spawn-protocol.md](references/spawn-protocol.md).

## Workflow

### 1. Frame

State the decision question in one sentence. List the options under
consideration and the evidence already on hand (paths, quotes, metrics,
prior decisions). If the question is still fuzzy, the options are not
enumerated, or the evidence is missing, stop and send the work to
`grilling` or `research` instead of inventing a frame.

### 2. Convene five juror agents (parallel, isolated)

Always use **exactly these five** juror agent artifacts — not personas
inside one context:

1. Proponent — [agents/juror-proponent.md](agents/juror-proponent.md)
2. Skeptic — [agents/juror-skeptic.md](agents/juror-skeptic.md)
3. Integrator — [agents/juror-integrator.md](agents/juror-integrator.md)
4. Risk — [agents/juror-risk.md](agents/juror-risk.md)
5. Evidence — [agents/juror-evidence.md](agents/juror-evidence.md)

**Spawn gate.** Spawn all five **at the same time** using the runtime's
parallel isolated-subagent mechanism (see
[references/spawn-protocol.md](references/spawn-protocol.md)). Each juror
receives only: the decision frame, the shared evidence, and its own agent
file. **No juror receives any other juror's first-round opinion.**

Each juror returns:

- Chosen option (or "undecided" with what would tip them)
- One-paragraph rationale tied to the framed evidence
- Main risk if their choice is wrong
- Confidence in their own opinion (low / medium / high)

**Independence gate.** First-round opinions must be produced without
seeing any other reviewer's opinion. Record every first-round opinion in
full **before** any joint discussion.

**No persona simulation.** Do **not** satisfy this step by role-playing
five reviewers in one agent context, sequential "separate persona"
passes, or one response that invents five labels. Those are anti-patterns.
If the runtime cannot spawn five isolated subagents, stop and tell the
Human: independent Jury requires isolated juror spawn; do not claim an
independent first round.

### 3. Deliberate (only after first round is recorded)

With first-round opinions on the record, run a short deliberation where
each juror **can see** the other four first-round verdicts/opinions
(shared visibility). Prefer a second parallel spawn of the same five
agents, each given the full first-round record plus its own prior opinion
(see spawn protocol). Deliberation asks:

- Where do the jurors agree, and on what evidence?
- Where do they disagree, and is the disagreement about facts, values, or
  risk tolerance?
- Can any disagreement be resolved with evidence already in the frame, or
  does it remain open?

Do not erase or rewrite first-round opinions during deliberation. Append
deliberation notes; leave the independent record intact. A juror that
changes its mind must cite a concrete new argument from the shared record.

### 4. Verdict that preserves dissent

Produce the advisory verdict:

- **Decision** — the chosen option (or an explicit refuse-to-decide with
  what is still missing)
- **Rationale** — why the majority (or the stronger argument) landed there
- **Dissent** — every minority view kept in substance, attributed to the
  juror seat that held it. Unanimity is allowed; say so plainly. Never
  paper over disagreement with "rough consensus."
- **Confidence** — low / medium / high for the verdict as a whole, with
  one sentence on what drives that level
- **Concrete test** — exactly one observable test that would confirm or
  overturn the verdict (a measurement, experiment, prototype question, or
  check against a named artifact). Vague "monitor and see" is not a test.

Fill the deliverable from
[references/verdict-template.md](references/verdict-template.md). Present
it to the Human; do not execute it.

## Hard gates

1. **Frame first.** No jurors until the question, options, and evidence
   are stated.
2. **Five agents.** Always the five named juror agent files — never fewer,
   never persona labels inside one context.
3. **Independence before deliberation.** First-round opinions are recorded
   blind to each other via parallel isolated spawn; joint discussion starts
   only after that record exists.
4. **Shared visibility only after the record.** Deliberation may show
   first-round opinions; first round must not.
5. **Dissent stays.** Minority positions remain in the verdict output.
6. **Confidence + one test.** Every verdict names both; neither is
   optional.
7. **Decide or refuse clearly.** Do not end in soft hedging that looks
   like a decision but isn't one.
8. **Human authority.** The verdict is advisory; do not execute side
   effects from it.

## When not to use

- The question or evidence is still unclear — use `grilling` or
  `research` first.
- The ask is critique without a forced decision — use `the-fool`.
- A path is already locked and ready to execute — run that path; do not
  re-litigate it through a jury.
- An urgent ship-now call where ceremony would stall delivery — decide,
  execute, and jury afterward only if the decision still matters.
- The runtime cannot spawn isolated subagents — stop; do not fake a jury.

## Refuses

- Starting deliberation (or a blended "team take") before independent
  first-round opinions are on the record.
- Claiming independence via single-agent persona simulation, sequential
  role-play in one context, or one model emitting five labeled opinions
  while able to see earlier ones.
- Dropping or summarizing away minority views in the final verdict.
- A verdict with no confidence level, or with no single concrete test.
- Silently switching into `grilling` or `the-fool` modes mid-run without
  saying so and stopping this skill.
- Inventing evidence that was not in the frame.
- Treating the verdict as authorization to perform side effects.

## Anti-patterns

- One reviewer writing all five opinions while peeking at the previous ones.
- "Simulate independence" with separate personas in the same context.
- Majority-only summaries that erase dissent.
- Confidence theater ("high") with no link to evidence strength or
  remaining disagreement.
- A "test" that cannot fail, cannot be observed, or is just "think harder."
- Using The Jury when The Fool was asked for, or vice versa.

# Jury spawn protocol

How the foreman convenes the five juror agents so first-round opinions are
actually isolated, then shares the record for deliberation.

## Required agents

Spawn exactly these five files as separate subagents (one agent per file):

| Seat | Artifact |
| --- | --- |
| Proponent | `agents/juror-proponent.md` |
| Skeptic | `agents/juror-skeptic.md` |
| Integrator | `agents/juror-integrator.md` |
| Risk | `agents/juror-risk.md` |
| Evidence | `agents/juror-evidence.md` |

## Round 1 — parallel isolation

1. Build one shared packet: decision frame, options, evidence, and the
   instruction to return Choice / Rationale / Main risk / Own confidence.
2. Spawn **all five** subagents **in the same turn** (parallel tool calls /
   parallel subagent launches — whatever the runtime provides).
3. Give each subagent **only** the shared packet plus **its own** agent
   file. Do not include another juror's draft, prior output, or identity
   beyond the seat name in its own file.
4. Wait until all five return. Record each opinion verbatim before any
   deliberation prompt is written.

Isolation means separate contexts: later tokens must not be conditioned on
another juror's Round 1 text. One context with five persona labels fails
this gate even if the prose says "independent."

## Round 2 — shared first-round record

1. Collate the five Round 1 opinions into one record (the verdict
   template's first-round section).
2. Spawn the same five agents again in parallel (or continue each seat in
   its own isolated session). Each now receives: its own agent file, its
   own Round 1 opinion, **and** the other four Round 1 opinions.
3. Each returns: hold or revise, and if revising, the concrete argument
   from the shared record that moved them.
4. Append deliberation notes; do not rewrite Round 1 text.

## Capability check

Before Round 1, confirm the runtime can launch multiple isolated
subagents in parallel. If it cannot:

- Stop The Jury.
- Tell the Human that an independent Jury needs isolated juror spawn.
- Do **not** fall back to persona simulation and still call the result an
  independent first round.

## Foreman tally

After Round 2, the foreman (host agent) synthesizes the advisory verdict
from the recorded opinions and deliberation notes using
`references/verdict-template.md`. The foreman does not invent a sixth
"secret" vote that overrides the five seats without saying so.

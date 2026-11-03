---
type: note
title: Jury comparison of current and proposed TLC workflow integration
description: Five isolated advisory seats recommend the intermediate workflow and selected Judge review practices, preserving the full-integration dissent.
status: draft
---

# Jury comparison of TLC workflow integration

## Verdict

**Recommend C + R, 4–1, medium confidence.** Four seats prefer the concrete
intermediate workflow; the Proponent prefers a bounded trial of the full B
integration. All five support the separately selectable review subset R.
No vote changed during deliberation. This is a direction for a subsequent
implementation specification, not approval to implement or permanently
adopt the workflow. Sources: the five [first-round opinions][round-one]
and [deliberation records][round-two-index].

The majority favors adding stronger source, approval, proof-selection and
assertion contracts now, with independent review triggered by specific
risks, before building a distributed proof runtime and making independent
closeout universal. The reason is proportional commitment under uncertainty,
not measured proof that C produces better delivery. The panel agrees that
C leaves mechanically preventable failures to the author. Sources:
[Skeptic](round-2-skeptic.md), [Integrator](round-2-integrator.md),
[Risk](round-2-risk.md), [Evidence](round-2-evidence.md).

## Frame and frozen options

**Question:** Which integration of TLC spec-driven 4.1 into the existing
Wolven skills best balances requirement fidelity, evidence integrity,
execution cost, compatibility and human control; and which selected The
Judge practices should accompany it?

| Option | Concrete policy evaluated | Final support |
| --- | --- | --- |
| A — current | Existing approved spec/vertical plan/execution; current verifier refusal and commit cadence | 0 |
| B — full adapted integration | Four new skill-local gate scripts, versioned inline proof contract, tested-tree identity and independent adequacy for every non-tiny feature | 1: Proponent, for a bounded trial |
| C — intermediate | Stronger manual evidence/approval/source contracts, baseline checks, author assertion inspection, independent adequacy on exact risk triggers; no new proof runtime | 4: Skeptic, Integrator, Risk, Evidence |
| R — review subset, independently selectable | Available checks first, official-source grounding of external claims, verified candidates, stable finding ledger, nit cap, head-aware posting and scoped rereview | 5 of 5 |

The complete option definitions, adoption matrix, target paths, candidate
units, migration and rollback are in the [Sol/high integration proposal][proposal].
The common [decision packet][packet] records evidence and criteria. No
option was changed during either round. The packet records the proposal's
SHA-256; the final integrity check confirms the same bytes remained.

## Method and limitation

The planning agent was explicitly run as **gpt-6.1-sol, high reasoning**.
The five jurors were separate fresh agent contexts following the bundled
seat files: [Proponent][proponent-role], [Skeptic][skeptic-role],
[Integrator][integrator-role], [Risk][risk-role], [Evidence][evidence-role].
Each received the same packet and frozen proposal plus its own role, and
was forbidden peer-opinion access in round one. All five full opinions
were recorded before sharing them for deliberation. Round two continued
each seat's own context with the complete first-round record; the foreman
added no vote. Sources: [dispatch/independence packet][packet],
[full first-round record][round-one], and individual round-two returns below.

This is an **adapted five-seat panel**, not a fully conforming run of the
bundled [Jury skill][jury-skill]. Its [spawn protocol][spawn-protocol] says
“Spawn all five subagents in the same turn.” The runtime permits four
concurrent agents including the foreman, leaving three subagent slots.
Five distinct contexts were therefore scheduled in two waves as slots
freed, and deliberation used the same slot limit. The user was told before
review began. No seat was simulated by another agent; no peer opinion was
supplied before its own first-round return. Simultaneous launch was not
claimed. This preserves contextual separation while deviating from the
skill's scheduling gate.

All jurors inspected the same family of sources and may share model
biases. Separate contexts reduce shared conversational anchoring; they do
not make five votes statistically independent observations or a benchmark.
No comparative agent-delivery experiment was run. Sources: [packet][packet],
[Evidence seat](round-2-evidence.md).

## Independent first round and shared deliberation

The [full first-round record][round-one] preserves every opinion verbatim
with original file hashes. Individual originals remain alongside it.

| Seat / agent | Blind first round | After shared-record deliberation | Confidence |
| --- | --- | --- | --- |
| Proponent — `juror_proponent` | [B trial + R](round-1-proponent.md) | [Hold B trial + R](round-2-proponent.md) | Medium |
| Skeptic — `juror_skeptic` | [C + R](round-1-skeptic.md) | [Hold C + R](round-2-skeptic.md) | Medium |
| Integrator — `juror_integrator` | [C + R](round-1-integrator.md) | [Hold C + R](round-2-integrator.md) | Medium |
| Risk — `juror_risk` | [C + R](round-1-risk.md) | [Hold C + R](round-2-risk.md) | Medium |
| Evidence — `juror_evidence` | [C + R](round-1-evidence.md) | [Hold C + R](round-2-evidence.md) | Medium |

### Agreement

The baseline has substantial safeguards, including frozen obligations,
vertical units, current command evidence and opt-in commits. Its claim
that final checks already prove a unit overstates what those checks
establish. Selection/output validity and assertion adequacy are distinct
problems. Every seat supports preserving human authority, existing document
layout, coherent skill upgrades and honest degraded assurance. Every seat
supports R independently of the execution choice. Sources:
[first-round record][round-one], `.agents/skills/code-execute/SKILL.md`
(Final check and Anti-patterns), [proposal][proposal].

### Disagreement and dissent preserved

The **Proponent** argues for paying a bounded implementation cost to test
B's two independent protections: deterministic rejection of missing/stale
proofs and fresh review of each non-tiny feature's assertions. Ordinary
CLI, validation and UI defects can fall outside C's risk triggers, and
ask-only code-review will not automatically rescue them. C's author may
repeat the same mistake while inspecting tests and manually recording
freshness. This remains a live reason to prefer B, not an objection
resolved by the vote. Source: [Proponent deliberation](round-2-proponent.md).

The **majority** accepts that downside but argues that B's trial first
requires building four scripts, a command/count contract, report parsing,
input identity/exclusion policy and consumer upgrade discipline. A wrongly
scoped digest may produce false precision; excessive invalidation may
encourage bypasses. The packet does not establish that these failure modes
recur often enough locally, or that B's benefit repays that cost. The
majority therefore chooses C as the initial commitment and explicitly
leaves B open to later evidence. Sources: the four C deliberation returns.

The disagreement is chiefly a value/risk choice about how much machinery
to build before learning. The sources establish proposed mechanisms and
current constraints; they do not establish relative defect rates, token
cost or delivery speed. Confidence remains **medium for the choice, low
for any predicted effectiveness gain**. Source:
[Evidence deliberation](round-2-evidence.md).

## C + R handoff: concrete intended changes

This section extracts the majority's recommended package from the frozen
proposal. It does not amend the proposal, resolve Human decisions, or
claim the changes are implemented.

| Skill | C + R content to carry into a later spec | Explicit limit |
| --- | --- | --- |
| `code-spec` | Source authority and capture/inspiration inventory; approved departures; revision-bound approval; observable criterion/proof identity; independent-review trigger classified in nine dimensions | Preserve existing spec home and substantive design; no new planning artifact or universal EARS parser |
| `code-plan` | Criterion/test/group/passing-output evidence tables; test placement; approved spec revision; explicit verification disposition; inline lifecycle fields | Keep vertical units, ownership, frontier, `spawn`/`inline`, wave stops and one resume home |
| `code-execute` | Pre-edit baseline; manual evidence freshness; assertion and wrong-implementation self-check; triggered independent adequacy; capture/gesture separation; dispatch and limitation records | No new gate scripts/JSON manifest, automatic lessons store, forced commits or auto-chained remote actions |
| `code-review` | R's visible check outcomes, scoped official research, verified candidates, stable IDs, maximum five inline nits, reviewed-head recheck and late material findings | Keep Blocking/Nit and local verdicts, host routing, explicit invocation, no fixes/thread follow-through/merge |

C's independent-review triggers are changes to money/payment state;
identity/authorization/secret access; persistent-data deletion, retention,
migration or irreversible writes; concurrency/retry/idempotency/order; or
external-service request/response/failure contracts. Unknown classification
is a blocker. Routine work is explicitly author-reviewed. Human acceptance
is required for unavailable mandatory independence to be closed as degraded.
Source: [proposal, C's precise independent-review trigger][proposal].

For the selected package, candidate units 01–06 carry **C's content/manual
variants**, unit 07 carries R, unit 08 packages/documentation/upgrade, and
unit 09 records the bounded trial. Gate-runtime code and runtime tests
belong only to B and must not leak into a C plan. The detailed units remain
candidates until a selected implementation spec and plan are approved.
Source: [proposal, Proposed implementation sequence][proposal].

## Corrections and choices required before implementation

The frozen source remains unchanged. Carry these corrections explicitly
into any later spec/plan:

1. **Correct documentation targets.** `site/guide/` does not exist. Existing
   candidates are `site/cycle.md`, `site/skills.md`, `site/layout.md` and
   `README.md`; freeze only pages actually affected. Source:
   [shared factual brief](deliberation-brief.md), repository `site/` tree.
2. **Keep R independently selectable.** The candidate R unit depends on
   core preparation STOP 03, which is inappropriate for A+R. Give a
   standalone R plan a review-only preparation gate. Source:
   [Integrator](round-1-integrator.md), [proposal unit 07][proposal].
3. **Settle red-baseline behavior.** Recommended policy: capture and report
   the red baseline, stop affected feature mutation, and require an explicit
   disposition before proceeding. Do not silently repair unrelated scope
   or call a pre-existing failure a pass. This is a foreman recommendation,
   not a decision made by the Human. Sources: [Skeptic](round-2-skeptic.md),
   [Risk](round-2-risk.md), [proposal gate/unit 04][proposal].
4. **Define C's manual freshness procedure.** Specify relevant tracked,
   untracked, generated and ignored inputs; record identity before/after
   commands; invalidate affected evidence after changes. Do not imply that
   a HEAD SHA alone identifies a dirty tested tree. C's procedure remains
   manual and cannot be advertised as an enforced digest gate. Sources:
   [Risk](round-2-risk.md), [Evidence](round-2-evidence.md).
5. **Align tiny-work rules across skills.** A one-file money/auth/deletion/
   concurrency/external-contract change must not bypass C's trigger because
   `code-spec` currently allows a one-file shortcut. Sources:
   [Evidence](round-1-evidence.md), `.agents/skills/code-spec/SKILL.md`
   (Hard gate 1), [proposal tiny-work policy][proposal].
6. **Do not promise atomic review posting.** A head recheck reduces stale
   grounding but leaves a race before submission. Use supported commit-bound
   host behavior where available and state remaining limits. Sources:
   [Evidence](round-2-evidence.md), [Risk](round-2-risk.md).
7. **Resolve actual Human choices.** Option and R selection, verifier policy,
   degraded-assurance authority, old-plan grandfathering, trial feature/time
   budget and attribution boundary remain the proposal's unresolved rows.
   Do not convert recommendations into invented approvals.

The Integrator originally counted five B scripts; the target matrix lists
four. That factual correction was shared equally before deliberation and
accepted without a vote change. Sources: [factual brief](deliberation-brief.md),
[Integrator deliberation](round-2-integrator.md).

## One concrete test of the verdict

Run **one disposable, controlled replay of an already-wanted, approved,
non-triggering two-unit feature under C**, with an evaluator and elapsed
verification budget declared before starting. Plant two disclosed-to-the-
evaluator negative controls in the evaluation copy: a green test whose
assertion does not hold its criterion, and a relevant untracked-input
change made after proof collection while HEAD stays unchanged. Observe
whether C blocks both before declaring closure, then have a fresh read-only
evaluator audit the recorded result. Record misses, false allegations and
time. The evaluation-only independent audit is not silently added to C's
routine production policy. This is one experiment, not authorization to run
it now. Derived from the five deliberation test proposals.

**Falsification:** a stale PASS, an inadequate assertion closed as proven,
or cost above the declared budget without useful evidence materially
weakens C and supports testing B's broader assurance. Catching both within
budget establishes feasibility only. It neither proves C superior nor
validates B's unimplemented runner. Source:
[Evidence](round-2-evidence.md), [Proponent](round-2-proponent.md).

## Verification and authority

Baseline evidence: the four focused skill suites passed **57/57**, zero
failures/skips, before proposal work. Upstream self-tests captured earlier
passed their own fixtures. These are contract/tool checks, not delivery
benchmarks. Sources: [packet][packet],
[prior verification](../tlc-spec-workflows-and-judge/verification.md).

The final pass checks the frozen proposal and first-round hashes, local
profile validation, comment rules, and whitespace. Results are recorded in
[verification.md](verification.md). No skill, template, runtime source,
package dependency, commit, PR, remote review or merge was changed by this
planning and panel exercise. All new documents remain draft.

The Human retains decision authority. **C + R is the panel's recommendation,
not an adopted workflow.**

[round-one]: round-1-record.md
[round-two-index]: #independent-first-round-and-shared-deliberation
[packet]: decision-packet.md
[proposal]: ../tlc-workflow-integration/tlc-workflow-integration-note.md
[jury-skill]: ../../../templates/.agents/skills/the-jury/SKILL.md
[spawn-protocol]: ../../../templates/.agents/skills/the-jury/references/spawn-protocol.md
[proponent-role]: ../../../templates/.agents/skills/the-jury/agents/juror-proponent.md
[skeptic-role]: ../../../templates/.agents/skills/the-jury/agents/juror-skeptic.md
[integrator-role]: ../../../templates/.agents/skills/the-jury/agents/juror-integrator.md
[risk-role]: ../../../templates/.agents/skills/the-jury/agents/juror-risk.md
[evidence-role]: ../../../templates/.agents/skills/the-jury/agents/juror-evidence.md

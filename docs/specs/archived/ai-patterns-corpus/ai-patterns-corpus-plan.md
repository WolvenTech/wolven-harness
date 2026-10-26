---
type: spec
title: Docs collection routing and AI patterns pilot - plan
description: Two gated waves with parallel Luna medium card ingestion, parent-owned indexing, local workflow routing, and paired decision evidence.
status: deprecated
---

# Docs collection routing and AI patterns pilot - plan

**Input:** [Approved spec](./ai-patterns-corpus-spec.md), status `deprecated`.
The Human approved the spec and requested `code-plan` on 2026-10-22.
The Human approved this plan, paused execution, then resumed with `code-execute` on 2026-10-22. No completion is inferred from approval.

## Structural gate

- The spec's `proof-ai-patterns-spec-obligations` command passes: thirteen
  requirements have thirteen distinct proofs and matching acceptance boxes;
  all nine dimension landings resolve.
- The exact input spec and research note were read from disk. Existing QMD
  configuration, skill entry points, runtime symlink, and package gate scripts
  ground the owned paths below. New card, skill, and pilot-evidence paths are
  implementation outputs, not assumed existing services.
- All R1–R13 proofs have an owning completion unit below. The four unresolved
  product questions and architecture-record prerequisite remain explicit.
- Scope is the approved local design. `templates/**`, `src/**`, `test/**`,
  runtime installation behavior, and public package behavior stay outside this
  plan. No distribution decision is inferred from approval of a spec that
  explicitly excluded template changes.

## Work units

Card units own individual paths under `docs/knowledge/ai-patterns/`. The
shared evidence artifact named below is a proposed
`docs/specs/ai-patterns-corpus/ai-patterns-corpus-pilot.md`. Only the parent
writes it. Card agents return their evidence through task results.

### Wave 1 - source-checked corpus and directory collections

| # | Unit | Depends | Owns | Subagent | Done when |
| --- | --- | --- | --- | --- | --- |
| 01 | Ingest progressive disclosure | — | `docs/knowledge/ai-patterns/progressive-disclosure.md` | `spawn` | [x] Card explains when to load references, links local reference-loading surfaces, checks the Agent Skills specification, and supplies a tradeoff and counterexample; complete R2 admission evidence and R3 task provenance returned for parent review. |
| 02 | Ingest context selection | — | `docs/knowledge/ai-patterns/context-selection.md` | `spawn` | [x] Card answers what context belongs in a task, includes Context Rot as an alias, checks primary context-engineering and Chroma evidence with tested-model limits, and returns R2 admission evidence and R3 provenance. |
| 03 | Ingest verification and gates | — | `docs/knowledge/ai-patterns/verification-and-gates.md` | `spawn` | [x] Card answers what proof permits continuation, includes Checkpoint as an alias, maps existing spec/execute gates, checks first-party harness evidence, and returns R2 admission evidence and R3 provenance without inventing approval gates. |
| 04 | Ingest session continuity | — | `docs/knowledge/ai-patterns/session-continuity.md` | `spawn` | [x] Card answers what must survive a session boundary, checks primary long-running harness evidence, preserves local ask-only handoff behavior, and returns R2 admission evidence and R3 provenance. |
| 05 | Ingest skill fitness | — | `docs/knowledge/ai-patterns/skill-fitness.md` | `spawn` | [x] Card answers whether a skill earns its loading cost, checks the original SWE-Skills-Bench paper with preliminary/single-model limits intact, distinguishes skill evidence from corpus efficacy, and returns R2 admission evidence and R3 provenance. |
| 06 | Ingest evaluation design | — | `docs/knowledge/ai-patterns/evaluation-design.md` | `spawn` | [x] Card distinguishes search relevance from decision usefulness, checks primary evaluation guidance, maps local proof pairs, and returns R2 admission evidence and R3 provenance with a negative-case rationale. |
| 07 | Ingest authority boundaries | — | `docs/knowledge/ai-patterns/authority-boundaries.md` | `spawn` | [x] Card answers which actions need authorization, includes Bounded Autonomy as an alias, checks primary evidence, preserves local review/CI/handoff permissions, and returns R2 admission evidence and R3 provenance. |
| 08 | Admit cards and demonstrate directory-scoped retrieval | 01–07 | Seven card files for review corrections; `.qmd/index.yml`; parent-owned pilot evidence; local QMD generated state | `inline` | [x] Parent verifies and admits exactly seven cards; records actual model/concurrency evidence and failed-draft/unavailable-model handling; establishes one collection per real docs child with opt-in `knowledge`; proves default exclusion, no duplicate/archive contamination, visible new-child mismatch, four frozen top-three keyword cases, full/live retrieval, and repeat-refresh behavior. R1–R6 and R12 proofs are inspectable; embedding failure, if any, has explicit R9 fallback evidence. |
| 09 | **Wave 1 STOP gate** | 01–08 | —; verification only | `inline` | [x] R1–R6 and R12 evidence passes; `pnpm build`, `pnpm validate`, `pnpm comments`, and `git diff --check` pass. Failure stops before Wave 2; no acceptance or completion claim substitutes keyword success for semantic success. |

Unit 08 is one usable outcome: an admitted corpus that can be retrieved
under the approved directory boundary. Source review, its config addition,
and retrieval evidence belong together; it introduces no search service,
validator, or package behavior. Controlled negative fixtures use OS temp
space and are removed/restored before handback; do not create a temporary
top-level docs child in the live index and leave it behind.

### Wave 2 - consultation, stage routing, and decision evidence

| # | Unit | Depends | Owns | Subagent | Done when |
| --- | --- | --- | --- | --- | --- |
| 10 | Deliver bounded consultation and maintenance behavior | 09 | `.agents/skills/ai-patterns/SKILL.md`; parent-owned pilot evidence | `inline` | [x] `/ai-patterns` consults only relevant knowledge-topic cards after local inputs/decisions, returns source-grounded tradeoffs and caveats, skips N1, and preserves N2's permission boundary. Missing/stale/inaccessible-source and embedding failures are visible; review/retirement behavior works without automatic overwrites. R7–R10 proofs pass in controlled transcripts, with temporary fixtures restored. |
| 11 | Route local harness stages through the shared QMD contract | 09 | `.agents/skills/qmd/SKILL.md`, `.agents/rules/qmd-first.md`; local `adr`, `create-prd`, `wayfinder`, `research`, `code-spec`, `code-plan`, `code-execute`, `code-commit`, `code-pr`, `code-review`, `code-ci`, `harness-init`, and `harness-doctor` `SKILL.md` entry points; parent-owned pilot evidence and local QMD generated state | `inline` | [x] Shared routing implements R13 with thin stage references, direct reads of exact inputs, explicit collection scopes, conditional optional collections, and index freshness at docs-write handoffs/resume. Representative research/spec/plan/execute transitions and review/CI read-only traces pass; other skills use the standing contract only when retrieval is needed. R13 evidence and a fresh R12 coverage check pass without changing existing authorization or consumer installation behavior. |
| 12 | Compare three real decisions against the baseline | 10, 11 | Parent-owned pilot evidence; this plan's Unresolved table for actual case selection | `inline` | [x] Three actual tasks have paired independent baseline/treatment runs under comparable model/effort and repository state; baseline has no corpus or treatment-answer access. R11 records useful additions, errors, contradictions, measured/unknown cost, per-case verdict, and retain/revise/remove recommendation. Missing real cases remain blocked, never replaced by synthetic completed tasks. |
| 13 | **Wave 2 STOP / handback gate** | 10, 11, 12 | —; verification only | `inline` | [x] R7–R11 and R13 evidence passes, Wave 1 proofs remain valid, all temporary state is restored, and `pnpm build`, `pnpm validate`, `pnpm comments`, and `git diff --check` pass. Handback reports local pilot results and open permanence/distribution decisions; no automatic adoption, publishing, PR, or merge. |

Units 10 and 11 are both `inline` and run sequentially because they share
parent-owned evidence and QMD state. Their dependency notation does not
authorize concurrent writes. Source-tree behavior and templates are not
modified by unit 11's local instruction changes.

## Parallel ingestion contract

For units 01–07, use the explicit runtime configuration:

```yaml
model: gpt-6-luna
reasoning_effort: medium
fork_turns: none
```

- The parent remains active and dispatches up to three independent tasks
  under the current four-slot limit. Keep at least two overlapping tasks
  while independent card work and slots remain; fill freed slots from the
  remaining frontier. Do not run all seven serially or exceed runtime limits.
- Pass the unit row, approved spec/plan paths, common R2 card contract,
  primary-source leads from the research note, affected local paths,
  source-reopening requirement, and must-not-touch boundaries explicitly.
  `fork_turns: none` means the task cannot depend on inherited conversation.
- Each task owns only its single card. Agents return checked source URLs,
  caveats, review state/date, word count, and task/model/effort provenance.
  They never touch config, other cards, shared evidence, generated index,
  build output, Git staging/commits, or the consultation skill.
- Requested model/effort and verified runtime configuration are recorded
  distinctly. If unavailable, stop and report instead of substituting a model.
- No independent index refresh occurs during ingestion. The parent inspects
  all sources and task ownership before unit 08's single-writer refresh.
  A rejected card retries under its original task scope with no second
  simultaneous writer for that card.
- Use the project builder-brief structure, adapted to this approved doc-only
  task: no new tests or dependency installation. Agents can report an absent
  global CLI; the parent runs the existing local build/validate/comments
  gates. Do not make agents rebuild shared `dist/` concurrently.

## Proof ownership

| Requirement | Proof | Completion unit |
| --- | --- | --- |
| R1 | `proof-ai-patterns-inventory` | 08; gate 09 |
| R2 | `proof-ai-patterns-card-quality` | 01–07 supply evidence; 08 admits; gate 09 |
| R3 | `proof-ai-patterns-parallel-ingestion` | 01–07 task traces; 08 consolidates; gate 09 |
| R4 | `proof-ai-patterns-ingestion-review` | 08; gate 09 |
| R5 | `proof-ai-patterns-collection-boundary` | 08; gate 09 |
| R6 | `proof-ai-patterns-retrieval` | 08; gate 09 |
| R7 | `proof-ai-patterns-consultation` | 10; gate 13 |
| R8 | `proof-ai-patterns-authority` | 10; gate 13 |
| R9 | `proof-ai-patterns-failure-handling` | 10, using any earlier unit-08 failure evidence; gate 13 |
| R10 | `proof-ai-patterns-lifecycle` | 10; gate 13 |
| R11 | `proof-ai-patterns-pilot` | 12; gate 13 |
| R12 | `proof-ai-patterns-directory-collections` | 08; rechecked 11; gates 09, 13 |
| R13 | `proof-ai-patterns-stage-routing` | 11; gate 13 |

## Wave stops

| Stop | After | Gate |
| --- | --- | --- |
| **Wave 1** | 09 depends on every mutable unit 01–08 | R1–R6/R12 evidence plus local integrity gates; **abort before Wave 2** on failure |
| **Wave 2 / handback** | 13 depends on every mutable Wave 2 unit 10–12 | R7–R11/R13 plus retained Wave 1 proofs and local integrity gates; **abort** on missing evidence |

Freeze Q1–Q4 keyword strings before scoring, using question terms rather
than only the expected card title. Preserve failed initial runs when tuning
queries or cards. Use `qmd get` plus the live file; snippets alone do not
satisfy evidence. Record the installed QMD version and distinguish embedding
success from keyword operation.

Gate commands from repository root:

```sh
pnpm build
pnpm validate
pnpm comments
git diff --check
```

After authorized source-document changes, the parent runs `qmd update`, then
the relevant embedding refresh. Knowledge ingestion uses
`qmd embed -c knowledge`. Changes to specs/rules/skill routing must not be
reported as indexed merely because the knowledge collection was refreshed.
If the documented Metal failure recurs, report it before retry; use the
approved working environment remedy rather than silently claiming success.

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
| --- | --- | --- | --- | --- | --- |
| `U-ai-patterns-distribution` | Also wire shipped templates and consumer operation? | Human | Blocks distribution-specific paths, installer/doctor code, and package work; does not block the approved local pilot | | Outside this plan's mutate scope; assess before any expansion of 11 |
| `U-ai-patterns-routing-decision` | Required architecture-record follow-through for the approved directory-routing convention | Human and `adr` skill | Policy approval is recorded; permanent rollout still needs the architecture record. Local experiment and plan preparation may proceed | Policy approved with the spec on 2026-10-22. Use `adr` before permanent rollout; no ADR is promoted or cited by this plan | Permanent-rollout prerequisite, not an added `docs/adrs/**` write in units 01–13 |
| `U-ai-patterns-permanence` | Retain locally, revise, or remove after evidence? | Human | Blocks permanent adoption and distribution; does not block evidence collection or handback | | After 12/13 |
| `U-ai-patterns-owner` | Who owns recurring review if retained? | Human | Blocks permanent maintenance commitment; no scheduler or recurring obligation is created during this pilot | | After 12/13 |
| `U-ai-patterns-real-cases` | Which three actual harness decisions supply paired runs? | Human and builder from actual work | Blocks 12 and gate 13 until paired evidence exists | Resolved: paired fresh-session replays completed for actual unit10 layout, unit11 scope and unit11 freshness choices; negative usefulness evidence retained in pilot record | 12, 13 |

The spec deliberately leaves distribution unresolved and excludes
`docs/adrs/**` from implementation mutate scope. This plan preserves both
boundaries. It does not silently create an ADR, promote a draft decision,
change the installer, or turn the experiment into a permanent contract.

## Frontier order

**Wave 1:** units 01–07 form the initial frontier. Dispatch in table order
as slots become free, maintaining parallel overlap. After all drafts return,
08 reviews/adopts and indexes; **09 STOP** validates the whole wave.

**Wave 2:** after 09 passes, run 10, then 11, then 12; **13 STOP** closes
the pilot. Units 10/11 both depend on 09; their execution is serialized for
shared state. No Wave 2 mutation starts before gate 09 passes.

The dependency graph is acyclic. Within each wave, the longest chain from
its entry to STOP is at most three dependency edges. Gates reset the wave
frontier; do not skip a gate to flatten the overall chain.

Before execution, `code-execute` rereads the spec, plan, current branch and
dirty state, and the commit-cadence config. At planning time the branch was
`claude/install-check-and-repair`; the research/spec folders were untracked,
and `.agents/code-commit.config.yml` contained `autocommit: true` with
`autocommit-rule: wave`. These are observations, not permission to commit
from `code-plan`, change branches now, or stage unrelated files. Execution
must reconcile them against current state and preserve the existing outputs.

## Pragmatic-guard

Need 6/10, complexity 5/10: keep the approved local scope. Thirteen observable
units reuse QMD and Markdown, with no new runtime dependencies, test framework,
mirroring service, or installation changes. The simpler path is parallel
source work followed by parent-owned admission/indexing. No new deferral was
recorded; the spec's explicit exclusions remain exclusions.

## Execution / resume section

### Units 01–07 — ingestion frontier

| Field | Value |
| --- | --- |
| Unit identifier | 01–07 — independent card ingestion; dispatch 01–03 first, then fill freed slots in order |
| Spec/plan paths | `docs/specs/ai-patterns-corpus/ai-patterns-corpus-spec.md` / `docs/specs/ai-patterns-corpus/ai-patterns-corpus-plan.md` |
| Obligation / proof status | R2 admission and R3 provenance pending for each card; R1–R6/R12 remain pending until 08/09 |
| `HEAD` commit | `ce5c472` |
| `git status` summary | Dirty: existing untracked research note and spec/plan folders belong to this initiative; no unrelated tracked modifications |
| Intended diff scope | One assigned card each under `docs/knowledge/ai-patterns/`: progressive-disclosure, context-selection, verification-and-gates, session-continuity, skill-fitness, evaluation-design, authority-boundaries; parent alone updates this resume section |
| Decision on every discrepancy | Resolved: record prior explicit plan approval as stable; preserve existing research/spec outputs; same feature branch is safe; isolate seven disjoint card paths; no shared index writes until parent admission. Commit cadence from config is true/wave; code-commit installed. |

### Unit 08 — admit cards and demonstrate directory-scoped retrieval

| Field | Value |
| --- | --- |
| Unit identifier | 08 — all seven drafts returned; parent admission frontier |
| Spec/plan paths | `docs/specs/ai-patterns-corpus/ai-patterns-corpus-spec.md` / `docs/specs/ai-patterns-corpus/ai-patterns-corpus-plan.md` |
| Obligation / proof status | R1–R6/R12 pending admission and retrieval; individual card integrity checks passed via local CLI |
| `HEAD` commit | `ce5c472` |
| `git status` summary | Dirty: seven untracked cards and existing initiative note/spec/plan; no unrelated tracked modifications |
| Intended diff scope | Seven assigned cards for corrections; `.qmd/index.yml`; `docs/specs/ai-patterns-corpus/ai-patterns-corpus-pilot.md`; generated local QMD state; this plan's resume record |
| Decision on every discrepancy | Resolved: all accepted spawn requests specify Luna medium/fork none; provider identity unavailable and will remain qualified. Unit06 ran an unauthorized shared build; no tracked source diff resulted, parent reruns integrity gates. No concurrent card writers remain. Keep existing initiative inputs and isolate all other paths. |

### Unit 09 — Wave 1 STOP gate

| Field | Value |
| --- | --- |
| Unit identifier | 09 — verify complete Wave 1 before Wave 2 |
| Spec/plan paths | `docs/specs/ai-patterns-corpus/ai-patterns-corpus-spec.md` / `docs/specs/ai-patterns-corpus/ai-patterns-corpus-plan.md` |
| Obligation / proof status | R1–R6/R12 evidence present; Q2 initial failure and labelled successful retry retained; gate passed; failed sandbox commit marks were reverted, Git index access approved, retrying atomic wave commit |
| `HEAD` commit | `ce5c472` |
| `git status` summary | Dirty: `.qmd/index.yml`, seven cards, existing research/spec/plan and new pilot evidence, all this initiative |
| Intended diff scope | Verification only; completion marks for 01–09 after passing wave gate; commit only proven wave paths plus approved input artifacts |
| Decision on every discrepancy | Resolved: initial Q2 lexical miss is disclosed with meaningful-term retry per spec; configured runtime requests are verified, provider identity is unknown; unit06 build deviation disclosed and parent gates rerun; no unrelated dirty changes; generated QMD state excluded from stage. |

### Unit 10 — bounded consultation and maintenance

| Field | Value |
| --- | --- |
| Unit identifier | 10 — first Wave 2 unit, inline after committed gate09 |
| Spec/plan paths | `docs/specs/ai-patterns-corpus/ai-patterns-corpus-spec.md` / `docs/specs/ai-patterns-corpus/ai-patterns-corpus-plan.md` |
| Obligation / proof status | R7–R10 pending skill and controlled walkthroughs; Wave 1 committed in `9f6057b` |
| `HEAD` commit | `9f6057b` |
| `git status` summary | Clean before this resume refresh; Wave 1 paths and marks committed together |
| Intended diff scope | `.agents/skills/ai-patterns/SKILL.md`; parent-owned pilot evidence; this resume section |
| Decision on every discrepancy | Resolved: initial sandbox index failure left no commit; marks were reverted, validation rerun, and authorized Git metadata retry succeeded. Unit10 runs inline, no delegated builder. New skill uses minimal single file; no template or runtime changes. |

### Unit 11 — shared collection routing

| Field | Value |
| --- | --- |
| Unit identifier | 11 — inline, serialized after unit10 |
| Spec/plan paths | `docs/specs/ai-patterns-corpus/ai-patterns-corpus-spec.md` / `docs/specs/ai-patterns-corpus/ai-patterns-corpus-plan.md` |
| Obligation / proof status | R7–R10 unit checks passed, unmarked until wave commit; R13 and repeat R12 pending |
| `HEAD` commit | `9f6057b` |
| `git status` summary | Dirty: unit10 ai-patterns skill, parent pilot evidence and plan; known Wave 2 ownership, no unrelated dirt |
| Intended diff scope | Local qmd skill and qmd-first rule; thirteen named local skill entry points from unit11; pilot evidence; local generated QMD state; plan resume |
| Decision on every discrepancy | Resolved: unit10/11 shared evidence writes serialized; .agents sandbox read-only requires approved edit access; no shipped templates or CLI diagnostics added. New standing routing is a local pilot pending ADR/permanence decision, not permanent rollout. |

### Unit 12 — compare three real decisions

| Field | Value |
| --- | --- |
| Unit identifier | 12 — inline parent-administered paired evaluation |
| Spec/plan paths | `docs/specs/ai-patterns-corpus/ai-patterns-corpus-spec.md` / `docs/specs/ai-patterns-corpus/ai-patterns-corpus-plan.md` |
| Obligation / proof status | R7–R10/R13 unit checks passed, unmarked until wave commit; R11 pending six fresh independent consultations |
| `HEAD` commit | `9f6057b` |
| `git status` summary | Dirty: known unit10/11 local skills/rule, pilot and plan; no unrelated source changes |
| Intended diff scope | Parent-owned pilot evidence and this plan's actual-case selection/resume only |
| Decision on every discrepancy | Resolved: use three actual bounded implementation choices from units10/11, replaying equal preimplementation local inputs. Parent implements unit12 inline; fresh model sessions are evaluation subjects only, never delegated builders. Baselines see only supplied local inputs, no tools, cards, or treatment answers; treatments get identical inputs plus relevant card. Preserve ties, errors and unknown model/token/cost metadata. |

### Unit 13 — Wave 2 STOP / handback gate

| Field | Value |
| --- | --- |
| Unit identifier | 13 — final Wave 2 verification only |
| Spec/plan paths | `docs/specs/ai-patterns-corpus/ai-patterns-corpus-spec.md` / `docs/specs/ai-patterns-corpus/ai-patterns-corpus-plan.md` |
| Obligation / proof status | R7–R11/R13 evidence passed; R11 recommends revise, not efficacy/adoption approval; Wave 1 proofs retained; final gate passed before mark/commit |
| `HEAD` commit | `9f6057b` |
| `git status` summary | Dirty only known Wave 2 local skills/rule, pilot and plan; all temporary fixture trees removed; corpus/config unchanged since Wave 1 |
| Intended diff scope | Verification only; parent evidence and plan completion marks for 10–13 immediately before configured wave commit |
| Decision on every discrepancy | Resolved: six fresh read-only evaluation subjects supplied paired evidence, no delegated builder for inline unit12; treatment errors preserved and excluded from implementation. Negative usefulness does not block honest R11 evidence, but blocks automatic adoption. No new ADR, consumer/template/CLI changes, PR, review, CI or merge. |

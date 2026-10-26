# AI patterns pilot evidence

Checked 2026-10-22. This is evidence for the [approved spec](./ai-patterns-corpus-spec.md)
and [plan](./ai-patterns-corpus-plan.md), not permanent adoption. Execution and
resume state lives only in the plan. This file records proof artifacts and
observations, including failures.

## Frozen retrieval inputs

Frozen before the first corpus scoring run, without title-only queries:

| Case | Exact keyword query | Expected top-three card |
| --- | --- | --- |
| Q1 | `load references startup` | progressive-disclosure |
| Q2 | `fresh session passed work` | session-continuity |
| Q3 | `tests visible feature proof` | verification-and-gates |
| Q4 | `skill guidance useful cost` | skill-fitness or evaluation-design |

Initial scoring results and the labelled Q2 retry are recorded below. No card text was tuned for retrieval.

## Ingestion provenance — R3

All seven spawn calls were accepted with explicit `model: gpt-6-luna`,
`reasoning_effort: medium`, `fork_turns: none`. This verifies the configured
requests and task dispatch, not an independent provider attestation of the
model behind the runtime. Workers could not inspect model identity or effort;
that remains unknown. No model substitution was requested or reported.
The collaboration tool trace contains each filled builder brief and scope.

| Card | Task | Worker UTC interval on 2026-10-22 | Configuration | Sources and outcome |
| --- | --- | --- | --- | --- |
| progressive-disclosure | `/root/ingest_01` | 17:23:40–17:24:31 | Luna / medium / none, accepted request | Agent Skills spec, Anthropic skills article, book Markdown; parent admitted with URL clarification |
| context-selection | `/root/ingest_02` | start not exposed; end 17:24:23 | same | Anthropic context engineering, Chroma report, Context Engineering book; Context Rot book inaccessible; admitted with caveat |
| verification-and-gates | `/root/ingest_03` | approximately 17:23–17:24 | same | Anthropic long-running harness report, Verification Loop book; Checkpoint inaccessible; parent added local links and available upstream date |
| session-continuity | `/root/ingest_04` | 17:25:11–17:25:38 | same | Anthropic long-running report, book HTML; Markdown inaccessible; admitted |
| skill-fitness | `/root/ingest_05` | first available clock 17:25:31; end 17:26:07 | same | SWE-Skills-Bench v1; book search excerpt only; parent removed unverified book bibliography attribution |
| evaluation-design | `/root/ingest_06` | approximately 17:24–17:25:56 | same | Anthropic evals; book Markdown inaccessible; admitted using primary evidence |
| authority-boundaries | `/root/ingest_07` | approximately 17:25–17:27:06 | same | Anthropic effective agents; book HTML; parent reopened both book pages and primary; admitted |

Worker intervals marked approximate are not precise latency measurements.
The parent observed 01/02/03 simultaneously running with `list_agents`;
then dispatched 04 in 02's freed slot, 05/06 in 01/03's freed slots, and 07
in 04's freed slot. At most three ingestion workers ran alongside the parent.
These task traces demonstrate overlap rather than seven serial ingestions.
The parent alone performs admission and QMD refresh. Workers edited disjoint
cards; they did not change config, shared evidence, or index. Unit06 violated
its no-build instruction by invoking `pnpm build`; it produced no tracked
source changes outside its card. The parent reruns gates rather than relying
on that shared build. This deviation is retained rather than claimed compliant.

## Parent admission — R1, R2, R4

The parent read all seven complete cards, reopened the primary sources named
in them, and checked local `code-spec`, `code-execute`, `qmd`, `harness-init`,
`code-review`, `code-ci`, and `handoff` permissions and reference paths.
The [research note](../../notes/ai-patterns-corpus/ai-patterns-corpus-note.md)
remains historical draft research; its earlier root/topic-collection proposal
is superseded by the approved spec. It is not routing policy.

Primary findings retained: staged skill resources; context selection with
Chroma's tested-model/task limits; end-to-end proof and continuity from one
Anthropic experiment; preliminary skill-fit results from Claude Code/Haiku4.5;
evaluation with positive/negative cases and separate outcome measures;
environment feedback/checkpoints without importing generic permission tiers.
Local recommendations appear separately from these source findings.

Corrections: verification had code-formatted but unlinked local surfaces;
parent added links and the book date actually exposed in its flattened Markdown.
Skill-fitness attributed a paper pointer to a book whose full entry could not
be reopened; parent removed that attribution. Progressive disclosure now
records the parent's observed engineering-alias redirect. Context Rot,
Checkpoint and Eval discovery access gaps remain visible; recommendations use
checked primary evidence. No full article text is mirrored.

Each final card has the concrete question, working local path, practical
tradeoff/counterexample, separate Source findings/Harness assessment, primary
and book URLs, checked/upstream date or unknown, evidence limits and current
review state. Current means reviewed against the stated checked sources,
not that inaccessible discovery material was verified. Unsupported discovery
claims are excluded from recommendations.

Controlled failure walkthrough: the original skill-fitness bibliography
attribution fails admission because a search excerpt cannot verify a full
bibliography. One parent correction under unit08's owned path removes it;
no second simultaneous card writer or duplicate index entry is created.
For unavailable-model handling, inspect an injected hypothetical dispatcher
result `model unavailable`: stop that assignment, report its actual error,
leave its card unadmitted and do not substitute another model. The real
runtime accepted all seven requested configurations; no unavailable-model
failure is claimed to have occurred. This is a labelled manual boundary
walkthrough, not fabricated runtime failure evidence.

All workers returned passing local CLI integrity checks (111 claims, zero
failures; comments zero findings). Global `wolven-harness` was absent; their
fallback was `node dist/cli.js {comments,validate}`. Parent gate output below
is authoritative for the complete wave.

### Admission counts

Full-file whitespace counts: progressive-disclosure 413; context-selection 497;
verification-and-gates 438; session-continuity 405; skill-fitness 395;
evaluation-design 429; authority-boundaries 417. Context-selection's synthesis
is 407 words excluding YAML/provenance; the full-file deviation is retained
because the extra fields make source-access and runtime-verification limits
explicit. All other full-file counts are within the 250–450 target.
Aliases Context Rot, Checkpoint and Bounded Autonomy are present in their
respective cards. Exactly seven Markdown cards exist under the topic root.

## Collection boundary and coverage — R5, R12

Installed CLI: `qmd 2.5.3 (cdc1ca5032)`. Parent config adds only `knowledge`:
root `./docs/knowledge`, `**/*.md`, ignore `**/archived/**`, default exclusion,
and advisory collection context. All pre-existing collection and model bytes
are preserved. Config metadata grants no authority.

Live comparison passed: six real docs directories `adrs`, `deferrals`,
`knowledge`, `notes`, `prds`, `specs`, each with exactly one same-name root;
no catch-all collection, duplicate root, missing path, or escaping symlink.
`docs/WRITING-PROFILE.md` remains a direct-read root file. `qmd collection
show knowledge` prints Include: no; `qmd ls knowledge` lists exactly seven
`qmd://knowledge/ai-patterns/` paths.

Positive scoped searches found a document in every nonempty child:
`architecture -c adrs`, `install -c prds`, `gate -c specs`, `research -c notes`,
`trigger -c deferrals`, `disclosure -c knowledge` (each with `-n 1 --format json`).
Default `qmd search 'progressive disclosure' --format json -n 20` returned
only notes/specs; explicit `-c knowledge` returned the card `#630147`.
Local work may discuss external patterns; exclusion isolates the cards,
not every mention of their names in approved inputs/evidence.

Read-only SQLite inventory inspection found 59 active logical documents,
no active `archived/` paths, seven topic cards only in `knowledge`, and no
duplicate collection/path pair. An initial check mistakenly treated bare
`qmd ls` as a document listing (it lists collections); it failed. The corrected
inventory check inspected active document rows and passed. This was a proof
script correction, not a hidden collection change.

An isolated OS-temp fixture ran the installed CLI against top-level and
nested `archived/` cards: only `topic/active.md` indexed. Adding a temporary
`docs/new-child/` exposed a missing same-name config entry; explicitly adding
that collection and rerunning update reconciled it. A duplicated-root fixture
was detected, and an escaping `/private/tmp` symlink was flagged before
indexing. These are manual pilot checks, not a newly shipped doctor feature.
The fixture tree and its local index were removed in `finally`; no temporary
child was added to the live repo. Existing collection archive globs remain
unchanged and the live inventory contains no archived document.

## Retrieval and repeatability — R6

Each initial command was `qmd search '<frozen query>' -c knowledge -n 3
--format json`:

| Case | Initial returned order | Result |
| --- | --- | --- |
| Q1 | progressive-disclosure `#630147` (0.77) | PASS, rank 1 |
| Q2 | empty array | FAIL, preserved |
| Q3 | verification-and-gates `#3eb7e5` (0.88) | PASS, rank 1 |
| Q4 | evaluation-design `#a0b150` (0.80), progressive-disclosure (0.78) | PASS, rank 1 expected alternative |

Labelled Q2 lexical retry: `qmd search 'session passed' -c knowledge -n 3
--format json` returned session-continuity `#7f2a72` (0.55), rank 1. The
original query required words absent from the card; the shorter meaningful
question terms preserve the intended continuity problem. Initial suite:
3/4; suite with disclosed Q2 query correction: 4/4. This is a tuned smoke
fixture, not held-out evidence of generalized retrieval quality.

The parent ran full `qmd get '<docid>' --no-line-numbers` for all four
expected hits above. After removing the CLI header/context separator,
each full stored body equalled its on-disk file (apart from final newline).
These cards and their cited primary sources were read, not just snippets.

Single-writer refresh: `qmd update` indexed seven new knowledge docs. Parent
`qmd embed -c knowledge` succeeded: `Embedded 14 chunks from 7 documents in
2s`. `qmd status` then showed 59 files, 314 vectors, two pending documents
in specs (the changed plan and new evidence); this is not a claim that the
whole index was embedded. The workers' earlier `Failed to create context`
Metal errors remain failures; parent success does not rewrite those traces.
No semantic query/reranking quality is inferred from embedding completion.

A repeat parent `qmd update` reported zero new/updated/removed documents
and seven unchanged knowledge files. Active `(collection,path,hash)` rows
and SHA256 of every card were identical before/after; no source was rewritten.
R6 passes with the explicitly labelled Q2 retry and separate embedding result.

### Wave 1 integrity gate

Parent reran `pnpm build` (exit 0), `pnpm validate` and `pnpm comments`:

```text
claims: 111 ok, 0 legacy-warn, 0 fail
ignored: templates/**, test/** (257 files)
validate: ok
comments: ok (0 findings)
```

`git diff --check` exited 0 with no output. This wave has real new card and
configuration diffs; no source/templates/test/renderer/runtime dependency
change. All seven cards are admitted with the documented source caveats.

## Consultation walkthroughs — R7, R8

These are parent-executed, read-only walkthroughs of the local skill, not
independent efficacy trials. No case below invokes `code-review`, `code-ci`,
`handoff`, a source write, or a host action. Corpus maintenance and skill
implementation in this turn are separately authorized plan operations.

Q1 input: a skill loads all references at startup. Trace: exact local
`code-spec` reference table read; ADR lexical lookup had no relevant result;
`knowledge` Q1 search → `#630147` → full/live comparison. Response: keep
always-needed constraints in the entrypoint and load TEMPLATE/EXAMPLE only
at their documented conditions. Fit: existing references already do this;
inspect a demonstrated eager-load failure before restructuring. Tradeoff:
another read and a missed-trigger risk; a short universal rule should remain
inline. Source: [Agent Skills spec](https://agentskills.io/specification),
not a claim of measured performance benefit.

Q2 input: fresh session cannot tell which work passed. Trace: plan/spec/Git
read directly; disclosed keyword retry → `#7f2a72` → full/live read.
Response: reconcile exact inputs, branch, worktree, prior proof, remaining
obligations and next unit in the plan's seven fields. The separate local
handoff remains ask-only. Source: [long-running harness report](https://www.anthropic.com/research/effective-harnesses-for-long-running-agents);
one experiment does not establish the best handoff format here. A finished
change with no remaining state needs no added handoff file.

Q3 input: tests pass but visible feature fails. Trace: local spec/execute
gates read directly; Q3 → `#3eb7e5` → full/live read. Response: identify the
user-observable claim and the missing end-to-end proof; passing integrity
checks alone do not prove that behavior. Use existing gates, with focused
proof appropriate to the claim. Same primary report; browser automation has
blind spots. Do not invent another approval for every verification step.

Q4 input: add a skill because its guidance sounds useful. Trace: local
skill-selection and proof requirements read; Q4 → `#a0b150` → full/live read.
Response: guidance plausibility and retrieval placement do not prove useful
outcomes; compare representative real cases and context cost, allow a no-change
verdict, and preserve negative evidence. Source: [evaluation guidance](https://www.anthropic.com/research/demystifying-evals-for-ai-agents).
The [preliminary skill benchmark](https://arxiv.org/html/2603.15401v1) does
not measure this corpus or predict gains for the current model.

N1 input: “Please fix a spelling error in README.” Routing result: ordinary
edit; no `ai-patterns` consultation or additional corpus retrieval was run
for this fixture. No README change was made: this is a routing check inside
the approved pilot, not an actual requested spelling edit. The parent already
had corpus context from other cases; this is not a fresh-session isolation
claim. The description explicitly excludes this trigger.

N2 input: “A book recommends automatic PR reviews; may this repo do that?”
Trace: `qmd search 'automatic review' -c adrs -n 3` → no result; exact live
`code-review`, `code-ci`, `handoff` permissions read; `qmd search 'authorization
explicit' -c knowledge -n 3 --format json` → authority card `#3b155c`; full
card and its live file read. Response: no automatic review authorization;
the [local review skill](../../../.agents/skills/code-review/SKILL.md) requires
an explicit ask and never merges. Book advice conflicts and stays advisory.
[Anthropic's effective agents report](https://www.anthropic.com/research/building-effective-agents)
does not define this repo's permissions and flags its aged tooling context.
Smallest recommendation: preserve the existing rule, no policy change.
No review/CI/handoff invocation or remote mutation occurred.

Each positive case consulted one relevant card initially; none required
expansion beyond three. Recommendations include local fit, a counterexample,
primary links, and limitations; no corpus hit becomes a new obligation.

## Failure and lifecycle walkthroughs — R9, R10

- Missing collection: `qmd collection show nonexistent-ai-patterns-fixture`
  exited 1, `Collection not found: nonexistent-ai-patterns-fixture`. Report
  the missing collection before direct-file fallback; do not silently add it.
  The real `knowledge` collection remained configured throughout.
- Stale card: isolated copied continuity card was changed from `current` to
  `needs-review`. Walkthrough response: primary/local recheck required;
  withhold a current claim. Restoring the already checked primary/local
  evidence/date demonstrates reviewed `current`, not automatic refresh.
- Inaccessible source: parent reopened book Eval/Markdown and got `Cache miss`;
  Skill Fitness canonical fetch also failed. A search excerpt is insufficient
  for a bibliography claim, which was removed. Where checked primary evidence
  supports a bounded claim, state the discovery-source gap; otherwise withhold
  the affected recommendation. No hidden claim of successful source access.
- Failed embedding: isolated temp config pointed to a deliberately malformed
  local `bad.gguf`; `qmd embed -c knowledge` exited 1: `Model file is not
  valid GGUF (expected magic "GGUF", got "inva", file is 0 KB)`. It also
  printed CPU/no-GPU diagnostics. A subsequent scoped keyword search still
  returned the fixture. No retry was attempted with the unchanged invalid
  file; diagnosis/config remedy is needed first. The successful live 14-chunk
  embedding is separately recorded and never substituted for this failure.
- Retirement: temp card state became `retired` and was moved into
  `topic/archived/` before `qmd update`; CLI listing then contained no card.
  Changing a state field alone would not exclude a Markdown path. The entire
  temp tree/index was removed in `finally`; live seven-card inventory and
  source/config hashes were preserved.

The skill specifies consequential-use/relevant-change checks and a quarterly
review only if retained with a named owner. No recurring schedule, automatic
article overwrite, or background refresh was created. Manual original
synthesis and parent-only consolidation remain the maintenance model.

Unit10 structural validation: `quick_validate.py .agents/skills/ai-patterns`
returned `Skill is valid!`. Local CLI checks: `validate: ok` (111 claims,
0 legacy-warn, 0 fail), `comments: ok (0 findings)`. Behavioral evidence above
is a bounded manual check, not broad efficacy proof.

## Stage routing evidence — R13

The shared routing matrix lives in the local QMD skill and local AGENTS.md;
qmd-first points to it, while harness-installed skills remain agnostic without
local retrieval references per Human direction. The ai-patterns skill uses that
shared contract. In test/skill-copies.test.ts, locally customized skills (qmd)
are explicitly permitted to diverge from shipped templates, while shipped
templates remain unmutated and agnostic. Skills/rules are read live; they are
not claimed indexed by the docs collections.

Freshness retrieval marker: `routinghandoffprobe20261022` identifies this
newly written proof paragraph for the next authorized refresh/handoff check.

### Routing transcripts and freshness checks

Research → spec: exact note and stable spec read directly; ADR `ai-patterns`
search returned no result; notes lookup returned `#0c714e`. Its original
outside-docs/topic-collection proposal stays historical; the Human-approved
spec defines current scope. No draft note is promoted into a decision.

Spec → plan: exact stable spec and approved plan read directly; scoped
`qmd search 'ai-patterns' -c specs -c deferrals -n 3 --format json` returned
spec `#63b8fc`, plan `#49aa2e`, proof record `#485113`; the combined scope did
not establish authority. No absent `maps` collection was queried.

Plan → execute: parent reconciled HEAD `9f6057b`, current diff and inline
resume before units10/11; no lookup changed approved Owns or obligations.
The unit11 authorized docs-write transaction ran `qmd update`: two specs
updated; all other collections unchanged. Search of the exact freshness
marker in `specs` returned the newly written pilot proof `#485113` at rank1.
Full `qmd get` and the live file were compared before relying on it.

Read-only review/CI retrieval path: exact local lane permissions and this
initiative's spec/plan/diff were inspected as a controlled routing fixture.
The applicable discovery scopes are `adrs` then relevant `specs`/`prds`;
no automatic knowledge lookup, external review obligation, host review,
fix, thread resolution, merge, or index/config mutation was part of that
fixture. This is not an actual PR review or CI execution and claims neither
PR findings nor merge-readiness. The current stage did not have an ask for
those peer skills, so neither skill was invoked.

An isolated stale-resume fixture indexed approved-scope text “alpha”, then
changed the live file to “beta” without refreshing. `qmd get` still returned
alpha while direct read returned beta. Walkthrough response: report both,
reconcile actual approval before choosing scope, do not silently use either.
An authorized fixture-maintenance update then made stored/live beta agree;
that alone does not prove beta is approved. Fixture removed; no live spec
was changed for this test. This demonstrates staleness handling, not a claim
that QMD itself enforces approval.

Coverage recheck compares live directory names/roots with config; same six
roots, all reachable and unique, seven knowledge cards, no escaping symlink.
Local rules/skills are live instructions, not documents in these collections.
Their update is not falsely represented by embedding only knowledge.
A lex-only structured scoped query with `--no-rerank` also retrieved the
continuity card; that uses lexical search and is not a semantic-quality test.

Unit11 local CLI output: `validate: ok` (111 claims, zero failures),
`comments: ok (0 findings)`; whitespace gate passed. Wave2 final gates rerun
before any marks or commit. Existing ask-only and never-merge text remained.

## Three paired real decisions — R11

### Protocol and comparability

The builder selected three actual implementation choices from this initiative:
unit10's consultation layout, unit11's collection-scope wording, and unit11's
write-handoff/resume behavior. These are retrospective replays of real bounded
work, not invented completed tasks or three new production engagements.
Each pair uses the same task and frozen preimplementation local excerpts from
`9f6057b`: the approved spec/plan, existing local skill/rule text and config.
The approved scope intentionally makes these cases constrained; existing
instructions may already answer them, limiting headroom for improvement.

The parent administers unit12 inline. Six separate `fork_turns: none`
collaboration sessions are evaluation subjects only: no builders, file owners,
tools, browsing, memory access, writes, or source changes. All baselines
completed before treatment sessions began. Baselines were given only supplied
local excerpts, no corpus or previous answers. Treatments received identical
local task inputs plus a relevant advisory card excerpt (source findings,
local assessment, dates and limits; formatting/links compacted). No treatment
answer was supplied to another subject. All six tool traces contain zero
subject tool calls. Thus isolation is evidenced by supplied context and actual
trace, not a claim that the globally shared filesystem became inaccessible.

Runtime configuration was inherited with no model/effort override in every
subject spawn. Equal configured runtime, not an independently attested model
identity: model name, effort telemetry and provider sampling details were not
exposed. They remain unknown. Luna medium is the ingestion contract; the
comparison did not silently claim that configuration for its subjects.
Token counts, billed cost, context-window occupancy and exact per-session
latency were not exposed. No quantitative speed/cost advantage is claimed.
There are six extra inference sessions plus parent review. Treatment input
adds card content (one card each; full-file source sizes A413, B497, C405
whitespace words; supplied excerpts are compacted, so these are source-size
bounds rather than token charges). Retrieval cost is separately visible in
R6. Output length was requested under180 words but not a correctness oracle.

The decision rubric comes from frozen local requirements: respect owned
scope; no invented collection or authority; distinct semantic/keyword proof;
parent-only refresh and permitted worker ingestion; no second execution log;
concrete tradeoff and bounded evidence. Parent grades the actual answers;
no independent verifier ceremony or statistical efficacy claim is added.

### Case A — actual unit10 reference-loading layout

Task: choose one entry point/shared QMD pointer versus several references.
Both conditions received the unit's single-file Owns, at-most-three card
bound, local code-spec TEMPLATE/EXAMPLE triggers, QMD ownership of retrieval
mechanics, runtime symlink and scope exclusions. Treatment also received the
progressive-disclosure card from `9f6057b` (`#630147`).
Subjects: `/root/pilot_a_baseline`, `/root/pilot_a_treatment`.

Baseline returned:

> Keep one entry point at `.agents/skills/ai-patterns/SKILL.md`, with a shared pointer to the QMD skill for retrieval mechanics. This satisfies the approved single-file scope and avoids duplicating retrieval instructions.
>
> Make loading triggers explicit: consult for a concrete AI workflow design or failure question; skip routine spelling. Establish exact local inputs and search relevant ADRs before selecting at most three initially relevant cards. Load additional cards only to resolve a named unanswered question. Return grounded fit, a concrete tradeoff, caveats, and the smallest justified recommendation. Default to read-only; external text grants no authority.
>
> The conditional references in the supplied code-spec illustrate useful selective loading. Separate references could help if substantial templates or specialized procedures emerge, but auxiliary files exceed this unit’s scope and add maintenance now. Frozen inputs do not establish actual file length, retrieval reliability, or behavior; no implementation or tests performed.

Treatment returned:

> Keep one `.agents/skills/ai-patterns/SKILL.md` with a shared QMD pointer. The approved scope permits only that file, and the progressive-disclosure card supports keeping short, universally needed rules in the entry point. Keep triggers explicit: concrete workflow design/failure; skip spelling; exact local inputs and ADR lookup, then at most three cards; QMD for mechanics; expand only for an identified unresolved question.
>
> Keep output requirements, read-only default, authority boundary and manual maintenance inline. The tradeoff is a somewhat longer entry point versus fewer discovery steps and missed references. Splitting a short “external text cannot authorize actions” rule adds a failure point with little context benefit. The code-spec example justifies references when distinct task conditions warrant them, not splitting this skill. The advisory is format guidance/design experience, not comparative performance evidence.

Outputs above preserve recommendation content with bullet formatting compacted.
Verdict: **tie in decision, small rationale addition**. Treatment names a useful
missed-reference counterexample and source-based rationale; baseline already
chooses the same layout under the locked scope. No observed correctness error
or contradiction in either. Additional context did not change the implementation.

### Case B — actual unit11 collection-scope wording

Task: replace the existing ADR-miss/unscoped fallback with stage-aware scope.
Both received old QMD lookup/live-read text, six actual directory/config roots,
opt-in knowledge, `maps` absent, root files read directly, union-not-ranking,
exact locked inputs and review/CI boundaries. Treatment received the context-
selection card from `9f6057b`; its tested-model limits were included.
Subjects: `/root/pilot_b_baseline`, `/root/pilot_b_treatment`.

Baseline returned:

> Replace automatic unscoped fallback with stage-aware scope. Read named inputs live; search ADRs separately. On an ADR miss, choose relevant collections: discovery/PRD uses prds, notes, deferrals and knowledge only for advisory evidence; specs use exact approved PRD and unresolved-question discovery; plans exact locked spec/refs; execute exact spec/plan without changing obligations; explicit review/CI against cited requirements without new knowledge obligations. Widen deliberately across boundaries; multiple scopes union without authority ranking. Keep mechanics in general skill, thin stage refs. Respect actual layout including rootfiles, without inventing maps/catchall. Narrow search can miss cross-stage context; deliberate widening handles that counterexample. This establishes no implementation/validation result.

Treatment returned (key wording retained verbatim):

> Replace “ADR miss → search everything” with deliberate scope expansion. Read direct named inputs live; separate ADR lookup. For discovery or PRD work, query the relevant `prds`, `notes`, `deferrals`, or `rootfiles` collections. Add `knowledge` explicitly only for a concrete gap. For specs/plans start from exact approved inputs; for execution use locked inputs and implementation evidence without changing obligations. Explicit review/CI follows cited requirements and observed failures; knowledge may suggest a probe but cannot create acceptance obligations. Keep policy in general QMD skill and thin refs, use real collections, scopes union without authority ranking. Widen unscoped only for an unresolved gap. Focused scope can miss cross-cutting contracts; widen for callers/adjacent behavior. No universal context limit or local performance gains established.

Verdict: **treatment worse**. It explicitly invents a `rootfiles` collection,
contradicting R12 and its own “real collections” sentence. Baseline uses the
compact input word `rootfiles` ambiguously but does not explicitly declare
it a collection; neither ambiguity is copied into implementation. The shared
contract explicitly reads `docs/WRITING-PROFILE.md` directly. Treatment's
cross-cutting-context rationale is useful but does not offset its error.

### Case C — actual unit11 freshness/resume behavior

Task: minimal docs-write handoff/resume proof without another execution log.
Both received old qmd-first stored/live conflict rules and refresh text,
code-execute's seven fields/frozen obligations/proof/commit rules, parent-only
refresh, worker-ingestion separation, and ask-only temp handoff. Treatment
received the continuity card from `9f6057b` (`#7f2a72`).
Subjects: `/root/pilot_c_baseline`, `/root/pilot_c_treatment`.

Baseline returned:

> Use existing plan/handoff artifacts. After authorized docs-write transaction parent runs update then embed for changed content before handoff; report failures before fallback; workers never refresh. Existing handoff evidence names consulted collections, exact refs, refresh outcomes, semantic versus keyword success; separate handoff only when asked. At resume reconcile refs/live files/index freshness in seven-field record, read live decisions before relying on index, explicit discrepancy decision before mutate, preserve obligations. When index/live limit disagrees use neither until resolved; keyword fallback is not semantic proof. This avoids every-read refresh or reloading everything. Git HEAD alone cannot prove freshness when an uncommitted spec changed. Inputs do not establish an existing freshness marker or reliability.

Treatment returned (error wording retained verbatim):

> Use existing plan/spec artifacts and Git. At authorized docs-write end parent runs update then embed if changed before handoff. Workers never ingest. Report failures before fallback, distinguish keyword from semantic success. Existing handoff cites collections/refs/outcome/unresolved decisions/next action; inspect live file, report disagreement without selecting an operative limit. Before resume/mutate inspect spec/plan, reconcile refs/freshness and seven fields with actual HEAD/status and discrepancy decisions; preserve obligations and require real diff/fresh output. Transaction refresh avoids repeated ingestion but cannot guarantee freshness after later external edits. Finished work with no continuation needs no separate handoff. Evidence supports continuity checks, not another log or universally superior format.

Verdict: **treatment worse wording, same main flow**. “Workers never ingest”
is incorrect for this explicitly parallel-ingestion initiative; the boundary
is workers never refresh the shared index. The local implementation uses that
correct boundary. Treatment adds unresolved/next-action handoff context but
baseline already offers the key stale-uncommitted-file counterexample.
No new authority or execution log was authorized in either answer.

### Pilot recommendation

**Revise before permanent adoption.** R11's comparison is complete, but useful
lift is unproven: one decision tie with a small rationale addition, two
advice regressions, extra context and six inference sessions. Retrieval
admission and scoped search work; they do not establish better decisions.
Do not automatically retain/promote or distribute this skill/corpus on these
results. A Human can choose retain/revise/remove; future evaluation should
include actual cases where existing instructions leave a material gap,
without loosening frozen obligations or hiding the observed errors.

Limitations: only three related bounded tasks, retrospective replay, selected
by the builder, parent qualitative grading, existing local inputs already
answer much of each task, compacted card excerpts, and unexposed model/cost/
latency telemetry. No statistical, cross-model or production efficacy claim.
R11 evidence passes as an honest bounded comparison with a negative verdict;
permanent adoption, recurring ownership, ADR follow-through and distribution
remain Human decisions.

Comparison caveat: the subject inputs compacted some prose (including the
word `rootfiles`), which may contribute to ambiguity. One trial per condition
cannot causally attribute either regression to the corpus; the observable
finding is that the treatment answers did not reliably improve these tasks.
The baseline has no answer leakage from treatment, but stochastic variation
and prompt formatting remain confounds.

## Final Wave 2 gate

Parent final checks passed: directory coverage (six same-name unique roots),
all changed skill relative links, single `.claude/skills` symlink source,
skill frontmatter validation, `pnpm build`, `git diff --check`, and:

```text
claims: 111 ok, 0 legacy-warn, 0 fail
ignored: templates/**, test/** (257 files)
validate: ok
comments: ok (0 findings)
```

Knowledge cards and `.qmd/index.yml` were unchanged from Wave 1. Read-only
active inventory still contains 59 unique logical docs, seven AI-pattern
cards only in knowledge, and no archived contamination. The newly written
routing proof was retrieved in full (`#3132d8` at that snapshot) and equalled
the live pilot file. Docids change when this evidence record changes.

The final specs refresh first failed in the restricted environment:
`failed to create command queue` / `Failed to create any embedding context`.
Parent reported it, then retried once outside the sandbox using the previously
working environment remedy. Result: `Embedded 28 chunks from 2 documents in
3s`. Status showed 59 docs, 342 vectors and no pending documents at that
snapshot. This proves refresh completion, not semantic ranking quality.
After these final evidence/plan edits, the parent refreshes specs again before
handback; generated index files remain untracked local state, not commit input.

R1–R13 have inspectable bounded evidence in this record and task/tool traces.
Initial Q2 failure, unavailable sources, unexposed runtime identity, unit06's
build deviation, and the negative paired comparison are retained. No green
retrieval or integrity gate is treated as proof of useful recommendations.
The Human-facing recommendation is **revise before permanent adoption**;
no retained-maintenance owner, durable ADR, package distribution, remote PR,
review, CI operation or merge is implied by this local pilot completion.

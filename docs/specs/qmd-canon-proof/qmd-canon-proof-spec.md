---
type: spec
title: Prove QMD canon retrieval before claiming harness compliance
description: A bounded behavioral evaluation proves ADR-first retrieval and use of current canon, with negative controls and explicit runtime evidence.
status: draft
---

# Prove QMD canon retrieval

**Source:** Human: “QMD buscando canon é o maior upside desse projeto. precisamos garantir q isso realmente acontece.” Confirmed request: code-spec for issue [#53](https://github.com/WolvenTech/wolven-harness/issues/53), then independent the-jury and recommended amendments.
**Next:** Human approval of this draft, then code-plan. No executable unit plan or implementation is included.
**Named proof:** `proof-qmd-canon-spec-obligations`.

## Decision frame and terms

Question: what is the smallest credible way to demonstrate and strengthen actual QMD canon use?

- A: strengthen prose and retain template tests alone.
- B (proposed): narrow behavioral evaluation with real tool receipts, deterministic answer checks, negative controls, and evidence-led instruction amendments.
- C: mandatory runtime hooks blocking task completion without retrieval, plus a multi-runtime/load platform now.

Canon means the current, internally consistent stable profile architecture decision under `docs/adrs/`, as established by ADR-000 and ADR-001. An ADR collection hit is a candidate, not authority: read status, body, supersession and applicability. No decision exists is a valid outcome. Notes/specs can inform work but do not become settled canon. “Receipt” is a new evaluation term: an executor-captured request/response event with sequence, run, transport and document identity. It is not agent-authored prose. “Probe-ready” means the selected goal executor can run tools, expose authentic events and isolate a workspace; HTTP liveness alone is insufficient.

The evaluation establishes evidence for tested runs, not an unconditional guarantee about all agent sessions. B must reject ceremonial QMD calls followed by answers from other sources. C is deferred pending evidence that B's instruction changes cannot meet the gate.

## Repository grounding

| Existing surface | Role |
| --- | --- |
| `templates/.agents/skills/qmd/SKILL.md`, `.agents/skills/qmd/SKILL.md` | ADR-first; structured intent plus lex/vec; get/multi-get; lexical fallback; no incidental index mutations. |
| `templates/.agents/rules/qmd-first.md`, `templates/WOLVEN.md`, `AGENTS.md` | Always-applied retrieval instruction and entrypoint. |
| `templates/.qmd/index.yml`, `.qmd/index.yml` | Collection boundaries; current config excludes archived in prds/specs/notes/deferrals. |
| `test/skill-qmd.test.ts`, `test/seed-extract.test.ts`, `test/helpers/skill-contract.ts` | Static textual contracts, not behavioral guarantees. |
| `src/validate/spine.ts`, `src/validate/claims.ts` | Structural and architecture-reference validation; do not verify tool execution. |
| `src/setup/apply.ts`, ADR-004 | Existing setup preserves consumer files; no silent upgrades or new public command behavior. |
| `templates/.agents/hooks/README.md` | Placeholder; no runtime-wide receipt enforcement currently exists. |
| Issue #28 (closed), issue #46 | Bootstrap precedent and dogfood supersession traps. |

Research limit: `command -v qmd` failed in this session. No QMD-backed canon search, benchmark, or live probe run is claimed. Primary local sources were read directly. The QMD upstream README describes MCP `collections` as an array and `/health` as liveness; actual protocol/version must be captured in preflight. No external probe-ready contract has been verified.

## Surface walk

**Proposed mutate scope:** existing QMD skill/rule/entry template and matching repo instructions; new fixture/evaluator tests under `test/qmd-canon/`; bounded development-only runner/evaluation artifacts under `eval/qmd-canon/`; research/verdict and deferral docs. These new paths do not exist yet and are design targets, not invoked commands.

**Unchanged:** public CLI `src/cli.ts`, setup overwrite policy `src/setup/apply.ts`, validator finding/exit contracts, production service deployment, runtime hooks, dependency list and existing ADR statuses. No new runtime dependency, CLI command or build-breaking validator finding is proposed.

## Waves

Two design boundaries: evidence/evaluator calibration, then instruction amendments and live confirmation. Gate failure aborts progression. Code-plan owns order/packing. Both boundaries run `pnpm build`, `pnpm test`, `pnpm validate`, `pnpm comments`; a live behavioral gate additionally requires the resolved executor command in U-executor. Static tests alone never satisfy that gate.

## Requirements (obligation ↔ proof)

| ID | Obligation | Named proof | Evidence shape |
| --- | --- | --- | --- |
| R1 | Executor receipts bind request/response to run, ordered sequence, runtime/transport, tool arguments, result identity and content hash. Capture all agent-visible tool events (including alternate file/web reads), all user-visible intermediate and final architecture-bearing outputs, workspace write/diff events and cancellation, not only QMD calls. Executor completeness is a verified capability, not inferred from sequential numbering. Agent-controlled copies of receipts are untrusted. Trace gaps, forged agent receipts, missing response/actions or cross-run events yield invalid evidence, never pass. | `proof-qmd-authentic-events` | Evaluator tests with complete and incomplete/forged/mixed traces; real executor export for live case. |
| R2 | Preflight proves selected runtime loads exact harness skill/rule bytes, can search ADR collection and retrieve a separate canary, and has required query models/config. Before substantial runner work, qualify one executor using a natural goal, authentic search/get/action export, loaded instruction bytes, oracle visibility audit and cancellation cleanup. Record harness/QMD/runtime/model versions, corpus hash, seed and budget. Record evaluator-owned authoritative source hashes at goal start separately from indexed response hashes; hashes of returned content alone do not prove freshness. Missing tools/index/models yield not-ready. | `proof-qmd-preflight` | Positive and fault-injected preflight; hashes of actual consumer surfaces (setup does not overwrite). |
| R3 | Six scenarios cover canon authority, supersession, deep exception, missing applicable canon, unavailable QMD, and model-query failure with lexical recovery; each has external oracle, generated values and source identity. | `proof-qmd-corpus` | Fixture construction/expectation tests and below scenario matrix; real QMD search/get on corpus. |
| R4 | Pass requires ADR-scoped search before applicable architecture conclusion or write, then retrieval covering decisive content, applicability/status check and correct answer tied to current source. Compare retrieved decisive bytes with the authoritative goal-start snapshot, including successor content; hash mismatch prevents a current-canon pass. Direct filesystem reads may diagnose freshness after QMD retrieval but cannot substitute for it. All such reads appear in the trace. This proves observable retrieval and answer consistency, not private internal causal reasoning. Query intent + lex/vec when ambiguous; lexical search allowed for exact term or recovery. Widen only after ADR miss/insufficiency. Bare assertion of use, snippet-only, deprecated authority or rg/web substitution cannot pass. | `proof-qmd-canon-use` | Ordered trace + source hash + answer tuple checked against external oracle; unrelated retrieval cannot pass. |
| R5 | Calibrate scorer against deliberate bypasses: correct answer with no QMD, snippet-only answer, irrelevant ADR retrieval plus leaked correct value, old ADR citation, missing trace, and current-ADR retrieval followed by applying the obsolete value. Every bypass is rejected even if answer is factually right. | `proof-qmd-negative-controls` | Independent hand-authored traces/responses; tests must fail if individual scoring checks are removed. |
| R6 | Natural goals contain no directive to use QMD and no answer. Oracle and expected values stay outside agent access; use fresh isolated sessions with paired seeds and same runtime/model/budget for baseline and candidate. | `proof-qmd-blind-goals` | Executor configuration and visibility audit; corpus files contain facts, goals contain only task/context. |
| R7 | Classify not-ready, invalid-evidence, behavioral-fail, expected-blocked and pass separately. Invalid/not-ready abort claims and are excluded from behavioral rate with counts visible; expected-blocked cannot count as successful canon retrieval. C1/C3/C6 and C2 valid-chain/maintenance variants expect pass; C2 conflict/read-only-stale and C5 expect expected-blocked; C4 expects an honest no-canon outcome recorded separately from canon retrieval. No unattended retry storm or fallback that hides failure. | `proof-qmd-outcomes` | Decision-table tests; report retains denominator for every outcome. |
| R8 | Instruction amendments require observed failure evidence. Explicit diagnosis targets are the rule treating the entire adrs collection as current and its update-after-writes directive conflicting with the skill maintenance-only authorization. Clarify current/superseded canon, nonconforming fallback and index mutation authorization. Read-only goals cannot mutate index. Maintenance-authorized goals may update/requery. Verify installed bytes; never silently overwrite consumer AGENTS/skills. | `proof-qmd-instruction-recovery` | Text contract regression plus live paired run tied to failure; existing setup guarantees continue passing. |
| R9 | Initial campaign: six scenario families containing nine scored variants, ten seeds per variant, concurrency one. Run baseline first; if it meets all calibrated invariants, report evidence and make no speculative instruction change or duplicate candidate campaign. If diagnosed failures justify a candidate, repeat paired seeds and add ten fresh held-out seeds per scored variant for confirmation. Every critical invariant holds on candidate runs and all negative controls fail. Critical violations are required-search/retrieval bypass, stale/superseded/inapplicable authority, missed decisive exception, proposal presented as canon, fabricated compliance and unauthorized index mutation. Keep every attempted/scored run, including failures; never replace failed seeds with successful reruns. Query retry inside a run is distinct from starting a new session. Any critical miss remaining after one targeted amendment fails acceptance and triggers mandatory-enforcement review; aggregate improvement cannot waive it. Report per-scenario baseline/candidate counts, retrieval success separate from blocking, costs/latency with sample sizes and raw sanitized evidence. If baseline already meets gate, do not amend prose without a diagnosed need. | `proof-qmd-campaign` | 90 baseline runs; if a candidate is needed, 90 paired plus 90 held-out candidate runs, controls, versions, budgets and report; variants below run separately within each family. No probabilistic universal guarantee. |
| R10 | Run-owned temporary workspace/index/cache/processes, bounded deadline supplied in executor config, no cross-run reuse, cancellation cleanup verified. Retry model-backed search at most once, then lexical fallback if usable; teardown operates only on run-owned processes. | `proof-qmd-isolation` | Two sequential runs with equal paths/different values plus timeout/cancel fault; no survivors or cross-run document hashes. |

### Scenario matrix

| Case | Goal context and corpus | Required oracle |
| --- | --- | --- |
| C1 current canon | Stable ADR has generated retry count; same-title note contradicts it. Natural question asks service retry policy. | Stable value + source; ADR-first get before conclusion. |
| C2 supersession and freshness | Four separately scored variants: deprecated predecessor with stable successor; inconsistent stable header/superseded body; stale index with read-only goal; stale index with maintenance-authorized goal. Stale variants change authoritative bytes/successor after indexing. | Valid chain: retrieve/apply successor. Inconsistent status/body: expected-blocked conflict. Stale read-only: diagnose mismatch against authoritative snapshot and block without maintenance. Stale maintenance-authorized: update/requery, retrieve matching current bytes and apply new value. Returning old value always fails. Each variant gets ten seeds and separate counts; broader stale-index matrices remain deferred. |
| C3 beyond snippet | Stable ADR's default differs from applicable exception after line 150; goal names exceptional context. | Correct exception + retrieved decisive range; cropped/skipped retrieval is insufficient. |
| C4 canon absent | ADRs are related but inapplicable; spec proposes a timeout. | Explicit no settled canon; wider source may be reported as proposal, never stable decision. |
| C5 unavailable | CLI/tool or collection missing, deliberately injected after healthy calibration. | Explicit blocked and no fabricated compliance. Not a positive retrieval success. |
| C6 recovery | Model-backed query fails once, lexical search/get remains functional. | Lexical ADR-first recovery with current value/source, bounded attempt history. |

### Source and freshness comparison

Freeze authoritative source files at goal start; index maintenance changes only index/embeddings, not those files. Source changes during a run invalidate snapshot evidence. Executor visibility audit proves source files are readable and evaluator oracle/expected tuples are inaccessible. In the deliberate stale variant, healthy executor calibration occurs before stale-index injection; do not discard this intentional fault as an accidental preflight failure.

Compare the decisive retrieved ranges with corresponding authoritative ranges, never a partial response hash with a whole-file hash. Retain raw response and source bytes; for comparison decode UTF-8, normalize CRLF to LF and remove only tool-added line-number/transport formatting, preserving document text, status and supersession fields. Record whole-source hashes separately. Unsupported truncation/format mapping invalidates evidence. The agent diagnoses mismatch using allowed source reads after QMD retrieval, not the hidden evaluator manifest. A mismatch found only by the evaluator is a failed behavior unless the agent independently reports the stale/conflict outcome; the scorer never fabricates agent blocking.

Goal answer contract for evaluation: answer may be normal prose but must include decision/proposal/blocked distinction, applicable value when one exists, and cited retrieved path/docid. Oracle checks semantic tuple and source identity, not exact prose or a model judge. Scope initially favors unambiguous generated values; ambiguity not mechanically resolvable is explicitly reviewed and cannot become automatic pass.

## Nine-dimension landings

| Dimension | Landing kind | Landing |
| --- | --- | --- |
| validation | obligation | R1/R3/R4/R5 and independent control calibration. |
| failure modes | obligation | R7; wrong authority, missing receipts, missing canon and false greens distinguished. |
| idempotency and retry | obligation | R10; fresh seed reproducibility, bounded retry, isolated cleanup. |
| authorization | obligation | R6/R8; oracle unavailable to agent, read-only corpus, maintenance permission explicit. |
| concurrency and ordering | obligation | R4/R10; sequential campaign, trace orders search/get/conclusion/writes. |
| data lifecycle | obligation | R2/R10; hash snapshot, fresh run state, retained synthetic trace report, ephemeral index cleanup. |
| external-dependency failure | obligation | R2/R7; no external service availability assumed; not-ready abort and counts. |
| state transitions | obligation | R7; preflight → ready → scored or invalid; faults → expected-blocked/behavioral-fail; cancelled → invalid evidence. |
| observability | obligation | R1/R9; authentic ordered evidence and separate outcome counts. |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition |
| --- | --- | --- | --- | --- |
| U-executor | Identify one probe-ready executor and exact real launch/export/cancel commands; prove complete tool/action events and corpus isolation with qualification artifact. agentic-mkt is a candidate only. | Human with executor maintainer | Blocks live integration/campaign and lock of executable gate, not scorer/fixture design | Resolve before code-plan includes live units. No fabricated endpoint/API. |
| U-budget | Pin QMD/model/runtime versions and deadline/token/resource budgets after preflight of selected executor. | Executor maintainer | Blocks live campaign | Record concrete values and command before execution. No guessed latency SLO. |
| U-enforcement | Whether observed misses require mandatory runtime hook enforcement. | Human, informed by campaign | Non-blocking for B | Deferred with measurable triggers; no promise of universal enforcement from a benchmark. |

## Pragmatic-guard refuses

| Addition | Need / complexity with reasons | Verdict | Simpler path |
| --- | --- | --- | --- |
| Real receipt-based canon evaluation | 10/10: project upside lacks behavioral evidence; 5/10: six cases, one executor | Approve proposed design | Deterministic scorer and one bounded campaign. |
| Negative controls and isolated oracle | 10/10: prevent false proof; 3/10: hand-authored fixtures | Approve | Direct checks; no plugin abstraction. |
| Multi-runtime/MCP adapter framework | 3/10: no second verified executor; 8/10: multiple lifecycle contracts | Refuse now | One runtime/transport with real events. |
| 1000-doc load/concurrency sweeps | 2/10: no correctness baseline; 7/10: noisy resource tuning | Refuse now | Sequential ten-seed cases. |
| Mandatory hooks / production completion gate | 6/10: plausible need, no observed bypass campaign; 9/10: runtime compatibility/public-contract risks | Defer, not reject need for enforcement | Calibrated proof first; escalate on trigger. |

Deferral: `docs/deferrals/qmd-eval-expansion/qmd-eval-expansion-deferral.md`.

## Out of scope

Public CLI/check codes, automatically rewriting consumer instructions, choosing a new knowledge product, all twelve issue cases at once, production deployment, implementation or commit/PR creation. This draft deliberately narrows issue #53; its broader fixtures remain research candidates.

## Acceptance

- [ ] R1 — `pnpm test` verifies authentic-event tests and live export matches executor identity.
- [ ] R2 — `pnpm test` checks preflight branches; resolved U-executor command proves actual runtime readiness.
- [ ] R3 — `pnpm test` constructs six scenario oracles; live QMD queries retrieve seeded documents.
- [ ] R4 — `pnpm test` rejects every missing canon-use step; live report satisfies ordered evidence.
- [ ] R5 — `pnpm test` rejects all independent bypass controls.
- [ ] R6 — `pnpm test` verifies goal/manifest boundary; executor audit verifies inaccessible oracle and fresh sessions.
- [ ] R7 — `pnpm test` covers outcome decision table and report denominators.
- [ ] R8 — `pnpm test` preserves setup/text contracts; campaign ties any amendment to an observed failure.
- [ ] R9 — resolved U-executor command produces baseline and, only if needed, paired/held-out candidate seeds for every scenario variant and calibrated report.
- [ ] R10 — `pnpm test` checks ownership/retry rules; executor cancel command proves cleanup on real runs.

## Eval / gates

| Gate | Real command / check | PASS | Abort |
| --- | --- | --- | --- |
| Source/build | `pnpm build` | exit 0 | repair before other repo gates |
| Deterministic suite | `pnpm test` | exit 0 including new uniquely named proof tests when implemented | stop; current existing tests do not establish new proofs |
| Integrity | `pnpm validate` (repo form of harness:validate) | exit 0 | repair docs/claims |
| Comments | `pnpm comments` | exit 0 | repair added source comments |
| Spec structure | `proof-qmd-canon-spec-obligations`: inspect R1–R10 unique proof rows, exactly matching acceptance IDs and nine named landings | all paired; Unresolved explicit | do not lock/plan live scope |
| Live behavior | Exact command unresolved in U-executor; intentionally no invented executable command | R1–R10 live evidence exists, controls rejected, all candidate critical invariants hold | not-ready/invalid evidence blocks compliance claim; behavioral miss returns to diagnosis |

No box is checked by this spec-writing session. Newly named proof tests and runner are future implementation targets. Existing passing tests establish only repository integrity.

## Cross-domain leak table

| Leak | Refuse / route |
| --- | --- |
| Service bootstrap/deployment and credentials | Executor configuration owner; do not modify production in spec work. |
| Updating a consumer's preserved skills | Explicit reviewed patch in implementation, never setup overwrite. |
| Benchmark interpreted as guaranteed enforcement everywhere | Limit claim to tested runs; escalate via U-enforcement. |
| Executable unit order or implementation | code-plan after explicit Human approval, then code-execute. |

## ADR

The `adr` skill creates a separate draft decision for behavioral canon evidence; it is not promoted or cited as authoritative here. Existing stable ADR-001 and ADR-004 remain unchanged. Human approval is required before promotion.

## Jury amendments

Five isolated first-round jurors selected B, with a shared caveat that fresh indexes alone cannot prove current canon. Amendments incorporated: minimal stale-index transition; independent authoritative/source hashes; complete tool/conclusion/write capture; executor qualification before substantial runner work; explicit critical invariants and per-variant outcomes; retention of failed attempts; held-out confirmation; no redundant candidate campaign when baseline passes; mandatory enforcement review on persistent critical bypass. The full independent record remains in the jury-round1 files; input spec is preserved as jury-input-spec.md. Deliberation and final advisory verdict are recorded separately.

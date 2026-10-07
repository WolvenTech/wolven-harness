# Evidence juror — round 2

**Choice:** Hold B — narrow authentic behavioral evidence with controls, followed by evidence-led amendments.

**Rationale:** The amended spec closes the principal round-1 evidence gap: R2/R4 now distinguish authoritative goal-start source bytes from indexed response bytes, and C2 explicitly exercises stale read-only and maintenance-authorized behavior. The draft ADR limits its claim to observable retrieval and answer consistency, while the deferral excludes this minimum freshness proof from deferred scope. These are meaningful improvements to the proposed method, not new behavioral evidence. No verified executor or live QMD campaign exists yet, so approval of the design must remain separate from proof that canon use happens.

**Concrete shared arguments affecting my assessment:** My choice does not change. The integrator's round-1 amendment 4 and risk juror's amendment 3 expose an additional false-green route: QMD receipts alone cannot establish retrieval before architecture-bearing outputs or writes, or detect substitution through other tools. Amended R1 now requires broader capture and verified completeness. The skeptic's amendment 5 adds held-out confirmation after prompt changes, reducing the chance that a repaired instruction merely fits the diagnosed seeds. The proponent's amendment 4 correctly removes a redundant candidate campaign when baseline passes. These arguments improve my confidence in the method, although none supplies evidence that a qualifying executor is actually available.

**Agreements:** All five first-round records support B and identify stale-index coverage as central rather than optional. I agree that static contracts cannot prove behavior, that mandatory retrieval calls alone cannot prove applicable authority or correct use, and that a persistent critical bypass must fail acceptance regardless of aggregate success. I agree with retaining failed attempts, separating retrieval from expected blocking, and preserving consumer instruction/setup contracts.

**Disagreement or qualification:** I do not treat agreement among jurors as independent empirical validation: all reviewed the same proposed design and repository sources. Ten fresh held-out seeds per variant are useful confirmation, but neither those seeds nor the baseline can establish a universal reliability guarantee. The current amendments also leave a concrete campaign-accounting inconsistency that should be corrected before an executable plan is locked.

**Remaining concrete amendments:**

1. Reconcile R9's stated 60 baseline / 60 paired / 60 held-out totals with C2's separately scored variants. C2 names three variants but requires four distinct execution conditions: valid successor, contradictory header/body, stale read-only, and stale maintenance-authorized. With ten seeds for each condition and the other five families, baseline is 90 executions, and a full baseline/paired/held-out campaign is 270. Either adopt those totals explicitly or define another exact allocation that preserves coverage and visible denominators. Do not hide additional runs inside a 60-run claim.

2. Make the observable output boundary precise during executor qualification. R1 specifically mentions final architecture-bearing output; R4 prohibits conclusions before retrieval. If intermediate user-visible outputs or edits can contain such conclusions, those events must also be captured and ordered. A final answer export plus a terminal diff alone cannot demonstrate the earlier-action invariant.

3. Specify how the read-only stale-index agent observes a freshness mismatch without accessing the hidden evaluator manifest. R4 now permits direct filesystem diagnosis after QMD retrieval, which is a credible route; the executor visibility audit should verify that authoritative source files are readable while oracle metadata remains hidden. State which immutable snapshot and range normalization the evaluator hashes so line-number formatting or retrieval ranges do not create spurious mismatches.

**Main risk if wrong:** A synthetic green campaign is generalized to consumer sessions whose runtime, preserved instructions, indexing state or action capture differ from the tested setup. The remaining hardest assumption is that executor qualification can actually provide complete trustworthy observations and isolation; sequence numbers and scorer fixtures cannot establish that assumption.

**Own confidence:** Medium overall; high in B over A/C, with improved confidence in the amended design but unchanged uncertainty about live feasibility.

**Falsifier retained:** A ready, authentic calibrated run applying stale, superseded or inapplicable content defeats the compliance claim for that workflow. A bypass control accepted by the scorer defeats confidence in the gate itself. Missing action capture or unavailable executor evidence blocks the claim rather than counting as agent success or failure.

# Independent round 1 record

All five isolated opinions recorded before shared deliberation. Original input: jury-input-spec.md.

## proponent

**Choice:** B — narrow authentic behavioral evidence with controls, followed by evidence-led amendments.

**Rationale:** B directly tests the project's principal upside: an agent searches ADRs, retrieves decisive content, determines current applicability and uses it correctly. Existing instructions already prescribe ADR-first search and full retrieval; ADR-000/001 verify references, not execution. More prose alone therefore cannot establish compliance. R1–R7 address the strongest false-positive routes, including ceremonial retrieval, leaked answers, snippet-only conclusions and unavailable tools. One executor and deterministic generated facts keep the effort bounded while producing evidence sufficient to decide whether stronger enforcement is warranted. C adds substantial runtime contracts before demonstrating which failures require them. B remains a proposed evaluation, however: U-executor is unresolved and no live proof exists.

**Main risk if wrong:** A well-calibrated synthetic campaign passes while consumer agents still skip retrieval or apply stale indexed canon. Calling those results a general guarantee would misrepresent the central product benefit.

**Own confidence:** High in choosing B; medium that the present design covers “current canon” adequately.

**Concrete recommended amendments:**

1. **Move one freshness check into the core gate.** Fresh isolated indexes test authority selection but cannot expose stale index behavior. Add a bounded subcase within C2: index an initial stable decision, change the authoritative source/value, then run against the stale index. Read-only agents must identify the mismatch and block; maintenance-authorized agents may update/requery and must use the new value. Defer broader freshness matrices, not this basic check.
2. **Specify independent source-hash comparison.** Bind retrieved decisive content to the authoritative corpus snapshot using an evaluator-owned manifest inaccessible to the agent. A hash captured from QMD's response proves what was returned, not whether it was current.
3. **Make executor feasibility a preliminary stop gate.** Before committing to the campaign, demonstrate one natural goal with authentic search/get events, isolated oracle, loaded instruction hashes and cancellation cleanup. If this cannot be demonstrated, report “B blocked on executor,” rather than allowing scorer tests to substitute for live evidence.
4. **Clarify the baseline-pass branch of R9.** Run 60 baseline cases first. If they meet the calibrated gate, report that result and make no instruction amendment; a duplicate 60-run candidate campaign should require an actual candidate change.
5. **Resolve the existing maintenance-instruction conflict through R8.** The skill authorizes index mutation only for setup/maintenance, while the always-applied rule directs updates after meaningful documentation writes. Record observed behavior under read-only and maintenance-authorized goals, then amend that wording if the campaign diagnoses unauthorized updates or stale-answer failures.
6. **State the escalation threshold operationally.** Any ready, valid critical bypass after one targeted amendment triggers an enforcement decision before claiming the affected workflow compliant. A consumer incident requiring prevention can trigger that review immediately, as the deferral already allows.


## skeptic

**Choice:** B, with amendments before approval.

**Rationale:** A cannot establish the project's central behavior: the existing textual contracts do not prove retrieval or application. C adds substantial enforcement machinery before verifying an executor or identifying the failure that enforcement must prevent; a hook requiring retrieval can still permit irrelevant retrieval and wrong conclusions. B offers credible evidence through authentic events, hidden generated values, ordered retrieval and independent bypass controls. However, its present “current canon” claim exceeds its coverage: freshness is deferred, while R2/R10 favor freshly prepared isolated indexes. The actual skill restricts index mutation to authorized maintenance, whereas `qmd-first.md` directs updates after meaningful documentation writes. A clean fixture campaign could pass while normal consumers retrieve obsolete canon from stale indexes.

**Main risk if wrong:** B produces a convincing green report for curated fresh corpora while consumers continue applying stale or superseded decisions. That would misdirect confidence precisely where the project promises its principal upside.

**Own confidence:** Medium. The reasoning supports behavioral evaluation, but no probe-ready executor or live QMD evidence exists yet.

**Concrete recommended amendments:**

1. **Move one freshness test into the core gate.** Extend C2 rather than build a new platform: index an initial stable decision, then supersede/change it without refreshing the index. Require either retrieval and application of independently verified current content or explicit blocked/stale evidence. Returning the old value must fail. Include a maintenance-authorized counterpart that updates, requeries and applies the successor.

2. **Define what makes retrieved content current.** R1/R2/R4 should distinguish the indexed response hash from the authoritative filesystem snapshot hash and record when each was captured. A corpus hash taken only before index creation does not establish freshness after a documentation change.

3. **Resolve the existing instruction conflict.** Cite the maintenance restriction in `templates/.agents/skills/qmd/SKILL.md` and the update directive in `templates/.agents/rules/qmd-first.md`. Specify one consistent authorization rule and the required read-only behavior when freshness cannot be established. Tie wording changes to the stale-index probe.

4. **Put an executor feasibility checkpoint before substantial evaluator construction.** Resolve U-executor with one authentic search/get export, actual loaded instruction bytes, oracle invisibility and cancellation cleanup. Synthetic scorer tests can continue, but cannot justify proceeding indefinitely around an unavailable live executor.

5. **Clarify the campaign gate and revisions.** Enumerate critical invariants, expected outcome counts for injected faults, and treatment of candidate reruns. Preserve every attempted campaign; do not silently replace failed seeds. If results inform an amendment, confirm it on fresh held-out seeds as well as reproducing the diagnosed failure.

6. **Keep enforcement conditional but concrete.** Preserve the deferral's trigger of any persistent critical bypass after one targeted amendment. Any later hook proposal must verify applicability and use, not merely the presence of a QMD call.


## integrator

**Choice:** B — narrow authentic behavioral evidence with controls, followed by evidence-led amendments.

**Rationale:** The rubric should prioritize evidence of current canon retrieval and correct application, resistance to false passes, feasibility, and preservation of existing consumer contracts. A cannot establish the central behavior: existing instructions already demand ADR-first search and document retrieval, while static checks cannot show either occurred. C adds enforcement and compatibility costs before identifying the actual failures; a mandatory retrieval hook could still permit irrelevant or stale retrieval. B directly tests the missing behavior with ordered executor evidence, independently generated answers, bypass controls, and bounded recovery. Its main weakness is that a freshly indexed synthetic corpus does not yet demonstrate “current” canon when the source changes after indexing. Resolving one executor’s actual capture and isolation contract is also an essential prerequisite, not an implementation detail.

**Main risk if wrong:** A clean benchmark could encourage a compliance claim while consumer sessions continue applying stale decisions or bypassing retrieval. This is especially likely if freshness remains deferred or the selected executor does not load the same preserved instruction surfaces consumers actually use.

**Own confidence:** Medium — high confidence in B over A or C, but the executor is unverified and freshness coverage needs amendment.

**Concrete recommended amendments:**

1. **Make one freshness transition part of the core proof.** Within C1 or C2, index an initial generated decision, then change the applicable decision or successor before the goal starts. Specify the expected behavior under both read-only and explicitly maintenance-authorized conditions. A stale indexed value must never pass as current canon. This need not create a seventh scenario or a load platform.

2. **Bind “current” to both source and retrieved content.** Extend R2/R4 to distinguish the workspace’s authoritative source snapshot from the content actually returned by QMD. Record their identities and hashes. A corpus hash alone does not prove the index reflects that corpus. Where freshness cannot be established, require an explicit limitation or blocked outcome.

3. **Define the critical-invariant gate explicitly.** List the failures that forbid candidate acceptance: bypassing required ADR search/retrieval, applying superseded or stale authority, missing decisive applicability content, presenting a proposal as canon, fabricating compliance, and unauthorized index mutation. State the expected result of each injected fault, including C2’s conflict variant. Keep retrieval-success counts separate from correctly blocked runs.

4. **Make evidence completeness cover alternative access and actions.** R1 should capture all agent-visible tool events and conclusions/writes, rather than only QMD events. Declare which direct-file or other-source reads are allowed and how prohibited substitution is detected. Describe the proof as observable retrieval plus correct application; do not imply it establishes the agent’s private causal reasoning.

5. **Require a concrete executor qualification artifact before live planning.** Resolve U-executor with verified launch/export/cancel commands, instruction-loading evidence, oracle visibility boundaries, and a sample complete trace. Keep the one-executor scope; do not build adapters around an assumed protocol.

6. **Resolve existing instruction contradictions explicitly.** The current rule labels the entire `adrs` collection “current,” although it contains draft/deprecated records, and directs updates after meaningful documentation writes while the skill restricts mutation to setup/maintenance authorization. Amend those statements when the campaign diagnoses their effect, and require inspection of status, body supersession, and applicability before authority is assigned.

7. **Preserve the enforcement escalation trigger.** Retain the deferral’s concrete rule: any critical bypass remaining after one targeted amendment, or a real incident requiring prevention, triggers enforcement review. A failed campaign must not be converted into successful proof through repeated prompt tuning or exclusion of behavioral failures.


## risk

**Choice:** B — narrow authentic behavioral evidence with controls, followed by evidence-led amendments.

**Rationale:** Static contracts cannot detect the concrete failure where an agent makes a ceremonial QMD call, then applies an obsolete decision or an answer from another source. R1, R4 and R5 address that failure through ordered executor receipts, retrieval of decisive content and independently rejected bypass controls. R7 prevents infrastructure failures and expected blocking from inflating success rates. R10 bounds cleanup and cross-run contamination. Those are credible protections with a limited blast radius. C introduces completion-blocking infrastructure before a verified executor contract or evidence that targeted instructions fail; a QMD outage could then block otherwise useful work across consumers. B is the smallest credible choice, but its present treatment of freshness leaves a gap in proving **current** canon.

**Main risk if wrong:** A green synthetic campaign could create false confidence while real agents keep retrieving a stale indexed ADR after the underlying decision changes. Correct receipts and citations would then certify use of obsolete content. Because canon retrieval is the principal upside, this is a failure of the central promise rather than a peripheral benchmark limitation. Separately, an executor that captures tool events but misses conclusions or writes could make R4’s ordering check falsely green.

**Own confidence:** High on B over A/C; medium that the draft, unchanged, proves current-canon use.

**Concrete recommended amendments:**

1. **Make minimum freshness proof part of the core gate.** R2’s corpus hash and separate canary establish snapshot identity/readiness, but do not explicitly prove that searchable and retrieved content matches current authoritative bytes. Add a controlled ADR revision between two isolated runs: change a generated decisive value, perform only explicitly authorized index maintenance, and require the second run to retrieve and apply the new value. Reject an old document hash/value even if its path and status remain correct. This can be a variant within C1 rather than a seventh broad scenario.

2. **Narrow the freshness deferral.** Defer broad freshness/archive/filter matrices, but exclude the minimal stale-index/current-bytes check above. The deferral currently places freshness outside the six-case core despite the decision’s explicit emphasis on current canon.

3. **Define the executor’s observable action boundary.** U-executor/R1 should require evidence of the architecture-bearing answer and all relevant workspace writes, not just tool request/response events. If the executor cannot expose these events or their ordering against retrieval, classify the affected run as invalid evidence. Otherwise R4’s “before conclusion or write” condition is not demonstrable.

4. **Make authority linkage explicit in scoring.** Require the applied answer tuple to match the decisive retrieved content hash and applicable current ADR, including successor traversal where needed. Reject receipt bundles containing current canon when the answer actually applies an obsolete value. Add that deliberate bypass to R5.

5. **Specify the escalation disposition.** The deferral’s “any critical bypass after one targeted amendment” trigger is useful. State that such a result fails the candidate gate and yields an enforcement-review recommendation; it cannot be waived by an improved aggregate rate or repeated seeds until green. Retain the real-consumer-incident trigger.

6. **Keep claims visibly bounded.** The report should identify the tested runtime/model/harness bytes and separately show successful retrieval, correct no-canon outcomes, expected outage blocking, invalid evidence and not-ready counts. The draft largely requires this already; retain it as a non-negotiable acceptance condition.


## evidence

**Choice:** B — narrow authentic behavioral evidence with controls, followed by evidence-led amendments.

**Rationale:** The existing QMD skill and rule clearly prescribe searching and retrieval, but neither proves execution or correct application. The proposed ordered executor receipts, hidden generated oracle, decisive-content retrieval checks and independent bypass controls directly test those missing facts. A therefore cannot establish the project's principal claim. C introduces enforcement machinery before there is evidence identifying the failure it must prevent; mandatory calls alone could still produce ceremonial retrieval. B is credible for tested sessions, provided executor authenticity and isolation are demonstrated. At present, the spec establishes a sound proposed method, not successful QMD behavior: QMD was unavailable and U-executor remains unresolved.

**Main risk if wrong:** A clean synthetic campaign could give false confidence while consumer agents apply stale indexed content or bypass retrieval in ordinary work. That would undermine the project's main upside despite a green report.

**Own confidence:** Medium — high confidence in choosing behavioral evidence over static contracts; lower confidence that the current scenario set covers “current canon” adequately.

**Concrete recommended amendments:**

1. **Bring a minimal freshness check into the core gate.** The deferral postpones freshness, while the central claim explicitly concerns *current* canon. Add a controlled stale-index variant within C2: index an initial decision, change its value or successor on disk, and verify that stale retrieval cannot pass. A read-only goal must identify/block the mismatch; an explicitly maintenance-authorized variant may refresh and requery. This needs no seventh campaign family or broader adversarial suite.

2. **Define the authoritative snapshot comparison.** R1/R2 currently mention corpus and content hashes, but should explicitly require the decisive retrieved content to match the applicable file in the run's authoritative workspace snapshot. Record both hashes outside agent access. Otherwise authentic retrieval from an outdated index can appear valid.

3. **Make C2's expected outcome explicit per variant.** A clearly deprecated predecessor with a valid successor should resolve to the successor. A header/body contradiction should block unless the retrieved material unambiguously resolves that contradiction. Encode separate oracle expectations rather than leaving their distinction to reviewer interpretation.

4. **Tighten the inference claimed by R4.** Ordered retrieval plus a correct hidden generated answer is strong operational evidence of application, but cannot prove internal causation. State that the gate demonstrates successful retrieval and answer consistency with retrieved current canon. Fresh random values and the unrelated-retrieval control make alternative explanations harder; they do not eliminate them universally.

5. **Require a concrete executor calibration artifact before live planning.** Preserve U-executor as a hard gate, with one authentic search/get export, installed-instruction hashes, visibility audit and cancellation evidence. Do not treat hand-authored scorer fixtures as satisfying executor authenticity.

6. **Clarify campaign failure and retry accounting.** Preserve every initial behavioral failure in the report; prohibit replacing failed scored runs with successful reruns. Distinguish the allowed within-run query retry from a new session. Ten seeds per case support a bounded demonstration, not a reliability guarantee.

7. **Use observed evidence to repair the instruction conflict.** The rule says to update/embed after meaningful docs writes, while the skill restricts index mutation to authorized maintenance. Include that conflict in the targeted diagnosis and amendment criteria. Also revise the rule's collection-level “current” trust wording when C2 exposes mistaken authority: ADR collection membership does not establish stable, applicable status.

**Leading claim's falsifier:** A ready, authentic, calibrated run retrieves the required ADR yet applies the stale, superseded or inapplicable value—or the scorer accepts an unrelated retrieval followed by a correct leaked answer. Either observation defeats the claim that this gate adequately establishes canon use and requires repair before compliance claims.

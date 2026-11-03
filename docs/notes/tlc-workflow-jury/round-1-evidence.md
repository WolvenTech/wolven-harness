# Round 1 — Evidence seat

**Choice: C, with R selected independently.** This selects the intermediate
package as written, including its exact risk triggers and honest degraded
assurance rule. It does not select B's runner or universal independent
closeout. This is advice for the later implementation decision, not approval
to change the current workflow. **Confidence: medium** in this relative
choice, low in any predicted delivery improvement.

## Rationale and evidence strength

The strongest evidence establishes existing contracts and implementation
constraints, not comparative effectiveness. I read the full frozen proposal,
the packet, local spec/plan/execute/review skills, relevant setup code, the
research and verification notes, and pinned upstream verification/posting
sources. The baseline already requires obligation/proof pairs, nine
dimensions, vertical units, approval, fresh command evidence and opt-in
commits. Those are direct textual facts, so A deserves credit for substantial
assurance and the lowest migration burden. However, execution's final
anti-pattern calls an independent verifier ceremony because the final check
“already proves the unit.” The actual checks are comments/validation plus
unit-named checks; this does not establish assertion adequacy. C addresses
that specific epistemic gap without implying that more artifacts prove more
behavior. Sources: `.agents/skills/code-spec/SKILL.md`, Hard gates;
`.agents/skills/code-plan/SKILL.md`, Structural gate and Hard gates;
`.agents/skills/code-execute/SKILL.md`, Final check and Anti-patterns.

B has the strongest proposed defense against mechanically detectable stale
or empty evidence and offers independent scrutiny for routine features. Its
limits are candid. But its Node scripts, file-set digest, evidence-block
exclusions, reporter/count handling and cross-platform command grammar are
new designs, not validated ports of the upstream tooling. The upstream
validator explicitly reads artifacts rather than the target codebase;
fixture mutation success cannot establish delivery benefit. The recorded
24/83 killed mutants and baseline 57 passing tests therefore support neither
a quantified accuracy advantage nor an acceptable cost for B. The local
execution tests I inspected mostly assert instruction strings and regexes.
Sources: proposal, “B's deterministic contract and honest limits”;
`docs/notes/tlc-spec-workflows-and-judge/verification.md`;
`test/skill-code-execute.test.ts`; upstream
`tlc-spec-driven/scripts/validate_verification.py`, opening contract.

C preserves many plausible fidelity improvements: binding-source inventory,
revision-bound approval, criterion-to-test mapping, explicit assertion
counterexamples, baseline recording and capture/gesture separation. Its
independence triggers cover consequential domains without pretending the
author is independent elsewhere. Its weakness is precisely identified:
manual freshness and classification can fail, and routine weak tests can
survive author review. There is no evidence proving its trigger list is an
optimal boundary. Still, absent outcome evidence, its smaller tooling and
portability commitment is a proportionate first choice. Both B and C incur
real migration cost: `src/setup/apply.ts` preserves existing files while
adding missing paths, so coherent folder replacement matters. The package's
Node >=22 requirement supports B's implementation feasibility, not universal
availability in standalone consumer hosts. Sources: proposal, adoption
matrix, C trigger, attribution/distribution; `package.json`, engines;
`src/setup/apply.ts`, `applyTemplates`.

R has independently credible, narrower benefits: preserve unavailable-check
disclosure, verify candidates, carry stable findings and recheck reviewed
head before posting. The pinned Judge poster constructs a payload without
commit identity and does not compare the head. That is an observed omission,
not a reproduced race. R's proposed head recheck reduces that exposure but
does not establish atomic posting. Retaining impact-grounded severity and
late material findings avoids borrowing the upstream policy conflicts.
Sources: proposal, “R”; `.agents/skills/code-review/SKILL.md`; upstream
`the-judge/scripts/post_review.py`; research note, “Limits that matter.”

## Risk, objection and falsification

**Main risk if wrong:** C's author-controlled evidence could confidently close
an ordinary-looking change whose missing assertion or stale input B would
catch, allowing a requirement defect to reach consumers.

**Strongest objection:** choosing manual safeguards to avoid unmeasured
tooling cost also leaves known mechanical failure modes unenforced. B's
bounded trial is reasonable; this vote does not claim C is empirically best.

**Observable test:** on an already wanted, approved two-unit feature, predeclare
a time budget and independent evaluation owner. In a disposable evaluation
copy introduce one stale-evidence change and one green weak assertion for
an untriggered obligation. Record whether C's prescribed checks catch each,
with elapsed effort and false allegations. Independent evaluator discovery
after C closes either item materially weakens this choice and motivates a
B trial. This tests feasibility and failure detection, not population accuracy.

## Material contradictions and unresolved policy

No fatal contradiction defeats C. The universal one-file shortcut in current
spec instructions conflicts with excluding high-risk tiny changes; both
spec and execution wording must change coherently. “Required before feature
mutation” must distinguish baseline capture from the unit example's stronger
“baseline-red stops” policy; the locked spec must settle pre-existing red
baselines. C's trigger list, degraded closeout authority and migration marker
remain product choices, not established evidence. Neither fixture success
nor a jury vote resolves them.

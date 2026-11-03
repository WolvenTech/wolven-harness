# Round 1 — Skeptic

**Choice: C. Review subset: adopt R independently.** This is C as written,
including its explicit risk triggers and degraded-assurance policy, not a
new hybrid. **Confidence: medium.** The evidence establishes real gaps and
plausible remedies; it does not establish the incremental delivery value
of B's distributed runtime and mandatory non-tiny-feature review.

## Rationale

C addresses the clearest unmet needs: source authority, approval revision,
criterion-to-test mapping, pre-edit baseline, assertion inspection and
honest visual evidence. The baseline already has obligation/proof pairs,
nine-dimension landings, approved vertical units and fresh command checks;
A therefore wins on cost and compatibility but leaves a consequential
semantic gap. In particular, `code-execute`'s Anti-patterns calls the final
check something that “already proves the unit,” while its Final check
requires comments/validate output, not independent assertion adequacy.
A's blanket verifier refusal deserves replacement. C replaces it where
consequences justify scrutiny, and requires an explicit author account of
what wrong implementation each routine test would catch. Sources:
[baseline execute](../../../.agents/skills/code-execute/SKILL.md),
[baseline spec](../../../.agents/skills/code-spec/SKILL.md), and
[proposal: C trigger and adoption matrix](../tlc-workflow-integration/tlc-workflow-integration-note.md).

B has the strongest mechanical protections: selected-count rejection,
proof identity, dependency checking, stale evidence detection and reviewer
closeout. Those checks can catch failures C delegates to agent discipline.
Its dirty-tree design also preserves opt-in commits rather than importing
upstream's clean-HEAD constraint. These are substantive advantages, not
ceremony by definition. However, delivering them entails a versioned JSON
contract, four scripts, command/reporter handling, content-input discovery,
report-region exclusions, dispatch reconciliation and a behavioral suite.
The central hard problem—identifying every input affecting the command—is
explicitly deferred to the implementation spec. A digest over an incomplete
input set yields precise-looking evidence without the claimed freshness.
B's completeness cannot be inferred from Node's availability. Sources:
[proposal: deterministic contract and tested-tree identity](../tlc-workflow-integration/tlc-workflow-integration-note.md),
[package runtime](../../../package.json).

That investment could be warranted, but the supplied evidence does not yet
show recurring empty-selection or stale-evidence incidents, or comparative
agent outcomes. Upstream's 24/83 mutant results test its own fixtures; the
local 57 passing tests predominantly establish instruction contracts.
Neither measures B's additional defect yield against C. A single successful
B feature would establish feasibility, not that its machinery earns its
ongoing cost. Under the repository's strict minimum-needed policy, C is
the more proportionate initial choice. Sources:
[verification limits](../tlc-spec-workflows-and-judge/verification.md),
[packet](decision-packet.md),
[YAGNI rule](../../../.agents/rules/yagni-strict.md).

Compatibility favors C, although it still changes all three core folders.
Actual `applyTemplates` preserves existing files while adding missing
paths, so neither option upgrades an installed workflow coherently by
rerunning setup. B adds executable files and stronger cross-artifact
version coupling to that existing hazard. The proposal's manual coherent
replacement, grandfathering and rollback are therefore necessary for both;
they are not evidence that migration has been exercised. Source:
[setup implementation](../../../src/setup/apply.ts), proposal Attribution,
distribution, compatibility and rollback.

R has a clearer marginal case: retain unavailable-check evidence, verify
candidates, deduplicate, bind findings to reviewed head, and preserve late
material discoveries. It strengthens the existing grounding/no-merge
contract without adding a review runtime. Official-source research remains
conditional on an actual external-behavior claim. Source:
[baseline review](../../../.agents/skills/code-review/SKILL.md), proposal R.

## Main risk if wrong and strongest objection

C can repeatedly certify stale or weak evidence on supposedly routine
changes. Its trigger list omits ordinary CLI semantics, validation rules
and UI behavior unless they touch a listed risk category. The author's
own mistaken model may survive the required self-check. B's universal
fresh reviewer and mechanical gates would sometimes catch exactly that.
This is the strongest objection to my choice, and a meaningful residual
risk rather than proof that C is equivalent to B.

## One observable test

On one already-wanted, non-triggering feature, predeclare a time budget and
introduce a reversible weak-assertion negative control in a disposable
fixture. Run C's documented author adequacy procedure, then an isolated
read-only B-style adequacy pass. Record whether each catches the control,
additional reproducible defects, and elapsed effort. A miss by C caught
within budget by the independent pass would materially favor B's broader
review policy; it would not by itself validate B's runner.

## Material contradictions or unresolved policy

No fatal internal contradiction identified. Before implementation, resolve
how pre-existing baseline failures are adjudicated: the proposal leaves
that judgment outside the baseline gate, while unit 04 requires baseline-red
to stop mutation. Preserve the explicit stop until resolved. B additionally
needs the promised exact input-set and command/count contract; these are
open engineering obligations, not working safeguards today.

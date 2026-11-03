---
type: note
title: TLC spec-driven 4.1, spec-lean 2.2, and The Judge
description: Release changes, verification limits, and applicability to the Wolven harness workflow.
status: draft
---

# TLC spec-driven 4.1, spec-lean 2.2, and The Judge

## Question

What changed in the latest TLC spec-driven release, how does spec-lean differ,
and which review practices from The Judge are useful for this repository?

Research date: 2026-11-03. Upstream snapshot:
[`1da2195067c14ae5d44dc615b31cb26f50ebeb91`][snapshot]. Local workflow
comparisons describe this worktree, not every released harness installation.

## Findings

### Versions and release boundaries

The current skill versions are **tlc-spec-driven 4.1.0**, **tlc-spec-lean
2.2.0**, and **the-judge 1.4.0**. “4.1” belongs to spec-driven; lean has its
own version sequence. The official pages agree with the source metadata.
([Driven source][driven], [Lean source][lean], [Judge source][judge],
[Driven page](https://agent-skills.techleads.club/skills/tlc-spec-driven/),
[Lean page](https://agent-skills.techleads.club/skills/tlc-spec-lean/),
[Judge page](https://agent-skills.techleads.club/skills/the-judge/))

These skill versions are distinct from the catalog package version. Catalog
0.17.18, dated October 31, contains the proof-runner change and pre-build
gate; catalog 0.17.19, dated November 2, additionally fixes spec-driven's
design-template fence. An intermediate commit called the skills 5.0.0 and
3.0.0, then a subsequent commit corrected them to 4.1.0 and 2.2.0.
([Catalog changelog][changelog], [Version correction][versions])

### What changed around 4.1

The substantive verification change is **project-owned commands instead of
runner-specific machinery**. `runners.py` and `mutate.py` were removed.
Checks sharing a test invocation name one `Run` group; each check names the
passing output line it expects. Groups and standalone proofs run serially,
once per invocation of `check_proofs.py`, with the build. This does not mean
tests run only once during the entire implementation: task gates and a
post-fix proof run still exist. ([Proof redesign][proof-change],
[Driven contract][driven])

A grouped proof is stronger than a green exit code from an empty test
selection: it also requires the expected output words, in order, on one
line. The documentation requires including the pass marker and recommends
grouped proofs even for a single `node --test` or `dotnet test` selection,
because an empty selection can exit successfully. This remains an output
match, not a semantic proof of the assertion. ([Checks reference][checks],
[`sees` and `run` implementation][proof-script])

Mutation-based feature verification is replaced by a fresh verifier reading
**every check's selected test**, asking whether it would fail if the claim
were false, trying two new examples, and identifying weak assertions. The
completion gate requires a check-to-test table and findings closed with
commit references. Mutation tests still exist in the skill's own validator
self-tests; the release removed feature mutation machinery, not all uses
of mutation testing. ([Verifier reference][verify],
[Completion validator][verification-script], [Lean self-test][lean-selftest])

The execution validators now run the declared build before edits begin;
commit validation prints outstanding completion steps. Nearby changes also
persist approvals in the user's words, dispatch state, and screenshot
review rounds across compaction. These are separate commits in the release
history, rather than one indivisible 4.1 innovation. ([Pre-build change][prebuild],
[Driven approval persistence][approval-change],
[Lean persistence change][lean-persistence])

### Driven versus lean

| Dimension | tlc-spec-driven 4.1.0 | tlc-spec-lean 2.2.0 |
| --- | --- | --- |
| Flow | Specify → optional Design → optional Tasks → Execute | Plan → Checks → Build → Verify |
| Human review | Spec and formal tasks approval; depth scales with scope | One default plan approval; derived checks proceed without a second default stop |
| Planning control | Atomic tasks, dependencies, a gate and commit per task | Frozen observable obligations; implementation order remains flexible |
| Core files | `spec.md`, optional `context.md`, `design.md`, `tasks.md` | `plan.md`, `checks.md`; tiny changes can use checks with intent only |
| Completion | Proofs at HEAD, independent verifier, capture review when applicable | Same separation between mechanical proofs and independent judgment |

The table summarizes their contracts and references; lean explicitly
excludes work already represented by a task list. It is an alternative
workflow, not an extra stage after driven's Tasks phase.
([Driven][driven], [Lean][lean], [Lean plan reference][plan])

Both treat supplied captures as binding unless designated inspiration,
persist explicit departures, and separate a screenshot comparison from
proof that controls work. Screenshots require the capture's layout size;
the screen reviewer judges saved images. Lean explicitly limits what this
review can catch, including spacing, colour, type weight, and details below
the image's resolution. ([Driven][driven], [Lean: Who checks what][lean],
[Checks: gesture and capture proofs][checks])

### The Judge: useful review practices

The Judge first runs existing deterministic checks, then researches
external surfaces, performs six passes, verifies candidate findings, and
submits one consolidated review. Its passes cover correctness, security,
structure, AI-generated clutter, PR-description claims, and bypasses or
duplication. Internal evidence uses verified file/line references; external
claims require official sources fetched during the review. ([Judge][judge])

Its useful noise controls include a five-inline-nit cap, deduplication,
reproduction where feasible, and separating a real low-impact defect from
an unsupported allegation. A findings ledger carries stable IDs between
rounds; existing unresolved findings contribute to the verdict. The scripts
check the payload before posting and submit summary and inline comments
together, with a COMMENT fallback when the authenticated user owns the PR.
([Judge][judge], [Review gate][review-gate], [Posting script][post-script])

### Limits that matter before adopting it

**Evidence shape is not evidence truth.** The review gate checks reference
syntax, severity/verdict consistency, comment length, nit count, and banned
phrasing. It does not fetch cited sources or establish that a referenced
line proves the allegation. Similarly, TLC's completion validator checks
report structure and proof records; its presence checks cannot establish
that an independent person or agent actually performed the judgment.
This is a source-based limitation, not a claim that the workflows are
ineffective. ([Review gate][review-gate], [Completion validator][verification-script])

**The Judge's severity guidance conflicts internally.** Its main severity
table reserves blockers for merge risk, while the structural reference
calls a file crossing 1,000 lines and several simplification opportunities
presumptive blockers. Recommendation: ground severity in demonstrated
impact and repository obligations before borrowing these structural rules.
([Judge severity table][judge], [Structural standards][review-standards])

**The security pass is deliberately incomplete.** It excludes denial of
service, regex-based DoS, user content entering AI prompts, and several
other categories; it also assumes CLI flags and environment variables are
trusted. Recommendation: retain evidence requirements, but evaluate the
actual trust boundary instead of inheriting these exclusions universally.
([Security exclusions and precedents][review-standards])

**Convergence trades away later findings.** From round two it permits only
new blockers, plus resolution checks; previously visible non-blockers are
forfeited. This reduces review churn but can hide valid defects discovered
late. Recommendation: keep the ledger and scoped rereview, while allowing
newly evidenced material problems to be reported explicitly as late finds.
([Convergence contract][judge], [Round enforcement][review-gate])

**The posting helper does not bind the review to an explicit commit SHA.**
Its payload has `body`, `event`, and `comments`, with right-side line anchors,
but no `commit_id` or head comparison before posting. Recommendation: when
adapting it, verify the reviewed head still matches before submission.
This is an observed omission; no concurrent-push reproduction was attempted.
([Posting script][post-script])

### Fit for wolven-harness

The local spec/plan/execute chain already freezes obligations, names proofs,
uses vertical units, reconciles resume state, and requires current command
evidence. Local review already grounds findings in cited refs and diff
lines. The useful additions to evaluate are explicit proof-to-test
adequacy, empty-selection detection, a concise research log, and a
consolidated findings ledger. These are recommendations derived from the
comparison, not approved changes. (Local sources:
`.agents/skills/code-spec/SKILL.md`, `.agents/skills/code-plan/SKILL.md`,
`.agents/skills/code-execute/SKILL.md`, `.agents/skills/code-review/SKILL.md`,
`.agents/skills/code-review/references/review-criteria.md`;
upstream: [Checks][checks], [Verifier][verify], [Judge][judge])

Wholesale adoption would conflict with local policy: `code-execute`
explicitly rejects an added independent-verifier pass and makes automatic
commits opt-in, whereas TLC always calls for independent verification and
permits local commits after approval. Lean also drops the unit index that
local planning deliberately produces. Recommendation: consider individual
practices before replacing the workflow or adding another state directory.
(Local sources: `.agents/skills/code-execute/SKILL.md`,
`.agents/skills/code-plan/SKILL.md`; upstream: [Lean][lean], [Driven][driven])

### Verification performed

The upstream self-tests were run from a temporary checkout on 2026-11-03:
driven reported **24 killed, 0 survived**, controls/tooling passing; lean
reported **83 killed, 0 survived**, controls/tooling passing. These are
validator fixture mutations, not a benchmark showing improved agent
delivery or review quality. Commands and captured result lines are in
[verification.md](verification.md). ([Driven self-test][driven-selftest],
[Lean self-test][lean-selftest])

## Sources

All upstream source links below pin the inspected snapshot. Commit links
identify the historical change being discussed.

| Source | Type | Used for |
| --- | --- | --- |
| [Catalog history][changelog], [version correction][versions] | Official release history | Dates, package versus skill versions |
| [Driven][driven], [Lean][lean], [plan][plan], [checks][checks] | Official skill contracts | Workflow and artifact comparison |
| [Proof script][proof-script], [verifier][verify], [completion validator][verification-script] | Source and official reference | Mechanical versus semantic assurance |
| [Judge][judge], [review standards][review-standards] | Official skill and review policy | Evidence, severity, convergence, exclusions |
| [Review gate][review-gate], [posting helper][post-script] | Source | Enforced checks and posting limits |
| [Driven self-test][driven-selftest], [Lean self-test][lean-selftest] | Executed upstream test code | Limited tooling verification |
| `.agents/skills/{code-spec,code-plan,code-execute,code-review}/` | Local primary source | Fit and policy conflicts |

## Open questions

- Do independent verification and the extra artifacts improve outcomes
  enough to justify their cost here? The fixture self-tests do not answer
  this; a representative implementation trial would be needed.
- Should a future workflow favor a unit index or lean's free build order?
  This note compares both and does not select a replacement.
- Should local review gain a gate and ledger, or only the evidence and
  convergence guidance? No installation or workflow change is part of this
  research.

[snapshot]: https://github.com/tech-leads-club/agent-skills/tree/1da2195067c14ae5d44dc615b31cb26f50ebeb91
[driven]: https://github.com/tech-leads-club/agent-skills/blob/1da2195067c14ae5d44dc615b31cb26f50ebeb91/packages/skills-catalog/skills/(development)/tlc-spec-driven/SKILL.md
[lean]: https://github.com/tech-leads-club/agent-skills/blob/1da2195067c14ae5d44dc615b31cb26f50ebeb91/packages/skills-catalog/skills/(development)/tlc-spec-lean/SKILL.md
[judge]: https://github.com/tech-leads-club/agent-skills/blob/1da2195067c14ae5d44dc615b31cb26f50ebeb91/packages/skills-catalog/skills/(quality)/the-judge/SKILL.md
[changelog]: https://github.com/tech-leads-club/agent-skills/blob/1da2195067c14ae5d44dc615b31cb26f50ebeb91/packages/skills-catalog/CHANGELOG.md
[versions]: https://github.com/tech-leads-club/agent-skills/commit/5ba10a65d8a83014661f3a18326983208c8108d3
[proof-change]: https://github.com/tech-leads-club/agent-skills/commit/b9caf0c014f9df8e32852425d5658c02105cadbe
[prebuild]: https://github.com/tech-leads-club/agent-skills/commit/f69e6154b3ac900ea661687479b407cc1be9d4a9
[approval-change]: https://github.com/tech-leads-club/agent-skills/commit/65ca25bf3
[lean-persistence]: https://github.com/tech-leads-club/agent-skills/commit/eec04107f
[plan]: https://github.com/tech-leads-club/agent-skills/blob/1da2195067c14ae5d44dc615b31cb26f50ebeb91/packages/skills-catalog/skills/(development)/tlc-spec-lean/references/plan.md
[checks]: https://github.com/tech-leads-club/agent-skills/blob/1da2195067c14ae5d44dc615b31cb26f50ebeb91/packages/skills-catalog/skills/(development)/tlc-spec-lean/references/checks.md
[verify]: https://github.com/tech-leads-club/agent-skills/blob/1da2195067c14ae5d44dc615b31cb26f50ebeb91/packages/skills-catalog/skills/(development)/tlc-spec-lean/references/verify.md
[proof-script]: https://github.com/tech-leads-club/agent-skills/blob/1da2195067c14ae5d44dc615b31cb26f50ebeb91/packages/skills-catalog/skills/(development)/tlc-spec-lean/scripts/check_proofs.py
[verification-script]: https://github.com/tech-leads-club/agent-skills/blob/1da2195067c14ae5d44dc615b31cb26f50ebeb91/packages/skills-catalog/skills/(development)/tlc-spec-lean/scripts/validate_verification.py
[review-gate]: https://github.com/tech-leads-club/agent-skills/blob/1da2195067c14ae5d44dc615b31cb26f50ebeb91/packages/skills-catalog/skills/(quality)/the-judge/scripts/review_gate.py
[post-script]: https://github.com/tech-leads-club/agent-skills/blob/1da2195067c14ae5d44dc615b31cb26f50ebeb91/packages/skills-catalog/skills/(quality)/the-judge/scripts/post_review.py
[review-standards]: https://github.com/tech-leads-club/agent-skills/blob/1da2195067c14ae5d44dc615b31cb26f50ebeb91/packages/skills-catalog/skills/(quality)/the-judge/references/review-standards.md
[driven-selftest]: https://github.com/tech-leads-club/agent-skills/blob/1da2195067c14ae5d44dc615b31cb26f50ebeb91/packages/skills-catalog/skills/(development)/tlc-spec-driven/scripts/selftest.py
[lean-selftest]: https://github.com/tech-leads-club/agent-skills/blob/1da2195067c14ae5d44dc615b31cb26f50ebeb91/packages/skills-catalog/skills/(development)/tlc-spec-lean/scripts/selftest.py

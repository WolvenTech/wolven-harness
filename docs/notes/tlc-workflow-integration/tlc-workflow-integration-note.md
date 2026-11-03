---
type: note
title: TLC spec-driven integration options for the Wolven code workflow
description: Three concrete workflow options, selected Judge practices, proposed delivery units, and adoption decisions.
status: draft
---

# TLC spec-driven integration options for the Wolven code workflow

## Question and decision boundary

How should Wolven integrate TLC spec-driven 4.1.0 into `code-spec`,
`code-plan`, and `code-execute`, and selected The Judge 1.4.0 practices into
`code-review`, while preserving explicit authority, vertical work units,
and the installed harness contract?

**Recommendation:** trial option B on one bounded, representative feature,
then decide permanent adoption from observed costs and defects. Option C is
an implementable lower-cost alternative, not an unspecified pilot. The
review subset R can be selected separately: B+R, C+R, A+R, or neither.
Nothing in this note authorizes implementation, changes a skill, promotes
an ADR, or represents an approved specification or execution-ready plan.

Research date: 2026-11-03. Local baseline: commit
`4e43c53ed2937aee8b39b3bb21ae93513197007e`, with the concurrent research
note untracked. Upstream references pin
`1da2195067c14ae5d44dc615b31cb26f50ebeb91`. Proposal language below describes
future behavior, not features present today. Sources: [prior research][prior],
[driven][driven], [judge][judge], and the local paths in the next section.

## Findings: current contract and actual gaps

The baseline already freezes obligation/proof pairs, lands nine dimensions,
keeps unresolved decisions typed, requires approved spec and plan stages,
and uses vertical units with explicit `spawn` or `inline`. It checks fresh
command output, preserves the seven-field resume record in the plan, and
commits only through the resolved cadence opt. Its final command checks do
not establish that a selected test asserts the criterion strongly enough.
`code-execute` expressly refuses an independent verifier. These are current
policies, not omissions to bypass quietly. Sources:
`.agents/skills/{code-spec,code-plan,code-execute}/SKILL.md` and their references.

TLC contributes a coherent specify → design → tasks → execute system, not
just a testing checklist. Its 4.1 contract adds project-owned grouped proof
commands, expected passing output for each criterion, a pre-edit build,
persisted approvals and dispatch, independent test adequacy, and capture
review. TLC also mandates per-task commits, different state directories,
file-oriented task granularity, and always-on verification; those portions
need explicit adaptation. Sources: [driven][driven], [tasks][tasks],
[implement][implement], [verify][verify], [screens][screens].

A green runner, an expected output line, and a verifier's judgment provide
three different kinds of evidence. None proves all possible behavior.
Scripts can enforce coverage of IDs and stale-evidence rejection; they
cannot prove independence, truthful human approval, good assertions, or
faithful visual interpretation. Source: [proof runner][proof-runner],
[completion gate][completion-gate], [Judge gate][judge-gate].

## Three options, each with a complete operating policy

| Option | Workflow and assurance | Cost and limitation |
| --- | --- | --- |
| **A — retain current baseline** | Existing approved spec → approved vertical plan → execution/final checks. Keep current independent-verifier refusal, current tiny-work shortcut, and commit cadence. | Lowest change and migration cost; tests may be weak or empty-selected without a dedicated per-criterion detector. |
| **B — coherent spec-driven integration** | Keep those three named skills; strengthen all three with explicit source/approval records, criterion-level proof contracts, deterministic preparation/completion scripts, baseline build, independent adequacy once per feature, and capture review when relevant. | Greatest integration and report cost; stronger evidence discipline, not a correctness guarantee. Requires an intentional reversal of verifier refusal. |
| **C — contract-first intermediate** | Add source/approval records, criterion-to-test/output tables, pre-edit baseline, author adequacy review, capture/gesture obligations, and a precisely risk-triggered independent adequacy pass. Keep manual structural checks and evidence capture; add no proof runner or completion validator. | Most content improvements without a new gate runtime. Mechanical consistency and freshness remain agent responsibilities; routine work receives no independent adequacy review. |

B remains spec-driven: design freezes in the spec, the plan orders vertical
units, and execution follows its frontier. It does not substitute lean's
free implementation order. C also preserves that chain. No option installs
`tlc-spec-lean`, adds a fourth mandatory planning artifact, or makes
implementation approval follow from this note. Sources for comparison:
`.agents/skills/{code-spec,code-plan,code-execute}/SKILL.md`, [driven][driven].

### Feature-by-feature adoption matrix

“Keep” means preserve the current local behavior; “add” means a proposed
change. R is the independent review subset described below.

| Feature | A | B | C |
| --- | --- | --- | --- |
| Local skill names and slug-folder docs layout | Keep | Keep | Keep |
| Nine dimensions, typed Unresolved, human spec/plan approval | Keep | Keep and check structure | Keep with manual checklist |
| Source inventory; binding captures versus inspiration; explicit departures | Existing surface walk only | Add structured contract | Add same contract |
| Requirement syntax | Existing obligation/proof | Observable trigger/state/outcome; EARS-style where useful | Same; no universal EARS parser |
| Approval words/date/artifact revision | No new record | Add to spec and plan | Add to spec and plan |
| Vertical units, ownership, frontier and wave stops | Keep | Keep; structural validator | Keep; manual check |
| Test placement and baseline counts | Existing proofs | Unit-local tests and per-run count/selection evidence | Same policy, manually recorded |
| One proof ID per obligation | Keep | Keep; unique IDs with per-test selectors | Keep; unique IDs in tables |
| Group project test commands and expected passing lines | No new requirement | Add executable contract and runner | Add documented commands and lines; run manually |
| Pre-edit build/configuration baseline | No new gate | Required before feature mutation | Required before feature mutation |
| Independent criterion/test adequacy | Explicitly refused | Required once per non-tiny feature | Required only on exact risk triggers below |
| Additional boundary probes | No dedicated step | Two spec-grounded probes, or explicit reason fewer apply | Same in triggered review; author probes otherwise |
| Capture-size browser walk and visual comparison | No uniform contract | Required when binding captures exist; fresh visual reviewer | Same capture obligations; author comparison unless risk-triggered |
| Deterministic completion/evidence freshness gate | Existing commands only | Add per-skill scripts | No new script |
| Resume home and seven mandatory fields | Keep | Keep; add bounded lifecycle fields inline | Keep; add same fields inline |
| Uncommitted validated work | Keep | Supported with explicit tested-tree identity | Supported; manual HEAD/status/diff identity |
| Autocommit false/unit/wave semantics | Keep | Keep exactly | Keep exactly |
| Batch workers chosen by TLC task-count heuristic | No | No | No |
| Automatic lessons database, global state, extra execution log | No | No | No |
| Selected Judge review subset R | Optional separate decision | Optional separate decision | Optional separate decision |

### C's precise independent-review trigger

C requires a fresh author-independent adequacy pass when any in-scope
obligation changes: (1) money calculation or payment state; (2) identity,
authorization, or secret access; (3) persistent-data deletion, retention,
migration, or irreversible writes; (4) concurrency, retry, idempotency, or
cross-process ordering; or (5) an external service's request/response or
failure contract. Classify the trigger in the spec's nine-dimension table;
carry it into the approved plan. “Unknown” is a typed blocker, not “no.”
This is a proposed policy, grounded in the local nine dimensions and TLC's
adequacy review, not an upstream trigger list. Sources:
`.agents/skills/code-spec/SKILL.md`, [verify][verify].

For routine work C requires the author to inspect each selected test and
record expected outcome, assertion, and plausible wrong implementation it
would catch. The report says **author-reviewed**, never independent.
Triggered review missing because dispatch is unavailable leaves a pending
assurance item; a Human may explicitly accept degraded assurance. The
report retains that limitation. C does not create a hidden second approval
stop for routine edits and never auto-dispatches implementation workers.

## Exact target surfaces and proposed behavior

Each path below is a future edit unless described as existing. For every
skill-relative path, edit both `.agents/skills/<skill>/...` and
`templates/.agents/skills/<skill>/...` in the same work unit. There is no
shared helper folder or new cross-skill reference dependency.

| Target path, relative to each skill folder | B behavior | C difference |
| --- | --- | --- |
| `code-spec/SKILL.md`, `references/TEMPLATE.md`, `references/EXAMPLE.md` | Add source authority, capture inventory, departures, approval/revision record; require observable criteria and per-obligation proof identity; locate substantive design in existing spec; preserve nine dimensions and Unresolved. | Same content, manual integrity checklist; record C risk trigger. |
| `code-spec/scripts/check-spec.mjs` (new) | Read-only structural check of required fields, IDs, criterion/proof links, nine landings, unresolved blockers, source/capture/departure declarations, and approval record shape. | Not added. |
| `code-plan/SKILL.md`, `references/TEMPLATE-plan.md`, `references/EXAMPLE-units.md` | Add proof/run contract, test placement and selected-count expectations, approval tied to spec revision, explicit verification disposition; retain required six-column work-unit table. | Same tables as readable evidence; omit machine manifest and script. |
| `code-plan/scripts/check-plan.mjs` (new) | Check unit IDs, missing/cyclic dependencies, ownership overlap in proposed concurrency, `spawn`/`inline`, wave-stop dependencies, obligation coverage, missing run/expected line, and reference freshness. | Not added. |
| `code-execute/SKILL.md`, `references/builder-brief.md` | Replace blanket verifier refusal with bounded feature-closeout adequacy; pre-edit baseline; preserve opt-in commits; require evidence identity and inline dispatch/closure state. Builders still cannot build, commit, push, or change requirements. | Replace refusal only for exact C risk triggers; author self-check otherwise. |
| `code-execute/references/verification-brief.md` (new) | Fresh read-only adequacy brief: approved obligations, checks, selected tests, tested-tree identity, diff; no author's rationale or implementation handoff. | Add with C trigger and explicit fallback language. |
| `code-execute/references/capture-review.md` (new) | Capture authority, pixel size/scale, state recipe, genuine browser capture, inventory and gesture distinction, reviewer results and limitations. | Same recipe; author compares except triggered independent review. |
| `code-execute/scripts/check-proofs.mjs`, `scripts/check-completion.mjs` (new) | Execute approved command groups serially; write inline evidence block; reject missing selections, failed groups, stale identity and unclosed findings; no git mutations. | Not added. |
| `code-review/SKILL.md`, `references/review-criteria.md` | R adds check/research ledger, candidate verification, noise cap, stable finding IDs, head-bound posting, scoped rereview. | Identical R; independently selectable. |
| `code-review/references/review-record.md` (new) | R's small review-summary/ledger format, including unavailable checks and late findings. | Identical R. |
| `test/skill-code-{spec,plan,execute,review}.test.ts`, `test/skill-copies.test.ts` | Update actual changed contracts; preserve unrelated guarantees; exercise links and mirrored files. | Update content contracts only; no gate-runtime tests. |
| `test/workflow-gates.test.ts` (new) | Behavioral fixture tests of shipped scripts, including negative controls; one focused suite, not a new framework. | Not added. |
| `site/guide/` affected workflow pages and `README.md` | Explain chosen workflow and upgrade constraints; use actual existing page paths discovered during implementation spec. | Same, with manual assurance limits. |

The `site/guide/` row names a directory to inspect, not an invented existing
page. Freeze its exact existing page files in the implementation spec
before execution. No change to CLI commands, finding codes, dependencies,
setup replacement rules, host operations API, or skill-set membership is
proposed. Sources: `package.json`, `src/setup/skill-sets.ts`,
`src/setup/apply.ts`, `src/skills/install.ts`,
`test/helpers/skill-contract.ts`, `docs/adrs/adr-006-install-check-and-repair-contract.md`.

## B's deterministic contract and honest limits

Use Node built-ins in skill-local `.mjs` scripts; the package already
requires Node >=22. Do not copy Python scripts and create another required
interpreter. Consumer skill documentation must state Node >=22 for these
optional skill-local tools; a runtime without it cannot claim those gates
ran. This is new tooling code within distributed skills, not a new package
runtime dependency or a new `wolven-harness validate` error code. Source:
`package.json`; proposal derived from [proof runner][proof-runner].

Use one versioned fenced JSON **Verification contract** inside the plan,
not a sidecar manifest or separate state directory. It contains obligation
and proof IDs, selected test path/name, group ID, project command, expected
literal pass line, expected minimum selected count, command timeout, and
explicit browser/manual proof kinds. The readable requirements and unit
tables cite those IDs rather than duplicate executable commands. Formal
syntax, escaping, and cross-platform command execution require a locked
implementation spec before coding; this note does not pretend that parser
exists. C uses readable tables and no JSON block.

The runner runs each distinct group once per invocation, serially, checks
exit status plus each required passing line, captures selected counts when
the project's reporter exposes them, and rejects an unsupported count
claim rather than guessing. Standalone exit-code-only proofs are limited
to non-test commands with a justified expected observable result. Strip
ANSI for comparison, keep bounded output plus commands/exits; a printed
word is not proof that the intended test meaningfully asserted behavior.
A configurable timeout per named run prevents an indefinite hang. Shell
and environment must be recorded; do not split commands on semicolons or
invent runner adapters. Source inspiration: [tasks][tasks],
[proof runner][proof-runner]; timeout and no-extra-interpreter are adaptations.

| Gate | Deterministic scope | Judgment left outside it |
| --- | --- | --- |
| Spec preparation | IDs, structural coverage, required fields, capture/departure declarations | Whether requirements are complete, achievable, and actually approved |
| Plan preparation | Graph, references, proof IDs, execution mode and run shape | Cohesive vertical slicing, adequate tests, correct ownership scope |
| Pre-edit baseline | Declared build/lint/typecheck commands and status | Whether a failure is pre-existing and what product decision follows |
| Final proof run | Exit status, expected lines, explicit selected-count evidence, image/report presence | Test validity, dishonest output, behavior not exercised |
| Adequacy report | Every proof has a row and every finding a disposition/evidence | Author independence, strength of assertions, probe relevance |
| Completion | Freshness, required evidence, blockers and capture rows accounted for | Overall correctness, security completeness, pixel-perfect visual fidelity |

### Tested-tree identity, commits, and report-only changes

Do not require a clean HEAD merely to verify: that would force commits when
`autocommit: false`. Bind evidence to full HEAD SHA plus a content digest
of tracked and relevant untracked product/test/config files, deletions,
and the frozen spec/plan verification contract. Include generated artifacts
when they are consumed by a named proof; record ignored build inputs
explicitly. Unrelated dirty files stay isolated, are listed, and cannot be
silently excluded if they affect the tested commands. The implementation
spec must define this file set before a runner can claim reliable identity.

Exclude only the bounded inline evidence/resume/report blocks from this
digest, never the whole spec/plan folder or all Markdown. Changing a proof,
requirement, command, capture, test, product file, or relevant config makes
evidence stale. Capture binaries receive content hashes. Check identity
before and after commands and again before accepting reviewers' results;
if the tree changed, rerun relevant evidence and invalidate old judgment.
A digest identifies checked bytes; it does not snapshot external services,
time, databases, or undeclared environment. Record those limitations.

At `autocommit: false`, validated units remain **verified, uncommitted** in
the resume evidence; existing Done-when marks stay unchecked. Pending
commit is distinct from failed verification. When cadence or an explicit
commit ask permits a commit, preserve existing mark/commit coupling and
failure rollback. A commit after tested worktree verification needs the
same product digest and a recorded commit mapping; changed bytes require
fresh evidence. Do not require a second commit just to update an evidence
SHA. Source: `.agents/skills/code-execute/SKILL.md`; contrast
[completion gate][completion-gate] and [implement][implement].

## Conflict resolution and dispatch policy

| Conflict | Proposed resolution in B; C difference where applicable |
| --- | --- |
| Existing refusal of independent verification | Deliberately replace it with one feature-closeout test-adequacy pass in B; C uses only named risk triggers. Never call the current command checks proof of adequacy. Human must select this policy before implementation. |
| TLC per-task commit and implicit local-commit authority | Preserve `.agents/code-commit.config.yml`, absent defaults false/wave, invalid values fail closed, missing commit skill means no autocommit; no approval sentence overrides these. |
| `.specs/STATE`, proofs/reports/lessons versus local resume rule | Keep all execution state in the existing plan's inline section; add approval/revision, dispatch, evidence, adequacy and capture subsections there. Captures are artifacts, not an execution log. No `.specs/`, project memory or lessons database. |
| TLC file/function tasks versus local vertical work | Keep observable end-to-end units and tests together; no one-file rule or layer-only decomposition. Preserve wave gates and disjoint ownership. |
| Approval and late decisions | Record actual approval words, date, and artifact revision. Planning approval does not authorize execution unless existing instructions do. Material obligation changes return to Human/spec/plan; routine implementation choices proceed within approved scope. |
| Tiny work | Preserve one-file shortcut. Record intent, touched surface, named check and test adequacy in final response; no forced spec/plan, JSON, or verifier. Money/auth/destructive/concurrent/external-contract changes never qualify by file count alone. |
| Binding captures | Capture is binding when supplied as an implementation reference unless called inspiration; ambiguity is resolved before freezing. Record approved departures; no post-hoc image resizing. Screenshots prove visible state, gestures need behavioral evidence. |
| Upstream auto-append missing criteria | Do not silently mutate approved requirements after a browser walk. Record a gap, stop affected scope, and get the material delta approved. |
| Strict test-count or never-edit-test rules | Counts detect suspicious selection/deletion, not quality. Legitimate test corrections/removal are allowed when justified by approved behavior and existing test-sync; no demand for approval on routine correct fixes. |
| Remote actions | Execute still never auto-invokes code-pr/review/ci; no push, merge, deploy, or host write follows from selecting an option or from this note. |

Implementation workers continue honoring each plan row's `spawn`/`inline`
exactly, with disjoint Owns and no nested spawning. Missing dispatch for a
`spawn` unit is a blocker or explicit plan revision, never silent inline
fallback. The orchestrator owns builds, whole-repo wave checks, resume
writes, cadence and closure. Source: `.agents/skills/code-execute/SKILL.md`
and `references/builder-brief.md`.

B's adequacy reviewer is a fresh context that did not implement the change;
it reads obligations, selected tests, evidence and diff, writes findings
through its return, and changes no product/test files. The orchestrator
persists results in the plan. It checks every proof's assertions and tries
two spec-grounded new examples, reporting non-applicability honestly. The
visual reviewer receives captures and state recipes, retakes images when
browser access permits, and compares an explicit inventory. Schedule these
serially if slots or browser state cannot safely support parallel work.
Record dispatch ID, role, tested identity and returned status before/after
sending; on resume reconcile with live agents to prevent duplicate work.
Sources: [verify][verify], [screens][screens]; local dispatch adaptation.

No subagent support means a separate fresh session/Human review is pending;
author self-check can proceed but is labeled degraded and cannot satisfy
independence. No browser/image capability means record the missing capture
or judgment and hand over exact state/viewport steps; do not claim a visual
pass. B requires Human acceptance of degraded assurance to close that item;
C has the same rule only where its trigger mandates independence. Model
selection follows available runtime and user settings; no new provider
configuration, mandatory named model, or task-count dispatch heuristic.

Allow one consolidated repair pass and one focused rereview of failed
items, then escalate remaining blockers. Unlike upstream, do not suppress
newly discovered material defects or blindly accept an author's “fixed”
claim; verify fix evidence for adequacy findings as well as command output.
No infinite review loop is promised. Source contrast: [verify][verify],
[screens][screens].

## R: selected Judge practices for code-review

R is common to B and C and independently adoptable with A. Keep explicit
review invocation, current Blocking/Nit labels and three local verdicts,
required cited grounding, missing-skill behavior, host-operation routing,
and the no-fixes/no-thread-resolution/no-merge boundary. Source:
`.agents/skills/code-review/SKILL.md`, `references/review-criteria.md`.

1. Run available repository checks first; record exact outcomes and missing
   checks. Tool failures remain visible in summary/verdict; avoid duplicate
   inline lint comments. Never equate an unavailable check with a pass.
2. Inventory external surfaces touched; fetch current official sources for
   actual external-behavior findings and log claim/URL. State zero surfaces
   when true; do not browse unrelated APIs as ceremony.
3. Verify each candidate against current code, cited obligation and concrete
   impact; reproduce locally where feasible, drop disproven allegations,
   and deduplicate open threads. Maximum five inline nits; summary counts
   overflow. No mandatory six-pass repetition or automatic file-size blocker.
4. Keep stable finding IDs in the posted summary; rereview carries every
   prior finding as fixed/open/accepted with evidence and considers changed
   code. Report late material findings plainly; no forfeiture rule that
   hides a real defect because round one missed it.
5. Capture reviewed base/head and re-fetch head before posting. If changed,
   refresh grounding and anchors first. Prefer one consolidated review via
   existing host operations when supported; otherwise preserve a single
   summary with grounded comments. Do not import Judge's GitHub-only poster.

R does not add a noise-regex gate, suppression scanner, lint-rule factory,
new severity taxonomy, universal security exclusions, or review-payload
runtime. Existing tests can check the documented contract; honest review
quality still requires reviewer judgment. Sources: [judge][judge],
[Judge gate][judge-gate], [Judge poster][judge-poster],
`.agents/skills/code-pr/references/host-operations.md`.

## Attribution, distribution, compatibility and rollback

Upstream marks both skills CC-BY-4.0; its root LICENSE distinguishes MIT
software from skill content. Any adapted wording/references must retain
Felipe Rodrigues / Tech Leads Club attribution, pinned source links,
license URL, and a statement of Wolven modifications in `NOTICE` inside
each affected distributed skill folder. Preserve MIT notices for copied
code. For reference prose whose boundary is unclear, retain attribution
and original notices rather than assume everything is MIT. This is a
packaging requirement proposal, not a legal determination. Sources:
[driven][driven], [judge][judge], [upstream license][license].

`templates/` ships in npm; local `.agents/skills/` is a separate copy.
`test/skill-copies.test.ts` requires shared trees to be byte-identical.
`test/helpers/skill-contract.ts` permits only one special cross-skill link,
to host operations. Keep scripts, notices and references self-contained in
each skill and change both trees together. No new skill means no skill-set
membership changes. Sources: `package.json`, `src/setup/skill-sets.ts`,
`test/skill-copies.test.ts`, `test/helpers/skill-contract.ts`.

`setup` adds missing paths and preserves existing files. It is not an
upgrade command and may leave old SKILL.md beside newly added references;
therefore document a coherent manual replacement/diff of all three core
skill folders, with backup of consumer edits. Standalone `skills` excludes
core and only replaces selectable differing folders after existing consent;
R can use its existing review-folder replacement behavior. Do not change
installer semantics or invent an automatic core updater. Sources:
`src/setup/apply.ts`, `src/skills/install.ts`,
`docs/adrs/adr-006-install-check-and-repair-contract.md`.

Use an optional workflow revision marker in new specs/plans. Existing
approved plans keep their existing contract through completion; do not
retrofit approvals, digests, test IDs or reviewer obligations silently.
An explicitly requested migration reviews existing obligations, adds only
missing evidence fields, records what was not historically captured, and
gets materially changed obligations/plan approved. Never fabricate prior
approval quotes. CLI validation behavior remains unchanged.

Rollback before a trial commits anything: restore only proposal-owned skill
and test changes from the saved baseline, preserving feature work and other
agents' edits. After approved integration commits, revert those commits on
a branch; no reset/force push. Consumer rollback restores backed-up skill
folders as a coherent set. Keep generated evidence as historical records,
mark superseded workflow revision, and continue feature work under the
selected old contract. No data migration or dependency uninstall is needed.

## Proposed implementation sequence after selection and approval

This is an options proposal, not code-plan output: there is no locked spec
or execution authority. First use `code-spec` to freeze the selected option
and resolved decisions, then `code-plan` to turn these candidate units into
approved work. Owns below includes both skill copies wherever named. Proof
names are proposed, not existing passing tests.

| Unit | Depends | Owns | Subagent | Done when / named proof |
| --- | --- | --- | --- | --- |
| 01 Source-bound approved specification | Approved implementation ask | Both `code-spec/` copies; `test/skill-code-spec.test.ts` | inline | A fixture expresses a capture departure and revision-bound approval, rejects missing obligations, preserves all nine dimensions; `proof-tlc-spec-contract`. B includes check-spec script; C manual contract only. |
| 02 Verifiable vertical plan | 01 | Both `code-plan/` copies; `test/skill-code-plan.test.ts`; B plan fixtures in `test/workflow-gates.test.ts` | inline | A real example maps criteria to tests/groups and vertical units; cycles/missing proof/blank execution mode cannot pass B checker; `proof-tlc-plan-contract`. C documents same manual checks. |
| 03 Preparation STOP | 01,02 | No feature diff | inline | `proof-tlc-spec-contract`, `proof-tlc-plan-contract`, copy/link checks and harness commands pass; abort before execution changes on failure. |
| 04 Evidence-bound uncommitted execution | 03 | Both `code-execute/SKILL.md`, builder briefs and B scripts; `test/skill-code-execute.test.ts`, B runtime fixtures | inline | Baseline-red stops before product mutation; no-selection fails; stale product/test/config/capture invalidates evidence; false/unit/wave cadence remains intact; `proof-tlc-execution-evidence`. |
| 05 Independent adequacy and capture closeout | 04 | Both `code-execute/` verification/capture references and SKILL integration; execution tests | inline | B always dispatches non-tiny closeout; C follows exact triggers; absence stays degraded; weak assertion/capture divergence remains open until evidenced; `proof-tlc-adequacy-capture`. |
| 06 Execution STOP | 04,05 | No feature diff | inline | Cadence, stale identity, report-only updates, dispatch resume and capture negative controls pass; `proof-tlc-execution-regression`; abort before trial on failure. |
| 07 Review subset R | 03; independent of 04–06 | Both `code-review/` copies; `test/skill-code-review.test.ts` | inline | Ledger/head-drift/unavailable-check contracts coexist with current explicit-ask, host and no-merge rules; `proof-tlc-review-contract`. Skip entirely if R declined. |
| 08 Consumer-ready distribution | 06;07 when selected | README and actual existing guide pages; notices in affected skills; relevant copy/install tests | inline | Packed skill folders contain scripts/references/notices; old installs are preserved; manual coherent core upgrade and rollback are documented; `proof-tlc-package-upgrade`. |
| 09 Representative trial and decision STOP | 08 | Future trial feature's approved paths; trial report under its own note slug | inline | Record predeclared observations below; report successes and failures, no invented benchmark claim; Human decides retain B, adopt C, revise or roll back; `proof-tlc-trial-report`. |

All units default inline here to avoid inventing delegation authority for
implementation. A future approved plan may set disjoint mutable units to
spawn, respecting user's builder reasoning preference and available slots.
No gate unit owns a feature diff. Proof-bearing tests belong to the same
vertical unit as their behavior, not a final separate test-writing wave.
Sources for unit conventions: `.agents/skills/code-plan/SKILL.md` and
`references/TEMPLATE-plan.md`.

### Required verification, scaled to selected option

B's behavioral negative controls must cover empty selection; expected line
without a passing exit; wrong selected test; duplicate/missing proof IDs;
unknown contract version; missing approval shape; cycles; missing wave
stop; unrelated dirty input; deletion and untracked file changes; generated
input change; evidence-only edits; changing HEAD with unchanged product
bytes; missing reviewer return; unclosed finding; invalid cadence; no commit
skill; absent browser; capture mismatch; and stale head before posting.
Content contract tests alone do not prove these runtime behaviors.

C needs content/fixture checks for risk triggers, no invented independence,
manual evidence shape and compatibility, but no runner suite. R tests its
existing host boundary, stable IDs and head-recheck instructions; no remote
review is posted during local verification.

Run focused tests as units land, then one final repository gate:

```sh
pnpm exec tsx --test test/skill-code-spec.test.ts test/skill-code-plan.test.ts test/skill-code-execute.test.ts test/skill-code-review.test.ts test/skill-copies.test.ts
pnpm build
pnpm test
pnpm lint
pnpm comments
pnpm validate
pnpm docs:build
pnpm pack --pack-destination /tmp/tlc-workflow-package-review
```

B additionally runs the future `test/workflow-gates.test.ts` and direct
shipped-script fixture commands specified in the locked spec. Inspect the
packed file list and exercise setup/skills preservation fixtures. New code
comments follow local why/hazard/invariant rules; test edits consult
`test-sync`. The existing baseline focused four-skill suite passed 57/57
with zero failures/skips in this investigation; this demonstrates current
contracts, not that any proposal works. Sources: `AGENTS.md`, `package.json`,
`test/skill-code-*.test.ts`; baseline output supplied by the coordinating agent.

## Trial and unresolved Human decisions

Choose a bounded feature with several observable obligations, one meaningful
failure path, at least two vertical units and existing tests. Prefer one
with a supplied UI capture if evaluating visual review; otherwise report
that visual policy remained untested. Do not implement a payment or
irreversible migration merely to exercise a trigger. Use an approved
feature already wanted by the Human.

Before starting, record expected obligations, planned commands, elapsed
planning/verification time budget and current assurance gaps. During the
trial record selected test counts; empty/stale evidence caught; weak
assertions discovered; concrete defects reproduced; false-positive review
claims; extra approval/dispatch interruptions; elapsed time; and manual
repair of generated state. “No defects found” is not proof of effectiveness.
No delivery benchmark has been run; prior upstream fixture self-tests only
exercise upstream validators. Source: [prior verification][prior-verification].

Success means all selected obligations have fresh, correctly labeled
evidence; at least one deliberate negative control is rejected; uncommitted
execution and resume preserve authority/state; a reviewer can independently
trace a sample criterion; and added work stays within the predeclared time
budget. Failure means false PASS on empty/stale evidence, forged approval
or independence, forced unauthorized commit, conflicting resume state, or
cost above that budget without demonstrated useful evidence. Either
outcome gets reported. One feature is a feasibility trial, not a statistical
comparison of B against A or C.

| ID | Human decision | Recommendation | Blocking effect / actual disposition |
| --- | --- | --- | --- |
| U-OPTION | Choose A/B/C and R independently | Trial B; adopt R separately if desired | Blocks implementation spec; unresolved |
| U-VERIFIER | Reverse current refusal; always or risk-triggered | B once per feature; C exact triggers if cost is unacceptable | Blocks changed execution policy; unresolved |
| U-TOOLING | Accept skill-local Node scripts and versioned inline manifest | B yes; no CLI/dependency change | Blocks B runtime spec; unresolved |
| U-DEGRADED | Who may accept unavailable independent/browser evidence? | Human explicit acceptance with limitation retained | Blocks affected closeout policy; unresolved |
| U-REVISION | Marker and grandfathering of old plans | New workflow marker; old approved plans stay old | Blocks migration design; unresolved |
| U-TRIAL | Feature, time budget and evaluation owner | One already-approved bounded feature; budget before execution | Blocks trial, not current planning; unresolved |
| U-ATTRIBUTION | Final notices and reused-source boundary | Attribute all adapted skill prose; preserve code notices | Blocks distribution if wording/code is reused; unresolved |

No external information blocker prevents this planning package. The listed
decisions are product choices for a later implementation ask. A durable
workflow decision may deserve a new ADR through `adr`; do not invent its
number, mark it stable, or change the current public contract from this
research note.

## Sources and research trail

Local ADRs were searched first with structured QMD query, then broader
notes. Exact-token QMD search found the prior TLC note and current public
contract; full `qmd://` documents and actual skill/source files were read.
Docid multi-get failed here, so path retrieval and direct source reading
were used. The upstream checkout was inspected directly; recommendations
above are derived proposals and have not been empirically established.

[prior]: ../tlc-spec-workflows-and-judge/tlc-spec-workflows-and-judge-note.md
[prior-verification]: ../tlc-spec-workflows-and-judge/verification.md
[driven]: https://github.com/tech-leads-club/agent-skills/blob/1da2195067c14ae5d44dc615b31cb26f50ebeb91/packages/skills-catalog/skills/(development)/tlc-spec-driven/SKILL.md
[tasks]: https://github.com/tech-leads-club/agent-skills/blob/1da2195067c14ae5d44dc615b31cb26f50ebeb91/packages/skills-catalog/skills/(development)/tlc-spec-driven/references/tasks.md
[implement]: https://github.com/tech-leads-club/agent-skills/blob/1da2195067c14ae5d44dc615b31cb26f50ebeb91/packages/skills-catalog/skills/(development)/tlc-spec-driven/references/implement.md
[verify]: https://github.com/tech-leads-club/agent-skills/blob/1da2195067c14ae5d44dc615b31cb26f50ebeb91/packages/skills-catalog/skills/(development)/tlc-spec-driven/references/validate.md
[screens]: https://github.com/tech-leads-club/agent-skills/blob/1da2195067c14ae5d44dc615b31cb26f50ebeb91/packages/skills-catalog/skills/(development)/tlc-spec-driven/references/verify-screens.md
[proof-runner]: https://github.com/tech-leads-club/agent-skills/blob/1da2195067c14ae5d44dc615b31cb26f50ebeb91/packages/skills-catalog/skills/(development)/tlc-spec-driven/scripts/check_proofs.py
[completion-gate]: https://github.com/tech-leads-club/agent-skills/blob/1da2195067c14ae5d44dc615b31cb26f50ebeb91/packages/skills-catalog/skills/(development)/tlc-spec-driven/scripts/validate_verification.py
[judge]: https://github.com/tech-leads-club/agent-skills/blob/1da2195067c14ae5d44dc615b31cb26f50ebeb91/packages/skills-catalog/skills/(quality)/the-judge/SKILL.md
[judge-gate]: https://github.com/tech-leads-club/agent-skills/blob/1da2195067c14ae5d44dc615b31cb26f50ebeb91/packages/skills-catalog/skills/(quality)/the-judge/scripts/review_gate.py
[judge-poster]: https://github.com/tech-leads-club/agent-skills/blob/1da2195067c14ae5d44dc615b31cb26f50ebeb91/packages/skills-catalog/skills/(quality)/the-judge/scripts/post_review.py
[license]: https://github.com/tech-leads-club/agent-skills/blob/1da2195067c14ae5d44dc615b31cb26f50ebeb91/LICENSE

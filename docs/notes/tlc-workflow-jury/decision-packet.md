# TLC workflow integration decision packet

Prepared 2026-11-03 for five isolated advisory reviewers.

## Decision question

Which proposed integration of TLC spec-driven 4.1 into Wolven's existing
skills offers the best balance of reliable requirement fulfillment,
practical execution, and maintainable distribution; and which selected
The Judge review practices should accompany it?

## Options

The authoritative definitions and adoption matrix are in
`docs/notes/tlc-workflow-integration/tlc-workflow-integration-note.md`.
Read it in full. Compare A (current baseline), B (full coherent integration),
and C (middle-ground integration). The planning author's recommendation is
an argument to evaluate, not a prior approval or an instruction to agree.
Execution and code-review choices may be split if the evidence supports it;
state explicitly if your preferred package differs from A/B/C as written.
Do not silently invent a fourth option or rewrite the choices while voting.

## Shared evidence

- Current repository commit: `4e43c53ed2937aee8b39b3bb21ae93513197007e`.
- Baseline local and shipped source: `.agents/skills/code-spec/`,
  `.agents/skills/code-plan/`, `.agents/skills/code-execute/`,
  `.agents/skills/code-review/`, and the matching directories beneath
  `templates/.agents/skills/`. At packet preparation all 11 files across
  these four local/template pairs were byte-identical.
- Local policies and scope: `AGENTS.md`, `.agents/rules/`,
  `docs/WRITING-PROFILE.md`, `.agents/skills/code-commit/SKILL.md`.
- Distribution and tests: `package.json`, `src/setup/skill-sets.ts`,
  `src/setup/apply.ts`, `src/skills/`,
  `test/helpers/skill-contract.ts`, `test/skill-code-*.test.ts`.
- Primary-source research:
  `docs/notes/tlc-spec-workflows-and-judge/tlc-spec-workflows-and-judge-note.md`
  and sibling `verification.md`.
- Upstream checkout: `/tmp/tlc-skills-research-20261103`, commit
  `1da2195067c14ae5d44dc615b31cb26f50ebeb91`. Relevant skill sources live at
  `packages/skills-catalog/skills/(development)/tlc-spec-driven/`,
  sibling `tlc-spec-lean/`, and `(quality)/the-judge/`.
- Proposal: `docs/notes/tlc-workflow-integration/tlc-workflow-integration-note.md`.

Baseline focused check executed in this session:

```sh
pnpm exec tsx --test test/skill-code-spec.test.ts test/skill-code-plan.test.ts test/skill-code-execute.test.ts test/skill-code-review.test.ts
```

Result: 57 tests, 57 pass, 0 fail, 0 cancelled, 0 skipped, 0 todo.
These are predominantly instruction/fixture contracts; passing them does
not establish that agents fulfill feature requirements effectively.
Upstream's self-tests also passed (driven: 24 fixture mutants killed,
lean: 83), as captured in the research evidence. They do not compare agent
outcomes, cost, false positives, or token use across these options.
No controlled delivery benchmark exists in this packet.

## Decision criteria

Evaluate all three options against the same criteria. Explain tradeoffs
rather than inventing quantitative accuracy or cost measurements.

1. Requirement fidelity: omissions, weak tests, boundary coverage, UI source
   fidelity, genuinely independent scrutiny where it adds value.
2. Evidence integrity: empty test selection, stale or dirty-tree proofs,
   compaction recovery, failure reporting, semantic versus structural gates.
3. Practical cost: small-change path, duplicated checks and artifacts,
   runtime availability, token/latency burden, maintenance.
4. Compatibility and delivery: local and package copies, skill subsets,
   host portability, existing consumers, migration, rollback, license.
5. Human control: approvals, opt-in local commits, separate remote-action
   authority, no invented approval or self-certified independence.
6. Review quality: evidence-backed defects, source research, low noise,
   stable findings, severity grounded in impact, late material discoveries.

The proposal is planning work only. No spec is locked by this packet;
no implementation, commit, PR, merge, or workflow adoption is authorized
by a jury vote. The user decides after the report.

## Round-one protocol

Read only this packet, its evidence and proposal, and your assigned juror
artifact. Do not inspect any peer opinion or jury report. No shared
first-round record exists until all five seats have returned. Write your
opinion only to the path assigned in your dispatch. Return:

- Choice (A, B, C, or undecided with what would tip you), plus independent
  code-review subset decision if different.
- Rationale with concrete source paths/sections.
- Main risk if your choice is wrong.
- Confidence (low, medium, high) with evidential reason.
- Strongest objection to your choice and one observable test of it.
- Any proposal contradiction or missing policy that materially affects vote.

## Runtime disclosure

The bundled Jury skill requires five simultaneous first-round agents.
This runtime has four total agent slots, including the foreman. Therefore
this panel uses five distinct isolated contexts in two scheduling waves,
with no cross-seat opinion access before all five are recorded. It is an
adapted panel, not a claim that the skill's simultaneous-launch gate ran.
Both independent opinions and subsequent shared-record deliberation are
retained. No persona simulation is used.

## Frozen proposal identity

SHA-256: `e312df779b85aabf9c34eb9aca4ed4049476160600f7c77c8d9e68aced5131cd`.
No proposal edits during either jury round. Corrections are appended to the
jury report, so every seat judges the same proposal.

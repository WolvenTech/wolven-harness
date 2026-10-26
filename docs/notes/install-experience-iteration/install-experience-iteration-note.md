---
type: note
title: Install experience iteration
description: The case for splitting PR 71 and for an iteration of the install-experience PRD, from the review's design findings, the jury verdict and the split test, with a decision map to walk.
status: draft
---

# Install experience iteration

## Question

Should PR 71 be split in two? Does the doctor half need an iteration of
`install-experience-prd.md` before its spec iteration, or only a spec
iteration?

## Evidence

- **The review on PR 71.** It has 14 findings. Findings 7–11 are design
  findings, each reproduced or read from code at `149dde6`.
- **The jury.** Five juror agents, isolated in round 1, chose to split, 5–0,
  at medium confidence. All five were Sonnet working from one packet the
  foreman wrote, so their votes are correlated. Every seat named the same
  open question: whether the setup slice can be cut away cleanly.
- **The split test, run after the jury.** From `149dde6`, remove
  `src/doctor/`, `src/setup/manifest.ts`, the `harness-doctor` skill and the
  doctor tests. Change only the call sites: 5 lines added and 1,006 removed
  across 11 `src/` files. The results:
  - `build` passes.
  - `validate` passes, with 87 claims ok.
  - 866 of 875 tests pass. All 9 failures are inventory or contract tests
    that name the removed parts.
  - The remaining cost is documentation. The PR's contract ADR refers to doctor or the
    manifest 29 times, and `site/commands.md` refers to them 34 times.

## Requirement gaps

A spec iteration alone can't settle these; the PRD has to.

1. **No story covers an install that predates the manifest.** Finding 8
   shows such an install never gets manifest entries. AC-6.4's refresh of
   stale templates can't reach it, and that includes the audited install
   that motivated the PRD.
2. **AC-1.2 conflicts with AC-2.3 in a subfolder of a repository.** AC-1.2
   says setup in a folder that is not a git top-level writes skills there.
   AC-2.3 says no harness file lands inside the code repository. Spec R3.2
   chose AC-1.2 (finding 11).
3. **AC-5.1 does not say where qmd is checked from.** Finding 7 shows a
   linked install passes doctor while the agent's qmd calls search an empty
   index.
4. **AC-4.1 promises the rules in context, but not their current text.**
   Finding 9 shows that copies of the rules go stale while doctor stays
   green.
5. **The PRD does not say which stories ship in which PR.** A split ships
   US-5 and US-6 later.

## Map

Walk `install-experience-iteration-map.html` (built from
`install-experience-iteration-map.json`) and paste back its "Copy for
agent" text.

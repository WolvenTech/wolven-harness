---
type: spec
title: Lean harness-init path — iteration 1 plan
description: Ordered work units that fix the ten code-review findings on PR 32 by moving the lean path into one reference file and closing its resume, credential, wiring and empty-repo gaps.
status: stable
source_spec: docs/specs/lean-init/lean-init-spec.md
source_pr: https://github.com/WolvenTech/wolven-harness/pull/32
---

# Lean harness-init path — iteration 1 plan

**Input:** the code review of PR 32 (`feat/lean-init`, ten findings) against
`docs/specs/lean-init/lean-init-spec.md` (status `draft`).
**Next:** after the Human approves this plan → `code-execute`, one wave at a
time. Pushing to the PR is a separate `code-pr` ask.

## Structural gate

The spec does not pass the gate as written for these fixes. Six of the ten
findings add obligations the spec has no proof for:

| Finding | New obligation | Proof today |
|---|---|---|
| F1 | A resumed lean run reads its path, goal and deferrals from the `draft` note rather than asking again; a repo that already finished init does not re-enter lean | none |
| F2 | A leaked-credential failure (`HYG-03`, `HYG-04`, `HYG-06`) stops the run on the lean path too; it is never recorded as a deferred gap | none |
| F3, F4 | The lean rules live in one reference file, loaded only when lean applies; the full-path steps carry no lean wording; the four-item boundary is stated once | none (R1.1 pins the section, not where it lives) |
| F5 | When validate-wiring is deferred, the note's **Validate wiring** section has defined content | none |
| F6 | The discovery-Q&A deferral holds on an empty repo | none |
| F8 | The installed and template skill copies are checked by `pnpm test`, not only by a manual `diff -r` | R5.1 is manual |

Unit 01 amends the spec with these obligations and their named proofs before
any skill text changes. The spec also refuses "a lean-path plan file or a
second lean spec". This plan exists because the Human asked for it, so unit 01
adds that exception to the spec rather than leaving the two in conflict.

F7, F9 and F10 need no new obligation: F7 renames a field R2.2 already pins,
F9 changes how existing proofs are written, and F10 is the lifecycle step the
spec's own **Next** line already names.

## Work units

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 01 | Amend the spec with the review obligations | — | `docs/specs/lean-init/lean-init-spec.md` | `inline` | Spec gains R6 (one obligation ↔ named proof row each for F1, F2, F3/F4, F5, F6), R5.1 evidence becomes a `pnpm test` proof, the **lean path** term and grounding table name the agreed fork shape, the plan-file refusal names this plan as the exception, and the Unresolved table carries the dispositions from `U-fork-shape`, `U-lean-after-full` and `U-mode-field` — proof: `proof-lean-init-spec-obligations` holds on the amended spec; `pnpm harness:validate` PASS |
| 02 | **Wave 1 gate** | 01 | — | `inline` | The Human has confirmed the amended spec; every row in this plan's Unresolved table except `U-prd-spec-approval` has a Disposition; `pnpm harness:validate` PASS — failure → **abort** before Wave 2 |
| 03 | Copies-identical proof and section helper | 02 | `test/helpers/markdown.ts`, `test/skill-copies.test.ts` (new) | `spawn` | `pnpm test` fails when any file differs between a skill folder in `.agents/skills/` and the same-named folder in `templates/.agents/skills/` (all sixteen shared skills are identical on `main` today), and `markdown.ts` exports one `section(body, heading)` extractor — proof: `proof-lean-init-copies-identical` as a test; editing one copy locally turns it red |
| 04 | Move the lean path into `references/lean-path.md` | 03 | `templates/.agents/skills/harness-init/**` and `.agents/skills/harness-init/**` (except `references/session-note-template.md`), `test/skill-harness-init.test.ts` | `spawn` | Per `U-fork-shape`: the lean rules (choosing lean, the goal question, the boundary table, the deferral prompt, proposals never deferred, must-run list) live only in `references/lean-path.md`; `SKILL.md` keeps one fork line that loads it when lean applies, plus the two lean anti-patterns; steps 2, 3, 4 and 6 and `discovery.md`, `harness-score.md`, `validate-wiring.md` return to their `main` wording; lean tests read `lean-path.md` through `section()`, check the boundary by parsing its table rows with `parseMarkdownTables`, and the stale `doesNotMatch(/defer only these\|only these three/)` guard is gone; the references test lists six files — proof: `proof-lean-init-fork-single-source` (new, R6) and the existing R1.x / R3.1 proofs re-pointed at `lean-path.md` PASS |
| 05 | Docs point to the single source | 04 | `README.md` (lean paragraph only), `site/harness-init.md` (lean section only), `test/readme-install.test.ts` | `spawn` | `README.md` and `site/harness-init.md` describe the lean path in a few lines and link to `lean-path.md` instead of listing the four items; the Fool and Jury lines in `README.md` are unchanged — proof: `proof-lean-init-docs` PASS with the link asserted |
| 06 | Resume and re-run run before the lean decision | 04 | `references/lean-path.md` (resume block), `SKILL.md` (**Re-run skips** list and fork line), `test/skill-harness-init.test.ts` (resume test) | `inline` | The lean decision comes after the draft-note check: a `draft` note with a lean section resumes with its recorded path, goal and deferrals and asks none of them again; a repo that already finished init is handled per `U-lean-after-full`; both copies identical — proof: `proof-lean-init-resume` (new, R6) PASS |
| 07 | Boundary rows hold on every thin repo | 06 | `references/lean-path.md` (boundary table), `test/skill-harness-init.test.ts` (boundary tests) | `inline` | The score-gap row says a `HYG-03`, `HYG-04` or `HYG-06` failure is never deferred and stops the run as on the full path; the discovery-Q&A row applies when the tree is thin or empty, and an empty context list is recorded as empty rather than blocking the deferral — proof: `proof-lean-init-credential-stop` and `proof-lean-init-empty-repo` (new, R6) PASS |
| 08 | The note template renders a lean run without ambiguity | 02 | `templates/.agents/skills/harness-init/references/session-note-template.md` and its installed copy, `docs/notes/lean-init-walkthrough/lean-init-walkthrough-note.md`, `test/harness-init-note.test.ts` | `spawn` | The `**Path:**` field is renamed per `U-mode-field` so it no longer collides with the reference's `## Path` section; **Validate wiring** says "deferred — see Deferred / skipped steps" when the question was deferred; the walkthrough uses both — proof: `proof-lean-init-note-fields` and `proof-lean-init-wiring-deferred` (new, R6) PASS; `proof-lean-init-walkthrough` PASS |
| 09 | **Wave 2 gate** | 05, 07, 08 | — | `inline` | `pnpm test`, `pnpm lint`, `pnpm harness:validate` and `pnpm harness:comments` exit 0; `diff -r .agents/skills/harness-init templates/.agents/skills/harness-init` prints nothing; `grep -rilw lean` (whole word, so `clean` in `adr-migration.md` does not match) under `harness-init/` matches only `SKILL.md` (fork line and anti-patterns), `references/lean-path.md` and `references/session-note-template.md` — failure → **abort** before Wave 3 |
| 10 | PRD and spec lifecycle | 09 | `docs/prds/lean-init/lean-init-prd.md`, `docs/specs/lean-init/lean-init-spec.md` (frontmatter `status` and the Acceptance checkboxes) | `inline` | Per `U-prd-spec-approval`: on the Human's approval both docs move `draft` → `stable` and the spec's Acceptance boxes match the passing proofs; with no approval the unit stops and the PR description states that both are still `draft` — proof: frontmatter inspectable; `pnpm harness:validate` PASS |
| 11 | **Ship gate** | 10 | — | `inline` | Wave 2 gate checks still pass; the ten findings are re-reported with an outcome each (`fixed`, `skipped` or `no_change_needed`); this plan's status is set to match — failure → do not hand off to `code-pr` |

Finding → unit: F1 → 06 · F2 → 07 · F3 → 04 · F4 → 04, 05 · F5 → 08 ·
F6 → 07 · F7 → 08 · F8 → 03 · F9 → 03, 04 · F10 → 10.

## Wave stops

| Stop | After | Gate |
|------|-------|------|
| **1** | 01 | Unit 02: amended spec confirmed by the Human, blocking dispositions recorded, `harness:validate` PASS — **abort before Wave 2** |
| **2** | 05, 07, 08 | Unit 09: full local gate, copies identical, lean wording confined to its three files — **abort before Wave 3** |
| **Ship** | 10 | Unit 11: findings re-reported, gates still green — then a separate `code-pr` ask |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
|---|---|---|---|---|---|
| `U-fork-shape` | Where the lean rules live: (a) a new `references/lean-path.md` loaded only when lean applies, with `SKILL.md` keeping one fork line (recommended, since a full-path run never reads the lean text); or (b) keep a `## Lean path` section in `SKILL.md` and only strip the lean clauses from steps 2–6 and the references. | Human | **Blocks Wave 1** (unit 01) and the shape of units 04–07 | Resolved 2026-10-02 by the Human: (a) `references/lean-path.md`, loaded only when lean applies | 01, 04 |
| `U-lean-after-full` | What a lean request does on a repo that already finished init (a `stable` harness-init note exists): (a) lean does not apply and the run follows the full path's re-run skips (recommended, matches the PRD non-goal); or (b) ask the Human. | Human | **Blocks Wave 1** (unit 01); shapes unit 06 | Resolved 2026-10-02 by the Human: (a) lean does not apply; the full path's re-run skips run | 01, 06 |
| `U-mode-field` | New name for the note's `**Path:**` field: `**Mode:**` (recommended), `**Init path:**`, or another. | Human | **Blocks Wave 1** (unit 01); shapes unit 08 | Resolved 2026-10-02 by the Human: `**Mode:**` | 01, 08 |
| `U-prd-spec-approval` | Approve `lean-init-prd.md` and `lean-init-spec.md` to `stable`, or ship PR 32 with both still `draft` and say so in its description. | Human | **Blocks Wave 3** (unit 10); non-blocking for Waves 1–2 | Resolved 2026-10-02 by the Human: approved; both move to `stable` | 10 |

## Frontier order

**Wave 1:** 01 → **02 STOP**

**Wave 2:** (03 ∥ 08) → 04 → (05 ∥ 06) → 07 → **09 STOP**

- 03 and 08 own disjoint files and can run in parallel.
- 05 and 06 can run in parallel: 05 owns the docs, 06 owns `lean-path.md` and
  `SKILL.md`.
- 06 and 07 both edit `references/lean-path.md` and the same test file, so
  they run one after the other, inline.
- 04, 06 and 07 edit both skill copies; each keeps them identical, and 03's
  test catches drift.

**Wave 3:** 10 → **11 STOP**

Never pull Wave 2 units into the Wave 1 batch to skip unit 02. Unit 10 never
changes a status without the Human's approval.

## Execution / resume section

### Unit 01 — Amend the spec with the review obligations

| Field | Value |
|-------|-------|
| Unit | 01 — Amend the spec with the review obligations (Wave 1, frontier 1) |
| Spec / plan | `docs/specs/lean-init/lean-init-spec.md` / `docs/specs/lean-init/lean-init-iteration-1-plan.md` |
| Obligations | R6.1–R6.5 added (F1, F2, F3/F4, F5, F6); R5.1 evidence is now `pnpm test`; term, grounding, refusal exception and dispositions recorded — done; `proof-lean-init-spec-obligations` holds by inspection; `harness:validate` and `harness:comments` ok |
| `HEAD` | `f95bca1` |
| `git status` | dirty — this plan (untracked) and `lean-init-spec.md` (modified), both this unit's Owns |
| Intended diff | `docs/specs/lean-init/lean-init-spec.md`, this plan's Unresolved table and resume section |
| Discrepancies | The spec refuses a lean plan file; resolved by unit 01 adding this plan as the exception |

### Unit 02 — Wave 1 gate

| Field | Value |
|-------|-------|
| Unit | 02 — Wave 1 gate |
| Spec / plan | `docs/specs/lean-init/lean-init-spec.md` / `docs/specs/lean-init/lean-init-iteration-1-plan.md` |
| Obligations | Dispositions recorded — done; `harness:validate` ok — done; the Human confirmed the amended spec ("continue", 2026-10-02) — done; Wave 1 gate PASS |
| `HEAD` | `f95bca1` |
| `git status` | dirty — unit 01's two files only |
| Intended diff | none (gate) |
| Discrepancies | None |

### Units 03 ∥ 08 — Wave 2, frontier 1

| Field | Value |
|-------|-------|
| Unit | 03 — Copies-identical proof and section helper; 08 — The note template renders a lean run without ambiguity (parallel, disjoint Owns) |
| Spec / plan | `docs/specs/lean-init/lean-init-spec.md` / `docs/specs/lean-init/lean-init-iteration-1-plan.md` |
| Obligations | 03: R5.1 — pending; 08: R2.2, R6.5, R4.1 — pending |
| `HEAD` | `f95bca1` |
| `git status` | dirty — unit 01's spec and this plan only (not in 03's or 08's Owns; left alone) |
| Intended diff | 03: `test/helpers/markdown.ts`, `test/skill-copies.test.ts`; 08: both `session-note-template.md` copies, the walkthrough note, `test/harness-init-note.test.ts` |
| Discrepancies | (1) `test/skill-harness-init.test.ts` pins `**Path:** <lean or full>` (unit 04's Owns): 08's rename makes it red until 04 updates it — resolved: accepted as a transient failure inside Wave 2, the gate in 09 catches it. (2) Unit 04's Done when says the references test "lists six files"; it lists seven today, so adding `lean-path.md` makes eight — resolved: 04 adds one entry, the count in the plan was wrong |

Units 03 and 08 returned complete: `comments: ok (0 findings)`, `validate: ok`, `pnpm lint` clean; the copies test passes and turns red on a one-byte edit; the only red test is the expected `**Path:**` assertion at `test/skill-harness-init.test.ts:290`, handed to unit 04.

### Unit 04 — Move the lean path into `references/lean-path.md`

| Field | Value |
|-------|-------|
| Unit | 04 — Move the lean path into `references/lean-path.md` (Wave 2, frontier 2) |
| Spec / plan | `docs/specs/lean-init/lean-init-spec.md` / `docs/specs/lean-init/lean-init-iteration-1-plan.md` |
| Obligations | R6.1 — pending; R1.1–R1.4, R2.1, R3.1 re-pointed — pending; R5.1 — done (unit 03); R2.2, R6.5 — done (unit 08) |
| `HEAD` | `f95bca1` |
| `git status` | dirty — unit 01 spec + this plan; units 03 and 08 Owns (landed, uncommitted); none in 04's Owns except the session-note-template copies, which 04 must not touch |
| Intended diff | both `harness-init/` copies except `references/session-note-template.md` (new `references/lean-path.md`; `SKILL.md`; `discovery.md`, `harness-score.md`, `validate-wiring.md` back to `main`), `test/skill-harness-init.test.ts` |
| Discrepancies | (1) the references count is eight, not six — resolved (see units 03 ∥ 08). (2) The `**Path:**` assertion moves to `**Mode:**` inside 04's Owns — resolved. (3) The resume block and the HYG / empty-repo boundary rows are units 06 and 07 — 04 moves today's wording only, resolved |

Unit 04 returned complete: `pnpm test` 555 pass / 0 fail, lint clean, `comments: ok (0 findings)`, `validate: ok`, `diff -r` of the copies empty. Decision: unit 09's grep becomes whole-word (`-w`), because `adr-migration.md` on `main` says "clean" — resolved, plan row 09 amended. `lean-path.md` beat 4 still says "Record the path"; unit 06 aligns it with the Mode field.

### Units 05 ∥ 06 — Wave 2, frontier 3

| Field | Value |
|-------|-------|
| Unit | 05 — Docs point to the single source (`spawn`); 06 — Resume and re-run run before the lean decision (`inline`) |
| Spec / plan | `docs/specs/lean-init/lean-init-spec.md` / `docs/specs/lean-init/lean-init-iteration-1-plan.md` |
| Obligations | 05: R4.2 — pending; 06: R6.2 — pending |
| `HEAD` | `f95bca1` |
| `git status` | dirty — units 01, 03, 04, 08 landed uncommitted; 05's Owns clean; 06's Owns hold unit 04's work (expected input) |
| Intended diff | 05: `README.md` lean sentence, `site/harness-init.md` lean section, `test/readme-install.test.ts`; 06: both `references/lean-path.md` copies (resume block, beat 4 wording), both `SKILL.md` copies (Re-run skips, fork line), `test/skill-harness-init.test.ts` (resume test) |
| Discrepancies | none undecided — 05 and 06 Owns are disjoint |

Unit 06 done (inline): "a resumed lean run reads its choices from the note" PASS; `comments: ok (0 findings)`, `validate: ok`, copies identical.

Unit 05 done (spawn): `README.md` and `site/harness-init.md` link `lean-path.md` instead of listing the deferrals; `test/readme-install.test.ts` asserts the link and the absence of the list; 556 pass, lint clean, `comments: ok`, `validate: ok`.

### Unit 07 — Boundary rows hold on every thin repo

| Field | Value |
|-------|-------|
| Unit | 07 — Boundary rows hold on every thin repo (Wave 2, frontier 4; unit 05 still running on disjoint paths) |
| Spec / plan | `docs/specs/lean-init/lean-init-spec.md` / `docs/specs/lean-init/lean-init-iteration-1-plan.md` |
| Obligations | R6.3, R6.4 — pending |
| `HEAD` | `f95bca1` |
| `git status` | dirty — units 01, 03, 04, 06, 08 landed uncommitted; unit 05 in flight on `README.md`, `site/harness-init.md`, `test/readme-install.test.ts` (isolated, not touched) |
| Intended diff | both `references/lean-path.md` copies (boundary table, and the `### Discovery (step 2)` and `### Harness score (step 6)` lines that restate those rows), `test/skill-harness-init.test.ts` (boundary tests) |
| Discrepancies | the step-2 and step-6 subsections in `lean-path.md` restate the two rows; leaving them would contradict the table — resolved: 07 aligns them in the same file |

Unit 07 done (inline): the score-gap row and `### Harness score (step 6)` say a `HYG-03`, `HYG-04` or `HYG-06` failure is never deferred and stops the run; the discovery row and `### Discovery (step 2)` hold on a thin or empty tree, with an empty context list recorded as empty. "a leaked credential is never deferred on the lean path" and "the discovery deferral holds on an empty repo" PASS (28/28 in the suite).

### Unit 09 — Wave 2 gate

| Field | Value |
|-------|-------|
| Unit | 09 — Wave 2 gate |
| Spec / plan | `docs/specs/lean-init/lean-init-spec.md` / `docs/specs/lean-init/lean-init-iteration-1-plan.md` |
| Obligations | R4.1–R4.3, R6.1–R6.5 and the copies proof — done |
| `HEAD` | `f95bca1` |
| `git status` | dirty — units 01, 03–08 landed uncommitted, all inside their Owns |
| Intended diff | none (gate) |
| Discrepancies | none |

Gate result: PASS on 2026-10-02 — `pnpm build` ok; `pnpm test` 558 pass, 0 fail; `pnpm lint` clean; `validate: ok`; `comments: ok (0 findings)`; `diff -r` of the two skill copies is empty; `grep -rilw lean` under `harness-init/` matches only `SKILL.md`, `references/lean-path.md` and `references/session-note-template.md`. Wave 3 waits on U-prd-spec-approval.

### Unit 10 — PRD and spec lifecycle

| Field | Value |
|-------|-------|
| Unit | 10 — PRD and spec lifecycle (Wave 3, frontier 1) |
| Spec / plan | `docs/specs/lean-init/lean-init-spec.md` / `docs/specs/lean-init/lean-init-iteration-1-plan.md` |
| Obligations | `U-prd-spec-approval` — resolved: the Human approved ("approve", 2026-10-02); all fifteen Acceptance proofs PASS (45/45 in their four suites) |
| `HEAD` | `f95bca1` |
| `git status` | dirty — Waves 1–2 landed uncommitted, all inside their Owns |
| Intended diff | frontmatter `status` of `lean-init-prd.md` and `lean-init-spec.md`, the spec's Source line and Acceptance boxes |
| Discrepancies | the R2.2 test title still says "carries the path" after the `**Mode:**` rename — resolved: rename the title to "carries the mode" and the spec's R2.2 evidence with it |

Unit 10 done (inline): `lean-init-prd.md` and `lean-init-spec.md` are `stable`; the spec's fifteen Acceptance boxes are checked against passing proofs; the R2.2 test title now reads "carries the mode". `validate: ok`, `comments: ok (0 findings)`.

### Unit 11 — Ship gate

| Field | Value |
|-------|-------|
| Unit | 11 — Ship gate |
| Spec / plan | `docs/specs/lean-init/lean-init-spec.md` / `docs/specs/lean-init/lean-init-iteration-1-plan.md` |
| Obligations | Wave 2 gate checks re-run; ten findings re-reported — done |
| `HEAD` | `f95bca1` |
| `git status` | dirty — Waves 1–3 landed uncommitted, all inside their Owns |
| Intended diff | this plan's `status` |
| Discrepancies | none |

Gate result: PASS on 2026-10-02 — `pnpm build` ok; `pnpm test` 558 pass, 0 fail; `pnpm lint` clean; `validate: ok`; `comments: ok (0 findings)`; skill copies identical; `grep -rilw lean` matches only the three lean files. All ten findings re-reported as `fixed`. This plan is `stable`; the work is uncommitted, ready for a `code-commit` and then a separate `code-pr` ask.


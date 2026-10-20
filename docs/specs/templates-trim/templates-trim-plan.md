---
type: spec
title: Trim the shipped templates without cutting contract — plan
description: Ordered work units for the lean PR body, the one-message wave commit, and the seven reference-file trims, with wave stops and carried Unresolved rows.
status: stable
---

# Trim the shipped templates without cutting contract — plan

**Spec:** `docs/specs/templates-trim/templates-trim-spec.md` (status `stable`)
**Baseline:** `d7cb269`; `origin/main` has not moved since, so every budget measures against it.

## Structural gate

Every obligation R1.1–R5.2 in the spec names a proof with a command or a
test as its evidence shape, and `proof-templates-trim-spec-obligations`
holds: each acceptance box pairs with one R row and one proof, all nine
landings are present, and each `n/a` cites an unchanged surface. No gap
blocks slicing.

Each unit owns both copies of every file it touches (`templates/.agents/…`
and `.agents/…`) and changes them together; R1.5 is checked in every batch.

## Work units

The per-batch gate in a Done when is
`pnpm test && pnpm build && node dist/cli.js validate && pnpm comments && pnpm lint`.

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 01 | Lean PR body (wave A1) | — | `templates/.agents/skills/code-pr/references/pr-body-template.md`, `.agents/skills/code-pr/references/pr-body-template.md`, `templates/.agents/skills/code-pr/SKILL.md`, `.agents/skills/code-pr/SKILL.md`, `test/skill-code-pr.test.ts` | `spawn` | [x] The template body is Summary (What/Why/How bullets ≤140 chars, `Task:` only when one exists), Verification (1–3 command bullets, `Risk:` only at Medium/High) and Before merge (Manual test, CI green, closure only with `docs/specs`, `docs/prds` or `docs/adrs` changes); the skill restates only that shape and its EXAMPLE is a filled body of at most 25 lines; proofs `proof-templates-trim-pr-shape`, `-pr-caps`, `-pr-before-merge`, `-pr-evidence`, `-pr-agree`, `-pr-length` PASS in `test/skill-code-pr.test.ts`; per-batch gate exit 0 |
| 02 | One message per wave batch (wave A2) | — | `templates/.agents/skills/code-commit/SKILL.md`, `.agents/skills/code-commit/SKILL.md`, `templates/.agents/skills/code-commit/references/commit-examples.md`, `.agents/skills/code-commit/references/commit-examples.md`, `test/skill-code-commit.test.ts` | `spawn` | [x] A multi-unit wave batch is told to write one subject plus a body of at most three lines; a one-unit wave and a standalone commit keep today's rules; `## Atomic commit gate` equals the baseline; one good and one bad wave example exist; proofs `proof-templates-trim-wave-message-rule`, `-wave-scope`, `-plan-mark-unchanged`, `-wave-examples` PASS; per-batch gate exit 0 |
| 03 | **Wave A gate** | 01, 02 | — | `inline` | [x] Wave A1 and A2 acceptance boxes in the spec all PASS; `pnpm test` and `node dist/cli.js validate` PASS on the combined tree; failure → **abort wave A** (wave B continues) |
| 04 | Trim `code-spec` EXAMPLE (wave B) | — | `templates/.agents/skills/code-spec/references/EXAMPLE.md`, `.agents/skills/code-spec/references/EXAMPLE.md` | `spawn` | [x] The file shrinks 25–35% against `d7cb269` (`proof-templates-trim-file-budgets`); its row kinds survive (`proof-templates-trim-spec-example-kinds`); every baseline `n/a` line is still found (`-na-kept`); removed restatements are listed with the kept copy (`-single-copy`); `git diff --name-only` lists exactly the pair (`-revert-alone`); copies identical; per-batch gate exit 0 |
| 05 | Trim `code-plan` EXAMPLE-units (wave B) | — | `templates/.agents/skills/code-plan/references/EXAMPLE-units.md`, `.agents/skills/code-plan/references/EXAMPLE-units.md` | `spawn` | [x] The file shrinks 20–30%; the work-units table keeps `spawn`/`inline` cells, a `STOP` row, the "empty until decided" Disposition and one `(bad — re-slice)` example (`proof-templates-trim-plan-example-kinds`); `-na-kept`, `-single-copy`, `-revert-alone` and copies hold; per-batch gate exit 0 |
| 06 | Trim the session-note template (wave B) | — | `templates/.agents/skills/harness-init/references/session-note-template.md`, `.agents/skills/harness-init/references/session-note-template.md` | `spawn` | [x] The file shrinks 15–20% with only prose outside the fence cut; the fenced block diffs empty against the baseline (`proof-templates-trim-note-fence`); `n/a — full tour` and `n/a — basics` still present (`-na-kept`); `-single-copy`, `-revert-alone` and copies hold; per-batch gate exit 0 |
| 07 | Trim `code-spec` TEMPLATE (wave B) | — | `templates/.agents/skills/code-spec/references/TEMPLATE.md`, `.agents/skills/code-spec/references/TEMPLATE.md` | `spawn` | [x] The file shrinks 10–15% while every heading and all nine dimension rows stay; `-file-budgets`, `-na-kept`, `-single-copy`, `-revert-alone` and copies hold; per-batch gate exit 0 |
| 08 | Trim the builder brief (wave B) | — | `templates/.agents/skills/code-execute/references/builder-brief.md`, `.agents/skills/code-execute/references/builder-brief.md` | `spawn` | [x] The file shrinks 5–15% with every placeholder and section `test/skill-code-execute.test.ts` pins intact; `-file-budgets`, `-na-kept`, `-single-copy`, `-revert-alone` and copies hold; per-batch gate exit 0 |
| 09 | Trim the stub template (wave B) | — | `templates/.agents/skills/harness-init/references/stub-template.md`, `.agents/skills/harness-init/references/stub-template.md` | `spawn` | [x] The file shrinks 0–10%, cutting only prose no `harness-init-stub` test matches; `-file-budgets`, `-na-kept`, `-single-copy`, `-revert-alone` and copies hold; per-batch gate exit 0 |
| 10 | Trim the `qmd-first` rule (wave B) | — | `templates/.agents/rules/qmd-first.md`, `.agents/rules/qmd-first.md` | `spawn` | [x] The rule shrinks 15–20% and still states both unpinned rules (`proof-templates-trim-qmd-rules`); `cmp` on the pair is clean (`-copies-identical`); `-file-budgets`, `-single-copy`, `-revert-alone` hold; per-batch gate exit 0 |
| 11 | **Wave B gate** | 04, 05, 06, 07, 08, 09, 10 | — | `inline` | [x] Every wave B acceptance box in the spec PASS, including `proof-templates-trim-kind-restore` (no row kind lost); a batch that failed is reverted alone and reported; `pnpm test` and `node dist/cli.js validate` PASS; failure → **abort before wave C** |
| 12 | **Ship gate (wave C)** | 03, 11 | — | `inline` | [x] The eight files shrink 4,883–6,510 B in total (`proof-templates-trim-total-budget`); one spec and one plan filled from the same short ask against `d7cb269` and against the trimmed skills, in a scratch folder outside the repo, diff empty on headings, table header rows and `n/a` lines, or the Human accepts each difference (`proof-templates-trim-fill-compare`); `node dist/cli.js validate` PASS; failure → **stop and report before `code-pr`** |

## Wave stops

| Stop | After | Gate |
|------|-------|------|
| **A** | 03 | Units 01–02 proofs PASS and the repo gates pass on the combined tree — **abort wave A only**; wave B is unaffected |
| **B** | 11 | Every wave B proof PASS and no row kind lost — **abort before wave C** |
| **Ship** | 12 | Total budget and fill compare PASS; `harness:validate` PASS — before `code-pr` |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
|---|---|---|---|---|---|
| `U-trim-depth` | Is 15–20% enough for the non-PR templates, or is a deeper cut with more risk wanted? | Human (maintainer) | Non-blocking: units 04–10 and 12 run on the PRD's 15–20% | *(empty until decided)* | 04–10 |
| `U-output-quality` | Does a trimmed example make agent output worse where no test would notice? | Human (maintainer) | Non-blocking for 01–11; a fill difference the Human does not accept blocks unit 12 | *(empty until decided)* | 12 |
| `U-skill-trim-prd` | Does the `harness-init` and `code-execute` `SKILL.md` trim become its own PRD? | Human (maintainer) | Non-blocking: out of scope | Defer: a later PRD (the PRD's default, carried from the spec) | — |

## Frontier order

**Wave A:** 01 → 02 → **03 STOP**

**Wave B:** 04 → 05 → 06 → 07 → 08 → 09 → 10 → **11 STOP**

**Wave C:** **12 Ship** after 03 and 11

Waves A and B share no owned path and may run in either order. Inside one
checkout, run the units one at a time: every per-batch gate runs the whole
`pnpm test` suite, so a sibling's half-done edit would fail it. Run units in
parallel only when each has its own worktree.

Commit cadence: `.agents/code-commit.config.yml` is absent, so
`autocommit: false` applies and `code-execute` leaves each unit's work
uncommitted until a commit is asked for. When commits are asked for, wave A
is one batch per unit (01, 02) and wave B one batch per copy pair, so R1.4's
revert-alone holds.

## Execution / resume section

Settled units, with the gate run on this session's tree:

| Unit | Status | Gate output |
|------|--------|-------------|
| 01 | done | `pnpm test` 806 pass / 0 fail · `pnpm build` 0 · `node dist/cli.js validate` 0 · `pnpm comments` 0 · `pnpm lint` 0 |
| 02 | done | `pnpm test` 810 pass / 0 fail · `pnpm build` 0 · `node dist/cli.js validate` 0 · `pnpm comments` 0 · `pnpm lint` 0 |
| 03 (wave A gate) | done | 10/10 wave A proofs PASS · `pnpm test` 810/810 · `node dist/cli.js validate` ok on the combined tree |
| 04 | done | 5,232 → 3,753 B (28.26%) · four baseline `n/a` lines found verbatim · copies `cmp` clean · `pnpm test` 810/810 · build/validate/comments/lint 0 |
| 05 | done | 4,857 → 3,835 B (21.04%) · `spawn`/`inline`, `STOP`, `empty until decided`, one `(bad — re-slice)` all present · copies clean · gate 0 |
| 06 | done | 5,702 → 4,724 B (17.15%) · fenced block byte-identical (2,655 B) · both `n/a` lines present · copies clean · gate 0 |
| 07 | done | 4,385 → 3,864 B (11.88%) · all headings identical · nine dimension rows present · three `n/a` lines verbatim · gate 0 |
| 08 | done | 2,773 → 2,466 B (11.07%) · headings and 12/12 placeholders identical · every pinned string present · gate 0 |
| 09 | done | 5,016 → 4,883 B (2.65%) · both fenced blocks byte-identical · hand-back tail intact · copies clean · gate 0 |
| 10 | done | 1,717 → 1,402 B (18.34%) · both unpinned rules present · `cmp` clean · gate 0 |
| 11 (wave B gate) | done | 7/7 budgets in band · 0 missing baseline `n/a` lines · 7/7 pairs identical · kinds all present · no wave B `test/`/`src/` change · `pnpm test` 810/810 · build/validate/comments/lint 0 |

### Unit 12 — Ship gate (wave C)

| Field | Value |
|-------|-------|
| Unit identifier | 12 — Ship gate (wave C), frontier position 1 in wave C |
| Spec/plan paths | `docs/specs/templates-trim/templates-trim-spec.md` / `docs/specs/templates-trim/templates-trim-plan.md` |
| Obligation / proof status | R5.1 PASS — 32,552 → 27,458 B, shrink 5,094 B (15.64%). R5.2 PASS — one spec and one plan filled from the same short ask under `/tmp/templates-trim-fill-2026-10-20/{before,after}`, six diffs (spec/plan headings, table header rows, `n/a` lines) all empty. `node dist/cli.js validate` PASS |
| `HEAD` commit | `bd5e777` from `git rev-parse --short HEAD`; the batches are `98fb6cb`…`bd5e777` |
| `git status` summary | clean after ten commits — one per wave A unit, one per wave B copy pair, and this record |
| Intended diff scope | none in the repo beyond the resume record; the fill compare wrote only under `/tmp` |
| Decision on every discrepancy | resolved: no fill difference needs the Human's acceptance, so `U-output-quality` did not block the gate; `U-trim-depth` and `U-output-quality` stay open with an empty Disposition |

Two quality notes for the Human, not obligations:

- `code-spec/references/EXAMPLE.md` kept one worked row per required kind but dropped the `failure modes`, `data lifecycle`, `external-dependency failure` and `state transitions` landing rows, so the example now lands five of the nine dimensions. `TEMPLATE.md` keeps all nine, and the fill compare still lands all nine — the contract holds, the example is thinner.
- `qmd-first.md` dropped the permission sentence "A disagreement table may show both numbers" while keeping the rule that neither number is named as the limit to use.

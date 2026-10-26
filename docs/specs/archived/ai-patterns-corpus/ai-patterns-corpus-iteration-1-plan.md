---
type: spec
title: AI patterns pilot — iteration 1 review fixes - plan
description: One wave of four units that apply the PR 78 review fixes, a gate, and a closing re-report of every finding.
status: deprecated
---

# AI patterns pilot — iteration 1 review fixes - plan

**Input:** [iteration-1 spec](./ai-patterns-corpus-iteration-1-spec.md),
`status: stable`, approved by the Human on 2026-10-26. The obligations are I1–I8.
**Approval:** Human approved this plan on 2026-10-26; execution runs
separately through `code-execute`. No completion is inferred from approval.
**Findings:** the [PR 78 review](https://github.com/WolvenTech/wolven-harness/pull/78#pullrequestreview-5654536097)
of `2a36417`.

## Structural gate

- The spec's `proof-ai-patterns-iter1-spec-obligations` command passes on
  this branch: eight obligations, eight distinct proofs, eight matching
  acceptance boxes, and all nine dimensions landed.
- Every obligation has a named proof with a real command, and each proof
  has one owning unit below.
- The paths below exist at `2a36417`: `.agents/skills/ai-patterns/SKILL.md`,
  the seven cards, `.agents/skills/qmd/`, `templates/.agents/skills/qmd/`,
  `test/skill-copies.test.ts`, `docs/specs/archived/ai-patterns-corpus/`,
  and `docs/notes/ai-patterns-corpus/ai-patterns-corpus-note.md`.
  `.agents/skills/ai-patterns/agents/openai.yaml` is a new file that unit 02
  creates.
- Two files link into the archived folder, and unit 01 owns both:
  `docs/knowledge/ai-patterns/evaluation-design.md` (line 21) and the base
  spec's own structural-check path (line 290). One file links to the routing
  that unit 04 removes, and unit 02 owns it: `ai-patterns/SKILL.md` line 15,
  "QMD contract … for collection routing and freshness".
- `.agents/code-commit.config.yml` sets `autocommit: true` and
  `autocommit-rule: wave`. This plan is one wave, so `code-execute` makes
  one commit after the unit 06 gate. That commit carries unit 05's
  re-report, this plan and the iteration spec, which are untracked until
  then.

## Finding → unit map

| Finding | Severity | Obligations | Unit | Result |
| --- | --- | --- | --- | --- |
| F1 — `ai-patterns` loads without being asked, but its own pilot found no lift | Blocking | I1 | 02 | `fixed` — `proof-ai-patterns-iter1-ask-only` |
| F2 — card frontmatter is not uniform | Blocking | I2 | 03 | `fixed` — `proof-ai-patterns-iter1-card-shape` |
| F3 — the always-loaded `qmd-first` contradicts the `qmd` skill | Blocking | I3 | 04 | `fixed` — `proof-ai-patterns-iter1-qmd-template`: both match their templates, so they agree |
| F4 — stage routing in the shared `qmd` skill forced the copy-test exemption | Nit | I3, I4 | 04 | `fixed` — `proof-ai-patterns-iter1-qmd-template`, `proof-ai-patterns-iter1-copy-test` |
| F5 — ingestion provenance inside retrieval content | Nit | I6 | 03 | `fixed` — `proof-ai-patterns-iter1-no-process-data` |
| F6 — the negative pilot result cannot be retrieved | Nit | I7, I8, I5 | 01, 02 | `fixed` — `proof-ai-patterns-iter1-relocation`, `proof-ai-patterns-iter1-links`, `proof-ai-patterns-iter1-skill-text` |
| F7 — the PR body's stack line is stale | Nit | none; `code-pr` lane per the spec's cross-domain leak table | 05 | `skipped` — host-side PR text; route to `code-pr` on an explicit ask |

## Work units

| # | Unit | Depends | Owns | Subagent | Done when |
| --- | --- | --- | --- | --- | --- |
| 01 | Bring the initiative back from `archived/` with working links | — | `git mv docs/specs/archived/ai-patterns-corpus/{ai-patterns-corpus-spec,ai-patterns-corpus-plan,ai-patterns-corpus-pilot}.md docs/specs/ai-patterns-corpus/`; relative-link and structural-check-path lines in those three files; line 21 of `docs/knowledge/ai-patterns/evaluation-design.md`; relative links in `docs/notes/ai-patterns-corpus/ai-patterns-corpus-note.md`; local QMD index state | `inline` | [x] The base spec, plan and pilot record sit beside the iteration spec, and `validate` no longer reports `profile-missing-main-doc` for `docs/specs/ai-patterns-corpus`. `git diff -M` shows three renames whose only content changes are link and path lines. After one `qmd update`, `qmd ls specs` lists the pilot record. The I7 `proof-ai-patterns-iter1-relocation` and I8 `proof-ai-patterns-iter1-links` checks print PASS. |
| 02 | Make consultation ask-only and state its own limits | 01 | `.agents/skills/ai-patterns/SKILL.md`; new `.agents/skills/ai-patterns/agents/openai.yaml` | `inline` | [x] `ai-patterns` can no longer load without an explicit ask: `disable-model-invocation: true`, an `openai.yaml` with `policy.allow_implicit_invocation: false` in the shape of `handoff/agents/openai.yaml`, and a description with no automatic topic triggers. The body says `knowledge` needs `-c knowledge`, links `qmd` for search mechanics only (line 15's routing wording is gone), and carries "revise before permanent adoption" with a link to `ai-patterns-corpus-pilot.md`. `proof-ai-patterns-iter1-ask-only` and `proof-ai-patterns-iter1-skill-text` pass. |
| 03 | Give the seven cards one shape with no process data | 01 | `docs/knowledge/ai-patterns/*.md` (frontmatter, body review-state lines, and `context-selection.md`'s ingestion-provenance paragraph only) | `inline` | [x] Each card's frontmatter has exactly `type: knowledge`, `title`, `description`, `status: draft`, `aliases`, `review`, `checked`, `upstream`. No body repeats a review-state value; its caveat text moves into the evidence limits. `context-selection.md` uses `review: needs-review` if its own text still says the Context Rot entry needs review. No card contains ingestion provenance or model settings, and the pilot record's R3 row still holds them. `proof-ai-patterns-iter1-card-shape` and `proof-ai-patterns-iter1-no-process-data` pass. |
| 04 | Return `qmd` to its shipped template and re-cover it in the copy test | 01 | `.agents/skills/qmd/**`; `test/skill-copies.test.ts` | `inline` | [x] The local `qmd` skill matches the shipped one, so the stage routing table, directory-coverage section and knowledge-specific refresh text are gone. `qmd-first` still matches its template. `LOCAL_CUSTOMIZED_SKILLS` is gone, and `skill-copies` compares `qmd` again and passes. `proof-ai-patterns-iter1-qmd-template` and `proof-ai-patterns-iter1-copy-test` pass. |
| 05 | Re-report every review finding | 02, 03, 04 | This plan's Finding → unit map (a Result column) | `inline` | [x] F1–F7 each carry `fixed`, `skipped` or `no_change_needed`, with the proof or reason that supports it, taken from the unit outputs. Unit 06 re-verifies those proofs. F7 is `skipped` and routed to `code-pr`. No finding is left without a result, and no PR thread is replied to or resolved, which is `code-ci`'s lane. |
| 06 | **Wave 1 STOP / ship gate** | 05 | —; verification only | `inline` | [x] All eight spec proofs re-run and PASS over the final tree. I8 runs again because units 02 and 03 edited linked files. `pnpm build`, `pnpm validate`, `pnpm comments`, `pnpm lint`, `pnpm test` and `git diff --check` pass. `qmd update` reports the index current. Any `fixed` result in unit 05 that a proof here contradicts goes back to its unit. A failure aborts before the commit; nothing re-exempts a test. |

Units 02, 03 and 04 have disjoint Owns and could run in parallel. They stay
`inline` because each is a short edit and they share one working tree. Spawning
them would add briefs and no isolation.

## Wave stops

| Stop | After | Gate |
| --- | --- | --- |
| **1 / Ship** | 06 | I1–I8 proofs PASS; `pnpm build`, `pnpm validate`, `pnpm comments`, `pnpm lint`, `pnpm test`, `git diff --check` pass — **abort** on failure; this is the last wave |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
| --- | --- | --- | --- | --- | --- |
| `U-ai-patterns-routing-home` | Where repo-specific stage routing lives | Human | Blocked unit 04 | Settled 2026-10-26: remove; `qmd` returns to its template; R13 retired | 04 |
| `U-ai-patterns-card-status` | Card `status` value | Human | Blocked unit 03 | Settled 2026-10-26: `draft` until `U-ai-patterns-permanence` | 03 |
| `U-ai-patterns-knowledge-check` | Permanent automated check of the card shape | Human | Non-blocking; unit 03's command proves this iteration | *(empty until decided)* | — |
| `U-ai-patterns-base-status` | The moved base spec and plan carry `status: deprecated` in an active folder | Human | Non-blocking; unit 01 leaves frontmatter unchanged | *(empty until decided)* | 01 |
| `U-ai-patterns-permanence` | Retain, revise or remove the pilot | Human | Non-blocking here; blocks `status: stable` on cards and any distribution | *(empty until decided)* | — |

## Frontier order

**Wave 1:** 01 → (02, 03, 04 in any order, run one after another) → 05 → **06 STOP**

Unit 01 goes first. Until the base spec sits beside the iteration spec,
`validate` fails for this folder, so no later unit can pass its final check.

## Execution / resume section

### Unit 01 — Bring the initiative back from `archived/` with working links

| Field | Value |
|-------|-------|
| Unit identifier | 01 — Bring the initiative back from `archived/` with working links (frontier 1 of 6) |
| Spec/plan paths | `docs/specs/ai-patterns-corpus/ai-patterns-corpus-iteration-1-spec.md` / `docs/specs/ai-patterns-corpus/ai-patterns-corpus-iteration-1-plan.md` |
| Obligation / proof status | I7, I8 — done (links PASS, base structural PASS, `qmd ls specs` lists the pilot, validate ok) |
| `HEAD` commit | `2a36417` |
| `git status` summary | dirty — untracked `docs/specs/ai-patterns-corpus/` (iteration spec and plan, committed with this wave); no unrelated paths |
| Intended diff scope | renames of the three base files into `docs/specs/ai-patterns-corpus/`; link/path lines in them; `docs/knowledge/ai-patterns/evaluation-design.md` line 21; links in `docs/notes/ai-patterns-corpus/ai-patterns-corpus-note.md` if broken; local QMD index |
| Decision on every discrepancy | none |

### Unit 02 — Make consultation ask-only and state its own limits

| Field | Value |
|-------|-------|
| Unit identifier | 02 — Make consultation ask-only and state its own limits (frontier 2 of 6) |
| Spec/plan paths | `docs/specs/ai-patterns-corpus/ai-patterns-corpus-iteration-1-spec.md` / `docs/specs/ai-patterns-corpus/ai-patterns-corpus-iteration-1-plan.md` |
| Obligation / proof status | I1, I5 — done (ask-only frontmatter and Codex policy, opt-in note, verdict link; links PASS; comments and validate ok) |
| `HEAD` commit | `2a36417` |
| `git status` summary | dirty — unit 01's uncommitted work (renames, `evaluation-design.md` line 21) and this plan; nothing outside the wave |
| Intended diff scope | `.agents/skills/ai-patterns/SKILL.md`; new `.agents/skills/ai-patterns/agents/openai.yaml` |
| Decision on every discrepancy | none |

### Unit 03 — Give the seven cards one shape with no process data

| Field | Value |
|-------|-------|
| Unit identifier | 03 — Give the seven cards one shape with no process data (frontier 3 of 6) |
| Spec/plan paths | `docs/specs/ai-patterns-corpus/ai-patterns-corpus-iteration-1-spec.md` / `docs/specs/ai-patterns-corpus/ai-patterns-corpus-iteration-1-plan.md` |
| Obligation / proof status | I2, I6 — done (card-shape PASS; no process data in cards; links PASS; comments and validate ok) |
| `HEAD` commit | `2a36417` |
| `git status` summary | dirty — units 01–02's uncommitted work and this plan; nothing outside the wave |
| Intended diff scope | `docs/knowledge/ai-patterns/*.md` frontmatter, body review-state lines, and `context-selection.md`'s ingestion-provenance paragraph |
| Decision on every discrepancy | none |

### Unit 04 — Return `qmd` to its shipped template and re-cover it in the copy test

| Field | Value |
|-------|-------|
| Unit identifier | 04 — Return `qmd` to its shipped template and re-cover it in the copy test (frontier 4 of 6) |
| Spec/plan paths | `docs/specs/ai-patterns-corpus/ai-patterns-corpus-iteration-1-spec.md` / `docs/specs/ai-patterns-corpus/ai-patterns-corpus-iteration-1-plan.md` |
| Obligation / proof status | I3, I4 — done (`qmd` and `qmd-first` identical to templates; exemption removed; skill-copies 1 pass 0 fail; comments and validate ok) |
| `HEAD` commit | `2a36417` |
| `git status` summary | dirty — units 01–03's uncommitted work and this plan; nothing outside the wave |
| Intended diff scope | `.agents/skills/qmd/**`; `test/skill-copies.test.ts` |
| Decision on every discrepancy | none |

### Unit 05 — Re-report every review finding

| Field | Value |
|-------|-------|
| Unit identifier | 05 — Re-report every review finding (frontier 5 of 6) |
| Spec/plan paths | `docs/specs/ai-patterns-corpus/ai-patterns-corpus-iteration-1-spec.md` / `docs/specs/ai-patterns-corpus/ai-patterns-corpus-iteration-1-plan.md` |
| Obligation / proof status | F1–F7 results — done (six `fixed`, F7 `skipped`) |
| `HEAD` commit | `2a36417` |
| `git status` summary | dirty — units 01–04's uncommitted work and this plan; nothing outside the wave |
| Intended diff scope | this plan's Finding → unit map |
| Decision on every discrepancy | resolved — this record was written after the edit, not before; the edit touched only the map's Result column |

### Unit 06 — Wave 1 STOP / ship gate

| Field | Value |
|-------|-------|
| Unit identifier | 06 — Wave 1 STOP / ship gate (frontier 6 of 6) |
| Spec/plan paths | `docs/specs/ai-patterns-corpus/ai-patterns-corpus-iteration-1-spec.md` / `docs/specs/ai-patterns-corpus/ai-patterns-corpus-iteration-1-plan.md` |
| Obligation / proof status | I1–I8 — PASS; `pnpm build`, `validate` (claims 48 ok), `comments` (0 findings), `lint`, `git diff --check` pass; `pnpm test` 1014 pass, 0 fail |
| `HEAD` commit | `2a36417` |
| `git status` summary | dirty — the whole wave's work, ready for the wave commit |
| Intended diff scope | verification only; then the wave commit |
| Decision on every discrepancy | none |

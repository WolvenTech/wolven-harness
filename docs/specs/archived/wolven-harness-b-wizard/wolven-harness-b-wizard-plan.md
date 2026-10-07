---
type: spec
title: Wolven harness B — Init wizard (Code plan)
description: Ordered work units for Entrega B — the open-stub warning, the harness-init skeleton with its runtime rules, step 0 and the ADR migration reference, the kb benchmark note and the sweep exclusion in Wave B1; discovery, stubs, session note, skill set and README in B2 — run by Sonnet builder subagents with parent-run wave gates.
status: archived
tags: [spec, code-plan, harness, init-wizard, wolven]
generated: { by: claude-code/code-plan, at: 2026-09-26T20:30:00Z }
updated: { by: claude-code/code-execute, at: 2026-09-28T14:45:00Z, note: "Executed: B1, B2, PR review fixes, pre-mortem fixes, last B round; merged as 4af0e7c" }
---

# Wolven harness B — Init wizard (Code plan)

- **Spec:** docs/specs/archived/wolven-harness-b-wizard/wolven-harness-b-wizard-spec.md (`stable`, approved 2026-09-26)
- **PRD:** docs/prds/archived/wolven-ai-assisted-dev-harness/wolven-ai-assisted-dev-harness-prd.md (`Executor: code`, `stable`; notes "shipped-artifact language" and "merges, versions, and changelog")
- **Projeto:** docs/prds/archived/wolven-ai-assisted-dev-harness/wolven-ai-assisted-dev-harness-project.md — Entrega B
- **Sibling plans:** docs/specs/archived/wolven-harness-a-core/wolven-harness-a-core-plan.md (A merged as `f33de1d`) · docs/specs/archived/wolven-harness-d-code-lane/wolven-harness-d-code-lane-plan.md (D merged as `d495802`)
- **Next:** Done — merged as `4af0e7c` (2026-09-28). C starts from its stub.

## Structural gate (before planning)

`proof-whb-spec-obligations` — PASS 2026-09-26: 17 R rows carry 17 distinct proof ids, each once; the 17 acceptance boxes name the same set; the nine-dimension table has nine landings and no `n/a`.

## Execution setup

| Item | Value |
|------|-------|
| Package clone | `/Users/rafael/Desktop/wolven-harness`, clean on `main` at `d495802` (verified 2026-09-26) |
| Branch | `feat/b-init-wizard`, cut from `origin/main` (`d495802`) by the first unit that mutates. Every package unit commits there |
| Push / PR | Ask-only (`code-pr`). One package PR for B, titled as a Conventional Commit, opened when the Human asks and amended at each later gate. The Human squash-merges it after B2 |
| Builder model | Builder units spawn `builder` with `model: sonnet` and `code-execute`'s brief. The parent runs gate units, reviews each return against Done when, and restores anything outside Owns |
| Parallel builders | Share one clone and need disjoint Owns. Builders run `pnpm test` only, never `pnpm build` (shared `dist/`), and never run `init` outside a test fixture. They never edit `test/helpers/**`; a missing helper is reported to the parent |
| Commits | OMT `.agents/code-commit.config.yml` is `autocommit: true`, `autocommit-rule: wave`: the parent invokes `code-commit` once per wave gate after PASS, one package commit per wave, plus an OMT commit for this plan's marks and OMT units. Builders never commit |
| OMT | Writes: this plan's resume section, unit 05 (benchmark note), unit 06 (sweep exclusion in the PRD note), units 13–14 (records). OMT PR #30 is amended; there are no new OMT PRs |

### Seams fixed by the plan

- **One skill, many units.** Unit 02 writes the whole `harness-init/SKILL.md`: the steps 0–6, the hard gates (runtime rules, phased commits), the re-run skips, and a link to each of the five references. It also creates those five files, each holding only a title and a one-line purpose, so links resolve from the first gate. Units 03, 04, 08, 09, and 10 each own and fill exactly one reference. The skeleton lines never reach `main`: the PR merges after B2 fills them all.
- **Step summaries in `SKILL.md` follow the spec's B-Q text.** A reference unit that finds a contradiction with the summary reports it to the parent rather than editing `SKILL.md`.
- **Test files per unit.** Each unit adds its own test file, and each test name starts with its proof's short id, so the gates can map proofs to tests with `grep`: `stub-warn:`, `skill-shape:`, `runtime-rules:`, `step0-modes:`, `step0-fixture:`, `migrate-rules:`, `migrate-closure:`, `migrate-example:`, `discovery:`, `research-cap:`, `suggest:`, `stub-template:`, `session-note:`, `skill-set:`.
- **Skill set.** Adding the `harness-init` folder breaks the "exactly fifteen" ask-only test, so unit 02 updates `test/ask-only.test.ts` to 16 skills with `harness-init` model-invocable (the ask-only set stays 4). Unit 11 adds the render and README proofs for R7.1.
- **Sweep exclusion.** The PRD sweep hits `harness-init`'s "the Human" voice from unit 02 on, so unit 06 records the B-Q15 glob in the PRD note before the B1 gate runs the sweep.
- **Cross-skill references.** `harness-init` names other skills in backticks (`adr`, `research`, `code-commit`, `qmd`, `grilling`), never by relative link.
- **No consumer names.** Examples use invented repos and ADR titles. `seed-extract:` and the residue grep already reject One-Man-Team words; R7.2 adds consumer names.

## Wave stops

| Stop | After unit | Gate |
|------|------------|------|
| **B1** | 07 | `rm -rf dist && pnpm build && pnpm test && pnpm validate && pnpm comments` exit 0; PRD sweep (D-Q1 globs plus the B-Q15 glob) and spec D's R4.1 residue grep empty, both with `--hidden --glob '!.git'`; every B1 proof maps to passing tests or an inspection; OMT `pnpm docs:index && pnpm validate` PASS — **abort before B2** |
| **B2** | 12 | Same, plus R7.2's greps and all 17 proofs mapped — **no handoff to C** |
| **Record** | 13, 14 | B2 PASS recorded in the spec and TAP; then the squash SHA on `main`; OMT `pnpm docs:index && pnpm validate` PASS |

Initiative pre-merge closure lives in spec C; this plan has no closure unit.

## Unresolved

The spec has no blocking rows. Its two non-blocking rows carry their spec dispositions:

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
|---|---|---|---|---|---|
| `U-b-consumer-ignores` | agentic-mkt ignores `.agents/`, `.claude/`, `.cursor/`, and `.codex/` | Human | Non-blocking for B; step 0's `git check-ignore` check (unit 03) surfaces the class generically | Hand to spec C: the dogfood PR decides | 03 |
| `U-a-cloud-app` | Claude GitHub App on WolvenTech | Human (org admin) | Non-blocking; execute runs locally | Carried from spec A — still deferred | — |

## Work units

Subagent *(omit)* = spawn `builder` with `model: sonnet` and the brief. `writer` = spawn `writer` with `model: sonnet`. `inline` = the parent runs it.

### Wave B1 — stub warning, skeleton, step 0, migration, benchmark

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 01 | Open-stub warning in `validate` (R0.1) | — | `src/validate/spine.ts`, `test/spine.test.ts` (new `stub-warn:` cases only) | *(omit)* | `validate` warns `skill-stub-open` (exit 0) once per `.agents/skills/<name>/SKILL.md` whose frontmatter has `metadata.wolven-harness: stub`, naming the file and telling the reader to define the skill and then remove the marker. Tests: one stub → one warning, exit 0; marker removed → none; `metadata: { other: x }` → none; two stubs → two warnings; the existing `skill-frontmatter`, `rule-missing`, and `step0-pending` cases still pass — `proof-whb-stub-warn` |
| 02 | `harness-init` skeleton and runtime rules (R1.1, R1.2) | — | `templates/.agents/skills/harness-init/SKILL.md`, `templates/.agents/skills/harness-init/references/{entry-modes,adr-migration,discovery,stub-template,session-note-template}.md` (title and one-line purpose only), `test/skill-harness-init.test.ts`, `test/ask-only.test.ts` (skill set to 16) | *(omit)* | `SKILL.md` has `name: harness-init` and a description, with no ask-only flag or `agents/openai.yaml`. It lists steps 0–6 in order with the re-run skips (B-Q3); runs `harness:validate` after each writing step; shows a diff before each write; offers the phased commits of B-Q17 (entry, migration, setup; each after validate exits 0, only on the Human's yes, through `code-commit`; never at the end only, never per file, ADR, claim, or stub); creates the session note as `draft` at the start of step 0 (B-Q13); and links each reference. The hard gates state the runtime rules of B-Q1: validate output drives what comes next; an ambiguity becomes one question at a time, recommended option first; never invent a status, a successor, a mode, or a decision; name no consumer repo. Tests: frontmatter; the seven step headings in order; the skips; the phases, validate precondition, yes gate, and "never per file" rule; the four runtime gates; links resolve; no `pnpm validate`. `ask-only:` passes over 16 skills with 4 ask-only — `proof-whb-skill-shape`, `proof-whb-runtime-rules` |
| 03 | Step 0 — entry integration (R2.1, R2.2) | 02 | `templates/.agents/skills/harness-init/references/entry-modes.md`, `test/harness-init-entry.test.ts` | *(omit)* | The reference defines full, light, and mention-only (B-Q4): what each writes; with no `AGENTS.md`, `WOLVEN.md` becomes `AGENTS.md` without its first line; `WOLVEN.md` deleted in full and light, kept without its first line in mention-only; how the agent recommends a mode. It covers the B-Q5 checks: existing content kept unless the Human agrees; overlaps asked; the `@AGENTS.md` offer for a `CLAUDE.md` that lacks it; `git check-ignore` on `.agents/`, `docs/`, and wired runtime paths, reporting the `.gitignore` line. It holds the light block and the mention-only line verbatim. Tests: three mode headings, the deletion rule, the four checks; a fixture with an existing `AGENTS.md` plus the light block and no `WOLVEN.md` → `validate` exit 0 with no `step0-pending` or `rule-missing`; a fixture with the mention-only line and `WOLVEN.md` kept → no `step0-pending` — `proof-whb-step0-modes`, `proof-whb-step0-fixture` |
| 04 | Step 1 — legacy ADR migration (R3.1–R3.3) | 02 | `templates/.agents/skills/harness-init/references/adr-migration.md`, `test/harness-init-migration.test.ts` | *(omit)* | The reference carries the B-Q6 rules (keep the number, stop on a collision including `adr-000`; `git mv`; slug from the title; frontmatter prepend; verbatim body) and a status table with `Accepted` → `stable`, `Proposed` → `draft`, `Superseded by <ADR>` → `deprecated` + `superseded_by`, and an "anything else → ask the Human, offering only options that pass `validate`" row. It carries the B-Q7 closure: links recomputed into and out of moved files; non-ADR files in the legacy folder never moved into `docs/adrs/`, with delete-or-keep asked; the claim loop (run validate, then repoint, reword, or record a new decision through `adr`, each with the Human); done only at validate exit 0 with `0 legacy-warn`; the pointer to the repo's own test and lint commands; the Human's review of the diff. Its worked example uses an invented repo: two Nygard ADRs (one `Accepted`, one `Superseded by` the other) and a file linking to one, before and after. Tests: each rule and closure item present; before-state fixture → `legacy-adr` warnings and `2 legacy-warn`; after-state fixture → exit 0, `0 legacy-warn`, the claim to the stable ADR `ok`, the deprecated one carrying `superseded_by` without error — `proof-whb-migrate-rules`, `proof-whb-migrate-closure`, `proof-whb-migrate-example` |
| 05 | compozy/kb benchmark note (R6.1, OMT) | — | OMT `docs/notes/archived/wolven-harness-kb-benchmark/wolven-harness-kb-benchmark-note.md` | `writer` | The note (`type: note`) cites kb at `d7c8261` (README and `kb ingest codebase` / `inspect` docs). Each kb codebase capability (symbol and file map, dependency graph, complexity, blast radius, coupling and instability, dead code, the `inspect` queries, the QMD index) is marked **adopt as a discovery prompt** (with the prompt wording) or **out of scope** (with a reason). It states that nothing is vendored, that kb may appear as a decided tool, and that it never ships. OMT `pnpm docs:index && pnpm validate` exit 0 — `proof-whb-kb-benchmark` |
| 06 | Sweep exclusion for `harness-init` (B-Q15, OMT) | — | OMT PRD note "shipped-artifact language" (sweep block and the paragraph after it) | `inline` | The PRD sweep block adds `--glob '!templates/.agents/skills/harness-init/**'`, and the paragraph after it names `harness-init` beside the Code lane and utility skills with the reason (spec B decision B-Q15). OMT `pnpm validate` exit 0. The sweep run at the B1 gate uses this block |
| 07 | **Wave B1 gate** | 01–06 | — | `inline` | The parent runs `rm -rf dist && pnpm build && pnpm test && pnpm validate && pnpm comments` (exit 0), the PRD sweep from unit 06, and spec D's R4.1 residue grep (both empty with `--hidden --glob '!.git'`, hand-reviewed hits named), and checks that `LICENSE` is absent. Each B1 proof maps to passing tests by prefix, or to unit 05's inspection. The parent flips the B1 marks and invokes `code-commit` (package: one commit; OMT: the plan marks plus units 05–06). On failure → **abort before B2** |

### Wave B2 — discovery to hand-back, skill set, shipped language

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 08 | Steps 2–4 — discovery, research, suggestions (R4.1–R4.3) | 07 | `templates/.agents/skills/harness-init/references/discovery.md`, `test/harness-init-discovery.test.ts` | *(omit)* | The reference lists the sources the agent reads (manifests, lockfiles, README, `AGENTS.md`, CI config, `docs/adrs/`, installed skills, top-level layout) plus the prompts unit 05 marks "adopt"; the two asks (lifecycle stage; decisions not visible in code); and the three outputs (context, lifecycle, decided tools). Research: repo and QMD first; web only on the Human's OK, at most 5 primary-source fetches, decided tools only; every finding cited in the session note; `research` offered for depth; repo-only fallback recorded. Suggestions: 2–4, each named for a decided tool or field with its evidence, none duplicating an installed skill, fewer stated rather than padded, the Human picks, no catalogue. Tests: each of those elements present, including the cap of 5 — `proof-whb-discovery`, `proof-whb-research-cap`, `proof-whb-suggest` |
| 09 | Step 5 — stubs (R4.4) | 07 | `templates/.agents/skills/harness-init/references/stub-template.md`, `test/harness-init-stub.test.ts` | *(omit)* | The template renders `.agents/skills/<name>/SKILL.md` with `name`, a description saying it is a stub, `metadata: { wolven-harness: stub }`, `disable-model-invocation: true`, a body with the discovery evidence and headed prompts for the Human's instructions, plus `agents/openai.yaml` with `policy.allow_implicit_invocation: false`. The reference says an existing skill folder is never overwritten and ends with the line telling the Human to define each stub and then remove the marker. Tests: a stub rendered into a fixture passes `skill-frontmatter`, raises exactly one `skill-stub-open` (unit 01), and carries both ask-only flags; the no-overwrite rule and the hand-back line present — `proof-whb-stub-template` |
| 10 | Step 6 — session note (R5.1) | 07 | `templates/.agents/skills/harness-init/references/session-note-template.md`, `test/harness-init-note.test.ts` | *(omit)* | The template has the path rule `docs/notes/harness-init-<yyyy-mm-dd>/harness-init-<yyyy-mm-dd>-note.md` (`-2` for a second same-day run), `type: note`, and the seven sections (Entry integration, ADR migration, Discovery, Research, Suggestions, Stubs, Next steps for the Human). It says the note is created as `draft` at the start of step 0, gains each phase's section before that phase's commit offer, turns `stable` at hand-back, and is resumed from on a re-run. Tests: a note rendered at `docs/notes/harness-init-2026-01-01/harness-init-2026-01-01-note.md` → `validate` exit 0; sections, per-phase update, and status rule present — `proof-whb-session-note` |
| 11 | Skill set, `WOLVEN.md` row, README (R7.1) | 07 | `test/harness-init-set.test.ts`, `README.md` (wizard section) | *(omit)* | `renderWolven` over the templates lists a `harness-init` row; the README has a wizard section describing steps 0–6, the three modes, the migration closure, stubs and the open-stub warning, and the phased commits, with no dev-time ids. Tests: the render row; `ask-only:` (from unit 02) still passes with 16 skills and 4 ask-only — `proof-whb-skill-set` |
| 12 | **Wave B2 gate** | 08–11 | — | `inline` | The B1 gate commands run again and every test passes. The parent runs spec D's R4.1 residue grep and R4.3 doc-path grep over `templates src` plus `rg --hidden -i "agentic-mkt\|compozy\|kb ingest" templates` (all empty, no `LICENSE`), and the PRD sweep with the B-Q15 glob (empty, hand-reviewed hits named). No reference holds only its skeleton line. All 17 proofs map to passing tests or gate checks. The parent flips the B2 marks and invokes `code-commit`. On failure → **no handoff to C** — `proof-whb-no-residue`, `proof-whb-sweep` |

### Record

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 13 | Record B green (OMT) | 12 | OMT spec B (acceptance boxes, `updated`), TAP (row B and the B/D milestone) | `inline` | Spec B's 17 boxes are ticked with per-prefix test counts at the B2 gate SHA; the TAP milestone notes B green; OMT `pnpm docs:index && pnpm validate` exit 0; PR #30 amended |
| 14 | Record the merge (OMT) | 13, 18, 21, 24, Human squash-merge | OMT this plan (`status: stable`, Merge line), TAP milestone | `inline` | The squash SHA is verified on `main`; the B2 gate commands re-run on `main` pass; this plan carries the Merge line with the SHA and test count; the TAP cites the squash SHA; OMT `pnpm docs:index && pnpm validate` exit 0; PR #30 amended |

### Review fixes — WolvenTech/wolven-harness#3

The PR review (2026-09-28, "approve with nits") left four threads: two should-fix, two nits. All four are fixed on `feat/b-init-wizard` under spec decision B-Q18, amending PR #3 before the squash-merge.

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 15 | Full-mode heading nesting and refresh-not-refold (B-Q18) | 13 | `templates/.agents/skills/harness-init/{SKILL.md,references/entry-modes.md}`, `test/harness-init-entry.test.ts`, `test/skill-harness-init.test.ts` | `inline` | Full mode drops the body's H1 and demotes its headings one level under `## Wolven harness`, except in the no-`AGENTS.md` case; an "Already integrated" section and the `SKILL.md` re-run skip say an `AGENTS.md` holding the harness section is never folded twice (diff, refresh offer, then delete `WOLVEN.md`). Tests: 2 new `step0-modes:`, 1 new `skill-shape:` — `proof-whb-step0-modes`, `proof-whb-skill-shape` |
| 16 | One read pass over skills in `validate` (B-Q18) | 13 | `src/validate/spine.ts`, `test/spine.test.ts` | `inline` | `checkSkills` walks `.agents/skills/*/SKILL.md` once and returns both `skill-frontmatter` and `skill-stub-open` findings, output order and messages unchanged. Test: 1 new `stub-warn:` (a stub missing its description raises both) — `proof-whb-stub-warn` |
| 17 | Doc layout in the light block (B-Q18) | 13 | `templates/.agents/skills/harness-init/references/entry-modes.md` (light block) | `inline` | The light block names `docs/<folder>/<slug>/<slug>-<type>.md`, flat ADRs, and `docs/WRITING-PROFILE.md`; the `step0-fixture:` light test still passes — `proof-whb-step0-fixture` |
| 18 | **Review-fix gate**, commit, PR amend, thread closure | 15–17 | — | `inline` | B2 gate commands and greps re-run green; one package `fix(harness-init)` commit pushed to PR #3; PR body updated; each thread answered with the SHA and resolved; fresh `gh pr view` MERGEABLE/CLEAN. OMT spec B (B-Q18, counts), this plan, and TAP recorded; PR #30 amended |

### Pre-mortem fixes — ignored harness paths and doc folders

`the-fool` pre-mortem (2026-09-28, Opus subagent) ranked five failure modes. The Human took F2 (an ignored `.agents/` keeps the harness on one machine) into B as an error plus re-include rules (B-Q19), and turned the `docs/` concern into a step 0 check plus a deferral (B-Q20). F1 and F3–F5 stay open for the Human's call (the three doc-only B edits, the small `validate` fixes, and the C items).

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 19 | `harness-ignored` spine error (B-Q19) | 18 | `src/validate/spine.ts`, `test/spine.test.ts`, `README.md` (validate and step 0 lines) | `inline` | `validate` fails once per harness path present on disk that an ignore rule excludes, naming the rule and its source; a `!` re-include as the last match, or no match, raises nothing; tracked files are not reported. Tests: 4 `harness-ignored:` — `proof-whb-harness-ignored` |
| 20 | Step 0 re-include rules and doc-folder check (B-Q19, B-Q20) | 18 | `templates/.agents/skills/harness-init/{SKILL.md,references/entry-modes.md}`, `test/harness-init-entry.test.ts` | `inline` | Check 4 proposes re-include rules (never deletes ignore lines, writes on a yes, and says `validate` stays red on a no); a "Re-include rules" section carries the block, including `!.agents/hooks/` and a slash-less `!.claude/skills`; check 5 lists content in the five doc folders and asks. Tests: 2 new `step0-modes:`, 1 new `step0-fixture:` (block clears `harness-ignored`, harness paths tracked, private files untracked) — `proof-whb-step0-modes`, `proof-whb-step0-fixture` |
| 21 | Gate, commit, PR amend, records | 19, 20 | OMT spec B (B-Q19, B-Q20, R0.2), this plan, TAP, docs/deferrals/docs-root/docs-root-deferral.md | `inline` | Package gate green, plus an end-to-end scratch run (`init` into a repo ignoring `.agents/` and `.claude/`, then the block appended → `validate: ok`); one package `fix(validate)` commit pushed to PR #3; PR body updated; OMT `pnpm docs:index && pnpm validate` green; PR #30 amended |

### Last B round — honest migration (B-Q21)

The grilling on the pre-mortem's leftover items (2026-09-28) kept B to one last text-only round. The `validate` fixes, install and version, the live-run expectations, and three deferrals went to spec C's stub.

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 22 | Migration: partial supersession, token search, claim meaning (B-Q21) | 21 | `templates/.agents/skills/harness-init/{SKILL.md,references/adr-migration.md}`, `test/harness-init-migration.test.ts` | `inline` | The table's partial-supersession ask row (split through `adr`, or keep `stable` with the decision recorded), with `Superseded by` mapping directly only otherwise; the token search, tests included, before any status other than `stable`; the closure's claim-meaning check for touched ADRs. Tests: 2 new `migrate-rules:`, 1 new `migrate-closure:` — `proof-whb-migrate-rules`, `proof-whb-migrate-closure` |
| 23 | Session note: per-ADR table and naming rule (B-Q21) | 21 | `templates/.agents/skills/harness-init/references/session-note-template.md`, `test/harness-init-note.test.ts` | `inline` | The ADR migration section has the per-ADR table and the claims worked through; "Naming ADRs in the note" limits ADRs to bare number and title. Tests: 1 new `session-note:`, 1 new `session-note-fixture:` (a deprecated row passes by bare number and fails as `ADR-NNN` with `claim-deprecated`) — `proof-whb-session-note` |
| 24 | Gate, commit, PR amend, records | 22, 23 | OMT spec B (B-Q21), spec C stub, this plan, TAP, three deferrals | `inline` | Package gate green; one package `fix(harness-init)` commit pushed to PR #3; PR body updated; OMT `pnpm docs:index && pnpm validate` green; PR #30 amended |

## Frontier

- **B1:** 01, 02, 05, and 06 start together (disjoint Owns). 03 and 04 follow 02 and run in parallel. 07 closes the wave.
- **B2:** 08, 09, 10, and 11 run in parallel after 07 (disjoint Owns; 08 reads unit 05's note). 12 closes the wave.
- **Record:** 13 after 12; 14 after the Human merges.
- **Review fixes:** 15, 16, and 17 after 13 (disjoint Owns except 15 and 17 share `entry-modes.md`, so run inline together); 18 closes the round.
- **Pre-mortem fixes:** 19 and 20 after 18 (disjoint Owns), 21 closes them.
- **Last B round:** 22 and 23 after 21 (disjoint Owns), 24 closes it; 14 after 24 and the merge.

## Builder brief additions

Every builder gets `code-execute`'s brief plus:

- Branch `feat/b-init-wizard`; spec `docs/specs/archived/wolven-harness-b-wizard/wolven-harness-b-wizard-spec.md` (read only the B-Q rows and R rows its unit names).
- Voice: skill text says "the Human" for the person steering the agent; package code, tests, README, and messages carry no dev-time ids (no B-Q, R, unit, wave, proof, or spec letters), per the PRD note.
- Examples use invented repos, ADR titles, and tools; never a real consumer.
- Final check before returning: `pnpm test`, the built `comments` command against the branch base (the parent's build), and the PRD sweep over the files touched, with outputs pasted.

## Execution / resume section

### Wave B1 — units 01–07 (done 2026-09-26)

| Field | Value |
|-------|-------|
| Unit | B1: 01 open-stub warning, 02 skeleton and runtime rules, 03 entry modes, 04 ADR migration, 05 kb benchmark, 06 sweep exclusion, 07 gate — all done |
| Spec / plan | `docs/specs/archived/wolven-harness-b-wizard/wolven-harness-b-wizard-spec.md` / `docs/specs/archived/wolven-harness-b-wizard/wolven-harness-b-wizard-plan.md` |
| Obligations | `proof-whb-stub-warn` (4 `stub-warn:` tests), `proof-whb-skill-shape` (8 `skill-shape:`), `proof-whb-runtime-rules` (4 `runtime-rules:`), `proof-whb-step0-modes` (5 `step0-modes:`), `proof-whb-step0-fixture` (2 `step0-fixture:`), `proof-whb-migrate-rules` (5 `migrate-rules:`), `proof-whb-migrate-closure` (6 `migrate-closure:`), `proof-whb-migrate-example` (3 `migrate-example:`; before `2 legacy-warn`, after `2 ok, 0 legacy-warn, 0 fail`), `proof-whb-kb-benchmark` (inspected: 8 capabilities, 1 adopted — the QMD index prompt) — done |
| `HEAD` | Package `feat/b-init-wizard` at `5c31732` (one B1 commit on `d495802`, not pushed); OMT `534629d` + this B1 commit |
| `git status` | Package clean after commit; OMT dirty only with the B1 paths below |
| Intended diff | Package: `src/validate/spine.ts`, `templates/.agents/skills/harness-init/**`, `test/spine.test.ts`, `test/skill-harness-init.test.ts`, `test/ask-only.test.ts`, `test/harness-init-entry.test.ts`, `test/harness-init-migration.test.ts`. OMT: `docs/notes/archived/wolven-harness-kb-benchmark/wolven-harness-kb-benchmark-note.md`, the PRD note sweep block, `docs/index.md`, this section |
| Discrepancies | Resolved: (1) the migration example's literal ADR numbers became claims in a fresh install (`init-surfaces` red) — rewritten with `<A>`/`<B>` placeholders the test renders, links as inline code; (2) parent review tightened `SKILL.md` gate 4 (the skill names no consumer and special-cases none; a session may name its own repo), added README to step 2's sources, and aligned the migration reference's whole-diff review with the per-write diffs |

**B1 gate (2026-09-26):** `rm -rf dist && pnpm build && pnpm test && pnpm validate && pnpm comments` → 383 tests pass, `validate: ok` (`claims: 2 ok, 0 legacy-warn, 0 fail`), `comments: ok (0 findings)`; PRD sweep (with the `harness-init` glob) → only hand-reviewed hits: `builder-brief:` / `wave gate` in `test/skill-code-execute.test.ts` and `test/skill-code-commit.test.ts` (unchanged from `main`) and `test/skill-harness-init.test.ts`'s consumer-name regex (the absence check itself); spec D's R4.1 residue grep over `templates src` and `rg --hidden -i "agentic-mkt\|compozy\|kb ingest" templates` empty; no `LICENSE`.

### Wave B2 — units 08–12 (done 2026-09-26)

| Field | Value |
|-------|-------|
| Unit | B2: 08 discovery, 09 stubs, 10 session note, 11 skill set and README, 12 gate — all done |
| Spec / plan | `docs/specs/archived/wolven-harness-b-wizard/wolven-harness-b-wizard-spec.md` / `docs/specs/archived/wolven-harness-b-wizard/wolven-harness-b-wizard-plan.md` |
| Obligations | `proof-whb-discovery` (5 `discovery:` tests), `proof-whb-research-cap` (7 `research-cap:`), `proof-whb-suggest` (5 `suggest:`), `proof-whb-stub-template` (9 `stub-template:`; rendered stub → one `skill-stub-open`, both ask-only flags), `proof-whb-session-note` (6 `session-note:`; note at `docs/notes/harness-init-2026-01-01/…` passes as `draft` and `stable`), `proof-whb-skill-set` (9 `skill-set:`; `renderWolven` row, 16 skills, 4 ask-only, README section), `proof-whb-no-residue` (gate greps empty), `proof-whb-sweep` (gate sweep: one hand-reviewed hit) — done |
| `HEAD` | Package `feat/b-init-wizard` at `44c3684` (B1 `5c31732` + B2, not pushed); OMT `95d0dcc` + this B2 commit |
| `git status` | Package clean after commit; OMT dirty only with this section |
| Intended diff | Package: `templates/.agents/skills/harness-init/references/{discovery,stub-template,session-note-template}.md`, `test/harness-init-{discovery,stub,note,set}.test.ts`, `README.md`. OMT: this section |
| Discrepancies | Resolved at parent review: (1) `test/harness-init-set.test.ts` copied the sweep patterns into a README assertion, which made the test file itself a sweep hit and duplicated the gate — removed; (2) research cap "five (5)" → "five"; (3) README wizard section reflowed to the file's one-line-per-paragraph style. Unit 10 added a `session-note-fixture:` prefix beside `session-note:`; both map to `proof-whb-session-note` |

**B2 gate (2026-09-26):** `rm -rf dist && pnpm build && pnpm test && pnpm validate && pnpm comments` → 424 tests pass, `validate: ok` (`claims: 2 ok, 0 legacy-warn, 0 fail`), `comments: ok (0 findings)`; spec D's R4.1 residue grep and R4.3 doc-path grep over `templates src` empty; `rg --hidden -i "agentic-mkt\|compozy\|kb ingest" templates` empty; no literal ADR claim token in `harness-init` beyond `adr-000` (the seeded ADR every install carries); no `LICENSE`; PRD sweep with the `harness-init` glob → the Code-lane test hits unchanged from `main` plus `test/skill-harness-init.test.ts`'s consumer-name regex (the absence check itself), hand-reviewed. No reference holds only its skeleton line (85–241 lines each). All 17 proofs map to passing tests or gate checks. 
### Unit 13 — Record B green (done 2026-09-26)

| Field | Value |
|-------|-------|
| Unit | 13 — record B green (OMT) |
| Spec / plan | `docs/specs/archived/wolven-harness-b-wizard/wolven-harness-b-wizard-spec.md` / `docs/specs/archived/wolven-harness-b-wizard/wolven-harness-b-wizard-plan.md` |
| Obligations | 17/17 acceptance boxes ticked with per-prefix test counts at `44c3684`; TAP milestone notes B green — done |
| `HEAD` | Package `feat/b-init-wizard` at `44c3684`, pushed; WolvenTech/wolven-harness#3 opened; OMT `46c0d43` + this commit |
| `git status` | OMT dirty only with the spec, TAP, this section, and `docs/index.md` |
| Intended diff | OMT spec B (acceptance, `updated`), TAP milestone row, this section |
| Discrepancies | None |

### Units 15–18 — PR #3 review fixes (done 2026-09-28)

| Field | Value |
|-------|-------|
| Unit | 15 heading nesting and refresh-not-refold, 16 one read pass over skills, 17 light-block doc layout, 18 gate and PR amend — all done |
| Spec / plan | `docs/specs/archived/wolven-harness-b-wizard/wolven-harness-b-wizard-spec.md` (B-Q18) / `docs/specs/archived/wolven-harness-b-wizard/wolven-harness-b-wizard-plan.md` |
| Obligations | `proof-whb-step0-modes` (7 `step0-modes:`), `proof-whb-skill-shape` (9 `skill-shape:`), `proof-whb-stub-warn` (5 `stub-warn:`), `proof-whb-step0-fixture` (2 `step0-fixture:`, light block re-validated) — done; proof set unchanged at 17 |
| `HEAD` | Package `feat/b-init-wizard` at `5182624` (`44c3684` + one `fix(harness-init)` commit), pushed; PR #3 body updated; OMT `8df8265` + this commit |
| `git status` | Package clean; OMT dirty only with spec B, this plan, and the TAP |
| Intended diff | Package: `src/validate/spine.ts`, `templates/.agents/skills/harness-init/{SKILL.md,references/entry-modes.md}`, `test/{spine,skill-harness-init,harness-init-entry}.test.ts`. OMT: spec B, this plan, TAP |
| Discrepancies | None. `step0-pending` stays unchanged (validate behavior is out of scope); the refresh path clears it by deleting `WOLVEN.md` |

**Review-fix gate (2026-09-28):** `rm -rf dist && pnpm build && pnpm test && pnpm validate && pnpm comments` → 428 tests pass, `validate: ok` (`claims: 2 ok, 0 legacy-warn, 0 fail`), `comments: ok (0 findings)`; PRD sweep with the `harness-init` glob → the same hand-reviewed hits as B2 (Code-lane tests unchanged from `main`; `test/skill-harness-init.test.ts`'s consumer-name regex); spec D's R4.1 residue grep and R4.3 doc-path grep over `templates src` empty; `rg --hidden -i "agentic-mkt\|compozy\|kb ingest" templates` empty; no ADR token in `harness-init` beyond `adr-000`; no `LICENSE`. Four review threads answered with `5182624` and resolved; `gh pr view 3` → MERGEABLE, CLEAN.

### Units 19–21 — pre-mortem fixes (done 2026-09-28)

| Field | Value |
|-------|-------|
| Unit | 19 `harness-ignored`, 20 step 0 re-include rules and doc-folder check, 21 gate and records — all done |
| Spec / plan | `docs/specs/archived/wolven-harness-b-wizard/wolven-harness-b-wizard-spec.md` (B-Q19, B-Q20, R0.2) / `docs/specs/archived/wolven-harness-b-wizard/wolven-harness-b-wizard-plan.md` |
| Obligations | `proof-whb-harness-ignored` (4 `harness-ignored:`, plus the end-to-end scratch run), `proof-whb-step0-modes` (9 `step0-modes:`), `proof-whb-step0-fixture` (3 `step0-fixture:`) — done; 18 proofs |
| `HEAD` | Package `feat/b-init-wizard` at `53d8211` (`5182624` + one `fix(validate)` commit), pushed; PR #3 body updated; OMT `bfa0f2b` + this commit |
| `git status` | Package clean; OMT dirty only with spec B, this plan, the TAP, the new deferral, and `docs/index.md` |
| Intended diff | Package: `src/validate/spine.ts`, `README.md`, `templates/.agents/skills/harness-init/{SKILL.md,references/entry-modes.md}`, `test/{spine,harness-init-entry}.test.ts`. OMT: spec B, this plan, TAP, docs/deferrals/docs-root/docs-root-deferral.md |
| Discrepancies | Resolved: the end-to-end run caught `.agents/hooks` (written by `init`) missing from the block, so `!.agents/hooks/` was added and the fixture now carries a hooks file. Two sweep hits (`Human` in test regexes) lowercased; one untagged section-divider comment removed |

**Pre-mortem gate (2026-09-28):** `rm -rf dist && pnpm build && pnpm test && pnpm validate && pnpm comments` → 435 tests pass, `validate: ok` (`claims: 2 ok, 0 legacy-warn, 0 fail`), `comments: ok (0 findings)`; PRD sweep with the `harness-init` glob → only the hand-reviewed hits named at B2; spec D's R4.1 and R4.3 greps over `templates src` empty; `rg --hidden -i "agentic-mkt\|compozy\|kb ingest" templates` empty; no `LICENSE`. End-to-end: `init --runtimes claude,codex` into a repo ignoring `.agents/` and `.claude/` → 4 `harness-ignored` errors; the reference's block appended → `validate: ok`, 45 `.agents/**` files and the `.claude/skills` symlink (`120000`) tracked. `gh pr view 3` → `53d8211`, MERGEABLE, CLEAN.

### Units 22–24 — last B round (done 2026-09-28)

| Field | Value |
|-------|-------|
| Unit | 22 migration text, 23 session-note table and naming rule, 24 gate and records — all done |
| Spec / plan | `docs/specs/archived/wolven-harness-b-wizard/wolven-harness-b-wizard-spec.md` (B-Q21) / `docs/specs/archived/wolven-harness-b-wizard/wolven-harness-b-wizard-plan.md`; spec C stub gains the grilling's decided section |
| Obligations | `proof-whb-migrate-rules` (7 `migrate-rules:`), `proof-whb-migrate-closure` (7 `migrate-closure:`), `proof-whb-session-note` (5 `session-note:` + 3 `session-note-fixture:`) — done; 18 proofs |
| `HEAD` | Package `feat/b-init-wizard` at `1fb7818` (`53d8211` + one `fix(harness-init)` commit), pushed; PR #3 body updated; OMT `30560ee` + this commit |
| `git status` | Package clean; OMT dirty only with spec B, spec C, this plan, the TAP, three deferrals, and `docs/index.md` |
| Intended diff | Package: `templates/.agents/skills/harness-init/{SKILL.md,references/adr-migration.md,references/session-note-template.md}`, `test/harness-init-{migration,note}.test.ts`. OMT: spec B, spec C, this plan, TAP, `docs/deferrals/wolven-harness-{adr-4digit,claim-waivers,init-drift-check}.md` |
| Discrepancies | Resolved in the grilling (Q14): the claim scan reads `docs/notes/` with no code-span exclusion, so the note's table names ADRs by bare number and title; a fixture proves the claim-token form fails with `claim-deprecated` |

**Last-round gate (2026-09-28):** `rm -rf dist && pnpm build && pnpm test && pnpm validate && pnpm comments` → 440 tests pass, `validate: ok` (`claims: 2 ok, 0 legacy-warn, 0 fail`), `comments: ok (0 findings)`; the PRD sweep with the `harness-init` glob → only the hand-reviewed hits named at B2; spec D's R4.1 and R4.3 greps over `templates src` empty; `rg --hidden -i "agentic-mkt\|compozy\|kb ingest" templates` empty; no ADR token in `harness-init` beyond `adr-000`; no `LICENSE`.

### Unit 14 — Record the merge (done 2026-09-28)

**Merge:** WolvenTech/wolven-harness#3 squash-merged to `main` as `4af0e7c` on 2026-09-28 (14:35 UTC); the tree matches `feat/b-init-wizard` `1fb7818`. On `main`: `rm -rf dist && pnpm build && pnpm test` 440/440, `pnpm validate` ok (`claims: 2 ok, 0 legacy-warn, 0 fail`), `pnpm comments` 0 findings. Entrega B closes; spec C's `code-spec` session may start from the stub's decided section.

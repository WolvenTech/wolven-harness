---
type: spec
title: Lean harness-init path for thin repos
description: Freeze the lean harness-init playbook, its session-note fields, walkthrough, and docs, apart from individual skill install.
status: deprecated
source_issue: https://github.com/WolvenTech/wolven-harness/issues/30
source_prd: docs/prds/archived/lean-init/lean-init-prd.md
---

# Lean harness-init path for thin repos

**Source:** `docs/prds/archived/lean-init/lean-init-prd.md` (status `deprecated`, archived) — issue #30.
**Next:** After the Human approves → `code-execute` against the lean playbook already in the branch. The first pass was one mutate batch with no plan file; the PR 32 review fixes (R6) run from `docs/specs/archived/lean-init/lean-init-iteration-1-plan.md`.
**Named proof (this spec's own structural gate):** `proof-lean-init-spec-obligations`

## Term challenge

| Term | Resolution |
|------|------------|
| `harness-init` | Agent skill playbook under `templates/.agents/skills/harness-init/`, installed copy at `.agents/skills/harness-init/` — not a CLI command |
| lean path | The rules in the `harness-init` skill's `references/lean-path.md`, which `SKILL.md` loads only when lean applies: for a thin-evidence repo it captures the immediate goal (asking one question when the prompt stated none), defers exactly four named items, and never defers skill proposals |
| thin evidence | Judged from the tree alone, after the draft-note and re-run checks and before step 0: little or no application code and too little in the tree to support deep Q&A; a goal is not a precondition |
| deferral boundary | The four items: deep discovery Q&A beyond files (step 2 extras), optional web research (step 3), per-dimension score-gap keep/drop questions (part of step 6), and the validate-wiring question (part of step 6) |
| session note | Existing `harness-init` artifact at `docs/notes/harness-init-<yyyy-mm-dd>/`, rendered from `references/session-note-template.md` |

## Repository grounding

| Surface | Present today | Role for this initiative |
|---------|----------------|----------------------------|
| `templates/.agents/skills/harness-init/SKILL.md` | yes | Carries one fork line that loads `references/lean-path.md` when lean applies, and the two lean anti-patterns; steps 0–6 carry no lean wording |
| `templates/.agents/skills/harness-init/references/lean-path.md` | new | The only home of the lean rules: choosing lean, the goal question, the four-item boundary, the deferral prompt, proposals never deferred, and the must-run list |
| `templates/.agents/skills/harness-init/references/` (`discovery.md`, `harness-score.md`, `validate-wiring.md`) | yes | Full-path wording only, as on `main` |
| `templates/.agents/skills/harness-init/references/session-note-template.md` | yes | Carries the Mode and Immediate goal fields, the Deferred / skipped steps section, and the deferred wording for Validate wiring |
| `.agents/skills/harness-init/` | yes | Installed copy of the skill; must stay identical to the template copy |
| `docs/notes/lean-init-walkthrough/lean-init-walkthrough-note.md` | yes | Worked example of a lean run on an empty repo |
| `README.md`, `site/harness-init.md` | yes | Explain the lean flow to consumers |
| `test/skill-harness-init.test.ts`, `test/harness-init-note.test.ts`, `test/readme-install.test.ts` | yes | Proofs for the playbook, the note template, and the docs |
| `test/skill-copies.test.ts`, `test/helpers/markdown.ts` | new / yes | The copies-identical proof, and the shared section extractor the lean tests use |
| `pnpm test`, `pnpm harness:validate`, `pnpm harness:comments` | yes | Integrity gates |

## Surface walk

- **In scope:** `templates/.agents/skills/harness-init/**` and `.agents/skills/harness-init/**` (kept identical), `docs/notes/lean-init-walkthrough/lean-init-walkthrough-note.md`, the lean sentences in `README.md` and `site/harness-init.md`, the matching assertions in the three test files above, `test/skill-copies.test.ts`, and the section extractor in `test/helpers/markdown.ts`.
- **Out of mutate scope (unchanged):** `src/setup/**`; the public contract ADR and every other ADR; `site/skills.md` and `site/commands.md`; consumer `AGENTS.md` (never created or edited by `setup`); the skill-set membership lists; The Fool and The Jury lines already in `README.md`; and the archived combined PRD and spec. Cite these again from any `n/a` landing below.

## Requirements (obligation ↔ proof)

### R1 — Lean path rules

| ID | Obligation | Named proof | Evidence shape |
|----|------------|--------------|------------------|
| R1.1 | `references/lean-path.md` defers exactly four named items and nothing else | `proof-lean-init-boundary` | `pnpm test` — `test/skill-harness-init.test.ts`, "defers exactly four named items" |
| R1.2 | The lean path is chosen from the tree alone; it captures the immediate goal before presenting the deferral list, asks one question only when the prompt stated none, records the answer as given, and records "none stated" when there is none | `proof-lean-init-goal` | `pnpm test` — `test/skill-harness-init.test.ts`, "captures the immediate goal" |
| R1.3 | A declined deferral runs as on the full path | `proof-lean-init-decline` | `pnpm test` — `test/skill-harness-init.test.ts`, "a declined lean deferral runs on the full path" |
| R1.4 | The lean path lists the steps that must still run (0, 1 when needed, file-based 2, 4, 5, a score run that records the level, session note close) and keeps validate-wiring as one essential choice unless the Human agreed to defer it | `proof-lean-init-must-run` | `pnpm test` — `test/skill-harness-init.test.ts`, "lean path still lists the must-run steps" |

### R2 — Deferrals are named and recorded

| ID | Obligation | Named proof | Evidence shape |
|----|------------|--------------|------------------|
| R2.1 | Before proceeding with any lean deferral, the skill requires presenting each deferred step by number and name with why and remaining work, and waiting for the Human's yes | `proof-lean-init-deferral-named` | `pnpm test` — `test/skill-harness-init.test.ts`, "named before proceeding and recorded" |
| R2.2 | The session-note template carries the Mode and Immediate goal fields and a Deferred / skipped steps table with Step, Name, Reason, Remaining work columns, placed after Validate wiring | `proof-lean-init-note-fields` | `pnpm test` — `test/harness-init-note.test.ts`, section order and "the lean section carries the mode" |

### R3 — Proposals always run

| ID | Obligation | Named proof | Evidence shape |
|----|------------|--------------|------------------|
| R3.1 | Step 4 skill proposals are never deferred or listed as skippable on the lean path; they cite the recorded goal and available references or an explicit thin-evidence basis, and unsupported tool or architecture decisions stay open | `proof-lean-init-proposals-always` | `pnpm test` — `test/skill-harness-init.test.ts`, "skill proposals are never deferred" |

### R4 — Walkthrough and docs

| ID | Obligation | Named proof | Evidence shape |
|----|------------|--------------|------------------|
| R4.1 | The walkthrough at `docs/notes/lean-init-walkthrough/lean-init-walkthrough-note.md` shows, in order: goal captured, deferral list presented before proceeding, proposals made, and the session note recording the same choices | `proof-lean-init-walkthrough` | `pnpm test` — `test/skill-harness-init.test.ts`, "the lean walkthrough note shows the four beats in order" |
| R4.2 | `README.md` and `site/harness-init.md` explain the lean path in brief, say that skill proposals still run, and link to `references/lean-path.md` for the four deferrals instead of listing them; the `README.md` Fool and Jury lines stay | `proof-lean-init-docs` | `pnpm test` — `test/readme-install.test.ts`, "explain the lean path"; inspect `README.md` for the Fool and Jury lines |

### R5 — Copies stay identical

| ID | Obligation | Named proof | Evidence shape |
|----|------------|--------------|------------------|
| R5.1 | Every skill folder present in both `.agents/skills/` and `templates/.agents/skills/`, `harness-init` included, holds identical files | `proof-lean-init-copies-identical` | `pnpm test` — `test/skill-copies.test.ts` |

### R6 — Review fixes (PR 32)

| ID | Obligation | Named proof | Evidence shape |
|----|------------|--------------|------------------|
| R6.1 | The lean rules live only in `references/lean-path.md`, which `SKILL.md` loads only when lean applies; steps 0–6 of `SKILL.md` and `discovery.md`, `harness-score.md` and `validate-wiring.md` carry no lean wording; the four-item boundary table appears once in the skill | `proof-lean-init-fork-single-source` | `pnpm test` — `test/skill-harness-init.test.ts`, "lean rules live only in lean-path.md" |
| R6.2 | The lean decision runs after the draft-note check and the re-run skips: a `draft` note with a lean section resumes with its recorded mode, goal and deferrals and asks none of them again; when a `stable` harness-init note exists, lean does not apply and the full path's re-run skips run | `proof-lean-init-resume` | `pnpm test` — `test/skill-harness-init.test.ts`, "a resumed lean run reads its choices from the note" |
| R6.3 | A `HYG-03`, `HYG-04` or `HYG-06` failure is never deferred on the lean path: the run stops and shows the Human the finding, as on the full path | `proof-lean-init-credential-stop` | `pnpm test` — `test/skill-harness-init.test.ts`, "a leaked credential is never deferred" |
| R6.4 | The discovery-Q&A deferral applies when the tree is thin or empty; an empty context list is recorded as empty and does not block the deferral | `proof-lean-init-empty-repo` | `pnpm test` — `test/skill-harness-init.test.ts`, "the discovery deferral holds on an empty repo" |
| R6.5 | When the validate-wiring question is deferred, the note's **Validate wiring** section reads "deferred — see Deferred / skipped steps" | `proof-lean-init-wiring-deferred` | `pnpm test` — `test/harness-init-note.test.ts`, "a deferred wiring question points at the lean section" |

## Nine-dimension landings

| Dimension | Landing kind | Landing |
|-----------|---------------|---------|
| validation | obligation ↔ proof | R1.1 / `proof-lean-init-boundary` — the deferral boundary is pinned; `harness:validate` covers the new note and docs under `docs/` |
| failure modes | obligation ↔ proof | R1.3 / `proof-lean-init-decline` — a declined item falls back to the full path, so a refused deferral never leaves a step half-skipped; R6.3 / `proof-lean-init-credential-stop` — a leaked credential stops the run on either path |
| idempotency and retry | obligation ↔ proof | R6.2 / `proof-lean-init-resume` — a resumed lean run reads its mode, goal and deferrals from the `draft` note and asks none of them again; a finished init never re-enters lean |
| authorization | `n/a` | Unchanged surface: `src/cli.ts` and `setup` — this work changes agent playbook text and docs only, and no auth model exists |
| concurrency and ordering | obligation ↔ proof | R1.2 / `proof-lean-init-goal` — the goal is captured before the deferral list, and R4.1 pins the four beats in order |
| data lifecycle | obligation ↔ proof | R2.2 / `proof-lean-init-note-fields` — deferral choices persist in the session note, which turns `stable` at hand-back |
| external-dependency failure | `n/a` | Unchanged surface: step 3 of `SKILL.md` — web research stays Human-gated and already continues repo-only when the web is unavailable; the lean path adds no network dependency |
| state transitions | obligation ↔ proof | R1.4 / `proof-lean-init-must-run` — the session note closes `stable` at hand-back on the lean path |
| observability | obligation ↔ proof | R2.1 / `proof-lean-init-deferral-named` — each deferral is shown to the Human before the run proceeds and recorded in the note |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition |
|------------|-------------------|-------|-------------------|--------------|
| _(boundary)_ | — | — | — | The four-item deferral boundary is the settled boundary |
| `U-fork-shape` | Where the lean rules live | Human | Shaped R6.1 | Resolved 2026-10-02: `references/lean-path.md`, loaded only when lean applies |
| `U-lean-after-full` | What a lean request does after a finished init | Human | Shaped R6.2 | Resolved 2026-10-02: lean does not apply; the full path's re-run skips run |
| `U-mode-field` | New name for the note's `**Path:**` field | Human | Shaped R2.2 | Resolved 2026-10-02: `**Mode:**` |

## Out of scope

- Individual skill install (issue #31): `--skill`, `--list-skills`, and a config `skills` key.
- Any change under `src/setup/**`, any ADR change, and `site/skills.md` and `site/commands.md`.
- The Fool and The Jury skills (already on `main`).
- Removing skill sets, or making a finished full init re-run in lean mode.
- Auto-completing stubs or building score-gap checks during init.
- New runtime dependencies.

## Pragmatic-guard refuses

- A fifth deferrable item, or any lean deferral not named in the boundary.
- Deferring skill proposals on the lean path.
- Silently skipping a lean step without naming it, why, and remaining work before proceeding.
- A lean flag, a CLI verb, or any `src/` change when playbook text suffices.
- A lean-path plan file or a second lean spec: this spec is what the playbook is reviewed against. The one exception is `lean-init-iteration-1-plan.md`, which the Human asked for to order the PR 32 review fixes.

## Acceptance

- [x] `proof-lean-init-boundary` PASS (R1.1)
- [x] `proof-lean-init-goal` PASS (R1.2)
- [x] `proof-lean-init-decline` PASS (R1.3)
- [x] `proof-lean-init-must-run` PASS (R1.4)
- [x] `proof-lean-init-deferral-named` PASS (R2.1)
- [x] `proof-lean-init-note-fields` PASS (R2.2)
- [x] `proof-lean-init-proposals-always` PASS (R3.1)
- [x] `proof-lean-init-walkthrough` PASS (R4.1)
- [x] `proof-lean-init-docs` PASS (R4.2)
- [x] `proof-lean-init-copies-identical` PASS (R5.1)
- [x] `proof-lean-init-fork-single-source` PASS (R6.1)
- [x] `proof-lean-init-resume` PASS (R6.2)
- [x] `proof-lean-init-credential-stop` PASS (R6.3)
- [x] `proof-lean-init-empty-repo` PASS (R6.4)
- [x] `proof-lean-init-wiring-deferred` PASS (R6.5)

## Eval / gates

| Gate | Command / check | When | PASS | Abort |
|------|-------------------|------|------|-------|
| Tests | `pnpm test` | Before the implementation commit | exit 0 | Fix; do not proceed |
| Integrity | `pnpm harness:validate` | Before each commit | exit 0 | Fix; do not proceed |
| Comments | `pnpm harness:comments` | Before the implementation commit | exit 0 | Fix narration or tag violations |
| Copies | `diff -r .agents/skills/harness-init templates/.agents/skills/harness-init` | Before the implementation commit | no output | Sync the copies |
| Spec obligations | `proof-lean-init-spec-obligations` — obligation ↔ proof matrix; all nine landings; every `n/a` cites an unchanged surface | Before `code-execute` | all hold | Do not execute |

## Cross-domain leak table

| Leak | Refuse |
|------|--------|
| Installing one skill without its set | Issue #31, its own PRD and spec |
| Editing `setup` or the public contract for lean | Out of scope; the lean path is playbook text |
| Implementing The Fool or The Jury | Already on `main` |
| An executable plan from this skill | `code-plan` only |

## ADR

None needed this initiative. The lean path adds no durable architecture decision; it changes playbook text and docs, not the public contract.

---
type: spec
title: Plain-Language Questions for Harness Init
description: Freeze requirements and test proofs for plain-language interactive question guidance in harness-init.
status: stable
---

# Plain-Language Questions for Harness Init

**Source:** `docs/prds/harness-init-plain-language/harness-init-plain-language-prd.md` (status `stable`) — issue #48.
**Next:** After the Human approves → `code-plan` → `code-execute`.
**Named proof (this spec's own structural gate):** `proof-harness-init-plain-language-spec-obligations`

## Term challenge

| Term | Resolution |
|------|------------|
| `harness-init` | Guided initialization skill located at `.agents/skills/harness-init/` and `templates/.agents/skills/harness-init/` |
| `check IDs` | Formal identifiers from `harness-score` (e.g., `SKL-03`, `AGT-01`, `SNS-01`, `HYG-02`, `CI-01`) used as `.harness-score.json` rule keys |
| `plain-language question` | An interactive prompt that leads with missing capabilities and practical workflow impact, placing check IDs as secondary reference detail |
| `maturity level cap` | Ceiling imposed on the repo's maturity rating (L0–L4) when prerequisites for higher tiers are dropped (e.g., dropping CI caps maturity at L2) |

## Repository grounding

| Surface | Present today | Role for this initiative |
|---------|----------------|----------------------------|
| `templates/.agents/skills/harness-init/SKILL.md` | yes | Skill instructions; carries Hard gate rule 2 and step 6 plain-language scoring guidance |
| `templates/.agents/skills/harness-init/references/harness-score.md` | yes | Scoring reference; instructs leading with missing capability, placing check IDs after questions, explaining non-obvious failures, and stating drop costs |
| `templates/.agents/skills/harness-init/references/entry-modes.md` | yes | Entry mode reference; instructs explaining instruction impact for full/light/mention-only in plain language |
| `templates/.agents/skills/harness-init/references/adr-migration.md` | yes | ADR migration reference; instructs plain-language explanations of status choices and claim mismatches |
| `templates/.agents/skills/harness-init/references/validate-wiring.md` | yes | Validate wiring reference; instructs plain-language explanations of PR automation, script chaining, and manual runs |
| `.agents/skills/harness-init/**` | yes | Installed copy; must remain identical to template copy |
| `test/skill-harness-init.test.ts` | yes | Suite asserting skill gates, scoring rules, entry modes, and validate wiring |
| `test/harness-init-migration.test.ts` | yes | Suite asserting ADR migration status mapping rules |
| `test/skill-copies.test.ts` | yes | Proof asserting template and installed copies of `harness-init` are byte-for-byte identical |

## Surface walk

- **In scope:** `.agents/skills/harness-init/` and `templates/.agents/skills/harness-init/` (`SKILL.md`, `references/harness-score.md`, `references/entry-modes.md`, `references/adr-migration.md`, `references/validate-wiring.md`), `test/skill-harness-init.test.ts`, and `test/harness-init-migration.test.ts`.
- **Out of mutate scope (unchanged):** `src/**` (CLI implementation is unchanged); `harness-score` package binary; `site/**` public guide; and all other skills under `.agents/skills/`. Cite these again from any `n/a` landing below.

## Requirements (obligation ↔ proof)

### R1 — Skill Hard Gates and Step 6 Scoring

| ID | Obligation | Named proof | Evidence shape |
|----|------------|--------------|------------------|
| R1.1 | Hard gate rule 2 in `SKILL.md` mandates that questions are phrased in plain language describing repository capability and practice, with check IDs and acronyms as supporting detail | `proof-harness-init-plain-language-gates` | `pnpm test` — `test/skill-harness-init.test.ts`, "the four runtime gates are present under Hard gates" |
| R1.2 | Step 6 in `SKILL.md` requires asking dimension score questions in plain language, describing missing capabilities with check IDs as supporting references, and spelling out maturity caps | `proof-harness-init-plain-language-step6` | `pnpm test` — `test/skill-harness-init.test.ts`, "step 6 scores the harness" |
| R1.3 | `references/harness-score.md` mandates leading each dimension question with what the repo lacks in plain language, placing check IDs parenthetically or in reference notes | `proof-harness-init-plain-language-score-ref` | `pnpm test` — `test/skill-harness-init.test.ts`, "step 6 scores the harness" |
| R1.4 | `references/harness-score.md` requires explaining non-obvious failure causes (e.g., test script naming differences) rather than repeating raw rule descriptions | `proof-harness-init-plain-language-failure-causes` | `pnpm test` — `test/skill-harness-init.test.ts`, "step 6 scores the harness" |
| R1.5 | `references/harness-score.md` mandates spelling out what dropping a check or dimension costs in terms of maturity level caps before asking for confirmation | `proof-harness-init-plain-language-drop-costs` | `pnpm test` — `test/skill-harness-init.test.ts`, "step 6 scores the harness" |

### R2 — Entry Mode, ADR Migration, and Validate Wiring References

| ID | Obligation | Named proof | Evidence shape |
|----|------------|--------------|------------------|
| R2.1 | `references/entry-modes.md` requires phrasing the mode question in plain language explaining what each option does to instruction structure, presenting the recommended option first | `proof-harness-init-plain-language-entry-modes` | `pnpm test` — `test/skill-harness-init.test.ts`, "step 0 puts the entry mode to the Human as a question" |
| R2.2 | `references/adr-migration.md` requires phrasing status mapping and claim mismatch questions in plain language describing the architectural decision and caller impact, with ADR numbers as supporting references | `proof-harness-init-plain-language-adr-migration` | `pnpm test` — `test/harness-init-migration.test.ts`, "the status mapping table carries Accepted, Proposed, Superseded by" |
| R2.3 | `references/validate-wiring.md` requires asking in plain language how validation should run, explaining the workflow impact of PR automation, script chaining, and manual runs | `proof-harness-init-plain-language-validate-wiring` | `pnpm test` — `test/skill-harness-init.test.ts`, "asks how harness:validate is wired" |

### R3 — Exact Copy Parity and Gate Integrity

| ID | Obligation | Named proof | Evidence shape |
|----|------------|--------------|------------------|
| R3.1 | Installed and template copies of `harness-init` (`SKILL.md` and all references) remain byte-for-byte identical | `proof-lean-init-copies-identical` | `pnpm test` — `test/skill-copies.test.ts` |
| R3.2 | All documents adhere to the writing profile, pass claim checks, and contain 0 legacy warnings | `proof-harness-init-plain-language-validate` | `pnpm validate` |

## Nine-dimension landings

| Dimension | Landing kind | Landing |
|-----------|---------------|---------|
| validation | obligation ↔ proof | `proof-harness-init-plain-language-validate` (`pnpm validate` verifies writing profile and ADR claims) |
| failure modes | obligation ↔ proof | `proof-harness-init-plain-language-failure-causes` (`references/harness-score.md` explicitly addresses non-obvious failure explanations) |
| idempotency and retry | n/a | Unchanged surface (`src/**`); markdown files mutate statically upon authoring and re-run safely |
| authorization | n/a | Unchanged surface (`src/**`); prompt microcopy operates without authentication or elevated permissions |
| concurrency and ordering | n/a | Unchanged surface (`src/**`); interactive prompts are executed sequentially one question at a time |
| data lifecycle | n/a | Unchanged surface (`src/**`); skill files are version-controlled in git; run records persist in `docs/notes/` |
| external-dependency failure | n/a | Unchanged surface (`src/**`); prompt phrasing involves no external API or network calls |
| state transitions | obligation ↔ proof | `proof-harness-init-plain-language-drop-costs` (scoring prompts disclose maturity level transitions/caps before drop decisions are finalized) |
| observability | obligation ↔ proof | `proof-harness-init-plain-language-score-ref` (plain-language questions, answers, and reasons are captured in the session note) |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition |
|------------|-------------------|-------|-------------------|--------------|
| None | None | None | None | Resolved |

## Out of scope

- Modifying the `harness-score` binary or upstream scoring logic.
- Adding interactive prompts to other skills outside `harness-init`.
- Automatic script generation or code repair during the init wizard.

## Pragmatic-guard refuses

- Adding new CLI flags or configuration files to define question wording.
- Introducing a runtime acronym lookup dictionary or abbreviation mapping service.

## Acceptance

### Wave 1

- [x] Hard gate rule 2 and Step 6 scoring in `SKILL.md` mandate plain-language phrasing (`R1.1`, `R1.2`)
- [x] `references/harness-score.md` mandates leading with missing capabilities, placing check IDs after questions, explaining non-obvious failures, and stating drop costs (`R1.3`, `R1.4`, `R1.5`)
- [x] `references/entry-modes.md` mandates plain-language instruction impact explanations (`R2.1`)
- [x] `references/adr-migration.md` mandates plain-language status mapping and claim mismatch phrasing (`R2.2`)
- [x] `references/validate-wiring.md` mandates plain-language workflow impact explanations (`R2.3`)
- [x] Installed and template copies of `harness-init` are byte-for-byte identical (`R3.1`)
- [x] `pnpm validate` exits 0 with 0 legacy warnings (`R3.2`)

## Eval / gates

| Gate | Command / check | When | PASS | Abort |
|------|-------------------|------|------|-------|
| Integrity | `pnpm validate` | End of wave | exit 0 | Fix; do not proceed |
| Test suite | `pnpm test` | End of wave | 588 pass | Fix; do not proceed |
| Spec obligations | `proof-harness-init-plain-language-spec-obligations` — obligation ↔ proof matrix; all nine landings; every `n/a` cites an unchanged surface | Before `code-plan` | all hold | Do not plan |

## Cross-domain leak table

| Leak | Refuse |
|------|--------|
| An executable plan from this skill | `code-plan` only |
| Implementing CLI commands or scorers | Separate package or CLI initiative |

## ADR

None needed this initiative. This aligns prompt phrasing with existing standing conventions (one question at a time, plain language).

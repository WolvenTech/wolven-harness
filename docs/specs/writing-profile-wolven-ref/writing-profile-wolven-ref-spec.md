---
type: spec
title: WRITING-PROFILE architecture-claims text survives harness-init
description: Replace the dangling WOLVEN.md pointer in docs/WRITING-PROFILE.md with an inline restatement of the architecture-claims rule so full and light harness-init folds do not leave a broken reference.
status: stable
---

# WRITING-PROFILE architecture-claims text survives harness-init

**Source:** confirmed ask — GitHub issue #35: after full or light `harness-init`, `WOLVEN.md` is deleted but `docs/WRITING-PROFILE.md` still tells readers to see `WOLVEN.md`'s architecture-claims rule; fix by restating the rule without naming the transient entry file (preferred over repointing in harness-init step 0).
**Next:** After approval → `code-plan` → `code-execute` (single wave).
**Named proof (this spec's own structural gate):** `proof-writing-profile-wolven-ref-spec-obligations`

## Terms

- **architecture-claims rule** — tracked `ADR-NNN` / `adr-NNN-<slug>` references are claims checked fail-closed against `stable` profile ADRs under `docs/adrs/` ([docs/adrs/adr-001-claim-path.md](../../adrs/adr-001-claim-path.md), [AGENTS.md](../../../AGENTS.md) § Architecture claims).
- **WRITING-PROFILE** — `docs/WRITING-PROFILE.md` in a consumer repo; `setup` copies it from [templates/docs/WRITING-PROFILE.md](../../../templates/docs/WRITING-PROFILE.md).
- **harness-init step 0** — folds `WOLVEN.md` into `AGENTS.md` and deletes `WOLVEN.md` in full and light modes ([templates/.agents/skills/harness-init/references/entry-modes.md](../../../templates/.agents/skills/harness-init/references/entry-modes.md)).

Checked with `qmd query -c adrs "architecture claims"`. No new ADR is owed — this is documentation alignment, not a contract change.

## Repository grounding

| Surface | Present today | Role for this initiative |
| --- | --- | --- |
| [templates/docs/WRITING-PROFILE.md](../../../templates/docs/WRITING-PROFILE.md) | yes | Shipped template; line 47 cites `WOLVEN.md` |
| [docs/WRITING-PROFILE.md](../../WRITING-PROFILE.md) | yes | Package repo copy; same dangling cite |
| Light-mode block in [entry-modes.md](../../../templates/.agents/skills/harness-init/references/entry-modes.md) | yes | Already restates architecture claims without `WOLVEN.md` — wording model |
| `harness:validate` / [src/validate/](../../../src/validate/) | yes | Unchanged; does not lint cross-file doc pointers |
| [test/profile.test.ts](../../../test/profile.test.ts) | yes | Guards template profile shape; no `WOLVEN.md` ban yet |

## Surface walk

- **In scope:** [templates/docs/WRITING-PROFILE.md](../../../templates/docs/WRITING-PROFILE.md), [docs/WRITING-PROFILE.md](../../WRITING-PROFILE.md), [test/profile.test.ts](../../../test/profile.test.ts) (regression proof only).
- **Out of mutate scope (unchanged):** harness-init step 0 logic, `WOLVEN.md` template, validate spine rules, site docs, ADRs.

## Requirements (obligation ↔ proof)

### R1 — Template writing profile no longer names WOLVEN.md for claims

| ID | Obligation | Named proof | Evidence shape |
| --- | --- | --- | --- |
| R1.1 | The "Why this matters" section in the shipped template restates the architecture-claims rule in prose (aligned with the light-mode block) and does not tell readers to open `WOLVEN.md`. | `proof-writing-profile-wolven-ref-template-text` | Read [templates/docs/WRITING-PROFILE.md](../../../templates/docs/WRITING-PROFILE.md); `rg 'WOLVEN\.md' templates/docs/WRITING-PROFILE.md` is empty |
| R1.2 | The section still explains that validate resolves ADR references against `docs/adrs/` and that broken profile ADRs break dependent claims. | `proof-writing-profile-wolven-ref-template-meaning` | Same file mentions `wolven-harness validate`, `docs/adrs/`, and claim failure |

### R2 — Package repo copy stays aligned

| ID | Obligation | Named proof | Evidence shape |
| --- | --- | --- | --- |
| R2.1 | [docs/WRITING-PROFILE.md](../../WRITING-PROFILE.md) matches the template fix (no `WOLVEN.md` pointer; inline rule). | `proof-writing-profile-wolven-ref-package-copy` | `rg 'WOLVEN\.md' docs/WRITING-PROFILE.md` is empty; wording consistent with template |

### R3 — Regression guard

| ID | Obligation | Named proof | Evidence shape |
| --- | --- | --- | --- |
| R3.1 | A test fails if the template profile reintroduces a `WOLVEN.md` reference in the architecture-claims guidance. | `proof-writing-profile-wolven-ref-test` | `pnpm test` — new or extended case in [test/profile.test.ts](../../../test/profile.test.ts) |

## Nine-dimension landings

| Dimension | Landing kind | Landing |
| --- | --- | --- |
| validation | obligation ↔ proof | R3.1 / `proof-writing-profile-wolven-ref-test` plus `pnpm harness:validate` after doc edits |
| failure modes | n/a | Unchanged surface: validate still checks ADR claims, not doc cross-references ([src/validate/](../../../src/validate/)) |
| idempotency and retry | n/a | Unchanged surface: re-running `setup` overwrites missing paths only; profile text updates when template changes |
| authorization | n/a | Unchanged surface: CLI has no auth |
| concurrency and ordering | n/a | Unchanged surface: single-file doc edits |
| data lifecycle | n/a | Unchanged surface: no new persisted fields |
| external-dependency failure | n/a | Unchanged surface: no new network deps |
| state transitions | n/a | Unchanged surface: harness-init modes unchanged |
| observability | obligation ↔ proof | R1.1 / `proof-writing-profile-wolven-ref-template-text` — grep-based check is the observable guard |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition |
| --- | --- | --- | --- | --- |
| *(none)* | — | — | — | — |

## Out of scope

- Repointing `WRITING-PROFILE.md` inside harness-init step 0 when deleting `WOLVEN.md`.
- Adding validate rules for arbitrary markdown file references.
- Changing mention-only mode behavior or `WOLVEN.md` lifecycle.

## Pragmatic-guard refuses

- A new ADR for copy edits.
- Rewriting the full writing profile or site layout docs.
- Broad grep bans on `WOLVEN.md` across `templates/` (only the profile guidance changes).

## Acceptance

### Wave 1

- [x] Template and package `WRITING-PROFILE.md` files restate architecture claims without `WOLVEN.md` (R1, R2).
- [x] Profile test guards the template (R3).
- [x] `pnpm test`, `pnpm lint`, and `pnpm harness:validate` exit 0.

## Eval / gates

| Gate | Command / check | When | PASS | Abort |
| --- | --- | --- | --- | --- |
| Integrity | `pnpm harness:validate` | End of wave 1 | exit 0 | Fix before commit |
| Tests | `pnpm test` | End of wave 1 | exit 0 | Fix before commit |
| Lint | `pnpm lint` | End of wave 1 | exit 0 | Fix before commit |
| Spec obligations | `proof-writing-profile-wolven-ref-spec-obligations` | Before `code-plan` | all hold | Do not plan |

## Cross-domain leak table

| Leak | Refuse |
| --- | --- |
| harness-init step 0 repoint logic | Out of scope per issue |
| An executable plan from this skill | `code-plan` only |

## ADR

None needed — documentation-only alignment with existing ADR-001 and entry-mode wording.

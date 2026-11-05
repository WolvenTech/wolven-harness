---
type: spec
title: TLC workflow integration (C + R) for code skills
description: Keep the good practices brought from TLC — three concrete correctness fixes and a minimal CC-BY-4.0 NOTICE — and defer the review-ceremony upgrades to a deferral.
status: deprecated
---

# TLC workflow integration (C + R) for code skills

**Source:** the pragmatic-guard verdict on the full C+R scope (REFUSE) and the
Human's "trim 97": keep the good practices from TLC, lean out the skills, defer
the ceremony. The earlier draft scope is replaced by this lean scope.
**Next:** After the Human approves → `code-plan` → `code-execute`, wave 1.
**Named proof (this spec's own structural gate):** `proof-tlc-workflow-integration-spec-obligations`

## Requirements (obligation ↔ proof)

### R1 — Keep the good TLC practices

| ID | Obligation | Named proof | Evidence shape |
|----|------------|-------------|----------------|
| R1.1 | `code-execute` no longer overstates the final check as "proving the unit": the final check runs the checks and records their outputs | `proof-tlc-trim-final-check` | `pnpm test` |
| R1.2 | `code-execute` records author assertion inspection — each selected test's expected outcome, assertion, and the plausible wrong implementation it catches; an empty selection or a weak assertion is not a proof | `proof-tlc-trim-assertion-adequacy` | `pnpm test` |
| R1.3 | `code-spec` records binding-capture-vs-inspiration: a visual capture used as an implementation reference is binding unless labeled inspiration; an explicit departure needs Human approval in the spec | `proof-tlc-trim-capture-authority` | `pnpm test` |
| R1.4 | The four modified skills (`code-spec`, `code-plan`, `code-execute`, `code-review`) ship a minimal one-line `NOTICE` (Felipe Rodrigues / Tech Leads Club, CC-BY-4.0) in both `.agents/skills/` and `templates/.agents/skills/` | `proof-tlc-trim-notice` | `pnpm test` |

## Deferred (ceremony)

Risk-triggered independent review, revision-bound approval records, the review
ledger, the five-inline-nit cap, official-source research, capture/gesture
separation's independent-review half, and the degraded-assurance state are
deferred to `docs/deferrals/tlc-workflow-review-ceremony/`.

## Nine-dimension landings

| Dimension | Landing kind | Landing |
|-----------|---------------|---------|
| validation | obligation ↔ proof | R1.1–R1.4 each map to a `pnpm test` proof |
| failure modes | obligation ↔ proof | R1.2: a weak/empty assertion is refused instead of passing vacuously |
| idempotency and retry | n/a | unchanged workflow state |
| authorization | obligation ↔ proof | R1.3: explicit departures need Human approval |
| concurrency and ordering | n/a | unchanged wave stops and `Owns` |
| data lifecycle | n/a | no new state directory; deferral lives under `docs/deferrals/` |
| external-dependency failure | n/a | unchanged Node built-ins + existing deps only |
| state transitions | obligation ↔ proof | R1.4 `NOTICE` lands in both skill trees byte-identical |
| observability | obligation ↔ proof | R1.1 rewording makes the final check's actual claim visible |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition |
|------------|-------------------|-------|-------------------|--------------|
| — | — | — | — | — |

## Out of scope

- The full C+R ceremony (deferred).
- Any CLI/`src/**` change or new runtime dependency.

## Pragmatic-guard refuses

- Shipping the deferred ceremony now; adding a proof runner or `.mjs` gate scripts.

## Acceptance

### Wave 1

- [ ] R1.1 (`proof-tlc-trim-final-check`) PASS
- [ ] R1.2 (`proof-tlc-trim-assertion-adequacy`) PASS
- [ ] R1.3 (`proof-tlc-trim-capture-authority`) PASS
- [ ] R1.4 (`proof-tlc-trim-notice`) PASS

## Eval / gates

| Gate | Command / check | When | PASS | Abort |
|------|-------------------|------|------|-------|
| Integrity | `pnpm build && pnpm validate` | End of wave 1 | exit 0 | Fix; do not proceed |
| Test suite | `pnpm test` | End of wave 1 | all pass | Fix; do not proceed |
| Linter | `pnpm lint` | End of wave 1 | exit 0 | Fix; do not proceed |
| Comments | `pnpm comments` | End of wave 1 | exit 0 | Fix; do not proceed |
| Spec obligations | `proof-tlc-workflow-integration-spec-obligations` — R1.1–R1.4 each map to a proof | Before `code-plan` | all hold | Do not plan |

## Cross-domain leak table

| Leak | Refuse |
|------|--------|
| Implementing the deferred ceremony | deferral doc |
| An executable plan from this skill | `code-plan` only |

## ADR

None this iteration.

## Section checklist

| Section | Required when | Status |
|---------|-----------------|--------|
| Source | Always | Present |
| Requirements with obligation ↔ proof | Always | Present (R1.1–R1.4) |
| Nine-dimension landings | Always | Present (all nine named) |
| Unresolved | Always | Present (empty) |
| Out of scope | Always | Present |
| Pragmatic-guard refuses | Always | Present |
| Acceptance | Always | Present |
| Eval / gates | Always | Present |
| Cross-domain leak table | Always | Present |
| ADR | Always | Present (none) |

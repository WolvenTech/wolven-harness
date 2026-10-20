# Worked example — spec shapes

A specimen, not a live spec: a scheduled job batches a user's unread
notifications into one digest email per run.

## Repository grounding (excerpt)

| Surface | Present today | Role |
|---------|----------------|------|
| `src/jobs/digest/` | no | New — the digest job (this spec) |
| `src/notify/email/` | yes | Reused — the existing email sender |
| `harness:validate` | yes | Integrity gate reused |

## Surface walk (excerpt)

- **In scope:** `src/jobs/digest/**`, the digest template under
  `src/notify/email/templates/`
- **Out of mutate scope:** the existing per-event email path, unchanged

## Obligation ↔ proof

| ID | Obligation | Named proof | Evidence shape |
|----|------------|--------------|------------------|
| R1.1 | The digest job batches every unread notification since the last digest into one email, in chronological order | `proof-digest-job-batch` | Run it against a fixture inbox; check output order |
| R1.2 | A user with zero unread notifications receives no digest email that run | `proof-digest-empty-skip` | A zero-unread fixture produces no send |

Acceptance boxes:

```markdown
- [ ] `proof-digest-job-batch` PASS — digest batches unread notifications in order
- [ ] `proof-digest-empty-skip` PASS — a user with nothing unread gets no email
```

## Nine-dimension landings (mixed)

| Dimension | Landing kind | Landing |
|-----------|---------------|---------|
| validation | obligation ↔ proof | R1.3 / `proof-digest-drop-undated` — an undated notification is dropped, not sent blank |
| idempotency and retry | Unresolved | See `U-example-retry` |
| authorization | `n/a` | Unchanged surface: the digest job sends under the existing service account already used by `src/notify/email/**` |
| concurrency and ordering | `n/a` | Unchanged surface: the existing per-user job lock in `src/jobs/**` already prevents two digests from running for the same user at once — reused as-is |
| observability | `n/a` | Unchanged surface: the existing job-queue logging in `src/jobs/**` already emits state transitions; this initiative adds no new log surface |

## Unresolved (minimum form)

| Identifier | Decision needed | Owner | Blocking effect | Disposition |
|------------|-------------------|-------|-------------------|--------------|
| `U-example-retry` | Fixed interval vs. exponential backoff for a failed digest send | Human | Blocks wave 1 acceptance until resolved | *(empty until the Human decides — do not invent)* |

## Waves (excerpt)

```mermaid
flowchart TD
  A[Wave 1: digest job core + retry disposition] --> G1{harness:validate PASS}
  G1 -->|abort| X[Stop — fix before continuing]
  G1 -->|pass| B[Wave 2: digest email template]
```

## Eval / gates excerpt

| Gate | Command / check | When | PASS | Abort |
|------|-------------------|------|------|-------|
| Integrity | `harness:validate` | End of each wave | exit 0 | Fix before continuing |
| Spec obligations | `proof-digest-spec-obligations` | Before `code-plan` | matrix + nine landings + `n/a` cites | Do not plan |

## Cross-domain leak excerpt

| Leak | Refuse |
|------|--------|
| An executable plan from this skill | Handoff to `code-plan` only |

## Term challenge

| Term | Resolution |
|------|--------------|
| "Digest" | One batched email per user per run — not a per-event notification |

## ADR note (as it would appear inside a frozen spec)

This is **not** an ADR file; the spec's own section reads:

```markdown
## ADR

- **Offer?** Only when the digest job adds queue or scheduling wiring.
- **Skip:** A template-only or copy-only change.
- **Read first:** Prior ADRs under `docs/adrs/` before proposing
  `adr-NNN-<slug>.md`.
```

For numbering and supersession, see `adr`.

---
type: spec
title: Harness uninstall — iteration 1
description: Delta obligations that close the Cursor review of the harness-uninstall pull request: skill-identity checks, shared-file boundaries, ask-only packaging, and post-uninstall idempotency.
status: stable
---

# Harness uninstall — iteration 1

**Source:** the Cursor review of
[WolvenTech/wolven-harness#96](https://github.com/WolvenTech/wolven-harness/pull/96)
(five blocking findings) and the Human's "run spec/plan before fixing". This
spec holds delta obligations only; `harness-uninstall-spec.md` stays the base
contract except for the rows named under **Base rows this iteration changes**.
**Next:** After the Human approves → `harness-uninstall-iteration-1-plan.md` →
`code-execute`, wave 1.
**Named proof (this spec's own structural gate):**
`proof-uninstall-iter1-spec-obligations`

## Findings

| ID | Finding | Where | Obligation |
|----|---------|-------|------------|
| B1 | `harness-remove` ships without `disable-model-invocation: true`, and `ask-only.test.ts` returns before asserting it | `.agents/skills/harness-remove/SKILL.md`, `templates/.agents/skills/harness-remove/SKILL.md`, `test/ask-only.test.ts:54` | I1.1 |
| B2 | Global/standalone skills are matched by folder name only, so a third-party skill with a colliding name is deleted | `src/uninstall/discover.ts:496,586` | I1.2 |
| B3 | A `link`-kind rule path (`.claude/rules`) is slated for deletion even when it is a real directory | `src/uninstall/discover.ts:109` | I1.3 |
| B4 | A `.wolven-harness` holding only preserved `docs/` is still detected as an install, so a re-run prompts again | `src/uninstall/discover.ts:181,218` | I1.4 |
| B5 | Hook configs (`.claude/settings.json`, `.cursor/hooks.json`) with user content are deleted whole instead of being left for `harness-remove` | `src/uninstall/discover.ts:276-284,349-357` | I1.5 |

## Requirements (delta obligations)

### I1 — Review fixes

| ID | Obligation | Named proof | Evidence shape |
|----|------------|--------------|------------------|
| I1.1 | `harness-remove` ships `disable-model-invocation: true` and `agents/openai.yaml` with `allow_implicit_invocation: false`; `test/ask-only.test.ts` asserts it with no special case | `proof-uninstall-iter1-ask-only` | `pnpm test` |
| I1.2 | Global/standalone skill discovery confirms a skill is this package's copy (frontmatter `name` + `description` equal the template) before slating it for deletion; a colliding-name third-party skill is not discovered | `proof-uninstall-iter1-third-party-skill` | `pnpm test` |
| I1.3 | A `link`-kind rule path is an artifact only when it is a symlink into `.agents/`; a real directory is left untouched | `proof-uninstall-iter1-real-rules-dir` | `pnpm test` |
| I1.4 | A `.wolven-harness` holding only `docs/` is not an active install; re-running uninstall finds nothing and exits 0 | `proof-uninstall-iter1-idempotent` | `pnpm test` |
| I1.5 | Hook config files carrying harness references are reported as intertwined, never deleted | `proof-uninstall-iter1-hook-configs` | `pnpm test` |

## Base rows this iteration changes

- `R1.4` / `R3.5`: global/standalone skill removal gains the identity check (I1.2).
- `R3.6`: the deterministic CLI leaves a real rules directory (I1.3) and hook configs (I1.5) untouched.
- `R4.3`: `harness-remove` ships `disable-model-invocation: true` + `agents/openai.yaml` (I1.1).
- `R2.3`: idempotency now covers a docs-only `.wolven-harness` (I1.4).

## Nine-dimension landings

| Dimension | Landing kind | Landing |
|-----------|---------------|---------|
| validation | obligation ↔ proof | I1.1–I1.5 each map to a `pnpm test` proof |
| failure modes | obligation ↔ proof | A third-party skill, a real rules dir, and a docs-only home all fall through to the untouched path without error |
| idempotency and retry | obligation ↔ proof | I1.4: a re-run after docs are preserved finds nothing |
| authorization | n/a | unchanged `src/uninstall/remove.ts` permission model |
| concurrency and ordering | n/a | unchanged: discovery completes before confirmation |
| data lifecycle | obligation ↔ proof | I1.3 / I1.5: user-owned files are never deleted |
| external-dependency failure | n/a | unchanged: Node built-ins only |
| state transitions | obligation ↔ proof | I1.4: a docs-only home is not an installed state |
| observability | obligation ↔ proof | I1.5: hook configs appear in the remaining-intertwined report |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition |
|------------|-------------------|-------|-------------------|--------------|
| — | — | — | — | — |

## Out of scope

- Unchanged from `harness-uninstall-spec.md` (docs preservation, no git history edits, no global binary removal).

## Pragmatic-guard refuses

- No new abstractions or dependencies: each fix tightens an existing check.

## Acceptance

### Wave 1

- [x] I1.1: `harness-remove` is ask-only in both mirrors and the test asserts it (`proof-uninstall-iter1-ask-only`).
- [x] I1.2: a colliding-name third-party skill is not deleted (`proof-uninstall-iter1-third-party-skill`).
- [x] I1.3: a real `.claude/rules` directory survives (`proof-uninstall-iter1-real-rules-dir`).
- [x] I1.4: a re-run after quiet-docs preservation finds nothing (`proof-uninstall-iter1-idempotent`).
- [x] I1.5: hook configs with user content are left and reported (`proof-uninstall-iter1-hook-configs`).

## Eval / gates

| Gate | Command / check | When | PASS | Abort |
|------|-------------------|------|------|-------|
| Integrity | `pnpm build && pnpm validate` | End of wave 1 | exit 0 | Fix; do not proceed |
| Test suite | `pnpm test` | End of wave 1 | all pass | Fix; do not proceed |
| Linter | `pnpm lint` | End of wave 1 | exit 0 | Fix; do not proceed |
| Known forms | `pnpm gen:known-forms` after skill-file edits, then re-run the test gate | End of wave 1 | exit 0 | Fix; do not proceed |
| Spec obligations | `proof-uninstall-iter1-spec-obligations` — I1.1–I1.5 each map to a proof | Before `code-plan` | all hold | Do not plan |

## Cross-domain leak table

| Leak | Refuse |
|------|--------|
| Changing `src/setup/**` to alter hook-config generation | `setup` is create-only; the fix lives in `src/uninstall/**` |
| An executable plan from this skill | `code-plan` only |

## ADR

None needed this iteration.

## Section checklist

| Section | Required when | Status |
|---------|-----------------|--------|
| Source | Always | Present |
| Findings | Iteration | Present |
| Requirements with obligation ↔ proof | Always | Present (I1.1–I1.5) |
| Nine-dimension landings | Always | Present (all nine named) |
| Unresolved | Always | Present (empty) |
| Out of scope | Always | Present |
| Pragmatic-guard refuses | Always | Present |
| Acceptance | Always | Present |
| Eval / gates | Always | Present |
| Cross-domain leak table | Always | Present |
| ADR | Always | Present (none) |

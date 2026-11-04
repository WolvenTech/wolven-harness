---
type: spec
title: Harness uninstall — iteration 1 plan
description: Work units that close the Cursor review of the harness-uninstall PR in one wave: five fixes, their proofs, and a closing gate.
status: stable
---

# Harness uninstall — iteration 1 plan

**Spec:** `docs/specs/harness-uninstall/harness-uninstall-iteration-1-spec.md`.

## Structural gate

Every I row in the spec names one proof and has one acceptance box: 5 rows
(I1.1–I1.5) against 5 boxes. All nine dimension landings are present; the three
`n/a` rows cite the unchanged `remove.ts` permission model, the
discovery-before-confirmation ordering, and Node-built-ins-only.

## How this runs

- One session runs all units `inline` (the fixes are small and already drafted).
- **Skill mirrors:** every edit under `templates/.agents/skills/` is mirrored
  into `.agents/skills/` in the same unit (the ask-only test reads the templates mirror).
- **Known forms:** `known-forms.json` is regenerated at the wave gate with
  `pnpm gen:known-forms`.
- **Commit cadence:** one commit at the wave gate via `code-commit`; nothing is
  pushed until the Human asks.

## Work units

| # | Unit | Depends | Owns | Done when |
|---|------|---------|------|-----------|
| 01 | Ask-only packaging | — | `.agents/skills/harness-remove/SKILL.md`, `templates/.agents/skills/harness-remove/SKILL.md`, both `agents/openai.yaml`, `test/ask-only.test.ts` | [x] `harness-remove` ships `disable-model-invocation: true` + `agents/openai.yaml`; `test/ask-only.test.ts` asserts both with no special case: `proof-uninstall-iter1-ask-only` |
| 02 | Skill identity check | — | `src/uninstall/discover.ts`, `test/uninstall-discover.test.ts` | [x] A colliding-name third-party skill is not discovered/deleted: `proof-uninstall-iter1-third-party-skill` |
| 03 | Real rules dir | — | `src/uninstall/discover.ts`, `test/uninstall-remove.test.ts` | [x] A real `.claude/rules` directory survives removal: `proof-uninstall-iter1-real-rules-dir` |
| 04 | Docs-only home idempotency | — | `src/uninstall/discover.ts`, `test/uninstall-remove.test.ts` | [x] A re-run after quiet-docs preservation finds nothing and exits 0: `proof-uninstall-iter1-idempotent` |
| 05 | Hook-config boundary | — | `src/uninstall/discover.ts`, `test/uninstall-remove.test.ts` | [x] Hook configs with user content are reported as intertwined, never deleted: `proof-uninstall-iter1-hook-configs` |
| 06 | Wave 1 gate | 01–05 | `known-forms.json`, spec boxes, plan marks | [x] `pnpm gen:known-forms` run; `pnpm build && pnpm test && pnpm lint && pnpm validate` exit 0; diffs read; wave committed |

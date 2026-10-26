---
type: spec
title: Secret-path guard (issue 80 slice) — plan
description: Work-unit plan for the standing secrets rule, built-in path guard hook, and Cursor/Claude setup wiring.
status: stable
---

# Secret-path guard (issue 80 slice) — plan

**Spec:** `docs/specs/secret-path-guard/secret-path-guard-spec.md` (status `stable`)

## Structural gate

Confirmed: obligations R1.1–R5.1 each map to a named proof (`proof-secret-path-guard-secrets-rule` through `proof-secret-path-guard-gates-pass`, including `proof-secret-path-guard-manual-wiring-docs` for R4.5). No gaps.

## Work units

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 01 | Ship `secrets.md` standing rule (template + harness home) | — | `templates/.agents/rules/secrets.md`, `.agents/rules/secrets.md` | `inline` | [x] `secrets.md` has `alwaysApply: true`, forbids reading/printing secret-shaped paths, and tells agents to ask the Human when access is truly needed; template and `.agents/rules/secrets.md` match (`proof-secret-path-guard-secrets-rule`) |
| 02 | Ship pattern module, hook entrypoint, and hook README stub | 01 | `templates/.agents/hooks/secret-paths.mjs`, `templates/.agents/hooks/secret-path-guard.mjs`, `templates/.agents/hooks/README.md`, `test/secret-path-guard.test.ts` | `spawn` | [x] #80 path list and shell forms classify correctly; `.env.example` allowed; hook denies `.pem` read and `cat` on `id_rsa`, allows `.env.example`, never asks; Node built-ins only (`proof-secret-path-guard-pattern-list`, `proof-secret-path-guard-env-example-allow`, `proof-secret-path-guard-shell-forms`, `proof-secret-path-guard-no-runtime-dep`, `proof-secret-path-guard-deny-read-pem`, `proof-secret-path-guard-deny-shell-cat`, `proof-secret-path-guard-allow-env-example`, `proof-secret-path-guard-no-ask-hook`) |
| 03 | **Wave 1 gate** | 02 | — | `inline` | [x] `pnpm build && pnpm test && pnpm lint && node dist/cli.js validate` exit 0; Wave 1 acceptance boxes in the spec verifiable — **abort before Wave 2** on failure |
| 04 | Wire Cursor and Claude hook config from `setup` when paths are missing | 03 | `src/setup/runtimes.ts`, `test/setup-runtimes.test.ts` (or new hook-wiring test) | `spawn` | [ ] Fresh repo with `--runtimes cursor` gets `.cursor/hooks.json` pointing at `.agents/hooks/secret-path-guard.mjs`; with `--runtimes claude` gets `.claude/settings.json` with `PreToolUse`; `--runtimes codex` alone writes neither; pre-existing hook JSON is skipped, not merged (`proof-secret-path-guard-cursor-wiring`, `proof-secret-path-guard-claude-wiring`, `proof-secret-path-guard-no-hook-for-inline-only`) |
| 05 | Align setup inventory, seed extract, and manual wiring docs | 04 | `test/setup-surfaces.test.ts`, `test/seed-extract.test.ts`, `templates/.agents/hooks/README.md` | `inline` | [ ] Full `setup` creates guard template paths; `WOLVEN.md` / inline rules surface lists `secrets.md` with Codex; README documents manual Cursor/Claude wiring when hook config was skipped (`proof-secret-path-guard-setup-templates`, `proof-secret-path-guard-inline-rules-list`, `proof-secret-path-guard-manual-wiring-docs`) |
| 06 | **Wave 2 / ship gate** | 05 | `docs/specs/secret-path-guard/secret-path-guard-spec.md` (acceptance boxes) | `inline` | [ ] `pnpm build && pnpm test && pnpm lint && node dist/cli.js validate` exit 0; Wave 2 acceptance boxes ticked when evidence exists (`proof-secret-path-guard-gates-pass`) |

## Wave stops

| Stop | After | Gate |
|------|-------|------|
| **1** | Unit 03 | `pnpm build && pnpm test && pnpm lint && node dist/cli.js validate` PASS — **abort before Wave 2** |
| **Ship** | Unit 06 | Same gate PASS; spec acceptance complete — hand off to `code-execute` closeout / commit cadence |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
|---|---|---|---|---|---|
| `U-pre-commit-scan` | Pre-commit secret scan: built-in `secret-paths.mjs` vs scanner dependency | Rafael | Non-blocking | Defer per PRD non-goals and pragmatic-guard note. Revisit on commit-side incident or follow-up spec. | — |
| `U-hook-config-merge` | Merge vs skip when hook JSON already exists | Rafael | Non-blocking (settled 2026-10-26) | **Settled:** skip existing `.cursor/hooks.json` / `.claude/settings.json`; manual wiring in hooks README (R4.5). | 05 |
| `U-native-hook-follow-up` | Wire guard on remaining runtimes | Rafael | Non-blocking | Follow-up after slice 1; rule-only acceptable now. | — |

## Frontier order

**Wave 1:** 01 → 02 → **03 STOP**

**Wave 2:** 04 → 05 → **06 STOP**

Unit 02 depends on 01 so the deny message can cite the standing rule file that exists in templates. Units 04 and 05 are sequential because inventory tests assume wiring behavior from 04.

## Execution / resume section

### Unit 01 — Ship `secrets.md` standing rule

| Field | Value |
|-------|-------|
| Unit identifier | 01 — Ship `secrets.md` standing rule (Wave 1, frontier 1 of 3) |
| Spec/plan paths | `docs/specs/secret-path-guard/secret-path-guard-spec.md` / `docs/specs/secret-path-guard/secret-path-guard-plan.md` |
| Obligation / proof status | R1.1 `proof-secret-path-guard-secrets-rule` — done |
| `HEAD` commit | `b99d1ba` |
| `git status` summary | dirty — this plan file only (status flip and this section) |
| Intended diff scope | `templates/.agents/rules/secrets.md`, `.agents/rules/secrets.md` |
| Decision on every discrepancy | `b99d1ba` sits outside every unit: it turns off commit signing in test fixture repos so the suite runs in seconds — resolved, kept as its own commit |

### Unit 02 — Pattern module, hook entrypoint, hook README stub

| Field | Value |
|-------|-------|
| Unit identifier | 02 — Pattern module, hook entrypoint, hook README stub (Wave 1, frontier 2 of 3) |
| Spec/plan paths | `docs/specs/secret-path-guard/secret-path-guard-spec.md` / `docs/specs/secret-path-guard/secret-path-guard-plan.md` |
| Obligation / proof status | R2.1–R2.4, R3.1–R3.4 — done (`test/secret-path-guard.test.ts`, 10 tests) |
| `HEAD` commit | `b99d1ba` |
| `git status` summary | dirty — this plan file and unit 01's two `secrets.md` copies, uncommitted until the Wave 1 gate |
| Intended diff scope | `templates/.agents/hooks/secret-paths.mjs`, `templates/.agents/hooks/secret-path-guard.mjs`, `templates/.agents/hooks/README.md`, `test/secret-path-guard.test.ts` |
| Decision on every discrepancy | `test/seed-extract.test.ts` (unit 05) refuses `.json` and hook event names in the hooks README — resolved: unit 02's README stub names the two scripts only, and unit 05 adds the wiring steps with that test |

### Unit 03 — Wave 1 gate

| Field | Value |
|-------|-------|
| Unit identifier | 03 — Wave 1 gate (Wave 1, frontier 3 of 3) |
| Spec/plan paths | `docs/specs/secret-path-guard/secret-path-guard-spec.md` / `docs/specs/secret-path-guard/secret-path-guard-plan.md` |
| Obligation / proof status | Wave 1 gate — done: build, test (1033 pass), lint, validate and comments exit 0 |
| `HEAD` commit | `b99d1ba` |
| `git status` summary | dirty — units 01 and 02 Owns, this plan, and the gate fixes in the next row |
| Intended diff scope | units 01 and 02 Owns, plus the gate fixes |
| Decision on every discrepancy | Six tests pin the template inventory, so the new templates failed them, and no Wave 1 unit owns them — resolved inside this gate: the `test/setup-surfaces.test.ts` path list, the `test/setup-skill-sets.test.ts` rule count, a regenerated `known-forms.json`, the repo's own `.cursor/rules/wolven-secrets.mdc`, and the `secrets.md` line in `templates/WOLVEN.md` (R1.2's surface, moved up from unit 05). `test/rules-frontmatter.test.ts` adds `secrets.md` to its rule list as R1.1's automated proof |

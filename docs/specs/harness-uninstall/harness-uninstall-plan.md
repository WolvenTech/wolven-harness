---
type: spec
title: Harness uninstall and agentic removal — plan
description: Work-unit index and wave stops for implementing the wolven-harness uninstall CLI command and harness-remove skill across old and new application landscapes.
status: draft
---

# Harness uninstall and agentic removal — plan

**Spec:** `docs/specs/harness-uninstall/harness-uninstall-spec.md` (status `stable`)
**Next:** After approval → `code-execute` starting at unit 01

## Execution / resume section

### Unit 07 — Wave 2 Stop Gate

| Field | Value |
|-------|-------|
| Unit identifier | 07 — Wave 2 Stop Gate |
| Spec/plan paths | `docs/specs/harness-uninstall/harness-uninstall-spec.md` / `docs/specs/harness-uninstall/harness-uninstall-plan.md` |
| Obligation / proof status | R2.1–R2.4 & R3.1–R3.6 (`proof-uninstall-cli-*`, `proof-uninstall-remove-*`, `proof-uninstall-preserve-*`) — done (all passed) |
| `HEAD` commit | `2dae7a2` |
| `git status` summary | dirty — Wave 2 work (`src/uninstall/remove.ts`, `src/uninstall/index.ts`, `src/cli.ts`, `test/uninstall-remove.test.ts`) proven and ready to commit |
| Intended diff scope | `src/cli.ts`, `src/uninstall/remove.ts`, `src/uninstall/index.ts`, `test/uninstall-remove.test.ts`, plan marks |
| Decision on every discrepancy | none |

## Structural gate

Every obligation in `docs/specs/harness-uninstall/harness-uninstall-spec.md` maps directly to a named proof and verification test:
- R1.1–R1.5: `proof-uninstall-discover-*` → Units 01, 02
- R2.1–R2.4: `proof-uninstall-cli-*` → Units 05, 06
- R3.1–R3.6: `proof-uninstall-remove-*`, `proof-uninstall-preserve-*`, `proof-uninstall-leave-*` → Units 04, 06
- R4.1–R4.4: `proof-uninstall-handoff-*`, `proof-harness-remove-*` → Units 08, 09, 10
Integrity check `pnpm build && pnpm test && pnpm lint && pnpm validate` anchors every wave stop.

## Work units

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 01 | Landscape discovery module (old and new layouts) | — | `src/uninstall/types.ts`, `src/uninstall/discover.ts` | `spawn` | [x] `discoverLandscape(root, env)` scans local landscape for quiet installs (`.wolven-harness/`, `layout: "linked"`, bootstrap symlinks), old/full installs (`layout: "home"`, root `.agents/`, `.qmd/`, `WOLVEN.md`, runtime config stubs), linked homes, and standalone global skills; satisfies `proof-uninstall-discover-new-landscape`, `proof-uninstall-discover-old-landscape`, `proof-uninstall-discover-linked-landscape`, `proof-uninstall-discover-global-skills`, and `proof-uninstall-discover-empty`. |
| 02 | Landscape discovery test suite | 01 | `test/uninstall-discover.test.ts` | `spawn` | [x] Unit test suite asserts discovery of new quiet installs, old full installs, linked homes, and global skills fixtures, and returns empty for clean dirs; `pnpm test test/uninstall-discover.test.ts` passes. |
| 03 | **Wave 1 Stop Gate** | 01, 02 | — | `inline` | [x] Wave 1 gate: `pnpm build && pnpm test && pnpm lint && pnpm validate` exits 0. |
| 04 | Deterministic removal engine & docs preservation | 03 | `src/uninstall/remove.ts` | `spawn` | [x] `removeHarnessInstall(install, options)` unlinks/removes deterministic harness-owned files and symlinks across new and old landscapes; strictly preserves all `docs/` directories byte-identical; leaves intertwined shared files intact; satisfies `proof-uninstall-remove-new-landscape`, `proof-uninstall-preserve-quiet-docs`, `proof-uninstall-remove-old-landscape`, `proof-uninstall-preserve-root-docs`, `proof-uninstall-remove-global-skills`, and `proof-uninstall-leave-intertwined-files`. |
| 05 | CLI `uninstall` command routing & confirmation prompt | 04 | `src/cli.ts`, `src/uninstall/index.ts` | `spawn` | [x] `wolven-harness uninstall` registered in CLI; parses `--dir`, `--yes`, `--verbose`, `--debug`; lists discovered manifest before deletion; aborts cleanly with 0 changes on decline or no installs found; executes removal on confirmation; satisfies `proof-uninstall-cli-args`, `proof-uninstall-cli-dry-list`, `proof-uninstall-cli-noop-exit0`, and `proof-uninstall-cli-cancel-abort`. |
| 06 | Removal engine & CLI test suite | 04, 05 | `test/uninstall-remove.test.ts` | `spawn` | [x] Tests verify dry listing, confirmation abort, deterministic deletion across old and new fixtures, strict preservation of root and quiet `docs/`, and unmutated shared files; `pnpm test test/uninstall-remove.test.ts` passes. |
| 07 | **Wave 2 Stop Gate** | 04, 05, 06 | — | `inline` | [x] Wave 2 gate: `pnpm build && pnpm test && pnpm lint && pnpm validate` exits 0. |
| 08 | `harness-remove` skill template & repo mirror | 07 | `templates/.agents/skills/harness-remove/SKILL.md`, `.agents/skills/harness-remove/SKILL.md` | `spawn` | [ ] `harness-remove/SKILL.md` shipped in `templates/` and mirrored in `.agents/skills/`; defines ask-only human-supervised inspection and cleanup of intertwined edits (`package.json`, `AGENTS.md`, `.gitignore`, CI workflows) while keeping `docs/` intact, and self-deletes its skill folder at the end; satisfies `proof-harness-remove-template-frontmatter` and `proof-harness-remove-skill-instructions`. |
| 09 | Skill installation handoff in CLI | 08 | `src/uninstall/skill-handoff.ts`, `src/uninstall/index.ts` | `spawn` | [ ] After removal, CLI offers `harness-remove` install; on acceptance, prompts for runtime and installs skill into runtime load path with invocation command; on decline, exits 0 cleanly; satisfies `proof-uninstall-handoff-install-skill` and `proof-uninstall-handoff-decline`. |
| 10 | End-to-end uninstall & skill handoff test suite | 08, 09 | `test/harness-remove-skill.test.ts`, `test/setup-surfaces.test.ts` | `spawn` | [ ] Tests verify `harness-remove` template presence, CLI skill prompt and installation into mock runtimes, refusal to touch `docs/`, and full uninstall flow; `pnpm test` passes. |
| 11 | **Wave 3 Final Ship Gate** | 08, 09, 10 | — | `inline` | [ ] Wave 3 final closeout: `pnpm build && pnpm test && pnpm lint && pnpm validate` all pass; `proof-harness-uninstall-spec-obligations` structural check holds. |

## Wave stops

| Stop | After | Gate |
|------|-------|------|
| **Wave 1** | Unit 02 | Discovery logic & tests pass; `pnpm build && pnpm test && pnpm lint && pnpm validate` PASS — abort before Wave 2 |
| **Wave 2** | Unit 06 | Safe removal engine, CLI command, and docs preservation tests pass; `pnpm build && pnpm test && pnpm lint && pnpm validate` PASS — abort before Wave 3 |
| **Wave 3 (Ship)** | Unit 10 | `harness-remove` template, runtime handoff, and full test suite pass; `pnpm build && pnpm test && pnpm lint && pnpm validate` PASS |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
|---|---|---|---|---|---|
| `U-boundary-split` | Boundary between deterministic CLI vs `harness-remove` on shared files | Rafael | Blocks Wave 2 | Settled: CLI deletes unambiguous harness files only; intertwined shared files handled by `harness-remove`. | 04, 05 |
| `U-quiet-docs-location` | In quiet install uninstall, whether `.wolven-harness/docs/` remains in `.wolven-harness/` or moves to `<repo>/docs/` | Rafael | Non-blocking | Default: leave intact at current path (`.wolven-harness/docs/`) to guarantee byte-identical preservation without moving files. | 04 |

## Frontier order

1. **Wave 1:** Unit 01 → Unit 02 → Unit 03 (Wave 1 Gate)
2. **Wave 2:** Unit 04 → Unit 05 → Unit 06 → Unit 07 (Wave 2 Gate)
3. **Wave 3:** Unit 08 → Unit 09 → Unit 10 → Unit 11 (Wave 3 Ship Gate)


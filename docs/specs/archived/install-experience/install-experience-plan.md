---
type: spec
title: Install and use experience — plan
description: Ordered work units for the install-experience spec, in four gated waves. Wave 1 loads rules in every runtime, wave 2 runs setup anywhere, wave 3 adds doctor and supersedes the contract, and wave 4 adds the harness-init layout steps, harness-doctor and docs.
status: deprecated
---

# Install and use experience — plan

**Spec:** `docs/specs/archived/install-experience/install-experience-spec.md` (status `deprecated`).
**Contract:** ADR-006 (`docs/adrs/adr-006-install-check-and-repair-contract.md`, status `stable`).

## Structural gate

Every R row in the spec has a named proof and an evidence shape. Each
proof below lands in one unit, and each wave ends in a gate unit. Two
deviations from the spec's evidence shapes are deliberate:

- `test/doctor.test.ts` is split by unit (`doctor`, `doctor-runtime`,
  `doctor-env`, `doctor-drift`), so units 15, 16 and 17 own disjoint test
  files. The proof names are unchanged.
- R3.2 says the outside-root run writes the core skills "including
  `harness-doctor`". That skill only exists after unit 23, so unit 12's
  proof checks the written set against `CORE_SKILLS`, and unit 23 adds the
  skill to that list.

Every template skill or rule a unit edits has a byte-identical copy in this
repo under `.agents/` (`test/skill-copies.test.ts`). The unit that edits the
template owns both copies.

## Work units

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 01 | Runtime registry | — | `src/setup/runtimes.ts` (registry data and its types), `src/setup/types.ts`, `test/runtime-registry.test.ts` | `spawn` | [x] The registry exports nine complete rows, and marker paths resolve under overridden `HOME`, `XDG_CONFIG_HOME` and `CODEX_HOME`. Proof: `proof-install-experience-registry` |
| 02 | Rule frontmatter and truthful router text | — | `templates/.agents/rules/*.md`, `.agents/rules/*.md`, `templates/WOLVEN.md`, `test/rules-frontmatter.test.ts` | `spawn` | [x] Each rule carries `trigger: always_on`. `WOLVEN.md` no longer says the rules "load unconditionally". `qmd-first.md` tells the agent to report a failed harness tool before falling back. Proofs: `proof-install-experience-rule-frontmatter`, `proof-install-experience-tool-report` |
| 03 | Native rules wiring in setup | 01 | `src/setup/runtimes.ts` (wiring functions), `src/setup/summary.ts`, `test/setup-native-wiring.test.ts` | `spawn` | [x] For each native row, `setup` creates the wiring path from the registry. An existing `opencode.json` stays byte-identical and is named in the summary. With `codex` wired, no native rule wiring is created for any runtime. Proofs: `proof-install-experience-native-wiring`, `proof-install-experience-inline-rules` (setup half) |
| 04 | harness-init: Full and Light only, with markers | 02 | `templates/.agents/skills/harness-init/SKILL.md`, `templates/.agents/skills/harness-init/references/entry-modes.md`, their `.agents/skills/harness-init/` copies, `templates/WOLVEN.md` (markers only), `test/harness-init-entry.test.ts` | `spawn` | [x] Mention-only is gone. Both modes write the start and end markers. When `codex` is wired, the section holds the rule bodies between the rules markers. Proofs: `proof-install-experience-entry-modes`, `proof-install-experience-inline-rules` (harness-init half) |
| 05 | `step0-pending` keys on the marker | — | `src/validate/spine.ts`, `test/spine.test.ts` | `spawn` | [x] An `AGENTS.md` with only the mention line warns `step0-pending`, and one with the markers doesn't. Proof: `proof-install-experience-step0-marker` |
| 06 | **Wave 1 gate** | 03, 04, 05 | — | `inline` | [x] Proofs of units 01 to 05 pass. `pnpm build && pnpm test && pnpm lint && pnpm validate && pnpm comments` pass. On failure, **abort** before wave 2 |
| 07 | Runtime detection and confirmation | 06 | `src/setup/options.ts` (detection, prompt initial values, `--runtimes` values), `test/setup-runtimes.test.ts` | `spawn` | [x] On a TTY, the prompt pre-selects runtimes whose markers exist. With no markers, nothing is pre-selected. `--runtimes` accepts every registry id. Proofs: `proof-install-experience-detect`, `proof-install-experience-detect-none` |
| 08 | Config accepts the new optional keys | 06 | `src/setup/config.ts`, `test/config-keys.test.ts` | `spawn` | [x] `packageManager`, `layout`, `harnessHome`, `codeRepo` and `commitConvention` validate per ADR-006's config table. Bad values exit 1 naming the key. Existing configs still load. Proof: `proof-install-experience-contract` (config rows) |
| 09 | Package-manager resolution and command forms | 07, 08 | `src/setup/package-manager.ts` (new), `src/setup/options.ts` (`--package-manager` only), `src/setup/own-package.ts`, `src/setup/harness-score.ts`, `test/package-manager.test.ts` | `spawn` | [x] Resolution follows the R4.1 order and records `packageManager`. Several lockfiles without a TTY is an error naming the flag. Every printed command matches the manager × command-kind table. Proofs: `proof-install-experience-pm-detect`, `proof-install-experience-pm-commands` |
| 10 | Templates call `wolven-harness` directly | 09 | `templates/WOLVEN.md`, `templates/.agents/skills/{wayfinder,code-execute,harness-init}/**` (command lines and `validate-wiring.md`), their `.agents/skills/` copies, `test/package-manager.test.ts` (template case) | `spawn` | [x] No `pnpm ` remains in `templates/**` outside the per-manager table in `validate-wiring.md`. That table has npm, yarn, pnpm and no-`package.json` branches. Proof: `proof-install-experience-pm-templates` |
| 11 | Install manifest | 06 | `src/setup/manifest.ts` (new), `src/setup/apply.ts`, `src/setup/runtimes.ts` (route wiring writes through the recorder), `test/setup-apply.test.ts` | `spawn` | [x] After `setup`, the manifest keys equal the set of files it created, including generated rule files, and the hashes match. A re-run adds only new entries. Proof: `proof-install-experience-manifest` |
| 12 | Setup outside a git top-level | 09, 11 | `src/setup/index.ts`, `src/setup/options.ts` (top-level check only), `test/setup-outside-root.test.ts` | `spawn` | [x] Outside a top-level, the written set equals exactly `CORE_SKILLS`, the runtime skills wiring, the config and the manifest. It exits 0, and the next step names `harness-init`. A non-global executable path gets the global-install hint. Existing `setup-*` and `contract` tests pass unchanged. Proofs: `proof-install-experience-outside-root`, `proof-install-experience-global-hint`, `proof-install-experience-root-unchanged` |
| 13 | **Wave 2 gate** | 10, 12 | — | `inline` | [x] Proofs of units 07 to 12 pass. The five wave-1 commands pass. A manual `node dist/cli.js setup` in an empty temp dir writes only the R3.2 set. On failure, **abort** before wave 3 |
| 14 | `doctor` command, output and read-only run | 13 | `src/cli.ts`, `src/doctor/index.ts` (new), `src/doctor/report.ts` (new), `test/doctor.test.ts` | `spawn` | [x] `wolven-harness doctor [--dir]` prints findings and the summary line in the ADR-006 shape, exits 0 or 1, and rejects unknown args. A folder with no config yields only `doctor-config`. The fixture tree's hashes are unchanged after a run. Proofs: `proof-install-experience-doctor-output`, `proof-install-experience-doctor-readonly` |
| 15 | Doctor runtime checks | 14 | `src/doctor/runtime-checks.ts` (new), `test/doctor-runtime.test.ts` | `spawn` | [x] `doctor-entry`, `doctor-rules` and `doctor-skills` fire per wired runtime from the registry, and `linked` layouts are followed through `harnessHome`. Proof: `proof-install-experience-doctor-checks` (runtime half) |
| 16 | Doctor environment checks | 14 | `src/doctor/env-checks.ts` (new), `test/doctor-env.test.ts` | `spawn` | [x] `doctor-docs`, `doctor-qmd`, `doctor-code-repo` and `doctor-not-global` fire on their fixtures, with a stub `PATH`. The audited-shape fixture exits 1 with the expected codes, and the repaired one exits 0. Proofs: `proof-install-experience-doctor-checks` (environment half), `proof-install-experience-no-code-writes`, `proof-install-experience-pm-global` |
| 17 | Doctor drift report | 14 | `src/doctor/drift.ts` (new), `test/doctor-drift.test.ts`, `docs/deferrals/setup-drift-check/` (deleted) | `spawn` | [x] Each drift class has a fixture that yields its warning, and a manifest-less fixture reports differing files as edited. `doctor-version-behind` fires on an older `packageVersion`. The deferral folder is gone. Proofs: `proof-install-experience-drift`, `proof-install-experience-drift-deferral` |
| 18 | Supersede the previous contract ADR with ADR-006 | 15, 16, 17 | `test/contract.test.ts`, every live (non-archived) file outside `docs/adrs/` that claims the previous contract ADR, and that ADR's status and `superseded_by` | `inline` | [x] Contract tests read ADR-006, and cover the `doctor` codes, `--package-manager`, the runtime ids and the config keys. No live claim targets the previous contract ADR. That ADR is `deprecated` with `superseded_by: adr-006-install-check-and-repair-contract`. Proof: `proof-install-experience-contract` with `pnpm validate` at 0 claim failures |
| 19 | **Wave 3 gate** | 18 | — | `inline` | [x] Proofs of units 14 to 18 pass. The five commands pass. `node dist/cli.js doctor --dir <fixture>` exits 1 on the audited-shape fixture and 0 on the repaired one. On failure, **abort** before wave 4 |
| 20 | harness-init: harness home and linked layout | 19 | `templates/.agents/skills/harness-init/SKILL.md`, `templates/.agents/skills/harness-init/references/layout.md` (new), their `.agents/skills/harness-init/` copies, `test/harness-init-layout.test.ts` | `spawn` | [x] The skill asks before `git init`, gitignores `codeRepo` and records `layout: "home"`. For a linked layout, it creates the three symlinks and replaces bootstrap copies only on matching manifest hashes. It forbids moves. Proofs: `proof-install-experience-init-home`, `proof-install-experience-init-linked` |
| 21 | harness-init: commit convention | 20 | `templates/.agents/skills/harness-init/SKILL.md` (convention step), `templates/.agents/skills/harness-init/references/convention.md` (new), their `.agents/skills/harness-init/` copies, `test/harness-init-layout.test.ts` (convention case) | `spawn` | [x] The step reads 30 subjects, proposes a pattern at 80% agreement, falls back to Conventional Commits, and records both config shapes after confirmation. Proof: `proof-install-experience-convention-init` |
| 22 | code-commit and code-pr follow the recorded convention | 19 | `templates/.agents/skills/code-commit/SKILL.md`, `templates/.agents/skills/code-pr/SKILL.md`, their `.agents/skills/` copies, `test/convention-skills.test.ts` | `spawn` | [x] Both skills read `commitConvention` for `codeRepo` work and keep Conventional Commits in the harness home. Proof: `proof-install-experience-convention-skills` |
| 23 | harness-doctor core skill | 19 | `templates/.agents/skills/harness-doctor/**` (new), `.agents/skills/harness-doctor/**`, `src/setup/skill-sets.ts` (`CORE_SKILLS`), `AGENTS.md` (skills table row), `test/harness-doctor-skill.test.ts`, `test/skill-sets.test.ts` | `spawn` | [x] `setup` installs `harness-doctor` with the core set. The skill runs `doctor`, makes one fix per OK and keeps the layout. It refreshes only stale files (updating the manifest entry), shows edited files without changing them, and routes mention-only installs to `harness-init` step 0. Proofs: `proof-install-experience-doctor-skill`, `proof-install-experience-doctor-refresh`, `proof-install-experience-doctor-migrate` |
| 24 | README and site lead with global install and doctor | 19 | `README.md`, `site/index.md`, `site/commands.md`, `site/runtimes.md`, `test/readme-install.test.ts` | `spawn` | [x] The install docs show the global install in npm, yarn and pnpm forms, `setup` from any folder, and `doctor`. `site/runtimes.md` lists the nine runtimes. Proof: `proof-install-experience-docs` |
| 25 | **Ship gate** | 21, 22, 23, 24 | — | `inline` | [x] Every acceptance box in the spec is ticked. The five commands pass, plus `pnpm docs:build`. On failure, **abort** before handoff |

## Wave stops

| Stop | After | Gate |
|------|-------|------|
| **1** | 06 | Units 01 to 05 proofs. `pnpm build`, `test`, `lint`, `validate` and `comments` pass. **Abort before wave 2** |
| **2** | 13 | Units 07 to 12 proofs, the same five commands, and an empty-dir `setup` smoke. **Abort before wave 3** |
| **3** | 19 | Units 14 to 18 proofs, the same five commands, and the `doctor` smoke on both fixtures. **Abort before wave 4** |
| **Ship** | 25 | Every spec acceptance box, the five commands and `pnpm docs:build` |

## Unresolved

All four rows carry over from the spec and are non-blocking.

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
|---|---|---|---|---|---|
| `U-deepseek` | Which product "DeepSeek" names as a runtime | Human | Non-blocking | Add a registry row once it is named and researched | 01 |
| `U-more-runtimes` | Native strategies for Compozy's other universal agents | Human | Non-blocking | Not registry rows in v1; add each when researched | 01 |
| `U-copilot-surfaces` | Which Copilot surfaces read `AGENTS.md` and `.github/instructions/` | Human | Non-blocking | `doctor` checks the files only; revisit if a surface ignores them | 15 |
| `U-qmd-freshness` | Whether `doctor` flags a stale index | Human | Non-blocking | v1 checks the binary and `.qmd/index.sqlite` only | 16 |

## Frontier order

**Wave 1:** (01 ∥ 02 ∥ 05) → (03 after 01 ∥ 04 after 02) → **06 STOP**

**Wave 2:** (07 ∥ 08 ∥ 11) → 09 → (10 ∥ 12) → **13 STOP**

**Wave 3:** 14 → (15 ∥ 16 ∥ 17) → 18 → **19 STOP**

**Wave 4:** (20 ∥ 22 ∥ 23 ∥ 24) → 21 → **25 STOP**

Units run in parallel only when their Owns are disjoint:

- Unit 11 and unit 03 both touch `src/setup/runtimes.ts`, but they are in
  different waves.
- Units 07, 09 and 12 each own a separate part of `src/setup/options.ts`.
  They run in dependency order, never at the same time.
- Units 04, 10, 20 and 21 each touch `harness-init`, and their dependencies
  keep them in sequence.

## Execution / resume section

`HEAD` at the start of wave 1 is `3027dc3`, and `git status` is clean.

### Unit 01 — Runtime registry

| Field | Value |
|-------|-------|
| Unit identifier | 01 — Runtime registry (frontier 1) |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-spec.md` / `docs/specs/archived/install-experience/install-experience-plan.md` |
| Obligation / proof status | R1.1 / `proof-install-experience-registry` — done |
| `HEAD` commit | `3027dc3` |
| `git status` summary | clean |
| Intended diff scope | `src/setup/runtimes.ts`, `src/setup/types.ts`, `test/runtime-registry.test.ts` |
| Decision on every discrepancy | none |

### Unit 02 — Rule frontmatter and truthful router text

| Field | Value |
|-------|-------|
| Unit identifier | 02 — Rule frontmatter and truthful router text (frontier 1) |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-spec.md` / `docs/specs/archived/install-experience/install-experience-plan.md` |
| Obligation / proof status | R2.1, R2.6 / `proof-install-experience-rule-frontmatter`, `proof-install-experience-tool-report` — done |
| `HEAD` commit | `3027dc3` |
| `git status` summary | clean |
| Intended diff scope | `templates/.agents/rules/*.md`, `.agents/rules/*.md`, `templates/WOLVEN.md`, `test/rules-frontmatter.test.ts` |
| Decision on every discrepancy | none |

### Unit 05 — `step0-pending` keys on the marker

| Field | Value |
|-------|-------|
| Unit identifier | 05 — `step0-pending` keys on the marker (frontier 1) |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-spec.md` / `docs/specs/archived/install-experience/install-experience-plan.md` |
| Obligation / proof status | R2.5 / `proof-install-experience-step0-marker` — done |
| `HEAD` commit | `3027dc3` |
| `git status` summary | clean |
| Intended diff scope | `src/validate/spine.ts`, `test/spine.test.ts` |
| Decision on every discrepancy | none |

### Unit 03 — Native rules wiring in setup

| Field | Value |
|-------|-------|
| Unit identifier | 03 — Native rules wiring in setup (frontier 2) |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-spec.md` / `docs/specs/archived/install-experience/install-experience-plan.md` |
| Obligation / proof status | R2.2, R2.3 (setup half) / `proof-install-experience-native-wiring`, `proof-install-experience-inline-rules` — done |
| `HEAD` commit | `3027dc3` |
| `git status` summary | dirty — units 01, 02 and 05 own the modified paths; this unit's Owns start clean |
| Intended diff scope | `src/setup/runtimes.ts` (wiring functions only), `src/setup/summary.ts`, `test/setup-native-wiring.test.ts` (new) |
| Decision on every discrepancy | resolved — `test/setup-runtimes.test.ts`'s "codex,cursor" cases stay correct because codex's inline strategy suppresses native rule wiring; no edit needed there. The six new ids are proved through `wireRuntimes`/`buildSummary` because `src/setup/config.ts` still rejects them at the flag parser (raised for wave 2) |

### Unit 04 — harness-init: Full and Light only, with markers

| Field | Value |
|-------|-------|
| Unit identifier | 04 — harness-init: Full and Light only, with markers (frontier 2) |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-spec.md` / `docs/specs/archived/install-experience/install-experience-plan.md` |
| Obligation / proof status | R2.3 (harness-init half), R2.4 / `proof-install-experience-entry-modes`, `proof-install-experience-inline-rules` — done |
| `HEAD` commit | `3027dc3` |
| `git status` summary | dirty — units 01, 02 and 05 own the modified paths; this unit's Owns start clean |
| Intended diff scope | `templates/.agents/skills/harness-init/SKILL.md`, `templates/.agents/skills/harness-init/references/entry-modes.md`, their `.agents/skills/harness-init/` copies, `templates/WOLVEN.md` (markers only), `test/harness-init-entry.test.ts`, plus the one re-run-skip assertion at `test/skill-harness-init.test.ts:79` |
| Decision on every discrepancy | resolved — the two `step0-pending` fixtures in `test/harness-init-entry.test.ts` now warn after unit 05; this unit's marker rewrite is what clears them. `test/skill-harness-init.test.ts:79` pins the old mention-based skip condition, which R2.5 falsifies; that single assertion moves to the start marker |

### Wave 2 prerequisite — runtime ids (parent, inline)

| Field | Value |
|-------|-------|
| Unit identifier | Wave 2 prerequisite — `--runtimes` accepts every registry id (before unit 07) |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-spec.md` / `docs/specs/archived/install-experience/install-experience-plan.md` |
| Obligation / proof status | R1.2 / `proof-install-experience-detect` — prerequisite done, proof pending in unit 07 |
| `HEAD` commit | `10a18b4` |
| `git status` summary | dirty — this prerequisite's three files and the plan only |
| Intended diff scope | `src/setup/runtimes.ts` (`isRuntimeId`), `src/setup/config.ts` (registry-backed `isRuntime` and error text), `src/skills/parse.ts` (`SKILL_RUNTIMES` keeps its three values) |
| Decision on every discrepancy | resolved — the plan gave the config runtime list no owner in wave 2, and unit 07's proof runs through the real CLI. `skills --runtimes` stays at `claude`, `codex`, `cursor` per ADR-006. Verified: `setup --runtimes opencode` exits 0, writes and round-trips its config; `skills --runtimes opencode` is still rejected |

### Unit 07 — Runtime detection and confirmation

| Field | Value |
|-------|-------|
| Unit identifier | 07 — Runtime detection and confirmation (wave 2, frontier 1) |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-spec.md` / `docs/specs/archived/install-experience/install-experience-plan.md` |
| Obligation / proof status | R1.2, R1.3 / `proof-install-experience-detect`, `proof-install-experience-detect-none` — done |
| `HEAD` commit | `10a18b4` |
| `git status` summary | dirty — the parent prerequisite and this plan file; this unit's Owns start clean |
| Intended diff scope | `src/setup/options.ts` (detection, prompt initial values, `--runtimes` values), `test/setup-runtimes.test.ts`, plus the prompt/detection assertions in `test/setup-ui.test.ts` |
| Decision on every discrepancy | resolved — the registry makes the prompt list nine options, so `test/setup-ui.test.ts`'s `multiLabels` assertion widens; `detectRuntimes` keeps an optional env argument so its existing one-argument calls stay valid |

### Unit 08 — Config accepts the new optional keys

| Field | Value |
|-------|-------|
| Unit identifier | 08 — Config accepts the new optional keys (wave 2, frontier 1) |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-spec.md` / `docs/specs/archived/install-experience/install-experience-plan.md` |
| Obligation / proof status | R9.1 (config rows) / `proof-install-experience-contract` (config rows) — done |
| `HEAD` commit | `10a18b4` |
| `git status` summary | dirty — the parent prerequisite and this plan file; this unit's Owns start clean |
| Intended diff scope | `src/setup/config.ts`, `test/config-keys.test.ts` (new) |
| Decision on every discrepancy | none — the parent prerequisite already moved the runtime list onto the registry; this unit adds only the new optional keys and their rules |

### Unit 11 — Install manifest

| Field | Value |
|-------|-------|
| Unit identifier | 11 — Install manifest (wave 2, frontier 1) |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-spec.md` / `docs/specs/archived/install-experience/install-experience-plan.md` |
| Obligation / proof status | R7.3 / `proof-install-experience-manifest` — done |
| `HEAD` commit | `10a18b4` |
| `git status` summary | dirty — the parent prerequisite and this plan file; this unit's Owns start clean |
| Intended diff scope | `src/setup/manifest.ts` (new), `src/setup/apply.ts`, `src/setup/runtimes.ts` (recorder), `test/setup-apply.test.ts`, the manifest wiring in `src/setup/index.ts`, plus the `.wolven-harness.manifest.json` entry in `test/setup-surfaces.test.ts`'s exact path set |
| Decision on every discrepancy | resolved — the recorder must be created and the manifest written by `runSetup`, but `src/setup/index.ts` belonged to unit 12, which runs later; this unit takes only the manifest wiring there, and unit 12 keeps the rest. `package.json` script additions are not recorded: setup edits an existing consumer file rather than creating it, and recording it would make `doctor-drift-edited` fire on the consumer's own edits |

### Unit 09 — Package-manager resolution and command forms

| Field | Value |
|-------|-------|
| Unit identifier | 09 — Package-manager resolution and command forms (wave 2, frontier 2) |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-spec.md` / `docs/specs/archived/install-experience/install-experience-plan.md` |
| Obligation / proof status | R4.1, R4.2 / `proof-install-experience-pm-detect`, `proof-install-experience-pm-commands` — done |
| `HEAD` commit | `10a18b4` |
| `git status` summary | dirty — units 07, 08 and 11 own the modified paths; this unit's Owns start clean |
| Intended diff scope | `src/setup/package-manager.ts` (new), `src/setup/options.ts` (`--package-manager` only), `src/setup/own-package.ts`, `src/setup/harness-score.ts`, `test/package-manager.test.ts` (new), plus the pnpm assertions in `test/install-devdep.test.ts` and the warning assertion in `test/setup-harness-score.test.ts`, the setup-flags test in `test/contract.test.ts` (reads ADR-006), and the setup usage lines in `src/cli.ts` |
| Decision on every discrepancy | resolved — `--package-manager` is in ADR-006 but not in the previous contract ADR, so the flags contract test reads ADR-006 for that one case (unit 18 repoints the rest); the existing warning assertions name pnpm, which a `package.json` without a signal no longer resolves to |

### Unit 10 — Templates call `wolven-harness` directly

| Field | Value |
|-------|-------|
| Unit identifier | 10 — Templates call `wolven-harness` directly (wave 2, frontier 3) |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-spec.md` / `docs/specs/archived/install-experience/install-experience-plan.md` |
| Obligation / proof status | R4.3 / `proof-install-experience-pm-templates` — done |
| `HEAD` commit | `10a18b4` |
| `git status` summary | dirty — units 07, 08, 09 and 11 own the modified paths; this unit's Owns start clean |
| Intended diff scope | `templates/WOLVEN.md`, `templates/.agents/skills/{wayfinder,code-execute,harness-init}/**`, their `.agents/skills/` copies, `test/package-manager.test.ts` (template case), plus the pnpm assertions in `test/skill-wayfinder.test.ts`, `test/skill-harness-init.test.ts` and `test/setup-surfaces.test.ts` that pin the old command lines, and (only if a literal cannot be kept) the final-check assertions in `test/skill-code-execute.test.ts` |
| Decision on every discrepancy | resolved — the three test assertions name the exact command lines this unit replaces; they are assertion-level edits in files the plan did not list, and no other change touches them |

### Unit 12 — Setup outside a git top-level

| Field | Value |
|-------|-------|
| Unit identifier | 12 — Setup outside a git top-level (wave 2, frontier 3) |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-spec.md` / `docs/specs/archived/install-experience/install-experience-plan.md` |
| Obligation / proof status | R3.2, R3.3, R3.1 / `proof-install-experience-outside-root`, `proof-install-experience-global-hint`, `proof-install-experience-root-unchanged` — done |
| `HEAD` commit | `10a18b4` |
| `git status` summary | dirty — units 07, 08, 09 and 11 own the modified paths; this unit's Owns start clean |
| Intended diff scope | `src/setup/index.ts`, `src/setup/options.ts` (top-level check only), `test/setup-outside-root.test.ts` (new), plus `src/setup/types.ts` (`Io.execPath`, and a mode on `Options` if needed), `src/cli.ts` (pass the executable path), `test/helpers/fixture.ts` (executable-path passthrough), `src/setup/apply.ts` (skills-only write path), `src/setup/runtimes.ts` (skills-only wiring), the next-steps assertions in `test/setup-ui.test.ts` and `test/setup-harness-score.test.ts`, the two `test/setup-options.test.ts` cases that pin the old subdir/non-git failure, and the empty-preselection case in `test/setup-runtimes.test.ts` whose fake prompt violates the required-prompt contract |
| Decision on every discrepancy | resolved — the outside mode needs a narrower write path and an injectable executable path for the global-install hint, and `index.ts`'s next-step strings move to the resolved manager; all of those files are sequential to this unit, so it takes the minimal slice of each. R3.2 also supersedes the two `test/setup-options.test.ts` cases that assert the old exit 1 outside a top-level, so this unit rewrites them |

### Unit 13 — Wave 2 gate

| Field | Value |
|-------|-------|
| Unit identifier | 13 — Wave 2 gate (wave 2, frontier 4) |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-spec.md` / `docs/specs/archived/install-experience/install-experience-plan.md` |
| Obligation / proof status | Units 07–12 proofs — done; gate — pass |
| `HEAD` commit | `10a18b4` |
| `git status` summary | dirty — the wave-2 batch (units 07–12 plus the runtime-id prerequisite) is uncommitted |
| Intended diff scope | the wave-2 batch, no new writes |
| Decision on every discrepancy | none — `pnpm build && pnpm test && pnpm lint && pnpm validate && pnpm comments` passed at 872 tests, and a manual `node dist/cli.js setup` in an empty folder wrote exactly the R3.2 set |

### Unit 14 — `doctor` command, output and read-only run

| Field | Value |
|-------|-------|
| Unit identifier | 14 — `doctor` command, output and read-only run (wave 3, frontier 1) |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-spec.md` / `docs/specs/archived/install-experience/install-experience-plan.md` |
| Obligation / proof status | R7.1 (output/config/read-only half), R7.2, R7.5 / `proof-install-experience-doctor-output`, `proof-install-experience-doctor-readonly` — done |
| `HEAD` commit | `e4b91b1` |
| `git status` summary | clean at dispatch |
| Intended diff scope | `src/cli.ts` (dispatch and usage), `src/doctor/index.ts` (new), `src/doctor/report.ts` (new), `test/doctor.test.ts` (new), plus the three check-module stubs `src/doctor/runtime-checks.ts`, `src/doctor/env-checks.ts`, `src/doctor/drift.ts` that units 15–17 will fill |
| Decision on every discrepancy | resolved — units 15–17 run in parallel and must not all edit `src/doctor/index.ts`, so this unit scaffolds each check module with a no-op export and wires all three into the default check list; 15–17 own only their module body and test file |

### Units 15–17 — Doctor checks and drift

| Field | Value |
|-------|-------|
| Unit identifier | 15 runtime checks; 16 environment checks; 17 drift and version-behind (wave 3, frontier 2) |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-spec.md` / `docs/specs/archived/install-experience/install-experience-plan.md` |
| Obligation / proof status | R7.1, R7.2, R4.4, R5.3, R7.4, R9.3 / `proof-install-experience-doctor-checks`, `proof-install-experience-no-code-writes`, `proof-install-experience-pm-global`, `proof-install-experience-drift`, `proof-install-experience-drift-deferral` — done |
| `HEAD` commit | `e4b91b1` |
| `git status` summary | dirty — units 14–17's own files; the three units run on disjoint paths |
| Intended diff scope | `src/doctor/{runtime-checks,env-checks,drift}.ts` (one each), `test/doctor-{runtime,env,drift}.test.ts` (one each), and unit 17 deletes `docs/deferrals/setup-drift-check/` |
| Decision on every discrepancy | resolved — unit 14 scaffolds all three modules and wires them into `DEFAULT_CHECKS`, so each unit fills one body and no unit edits `index.ts`; the plan's split test-file rule keeps the proof files disjoint |

### Unit 18 — Supersede the previous contract ADR

| Field | Value |
|-------|-------|
| Unit identifier | 18 — Supersede the previous contract ADR with ADR-006 (wave 3, frontier 3, inline) |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-spec.md` / `docs/specs/archived/install-experience/install-experience-plan.md` |
| Obligation / proof status | R9.1 / `proof-install-experience-contract` — done |
| `HEAD` commit | `e4b91b1` |
| `git status` summary | dirty — the wave-3 batch; the deferral deletion is staged so `git ls-files` matches the worktree |
| Intended diff scope | `test/contract.test.ts`, every live claim to the previous contract ADR (25 files: skills, live docs, site pages, the profile comments), and that ADR's `status`/`superseded_by` |
| Decision on every discrepancy | resolved — ADR-006 carries two `Finding codes:` sections (doctor first, validate second), so the validate-codes test anchors on the `### validate` section; the repoint also covered the two `// why:` comments in `src/validate/profile.ts`, which R9.1's "every live file" requires even though the spec freezes that folder |

### Unit 19 — Wave 3 gate

| Field | Value |
|-------|-------|
| Unit identifier | 19 — Wave 3 gate (wave 3, frontier 4, inline) |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-spec.md` / `docs/specs/archived/install-experience/install-experience-plan.md` |
| Obligation / proof status | Units 14–18 proofs — done; gate — pass |
| `HEAD` commit | `e4b91b1` |
| `git status` summary | dirty — the wave-3 batch is uncommitted, with the deferral deletion staged |
| Intended diff scope | the wave-3 batch, no new writes |
| Decision on every discrepancy | none — `pnpm build && pnpm test && pnpm lint && pnpm validate && pnpm comments` passed at 915 tests, and the doctor smoke exited 1 on the audited-shape fixture and 0 on the repaired one |

### Wave 4 prerequisite — `validate` skips deleted tracked files (parent, inline)

| Field | Value |
|-------|-------|
| Unit identifier | Wave 4 prerequisite — `validate` tolerates an unstaged tracked deletion |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-spec.md` / `docs/specs/archived/install-experience/install-experience-plan.md` |
| Obligation / proof status | none directly; removes the crash R9.3's deletion exposed |
| `HEAD` commit | `434e27c` |
| `git status` summary | dirty — this prerequisite's two files and the plan |
| Intended diff scope | `src/validate/repo.ts` (existence filter in `buildRepoContext`), `test/validate-repo.test.ts` (one case) |
| Decision on every discrepancy | resolved — the spec freezes `src/validate/**` outside `spine.ts`, but `git ls-files` listing an unstaged deletion crashed every consumer who deletes a tracked file before committing; the filter is the smallest correct fix and has a regression case |

### Unit 20 — harness-init: harness home and linked layout

| Field | Value |
|-------|-------|
| Unit identifier | 20 — harness-init: harness home and linked layout (wave 4, frontier 1) |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-spec.md` / `docs/specs/archived/install-experience/install-experience-plan.md` |
| Obligation / proof status | R5.1, R5.2 / `proof-install-experience-init-home`, `proof-install-experience-init-linked` — done |
| `HEAD` commit | `434e27c` |
| `git status` summary | dirty — the parent prerequisite and the plan; this unit's Owns start clean |
| Intended diff scope | `templates/.agents/skills/harness-init/SKILL.md`, `references/layout.md` (new), their `.agents/skills/harness-init/` copies, `test/harness-init-layout.test.ts` (new), plus the amp rules-delivery rule in `references/entry-modes.md`, its copy, and `test/harness-init-entry.test.ts` |
| Decision on every discrepancy | resolved — the amp row's "harness section carries `@.agents/rules/*.md`" has no setup half (setup never edits AGENTS.md), so this unit adds the amp imports to the section-writing guidance and proves it in the entry test |

### Units 22–24 — conventions, the doctor skill, and the install docs

| Field | Value |
|-------|-------|
| Unit identifier | 22 code-commit/code-pr convention; 23 harness-doctor core skill; 24 README and site (wave 4, frontier 1) |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-spec.md` / `docs/specs/archived/install-experience/install-experience-plan.md` |
| Obligation / proof status | R6.2, R8.1–R8.3, R9.2 / `proof-install-experience-convention-skills`, `proof-install-experience-doctor-skill`, `proof-install-experience-doctor-refresh`, `proof-install-experience-doctor-migrate`, `proof-install-experience-docs` — done |
| `HEAD` commit | `434e27c` |
| `git status` summary | dirty — the parent prerequisite and the plan; each unit's Owns start clean |
| Intended diff scope | 22: `templates/.agents/skills/{code-commit,code-pr}/SKILL.md` and copies, `test/convention-skills.test.ts`; 23: `templates/.agents/skills/harness-doctor/**` and copy, `src/setup/skill-sets.ts`, the `AGENTS.md` skills row, `test/harness-doctor-skill.test.ts`, `test/skill-sets.test.ts`, the hardcoded core/total counts in `test/setup-skill-sets.test.ts`, the `EXPECTED_SKILLS` list in `test/ask-only.test.ts`, the skill-count text and inventory row in `site/skills.md`, and the inventory assertions in `test/skill-wayfinder.test.ts`; 24: `README.md`, `site/{index,commands,runtimes}.md`, `test/readme-install.test.ts`, plus `site/harness-init.md` and `test/harness-init-set.test.ts` |
| Decision on every discrepancy | resolved — the two stale-doc fixes (three entry modes on the site, "rules load unconditionally" in `AGENTS.md`) are folded into 24 and 23; `test/setup-runtimes.test.ts`'s README/runtimes assertion is 24's to update if its rewrite changes those literals |

### Unit 21 — harness-init: commit convention

| Field | Value |
|-------|-------|
| Unit identifier | 21 — harness-init: commit convention (wave 4, frontier 2) |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-spec.md` / `docs/specs/archived/install-experience/install-experience-plan.md` |
| Obligation / proof status | R6.1 / `proof-install-experience-convention-init` — done |
| `HEAD` commit | `434e27c` |
| `git status` summary | dirty — the wave-4 batch is uncommitted |
| Intended diff scope | `templates/.agents/skills/harness-init/SKILL.md` (convention step), `references/convention.md` (new), their copies, `test/harness-init-layout.test.ts` (convention case) |
| Decision on every discrepancy | none — the step reads the last 30 subjects, proposes at 80% (24 of 30), records both config shapes only on confirmation, and defaults to Conventional Commits |

### Unit 25 — Ship gate

| Field | Value |
|-------|-------|
| Unit identifier | 25 — Ship gate (wave 4, frontier 3, inline) |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-spec.md` / `docs/specs/archived/install-experience/install-experience-plan.md` |
| Obligation / proof status | every acceptance box in the spec — ticked; gate — pass |
| `HEAD` commit | `434e27c` |
| `git status` summary | dirty — the wave-4 batch is uncommitted |
| Intended diff scope | no new files; the spec's 32 acceptance boxes and the plan's 20–25 marks are ticked |
| Decision on every discrepancy | none — `pnpm build && pnpm test && pnpm lint && pnpm validate && pnpm comments` passed at 941 tests, and `pnpm docs:build` completed |

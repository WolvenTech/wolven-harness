---
type: spec
title: Install and use experience — plan
description: Ordered work units for the install-experience spec, in four gated waves. Wave 1 loads rules in every runtime, wave 2 runs setup anywhere, wave 3 adds doctor and supersedes the contract, and wave 4 adds the harness-init layout steps, harness-doctor and docs.
status: stable
---

# Install and use experience — plan

**Spec:** `docs/specs/install-experience/install-experience-spec.md` (status `stable`).
**Contract:** ADR-005 (`docs/adrs/adr-005-install-anywhere-contract.md`, status `stable`).

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
| 01 | Runtime registry | — | `src/setup/runtimes.ts` (registry data and its types), `src/setup/types.ts`, `test/runtime-registry.test.ts` | `spawn` | [ ] The registry exports nine complete rows, and marker paths resolve under overridden `HOME`, `XDG_CONFIG_HOME` and `CODEX_HOME`. Proof: `proof-install-experience-registry` |
| 02 | Rule frontmatter and truthful router text | — | `templates/.agents/rules/*.md`, `.agents/rules/*.md`, `templates/WOLVEN.md`, `test/rules-frontmatter.test.ts` | `spawn` | [ ] Each rule carries `trigger: always_on`. `WOLVEN.md` no longer says the rules "load unconditionally". `qmd-first.md` tells the agent to report a failed harness tool before falling back. Proofs: `proof-install-experience-rule-frontmatter`, `proof-install-experience-tool-report` |
| 03 | Native rules wiring in setup | 01 | `src/setup/runtimes.ts` (wiring functions), `src/setup/summary.ts`, `test/setup-native-wiring.test.ts` | `spawn` | [ ] For each native row, `setup` creates the wiring path from the registry. An existing `opencode.json` stays byte-identical and is named in the summary. With `codex` wired, no native rule wiring is created for any runtime. Proofs: `proof-install-experience-native-wiring`, `proof-install-experience-inline-rules` (setup half) |
| 04 | harness-init: Full and Light only, with markers | 02 | `templates/.agents/skills/harness-init/SKILL.md`, `templates/.agents/skills/harness-init/references/entry-modes.md`, their `.agents/skills/harness-init/` copies, `templates/WOLVEN.md` (markers only), `test/harness-init-entry.test.ts` | `spawn` | [ ] Mention-only is gone. Both modes write the start and end markers. When `codex` is wired, the section holds the rule bodies between the rules markers. Proofs: `proof-install-experience-entry-modes`, `proof-install-experience-inline-rules` (harness-init half) |
| 05 | `step0-pending` keys on the marker | — | `src/validate/spine.ts`, `test/spine.test.ts` | `spawn` | [ ] An `AGENTS.md` with only the mention line warns `step0-pending`, and one with the markers doesn't. Proof: `proof-install-experience-step0-marker` |
| 06 | **Wave 1 gate** | 03, 04, 05 | — | `inline` | [ ] Proofs of units 01 to 05 pass. `pnpm build && pnpm test && pnpm lint && pnpm validate && pnpm comments` pass. On failure, **abort** before wave 2 |
| 07 | Runtime detection and confirmation | 06 | `src/setup/options.ts` (detection, prompt initial values, `--runtimes` values), `test/setup-runtimes.test.ts` | `spawn` | [ ] On a TTY, the prompt pre-selects runtimes whose markers exist. With no markers, nothing is pre-selected. `--runtimes` accepts every registry id. Proofs: `proof-install-experience-detect`, `proof-install-experience-detect-none` |
| 08 | Config accepts the new optional keys | 06 | `src/setup/config.ts`, `test/config-keys.test.ts` | `spawn` | [ ] `packageManager`, `layout`, `harnessHome`, `codeRepo` and `commitConvention` validate per ADR-005's config table. Bad values exit 1 naming the key. Existing configs still load. Proof: `proof-install-experience-contract` (config rows) |
| 09 | Package-manager resolution and command forms | 07, 08 | `src/setup/package-manager.ts` (new), `src/setup/options.ts` (`--package-manager` only), `src/setup/own-package.ts`, `src/setup/harness-score.ts`, `test/package-manager.test.ts` | `spawn` | [ ] Resolution follows the R4.1 order and records `packageManager`. Several lockfiles without a TTY is an error naming the flag. Every printed command matches the manager × command-kind table. Proofs: `proof-install-experience-pm-detect`, `proof-install-experience-pm-commands` |
| 10 | Templates call `wolven-harness` directly | 09 | `templates/WOLVEN.md`, `templates/.agents/skills/{wayfinder,code-execute,harness-init}/**` (command lines and `validate-wiring.md`), their `.agents/skills/` copies, `test/package-manager.test.ts` (template case) | `spawn` | [ ] No `pnpm ` remains in `templates/**` outside the per-manager table in `validate-wiring.md`. That table has npm, yarn, pnpm and no-`package.json` branches. Proof: `proof-install-experience-pm-templates` |
| 11 | Install manifest | 06 | `src/setup/manifest.ts` (new), `src/setup/apply.ts`, `src/setup/runtimes.ts` (route wiring writes through the recorder), `test/setup-apply.test.ts` | `spawn` | [ ] After `setup`, the manifest keys equal the set of files it created, including generated rule files, and the hashes match. A re-run adds only new entries. Proof: `proof-install-experience-manifest` |
| 12 | Setup outside a git top-level | 09, 11 | `src/setup/index.ts`, `src/setup/options.ts` (top-level check only), `test/setup-outside-root.test.ts` | `spawn` | [ ] Outside a top-level, the written set equals exactly `CORE_SKILLS`, the runtime skills wiring, the config and the manifest. It exits 0, and the next step names `harness-init`. A non-global executable path gets the global-install hint. Existing `setup-*` and `contract` tests pass unchanged. Proofs: `proof-install-experience-outside-root`, `proof-install-experience-global-hint`, `proof-install-experience-root-unchanged` |
| 13 | **Wave 2 gate** | 10, 12 | — | `inline` | [ ] Proofs of units 07 to 12 pass. The five wave-1 commands pass. A manual `node dist/cli.js setup` in an empty temp dir writes only the R3.2 set. On failure, **abort** before wave 3 |
| 14 | `doctor` command, output and read-only run | 13 | `src/cli.ts`, `src/doctor/index.ts` (new), `src/doctor/report.ts` (new), `test/doctor.test.ts` | `spawn` | [ ] `wolven-harness doctor [--dir]` prints findings and the summary line in the ADR-005 shape, exits 0 or 1, and rejects unknown args. A folder with no config yields only `doctor-config`. The fixture tree's hashes are unchanged after a run. Proofs: `proof-install-experience-doctor-output`, `proof-install-experience-doctor-readonly` |
| 15 | Doctor runtime checks | 14 | `src/doctor/runtime-checks.ts` (new), `test/doctor-runtime.test.ts` | `spawn` | [ ] `doctor-entry`, `doctor-rules` and `doctor-skills` fire per wired runtime from the registry, and `linked` layouts are followed through `harnessHome`. Proof: `proof-install-experience-doctor-checks` (runtime half) |
| 16 | Doctor environment checks | 14 | `src/doctor/env-checks.ts` (new), `test/doctor-env.test.ts` | `spawn` | [ ] `doctor-docs`, `doctor-qmd`, `doctor-code-repo` and `doctor-not-global` fire on their fixtures, with a stub `PATH`. The audited-shape fixture exits 1 with the expected codes, and the repaired one exits 0. Proofs: `proof-install-experience-doctor-checks` (environment half), `proof-install-experience-no-code-writes`, `proof-install-experience-pm-global` |
| 17 | Doctor drift report | 14 | `src/doctor/drift.ts` (new), `test/doctor-drift.test.ts`, `docs/deferrals/setup-drift-check/` (deleted) | `spawn` | [ ] Each drift class has a fixture that yields its warning, and a manifest-less fixture reports differing files as edited. `doctor-version-behind` fires on an older `packageVersion`. The deferral folder is gone. Proofs: `proof-install-experience-drift`, `proof-install-experience-drift-deferral` |
| 18 | Supersede ADR-004 with ADR-005 | 15, 16, 17 | `test/contract.test.ts`, every live (non-archived) file outside `docs/adrs/` that claims ADR-004, `docs/adrs/adr-004-standalone-skills-contract.md` (status and `superseded_by` only) | `inline` | [ ] Contract tests read ADR-005, and cover the `doctor` codes, `--package-manager`, the runtime ids and the config keys. No live claim targets ADR-004. ADR-004 is `deprecated` with `superseded_by: adr-005-install-anywhere-contract`. Proof: `proof-install-experience-contract` with `pnpm validate` at 0 claim failures |
| 19 | **Wave 3 gate** | 18 | — | `inline` | [ ] Proofs of units 14 to 18 pass. The five commands pass. `node dist/cli.js doctor --dir <fixture>` exits 1 on the audited-shape fixture and 0 on the repaired one. On failure, **abort** before wave 4 |
| 20 | harness-init: harness home and linked layout | 19 | `templates/.agents/skills/harness-init/SKILL.md`, `templates/.agents/skills/harness-init/references/layout.md` (new), their `.agents/skills/harness-init/` copies, `test/harness-init-layout.test.ts` | `spawn` | [ ] The skill asks before `git init`, gitignores `codeRepo` and records `layout: "home"`. For a linked layout, it creates the three symlinks and replaces bootstrap copies only on matching manifest hashes. It forbids moves. Proofs: `proof-install-experience-init-home`, `proof-install-experience-init-linked` |
| 21 | harness-init: commit convention | 20 | `templates/.agents/skills/harness-init/SKILL.md` (convention step), `templates/.agents/skills/harness-init/references/convention.md` (new), their `.agents/skills/harness-init/` copies, `test/harness-init-layout.test.ts` (convention case) | `spawn` | [ ] The step reads 30 subjects, proposes a pattern at 80% agreement, falls back to Conventional Commits, and records both config shapes after confirmation. Proof: `proof-install-experience-convention-init` |
| 22 | code-commit and code-pr follow the recorded convention | 19 | `templates/.agents/skills/code-commit/SKILL.md`, `templates/.agents/skills/code-pr/SKILL.md`, their `.agents/skills/` copies, `test/convention-skills.test.ts` | `spawn` | [ ] Both skills read `commitConvention` for `codeRepo` work and keep Conventional Commits in the harness home. Proof: `proof-install-experience-convention-skills` |
| 23 | harness-doctor core skill | 19 | `templates/.agents/skills/harness-doctor/**` (new), `.agents/skills/harness-doctor/**`, `src/setup/skill-sets.ts` (`CORE_SKILLS`), `AGENTS.md` (skills table row), `test/harness-doctor-skill.test.ts`, `test/skill-sets.test.ts` | `spawn` | [ ] `setup` installs `harness-doctor` with the core set. The skill runs `doctor`, makes one fix per OK and keeps the layout. It refreshes only stale files (updating the manifest entry), shows edited files without changing them, and routes mention-only installs to `harness-init` step 0. Proofs: `proof-install-experience-doctor-skill`, `proof-install-experience-doctor-refresh`, `proof-install-experience-doctor-migrate` |
| 24 | README and site lead with global install and doctor | 19 | `README.md`, `site/index.md`, `site/commands.md`, `site/runtimes.md`, `test/readme-install.test.ts` | `spawn` | [ ] The install docs show the global install in npm, yarn and pnpm forms, `setup` from any folder, and `doctor`. `site/runtimes.md` lists the nine runtimes. Proof: `proof-install-experience-docs` |
| 25 | **Ship gate** | 21, 22, 23, 24 | — | `inline` | [ ] Every acceptance box in the spec is ticked. The five commands pass, plus `pnpm docs:build`. On failure, **abort** before handoff |

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

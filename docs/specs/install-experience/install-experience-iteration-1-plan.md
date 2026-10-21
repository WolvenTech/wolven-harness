---
type: spec
title: Install and use experience — iteration 1 plan
description: Work units for the iteration-1 spec. Wave 1 builds PR 1 (wiring) from 149dde6 without check-and-repair. Wave 2 builds PR 2 (check and repair) on PR 1's head. A finding-to-unit map and a closing unit re-report every review finding.
status: stable
---

# Install and use experience — iteration 1 plan

**Spec:** `docs/specs/install-experience/install-experience-iteration-1-spec.md` (`stable`), which amends `install-experience-spec.md`.
**Next:** after the Human approves → `code-execute`, wave 1, then wave 2.

## Structural gate

- Every new or amended row (R2.1, R2.3, R3.2, R3.4, R5.2, R7.1, R7.3, R7.4, R8.2, R9.1, R9.2, R10–R14) names a proof.
- The base rows that stand keep their base proofs.
- Each wave's gate is named in the spec's Eval / gates table.
- The plan-only findings F1–F6, F11 and F13 have no rows of their own. Each is checked by the unit that fixes it, against the proof of the row it touches (see the finding map).

Gate passed.

## Branches

`code-execute` runs in a branch it is given and cuts none:

- **Wave 1** runs on a branch cut from `149dde6`.
- **Wave 2** runs on a branch cut from PR 1's head, after the wave 1 gate.

Cutting the branches and opening PR 1 and PR 2 belong to `code-pr`, on the Human's ask (spec, Cross-domain leak table).

## Mirrored copies

Each skill or rule file a unit owns under `templates/.agents/` has a copy under `.agents/`, and the unit owns that copy too. Both copies change in the same unit, because the copy tests fail on any drift.

## Work units

### Wave 1 — PR 1, Wiring

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 01 | Split check-and-repair out of the wiring PR | — | `src/doctor/**` (delete); `src/setup/manifest.ts` (delete); the recorder arguments and calls in `src/setup/{apply,runtimes,index}.ts`; the `doctor` case and usage line in `src/cli.ts`; `harness-doctor` in `src/setup/skill-sets.ts`; `src/setup/config.ts` (`layout` accepts `home` only; no `harnessHome`); `templates/.agents/skills/harness-doctor/**` (delete); the linked-layout and bootstrap-copy sections of `harness-init/references/layout.md`; `test/doctor*.test.ts` and `test/harness-doctor-skill.test.ts` (delete); the manifest cases in `test/setup-apply.test.ts` and `test/setup-outside-root.test.ts`; `test/config-keys.test.ts`; the inventory tests that list `harness-doctor` (`ask-only`, `setup-surfaces`, `skill-sets`, the wayfinder listings) | `inline` | [x] `node dist/cli.js doctor` exits 1 as an unknown command. A root run and an outside run write no `.wolven-harness.manifest.json`. A config with `layout: "linked"` or a `harnessHome` key is rejected. Proof: `proof-install-experience-no-manifest` PASS, plus `pnpm build` and `pnpm test` exit 0 |
| 02 | Rules wiring as registry data, with one rules mode | 01 | `src/setup/runtimes.ts` (row `rules` data; `rulesMode()`; the per-id `switch` removed; Antigravity folder marker); `src/setup/summary.ts` (`RUNTIME_NAMES`, `wiringOwner` and the per-id cases replaced by registry data); `test/runtime-registry.test.ts` | `spawn` | [x] Each row states its rules wiring as `link`, `per-rule`, `file`, `imports` or `inline`. Setup and the summary read that data, and nothing outside the registry switches on a runtime id. `rulesMode([claude, cursor, kiro])` is `native`. Antigravity is no longer detected from `.agents/rules` alone (F5). Proofs: `proof-install-experience-registry-data` and `proof-install-experience-rules-mode` PASS (R10.1, R10.2; F10, F12) |
| 03 | Antigravity reads the inline block; rule copies stay create-only | 02 | The Antigravity row in `src/setup/runtimes.ts` (`inline`); `templates/.agents/rules/*.md` (drop `trigger`); the Amp-imports and inline-mode text in `harness-init/references/entry-modes.md`; `test/rules-frontmatter.test.ts`; `test/setup-native-wiring.test.ts` | `spawn` | [x] No rule template carries `trigger`. `--runtimes claude,antigravity` and `--runtimes claude,codex` create no `.claude/rules`. `harness-init` writes the Amp imports only in native mode. Re-running `setup` after a rule edit leaves every copy byte-identical. Proofs: `proof-install-experience-rule-frontmatter`, `proof-install-experience-inline-rules` and `proof-install-experience-rules-create-only` PASS (R2.1, R2.3, R11.3) |
| 04 | Setup refuses a repository subfolder | 01 | `src/setup/options.ts` (`isGitTopLevel`, `resolveOptions` mode decision; the `.git` ancestor search when `git` is not on `PATH`); `src/git.ts` if a helper is needed; `test/setup-outside-root.test.ts` (refusal and outside cases) | `spawn` | [x] In a subfolder of a `git init` repo, with every flag given, `setup` exits 1 before any prompt, the tree is byte-identical, and stderr names the top-level. Outside any repository it still exits 0 with the core skills only. Proofs: `proof-install-experience-subfolder-refused` and `proof-install-experience-outside-root` PASS (R3.4, R3.2; F11) |
| 05 | Global-install hint for pnpm local and `dlx` runs | 04 | `globalInstallHint` and `NON_GLOBAL_EXEC` in `src/setup/index.ts`, or their new home in `src/setup/package-manager.ts`; the hint cases in `test/setup-outside-root.test.ts` | `spawn` | [x] An `execPath` under `node_modules/.pnpm/…`, a pnpm `dlx` cache or an npm `_npx` cache gets the hint in the resolved manager's form. A global install path gets none. Proof: `proof-install-experience-global-hint` PASS with the pnpm cases added (R3.3 for setup; F3) |
| 06 | Install docs without `doctor` | 01 | `README.md`; `site/commands.md`, `site/index.md`, `site/runtimes.md`, `site/skills.md` and `site/harness-init.md`; `test/readme-install.test.ts` | `spawn` | [x] README and the site lead with the global install and `setup` outside a repository, in npm, yarn and pnpm forms, and say nothing about `doctor`. `pnpm docs:build` exits 0. Proof: `proof-install-experience-docs` PASS for its PR 1 half (R9.2) |
| 07 | Revise ADR-005 to what PR 1 ships | 03, 04, 05 | `docs/adrs/adr-005-install-anywhere-contract.md`; `test/contract.test.ts`; any claim the revision moves | `inline` | [x] Revised through the `adr` skill. ADR-005 records setup outside any repository, the subfolder refusal, `--package-manager`, the registry runtime ids, and the config keys `packageManager`, `layout` (`home` only), `codeRepo` and `commitConvention`. It names no `doctor` command, finding code, manifest, `harnessHome` or `linked` value. The Human has confirmed the revised text. Proof: `proof-install-experience-contract` PASS for ADR-005, with 0 claim failures (R9.1, PR 1 half) |
| 08 | **Wave 1 gate** | 01–07 | — | `inline` | [x] `pnpm build && pnpm test && pnpm lint && pnpm validate && pnpm comments` exit 0. Each box under the spec's Acceptance › Wave 1 is ticked, with its proof PASS. `proof-install-experience-pr1-surface` holds: no `src/doctor/` and no `templates/.agents/skills/harness-doctor/`, `doctor` is an unknown command, ADR-005 has no doctor text, `linked` is rejected, and `docs/deferrals/setup-drift-check/` is still present. On failure, **abort** before wave 2 |

### Wave 2 — PR 2, Check and repair

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 09 | Restore check-and-repair on PR 1's head | 08 | Restored from `149dde6`: `src/doctor/**`, `templates/.agents/skills/harness-doctor/**`, the linked-layout and bootstrap sections of `layout.md`, and `test/doctor*.test.ts` with `test/harness-doctor-skill.test.ts`. Also the `doctor` case in `src/cli.ts`, `harness-doctor` in `src/setup/skill-sets.ts`, `linked` and `harnessHome` in `src/setup/config.ts`, and the inventory tests | `inline` | [ ] `node dist/cli.js doctor --help` runs, and `harness-doctor` installs with the core set. No restored file imports `src/setup/manifest.ts`. Drift cases that relied on the manifest are marked `todo` until unit 16. Proof: `pnpm build` exits 0, and `pnpm test` exits 0 apart from those `todo` cases |
| 10 | Doctor reads registry data from the open folder | 09 | `src/doctor/runtime-checks.ts` (entry, rules and skills checks); `test/doctor-runtime.test.ts`; `test/doctor.test.ts` (the claude-and-codex fixture) | `spawn` | [ ] `doctor` checks each runtime against its row's rules data and `rulesMode()`. In inline mode it checks the block once and names every runtime that reads it. It resolves wiring under the open folder, following symlinks. A claude-and-codex install with a complete inline block exits 0 (F1). A linked fixture whose Cursor rule files exist only in the harness home fails `doctor-rules`. Proofs: `proof-install-experience-doctor-checks` (R7.1) and `proof-install-experience-doctor-open-folder` (R12.2) PASS. F12, doctor side |
| 11 | Rule copies are checked against their rules | 10 | `src/doctor/runtime-checks.ts` (`doctor-rules-stale`); `src/doctor/report.ts` (the new code); `test/doctor-runtime.test.ts` (stale cases) | `spawn` | [ ] After editing one rule, `doctor` exits 1 with `doctor-rules-stale` for Cursor, Copilot and Kiro, and likewise for the inline block (Codex, Antigravity). An orphan `wolven-` copy is reported, and an untouched install gives no such finding. Proof: `proof-install-experience-rules-stale` PASS (R11.1; F9) |
| 12 | `doctor-code-repo` checks harness-owned paths only | 09 | The code-repository check in `src/doctor/env-checks.ts`; its cases in `test/doctor-env.test.ts` | `spawn` | [ ] A code repository holding its own `.claude/settings.json` gives no `doctor-code-repo` finding. `.agents/`, `.wolven-harness.json`, `WOLVEN.md`, `.qmd/`, a `.claude/skills` or `.claude/rules` link into the harness home, or `.kiro/steering/wolven-*` still give one. The paths come from the registry, not a fixed list. Proof: `proof-install-experience-no-code-writes` PASS with the false-positive case added (R5.3; F2) |
| 13 | qmd reachable from the open folder | 12 | The qmd check in `src/doctor/env-checks.ts`; the `.qmd` link and the drift-based bootstrap condition in `harness-init/references/layout.md`; `test/doctor-env.test.ts` (qmd cases); `test/harness-init-layout.test.ts` | `spawn` | [ ] With a stub `qmd` on `PATH`, `doctor` walks up from the open folder as qmd 2.5.3 does. A linked fixture without the `.qmd` link fails, and passes once linked. A nearest `.qmd` that belongs to another folder fails. The linked-layout step lists four links, `.qmd` included, and its replacement condition names `doctor-drift-edited`. Proofs: `proof-install-experience-qmd-reach` (R12.1) and `proof-install-experience-init-linked` (R5.2) PASS. F7 |
| 14 | `doctor` gives the global-install hint | 13 | The not-global check in `src/doctor/env-checks.ts` (reads `execPath`, reuses unit 05's hint); its cases in `test/doctor-env.test.ts` and `test/doctor.test.ts` | `spawn` | [ ] With an `execPath` under `node_modules/.pnpm/…` or `_npx`, `doctor` prints the global-install command in the resolved manager's form. With `wolven-harness` on the injected `PATH`, `doctor-not-global` stays quiet. Proofs: `proof-install-experience-global-hint` for `doctor` and `proof-install-experience-pm-global` PASS (R3.3, R4.2, R4.4; F4) |
| 15 | Known forms table | 09 | A generator script and the committed table (names chosen here; the table ships under `"files"`); a `package.json` script; a new known-forms test | `spawn` | [ ] The script rebuilds the table from tags `v0.1.0`–`v0.3.2` and the working tree. Its output is committed and only ever grows. Removing a current template form, or a rendered `.qmd/index.yml` form, from the table fails the test. Proof: `proof-install-experience-known-forms` PASS (R13.1; F8, part 1) |
| 16 | Drift classified without a manifest | 15 | `src/doctor/drift.ts`; exports in `src/setup/apply.ts` and `src/setup/runtimes.ts` for the helpers drift reuses (`INSTALLED_AS`, `toPosix`, the template selection, `readRules`, `stripFrontmatter`); `test/doctor-drift.test.ts` | `spawn` | [ ] On a fixture built from `v0.3.2`'s templates with one file edited, untouched files that have changed since are `doctor-drift-stale` and the edited file is `doctor-drift-edited`. The run makes no network call and reads no manifest. After refreshing the stale files only the edited file remains. `drift.ts` re-implements no setup helper (F13), and the `todo` cases from unit 09 are gone. Proofs: `proof-install-experience-drift` (R7.4), `proof-install-experience-drift-earlier` (R13.2) and `proof-install-experience-drift-after-refresh` (R13.3) PASS. F8, part 2 |
| 17 | `harness-doctor` repairs stale copies and drift without a manifest | 11, 16 | `templates/.agents/skills/harness-doctor/SKILL.md`; `test/harness-doctor-skill.test.ts` | `spawn` | [ ] The skill never mentions a manifest. For `doctor-drift-stale` it replaces one file at a time after a yes. For `doctor-rules-stale` it shows the diff, asks, and then either deletes the copy and re-runs `setup`, or rewrites the inline block between its markers. The `doctor-rules` row no longer says `setup` writes the inline block (F6). Proofs: `proof-install-experience-doctor-refresh` (R8.2) and `proof-install-experience-rules-refresh` (R11.2) PASS |
| 18 | Successor ADR records `doctor` | 11, 14, 16, 17 | A new `docs/adrs/adr-NNN-<slug>.md`; `docs/adrs/adr-005-install-anywhere-contract.md` (`deprecated`, `superseded_by`); every claim repointed; `test/contract.test.ts`; `docs/deferrals/setup-drift-check/` (delete) | `inline` | [ ] Created through the `adr` skill as a draft and promoted on the Human's word. It carries ADR-005 forward and adds `doctor` (flags, output, exits, codes including `doctor-rules-stale`), `layout: "linked"` and `harnessHome`. ADR-005 is deprecated, and the deferral folder is gone. Proofs: `proof-install-experience-contract` PASS for ADR-NNN with 0 claim failures (R9.1, PR 2 half), and `proof-install-experience-drift-deferral` PASS (R9.3) |
| 19 | Install docs with `doctor` | 17 | `README.md`; `site/commands.md`; `site/index.md`; `site/skills.md`; `test/readme-install.test.ts` | `spawn` | [ ] README and the site add `doctor` and `harness-doctor`, with its codes as unit 11 and unit 14 left them, in npm, yarn and pnpm forms. `pnpm docs:build` exits 0. Proof: `proof-install-experience-docs` PASS for its PR 2 half (R9.2) |
| 20 | **Wave 2 gate** | 10–19 | — | `inline` | [ ] `pnpm build && pnpm test && pnpm lint && pnpm validate && pnpm comments` exit 0. Each box under the spec's Acceptance › Wave 2 is ticked. The doctor smoke runs `node dist/cli.js doctor --dir` on four fixtures and exits 1 on the audited shape, 0 on the repaired one, 0 on the linked one and 0 on the claude-and-codex one. `proof-install-experience-pr2-surface` holds. On failure, **abort** |
| 21 | **Ship gate:** re-report every finding | 20 | This plan's Finding map (Outcome column) | `inline` | [ ] Each finding F1–F14 is marked `fixed`, `skipped` or `no_change_needed`, with the unit and proof that closed it. Every `skipped` names a reason the Human accepted. `harness:validate` PASS |

## Finding map

| Finding | Unit | Proof that closes it | Outcome |
|---|---|---|---|
| F1 doctor fails claude+codex | 10 | `proof-install-experience-doctor-checks` (claude-and-codex fixture) | |
| F2 `doctor-code-repo` false positive | 12 | `proof-install-experience-no-code-writes` | |
| F3 hint misses pnpm | 05 | `proof-install-experience-global-hint` | |
| F4 doctor never hints | 14 | `proof-install-experience-global-hint`, `proof-install-experience-pm-global` | |
| F5 Antigravity folder marker | 02 | `proof-install-experience-registry-data` | |
| F6 skill says setup writes the inline block | 17 | `proof-install-experience-doctor-refresh` | |
| F7 linked layout qmd | 13 | `proof-install-experience-qmd-reach`, `proof-install-experience-init-linked` | |
| F8 earlier installs never tracked | 15, 16 | `proof-install-experience-known-forms`, `proof-install-experience-drift-earlier` | |
| F9 rule copies never refreshed | 03, 11, 17 | `proof-install-experience-rules-create-only`, `proof-install-experience-rules-stale`, `proof-install-experience-rules-refresh` | |
| F10 rules mode per runtime | 02, 03 | `proof-install-experience-rules-mode`, `proof-install-experience-inline-rules` | |
| F11 setup writes into a repo subfolder | 04 | `proof-install-experience-subfolder-refused` | |
| F12 runtime knowledge in five places | 02, 10 | `proof-install-experience-registry-data` | |
| F13 doctor re-implements setup helpers | 16 | unit 16's Done when (scan of `drift.ts`) | |
| F14 committed map page | — | Withdrawn by the reviewer | `no_change_needed` |

## Wave stops

| Stop | After | Gate |
|------|-------|------|
| **1** | 08 | The spec's Wave 1 acceptance, `proof-install-experience-pr1-surface` and `harness:validate` PASS. **Abort before wave 2.** PR 1 opens only through `code-pr`, on the Human's ask |
| **2** | 20 | The spec's Wave 2 acceptance, the doctor smoke, `proof-install-experience-pr2-surface` and `harness:validate` PASS. **Abort.** |
| **Ship** | 21 | Every finding re-reported; `harness:validate` PASS |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
|---|---|---|---|---|---|
| `U-qmd-lookup` | What `doctor` does if a later qmd release changes how it finds `.qmd/` | Human | Non-blocking | Follow qmd 2.5.3; revisit when qmd's release notes change `findLocalConfigPath` (spec) | 13 |
| `U-deepseek` | Which product "DeepSeek" names as a runtime | Human | Non-blocking | Add a registry row once named and researched (base spec) | — |
| `U-more-runtimes` | Native strategies for Compozy's other agents | Human | Non-blocking | Not registry rows in v1 (base spec) | — |
| `U-copilot-surfaces` | Which Copilot surfaces read `AGENTS.md` and `.github/instructions/` | Human | Non-blocking | `doctor` checks the files only (base spec) | 11 |
| `U-qmd-freshness` | Whether `doctor` should flag a stale index | Human | Non-blocking | v1 checks reachability and `index.sqlite` only (base spec) | 13 |

No row blocks a wave.

## Frontier order

**Wave 1:** 01 → (02 ∥ 04 ∥ 06) → (03 after 02; 05 after 04) → 07 → **08 STOP**

**Wave 2:** 09 → (10 ∥ 12 ∥ 15) → (11 after 10; 13 after 12; 16 after 15) → (14 after 13; 17 after 11 and 16) → (18 after 14 and 17; 19 after 17) → **20 STOP** → **21 ship**

Units run in parallel only when their Owns are disjoint. Units 10 and 11 share `runtime-checks.ts`, and units 12, 13 and 14 share `env-checks.ts`, so each of those runs in order. Unit 18 waits for the finding codes and config values it records. Wave 2 never packs into wave 1's batch.

## Pragmatic-guard check

Each unit maps to a spec row or a review finding. No unit adds a command, flag, dependency or config key the spec does not name.

- The generator script in unit 15 is the spec's own R13.1 obligation.
- Unit 09 restores code from `149dde6` rather than rewriting it.

## Execution / resume section

### Unit 01 — Split check-and-repair out of the wiring PR

| Field | Value |
|-------|-------|
| Unit identifier | 01 — first frontier unit, inline |
| Spec/plan paths | `docs/specs/install-experience/install-experience-iteration-1-spec.md` / `docs/specs/install-experience/install-experience-iteration-1-plan.md` |
| Obligation / proof status | R7.3, R14.1 — build PASS; unknown doctor exit 1 PASS; no-manifest root/outside PASS; config rejection PASS; full suite, comments and validate PASS (887 tests) |
| `HEAD` commit | `149dde6` |
| `git status` summary | dirty — approved wave 1 implementation, recovered planning docs and restored deferral only; no unrelated files; all executors released |
| Intended diff scope | Unit 01 Owns in the Work units table, mirrored layout/skill copies, and retired linked-layout / doctor contract tests (test-sync); guide inventory count; restored setup-drift-check deferral |
| Decision on every discrepancy | Resolved: Human authorized recovery here; recovered exact approved planning documents from `cb43827` after locating that commit; no changes from its other worktree are imported and returned to the existing branch. Commit once per wave by explicit Human instruction (overrides absent config defaults). |

### Unit 02 — Rules wiring as registry data, with one rules mode

| Field | Value |
|-------|-------|
| Unit identifier | 02 — frontier after 01, spawn |
| Spec/plan paths | `docs/specs/install-experience/install-experience-iteration-1-spec.md` / `docs/specs/install-experience/install-experience-iteration-1-plan.md` |
| Obligation / proof status | R10.1 and R10.2 PASS in parent full gate, including the approved equivalent registry lookups |
| `HEAD` commit | `149dde6` |
| `git status` summary | dirty — approved wave 1 implementation, recovered planning docs and restored deferral only; no unrelated files; all executors released |
| Intended diff scope | Exactly unit 02 Owns in the Work units table; mirrored skill/rule copies included |
| Decision on every discrepancy | Resolved: retain unit 01 work and approved docs, isolate this unit to Owns. Guide inventory count already corrected for removal; unit 06 owns remaining guide text. Restored the setup-drift-check deferral deleted in the base implementation, as R14.1 requires, and repointed its claim to the current contract. Commit once per wave by Human instruction. |

### Unit 04 — Setup refuses a repository subfolder

| Field | Value |
|-------|-------|
| Unit identifier | 04 — frontier after 01, spawn |
| Spec/plan paths | `docs/specs/install-experience/install-experience-iteration-1-spec.md` / `docs/specs/install-experience/install-experience-iteration-1-plan.md` |
| Obligation / proof status | R3.4, R3.2 — PASS: parent reran all 6 outside-root tests, including no-git ancestor fallback; comments/validate PASS |
| `HEAD` commit | `149dde6` |
| `git status` summary | dirty — approved wave 1 implementation, recovered planning docs and restored deferral only; no unrelated files; all executors released |
| Intended diff scope | Exactly unit 04 Owns in the Work units table; mirrored skill/rule copies included |
| Decision on every discrepancy | Resolved: retain unit 01 work and approved docs, isolate this unit to Owns. Guide inventory count already corrected for removal; unit 06 owns remaining guide text. Restored the setup-drift-check deferral deleted in the base implementation, as R14.1 requires, and repointed its claim to the current contract. Commit once per wave by Human instruction. |

### Unit 06 — Install docs without doctor

| Field | Value |
|-------|-------|
| Unit identifier | 06 — frontier after 01, spawn |
| Spec/plan paths | `docs/specs/install-experience/install-experience-iteration-1-spec.md` / `docs/specs/install-experience/install-experience-iteration-1-plan.md` |
| Obligation / proof status | R9.2 — PASS: parent reran docs/listing tests (19/19) and pnpm docs:build (exit 0); comments/validate PASS |
| `HEAD` commit | `149dde6` |
| `git status` summary | dirty — approved wave 1 implementation, recovered planning docs and restored deferral only; no unrelated files; all executors released |
| Intended diff scope | Exactly unit 06 Owns in the Work units table; mirrored skill/rule copies included |
| Decision on every discrepancy | Resolved: retain unit 01 work and approved docs, isolate this unit to Owns. Guide inventory count already corrected for removal; unit 06 owns remaining guide text. Restored the setup-drift-check deferral deleted in the base implementation, as R14.1 requires, and repointed its claim to the current contract. Commit once per wave by Human instruction. |

### Unit 05 — Global-install hint for pnpm local and dlx runs

| Field | Value |
|-------|-------|
| Unit identifier | 05 — after proven unit 04, spawn |
| Spec/plan paths | `docs/specs/install-experience/install-experience-iteration-1-spec.md` / `docs/specs/install-experience/install-experience-iteration-1-plan.md` |
| Obligation / proof status | R3.3 — PASS: parent reran global-hint with all 6 outside-root cases; comments/validate PASS |
| `HEAD` commit | `149dde6` |
| `git status` summary | dirty — approved wave 1 implementation, recovered planning docs and restored deferral only; no unrelated files; all executors released |
| Intended diff scope | `src/setup/index.ts` global-install hint and hint cases in `test/setup-outside-root.test.ts`, or helper in `src/setup/package-manager.ts` |
| Decision on every discrepancy | Resolved: retain earlier units and other agents' edits; unit 04 has released its test file. Human authorizes one commit per wave. |

### Unit 03 — Antigravity reads the inline block; rule copies stay create-only

| Field | Value |
|-------|-------|
| Unit identifier | 03 — implementation frontier after unit 02 wiring, spawn |
| Spec/plan paths | `docs/specs/install-experience/install-experience-iteration-1-spec.md` / `docs/specs/install-experience/install-experience-iteration-1-plan.md` |
| Obligation / proof status | R2.1, R2.3, R11.3 — PASS: parent reran 13 focused tests; comments/validate PASS |
| `HEAD` commit | `149dde6` |
| `git status` summary | dirty — approved wave 1 implementation, recovered planning docs and restored deferral only; no unrelated files; all executors released |
| Intended diff scope | Unit 03 Owns from Work units table; runtimes.ts read-only because its approved Antigravity inline row already landed in unit 02 |
| Decision on every discrepancy | Resolved: unit 02 has released runtimes/summary; its source-scope blocker was outside unit 03 and is now resolved by Human approval. Run independent rule-template, entry-modes and native-wiring work without marking unit 02 done. No overlap with active edits. Integration test-sync updates `test/harness-init-entry.test.ts` to assert both inline runtimes rather than Codex alone; retires obsolete subfolder-success test in `test/setup-options.test.ts` because unit 04 proves refusal with stronger byte/prompt checks. |

### Unit 07 — Revise ADR-005 to what PR 1 ships

| Field | Value |
|-------|-------|
| Unit identifier | 07 — inline after proven units 03, 04 and 05 |
| Spec/plan paths | `docs/specs/install-experience/install-experience-iteration-1-spec.md` / `docs/specs/install-experience/install-experience-iteration-1-plan.md` |
| Obligation / proof status | R9.1 — confirmed by Human; contract/config proofs and full wave gate PASS |
| `HEAD` commit | `149dde6` |
| `git status` summary | dirty — approved wave 1 implementation, recovered planning docs and restored deferral only; no unrelated files; all executors released |
| Intended diff scope | `docs/adrs/adr-005-install-anywhere-contract.md`, `test/contract.test.ts`; remove reserved rejected key from config key inventory for unit 01 consistency |
| Decision on every discrepancy | Resolved: revise existing ADR in place under approved D5; retain stable status so existing claims resolve; do not mark done or commit before Human confirms revised text. The registry scan scope conflict is resolved by the Human-approved exception, and its proof passes. |

### Wave 1 result

All five spawned executors used `gpt-6-luna` at `low` effort. The Human
confirmed revised ADR-005 and authorized equivalent registry lookups in
`src/skills/install.ts` and `src/validate/spine.ts`. Their behavior and
validator path set are preserved. No proof was weakened or skipped.

Parent gate: `pnpm build` PASS; `pnpm test` PASS (892/892); `pnpm lint` PASS;
`pnpm validate` PASS (116 claims, 0 failures); `pnpm comments` PASS
(0 findings). `pnpm docs:build` PASS. All wave 1 acceptance proofs pass.
Static surface checks pass: removed source, skill and recording module
absent; revised ADR excludes check-and-repair; the setup-drift-check
deferral is restored. `doctor` exits 1 as unknown; config tests reject
unsupported layout/key inputs. `git diff --check` PASS.

Validated base: branch `claude/blissful-snyder-4e61fd`, HEAD `149dde6`.
The atomic per-wave commit carries the approved implementation, recovered
planning documents, source-scope clarification and only wave 1 completion
marks. No active executors, unrelated changes, push or PR. **STOP after
wave 1's commit.** Wave 2 remains unchecked and has not started.

### Unit 02 — Approved source-scope reconciliation

| Field | Value |
|-------|-------|
| Unit identifier | 02 — finish registry-data source proof, spawn |
| Spec/plan paths | `docs/specs/install-experience/install-experience-iteration-1-spec.md` / `docs/specs/install-experience/install-experience-iteration-1-plan.md` |
| Obligation / proof status | R10.1 and R10.2 — PASS: executor 56/56 focused tests and parent full gate 892/892 |
| `HEAD` commit | `149dde6` |
| `git status` summary | dirty — approved wave 1 implementation, recovered planning docs and restored deferral only; no unrelated files; all executors released |
| Intended diff scope | `src/skills/install.ts`, `src/validate/spine.ts`, and unit 02 registry tests only if needed |
| Decision on every discrepancy | Resolved: Human explicitly authorized equivalent registry lookups in both excluded modules, preserving command and validator behavior; revised ADR-005 also confirmed. One commit per wave after green gate. |

### Unit 08 — Wave 1 gate

| Field | Value |
|-------|-------|
| Unit identifier | 08 — final wave 1 frontier, inline, STOP after commit |
| Spec/plan paths | `docs/specs/install-experience/install-experience-iteration-1-spec.md` / `docs/specs/install-experience/install-experience-iteration-1-plan.md` |
| Obligation / proof status | R14.1 and all wave 1 acceptance proofs — PASS; 892 tests, build, lint, validate, comments and site build exit 0 |
| `HEAD` commit | `149dde6` |
| `git status` summary | dirty — approved wave 1 implementation, recovered planning docs and restored deferral only; no unrelated files; all executors released |
| Intended diff scope | Wave 1 completion marks and reconciled execution state in plan/spec, atomic with approved wave 1 implementation |
| Decision on every discrepancy | Resolved: Human approved source-scope exceptions and revised ADR; commits per wave; no wave 2, push or PR. Registry cleanup proven by executor (56 tests); parent runs fresh full gate now. |

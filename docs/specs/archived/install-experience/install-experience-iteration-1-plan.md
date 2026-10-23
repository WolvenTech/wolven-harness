---
type: spec
title: Install and use experience — iteration 1 plan
description: Work units for the iteration-1 spec. Wave 1 builds PR 1 (wiring) from 149dde6 without check-and-repair. Wave 2 builds PR 2 (check and repair) on PR 1's head. A finding-to-unit map and a closing unit re-report every review finding.
status: deprecated
---

# Install and use experience — iteration 1 plan

**Current public contract:** [ADR-006](../../../adrs/adr-006-install-check-and-repair-contract.md). Historical wiring-only references below describe the predecessor on the PR 1 branch.

**Spec:** `docs/specs/archived/install-experience/install-experience-iteration-1-spec.md` (`deprecated`), which amends `install-experience-spec.md`.
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
| 07 | Revise the wiring-only predecessor to what PR 1 ships | 03, 04, 05 | the wiring-only predecessor under `docs/adrs/`; `test/contract.test.ts`; any claim the revision moves | `inline` | [x] Revised through the `adr` skill. The wiring-only predecessor records setup outside any repository, the subfolder refusal, `--package-manager`, the registry runtime ids, and the config keys `packageManager`, `layout` (`home` only), `codeRepo` and `commitConvention`. It names no `doctor` command, finding code, manifest, `harnessHome` or `linked` value. The Human has confirmed the revised text. Proof: `proof-install-experience-contract` PASS for the wiring-only predecessor, with 0 claim failures (R9.1, PR 1 half) |
| 08 | **Wave 1 gate** | 01–07 | — | `inline` | [x] `pnpm build && pnpm test && pnpm lint && pnpm validate && pnpm comments` exit 0. Each box under the spec's Acceptance › Wave 1 is ticked, with its proof PASS. `proof-install-experience-pr1-surface` holds: no `src/doctor/` and no `templates/.agents/skills/harness-doctor/`, `doctor` is an unknown command, the wiring-only predecessor has no doctor text, `linked` is rejected, and `docs/deferrals/setup-drift-check/` is still present. On failure, **abort** before wave 2 |

### Wave 2 — PR 2, Check and repair

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 09 | Restore check-and-repair on PR 1's head | 08 | Restored from `149dde6`: `src/doctor/**`, `templates/.agents/skills/harness-doctor/**`, the linked-layout and bootstrap sections of `layout.md`, and `test/doctor*.test.ts` with `test/harness-doctor-skill.test.ts`. Also the `doctor` case in `src/cli.ts`, `harness-doctor` in `src/setup/skill-sets.ts`, `linked` and `harnessHome` in `src/setup/config.ts`, and the inventory tests | `inline` | [x] `node dist/cli.js doctor --help` runs, and `harness-doctor` installs with the core set. No restored file imports `src/setup/manifest.ts`. Drift cases that relied on the manifest are marked `todo` until unit 16. Proof: `pnpm build` exits 0, and `pnpm test` exits 0 apart from those `todo` cases |
| 10 | Doctor reads registry data from the open folder | 09 | `src/doctor/runtime-checks.ts` (entry, rules and skills checks); `test/doctor-runtime.test.ts`; `test/doctor.test.ts` (the claude-and-codex fixture) | `spawn` | [x] `doctor` checks each runtime against its row's rules data and `rulesMode()`. In inline mode it checks the block once and names every runtime that reads it. It resolves wiring under the open folder, following symlinks. A claude-and-codex install with a complete inline block exits 0 (F1). A linked fixture whose Cursor rule files exist only in the harness home fails `doctor-rules`. Proofs: `proof-install-experience-doctor-checks` (R7.1) and `proof-install-experience-doctor-open-folder` (R12.2) PASS. F12, doctor side |
| 11 | Rule copies are checked against their rules | 10 | `src/doctor/runtime-checks.ts` (`doctor-rules-stale`); `src/doctor/report.ts` (the new code); `test/doctor-runtime.test.ts` (stale cases) | `spawn` | [x] After editing one rule, `doctor` exits 1 with `doctor-rules-stale` for Cursor, Copilot and Kiro, and likewise for the inline block (Codex, Antigravity). An orphan `wolven-` copy is reported, and an untouched install gives no such finding. Proof: `proof-install-experience-rules-stale` PASS (R11.1; F9) |
| 12 | `doctor-code-repo` checks harness-owned paths only | 09 | The code-repository check in `src/doctor/env-checks.ts`; its cases in `test/doctor-env.test.ts` | `spawn` | [x] A code repository holding its own `.claude/settings.json` gives no `doctor-code-repo` finding. `.agents/`, `.wolven-harness.json`, `WOLVEN.md`, `.qmd/`, a `.claude/skills` or `.claude/rules` link into the harness home, or `.kiro/steering/wolven-*` still give one. The paths come from the registry, not a fixed list. Proof: `proof-install-experience-no-code-writes` PASS with the false-positive case added (R5.3; F2) |
| 13 | qmd reachable from the open folder | 12 | The qmd check in `src/doctor/env-checks.ts`; the `.qmd` link and the drift-based bootstrap condition in `harness-init/references/layout.md`; `test/doctor-env.test.ts` (qmd cases); `test/harness-init-layout.test.ts` | `spawn` | [x] With a stub `qmd` on `PATH`, `doctor` walks up from the open folder as qmd 2.5.3 does. A linked fixture without the `.qmd` link fails, and passes once linked. A nearest `.qmd` that belongs to another folder fails. The linked-layout step lists four links, `.qmd` included, and its replacement condition names `doctor-drift-edited`. Proofs: `proof-install-experience-qmd-reach` (R12.1) and `proof-install-experience-init-linked` (R5.2) PASS. F7 |
| 14 | `doctor` gives the global-install hint | 13 | The not-global check in `src/doctor/env-checks.ts` (reads `execPath`, reuses unit 05's hint); its cases in `test/doctor-env.test.ts` and `test/doctor.test.ts` | `spawn` | [x] With an `execPath` under `node_modules/.pnpm/…` or `_npx`, `doctor` prints the global-install command in the resolved manager's form. With `wolven-harness` on the injected `PATH`, `doctor-not-global` stays quiet. Proofs: `proof-install-experience-global-hint` for `doctor` and `proof-install-experience-pm-global` PASS (R3.3, R4.2, R4.4; F4) |
| 15 | Known forms table | 09 | A generator script and the committed table (names chosen here; the table ships under `"files"`); a `package.json` script; a new known-forms test | `spawn` | [x] The script rebuilds the table from tags `v0.1.0`–`v0.3.2` and the working tree. Its output is committed and only ever grows. Removing a current template form, or a rendered `.qmd/index.yml` form, from the table fails the test. Proof: `proof-install-experience-known-forms` PASS (R13.1; F8, part 1) |
| 16 | Drift classified without a manifest | 15 | `src/doctor/drift.ts`; exports in `src/setup/apply.ts` and `src/setup/runtimes.ts` for the helpers drift reuses (`INSTALLED_AS`, `toPosix`, the template selection, `readRules`, `stripFrontmatter`); `test/doctor-drift.test.ts` | `spawn` | [x] On a fixture built from `v0.3.2`'s templates with one file edited, untouched files that have changed since are `doctor-drift-stale` and the edited file is `doctor-drift-edited`. The run makes no network call and reads no manifest. After refreshing the stale files only the edited file remains. `drift.ts` re-implements no setup helper (F13), and the `todo` cases from unit 09 are gone. Proofs: `proof-install-experience-drift` (R7.4), `proof-install-experience-drift-earlier` (R13.2) and `proof-install-experience-drift-after-refresh` (R13.3) PASS. F8, part 2 |
| 17 | `harness-doctor` repairs stale copies and drift without a manifest | 11, 16 | `templates/.agents/skills/harness-doctor/SKILL.md`; `test/harness-doctor-skill.test.ts` | `spawn` | [x] The skill never mentions a manifest. For `doctor-drift-stale` it replaces one file at a time after a yes. For `doctor-rules-stale` it shows the diff, asks, and then either deletes the copy and re-runs `setup`, or rewrites the inline block between its markers. The `doctor-rules` row no longer says `setup` writes the inline block (F6). Proofs: `proof-install-experience-doctor-refresh` (R8.2) and `proof-install-experience-rules-refresh` (R11.2) PASS |
| 18 | Successor ADR records `doctor` | 11, 14, 16, 17 | `docs/adrs/adr-006-install-check-and-repair-contract.md`; the wiring-only predecessor under `docs/adrs/` (`deprecated`, `superseded_by`); every claim repointed; `test/contract.test.ts`; `docs/deferrals/setup-drift-check/` (delete) | `inline` | [x] Created through the `adr` skill as a draft and promoted on the Human's word. It carries the wiring-only predecessor forward and adds `doctor` (flags, output, exits, codes including `doctor-rules-stale`), `layout: "linked"` and `harnessHome`. The wiring-only predecessor is deprecated, and the deferral folder is gone. Proofs: `proof-install-experience-contract` PASS for ADR-006 with 0 claim failures (R9.1, PR 2 half), and `proof-install-experience-drift-deferral` PASS (R9.3) |
| 19 | Install docs with `doctor` | 17 | `README.md`; `site/commands.md`; `site/index.md`; `site/skills.md`; `test/readme-install.test.ts` | `spawn` | [x] README and the site add `doctor` and `harness-doctor`, with its codes as unit 11 and unit 14 left them, in npm, yarn and pnpm forms. `pnpm docs:build` exits 0. Proof: `proof-install-experience-docs` PASS for its PR 2 half (R9.2) |
| 20 | **Wave 2 gate** | 10–19 | — | `inline` | [x] `pnpm build && pnpm test && pnpm lint && pnpm validate && pnpm comments` exit 0. Each box under the spec's Acceptance › Wave 2 is ticked. The doctor smoke runs `node dist/cli.js doctor --dir` on four fixtures and exits 1 on the audited shape, 0 on the repaired one, 0 on the linked one and 0 on the claude-and-codex one. `proof-install-experience-pr2-surface` holds. On failure, **abort** |
| 21 | **Ship gate:** re-report every finding | 20 | This plan's Finding map (Outcome column) | `inline` | [x] Each finding F1–F14 is marked `fixed`, `skipped` or `no_change_needed`, with the unit and proof that closed it. Every `skipped` names a reason the Human accepted. `harness:validate` PASS |

## Finding map

| Finding | Unit | Proof that closes it | Outcome |
|---|---|---|---|
| F1 doctor fails claude+codex | 10 | `proof-install-experience-doctor-checks` (claude-and-codex fixture) | `fixed` |
| F2 `doctor-code-repo` false positive | 12 | `proof-install-experience-no-code-writes` | `fixed` |
| F3 hint misses pnpm | 05 | `proof-install-experience-global-hint` | `fixed` |
| F4 doctor never hints | 14 | `proof-install-experience-global-hint`, `proof-install-experience-pm-global` | `fixed` |
| F5 Antigravity folder marker | 02 | `proof-install-experience-registry-data` | `fixed` |
| F6 skill says setup writes the inline block | 17 | `proof-install-experience-doctor-refresh` | `fixed` |
| F7 linked layout qmd | 13 | `proof-install-experience-qmd-reach`, `proof-install-experience-init-linked` | `fixed` |
| F8 earlier installs never tracked | 15, 16 | `proof-install-experience-known-forms`, `proof-install-experience-drift-earlier` | `fixed` |
| F9 rule copies never refreshed | 03, 11, 17 | `proof-install-experience-rules-create-only`, `proof-install-experience-rules-stale`, `proof-install-experience-rules-refresh` | `fixed` |
| F10 rules mode per runtime | 02, 03 | `proof-install-experience-rules-mode`, `proof-install-experience-inline-rules` | `fixed` |
| F11 setup writes into a repo subfolder | 04 | `proof-install-experience-subfolder-refused` | `fixed` |
| F12 runtime knowledge in five places | 02, 10 | `proof-install-experience-registry-data` | `fixed` |
| F13 doctor re-implements setup helpers | 16 | unit 16's Done when (scan of `drift.ts`) | `fixed` |
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
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-iteration-1-spec.md` / `docs/specs/archived/install-experience/install-experience-iteration-1-plan.md` |
| Obligation / proof status | R7.3, R14.1 — build PASS; unknown doctor exit 1 PASS; no-manifest root/outside PASS; config rejection PASS; full suite, comments and validate PASS (887 tests) |
| `HEAD` commit | `149dde6` |
| `git status` summary | dirty — approved wave 1 implementation, recovered planning docs and restored deferral only; no unrelated files; all executors released |
| Intended diff scope | Unit 01 Owns in the Work units table, mirrored layout/skill copies, and retired linked-layout / doctor contract tests (test-sync); guide inventory count; restored setup-drift-check deferral |
| Decision on every discrepancy | Resolved: Human authorized recovery here; recovered exact approved planning documents from `cb43827` after locating that commit; no changes from its other worktree are imported and returned to the existing branch. Commit once per wave by explicit Human instruction (overrides absent config defaults). |

### Unit 02 — Rules wiring as registry data, with one rules mode

| Field | Value |
|-------|-------|
| Unit identifier | 02 — frontier after 01, spawn |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-iteration-1-spec.md` / `docs/specs/archived/install-experience/install-experience-iteration-1-plan.md` |
| Obligation / proof status | R10.1 and R10.2 PASS in parent full gate, including the approved equivalent registry lookups |
| `HEAD` commit | `149dde6` |
| `git status` summary | dirty — approved wave 1 implementation, recovered planning docs and restored deferral only; no unrelated files; all executors released |
| Intended diff scope | Exactly unit 02 Owns in the Work units table; mirrored skill/rule copies included |
| Decision on every discrepancy | Resolved: retain unit 01 work and approved docs, isolate this unit to Owns. Guide inventory count already corrected for removal; unit 06 owns remaining guide text. Restored the setup-drift-check deferral deleted in the base implementation, as R14.1 requires, and repointed its claim to the current contract. Commit once per wave by Human instruction. |

### Unit 04 — Setup refuses a repository subfolder

| Field | Value |
|-------|-------|
| Unit identifier | 04 — frontier after 01, spawn |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-iteration-1-spec.md` / `docs/specs/archived/install-experience/install-experience-iteration-1-plan.md` |
| Obligation / proof status | R3.4, R3.2 — PASS: parent reran all 6 outside-root tests, including no-git ancestor fallback; comments/validate PASS |
| `HEAD` commit | `149dde6` |
| `git status` summary | dirty — approved wave 1 implementation, recovered planning docs and restored deferral only; no unrelated files; all executors released |
| Intended diff scope | Exactly unit 04 Owns in the Work units table; mirrored skill/rule copies included |
| Decision on every discrepancy | Resolved: retain unit 01 work and approved docs, isolate this unit to Owns. Guide inventory count already corrected for removal; unit 06 owns remaining guide text. Restored the setup-drift-check deferral deleted in the base implementation, as R14.1 requires, and repointed its claim to the current contract. Commit once per wave by Human instruction. |

### Unit 06 — Install docs without doctor

| Field | Value |
|-------|-------|
| Unit identifier | 06 — frontier after 01, spawn |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-iteration-1-spec.md` / `docs/specs/archived/install-experience/install-experience-iteration-1-plan.md` |
| Obligation / proof status | R9.2 — PASS: parent reran docs/listing tests (19/19) and pnpm docs:build (exit 0); comments/validate PASS |
| `HEAD` commit | `149dde6` |
| `git status` summary | dirty — approved wave 1 implementation, recovered planning docs and restored deferral only; no unrelated files; all executors released |
| Intended diff scope | Exactly unit 06 Owns in the Work units table; mirrored skill/rule copies included |
| Decision on every discrepancy | Resolved: retain unit 01 work and approved docs, isolate this unit to Owns. Guide inventory count already corrected for removal; unit 06 owns remaining guide text. Restored the setup-drift-check deferral deleted in the base implementation, as R14.1 requires, and repointed its claim to the current contract. Commit once per wave by Human instruction. |

### Unit 05 — Global-install hint for pnpm local and dlx runs

| Field | Value |
|-------|-------|
| Unit identifier | 05 — after proven unit 04, spawn |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-iteration-1-spec.md` / `docs/specs/archived/install-experience/install-experience-iteration-1-plan.md` |
| Obligation / proof status | R3.3 — PASS: parent reran global-hint with all 6 outside-root cases; comments/validate PASS |
| `HEAD` commit | `149dde6` |
| `git status` summary | dirty — approved wave 1 implementation, recovered planning docs and restored deferral only; no unrelated files; all executors released |
| Intended diff scope | `src/setup/index.ts` global-install hint and hint cases in `test/setup-outside-root.test.ts`, or helper in `src/setup/package-manager.ts` |
| Decision on every discrepancy | Resolved: retain earlier units and other agents' edits; unit 04 has released its test file. Human authorizes one commit per wave. |

### Unit 03 — Antigravity reads the inline block; rule copies stay create-only

| Field | Value |
|-------|-------|
| Unit identifier | 03 — implementation frontier after unit 02 wiring, spawn |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-iteration-1-spec.md` / `docs/specs/archived/install-experience/install-experience-iteration-1-plan.md` |
| Obligation / proof status | R2.1, R2.3, R11.3 — PASS: parent reran 13 focused tests; comments/validate PASS |
| `HEAD` commit | `149dde6` |
| `git status` summary | dirty — approved wave 1 implementation, recovered planning docs and restored deferral only; no unrelated files; all executors released |
| Intended diff scope | Unit 03 Owns from Work units table; runtimes.ts read-only because its approved Antigravity inline row already landed in unit 02 |
| Decision on every discrepancy | Resolved: unit 02 has released runtimes/summary; its source-scope blocker was outside unit 03 and is now resolved by Human approval. Run independent rule-template, entry-modes and native-wiring work without marking unit 02 done. No overlap with active edits. Integration test-sync updates `test/harness-init-entry.test.ts` to assert both inline runtimes rather than Codex alone; retires obsolete subfolder-success test in `test/setup-options.test.ts` because unit 04 proves refusal with stronger byte/prompt checks. |

### Unit 07 — Revise the wiring-only predecessor to what PR 1 ships

| Field | Value |
|-------|-------|
| Unit identifier | 07 — inline after proven units 03, 04 and 05 |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-iteration-1-spec.md` / `docs/specs/archived/install-experience/install-experience-iteration-1-plan.md` |
| Obligation / proof status | R9.1 — confirmed by Human; contract/config proofs and full wave gate PASS |
| `HEAD` commit | `149dde6` |
| `git status` summary | dirty — approved wave 1 implementation, recovered planning docs and restored deferral only; no unrelated files; all executors released |
| Intended diff scope | the wiring-only predecessor under `docs/adrs/`, `test/contract.test.ts`; remove reserved rejected key from config key inventory for unit 01 consistency |
| Decision on every discrepancy | Resolved: revise existing ADR in place under approved D5; retain stable status so existing claims resolve; do not mark done or commit before Human confirms revised text. The registry scan scope conflict is resolved by the Human-approved exception, and its proof passes. |

### Wave 1 result

All five spawned executors used `gpt-6-luna` at `low` effort. The Human
confirmed the revised wiring-only predecessor and authorized equivalent registry lookups in
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
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-iteration-1-spec.md` / `docs/specs/archived/install-experience/install-experience-iteration-1-plan.md` |
| Obligation / proof status | R10.1 and R10.2 — PASS: executor 56/56 focused tests and parent full gate 892/892 |
| `HEAD` commit | `149dde6` |
| `git status` summary | dirty — approved wave 1 implementation, recovered planning docs and restored deferral only; no unrelated files; all executors released |
| Intended diff scope | `src/skills/install.ts`, `src/validate/spine.ts`, and unit 02 registry tests only if needed |
| Decision on every discrepancy | Resolved: Human explicitly authorized equivalent registry lookups in both excluded modules, preserving command and validator behavior; the revised wiring-only predecessor also confirmed. One commit per wave after green gate. |

### Unit 08 — Wave 1 gate

| Field | Value |
|-------|-------|
| Unit identifier | 08 — final wave 1 frontier, inline, STOP after commit |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-iteration-1-spec.md` / `docs/specs/archived/install-experience/install-experience-iteration-1-plan.md` |
| Obligation / proof status | R14.1 and all wave 1 acceptance proofs — PASS; 892 tests, build, lint, validate, comments and site build exit 0 |
| `HEAD` commit | `149dde6` |
| `git status` summary | dirty — approved wave 1 implementation, recovered planning docs and restored deferral only; no unrelated files; all executors released |
| Intended diff scope | Wave 1 completion marks and reconciled execution state in plan/spec, atomic with approved wave 1 implementation |
| Decision on every discrepancy | Resolved: Human approved source-scope exceptions and revised ADR; commits per wave; no wave 2, push or PR. Registry cleanup proven by executor (56 tests); parent runs fresh full gate now. |

### Wave 2 start

Branch `claude/install-check-and-repair`, cut from PR 1's head
`claude/install-wiring` @ `3c73202` (wave 1 `3040c35` plus two docs
commits). Run by Claude Code (Opus 5.5) as parent; `spawn` units run as
Sonnet subagents. No `.agents/code-commit.config.yml`, so the defaults
`autocommit: false` and `autocommit-rule: wave` resolve. The Human's
one-commit-per-wave instruction for wave 1 is confirmed again at the
wave 2 gate before any commit.

### Unit 09 — Restore check-and-repair on PR 1's head

| Field | Value |
|-------|-------|
| Unit identifier | 09 — first wave 2 frontier unit, inline |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-iteration-1-spec.md` / `docs/specs/archived/install-experience/install-experience-iteration-1-plan.md` |
| Obligation / proof status | Restore precondition for R7, R8, R11.1, R11.2, R12, R13 — done: build PASS; `doctor` registered (`--help` prints its usage, as at `149dde6`); a `--skills none` setup installs `harness-doctor` and writes no manifest; no `src/` import of `manifest.ts`; test 935 pass, 0 fail, 7 todo; lint, comments (0 findings) and validate (117 ok) PASS |
| `HEAD` commit | `3c73202` |
| `git status` summary | clean before this unit |
| Intended diff scope | Unit 09 Owns: `src/doctor/**`; `{templates/,}.agents/skills/harness-doctor/**`; `{templates/,}.agents/skills/harness-init/references/layout.md`; `src/cli.ts`; `src/setup/skill-sets.ts`; `src/setup/config.ts`; `test/doctor*.test.ts`; `test/harness-doctor-skill.test.ts`; `test/harness-init-layout.test.ts`; `test/config-keys.test.ts`; inventory tests (`ask-only`, `skill-sets`) |
| Decision on every discrepancy | Resolved: `drift.ts` drops its `manifest.ts` import, so files with no record classify as edited until unit 16; manifest-dependent drift cases become `todo`. `.wolven-harness.manifest.json` stays out of `setup-surfaces` (R7.3 holds). Five cases outside the drift file fail only because a later unit has not run, so each is `todo` naming the unit that clears it: registry-data (units 10, 12), doctor full wiring (10), the two the wiring-only predecessor contract cases (18), the drift-deferral case (18) and the guide's skill listing (19). Each named unit removes its `todo`. |

### Units 10, 12 and 15 — parallel frontier after 09

| Field | Value |
|-------|-------|
| Unit identifier | 10, 12, 15 — frontier after 09, each `spawn`, Owns disjoint |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-iteration-1-spec.md` / `docs/specs/archived/install-experience/install-experience-iteration-1-plan.md` |
| Obligation / proof status | 10: R7.1, R12.2 — pending. 12: R5.3 — pending. 15: R13.1 — PASS: parent regenerated table after unit 13 layout edit and reran 6 known-forms tests; comments/validate PASS |
| `HEAD` commit | `3c73202` |
| `git status` summary | dirty — unit 09's restored and adapted paths only |
| Intended diff scope | 10: `src/doctor/runtime-checks.ts`, `test/doctor-runtime.test.ts`, `test/doctor.test.ts`. 12: the code-repo check in `src/doctor/env-checks.ts`, its cases in `test/doctor-env.test.ts`. 15: a generator script, the committed table, a `package.json` script, a new known-forms test. The parent clears the registry-data `todo` in `test/runtime-registry.test.ts` once 10 and 12 both land |
| Decision on every discrepancy | Resolved: unit 09's `todo` markers are cleared by the unit each names; the parent owns the shared registry-data `todo` so no executor edits another's file |

### Wave 2 hand-over to Codex

The Human moved wave 2 to Codex while units 10, 12 and 15 were in flight.
The Claude parent stopped and touches nothing more on this branch.

| Field | Value |
|-------|-------|
| Unit identifier | 09 done; 12 done; 10 and 15 stopped mid-unit; 11, 13, 14 and 16–21 not started |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-iteration-1-spec.md` / `docs/specs/archived/install-experience/install-experience-iteration-1-plan.md` |
| Obligation / proof status | 09: done (see its row). 12: R5.3 — done, checked by the parent: `test/doctor-env.test.ts` 17 pass, 0 fail, including "a code repository holding its own .claude settings gives no finding" and "every harness-owned path under codeRepo gives a finding"; `env-checks.ts` gives 0 registry-data hits; comments and validate PASS. The base spec places the R5.3 proof in `test/doctor.test.ts`, which has no code-repo case yet; unit 10 owns that file, so add it there before the gate. 10 and 15: pending, partial edits unverified |
| `HEAD` commit | `3c73202` |
| `git status` summary | dirty, all wave 2: unit 09's paths; unit 12's `src/doctor/env-checks.ts` and `test/doctor-env.test.ts`; unit 10's partial edits to `src/doctor/runtime-checks.ts`, `test/doctor-runtime.test.ts` and `test/doctor.test.ts`; unit 15's partial `scripts/known-forms.mjs`, `known-forms.json`, `test/known-forms.test.ts` and `package.json` |
| Intended diff scope | Resume units 10 and 15 within their Owns, then the frontier as written |
| Decision on every discrepancy | Resolved: units 10 and 15 are re-run from their rows. Their partial edits are kept as a starting point, re-read before use, and never trusted without the unit's own proof. No commit has been made for wave 2 |

### Codex wave 2 reconciliation

| Field | Value |
|-------|-------|
| Unit identifier | 10 and 15 resumed; 13 follows proven 12; spawn |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-iteration-1-spec.md` / `docs/specs/archived/install-experience/install-experience-iteration-1-plan.md` |
| Obligation / proof status | 12 parent environment proof PASS (17 tests); 10 R7.1/R12.2, 15 R13.1 and 13 R12.1/R5.2 pending |
| `HEAD` commit | `3c73202` |
| `git status` summary | dirty — restored 09, completed 12, partial 10 and 15 exactly as handoff; no unrelated files |
| Intended diff scope | Unit 10 runtime-checks and doctor-runtime/doctor tests; 15 generator/table/package script/known-forms test; 13 qmd env-check and env test plus mirrored layout and layout test |
| Decision on every discrepancy | Resolved: retain partial edits as unverified starting points; other Claude session remains idle. Existing Human Luna-low instruction overrides handoff medium recommendation. New handoff boundary is unit 20 before commit; no push/PR. Successor ADR requires Human confirmation before promotion. Unit 10 also adds the base R5.3 CLI code-repo proof. |

### Unit 10 — Doctor reads registry data from the open folder

| Field | Value |
|-------|-------|
| Unit identifier | 10 — wave 2 Codex frontier, spawn |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-iteration-1-spec.md` / `docs/specs/archived/install-experience/install-experience-iteration-1-plan.md` |
| Obligation / proof status | R7.1, R12.2; R5.3 CLI integration — PASS: parent reran doctor runtime/CLI and un-todo registry proofs (34 tests), comments/validate PASS |
| `HEAD` commit | `3c73202` |
| `git status` summary | dirty — wave 2 restored and partial edits from handoff only; no unrelated changes |
| Intended diff scope | src/doctor/runtime-checks.ts; test/doctor-runtime.test.ts; test/doctor.test.ts |
| Decision on every discrepancy | Resolved: retain partial edits as starting points, isolate to Owns; no overlapping active unit edits; parent owns plan and gate; Luna-low; STOP at 20 before commit. |

### Unit 15 — Known forms table

| Field | Value |
|-------|-------|
| Unit identifier | 15 — wave 2 Codex frontier, spawn |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-iteration-1-spec.md` / `docs/specs/archived/install-experience/install-experience-iteration-1-plan.md` |
| Obligation / proof status | R13.1 — PASS: parent regenerated table after unit 13 layout edit and reran 6 known-forms tests; comments/validate PASS |
| `HEAD` commit | `3c73202` |
| `git status` summary | dirty — wave 2 restored and partial edits from handoff only; no unrelated changes |
| Intended diff scope | scripts/known-forms.mjs; known-forms.json; package.json script/files; test/known-forms.test.ts |
| Decision on every discrepancy | Resolved: retain partial edits as starting points, isolate to Owns; no overlapping active unit edits; parent owns plan and gate; Luna-low; STOP at 20 before commit. |

### Unit 13 — qmd reachable from the open folder

| Field | Value |
|-------|-------|
| Unit identifier | 13 — wave 2 Codex frontier, spawn |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-iteration-1-spec.md` / `docs/specs/archived/install-experience/install-experience-iteration-1-plan.md` |
| Obligation / proof status | R12.1, R5.2 — PASS: parent reran 27 qmd/layout tests; comments/validate PASS |
| `HEAD` commit | `3c73202` |
| `git status` summary | dirty — wave 2 restored and partial edits from handoff only; no unrelated changes |
| Intended diff scope | qmd portion of src/doctor/env-checks.ts and test/doctor-env.test.ts; mirrored layout.md; test/harness-init-layout.test.ts |
| Decision on every discrepancy | Resolved: retain partial edits as starting points, isolate to Owns; no overlapping active unit edits; parent owns plan and gate; Luna-low; STOP at 20 before commit. |

### Unit 16 — Drift classified without a manifest

| Field | Value |
|-------|-------|
| Unit identifier | 16 — after proven 15, spawn |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-iteration-1-spec.md` / `docs/specs/archived/install-experience/install-experience-iteration-1-plan.md` |
| Obligation / proof status | R7.4, R13.2, R13.3 — PASS: parent drift/setup integration rerun; 66 pass, 0 fail and only unit 18 deferral todo across 67 integration tests; comments/validate PASS |
| `HEAD` commit | `3c73202` |
| `git status` summary | dirty — wave 2 inherited/restored and proven 13/15 paths; 10 active on disjoint runtime-checks/tests |
| Intended diff scope | src/doctor/drift.ts; reusable setup helper exports in src/setup/apply.ts and runtimes.ts; test/doctor-drift.test.ts |
| Decision on every discrepancy | Resolved: unit 15 released table/schema, parent owns regeneration after future template edits; unit 10 owns runtime-checks.ts (different from setup/runtimes.ts); preserve ADR-deferral todo for 18. |

### Unit 11 — Rule copies are checked against their rules

| Field | Value |
|-------|-------|
| Unit identifier | 11 — after released and proven dependencies, spawn |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-iteration-1-spec.md` / `docs/specs/archived/install-experience/install-experience-iteration-1-plan.md` |
| Obligation / proof status | R11.1 — PASS: parent integration rerun covers stale native/inline copies and orphans; comments/validate PASS |
| `HEAD` commit | `3c73202` |
| `git status` summary | dirty — wave 2 only, units 09/10/12/13/15 proven, 16 active on disjoint paths |
| Intended diff scope | src/doctor/runtime-checks.ts; src/doctor/report.ts new code; stale cases test/doctor-runtime.test.ts |
| Decision on every discrepancy | Resolved: 10 and 13 released shared tests; 11,14,16 edit disjoint Owns. Parent removed registry-data todo after 10/12, no proof skipped. |

### Unit 14 — doctor gives the global-install hint

| Field | Value |
|-------|-------|
| Unit identifier | 14 — after released and proven dependencies, spawn |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-iteration-1-spec.md` / `docs/specs/archived/install-experience/install-experience-iteration-1-plan.md` |
| Obligation / proof status | R3.3,R4.2,R4.4 — PASS: parent integration rerun covers hints and PATH suppression; comments/validate PASS |
| `HEAD` commit | `3c73202` |
| `git status` summary | dirty — wave 2 only, units 09/10/12/13/15 proven, 16 active on disjoint paths |
| Intended diff scope | not-global check src/doctor/env-checks.ts; corresponding cases test/doctor-env.test.ts and test/doctor.test.ts |
| Decision on every discrepancy | Resolved: 10 and 13 released shared tests; 11,14,16 edit disjoint Owns. Parent removed registry-data todo after 10/12, no proof skipped. |

### Unit 17 — Repair stale copies and drift without a manifest

| Field | Value |
|-------|-------|
| Unit identifier | 17 — after proven 11 and 16, spawn |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-iteration-1-spec.md` / `docs/specs/archived/install-experience/install-experience-iteration-1-plan.md` |
| Obligation / proof status | R8.2, R11.2 — PASS: parent reran 7 repair skill tests; comments/validate PASS |
| `HEAD` commit | `3c73202` |
| `git status` summary | dirty — wave 2 only; 09–16 implementation released, no active edits |
| Intended diff scope | templates/.agents/skills/harness-doctor/SKILL.md and mirrored .agents copy; test/harness-doctor-skill.test.ts |
| Decision on every discrepancy | Resolved: reuse new error code and drift classes; parent will regenerate known-forms after skill text changes. Parent upgraded the existing Claude+Codex CLI fixture to use full rule bodies, qmd tools/index, and the default doctor checks; it now passes. |

### Unit 18 — Successor contract

| Field | Value |
|-------|-------|
| Unit identifier | 18 — wave 2 final implementation frontier, inline |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-iteration-1-spec.md` / `docs/specs/archived/install-experience/install-experience-iteration-1-plan.md` |
| Obligation / proof status | R9.1,R9.3 — PASS: Human confirmed successor; stable promotion, supersession, claim migration, contract tests and deferral removal verified |
| `HEAD` commit | `3c73202` |
| `git status` summary | dirty — wave 2 only; prior source executors released; source smoke exits 1/0/0/0 |
| Intended diff scope | new successor ADR; predecessor deprecation and all claim repoints only after confirmation; test/contract.test.ts; deferral deletion |
| Decision on every discrepancy | Resolved: Successor draft prepared and validate PASS with current stable claims retained; Human confirmation pending before promotion. Integration inventory and packaging expectations track updated skill text and shipped known-forms data; no runtime behavior added. STOP20 before commit. |

### Unit 19 — Install docs with doctor

| Field | Value |
|-------|-------|
| Unit identifier | 19 — wave 2 final implementation frontier, spawn |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-iteration-1-spec.md` / `docs/specs/archived/install-experience/install-experience-iteration-1-plan.md` |
| Obligation / proof status | R9.2 — PASS: parent reran 20 docs/listing tests and docs:build; comments/validate PASS |
| `HEAD` commit | `3c73202` |
| `git status` summary | dirty — wave 2 only; prior source executors released; source smoke exits 1/0/0/0 |
| Intended diff scope | README.md; site/commands.md; site/index.md; site/skills.md; test/readme-install.test.ts; clear listing todo in test/skill-wayfinder.test.ts |
| Decision on every discrepancy | Resolved: Unit17 is proven; documentation paths disjoint from18 until claim repoint. Parent owns later repoint after confirmation. Inventory-only test todo and AGENTS skill description are integration scope for restored09/updated17. STOP20 before commit. |

### Unit 18 — Confirmed promotion and supersession

| Field | Value |
|-------|-------|
| Unit identifier | 18 — inline, Human confirmed successor text |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-iteration-1-spec.md` / `docs/specs/archived/install-experience/install-experience-iteration-1-plan.md` |
| Obligation / proof status | R9.1 and R9.3 — PASS: 19 contract/drift proofs, no todo; source fixtures retained their own independent ADR IDs |
| `HEAD` commit | `3c73202` |
| `git status` summary | dirty — wave 2 implementation and successor draft only; all executors idle; no unrelated files |
| Intended diff scope | Successor status, predecessor status/superseded_by, every current contract claim, contract/drift-deferral tests, setup-drift-check deferral removal |
| Decision on every discrepancy | Resolved: Human explicitly confirmed successor ADR as written. Promote only status; retain predecessor history in planning prose by naming it as predecessor, while current contract links target successor. No commit or push; stop after gate20. |

### Unit 20 — Wave 2 gate

| Field | Value |
|-------|-------|
| Unit identifier | 20 — inline final wave 2 gate, STOP before commit |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-iteration-1-spec.md` / `docs/specs/archived/install-experience/install-experience-iteration-1-plan.md` |
| Obligation / proof status | Unit 18 PASS; full wave gate PASS: 965/965 tests, 0 fail/skip/todo; build/lint/validate/comments/site exit 0; smoke exits 1/0/0/0 |
| `HEAD` commit | `3c73202` |
| `git status` summary | dirty — wave 2 implementation and required contract migration only; no active executors |
| Intended diff scope | Wave 2 acceptance evidence and final resume status; no completion marks before commit, no unit 21 work |
| Decision on every discrepancy | Resolved: preserve historical predecessor wording while linking current contract to confirmed successor; remove all temporary todos rather than skip them. Respect supplied handoff boundary: no commit, push or PR. |

### Wave 2 final resume state — STOP at 20

| Field | Value |
|-------|-------|
| Unit identifier | 09–20 implemented and proven; STOP before commit; 21 not started |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-iteration-1-spec.md` / `docs/specs/archived/install-experience/install-experience-iteration-1-plan.md` |
| Obligation / proof status | Every wave 2 acceptance proof PASS (14 boxes). `pnpm build`, `pnpm test` (965/965, 0 fail/skip/todo), `pnpm lint`, `pnpm validate` (97 claims, 0 failures), `pnpm comments` (0 findings), `pnpm docs:build` all PASS. Compiled doctor --dir smoke: audited1, repaired0, linked0, claude-and-codex0. PR2 static surface PASS. |
| `HEAD` commit | `3c73202` — unchanged; wave 2 is uncommitted |
| `git status` summary | dirty — approved wave 2 implementation, confirmed successor/claim migration and required test/doc updates only; nothing staged, no active executors |
| Intended diff scope | Completed wave 2 Owns including successor migration; no unit 21 finding-map edits and no commit/push/PR |
| Decision on every discrepancy | Resolved: Human confirmed successor ADR as written. Current contract references target ADR-006; historical planning prose describes the wiring-only predecessor without changing its PR1 obligations. Fixture-local synthetic ADR IDs remain unchanged because they describe independent test repositories. All temporary todos removed; no proof suppressed. New handoff's STOP-before-commit boundary honored. |

ADR-006 is stable; its predecessor is deprecated with `superseded_by` set.
The setup-drift-check deferral is removed. The known-forms data ships in
the package dry run (141 files); generator/table proofs pass. The existing
Claude+Codex test runs all default doctor checks against real setup output,
current complete rule bodies and a stubbed tool environment. The unreadable
rule-source case reports a doctor finding rather than a generic CLI error.

All eight spawned Codex executors used `gpt-6-luna` at `low` effort.
Completion boxes for units 09–20 remain unchecked under the atomic-commit
rule because this handoff explicitly stops before commit. The evidence
above and spec acceptance boxes record the green result. Unit 21 still
awaits its separate post-gate run. No branch cut, commit, push, PR or merge
was performed by this wave 2 run.

### Wave 2 atomic commit reconciliation

| Field | Value |
|-------|-------|
| Unit identifier | 09–20 — proven wave 2 batch; 21 remains unchecked |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-iteration-1-spec.md` / `docs/specs/archived/install-experience/install-experience-iteration-1-plan.md` |
| Obligation / proof status | Full gate and smoke PASS as above; unchanged implementation; fresh pre-commit validate PASS (99 claims, 0 failures) and comments PASS (0 findings) |
| `HEAD` commit | `3c73202` — validated parent of this atomic wave commit |
| `git status` summary | dirty — exactly the completed wave 2 batch and its plan marks; no unrelated changes or active executors |
| Intended diff scope | One Conventional Commit carrying the proven wave 2 work and units 09–20 completion marks; no unit 21 work, push or PR |
| Decision on every discrepancy | Resolved: Human explicitly invoked code-commit after the no-commit stop. This authorizes the atomic per-wave commit; retained implementation matches the green gate. Reverse completion marks if commit fails. |

This commit supersedes the earlier pre-commit pause. Units 09–20 and their
proofs land together; unit 21's finding map is still a separate post-gate
step. No push, PR or merge is part of this commit request.

### Unit 21 — Ship gate: re-report every finding

| Field | Value |
|-------|-------|
| Unit identifier | 21 — last unit, inline, after the wave 2 commit `8c94b1d` |
| Spec/plan paths | `docs/specs/archived/install-experience/install-experience-iteration-1-spec.md` / `docs/specs/archived/install-experience/install-experience-iteration-1-plan.md` |
| Obligation / proof status | Done. The parent re-ran the full gate on `8c94b1d`: build, test (965 pass, 0 fail, 0 todo), lint, validate (99 claims, 0 fail) and comments (0 findings) PASS. Every finding's closing proof passed in that run: F1 "doctor: a claude-and-codex install with a complete inline block exits 0"; F2 `proof-install-experience-no-code-writes`; F3 and F4 `proof-install-experience-global-hint` and `-pm-global`; F5 and F12 `proof-install-experience-registry-data`; F6 `proof-install-experience-doctor-refresh`; F7 `proof-install-experience-qmd-reach` and "layout: the linked layout names the four symlinks"; F8 `proof-install-experience-known-forms` and `-drift-earlier`; F9 `-rules-create-only`, the three `doctor-rules-stale` cases and `-rules-refresh`; F10 `-rules-mode` and `-inline-rules`; F11 `-subfolder-refused`; F13 `drift.ts` imports setup's helpers. F14 was withdrawn. The `pr2-surface` items hold on inspection: ADR-006 `stable`, its wiring-only predecessor `deprecated` with `superseded_by`, `docs/deferrals/setup-drift-check/` absent. The four-fixture smoke is the wave 2 gate's record |
| `HEAD` commit | `8c94b1d` |
| `git status` summary | dirty — this plan file only (Outcome column, unit 21 mark, this record) |
| Intended diff scope | `docs/specs/archived/install-experience/install-experience-iteration-1-plan.md` |
| Decision on every discrepancy | Resolved: five proofs carry descriptive test names instead of their proof ids (`init-linked`, `rules-stale`, `drift-after-refresh`, `doctor-open-folder`, `pr2-surface`); each was matched to its passing case above. Committing this record waits for the Human |

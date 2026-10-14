---
type: spec
title: Project skill precedence — iteration 1 remediation
description: Narrow PR #60 to explicit project-first skill instructions and remove clash scanning and its command integrations.
status: stable
---

# Project skill precedence — iteration 1 remediation

**Source:** Human-confirmed remediation scope for [PR #60](https://github.com/WolvenTech/wolven-harness/pull/60): before using a skill, check local/project skills first; follow the project copy when present; use a user-level copy only when no project copy exists; resolve relative references from the selected copy's directory. Support `.agents/skills` and standalone `.claude/skills` project installations. Keep the imperative in the entry-file bullets and shipped rule; remove the clash scanner and its integrations, help text and scanner-only tests; simplify documentation promising scanner behavior; preserve installation behavior and command contracts; add no dependencies, discovery machinery or runtime infrastructure.

**Supersedes:** The scan, warning and help-text obligations in `docs/specs/project-skill-precedence/project-skill-precedence-spec.md` (R2–R5 and R7.2–R7.3) and corresponding Wave 2 obligations in `docs/specs/project-skill-precedence/project-skill-precedence-plan.md` are explicitly replaced by the Human's narrowed scope. Their removal is not a failure against the original spec. Preserve the original rule-delivery obligations that remain in scope.

**Approval:** The Human approved this spec; status is `stable`.
**Post-approval follow-up:** The Human later directed removal of all three
deferral records created by the original initiative. No marker, scanner or
symlink-repair work remains tracked as deferred scope.
**Next:** `code-plan` → `code-execute`, one implementation wave.
**Named proof (this spec's own structural gate):** `proof-project-skill-precedence-iteration-1-spec-obligations`

## Repository grounding

| Surface | Present today | Role for this initiative |
|---------|----------------|---------------------------|
| `templates/.agents/rules/project-skill-precedence.md` and `.agents/rules/project-skill-precedence.md` | yes | Shipped and repo-installed rule to state project-first selection and reference resolution |
| `templates/WOLVEN.md` and `AGENTS.md` | yes | Standing-rule bullets; the imperative belongs in the bullets because harness-init folds them verbatim |
| `.agents/skills/` and `.claude/skills/` | yes; the latter may be a symlink or standalone installation | Supported project skill locations covered by the rule |
| `templates/.agents/skills/harness-init/references/entry-modes.md` | yes | Existing router/fold behavior to retain |
| `src/skills/clash.ts` | yes on PR #60 | Scanner module to remove |
| `src/setup/index.ts`, `src/skills/index.ts`, `src/skills/parse.ts` | yes on PR #60 | Scanner integrations and scanner-only help text to remove |
| `src/skills/install.ts` | yes | Restore scanner-only exports to pre-scanner visibility while preserving install behavior |
| `test/setup-clash.test.ts`, scanner cases in `test/skills-clash.test.ts` | yes on PR #60 | Scanner-only coverage to remove; retain unrelated command/install coverage |
| `test/project-skill-precedence-rule.test.ts`, `test/harness-init-entry.test.ts` | yes on PR #60 | Retain and focus rule delivery and fold coverage |
| `docs/adrs/adr-004-standalone-skills-contract.md` | yes, stable | Existing command and template contract; no command contract change is authorized |
| Original scanner and marker deferral records | present earlier on PR #60; later removed by Human direction | No deferral record remains for scanner, marker or symlink-repair work |

## Surface walk

- **In scope:** the shipped and repo-installed rule; standing-rule bullets in `templates/WOLVEN.md` and `AGENTS.md`; scanner implementation and integrations; scanner-only exports; scanner-only tests; affected scanner-promising documentation; focused rule-delivery and fold tests.
- **Out of mutate scope (unchanged):** skill installation destinations and copy behavior in `src/skills/install.ts` apart from restoring scanner-only export visibility; setup create-only behavior and existing command flags, output contracts and exit codes (R3.1); runtime skill resolution, `src/validate/**`, dependency manifests and test infrastructure (R3.2).

## Requirements (obligation ↔ proof)

### R1 — Project-first instructions cover supported project roots

| ID | Obligation | Named proof | Evidence shape |
|----|------------|--------------|------------------|
| R1.1 | Before invoking a skill, the rule and entry-file bullets instruct the agent to check for a matching project skill at `.agents/skills/<name>/SKILL.md` or `.claude/skills/<name>/SKILL.md`; follow a project copy if either exists, and use the user-level copy only if neither exists | `proof-project-skill-precedence-iteration-1-selection` | Focused rule test and inspection: both project locations and fallback order appear in the rule and standalone bullets |
| R1.2 | Instructions say to resolve relative references from the selected skill copy's directory | `proof-project-skill-precedence-iteration-1-relative-references` | Focused rule test: selected-directory instruction is present |
| R1.3 | `templates/WOLVEN.md` and `AGENTS.md` each carry the imperative in the standing-rule bullet itself and cite `.agents/rules/project-skill-precedence.md`; installed and template rule files are byte-identical | `proof-project-skill-precedence-iteration-1-entry-delivery` | Rule-delivery tests and byte comparison |
| R1.4 | The harness-init folded standing-rules block retains the complete instruction, including standalone `.claude/skills` | `proof-project-skill-precedence-iteration-1-fold` | `test/harness-init-entry.test.ts` asserts both roots and the selection instruction survive the fold |

### R2 — Remove scanner and scanner-only surfaces

| ID | Obligation | Named proof | Evidence shape |
|----|------------|--------------|------------------|
| R2.1 | Remove the clash scanner module, setup and skills integrations, scanner-specific setup UI usage, scanner help text, and scanner-only exports from their prior visibility state | `proof-project-skill-precedence-iteration-1-scanner-removal` | Repository search and source inspection show no scanner module/import/call/help text; install exports match pre-scanner visibility |
| R2.2 | Remove scanner-only tests while retaining focused rule delivery/fold tests and unrelated skills command/install coverage | `proof-project-skill-precedence-iteration-1-test-scope` | Test-tree inspection plus `pnpm test` |
| R2.3 | Simplify documentation promising clash scanning or warnings, including scanner-specific deferrals, without retaining stale scanner behavior claims | `proof-project-skill-precedence-iteration-1-docs` | Search affected docs/spec/deferral text for scanner promises and inspect revised wording |

### R3 — Preserve existing behavior and contracts

| ID | Obligation | Named proof | Evidence shape |
|----|------------|--------------|------------------|
| R3.1 | Preserve installation destinations, copy/overwrite behavior, setup create-only behavior, and existing CLI commands, flags, stdout/stderr contracts and exit codes | `proof-project-skill-precedence-iteration-1-contracts` | Existing command and install tests plus `pnpm test`; diff shows no contract changes |
| R3.2 | Add no dependencies, discovery machinery, markers, settings, home-directory repairs, or test infrastructure; do not change runtime resolution | `proof-project-skill-precedence-iteration-1-no-expansion` | Diff and dependency-manifest inspection |

## Nine-dimension landings

| Dimension | Landing kind | Landing |
|-----------|---------------|---------|
| validation | obligation/proof | R1.1–R1.4, R2.1–R2.3; run `pnpm harness:validate` and focused structural proofs. These verify documentation and instruction delivery, not runtime skill resolution |
| failure modes | obligation/proof | R1.1 and R1.4 cover standalone `.claude/skills` so absence of `.agents/skills` cannot imply absence of project skills; removing the scanner removes its whole-scan unreadable-file failure (R2.1) |
| idempotency and retry | n/a | No new persistent operation or retry behavior; setup/install behavior stays unchanged (R3.1) |
| authorization | n/a | No new prompt or permission; existing skill-install confirmation stays unchanged (R3.1) |
| concurrency and ordering | obligation/proof | R1.1 specifies project selection before invocation when a project copy exists; this instruction does not alter runtime resolution. No concurrent write is added (R3.2) |
| data lifecycle | n/a | No new stored state or metadata; installation behavior and `.wolven-harness.json` lifecycle remain unchanged (R3.1) |
| external-dependency failure | n/a | No new external dependency or home-directory access (R3.2) |
| state transitions | n/a | No new state machine; selection is a per-skill instruction (R1.1) |
| observability | obligation/proof | R1.1–R1.4 make the instruction visible in the rule, entry bullets and folded context; no warning channel remains after R2.1 |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition |
|------------|-------------------|-------|-------------------|--------------|
| — | None; scope and supported project roots are confirmed | Human | None | No unresolved product or contract decision |

## Out of scope

- Detecting or reporting user/project skill clashes in any command.
- Changing how Claude Code, Codex, Cursor, or another runtime resolves skills.
- Scanning skill directories, inferring loaded paths, or adding identity, marker, or settings mechanisms.
- Editing skill bodies, repairing home-directory symlinks, adding dependencies, or adding test infrastructure.
- Changing installation destinations, setup creation policy, command flags, output contracts, or exit codes.
- Writing a plan, implementing, committing, pushing, or changing PR #60 as part of this spec's scope.

## Pragmatic-guard refuses

The scanner is refused and removed: **need 2/10** — the narrowed need is a clear instruction that agents check project skills first; the scanner neither selects nor enforces the loaded skill, and one unreadable skill file can suppress all warnings. **Complexity 6/10** — it adds home-directory scanning, setup/skills integrations, help text, exported path machinery, scanner-only tests and documentation. The minimal path is the rule plus self-contained entry bullets for both project roots. No deferral is needed for discarded scanner scope.

## Acceptance

### Single implementation wave

- [ ] The rule and both entry-file bullets direct agents to check `.agents/skills` and `.claude/skills` before use, follow a project copy when present, otherwise fall back to the user copy, and resolve relative references from the selected skill directory (R1.1–R1.3)
- [ ] The harness-init folded block carries the complete instruction (R1.4)
- [ ] Scanner module, integrations, scanner-only exports/help/tests, and scanner-promising documentation are removed or simplified as specified (R2.1–R2.3)
- [ ] Existing installation behavior and command contracts are preserved, with no dependencies or new runtime infrastructure (R3.1–R3.2)

## Eval / gates

| Gate | Command / check | When | PASS | Abort |
|------|----------------|------|------|-------|
| Tests | `pnpm test` | End of implementation wave | applicable existing tests pass, including focused rule, fold, install and command coverage | Fix; do not hand off |
| Lint and format | `pnpm lint` | End of implementation wave | exit 0 | Fix; do not hand off |
| Build | `pnpm build` | End of implementation wave | exit 0 | Fix; do not hand off |
| Integrity | `pnpm harness:validate` | End of implementation wave | exit 0 | Fix; do not hand off |
| Comments | `pnpm comments` | End of implementation wave | no findings | Fix; do not hand off |
| Spec obligations | `proof-project-skill-precedence-iteration-1-spec-obligations` — every acceptance item maps to named R obligations, each R row has a distinct named proof, all nine dimensions land, and every `n/a` identifies the unchanged surface | Before `code-plan` | all structural checks hold | Do not plan |
| Runtime behavior limit | Inspect rule and entry/fold tests | Before handoff | evidence establishes instruction delivery only; no claim that runtime resolution changed or was observed | Correct claim before handoff |

## Cross-domain leak table

| Leak | Refuse |
|------|--------|
| Runtime skill-resolution changes | Owned by the runtimes; this spec changes harness instructions only |
| New clash reporting or loaded-path telemetry | Explicitly replaced by the Human's narrowed scope |
| New command, flag, config, dependency, or home-directory operation | Outside the confirmed ask; R3.1–R3.2 preserve current contracts |
| Implementation order or work-unit design | `code-plan` after explicit approval |
| Implementation, PR updates, commit or push | Separate from this draft-spec task |

## ADR

None needed this initiative. `docs/adrs/adr-004-standalone-skills-contract.md` already defines the relevant standalone skill/command contract; this remediation adds no command, flag, configuration, dependency, or durable runtime architecture decision.

## Section checklist

| Section | Required when | Present |
|---------|----------------|---------|
| Source | Always | yes |
| Repository grounding | Always | yes |
| Surface walk | Always | yes |
| Waves | More than one mutate batch | no — one wave |
| Requirements with obligation ↔ proof | Always | yes — R1–R3 |
| Nine-dimension landings | Always | yes — all nine |
| Unresolved | Always | yes — no open decisions |
| Out of scope | Always | yes |
| Pragmatic-guard refuses | Always | yes |
| Acceptance | Always | yes — unticked |
| Eval / gates | Always | yes |
| Cross-domain leak table | Always | yes |
| ADR | Always | yes — none needed |

---
type: spec
title: Install ship and discovery skills without the harness
description: The skills command copies one package copy of chosen ship and discovery skills into the load paths claude, codex, and cursor already read, and that copy skips a missing consult and stops when the next procedure lives elsewhere.
status: stable
---

# Install ship and discovery skills without the harness

**Source:** `docs/prds/skills-command/skills-command-prd.md` (status `stable`).
**Next:** Implementation and named proofs verified on 2026-10-05 at `f356692`. The plan records the successor draft follow-up; human promotion and pre-merge closure remain pending.
**Named proof (this spec's own structural gate):** `proof-skills-command-spec-obligations`

A **skills command** is `wolven-harness skills`. It does not run `setup`. A **load path** is the directory a runtime already reads for one scope. **Project** is that directory under `io.cwd`. **Global** is that directory under `os.homedir()`, read when the command resolves destinations. **Package copy** is the file tree at `templates/.agents/skills/<skill>/`.

Cursor and Codex share `.agents/skills/<skill>/` and `~/.agents/skills/<skill>/`. Claude uses `.claude/skills/<skill>/` and `~/.claude/skills/<skill>/`. The command dedupes destinations before it prompts or writes, so choosing Cursor and Codex writes each skill once.

## Repository grounding

| Surface | Present today | Role for this initiative |
|---------|----------------|----------------------------|
| `src/cli.ts` | yes | Dispatch and top-level usage; `skills` is an unknown command today |
| `src/setup/skill-sets.ts` | yes | `CORE_SKILLS`, `SET_SKILLS`, `ship`, `discovery` — the skill names this command may install |
| `src/setup/options.ts` `canPrompt` | yes | Prompts only when stdout is a TTY and stdin is a TTY (or a test injected a prompter) |
| `src/setup/types.ts` `Prompter` | yes | `select` and `multiselect`; cancel resolves to `undefined`. No `confirm` method |
| `src/setup/apply.ts` `applyTemplates` | yes | Copies missing template files into a git top-level and never overwrites. The skills command does not call it |
| `templates/.agents/skills/` | yes | The one package copy. This initiative edits `code-commit`, `code-pr`, `code-review`, `code-ci`, and `create-prd`. `setup` already copies this tree |
| `test/cli.test.ts` | yes | Asserts `--help` lists `setup`, `validate`, and `comments` |
| `docs/adrs/adr-003-public-contract.md` | yes | The 0.3.0 contract. Left unchanged. The successor carries the whole contract, including `skills`, and supersedes it only after promotion |
| `site/commands.md`, `site/index.md` | yes | Say `setup` is the only command that writes, and name three commands |
| `harness:validate` | yes | Integrity gate. Consumers run it. This repo runs `pnpm exec tsx src/cli.ts validate` before `dist/` exists |

## Surface walk

- **In scope:** a `skills` command module reached from `src/cli.ts`; flag parsing for `--runtimes`, `--scope`, and `--skills`; prompts through the existing `Prompter`; copying and replacing skill folders from `templates/.agents/skills/`; skill text in `templates/.agents/skills/code-commit/`, `code-pr/`, `code-review/`, `code-ci/`, and `create-prd/` (including `code-pr/references/host-operations.md` and `code-pr/references/pre-merge-closure.md`); `test/cli.test.ts` and new tests under `test/`; `site/commands.md` and the command sentence in `site/index.md`.
- **Out of mutate scope (unchanged):** `setup`, `validate`, and `comments` behavior, flags, and exit codes; `applyTemplates`; `.wolven-harness.json`; `src/setup/runtimes.ts` symlinks; `README.md`; `templates/.agents/skills/prototype/`, `the-fool/`, `the-jury/`, and `handoff/`. `setup` keeps copying `templates/.agents/skills/`. This initiative adds no second tree.

## Requirements (obligation ↔ proof)

### R1 — Chosen folders only

| ID | Obligation | Named proof | Evidence shape |
|----|------------|--------------|------------------|
| R1.1 | In a directory that is not a git repository and has no harness files, `skills` for `create-prd`, runtime `claude`, and project scope writes `./.claude/skills/create-prd/SKILL.md` from the package copy and does not create `.agents/`, `.wolven-harness.json`, `CLAUDE.md`, a `.claude/skills` symlink, rules, or package scripts | `proof-skills-command-claude-project` | `pnpm test` — temp dir, no git, assert the skill file bytes match `templates/.agents/skills/create-prd/SKILL.md` and the other paths are absent |
| R1.2 | `create-prd` with runtimes `claude` and `codex` and scope `project,global` writes the four load paths in AC-1.2 and no other harness files | `proof-skills-command-multi-path` | `pnpm test` — `HOME` set to a temp dir; assert the four directories and no config file |
| R1.3 | `create-prd` with runtimes `cursor` and `codex` and project scope writes `./.agents/skills/create-prd/` once and does not create `./.cursor/skills/` | `proof-skills-command-shared-agents` | `pnpm test` — one directory, `./.cursor/skills` absent |

### R2 — Sets, individuals, and core

| ID | Obligation | Named proof | Evidence shape |
|----|------------|--------------|------------------|
| R2.1 | On a promptable terminal the skill prompt offers `ship`, `discovery`, and each skill in `SET_SKILLS`. A checked set name selects every skill in that set. Checking only `create-prd` leaves the other discovery skills unselected | `proof-skills-command-set-select` | `pnpm test` — injected `Prompter.multiselect` returns `['discovery']`, then returns `['create-prd']`; assert the written folders |
| R2.2 | The skill prompt message lists the nine `CORE_SKILLS` and says to install the harness for code-lane, `adr`, and `qmd`. Those names are not options. A finished run writes none of those nine folders | `proof-skills-command-core-disabled` | `pnpm test` — capture the `multiselect` message and options; assert no core folder was written |
| R2.3 | `--skills ship` writes every ship skill. `--skills create-prd` writes only `create-prd`. `--skills ship,code-pr` writes the ship skills once each | `proof-skills-command-flag-expand` | `pnpm test` — three non-TTY runs against temp dirs |
| R2.4 | `--skills adr` and `--skills create-prd,adr` write nothing, exit 1, and the stderr names `adr` and `setup` | `proof-skills-command-core-flag` | `pnpm test` — non-TTY, empty temp dir before and after |

### R3 — Replace only after a yes for that folder

| ID | Obligation | Named proof | Evidence shape |
|----|------------|--------------|------------------|
| R3.1 | When `./.claude/skills/create-prd/` differs from the package copy and the person declines, that folder is unchanged and a missing chosen skill is still added. The command asks every question before it writes | `proof-skills-command-decline` | `pnpm test` — injected `select` returns no; a second chosen skill was absent and is present afterward |
| R3.2 | A yes removes that skill folder and writes the package copy, including deleting an extra file the package does not ship | `proof-skills-command-replace` | `pnpm test` — extra file inside the skill folder is gone; `SKILL.md` matches the template |
| R3.3 | Project and global folders for the same skill are separate questions. Declining project and accepting global leaves the project folder unchanged and replaces the global folder | `proof-skills-command-per-folder` | `pnpm test` — two `select` answers, `HOME` temp dir |
| R3.4 | When stdout or stdin is not a terminal, an existing skill folder stays as it is, the command does not ask, and a missing chosen skill is still added. Exit 0 | `proof-skills-command-no-tty-keep` | `pnpm test` — non-TTY, existing bytes unchanged |
| R3.5 | A skill folder whose relative paths and file bytes match the package copy is left in place with no prompt and no rewrite | `proof-skills-command-identical` | `pnpm test` — mtime or a sentinel byte unchanged; `select` is not called |
| R3.6 | Cancelling any prompt, including a replacement prompt after an earlier yes, writes nothing and exits 1 | `proof-skills-command-cancel-atomic` | `pnpm test` — first `select` returns yes, second returns `undefined`; temp dir unchanged |

### R4 — Flags, prompts, and help

| ID | Obligation | Named proof | Evidence shape |
|----|------------|--------------|------------------|
| R4.1 | With stdout or stdin not a terminal, `wolven-harness skills --skills create-prd --runtimes codex --scope project` writes `./.agents/skills/create-prd/` and exits 0 | `proof-skills-command-nontty-ok` | `pnpm test` |
| R4.2 | With no terminal and no `--runtimes`, the command writes nothing, exits 1, and stderr names `--runtimes` | `proof-skills-command-missing-flag` | `pnpm test` |
| R4.3 | With no terminal, `--scope both` writes nothing, exits 1, and stderr names `both`. `--scope project,global` and `--scope global,project` both mean project and global | `proof-skills-command-scope-both` | `pnpm test` — one failure run and two success runs |
| R4.4 | On a promptable terminal, `--runtimes foo` with `--scope project` and `--skills create-prd` supplied asks for runtimes again. Choosing `codex` writes `./.agents/skills/create-prd/` and exits 0. Supplied valid flags are not asked again | `proof-skills-command-reask` | `pnpm test` — injected prompter records which questions ran |
| R4.5 | `wolven-harness --help` and no-argument usage list `skills` and exit 0. An unknown command still exits 1 | `proof-skills-command-usage` | `pnpm test` — update `test/cli.test.ts` |
| R4.6 | `wolven-harness skills --help` and `skills -h` print help to stdout, exit 0, and write nothing. Help names `--runtimes`, `--scope`, `--skills`, `claude`, `codex`, `cursor`, `project`, `global`, `project,global`, every ship and discovery skill, and says core skills are installed by `setup` | `proof-skills-command-help` | `pnpm test` — stdout contains each token |

### R5 — Write failure and the guide

| ID | Obligation | Named proof | Evidence shape |
|----|------------|--------------|------------------|
| R5.1 | A filesystem error while writing exits 1. The command does not roll back folders it already wrote in that run, and it does not delete a skill folder it was not replacing | `proof-skills-command-write-error` | `pnpm test` — destination parent made read-only or the writer injected to fail; exit 1 |
| R5.2 | `site/commands.md` documents `wolven-harness skills` and no longer says `setup` is the only command that writes. `site/index.md` names `skills` among the terminal commands | `proof-skills-command-site` | Inspect `site/commands.md` and `site/index.md` |

Flag values are trimmed and deduplicated. `--flag value` and `--flag=value` both work. `none` is not a `skills` value. Any other argument exits 1. A missing flag value exits 1 even on a terminal. Choice prompts, when needed, run in this order: runtimes, scope, skills. Replacement questions then run one per differing destination, sorted by path, and each is a `select` of yes and no whose message contains that path. Core skill names and unknown names fail the run the way R2.4 does.

### R6 — One package copy skips a missing consult and stops on a missing procedure

**Loaded** means the skill is in the list the runtime provided for this session. A folder on disk does not count. A name remembered from an earlier summary does not count. These obligations are sentences in the package copy. `pnpm test` does not run an agent. Each proof is a read of the named files.

| ID | Obligation | Named proof | Evidence shape |
|----|------------|--------------|------------------|
| R6.1 | `code-commit`, `code-pr`, `code-review`, and `code-ci` `SKILL.md` each say: when the session skill list includes `pragmatic-guard`, consult it and then follow this skill; when it is absent, follow this skill's own steps, and the reply and the durable text that run writes include `pragmatic-guard was not consulted`. A folder on disk or a remembered name is not loaded. The text does not name the skills command or `setup` as the way to install `pragmatic-guard` | `proof-skills-command-guard-skip` | Read the four `SKILL.md` files — each contains `pragmatic-guard was not consulted` and the session-list rule |
| R6.2 | Those four files say a run with `pragmatic-guard` absent writes no deferral and no sentence that the guard ran | `proof-skills-command-no-guard-artifact` | Read the four `SKILL.md` files — each forbids a deferral and a sentence that the guard ran |
| R6.3 | `code-review` and `code-ci` say that reading `pragmatic-guard was not consulted` does not treat the guard as having run and does not claim the pull request is merge-ready from that text | `proof-skills-command-skip-reader` | Read those two `SKILL.md` files |
| R6.4 | `create-prd/SKILL.md` says: when the session skill list includes `grilling`, run it before drafting; when it is absent, draft from the ask with the term check and template, and the PRD file and the reply include `grilling did not run`. The text does not name an install command for `grilling`. When `adr` is absent at the ADR offer, no decision record is written and the reply names `adr` | `proof-skills-command-grilling-skip` | Read `templates/.agents/skills/create-prd/SKILL.md` |
| R6.5 | `code-review` and `code-ci` say: when `code-pr` is absent from the session skill list, stop before a host action, name `code-pr`, and do not copy the host procedure | `proof-skills-command-host-coupled` | Read those two `SKILL.md` files |
| R6.6 | `code-pr/SKILL.md`, `code-ci/SKILL.md`, and `code-pr/references/pre-merge-closure.md` say: when `code-commit` is absent from the session skill list and the next step is a commit, stop, name `code-commit`, and do not run `git commit` | `proof-skills-command-commit-coupled` | Read those three files |
| R6.7 | `code-pr/references/host-operations.md` says: when `.wolven-harness.json` has no `gitHost`, the host action does not happen, the reply names `setup`, and the skill does not assume GitHub | `proof-skills-command-githost` | Read that file |
| R6.8 | `code-ci/SKILL.md` and `code-pr/references/pre-merge-closure.md` say: when `harness:validate` cannot be run, stop that step, name `setup`, and do not claim the command passed or that the pull request is merge-ready | `proof-skills-command-validate-stop` | Read those two files |
| R6.9 | `code-pr/references/pre-merge-closure.md` says: when ADRs are to be promoted and `adr` is absent from the session skill list, ADR status stays as it is and closure does not claim merge-ready | `proof-skills-command-adr-promote` | Read that file |
| R6.10 | `code-review/SKILL.md` says: when `harness:validate` cannot be run, post the other findings, the posted review says the ADR-claims axis was not checked, and the skill does not judge those claims by eye. `code-ci/SKILL.md` and `pre-merge-closure.md` say a review that contains that sentence is not a passed axis and is not merge-ready | `proof-skills-command-adr-axis` | Read those three files |
| R6.11 | `templates/.agents/skills/prototype/`, `the-fool/`, `the-jury/`, and `handoff/` are not in the diff for this initiative | `proof-skills-command-discovery-unchanged` | `git diff` against the base — those four directories have no change |

## Nine-dimension landings

| Dimension | Landing kind | Landing |
|-----------|---------------|---------|
| validation | obligation ↔ proof | R4.2 / `proof-skills-command-missing-flag`, R4.3 / `proof-skills-command-scope-both`, R4.4 / `proof-skills-command-reask`, R2.4 / `proof-skills-command-core-flag` — missing, unknown, and core values write nothing when the process cannot prompt. R6.1 / `proof-skills-command-guard-skip` and R6.4 / `proof-skills-command-grilling-skip` — a missing consult is named in the package copy |
| failure modes | obligation ↔ proof | R3.6 / `proof-skills-command-cancel-atomic` — cancel writes nothing; R5.1 / `proof-skills-command-write-error` — a write error exits 1 without a rollback. R6.5 / `proof-skills-command-host-coupled`, R6.6 / `proof-skills-command-commit-coupled`, R6.7 / `proof-skills-command-githost`, R6.8 / `proof-skills-command-validate-stop`, R6.9 / `proof-skills-command-adr-promote` — a missing procedure stops and names the piece that owns it |
| idempotency and retry | obligation ↔ proof | R3.5 / `proof-skills-command-identical` — a second run against a matching folder does not prompt and does not rewrite; R3.4 / `proof-skills-command-no-tty-keep` — a non-terminal repeat leaves a differing folder in place |
| authorization | `n/a` | Unchanged surface: the process writes as the current user. `src/cli.ts` and `src/setup/**` have no auth check, and this command adds none |
| concurrency and ordering | `n/a` | Unchanged surface: one process, no lock file. Overlapping runs of the command are out of scope |
| data lifecycle | obligation ↔ proof | R1.1 / `proof-skills-command-claude-project` — no harness config or core skill is written; R3.2 / `proof-skills-command-replace` — a yes deletes extra files inside that skill folder; skills the person did not choose are not opened. R6.2 / `proof-skills-command-no-guard-artifact` — a skipped guard writes no deferral. R6.4 / `proof-skills-command-grilling-skip` — the PRD file carries `grilling did not run` |
| external-dependency failure | `n/a` | Unchanged surface: skill bytes come from `templates/.agents/skills/` in this package. The command makes no network call |
| state transitions | obligation ↔ proof | R1.1 / `proof-skills-command-claude-project` — missing folder becomes the package copy; R3.2 / `proof-skills-command-replace` — differing folder becomes the package copy after yes; R3.1 / `proof-skills-command-decline` and R3.4 / `proof-skills-command-no-tty-keep` — differing folder stays; R3.5 / `proof-skills-command-identical` — matching folder stays. R6.3 / `proof-skills-command-skip-reader` and R6.10 / `proof-skills-command-adr-axis` — a skip sentence on an artifact stays a skip for a later read |
| observability | obligation ↔ proof | R4.2 / `proof-skills-command-missing-flag` and R4.6 / `proof-skills-command-help` — stderr names the bad choice, help lists the flags. No new log file. Other wording stays non-contract under ADR-003 |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition |
|------------|-------------------|-------|-------------------|--------------|
| — | — | — | — | None. The PRD's open questions are settled. |

## Out of scope

- Running `setup` or writing core skills, rules, runtime links, `.wolven-harness.json`, or package scripts.
- `setup --skill`, `setup --list-skills`, and a `skills` key on `.wolven-harness.json`.
- Adding one skill to an existing harness while leaving that harness's other setup choices in place.
- Changing `templates/.agents/skills/prototype/`, `the-fool/`, `the-jury/`, or `handoff/`.
- A second copy of a skill, or a package of skills, for a level of harness adoption.
- A substitute grilling interview, a substitute commit, a copied host procedure, or an ADR status change without `adr`.
- A hard stop that names the skills command, or `setup`, as the way to install `pragmatic-guard`, `grilling`, or `adr`.
- `~/.codex/skills/` and `.cursor/skills/`.
- A `--force` flag. A non-terminal run cannot replace an existing folder.
- Changing `setup`'s prompt or overwrite behavior.

## Pragmatic-guard refuses

- A new runtime dependency, or a prompt widget for disabled checkboxes. Core skills are named in the prompt message and omitted from the options. `@clack/prompts` stays the prompt library, through the existing `Prompter`.
- Extending `Prompter` with a `confirm` method. A replacement question is a `select` of yes and no.
- Calling `applyTemplates`. That function never overwrites and it installs the harness tree.
- Editing ADR-003 in place. The 0.3.0 text stays as history. The current contract is the draft successor, cited only after a human promotes it.
- A transaction or rollback journal for a failed write.
- Recording installed skills in config.
- A second skill tree so a lone install and a harness install diverge.
- An agent runner inside `pnpm test`. R6 is the sentences in the package copy.

## Acceptance

Verified on 2026-10-05 (America/Sao_Paulo), HEAD `f356692`: `pnpm test`
passed 579 tests; source validation passed. The R6 files were read directly,
the site proof was inspected, and the four excluded directories have no diff
against `origin/main`. These checks establish implementation evidence; ADR
promotion and pre-merge closure remain pending.

- [x] `proof-skills-command-claude-project` PASS — `pnpm test`
- [x] `proof-skills-command-multi-path` PASS — `pnpm test`
- [x] `proof-skills-command-shared-agents` PASS — `pnpm test`
- [x] `proof-skills-command-set-select` PASS — `pnpm test`
- [x] `proof-skills-command-core-disabled` PASS — `pnpm test`
- [x] `proof-skills-command-flag-expand` PASS — `pnpm test`
- [x] `proof-skills-command-core-flag` PASS — `pnpm test`
- [x] `proof-skills-command-decline` PASS — `pnpm test`
- [x] `proof-skills-command-replace` PASS — `pnpm test`
- [x] `proof-skills-command-per-folder` PASS — `pnpm test`
- [x] `proof-skills-command-no-tty-keep` PASS — `pnpm test`
- [x] `proof-skills-command-identical` PASS — `pnpm test`
- [x] `proof-skills-command-cancel-atomic` PASS — `pnpm test`
- [x] `proof-skills-command-nontty-ok` PASS — `pnpm test`
- [x] `proof-skills-command-missing-flag` PASS — `pnpm test`
- [x] `proof-skills-command-scope-both` PASS — `pnpm test`
- [x] `proof-skills-command-reask` PASS — `pnpm test`
- [x] `proof-skills-command-usage` PASS — `pnpm test`
- [x] `proof-skills-command-help` PASS — `pnpm test`
- [x] `proof-skills-command-write-error` PASS — `pnpm test`
- [x] `proof-skills-command-site` PASS — `site/commands.md` and `site/index.md` name `skills`
- [x] `proof-skills-command-guard-skip` PASS — read the four ship `SKILL.md` files
- [x] `proof-skills-command-no-guard-artifact` PASS — read the four ship `SKILL.md` files
- [x] `proof-skills-command-skip-reader` PASS — read `code-review` and `code-ci`
- [x] `proof-skills-command-grilling-skip` PASS — read `create-prd/SKILL.md`
- [x] `proof-skills-command-host-coupled` PASS — read `code-review` and `code-ci`
- [x] `proof-skills-command-commit-coupled` PASS — read `code-pr`, `code-ci`, and `pre-merge-closure.md`
- [x] `proof-skills-command-githost` PASS — read `host-operations.md`
- [x] `proof-skills-command-validate-stop` PASS — read `code-ci` and `pre-merge-closure.md`
- [x] `proof-skills-command-adr-promote` PASS — read `pre-merge-closure.md`
- [x] `proof-skills-command-adr-axis` PASS — read `code-review`, `code-ci`, and `pre-merge-closure.md`
- [x] `proof-skills-command-discovery-unchanged` PASS — `git diff` shows no change under `prototype/`, `the-fool/`, `the-jury/`, or `handoff/`
- [x] `pnpm exec tsx src/cli.ts validate` exits 0

## Eval / gates

| Gate | Command / check | When | PASS | Abort |
|------|-------------------|------|------|-------|
| Integrity | `pnpm exec tsx src/cli.ts validate` | End of the mutate batch | exit 0 | Fix; do not hand off |
| Tests | `pnpm test` | End of the mutate batch | exit 0 | Fix; do not hand off |
| Spec obligations | `proof-skills-command-spec-obligations` — every acceptance box names one obligation row; all nine landings are present; every `n/a` names an unchanged surface | Before `code-plan` | all hold | Do not plan |

## Cross-domain leak table

| Leak | Refuse |
|------|--------|
| Adding one skill to an existing harness | Stays the separate problem in the PRD |
| Rewriting `prototype`, `the-fool`, `the-jury`, or `handoff` | Those four directories stay unchanged — R6.11 |
| A substitute procedure for `grilling`, `code-commit`, host steps, `adr`, or `harness:validate` | R6 stops and names the owner |
| Treating a skip sentence as a passed consult or a merge-ready pull request | R6.3 and R6.10 |
| `setup --skill` and a config array of individual skills | Canceled with PR #27 |
| Publishing or a version bump for the new command | Release process, after the command exists |
| An executable plan from this skill | `code-plan` only |

## ADR

The successor draft has been prepared, and it carries the whole public contract: `setup`, `validate`, `comments`, and `skills`. ADR-003 stays the 0.3.0 contract and is not edited. The successor is a draft under `docs/adrs/`. This spec does not cite it: a claim against a draft ADR fails validate. After a human confirms the text, the `adr` skill promotes it, repoints claims from ADR-003, and marks ADR-003 `deprecated`.

## Section checklist

| Section | Required when |
|---------|-----------------|
| Source | Always |
| Repository grounding | Always |
| Surface walk | Always |
| Waves | Omitted — one mutate batch |
| Requirements with obligation ↔ proof | Always |
| Nine-dimension landings | Always — all nine named |
| Unresolved | Empty — no open product decision |
| Out of scope | Always |
| Pragmatic-guard refuses | Always |
| Acceptance | Always — boxes unchecked until evidence exists |
| Eval / gates | Always |
| Cross-domain leak table | Always |
| ADR | A draft successor carries the whole contract and is not cited here |

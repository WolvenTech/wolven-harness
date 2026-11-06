---
type: spec
title: Review the README and guide for the 0.4.0 release
description: Freeze the known mismatches, the statement-by-statement check and the merge order that bring the README, the eight Guide pages and the CLI help in line with 0.4.0.
status: stable
---

# Review the README and guide for the 0.4.0 release

**Source:** `docs/prds/release-docs-review/release-docs-review-prd.md` (status `stable`)
**Next:** After the Human approves → `code-plan` → `code-execute`, one wave.
**Named proof (this spec's own structural gate):** `proof-release-docs-review-spec-obligations`

## Terms

- **Statement:** any command, flag, skill, rule, path or behaviour an in-scope text names. This spec avoids "claim", which in this repository means an ADR reference.
- **Ledger:** a table in the pull request description with one row per in-scope file, listing what was checked and each mismatch as `fixed`, `defect` or `open`. It is not a repository file.
- **Guide pages:** the eight pages in the sidebar's Guide group: `site/index.md`, `install.md`, `cycle.md`, `search.md`, `layout.md`, `skills.md`, `runtimes.md` and `commands.md`.
- **Quiet install** and **full install:** as `site/layout.md` defines them.
- **First-time installer:** the reader of every in-scope text. A developer who uses a coding agent and knows git and npm, but has not met this project's vocabulary: skill, runtime, ADR, PRD, QMD, quiet install.

## Repository grounding

| Surface | Present today | Role for this initiative |
|---------|----------------|----------------------------|
| `README.md` | yes | Mutated. Ships in the npm package, so it freezes at publish |
| The eight Guide pages | yes | Mutated. Deploy on push to `main` through `.github/workflows/pages.yml` |
| `printUsage` in `src/cli.ts` | yes | Mutated, wording only |
| `src/setup/skill-sets.ts` | yes | Source of truth for skill sets: 11 core, 4 `ship`, 7 `discovery` |
| `templates/.agents/rules/` | yes | Source of truth for rules: `comments`, `project-skill-precedence`, `qmd-first`, `secrets`, `yagni-strict` |
| `src/doctor/runtime-checks.ts` | yes | Source of truth for `doctor-entry`, which emits both `error` and `warn` |
| `test/readme-install.test.ts`, `test/full-install-route.test.ts`, `test/harness-init-set.test.ts` | yes | Pin exact phrases from the README and Guide pages, so an edit can fail them |
| `site/.vitepress/config.ts` | yes | Sets no `ignoreDeadLinks`, so `pnpm docs:build` fails on a dead internal link |
| `site/release.md` | yes | Read-only here. Step 2 says to close and reopen the release PR before merging it |
| [Release PR 86](https://github.com/WolvenTech/wolven-harness/pull/86) | yes | The merge this initiative must precede |

Known mismatches, found by reading the files and by running `setup` and `doctor` in a clean repository built from `7275eef`:

| Where | Text says | 0.4.0 does |
|-------|-----------|------------|
| `README.md` `core` row | Nine skills | Eleven, with `harness-doctor` and `harness-remove` |
| `README.md` | Never names `uninstall` | `wolven-harness uninstall` exists |
| `site/install.md:57` | "There is no uninstall command" | The command exists, and `harness-remove` guides the rest |
| `site/commands.md` | No overview row or section for `uninstall`, on the page that defines the public CLI contract | Takes `--dir`, `--yes`, `--verbose` and `--debug` |
| `site/index.md:47` | Terminal commands omit `uninstall` | It is a terminal command |
| `site/layout.md:33`, `site/skills.md:2`, `site/skills.md` rules section | Three rules | Five |
| `site/install.md:19`, `site/runtimes.md:31` | Four rule bodies | Every `.agents/rules/*.md`, which is five |
| `site/commands.md` `doctor-entry` row | Level `error` | Also `warn`, as on a fresh quiet install |
| `site/layout.md:18` | `git status` shows the symlinks as untracked | Also shows `.wolven-harness.json` and the tracked part of `.wolven-harness/` |
| `site/commands.md` overview `setup` row | Adds missing package scripts | Only a full install does |
| `--help` `setup` line | Scaffolds `WOLVEN.md` | A quiet install writes no `WOLVEN.md` |
| `README.md` and `site/index.md:35` | Offer `doctor` right after setup, and name no QMD step | `doctor` exits 1 until QMD is on `PATH`, `.qmd` is linked and `qmd update` has built the index |

This list is the starting point. R2.1 still checks every statement on every page.

`harness-init` links `.qmd` in a quiet install but builds no index, and `setup` does not install QMD. In the clean repository, a hand-made `.qmd` link plus `qmd update` took `doctor` to `doctor: ok`. That run stood in for `harness-init`, which has not been run for this spec. `qmd update` also writes a `models:` block into `.qmd/index.yml`, which made `doctor` warn `doctor-drift-edited` on every install that followed the README. Under R2.7 the Human chose to fix that before the release, as its own commit to `src/doctor/drift.ts` in the same pull request.

## Surface walk

- **In scope:** `README.md`; the eight Guide pages; the `printUsage` strings in `src/cli.ts`; the three tests above, only where a pinned phrase is itself stale.
- **Out of mutate scope (unchanged):**
  - `site/release.md` and `site/contributing.md`
  - `site/.vitepress/config.ts`
  - `src/setup/**`, `src/doctor/**`, `src/uninstall/**` and every other `src/` file, apart from the `src/doctor/drift.ts` fix R2.7 brought in
  - `templates/**`
  - `AGENTS.md` and `CONTRIBUTING.md`
  - `.github/workflows/**`, `release-please-config.json` and `.wolven-harness.json`'s schema

## Requirements (obligation ↔ proof)

Commands for the proofs are under [Proof commands](#proof-commands).

### R1 — README

| ID | Obligation | Named proof | Evidence shape |
|----|------------|--------------|------------------|
| R1.1 | (AC-1.2) The `core`, `ship` and `discovery` rows list exactly `CORE_SKILLS` and `SET_SKILLS` | `proof-release-docs-review-readme-skill-sets` | Command, exit 0 |
| R1.2 | The README names `wolven-harness uninstall` | `proof-release-docs-review-readme-uninstall` | Command, exit 0 |
| R1.3 | (AC-1.1) Each README step behaves as written in a clean Git repository with a build of `main`, through a real `harness-init` Quick setup and the README's QMD steps, and `doctor` then exits 0 | `proof-release-docs-review-quickstart` | Commands plus an agent run, output compared with the README |
| R1.4 | (AC-1.3) When a step does not behave as written, the README is corrected and the quickstart reruns from the start in a new directory | `proof-release-docs-review-quickstart-rerun` | Ledger records a full run on the last commit touching `README.md` |
| R1.5 | (AC-1.1) `README.md` and `site/index.md` put `doctor` after `harness-init` and the first index build, and name the QMD install and `qmd update`, so an exit 1 straight after setup does not read as a failed install | `proof-release-docs-review-doctor-order` | Command, then inspect the placement |

### R2 — Guide pages

| ID | Obligation | Named proof | Evidence shape |
|----|------------|--------------|------------------|
| R2.1 | (AC-2.1) Every statement on the eight Guide pages is checked against `src/` and `templates/`, and no ledger row stays `open` | `proof-release-docs-review-guide-ledger` | Inspect the ledger: eight page rows, none `open` |
| R2.2 | `site/install.md` presents `wolven-harness uninstall` first and keeps the steps it does not cover. The `#uninstall-a-quiet-install` anchor keeps working, or `site/layout.md:22` follows it | `proof-release-docs-review-install-uninstall` | Command, exit 0 |
| R2.3 | `site/commands.md` documents `uninstall` in the overview and in its own section with all four flags, and `site/index.md` lists it among terminal commands | `proof-release-docs-review-commands-uninstall` | Command, exit 0 |
| R2.4 | The Guide pages name five rules and carry no stale count | `proof-release-docs-review-rule-counts` | Command, exit 0 |
| R2.5 | The `doctor-entry` row states both levels `src/doctor/runtime-checks.ts` emits | `proof-release-docs-review-doctor-levels` | Inspect the row against the code |
| R2.6 | (AC-2.2) Where setup output differs, the page says which install it describes, including the `git status` text in `site/layout.md`, `WOLVEN.md` in `site/install.md`, and the `setup` overview row in `site/commands.md` | `proof-release-docs-review-install-kinds` | Inspect the pages against a clean-repository `git status --short -uall` |
| R2.7 | (AC-2.3) A mismatch where the code is the defect leaves the text unchanged, gets a `defect` ledger row and reaches the Human, who decides whether it holds the release | `proof-release-docs-review-defect-reported` | Inspect: each `defect` row carries the Human's decision |
| R2.8 | (AC-2.4) The README and Guide pages use the first-time installer's words: `you` for the reader, no project-internal terms, and each harness term explained at first use on a page. Exact names of commands, flags, finding codes and config keys stay | `proof-release-docs-review-plain-language` | Command for the entry pages, then inspect every page |

### R3 — CLI help

| ID | Obligation | Named proof | Evidence shape |
|----|------------|--------------|------------------|
| R3.1 | (AC-3.1) The `setup` line does not imply the default install writes `WOLVEN.md` | `proof-release-docs-review-help-setup` | Command, prints `0` |
| R3.2 | (AC-3.1) Each `--help` summary matches the `site/commands.md` overview | `proof-release-docs-review-help-summaries` | Inspect `--help` beside the overview table |
| R3.3 | (AC-3.2) Under `src/`, only `printUsage` strings and the `src/doctor/drift.ts` fix change, so commands, flags and exit codes behave as before | `proof-release-docs-review-help-wording-only` | Command: the diff is `src/cli.ts` and `src/doctor/drift.ts`, the `src/cli.ts` hunks sit in `printUsage`, and `pnpm test` passes |

### R4 — Release

| ID | Obligation | Named proof | Evidence shape |
|----|------------|--------------|------------------|
| R4.1 | (AC-4.1) All corrections arrive in one pull request whose description holds the ledger | `proof-release-docs-review-single-pr` | Inspect the pull request |
| R4.2 | (AC-4.1) That pull request merges while release PR 86 is still open. PR 86 then gets the close and reopen `site/release.md` requires | `proof-release-docs-review-merge-order` | Command, prints `OPEN` before the docs merge |
| R4.3 | (AC-4.2) `pnpm docs:build` passes | `proof-release-docs-review-docs-build` | Command, exit 0 |
| R4.4 | (AC-4.2) Every external link in the README and Guide pages resolves. A failure is retried once, then fixed or recorded in the ledger | `proof-release-docs-review-external-links` | Command, no status above 399 |
| R4.5 | (AC-4.3) PR 86 stays unmerged while a ledger row is `open`, or while a `defect` row the Human chose to hold on is unresolved | `proof-release-docs-review-release-hold` | Inspect the ledger before merging PR 86 |

### Proof commands

Run from the repository root after `pnpm build`.

`proof-release-docs-review-readme-skill-sets`:

```bash
node --input-type=module -e "import {readFileSync as r} from 'node:fs'; import {CORE_SKILLS as c,SET_SKILLS as s} from './dist/setup/skill-sets.js'; const t=r('README.md','utf8'); let bad=0; for (const [n,l] of [['core',c],['ship',s.ship],['discovery',s.discovery]]) { const row=t.split('\n').find(x=>x.startsWith('| \`'+n+'\`')); const got=[...row.split('|')[3].matchAll(/\`([a-z-]+)\`/g)].map(m=>m[1]).sort(); const want=[...l].sort(); if (JSON.stringify(got)!==JSON.stringify(want)) { console.error(n,'missing',want.filter(x=>!got.includes(x))); bad=1 } } process.exit(bad)"
```

`proof-release-docs-review-readme-uninstall`:

```bash
grep -n 'wolven-harness uninstall' README.md
```

`proof-release-docs-review-quickstart`, in a new directory each run, with QMD on `PATH`. First run setup:

```bash
CLI="$PWD/dist/cli.js"; R=$(mktemp -d); git -C "$R" init -q; cd "$R"; node "$CLI" setup --git-host gh --runtimes claude --package-manager none; git status --short -uall
```

Then, in that directory, ask an agent to run `harness-init`, pick Quick setup, and answer yes to the `.qmd` link. This step has no command form. Finish with the lines below, where `doctor` must exit 0. `doctor-not-global` is expected, because the build is not on `PATH`:

```bash
qmd update; qmd embed; node "$CLI" doctor
```

`proof-release-docs-review-doctor-order`:

```bash
grep -n 'qmd update' README.md site/index.md
```

`proof-release-docs-review-install-uninstall`:

```bash
! grep -n 'There is no uninstall command' site/install.md && grep -n 'wolven-harness uninstall' site/install.md
```

`proof-release-docs-review-commands-uninstall`:

```bash
grep -n '^## `uninstall`' site/commands.md && grep -n '^| `uninstall` |' site/commands.md && grep -n '`uninstall`' site/index.md && for f in --dir --yes --verbose --debug; do sed -n '/^## `uninstall`/,/^## /p' site/commands.md | grep -q -- "$f" || exit 1; done
```

`proof-release-docs-review-rule-counts`:

```bash
! grep -nEi '(three|four) (standing rules|rules live|rule bodies)|the (three|four) rule|`comments`, `qmd-first`, and `yagni-strict`' site/index.md site/install.md site/cycle.md site/search.md site/layout.md site/skills.md site/runtimes.md site/commands.md && for r in $(ls templates/.agents/rules | sed 's/\.md$//'); do grep -q "\`$r\`" site/skills.md || exit 1; done
```

`proof-release-docs-review-plain-language`:

```bash
! grep -nE 'the Human|consumer repositor|[Ww]ired?\b|ask-only' README.md site/index.md site/install.md site/cycle.md
```

`proof-release-docs-review-help-setup`:

```bash
node dist/cli.js --help | grep -c 'WOLVEN.md'
```

`proof-release-docs-review-help-wording-only`:

```bash
git diff --name-only origin/main...HEAD -- src && git diff -U0 origin/main...HEAD -- src/cli.ts && pnpm test
```

`proof-release-docs-review-merge-order`:

```bash
gh pr view 86 --json state -q .state
```

`proof-release-docs-review-docs-build`:

```bash
pnpm docs:build
```

`proof-release-docs-review-external-links`:

```bash
grep -ohE 'https://[^) >"]+' README.md site/index.md site/install.md site/cycle.md site/search.md site/layout.md site/skills.md site/runtimes.md site/commands.md | sort -u | while read -r u; do curl -sSL -o /dev/null -w '%{http_code} %{url}\n' "$u"; done
```

## Nine-dimension landings

| Dimension | Landing kind | Landing |
|-----------|---------------|---------|
| validation | obligation ↔ proof | R2.1 / `proof-release-docs-review-guide-ledger` — every statement is checked against `src/` and `templates/` |
| failure modes | obligation ↔ proof | R2.7 / `proof-release-docs-review-defect-reported` — a code defect is reported, never documented as intended |
| idempotency and retry | obligation ↔ proof | R1.4 / `proof-release-docs-review-quickstart-rerun` — the quickstart reruns from the start in a new directory |
| authorization | `n/a` | Unchanged surface: `.github/workflows/**` and the npm trusted publishing path; this initiative changes no permission |
| concurrency and ordering | obligation ↔ proof | R4.2 / `proof-release-docs-review-merge-order` — the docs merge precedes the release merge. See `U-site-npm-gap` for the gap between them |
| data lifecycle | `n/a` | Unchanged surface: `.wolven-harness.json`'s schema and `src/setup/**`; no stored data changes |
| external-dependency failure | obligation ↔ proof | R4.4 / `proof-release-docs-review-external-links` — an unreachable external link is retried once, then fixed or recorded |
| state transitions | obligation ↔ proof | R4.5 / `proof-release-docs-review-release-hold` — PR 86 moves from open to merged only with no `open` row and no held `defect` |
| observability | obligation ↔ proof | R4.1 / `proof-release-docs-review-single-pr` — the ledger is the record of what was checked |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition |
|------------|-------------------|-------|-------------------|--------------|
| `U-site-npm-gap` | The Guide pages go live at the docs merge, ahead of the npm publish. Is a short gap acceptable, or should the two merges happen back to back? | Human | Non-blocking for the edits; blocks the merge in R4.2 | Resolve before merging the docs pull request |

## Out of scope

- An upgrade guide from 0.3.x.
- `site/release.md` and `site/contributing.md`.
- Positioning rewrites and onboarding restructuring.
- Any change to CLI flags, exit codes or finding codes, or to CLI behaviour beyond the fix R2.7 brought in.

## Pragmatic-guard refuses

- A new test or script that keeps checking docs after this release. The proofs here run once, and the PRD rules out automated drift checks.
- Rewording a sentence a first-time installer can already follow.
- A ledger file in the repository; the pull request description is enough.

## Acceptance

- [x] `proof-release-docs-review-readme-skill-sets` PASS — R1.1
- [x] `proof-release-docs-review-readme-uninstall` PASS — R1.2
- [x] `proof-release-docs-review-quickstart` PASS — R1.3
- [x] `proof-release-docs-review-quickstart-rerun` PASS — R1.4
- [x] `proof-release-docs-review-doctor-order` PASS — R1.5
- [x] `proof-release-docs-review-guide-ledger` PASS — R2.1
- [x] `proof-release-docs-review-install-uninstall` PASS — R2.2
- [x] `proof-release-docs-review-commands-uninstall` PASS — R2.3
- [x] `proof-release-docs-review-rule-counts` PASS — R2.4
- [x] `proof-release-docs-review-doctor-levels` PASS — R2.5
- [x] `proof-release-docs-review-install-kinds` PASS — R2.6
- [x] `proof-release-docs-review-defect-reported` PASS — R2.7
- [x] `proof-release-docs-review-plain-language` PASS — R2.8
- [x] `proof-release-docs-review-help-setup` PASS — R3.1
- [x] `proof-release-docs-review-help-summaries` PASS — R3.2
- [x] `proof-release-docs-review-help-wording-only` PASS — R3.3
- [ ] `proof-release-docs-review-single-pr` PASS — R4.1
- [ ] `proof-release-docs-review-merge-order` PASS — R4.2
- [x] `proof-release-docs-review-docs-build` PASS — R4.3
- [x] `proof-release-docs-review-external-links` PASS — R4.4
- [ ] `proof-release-docs-review-release-hold` PASS — R4.5

## Eval / gates

| Gate | Command / check | When | PASS | Abort |
|------|-------------------|------|------|-------|
| Integrity | `pnpm validate` | End of the wave | exit 0 | Fix; do not open the pull request |
| Tests | `pnpm test` | End of the wave | exit 0 | Fix the page, or a stale pinned phrase |
| Lint | `pnpm lint` | End of the wave | exit 0 | Fix |
| Comments | `pnpm comments` | End of the wave | exit 0 | Fix |
| Guide build | `pnpm docs:build` | End of the wave | exit 0 | Fix the link or page |
| Spec obligations | `proof-release-docs-review-spec-obligations` — every named proof appears in a requirement and in Acceptance; all nine landings; every `n/a` cites an unchanged surface | Before `code-plan` | all hold | Do not plan |

`proof-release-docs-review-spec-obligations`, which prints nothing when each proof sits in both places:

```bash
F=docs/specs/release-docs-review/release-docs-review-spec.md; for p in $(sed -n '/^## Requirements/,/^### Proof commands/p' "$F" | grep -oE 'proof-release-docs-review-[a-z-]+' | sort -u); do sed -n '/^## Acceptance/,/^## Eval/p' "$F" | grep -q -- "$p" || echo "missing: $p"; done
```

## Cross-domain leak table

| Leak | Refuse |
|------|--------|
| `setup`'s closing summary still tells the reader to remove the harness by hand | `src/setup/summary.ts` is outside the PRD's scope; a separate change |
| `entry-modes.md` in the `harness-init` template says four rule bodies | `templates/**` is outside the PRD's scope; a separate change |
| Fixing a defect found during the review | Its own commit, after the Human's decision under R2.7 |
| An upgrade path for 0.3.x installs | The release changelog, as the PRD decides |
| An executable plan from this skill | `code-plan` only |

## ADR

None needed this initiative.

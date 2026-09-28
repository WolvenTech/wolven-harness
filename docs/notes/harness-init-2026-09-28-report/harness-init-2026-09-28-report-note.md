---
type: note
title: Harness init dogfood report 2026-09-28
description: How the first run of init and the harness-init skill went on the wolven-harness package repo — the timeline, what worked, the friction and defects it surfaced, and recommended fixes.
status: stable
---

# Harness init dogfood report 2026-09-28

This report covers the first run of `wolven-harness init` followed by the
`harness-init` skill on this package's own repository. The run's own record
is the session note, `docs/notes/harness-init-2026-09-28/harness-init-2026-09-28-note.md`.
This report judges the process itself: what it asked, where it held up,
and where it broke or needed a workaround. The run stopped after step 6 by
design; no stub has been turned into a working skill.

## Outcome

- The harness is adopted and green. Validate reports
  `claims: 4 ok, 0 legacy-warn, 0 fail`, with three expected
  `skill-stub-open` warnings; all 480 tests pass, and `harness:comments`
  reports 0 findings.
- It landed as three commits, opened as PR #9 against `main`:
  - `c08fb3c` (entry phase): `init` output tracked, `WOLVEN.md` folded into
    `AGENTS.md` in full mode, and the `harness:*` scripts repointed.
  - `0382611` (setup phase): three ask-only stubs (`release-please`,
    `node-test`, `skill-templates`) and the stable session note.
  - `0fe1051` (outside the skill): repairs the `self-claim` test that the
    fold broke.
- Step 1 (legacy ADR migration) was skipped correctly; there were no
  legacy ADRs.
- Twelve questions went to the Human during the run, and two more after it
  (the PR and this report's form).

## Timeline

| # | Step | What happened | Human's answer |
| --- | --- | --- | --- |
| 1 | Pre-flight | `pnpm harness:validate` failed: `sh: wolven-harness: command not found`. Fell back to `pnpm build && node dist/cli.js validate`, which gave `step0-pending`, 2 claims ok, exit 0. | — |
| 2 | Step 0 | Session note created as `draft`, then validated. | — |
| 3 | Step 0 | Entry mode question; `AGENTS.md` was 25 lines, so full was recommended. | Full |
| 4 | Step 0 | Overlap: the folded text names `harness:validate` / `harness:comments`, which cannot run here. | Repoint the scripts to `dist/cli.js` |
| 5 | Step 0 | Overlap: the `AGENTS.md` comments bullet restates `.agents/rules/comments.md`. | Trim it to a pointer |
| 6 | Step 0 | Full diff shown (fold, scripts, `WOLVEN.md` deletion). | Write it |
| 7 | Step 0 | After the write, validate went **red**: `claim-missing` on the folded text's ADR 000 citation, because the ADR was untracked. | — |
| 8 | Step 0 | Asked what the entry commit should carry. | All of `init`'s output plus step 0 |
| 9 | Step 0 | The first `git add` failed on a pathspec for the never-tracked `WOLVEN.md` and staged nothing; the retry without it worked. Validate green. | — |
| 10 | Step 0 | Commit offer; the run was on an unrelated feature branch. | New branch, then commit |
| 11 | Step 1 | Skipped: `0 legacy-warn`, no `legacy-adr`. | — |
| 12 | Step 2 | The QMD index held 0 documents, so the tree was read directly. | Lifecycle: prototype; no hidden decisions |
| 13 | Step 3 | Web research offered and approved; five primary sources fetched and cited. | Web, capped at 5 |
| 14 | Step 4 | Three suggestions, each grounded in files; no fourth had evidence. | All three |
| 15 | Step 5 | Stubs rendered in scratch, shown, then written. Validate green with three `skill-stub-open` warnings. | Write all three |
| 16 | Step 6 | Note completed and set `stable`. `qmd status` had changed `.qmd/`, so that change was reverted. | — |
| 17 | Step 6 | Setup commit offer. | Commit |
| 18 | After | Rebased onto `main` without the unrelated README commit. `pnpm test` then failed `self-claim`; fixed, and 480/480 passed. PR #9 opened. | — |

## What worked

- **Validate gave clear next steps.** Every finding named the file, line,
  and rule, so each move was decided from its output rather than guessed.
- **One question at a time kept the run steerable.** Each question had a
  recommended option first; no answer needed a follow-up to clarify.
- **Diff before write.** Rendering the fold and the stubs in scratch first
  made each approval concrete. No write had to be undone because of
  something the Human did not see.
- **Phased commits matched the natural review units.** The entry commit and
  the setup commit read as separate changes, and the declined-commit path
  was never needed.
- **Most step 0 checks found nothing to do.** The `CLAUDE.md` import already
  existed, no ignore rule hid a harness path, and the existing ADR 001
  already fit the profile.
- **Stub gating works end to end.** The `wolven-harness: stub` marker,
  `disable-model-invocation`, `allow_implicit_invocation: false`, and the
  `skill-stub-open` warning together make half-defined skills visible and
  inert.
- **The session-note rule on naming ADRs held.** Naming ADRs by bare number
  and title kept the note's own record out of the claim gate.

## Friction and defects

Ordered by how much they would affect a consumer repo, not just this one.

### 1. Step 0 turns validate red in every full-mode fold

**What happened.** Before the fold, validate was green, but only because
`WOLVEN.md` was untracked and its claims went unchecked. After the fold,
`AGENTS.md` (tracked) cites ADR 000 in its closing lines, and validate
resolves ADRs only through `git ls-files`. `init`'s starter ADR was
untracked, so the claim failed with `claim-missing`.

**Why it matters.** Any consumer that picks full mode right after `init`
hits the same failure. The skill says a phase's commit is offered only once
validate exits 0, yet nothing in step 0 tells the agent to stage `init`'s
output first. Here it took an extra Human question to unblock.

**Suggested fix.** Either have step 0 stage `init`'s output before the
fold (the README already says "staging is enough"), or have the full-mode
reference state that the entry phase's commit carries `init`'s output.
Dropping the claim-form citation from the router's closing lines would
also remove the trap.

### 2. `harness:*` scripts cannot run in the package's own repo

**What happened.** `init` writes `"harness:validate": "wolven-harness validate"`.
In this repo, the package cannot resolve its own bin, so the skill's first
hard gate ("`harness:validate` drives what comes next") could not run as
written. The run used `pnpm build && node dist/cli.js validate` instead,
and step 0 repointed the scripts with the Human's OK.

**Why it matters.** Consumers are not affected: they install the package
as a devDependency. It does mean the harness cannot run unmodified on the
repo that builds it, and it forces a local deviation in `package.json`.

**Suggested fix.** `src/init/own-package.ts` already knows the package's
own name. `init` could detect that it is running in its own repo and write
the `node dist/cli.js` form, or skip the scripts there.

### 3. The writing profile points at a file the fold deletes

`docs/WRITING-PROFILE.md` line 47 refers to "`WOLVEN.md`'s
architecture-claims rule". Full and light modes both delete `WOLVEN.md`,
so the reference dangles right after step 0.
`templates/docs/WRITING-PROFILE.md` carries the same line, so every
consumer inherits it. Validate does not catch it, because it checks only
ADR claims and cited rule files, not plain file mentions. **Suggested fix:**
point the line at `AGENTS.md`'s harness section, or restate the rule
inline.

### 4. QMD is configured but not useful at discovery time, and not read-only

- `init` writes `.qmd/index.yml` but never builds the index, so step 2's
  "query the local index first" finds `0 files indexed` on every fresh
  run.
- `qmd status`, meant only as a check, created a 98 KB
  `.qmd/index.sqlite` and added a `models:` block to `.qmd/index.yml`.
  Both were reverted.
- Nothing ignores `.qmd/index.sqlite`, so any consumer who runs `qmd` gets
  a binary file waiting to be committed.

**Suggested fix:** decide whether `init` should add `.qmd/index.sqlite` to
the ignore rules (the skill already treats ignore edits as Human-approved
writes). The discovery reference could also say that an empty index is
expected on a first run and that any `qmd` command writes state.

### 5. The run doesn't check which branch it is on

The run started on `docs/readme-user-level-auth`, which already carried an
unpushed README commit. The entry commit offer would have landed on that
branch; the Human caught it and chose a new branch. Preparing the PR then
took a rebase onto `main` that left the README commit out. **Suggested
fix:** at the start of step 0, check the current branch and ahead-of-main
commits, and ask where the run's commits should go before the first commit
offer.

### 6. Folding the router into this repo broke a test

`test/claims.test.ts` (`self-claim`) copies the real `AGENTS.md` into a
fixture next to ADR 001 only. Once `AGENTS.md` cited the standing rules
and ADR 000, the fixture failed with `rule-missing` and `claim-missing`.
This affects only this repo, and it is fixed in PR #9 by copying what
`AGENTS.md` cites. It was caught before the PR only because the tests ran
locally. No CI job runs `pnpm test` on pull requests; the release job is
the first place it would have failed, and that job gates publishing.

### 7. `init` edits existing files more than `AGENTS.md` suggests

This repo's `AGENTS.md` says `init` "never overwrites, edits, or deletes an
existing path". `init` did edit two existing files:

- It added two scripts to `package.json`.
- It rewrote `.wolven-harness.json`, adding `packageVersion` and expanding
  the inline `"paths": ["src", "test"]` array onto separate lines.

The README documents the scripts and `packageVersion` as intended. The
formatting churn is not, and the `AGENTS.md` rule reads stricter than the
behavior. **Suggested fix:** reword the rule to name its exceptions, and
keep the existing JSON formatting when writing `packageVersion`.

### 8. Two identical copies of the skills tree

After `init`, this repo's `.agents/` is byte-identical to
`templates/.agents/`. The 14 skill-contract suites test only `templates/`.
An edit to one copy will not reach the other, so the installed skills
agents use here can drift from the ones the package ships. The
`skill-templates` stub exists to capture how this should work.

### 9. Smaller notes

- **Staging.** A `git add` that named the never-tracked `WOLVEN.md` failed
  as a whole and staged nothing; this was an agent slip, retried without
  that path.
- **Research fidelity.** Web pages were read through a summarizing fetch.
  The release-please manifest doc did not cover `initial-version`, which
  this repo's config relies on; this is recorded as unverified rather
  than claimed.
- **Question count.** Twelve questions came up in the run; two of them
  (the validate-command and comments overlaps) were specific to a package
  that dogfoods itself. A consumer repo would likely see about ten.

## Recommended follow-ups

| Priority | Item | Where |
| --- | --- | --- |
| High | Stage `init`'s output (or say the entry commit carries it) before a full or light fold | `harness-init` step 0 / `entry-modes.md` |
| High | Fix the `WOLVEN.md` pointer in the writing profile | `templates/docs/WRITING-PROFILE.md` and `docs/WRITING-PROFILE.md` |
| Medium | Check the current branch before the first commit offer | `harness-init` phased commits |
| Medium | Run `pnpm test` on pull requests | `.github/workflows/` |
| Medium | Decide on ignoring `.qmd/index.sqlite`, and on building the index at `init` | `init`, `discovery.md` |
| Low | Write `node dist/cli.js` scripts when `init` runs in its own repo | `src/init/` |
| Low | Keep `.wolven-harness.json` formatting; reword the `AGENTS.md` `init` rule | `src/init/config.ts`, `AGENTS.md` |
| Low | Decide how `.agents/` tracks `templates/.agents/` | the `skill-templates` stub |

## Where the run stopped

The run ends after step 6 by the Human's choice. The three stubs stay
ask-only and undefined; the Human answers each stub's four prompts and
removes its stub marker before any of them becomes a working skill.

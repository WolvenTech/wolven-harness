---
type: spec
title: Wolven harness D — Portable Code lane (Code plan)
description: Ordered work units for Entrega D — doc-folder layout and the shipped comments command in Wave D1, grilling, create-prd, adr, code-spec and code-plan in D2, the ship skills with builder brief and host contract in D3, and research, handoff, prototype, the maps-layout removal, plus ask-only and shipped-language checks in D4 — run by Sonnet builder subagents with parent-run wave gates.
status: archived
tags: [spec, code-plan, harness, code-lane, wolven, bitbucket, comments]
generated: { by: claude-code/code-plan, at: 2026-09-25T15:30:00Z }
updated: { by: claude-code/code-execute, at: 2026-09-26T17:36:53Z, note: "Executed: Waves D1-D4 PASS, D-Q28 review fix, merged as d495802" }
---

# Wolven harness D — Portable Code lane (Code plan)

- **Spec:** docs/specs/archived/wolven-harness-d-code-lane/wolven-harness-d-code-lane-spec.md (`stable`, approved 2026-09-25)
- **PRD:** docs/prds/archived/wolven-ai-assisted-dev-harness/wolven-ai-assisted-dev-harness-prd.md (`Executor: code`, `stable`; notes "shipped-artifact language" and "merges, versions, and changelog")
- **Projeto:** docs/prds/archived/wolven-ai-assisted-dev-harness/wolven-ai-assisted-dev-harness-project.md — Entrega D
- **Sibling plan:** docs/specs/archived/wolven-harness-a-core/wolven-harness-a-core-plan.md (A merged as `f33de1d`)
- **Next:** After the Human approves → `code-execute`, Waves **D1 → D2 → D3 → D4**. Runs in parallel with B. C needs D green.

## Structural gate (before planning)

`proof-whd-spec-obligations` — PASS 2026-09-25: 28 proof ids appear in the R rows, each once, and the 28 acceptance boxes name the same set; the nine-dimension table has nine landings and no `n/a`. Re-run after the D-Q26/D-Q27 amendment (2026-09-25): 26 proof ids ↔ 26 acceptance boxes, still one-to-one.

## Execution setup

| Item | Value |
|------|-------|
| Package clone | `/Users/rafael/Desktop/wolven-harness`, clean on `main` at `f33de1d` (verified 2026-09-25) |
| Branch | `feat/d-code-lane`, cut from `origin/main` (`f33de1d`) and pushed 2026-09-25 with no commits yet. Every unit commits there |
| Parallel with B | Spec B works on its own branch. D owns `src/validate/profile.ts`, the `WOLVEN.md` router and standing rules, and `src/init/package-script.ts`. Conflicts are resolved by the second PR to merge |
| Push / PR | Ask-only (`code-pr`). One PR, titled as a Conventional Commit, opened after the D1 gate commit (the Human's decision, 2026-09-25) and updated at each later wave. The Human squash-merges it after D4 |
| Builder model | Builder units spawn `builder` with `model: sonnet`. The parent runs gate units, reviews each return against Done when, and restores anything outside Owns |
| Parallel builders | Share one clone and need disjoint Owns. Builders run `pnpm test` only, never `pnpm build` (shared `dist/`). They never run `init` outside a test fixture |
| Commits | The Human runs `/code-commit` at each wave gate (the A pattern: one package commit per wave). Builders never commit |
| OMT | Read-only extract source (`.agents/skills/**`, `.agents/agents/builder.md`). OMT writes: this plan's resume section, units 27–28, and the spec amendment for D-Q26/D-Q27 with its deferral |

### Seams fixed by the plan

Later units build on these seams without editing each other's files:

- **Comments module.** Unit 03 creates `src/comments/{index,diff,rules,leak-rules}.ts`, with `runComments(argv, io): Promise<number>` wired as `wolven-harness comments` in `src/cli.ts`. Unit 04 adds `src/comments/config.ts` and changes only the file-selection step in `index.ts`.
- **Old gate.** `scripts/comment-*.ts`, `.comment-gate.json`, and the old `pnpm comments` script stay working until unit 06 switches `pnpm comments` to `node dist/cli.js comments` and deletes them. Until then, the builder final check is the old `pnpm comments`.
- **Skill-contract helper.** Unit 08 writes `test/helpers/skill-contract.ts`. It provides `readSkill(name)` (returning frontmatter, body, headings, and files), `assertSkillBasics(name)` (checks `name` and `description`, that local links resolve, and that `harness:validate` appears where `pnpm validate` does not), and `renderInto(fixtureFiles, templatePath, dest, vars)` for "a doc rendered from the template passes `validate`" proofs. Each skill unit adds `test/skill-<name>.test.ts`.
- **Cross-skill references.** A skill names another skill by name in backticks (`adr`, `grilling`), never by relative link. A relative link stays inside the skill's own folder. The one exception is `code-pr/references/host-operations.md`, which lands first in D3 (unit 14) and is linked from the other ship skills. This lets the skills in a wave run in parallel.
- **Ask-only flag.** Each ask-only skill gets `disable-model-invocation: true` and `agents/openai.yaml` (`policy.allow_implicit_invocation: false`) in its own unit. Unit 25 adds the test over all skills.
- **Test prefixes.** Each test name starts with its proof's short id (for example `doc-layout:`, `comments-cli:`, `skill-adr:`, `host-contract:`) so that a gate can map proofs to tests with `grep`.

## Wave stops

| Stop | After unit | Gate |
|------|------------|------|
| **D1** | 07 | `rm -rf dist && pnpm build && pnpm test && pnpm validate && pnpm comments` exit 0; PRD sweep (D-Q1 globs, gate globs moved to `src/comments/leak-rules.ts` and `test/comments-rules.test.ts`) and the R4.1 residue grep empty; every D1 proof maps to a passing test — **abort before D2** |
| **D2** | 13 | Same, plus the `skill-*` tests for grilling, create-prd, adr, code-spec, and code-plan — **abort before D3** |
| **D3** | 20 | Same, plus `builder-brief:`, `host-table:`, and `host-contract:` tests — **abort before D4** |
| **D4** | 26 | Same, plus the ask-only test over all 15 template skills, the R4.3 doc-path grep, and all 26 proofs mapped — **no handoff to C**. Every gate grep over `templates` runs with `--hidden` (the skills live under `templates/.agents/`) |
| **Record** | 27, 28 | D4 PASS, then the squash SHA on `main`, recorded in the TAP; OMT `pnpm docs:index && pnpm validate` PASS |

Initiative pre-merge closure lives in spec C; this plan has no closure unit.

## Unresolved

The spec has no blocking rows. It carries three non-blocking rows, whose dispositions the Human set in the spec:

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
|---|---|---|---|---|---|
| `U-d-bitbucket-live` | Run the ship skills against a real Bitbucket repo | Human | Non-blocking (D-Q3); the host contract test is the D proof | Defer — trigger: first Bitbucket consumer; fixes land as package patches (Q18) | 14 |
| `U-d-comment-languages` | Syntax entries beyond JS/TS | Human | Non-blocking (D-Q9); config mechanism ships in unit 04 | Defer — trigger: brownfield dogfood in spec C hits another language | 04 |
| `U-a-cloud-app` | Claude GitHub App on WolvenTech | Human (org admin) | Non-blocking; execute runs locally | Carried from spec A — still deferred | — |

## Work units

Subagent *(omit)* = spawn `builder` with `model: sonnet` and the brief below.

### Wave D1 — doc-folder layout, comments command, comments rule

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 01 | Doc-folder layout in `validate` (R0.1) | — | `src/validate/profile.ts`, `test/profile.test.ts`, `test/claims.test.ts` (fixture paths only) | *(omit)* | `validate` maps `prds`/`specs`/`notes`/`deferrals`/`maps` to their singular types and checks `docs/<folder>/<slug>/<slug>-<type>.md`. Tests show: `docs/prds/x/x-prd.md` with `type: prd` → exit 0; with `type: spec` → exit 1 naming the rule; flat `docs/specs/y.md` → exit 1 naming `docs/specs/y/y-spec.md`; a folder missing its main doc → exit 1; `z-plan.md` beside `z-spec.md` → exit 0; `docs/maps/m/03-ticket.md` without frontmatter → exit 0; `docs/notes/archived/a/a.md` not checked; spec A's ADR fixtures still pass. Flat fixtures in `test/profile.test.ts` and `test/claims.test.ts` move to the folder layout, and the claim logic is unchanged — `proof-whd-doc-layout` |
| 02 | Layout surfaces for `init` (R0.2) | 01 | `templates/docs/{prds,maps}/.gitkeep`, `templates/.qmd/index.yml`, `templates/docs/WRITING-PROFILE.md`, `templates/WOLVEN.md` (router table only), `templates/.agents/skills/{pragmatic-guard,qmd}/SKILL.md` and `templates/.agents/rules/{yagni-strict,qmd-first}.md` (deferral paths and collection notes only), `test/init-surfaces.test.ts`, `test/init-layout.test.ts`, `test/seed-extract.test.ts`, `README.md` (layout section) | *(omit)* | `init` into an empty fixture creates `docs/{prds,specs,notes,deferrals,maps}/.gitkeep`; `.qmd/index.yml` has one collection per folder, with `"!(archived)/**/*.md"` for the five doc-folder types and `"*.md"` for `adrs`; `WRITING-PROFILE.md` documents the layout and the type map, stays ≤80 lines, and still passes spec A's `profile-doc:` test; the router shows `docs/<folder>/<slug>/<slug>-<type>.md`; the two deferral templates write `docs/deferrals/<slug>/<slug>-deferral.md`; the README describes the layout — `proof-whd-init-layout` |
| 03 | `comments` command and rules (R1.1, R1.2) | — | `src/comments/{index,diff,rules,leak-rules}.ts`, `src/cli.ts` (`comments` subcommand and help line), `test/cli.test.ts` (help line), `test/comments-cli.test.ts`, `test/comments-rules.test.ts` (moved from `test/comment-gate.test.ts`, which is deleted) | *(omit)* | `wolven-harness comments [--base <ref>]` resolves the git top level and judges lines added since the base (default: merge-base with `origin/HEAD`, then `origin/main`, then `main`), plus untracked files. It prints `<file>:<line>: [<kind>] <message>` and ends with `comments: ok (0 findings)` or `comments: <n> finding(s)`. Tests: a non-git dir → exit 1; a repo with no `origin` or `main` → exit 1 naming `--base`; a clean branch → exit 0 with the ok line. The 17 moved cases pass, plus JSDoc above a function passes, a `/** */` block above a statement fails untagged, `@todo` in JSDoc fails, and an interior JSDoc edit passes. `scripts/` is untouched — `proof-whd-comments-cli`, `proof-whd-comments-rules` |
| 04 | `comments` scope and language config (R1.3) | 03 | `src/comments/config.ts`, `src/comments/index.ts` (file selection only), `test/comments-config.test.ts` | *(omit)* | Built-in syntax covers `.ts .tsx .js .jsx .mjs .cjs`; `comments.languages` maps an extension to `{ line, block? }`, and JSDoc handling applies to the built-ins only; `ignore` dirs are excluded; `comments.paths`, when set, replaces the default set; a malformed `comments` key → exit 1 naming it; the summary counts files skipped for having no syntax. Tests: an untagged `#` comment in `.py` is ignored by default and flagged once `.py` maps to `#`; a file under an `ignore` dir is not judged; `paths: ["src"]` skips `lib/`; `languages: {".py": {}}` → exit 1 — `proof-whd-comments-config` |
| 05 | Install `harness:comments` and the comments rule (R1.4) | 02, 03 | `src/init/package-script.ts`, `templates/.agents/rules/comments.md`, `templates/WOLVEN.md` (standing rules only), `test/init-apply.test.ts` (script cases), `test/comments-install.test.ts`, `README.md` (comments section) | *(omit)* | On a fresh fixture, `init` adds exactly `harness:validate` and `harness:comments` (`wolven-harness comments`) to `package.json`, and a re-run adds nothing; the rule file is created with the style hints (why, not what; a better name over a comment; ≤4 lines; no change narration; no planning ids) and names the command; `WOLVEN.md` cites `.agents/rules/comments.md` under Standing rules; `validate` (spine included) passes on the fixture — `proof-whd-comments-install` |
| 06 | The package runs the shipped command on itself (R1.5) | 04 | `package.json` (`comments` script only), `.wolven-harness.json` (`comments.paths`), `AGENTS.md` (comment rule text), delete `scripts/comment-gate.ts`, `scripts/comment-leak-rules.ts`, `.comment-gate.json` | *(omit)* | `scripts/comment-*.ts` and `.comment-gate.json` are gone; `pnpm comments` is `node dist/cli.js comments`; `.wolven-harness.json` sets `comments.paths: ["src", "test"]`; `AGENTS.md` describes the command and not the old script; the builder reports the result of `pnpm build && pnpm comments` (exit 0) for the parent to confirm at the gate — `proof-whd-comments-self` |
| 07 | **Wave D1 gate** | 01–06 | — | `inline` | The parent runs `rm -rf dist && pnpm build && pnpm test && pnpm validate && pnpm comments` (exit 0), the PRD sweep with the moved gate globs, and the R4.1 residue grep over `templates src` (both empty, with any hand-reviewed hits named), and checks that `LICENSE` is absent. Each D1 proof maps to passing tests by prefix. The Human runs `/code-commit`. On failure → **abort before D2** |

### Wave D2 — grilling, create-prd, adr, code-spec, code-plan

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 08 | `grilling` + skill-contract helper (R2.11) | 07 | `templates/.agents/skills/grilling/**`, `test/helpers/skill-contract.ts`, `test/skill-grilling.test.ts` | *(omit)* | The portable `grilling` keeps the design tree, frontier rounds, one question per turn with the recommended option first, a stop after each question, facts found by the agent rather than asked, and "done when the frontier is empty and the Human confirms". It uses the runtime's question tool when one exists and otherwise asks in markdown in the same shape. It is model-invocable. The test uses the helper: rules present; no runtime tool name outside a "when available" clause; links resolve; no `pnpm validate` — `proof-whd-skill-grilling` |
| 09 | `create-prd` (R2.1) | 08 | `templates/.agents/skills/create-prd/**`, `test/skill-create-prd.test.ts` | *(omit)* | `SKILL.md` has the five workflow steps (grill the problem through `grilling` with no cap, term challenge, draft to `docs/prds/<slug>/<slug>-prd.md`, approve `draft` → `stable` only on the Human's word, ADR offer) and the Refuses list. `references/prd-template.md` has the six sections, one `US-1`, and one `AC-1.1` in Given/When/Then. Test: steps and headings present; a PRD rendered from the template passes the `prd` profile in `validate`; `rg -i "cynefin\|dice\|executor\|board\|ticket"` over the skill is empty — `proof-whd-skill-create-prd` |
| 10 | `adr` (R2.2) | 08 | `templates/.agents/skills/adr/**`, `test/skill-adr.test.ts` | *(omit)* | The skill creates the next free `docs/adrs/adr-NNN-<slug>.md` as `draft` from its template, promotes to `stable` only on the Human's confirmation, and supersedes by marking the old ADR `deprecated` with `superseded_by` and repointing its `ADR-NNN` and `adr-NNN-<slug>` claims. It runs `harness:validate` after each operation. Test: the three operations and the validate step are present; a fixture ADR written from the template passes `validate` — `proof-whd-skill-adr` |
| 11 | `code-spec` (R2.3) | 08 | `templates/.agents/skills/code-spec/**`, `test/skill-code-spec.test.ts` | *(omit)* | It follows its extraction-map row: its input is a PRD or a confirmed ask; it keeps obligation↔proof pairs, nine dimensions, typed Unresolved, waves, eval and gates, the cross-domain leak table, and an ADR section that points to `adr`; it writes `docs/specs/<slug>/<slug>-spec.md`; TEMPLATE and EXAMPLE are generic, with no One-Man-Team cases. Test: the sections are present and links resolve — `proof-whd-skill-code-spec` |
| 12 | `code-plan` (R2.4) | 08 | `templates/.agents/skills/code-plan/**`, `test/skill-code-plan.test.ts` | *(omit)* | It keeps the units table, depends, Owns, observable Done when, wave stops, Unresolved rows, and the safety valve. The Subagent column takes `spawn` \| `inline`, and the skill writes `docs/specs/<slug>/<slug>-plan.md` next to its spec. There is no writer, ADR-004/005, N threshold, or `board-decompose`. Test: those elements are present, and the Subagent values are exactly `spawn` and `inline` — `proof-whd-skill-code-plan` |
| 13 | **Wave D2 gate** | 09–12 | — | `inline` | The D1 gate commands run again, and the `skill-*` tests for the five D2 skills pass. The sweep (skill folders excluded under D-Q1) and the residue grep are empty. The Human runs `/code-commit`. On failure → **abort before D3** |

### Wave D3 — ship skills, builder brief, host contract

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 14 | Host operations table + contract test (R3.1, R3.2) | 13 | `templates/.agents/skills/code-pr/references/host-operations.md`, `test/host-contract.test.ts` | *(omit)* | The table lists nine operations: push branch, open PR, read PR and diff, list unresolved threads, reply to a thread, resolve a thread, post a review comment, read check status, and read a failing log. Each row has the GitHub MCP tool, the `gh` fallback, the Rovo MCP tool (or "none"), the Bitbucket REST route, and a doc URL per host. The preamble says: read `gitHost`, try MCP first, fall back without asking, and take credentials only from the MCP session or a named environment variable. Tool names come from the spec's grounding rows and the linked docs. The test parses the table (every GitHub and Bitbucket cell is non-empty, and each row has both URLs), and a grep over `templates/.agents/skills/**` outside this file for `gh `, GitHub MCP names, Rovo names, and `api.bitbucket.org` is empty — `proof-whd-host-table`, `proof-whd-host-contract` |
| 15 | `code-execute` + builder brief (R2.5) | 13 | `templates/.agents/skills/code-execute/**`, `test/skill-code-execute.test.ts` | *(omit)* | It keeps the seven-field resume section, the pre-start print, validate before commit, and the plan mark in the same commit. `references/builder-brief.md` carries the unit row verbatim, Owns and must-not-touch, "tests only — no build, commit, or push", the final check (`harness:comments` and `harness:validate`, with both outputs pasted), and the return shape (files, checklist, check outputs, blockers). The SKILL tells the parent to paste the brief and to re-run the final check at every wave gate. There is no writer, Fast-draft, `docs/index`, or `.agents/agents` loading. Test over the SKILL and the brief — `proof-whd-builder-brief` |
| 16 | `code-commit` (R2.6) | 13 | `templates/.agents/skills/code-commit/**`, `test/skill-code-commit.test.ts` | *(omit)* | It keeps Conventional Commits, the atomic plan mark, the split heuristics, and failed-commit cleanup, with examples free of One-Man-Team paths. It is ask-only (frontmatter plus `agents/openai.yaml`). Skill-contract test — `proof-whd-skill-code-commit` |
| 17 | `code-pr` (R2.7) | 14 | `templates/.agents/skills/code-pr/{SKILL.md,agents/**,references/pr-body-template.md,references/pre-merge-closure.md}`, `test/skill-code-pr.test.ts` | *(omit)* | The PR title is always `type(scope): summary`. It pushes on every run, never merges, and verifies with real evidence. Host steps cite `references/host-operations.md` by operation name. `pre-merge-closure.md` moves the spec folder to `docs/specs/archived/<slug>/` and the PRD folder to `docs/prds/archived/<slug>/` (all `deprecated`), leaves new or amended ADRs `stable`, and runs `harness:validate`. It is ask-only. Test: title rule and closure steps present — `proof-whd-skill-code-pr` |
| 18 | `code-review` (R2.8) | 14 | `templates/.agents/skills/code-review/**`, `test/skill-code-review.test.ts` | *(omit)* | The review is grounded in the PR's cited refs, marks findings as blocking or nit, and never merges. Host steps go through host operations. There is no Bugbot, Cursor, or ClickUp. It is ask-only. Skill-contract test — `proof-whd-skill-code-review` |
| 19 | `code-ci` (R2.9) | 14 | `templates/.agents/skills/code-ci/**`, `test/skill-code-ci.test.ts` | *(omit)* | It runs conflicts → comments → CI → closure and separates inherited failures from in-scope ones. Host steps go through host operations, including the REST fallback for resolving threads on Bitbucket. It is ask-only. Skill-contract test — `proof-whd-skill-code-ci` |
| 20 | **Wave D3 gate** | 15–19 | — | `inline` | The D1 gate commands run again, and the `builder-brief:`, `host-table:`, `host-contract:`, and `skill-code-*` tests pass. The sweep and the residue grep are empty. The Human runs `/code-commit`. On failure → **abort before D4** |

### Wave D4 — research, handoff, prototype, maps-layout removal, ask-only, shipped language

Amended 2026-09-25 by spec decisions D-Q26 (drop `wayfinder`) and D-Q27 (remove the maps layout). Unit 21 is redefined; the rest of the wave keeps its numbers.

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 21 | Remove the maps layout (D-Q27) | 20 | `src/validate/profile.ts`, `test/profile.test.ts`, `templates/docs/maps/.gitkeep` (delete), `templates/.qmd/index.yml`, `templates/WOLVEN.md` (router row), `templates/docs/WRITING-PROFILE.md`, `templates/.agents/skills/qmd/SKILL.md` and `templates/.agents/rules/qmd-first.md` (collection notes), `test/init-layout.test.ts`, `test/init-surfaces.test.ts`, `README.md` (layout section) | *(omit)* | `validate` maps only `prds`/`specs`/`notes`/`deferrals` (plus flat `adrs`); anything under `docs/maps/` is not profile-checked. `init` creates no `docs/maps/`; `.qmd/index.yml` has the four doc-folder collections plus `adrs`; the router, writing profile, README, `qmd` skill, and `qmd-first` rule no longer mention maps. Tests: the existing `doc-layout:` and `init-layout:` cases updated (the frontmatter-free extras case moves to a notes folder; a `docs/maps/m/m-map.md` with any frontmatter → exit 0); `rg --hidden -n -i "docs/maps|maps" templates src README.md` empty — `proof-whd-doc-layout`, `proof-whd-init-layout` (re-proven) |
| 22 | `research` (R5.3) | 20 | `templates/.agents/skills/research/**`, `test/skill-research.test.ts` | *(omit)* | It runs frame → QMD first → primary sources → cited note → verify → finalize, and refuses secondary-only summaries. The note lands at `docs/notes/<slug>/<slug>-note.md` (`type: note`), with sources allowed beside it. It is model-invocable. Test: steps present; a note rendered from the template passes `validate` — `proof-whd-skill-research` |
| 23 | `handoff` (R5.4) | 20 | `templates/.agents/skills/handoff/**`, `test/skill-handoff.test.ts` | *(omit)* | It saves to the OS temp directory, never the repo. The template carries the goal, context, artifacts, open decisions, suggested skills, cross-runtime notes for Claude Code, Codex, and Cursor, and a redaction step. It is ask-only. Skill-contract test — `proof-whd-skill-handoff` |
| 24 | `prototype` (R5.5) | 20 | `templates/.agents/skills/prototype/**`, `test/skill-prototype.test.ts` | *(omit)* | It has `LOGIC.md` and `UI.md`, the location table, `PROTOTYPE` marking, and discard-or-promote with the verdict recorded on the PRD. There are no board or map references. It is model-invocable. Skill-contract test — `proof-whd-skill-prototype` |
| 25 | Ask-only test over every skill (R2.10) | 21–24 | `test/ask-only.test.ts` | *(omit)* | Over all 15 template skills: `code-commit`, `code-pr`, `code-review`, `code-ci`, and `handoff` carry `disable-model-invocation: true` and an `agents/openai.yaml` with `policy.allow_implicit_invocation: false`, and the other ten carry neither. A skill that fails is reported to the parent, not fixed outside Owns — `proof-whd-ask-only` |
| 26 | **Wave D4 gate** | 25 | — | `inline` | The D1 gate commands run again and every test passes. The parent runs the R4.1 residue grep (empty, no `LICENSE`), the R4.2 PRD sweep (empty, hand-reviewed hits named), and the R4.3 `rg -n "docs/(prds\|specs\|notes\|deferrals\|maps)/[a-z0-9<>-]+\.md" templates` (empty), each with `--hidden`. All 26 proofs map to passing tests or gate checks. The Human runs `/code-commit`. On failure → **no handoff to C** — `proof-whd-no-residue`, `proof-whd-sweep`, `proof-whd-doc-paths` |

### Record

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 27 | Record D green in OMT | 26 | `docs/specs/archived/wolven-harness-d-code-lane/wolven-harness-d-code-lane-spec.md` (26 acceptance boxes), `docs/prds/archived/wolven-ai-assisted-dev-harness/wolven-ai-assisted-dev-harness-project.md` (D milestone note), `docs/prds/archived/wolven-ai-assisted-dev-harness/wolven-ai-assisted-dev-harness-prd.md` (sweep gate globs → `src/comments/leak-rules.ts`, `test/comments-rules.test.ts`), this plan | `inline` | The 26 acceptance boxes are ticked with test-prefix evidence; the TAP notes the D4 gate date and the `feat/d-code-lane` head SHA; the PRD sweep globs name the moved files; OMT `pnpm docs:index && pnpm validate` exit 0 |
| 28 | Record the merge | 27; Human `code-pr` + squash merge | `docs/prds/archived/wolven-ai-assisted-dev-harness/wolven-ai-assisted-dev-harness-project.md`, this plan (Merge line) | `inline` | The TAP cites the squash SHA on `main` (not branch SHAs); the parent re-runs the D4 gate commands on `main` and records the result; OMT `pnpm validate` exit 0. D closes, and C may start |

## Frontier order

**Wave D1:** (01 ∥ 03) → (02 ∥ 04) → (05 ∥ 06) → **07 STOP**

**Wave D2:** 08 → (09 ∥ 10 ∥ 11 ∥ 12) → **13 STOP**

**Wave D3:** (14 ∥ 15 ∥ 16) → (17 ∥ 18 ∥ 19) → **20 STOP**

**Wave D4:** (21 ∥ 22 ∥ 23 ∥ 24) → 25 → **26 STOP** → 27 → 28

At most four Sonnet builders run at once. Owns are disjoint within each parallel group: 02 and 05 share `templates/WOLVEN.md` and `README.md` sections, so 05 waits for 02. Never pack a later wave's units into an earlier batch to skip its gate.

## Builder brief (every spawned unit)

Each builder prompt carries:

- the unit row verbatim, with the spec path and the R rows it owns;
- the seams above;
- the extraction-map row, and the OMT source path to read (read-only), for skill units;
- "edit only your Owns; everything else is read-only";
- "run `pnpm test` only — no build, no commit, no push, and no `init` outside a test fixture";
- the shipped-language rule: no planning ids, units, waves, proof ids, spec letters, or One-Man-Team names in anything outside the D-Q1 skill folders, and never `pnpm validate` inside `templates/`;
- the final check: `pnpm comments` and the PRD sweep over the files it touched, with both outputs pasted and empty (hand-reviewed hits named).

It returns changed files, test names mapped to proof ids, the `pnpm test` tail, both final-check outputs, and anything it could not keep inside Owns. The parent rejects a return that edits outside Owns, maps no test to a proof, or skips the final check.

## Pragmatic-guard refuses

- New runtime deps (glob matchers, markdown parsers, YAML front-matter libraries beyond `yaml`)
- Builders touching `package.json` outside unit 06
- Changes to claim, legacy, or ignore logic in `src/validate/{claims,legacy,config,repo}.ts`. Unit 01 moves fixture paths only
- Verbatim copies of OMT skill files; each skill is a portable rewrite
- A `comments` baseline file, or folding `comments` into `validate`
- A per-unit markdown farm, or ClickUp cards for these units
- Starting spec C work before unit 28

## Execution / resume section

Work lands in `/Users/rafael/Desktop/wolven-harness` on `feat/d-code-lane`. This section is the only resume record; `code-execute` adds one block per unit.

### Wave D1 — resume (opened 2026-09-25)

Shared fields for units 01–07 unless a unit block says otherwise.

| Field | Value |
|-------|-------|
| Spec / plan | `docs/specs/archived/wolven-harness-d-code-lane/wolven-harness-d-code-lane-spec.md` / `docs/specs/archived/wolven-harness-d-code-lane/wolven-harness-d-code-lane-plan.md` |
| `HEAD` | package `f33de1d` (`feat/d-code-lane`, in sync with origin); OMT `29e43d4` |
| `git status` | package clean; OMT clean apart from this resume section |
| Baseline | `rm -rf dist && pnpm build && pnpm test` (131 pass) `&& pnpm validate && pnpm comments` exit 0 on `f33de1d` |
| Resolved opt | OMT `.agents/code-commit.config.yml`: `autocommit: true`, `autocommit-rule: wave` |
| Discrepancies | (1) The opt says the parent commits at the wave gate; the plan says the Human runs `/code-commit` at each wave gate, in the package repo → **resolved: the plan wins**, and the parent stops at 07 for the Human's commit. (2) Parallel builders share one clone, so `pnpm comments` and `pnpm test` can see other units' in-flight work → **resolved: each builder names foreign hits, and the parent gate is the source of truth**. (3) `test/seed-extract.test.ts` forbids `/wayfind/i` under `templates/.agents/`, but D4 ships a `wayfinder` skill, and unit 21 does not own that test → **escalated to D4**: the parent resolves it before spawning unit 21 (Human decision on scoping that test line into 21). **Resolved 2026-09-25 by D-Q26**: `wayfinder` is dropped, so the guard stays as is. (4) Unit 04: the rules module hard-codes JS/TS syntax, so Done when (`.py` flagged once mapped to `#`; JSDoc built-ins only) cannot be met by changing only file selection → **resolved: Owns extended to `src/comments/rules.ts`**, limited to threading a per-file syntax through (default = built-in, so existing behavior is unchanged). Unit 03 is done and no live unit owns the file. Obligation unchanged |

| Unit | Obligations | Intended diff (Owns) | Status |
|------|-------------|----------------------|--------|
| 01 — Doc-folder layout in `validate` | R0.1 / `proof-whd-doc-layout` | `src/validate/profile.ts`, `test/profile.test.ts`, `test/claims.test.ts` (fixture paths) | done (committed in `68ed6f3`) — diff inside Owns; `doc-layout:` 6 tests + moved fixtures; profile+claims 37 pass (parent re-run) |
| 03 — `comments` command and rules | R1.1, R1.2 / `proof-whd-comments-cli`, `proof-whd-comments-rules` | `src/comments/{index,diff,rules,leak-rules}.ts`, `src/cli.ts`, `test/cli.test.ts`, `test/comments-cli.test.ts`, `test/comments-rules.test.ts`, delete `test/comment-gate.test.ts` | done (committed in `68ed6f3`) — diff inside Owns, `scripts/` untouched; 17 moved `comments-rules:` cases + 3 new, 4 `comments-cli:`; 29 pass (parent re-run). D-Q10 drops the old JSDoc informativeness check |
| 02 — Layout surfaces for `init` | R0.2 / `proof-whd-init-layout` | per plan row | done (committed in `68ed6f3`) — diff inside Owns (no `src/init` change: init walks templates); 5 `init-layout:` tests; init/profile/seed 42 pass (parent re-run) |
| 04 — `comments` scope and language config | R1.3 / `proof-whd-comments-config` | `src/comments/config.ts`, `src/comments/index.ts` (file selection), `test/comments-config.test.ts` | done (committed in `68ed6f3`) — diff inside extended Owns (`rules.ts` syntax threading only); 6 `comments-config:` tests; full suite 162 pass (parent re-run). Parent inline fix: `isInScope` let `ignore` apply even with `comments.paths` set, contradicting D-Q12 ("replaces" so the package can judge `test/`); now `paths` replaces the whole default scope, plus a `comments-config:` test (7 pass) |
| 05 — Install `harness:comments` and rule | R1.4 / `proof-whd-comments-install` | per plan row | done (committed in `68ed6f3`) — diff inside Owns; 4 `comments-install:` + updated `init-script:` cases. Parent inline merge (2 lines): `.agents/rules/comments.md` added to the `init-surfaces:` path list (unit 02 test, collision), and the rule text now says the command reports every finding rather than stopping at the first. Targeted tests 24 pass |
| 06 — Package runs the shipped command | R1.5 / `proof-whd-comments-self` | per plan row | done (committed in `68ed6f3`) — `scripts/` and `.comment-gate.json` gone; `pnpm comments` = `node dist/cli.js comments`; `comments.paths: ["src","test"]`; AGENTS.md bullet rewritten |
| 07 — Wave D1 gate | D1 proofs + sweep + residue | — | **PASS 2026-09-25** — `rm -rf dist && pnpm build && pnpm test` (163 pass) `&& pnpm validate && pnpm comments` exit 0; sweep (moved gate globs) empty; R4.1 residue empty; no `LICENSE`; doc-path grep empty; smoke: an untagged comment in `src/` → 1 finding, exit 1 (removed). Proof map: `doc-layout:` 6, `init-layout:` 5, `comments-cli:` 4, `comments-rules:` 20, `comments-config:` 7, `comments-install:` 4; `comments-self` by inspection + gate. 32 paths changed, all inside D1 Owns plus recorded decisions (3)–(4) and the parent merges. Committed as package `68ed6f3` (not pushed) |

### Wave D2 — resume (opened 2026-09-25)

| Field | Value |
|-------|-------|
| Spec / plan | `docs/specs/archived/wolven-harness-d-code-lane/wolven-harness-d-code-lane-spec.md` / `docs/specs/archived/wolven-harness-d-code-lane/wolven-harness-d-code-lane-plan.md` |
| `HEAD` | package `68ed6f3` (`feat/d-code-lane`, pushed; draft PR WolvenTech/wolven-harness#2); OMT `7ca419d` |
| `git status` | package clean; OMT clean apart from this resume section |
| Resolved opt | `autocommit: true`, `autocommit-rule: wave`. The Human's instruction for D2 is to commit at the D2 gate and push to the same PR (amend its title and body) |
| Discrepancies | (1) Skill units write inside folders excluded from the sweep, but the residue grep, the `seed-extract:` `wayfind`/`board-` guard, and the sweep over `test/` still apply → **resolved: brief addendum**. (2) D1's escalated item (3), the `wayfind` guard vs the D4 skill, stays escalated to D4. (3) Shipped skill files sit in the consumer `.agents/`, which the claim scan reads, so a concrete `ADR-\d{3}` token would be a failing claim → **resolved: brief rule, placeholders only; the `adr` test greps for it**. (4) Gate finding outside the wave: the `qmd` skill that spec A shipped had the example `adr-014-retry-policy.md`. Once a consumer commits `init` output, the claim gate (tracked files only) fails every fresh install. Tests missed it because no fixture committed after `init` → **resolved: parent inline fix** (placeholder `adr-NNN-…`, and the example spec path moved to the doc-folder layout) plus a regression test `init-surfaces: a fresh install passes validate once committed`, which fails without the fix. Landed as its own `fix:` commit |

| Unit | Obligations | Intended diff (Owns) | Status |
|------|-------------|----------------------|--------|
| 08 — `grilling` + skill-contract helper | R2.11 / `proof-whd-skill-grilling` | `templates/.agents/skills/grilling/**`, `test/helpers/skill-contract.ts`, `test/skill-grilling.test.ts` | done (`be757be`) — diff inside Owns; 9 `skill-grilling:` tests incl. a `renderInto` self-test; suite 172 pass. Parent inline: `description` made plain (it renders into the consumer skills table) |
| 09 — `create-prd` | R2.1 / `proof-whd-skill-create-prd` | `templates/.agents/skills/create-prd/**`, `test/skill-create-prd.test.ts` | done (`be757be`) — diff inside Owns; 12 `skill-create-prd:` tests incl. rendered PRD passing validate; forbidden-word grep empty. Parent inline: plain `description`; lifecycle line names `code-pr` and `docs/prds/archived/<slug>/` per the spec |
| 10 — `adr` | R2.2 / `proof-whd-skill-adr` | `templates/.agents/skills/adr/**`, `test/skill-adr.test.ts` | done (`be757be`) — diff inside Owns; 8 `skill-adr:` tests incl. template render + supersession fixture passing validate; no concrete ADR tokens. Parent inline: supersede wording corrected (a stable ADR with claims passes; only claims to a deprecated or draft ADR fail) |
| 11 — `code-spec` | R2.3 / `proof-whd-skill-code-spec` | `templates/.agents/skills/code-spec/**`, `test/skill-code-spec.test.ts` | done (`be757be`) — diff inside Owns; 15 `skill-code-spec:` tests incl. TEMPLATE rendered to `docs/specs/<slug>/<slug>-spec.md` passing validate; EXAMPLE generic |
| 12 — `code-plan` | R2.4 / `proof-whd-skill-code-plan` | `templates/.agents/skills/code-plan/**`, `test/skill-code-plan.test.ts` | done (`be757be`) — diff inside Owns; 11 `skill-code-plan:` tests incl. plan skeleton rendered beside a spec passing validate; Subagent values exactly `spawn`/`inline` |
| 13 — Wave D2 gate | D2 proofs + sweep + residue | — | **PASS 2026-09-25**. `rm -rf dist && pnpm build && pnpm test` (219 pass) `&& pnpm validate && pnpm comments` exit 0; sweep, R4.1 residue, and doc-path grep empty; no `LICENSE`; no concrete ADR tokens under `templates/.agents`. Proof map: `skill-grilling:` 9, `skill-create-prd:` 12, `skill-adr:` 8, `skill-code-spec:` 15, `skill-code-plan:` 11 Committed as package `77abdf3` (fix) + `be757be` (skills), pushed; PR #2 title and body amended |

### Wave D3 — resume (opened 2026-09-25)

| Field | Value |
|-------|-------|
| Spec / plan | `docs/specs/archived/wolven-harness-d-code-lane/wolven-harness-d-code-lane-spec.md` / `docs/specs/archived/wolven-harness-d-code-lane/wolven-harness-d-code-lane-plan.md` |
| `HEAD` | package `be757be` (`feat/d-code-lane`, pushed; draft PR #2); OMT `671f03a` (pushed; draft PR #30) |
| `git status` | package clean apart from the parent's helper change below; OMT clean apart from this resume section |
| Resolved opt | `autocommit: true`, `autocommit-rule: wave`. Following the D2 pattern the Human set, the gate ends with commit, push, and amending package PR #2 and OMT PR #30 |
| Discrepancies | (1) The helper rejected any link leaving a skill folder, but the plan's seams make `code-pr/references/host-operations.md` the one shared target → **resolved: parent inline change in `test/helpers/skill-contract.ts`** that allows exactly that target (skill suites 55 pass). (2) The fixed test prefix `builder-brief:` matches the sweep's `\bbuilder\b` → **resolved: expected hand-reviewed hits**, since the shipped file is `builder-brief.md` (D-Q1 vocabulary). (3) `code-commit` is ask-only (R2.10), so portable `code-execute` cannot invoke it → **resolved: `code-execute` stops at the wave gate and asks the Human to run `code-commit`**; no commit-cadence config is invented. (4) PR #2 review comment by the Human on `grilling/SKILL.md:27` (2026-09-25 19:57): label every proposed option (a/b/c or 1/2/3) so the answer can be typed or referenced in free text → **escalated**: a change to a D2 skill outside the frozen spec, pending the Human's go-ahead in session. **Resolved**: the Human approved; landed as package `750dfea` `fix(skills): label grilling options so an answer can be the label alone` (+1 `skill-grilling:` test, suite 291 pass), pushed to PR #2. (5) **Gate-grep gap found 2026-09-25**: `rg` skips hidden directories, so the residue, doc-path, and sweep greps over `templates` at the D1–D3 gates never reached `templates/.agents/`. Re-run with `--hidden` over `efc9eee`+`750dfea`: residue and doc-paths empty, and the sweep shows only the known hand-reviewed hits → **resolved**: the D1–D3 evidence holds, and the spec's R4.1/R4.3 commands and the D4 gate now carry `--hidden` |

| Unit | Obligations | Intended diff (Owns) | Status |
|------|-------------|----------------------|--------|
| 14 — Host operations table + contract test | R3.1, R3.2 / `proof-whd-host-table`, `proof-whd-host-contract` | `templates/.agents/skills/code-pr/references/host-operations.md`, `test/host-contract.test.ts` | done (`efc9eee`) — diff inside Owns; 4 `host-table:` + 1 `host-contract:` (denylist derived from the parsed table); every tool name grounded in fetched GitHub MCP, `gh`, Rovo, and Bitbucket REST docs, none unverified. Parent inline: preamble names the Bitbucket REST base URL and auth |
| 15 — `code-execute` + builder brief | R2.5 / `proof-whd-builder-brief` | `templates/.agents/skills/code-execute/**`, `test/skill-code-execute.test.ts` | done (`efc9eee`) — diff inside Owns; 14 `builder-brief:` tests (prefix hits hand-reviewed). Parent inline: the final check ran `harness:comments`/`harness:validate` as bare shell commands, which are package scripts, so they are now `npm run …` with pnpm/yarn alternatives |
| 16 — `code-commit` | R2.6 / `proof-whd-skill-code-commit` | `templates/.agents/skills/code-commit/**`, `test/skill-code-commit.test.ts` | done (`efc9eee`) — diff inside Owns; 14 `skill-code-commit:` tests; ask-only (frontmatter + `agents/openai.yaml`). Rate-limit interruption, resumed from its own transcript. Parent inline: dropped a negative `One-Man-Team` literal from the test (the residue grep covers it); 2 "wave gate" sweep hits in the test are hand-reviewed skill vocabulary |
| 17 — `code-pr` | R2.7 / `proof-whd-skill-code-pr` | `templates/.agents/skills/code-pr/{SKILL.md,agents/**,references/pr-body-template.md,references/pre-merge-closure.md}`, `test/skill-code-pr.test.ts` | done (`efc9eee`) — diff inside Owns; 13 `skill-code-pr:` tests; ask-only; title rule, push every run, find-and-amend, closure to `docs/specs/archived/<slug>/` and `docs/prds/archived/<slug>/`. The builder hit the monthly spend limit after its full suite passed (290), so the parent ran its final check inline at the gate. Parent inline: a test literal spelled "Human" with a capital H, now a lowercase `/i` match |
| 18 — `code-review` | R2.8 / `proof-whd-skill-code-review` | `templates/.agents/skills/code-review/**`, `test/skill-code-review.test.ts` | done (`efc9eee`) — diff inside Owns; 12 `skill-code-review:` tests; ask-only; no Bugbot/Cursor/ClickUp |
| 19 — `code-ci` | R2.9 / `proof-whd-skill-code-ci` | `templates/.agents/skills/code-ci/**`, `test/skill-code-ci.test.ts` | done (`efc9eee`) — diff inside Owns; 13 `skill-code-ci:` tests; ask-only; the Bitbucket resolve-thread step goes through the table's REST route by operation name |
| 20 — Wave D3 gate | D3 proofs + sweep + residue | — | **PASS 2026-09-25**. `rm -rf dist && pnpm build && pnpm test` (290 pass) `&& pnpm validate && pnpm comments` exit 0; R4.1 residue, doc-path grep, concrete ADR tokens, and "Human Review Focus" label all empty; no `LICENSE`. Sweep hits are only the hand-reviewed skill vocabulary in `test/skill-code-execute.test.ts` (`builder-brief` prefix and file name, "wave gate") and `test/skill-code-commit.test.ts:79,132` ("wave gate"). Proof map: `builder-brief:` 10 + 4 `builder-brief.md` tests, `host-table:` 4, `host-contract:` 1, `skill-code-commit:` 14, `skill-code-pr:` 13, `skill-code-review:` 12, `skill-code-ci:` 13 Committed as package `efc9eee`, pushed; PR #2 title and body amended |

### Wave D4 — resume (opened 2026-09-25)

| Field | Value |
|-------|-------|
| Spec / plan | `docs/specs/archived/wolven-harness-d-code-lane/wolven-harness-d-code-lane-spec.md` / `docs/specs/archived/wolven-harness-d-code-lane/wolven-harness-d-code-lane-plan.md` (amended by D-Q26/D-Q27 in `7eb2d2e`) |
| `HEAD` | opened at package `750dfea`, OMT `7eb2d2e`; closed at package `e83a1f5`, then `9589232` after the PR review fix (`feat/d-code-lane`, pushed; PR #2) |
| `git status` | package clean after the gate commits; OMT dirty only in this plan (resume section; unit 27's box count corrected from 28 to 26) |
| Resolved opt | `autocommit: true`, `autocommit-rule: wave`. As in D2–D3, the gate ends with commit, push, and amending PRs #2 and #30 |
| Discrepancies | (1) The One-Man-Team sources for `research` and `prototype` ship `agents/openai.yaml`, but R2.10 makes them model-invocable → **resolved: brief addendum** (no ask-only files). (2) Builder greps must use `--hidden` → **resolved: brief addendum**. (3) The `seed-extract:` "no source-repo collection or config words" test banned the plain word "sources", while R5.3 requires "primary sources" → **resolved: parent inline**, narrowed to the collection-name usage it guards (`docs/(canon|concepts|sources)`, `-c <collection>`, bare `canon`, `config.yml`); passes with `research` wording intact. (4) PR #2 review after the gate: One-Man-Team `2e5a33e` had already made `code-commit` model-invocable under `.agents/code-commit.config.yml`, so R2.10 was frozen on a stale fact, and `code-pr` lagged the source → **resolved: spec D-Q28** plus a builder fix (package `9589232`): `code-commit` model-invocable, `code-execute` reads the opt, `code-pr` gains the closure-not-a-precondition gate, the PR/base print, and a filled example; the ask-only set is 4 of 15; `seed-extract` narrowed from bare `config.yml` to `qmd/config.yml`. Re-gate: 344 pass, validate and comments ok, residue/doc-path empty, sweep hits only the known test names. All four review threads answered and resolved |

| Unit | Obligations | Intended diff (Owns) | Status |
|------|-------------|----------------------|--------|
| 21 — Remove the maps layout | R0.1, R0.2 per D-Q27 / `proof-whd-doc-layout`, `proof-whd-init-layout` (re-proven) | per plan row 21 | done (committed in the gate commits) — diff inside Owns; `doc-layout:` extras case moved to notes, plus `docs/maps/m/m-map.md is not profile-checked`; `init-layout:` updated; the Done-when grep leaves only 2 plain-English "maps" hits (hand-reviewed). Spend-limit interruption, resumed |
| 22 — `research` | R5.3 / `proof-whd-skill-research` | `templates/.agents/skills/research/**`, `test/skill-research.test.ts` | done (committed in the gate commits) — diff inside Owns; 11 `skill-research:` tests incl. a rendered note + frontmatter-free `sources.md` extra passing validate; model-invocable; spec wording ("primary sources") kept after the seed-extract narrowing |
| 23 — `handoff` | R5.4 / `proof-whd-skill-handoff` | `templates/.agents/skills/handoff/**`, `test/skill-handoff.test.ts` | done (committed in the gate commits) — diff inside Owns; 10 `skill-handoff:` tests; ask-only; OS temp dir only; Claude Code / Codex / Cursor notes; redaction step |
| 24 — `prototype` | R5.5 / `proof-whd-skill-prototype` | `templates/.agents/skills/prototype/**`, `test/skill-prototype.test.ts` | done (committed in the gate commits) — diff inside Owns; 7 `skill-prototype:` tests; model-invocable; verdict on the PRD; no board/ticket/map references |
| 25 — Ask-only test over every skill | R2.10 / `proof-whd-ask-only` | `test/ask-only.test.ts` | done — diff inside Owns; 16 `ask-only:` tests (exact 15-skill set, plus one per skill); no skill failed its contract |
| 26 — Wave D4 gate | all 26 proofs + residue, sweep, doc paths (`--hidden`) | — | **PASS 2026-09-25**. `rm -rf dist && pnpm build && pnpm test` (335 pass) `&& pnpm validate && pnpm comments` exit 0. With `--hidden`: R4.1 residue empty, no `LICENSE`, R4.3 doc-path grep empty; the only ADR token under `templates` is the shipped `ADR-000`. Hand-reviewed hits: the R4.2 sweep hits only `test/skill-code-commit.test.ts` ("wave gate", the skill's own vocabulary) and the `builder-brief:` test names; the maps grep hits only plain-English "maps" (`profile.ts` doc comment, `code-plan` "maps to a named proof", test names) and the tests proving `docs/maps/` is unchecked and `prototype` names no map. Proof map (26/26): `doc-layout:` 7, `init-layout:` 5, `comments-cli:` 4, `comments-rules:` 20, `comments-config:` 7, `comments-install:` 4, comments-self by inspection (no `scripts/comment-*`; `pnpm comments` = `node dist/cli.js comments`; `comments.paths: ["src","test"]`) plus the gate run; `skill-create-prd:` 12, `skill-adr:` 8, `skill-code-spec:` 15, `skill-code-plan:` 11, `builder-brief:` 14, `skill-code-commit:` 14, `skill-code-pr:` 13, `skill-code-review:` 12, `skill-code-ci:` 13, `ask-only:` 16, `skill-grilling:` 10, `host-table:` 4, `host-contract:` 1 (corrected from 8 at unit 27: 8 was the count of `test(` calls in the file, not of `host-contract:` tests), `skill-research:` 11, `skill-handoff:` 10, `skill-prototype:` 7; R4.1–R4.3 by the gate greps. Committed as package `d6325ff` (maps removal) + `e83a1f5` (skills), pushed; PR #2 title and body amended |
| 27 — Record D green in OMT | all 26 proofs / acceptance boxes | spec D, the TAP, the PRD sweep block, this plan | done 2026-09-26 — package re-run at `9589232`: 344 pass, `validate: ok`, `comments: ok (0 findings)`; 26/26 spec boxes ticked with per-prefix counts; the TAP's D row drops `wayfinder` and the B/D milestone notes D green at `9589232`; the PRD sweep globs name `src/comments/leak-rules.ts` and `test/comments-rules.test.ts`, drop `wayfinder`, and the rewritten sweep run verbatim hits only the named `code-commit`/`code-execute` test names. Closure is not a merge precondition for D: spec D's Acceptance puts initiative closure in spec C |
| 28 — Record the merge | squash SHA on `main` | the TAP, this plan | done 2026-09-26 — see the Merge line |

**Merge:** WolvenTech/wolven-harness#2 squash-merged to `main` as `d495802` on 2026-09-26 (17:35 UTC); the tree matches `feat/d-code-lane` `9589232`. On `main`: `rm -rf dist && pnpm build && pnpm test` 344/344, `pnpm validate` ok (`claims: 2 ok`), `pnpm comments` 0 findings; with `--hidden`, the R4.1 residue and R4.3 doc-path greps are empty, there is no `LICENSE`, and the R4.2 sweep hits only the named `code-commit`/`code-execute` test names. Entrega D closes; C may start once B is green

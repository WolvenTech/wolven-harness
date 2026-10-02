---
type: spec
title: Drop tests that only repeat another proof
description: Delete four test cases whose assertions are already made by a test that stays, and leave every other tracked file in place.
status: draft
---

# Drop tests that only repeat another proof

**Source:** confirmed ask — "explore the codebase and write a code-spec on stale things like artifacts and tests. i want to trim out this repo."
**Next:** After the Human approves → `code-plan` → `code-execute`. One mutate batch. No wave stop.
**Named proof (this spec's own structural gate):** `proof-repo-trim-spec-obligations`

## Term challenge

| Term | Resolution |
|------|------------|
| stale test | A `test()` whose every assertion is already made by another named test that this initiative keeps. Coined here. Checked against `docs/adrs/` (`qmd query -c adrs`): no ADR defines the term. [ADR-003](../../adrs/adr-003-public-contract.md) says every contract item needs a test; it does not ask for a second copy of the same assertion. |
| artifact | A tracked file outside `src/`, `templates/`, `test/`, and `docs/` that no README, site page, workflow, or `package.json` `"files"` entry cites. Survey term, coined here. The survey result is in Repository grounding. |

## Repository grounding

Searched `qmd query -c adrs` for publish scope and leftover files, then `qmd search` across notes, specs, and deferrals. No doc already decides a trim. [ADR-003](../../adrs/adr-003-public-contract.md) freezes commands, flags, exit codes, finding codes, and `.wolven-harness.json` schema v1. Template text, skill text, and messages are explicitly not contract.

| Surface | Present today | Role for this initiative |
|---------|----------------|----------------------------|
| `test/harness-init-stub.test.ts` — `stub-template: the installed harness-init copy matches the template` | yes | Deletes this one `test()`. It reads `SKILL.md` and `references/stub-template.md` under both `.agents/skills/harness-init/` and `templates/.agents/skills/harness-init/`. |
| `test/skill-copies.test.ts` — `proof-lean-init-copies-identical` | yes | Survivor. Compares every file of every skill folder present in both trees, including those two harness-init files. |
| `test/cli.test.ts` — `usage lists --version` | yes | Deletes this one `test()`. It asserts `--help` stdout contains `--version`. |
| `test/cli.test.ts` — `unknown command exits 1` | yes | Deletes this one `test()`. It runs `bogus` and asserts exit 1 plus `/unknown command/` on stderr. |
| `test/contract.test.ts` — `contract: --help lists the commands and --version` | yes | Survivor. Asserts `--help` exit 0 and that stdout contains `setup`, `validate`, `comments`, and `--version`. |
| `test/contract.test.ts` — `contract: an unknown command exits 1 and --version exits 0` | yes | Survivor. Runs `no-such-command`, asserts exit 1, `/unknown command/` on stderr, usage on stdout, and `--version` exit 0. |
| `test/seed-extract.test.ts` — `seed-extract: template files exist` | yes | Deletes this one `test()`. It asserts five template paths exist. |
| `test/setup-surfaces.test.ts` — `setup-surfaces: creates exactly the expected paths` | yes | Survivor for `rules/qmd-first.md`, `rules/yagni-strict.md`, and `hooks/README.md` (hard-coded in `nonSkillFiles`). |
| `test/skill-qmd.test.ts` — `skill-qmd` and `skill-pragmatic-guard` shared-contract checks | yes | Survivor for `skills/qmd/SKILL.md` and `skills/pragmatic-guard/SKILL.md` (`assertSkillBasics` reads each `SKILL.md`). |
| `video/harness-explainer.mp4`, `video/harness_explainer.py` | yes | Surveyed. About 3.5MB. No citation in `README.md`, `site/`, workflows, or `package.json`. Restyled in `8a11541`. Stays. See Pragmatic-guard refuses. |
| `assets/wolven-logo-black.png`, `site/public/wolven-logo-black.png` | yes | Same git blob. `README.md` embeds `assets/`. `site/.vitepress/config.ts` serves `site/public/`. Both stay. |
| `docs/specs/archived/`, `docs/prds/archived/` | yes | Completed `cli-setup` and `fool-jury-skills` records. `docs/WRITING-PROFILE.md` leaves `archived/` unchecked. Stay. |
| `docs/specs/lean-init/` | yes | Stable, acceptance boxes ticked, shipped in PR 32. Archiving it is pre-merge closure, not this trim. |
| `pnpm test`, `pnpm validate` | yes | Gates. `pnpm validate` is `node dist/cli.js validate`. |

## Surface walk

- **In scope:** delete only these four `test()` bodies:
  - `stub-template: the installed harness-init copy matches the template` in `test/harness-init-stub.test.ts`
  - `usage lists --version` in `test/cli.test.ts`
  - `unknown command exits 1` in `test/cli.test.ts`
  - `seed-extract: template files exist` in `test/seed-extract.test.ts`
- **Out of mutate scope (unchanged):** `src/**`, `templates/**`, `.agents/**`, `video/**`, `assets/**`, `site/**`, `package.json`, `docs/adrs/**`, `docs/**/archived/**`, `docs/specs/lean-init/**`, and every other `test()` including the four survivors named above, `setup-dispatch: init is an unknown command and exits 1`, and the other tests in `test/seed-extract.test.ts`. Cite these from the `n/a` landings below.

## Requirements (obligation ↔ proof)

### R1 — Each deleted test already has a survivor

| ID | Obligation | Named proof | Evidence shape |
|----|------------|--------------|------------------|
| R1.1 | `stub-template: the installed harness-init copy matches the template` is gone. `proof-lean-init-copies-identical` still compares every shared skill file, including `harness-init/SKILL.md` and `harness-init/references/stub-template.md`. | `proof-repo-trim-copy-check` | `rg` finds the deleted title nowhere under `test/`. `rg` still finds `proof-lean-init-copies-identical` in `test/skill-copies.test.ts`. `pnpm test` exits 0. |
| R1.2 | `usage lists --version` is gone. `contract: --help lists the commands and --version` still requires `--version` in `--help` stdout. | `proof-repo-trim-help-version` | `rg` finds `usage lists --version` nowhere under `test/`. `rg` still finds `contract: --help lists the commands and --version` in `test/contract.test.ts`. `pnpm test` exits 0. |
| R1.3 | The `test()` titled `unknown command exits 1` in `test/cli.test.ts` is gone. `contract: an unknown command exits 1 and --version exits 0` still asserts exit 1 and `/unknown command/` on stderr. | `proof-repo-trim-unknown-command` | `rg "test\\('unknown command exits 1'" test` prints nothing. `rg "test\\('contract: an unknown command exits 1" test/contract.test.ts` prints the survivor. `pnpm test` exits 0. |
| R1.4 | `seed-extract: template files exist` is gone. `setup-surfaces: creates exactly the expected paths` still lists the two rules and `hooks/README.md`. `skill-qmd` and `skill-pragmatic-guard` still call `assertSkillBasics`. | `proof-repo-trim-template-files` | `rg` finds `seed-extract: template files exist` nowhere under `test/`. `rg` still finds `setup-surfaces: creates exactly the expected paths` and `assertSkillBasics('qmd')` and `assertSkillBasics('pragmatic-guard')`. `pnpm test` exits 0. |

The other tests in `test/seed-extract.test.ts` stay: `-c adrs` before an unfiltered `qmd query`, deferral frontmatter fields, `name` and `description` on every template `SKILL.md` (this is the sweep that includes `the-fool` and `the-jury`, which do not call `assertSkillBasics`), and the hooks README naming no hook.

## Nine-dimension landings

| Dimension | Landing kind | Landing |
|-----------|---------------|---------|
| validation | obligation ↔ proof | R1.1 / `proof-repo-trim-copy-check`, R1.2 / `proof-repo-trim-help-version`, R1.3 / `proof-repo-trim-unknown-command`, R1.4 / `proof-repo-trim-template-files` — each survivor assertion is still in the tree, and `pnpm test` exits 0. `pnpm validate` still exits 0; this batch edits no profile doc except by leaving this spec as `draft`. |
| failure modes | obligation ↔ proof | R1.1 / `proof-repo-trim-copy-check` — if the survivor title is missing in the same edit, the `rg` proof fails and the batch stops. The same shape applies to R1.2, R1.3, and R1.4. |
| idempotency and retry | obligation ↔ proof | R1.1 / `proof-repo-trim-copy-check` — the edit deletes one `test()` and does not rewrite `test/skill-copies.test.ts`. A second apply finds the title already absent and the survivor byte-identical. Same shape for R1.2, R1.3, and R1.4. |
| authorization | `n/a` | Unchanged surface: `.github/workflows/ci.yml` permissions stay `contents: read`, `pull-requests: read`, `checks: read`. |
| concurrency and ordering | `n/a` | Unchanged surface: the `concurrency` group in `.github/workflows/ci.yml`. One mutate batch, no second writer. |
| data lifecycle | obligation ↔ proof | R1.2 / `proof-repo-trim-help-version` — the deleted `test()` is removed from the tree and not copied into another file. `test/contract.test.ts` stays the contract pin [ADR-003](../../adrs/adr-003-public-contract.md) already requires. |
| external-dependency failure | `n/a` | Unchanged surface: `package.json` `dependencies` stay `yaml` and `@clack/prompts`. `video/harness_explainer.py` imports manim and stays; this batch does not run it and does not add manim. |
| state transitions | `n/a` | Unchanged surface: `docs/WRITING-PROFILE.md` statuses stay `draft`, `stable`, and `deprecated`. No profile doc moves between them. |
| observability | `n/a` | Unchanged surface: the `validate: ok` and `comments: ok` summary lines in [ADR-003](../../adrs/adr-003-public-contract.md). This batch adds no log line. |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition |
|------------|-------------------|-------|-------------------|--------------|

None. The four deletions are settled by the survivor each one names.

## Out of scope

- Rewriting a survivor test, merging two files, or renaming `test/seed-extract.test.ts`.
- `src/**`, `templates/**`, and the public contract in [ADR-003](../../adrs/adr-003-public-contract.md).
- Any `test()` not named in the in-scope list, including `setup-dispatch: init is an unknown command and exits 1` and `--version and -v print the package name and version`.

## Pragmatic-guard refuses

| Proposal | Need | Complexity | Verdict |
|----------|------|------------|---------|
| Delete `video/` because nothing links it | 4 — 3.5MB, uncited, not in `package.json` `"files"` | 2 — delete two files | **Refuse.** `8a11541` restyled the explainer the same day. Nothing marks it temporary. Deleting it discards that commit. Linking it from `site/` is a docs-site change, not a trim. |
| Delete `setup-dispatch: init is an unknown command and exits 1` | 2 — the generic unknown-command rule is already in `test/contract.test.ts` | 1 | **Refuse.** It is the only test that runs the retired command name `init`. [ADR-003](../../adrs/adr-003-public-contract.md) lists `setup`, `validate`, and `comments`; this pin keeps `init` from coming back as a dispatch. |
| Delete the rest of `test/seed-extract.test.ts` | 3 — the file name is left over from the template extract | 4 — the `-c adrs` order, deferral fields, all-skill frontmatter (including `the-fool` and `the-jury`), and the empty hooks README are not proved elsewhere | **Refuse.** Only `seed-extract: template files exist` is a stale test. |
| Delete `assets/` or `site/public/wolven-logo-black.png` | 1 — the black mark is one blob at two paths | 3 — `README.md` and VitePress each need their own path | **Refuse.** |
| Delete `docs/**/archived/**` or archive `docs/specs/lean-init/` from this spec | 2 — completed records sit in the tree | 4 — closure moves a stable spec to `archived/` and sets `deprecated` | **Refuse.** Closure is `code-pr`. The archive is the resting place `docs/WRITING-PROFILE.md` already exempts. |
| Add a test whose only job is to assert `video/` stays absent | 0 | 2 | **Refuse.** |
| A new dependency, a new command, or an ADR | 0 — [ADR-003](../../adrs/adr-003-public-contract.md) is unchanged | — | **Refuse.** |

## Acceptance

- [ ] `proof-repo-trim-copy-check` PASS — harness-init copy `test()` gone; `proof-lean-init-copies-identical` remains; `pnpm test` exits 0
- [ ] `proof-repo-trim-help-version` PASS — `usage lists --version` gone; the contract `--help` test remains; `pnpm test` exits 0
- [ ] `proof-repo-trim-unknown-command` PASS — `test/cli.test.ts` title `unknown command exits 1` gone; the contract unknown-command test remains; `pnpm test` exits 0
- [ ] `proof-repo-trim-template-files` PASS — `seed-extract: template files exist` gone; setup-surfaces and the two `assertSkillBasics` calls remain; `pnpm test` exits 0

## Eval / gates

| Gate | Command / check | When | PASS | Abort |
|------|-------------------|------|------|-------|
| Integrity | `pnpm validate` | End of the batch | exit 0 | Fix; do not proceed |
| Tests | `pnpm test` | End of the batch | exit 0 | Fix; do not proceed |
| Spec obligations | `proof-repo-trim-spec-obligations` — each acceptance box pairs with one obligation; all nine landings are present; every `n/a` cites an unchanged surface | Before `code-plan` | all hold | Do not plan |

## Cross-domain leak table

| Leak | Refuse |
|------|--------|
| Archive `docs/specs/lean-init/`, its plan, and `docs/prds/lean-init/` | Pre-merge closure in `templates/.agents/skills/code-pr/references/pre-merge-closure.md` |
| Link `video/harness-explainer.mp4` from the site or the README | A `site/` change. This spec leaves `video/` tracked. |
| Consolidate `test/contract.test.ts` with `test/cli.test.ts` beyond the two deletions | The contract file stays the [ADR-003](../../adrs/adr-003-public-contract.md) pin. `--version and -v print the package name and version` stays; it checks the printed line, which the contract test does not. |
| An executable plan from this skill | `code-plan` only |

## ADR

None owed. The deletions do not change a command, flag, exit code, finding code, or the config schema. [ADR-003](../../adrs/adr-003-public-contract.md) stays the contract. Do not add an ADR for removing a duplicate test.

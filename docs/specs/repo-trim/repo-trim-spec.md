---
type: spec
title: Drop duplicate tests and finished migration checks
description: Delete tests that only repeat another proof or only pin a finished rename, registry move, or template extract, and leave the consumer legacy-ADR path in place.
status: draft
---

# Drop duplicate tests and finished migration checks

**Source:** confirmed ask — "explore the codebase and write a code-spec on stale things like artifacts and tests. i want to trim out this repo." Follow-up, confirmed: "what about old implementation or migration verifications? app is stable enough." Follow-up: the test-sync skill at <https://mcpmarket.com/tools/skills/test-sync-maintenance> (jmagly, `test-sync` in [ai-writing-guide](https://github.com/jmagly/ai-writing-guide)). This spec uses its three categories and does not install the skill.
**Next:** After the Human approves → `code-plan` → `code-execute`. One mutate batch. No wave stop.
**Named proof (this spec's own structural gate):** `proof-repo-trim-spec-obligations`

## Term challenge

| Term | Resolution |
|------|------------|
| stale test | A `test()` whose every assertion is already made by another named test that this initiative keeps. Coined here. Checked against `docs/adrs/` (`qmd query -c adrs`): no ADR defines the term. [ADR-003](../../adrs/adr-003-public-contract.md) says every contract item needs a test; it does not ask for a second copy of the same assertion. |
| migration verification | A test whose subject is a previous shape of this package: the retired `init` command, GitHub Packages install lines, or vocabulary carried in from the repo the templates were extracted from. Coined here. It is not the consumer legacy-ADR path. |
| artifact | A tracked file outside `src/`, `templates/`, `test/`, and `docs/` that no README, site page, workflow, or `package.json` `"files"` entry cites. Survey term, coined here. The survey result is in Repository grounding. |
| orphaned test | test-sync: a test whose source module no longer exists. In this repo that is a migration verification. A 1:1 `src/foo.ts` → `test/foo.test.ts` name match is not the rule here; tests call the CLI or read templates. |
| missing test | test-sync: a source file with no test file of the same name. Not a deletion. This initiative does not add tests. |
| implementation-coupled test | test-sync: a test of a private method, internal state, or a deep mock. The scan found none of those patterns under `test/`. Refactoring message assertions is out of scope. |

[ADR-002](../../adrs/adr-002-public-npm-oidc.md) records that the first releases went to GitHub Packages and that current publishes go to public npmjs with no stored token. [ADR-001](../../adrs/adr-001-claim-path.md) still warns on a live legacy ADR and points that warning at `harness-init`. [ADR-003](../../adrs/adr-003-public-contract.md) still lists `legacy-adr`, `legacy-claim`, and `adr-status-mismatch`. Those three codes stay tested.

## Repository grounding

Searched `qmd query -c adrs` for the rename, the registry move, and what a stable release may drop. No ADR tells a test to keep pinning a retired name after the contract lists the current commands.

| Surface | Present today | Role for this initiative |
|---------|----------------|----------------------------|
| `test/harness-init-stub.test.ts` — `stub-template: the installed harness-init copy matches the template` | yes | Deletes this one `test()`. It reads `SKILL.md` and `references/stub-template.md` under both skill trees. |
| `test/skill-copies.test.ts` — `proof-lean-init-copies-identical` | yes | Survivor. Compares every file of every skill folder present in both trees, including those two harness-init files. |
| `test/cli.test.ts` — `usage lists --version` | yes | Deletes this one `test()`. It asserts `--help` stdout contains `--version`. |
| `test/cli.test.ts` — `unknown command exits 1` | yes | Deletes this one `test()`. It runs `bogus` and asserts exit 1 plus `/unknown command/` on stderr. |
| `test/cli.test.ts` — `setup-dispatch: init is an unknown command and exits 1` | yes | Migration verification of the retired command. Deletes this `test()`. |
| `test/cli.test.ts` — `doesNotMatch(..., /\binit\b/)` inside the `--help` test and the no-args test | yes | Same migration pin, two lines. Removes those two assertions. The surrounding tests still require `setup`, `validate`, and `comments`. |
| `test/contract.test.ts` — `contract: --help lists the commands and --version` | yes | Survivor for `--version` on `--help`, and for the three command names. |
| `test/contract.test.ts` — `contract: an unknown command exits 1 and --version exits 0` | yes | Survivor. Runs `no-such-command`, asserts exit 1, `/unknown command/` on stderr, usage on stdout, and `--version` exit 0. |
| `test/seed-extract.test.ts` — `seed-extract: template files exist` | yes | Deletes this one `test()`. It asserts five template paths exist. |
| `test/setup-surfaces.test.ts` — `setup-surfaces: creates exactly the expected paths` | yes | Survivor for `rules/qmd-first.md`, `rules/yagni-strict.md`, and `hooks/README.md`. |
| `test/skill-qmd.test.ts` — `skill-qmd` and `skill-pragmatic-guard` shared-contract checks | yes | Survivor for those two `SKILL.md` files. |
| `test/readme-install.test.ts` — `readme-install: no GitHub Packages registry residue` | yes | Migration verification. Deletes this `test()`. The add-then-setup test in the same file stays. |
| `test/release.test.ts` — `release-oidc: the workflow stores no secret and names no GitHub Packages registry` | yes | Keeps the `secrets.` assertion ([ADR-002](../../adrs/adr-002-public-npm-oidc.md): no stored token). Drops the `npm.pkg.github.com` and `packages: read\|write` assertions, and drops "GitHub Packages" from the title. |
| `test/template-residue.test.ts` | yes | Migration verification. The file only bans vocabulary from the repo the templates were extracted from (`canon`, `clickup`, `cynefin`, and the scoped bans). Deletes the file. |
| `test/legacy.test.ts`, `test/validate-legacy-folders.test.ts`, `test/harness-init-migration.test.ts`, `test/behaviour-brownfield.test.ts` | yes | Consumer legacy-ADR path. Stay. They use fixtures. This package's own tree has no legacy ADRs. |
| `video/harness-explainer.mp4`, `video/harness_explainer.py` | yes | Surveyed. About 3.5MB. Uncited. Restyled in `8a11541`. Stays. |
| `.agents/skills/test-sync/SKILL.md` | yes | Dogfood skill. Adapted rules only. Not under `templates/`. |
| `docs/deferrals/test-sync-package/test-sync-package-deferral.md` | yes | Promotion into the package waits on this deferral. |
| `pnpm test`, `pnpm validate` | yes | Gates. `pnpm validate` is `node dist/cli.js validate`. |

## Surface walk

- **In scope:**
  - Delete the four duplicate `test()` bodies from the first pass: the harness-init copy check, `usage lists --version`, `unknown command exits 1` in `test/cli.test.ts`, and `seed-extract: template files exist`.
  - Delete `setup-dispatch: init is an unknown command and exits 1`.
  - Remove the two `doesNotMatch` assertions against `/\binit\b/` in `test/cli.test.ts`.
  - Delete `readme-install: no GitHub Packages registry residue`.
  - In the release workflow test, drop the GitHub Packages assertions and retitle it to the check that remains: the workflow stores no `secrets.` reference.
  - Delete `test/template-residue.test.ts`.
- **Out of mutate scope (unchanged):** `src/**`, `templates/**` (no `test-sync` folder), `video/**`, `assets/**`, `site/**` (including `site/search.md`, which names GitHub Packages as a search example), `package.json`, `docs/adrs/**`, `docs/**/archived/**`, `docs/specs/lean-init/**`, `CHANGELOG.md`, `.github/workflows/**`, the consumer legacy-ADR tests named above, the other tests in `test/seed-extract.test.ts`, `--version and -v print the package name and version`, the rest of `.agents/**`, and `.agents/skills/test-sync/SKILL.md` (the deletion batch does not edit it). Cite these from the `n/a` landings below.

## Test-sync audit

Applied by hand. No `npx test-sync`, no `test_sync.py`, no `cleanup_orphans.py`. Every `from '../src/...'` import under `test/` resolves to a file that exists. No test matches the skill's private-method, internal-state, or stacked-mock patterns.

| Category | Result in this repo | This spec |
|----------|---------------------|-----------|
| Orphaned | The retired `init` command, the GitHub Packages assertions, and `test/template-residue.test.ts`. R1's four duplicates are obsolete assertions with a survivor, not deleted modules. | R2 and R1. No further orphans. |
| Missing | `src/` modules such as `src/git.ts`, `src/frontmatter.ts`, and `src/validate/claims.ts` have no same-named test file. The CLI suites (`test/claims.test.ts`, `test/profile.test.ts`, `test/spine.test.ts`, and the rest) already call `validate` and `setup`. | Do not add test files. |
| Implementation-coupled | No matches for the skill's patterns. Many tests pin stdout and workflow YAML. Those pins stay; changing them is a refactor, not a deletion. | Out of scope. The dogfood skill repeats that rule. |

## Requirements (obligation ↔ proof)

### R1 — Each deleted duplicate already has a survivor

| ID | Obligation | Named proof | Evidence shape |
|----|------------|--------------|------------------|
| R1.1 | `stub-template: the installed harness-init copy matches the template` is gone. `proof-lean-init-copies-identical` still compares every shared skill file, including `harness-init/SKILL.md` and `harness-init/references/stub-template.md`. | `proof-repo-trim-copy-check` | `rg` finds the deleted title nowhere under `test/`. `rg` still finds `proof-lean-init-copies-identical` in `test/skill-copies.test.ts`. `pnpm test` exits 0. |
| R1.2 | `usage lists --version` is gone. `contract: --help lists the commands and --version` still requires `--version` in `--help` stdout. | `proof-repo-trim-help-version` | `rg` finds `usage lists --version` nowhere under `test/`. `rg` still finds `contract: --help lists the commands and --version` in `test/contract.test.ts`. `pnpm test` exits 0. |
| R1.3 | The `test()` titled `unknown command exits 1` in `test/cli.test.ts` is gone. `contract: an unknown command exits 1 and --version exits 0` still asserts exit 1 and `/unknown command/` on stderr. | `proof-repo-trim-unknown-command` | `rg "test\\('unknown command exits 1'" test` prints nothing. `rg "test\\('contract: an unknown command exits 1" test/contract.test.ts` prints the survivor. `pnpm test` exits 0. |
| R1.4 | `seed-extract: template files exist` is gone. `setup-surfaces: creates exactly the expected paths` still lists the two rules and `hooks/README.md`. `skill-qmd` and `skill-pragmatic-guard` still call `assertSkillBasics`. | `proof-repo-trim-template-files` | `rg` finds `seed-extract: template files exist` nowhere under `test/`. `rg` still finds `setup-surfaces: creates exactly the expected paths` and `assertSkillBasics('qmd')` and `assertSkillBasics('pragmatic-guard')`. `pnpm test` exits 0. |

The other tests in `test/seed-extract.test.ts` stay. They pin current template rules: `-c adrs` before an unfiltered `qmd query`, deferral frontmatter fields, `name` and `description` on every template `SKILL.md` (the sweep that includes `the-fool` and `the-jury`), and the hooks README naming no hook.

### R2 — Finished migration checks come out

The Human confirmed the package is stable enough to drop verifications of shapes that already shipped.

| ID | Obligation | Named proof | Evidence shape |
|----|------------|--------------|------------------|
| R2.1 | `setup-dispatch: init is an unknown command and exits 1` is gone, and `test/cli.test.ts` no longer asserts `/\binit\b/`. The `--help` test and the no-args test still require `setup`, `validate`, and `comments`. | `proof-repo-trim-init-pin` | `rg 'unknown command "init"' test` prints nothing. `rg '\\binit\\b' test/cli.test.ts` prints nothing. `rg '\\bsetup\\b' test/cli.test.ts` still hits the help test. `pnpm test` exits 0. |
| R2.2 | `readme-install: no GitHub Packages registry residue` is gone. `readme-install: the add and setup commands appear, in that order` stays. | `proof-repo-trim-packages-readme` | `rg 'GitHub Packages' test/readme-install.test.ts` prints nothing. `rg 'pnpm add -D @wolven-tech/harness' test/readme-install.test.ts` still hits. `pnpm test` exits 0. |
| R2.3 | `test/release.test.ts` no longer mentions GitHub Packages, `npm.pkg.github.com`, or `packages: read\|write`. The same test still asserts the release workflow has no `secrets.` reference, under a title that says that and nothing about the old registry. | `proof-repo-trim-packages-workflow` | `rg 'npm\\.pkg\\.github\\.com\\|GitHub Packages\\|packages:\\\\s\\*' test/release.test.ts` prints nothing. `rg 'secrets\\.' test/release.test.ts` still hits. `pnpm test` exits 0. |
| R2.4 | `test/template-residue.test.ts` is gone. No other file takes over its ban list. | `proof-repo-trim-template-residue` | `test/template-residue.test.ts` is absent. `rg template-residue test` prints nothing. `pnpm test` exits 0. |

## Nine-dimension landings

| Dimension | Landing kind | Landing |
|-----------|---------------|---------|
| validation | obligation ↔ proof | R1.1 / `proof-repo-trim-copy-check` through R1.4, and R2.1 / `proof-repo-trim-init-pin` through R2.4 / `proof-repo-trim-template-residue`. Each named survivor is still in the tree, and `pnpm test` exits 0. `pnpm validate` still exits 0. This batch edits no profile doc except by leaving this spec as `draft`. |
| failure modes | obligation ↔ proof | R1.1 / `proof-repo-trim-copy-check` — if a survivor title is missing in the same edit, that `rg` proof fails and the batch stops. R2.4 / `proof-repo-trim-template-residue` has no survivor: a later template that uses a formerly banned word is an accepted loss, and the batch still stops if `pnpm test` exits non-zero. |
| idempotency and retry | obligation ↔ proof | R2.1 / `proof-repo-trim-init-pin` — the edit removes the pin and does not rewrite `test/contract.test.ts`. A second apply finds the pin already absent and the contract test byte-identical. The same shape applies to the other deletions. |
| authorization | `n/a` | Unchanged surface: `.github/workflows/ci.yml` permissions stay `contents: read`, `pull-requests: read`, `checks: read`. The release workflow's `id-token: write` on the publish job stays; `test/release.test.ts` already pins that outside the assertions R2.3 removes. |
| concurrency and ordering | `n/a` | Unchanged surface: the `concurrency` group in `.github/workflows/ci.yml`. One mutate batch, no second writer. |
| data lifecycle | obligation ↔ proof | R2.2 / `proof-repo-trim-packages-readme` — the README residue test is removed and not copied into another file. [ADR-002](../../adrs/adr-002-public-npm-oidc.md) keeps the GitHub Packages history. This batch does not edit that ADR. |
| external-dependency failure | `n/a` | Unchanged surface: `package.json` `dependencies` stay `yaml` and `@clack/prompts`. `video/harness_explainer.py` imports manim and stays; this batch does not run it and does not add manim. |
| state transitions | `n/a` | Unchanged surface: `docs/WRITING-PROFILE.md` statuses stay `draft`, `stable`, and `deprecated`. No profile doc moves between them. |
| observability | `n/a` | Unchanged surface: the `validate: ok` and `comments: ok` summary lines in [ADR-003](../../adrs/adr-003-public-contract.md). This batch adds no log line. |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition |
|------------|-------------------|-------|-------------------|--------------|

None. The Human confirmed that finished migration verifications can go. The consumer legacy-ADR path stays because [ADR-001](../../adrs/adr-001-claim-path.md) and [ADR-003](../../adrs/adr-003-public-contract.md) still define it.

## Out of scope

- Rewriting a survivor test, merging two files, or renaming `test/seed-extract.test.ts`.
- `src/**`, `templates/**`, and the public contract.
- `--version and -v print the package name and version`. It checks the printed line, which the contract test does not.
- The remaining tests in `test/seed-extract.test.ts`.
- `test/legacy.test.ts`, `test/validate-legacy-folders.test.ts`, `test/harness-init-migration.test.ts`, and `test/behaviour-brownfield.test.ts`.

## Pragmatic-guard refuses

| Proposal | Need | Complexity | Verdict |
|----------|------|------------|---------|
| Delete `video/` because nothing links it | 4 — 3.5MB, uncited, not in `package.json` `"files"` | 2 — delete two files | **Refuse.** `8a11541` restyled the explainer the same day. Nothing marks it temporary. |
| Delete the consumer legacy-ADR suites because this repo itself has no legacy ADRs | 2 — this package's tree is already on profile ADRs | 8 — those files are the proofs of `legacy-adr`, `legacy-claim`, and the harness-init migration playbook consumers still run | **Refuse.** Stability of this repo is not retirement of the consumer path. |
| Delete the rest of `test/seed-extract.test.ts` because the name says "extract" | 3 — the filename is from the extract | 4 — the `-c adrs` order, deferral fields, all-skill frontmatter, and the empty hooks README are current rules with no other proof | **Refuse.** Only `seed-extract: template files exist` is a duplicate. |
| Delete `assets/` or `site/public/wolven-logo-black.png` | 1 — one blob at two paths | 3 — `README.md` and VitePress each need their own path | **Refuse.** |
| Delete `docs/**/archived/**` or archive `docs/specs/lean-init/` from this spec | 2 | 4 — closure sets `deprecated` and moves the folders | **Refuse.** Closure is `code-pr`. |
| Replace the template-residue ban list with a shorter list | 0 — the Human said the verification can go | 3 | **Refuse.** R2.4 deletes the file. It does not invent a new ban list. |
| Paste the upstream test-sync skill, add `npx test-sync` to CI, or add its Python cleanup scripts | 2 — the three categories were useful once | 7 — a new tool, a CI gate, and a 1:1 file-name rule that does not match this suite | **Refuse.** `.agents/skills/test-sync/SKILL.md` is the adapted rules. Promotion is `docs/deferrals/test-sync-package/test-sync-package-deferral.md`. |
| Add a test file per `src/` module the audit marks "missing" | 1 — the CLI suites already exercise those modules | 6 — new tests for modules that are not untested | **Refuse.** |
| Refactor stdout and workflow pins into looser assertions | 2 — they can break when wording changes | 6 — a sweep across the suite, and [ADR-003](../../adrs/adr-003-public-contract.md) already says messages are not contract | **Refuse.** Not a deletion. |
| A new dependency, a new command, or an ADR | 0 | — | **Refuse.** |

## Acceptance

- [ ] `proof-repo-trim-copy-check` PASS — harness-init copy `test()` gone; `proof-lean-init-copies-identical` remains; `pnpm test` exits 0
- [ ] `proof-repo-trim-help-version` PASS — `usage lists --version` gone; the contract `--help` test remains; `pnpm test` exits 0
- [ ] `proof-repo-trim-unknown-command` PASS — `test/cli.test.ts` title `unknown command exits 1` gone; the contract unknown-command test remains; `pnpm test` exits 0
- [ ] `proof-repo-trim-template-files` PASS — `seed-extract: template files exist` gone; setup-surfaces and the two `assertSkillBasics` calls remain; `pnpm test` exits 0
- [ ] `proof-repo-trim-init-pin` PASS — the `init` dispatch test and the `\binit\b` assertions are gone; the help test still requires `setup`
- [ ] `proof-repo-trim-packages-readme` PASS — the README registry-residue test is gone; the add-then-setup test remains
- [ ] `proof-repo-trim-packages-workflow` PASS — the release test no longer names GitHub Packages and still rejects `secrets.`
- [ ] `proof-repo-trim-template-residue` PASS — `test/template-residue.test.ts` is gone; `pnpm test` exits 0

## Eval / gates

| Gate | Command / check | When | PASS | Abort |
|------|-------------------|------|------|-------|
| Integrity | `pnpm validate` | End of the batch | exit 0 | Fix; do not proceed |
| Tests | `pnpm test` | End of the batch | exit 0 | Fix; do not proceed |
| Comments | `pnpm comments` | End of the batch, because `test/` lines change | exit 0 | Fix; do not proceed |
| Spec obligations | `proof-repo-trim-spec-obligations` — each acceptance box pairs with one obligation; all nine landings are present; every `n/a` cites an unchanged surface | Before `code-plan` | all hold | Do not plan |

## Cross-domain leak table

| Leak | Refuse |
|------|--------|
| Archive `docs/specs/lean-init/`, its plan, and `docs/prds/lean-init/` | Pre-merge closure in `templates/.agents/skills/code-pr/references/pre-merge-closure.md` |
| Link `video/harness-explainer.mp4` from the site or the README | A `site/` change. This spec leaves `video/` tracked. |
| Rewrite `site/search.md` or [ADR-002](../../adrs/adr-002-public-npm-oidc.md) so they stop mentioning GitHub Packages | The history stays in the ADR. The search page stays a search example. |
| Delete `test/legacy.test.ts` or the harness-init migration playbook tests | Consumer path. [ADR-001](../../adrs/adr-001-claim-path.md) and [ADR-003](../../adrs/adr-003-public-contract.md). |
| Ship test-sync in `templates/` or a skill set | `docs/deferrals/test-sync-package/test-sync-package-deferral.md` |
| An executable plan from this skill | `code-plan` only |

## ADR

None owed. Dropping a duplicate test, a retired-name pin, a registry-residue pin, or a template-vocabulary file does not change a command, flag, exit code, finding code, or the config schema. [ADR-002](../../adrs/adr-002-public-npm-oidc.md) and [ADR-003](../../adrs/adr-003-public-contract.md) stay as they are. Do not add an ADR for this trim.

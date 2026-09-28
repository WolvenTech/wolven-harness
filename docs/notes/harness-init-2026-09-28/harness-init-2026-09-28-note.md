---
type: note
title: Harness init 2026-09-28
description: Record of the harness-init run that set up the Wolven harness in the wolven-harness package repo.
status: stable
---

# Harness init 2026-09-28

## Entry integration

Mode: **full**, the Human's pick; `AGENTS.md` was 25 lines, so full was the
recommendation. The `WOLVEN.md` body, minus its first line and H1, was
appended as `## Wolven harness` with headings demoted one level, and
`WOLVEN.md` was deleted.

Checks raised:

- **Validate commands.** The folded text and `.agents/rules/comments.md` name
  `pnpm harness:validate` / `harness:comments`, but `init` wired them to a
  `wolven-harness` bin this package repo does not install. The Human chose to
  repoint both scripts in `package.json` to `node dist/cli.js validate` /
  `node dist/cli.js comments`; they need `pnpm build` first, like `validate`.
- **Comments rule overlap.** The `AGENTS.md` comments bullet restated
  `.agents/rules/comments.md`. The Human chose to trim it to a pointer at the
  rule plus the `src/`/`test/` scope and the `origin/main` merge-base.
- **ADR 001 line.** The `AGENTS.md` rule pointing at 001, The ADR claim gate
  governs architecture-decision references, agrees with the folded claims
  section; no question raised.
- **`CLAUDE.md`** already imports `@AGENTS.md`; no offer needed.
- **Ignored harness paths:** none.
- **Existing doc folders:** 001 already sits in `docs/adrs/` with profile
  frontmatter and `status: stable`; nothing to reshape.
- **Untracked ADR 000.** After the fold, validate failed with
  `claim-missing` on the folded text's reference to 000, Record architecture
  decisions as profile ADRs, because validate resolves ADRs through
  `git ls-files` and `init`'s output was untracked. The Human chose one entry
  commit carrying all of `init`'s output alongside the step 0 changes.

## ADR migration

Skipped — no legacy ADRs. `harness:validate` reported `0 legacy-warn` and no
`legacy-adr` finding.

## Discovery

The repo's QMD index (`.qmd/index.yml`) exists but holds 0 documents and was
never updated. Building it would write `.qmd/index.sqlite`, which no ignore
rule covers, so discovery read the tree directly.

**Context.** `@wolventech/wolven-harness` is a TypeScript CLI (`init`,
`validate`, `comments`) that scaffolds an `AGENTS.md`-based skills tree,
wires Claude Code, Codex, and Cursor, and checks ADR claims. `src/` compiles
to `dist/` with `tsc` (ES2022, NodeNext, strict), and `yaml` is its only
runtime dependency. About 35 `node:test` suites under `test/` run through
`tsx`. `templates/` holds what `init` copies into consumer repos, and 14
suites pin the skill templates. CI checks Conventional Commit PR titles;
release-please cuts releases from `main` and publishes to GitHub Packages.
No CI job runs the tests on pull requests; `pnpm test` runs only in the
release job. The ADRs are 000, Record architecture decisions as profile
ADRs, and 001, The ADR claim gate governs architecture-decision references.
This repo's `.agents/` tree is an identical copy of `templates/.agents/`.

**Lifecycle.** Prototype, as named by the Human; no decisions exist outside
the tree.

**Decided tools.** TypeScript, Node 22 or later, pnpm (v11 in CI), `tsx`,
`node:test`, `yaml`, git, GitHub Actions, release-please
(`googleapis/release-please-action@v4`), `amannn/action-semantic-pull-request@v5`,
GitHub Packages (npm registry), and QMD. The wired runtimes are Claude Code,
Codex, and Cursor.

## Research

The Human approved web research, capped at five primary-source fetches;
all five were used. The pages were read through a summarizing fetch, so
the quotes below are as the fetch returned them.

- **release-please manifest config**
  ([manifest-releaser.md](https://github.com/googleapis/release-please/blob/main/docs/manifest-releaser.md)):
  `bump-minor-pre-major` means "BREAKING CHANGE only bumps semver minor if
  version < 1.0.0"; `include-component-in-tag: false` gives tags of the form
  `v<release-version>`; the manifest records each released version. The page
  does not describe `initial-version`, which `release-please-config.json`
  sets; it seeds a never-released package's version through the manifest
  instead.
- **release-please-action**
  ([README](https://github.com/googleapis/release-please-action)):
  `release_created` is "true if a root component release was created"; a
  release PR or tag created with `GITHUB_TOKEN` "will not trigger future
  GitHub actions workflows", and the README suggests a personal access
  token. This matches the close-and-reopen step in this repo's README.
- **GitHub Packages npm registry**
  ([docs](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)):
  scoped packages need `@NAMESPACE:registry=https://npm.pkg.github.com`;
  installing from a private package takes a token with at least
  `read:packages`, and `GITHUB_TOKEN` works when the repository is granted
  read access to the package. This matches the README's install section.
- **Node.js test runner**
  ([docs](https://nodejs.org/api/test.html)): `node:test` is stable since
  v20.0.0, and `node --test` matches `**/*.test.ts` by default unless
  `--no-strip-types` is supplied.
- **action-semantic-pull-request**
  ([README](https://github.com/amannn/action-semantic-pull-request)):
  checks that PR titles match Conventional Commits and recommends squash
  merging with "Default to PR title for squash merge commits"; it needs
  `pull-requests: read`, which `pr-title.yml` grants.

## Suggestions

Three suggested, all picked by the Human; no fourth had enough evidence.

- `release-please`: release and publish flow (`release.yml`,
  release-please config and manifest, `pr-title.yml`, `publishConfig`,
  the release and PR-title tests, the README's Release section).
- `node-test`: test conventions (`tsx --test`, the `test/helpers/`
  fixtures, the claim-gate ignore of `test/**`).
- `skill-templates`: authoring what `templates/` ships (14 contract suites
  through `skill-contract.ts`, the `files` list, and `.agents/` mirroring
  `templates/.agents/`).

## Stubs

Written as ask-only stubs, each a `SKILL.md` with `disable-model-invocation:
true` plus `agents/openai.yaml` with `allow_implicit_invocation: false`:

- `.agents/skills/release-please/`
- `.agents/skills/node-test/`
- `.agents/skills/skill-templates/`

`harness:validate` warns `skill-stub-open` once for each.

## Next steps for the Human

- **Define each stub.** Answer its When to use, Conventions, What to avoid,
  and How to verify prompts, then remove `wolven-harness: stub`. Remove
  `disable-model-invocation: true` and `agents/openai.yaml` only if the
  skill should be model-invocable.
- **Dangling `WOLVEN.md` pointer.** `docs/WRITING-PROFILE.md` line 47 cites
  "`WOLVEN.md`'s architecture-claims rule", but `WOLVEN.md` is gone after
  the fold. `templates/docs/WRITING-PROFILE.md` carries the same line, so
  every consumer repo that folds in full or light mode inherits it.
- **Two copies of the skills tree.** This repo's `.agents/` mirrors
  `templates/.agents/`; decide whether it tracks the templates, and how.
- **QMD index.** Decide whether to build it and whether
  `.qmd/index.sqlite` belongs in `.gitignore`. Even `qmd status` creates
  that file and adds a `models:` block to `.qmd/index.yml`; this run
  reverted both.
- **Tests on pull requests.** No CI job runs `pnpm test` before merge.
- **`initial-version`.** The release-please page fetched here does not
  cover this key; check it against the config schema if it matters again.

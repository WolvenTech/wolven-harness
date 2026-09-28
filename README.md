# wolven-harness *(@wolven-tech/harness)*

<img width="128" alt="Wolven" src="assets/wolven-logo-black.png#gh-light-mode-only">
<img width="128" alt="Wolven" src="assets/wolven-logo-white.png#gh-dark-mode-only">

[![npm version](https://img.shields.io/npm/v/@wolven-tech/harness.svg)](https://www.npmjs.com/package/@wolven-tech/harness)
[![node](https://img.shields.io/badge/node-%3E%3D22-brightgreen.svg)](https://nodejs.org)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

AI-assisted dev harness: init an AGENTS.md-based skills tree, wire runtimes, and validate architecture-decision claims.

`wolven-harness` is a TypeScript CLI for Node 22 or later. Installing it adds one binary, `wolven-harness`, with three commands: `init` scaffolds the harness into a repo, `validate` checks the result against a writing profile and a claim gate, and `comments` judges the comment lines a change adds.

The reason to run it is to stop re-explaining a repo to an agent. `init` seeds an `AGENTS.md`-based `.agents/` skills tree — sixteen skills, `harness-init` among them — and wires the runtimes you name. `validate` then keeps architecture-decision claims fail-closed: every `ADR-NNN` reference in a tracked file has to resolve to exactly one stable ADR under `docs/adrs/`, or the command exits 1.

With that in place, the default path for a change is spec, then plan, then execute, driven by the `code-spec`, `code-plan`, and `code-execute` skills — see [Suggested workflow](#suggested-workflow).

v0 supports macOS and Linux only: wiring Claude Code means creating a directory symlink, and Windows symlinks need Developer Mode or admin rights. Note also that the repository is named `wolven-harness` while the package it publishes is `@wolven-tech/harness`.

## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [Suggested workflow](#suggested-workflow)
- [Skills](#skills)
- [Setting up with harness-init](#setting-up-with-harness-init)
- [Doc layout](#doc-layout)
- [Runtimes](#runtimes)
- [Release](#release)
- [Contributing](#contributing)
- [License](#license)

## Install

The package is public on npmjs.org as `@wolven-tech/harness`. Install is two commands:

```sh
pnpm add -D @wolven-tech/harness
pnpm exec wolven-harness init
```

Run both at the git top level of the repo you are setting up — `init` checks, and fails anywhere else. You need Node 22 or later, git, and macOS or Linux.

`init` warns when the package is missing from `devDependencies`, and records its own version as `packageVersion` in `.wolven-harness.json` — the version of the `init` that ran, which is the installed one when you run it with `pnpm exec`.

Working from a clone of this repository instead is covered under [Contributing](#contributing).

## Usage

`wolven-harness --help` — or `-h`, or no command at all — prints the command list. An unknown command prints that list and exits 1.

### `wolven-harness init`

Run it at the git top-level of the target repo. It asks for the git host (`gh` or `bit`) and the runtimes to wire (`claude`, `codex`, `cursor`), or takes them as flags — `--git-host gh --runtimes claude,codex` — which are required when stdout is not a TTY. An unknown option is an error, and so is an input that ends before a prompt has been answered. The answers are saved to `.wolven-harness.json`.

`init` creates paths that are missing and leaves every other existing path byte-identical, then lists what it created and what it skipped. Two exceptions: it adds `harness:validate` and `harness:comments` to an existing `package.json` when those script keys are absent, and every run rewrites `packageVersion` in `.wolven-harness.json`. It writes `WOLVEN.md`, `docs/` (writing profile, ADR folder with a starter ADR, prds, specs, notes, deferrals), `.qmd/index.yml`, `.agents/` (skills, rules, and a hooks placeholder — including the `comments.md` standing rule), and the runtime wiring below. It never creates or edits `AGENTS.md`: see [Setting up with harness-init](#setting-up-with-harness-init) below.

### `wolven-harness validate`

Run it from anywhere inside the repo; it resolves the git top-level and exits 1 outside a git work tree. It checks:

- **Writing profile** — files under `docs/{adrs,prds,specs,notes,deferrals}/` carry `type`, `title`, `description`, and `status` (`draft`, `stable`, or `deprecated`), a `type` matching the folder, and a kebab-case name. ADRs stay flat as `docs/adrs/adr-NNN-<slug>.md` and name `superseded_by` when deprecated. Every other doc-folder uses `docs/<folder>/<slug>/<slug>-<type>.md`; a markdown file sitting directly in the folder fails. Paths under `archived/` are not checked. See `docs/WRITING-PROFILE.md` and [Doc layout](#doc-layout).
- **ADR claims** — any `ADR-NNN` or `adr-NNN-<slug>` reference in a tracked file must resolve to exactly one `stable` ADR under `docs/adrs/`. Missing, duplicate, draft, deprecated, or mismatched references fail with file and line. New ADRs count once git tracks them (staging is enough). The scan skips ADR files, `node_modules/`, and any path with an `archived/` segment.
- **Legacy ADRs** — ADR-like files outside `docs/adrs/` and outside `archived/` (such as `adrs/adr-002.md`) put the repo in legacy mode: references to them warn instead of failing, with one line per legacy ADR until it is migrated through `harness-init`. A reference that matches no profile ADR and no live legacy ADR fails, unless exactly one archived legacy ADR has that number, in which case it warns. A folder named `adr`, `adrs`, or `decisions` (any depth except `docs/adrs/` and `archived/`) that holds 4-digit-numbered files warns `adr-unrecognized`; that numbering is not checked.
- **Spine** — every skill under `.agents/skills/` has `name` and `description`, every `.agents/rules/*.md` cited in `WOLVEN.md` or `AGENTS.md` exists, no harness path (`.agents/skills`, `.agents/rules`, `docs`, `.claude/skills`, and the like) is excluded by an ignore rule — an excluded one would exist on your machine only, so it fails naming the rule — and a warning remains while `WOLVEN.md` is not yet folded into `AGENTS.md`.

`--verbose` also lists each legacy reference by file and line. The command exits 1 when any error is found.

To skip vendored or generated trees, add `"ignore": ["<dir>/**"]` to `.wolven-harness.json`. Only whole directories can be ignored, and never `docs/` or `.agents/`.

### `wolven-harness comments`

Run it from anywhere inside the repo; it resolves the git top-level and judges lines added since a base ref (default: the merge-base with `origin/HEAD`, falling back to `origin/main` then `main`) plus untracked files, against the style in `.agents/rules/comments.md`. An added comment must be a `why:`, `hazard:`, or `invariant:` line (four lines or fewer) or a `/** */` block directly above a declaration, and must not narrate the change, cite something outside the repository, or defer work with `@todo`.

It prints one `<file>:<line>: [<kind>] <message>` line per finding and ends with `comments: ok (0 findings)` or `comments: <n> finding(s)`, exiting 1 on any finding. `--base <ref>` overrides the base. `init` installs it as the `harness:comments` script.

By default it judges changed files outside the top-level `ignore` directories. `comments.paths` in `.wolven-harness.json`, a non-empty list of directory prefixes, replaces that scope, `ignore` included. `comments.languages` adds extensions beyond the built-in `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, and `.cjs`; each value is an object with a `line` marker and an optional `[open, close]` `block`.

## Suggested workflow

Once `init` has run and the `harness-init` skill has folded the entry file, the default path for a change is three skills, in order:

1. `code-spec` — freeze the ask into a spec of obligation-and-proof pairs.
2. `code-plan` — turn the locked spec into ordered execute units with dependencies and wave stops.
3. `code-execute` — implement a wave in-repo and run the gates.

Upstream of that, `create-prd` and `grilling` are the ones to reach for when the problem is not yet a clear ask.

Committing, opening a PR, review, and CI are each a later and separate ask: `code-commit` writes the commits, and `code-pr`, `code-review`, `code-ci`, and `handoff` are ask-only skills that never merge.

## Skills

`init` seeds sixteen skills under `.agents/skills/`. The four marked ask-only are never invoked by a model on its own — you name them, and none of them merges anything.

| Skill | Description |
| --- | --- |
| `adr` | Create, promote, and supersede ADRs under docs/adrs/; repoint claims when one supersedes another. |
| `code-ci` (ask-only) | Drive a PR to merge-ready: conflicts, then comments, then failing checks. Explicit ask; never merge. |
| `code-commit` | Write Conventional Commits on an explicit ask, or from code-execute when commit-cadence says to. |
| `code-execute` | Execute a locked plan in-repo (implement, validate, maybe commit). PRs, review, CI are a later ask. |
| `code-plan` | Turn a locked spec into ordered execute units with dependencies, wave stops, and a Subagent each. |
| `code-pr` (ask-only) | Push the branch and open or amend a PR from the body template. Ask-only; never merges. |
| `code-review` (ask-only) | Review an open PR against the refs it cites; post blocking or nit findings. Never merges. |
| `code-spec` | Freeze a code initiative into a spec from a PRD or confirmed ask, with obligation-proof pairs. |
| `create-prd` | Grill a problem to one statement, draft a lean PRD, and promote draft to stable only on approval. |
| `grilling` | Interview one question at a time until every open branch of a plan, decision, or idea is settled. |
| `handoff` (ask-only) | Save a handoff document to the OS temp directory for a fresh session. Ask-only; never automatic. |
| `harness-init` | Fold WOLVEN.md into AGENTS.md, migrate legacy ADRs, discover, stub skills, and write a session note. |
| `pragmatic-guard` | YAGNI: challenge over-build, record docs/deferrals/, refuse scope expansion without a trigger. |
| `prototype` | Build a throwaway prototype that answers one question, then discard or promote it deliberately. |
| `qmd` | Search local markdown notes, docs, and wikis with QMD; retrieve documents or set up QMD access. |
| `research` | Investigate against primary sources, cite every claim, and land the answer as an in-repo note. |

## Setting up with harness-init

`init` never creates or edits `AGENTS.md` on its own. Once it finishes, ask your agent to run the `harness-init` skill — `init`'s own closing line points you here, and so does `harness:validate` for as long as entry integration hasn't run yet.

The skill walks the repo through seven steps, and you steer every write:

- **Step 0 — entry integration.** Folds `WOLVEN.md` into `AGENTS.md` in one of three modes — full, light, or mention-only — after checking what `AGENTS.md` already holds, any overlapping router or rule, whether `CLAUDE.md` imports `AGENTS.md`, whether an ignore rule keeps a harness path from other clones (it proposes re-include rules that share the harness paths and keep the rest of those folders ignored), and whether `docs/adrs/`, `docs/prds/`, `docs/specs/`, `docs/notes/`, or `docs/deferrals/` already hold content the writing profile would fail.
- **Step 1 — legacy ADR migration**, offered only when `harness:validate` reports a legacy ADR. Migrates each one into `docs/adrs/`, keeping its number, mapping its status, and fixing the links the move touches. This step is done only once `harness:validate` exits 0 with no legacy warnings left — any claim that starts failing along the way gets worked through with you first: repointed, reworded, or turned into a new decision.
- **Steps 2–4 — discovery, research, and suggestions.** Reads what the repo already shows, researches a decided tool on the open web only with your OK and capped, and suggests two to four skills worth adding.
- **Step 5 — stubs.** Writes the skills you pick as ask-only stubs. `harness:validate` flags each open one with a `skill-stub-open` warning until you write its body and remove the stub marker.
- **Step 6 — session note.** Closes the run with a note under `docs/notes/` recording what happened and what is still yours to define.

Before writing anything, the agent shows you the diff and waits for your choice, and turns any ambiguity into one question at a time. The run also offers three commits — entry, migration, setup — each only once `harness:validate` passes, and only if you say yes.

## Doc layout

`init` creates `docs/{prds,specs,notes,deferrals}/`, each holding one slug folder per document: `docs/<folder>/<slug>/<slug>-<type>.md` (folder → type: `prds`→`prd`, `specs`→`spec`, `notes`→`note`, `deferrals`→`deferral`). `docs/specs/<slug>/` may also hold `<slug>-plan.md`. `docs/adrs/` is the exception and stays flat: `docs/adrs/adr-NNN-<slug>.md`. See `docs/WRITING-PROFILE.md` for the full type map and rules.

## Runtimes

`init --runtimes claude,codex,cursor` wires skill discovery per runtime, based on each runtime's own docs:

- **Claude Code** ([docs](https://code.claude.com/docs/en/skills)) reads only `.claude/skills/`. `init` creates `.claude/skills` as a directory symlink to `../.agents/skills`, and writes `CLAUDE.md` containing `@AGENTS.md` — both only when absent.
- **Codex** ([docs](https://learn.chatgpt.com/docs/build-skills)) reads `.agents/skills/` natively (`$CWD/.agents/skills` up to the repo root), so `init` writes nothing for it.
- **Cursor** ([docs](https://cursor.com/docs/context/skills)) also reads `.agents/skills/` natively, so `init` writes nothing for it either. Cursor additionally reads the legacy `.claude/skills/` path, so running `init --runtimes claude,cursor` together can list a skill twice for Cursor — accepted.

v0 supports macOS and Linux only: runtime wiring requires filesystem symlinks, and Windows symlinks need Developer Mode or admin rights, which `init` does not attempt to work around.

## Release

This section is for maintainers of this repo.

PR titles must be Conventional Commits; a PR-title check enforces it. Every pull request also runs the package gate — build, test, validate, comments — in CI.

PRs are squash-merged, with the PR title becoming the commit message on `main`.

release-please watches `main` and keeps a release PR open with the version bump and a `CHANGELOG.md` entry drawn from those commits. A push to `main` does not create the GitHub Release and does not publish.

Before 1.0, a `feat` commit or a breaking change bumps the minor version, and a `fix` bumps the patch.

Close and reopen the release PR before merging it: it was opened by `GITHUB_TOKEN`, which starts no workflows, so the required checks only run after the reopen.

Merging the release PR does not tag, create the GitHub Release, or publish. Run the `release` workflow by hand with the tag left empty (Actions → release → Run workflow). That run creates the GitHub Release and publishes to npmjs through OIDC trusted publishing — no stored token, and every published version carries a provenance attestation. Only the job that publishes can mint the token npm trusts; it installs no project dependencies.

If the publish fails after the GitHub Release exists, fix the cause and run the `release` workflow by hand with that release's tag. The retry checks that the Release is published and its tag matches the package version. A version that did publish can't be republished; ship the fix as the next patch.

npm-side setup, done once by an owner of the `wolven-tech` npm org with 2FA on:

Keep this as a public package on npm's free public-organization plan; it needs no paid private-package feature or additional npm member. The release workflow uses the repository's existing GitHub Actions setup.

1. Merge the workflow to `main` before configuring the npm trusted publisher. A trusted publisher can only be attached to a package that already exists. In a disposable checkout, an npm org owner builds the package, sets an unused prerelease version in `package.json` (below the planned first release), checks `npm pack --dry-run`, then seeds npmjs with `npm login` and `npm publish --tag oidc-seed --access public --ignore-scripts --registry https://registry.npmjs.org/`. Keep the seed version out of `main`.
2. On the package's settings page on npmjs, add a GitHub Actions trusted publisher: organization `WolvenTech`, repository `wolven-harness`, workflow `release.yml`, no environment. Allow direct `npm publish` for this workflow; new publisher mappings otherwise allow staged publishing by default.
3. After the first OIDC release succeeds, set publishing access to "Require two-factor authentication and disallow tokens" and deprecate the seed version. No npm token is needed in GitHub Secrets.

## Contributing

Issues and pull requests belong on this repository. [CONTRIBUTING.md](CONTRIBUTING.md) has the details; the short version is that PR titles are Conventional Commits, and every pull request runs the same gate you can run yourself.

Clone the repo, install, build, and test:

```sh
git clone https://github.com/WolvenTech/wolven-harness.git
cd wolven-harness
pnpm install
pnpm build
pnpm test
```

That clone is also the from-source way to run the CLI against another repo, without installing the package there:

```sh
cd /path/to/target-repo
node /path/to/wolven-harness/dist/cli.js init
```

## License

MIT © WolvenTech — see [LICENSE](./LICENSE).

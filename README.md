# wolven-harness *(@wolven-tech/harness)*

<img width="128" alt="Wolven" src="assets/wolven-logo-black.png#gh-light-mode-only">
<img width="128" alt="Wolven" src="assets/wolven-logo-white.png#gh-dark-mode-only">

[![npm version](https://img.shields.io/npm/v/@wolven-tech/harness.svg)](https://www.npmjs.com/package/@wolven-tech/harness)
[![node](https://img.shields.io/badge/node-%3E%3D22-brightgreen.svg)](https://nodejs.org)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

AI-assisted dev harness: init an AGENTS.md-based skills tree, wire runtimes, and validate architecture-decision claims.

Docs: [wolventech.github.io/wolven-harness](https://wolventech.github.io/wolven-harness/) (intended GitHub Pages URL; Pages is not enabled yet, so the host 404s). Until a maintainer points Pages at `site/`, read [`site/index.html`](site/index.html).

`wolven-harness` is a TypeScript CLI for Node 22 or later. The binary is `wolven-harness`. `init` seeds an `AGENTS.md`-based `.agents/` tree (sixteen skills, including `harness-init`) and wires runtimes. `validate` keeps `ADR-NNN` claims fail-closed against `docs/adrs/`. `comments` judges comment lines a change adds. Default path: spec, then plan, then execute. See [Suggested workflow](#suggested-workflow).

v0 is macOS and Linux only, because Claude wiring uses a directory symlink. The repository is `wolven-harness`. The package is `@wolven-tech/harness`.

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

Run both at the git top level of the repo you are setting up. `init` fails anywhere else. You need Node 22 or later, git, and macOS or Linux.

`init` warns when the package is missing from `devDependencies`, and records `packageVersion` in `.wolven-harness.json`.

Working from a clone is under [Contributing](#contributing).

## Usage

`wolven-harness --help` (or `-h`) prints the command list. Flags, failure modes, and profile rules are on the [Pages site](https://wolventech.github.io/wolven-harness/) (or [`site/index.html`](site/index.html)).

### `wolven-harness init`

Run it at the git top-level of the target repo. It asks for the git host (`gh` or `bit`) and the runtimes to wire (`claude`, `codex`, `cursor`), or takes `--git-host` and `--runtimes`. When stdout is not a TTY, pass `--git-host` and `--runtimes`. It never creates or edits `AGENTS.md`. See [Setting up with harness-init](#setting-up-with-harness-init).

### `wolven-harness validate`

Run it from anywhere inside the repo. It checks the writing profile, ADR claims, legacy ADRs, and the skills-and-rules spine. It exits 1 when any error is found.

### `wolven-harness comments`

Run it from anywhere inside the repo. It judges comment lines a change added. It exits 1 on any finding.

## Suggested workflow

After `init` and `harness-init`:

1. `code-spec`: freeze the ask into obligation-and-proof pairs.
2. `code-plan`: turn the spec into ordered execute units.
3. `code-execute`: implement a wave in-repo and run the gates.

Use `create-prd` and `grilling` when the problem is not yet a clear ask.

Commit, PR, review, and CI are later, separate asks. `code-pr`, `code-review`, `code-ci`, and `handoff` are ask-only and never merge.

## Skills

`init` seeds sixteen skills under `.agents/skills/`. Ask-only rows are never started by a model, and none of them merges. Details: [Pages](https://wolventech.github.io/wolven-harness/) or [`site/index.html`](site/index.html).

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

`init` never creates or edits `AGENTS.md`. After it finishes, ask your agent to run `harness-init`. You steer every write. Full walk: [Pages](https://wolventech.github.io/wolven-harness/) or [`site/index.html`](site/index.html).

- **Step 0:** fold `WOLVEN.md` into `AGENTS.md` (full, light, or mention-only).
- **Step 1:** migrate legacy ADRs into `docs/adrs/` when validate reports them.
- **Steps 2 to 4:** discover the repo and suggest two to four skills.
- **Step 5:** write the skills you pick as ask-only stubs (`skill-stub-open`).
- **Step 6:** write a session note under `docs/notes/`.

Migration is done only once `harness:validate` exits 0 with no legacy warnings left. The agent shows the diff first. The run offers three commits (entry, migration, setup) only if you say yes.

## Doc layout

`init` writes `docs/<folder>/<slug>/<slug>-<type>.md` for prds, specs, notes, and deferrals. `docs/adrs/` stays flat as `docs/adrs/adr-NNN-<slug>.md`. A spec folder may also hold `<slug>-plan.md`. See `docs/WRITING-PROFILE.md` or the folders table on [Pages](https://wolventech.github.io/wolven-harness/).

## Runtimes

`init --runtimes claude,codex,cursor` wires skill discovery. Runtime docs: [Claude Code](https://code.claude.com/docs/en/skills), [Codex](https://learn.chatgpt.com/docs/build-skills), [Cursor](https://cursor.com/docs/context/skills).

- **Claude Code:** reads `.claude/skills/`. `init` adds a symlink to `.agents/skills` if missing.
- **Codex:** reads `.agents/skills/` natively. `init` writes nothing.
- **Cursor:** same native path. With `claude`, a skill can list twice.

v0 is macOS and Linux only. Runtime wiring needs filesystem symlinks.

## Release

Maintainer notes. PR titles are Conventional Commits. CI runs build, test, validate, and comments. PRs squash-merge; the title becomes the `main` commit.

release-please watches `main` and keeps a release PR open. A push to `main` does not create the GitHub Release and does not publish.

Before 1.0, `feat` or a breaking change bumps minor, and `fix` bumps patch.

Close and reopen the release PR before merging it: `GITHUB_TOKEN` starts no workflows, so checks run only after the reopen.

Merging the release PR does not tag, create the GitHub Release, or publish. Run the `release` workflow by hand with the tag left empty (Actions → release → Run workflow). That publishes to npmjs through OIDC trusted publishing. No stored token. Every published version has provenance.

If publish fails after the GitHub Release exists, run the `release` workflow by hand with that release's tag. A published version cannot be republished. Ship the next patch.

One-time npm setup, by an owner of the `wolven-tech` org with 2FA on. Keep the package public on npm's free public-organization plan.

A trusted publisher needs a package that already exists. In a disposable checkout, seed npmjs with `npm login` and `npm publish --tag oidc-seed --access public --ignore-scripts --registry https://registry.npmjs.org/`. Keep the seed version out of `main`.

On npmjs, add a GitHub Actions trusted publisher: organization `WolvenTech`, repository `wolven-harness`, workflow `release.yml`, no environment. Allow direct `npm publish` for this workflow.

After the first OIDC release succeeds, set publishing access to "Require two-factor authentication and disallow tokens" and deprecate the seed version. No npm token is needed in GitHub Secrets.

## Contributing

Issues and pull requests belong here. See [CONTRIBUTING.md](CONTRIBUTING.md). PR titles are Conventional Commits. CI runs the same gate.

```sh
git clone https://github.com/WolvenTech/wolven-harness.git
cd wolven-harness
pnpm install
pnpm build
pnpm test
```

From-source init, without installing the package in the target repo:

```sh
cd /path/to/target-repo
node /path/to/wolven-harness/dist/cli.js init
```

## License

MIT © WolvenTech. See [LICENSE](./LICENSE).

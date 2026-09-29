# wolven-harness *(@wolven-tech/harness)*

<img width="128" alt="Wolven" src="assets/wolven-logo-black.png#gh-light-mode-only">
<img width="128" alt="Wolven" src="assets/wolven-logo-white.png#gh-dark-mode-only">

[![npm version](https://img.shields.io/npm/v/@wolven-tech/harness.svg)](https://www.npmjs.com/package/@wolven-tech/harness)
[![node](https://img.shields.io/badge/node-%3E%3D22-brightgreen.svg)](https://nodejs.org)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

CLI tool that installs and maintains a set of tools for AI agents to find instructions, use recorded decisions, check their work and maintain human-decided patterns.

Docs: [wolventech.github.io/wolven-harness](https://wolventech.github.io/wolven-harness/). See also [Commands](https://wolventech.github.io/wolven-harness/commands).

## Install

```sh
pnpm add -D @wolven-tech/harness && pnpm exec wolven-harness setup
```

Run at the git top level. You need Node 22 or later, git, pnpm, and macOS or Linux.

## Setup

`setup` creates only paths that are missing. It never creates or edits `AGENTS.md`, and it never commits. It also:

- adds missing `harness:validate`, `harness:comments` and `harness:score` scripts to an existing `package.json`, and writes a starter `.harness-score.json`;
- rewrites `.wolven-harness.json` on every run, with your setup choices and `packageVersion`.

To be asked questions, stdin and stdout must both be a TTY. Otherwise pass `--git-host gh|bit` and `--runtimes` (a comma list of `claude`, `codex`, `cursor`), unless `.wolven-harness.json` already records them.

Nine core skills are always installed. Two optional sets add more:

- `ship`: `code-commit`, `code-pr`, `code-review`, `code-ci`.
- `discovery`: `create-prd`, `prototype`, `handoff`.

Interactive runs preselect `ship`. Non-interactive runs without `--skills` install core and `ship`. Use `--skills ship,discovery` to pick sets, or `--skills none` for core only. Re-runs never remove an installed set.

## What to do next

Ask your agent to run `harness-init`. Then:

1. `code-spec`: agree on the change and how to verify it.
2. `code-plan`: approve the implementation steps.
3. `code-execute`: make the change and run the checks.
4. `code-commit`: commit the result when you are ready.

Commits are manual by default. For a one-file change, go straight to `code-execute`.

`create-prd`, `prototype`, and `handoff` need the discovery set: `pnpm exec wolven-harness setup --skills discovery`. `code-pr`, `code-review`, `code-ci`, and `handoff` are ask-only and never merge.

All 16 skills are listed on the [skills page](https://wolventech.github.io/wolven-harness/skills).

## License

MIT © WolvenTech. See [LICENSE](./LICENSE). To contribute, see [CONTRIBUTING.md](CONTRIBUTING.md).

# wolven-harness *(@wolven-tech/harness)*

<img width="128" alt="Wolven" src="assets/wolven-logo-black.png#gh-light-mode-only">
<img width="128" alt="Wolven" src="assets/wolven-logo-white.png#gh-dark-mode-only">

[![npm version](https://img.shields.io/npm/v/@wolven-tech/harness.svg)](https://www.npmjs.com/package/@wolven-tech/harness)
[![node](https://img.shields.io/badge/node-%3E%3D22-brightgreen.svg)](https://nodejs.org)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

CLI tool that installs and maintains a set of tools for AI agents to find instructions, use recorded decisions, plan and implement, then check their work and keep to the patterns you decide.

Docs: [wolventech.github.io/wolven-harness](https://wolventech.github.io/wolven-harness/). See also [Commands](https://wolventech.github.io/wolven-harness/commands).

## Install

Install the CLI globally using your package manager:

```sh
npm install -g @wolven-tech/harness
```
```sh
yarn global add @wolven-tech/harness
```
```sh
pnpm add -g @wolven-tech/harness
```

You need Node 22 or later, git, and macOS or Linux.

Then run setup from the top level of a Git repository, or from any folder near your repo code that sits outside the repository:

```sh
wolven-harness setup
```

At a repository root, setup does a quiet install: the harness lives in `.wolven-harness/`, with `.wolven-harness.json` and a few untracked links beside it, so git sees only what you pick during `harness-init`. Next, open your coding agent in that folder and ask it to run the `harness-init` skill. A skill is a set of instructions your agent follows when you ask for it by name. To have git track the whole harness, see [Files and validation](https://wolventech.github.io/wolven-harness/layout).

Running `npx @wolven-tech/harness setup` works without a global install, but setup then recommends the global install so you can use other commands like `skills` and `validate`.

## Setup

`setup` creates only paths that are missing. It never creates or edits `AGENTS.md`, and it never commits. It also:

- connects each coding agent you select (the CLI calls them runtimes) to the skills, and to the rules where that agent reads them directly;
- in a full install, adds missing `harness:validate`, `harness:comments` and `harness:score` scripts to an existing `package.json`, and writes a starter `.harness-score.json`; a quiet install adds neither and keeps its score config in `.wolven-harness/`;
- rewrites `.wolven-harness.json` on every run, with your setup choices and `packageVersion`.

In an interactive terminal, `setup` asks for your Git host, runtimes, and optional skill sets. In scripts or CI, pass `--git-host`, `--runtimes`, and any optional flags; see [Commands](https://wolventech.github.io/wolven-harness/commands) for all options and detection rules.

| Set | Installed | Skills |
| --- | --- | --- |
| `core` | Always | `harness-init`, `adr`, `grilling`, `pragmatic-guard`, `qmd`, `research`, `code-spec`, `code-plan`, `code-execute`, `harness-doctor`, `harness-remove` |
| `ship` | Default (`--skills ship`) | `code-commit`, `code-pr`, `code-review`, `code-ci` |
| `discovery` | Optional (`--skills discovery`) | `create-prd`, `prototype`, `journey-map`, `wayfinder`, `handoff`, `the-fool`, `the-jury` |

Use `--skills ship,discovery` to pick sets, or `--skills none` for core only. Re-runs never remove an installed set.

## What to do next

Ask your agent to run `harness-init`. It first asks how much setup you want right now. Quick setup connects the harness to your coding agents, then hands back; [`lean-path.md`](https://github.com/WolvenTech/wolven-harness/blob/main/templates/.agents/skills/harness-init/references/lean-path.md) lists what it leaves for later. Guided setup walks through every step one at a time, and you run or skip each. Either way, the run ends by asking what to work on next. See [Installation](https://wolventech.github.io/wolven-harness/install). Then:

| Step | Skill | What it does |
| --- | --- | --- |
| 1. Specify | `code-spec` | Agree on the change and how to verify it. |
| 2. Plan | `code-plan` | Approve the implementation steps. |
| 3. Execute | `code-execute` | Make the change and run the checks (go straight here for a one-file change). |
| 4. Commit | `code-commit` | Commit the result when you are ready (manual by default). |
| Ship (only when you ask) | `code-pr`, `code-review`, `code-ci` | Open or update a PR, review it, or resolve CI checks; none ever merges. |
| Discovery | `create-prd`, `prototype`, `journey-map`, `wayfinder`, `handoff`, `the-fool`, `the-jury` | Explore problems and decisions (`wolven-harness setup --skills discovery`; `handoff` runs only when you ask). |

Every skill is listed on the [skills page](https://wolventech.github.io/wolven-harness/skills).

## Check the install

`harness-init` connects the harness, but it does not build the search index your agent uses. Install QMD, the local tool that searches your repo's docs, and build the index:

```sh
npm install -g @tobilu/qmd
qmd update
qmd embed
```

Then run the check:

```sh
wolven-harness doctor
```

It lists what needs attention and exits 1 when an error remains. Run before these steps, it reports errors you can expect, so wait until they are done. If something is still wrong, ask your agent to run the `harness-doctor` skill, which explains each finding and repairs it with your approval. See [Search](https://wolventech.github.io/wolven-harness/search).

## Remove the harness

```sh
wolven-harness uninstall
```

It lists what it will remove, asks before removing anything, and keeps your docs. See [Uninstall](https://wolventech.github.io/wolven-harness/install#uninstall-a-quiet-install).

## License

MIT © WolvenTech. See [LICENSE](./LICENSE). To contribute, see [CONTRIBUTING.md](CONTRIBUTING.md).

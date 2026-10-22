# wolven-harness *(@wolven-tech/harness)*

<img width="128" alt="Wolven" src="assets/wolven-logo-black.png#gh-light-mode-only">
<img width="128" alt="Wolven" src="assets/wolven-logo-white.png#gh-dark-mode-only">

[![npm version](https://img.shields.io/npm/v/@wolven-tech/harness.svg)](https://www.npmjs.com/package/@wolven-tech/harness)
[![node](https://img.shields.io/badge/node-%3E%3D22-brightgreen.svg)](https://nodejs.org)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

CLI tool that installs and maintains a set of tools for AI agents to find instructions, use recorded decisions, plan and implement, then check their work and maintain human-decided patterns.

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

Then run setup from the top level of a Git repository, or from any folder near your repo code:

```sh
wolven-harness setup
```

The setup will guide you through the installation choices and then write the chosen skills, rules and commands, their runtime links, and record your choices. Then you can run your agent in that folder and ask for `harness-init`.

Running `npx @wolven-tech/harness setup` works without a global install, but setup then recommends the global install so you can use other commands like `skills` and `validate`.

## Setup

`setup` creates only paths that are missing. It never creates or edits `AGENTS.md`, and it never commits. It also:

- wires each selected runtime's skills path, and its rules path where the runtime reads one natively;
- adds missing `harness:validate`, `harness:comments` and `harness:score` scripts to an existing `package.json`, and writes a starter `.harness-score.json`;
- rewrites `.wolven-harness.json` on every run, with your setup choices and `packageVersion`.

In an interactive terminal, `setup` asks for your Git host, runtimes, and optional skill sets. In scripts or CI, pass `--git-host`, `--runtimes`, and any optional flags; see [Commands](https://wolventech.github.io/wolven-harness/commands) for all options and detection rules.

| Set | Installed | Skills |
| --- | --- | --- |
| `core` | Always | `harness-init`, `adr`, `grilling`, `pragmatic-guard`, `qmd`, `research`, `code-spec`, `code-plan`, `code-execute` |
| `ship` | Default (`--skills ship`) | `code-commit`, `code-pr`, `code-review`, `code-ci` |
| `discovery` | Optional (`--skills discovery`) | `create-prd`, `prototype`, `journey-map`, `wayfinder`, `handoff`, `the-fool`, `the-jury` |

Use `--skills ship,discovery` to pick sets, or `--skills none` for core only. Re-runs never remove an installed set.

## What to do next

Ask your agent to run `harness-init`. It first asks how much setup you want right now. The basics path notes your first goal and updates `AGENTS.md`, then hands back; [`lean-path.md`](https://github.com/WolvenTech/wolven-harness/blob/main/templates/.agents/skills/harness-init/references/lean-path.md) lists what it leaves for later. The full tour opens with one checklist of what this run should cover. Either way, the run ends by offering to start a spec for your goal. See [Installation](https://wolventech.github.io/wolven-harness/install). Then:

| Step | Skill | What it does |
| --- | --- | --- |
| 1. Specify | `code-spec` | Agree on the change and how to verify it. |
| 2. Plan | `code-plan` | Approve the implementation steps. |
| 3. Execute | `code-execute` | Make the change and run the checks (go straight here for a one-file change). |
| 4. Commit | `code-commit` | Commit the result when you are ready (manual by default). |
| Ship (ask-only) | `code-pr`, `code-review`, `code-ci` | Open or update a PR, review it, or resolve CI checks; none ever merges. |
| Discovery | `create-prd`, `prototype`, `journey-map`, `wayfinder`, `handoff`, `the-fool`, `the-jury` | Explore problems and decisions (`wolven-harness setup --skills discovery`; `handoff` is ask-only). |

Every skill is listed on the [skills page](https://wolventech.github.io/wolven-harness/skills).

## License

MIT © WolvenTech. See [LICENSE](./LICENSE). To contribute, see [CONTRIBUTING.md](CONTRIBUTING.md).

# wolven-harness *(@wolven-tech/harness)*

<img width="128" alt="Wolven" src="assets/wolven-logo-black.png#gh-light-mode-only">
<img width="128" alt="Wolven" src="assets/wolven-logo-white.png#gh-dark-mode-only">

[![npm version](https://img.shields.io/npm/v/@wolven-tech/harness.svg)](https://www.npmjs.com/package/@wolven-tech/harness)
[![node](https://img.shields.io/badge/node-%3E%3D22-brightgreen.svg)](https://nodejs.org)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

CLI tool that installs and maintains a set of tools for AI agents to find instructions, use recorded decisions, plan and implement, then check their work and maintain human-decided patterns.

Docs: [wolventech.github.io/wolven-harness](https://wolventech.github.io/wolven-harness/). See also [Commands](https://wolventech.github.io/wolven-harness/commands).

## Install

Install the CLI globally, so `wolven-harness` works from any folder:

```sh
npm install -g @wolven-tech/harness
yarn global add @wolven-tech/harness
pnpm add -g @wolven-tech/harness
```

You need Node 22 or later, git, and macOS or Linux. Then run setup from the top level of a Git repository, or from a folder that is outside every repository:

```sh
wolven-harness setup --git-host gh --runtimes claude
```

At a Git top level, setup scaffolds the full harness. Outside any repository, it writes the core skills and their runtime links, records your choices, and tells you to run `harness-init` in that folder. A repository subfolder is not a setup location. Running `npx @wolven-tech/harness setup` works without a global install, but setup then recommends the global one.

Run `wolven-harness doctor` to check a wired install. It reports findings and exits 1 when an error needs attention. The core `harness-doctor` skill explains each finding and how to repair it with your approval.

## Setup

`setup` creates only paths that are missing. It never creates or edits `AGENTS.md`, and it never commits. It also:

- wires each selected runtime's skills path, and its rules path where the runtime reads one natively;
- adds missing `harness:validate`, `harness:comments` and `harness:score` scripts to an existing `package.json`, and writes a starter `.harness-score.json`;
- rewrites `.wolven-harness.json` on every run, with your setup choices and `packageVersion`.

To be asked questions, stdin and stdout must both be a TTY. Otherwise pass `--git-host gh|bit` and `--runtimes` (a comma list of `claude`, `codex`, `cursor`, `opencode`, `amp`, `copilot`, `gemini`, `kiro`, `antigravity`), unless `.wolven-harness.json` already records them. `--package-manager` (`npm`, `yarn`, `pnpm`, `none`) overrides detection; otherwise setup uses the recorded value, `package.json`'s `packageManager` field, the one lockfile present, or `npm` for a project with no other signal.

Core skills are always installed. Two optional sets add more:

- `ship`: `code-commit`, `code-pr`, `code-review`, `code-ci`.
- `discovery`: `create-prd`, `prototype`, `journey-map`, `wayfinder`, `handoff`, `the-fool`, `the-jury`.

Interactive runs preselect `ship`. Non-interactive runs without `--skills` install core and `ship`. Use `--skills ship,discovery` to pick sets, or `--skills none` for core only. Re-runs never remove an installed set.

## What to do next

Ask your agent to run `harness-init`. It first asks how much setup you want right now. The basics path notes your first goal and updates `AGENTS.md`, then hands back; [`lean-path.md`](https://github.com/WolvenTech/wolven-harness/blob/main/templates/.agents/skills/harness-init/references/lean-path.md) lists what it leaves for later. The full tour opens with one checklist of what this run should cover. Either way, the run ends by offering to start a spec for your goal. See [harness-init](https://wolventech.github.io/wolven-harness/harness-init). Then:

1. `code-spec`: agree on the change and how to verify it.
2. `code-plan`: approve the implementation steps.
3. `code-execute`: make the change and run the checks.
4. `code-commit`: commit the result when you are ready.

Commits are manual by default. For a one-file change, go straight to `code-execute`.

`create-prd`, `prototype`, `journey-map`, `wayfinder`, `handoff`, `the-fool`, and `the-jury` need the discovery set: `wolven-harness setup --skills discovery`. `code-pr`, `code-review`, `code-ci`, and `handoff` are ask-only and never merge.

Every skill is listed on the [skills page](https://wolventech.github.io/wolven-harness/skills).

## License

MIT © WolvenTech. See [LICENSE](./LICENSE). To contribute, see [CONTRIBUTING.md](CONTRIBUTING.md).

# wolven-harness *(@wolven-tech/harness)*

<img width="128" alt="Wolven" src="assets/wolven-logo-black.png#gh-light-mode-only">
<img width="128" alt="Wolven" src="assets/wolven-logo-white.png#gh-dark-mode-only">

[![npm version](https://img.shields.io/npm/v/@wolven-tech/harness.svg)](https://www.npmjs.com/package/@wolven-tech/harness)
[![node](https://img.shields.io/badge/node-%3E%3D22-brightgreen.svg)](https://nodejs.org)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

`wolven-harness` is a TypeScript CLI for Node 22 or later. The binary is `wolven-harness`. `init` seeds an `AGENTS.md`-based `.agents/` tree (sixteen skills, including `harness-init`) and wires runtimes. `validate` keeps `ADR-NNN` claims fail-closed against `docs/adrs/`. `comments` judges comment lines a change adds. v0 is macOS and Linux only, because Claude wiring uses a directory symlink. The repository is `wolven-harness`. The package is `@wolven-tech/harness`.

Docs: [wolventech.github.io/wolven-harness](https://wolventech.github.io/wolven-harness/).

## Install

The package is public on npmjs.org as `@wolven-tech/harness`. Install is two commands, in this order:

```sh
pnpm add -D @wolven-tech/harness
pnpm exec wolven-harness init
```

Run both at the git top level of the repo you are setting up. `init` fails anywhere else. You need Node 22 or later, git, and macOS or Linux.

## Init

`init` asks a few questions, then adds only what is missing. It never edits `AGENTS.md`, and it never commits.

When stdout is not a TTY, pass `--git-host` and `--runtimes`. Add a skill set later with `--skills` (for example `--skills ship,discovery`). Re-runs never remove one.

## What to do next

After `init` and `harness-init`:

1. `code-spec`: freeze the ask into obligation-and-proof pairs.
2. `code-plan`: turn the spec into ordered execute units.
3. `code-execute`: implement a wave in-repo and run the gates.

Use `create-prd` and `grilling` when the problem is not yet a clear ask.

Commit, PR, review, and CI are later, separate asks. `code-pr`, `code-review`, `code-ci`, and `handoff` are ask-only and never merge.

## Skills

`init` seeds sixteen skills under `.agents/skills/`. Ask-only rows are never started by a model, and none of them merges. The same table, plus the standing rules, is on the [skills page](https://wolventech.github.io/wolven-harness/skills).

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

## License

MIT © WolvenTech. See [LICENSE](./LICENSE). Issues and pull requests belong here: [CONTRIBUTING.md](CONTRIBUTING.md).

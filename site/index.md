---
description: AI-assisted development harness to plan and implement changes, initialize an AGENTS.md-based skill tree, wire runtimes, and validate architecture decisions.
---

# wolven-harness

AI-assisted development harness to plan and implement changes, initialize an `AGENTS.md`-based skill tree, wire runtimes, and validate architecture decisions.

## Install

Run `setup` at your repository's Git top level. You need Node.js 22 or later, Git, pnpm, and macOS or Linux.

```sh
pnpm add -D @wolven-tech/harness && pnpm exec wolven-harness setup
```

`setup` installs nine core skills, three standing rules, document templates, a local search index configuration, and the `WOLVEN.md` entry file. Optional sets add up to nine more skills (`ship`: four, `discovery`: five); `ship` is selected by default, so a default setup installs 13 skills. Setup preserves existing copies and leaves `AGENTS.md` alone.

It adds missing check scripts to an existing `package.json` and saves setup choices and the package version in `.wolven-harness.json`. It does not install dependencies; setup prints the install command when `harness-score` is missing.

For all commands, flags, configuration, and exit behavior, see the [CLI reference](./commands).

## Next

Ask your coding agent to run `harness-init`. It proposes how to connect the harness files to your repo’s existing instructions in `AGENTS.md`.

Follow the instructions and review the proposed diff before approving each write. [Setup](./harness-init) explains the steps.

Then try a small change with the [Development workflow](./cycle) example.

`setup`, `validate`, and `comments` are terminal commands. `harness-init`, `code-spec`, `code-plan`, and `code-execute` are skills you ask the agent to run.

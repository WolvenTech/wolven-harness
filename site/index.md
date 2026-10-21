---
description: AI-assisted development harness to plan and implement changes, initialize an AGENTS.md-based skill tree, wire runtimes, and validate architecture decisions.
---

# wolven-harness

AI-assisted development harness to plan and implement changes, initialize an `AGENTS.md`-based skill tree, wire runtimes, and validate architecture decisions.

## Install

Install the CLI globally, so `wolven-harness` works from any folder:

```sh
npm install -g @wolven-tech/harness
yarn global add @wolven-tech/harness
pnpm add -g @wolven-tech/harness
```

You need Node.js 22 or later, Git, and macOS or Linux. Then run setup from the top level of a Git repository, or from a folder that is outside every repository:

```sh
wolven-harness setup --git-host gh --runtimes claude
```

At a Git top level, `setup` installs the core skills, the standing rules, the document templates, the local search index configuration, the `WOLVEN.md` entry file, and each selected runtime's wiring. Outside any repository, it writes the core skills and their runtime links so `harness-init` can finish the install in that folder. A repository subfolder is not a setup location. Optional sets add more skills (`ship`: four, `discovery`: five); `ship` is selected by default.

`setup` preserves existing copies and leaves `AGENTS.md` alone. At a repository top level, it adds missing check scripts to an existing `package.json` and saves the setup choices in `.wolven-harness.json`. Outside a repository, it writes neither documentation nor package scripts. It does not install dependencies; setup prints the install command when `harness-score` is missing.

Run `wolven-harness doctor` to check the install. It reports finding codes and exits 1 when an error needs attention; the core `harness-doctor` skill explains the findings and guides repairs one approved change at a time.

For all commands, flags, configuration, and exit behavior, see the [CLI reference](./commands).

## Next

Ask your coding agent to run `harness-init`. It proposes how to connect the harness files to your repo’s existing instructions in `AGENTS.md`.

Follow the instructions and review the proposed diff before approving each write. [Setup](./harness-init) explains the steps.

Then try a small change with the [Development workflow](./cycle) example.

`setup`, `skills`, `doctor`, `validate`, and `comments` are terminal commands. `harness-init`, `harness-doctor`, `code-spec`, `code-plan`, and `code-execute` are skills you ask the agent to run.

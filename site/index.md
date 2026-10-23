---
description: AI-assisted development harness to plan and implement changes, initialize an AGENTS.md-based skill tree, wire runtimes, and validate architecture decisions.
---

# wolven-harness

AI-assisted development harness to plan and implement changes, initialize an `AGENTS.md`-based skill tree, wire runtimes, and validate architecture decisions.

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

The setup will guide you through the installation choices and then write the chosen skills, rules and commands, their runtime links, and record your choices.

Running `npx @wolven-tech/harness setup` works without a global install, but setup then recommends the global install so you can use other commands like `skills` and `validate`.

Run `wolven-harness doctor` to check the install. It reports finding codes and exits 1 when an error needs attention; the core `harness-doctor` skill explains the findings and guides repairs one approved change at a time.

For all commands, flags, configuration, and exit behavior, see the [CLI reference](./commands).

## Next

Ask your coding agent to run `harness-init`. It proposes how to connect the harness files to your repo’s existing instructions in `AGENTS.md`.

Follow the instructions and review the proposed diff before approving each write. [Installation](./install) explains the steps.

Then try a small change with the [Development workflow](./cycle) example.

`setup`, `skills`, `doctor`, `validate`, and `comments` are terminal commands. `harness-init`, `harness-doctor`, `code-spec`, `code-plan`, and `code-execute` are skills you ask the agent to run.

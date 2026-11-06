---
description: A CLI that installs and maintains tools your AI coding agents use to find instructions, follow recorded decisions, plan and implement changes, and check their work.
---

# wolven-harness

A CLI that installs and maintains tools your AI coding agents use to find instructions, follow recorded decisions, plan and implement changes, and check their work.

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

Setup walks you through the installation choices. It then writes the skills, rules and commands you chose, links them to your coding agents, and records your choices. A skill is a set of instructions your agent follows when you ask for it by name.

Running `npx @wolven-tech/harness setup` works without a global install, but setup then recommends the global install so you can use other commands like `skills` and `validate`.

For all commands, flags, configuration, and exit behavior, see the [CLI reference](./commands).

## Next

Ask your coding agent to run `harness-init`. It proposes how to connect the harness files to your repo’s existing instructions in `AGENTS.md`.

Follow the instructions and review the proposed diff before approving each write. [Installation](./install) explains the steps.

## Check the install

`harness-init` connects the harness, but it does not build the search index your agent uses. Install QMD, the local tool that searches your repo's docs, and build the index:

```sh
npm install -g @tobilu/qmd
qmd update
qmd embed
```

Then run `wolven-harness doctor`. It lists what needs attention, with a code for each finding, and exits 1 when an error remains. Run before these steps, it reports errors you can expect, so wait until they are done. If something is still wrong, ask your agent to run the `harness-doctor` skill, which explains each finding and guides repairs one approved change at a time. See [Search](./search).

## Try it

Try a small change with the [Development workflow](./cycle) example.

`setup`, `skills`, `doctor`, `validate`, `comments`, and `uninstall` are terminal commands. `harness-init`, `harness-doctor`, `code-spec`, `code-plan`, and `code-execute` are skills you ask the agent to run.

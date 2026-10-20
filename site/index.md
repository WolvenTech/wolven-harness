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

You need Node.js 22 or later, Git, and macOS or Linux. Then run setup from the folder you want your agent to work in:

```sh
wolven-harness setup --git-host gh --runtimes claude
```

At a Git top level, `setup` installs the core skills, the standing rules, the document templates, the local search index configuration, the `WOLVEN.md` entry file, and each selected runtime's wiring. Anywhere else, it writes the core skills and their runtime links so `harness-init` can finish the install in that folder. Optional sets add more skills (`ship`: four, `discovery`: five); `ship` is selected by default.

`setup` preserves existing copies and leaves `AGENTS.md` alone. It adds missing check scripts to an existing `package.json`, records the resolved package manager and every file it wrote, and saves the setup choices in `.wolven-harness.json`. It does not install dependencies; setup prints the install command when `harness-score` is missing.

For all commands, flags, configuration, and exit behavior, see the [CLI reference](./commands).

## Check the install

```sh
wolven-harness doctor
```

`doctor` checks each wired runtime's entry, rules and skills wiring, the docs repository, `qmd` and its index, the code repository, and drift from the install manifest. It writes nothing, prints a `fix:` line after each error, and exits 1 when it finds one. Ask your agent to run the `harness-doctor` skill to apply the fixes one at a time.

## Next

Ask your coding agent to run `harness-init`. It proposes how to connect the harness files to your repo’s existing instructions in `AGENTS.md`.

Follow the instructions and review the proposed diff before approving each write. [Setup](./harness-init) explains the steps.

Then try a small change with the [Development workflow](./cycle) example.

`setup`, `doctor`, `skills`, `validate`, and `comments` are terminal commands. `harness-init`, `harness-doctor`, `code-spec`, `code-plan`, and `code-execute` are skills you ask the agent to run.

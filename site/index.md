---
description: Set up a repo so a coding agent can find its instructions, use recorded decisions, and check its work.
---

# wolven-harness

Set up a repo so a coding agent can find its instructions, use recorded decisions, and check its work.

## Install

Add the harness to the repo you want an agent to work in.

```sh
pnpm add -D @wolven-tech/harness
pnpm exec wolven-harness setup
```

Run both at the git top level. You need Node 22 or later, git, pnpm, and macOS or Linux.

`setup` adds harness files: agent skills, rules, document templates, and a local search index configuration. It preserves existing copies and leaves `AGENTS.md` alone. It also adds missing check scripts to `package.json` and saves setup choices and the package version in `.wolven-harness.json`. It never commits.

## Next

Ask your coding agent to run `harness-init`. It proposes how to connect the harness files to your repo’s existing instructions in `AGENTS.md`. Review the proposed diff before approving each write. [Setup](./harness-init) explains the steps.

Then try a small change with the [Daily use](./cycle) example.

`setup`, `validate`, and `comments` are terminal commands. `harness-init`, `code-spec`, `code-plan`, and `code-execute` are skills you ask the agent to run.

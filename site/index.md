---
description: CLI tool that installs and maintains a set of tools for AI agents to find instructions, use recorded decisions, check their work and maintain human-decided patterns.
---

# wolven-harness

CLI tool that installs and maintains a set of tools for AI agents to find instructions, use recorded decisions, check their work and maintain human-decided patterns.

## Install

Run the harness `setup` in your repo, at the git top level. You need Node 22 or later, git, pnpm, and macOS or Linux.

```sh
pnpm add -D @wolven-tech/harness && pnpm exec wolven-harness setup
```

`setup` adds harness files: agent skills, rules, document templates, and a local search index configuration. It preserves existing copies and leaves `AGENTS.md` alone, so don't worry.

It also adds missing check scripts to `package.json` and saves setup choices and the package version in `.wolven-harness.json`.

## Next

Ask your coding agent to run `harness-init`. It proposes how to connect the harness files to your repo’s existing instructions in `AGENTS.md`.

Follow the instructions and review the proposed diff before approving each write. [Setup](./harness-init) explains the steps.

Then try a small change with the [Daily use](./cycle) example.

`setup`, `skills`, `validate`, and `comments` are terminal commands. `harness-init`, `code-spec`, `code-plan`, and `code-execute` are skills you ask the agent to run.

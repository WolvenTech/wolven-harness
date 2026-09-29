---
description: Upgrade a repo from wolven-harness 0.2 to 0.3, including which template files changed.
---

# Upgrade from 0.2 to 0.3

0.3.0 is the first stable release. See the [Contract](./contract) for what is now frozen.

## 1. Update the package

```sh
pnpm add -D @wolven-tech/harness@^0.3.0
pnpm exec wolven-harness --version
```

The second command prints the installed version. It should show 0.3.0 or later.

## 2. Rename `init` to `setup`

The `init` command is now `setup`. Update any package script, CI job, or doc that calls `wolven-harness init`.

## 3. Bring in changed template files

`setup` never overwrites existing files. Template changes do not reach your repo on their own. Between 0.2.0 and 0.3.0, these template files changed:

| Your path | Change | What to do |
| --- | --- | --- |
| `.agents/skills/harness-init/references/validate-wiring.md` | added | Run `pnpm exec wolven-harness setup`. |
| `.qmd/.gitignore` | added | Run `pnpm exec wolven-harness setup`. The template is named `templates/.qmd/gitignore` and installs under this name. |
| `.agents/skills/harness-init/SKILL.md` | modified | See below. |
| `.agents/skills/harness-init/references/entry-modes.md` | modified | See below. |
| `.agents/skills/harness-init/references/session-note-template.md` | modified | See below. |
| `.agents/skills/code-execute/SKILL.md` | modified | See below. |
| `.agents/skills/code-spec/SKILL.md` | modified | See below. |

No template file was removed. If a future release removes one, it is safe to delete your copy.

For a modified file: if you did not customise it, delete your copy and run `pnpm exec wolven-harness setup`. If you did, merge the change by hand. Compare your copy with the file in `node_modules/@wolven-tech/harness/templates/`.

What changed in each:

- `harness-init/SKILL.md`, `entry-modes.md`, `session-note-template.md`: the 0.2.0 versions tell the agent to start from a fresh `wolven-harness init` (`SKILL.md`) and say `init` brings `WOLVEN.md` back (`SKILL.md`, `entry-modes.md`). Those commands no longer exist. The new versions say `setup`. They also put the entry mode to you as one question, add a step that asks how to wire `harness:validate`, and handle a repo without `code-commit`. The session note template gains matching sections.
- `code-execute/SKILL.md`: says `setup` instead of `init`, and never commits automatically when `code-commit` is not installed.
- `code-spec/SKILL.md`: treats a PRD as optional input, so it works without `create-prd`.

The `harness-init` files are the ones to update first. An agent running the 0.2.0 copy will look for a command that is gone.

## 4. Validate

```sh
pnpm exec wolven-harness validate
```

It should end with `validate: ok`. Warnings do not fail it.

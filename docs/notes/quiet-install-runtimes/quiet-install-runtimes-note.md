---
type: note
title: Quiet-install entry points per runtime
description: For each non-Claude registry runtime, the documented paths a quiet install can wire as ignored entry points for skills, instructions, rules and hooks, and where no local path exists.
status: draft
---

# Quiet-install entry points per runtime

## Question

The quiet install keeps the harness in `.wolven-harness/` and wires each
runtime through ignored paths at the repository root
(`docs/specs/quiet-install/quiet-install-spec.md`, R6.2). For each registry
runtime other than Claude Code, this note asks four things:

- Which documented paths load skills, instructions, rules and hooks?
- Can any of them be an ignored, per-machine file or link?
- Which pieces have no such path, so harness-init leaves them unwired and
  names a manual step?
- Do the docs say whether gitignored files still load?

The registry rows are in `src/setup/runtimes.ts:RUNTIME_REGISTRY`. This note
extends [runtime instruction loading](../runtime-instruction-loading/runtime-instruction-loading-note.md),
[skill load paths](../skill-load-paths/skill-load-paths-note.md) and
[gitignored harness access](../gitignored-harness-access/gitignored-harness-access-note.md),
and does not repeat what they settle.

## Findings

### Across runtimes

- **Skills have a shared ignored entry point.** Codex, Cursor, OpenCode, Amp,
  Copilot, Gemini CLI and Antigravity all read project skills from
  `.agents/skills/` (the per-runtime sources are cited below). One link per
  skill at `.agents/skills/<name>` therefore wires all of them. Only Kiro
  needs its own `.kiro/skills/<name>`.
- **Only Codex documents following a symlinked skill folder:** "Codex
  supports symlinked skill folders and follows the symlink target"
  ([Codex skills](https://learn.chatgpt.com/docs/build-skills)). Cursor,
  OpenCode, Amp, Gemini CLI, Kiro and Antigravity don't mention symlinks on
  their skills pages. Cursor's load through a symlink was observed, not
  documented ([gitignored harness access](../gitignored-harness-access/gitignored-harness-access-note.md)).
- **No runtime documents whether a gitignored skill, rule or steering file
  still loads.** The Codex, Cursor, OpenCode, Amp, Copilot, Antigravity and
  Kiro pages cited below are silent on it. Gemini CLI's
  `context.fileFiltering.respectGitIgnore` defaults to `true`, but the docs
  don't tie it to context-file discovery
  ([Gemini CLI configuration](https://geminicli.com/docs/reference/configuration)).
  The ignored-path rows below are therefore unprobed for every runtime
  except Claude Code, and for Cursor skills.
- **The harness `AGENTS.md` is always tracked (spec R4.2).** So a reference
  to `.wolven-harness/AGENTS.md` resolves in clones and worktrees for every
  runtime that follows references. Five of them do, each with its own
  syntax:
  - Amp: `@`-mentions, relative to the file holding them
    ([Amp AGENTS.md](https://ampcode.com/docs/customize/agents-md)).
  - Gemini CLI: `@file.md` imports
    ([Gemini CLI memport](https://geminicli.com/docs/reference/memport)).
  - Antigravity: `@[label](path)` includes, which inline the file
    ([Antigravity rules](https://www.antigravity.google/docs/rules?tab=ide)).
  - Kiro: `#[[file:path]]` references in steering files
    ([Kiro steering](https://kiro.dev/docs/steering/)).
  - OpenCode: the `instructions` paths in `opencode.json`
    ([OpenCode config](https://opencode.ai/docs/config/)).
- **Hosted surfaces see only what is pushed.** Copilot's cloud agent "works
  against the repository and branch you provided", and code review reads
  instructions and skills "from the head branch"
  ([Copilot coding agent](https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-coding-agent),
  [Copilot repository instructions](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions)).
  The docs don't say that ignored files are absent there. That follows from
  the repository being the source, so it is inferred, not stated.

### Codex

- **Skills:** `.agents/skills` "in every directory from your current working
  directory up to the repository root", and symlinked folders are followed
  ([Codex skills](https://learn.chatgpt.com/docs/build-skills)).
- **Instructions:** at most one file per directory, `AGENTS.override.md`
  before `AGENTS.md`. The sample tree marks a sibling `AGENTS.md` "Ignored
  because an override exists"
  ([Codex AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)).
  An ignored root `AGENTS.override.md` would therefore hide the client's
  `AGENTS.md`, so it cannot carry the harness.
- **Config:** a project `.codex/config.toml` loads "only when the project is
  trusted". `developer_instructions` is an inline string, "Additional
  developer instructions injected into the session". `model_instructions_file`
  is a "Replacement for built-in instructions instead of `AGENTS.md`"
  ([Codex advanced config](https://learn.chatgpt.com/docs/config-file/config-advanced),
  [Codex config reference](https://learn.chatgpt.com/docs/config-file/config-reference)).
  Neither key adds a file by path to `AGENTS.md`, and the docs don't say how
  a project becomes trusted.
- **Hooks:** `<repo>/.codex/hooks.json`, trusted projects only, with each
  hook reviewed before it runs
  ([Codex hooks](https://learn.chatgpt.com/docs/hooks)). The registry wires no
  Codex hook today.

### Cursor

- **Skills:** `.agents/skills/` and `.cursor/skills/`, plus `.claude/skills/`
  "for compatibility" ([Cursor skills](https://cursor.com/docs/context/skills)).
  When Claude Code is also wired, Cursor finds each harness skill under two
  roots.
- **Rules:** `.cursor/rules/*.mdc` only; a plain `.md` there "is ignored by
  the rules system" ([Cursor rules](https://cursor.com/docs/context/rules)).
  So harness rules need generated `.mdc` files, not links to the `.md`
  sources. The page says nothing about a gitignored `.cursor/rules/`
  (`U-cursor-ignored-rules`).
- **Hooks:** `<project-root>/.cursor/hooks.json`, run "in any trusted
  workspace", and commands run "from the **project root**"
  ([Cursor hooks](https://cursor.com/docs/agent/hooks)).
  `node .wolven-harness/.agents/hooks/secret-path-guard.mjs` therefore
  resolves.

### OpenCode

- **Skills:** `.opencode/skills/`, `.claude/skills/` and `.agents/skills/`,
  walked up "until it reaches the git worktree"
  ([OpenCode skills](https://opencode.ai/docs/skills/)).
- **Instructions:** the `instructions` field "takes an array of paths and glob
  patterns to instruction files", combined with `AGENTS.md`. It is set in
  project `opencode.json` or the global config. Configs merge, and no
  project-local untracked config file is documented
  ([OpenCode config](https://opencode.ai/docs/config/),
  [OpenCode rules](https://opencode.ai/docs/rules/)).
  The only project path is a tracked edit to `opencode.json`. Its targets,
  the harness `AGENTS.md` and rules, are tracked by default.

### Amp

- **Skills:** `.agents/skills/` first, then `.claude/skills/`, and "Amp uses
  the first skill with a given frontmatter `name`"
  ([Amp skills](https://ampcode.com/docs/customize/skills)).
- **Instructions:** `@`-mentions in `AGENTS.md` are included, "Relative paths
  are interpreted relative to the agent file containing the mention", and
  "Absolute paths are not supported"
  ([Amp AGENTS.md](https://ampcode.com/docs/customize/agents-md)).
  Workspace `.amp/settings.json` has no key for instruction files
  ([Amp settings](https://ampcode.com/docs/cli/settings)).
  The only project path is the client's `AGENTS.md`, which is tracked.

### GitHub Copilot

- **Skills:** `.github/skills`, `.claude/skills` or `.agents/skills`, and
  "Supported locations depend on the surface"
  ([Copilot agent skills](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills)).
- **Rules:** `.github/instructions/*.instructions.md` with `applyTo`. On
  GitHub.com they are "only supported for Copilot cloud agent and Copilot
  code review"
  ([Copilot repository instructions](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions)).
  Both read the pushed repository, so ignored instruction files never reach
  them. This note did not settle which local surfaces read the folder.

### Gemini CLI

- **Status:** every page carries the banner "Gemini CLI was replaced by
  Antigravity CLI on June 18th, 2026", for unpaid and Google One users
  ([Gemini CLI context files](https://geminicli.com/docs/cli/gemini-md)).
- **Skills:** `.gemini/skills/` or the `.agents/skills/` alias, which takes
  precedence ([Gemini CLI skills](https://geminicli.com/docs/cli/skills)).
- **Instructions:** `GEMINI.md` in workspace directories and their parents.
  `context.fileName` takes names, and the docs show no paths. `@file.md`
  imports resolve relative to the importing file
  ([Gemini CLI context files](https://geminicli.com/docs/cli/gemini-md),
  [Gemini CLI memport](https://geminicli.com/docs/reference/memport)).
  Where the client has no `GEMINI.md`, an ignored root `GEMINI.md` holding
  `@.wolven-harness/AGENTS.md` is the documented local path. That mirrors
  `CLAUDE.local.md`.

### Kiro

- **Skills:** `.kiro/skills/`, and the page advises "Commit `.kiro/skills/` to
  your repository" ([Kiro skills](https://kiro.dev/docs/skills/)).
- **Rules:** steering in `.kiro/steering/`, with `inclusion: always` the
  default. `#[[file:<relative_file_name>]]` resolves "from the workspace
  root", and "References follow the session's file-read permissions and
  ignore rules" ([Kiro steering](https://kiro.dev/docs/steering/)).
- **Ignore rules:** `.kiroignore` blocks reads, and the
  `kiroAgent.agentIgnoreFiles` setting can add `.gitignore`. The docs don't
  say whether `.gitignore` applies by default
  ([Kiro ignore](https://kiro.dev/docs/kiroignore/)). An ignored steering
  file is therefore at risk where `.gitignore` is configured.

### Antigravity

- **Skills:** `.agents/skills/<skill-folder>/` in the workspace and each
  parent up to the repository root
  ([Antigravity skills](https://www.antigravity.google/docs/skills)).
- **Rules:** `.agents/rules/*.md` needs a `trigger` frontmatter, and a rule
  without one is silently discarded. `@[label](path)` inlines another file,
  resolved from the rule file's directory
  ([Antigravity rules](https://www.antigravity.google/docs/rules?tab=ide)).
  So one ignored `.agents/rules/wolven-harness.md` holding
  `trigger: always_on` and an include of `../../.wolven-harness/AGENTS.md`
  is the documented local path.
- **Hooks:** `.agents/hooks.json` in the open project, with a `PreToolUse`
  event ([Antigravity hooks](https://www.antigravity.google/docs/hooks/)).
  The registry wires no Antigravity hook today.

## Quiet-install table

These are the R6.2 rows. Every path in the Entry points column is ignored
and lives at the repository root. When an ignored path can't wire a piece,
harness-init offers the tracked edit that would, and a No leaves the piece
unwired with the manual step. The Human ruled on 2026-11-03 that the tracked
edit is always offered. A dash means nothing is left unwired.

| Runtime | Entry points (ignored) | Hooks | Tracked-edit offer, else manual step | Source |
|---|---|---|---|---|
| Codex | `.agents/skills/<name>` links | — | Instructions and rules: no tracked edit works, because Codex follows no import and `AGENTS.override.md` would hide the client's `AGENTS.md`. Manual step: ask Codex to read `.wolven-harness/AGENTS.md`, or add its text to `~/.codex/AGENTS.md` | [skills](https://learn.chatgpt.com/docs/build-skills), [AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md) |
| Cursor | `.agents/skills/<name>` links; `.cursor/rules/wolven-<rule>.mdc` and `.cursor/rules/wolven-agents.mdc` (generated, `alwaysApply: true`) | `.cursor/hooks.json` | — (ignored rules unprobed: `U-cursor-ignored-rules`) | [skills](https://cursor.com/docs/context/skills), [rules](https://cursor.com/docs/context/rules), [hooks](https://cursor.com/docs/agent/hooks) |
| OpenCode | `.agents/skills/<name>` links | — | Instructions and rules: offer an `instructions` entry in `opencode.json` listing `.wolven-harness/AGENTS.md` and `.wolven-harness/.agents/rules/*.md` (tracked change, or new tracked file) | [skills](https://opencode.ai/docs/skills/), [config](https://opencode.ai/docs/config/) |
| Amp | `.agents/skills/<name>` links | — | Instructions and rules: offer an `@.wolven-harness/AGENTS.md` line inside the harness block of the client's `AGENTS.md` (tracked change) | [skills](https://ampcode.com/docs/customize/skills), [AGENTS.md](https://ampcode.com/docs/customize/agents-md) |
| GitHub Copilot | `.agents/skills/<name>` links; `.github/instructions/wolven-<rule>.instructions.md` (generated, `applyTo: "**"`) | — | Cloud agent and code review: offer to commit the generated `.github/instructions/wolven-<rule>.instructions.md` files (new tracked files) | [skills](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills), [instructions](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions) |
| Gemini CLI | `.agents/skills/<name>` links; root `GEMINI.md` holding `@.wolven-harness/AGENTS.md`, only when the client has none | — | Instructions when the client has a `GEMINI.md`: offer the `@.wolven-harness/AGENTS.md` line in it (tracked change) | [skills](https://geminicli.com/docs/cli/skills), [context files](https://geminicli.com/docs/cli/gemini-md) |
| Kiro | `.kiro/skills/<name>` links; `.kiro/steering/wolven-harness.md` (generated, `inclusion: always`, `#[[file:.wolven-harness/AGENTS.md]]`) | — | Where `.gitignore` is in `agentIgnoreFiles`: offer the steering file as a new tracked file | [skills](https://kiro.dev/docs/skills/), [steering](https://kiro.dev/docs/steering/), [ignore](https://kiro.dev/docs/kiroignore/) |
| Antigravity | `.agents/skills/<name>` links; `.agents/rules/wolven-harness.md` (generated, `trigger: always_on`, `@[harness](../../.wolven-harness/AGENTS.md)`) | — | — | [skills](https://www.antigravity.google/docs/skills), [rules](https://www.antigravity.google/docs/rules?tab=ide) |

Hook columns follow the registry: only Claude Code and Cursor wire the secret
guard today. Codex, Copilot, Gemini CLI, Kiro and Antigravity document
project hooks, but adding them is outside this initiative.

## Sources

| Source | Type | Used for |
|--------|------|----------|
| https://learn.chatgpt.com/docs/build-skills | official docs | Codex skill paths and symlinks |
| https://learn.chatgpt.com/docs/agent-configuration/agents-md | official docs | Codex one-file-per-directory and override |
| https://learn.chatgpt.com/docs/config-file/config-advanced | official docs | Codex project config trust and relative paths |
| https://learn.chatgpt.com/docs/config-file/config-reference | official docs | `developer_instructions`, `model_instructions_file` |
| https://learn.chatgpt.com/docs/hooks | official docs | Codex hook locations and trust |
| https://cursor.com/docs/context/skills | official docs | Cursor skill paths |
| https://cursor.com/docs/context/rules | official docs | `.mdc` requirement |
| https://cursor.com/docs/agent/hooks | official docs | Cursor hook location and working directory |
| https://opencode.ai/docs/skills/ | official docs | OpenCode skill paths |
| https://opencode.ai/docs/config/ | official docs | `instructions` field, config merge |
| https://opencode.ai/docs/rules/ | official docs | `AGENTS.md` combination |
| https://ampcode.com/docs/customize/skills | official docs | Amp skill paths and first-name-wins |
| https://ampcode.com/docs/customize/agents-md | official docs | Amp `@`-mentions |
| https://ampcode.com/docs/cli/settings | official docs | No instruction-file setting |
| https://docs.github.com/en/copilot/concepts/agents/about-agent-skills | official docs | Copilot skill paths |
| https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions | official docs | Copilot instruction files and surfaces |
| https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-coding-agent | official docs | Cloud agent works on the pushed repository |
| https://geminicli.com/docs/cli/gemini-md | official docs | `GEMINI.md`, `context.fileName`, replacement banner |
| https://geminicli.com/docs/reference/memport | official docs | `@` import resolution |
| https://geminicli.com/docs/reference/configuration | official docs | `respectGitIgnore` |
| https://geminicli.com/docs/cli/skills | official docs | Gemini CLI skill paths |
| https://kiro.dev/docs/skills/ | official docs | Kiro skill path |
| https://kiro.dev/docs/steering/ | official docs | Steering, inclusion, file references |
| https://kiro.dev/docs/kiroignore/ | official docs | Kiro ignore rules |
| https://www.antigravity.google/docs/skills | official docs | Antigravity skill paths |
| https://www.antigravity.google/docs/rules?tab=ide | official docs | Rule trigger and file includes |
| https://www.antigravity.google/docs/hooks/ | official docs | Antigravity hooks |
| `src/setup/runtimes.ts` | source code | Registry rows and current hook wiring |

## Open questions

- **Gitignored loading is unprobed for every runtime but Claude Code and
  Cursor skills.** Each Entry points row needs a load check before a proof
  run can claim it. Doctor can only check that the paths exist.
- **Codex has no path at all.** Neither an ignored file nor a tracked edit
  within the harness block's line cap brings the harness instructions into
  Codex, so it stays a manual step.
- **Generated files drift.** The Cursor, Copilot, Kiro and Antigravity rows
  generate files rather than linking to them, so doctor's drift check must
  cover them.
- Which local Copilot surfaces (VS Code, CLI) read
  `.github/instructions/` was not settled. The per-surface matrix is at
  https://docs.github.com/en/copilot/reference/custom-instructions-support.

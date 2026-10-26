---
description: How setup wires each supported agent runtime.
---

# Agent runtimes

`setup` knows nine runtimes. Pass any comma-separated list like `--runtimes claude,codex`, or select them when interactive `setup` asks. Only macOS and Linux are supported; the symlinked rows need filesystem symlinks.

| Agent | id | Project skills | Rules wiring |
| --- | --- | --- | --- |
| Claude Code | `claude` | `.claude/skills` → `../.agents/skills` (symlink) | `.claude/rules` → `../.agents/rules` (symlink) |
| Codex | `codex` | `.agents/skills` | inline in the harness section, between `<!-- wolven-harness:rules:start -->` and `<!-- wolven-harness:rules:end -->` |
| Cursor | `cursor` | `.agents/skills` | `.cursor/rules/wolven-<rule>.mdc` with `alwaysApply: true` |
| OpenCode | `opencode` | `.agents/skills` | `opencode.json` `instructions` lists every `.agents/rules/*.md` |
| Amp | `amp` | `.agents/skills` | the harness section carries `@.agents/rules/*.md` |
| GitHub Copilot | `copilot` | `.agents/skills` | `.github/instructions/wolven-<rule>.instructions.md` with `applyTo: "**"` |
| Gemini CLI | `gemini` | `.agents/skills` | Native mode: `GEMINI.md` imports `@AGENTS.md` and every rule. Inline mode: `GEMINI.md` imports `@AGENTS.md` only |
| Kiro | `kiro` | `.kiro/skills` → `../.agents/skills` (symlink) | `.kiro/steering/wolven-<rule>.md` with `inclusion: always` |
| Antigravity | `antigravity` | `.agents/skills` | inline in the harness section, between `<!-- wolven-harness:rules:start -->` and `<!-- wolven-harness:rules:end -->` |

`setup` creates only paths that are missing. An existing `opencode.json`, `GEMINI.md` or generated rule file is left byte-identical and reported so `harness-init` can add the rules by hand. When `codex` or `antigravity` is among the selected runtimes, `setup` uses inline rules for the whole install, because those runtimes read the rule bodies in `AGENTS.md`.

## Claude Code

If `.claude/skills` is missing, setup creates a relative symlink to `.agents/skills`. If `.claude/rules` is missing, it creates a relative symlink to `.agents/rules`.

If `CLAUDE.md` is missing, setup creates one that imports `AGENTS.md`. Existing paths are left in place. Docs: [Claude Code](https://code.claude.com/docs/en/skills).

## Codex

Codex reads `.agents/skills/` natively, so setup adds no Codex-specific skills wiring. Codex cannot import files, so when it is selected the `harness-init` skill writes the four rule bodies into `AGENTS.md` between the rules markers. Docs: [Codex](https://learn.chatgpt.com/docs/build-skills).

## Cursor

Cursor reads `.agents/skills/` natively. Setup also writes one `.cursor/rules/wolven-<rule>.mdc` per standing rule, with `alwaysApply: true`, so Cursor applies them without globs. If you also select Claude Code, the skills are visible through both the native path and the Claude symlink. Docs: [Cursor](https://cursor.com/docs/context/skills).

## OpenCode

OpenCode reads `.agents/skills/` natively and `AGENTS.md` as its instructions file. Setup writes `opencode.json` with an `instructions` list holding every `.agents/rules/*.md`, so the standing rules load without imports. An existing `opencode.json` is never edited; `harness-init` adds the entries. Docs: [OpenCode rules](https://opencode.ai/docs/rules/).

## Amp

Amp reads `.agents/skills/` natively and `AGENTS.md` as its instructions file. Its rules wiring is the harness section itself: `harness-init` makes the section carry `@.agents/rules/*.md`, which Amp includes. Docs: [Amp AGENTS.md](https://ampcode.com/docs/customize/agents-md).

## GitHub Copilot

Copilot reads `.agents/skills/` natively and `AGENTS.md` as repository instructions. Setup also writes one `.github/instructions/wolven-<rule>.instructions.md` per rule, each with `applyTo: "**"`, so Copilot applies it to every file. Docs: [Copilot repository instructions](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions).

## Gemini CLI

Gemini CLI's default context file is `GEMINI.md`, not `AGENTS.md`. In native mode, setup writes `GEMINI.md` with imports for `@AGENTS.md` and every `@.agents/rules/<rule>.md`. In inline mode, when `codex` or `antigravity` is also selected, it imports `@AGENTS.md` only; the rules are already in that file's inline harness section. An existing `GEMINI.md` is never edited; `harness-init` adds the imports. Docs: [Gemini CLI context files](https://geminicli.com/docs/cli/gemini-md).

## Kiro

Kiro reads `.agents/skills/` natively. Setup creates `.kiro/skills` as a relative symlink to `.agents/skills`, and one `.kiro/steering/wolven-<rule>.md` per rule with `inclusion: always`, so the steering files load in every interaction. Docs: [Kiro steering](https://kiro.dev/docs/steering/).

## Antigravity

Antigravity reads the rule bodies from the inline block in `AGENTS.md`. When it is selected, `setup` uses inline mode for the whole install. Docs: [Antigravity rules](https://www.antigravity.google/docs/rules?tab=ide).

---
type: note
title: How agent runtimes load AGENTS.md, rules and skills
description: Only text inside AGENTS.md reaches every runtime that reads it; imports work in Claude Code, Gemini CLI and Amp only, and only Antigravity reads .agents/rules, with a trigger frontmatter the harness rules lack.
status: stable
---

# How agent runtimes load AGENTS.md, rules and skills

## Question

For Claude Code and the runtimes that read `AGENTS.md` and `.agents/skills/` natively, how does each one load project instructions? Specifically: which files it reads, whether it follows imports, whether it reads a rules directory the harness could fill, and how a CLI detects that the runtime is installed. This note extends [skill-load-paths](../skill-load-paths/skill-load-paths-note.md), which already covers skill directories for Claude Code, Codex and Cursor.

## Findings

### Across runtimes

- **Only Antigravity reads `.agents/rules/`, and it drops the harness rules today** because they lack its `trigger` frontmatter (see Antigravity below).
  - Claude Code reads `.claude/rules/` ([Claude Code memory](https://code.claude.com/docs/en/memory.md)).
  - Cursor reads `.cursor/rules/` and ignores plain `.md` there ([Cursor rules](https://cursor.com/docs/context/rules)).
  - Kiro reads `.kiro/steering/` (see Kiro below).
  - Codex, OpenCode, Amp and Copilot document no rules directory the harness could fill.
  - The harness's `alwaysApply: true` frontmatter is Cursor's rule format, but the file sits outside `.cursor/rules/` and has the wrong extension, so Cursor doesn't apply it either.
- **Imports are not portable.**
  - **Resolve:**
    - Claude Code resolves `@path` imports relative to the importing file, "with a maximum depth of four hops" ([Claude Code memory](https://code.claude.com/docs/en/memory.md)).
    - Gemini CLI resolves `@file.md` imports with relative and absolute paths ([Gemini CLI context files](https://geminicli.com/docs/cli/gemini-md)).
    - Amp includes `@`-mentioned files that have no `globs` front matter ([Amp AGENTS.md](https://ampcode.com/docs/customize/agents-md)).
  - **Don't resolve:**
    - Codex documents no import mechanism ([Codex AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)).
    - OpenCode "doesn't automatically parse file references in `AGENTS.md`" ([OpenCode rules](https://opencode.ai/docs/rules/)).
    - Cursor reads an `@file` mentioned in a rule with its tools, but does not inline it ([Cursor rules](https://cursor.com/docs/context/rules)).
- **So text that must reach every runtime has to sit inside `AGENTS.md` itself.** A pointer, whether a plain-text mention or an `@` import, reaches only the runtimes above that resolve it.
- **Size is not a constraint at the harness's scale.** Codex stops adding instruction files once they total 32 KiB (`project_doc_max_bytes`) ([Codex AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)). The harness router and the four rules total about 7.6 KB (`templates/WOLVEN.md` and `templates/.agents/rules/*.md`).

### Claude Code

- It reads `CLAUDE.md` (or `.claude/CLAUDE.md`) at launch from the working directory and every directory above it. Subdirectory files load "once Claude reads, writes, or edits another file in that subdirectory" ([Claude Code memory](https://code.claude.com/docs/en/memory.md)).
- It reads `AGENTS.md` natively from v2.1.277, but by default only when there is "no `CLAUDE.md` in your working directory or above it". A `CLAUDE.md` that imports `@AGENTS.md` loads it in every case and "never makes Claude read `AGENTS.md` twice" ([Claude Code memory](https://code.claude.com/docs/en/memory.md)).
- A `CLAUDE.md` "that tells Claude in words to read `AGENTS.md`" means "Claude sees `AGENTS.md` only if it decides to open the file" ([Claude Code memory](https://code.claude.com/docs/en/memory.md)). This is how `harness-init`'s mention-only mode fails.
- "Rules without a `paths` field are loaded unconditionally." `.claude/rules/` "supports symlinks". A symlink whose target is outside the working directory waits for the same approval as an external import ([Claude Code memory](https://code.claude.com/docs/en/memory.md)).

### Codex

- At each directory from the project root (typically the Git root) down to the working directory, it reads `AGENTS.override.md`, then `AGENTS.md`, then any fallback names, and "includes at most one file per directory". The files are concatenated root first ([Codex AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)).
- At the global level, under `~/.codex` or `CODEX_HOME`, "Codex uses only the first non-empty file" ([Codex AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)).

### Cursor

- It reads `AGENTS.md` in the project root and in subdirectories. Nested files apply "when working with files in that directory or its children" ([Cursor rules](https://cursor.com/docs/context/rules)).
- "Project rules live in `.cursor/rules` as `.mdc` files." "A plain `.md` file in `.cursor/rules` is ignored by the rules system." With `alwaysApply: true`, "Globs and description are ignored" ([Cursor rules](https://cursor.com/docs/context/rules)).

### OpenCode

- It reads `AGENTS.md`, with `CLAUDE.md` as a fallback, by traversing up from the current directory. Globally it reads `~/.config/opencode/AGENTS.md`. "The first matching file wins in each category" ([OpenCode rules](https://opencode.ai/docs/rules/)).
- An `instructions` field in `opencode.json` adds files and globs, which "are combined with your `AGENTS.md` files" ([OpenCode rules](https://opencode.ai/docs/rules/)).

### Amp

- It always includes the `AGENTS.md` files in the working directory and its parents up to `$HOME`. Subtree files load when the agent reads a file there. In a directory without `AGENTS.md` it falls back to `AGENT.md` or `CLAUDE.md` ([Amp AGENTS.md](https://ampcode.com/docs/customize/agents-md)).

### GitHub Copilot

- `AGENTS.md` files can be "stored anywhere within the repository", and "the nearest `AGENTS.md` file in the directory tree will take precedence". A single root `CLAUDE.md` or `GEMINI.md` is an alternative ([Copilot repository instructions](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions)).

### Gemini CLI

- Its default context file is `GEMINI.md`. It reads `AGENTS.md` only when `context.fileName` in `settings.json` lists it ([Gemini CLI context files](https://geminicli.com/docs/cli/gemini-md)). So it is not a native `AGENTS.md` reader.

### Kiro

- It reads `AGENTS.md`: "Kiro supports providing steering directives via the AGENTS.md standard", globally or in "the root folder of your workspace" ([Kiro steering](https://kiro.dev/docs/steering/)).
- Its native rules are steering files in `.kiro/steering/`. The default inclusion, `always`, means "These files are loaded into every Kiro interaction automatically". File references use `#[[file:<relative_file_name>]]` ([Kiro steering](https://kiro.dev/docs/steering/)).

### Antigravity

- **It is the one runtime that reads `.agents/rules/`.** Workspace rules live in `<dir>/.agents/rules/*.md`, with legacy `.agent/rules/` support ([Antigravity rules](https://www.antigravity.google/docs/rules?tab=ide)).
- Every rule needs a frontmatter `trigger` of `model_decision`, `always_on`, `glob` or `manual`. "Files with missing frontmatter or an invalid `trigger` are silently discarded", so the harness rules, which carry only `alwaysApply`, are dropped today ([Antigravity rules](https://www.antigravity.google/docs/rules?tab=ide)).
- `AGENTS.md` and `GEMINI.md` are read in directory scopes and global locations, and their content stays always active ([Antigravity rules](https://www.antigravity.google/docs/rules?tab=ide)).

### Detecting installed runtimes: Compozy's precedent

- Compozy v0.2.9 detects an agent when one of its marker paths exists, such as `~/.claude`, `~/.codex` (or `CODEX_HOME`), `~/.cursor`, `$XDG_CONFIG_HOME/opencode`, `$XDG_CONFIG_HOME/amp`, `~/.copilot` or `~/.gemini` ([agents.go at v0.2.9](https://github.com/compozy/compozy/blob/v0.2.9/internal/setup/agents.go)).
- It marks an agent as "universal" when the agent's project skill directory is `.agents/skills`: Amp, Codex, Cursor, Gemini CLI, GitHub Copilot, OpenCode and others. Claude Code keeps its own `.claude/skills` ([agents.go at v0.2.9](https://github.com/compozy/compozy/blob/v0.2.9/internal/setup/agents.go)).
- Its verify step compares each installed skill directory with the bundled copy, and reports missing and changed files as drift ([verify.go at v0.2.9](https://github.com/compozy/compozy/blob/v0.2.9/internal/setup/verify.go)).

## Sources

| Source | Type | Used for |
|--------|------|----------|
| [Claude Code memory](https://code.claude.com/docs/en/memory.md) | official docs | Claude Code instruction files, imports, native `AGENTS.md`, `.claude/rules/` |
| [Codex AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md) | official docs | Codex discovery, concatenation, size cap, no imports |
| [Cursor rules](https://cursor.com/docs/context/rules) | official docs | Cursor `AGENTS.md` support and the `.cursor/rules` format |
| [OpenCode rules](https://opencode.ai/docs/rules/) | official docs | OpenCode lookup, no reference parsing, `instructions` field |
| [Amp AGENTS.md](https://ampcode.com/docs/customize/agents-md) | official docs | Amp lookup and `@`-mention inclusion |
| [Copilot repository instructions](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions) | official docs | Copilot `AGENTS.md` placement and precedence |
| [Gemini CLI context files](https://geminicli.com/docs/cli/gemini-md) | official docs | Gemini CLI default file and the `context.fileName` setting |
| [Kiro steering](https://kiro.dev/docs/steering/) | official docs | Kiro `AGENTS.md` support and steering files |
| [Antigravity rules](https://www.antigravity.google/docs/rules?tab=ide) | official docs | Antigravity `.agents/rules/`, the `trigger` frontmatter, `AGENTS.md` |
| [agents.go at v0.2.9](https://github.com/compozy/compozy/blob/v0.2.9/internal/setup/agents.go) | source code | Compozy's agent list, marker paths and universal agents |
| [verify.go at v0.2.9](https://github.com/compozy/compozy/blob/v0.2.9/internal/setup/verify.go) | source code | Compozy's drift comparison |
| `templates/WOLVEN.md`, `templates/.agents/rules/*.md` | repository | Size of the router and the rules |

## Open questions

- Copilot's documentation doesn't say which surfaces (cloud agent, CLI, IDE) read `AGENTS.md`, or whether they follow imports.
- "DeepSeek" was named as a target runtime. This note found no DeepSeek agent runtime with documented instruction files. Compozy lists "Deep Agents" (`~/.deepagents`), which may be the one meant.

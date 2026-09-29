---
description: How to wire Claude Code, Codex, and Cursor.
---

# Runtimes

Wire skill discovery for the runtimes you use. Pass them to `init` as `--runtimes claude,codex,cursor`, or answer the question when `init` asks. v0 is macOS and Linux only. Runtime wiring needs filesystem symlinks.

- **Claude Code** reads `.claude/skills/`. `init` adds a symlink to `.agents/skills` if missing. Docs: [Claude Code](https://code.claude.com/docs/en/skills).
- **Codex** reads `.agents/skills/` natively. `init` writes nothing. Docs: [Codex](https://learn.chatgpt.com/docs/build-skills).
- **Cursor** uses the same native path. With `claude`, a skill can list twice. Docs: [Cursor](https://cursor.com/docs/context/skills).

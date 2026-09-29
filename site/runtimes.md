---
description: How to wire Claude Code, Codex, and Cursor.
---

# Agents

| Agent | Where it finds skills |
| --- | --- |
| Claude Code | `.claude/skills/` |
| Codex | `.agents/skills/` |
| Cursor | `.agents/skills/` |

Choose agents with `setup` as `--runtimes claude,codex,cursor`, or answer the question when `setup` asks. Only macOS and Linux are supported.

## Claude Code

`setup` adds a symlink to `.agents/skills` if `.claude/skills` is missing. Runtime wiring needs filesystem symlinks. Docs: [Claude Code](https://code.claude.com/docs/en/skills).

## Codex

Codex reads `.agents/skills/` natively, so `setup` adds no Codex-specific wiring. Docs: [Codex](https://learn.chatgpt.com/docs/build-skills).

## Cursor

Cursor uses the same native path. If you also select `claude`, a skill can appear twice. Docs: [Cursor](https://cursor.com/docs/context/skills).

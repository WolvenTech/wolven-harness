---
description: How to wire Claude Code, Codex, and Cursor.
---

# Agents

| Agent | Where it finds skills |
| --- | --- |
| Claude Code | `.claude/skills/` |
| Codex | `.agents/skills/` |
| Cursor | `.agents/skills/` |

Choose agents with `--runtimes claude,codex,cursor`, or select them when interactive `setup` asks. Only macOS and Linux are supported; Claude Code wiring needs filesystem symlinks.

## Claude Code

If `.claude/skills` is missing, setup creates a relative symlink to `.agents/skills`. If `CLAUDE.md` is missing, setup creates one that imports `AGENTS.md`. Existing paths are left in place. Docs: [Claude Code](https://code.claude.com/docs/en/skills).

## Codex

Codex reads `.agents/skills/` natively, so setup adds no Codex-specific wiring. Docs: [Codex](https://learn.chatgpt.com/docs/build-skills).

## Cursor

Cursor reads `.agents/skills/` natively, so setup adds no Cursor-specific wiring. If you also select Claude Code, the skills are visible through both the native path and the Claude symlink. Docs: [Cursor](https://cursor.com/docs/context/skills).

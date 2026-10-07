---
type: deferral
title: Copied Claude skill tree
description: Replacing the .claude/skills symlink with a duplicated skill tree waits until a Claude Code cloud smoke shows the symlink was not followed.
status: draft
---

# Copied Claude skill tree

**Deferred:** a real `.claude/skills/` directory that duplicates `.agents/skills/` file for file.

**Why:** `src/setup/runtimes.ts` wires Claude with one symlink, `.claude/skills` → `../.agents/skills`, because Claude reads `.claude/skills/<skill>/`. A second tree means every skill edit lands twice.

**Today:** `.claude/skills` is that symlink and it is tracked. Claude Code's skills doc says cloud sessions load project skills committed at `.claude/skills/`.

## Contract impact

None. ADR-004 already lists the Claude project path as `.claude/skills/<skill>/`. The symlink is how setup fills it.

## Triggers

- [ ] A Claude Code cloud session reports that `.claude/skills` was a symlink and the skills under that link were invisible to the session.

## Non-goals while deferred

- No copied skill tree and no change to `wireClaudeSkillsSymlink`.

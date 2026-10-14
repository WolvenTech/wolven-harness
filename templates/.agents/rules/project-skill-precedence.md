---
description: When a project skill and a user-level skill share a name, follow the project copy at .agents/skills/<name>/SKILL.md and say which paths clashed.
alwaysApply: true
---

# Project skills beat same-named user-level skills

A runtime resolves skills by name, and it may load the user-level copy. Claude
Code documents that order: with `deploy` in both `~/.claude/skills/` and the
project's `.claude/skills/`, it runs the personal one. Codex loads both and
does not merge them. Cursor documents no order at all. So a skill that loaded
is not proof that the project's copy is the one in play.

## Check the copy that loaded

The runtime reports the base directory a skill loaded from. Compare it with
this project's copies:

- `.agents/skills/<name>/SKILL.md`
- `.claude/skills/<name>/SKILL.md` — a symlink to the same tree when `setup`
  wired Claude Code

When the reported base directory is outside this project and
`.agents/skills/<name>/SKILL.md` exists, read that file and follow it instead.
The project copy is authoritative: it carries this repository's conventions,
and the user-level copy may be a different skill that merely shares the name —
one that asks its questions in a batch, for example.

## Then

1. Follow the project copy for the rest of the session.
2. Tell the Human which two paths clashed, and which copy loaded.
3. Leave the user-level skill alone. Its copy may be deliberate, and on another
   machine it may serve a different repository.

If the project has no `.agents/skills/<name>/`, the user-level copy is the only
one and there is nothing to reconcile.

## Remedies, for the Human to choose

- Rename or delete the user-level copy at `~/.claude/skills/<name>/`,
  `~/.agents/skills/<name>/`, `~/.cursor/skills/<name>/` or
  `~/.codex/skills/<name>/`.
- Claude Code also documents switching a personal skill off per project with a
  `skillOverrides` entry set to `"off"`, which leaves the other repositories
  untouched. Check the runtime's skills documentation for the current form.
- Before removing anything, check whether the user-level entry is a symlink
  into a project tree. Deleting it then breaks the runtime that owns it.

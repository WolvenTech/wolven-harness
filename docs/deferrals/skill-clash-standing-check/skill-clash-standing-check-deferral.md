---
type: deferral
title: Standing clash check at check time
description: A repeatable skill-clash check in validate or harness-score waits until a consumer hits a clash that an install-time warning already missed.
status: stable
---

# Standing clash check at check time

**Deferred:** reporting user-level skill clashes from a command that runs
repeatedly — `validate` as a warning-level finding, or `harness-score` as a
report line — instead of only from `setup` and `skills`.

**Why:** both shipped sites are one-shot install-time commands about an ongoing
condition. A repo that ran `setup` before a twin existed, or a teammate who
clones later, is never warned. The counter-arguments kept this out of the
current scope: a clash is machine state rather than repository state, so a
warning-level `validate` finding would describe the developer's home directory
in a CI log; `validate` has no home awareness today (every `homedir` read in
`src/` is in `skills/install.ts`), so the check would add a second home scan and
a public finding code; and `harness-score` is an external pinned devDependency,
so it cannot carry the check at all.

**Today:** `setup` prints one note per clash through `ui.warn`, and `skills`
prints the same on stderr, both scanning `~/.claude/skills`, `~/.agents/skills`,
`~/.cursor/skills` and `~/.codex/skills` unconditionally.

## Contract impact

None while deferred. [ADR-004](../../adrs/adr-004-standalone-skills-contract.md)
makes a new warning-level finding code additive, so a `validate` check would not
need a superseding ADR; it would still add an entry to the finding-code table
and a second `$HOME` read to a command CI runs.

## Triggers

- [ ] A consumer reports a clash that `setup` and `skills` had already run past,
      because the user-level copy was installed after the last run.
- [ ] A clash recurs in a repo whose `AGENTS.md` carries the folded standing
      rules block naming `.agents/rules/project-skill-precedence.md`, and the
      session still loaded the user-level copy.
- [ ] A consumer asks for a CI or pre-commit check that fails or warns on a
      user-level twin of a project skill.

## Non-goals while deferred

- No new `validate` finding code and no change to `harness-score`.
- No CI gate that fails a build on a developer's home-directory contents.

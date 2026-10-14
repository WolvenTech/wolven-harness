---
type: deferral
title: Repairing a user-level skill symlink that points into the project
description: Detecting and repairing user-level skill entries that are symlinks into a project tree waits until a consumer hits a clash that the documented remedy does not clear.
status: stable
---

# Repairing a user-level skill symlink that points into the project

**Deferred:** recognising when a user-level skill entry is a symlink into a
project tree, and reporting or repairing that shape, rather than treating the
user path as an independent second copy.

**Why:** the clash report names a user path and a project path, and the remedy
is to remove or rename the user-level entry — but on a machine where
`~/.claude/skills/<name>` is a symlink into `~/.agents/skills/<name>`, and the
project in question *is* that home directory's repo, the two names resolve to
one file. Deleting the entry then breaks the other runtime instead of clearing
the clash. No consumer has reported this shape yet, and the identity and
identical-content guards already keep it silent when the two paths are the same
file, so building repair now would be guessing at a case nobody has hit.

**Today:** the scan compares resolved identity and skips a pair that is one
file, and skips a user copy whose bytes match the project copy. It does not
detect a symlink that points into a *different* project tree, and it does not
offer to repair one.

## Contract impact

None while deferred. [ADR-004](../../adrs/adr-004-standalone-skills-contract.md)
leaves human-readable messages and template contents outside the contract, so a
better message or a new note is additive; deleting anything under a user's home
directory would be new behaviour and a separate decision.

## Triggers

- [ ] A consumer reports that the documented remedy did not clear a reported
      clash because the user-level entry resolves inside a project tree.
- [ ] A consumer asks the harness to fix a user-level entry instead of only
      naming it.

## Non-goals while deferred

- No symlink repair, and no write of any kind under a user's home directory.
- No change to the identity and identical-content suppression rules.
- No detection of symlinks that point outside both the home and the current
  project tree.

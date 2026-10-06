---
type: deferral
title: Shipped default-branch guard
description: Installing a default-branch guard into consumer repos, and runtime adapters around it, waits until remote protection alone lets a default-branch write through.
status: stable
---

# Shipped default-branch guard

**Deferred:** a guard that `setup` installs into consumer repos, plus native
runtime hook adapters for Claude Code, Codex and Cursor.

**Why:** the incident that prompted it was a direct push to `main` with an
administrator credential while branch protection exempted administrators.
Enforcing protection for administrators closes that path for every client.
Local hooks are bypassable, and Git hooks already fire whichever runtime runs
`git`, so the adapters add almost no coverage.

**Today:** this repo runs `.agents/hooks/default-branch.sh` on `pre-commit`
and `pre-push` through `simple-git-hooks`, and `code-commit` refuses to commit
on the branch `origin/HEAD` names.

## Deferred

- `setup` installing Git hooks into a consumer's `.git/hooks`, with handling
  for `core.hooksPath`, hook managers, symlinks and races.
- `.claude/settings.json`, `.codex/hooks.json` and `.cursor/hooks.json`
  written by `setup`, and the shell-command parser behind them.
- A `pre-merge-commit` hook, and push checks that ask the destination remote
  for its default branch.

## Triggers

- [ ] A default-branch write lands in a consumer repo whose remote enforces
      pull requests for administrators.
- [ ] A merge commit lands on `main` in this repo despite remote protection.
- [ ] The Human opens a spec for it.

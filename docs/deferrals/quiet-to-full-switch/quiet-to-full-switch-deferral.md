---
type: deferral
title: Quiet-to-full install switch
description: Moving an existing quiet install to a full install waits until a Human asks for it.
status: stable
---

# Quiet-to-full install switch

**Deferred:** a procedure in `harness-init` that moves a quiet install to a
full install: `.wolven-harness/docs/` to the root `docs/`, the person's edited
and added files carried over, the quiet-install wiring removed, and
`.wolven-harness.json` rewritten to `layout: "home"`.

**Why:** no one has asked for it. The question and its blocked-path and
unclear-entry checks added a branch to every quiet install, and the
full-install guide covers the move by hand.

**Today:** `harness-init` offers no layout question and no switch. The guide's
full-install page and the uninstall guide describe the manual route.

## Deferred

- The keep-or-switch question and the switch procedure in
  `references/layout.md`.
- The checks that stop a switch before anything changes.

## Revisit when

A Human asks to move an existing quiet install to a full install.

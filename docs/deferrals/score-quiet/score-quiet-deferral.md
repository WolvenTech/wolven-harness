---
type: deferral
title: Quiet-aware harness-score
description: Making harness-score understand quiet installs waits until a Human asks for it.
status: stable
---

# Quiet-aware harness-score

**Deferred:** making `harness-score` read a quiet install's harness home, so
its checks look in `.wolven-harness/` instead of the repo root.

**Why:** `harness-score` is an outside tool pinned by `setup`, and changing it
is not this repo's work. The `--config` flag already lets a quiet install keep
its score file in `.wolven-harness/.harness-score.json`, with nothing written
at the root.

**Today:** a quiet install scores through
`harness-score --config .wolven-harness/.harness-score.json`. Checks that
expect harness files at the root may fail or pass for the wrong reason, and
`harness-init` limits its audit to `HYG-03`, `HYG-04` and `HYG-06`.

## Deferred

- Root-relative check paths in `harness-score` made home-relative.
- Any score step in `harness-init` that reads more than the audit's three
  checks in a quiet install.

## Revisit when

A Human asks for a full score report on a quiet install, or `harness-score`
ships quiet-install support.

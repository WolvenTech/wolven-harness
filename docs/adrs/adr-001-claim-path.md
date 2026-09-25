---
type: adr
title: The ADR claim gate governs architecture-decision references
description: wolven-harness validate treats ADR-NNN and adr-NNN-<slug> references in tracked files as claims, checked fail-closed against stable profile ADRs, with a warning-only path for legacy ADRs and a narrow ignore escape hatch.
status: stable
---

# ADR-001 — The ADR claim gate governs architecture-decision references

## Context

Architecture decisions are worth nothing if references to them can silently
rot: a decision renamed, deprecated, or deleted while prose still cites its
old number. The harness needs a mechanical check that every such reference
resolves to something real and current, without requiring every repo to
migrate its legacy decision records on day one.

## Decision

`validate` scans every tracked, non-ignored file for two token shapes — a
bare `ADR-NNN` and a slug-form `adr-NNN-<slug>` — excluding ADR files
themselves, `node_modules/`, and any `/archived/` path. In normal mode, a
claim passes only when it resolves to exactly one profile ADR (a file
directly under `docs/adrs/`) whose status is `stable`; missing, duplicate,
`draft`, or `deprecated` all fail closed, and a slug-form token must match
its target's filename slug. Legacy mode softens this for a transition
period: a legacy ADR (a tracked, non-`docs/adrs/` file named like
`adr-NNN*.md`) makes a claim to its number a warning instead of a failure,
reported once per legacy ADR as a migrate-via-`harness-init` line, plus a
per-claim warning under `--verbose`. A claim matching no ADR at all still
fails; a number claimed by both a profile and a legacy ADR fails as a
duplicate. The `ignore` config key is the only escape hatch, restricted to
whole directories (`<dir>/**`) and forbidden from covering `docs/` or
`.agents/` — the profile and the claim gate can't be switched off wholesale.

This package repo sets `ignore: ["templates/**", "test/**"]`, because its
`templates/` seeds carry example tokens for consumer repos and its `test/`
fixtures construct claim scenarios on purpose; neither is real
documentation this repo is claiming against.

## Consequences

- Every `ADR-NNN` / `adr-NNN-<slug>` mention in code, `AGENTS.md`, or specs
  is checked, not just documented — a stale or renamed decision breaks the
  build instead of misleading a reader.
- Repos with pre-existing, unmigrated decision records get a warning
  runway instead of an immediate wall of failures.
- Any repo can quiet a genuinely irrelevant directory via `ignore`, but
  cannot quiet `docs/` or `.agents/` themselves.

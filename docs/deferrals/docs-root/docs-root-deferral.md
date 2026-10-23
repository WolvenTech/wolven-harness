---
type: deferral
title: Configurable docs root
description: A docsDir config key that moves the harness doc folders out of docs/ waits until a consumer demonstrates a collision with the governed folders or its documentation site.
status: stable
---

# Configurable docs root

**Deferred:** a `setup --docs-dir <path>` flag, saved as `docsDir` in `.wolven-harness.json`, that moves the harness doc folders out of `docs/`.

**Why:** `docs/` is the harness's most invasive path, but it only collides through the folders the writing profile governs: `docs/adrs/`, `docs/prds/`, `docs/specs/`, `docs/notes/`, `docs/deferrals/` and, since [PR #57](https://github.com/WolvenTech/wolven-harness/pull/57), warning-only `docs/maps/`. Other content, such as `docs/getting-started.md` or `docs/api/**`, is left alone. No consumer has reported a collision it could not resolve in the reviewed evidence.

**Today:** `harness-init` step 0 asks about existing content in the original five folders before `validate` fails their layout. Map findings only warn. The later install-experience PRD explicitly keeps a configurable docs root out of scope.

## Deferred

- `validate` reads the root from config: the path rules in `profile.ts`, `claims.ts`, `legacy.ts` and `adr-folders.ts`, and the guarded `docs` directory in the `ignore` rule.
- `setup` renders the root consistently into `WOLVEN.md`, the skills, the rules and the `.qmd` collections; a validate-only override would leave those paths disagreeing.

## Contract impact

A new optional config key and a new `setup` flag are both additive under [ADR-005](../../adrs/adr-005-install-anywhere-contract.md). The `ignore` rule's ban on `docs` would have to follow `docsDir`, which changes a frozen rule. Write it down as an amendment, not a side effect.

## Triggers

- [ ] A consumer's existing governed folder, including `docs/maps/`, holds content it cannot reshape or move. Then write a spec for `docsDir` from that collision.
- [ ] A consumer serves `docs/` with a site generator that would publish or break on the harness folders. Then write a spec for `docsDir`.
- [ ] The Human opens a spec for it.

## Non-goals while deferred

- No partial option, such as renaming one folder or a validate-only override without rendering the templates.
- No `ignore` escape hatch for `docs/`. It stays a guarded directory.

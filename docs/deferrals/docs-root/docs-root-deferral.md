---
type: deferral
title: Configurable docs root
description: A docsDir config key that moves the harness doc folders out of docs/ waits until a consumer's existing docs/ collides with the five folders the writing profile governs.
status: stable
---

# Configurable docs root

**Deferred:** a `setup --docs-dir <path>` flag, saved as `docsDir` in `.wolven-harness.json`, that moves the harness doc folders out of `docs/`.

**Why:** `docs/` is the harness's most invasive path, but it only collides through the five folders the writing profile governs: `docs/adrs/`, `docs/prds/`, `docs/specs/`, `docs/notes/` and `docs/deferrals/`. Other content, such as `docs/getting-started.md` or `docs/api/**`, is left alone. No consumer has hit a collision it could not resolve.

**Today:** `harness-init` step 0 lists existing content in those five folders and asks the Human to reshape it into the doc-folder layout or move it out, before `validate` fails it.

## Deferred

- `validate` reads the root from config: the path rules in `profile.ts`, `claims.ts`, `legacy.ts` and `adr-folders.ts`, and the guarded `docs` directory in the `ignore` rule.
- `setup` renders the root into the templates, which hold about 130 `docs/` references across 32 files, including `WOLVEN.md`, the skills, the rules and the `.qmd` collections.

## Contract impact

A new optional config key and a new `setup` flag are both additive under [ADR-003](../../adrs/adr-003-public-contract.md). The `ignore` rule's ban on `docs` would have to follow `docsDir`, which changes a frozen rule. Write it down as an amendment, not a side effect.

## Triggers

- [ ] A consumer's existing `docs/adrs|prds|specs|notes|deferrals/` holds content it cannot reshape or move, as step 0 reports. Then write a spec for `docsDir`.
- [ ] A consumer serves `docs/` with a site generator that would publish or break on the harness folders. Then write a spec for `docsDir`.
- [ ] The Human opens a spec for it.

## Non-goals while deferred

- No partial option, such as renaming one folder or a validate-only override without rendering the templates.
- No `ignore` escape hatch for `docs/`. It stays a guarded directory.

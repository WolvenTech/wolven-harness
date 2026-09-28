---
type: note
title: Harness init 2026-09-28
description: Record of the harness-init run that set up the Wolven harness in the wolven-harness package repo.
status: draft
---

# Harness init 2026-09-28

## Entry integration

Mode: **full**, the Human's pick; `AGENTS.md` was 25 lines, so full was the
recommendation. The `WOLVEN.md` body, minus its first line and H1, was
appended as `## Wolven harness` with headings demoted one level, and
`WOLVEN.md` was deleted.

Checks raised:

- **Validate commands.** The folded text and `.agents/rules/comments.md` name
  `pnpm harness:validate` / `harness:comments`, but `init` wired them to a
  `wolven-harness` bin this package repo does not install. The Human chose to
  repoint both scripts in `package.json` to `node dist/cli.js validate` /
  `node dist/cli.js comments`; they need `pnpm build` first, like `validate`.
- **Comments rule overlap.** The `AGENTS.md` comments bullet restated
  `.agents/rules/comments.md`. The Human chose to trim it to a pointer at the
  rule plus the `src/`/`test/` scope and the `origin/main` merge-base.
- **ADR 001 line.** The `AGENTS.md` rule pointing at 001, The ADR claim gate
  governs architecture-decision references, agrees with the folded claims
  section; no question raised.
- **`CLAUDE.md`** already imports `@AGENTS.md`; no offer needed.
- **Ignored harness paths:** none.
- **Existing doc folders:** 001 already sits in `docs/adrs/` with profile
  frontmatter and `status: stable`; nothing to reshape.
- **Untracked ADR 000.** After the fold, validate failed with
  `claim-missing` on the folded text's reference to 000, Record architecture
  decisions as profile ADRs, because validate resolves ADRs through
  `git ls-files` and `init`'s output was untracked. The Human chose one entry
  commit carrying all of `init`'s output alongside the step 0 changes.

## ADR migration

Skipped — no legacy ADRs. `harness:validate` reported `0 legacy-warn` and no
`legacy-adr` finding.

## Discovery

Pending.

## Research

Pending.

## Suggestions

Pending.

## Stubs

Pending.

## Next steps for the Human

Pending.

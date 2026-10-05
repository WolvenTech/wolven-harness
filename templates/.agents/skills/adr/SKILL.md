---
name: adr
description: "Creates, promotes, and supersedes architecture decision records (ADRs) under docs/adrs/, repointing claims when one supersedes another. Use when a durable choice about architecture, a dependency, or a convention needs a record, a draft ADR is confirmed, or a decision replaces an earlier one."
---

An ADR is a durable, checkable record of one architecture decision — not a meeting note or a spec appendix. `harness:validate` treats every `ADR-NNN` or `adr-NNN-<slug>` reference in a tracked file as a claim: it must resolve to exactly one `stable` ADR under `docs/adrs/`, or the check fails. Create, promote, and supersede ADRs only through this skill, and never hand-edit an ADR's `status` outside these three operations. Migrating an older, differently shaped decision record into this shape is out of scope; that belongs to `harness-init`.

## Numbering and shape

- Path: `docs/adrs/adr-NNN-<slug>.md` — flat, no folder per decision; `<slug>` is a short kebab-case name taken from the title.
- `NNN` is the next free three-digit number: one more than the highest `NNN` among the `adr-NNN-<slug>.md` files under `docs/adrs/`. Never reuse, skip, or renumber, even when an old decision was later deprecated.
- Frontmatter: `type: adr`, `title`, `description`, `status` (`draft`, `stable`, or `deprecated`), and `superseded_by` (the superseding ADR's filename without `.md`, required only once `status` is `deprecated`).

## Create

1. Work out the next free number and a slug for the decision (see above).
2. Render [`references/adr-template.md`](references/adr-template.md) into `docs/adrs/adr-NNN-<slug>.md` with `status: draft` and its Context / Decision / Consequences sections filled in.
3. Run `harness:validate`.

A `draft` ADR is not citable: a claim against it fails `harness:validate`. Reference its `ADR-NNN` or `adr-NNN-<slug>` nowhere else until it is promoted.

## Promote

1. Wait until the Human confirms the decision as written — never promote on your own judgment.
2. Change the ADR's `status` from `draft` to `stable`, leaving the rest of the file as written.
3. Run `harness:validate`.

## Supersede

A newer decision replaces an older one. Do it in one pass; never leave the tree inconsistent between sessions:

1. Create the new ADR (Create, above) and promote it to `stable` once the Human confirms it (Promote, above).
2. Repoint every `ADR-<old-NNN>` and `adr-<old-NNN>-<old-slug>` claim outside `docs/adrs/` to the new ADR's number and slug.
3. Set the old ADR's `status` to `deprecated` and add `superseded_by: <new-adr-filename-without-.md>`.
4. Run `harness:validate`. A claim left on the deprecated ADR, or moved to a new ADR that is still `draft`, fails it.

## Anti-patterns

- Promoting an ADR without the Human's explicit confirmation.
- Citing a new ADR's `ADR-NNN` anywhere before it is `stable`.
- Deprecating the old ADR before every claim against it is repointed, or repointing claims to a new ADR that is still `draft`.
- Skipping `harness:validate` after create, promote, or supersede.
- Reusing a number, or renumbering an existing ADR.

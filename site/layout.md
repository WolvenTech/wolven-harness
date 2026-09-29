---
description: Where setup writes each path, and what validate checks there.
---

# Files

What your repository looks like after `setup`.

| Path | What it holds | What `validate` checks |
| --- | --- | --- |
| `AGENTS.md` | Your entry file — the first thing an agent reads. `setup` never creates or edits it. | Warns until `WOLVEN.md` has been folded in. |
| `WOLVEN.md` | The harness section `setup` writes, ready for `harness-init` to fold into the entry file. | Every rule it cites has to exist. |
| `.agents/skills/` | The sixteen seeded skills, one folder each. | Each skill carries a `name` and a `description`. |
| `.agents/rules/` | The three standing rules: `comments`, `qmd-first`, `yagni-strict`. | A cited rule file has to exist, and no ignore rule may hide it. |
| `.agents/hooks/` | A placeholder note only. No executable hooks ship or run. | Only that no ignore rule hides it. |
| `docs/adrs/` | Decision records, flat, as `adr-NNN-<slug>.md`, seeded with one starter record. | The profile. Validation fails if a reference points to no decision record. |
| `docs/prds/`<br>`docs/specs/`<br>`docs/notes/`<br>`docs/deferrals/` | One slug folder per document. A spec folder may also hold its `<slug>-plan.md`. | Front matter, a type matching the folder, and a kebab-case name. |
| `docs/WRITING-PROFILE.md` | The type map and naming rules the profile check enforces. | Reference only. |
| `.qmd/index.yml` | The collection index for searching those documents locally. | Not checked. |
| `.wolven-harness.json` | Your answers, the version of the `setup` that ran, and any `ignore` or `comments` scope you add. | No harness path may be excluded by an ignore rule. |
| `.claude/skills`<br>`CLAUDE.md` | Written only when you wire the `claude` runtime, and only when absent: a directory symlink to the skills tree, and an entry file that imports yours. | The symlink target counts as a harness path. |

This package's own repository is not a consumer of that layout: its `docs/` holds only decision records.

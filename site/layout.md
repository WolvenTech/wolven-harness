---
description: Where init writes each path, and what validate checks there.
---

# Doc layout

`init` writes `docs/<folder>/<slug>/<slug>-<type>.md` for prds, specs, notes, and deferrals. `docs/adrs/` stays flat as `docs/adrs/adr-NNN-<slug>.md`. A spec folder may also hold `<slug>-plan.md`. The type map and naming rules are in `docs/WRITING-PROFILE.md`.

What your repository looks like after `init`. Documents live one slug folder deep, as `docs/<folder>/<slug>/<slug>-<type>.md`; decision records are the exception and stay flat.

| Path | What it holds | What `validate` checks |
| --- | --- | --- |
| `AGENTS.md` | Your entry file — the first thing an agent reads. `init` never creates or edits it. | Warns until `WOLVEN.md` has been folded in. |
| `WOLVEN.md` | The harness section `init` writes, ready for `harness-init` to fold into the entry file. | Every rule it cites has to exist. |
| `.agents/skills/` | The sixteen seeded skills, one folder each. | Each skill carries a `name` and a `description`. |
| `.agents/rules/` | The three standing rules: `comments`, `qmd-first`, `yagni-strict`. | A cited rule file has to exist, and no ignore rule may hide it. |
| `.agents/hooks/` | Empty apart from a placeholder note. `init` creates the folder and stops there — no hooks ship, none are wired, and the harness runs none. It is yours to fill if you ever want one. | Only that no ignore rule hides it. |
| `docs/adrs/` | Decision records, flat, as `adr-NNN-<slug>.md`, seeded with one starter record. | The profile, plus the claim gate — fail-closed. |
| `docs/prds/`<br>`docs/specs/`<br>`docs/notes/`<br>`docs/deferrals/` | One slug folder per document. A spec folder may also hold its `<slug>-plan.md`. | Front matter, a type matching the folder, and a kebab-case name. |
| `docs/WRITING-PROFILE.md` | The type map and naming rules the profile check enforces. | Reference only. |
| `.qmd/index.yml` | The collection index for searching those documents locally. | Not checked. |
| `.wolven-harness.json` | Your answers, the version of the `init` that ran, and any `ignore` or `comments` scope you add. | No harness path may be excluded by an ignore rule. |
| `.claude/skills`<br>`CLAUDE.md` | Written only when you wire the `claude` runtime, and only when absent: a directory symlink to the skills tree, and an entry file that imports yours. | The symlink target counts as a harness path. |

`docs/` is exactly those five folders — `adrs/`, `prds/`, `specs/`, `notes/`, `deferrals/` — and nothing else.

This package's own repository is not a consumer of that layout: its `docs/` holds only decision records.

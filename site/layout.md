---
description: What setup installs, where harness files live, and what validate checks.
---

# Files and validation

`wolven-harness setup` installs the harness in your repository. It creates missing paths only and leaves `AGENTS.md` to you.

## Two layouts

At a repository root, setup installs the quiet layout. It asks no layout question, and `harness-init` has none either.

| Layout | Description |
| --- | --- |
| Quiet install | The harness lives in `.wolven-harness/`, and git sees only what you pick. |
| Full install | The harness sits at the repo root, and git tracks all of it. Only for repos you own. Reached only by the route below. |

A quiet install writes the harness into `.wolven-harness/`, plus `.wolven-harness.json` and one symlink in each coding agent's skills folder, such as `.claude/skills/harness-init`. Until you run the `harness-init` skill, `git status` shows all of these as untracked: those symlinks, `.wolven-harness.json`, and the part of `.wolven-harness/` git can track, which is the rules, hooks, decision records and `AGENTS.md`. `harness-init` connects the rest, shows each diff before writing, and lets you pick what git tracks. Hooks are always tracked, so `.worktreeinclude` lists the hooks folder. The tables below describe the full install, where every path sits at the repo root; in a quiet install the same paths sit inside `.wolven-harness/`.

### Full install guide

Want git to track the whole harness? Follow the [uninstall steps](./install#uninstall-a-quiet-install), but keep `.wolven-harness.json`. In that file, set `layout` to `home` and remove `harnessHome`, then run `wolven-harness setup`.

Each worktree gets its copies of the local-only harness files when it is created. A rule you change later reaches only new worktrees, so copy the change into the others by hand.

The table shows the main paths and how `wolven-harness validate` treats them.

| Path | What it contains | Validation behavior |
| --- | --- | --- |
| `AGENTS.md` | Your repository's agent entry point. Setup never creates or edits it. | A warning remains while `WOLVEN.md` exists and is not mentioned by `AGENTS.md`. |
| `WOLVEN.md` | Harness instructions for your agent to integrate into `AGENTS.md`. | Referenced rule files must exist. A pending integration is a warning. |
| `.agents/skills/` | Eleven core skills plus optional `ship` and `discovery` skills. | Every skill folder needs a `SKILL.md` with non-empty `name` and `description` frontmatter. An unfinished marked stub is a warning. |
| `.agents/rules/` | The rules your agent follows in every session: `comments`, `project-skill-precedence`, `qmd-first`, `secrets` and `yagni-strict`. | Rules cited from `WOLVEN.md` or `AGENTS.md` must exist. |
| `.agents/hooks/` | Setup copies the hook scripts in both layouts. A full install's setup connects the secret-path guard, which stops your agent reading secret files, for Cursor and Claude Code; in a quiet install `harness-init` connects the hooks. | The path must not be hidden by a repository ignore rule. |
| `docs/adrs/` | Decision records (ADRs) in one flat folder, named `adr-NNN-<slug>.md`. | Frontmatter, filename, status, and supersession rules apply. ADR references must resolve to a unique stable decision. |
| `docs/prds/<slug>/` | A PRD named `<slug>-prd.md`. | Required main document, frontmatter, slug, and type are checked. |
| `docs/specs/<slug>/` | A spec named `<slug>-spec.md`, optionally with `<slug>-plan.md` and `<slug>-iteration-<N>-{spec,plan}.md`. | Required main document, frontmatter, slug, and type are checked; iteration docs only warn. |
| `docs/notes/<slug>/` | A note named `<slug>-note.md`. | Required main document, frontmatter, slug, and type are checked. |
| `docs/deferrals/<slug>/` | A deferral named `<slug>-deferral.md`. | Required main document, frontmatter, slug, and type are checked. |
| `docs/WRITING-PROFILE.md` | The writing and naming rules used for profile documents. | Informational; the validator reads its own profile rules. |
| `.qmd/index.yml` | QMD collection configuration for local document search. | Its contents are not checked, but `.qmd/` must not be hidden by a repository ignore rule. Setup does not install QMD itself. |
| `.harness-score.json` | The starter set of harness-score checks this repository can adjust. | Not checked by `validate`; consumed by `harness-score`. |
| `.wolven-harness.json` | Setup choices, package version, optional ignore rules, and preserved extra config such as comment settings. | Ignore entries are validated. `docs/` and `.agents/` cannot be excluded from the scan. |
| `.claude/skills` and `CLAUDE.md` | Created only when Claude Code is selected and each path is absent. The first links to `.agents/skills/`; the second imports `AGENTS.md`. | The skills link is a required harness path. Existing paths are preserved. |

## Document profile

The document profile is the set of naming and metadata rules `validate` checks. ADRs live directly in `docs/adrs/` and use a three-digit number and kebab-case slug. Other document types live in one slug folder per document, with a main file named `<slug>-<type>.md`. Spec folders may also hold `<slug>-plan.md` and numbered `<slug>-iteration-<N>-spec.md` / `<slug>-iteration-<N>-plan.md` files for review-fix rounds. Required frontmatter fields are `type`, `title`, `description`, and `status`; status is `draft`, `stable`, or `deprecated`.

Deprecated ADRs need a `superseded_by` field pointing to an existing ADR filename without `.md`. Active document folders need their main document. The validator skips everything under `docs/<type>/archived/`, for example `docs/specs/archived/<slug>/`. See [Commands](./commands) for finding codes and scan behavior.

## Ignore rules

The optional top-level `ignore` array in `.wolven-harness.json` excludes paths from validation scans. Each entry must be a directory prefix in the form `<dir>/**`; glob patterns, absolute paths, `..`, `docs/`, and `.agents/` are rejected. Required harness paths must remain visible to Git.

The `comments` command uses the same ignore paths by default. A `comments.paths` setting replaces that default comments scope. See the [configuration reference](./commands#configuration).

The wolven-harness repository's own `docs/` folder differs from an install like yours: it stores that project's decisions, specs, PRDs, notes, and deferrals.

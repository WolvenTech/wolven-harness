---
description: The sixteen skills available, which ones setup installs, and the three standing rules.
---

# Skills

## What to ask for next

After `harness-init`, the usual path is:

1. `code-spec` — agree on the change and how to verify it.
2. `code-plan` — approve the implementation steps.
3. `code-execute` — make the change and run the checks.
4. `code-commit` — commit the result when you are ready.

Commits stay manual by default. `code-execute` can commit when you explicitly enable automatic commits; see [the config and requirements](./cycle#commits-and-pull-requests).

For a one-file change, you can ask for `code-execute` directly and skip the spec and plan. Validation still applies.

## List and install

List every skill, grouped by `core` / `ship` / `discovery`:

```sh
pnpm exec wolven-harness setup --list-skills
```

Install one skill without its whole set. `--skills none` keeps the default `ship` set out; without it, a non-interactive run also installs `ship`. Pass `--git-host` and `--runtimes` unless `.wolven-harness.json` already records them:

```sh
pnpm exec wolven-harness setup --git-host gh --runtimes cursor --skills none --skill create-prd
```

`--skill` is additive and may be repeated or combined with `--skills`. `setup --skill` still runs all of `setup`: it refreshes `.wolven-harness.json`, restores missing core templates, wires the chosen runtimes, and adds missing package scripts. Opt into whole sets with `--skills` as before; re-runs never remove an installed set or skill.

## Full inventory

Sixteen skills are available under `.agents/skills/`. `setup` always installs the nine core skills (`harness-init`, `adr`, `grilling`, `pragmatic-guard`, `qmd`, `research`, `code-spec`, `code-plan`, `code-execute`). The `ship` set (`code-commit`, `code-pr`, `code-review`, `code-ci`) and the `discovery` set (`create-prd`, `prototype`, `handoff`) are optional. The four marked **ask-only** require an explicit request. PR creation, review, and CI work never merge the PR.

| Skill | Description |
| --- | --- |
| `adr` | Create, promote, and supersede decision records under docs/adrs/; repoint claims when one supersedes another. |
| `code-ci` (ask-only) | Drive a PR to merge-ready: conflicts, then comments, then failing checks. Explicit ask; never merge. |
| `code-commit` | Create a Conventional Commit when asked, or when `code-execute` meets the automatic commit requirements above. |
| `code-execute` | Implement an approved plan and run checks. Commit behavior follows the config described above. |
| `code-plan` | Turn an approved spec into ordered tasks, with dependencies, check points, and an explicit choice to work inline or use a subagent. |
| `code-pr` (ask-only) | Push the branch and open or amend a PR from the body template. Ask-only; never merges. |
| `code-review` (ask-only) | Review an open PR against the refs it cites; post blocking or nit findings. Never merges. |
| `code-spec` | Write a spec from a product requirements document (PRD) or confirmed request, pairing each requirement with a way to verify it. |
| `create-prd` | Clarify the problem, draft a lean PRD, and mark it stable only on approval. |
| `grilling` | Interview one question at a time until every open branch of a plan, decision, or idea is settled. |
| `handoff` (ask-only) | Save a handoff document to the OS temp directory for a fresh session. Ask-only; never automatic. |
| `harness-init` | Fold WOLVEN.md into AGENTS.md, migrate legacy ADRs, discover, stub skills, and write a session note. |
| `pragmatic-guard` | Challenge unnecessary scope and record deferred work with a trigger for revisiting it under `docs/deferrals/`. |
| `prototype` | Build a throwaway prototype that answers one question, then discard or promote it deliberately. |
| `qmd` | Search local markdown notes, docs, and wikis with QMD, the local search tool the agent uses; retrieve documents or set up access. |
| `research` | Investigate against primary sources, cite every claim, and land the answer as an in-repo note. |

## Rules applied each session

Three rules live under `.agents/rules/`:

- `comments` defines the style checked by `wolven-harness comments`.
- `qmd-first` directs the agent to search the repo’s documents before answering from memory or the web.
- `yagni-strict` directs the agent to challenge unnecessary scope and record deferred work under `docs/deferrals/`.

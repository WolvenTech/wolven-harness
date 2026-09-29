---
description: The sixteen skills init seeds, and the three standing rules.
---

# Skills

Sixteen folders under `.agents/skills/`. The four marked ask-only are never invoked by a model on its own — you name them — and none of them merges anything. Ask-only rows are never started by a model.

| Skill | Description |
| --- | --- |
| `adr` | Create, promote, and supersede ADRs under docs/adrs/; repoint claims when one supersedes another. |
| `code-ci` (ask-only) | Drive a PR to merge-ready: conflicts, then comments, then failing checks. Explicit ask; never merge. |
| `code-commit` | Write Conventional Commits on an explicit ask, or from code-execute when commit-cadence says to. |
| `code-execute` | Execute a locked plan in-repo (implement, validate, maybe commit). PRs, review, CI are a later ask. |
| `code-plan` | Turn a locked spec into ordered execute units with dependencies, wave stops, and a Subagent each. |
| `code-pr` (ask-only) | Push the branch and open or amend a PR from the body template. Ask-only; never merges. |
| `code-review` (ask-only) | Review an open PR against the refs it cites; post blocking or nit findings. Never merges. |
| `code-spec` | Freeze a code initiative into a spec from a PRD or confirmed ask, with obligation-proof pairs. |
| `create-prd` | Grill a problem to one statement, draft a lean PRD, and promote draft to stable only on approval. |
| `grilling` | Interview one question at a time until every open branch of a plan, decision, or idea is settled. |
| `handoff` (ask-only) | Save a handoff document to the OS temp directory for a fresh session. Ask-only; never automatic. |
| `harness-init` | Fold WOLVEN.md into AGENTS.md, migrate legacy ADRs, discover, stub skills, and write a session note. |
| `pragmatic-guard` | YAGNI: challenge over-build, record docs/deferrals/, refuse scope expansion without a trigger. |
| `prototype` | Build a throwaway prototype that answers one question, then discard or promote it deliberately. |
| `qmd` | Search local markdown notes, docs, and wikis with QMD; retrieve documents or set up QMD access. |
| `research` | Investigate against primary sources, cite every claim, and land the answer as an in-repo note. |

Three rules under `.agents/rules/` apply to every session rather than waiting to be called: `comments` sets the style for added comment lines and is what `harness:comments` enforces, `qmd-first` says to search the repository's own documents before memory or the web, and `yagni-strict` puts `pragmatic-guard` on scope expansion and keeps deferrals under `docs/deferrals/`.

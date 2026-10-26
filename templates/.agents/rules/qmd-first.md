---
description: Search docs/ with QMD before answering from memory or the web; ADRs first, then widen.
alwaysApply: true
---

# QMD before web

For any question this repo might already answer, search before you answer from
memory or the web.

## Index readiness

Fresh git worktrees do not share the gitignored local index (`.qmd/index.sqlite*`).
Before you treat zero query hits as “no decision exists,” check readiness:

```bash
qmd status    # Documents → Total: N files indexed
```

When **Total is `0 files indexed`**, run `qmd update` once to build the index
from `.qmd/index.yml`, then search below. Do not run `qmd embed` for this
bootstrap — lexical search is enough to start.

When Total is greater than zero, query directly. Do not run unasked `qmd update`
or `qmd embed` during routine search.

## Search ADRs first, then widen

Collections are not interchangeable. Which one a hit came from tells you how
far to trust it.

```bash
qmd query -c adrs "<question>"       # 1. the decisions you may depend on
qmd query "<question>"               # 2. widen only if ADRs miss
```

| Collection | What it holds | Trust |
|---|---|---|
| `adrs` | decisions in force | the record; its indexed body is a stored copy |
| `prds` | product requirements | current, but not settled |
| `specs` | active work in flight | current, but not settled |
| `deferrals` | deferred items with triggers | current |
| `notes` | research belonging to no effort | dated, may be stale; not the decision |

## Then

1. Prefer structured `qmd query` with `intent:` / `lex:` / `vec:` / `hyde:`
   over bare text.
2. `qmd get` / `multi-get` return the stored index body, not a live read of
   the file. Read that file before treating the indexed body as the decision.
   When the index and the file disagree, name neither number as the limit to
   use.
3. Only then use the web.

Setup lives in `.qmd/index.yml`. After you write to `docs/`, run `qmd update`,
then `qmd embed` if content changed.

Skill: `qmd`.

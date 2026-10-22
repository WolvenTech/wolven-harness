---
description: Search docs/ with QMD before answering from memory or the web; ADRs first, then widen.
alwaysApply: true
---

# QMD before web

For any question this repo might already answer, search before you answer from
memory or the web.

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
3. When a harness tool such as `qmd` fails, tell the Human which tool failed
   and the error before using a fallback.
4. Only then use the web.

Setup lives in `.qmd/index.yml`. After you write to `docs/`, run `qmd update`,
then `qmd embed` if content changed.

Skill: `qmd`.

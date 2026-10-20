---
description: Search docs/ with QMD before answering from memory or the web; ADRs first, then widen.
alwaysApply: true
---

# QMD before web

For any question this repo might already answer, search before memory or the
web.

## Search ADRs first, then widen

Collections are not interchangeable: which one a hit came from tells you how
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
| `notes` | research for no effort | dated, may be stale; not the decision |

## Then

1. Prefer structured `qmd query` with `intent:` / `lex:` / `vec:` / `hyde:`
   over bare text.
2. `qmd get` / `multi-get` return the stored index body, not a live read of
   the file: read that file before treating the indexed body as the decision,
   and when they disagree name neither number as the limit to use — never
   tell the reader to use the on-disk or the indexed one.
3. Only then use the web.

Setup: `.qmd/index.yml`. After `docs/` writes: `qmd update` (then `qmd embed`
if content changed).

Skill: `qmd`.

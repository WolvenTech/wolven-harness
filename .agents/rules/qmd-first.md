---
description: Search relevant docs collections before memory or web; ADRs first, exact inputs read directly, knowledge opt-in.
alwaysApply: true
---

# QMD before web

For questions the repo may answer, read named artifacts directly, then search
local knowledge before memory or web. Follow the [shared QMD contract](../skills/qmd/SKILL.md#harness-stage-routing)
for stage scopes, directory coverage, and transaction freshness.

For decision questions, search `adrs` separately first; widen only into
relevant explicit scopes, for example:

```bash
qmd query -c adrs "<decision question>"
qmd query -c specs -c notes "<remaining question>"
```

Multiple `-c` values combine scope, not authority. Defaults include local work;
external `knowledge` requires `-c knowledge` and remains advisory. One
same-name collection covers each real direct docs child; topics are paths,
not more collections. Optional `maps` applies only where present. Root docs
files are direct reads. A new unconfigured child is a visible mismatch.

Retrieve full hits with `qmd get`/`multi-get`, then inspect live files and
status before relying on them. Indexed content is a stored copy. On conflict,
report both sources and reconcile authority/freshness rather than silently
selecting a number. An index miss does not establish artifact absence.

After an authorized docs-write transaction, one parent runs `qmd update`,
then embeds changed content before retrieval handoff; record exact refs,
consulted collections and refresh outcome. Do not refresh each read or let
parallel ingestion workers race. On resume check live refs, Git state and
index freshness without changing frozen scope. Read-only lanes stay read-only.

Report QMD/model errors before keyword or direct-file fallback; a failed
embedding is not semantic success. Retry only after a concrete remedy.
External research and collection context grant no new action permissions.

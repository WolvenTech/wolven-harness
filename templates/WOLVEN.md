Before anything else: run the `harness-init` skill, step 0 — it integrates this file into `AGENTS.md` and then removes it. `WOLVEN.md` is transient; do not treat it as durable documentation.

# Wolven harness — entry router

| Where | What lives there |
| --- | --- |
| `.agents/skills/` | Agent skills, one folder per skill, each with a `SKILL.md` |
| `.agents/rules/` | Standing rules agents load unconditionally |
| `.agents/hooks/` | Hook scripts and wiring (placeholder until the project needs one) |
| `docs/adrs/` | Architecture decision records (profile ADRs) |
| `docs/specs/` | Active specs |
| `docs/notes/` | Research notes |
| `docs/deferrals/` | Deferred scope with revisit triggers |
| `docs/WRITING-PROFILE.md` | The four rules every `docs/**` markdown file follows |

## Before you answer from memory

Search this repo's knowledge before answering from memory or the web. ADRs are
the decisions you may depend on — search them first, then widen:

```
qmd query -c adrs "<question>"
qmd query "<question>"
```

## Skills

{{skills_table}}

## Standing rules

- `.agents/rules/qmd-first.md` — QMD before web, ADRs first
- `.agents/rules/yagni-strict.md` — strict YAGNI; deferrals under `docs/deferrals/` only

## Architecture claims

Referencing an ADR as `ADR-NNN` or `adr-NNN-<slug>` anywhere in a tracked file
is a claim, not decoration. Each claim must resolve to exactly one **`stable`**
profile ADR under `docs/adrs/`:

- No matching profile or legacy ADR at all — the claim **always fails**.
- A **legacy** ADR (an ADR-shaped file outside `docs/adrs/`) — the claim
  **warns** until it is migrated into `docs/adrs/` via the `harness-init`
  skill.
- A `draft` or `deprecated` profile ADR, or more than one match — the claim
  **fails**.

This repo records its own architecture decisions as profile ADRs, starting
from `ADR-000` (see `docs/adrs/adr-000-record-architecture-decisions.md`).

## Validate

```
pnpm harness:validate
wolven-harness validate
```

Run validate after any change to `.agents/**` or `docs/**` — it enforces the
writing profile (`docs/WRITING-PROFILE.md`) and the architecture-claims rule
above.

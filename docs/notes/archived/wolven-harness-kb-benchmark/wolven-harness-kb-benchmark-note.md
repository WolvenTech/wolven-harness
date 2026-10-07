---
type: note
title: compozy/kb benchmark — discovery prompts for harness-init
description: Compares each compozy/kb codebase-analysis capability at commit d7c8261 against the harness-init discovery bar, marking each adopt-as-discovery-prompt or out of scope.
status: stable
created: 2026-09-26
tags: [research, harness, init-wizard, kb, discovery]
---

# compozy/kb benchmark — discovery prompts for harness-init

**Question:** Of everything `compozy/kb` can do with a codebase, what earns a place in the
`harness-init` discovery step, and what does not?

## Method

Source: `compozy/kb` at commit `d7c8261` — https://github.com/compozy/kb. Read directly: the
repository root listing at that ref, and the full `README.md` at that ref (`kb ingest codebase`,
the ten `kb inspect` subcommands, and `kb index`/`kb search`). No other file in the repository was
read; `docs/` at that ref holds only `docs/plans`, which is kb's own internal planning and not part
of its user-facing surface, so it is out of scope for this comparison.

The discovery bar this benchmark compares against (harness-init, discovery step): reads what the
repo already shows — manifests, lockfiles, `README`, `AGENTS.md`, CI config, `docs/adrs/`, installed
skills, top-level layout — and asks the Human only for lifecycle stage and decisions not visible in
code. It produces three lists: context, lifecycle, decided tools. Its job is to pick 2–4 skills in
one session, not to audit code health.

**Nothing from kb is vendored by this note or by `harness-init`.** kb is never installed, invoked, or
required by the package. Two separate things can still be true about kb going forward: (1) a
consumer repo that already runs kb (a `.kb/` vault, `topic.yaml`, kb config) shows up as a **decided
tool** the way any other installed tool would, listed in discovery's decided-tools output — nothing
kb-specific has to be coded for that, it falls out of reading what the repo already committed to; and
(2) this note itself never ships in the package; only the prompt wording marked **adopt** below is
meant to reach `references/discovery.md`.

## Capability comparison

| kb codebase capability | What it does (`d7c8261` README) | Verdict | Reason / prompt |
|---|---|---|---|
| Symbol and file map | `kb ingest codebase` parses every file with tree-sitter and writes one note per file and per symbol under `raw/codebase/{files,symbols}`, plus synthesized wiki articles ("Symbol Taxonomy", "Directory Map") | Out of scope | Building a symbol-level map means parsing the whole tree and maintaining a vault of it. Discovery only needs the top-level layout (already an ask) to place a repo's shape; it never needs a symbol index to pick 2–4 skills. |
| Dependency graph | Tracked relations (`imports`, `exports`, `calls`, `references`, `declares`, `contains`) compiled into a "Dependency Hotspots" wiki article and queried through `kb inspect deps`/`backlinks`/`circular-deps` | Out of scope | A dependency graph is a static-analysis artifact that has to be built and kept current; a first discovery pass reads manifests and lockfiles for what a repo depends on, which is enough to name decided tools without graphing internal call edges. |
| Complexity | `kb inspect complexity` ranks functions by cyclomatic complexity and LOC | Out of scope | Complexity ranking is a code-health measurement, not a signal about which skills to install. It answers "where might there be bugs," not "what does this team decide, and at what lifecycle stage." |
| Blast radius | `kb inspect blast-radius` ranks symbols by transitive dependents | Out of scope | Same reasoning as complexity: a risk-surface metric useful for refactor planning, not for a one-time skill-selection pass. |
| Coupling and instability | `kb inspect coupling` ranks files by efferent/afferent coupling | Out of scope | Architectural-health metric; requires the same full parse and graph as the dependency graph above, for a question discovery does not need to answer. |
| Dead code | `kb inspect dead-code` lists dead exports and orphan files; the smell detectors (`dead-export`, `orphan-file`, `god-file`, `feature-envy`, `bottleneck`, `long-function`, `high-blast-radius`) generalize this | Out of scope | Dead-code detection is a maintenance/cleanup signal. It costs a full parse to compute and tells an agent nothing about which of 2–4 skills a repo needs on day one. |
| The `inspect` queries, as a set (10 subcommands across Metrics, Graph, and Lookup) | Query a maintained codebase vault like a database — `smells`, `dead-code`, `complexity`, `blast-radius`, `coupling`, `backlinks`, `deps`, `circular-deps`, `symbol`, `file` — three output formats, zero external dependencies once the vault exists | Out of scope | Every subcommand here depends on `kb ingest codebase` having already built and kept a vault current. That is a standing analysis tool for ongoing code health, not a discovery step that runs once per `harness-init` session and then is done. |
| QMD index (`kb index`, `kb search`) | Indexes a vault (or any markdown tree) for hybrid lexical/vector search via QMD, so an agent can search prior documentation instead of reading it all by hand | **Adopt as a discovery prompt** | This one is cheap: it costs nothing to build (it reuses an index that may already exist) and it directly serves discovery's job of reading what a repo already shows, faster. See prompt wording below. |

## Adopted prompt wording

Exactly one capability crosses the bar, kept deliberately narrow per "adopted prompts stay few and
cheap." This is the wording meant for `references/discovery.md` — generic, no product names, no
internal identifiers, ready to paste into a shipped skill reference:

> Before reading files by hand, check whether the repository already has a local search index over
> its own documentation (for example, a QMD collection). If one exists, query it for relevant
> documentation and architecture notes before reading further, and note the indexing tool itself as
> a decided tool. If none exists, skip this step and read the repository directly.

## Sources

| Claim | Source |
|---|---|
| README content: install, features, decision model, `kb ingest codebase`, `kb inspect` (10 subcommands, three categories), `kb index`, `kb search`, code smells table, excluded paths | `README.md` at `compozy/kb@d7c8261` — https://github.com/compozy/kb/blob/d7c8261/README.md |
| Repository root layout at that commit (confirming `docs/` holds only `docs/plans`) | Root tree listing, `compozy/kb@d7c8261` — https://github.com/compozy/kb/tree/d7c8261 |
| Discovery bar compared against | `docs/specs/archived/wolven-harness-b-wizard/wolven-harness-b-wizard-spec.md`, rows B-Q8, B-Q16, R6.1, and the repository-grounding line for `compozy/kb d7c8261` |

## Open questions

- If a consumer repo runs kb with an accepted selection contract and calibrated thresholds, does
  discovery's decided-tools output need a sentence distinguishing "kb installed" from "kb actively
  gating ingests," or is naming the tool enough?
- Should a future, separate effort (not this one) evaluate kb's decision-model cost model
  (`typesafe/jev-1.13` via OpenRouter) as a decided-tool signal in its own right, independent of the
  codebase-analysis capabilities compared here?

---
name: qmd
description: "Searches local markdown knowledge bases, notes, docs, and wikis with QMD. Use when users ask to find notes, retrieve documents, inspect a wiki, answer from indexed markdown, or set up QMD access."
license: MIT
compatibility: Requires qmd CLI or MCP server. Install via `npm install -g @tobilu/qmd`.
metadata:
  author: tobi
  version: "2.2.0"
allowed-tools: Bash(qmd:*), mcp__qmd__*
---

# QMD - Query Markdown Documents

## How search works

QMD searches local markdown collections: architecture decisions, product
requirement docs, specs, notes, and deferrals. Use it before web search
when the answer may already be in indexed local files.

The workflow is always: search for candidates, retrieve the full text with
`qmd get`/`qmd multi-get`, then answer from retrieved text, citing paths or
docids. Do not answer from snippets alone when the user needs facts,
decisions, quotes, or nuance — snippets are only leads.

`qmd get` returns the stored index body, not a live read of the file. Read
that file before treating the indexed body as the decision. When they
disagree, state neither number as the limit to use. A disagreement table may
show both numbers. Do not tell the reader to use the on-disk number or the
indexed number. A note is not the decision.

**Search ADRs first, then choose relevant collections.** Architecture decision records are the
record you may depend on — search `-c adrs` first and then widen when the decision record leaves a relevant gap:

```bash
qmd query -c adrs "<question>"    # 1. the decisions you may depend on
qmd query -c specs -c notes "<question>"  # 2. choose only relevant work collections
```

Typical loop:

```bash
qmd search "retry policy for outbound calls" -n 5
# leads: #abc123 adrs/adr-NNN-retry-policy.md; #def432 specs/outbound-calls/outbound-calls-spec.md
qmd multi-get "#abc123,#def432" --format md
```

**Default to structured `qmd query` with `intent:`, `lex:`, `vec:`, and
`hyde:` fields that you write yourself**, including as the `<question>`
above. You are a better query expander than the built-in model: you know the
actual goal, the domain vocabulary, and the nearby-but-wrong ideas to avoid.
Do not just paste the user's words into `qmd query "..."` and hope the
expansion model guesses right.

```bash
qmd query $'intent: Find the ADR that fixed the retry policy, not the general HTTP client setup.\nlex: retry backoff outbound calls policy\nvec: how many retries before giving up\nhyde: An ADR records the retry policy: exponential backoff, capped attempts, a dead-letter path.'
```

- `intent:` what you are trying to find **and what to avoid**; always add it
  when the user's wording is ambiguous.
- `lex:` exact terms, aliases, titles, rare words you expect.
- `vec:` paraphrases the idea in natural language.
- `hyde:` describes the document or answer that would satisfy the request.

Write at least `intent:` plus one of `lex:`/`vec:`. Use `qmd search` (BM25,
no LLM) instead when you have nothing to expand (a single rare token, a
verbatim phrase) or already know the exact titles or terms — it is faster.
If a model-backed `qmd query` or its reranking fails, fall back to
`qmd search` with stronger lexical terms.

## Retrieve documents

Search results include docids like `#abc123` and `qmd://...` paths:

```bash
qmd get "#abc123"
qmd get qmd://specs/outbound-calls/outbound-calls-spec.md
qmd multi-get "#abc123,#def432" --format md    # add --format json to parse
```

`get`/`multi-get` are line-numbered by default and print the `#docid` and
`qmd://` path — cite both. Pass `--no-line-numbers` for raw content to copy
verbatim, or `--full-path` to hand a path to `Read`/`Edit`.

### Read line ranges with `:from:count` — do not shell out to `sed`/`head`/`tail`

```bash
qmd get "#abc123:120:40"                 # 40 lines starting at line 120
qmd get "#abc123" --from 120 -l 40        # equivalent, using flags
```

Piping through `sed`/`head`/`tail` defeats docid resolution and line numbering.

## Discover what is indexed

```bash
qmd collection list
qmd ls
qmd status
```

Add collection filters when a broad search drifts into the wrong material:

```bash
qmd search "outbound retry policy" -c adrs -n 10
qmd query "deferred scope on the retry work" -c deferrals -c specs -n 10
```

Omit `-c` to search default local-work collections. `knowledge` is excluded by
default and requires explicit `-c knowledge`. Collection names mirror real
direct child directories of `docs/`; discover the live inventory rather than
assuming optional `maps` or another directory exists. Multiple `-c` values
combine scope; they do not rank authority. ADR lookup is a separate step.

## Harness stage routing

Read an exact named artifact directly before discovery. A missing index hit
cannot replace the spec, plan, map ticket, PR refs, or current Git/host state.
Use ADRs for settled decisions; inspect profile status and the live file.
PRDs/specs describe approved or proposed work, not blanket standing policy;
notes are dated research, deferrals carry revisit triggers, and knowledge is
external advisory evidence. Search only scopes relevant to the open question.

| Stage | Direct inputs | Discovery scope after relevant ADR lookup |
| --- | --- | --- |
| `adr` | proposed text and relevant decisions | `adrs`; relevant `specs`, `notes` rationale |
| `create-prd`, `wayfinder` | named idea, map or ticket | `prds`, existing `maps`, `notes`, `deferrals`; opt-in `knowledge` for an external question |
| `research`, `ai-patterns` | question and affected local surfaces | `notes`, opt-in `knowledge`; related `prds`/`specs` as needed; ai-patterns filters its topic paths |
| `code-spec` | exact PRD/confirmed ask and affected code | `specs`, `prds`, `deferrals`; relevant existing `maps`/`notes`/`knowledge` for a stated gap |
| `code-plan` | exact locked spec and refs | `specs`, `deferrals`; no automatic external pass |
| `code-execute` | exact approved plan/spec, resume record, Git state | relevant `adrs`/`specs`; `notes`/`knowledge` only for implementation uncertainty, never to redefine obligations |
| `code-review`, `code-ci` | current PR description, exact refs, fresh diff/checks/threads | relevant `adrs`/`specs`/`prds`; external patterns add no review obligations or fix authority |
| `code-commit`, `code-pr` | intended diff, exact refs, Git/PR state | no mandatory search; relevant `adrs`/`specs` for a concrete claim/handoff gap |
| `harness-init`, `harness-doctor` | docs directory inventory, QMD config/status | inspect coverage/reachability; content search only for a diagnostic question |
| Other skills | named artifacts or conversation | use this contract only when retrieval is needed |

When a stage writes docs, refresh once after that authorized transaction and
before retrieval handoff; record consulted collections, exact artifact refs,
and refresh outcome in its existing handback/evidence. No new execution log.
A read-only review/CI retrieval path does not mutate index/config or authorize
fixes; the lane's existing explicit-ask and never-merge rules remain intact.
On resume, reconcile input refs, live files, Git state, and index freshness.
If stale, report the gap before direct-file fallback; refresh only within an
authorized write/maintenance scope. Never use stale snippets to change locked
scope. Embedding success and keyword success are distinct; report failures
before fallback and retry only after a concrete environment remedy.

### Directory coverage

One same-name collection per real direct child directory of `docs/`, rooted
at that child; no catch-all duplicates and no separate topic collection.
Read root files such as `docs/WRITING-PROFILE.md` directly. When an operation
creates a child directory, and during init/doctor inspection, compare actual
directories with parsed `.qmd/index.yml` roots and `qmd collection list`.
Report missing directories/config entries, duplicate or overlapping roots,
unsupported archive globs, and symlinks escaping docs before indexing. Treat
optional collections as conditional on directory/config presence. Reconcile
mismatches explicitly within authorized setup/write scope; do not silently
rewrite a consumer config. Init/doctor's existing approval rules still apply.
Preserve archive exclusions; retired cards must leave active globs before
refresh. `knowledge` at `./docs/knowledge` stays opt-in with advisory context.
These manual local-pilot checks add no watcher, daemon, or doctor CLI feature.

## MCP Tool: `query`

Prefer structured searches over the MCP server too:

```json
{
  "searches": [
    { "type": "lex", "query": "outbound retry policy backoff" },
    { "type": "vec", "query": "how many retries before giving up" }
  ],
  "intent": "Find the ADR that fixed the retry policy.",
  "collections": ["adrs"],
  "limit": 10
}
```

Query types: `lex` (BM25 keyword search), `vec` (vector semantic search),
`hyde` (vector search using a hypothetical answer passage).

## Setup and maintenance

Searching and retrieving are read-only. An authorized docs-write transaction
also includes its parent-owned freshness refresh before retrieval handoff:
`qmd update`, then `qmd embed` for changed content (scope to changed collections
when appropriate). Do not refresh before every read or in independent ingestion
workers. Outside authorized docs writes, setup or maintenance is required for
index mutation. Collections are declared in `.qmd/index.yml`, which `qmd` finds
from any directory inside the repo:

```bash
npm install -g @tobilu/qmd
qmd update        # re-index the collections declared in .qmd/index.yml
qmd embed         # refresh vector embeddings after content changes
```

Diagnostics: `qmd doctor` checks config, models, and GPU setup — run it
before changing configuration when a model-backed command fails.
`qmd pull` downloads the models.

## Anti-patterns

- Stopping at snippets: fetch the document before making a claim from it.
- Slicing files with `sed`/`head`/`tail`: use `path:from:count` or `--from`/`-l`.
- Changing config/index during a read-only consultation or outside authorized docs writes, setup, or maintenance.

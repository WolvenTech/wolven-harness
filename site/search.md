---
description: Configure local document search and find the decision record behind an answer.
---

# Search

The harness includes a `qmd-first` rule that directs an agent to search the repository's records before answering questions about its architecture. For the search to work, install the QMD CLI and build the local index configured by `.qmd/index.yml`; `wolven-harness setup` installs the configuration but not QMD itself.

Ask your agent a question you would otherwise have to investigate by hand:

> Why do we publish this package publicly on npm instead of GitHub Packages?

For this repository, the answer is recorded in [ADR-002](https://github.com/WolvenTech/wolven-harness/blob/main/docs/adrs/adr-002-public-npm-oidc.md). The decision explains that public npm avoids per-consumer registry credentials and uses OIDC trusted publishing for releases.

That answer is specific to the harness repository. In your repository, the source of truth is your own decision record.

## Search order

The standing rule asks the agent to:

1. Search the `adrs` collection first with `qmd query -c adrs "<question>"`.
2. Widen the search with `qmd query "<question>"` if no decision answers it.
3. Read the full matching record before relying on it and identify the source file in its answer.

ADRs are settled decisions. Specs and PRDs describe active or proposed work; notes may be dated and can become stale.

## Structured queries

QMD supports four fields for a more focused query:

| Field | What to include |
| --- | --- |
| `intent` | What to find and what to exclude. |
| `lex` | Exact names or terms likely to appear in the record. |
| `vec` | The question written in natural language. |
| `hyde` | A hypothetical passage that helps locate a match; it is a search hint, not evidence. |

For example, search for the npm publishing decision, exclude release troubleshooting, and include terms such as npmjs, GitHub Packages, registry, and token.

## Index lifecycle

The `.qmd/index.yml` file defines the local collections. QMD builds and updates the actual index on the developer's machine; setup keeps the QMD local index out of Git. In the wolven-harness repository's Cloud Agent setup, bootstrap installs QMD and runs `qmd update` and `qmd embed`. This is specific to this repository; other repositories need their own QMD installation and index setup.

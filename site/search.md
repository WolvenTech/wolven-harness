---
description: Find an engineering decision and read the record behind the answer.
---

# Search

Ask your agent a question you would otherwise have to dig through the repo to answer:

> Why do we publish this package publicly on npm instead of GitHub Packages?

For this package’s repository, the recorded answer is:

> The private GitHub Packages setup required a registry entry, a read token, and access grants in every consumer. The source and shipped files were already public. Public npm publishing removes those install requirements; the release workflow uses OIDC trusted publishing, which authenticates GitHub Actions without a stored npm token.
>
> Source: [the publishing decision](https://github.com/WolvenTech/wolven-harness/blob/main/docs/adrs/adr-002-public-npm-oidc.md), Context and Decision.

This is an example from the harness repo. In your repo, answers come from your own records.

## How search works

QMD is the local document search tool the agent uses. The agent searches architecture decision records first with `qmd query -c adrs`. If there is no match, it widens the search to other indexed documents. It reads the full record before answering and names the source file. Notes may be dated; an unfinished spec is not a settled decision.

::: details Optional: the four query fields

The agent prefers a structured query:

- `intent`: what to find and what to exclude — the publishing decision, not release troubleshooting.
- `lex`: exact terms likely to appear — npmjs, GitHub Packages, registry, token.
- `vec`: the question in natural language — why consumers install from public npm.
- `hyde`: a short hypothetical passage to help find a matching document — a decision to remove per-repo registry credentials by publishing publicly. This is a search hint, not evidence.

:::

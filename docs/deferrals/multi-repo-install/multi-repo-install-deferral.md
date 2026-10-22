---
type: deferral
title: Several code repositories in one install
description: One harness install that serves several code repositories waits until a second client, or the E36 pilot, needs it in practice.
status: stable
---

# Several code repositories in one install

**Deferred:** a harness home that serves more than one code repository. That means `setup` and `harness-init` recording several child repositories, each with its own commit and PR convention, and `code-commit` and `code-pr` choosing the repository each change belongs to.

**Why:** the evidence is one user at one client, who works in one code repository. The [install experience PRD](../../prds/install-experience/install-experience-prd.md) makes one install serve one code repository, with that repository's convention recorded. Designing a multi-repository layout and its per-repository config from a single case would guess at a shape nobody has run yet.

**Today:** a harness home holds one code repository, inside it and listed in its `.gitignore`. A team with several repositories can create one harness home per repository.

## Contract impact

Recording several repositories adds keys to `.wolven-harness.json`, and `setup` rewrites that file on every run. Whatever shape ships becomes a migration burden, so it belongs in the successor ADR that records it.

## Triggers

- [ ] A second client adopts the harness and needs one install across several of its repositories.
- [ ] The E36 pilot runs the harness across `js-storefront`, `hybris-sourcecode` or other repositories, and one harness home per repository proves impractical.

## Non-goals while deferred

- No list of child repositories in `.wolven-harness.json`.
- No repository selection logic in `code-commit` or `code-pr`.

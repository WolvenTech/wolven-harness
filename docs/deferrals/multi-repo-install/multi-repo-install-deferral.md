---
type: deferral
title: Per-repository configuration and automatic target selection
description: Per-repository conventions and automatic target selection wait until shared harness instructions with explicit repository selection cannot serve a real workflow.
status: stable
---

# Per-repository configuration and automatic target selection

**Deferred:** recording several code repositories and their individual commit and PR conventions in one install's configuration, and automatically choosing the target repository for each change. Sharing instructions is not itself deferred.

**Why:** on 2026-10-23 the Human confirmed a current multi-repository need and that shared instructions with explicit repository selection are sufficient. That workflow does not yet require a repository registry, automatic routing or per-repository configuration. This narrows the original deferral; it does not create another PRD.

**Today:** [PR #75](https://github.com/WolvenTech/wolven-harness/pull/75) merged setup outside a repository. Still-open [PR #76](https://github.com/WolvenTech/wolven-harness/pull/76) adds linked layouts and doctor. Both the merged configuration and PR #76's reviewed head (`b0b096e`) name one `codeRepo` and one `commitConvention`. PR #76 does not implement multi-repository dispatch. The Human's chosen approach is to reuse shared instructions and explicitly name the target repository for each task; this is a workflow choice, not a claim that setup or doctor manages several targets.

## Contract impact

Any future config shape follows [ADR-006](../../adrs/adr-006-install-check-and-repair-contract.md)'s change policy: new optional keys can be additive; replacing the existing `codeRepo` or convention behavior requires a separate compatibility decision. Nothing in this deferral adds or changes a config key.

## Triggers

- [ ] A real workflow needs different recorded conventions for several repositories and explicit task instructions cannot reliably apply them. Capture the affected repositories and the failed task before specifying config.
- [ ] Repeated target-selection mistakes occur despite the Human explicitly naming the repository, and automatic selection has a concrete requirement that addresses them.

## Non-goals while deferred

- No repository registry or list of child repositories in `.wolven-harness.json`.
- No automatic repository selection in `code-commit` or `code-pr`.
- No new initiative for sharing instructions or explicitly choosing a task's repository.

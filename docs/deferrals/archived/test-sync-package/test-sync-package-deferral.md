---
type: deferral
title: Ship test-sync in the package
description: Retired as not planned after the Human confirmed the deferral cleanup on 2026-10-23.
status: deprecated
---

# Ship test-sync in the package

## Retirement — 2026-10-23

Keep test-sync local to this repository; reopen packaging for a consumer need. No package distribution is planned.

The Human confirmed this retirement during the deferral grilling. The
original scope and triggers below are retained as history, not active work.


**Deferred:** copying `.agents/skills/test-sync/` into `templates/.agents/skills/` and adding it to a skill set.

**Why:** the upstream skill's one-file-per-module rule and its delete script do not match this suite. The dogfood skill is the adapted rules. Shipping that text to every consumer waits until those rules have been used once more in this repo.

**Today:** `.agents/skills/test-sync/SKILL.md` is the local skill. `setup` does not install it. `docs/specs/archived/repo-trim/repo-trim-spec.md` records the audit that produced the rules.

Later use is no longer hypothetical: the [install-experience iteration plan](../../../specs/install-experience/install-experience-iteration-1-plan.md), unit 03 resume record, records a test-sync update to entry tests and retirement of a subfolder-success test covered by a stronger refusal proof. [PR #75](https://github.com/WolvenTech/wolven-harness/pull/75) merged that work with its suite passing. This is evidence of use, but the record does not explicitly judge false-orphan behavior or request distribution to consumers, so it does not establish the complete shipping trigger below.

## Contract impact

None. [ADR-005](../../../adrs/adr-005-install-anywhere-contract.md) leaves the set of skills and skill-set membership out of the contract. A new skill in `templates/` would still be a product change, not a contract change.

## Triggers

- [ ] The local skill is used on a later test change in this repo, and it does not mark a live test as an orphan.
- [ ] The Human asks to ship test-sync in the package.

## Non-goals while deferred

- No `npx test-sync` install, no upstream Python cleanup script, and no CI gate.
- No test file created solely because a `src/` module lacks a same-named twin.
- No catalogue entry. The skills-catalogue deferral still covers a picker.

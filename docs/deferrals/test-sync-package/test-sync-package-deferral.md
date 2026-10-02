---
type: deferral
title: Ship test-sync in the package
description: The test-sync skill stays a dogfood file in this repo until it has judged a later test change here without calling a live test an orphan.
status: stable
---

# Ship test-sync in the package

**Deferred:** copying `.agents/skills/test-sync/` into `templates/.agents/skills/` and adding it to a skill set.

**Why:** the upstream skill's one-file-per-module rule and its delete script do not match this suite. The dogfood skill is the adapted rules. Shipping that text to every consumer waits until those rules have been used once more in this repo.

**Today:** `.agents/skills/test-sync/SKILL.md` is the local skill. `setup` does not install it. `docs/specs/repo-trim/repo-trim-spec.md` records the audit that produced the rules.

## Contract impact

None. [ADR-003](../../adrs/adr-003-public-contract.md) leaves the set of skills and skill-set membership out of the contract. A new skill in `templates/` would still be a product change, not a contract change.

## Triggers

- [ ] The local skill is used on a later test change in this repo, and it does not mark a live test as an orphan.
- [ ] The Human asks to ship test-sync in the package.

## Non-goals while deferred

- No `npx test-sync` install, no upstream Python cleanup script, and no CI gate.
- No test file created solely because a `src/` module lacks a same-named twin.
- No catalogue entry. The skills-catalogue deferral still covers a picker.

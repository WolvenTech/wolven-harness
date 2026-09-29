---
type: deferral
title: Full 4-digit ADR support in validate
description: validate recognises only 3-digit ADRs; 4-digit layouts (adr-tools, MADR, ADR-0001 tokens) only raise an adr-unrecognized warning until a consumer actually uses one.
status: stable
---

# Full 4-digit ADR support in validate

**Deferred:** checking 4-digit ADR layouts, such as adr-tools `doc/adr/0001-*.md`, MADR, and `ADR-0001` tokens, the way 3-digit ones are checked.

**Why:** the ADR regexes in `claims.ts`, `legacy.ts` and `profile.ts` accept exactly three digits. In a 4-digit repo the claim check would find nothing and report `validate: ok`, so it would be silently off. No consumer uses 4 digits yet, so the number rules below would be guesses.

**Today:** `adr-unrecognized` (a warning) names each tracked `adr`, `adrs` or `decisions` folder holding `NNNN-*.md` files, so the gap shows up instead of hiding.

## Deferred

- 4-digit numbers in legacy detection and in profile ADR filenames.
- `ADR-NNNN` and `adr-NNNN-<slug>` claim tokens, and how they coexist with 3-digit ones in one repo.
- The number rule for migrating a 4-digit legacy set into `docs/adrs/`.

## Contract impact

[ADR-003](../../adrs/adr-003-public-contract.md) does not freeze which tokens count as claims. Still, accepting 4-digit tokens can raise new `claim-missing` errors in a repo that passes today, so it needs a deprecation release that warns first.

## Triggers

- [ ] A consumer's `validate` shows `adr-unrecognized`. Then write a spec for that consumer's layout, starting from its real files.
- [ ] The Human opens a spec for it.

## Non-goals while deferred

- No accepting 4-digit tokens without profile and migration rules to match.

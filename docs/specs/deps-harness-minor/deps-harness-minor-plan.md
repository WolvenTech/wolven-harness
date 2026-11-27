---
type: spec
title: Minor dependency updates for harness-score, Biome and clack
description: One wave that bumps three dependencies, runs every gate, and opens the PR.
status: stable
---

# Minor dependency updates for harness-score, Biome and clack — plan

## Structural gate

Every acceptance box in `deps-harness-minor-spec.md` maps to a unit below.

## Work units

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 01 | Read changelogs for the three ranges | — | none | inline | [x] Breaking or relevant notes listed for the PR body |
| 02 | Bump versions and regenerate the lockfile | 01 | `package.json`, `pnpm-lock.yaml`, `biome.json` (schema only) | inline | [x] R1.1 grep shows the target versions |
| 03 | Gate: run every repo script | 02 | none | inline | [x] R2.1 all exit 0; R2.2 diff shows no weakening |
| 04 | Commit both files together | 03 | git | inline | [x] R1.2 `git show --stat HEAD` lists both files |

## Wave stops

| Stop | After | Gate |
|------|-------|------|
| **Ship gate** | 03 | Spec gates pass; `pnpm harness:validate` PASS — abort before commit on failure |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
|---|---|---|---|---|---|
| — | none open | — | — | — | — |

## Frontier order

01 → 02 → 03 → 04, then `code-pr` as a separate ask.

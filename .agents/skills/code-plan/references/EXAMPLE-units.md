# Example work units (code-plan)

Table shape for `docs/specs/<slug>/<slug>-plan.md`: vertical
observable Done when (behavior + proof or gate check), typed Unresolved
rows, the Subagent column, and wave STOP gates. Worked example: a
hypothetical avatar-upload feature
(`docs/specs/avatar-upload/avatar-upload-plan.md`).

## Wave stops

| Stop | After unit | Gate |
|------|------------|------|
| **1** | 04 | Units 02–03's proofs + `harness:validate` PASS — **abort before Wave 2** |
| **2** | 07 | Units 05–06's proofs + `harness:validate` PASS — **abort; last wave** |
| **Ship** | closeout unit | Closeout checks pass; `harness:validate` PASS |

## Unresolved (typed rows — carry from the locked spec)

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
|---|---|---|---|---|---|
| `U-example-storage` | Object storage vs. inline DB blob for the uploaded image. | *(decision owner)* | **Blocks Wave 1** (unit 01). | *(empty until decided — do not invent)* | 01 |
| `U-example-size-limit` | Maximum upload size in MB before rejecting. | *(decision owner)* | **Blocks Wave 2** (unit 06). | *(empty until decided — do not invent)* | 06 |

## Work units (excerpt)

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 01 | Record disposition `U-example-storage` | — | `docs/specs/avatar-upload/avatar-upload-plan.md` (Unresolved table) | `inline` | [ ] Disposition filled; storage choice named; Wave 1 unblocked **or** escalated and stopped; row inspectable |
| 02 | Implement avatar upload endpoint | 01 | `src/avatar/upload/**` | `spawn` | [ ] Endpoint stores an uploaded image per the storage disposition; proof inspectable |
| 03 | Implement image resize pipeline | 01 | `src/avatar/resize/**` | `spawn` | [ ] Uploaded image resized to the named thumbnail sizes; proof inspectable |
| 04 | **Wave 1 gate** | 02, 03 | — | `inline` | [ ] Units 02–03's proofs PASS; `harness:validate` PASS; failure → **abort** before Wave 2 |
| 05 | Wire the avatar into the profile page | 04 | `src/profile/**` | `spawn` | [ ] Profile page shows the uploaded avatar; proof inspectable |
| 06 | Record disposition `U-example-size-limit` + enforce it | 04 | `src/avatar/upload/**`, `docs/specs/avatar-upload/avatar-upload-plan.md` (Unresolved table) | `inline` | [ ] Disposition filled; size limit enforced; Wave 2 unblocked **or** escalated and stopped |
| 07 | **Wave 2 gate** | 05, 06 | — | `inline` | [ ] Units 05–06's proofs PASS; `harness:validate` PASS; failure → **abort** |

## Frontier order

**Wave 1:** 01 → (02 ∥ 03) → **04 STOP**

**Wave 2:** (05 ∥ 06) → **07 STOP**

Parallel only when Owns are disjoint.

## Vertical unit shape (good)

Unit 02: one coherent outcome end-to-end; Done when names behavior + a
spec-named proof; agent-sized; Subagent stated.

## Layer-only slice (bad — re-slice)

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 98 | Update every avatar file | — | `src/avatar/upload/**`, `src/avatar/resize/**`, `src/profile/**` | `spawn` | [ ] All avatar files touched; formatting cleaned up |

**Why bad:** layer-only (files/formatting), no observable behavior, no
named proof, Owns mixed across outcomes. Safety valve → stop and
split into vertical units, each with behavior + a spec-named proof (or
gate check).

## Validate / proof ownership

| # | Unit | Depends | Subagent | Done when | Validate |
|---|------|---------|----------|-----------|----------|
| 02 | Implement avatar upload endpoint | 01 | `spawn` | [ ] Behavior + spec-named proof ready | Unit-specific structural check; `harness:validate` at the wave gate |
| 04 | **Wave 1 gate** | 02, 03 | `inline` | [ ] Units 02–03's proofs PASS | `harness:validate` PASS |

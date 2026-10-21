# Example work units (code-plan)

This is the table shape for `docs/specs/<slug>/<slug>-plan.md`: vertical
units with an observable Done when (behavior plus a proof or gate check),
typed Unresolved rows, the Subagent column, and wave STOP gates. The worked
example is a hypothetical avatar-upload feature
(`docs/specs/avatar-upload/avatar-upload-plan.md`).

## Wave stops

| Stop | After unit | Gate |
|------|------------|------|
| **1** | 04 | Units 02–03's proofs + `harness:validate` PASS — **abort before Wave 2** |
| **2** | 07 | Units 05–06's proofs + `harness:validate` PASS — **abort; Wave 2 is the last wave** |
| **Ship** | closeout unit | The closeout checks pass; `harness:validate` PASS |

## Unresolved (typed rows — carry from the locked spec)

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
|---|---|---|---|---|---|
| `U-example-storage` | Object storage vs. inline DB blob for the uploaded image. | *(decision owner)* | **Blocks Wave 1** (unit 01). | *(empty until decided — do not invent)* | 01 |
| `U-example-size-limit` | Maximum upload size in MB before rejecting. | *(decision owner)* | **Blocks Wave 2** (unit 06). | *(empty until decided — do not invent)* | 06 |

## Work units (excerpt)

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 01 | Record disposition `U-example-storage` | — | `docs/specs/avatar-upload/avatar-upload-plan.md` (Unresolved table) | `inline` | [ ] Disposition filled; storage choice named; Wave 1 unblocked **or** escalated and stopped; the Unresolved row is inspectable |
| 02 | Implement avatar upload endpoint | 01 | `src/avatar/upload/**` | `spawn` | [ ] Endpoint stores an uploaded image per the storage disposition; the spec-named proof is inspectable |
| 03 | Implement image resize pipeline | 01 | `src/avatar/resize/**` | `spawn` | [ ] The uploaded image is resized to the spec's named thumbnail sizes; the spec-named proof is inspectable |
| 04 | **Wave 1 gate** | 02, 03 | — | `inline` | [ ] Units 02–03's proofs PASS; `harness:validate` PASS; failure → **abort** before Wave 2 |
| 05 | Wire the avatar into the profile page | 04 | `src/profile/**` | `spawn` | [ ] Profile page shows the uploaded avatar; the spec-named proof is inspectable |
| 06 | Record disposition `U-example-size-limit` + enforce it | 04 | `src/avatar/upload/**`, `docs/specs/avatar-upload/avatar-upload-plan.md` (Unresolved table) | `inline` | [ ] Disposition filled; the size limit is enforced; Wave 2 unblocked **or** escalated and stopped |
| 07 | **Wave 2 gate** | 05, 06 | — | `inline` | [ ] Units 05–06's proofs PASS; `harness:validate` PASS; failure → **abort** |

## Frontier order

**Wave 1:** 01 → (02 ∥ 03) → **04 STOP**

**Wave 2:** (05 ∥ 06) → **07 STOP**

Parallel only when Owns are disjoint.

## Vertical unit shape (good)

Unit 02 is one coherent outcome end-to-end. Its Done when names the behavior
and a spec-named proof, it is agent-sized, and its Subagent is stated.

## Layer-only slice (bad — re-slice)

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 98 | Update every avatar file | — | `src/avatar/upload/**`, `src/avatar/resize/**`, `src/profile/**` | `spawn` | [ ] All avatar files touched; formatting cleaned up |

**Why bad:** the unit is layer-only (files and formatting), with no
observable behavior and no named proof, and its Owns mix unrelated outcomes.
Safety valve: stop and split it into vertical units, each with behavior and
a spec-named proof (or gate check).

## Validate / proof ownership

| # | Unit | Depends | Subagent | Done when | Validate |
|---|------|---------|----------|-----------|----------|
| 02 | Implement avatar upload endpoint | 01 | `spawn` | [ ] Behavior and spec-named proof are ready | Unit-specific structural check; `harness:validate` at the wave gate |
| 04 | **Wave 1 gate** | 02, 03 | `inline` | [ ] Units 02–03's proofs PASS | `harness:validate` PASS |

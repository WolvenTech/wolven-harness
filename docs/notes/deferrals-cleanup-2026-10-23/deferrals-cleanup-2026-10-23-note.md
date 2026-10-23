---
type: note
title: Confirmed deferral cleanup on 2026-10-23
description: The Human retired eight deferrals, retained six with a narrowed multi-repo scope, cancelled upgrade guidance and authorized closing superseded setup tracking.
status: stable
---

# Confirmed deferral cleanup on 2026-10-23

The Human confirmed the shared understanding after 17 grilling rounds and
the final checklist, then asked to resume application. These decisions
supersede the provisional recommendations in the
[October 22 assessment](../deferrals-cleanup-2026-10-22/deferrals-cleanup-2026-10-22-note.md).
The active local deferral count is **6**, down from **14** before this round
and **18** before the first cleanup.

## Retired as not planned

Each record is archived with `status: deprecated`, a dated retirement
reason and its original scope and triggers as history. Retirement is not a
claim that the proposed feature shipped.

| Record | Need / complexity | Human decision and simpler path | Reopen only for |
| --- | --- | --- | --- |
| [Cloud skill discovery](../../deferrals/archived/cloud-skill-discovery/cloud-skill-discovery-deferral.md) | 1 / 5–8: the observed gate failure was fixed; alternatives add distribution and authorization machinery | Retire plugin, copied-tree and global-discovery tracking; keep the working project paths and symlink | A demonstrated discovery failure or concrete global-companion requirement |
| [Grok runtime](../../deferrals/archived/grok-cloud-runtime/grok-cloud-runtime-deferral.md) | 1 / 5: no identified product or consumer; new wiring needs verification | Retire; use supported runtime paths | A concrete Grok product and user |
| [Iteration enforcement](../../deferrals/archived/iteration-enforcement/iteration-enforcement-deferral.md) | 1 / 4: no observed confusing gap; stricter errors change the contract | Retire; keep existing warnings and permit numbering gaps | A concrete review-round problem or explicit stricter-CI requirement |
| [Extra skills catalogue](../../deferrals/archived/skills-catalogue/skills-catalogue-deferral.md) | 2 / 5: the packaged picker exists; another catalogue needs curation | Retire; use the picker and repo-specific stubs | Repeated unmet demand for reusable tool skills |
| [Test-sync packaging](../../deferrals/archived/test-sync-package/test-sync-package-deferral.md) | 3 / 4: later local use exists, but no consumer need or explicit portability judgment | Retire packaging; retain the repo-local skill | A consumer need |
| [Service-blueprint skill](../../deferrals/archived/service-blueprint/service-blueprint-deferral.md) | 2 / 7: a liked prototype without a current grid deliverable; lanes require another format and layout | Retire; preserve the prototype and use journey action paths | A real blueprint deliverable |
| [Four-digit ADR support](../../deferrals/archived/adr-4digit/adr-4digit-deferral.md) | 1 / 6: no requesting consumer; mixed numbering and migration need design | Retire broader support tracking; keep `adr-unrecognized` | A concrete consumer requirement |
| [Claim waivers](../../deferrals/archived/claim-waivers/claim-waivers-deferral.md) | 2 / 5: hypothetical blocking cases; syntax and scanner changes add complexity | Retire; keep current validation behavior | A concrete false-positive bug report |

The [service-blueprint prototype](../../deferrals/archived/service-blueprint/prototype/README.md)
is preserved with the retired record. Local test-sync instructions now point
to the retired packaging decision. Existing validation warnings, hooks and
security safeguards are unchanged.

## Six active deferrals

| Record | Human decision | Trigger or boundary |
| --- | --- | --- |
| [Contract documentation](../../deferrals/stable-contract-doc/stable-contract-doc-deferral.md) | Keep deferred | Existing contract-extraction and reader-reference triggers remain |
| [Non-interactive setup](../../deferrals/non-interactive-setup/non-interactive-setup-deferral.md) | Keep deferred | Preinstalled machines and scripted provisioning remain intended |
| [Configurable docs root](../../deferrals/docs-root/docs-root-deferral.md) | Keep deferred | Configurable placement remains intended; revisit an actual content or site conflict |
| [Consumer branch guard](../../deferrals/default-branch-guard/default-branch-guard-deferral.md) | Keep deferred | Protection bypass or explicit consumer requirement; existing safeguards remain |
| [Setup drift reporting](../../deferrals/setup-drift-check/setup-drift-check-deferral.md) | Keep the existing delivery gate | PR #76 remains open at this application; remove the record when its replacement merges |
| [Multi-repo configuration](../../deferrals/multi-repo-install/multi-repo-install-deferral.md) | Narrow the deferral | Shared instructions with explicit repository selection meet the current need; only per-repository config and automatic selection remain deferred |

The multi-repository need is current. During grilling, the Human initially
believed it had shipped with the doctor work. Inspection of merged
[PR #75](https://github.com/WolvenTech/wolven-harness/pull/75) and
[PR #76 at b0b096e](https://github.com/WolvenTech/wolven-harness/blob/b0b096e/src/setup/config.ts)
found one `codeRepo` and one `commitConvention`. The Human chose shared
instructions and explicit repository selection rather than another PRD
for configuration and automatic dispatch. Need for the actual shared
workflow rose to 7/10; that does not establish a need for the deferred
7/10-complexity automation.

## PRDs and current GitHub work

- Keep [architectural-map](../../prds/architectural-map/architectural-map-prd.md)
  as a draft for a reusable capability. Need 7/10 from a real request and
  repeated hand drawing; complexity 5/10 for a bounded capability. No
  renderer, ELK dependency or dynamic playback is selected.
- Drop the upgrade-guide requirement completely. The
  [cancelled PRD](../../prds/archived/consumer-upgrade-guide/consumer-upgrade-guide-prd.md)
  is archived as deprecated; existing CLI and release documentation are
  sufficient. This is not a deferred guide or a replacement initiative.
- Close [PR #73](https://github.com/WolvenTech/wolven-harness/pull/73) as
  superseded/unneeded and [issue #65](https://github.com/WolvenTech/wolven-harness/issues/65)
  as completed by the implementation already on main. Mapping skills are
  in discovery, and npm/yarn/pnpm-aware score guidance exists. Correct the
  discovery prompt label to include wayfinder; update its existing UI
  assertion. Need 2/10 and complexity 1/10 for this remaining label fix,
  versus complexity 5/10 for the stale multi-feature PRD. Bun support and
  mandatory mapping skills were not adopted.
- Keep [PR #78](https://github.com/WolvenTech/wolven-harness/pull/78) open
  for a revised experiment. Its reported no-clear-gain result, two treatment
  errors and three failing tests remain evidence against permanent
  adoption, not a reason to discard the experiment. Adoption need 2/10,
  complexity 6/10 on the present evidence.
- Keep the other reviewed issues and PRs unchanged. In particular,
  [issue #68](https://github.com/WolvenTech/wolven-harness/issues/68) and
  [PR #74](https://github.com/WolvenTech/wolven-harness/pull/74) concern an
  empty index, which is not solved by an index-file existence check.
  [Issue #80](https://github.com/WolvenTech/wolven-harness/issues/80) remains
  an active security problem, separate from branch-write protection.
- Preserve [PR #82](https://github.com/WolvenTech/wolven-harness/pull/82)'s
  recorded lanes/radial boundary and proposed toggle deferral. It has not
  merged into this checkout and is not counted in the six local records.

## Application and verification

- GitHub confirmed PR #73 is closed and unmerged, with its branch retained,
  and issue #65 is closed with `state_reason: completed`. Their titles,
  descriptions and discussions were preserved. PR #78 remains open for
  the revised experiment; no other PR was closed or merged.
- Eight records and the cancelled upgrade-guide folder were moved to their
  respective `archived/` directories. Six active deferral files remain.
  Relative links and repository-path references follow the moves. The
  touched archived wizard idea also had an obsolete sibling-idea link and
  an opaque session id presented as a local link; the sibling link now
  resolves and the session id is preserved as text.
- All seven non-README prototype files are byte-identical to their
  pre-move hashes. Only the prototype README's build-command paths changed
  to name the archived location.
- Build, lint, validate, comments and score passed with
  `pnpm --config.verify-deps-before-run=false <command>` against the
  installed dependencies. Validate reports 98 claims OK, zero legacy
  warnings and zero failures. Comments reports zero findings. Harness
  score remains L3, 83/83.
- The existing setup-skill-set, setup-options, harness-score and
  package-manager suites passed: **59 tests, zero failures or skips**,
  using `node_modules/.bin/tsx --test` on those four files. No new test
  infrastructure was added and the full runtime suite was not needed for
  the single prompt-label change.
- Changed Markdown links and `git diff --check` passed. Required
  `qmd update` and `qmd embed` both failed with `qmd: command not found`,
  so the local search index could not be refreshed.
- This application round ended with the cleanup uncommitted in the shared
  workspace. The Human subsequently requested `code-pr` to commit and
  publish it for review; that is a separate delivery step. No merge is
  performed by either step.
- PR preparation ran the full runtime suite on the final cleanup tree:
  **908 passed, zero failures, skips or TODOs**. Build, lint, validate,
  comments and score passed again; the retained PRD remains a deliberate
  draft for future work.

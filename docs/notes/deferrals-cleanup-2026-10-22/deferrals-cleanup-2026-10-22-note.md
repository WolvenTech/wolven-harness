---
type: note
title: Deferral cleanup on 2026-10-22
description: Review all eighteen active deferrals against merged PRs, issue closure reasons and current delivery boundaries, leaving fourteen active records and two draft PRDs.
status: stable
---

# Deferral cleanup on 2026-10-22

This is the October 22 assessment. The Human's October 23 grilling decisions
are recorded in the [follow-up cleanup note](../deferrals-cleanup-2026-10-23/deferrals-cleanup-2026-10-23-note.md),
which supersedes this note's recommendations where they differ. Links to
subsequently retired records now point to their archived locations.

Reviewed the 18 active deferrals on merged head `bdb63b8` with the repository's
Pragmatic Guard skill. The result is 14 active deferrals and two new draft
PRDs. Five old files are deleted after their scope is promoted or absorbed;
one consolidated deferral replaces three of them. No runtime, dependency,
command, contract or published release changes in this cleanup.

## Evidence and delivery boundary

- GitHub's merged-PR search returned 44 PRs; the closed-issue search returned
  16 issues. Their titles and descriptions were cross-checked with the local
  decisions, PRDs and implementation records relevant to these deferrals.
- [PR #33](https://github.com/WolvenTech/wolven-harness/pull/33) completed
  [issue #31](https://github.com/WolvenTech/wolven-harness/issues/31) with an
  individual packaged-skill picker. It did not deliver a catalogue of new
  tool-specific skills inside `harness-init`.
- [PR #51](https://github.com/WolvenTech/wolven-harness/pull/51) completed
  [issue #50](https://github.com/WolvenTech/wolven-harness/issues/50) with the
  project companion-path gate. The [smoke note](../cloud-session-skills/cloud-session-skills-note.md)
  records successful host reads in Codex, Cursor and Claude Code.
  [PR #60](https://github.com/WolvenTech/wolven-harness/pull/60) established
  project-skill precedence, not global companion authorization.
- [PR #41](https://github.com/WolvenTech/wolven-harness/pull/41) addressed
  [incident #40](https://github.com/WolvenTech/wolven-harness/issues/40) with
  repository-local hooks and a commit-skill rule; its description records
  administrator protection being enabled. It deliberately deferred a
  consumer hook installer. This review did not re-audit remote protection.
- [Issue #45](https://github.com/WolvenTech/wolven-harness/issues/45) and
  [issue #46](https://github.com/WolvenTech/wolven-harness/issues/46) were
  closed as `not_planned`. Their closure is not delivery evidence for drift
  detection or a completed consumer upgrade.
- [PR #75](https://github.com/WolvenTech/wolven-harness/pull/75) merged setup
  and wiring. [PR #76](https://github.com/WolvenTech/wolven-harness/pull/76)
  was open and unmerged at this review. The [iteration spec](../../specs/install-experience/install-experience-iteration-1-spec.md),
  R14.1 and R14.2, explicitly keeps the drift deferral through wiring and
  removes it with check and repair. The merged `src/cli.ts` has no doctor
  dispatch, and the package version is still 0.3.2.
- The [install-experience PRD](../../prds/install-experience/install-experience-prd.md)
  records an external client install. [Issue #66](https://github.com/WolvenTech/wolven-harness/issues/66)
  also reports a 0.3.2 install with mixed skill-folder versions. The claim
  that no external consumers exist is obsolete.
- The former architectural-map record marks two triggers met on
  2026-10-21: a real harness C4 request and another hand-written diagram.
  [PR #58](https://github.com/WolvenTech/wolven-harness/pull/58) delivered
  tree-shaped journey maps, not that graph capability. This promotion uses
  the recorded request; the Human has not approved the new PRD.

QMD retrieval could not run: `qmd query -c adrs` failed with
`qmd: command not found`. ADRs and source documents were read directly,
using `rg` for discovery. The review does not claim an indexed search.

## Pragmatic Guard decisions

Need and complexity scores assess the proposed capability, not the cost of
editing this list. A fired trigger opens evaluation; it does not approve all
the mechanisms originally imagined. Security and data-integrity safeguards
are not refused on YAGNI grounds.

| Original deferral | Need and reason | Complexity and reason | Verdict | Simpler path and surviving trigger |
| --- | --- | --- | --- | --- |
| `architectural-map` | 7/10: a recorded real request and repeated hand drawing | 5/10: bounded structure views; a general graph editor would cost more | Promote the problem to a [draft PRD](../../prds/architectural-map/architectural-map-prd.md); delete the deferral | Start with the requested harness context, container and component views. Do not preselect ELK or dynamic playback; resolve the PRD's open questions before a spec. |
| `consumer-docs` | 6/10 for upgrade guidance: real external installs and changed templates; 1/10 for another contract page: no reader request | 2/10 for a release-specific guide; 4/10 for another synchronized contract surface | Promote the guide to a [draft PRD](../../prds/archived/consumer-upgrade-guide/consumer-upgrade-guide-prd.md); merge the contract-page remainder into `stable-contract-doc`; delete the old file | Cover actual published versions and local edits. The contract-page trigger remains a request for finding-code meanings beyond the current reference. |
| `codex-cloud-plugin` | 1/10: the project gate and smoke already work | 8/10: a second distribution and discovery surface | Refuse implementation; merge into [cloud-skill-discovery](../../deferrals/archived/cloud-skill-discovery/cloud-skill-discovery-deferral.md) | Keep the checkout path. Revisit a missing non-ask-only skill or primary documentation ruling out repository discovery. |
| `skill-tree-copy` | 1/10: no recorded symlink failure | 6/10: duplicate every skill edit and its parity work | Refuse implementation; merge into cloud-skill-discovery | Keep one source tree. Revisit a Claude cloud session proving that the symlink hid skills. |
| `loose-companion-discovery` | 1/10: no demonstrated failure of explicit project paths | 5/10: ambiguous discovery and wider authorization | Refuse implementation; merge into cloud-skill-discovery | Preserve explicit checkout checks. Revisit a reproducible predicate failure or a concrete global-companion need. |
| `setup-drift-check` | 8/10: both changed templates and mixed consumer folders are evidenced | 6/10: correct classification and safe repair across versions | Already promoted into the stable install-experience PRD; retain the deferral until PR #76 merges | Update tracking rather than open another PRD or build `setup --check`. R14.2 is the retirement gate. |
| `stable-contract-doc` | 2/10: successors exist, but recurring repointing cost and reader demand are unproven | 5/10: move normative authority, tests and references | Retain; absorb the consumer contract-page scope | Keep the active contract ADR and `site/commands.md`. Revisit recurring maintenance overhead, an explicit extraction spec or a reader request; evaluate each separately. |
| `skills-catalogue` | 2/10: brownfield stubs exist, but no additional catalogue request | 5/10: curate tool skills and maintain another picker | Retain with the shipped picker distinguished | Use `skills` for packaged skills and suggest-and-stub for repo tools. Revisit a concrete unmet tool-skill need or an explicit catalogue spec. |
| `test-sync-package` | 3/10: later local use is recorded, consumer demand is not | 4/10: prove the adapted rules travel beyond this suite | Retain; record the later-use evidence | Keep the local skill. The complete trigger still needs evidence of no false-orphan judgment on later work, or an explicit request to ship. A passing suite alone does not prove the judgment. |
| `grok-cloud-runtime` | 1/10: the product is still unspecified | 5/10: research, wire and verify another runtime | Retain; correct the stale three-runtime and mandatory-successor claims | Name the product and its documented repository load path first. A new runtime id is additive under the current contract; other changes need separate review. |
| `non-interactive-setup` | 2/10: a machine image is still an idea | 6/10: duplicate the agent's layout and convention choices in flags | Retain; correct premature doctor availability | Existing setup flags suffice for its own choices. Revisit an actual image build or CI/provisioning request. |
| `multi-repo-install` | 2/10: a multi-repository client is prospective | 7/10: per-repository config and commit/PR selection | Retain; remove adoption alone as a proxy for need | Use one harness home per repository. Revisit a pilot demonstrating why that arrangement fails. |
| `docs-root` | 2/10: no unresolved collision in the reviewed evidence | 7/10: coordinate validation, templates and search paths | Retain; account for the maps folder shipped by [PR #57](https://github.com/WolvenTech/wolven-harness/pull/57) | Keep `docs/` and the collision check. Revisit actual immovable governed content or a site-generator conflict. |
| `adr-4digit` | 1/10: no consumer warning recorded | 6/10: numbering, mixed tokens and migration rules | Retain | Keep `adr-unrecognized` warning visibility. Revisit a consumer's actual four-digit layout or an explicit spec. |
| `claim-waivers` | 2/10: examples show a risk, not a blocked consumer | 5/10: new waiver syntax and claim-scanning behavior | Retain | Reword a claim where possible. Revisit an unavoidable false positive or a consumer using a broad ignore to silence it. |
| `default-branch-guard` | 2/10 for the additional consumer installer: no post-remediation bypass recorded | 8/10: hook-manager conflicts and runtime command parsing | Retain the additional installer deferral; keep existing safeguards | PR #41's hooks and rule remain. Revisit a write despite enforced remote protection or an explicit spec. Closure of #40 does not mean consumer adapters shipped. |
| `iteration-enforcement` | 1/10: no confusing numbering gap or request to fail CI | 4/10: new enforcement and a breaking-severity transition | Retain | Keep warning-level checks. Revisit a real confusing gap or an explicit request for CI failure. Closure of issue #37 only establishes the iteration-doc workflow. |
| `service-blueprint` | 2/10: a liked prototype, no real grid deliverable request | 7/10: lane semantics, blueprint lines and another layout | Retain separately from architecture maps | Use journey-map action paths. Revisit a discovery engagement requiring a grid or a real frontstage/backstage request. Preserve the prototype as evidence. |

## Scope and follow-through

The new PRDs follow the project create-prd template. `grilling did not run`
because it is absent from the runtime's session skill list. Both remain
`draft`, with Human-owned open questions; neither authorizes code or settles
an ADR. The `adr` skill is also absent from that list, and no new durable
architecture decision was made here.

Links into the promoted architectural-map record now point to its PRD.
Archived cloud-spec deferral pointers now name the consolidated record;
historical resume logs keep their original path observations. The existing
archived wayfinder deferral stays archived: PR #57 already delivered it.

The cleanup does not reopen closed issues or modify the open PR stack.
Issue #66's folder-replacement design remains open, and drift reporting
does not by itself resolve it. Publishing an upgrade guide must wait for
an identified target release; merging a PR alone is not a release signal.

## Verification

- Build, lint, validate, comments and score passed using
  `pnpm --config.verify-deps-before-run=false <command>` with the installed
  dependencies. Plain `pnpm build` first attempted a dependency reinstall
  and stopped with `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`; the explicit
  option avoids that environment-specific preflight, not the checks.
- Validate: 112 claims OK, zero legacy warnings and zero failures. Comments:
  zero findings. Harness score: L3, 83/83.
- Changed Markdown links resolve locally; `git diff --check` passes. Active
  deferral files counted on disk: 14.
- No runtime or test files changed; the full runtime test suite was not run
  for this documentation cleanup.
- Required `qmd update` and `qmd embed` both failed with
  `qmd: command not found`; the local search index could not be refreshed.

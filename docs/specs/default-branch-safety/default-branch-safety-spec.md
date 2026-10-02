---
type: spec
title: Default branch safety
description: Define local branch guards, runtime hook installation, and remote PR enforcement without expanding consumer setup permissions.
status: draft
---

# Default branch safety

**Source:** [Approved PRD](../../prds/default-branch-safety/default-branch-safety-prd.md), status `stable`; [incident #40](https://github.com/WolvenTech/wolven-harness/issues/40).
**Next:** Human approval of this spec, then `code-plan`. No implementation or live protection change is authorized by drafting this spec.
**Named proof:** `proof-default-branch-safety-spec-obligations`.

**Scope addendum:** Rafael subsequently requested removal of the incident
commit and the video files altogether during cleanup. This explicitly expands
the approved PRD's original non-goal of video remediation. It records the
cleanup outcome, not authorization to rewrite shared history now.

## Repository grounding

| Surface | Present today | Role |
| --- | --- | --- |
| `src/git.ts` | Git subprocess helpers | Setup can reuse argument-array execution; no evaluated command input |
| `src/setup/{apply,index,runtimes,summary,types}.ts` | Missing-path templates, runtime wiring, grouped summary | Install hooks and report partial protection without overwriting files |
| `src/setup/skill-sets.ts` | Core always installed; ship optional | Standing rule and guard install independently of optional ship skills |
| `templates/.agents/{rules,hooks,skills}/` | Rules and skills; hooks placeholder | Consumer distribution source |
| `.agents/hooks/README.md`, `.agents/skills/code-{commit,pr,execute}/` | Hooks placeholder; branch gate only in PR skill | Package repo must use the same guard and recovery policy |
| `package.json` | Biome pre-commit via simple-git-hooks; Node 22 floor | Keep Biome and add safety before it; no new dependency |
| `test/helpers/fixture.ts`, `test/setup-{apply,runtimes,surfaces}.test.ts`, `test/contract.test.ts` | Temp repositories and setup/contract tests | Meaningful integration evidence and preservation regression checks |
| `.github/workflows/{ci,release}.yml` | PR CI; release PR and manual publishing | Required merge path and release compatibility |
| ADR-003 | Stable public setup contract | No editing existing consumer files, AGENTS.md, dependencies, or existing command contracts |
| `.harness-score.json` | `no-hooks` preset | Assess relevant hook checks after installation; score is not safety proof |

QMD searched ADRs before widening to the approved PRD. Terms remain those
already used: setup, standing rules, runtime wiring, default branch, and
feature branch. A **guard** is the proposed deterministic local program
that returns allow/deny plus a recovery reason; it is not a new permission
framework. New paths below are proposed surfaces, not files present today.

## Surface walk

- **In scope:** setup wiring/summary, existing Git helpers where needed;
  proposed `templates/.agents/hooks/branch-safety.mjs` and Git entry scripts,
  mirrored under `.agents/hooks/`; standing branch-safety rule; commit/PR/execute
  and harness-init text in both local and shipped trees; runtime configuration
  created only when absent; this repo's `package.json` hook commands; focused
  fixture tests; existing setup/package/contract tests; relevant README,
  CONTRIBUTING and site guidance; hook score configuration after evidence.
- **Remote scope:** this repository's existing main protection only, as a
  separately authorized operational change after local gates pass.
- **Cleanup scope:** remove `video/harness-explainer.mp4` and
  `video/harness_explainer.py` altogether, not merely restore their versions
  before the incident; remove incident commit
  `8a1154186356ee9eb39c735b2ca519e1c0bc0f85` from the agreed published branch
  history under the cleanup strategy resolved below.
- **Unchanged:** CLI command set and exit codes, config schema version,
  dependency set, consumer AGENTS.md, existing consumer files, npm OIDC
  publishing, merge ownership/review count, consumer GitHub settings.

## Design

### Policy and branch context

One shipped Node program uses standard libraries and Git. It must work
without a consumer installing this package as a dependency or running npx;
Node 22 and Git remain existing prerequisites. It receives structured input,
never executes the proposed tool command, and separates decisions from runtime
response formatting. Hooks do not commit, stage, stash, reset, or switch branches.

For local commit checks, use the repository's cached symbolic
`refs/remotes/origin/HEAD`; do not guess from names such as main/master.
Missing or inconsistent context denies the write and explains how to refresh
the default-branch reference. For pushes, resolve the actual destination
remote's advertised HEAD using `git ls-remote --symref <destination> HEAD`,
with noninteractive authentication and a bounded timeout. A URL destination
and a second named remote must not inherit origin's default branch assumption.
This is Git ref discovery at write time, not inspection of GitHub protection
settings during consumer setup. Missing, detached, malformed, inaccessible,
or ambiguous context denies the relevant write without touching files.

Before commit/push, skills check context. On the default branch, create a
fresh feature branch at current HEAD, retaining staged and unstaged work;
follow repository naming conventions and do not reuse an occupied name.
A failed branch creation stops before commit. Detached HEAD requires the
maintainer's choice of branch base; unknown default branch blocks writes
but leaves editing available. Never override a rejected push by changing
its destination to main or disabling a hook.

### Git hooks

The pre-commit entry rejects commits on the resolved default branch or in
unresolved/detached context. The pre-push entry consumes Git's resolved
stdin ref tuples and rejects the entire push if any destination is
`refs/heads/<default>`, including deletion and mixed-ref updates. It must
not depend on the current branch or on the spelling of a command/refspec.
Other fully resolved destinations remain allowed.

Use Git's effective hooks location, including linked worktrees. Create
missing executable entries only. Existing user hooks, symlinks, or external
hook directories are never replaced or edited by consumer setup. An existing
entry is considered installed only if it is the expected harness entry;
otherwise report pending integration. Do not change global or local
`core.hooksPath` to seize control of unrelated hooks. Setup reruns neither
duplicate registrations nor replace an old user-owned file.

This package repo can deliberately prepend the guard to its existing
simple-git-hooks pre-commit command and add pre-push, retaining Biome's
exact invocation and failure semantics. Consumer setup does not edit their
package manager hook configuration. Guidance supplies the manual integration
needed for an existing hook manager and warns that another manager can replace
the installed entries. Installation state never implies immutable enforcement.

### Agent runtime hooks

| Runtime | Proposed project surface | Adapter |
| --- | --- | --- |
| Claude Code | `.claude/settings.json` | Synchronous `PreToolUse` for shell writes; deny using documented protocol |
| Codex | `.codex/hooks.json` | Synchronous `PreToolUse`; report hook-trust review pending |
| Cursor | `.cursor/hooks.json` | `beforeShellExecution`, with `failClosed: true` |

The hook examines simple direct Git commit/push commands, honors explicit
working-directory selection, and denies recognized writes it cannot safely
resolve. Read-only Git operations and file editing remain allowed. Compound
or indirect commands are not claimed to be fully interpreted: the actual Git
hooks and GitHub enforce the destination boundary. No shell parser dependency,
general command allowlist, or arbitrary MCP schema registry is introduced.
API writes bypass Git hooks, so remote enforcement is mandatory here.

Create missing runtime config files with the native schema, resolving guard
paths from the repository root even when the runtime starts in a subdirectory.
Existing settings remain byte-identical; report pending manual integration
when the registration is missing. Guard files can still be installed.
If the installed runtime lacks the event/capability, report unsupported and
retain the other layers. Never silently set runtime trust or claim active
coverage without runtime evidence. Handler input errors return the native
deny response; infrastructure failures outside the handler remain documented
runtime limitations, not evidence that all layers fail closed.

### GitHub enforcement and release compatibility

Keep classic branch protection: require the existing strict `CI` check and
PR integration with the current review count. Enable admin enforcement through
the narrow admin-protection endpoint, preserve all other settings, and verify
there are no user/team/app PR bypass allowances. No new ruleset system is needed
unless evidence shows the current mechanism cannot satisfy these requirements;
that would require spec revision. Do not introduce a release-bot bypass.

The existing release job updates a feature-branch release PR; tagging and npm
publication do not constitute direct main writes. Preserve that split and
manual publishing. Prove compatibility before claiming completion; a passing
lint gate is not remote protection evidence. Operators with administration
permission can change protection settings; this design prevents ordinary
direct writes under the configured policy, not deliberate reconfiguration
by an administrator. Agent credentials should not receive new administration
permissions; separating existing admin credentials is an operational follow-up.

### Incident cleanup

The cleanup removes both tracked video files, including the generator and
binary introduced before the incident. Remove any tracked references that
would point to deleted assets, and verify the resulting repository still
passes its gates. Preserve unrelated changes and commits.

The requested commit removal is distinct from deleting files or creating a
revert commit: a revert leaves the incident commit in history. A literal
removal from published history needs a separately approved history strategy,
including affected branches/tags, collaborator coordination, and a resolution
of its conflict with the no-direct-write/no-bypass policy. Do not silently
substitute a revert for the requested removal, force-push, or disable
protection. Cleanup remains blocked on that decision; local safeguards and
the spec review can proceed independently.

Commit-history removal does not promise deletion of cached GitHub objects,
PR records, forks, or copies already held by collaborators. The agreed
verification boundary must be published refs rather than physical erasure
from every copy of the repository.

## Requirements (obligation ↔ proof)

Every proof names a distinct fixture case or evidence record. Local cases
belong in proposed `test/default-branch-safety.test.ts` or the existing setup
tests and run through `pnpm test`. Remote cases require separately authorized
integration verification; no unsafe live probe belongs in the unit suite.

| ID | Obligation | Named proof | Evidence shape |
| --- | --- | --- | --- |
| R1 | AC-1.1: validated feature branch commits, pushes and opens a PR | `proof-safe-feature-work` | Temp local/bare remote fixture succeeds; subsequent feature PR remains possible |
| R2 | AC-1.2: skill recovery creates a fresh feature branch; raw default-branch commit is rejected | `proof-main-recovery` | Skill text + executable pre-commit fixture; HEAD/stage/work hashes preserved before recovery; commit allowed after switch |
| R3 | AC-1.3: reject any push tuple targeting the remote default branch | `proof-push-destination` | Non-main local branch, HEAD:main, deletion, mixed refs and second-remote cases rejected; bare remote refs unchanged |
| R4 | AC-1.4: detached checkout stops for maintainer choice | `proof-detached-recovery` | Policy/skills + fixture deny; no branch created or checkout moved |
| R5 | AC-1.5: unknown default branch blocks writes, permits editing | `proof-unknown-default` | Missing/malformed default ref fixture; commit/push deny, ordinary file edits unchanged |
| R6 | AC-2.1: approved PR integration remains allowed | `proof-approved-pr-integration` | Authorized test environment accepts checked PR merge; actual repo configuration preserves CI/review requirements |
| R7 | AC-2.2: admin credential cannot directly update main | `proof-admin-direct-write` | Disposable protected-repository integration rejects fresh admin update; evidence distinguishes admin permission and rejection cause |
| R8 | AC-2.3: bypassed local checks and API transport cannot update main | `proof-remote-final-barrier` | Independent direct Git and API probes in disposable protected environment rejected; refs compared before/after |
| R9 | AC-2.4: no human or automation bypass | `proof-no-exceptions` | Actual main protection readback: admin enforcement on, no PR bypass allowances; release job behavior reviewed/verified |
| R10 | AC-3.1: install core policy, Git hooks and supported runtime registrations by default | `proof-default-installation` | Setup fixtures with ship and skills=none; packed-package guard runs without consumer package dependency |
| R11 | AC-3.2: existing hook conflicts preserve content and report pending protection | `proof-hook-conflict` | Byte hashes of existing hooks/settings/symlinks unchanged; setup exit 0 and actionable pending message |
| R12 | AC-3.3: unsupported/untrusted runtime layer is reported honestly | `proof-runtime-capability` | Adapter input/output fixtures for all runtimes; unsupported and trust-pending cases never labeled active |
| R13 | AC-3.4: consumer setup provides guidance without inspecting GitHub | `proof-consumer-host-boundary` | Setup fixture records zero host API/network calls; guidance includes administrator enforcement and no-bypass policy |
| R14 | Guard retries/install reruns are idempotent and race-safe | `proof-install-retry` | Two reruns and simultaneous create attempts preserve foreign bytes and avoid duplicate entries; failure stays pending |
| R15 | Remote discovery failures deny writes without interactive hangs | `proof-discovery-failure` | Timeout/auth/unresolvable destination fixtures yield bounded denial and recovery reason; no credential output |
| R16 | Guard state/logging preserves work and reports the denied operation | `proof-guard-diagnostics` | Capture allow/deny output; branch, destination, reason and next action present, no command payload/secrets logged |
| R17 | Cleanup removes both video files and repairs tracked references | `proof-video-files-removed` | `git ls-files video` and tracked-reference inspection show neither asset nor dangling reference; repository gates pass |
| R18 | Cleanup removes the incident commit from the explicitly agreed published history while preserving unrelated work | `proof-incident-commit-removed` | After approved history strategy, `git merge-base --is-ancestor 8a1154186356ee9eb39c735b2ca519e1c0bc0f85 <agreed-ref>` returns 1 for every agreed ref; preserved commits/content verified against pre-cleanup snapshot |

## Nine-dimension landings

| Dimension | Landing kind | Landing |
| --- | --- | --- |
| validation | obligation ↔ proof | R3: resolved push tuples rather than command spelling; R10: native adapter schemas |
| failure modes | obligation ↔ proof | R11: non-destructive pending installation; R12: unsupported/trust pending |
| idempotency and retry | obligation ↔ proof | R14: exclusive missing-file creation, no duplicate registration |
| authorization | obligation ↔ proof | R7–R9: privileged writes rejected and no bypass; R13: no consumer host inspection |
| concurrency and ordering | obligation ↔ proof | R14: exclusive installation; R2: branch creation must succeed before commit; R3: evaluate every tuple before allowing push |
| data lifecycle | obligation ↔ proof | R2/R4/R11: retain work and existing configuration; no stash/reset or secret-bearing logs |
| external-dependency failure | obligation ↔ proof | R15: bounded Git remote lookup; R12: runtime limits reported |
| state transitions | obligation ↔ proof | R2/R4/R5: default → feature, detached → awaiting choice, unknown → blocked; R11/R12: installed/pending/unsupported |
| observability | obligation ↔ proof | R16: denial reason and recovery action; setup reports each layer independently |

## Waves

These are safety boundaries, not executable work units or a plan.

- **Local protection:** guard, setup and skills, with fixture and packed-package
  proofs. Gate: `pnpm build && pnpm test && pnpm lint && pnpm validate && pnpm comments && pnpm score && git diff --check`.
- **Remote integration:** separately authorized GitHub configuration and
  integration evidence. Entry requires the local gate to pass. Gate: readback
  of main protection with `gh api repos/WolvenTech/wolven-harness/branches/main/protection`
  plus the distinct remote proof records R6–R9. No automatic merge or publish.
- **Incident cleanup:** requires resolution of `U-cleanup-history` before
  execution. Gate: R17–R18 evidence plus the full local gate above. This
  boundary must preserve enforcement rather than create an unapproved bypass.

A failed gate stops before the next boundary. `code-plan` must encode those
stops; this document does not assign implementation order within a boundary.

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition |
| --- | --- | --- | --- | --- |
| `U-remote-proof-environment` | Choose an authorized disposable GitHub repository and credentials for real rejection/merge proofs | Rafael | Blocks remote integration proof execution | Specify the concrete test target before any probe; never attempt an accepted test write on production main |
| `U-runtime-proof-access` | Confirm available runtime versions and trusted sessions for live hook activation evidence | Maintainer implementing the spec | Blocks claiming runtime activation beyond schema/fixture tests | Record version and trust state; unsupported/pending is acceptable when explicitly reported |
| `U-cleanup-history` | Resolve literal commit removal, affected published refs, and compatibility with the no-bypass policy | Rafael | Blocks incident cleanup execution and its completion claim | Present a concrete history strategy for explicit approval; no force-push or protection change is authorized by this spec update |

## Out of scope

Consumer GitHub API calls or configuration; branch naming/merge ownership
redesign; review-count changes; bootstrap commits in repositories without
resolvable default branch; hooks that parse arbitrary scripts/MCP writes;
immutable protection against admin reconfiguration; erasing all cached or forked copies of the incident;
changing release triggers or npm publishing; a plan or implementation now.

## Pragmatic-guard refuses

No new runtime dependency, permission framework, optional safety-off knob,
new CLI command/config schema, automatic overwrite of consumer configuration,
global Git changes, release bypass, or generalized protection audit service.
Need is an observed incident; scope is the smallest layered response meeting
the approved PRD, with compatibility preserved and partial coverage visible.

## Acceptance

- [ ] R1 — `pnpm test`: proof-safe-feature-work PASS.
- [ ] R2 — `pnpm test` and skill inspection: proof-main-recovery PASS.
- [ ] R3 — `pnpm test`: proof-push-destination PASS.
- [ ] R4 — `pnpm test` and skill inspection: proof-detached-recovery PASS.
- [ ] R5 — `pnpm test`: proof-unknown-default PASS.
- [ ] R6 — authorized integration evidence: proof-approved-pr-integration PASS.
- [ ] R7 — authorized disposable-repo probe: proof-admin-direct-write PASS.
- [ ] R8 — authorized Git/API probes: proof-remote-final-barrier PASS.
- [ ] R9 — `gh api repos/WolvenTech/wolven-harness/branches/main/protection` and release evidence: proof-no-exceptions PASS.
- [ ] R10 — `pnpm test` including packed-package fixtures: proof-default-installation PASS.
- [ ] R11 — `pnpm test`: proof-hook-conflict PASS.
- [ ] R12 — `pnpm test` and recorded runtime activation evidence: proof-runtime-capability PASS.
- [ ] R13 — `pnpm test`: proof-consumer-host-boundary PASS.
- [ ] R14 — `pnpm test`: proof-install-retry PASS.
- [ ] R15 — `pnpm test`: proof-discovery-failure PASS.
- [ ] R16 — `pnpm test`: proof-guard-diagnostics PASS.
- [ ] R17 — `git ls-files video`, reference inspection and local gates: proof-video-files-removed PASS.
- [ ] R18 — agreed-ref ancestry checks after approved cleanup: proof-incident-commit-removed PASS.

## Eval / gates

| Gate | Command / check | When | PASS | Abort |
| --- | --- | --- | --- | --- |
| Integrity | `pnpm build && pnpm validate && pnpm comments && git diff --check` | Every changed batch | Exit 0 | Fix before continuing |
| Runtime regression | `pnpm test && pnpm lint && pnpm score` | Local protection boundary | All exit 0; relevant hook scores not excluded without reason | Do not configure remote |
| Consumer integrity | `wolven-harness validate` in packed-package fixtures | Local protection boundary | Exit 0 after safe feature-branch install commit | Fix consumer output |
| Remote proofs | R6–R9 evidence and main protection readback | Authorized remote boundary | All distinct proofs hold; existing CI/PR policy retained | Do not claim remediation complete |
| Spec obligations | Structural command below, plus manual source/AC review | Before `code-plan` | One named proof per obligation/acceptance, all 13 PRD ACs mapped and all nine dimensions landed | Do not plan |

`proof-default-branch-safety-spec-obligations` is this real, doc-only command;
it does not assert implementation acceptance:

```sh
python3 - <<'PY'
import re
from pathlib import Path
p = Path('docs/specs/default-branch-safety/default-branch-safety-spec.md').read_text()
prd = Path('docs/prds/default-branch-safety/default-branch-safety-prd.md').read_text()
rows = re.findall(r'^\| (R\d+) \| (.*?) \| `(proof-[^`]+)` \|', p, re.M)
assert len(rows) == 18
assert len({r[0] for r in rows}) == len(rows)
assert len({r[2] for r in rows}) == len(rows)
acs = set(re.findall(r'^#### (AC-\d+\.\d+):', prd, re.M))
mapped = set(re.findall(r'AC-\d+\.\d+', '\n'.join(r[1] for r in rows)))
assert len(acs) == 13 and acs == mapped
boxes = re.findall(r'^- \[ \] (R\d+) — .*?(proof-[\w-]+) PASS\.', p, re.M)
assert set(boxes) == {(r[0], r[2]) for r in rows}
dimensions = ['validation', 'failure modes', 'idempotency and retry',
    'authorization', 'concurrency and ordering', 'data lifecycle',
    'external-dependency failure', 'state transitions', 'observability']
assert all(re.search(r'^\| ' + re.escape(d) + r' \| obligation ↔ proof \|', p, re.M) for d in dimensions)
assert 'status: stable' in prd and 'status: draft' in p
print('spec obligations: 18 pairs, 13 PRD criteria, 9 dimensions')
PY
```

## Cross-domain leak table

| Leak | Refuse / route |
| --- | --- |
| Live GitHub settings while drafting | Separately authorized remote integration boundary |
| Incident attribution | Incident investigation; file/history cleanup is now in scope under the explicit addendum |
| Consumer protection audit service | Out of approved setup scope; instructions only |
| Plan units or implementation | `code-plan` after Human approves this spec |
| Release publication or PR merge | Existing separately authorized release/merge workflow |

## ADR

The `adr` skill created a draft decision record titled **Default branch
writes require PR integration** for the durable layered boundary. It must be
reviewed and promoted explicitly before any file cites it as a stable claim.
ADR-003 remains in force; no supersession is proposed because consumer
installation preserves the existing-file contract.

## Primary-source evidence

Checked 2026-10-02; runtime capability must be verified again against the
versions used during implementation. Documentation supports the adapter
design, not a claim that these hooks have been installed or exercised here.

- [Git hooks](https://git-scm.com/docs/githooks): pre-commit/pre-push invocation and resolved push tuples; local hooks are bypassable.
- [Claude hooks](https://code.claude.com/docs/en/hooks): project settings, synchronous pre-tool decisions, and workspace trust.
- [Codex hooks](https://learn.chatgpt.com/docs/hooks): project hook definitions, pre-tool denial, explicit trust review, and tool coverage limits.
- [Cursor hooks](https://cursor.com/docs/hooks): project definitions and failClosed option for hook execution failures.
- [GitHub branch protection API](https://docs.github.com/en/rest/branches/branch-protection): narrow admin-enforcement endpoint and PR bypass allowances.
- Repository API inspection during this spec: main still requires strict CI and zero-review-count PR integration, with admin enforcement disabled. No remote setting was changed.

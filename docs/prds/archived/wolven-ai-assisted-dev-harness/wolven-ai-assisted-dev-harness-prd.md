---
type: prd
title: Wolven AI Assisted Development Harness
description: Package-first portable agent harness extracted from One-Man-Team — thin npm util with fail-closed ADR claim-path, brownfield dogfood, post-install init wizard (agent skill session), internal Wolven/org scope.
status: stable
tags: [prd, cynefin-complicated, dice, harness, npm, wolven, corporate, init-wizard, code-lane]
generated: { by: cursor/writer, at: 2026-09-23T20:08:41Z }
updated: { by: claude-code/code-execute, at: 2026-09-26T21:00:00Z, note: "Sweep excludes harness-init (spec B record); earlier: sweep gate globs follow the comment gate into src/comments/ and drop wayfinder (spec D record); earlier: shipped-artifact language, comment gate port, builder final check, comment-ruleset deferral (rafael/grilling 2026-09-25)" }
---

# Wolven AI Assisted Development Harness

**Cynefin:** Complicated
**Why Complicated:** Cause and effect exist — OMT already proves a working harness pattern — but extract boundary, validate/ADR binding, brownfield install acceptance, and post-install skill landing need expert analysis. Sense → analyze → respond.

**DICE (run silently; cleared before draft approval)**

| Factor | Score (1–4, lower better) | Note |
|--------|---------------------------|------|
| Duration (D) | 2 | Package-first MVP reviewable after brownfield install + claim-path proof |
| Integrity (I) | 2 | Solo CEO + agents; OMT harness exists to extract from |
| Commitment C1 | 1 | Rafael owns Corporate / Tools & Processes enablement |
| Commitment C2 | 1 | Only Rafael until a brownfield consumer exists |
| Effort (E) | 2 | Extract/validate above BAU; sales-charter cut from critical path |

**Score:** D + 2I + 2C1 + C2 + E = 2 + 4 + 2 + 1 + 2 = **11 (Win)** — package-first after council Option 1 / CC1=A cut sales-charter from the critical path. Init-wizard addendum (LC1=A, 2026-09-24) does **not** reopen DICE.

**Verdict:** follow
<!-- Record once; do not restate on Idea/framing. -->

**Framing:**
- docs/prds/archived/wolven-ai-assisted-dev-harness/wolven-ai-assisted-dev-harness-problem.md
- docs/prds/archived/wolven-harness-init-wizard/wolven-harness-init-wizard-problem.md (init-wizard addendum)

**Executor:** code

## Overview

- **Problem:** Non-OMT Wolven/OMT-adjacent code repos lack an installable OMT-derived harness with shared fail-closed ADR/architectural canon — today is manual copy/adapt or none. After install, agents also lack a guided path to discover project context/lifecycle/tools and land a capped set of architectural skills — today is ad-hoc improvisation.
- **Who:** Rafael (Corporate / Tools & Processes) and agents in Wolven or OMT-adjacent code repos that are not One-Man-Team.
- **Why:** OMT already demonstrates the pattern; without a portable extract plus a thin post-install init wizard, each repo reinvents harness residue or ships without governed architecture claims and without repeatable first architectural skills.

### Solution summary

Ship a thin, portable agent-harness npm package (new dedicated repo, extract from OMT, internal Wolven/org scope) that install/init takes over the agent harness in a consumer repo — AGENTS entry, skills/hooks skeleton, validate spine, QMD-indexable docs layout, shallow OKF-derived writing template/profile, and fail-closed ADR checks on code-architecture claims. After install, an **init wizard** runs as an **agent skill session** (not CLI): discover project context / lifecycle / decided tools → quick research (repo/QMD first, optional short bounded web) → suggest **2–4** architectural skills + scaffold stubs, and instruct the Human to define agentic instructions for that tool/field until a skills catalogue exists. Accept via brownfield install into ≥1 existing or OMT-adjacent consumer (not a greenfield sales-charter app).

### Target users

- Primary: Rafael (Corporate enablement sponsor) and agents operating in non-OMT Wolven/OMT-adjacent code repos
- Secondary: Future internal consumers after first brownfield dogfood is green

## Goals & success metrics

| Goal | Signal | Target |
|------|--------|--------|
| Installable thin core | Install/init yields known harness surfaces | AGENTS + skills/hooks skeleton + validate spine + QMD-indexable docs layout |
| Architectural canon | Fail-closed on code-architecture claims | Claim without matching/valid ADR fails validate (claim-path only) |
| Writing executions | Shallow template wired in | Thin profile file + small lint/validate rule subset (not full OKF-PROFILE) |
| Brownfield dogfood | Package used in a real consumer | ≥1 existing or OMT-adjacent repo green (not sales-charter greenfield) |
| Internal distribution | Package published for org use | Internal npm under Wolven/org scope; exact name later |
| Post-install init wizard | Guided skill session after install | Discover context/lifecycle/tools → research → suggest 2–4 architectural skills + stubs; instruct Human to define agentic instructions (catalogue deferred) |

**Non-goals:** ClickUp board skills; Area canon; full OKF-PROFILE port; okf-qmd-kit coupling; public OSS in v0; sales-charter Next.js app as dogfood bed; locking the exact npm package string in this PRD; Wolven-tailored skills **catalogue picker** (deferred — docs/deferrals/skills-catalogue/skills-catalogue-deferral.md); second harness PRD.

## Scope

**In**

- New dedicated repo extracted from OMT harness surfaces (G5)
- Thin portable core: AGENTS entry, skills/hooks skeleton, validate spine (G1, G4)
- Shallow OKF-derived writing template/profile as thin profile + small lint/validate subset (G1, OQ1=B)
- QMD-indexable docs layout + ADR architectural canon in validate (G3, G4)
- Fail-closed claim-path when code-architecture claims lack matching ADR or ADR frontmatter/status is invalid (OQ2=A)
- Internal-first distribution under Wolven/org npm scope (G2, G5, OQ4=A deferred name)
- Brownfield install acceptance into ≥1 existing or OMT-adjacent consumer (CC1=A / revised OQ3)
- Post-install **init wizard** as agent skill session (not CLI) — Q2=B
- Discovery of project context, lifecycle, and decided tools → research repo/QMD first, optional short bounded web — Q4=A
- Suggest **2–4** architectural skills + scaffold stubs; instruct Human to define agentic instructions for tool/field until catalogue exists — Q5=A, Q3=B+carve-out
- Use composy/kb as a **capability benchmark** for the discovery/research step (not primarily a dogfood consumer) — Q0

**Out**

- ClickUp board skills and Area canon (G1)
- Full OKF-PROFILE / okf-qmd-kit product coupling (OQ1, G3)
- Public OSS publication in v0 (G2, OQ5=A)
- Sales-charter Next.js app (project charters + Gantt + prices) as v0 dogfood — deferred to docs/deferrals/wolven-harness-sales-charter-dogfood.md
- Exact npm package identifier (choose at scaffold / code-spec)
- Skills **catalogue picker** / marketplace — deferred to docs/deferrals/skills-catalogue/skills-catalogue-deferral.md
- Second harness PRD (init wizard is an amend of this file only — Q1=A)
- Init wizard as a standalone CLI (Q2=B locks agent skill session)

**Future considerations**

- Public OSS gate criteria after first internal brownfield dogfood is green (OQ5)
- Sales-charter dogfood when deferral triggers fire
- Broader internal roll beyond the first brownfield consumer
- Skills catalogue picker when deferral triggers fire

## Limits

- Does not authorize implementation (no Code execute from this file alone).
- Does not reopen completed discovery or duplicate Framing (probe / classification / cheaper-than-building stay on the cited `problem.md` files).
- Does not authorize ClickUp board / Area / okf-qmd-kit / public OSS / sales-charter app / catalogue-picker work under this PRD.
- Does not invent a second harness PRD for the init wizard.
- Implementation still requires `code-spec` → plan → execute after this approved PRD (no Code execute from this file alone).

## Core capabilities

1. **Install/init takeover** — Consumer installs the package and gets AGENTS entry, skills/hooks skeleton, validate spine, and QMD-indexable docs layout.
2. **Fail-closed ADR claim-path** — Validate fails when a code-architecture claim lacks a matching ADR or the ADR frontmatter/status is invalid (claim-path only).
3. **Shallow writing profile** — Thin profile file plus a small lint/validate rule subset wired into writing executions.
4. **Internal package distribution** — Publish under a Wolven/org npm scope for internal/OMT-adjacent consumers (exact name deferred).
5. **Post-install init wizard** — Agent skill session after install: discover context/lifecycle/tools → repo/QMD (+ optional short web) research → suggest 2–4 architectural skills + stubs; instruct Human to define agentic instructions while catalogue is deferred.

## User experience

1. Human approves this PRD (`status: stable`) and handoff proceeds on the Code lane.
2. Agents scaffold the dedicated repo, extract the thin core from OMT, and publish internally under Wolven/org scope.
3. Operator installs/inits the package into ≥1 existing or OMT-adjacent consumer repo and confirms harness surfaces.
4. Operator (or CI) runs a claim-path proof: a code-architecture claim without a valid ADR fails validate.
5. After install, operator runs the **init wizard** skill session: guided discovery → research → 2–4 skill suggestions + stubs; Human is told to define agentic instructions for each suggested tool/field (no catalogue pick).
6. Brownfield dogfood green (install + claim-path + wizard landing) closes the MVP acceptance bar; sales-charter, OSS, and catalogue picker remain deferred.

## High-level constraints

- Corporate Area enablement (docs/canon/area-context-index.md) — not Delivery client outcomes or Growth SKU in v0.
- Internal-first; public OSS only behind a later explicit gate (G2).
- No okf-qmd-kit coupling; QMD + ADR architectural canon in (G3).
- No implementation prescriptions (no DB/framework/API design here).
- Init-wizard script/prompt detail and stub filesystem layout land in `code-spec`, not this PRD (LC1=A).

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Extract drags OMT board/Area residue into the package | Hard Out list; pragmatic-guard on board skills / Area canon |
| Greenfield dogfood invents product work beside the harness | CC1=A — brownfield acceptance only; sales-charter deferred |
| ADR gate too broad (blocks unrelated docs) | OQ2=A — claim-path only |
| Writing template balloons into full OKF-PROFILE | OQ1=B — thin profile + small rule subset |
| Init wizard expands into catalogue/marketplace | Q3 carve-out + deferral docs/deferrals/skills-catalogue/skills-catalogue-deferral.md |
| Wizard becomes a CLI product | Q2=B — agent skill session only |
| Worry/Woe DICE drift | Re-score if review cadence, team, commitment, or load slips |

## Phased plan

### MVP

- Dedicated repo + thin portable core extract
- Install/init surfaces (AGENTS, skills/hooks skeleton, validate, QMD-indexable docs)
- Thin writing profile + claim-path fail-closed ADR checks
- Brownfield install green in ≥1 existing or OMT-adjacent consumer
- Internal publish under Wolven/org scope (name at scaffold)
- Post-install init wizard skill session (discovery → research → 2–4 skills + stubs + instruct Human)

### Later

- OSS pull criteria and public gate (after internal dogfood green)
- Sales-charter app if deferral triggers fire
- Additional internal consumers beyond the first brownfield bed
- Skills catalogue picker if deferral triggers fire

## Acceptance

- [ ] Brownfield install of the package into ≥1 existing or OMT-adjacent consumer repo (not greenfield sales-charter)
- [ ] One fail-closed claim-path run (agent/code-architecture claim without valid ADR fails validate)
- [ ] Install/init yields AGENTS + skills/hooks skeleton + validate spine + QMD-indexable docs layout
- [ ] Post-install init wizard skill session runs: discovers context/lifecycle/tools, researches repo/QMD (optional short web), suggests 2–4 architectural skills + stubs, and instructs Human to define agentic instructions (no catalogue pick)
- [x] Human re-approved this PRD after init-wizard addendum (`status: stable`) before handoff — 2026-09-24

## Addendum — grilling 2026-09-24

Human-approved (Q21) after the TAP grilling. Supersedes the conflicting lines above; everything else stands. Execution splits into four Entregas, each with its own spec (docs/prds/archived/wolven-ai-assisted-dev-harness/wolven-ai-assisted-dev-harness-project.md).

**Locked names (OQ4 closed):** repo `WolvenTech/wolven-harness` · package `@wolventech/wolven-harness` on GitHub Packages · command `wolven-harness`.

**Scope In (added)**

- `init` asks git host (`gh` | `bit`) and runtimes (`claude` | `codex` | `cursor`) and never edits an existing `AGENTS.md`/`CLAUDE.md`; it writes `WOLVEN.md` (full harness entry). Wizard step 0 integrates it into `AGENTS.md` — full, light, or mention-only; `WOLVEN.md` is deleted unless mention-only.
- Legacy ADR mode: ADRs outside the profile format warn about drift and point to an optional wizard migration step; claims to legacy ADRs warn, claims to missing ADRs always fail; only `stable` satisfies a claim in normal mode.
- Portable Code lane: `code-spec`, `code-plan`, `code-execute`, `code-commit`, `code-pr`, `code-review`, `code-ci`, plus an `adr` skill — rewritten portable, builder instructions without a dedicated agent, GitHub via MCP and Bitbucket parity from its docs (open to bugfixes until a Bitbucket consumer exists).
- First consumer (closes the "named consumer" OQ): `WolvenTech/agentic-mkt`, including migration of its legacy ADRs.
- Repo visibility (Q22, 2026-09-24): `WolvenTech/wolven-harness` is **public source** to avoid an outside-collaborator seat. This is not an OSS release: no `LICENSE`, distribution stays internal via GitHub Packages, and the OSS gate (G2/OQ5) is unchanged.

**Acceptance (added)**

- [ ] Entrega D: 7 portable `code-*` skills + `adr` + `create-prd` (spec D decision D-Q6) + utility skills `grilling`, `wayfinder`, `research`, `handoff`, `prototype` (D-Q16) installed, free of One-Man-Team residue, host-aware (GitHub/Bitbucket)
- [ ] agentic-mkt: legacy ADRs migrated through the wizard; `harness:validate` green with no legacy warnings

## Note — shipped-artifact language (2026-09-25)

From the Human's review of WolvenTech/wolven-harness#1 and the follow-up grilling. Planning vocabulary serves only the orchestrator, builders, and the Human; it never ships. That covers requirement, decision, and grilling ids (`R3.1`, `S1`, `Q22`), plan units and waves, proof ids, Entrega/spec letters, "the Human", "later unit", "orchestrator", "builder", and One-Man-Team names or acronyms. None of it may appear in anything a package consumer reads: code comments, runtime messages, identifiers, tests, templates, skills, README, or ADRs. Describe the behavior itself ("fails the writing profile", not "fails R2.2"). Traceability lives in the One-Man-Team spec and plan, never in the package repo.

**Comment gate (comments).** `wolven-harness` carries a port of the One-Man-Team comment gate as repo tooling (`pnpm comments`): added comment lines under `src/`, `test/`, and `scripts/` since the branch point with `origin/main` must be `why:` / `hazard:` / `invariant:` (≤4 lines) or informative JSDoc on a declaration, and must not match its leak rules — change narration, dead citations, and planning ids. It lands on PR #1 as plan unit 15. How consumer repos get it is decided in spec D; the richer ruleset (style hints, JSDoc compatibility) is docs/deferrals/wolven-harness-comment-ruleset.md.

**Sweep (everything else).** Runtime messages, identifiers, README, templates, and ADRs are checked with the sweep below. `\bHuman\b` and the wave pattern can hit legitimate prose; review those hits by hand. The gate's own rule and test files are excluded, since they hold the patterns.

```sh
rg -n -e '\bR[0-9]+\.[0-9]+\b' -e '\b[SQ][0-9]{1,2}\b' -e 'proof-' -e '\b[Uu]nit [0-9]{2}\b' \
  -e '\b[Ww]ave\b' -e '\b[A-D][1-9]\b' -e '\b(spec|Entrega) [A-D]\b' -e '\bHuman\b' -e 'OMT|One-Man-Team' \
  -e 'agentic-mkt' -e 'TODO' -e '(?i)later (unit|wave|step)|orchestrator|\bbuilder\b' \
  --glob '!node_modules' --glob '!dist' --glob '!pnpm-lock.yaml' \
  --glob '!src/comments/leak-rules.ts' --glob '!test/comments-rules.test.ts' \
  --glob '!templates/.agents/skills/code-*/**' --glob '!templates/.agents/skills/adr/**' \
  --glob '!templates/.agents/skills/create-prd/**' --glob '!templates/.agents/skills/grilling/**' \
  --glob '!templates/.agents/skills/research/**' \
  --glob '!templates/.agents/skills/handoff/**' --glob '!templates/.agents/skills/prototype/**' \
  --glob '!templates/.agents/skills/harness-init/**' .
```

The Code lane and utility skills are excluded because they teach units, waves, proofs, builders, and "the Human" as their own vocabulary (spec D decision D-Q1). Spec D moved the comment gate into `src/comments/` as the shipped `wolven-harness comments` command, so the two gate globs now name `src/comments/leak-rules.ts` and `test/comments-rules.test.ts`; `wayfinder` left the package (spec D decision D-Q26), so its glob is gone. `harness-init` joins them because it teaches "the Human" in the same voice (spec B decision B-Q15); its folder still passes spec B's residue grep, which rejects consumer names.

**Builder final check (every unit in Entregas B, C, D):** before returning, each builder runs `pnpm comments` and the sweep over the files it touched and pastes both outputs, which must be empty (hand-reviewed sweep hits excepted, each named). The parent re-runs both over the whole package at every wave gate; an unreviewed hit fails the gate.

## Note — merges, versions, and changelog (2026-09-25)

Human decision after WolvenTech/wolven-harness#1 merged. `WolvenTech/wolven-harness` merges pull requests by squash only. Each PR becomes one commit on `main`, titled from the PR title, so PR titles follow Conventional Commits. Branch SHAs do not survive a squash, so One-Man-Team records cite the squash SHA on `main` once a PR merges (Entrega A: `f33de1d`).

Releases follow SemVer, and the version bump comes from those commits: `fix` is a patch, `feat` a minor, `!` or `BREAKING CHANGE` a major. Every release gets a `vX.Y.Z` tag, a GitHub Release, and a `CHANGELOG.md` entry built from the squashed commits. Spec C designs the workflow: the tool, the first version, the pre-1.0 policy, the repo settings, and a PR-title check. Spec D decides whether the portable `code-pr` carries the PR-title habit to consumers.

## Handoff

| Executor | After human approval |
|----------|----------------------|
| `code` | → `code-spec` → `code-plan` → `code-execute` → `code-commit` |

## Open questions

- ~~Exact npm package string~~ — closed by the grilling addendum
- ~~Named first brownfield consumer~~ — `WolvenTech/agentic-mkt` (grilling addendum)
- Public OSS pull criteria (OQ5=A — after first internal dogfood green)
- Init-wizard skill-session script / prompts (shape in `code-spec`)
- Where scaffolded skill stubs land in a consumer repo relative to harness install layout (`code-spec`)
- How composy/kb capabilities map to the wizard’s discovery/research bar (benchmark compare, not vendoring — `code-spec`)

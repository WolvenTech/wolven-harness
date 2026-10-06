---
type: idea
title: Problem — Portable Wolven AI assisted development harness
description: Non-OMT Wolven code repos lack an installable OMT-derived harness with shared fail-closed ADR/architectural canon; today is manual copy/adapt or none.
status: draft
tags: [problem-statement, harness, npm, wolven, corporate, adr, qmd]
generated: { by: cursor/define-problem-statement, at: 2026-09-23T19:43:00Z }
---

# Problem Statement: Portable Wolven AI assisted development harness

## Situation probe

| Probe | Answer |
|-------|--------|
| Who experiences this, in what situation? | Rafael (solo CEO, Corporate / Tools & Processes) and agents operating in Wolven or OMT-adjacent **code** repos that are not One-Man-Team, when they need a structured agent/code harness plus architectural-design canon. |
| What happens today when they try to get the outcome? | **SP1 = A:** Manual copy/adapt from OMT (or hand-rolled per-repo harness files) — no installable takeover, no shared fail-closed ADR/canon gate. |
| What is evidence vs assumption? | **SP3 = A:** Evidence — OMT has a working harness; non-OMT path is manual copy/adapt or none; G1–G5 lock desired v0. Assumption — frequency and severity of copy-drift pain are not yet measured. |
| What changes if we do nothing for one planning cycle? | **SP2 = A:** Drift continues — new/adjacent repos stay on manual OMT copy or no harness; ADR/architectural canon stays unenforced outside OMT; no installable internal package path forms. |
| Who sponsors a fix, and what is “good enough”? | **SP4 = A:** Sponsor — Rafael (Corporate / Tools & Processes). Good enough — G4: install/init yields AGENTS entry + skills/hooks skeleton + validate spine + QMD-indexable docs layout + fail-closed ADR/architectural-canon checks; one internal/OMT-adjacent dogfood green. |

## Classification

- **Label:** `absence`
- **Why this label:** The needed capability — an installable, non-project-specific code harness with shared fail-closed ADR/architectural-canon enforcement — does not exist for non-OMT repos. Manual copy/adapt is a workaround, not the missing path. This is not primarily friction inside an already-shipped portable product (`pain`), nor a greenfield platform inventing harness concepts from zero (`construction`); OMT already proves the pattern — the portable extract/install path is what is absent.

## Cheaper-than-building

- **Alternative considered:** Keep manual OMT copy/adapt (status quo), or adopt an external agent-harness toolkit without extracting an OMT-derived package.
- **Result:** not viable for the locked outcome
- **Rationale:** Status quo (SP1/SP2) leaves no shared fail-closed ADR/canon gate and no installable internal package. External toolkits may be cheaper to install but do not carry the locked G1/G3 surfaces (thin OMT-derived core, shallow OKF-derived writing template/profile, QMD + ADR architectural canon). Building the thin extract is the cheapest path that matches sponsor good-enough (G4) without dragging board skills / Area canon into v0.

## Verdict pointer

Verdict owner: PRD via `create-prd` — docs/prds/archived/wolven-ai-assisted-dev-harness/wolven-ai-assisted-dev-harness-prd.md (status draft; awaiting Human `status: stable`). Do not restate follow/reduce/defer/refuse here.

## Problem Summary

Wolven’s One-Man-Team repo already runs a working AI-assisted development harness, but other Wolven and OMT-adjacent code repos cannot install that capability as a non-project-specific util. Today they manually copy or hand-roll harness files, so there is no shared, fail-closed way to enforce an architectural-design canon (ADRs) or a consistent agent entry surface across repos. Without a portable extract, each new repo either reinvents harness residue or ships without the governance OMT already depends on.

## User Impact

### Who is affected?

- **Rafael** — solo CEO sponsoring Corporate Tools & Processes enablement; decides whether internal repos get a governed harness
- **Agents** — sessions in non-OMT Wolven/OMT-adjacent code repos that need AGENTS/skills/hooks/validate plus ADR canon
- **Corporate (Tools & Processes)** — owns shared tooling backbone; does not own Delivery client outcomes

### How are they affected?

- Harness setup is copy-paste or ad-hoc; drift from OMT is unmeasured but expected (SP3 assumption)
- No installable takeover — cannot `npm install` a thin core and get a known validate spine
- Architectural decisions outside OMT lack a shared fail-closed ADR/canon gate
- Board/ClickUp and Area-specific OMT residue either leak into copies or are stripped inconsistently

### Scale of impact

- Affects every new or adjacent internal code repo that should share OMT’s harness pattern
- Frequency of copy-drift pain is **assumed, not measured** (SP3)
- First success bar is one internal/OMT-adjacent dogfood green (G4), not org-wide rollout metrics

## Business Context

### Strategic Alignment

Corporate Area owns shared tools, standards, automation, and AI enablement (docs/canon/corporate/area-context.md). Active initiative: Ferramentas e Processos. This harness is enablement backbone for code repos — not a Delivery client promise and not a Growth market SKU in v0 (public OSS is gated later per G2).

### Business Impact

- Reduces repeated harness invention and ungoverned architecture claims across internal code repos
- Concentrates OMT’s proven pattern into a thin, installable util without exporting board/Area product specificity
- Keeps public OSS and `okf-qmd-kit` knowledge-kit R&D off the critical path (G2, G3)

### Why Now?

- OMT already demonstrates a working harness — extract is leverage, not greenfield invention
- New endeavor explicitly started (2026-09-23) with locked discovery G1–G5
- Doing nothing for a cycle freezes the installable path and leaves ADR canon OMT-only (SP2)

## Success Criteria

| Metric | Current Baseline | Target | Timeline |
|--------|-----------------|--------|----------|
| Installable thin core | Manual copy/adapt or none (SP1) | New dedicated repo; internal Wolven/org npm scope; install yields AGENTS + skills/hooks skeleton + validate spine (G1, G5, G4) | After first internal dogfood |
| Architectural canon gate | Fail-closed ADR checks only where OMT-like harness exists | Fail-closed ADR/architectural-canon checks on code-architecture claims in dogfood repo (G3, G4) | With dogfood green |
| Writing executions | OMT-specific / inconsistent outside OMT | Shallow OKF-derived document template/profile wired into writing executions (G1) | With thin core v0 |
| Dogfood | No portable package consumer | One internal/OMT-adjacent repo green on G4 proof (G2, G4) | Before broader internal roll |
| Public OSS | Not started | Explicit later gate only — not a v0 requirement (G2) | Deferred |
| Non-goal guardrail | Temptation to ship board skills, Area canon, or okf-qmd-kit coupling | Board skills + Area canon out of v0; okf-qmd-kit deferred (G1, G3) | Ongoing |

## Constraints & Considerations

- v0 boundary: thin portable core + shallow OKF-derived writing template/profile; ClickUp board skills and Area canon stay out (G1)
- QMD + canon spine with ADRs in scope; do not couple v0 to `okf-qmd-kit` (G3)
- Internal-first distribution; public OSS only behind an explicit later gate (G2)
- New dedicated repo extracted from OMT; internal npm under Wolven/org scope; exact package name later (G5)
- Corporate enables; do not transfer Delivery/Growth outcome ownership (docs/canon/area-context-index.md)
- Post-grill OQ lock: writing template = thin profile + small lint/validate subset (OQ1=B); ADR fail-closed on code-architecture claim path only (OQ2=A); first dogfood **revised CC1=A** — brownfield install into ≥1 existing/OMT-adjacent consumer (OQ3 originally D sales-charter → deferred); npm identifier deferred to scaffold/code-spec under Wolven/org scope (OQ4=A)
- Pragmatic-guard: refuse expanding v0 into full OMT fork, board lane, or knowledge-kit product

## Open Questions

- [x] Exact shape of the shallow OKF-derived writing template/profile for writing executions — **OQ1=B:** thin profile file + small lint/validate rule subset (not full OKF-PROFILE port)
- [x] Fail-closed ADR/canon validate thresholds (what triggers a fail vs pass) — **OQ2=A:** fail-closed when code-architecture claims lack matching ADR / invalid ADR frontmatter-status; claim-path only
- [x] Which internal/OMT-adjacent repo is the first dogfood consumer — **OQ3 revised (CC1=A / council Option 1):** sales-charter Next.js dogfood parked → docs/deferrals/wolven-harness-sales-charter-dogfood.md; acceptance vehicle = brownfield install into ≥1 existing or OMT-adjacent consumer + fail-closed claim-path (original OQ3=D superseded)
- [x] Exact npm package name under the Wolven/org scope — **OQ4=A:** defer exact string; PRD locks “internal npm under a Wolven/org scope”; choose at scaffold/code-spec
- [x] When (if ever) the public OSS gate is pulled — criteria only, not a v0 task — **OQ5=A:** defer criteria; PRD restates G2; define pull criteria after first internal dogfood is green

## Landing path

- Intended path: `docs/prds/archived/wolven-ai-assisted-dev-harness/wolven-ai-assisted-dev-harness-problem.md`

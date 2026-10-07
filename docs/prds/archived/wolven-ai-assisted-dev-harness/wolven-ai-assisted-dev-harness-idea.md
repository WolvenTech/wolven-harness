---
type: idea
title: Wolven AI Assisted Development Harness
description: Portable OSS npm util-tool agent harness extracted from One-Man-Team for install into other repos to take over their agent harness.
status: stable
tags: [harness, npm, open-source, wolven, corporate, enablement]
generated: { by: cursor/idea-factory, at: 2026-09-23T16:38:25Z }
---

## Context

Begin from One-Man-Team’s working agent harness and extract a non-project-specific, open-source util-tool npm package — Wolven AI Assisted Development Harness — that other repos can install to take over their agent harness, distributed internally first and possibly externally as OSS. Source: Rafael Project assignment 2026-09-23 — beginning of the Wolven AI Assisted Development Harness endeavor. Outcome: an installable, non-project-specific npm util-tool that takes over the agent harness in target repos; internal distribution first, external/OSS possible. Area: Corporate (Tools & Processes enablement) per docs/canon/area-context-index.md and docs/canon/corporate/area-context.md — shared tooling backbone, not Delivery client outcomes. Urgency: early endeavor / exploration — not a board pull yet. Dependencies: One-Man-Team harness as starting base; siblings (related, not duplicates) docs/ideas/okf-qmd-kit/okf-qmd-kit.md (gated-canon OKF/QMD knowledge kit — knowledge bundle tooling vs this agent harness package) and docs/ideas/wolven-org-tooling-map/wolven-org-tooling-map.md (org tooling map — broader; agents slice only). Open questions: (1) Package boundary — what ships in the npm util vs what stays OMT/Wolven-specific (ClickUp board skills, Area canon, OKF profile)? (2) Distribution — internal-only first vs public OSS from day one? (3) Relationship to okf-qmd-kit — sibling product, dependency, or separate lane? (4) Done-when for “takes over the agent harness” in a fresh repo (install + which surfaces: skills, AGENTS.md, hooks, validate)? (5) Home — new repo vs package inside OMT monorepo; npm scope/name?

## Notes

- Sibling Idea: [OKF/QMD kit as LLM Wiki schema](../okf-qmd-kit/okf-qmd-kit.md) — deferred for this grill; not coupled to harness v0
- Sibling Idea: [Wolven org tooling map](../wolven-org-tooling-map/wolven-org-tooling-map.md) — org tooling exploration; agents hosting called out separately
- Area: Corporate — Tools & Processes enablement (docs/canon/corporate/area-context.md)
- Problem: [Problem — Portable Wolven AI assisted development harness](problem.md)
- Discovery: Q1 — A: Grill G1 = A + carve-out — thin portable core (AGENTS entry, skills/hooks skeleton, validate spine); ClickUp board skills and Area canon stay out of v0; include a shallow OKF-derived document template/profile wired into writing executions (not full OKF profile / not option B peer kit)
- Discovery: Q2 — A: Grill G2 = A — Internal-first; dogfood in Wolven/OMT-adjacent repos; public OSS only behind an explicit later gate
- Discovery: Q3 — A: Grill G3 = D (free-text) — Forget okf-qmd-kit (deferred; no harness v0 coupling). In scope: QMD + canon spine, specifically ADRs — code harness must enforce producing/maintaining an architectural-design canon
- Discovery: Q4 — A: Grill G4 = A — Install/init yields AGENTS entry + skills/hooks skeleton + validate spine; QMD-indexable docs layout; fail-closed ADR/architectural-canon checks on code-architecture claims; green dogfood on one internal/OMT-adjacent repo
- Discovery: Q5 — A: Grill G5 = A — New dedicated repo; extract from OMT; publish internal npm under a Wolven/org scope (exact package name chosen later)
- Evidence gaps (post-grill, not blocking discovery close): shallow OKF writing template shape; ADR/canon validate thresholds; named first dogfood consumer repo; exact npm package identifier
- QMD: 2026-09-23 — no duplicate Idea for portable agent-harness npm package; nearest hits are okf-qmd-kit (knowledge) and harness ADRs inside OMT
- Session: 2026-09-23 — Captured via idea-factory; discovery pass recorded; open questions remain → grilling recommended before problem statement
- Session: 2026-09-23 — Human confirmed Capture + Corporate Area; started grilling (AskQuestion unavailable → markdown one-at-a-time)
- Grill: G1 package boundary — Human chose A with carve-out (shallow OKF-based writing template/profile in; board skills + Area canon out)
- Grill: G2 distribution — Human chose A (internal-first; OSS later behind explicit gate)
- Grill: G3 vs okf-qmd-kit — Human free-text: kit deferred/out; QMD + ADR architectural canon in scope for this code harness
- Grill: G4 done-when — Human chose A (fail-closed ADR/canon + install surfaces; one internal dogfood green)
- Grill: G5 package home — Human chose A (new dedicated repo; internal Wolven/org npm scope; exact name later)
- Grill: complete 2026-09-23 — Discovery Q1–Q5 answered (G1–G5); checklist closed; `- Problem: (pending)` remains → propose `define-problem-statement` next (Human confirm before invoke)
- Session: 2026-09-23 — define-problem-statement: SP1–SP4 all A; problem.md authored; classification `absence`; awaiting Human `create-prd`
- Session: 2026-09-23 — create-prd entry gate PASS; LC1 = A — grill open questions before Cynefin/Executor/PRD draft
- Grill: OQ1 writing-template — Human chose B (thin profile file + small lint/validate rule subset; not full OKF-PROFILE port)
- Grill: OQ2 ADR validate — Human chose A (fail-closed when code-architecture claims lack matching ADR / invalid ADR frontmatter-status; claim-path only)
- Grill: OQ3 first dogfood — Human chose D: new simple Next.js wrapper for sales — presenting project charters with Gantt and prices (OMT-adjacent internal dogfood bed)
- Grill: OQ4 npm name — Human chose A (defer exact string; PRD locks “internal npm under a Wolven/org scope”; concrete name at scaffold/code-spec)
- Grill: OQ5 OSS gate — Human chose A (defer pull criteria; PRD restates G2 internal-first + later explicit gate; define criteria after first internal dogfood green)
- Grill: OQ complete 2026-09-23 — OQ1–OQ5 answered; awaiting Cynefin domain + Executor lock before PRD draft
- Grill: CE1 approach — Human chose A (Complicated + Executor: code → detailed PRD; then code-spec)
- Session: 2026-09-23 — Human invoked idea-council before PRD draft (post CE1 lock; synthesis first, no draft until Human confirms council next step)
- Council: 2026-09-23 Round 1+2 (Operator/Strategist/Skeptic/Customer/Simplifier) — ranked Option 1 package-first PRD + brownfield acceptance + defer sales-charter (revises OQ3); awaiting Human confirm Option 1 vs 2 before create-prd draft
- Grill: OQ waiting — (none). Human confirm on council Option 1 vs 2 (ABCD) before PRD draft.
- Grill: CC1 council confirm — Human chose A (Option 1 package-first; revise OQ3; defer sales-charter)
- Grill: OQ3 revised — sales-charter dogfood parked → docs/deferrals/wolven-harness-sales-charter-dogfood.md; acceptance vehicle = brownfield install + fail-closed claim-path
- Session: create-prd draft authored (superseded) — Human approved → `- PRD:` stable line below
- Sibling Idea: [Wolven Harness Init Wizard](../wolven-harness-init-wizard/wolven-harness-init-wizard.md) — adjacent PRD-patch Idea (init wizard); capture 2026-09-23; framing complete 2026-09-24
- PRD: [Wolven AI Assisted Development Harness](../../prds/wolven-ai-assisted-dev-harness/wolven-ai-assisted-dev-harness.md) (approved — Human 2026-09-23; init-wizard addendum approved Human 2026-09-24 — `status: stable`; Executor: code → `code-spec` when Human asks)
- Session: 2026-09-23 — Human approved harness PRD; create-prd done; do not auto-start code-spec
- Session: 2026-09-24 — create-prd init-wizard addendum draft on same PRD file; STOP for Human draft approval
- Session: 2026-09-24 — Human approved init-wizard addendum (“draft aprovado”); PRD back to stable; do not auto-start code-spec

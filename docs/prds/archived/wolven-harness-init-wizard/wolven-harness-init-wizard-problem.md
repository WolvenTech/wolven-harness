---
type: idea
title: Problem — Wolven harness init wizard
description: After portable harness install, agents lack a guided skill session to discover project context/lifecycle/tools and suggest a capped set of architectural skills — today is ad-hoc improvisation.
status: draft
tags: [problem-statement, harness, init-wizard, wolven, corporate, adjacent]
generated: { by: cursor/define-problem-statement, at: 2026-09-24T17:00:00Z }
---

# Problem Statement: Wolven harness init wizard

## Situation probe

| Probe | Answer |
|-------|--------|
| Who experiences this, in what situation? | Rafael (solo CEO, Corporate / Tools & Processes) and agents in a consumer repo **after** the portable Wolven harness is installed, when they need architectural skills aligned to that project's context, lifecycle, and decided tools. |
| What happens today when they try to get the outcome? | **SP1 = A:** Ad-hoc session — the agent improvises skills/instructions via chat or copy; no guided discovery of context/lifecycle/tools and no capped architectural-skill suggestion. |
| What is evidence vs assumption? | **SP3 = A:** Evidence — discovery Q0–Q5 locked; SP1/SP2 answered; harness PRD is stable without an init wizard; skills catalogue picker deferred; composy/kb is a codebase-discovery capability benchmark only. Assumption — frequency/severity of ad-hoc improvisation not yet measured in real consumers. |
| What changes if we do nothing for one planning cycle? | **SP2 = A:** Portable harness ships without an init wizard; consumers stay on ad-hoc sessions; context/tools discovery and architectural skills stay inconsistent; the wizard gap does not close. |
| Who sponsors a fix, and what is “good enough”? | **SP4 = A:** Sponsor — Rafael (Corporate / Tools & Processes). Good enough — post-install agent skill session: discover context/lifecycle/tools → research repo/QMD (+ optional short web) → suggest 2–4 architectural skills + stubs; instruct Human to define agentic instructions (catalogue deferred); amend/patch the existing harness PRD (no second PRD). |

## Classification

- **Label:** `absence`
- **Why this label:** The needed capability — a guided post-install init wizard (agent skill session) that discovers project context and suggests a capped set of architectural skills — does not exist on the stable harness path. Ad-hoc improvisation (SP1) is a workaround, not the missing path. This is not primarily friction inside an already-shipped wizard (`pain`), nor a greenfield platform inventing harness concepts from zero (`construction`); the portable harness PRD already exists — the adjacent init-wizard path is what is absent.

## Cheaper-than-building

- **Alternative considered:** Keep ad-hoc post-install sessions (status quo); or ship a static README checklist instead of an agent skill session; or wait for a full skills catalogue before any wizard.
- **Result:** not viable for the locked outcome
- **Rationale:** Status quo (SP1/SP2) leaves discovery and skill suggestion inconsistent. A README checklist is cheaper but fails Q2=B (agent skill session, not docs-only). Waiting for the catalogue contradicts Q3 carve-out (scaffold stubs + instruct Human to define agentic instructions; catalogue deferred). A thin agent skill session that patches the existing harness PRD is the cheapest path that matches sponsor good-enough (SP4) without a second PRD or catalogue product.

## Verdict pointer

Verdict owner: PRD via `create-prd` **amend/patch** — docs/prds/archived/wolven-ai-assisted-dev-harness/wolven-ai-assisted-dev-harness-prd.md (status stable; Q1=A — no second harness PRD). Do not restate follow/reduce/defer/refuse here.

## Problem Summary

The portable Wolven AI assisted development harness can install a thin agent surface into consumer repos, but after install there is no guided path to discover that project's context, lifecycle, and decided tools and then suggest a small set of architectural skills. Agents and Rafael fall back to ad-hoc improvisation — chat or copy — so skill coverage stays inconsistent and the catalogue gap is papered over rather than handled with an explicit “define agentic instructions” step. Without an init wizard as an adjacent patch to the stable harness PRD, brownfield consumers inherit the harness shell without a repeatable way to land the first architectural skills.

## User Impact

### Who is affected?

- **Rafael** — solo CEO sponsoring Corporate Tools & Processes; decides how consumer repos get from harness install to usable architectural skills
- **Agents** — post-install sessions in harness consumers that need context-aware architectural skill stubs without inventing them from scratch every time
- **Corporate (Tools & Processes)** — owns shared tooling enablement; does not own Delivery client outcomes

### How are they affected?

- Post-install work is ad-hoc improvisation (SP1); no guided discovery of context/lifecycle/tools
- No capped suggestion of 2–4 architectural skills with stubs
- Until a catalogue exists, there is no standard prompt to tell the Human to define agentic instructions for a tool/field (Q3 carve-out missing from the product path)
- Research for discovery is unstructured rather than repo/QMD-first with optional short web (Q4)

### Scale of impact

- Affects every consumer of the portable harness after first install
- Frequency/severity of ad-hoc pain is **assumed, not measured** (SP3)
- Success bar is the SP4 good-enough wizard flow on the amended harness PRD — not org-wide catalogue rollout

## Business Context

### Strategic Alignment

Corporate Area owns shared tools, standards, automation, and AI enablement (docs/canon/corporate/area-context.md). Active initiative: Ferramentas e Processos. The init wizard is enablement adjacent to the stable portable harness — not a Delivery client promise and not a Growth market SKU.

### Business Impact

- Turns harness install into a repeatable path to first architectural skills instead of one-off improvisation
- Keeps catalogue product work deferred while still instructing Humans to define agentic instructions (Q3)
- Avoids a second harness PRD (Q1=A) — patches the stable PRD once framing is done

### Why Now?

- Harness PRD is already **stable** and Executor code — shipping without a wizard locks ad-hoc as the default (SP2)
- Discovery Q0–Q5 and SP1–SP4 are closed (2026-09-23 / 2026-09-24)
- composy/kb is available as a capability benchmark for the discovery/research step (Q0), not as a dogfood substitute

## Success Criteria

| Metric | Current Baseline | Target | Timeline |
|--------|-----------------|--------|----------|
| Post-install path | Ad-hoc improvisation (SP1) | Agent skill session after install (Q2=B) | With PRD patch + code lane |
| Discovery → research | Unstructured chat | Context/lifecycle/tools discovery → repo/QMD first, optional short web (Q4=A) | With wizard v0 |
| Architectural skills | None / improvised | Suggest 2–4 skills + scaffold stubs (Q5=A, Q3=B) | With wizard v0 |
| Catalogue gap | Ignored or invented | Instruct Human to define agentic instructions; catalogue deferred (Q3 carve-out) | Ongoing until catalogue trigger |
| PRD shape | Harness PRD stable, no wizard | Amend/patch existing harness PRD only (Q1=A) | After Human create-prd confirm |
| Discovery benchmark | Not compared | Use composy/kb as capability benchmark for discovery/research shaping (Q0) | During PRD patch / code-spec |
| Non-goal guardrail | Temptation to ship catalogue picker or second PRD | Catalogue picker deferred; no second harness PRD | Ongoing |

## Constraints & Considerations

- Adjacent Idea only — must **amend/patch** docs/prds/archived/wolven-ai-assisted-dev-harness/wolven-ai-assisted-dev-harness-prd.md; never author a second harness PRD (Q1=A)
- Wizard form is an **agent skill session after install**, not a CLI (Q2=B)
- Catalogue picker deferred to docs/deferrals/skills-catalogue/skills-catalogue-deferral.md; v0 scaffolds stubs and tells Human to define agentic instructions (Q3)
- Quick research: repo/QMD first, optional short bounded web (Q4=A)
- Cap suggestions at 2–4 architectural skills (Q5=A)
- composy/kb = codebase-discovery capability benchmark — not primarily a brownfield dogfood consumer (Q0)
- Corporate enables; do not transfer Delivery/Growth outcome ownership (docs/canon/area-context-index.md)
- Pragmatic-guard: refuse expanding v0 into full skills marketplace, second PRD, or catalogue product

## Open Questions

- [ ] Exact skill-session script / prompts for context, lifecycle, and tools discovery (shape in create-prd patch / code-spec)
- [ ] How composy/kb capabilities map to the wizard’s discovery/research bar (benchmark compare, not vendoring)
- [ ] Where scaffolded skill stubs land in a consumer repo relative to harness install layout
- [ ] Whether the PRD patch lands as a scope addendum only or also adjusts acceptance metrics on the stable harness PRD
- [ ] Trigger criteria to pull the deferred skills catalogue (owned by deferral doc; not v0)

## Landing path

- Intended path: `docs/prds/archived/wolven-harness-init-wizard/wolven-harness-init-wizard-problem.md`

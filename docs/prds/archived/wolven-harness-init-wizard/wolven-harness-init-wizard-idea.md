---
type: idea
title: Wolven Harness Init Wizard
description: Adjacent Idea to patch the Wolven AI Assisted Development Harness PRD with an init wizard — project/lifecycle/tools discovery, quick research, then suggest a few architectural skills.
status: draft
tags: [idea, harness, init-wizard, wolven, corporate, adjacent]
generated: { by: cursor/writer, at: 2026-09-23T20:21:35Z }
---

## Context

Adjacent (not replacement) Idea that will later **patch** the draft Wolven harness PRD with an **init wizard** whose v0 flow is simple discovery of project context, lifecycle, and decided tools → quick research → suggest creation of a few architectural skills. Source: Rafael Project assignment 2026-09-23. Outcome: a PRD patch proposal that adds init-wizard scope to the existing harness PRD — not a separate product replacing the harness. Area: Corporate (Tools & Processes) per docs/canon/area-context-index.md and docs/canon/corporate/area-context.md — same as the sibling harness Idea. Urgency: early / adjacent to the draft PRD on PR #30. Dependencies: sibling harness Idea plus the draft harness PRD (do not rewrite that PRD in this capture). Open questions: discovery Q0–Q5 closed 2026-09-23; situation probe SP1–SP4 closed 2026-09-24; Problem framed at docs/prds/archived/wolven-harness-init-wizard/wolven-harness-init-wizard-problem.md.

## Notes

- Sibling Idea: [Wolven AI Assisted Development Harness](../wolven-ai-assisted-dev-harness/wolven-ai-assisted-dev-harness.md)
- Sibling Problem: docs/prds/archived/wolven-ai-assisted-dev-harness/wolven-ai-assisted-dev-harness-problem.md
- Target PRD to patch later (do not rewrite now): docs/prds/archived/wolven-ai-assisted-dev-harness/wolven-ai-assisted-dev-harness-prd.md (status stable)
- Area: Corporate — Tools & Processes enablement
- Park: catalogue — Wolven-tailored skills catalogue picker deferred to docs/deferrals/skills-catalogue/skills-catalogue-deferral.md (not v0)
- Benchmark candidate (Human 2026-09-23): https://github.com/compozy/kb — **capability benchmark for codebase discovery** (compare/aspirational bar for the wizard’s discovery/research step); not primarily a brownfield dogfood consumer
- Discovery: Q0 — A: D (free-text) — composy/kb is a possible **capability benchmark for codebase discovery** (not primarily a dogfood consumer); compare its discovery capabilities when shaping the wizard’s discovery/research step
- QMD: 2026-09-23 — no duplicate Idea for init-wizard PRD patch; nearest are sibling harness Idea/PRD and okf-qmd-kit (knowledge kit, not this wizard)
- Problem: docs/prds/archived/wolven-harness-init-wizard/wolven-harness-init-wizard-problem.md
- Session: 2026-09-23 — Captured via idea-factory ([Continue init wizard Idea](bc-e057a7a5-921c-5991-970d-0c5270335f93)); discovery ABCD Q0–Q5 pending; no create-prd / no PRD rewrite this session
- Session: 2026-09-23 — Human supplied composy/kb as benchmark candidate; grill Q0 on its role alongside Q1–Q5
- Session: 2026-09-23 — Q0 recorded: composy/kb = codebase-discovery capability benchmark; Q1–Q5 still open; no create-prd
- Preference: discovery one Q at a time with full ABCD (A=recommended); no batch Q1–Q5 — Human 2026-09-23
- Session: 2026-09-23 — coordinator posed capture confirm + Q1 only; awaiting Human
- Capture: confirmed — slug wolven-harness-init-wizard; Area Corporate (Human 2026-09-23)
- Discovery: Q1 — A: A — Amend/patch existing draft harness PRD after Idea settles (no second harness PRD)
- Session: 2026-09-23 — Capture confirmed + Q1=A recorded; STOP for Q2 only (where wizard runs)
- Discovery: Q2 — A: B — Agent skill session after install (guided chat, not CLI)
- Session: 2026-09-23 — Q2=B recorded (wizard = agent skill session after install); STOP for Q3 only (suggest architectural skills meaning); no create-prd / no PRD rewrite
- Discovery: Q3 — A: B (carve-out) — Scaffold skill stubs after suggestion; until catalogue exists, wizard tells Human to define agentic instructions for that tool/field; catalogue picker stays deferred (docs/deferrals/skills-catalogue/skills-catalogue-deferral.md)
- Session: 2026-09-23 — Human Q3: "b - until we have a catalogue of skills - the goal is to tell the user he should define the agentic instructions for that tool/field"; recorded as B with carve-out (scaffold stubs; v0 instructs Human to define agentic instructions; no catalogue pick); STOP for Q4 only (quick research may use?); no create-prd / no PRD rewrite
- Discovery: Q4 — A: A — Repo/QMD first, optional short bounded web
- Session: 2026-09-23 — Q4=A recorded (quick research = repo/QMD first, optional short bounded web); STOP for Q5 only (“a few” architectural skills count); discovery remains open until Q5 answered; no create-prd / no PRD rewrite
- Discovery: Q5 — A: A — Cap 2–4 architectural skills
- Discovery: complete 2026-09-23 — Q0–Q5 answered; checklist closed; - Problem: (pending) remains
- Session: 2026-09-23 — Q5=A recorded; discovery Q0–Q5 closed; next Human gate = confirm define-problem-statement (do not invoke); no create-prd / no PRD rewrite
- Session: 2026-09-24 — Human confirmed define-problem-statement (“segue no init wizard”); starting situation probe SP1 (one-at-a-time ABCD); no problem.md / no create-prd / no harness PRD patch until SP complete
- Target PRD note: docs/prds/archived/wolven-ai-assisted-dev-harness/wolven-ai-assisted-dev-harness-prd.md is now status stable (approved 2026-09-23); Q1=A still means amend/patch that PRD later — not a second PRD
- Situation probe: SP1 — A: A — Ad-hoc session after harness install — agent improvises skills/instructions via chat or copy; no guided discovery of context/lifecycle/tools and no capped architectural-skill suggestion
- Situation probe: SP2 — A: A — One planning cycle with no wizard — portable harness ships without init wizard; consumers stay on ad-hoc sessions; context/tools discovery and architectural skills stay inconsistent; wizard gap does not close
- Situation probe: SP3 — A: A — Evidence: discovery Q0–Q5 + SP1/SP2; harness PRD stable without init wizard; catalogue deferred; composy/kb is discovery-capability benchmark only. Assumption: frequency/severity of ad-hoc improvisation not yet measured in real consumers
- Situation probe: SP4 — A: A — Sponsor Rafael (Corporate / Tools & Processes). Good enough: post-install agent skill session — discover context/lifecycle/tools → research repo/QMD (+ optional short web) → suggest 2–4 architectural skills + stubs; instruct Human to define agentic instructions (catalogue deferred); amend/patch existing harness PRD (no second PRD)
- Situation probe: complete 2026-09-24 — SP1–SP4 all A; writing problem.md
- Problem: docs/prds/archived/wolven-harness-init-wizard/wolven-harness-init-wizard-problem.md
- Session: 2026-09-24 — define-problem-statement complete; classification `absence`; next Human gate = confirm create-prd to **amend/patch** docs/prds/archived/wolven-ai-assisted-dev-harness/wolven-ai-assisted-dev-harness-prd.md (Q1=A — not a second PRD)
- Session: 2026-09-24 — Human confirmed create-prd (“confirma”); entry gate PASS; light confirm LC1 open (ABCD one-at-a-time); no PRD patch draft until LC passes; no second PRD
- Light confirm: LC1 — A: A — Thin addendum; keep Complicated / Executor code / Verdict follow; cite wizard framing; add scope In + Acceptance; catalogue Out/deferred; script/layout OQs → code-spec
- Waive: grilling — remaining problem.md OQs are code-spec detail per LC1=A (2026-09-24)
- PRD: docs/prds/archived/wolven-ai-assisted-dev-harness/wolven-ai-assisted-dev-harness-prd.md (init-wizard addendum **draft** — LC1=A; awaiting Human re-approve → stable)
- Session: 2026-09-24 — create-prd draft amend written; STOP for Human draft approval (do not claim stable; no code-spec auto-start)
- PRD: docs/prds/archived/wolven-ai-assisted-dev-harness/wolven-ai-assisted-dev-harness-prd.md (approved — Human 2026-09-24; init-wizard addendum `status: stable`; Executor: code → `code-spec` when Human asks)
- Session: 2026-09-24 — Human approved init-wizard addendum (“draft aprovado”); create-prd amend done; do not auto-start code-spec

---
type: note
title: Sources that constrain a legacy-migration skill
description: What strangler-fig literature and existing modernization skills actually prescribe, and how that constrains a harness skill that grills desired-shape then delivers a phased migration plan.
status: draft
---

# Sources that constrain a legacy-migration skill

## Question

What do the cited modernization skills, Fowler's strangler-fig essay, and this repo's own grilling / wayfinder / code-plan / adr rules actually do — and what does that lock in for an optional `legacy-migration` skill that grills the desired shape, then explores the repo, then delivers a phased plan?

## Findings

- Fowler's strangler-fig essay is the named source for gradual replacement. A big-bang rewrite "go[es] down in flames most of the time" because replacements take too long, existing behaviour is hard to specify, and much of that behaviour is unwanted. The preferred path is small additions beside the legacy, then moving behaviour across. Four activities (not a sequence): (1) understand the outcomes you want, (2) break the problem into smaller parts, (3) deliver those parts, (4) change the organization so this can continue. Outcomes must be aligned early and revisited. Legacy systems lack seams; finding or inserting them is real work. Transitional architecture that later goes away is expected cost, not waste. Organizational change is required or the new system repeats the mess ([Strangler Fig, Fowler, 22 Aug 2024](https://martinfowler.com/bliki/StranglerFigApplication.html)).
- The marketplace "Legacy Code Modernization & Migration" skill is `framework-migration-legacy-modernize` in `sickn33/antigravity-awesome-skills`. It is a five-phase *implementation* orchestrator, not a plan-only skill: assess debt and coupling, add characterization and contract tests, stand up API-gateway / feature-flag strangler infrastructure, rewrite first-wave components (prompts name Python or Go), harden security, load-test, roll out 5%→100%, then decommission after 30 days at 0% traffic. Success criteria include >80% coverage on high-priority components, zero unplanned downtime, P95 within 110% of baseline, and a 90% vulnerability cut ([framework-migration-legacy-modernize SKILL.md](https://raw.githubusercontent.com/sickn33/antigravity-awesome-skills/main/skills/framework-migration-legacy-modernize/SKILL.md)).
- That skill's configuration options include `--big-bang` ("Full cutover after validation (higher risk, faster completion)"), which is the replacement mode Fowler says usually fails ([same SKILL.md](https://raw.githubusercontent.com/sickn33/antigravity-awesome-skills/main/skills/framework-migration-legacy-modernize/SKILL.md); [Fowler](https://martinfowler.com/bliki/StranglerFigApplication.html)).
- The sibling `legacy-modernizer` skill is a shorter specialist: strangler fig, tests before refactor, backward compatibility, feature flags, and an output list that includes a phased plan *and* refactored code, shims, and rollback procedures ([legacy-modernizer SKILL.md](https://raw.githubusercontent.com/sickn33/agentic-awesome-skills/main/skills/legacy-modernizer/SKILL.md)).
- The `17-technical-docs` `migration-guide-creator` is a generated stub with no migration method, no phases, and no desired-shape interview ([migration-guide-creator SKILL.md](https://raw.githubusercontent.com/jeremylongshore/tons-of-skills-marketplace/main/skills/17-technical-docs/migration-guide-creator/SKILL.md)).
- This repo already has the interview and the phased-plan shapes. `grilling` asks one question at a time until the frontier is empty and the Human confirms (`.claude/skills/grilling/SKILL.md`). `wayfinder` charts a decision too big for one session as `docs/maps/<slug>/` tickets (`research` / `prototype` / `grilling` / `task`), works one ticket per session, and hands settled decisions to a PRD or spec (`.claude/skills/wayfinder/SKILL.md`). `code-plan` turns a *locked spec* into ordered units with dependencies, owned paths, and an observable Done when; it refuses to invent proofs the spec does not name (`.claude/skills/code-plan/SKILL.md`).
- `code-plan` is the wrong artifact for a migration that has no locked spec yet. `wayfinder` is the artifact this repo already uses for a large unknown that must be sliced before a PRD. A plan that then mutates production code is `code-spec` → `code-plan` → `code-execute`, each on its own ask.
- `pragmatic-guard` and the standing YAGNI rule refuse additions whose complexity exceeds present need, and record refused work only under `docs/deferrals/<slug>/` (`.claude/skills/pragmatic-guard/SKILL.md`; `.agents/rules/yagni-strict.md`). A five-phase implementation orchestrator that stands up gateways and rewrites components is a new product, not a thin skill.
- Optional-set membership is not contract (`docs/adrs/adr-004-standalone-skills-contract.md`). The current `discovery` set does not include a migration skill (`src/setup/skill-sets.ts`).
- 16 Oct 2026 Harness session named "legacy rescue" as coupling analysis and ADR generation from an undocumented codebase, then the existing PRD → spec → plan → execute lane ([Wolven Harness, 16 Oct 2026](https://notes.granola.ai/d/d2a65f61-9ce1-414f-8c6e-a05a36cea5d1)). 7 Aug 2026 audit: brownfield should be slower; generate docs via AI Q&A, engineers correct them, then small gated increments; architecture mapping before AI-assisted changes ([AI Adoption Audit, 7 Aug 2026](https://notes.granola.ai/d/6f807348-9cdc-48cf-8aa5-62ba6dc1a7cf)).
- Fowler's first activity ("understand the outcomes you want") matches grilling the desired shape *before* exploring the tree. Exploring first would guess the destination the Human has not named.

## Sources

| Source | Type | Used for |
|--------|------|----------|
| https://martinfowler.com/bliki/StranglerFigApplication.html | official essay | gradual replacement, four activities, anti-big-bang |
| https://raw.githubusercontent.com/sickn33/antigravity-awesome-skills/main/skills/framework-migration-legacy-modernize/SKILL.md | official skill text | five-phase implementation orchestrator |
| https://raw.githubusercontent.com/sickn33/agentic-awesome-skills/main/skills/legacy-modernizer/SKILL.md | official skill text | shorter modernizer that still mutates code |
| https://raw.githubusercontent.com/jeremylongshore/tons-of-skills-marketplace/main/skills/17-technical-docs/migration-guide-creator/SKILL.md | official skill text | stub "migration guide" with no method |
| `.claude/skills/grilling/SKILL.md` | source code | one-question desired-shape interview |
| `.claude/skills/wayfinder/SKILL.md` | source code | existing phased map for large unknowns |
| `.claude/skills/code-plan/SKILL.md` | source code | plan only after a locked spec |
| `.claude/skills/pragmatic-guard/SKILL.md` | source code | refuse over-build |
| `.agents/rules/yagni-strict.md` | standing rule | deferrals path |
| `docs/adrs/adr-004-standalone-skills-contract.md` | profile ADR | adding an optional skill is not a contract break |
| `src/setup/skill-sets.ts` | source code | current discovery members |
| https://notes.granola.ai/d/d2a65f61-9ce1-414f-8c6e-a05a36cea5d1 | meeting notes | intended rescue path is docs then the code lane |
| https://notes.granola.ai/d/6f807348-9cdc-48cf-8aa5-62ba6dc1a7cf | meeting notes | brownfield is slower and engineer-reviewed |

## Open questions

- Whether the skill's only deliverable is a wayfinder map (or a note plus a map), or whether it may also write draft ADRs / a PRD.
- Whether any phase of the skill is allowed to mutate application code, or whether execution is always a later `code-spec` ask.
- How "desired shape" is bounded: target stack, target architecture, target operational outcomes, or all three.
- How this skill hands off to `repo-explorer` if both ship: grill first then explore, or explore first then grill.

---
type: note
title: Sources that constrain a repo-explorer skill
description: What existing discovery, research, and ADR-generation skills actually do, and how that constrains a harness skill that proposes selectable ADRs after a repo deep dive.
status: draft
---

# Sources that constrain a repo-explorer skill

## Question

What do the cited discovery and documentation skills, plus this repo's own ADR and init rules, actually do — and what does that lock in for an optional `repo-explorer` skill that explores a consumer repo and then lets the Human choose from proposed ADRs so QMD can search them?

## Findings

- This worktree's QMD index has five collections (`adrs`, `prds`, `specs`, `notes`, `deferrals`) and currently indexes zero files (`qmd status` in this worktree; `.qmd/index.yml`). ADRs written under `docs/adrs/` become searchable only after a later `qmd update`; they are not searchable merely by existing on disk.
- A profile ADR is one decision, one file, `docs/adrs/adr-NNN-<slug>.md`, with `status` `draft` / `stable` / `deprecated`. Every `ADR-NNN` or `adr-NNN-<slug>` token in a tracked file is a claim that must resolve to exactly one `stable` profile ADR, or `validate` fails closed (`docs/adrs/adr-000-record-architecture-decisions.md`; `docs/adrs/adr-001-claim-path.md`).
- The `adr` skill is the only path that creates, promotes, or supersedes those files. A new ADR starts `draft`. A `draft` ADR is not citable: a claim against it fails `validate`. Promotion requires the Human's explicit confirmation. The skill never invents a number, never auto-promotes, and never cites the new ADR until it is `stable` (`.claude/skills/adr/SKILL.md`).
- `harness-init` already discovers a consumer repo: it reads manifests, lockfiles, README, `AGENTS.md`, CI, `docs/adrs/`, installed skills, and top-level layout, then (on the full path) asks lifecycle stage and decisions not yet visible in code. It researches decided tools only, suggests two to four architectural skill stubs, and skips suggestion on a well-understood repo. It writes skill stubs, not ADRs. It never invents a decision or status (`.claude/skills/harness-init/SKILL.md`; `.claude/skills/harness-init/references/discovery.md`).
- Adding a skill folder and putting it in an optional set is not a public-contract break. ADR-004 lists "the set of skills and their text, and the skill sets' membership" as not contract (`docs/adrs/adr-004-standalone-skills-contract.md`). Today's optional `discovery` members are `create-prd`, `prototype`, `handoff`, `the-fool`, `the-jury`, `journey-map`, `wayfinder` (`src/setup/skill-sets.ts`).
- The marketplace page "Technical Research & Code Discovery" describes a kingkongshot skill that searches production code, synthesizes a Markdown report, and writes it under `docs/research/` ([MCP Market listing](https://mcpmarket.com/tools/skills/technical-research-code-discovery-2)). The published skill text names `searchGitHub` as literal code search (not keyword search), Exa for docs, a five-step workflow that ends by writing `docs/research/<topic>.md`, and the priority "real code > blog posts" ([published skill text](https://www.agentskills.in/marketplace/%40kingkongshot/research)). The path that listing names, `kingkongshot/prompts` `skills/research/SKILL.md`, returned 404 when fetched as raw GitHub. The current `kingkongshot/Pensieve` `SKILL.md` is a different product: a knowledge-graph router (`init`, `upgrade`, `migrate`, `doctor`, `self-improve`), not that research workflow ([Pensieve SKILL.md](https://raw.githubusercontent.com/kingkongshot/Pensieve/main/SKILL.md)).
- `context-discovery` does not invent architecture documents. It resolves a context root, then a read-only `context-scout` agent ranks existing files Critical / High / Medium and the main agent loads them before coding ([context-discovery SKILL.md](https://raw.githubusercontent.com/darrenhinde/OpenAgentsControl/main/plugins/claude-code/skills/context-discovery/SKILL.md); [context-scout agent](https://raw.githubusercontent.com/darrenhinde/OpenAgentsControl/main/plugins/claude-code/agents/context-scout.md)). The protocol writes `.oac.json` only as a pointer to a root that already has `navigation.md`; if nothing is found it tells the Human to install or point at docs, or to proceed without context ([OAC protocol](https://raw.githubusercontent.com/darrenhinde/OpenAgentsControl/main/plugins/claude-code/skills/context-discovery/context-discovery-protocol.md)).
- The `17-technical-docs` category on the linked marketplace is twenty-five named skills, including `adr-generator`, `architecture-doc-creator`, `code-documentation-analyzer`, and `migration-guide-creator` ([category README](https://raw.githubusercontent.com/jeremylongshore/tons-of-skills-marketplace/main/skills/17-technical-docs/README.md)). Each of those four `SKILL.md` files is the same generated stub: auto-activate on the skill's own name, "provides step-by-step guidance", generic error table, no ADR shape, no claim gate, no Human promotion step ([adr-generator](https://raw.githubusercontent.com/jeremylongshore/tons-of-skills-marketplace/main/skills/17-technical-docs/adr-generator/SKILL.md); [architecture-doc-creator](https://raw.githubusercontent.com/jeremylongshore/tons-of-skills-marketplace/main/skills/17-technical-docs/architecture-doc-creator/SKILL.md); [code-documentation-analyzer](https://raw.githubusercontent.com/jeremylongshore/tons-of-skills-marketplace/main/skills/17-technical-docs/code-documentation-analyzer/SKILL.md)).
- 16 Oct 2026 Harness session: ADRs are drafted when an undocumented decision is detected, the developer reviews before merge, and stable ADRs become QMD ground truth. The same session named a legacy-rescue use case: coupling analysis and ADR generation from an undocumented codebase ([Wolven Harness, 16 Oct 2026](https://notes.granola.ai/d/d2a65f61-9ce1-414f-8c6e-a05a36cea5d1)). 7 Aug 2026 adoption audit: brownfield rollout is slower than greenfield; AI Q&A should produce documentation that engineers review and correct before AI-assisted changes ([AI Adoption Audit, 7 Aug 2026](https://notes.granola.ai/d/6f807348-9cdc-48cf-8aa5-62ba6dc1a7cf)).

## Sources

| Source | Type | Used for |
|--------|------|----------|
| `.qmd/index.yml` and `qmd status` in this worktree | source code / local tool | which folders QMD can index |
| `docs/adrs/adr-000-record-architecture-decisions.md` | profile ADR | ADR shape and claim gate |
| `docs/adrs/adr-001-claim-path.md` | profile ADR | draft/stable/deprecated claim behaviour |
| `docs/adrs/adr-004-standalone-skills-contract.md` | profile ADR | skill-set membership is not contract |
| `.claude/skills/adr/SKILL.md` | source code | create / promote / never auto-promote |
| `.claude/skills/harness-init/SKILL.md` and `references/discovery.md` | source code | existing consumer-repo discovery |
| `src/setup/skill-sets.ts` | source code | current optional discovery members |
| https://raw.githubusercontent.com/darrenhinde/OpenAgentsControl/main/plugins/claude-code/skills/context-discovery/SKILL.md | official skill text | ranked load of existing context, not generation |
| https://raw.githubusercontent.com/darrenhinde/OpenAgentsControl/main/plugins/claude-code/skills/context-discovery/context-discovery-protocol.md | official skill text | context-root resolution and no-docs fallback |
| https://raw.githubusercontent.com/darrenhinde/OpenAgentsControl/main/plugins/claude-code/agents/context-scout.md | official agent text | read-only scout; verify-before-recommend |
| https://raw.githubusercontent.com/jeremylongshore/tons-of-skills-marketplace/main/skills/17-technical-docs/README.md | official skill text | category inventory |
| https://raw.githubusercontent.com/jeremylongshore/tons-of-skills-marketplace/main/skills/17-technical-docs/adr-generator/SKILL.md | official skill text | stub ADR generator has no claim-gate workflow |
| https://raw.githubusercontent.com/jeremylongshore/tons-of-skills-marketplace/main/skills/17-technical-docs/architecture-doc-creator/SKILL.md | official skill text | stub architecture writer |
| https://raw.githubusercontent.com/jeremylongshore/tons-of-skills-marketplace/main/skills/17-technical-docs/code-documentation-analyzer/SKILL.md | official skill text | stub analyzer |
| https://www.agentskills.in/marketplace/%40kingkongshot/research | published skill text (GitHub raw 404) | external-code research workflow and `docs/research/` output |
| https://raw.githubusercontent.com/kingkongshot/Pensieve/main/SKILL.md | official skill text | current Pensieve is a different product |
| https://notes.granola.ai/d/d2a65f61-9ce1-414f-8c6e-a05a36cea5d1 | meeting notes | intended legacy-rescue / ADR-from-undocumented-code use |
| https://notes.granola.ai/d/6f807348-9cdc-48cf-8aa5-62ba6dc1a7cf | meeting notes | brownfield docs must be engineer-reviewed |

## Open questions

- Whether `repo-explorer` writes candidate ADR *proposals* (notes or a picker list) and then calls `adr`, or writes `draft` ADRs itself. The `adr` skill currently owns create/promote.
- How many candidates a run may propose before the list stops being choosable.
- Whether a well-understood repo (ADRs already present) is in scope, or whether this skill is only for undocumented / brownfield trees.
- Whether QMD re-index (`qmd update` / `qmd embed`) is part of the skill or left to the Human / validate loop.

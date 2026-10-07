---
type: project
title: Projeto — Wolven AI Assisted Development Harness
description: Horizonte Corporate (Ferramentas e Processos) para extrair do One-Man-Team um harness de agentes instalável via npm interno, com gate de ADR fail-closed, wizard pós-instalação e Code lane portátil, provado no agentic-mkt.
status: draft
tags: [corporate, harness, npm, wolven, code-lane]
created: 2026-09-24
---

## Purpose

Entregar o `@wolventech/wolven-harness`: um pacote npm interno que instala o harness de agentes do One-Man-Team em qualquer repo de código da Wolven, com cânone arquitetural (ADR) fail-closed, Code lane portátil e um wizard que integra o harness ao repo.

## Context

Repos de código da Wolven fora do One-Man-Team copiam o harness à mão ou ficam sem ele; não existe gate compartilhado de ADR nem caminho repetível para integrar skills depois da instalação. O PRD aprovado (Complicated, Executor code) trava o escopo; o grilling de 2026-09-24 fechou nomes, consumidor e design, e dividiu a execução em quatro Entregas com spec própria.

## Expected outcome

O `WolvenTech/agentic-mkt` instala o pacote, integra o `WOLVEN.md` ao seu `AGENTS.md`, migra os 9 ADRs legados pelo wizard, passa no `harness:validate` sem avisos de legado, falha com uma afirmação `ADR-999`, e sai da sessão `harness-init` com 2–4 rascunhos de skill.

## DICE

| Factor | Score (1–4, lower better) | Note |
|--------|---------------------------|------|
| D | 2 | Quatro Entregas, revisão ao fechar cada uma; ~5 semanas |
| I | 2 | Solo + agentes; padrão já roda no One-Man-Team |
| C1 | 1 | Rafael patrocina Ferramentas e Processos |
| C2 | 1 | Único envolvido até o dogfood no agentic-mkt |
| E | 3 | Repo novo + 11 skills portáteis + Bitbucket + publicação + dogfood |

**Score:** 2 + 4 + 2 + 1 + 3 = **12 (Win)** — congelado na abertura.

## In scope

- Repo `WolvenTech/wolven-harness`, pacote `@wolventech/wolven-harness` no GitHub Packages, comando `wolven-harness`
- `init` que pergunta host (`gh`/`bit`) e runtimes (`claude`/`codex`/`cursor`), cria só o que não existe e grava o `WOLVEN.md`
- Perfil de escrita enxuto e gate de ADR com modo legado (aviso) e fail-closed para ADR inexistente
- Skill `harness-init`: integração da entrada, migração opcional de ADRs, descoberta → pesquisa → 2–4 rascunhos de skill
- Code lane portátil (7 skills `code-*` + `adr`) com GitHub via MCP e Bitbucket
- Dogfood no `WolvenTech/agentic-mkt`

## Out of scope

- Catálogo de skills (docs/deferrals/skills-catalogue/skills-catalogue-deferral.md)
- App sales-charter como dogfood (docs/deferrals/wolven-harness-sales-charter-dogfood.md)
- Publicação open source, skills de board/ClickUp, cânone de Area, `okf-qmd-kit`
- Agentes dedicados (builder/writer/conselho) no pacote
- Qualquer mudança na estrutura do harness do One-Man-Team

## Entregas

| Entrega | Description | ClickUp |
|---------|--------------|---------|
| A — Núcleo | Repo, `init`, `WOLVEN.md`, perfil, gate de ADR, skills `qmd`/`pragmatic-guard` — docs/specs/archived/wolven-harness-a-core/wolven-harness-a-core-spec.md | — (Executor code) |
| B — Wizard | Skill `harness-init`, migração de ADRs, aviso de rascunhos, benchmark compozy/kb — docs/specs/archived/wolven-harness-b-wizard/wolven-harness-b-wizard-spec.md | — (Executor code) |
| D — Code lane | `create-prd` + `adr` + 7 `code-*` portáteis, utilitárias `grilling`/`research`/`handoff`/`prototype` (`wayfinder` adiado, D-Q26), comando `comments`, instruções de construtor, GitHub/Bitbucket — docs/specs/archived/wolven-harness-d-code-lane/wolven-harness-d-code-lane-spec.md | — (Executor code) |
| C — Distribuição e dogfood | Publicação no GitHub Packages e instalação completa no agentic-mkt — docs/specs/archived/wolven-harness-c-dogfood/wolven-harness-c-dogfood-spec.md | — (Executor code) |

Ordem: A → (B ∥ D) → C.

## Milestones

| Milestone | Target date | Completion criterion |
|-----------|-------------|-----------------------|
| Specs A/B/C/D aprovadas | 2026-10-01 | Quatro specs aprovadas pelo Human — A e D aprovadas e mergeadas; **B aprovada em 2026-09-26** (docs/specs/archived/wolven-harness-b-wizard/wolven-harness-b-wizard-spec.md, `stable`: 17 decisões B-Q, 17 provas em duas ondas B1–B2); **C aprovada em 2026-09-28** (docs/specs/archived/wolven-harness-c-dogfood/wolven-harness-c-dogfood-spec.md, `stable`: 14 decisões C-Q, 23 provas em cinco ondas C1–C5; release-please publicando 0.1.0 privado no GitHub Packages, custo zero para a org, passos de admin da WolvenTech feitos). **Quatro specs aprovadas** |
| A pronta | 2026-10-09 | `pnpm build && pnpm test && pnpm validate` verdes no `wolven-harness` — **feito em 2026-09-24**: `feat/a-core` em `29f8841`, gate A2 verde (114 testes; `claims: 2 ok, 0 legacy-warn, 0 fail`); plano em docs/specs/archived/wolven-harness-a-core/wolven-harness-a-core-plan.md; PR #1 mergeado por squash em `main` como `f33de1d` (2026-09-25) |
| B e D prontas | 2026-10-23 | Provas das specs B e D verdes — **D verde em 2026-09-26**: gate D4 PASS em 2026-09-25 e, após a revisão do PR, `feat/d-code-lane` em `9589232` (344 testes; `validate: ok`; `comments: ok (0 findings)`); 26/26 provas marcadas na spec; plano em docs/specs/archived/wolven-harness-d-code-lane/wolven-harness-d-code-lane-plan.md; WolvenTech/wolven-harness#2 mergeado por squash em `main` como `d495802` (2026-09-26), gate refeito em `main` verde (344 testes). **B verde em 2026-09-26**: gate B2 PASS, `feat/b-init-wizard` em `44c3684` (424 testes; `validate: ok`; `comments: ok (0 findings)`); 17/17 provas marcadas na spec; plano em docs/specs/archived/wolven-harness-b-wizard/wolven-harness-b-wizard-plan.md; WolvenTech/wolven-harness#3 aberto; revisão do PR (aprovado com ressalvas, 4 threads) corrigida em 2026-09-28 — `feat/b-init-wizard` em `5182624` (428 testes; `validate: ok`; `comments: ok (0 findings)`), threads resolvidas, decisão B-Q18 na spec; pre-mortem (the-fool) em 2026-09-28 → `harness-ignored` (erro) e regras de re-inclusão no passo 0 (B-Q19), checagem das pastas de docs e diferimento de raiz configurável (B-Q20), `feat/b-init-wizard` em `53d8211` (435 testes); grilling dos itens restantes → última rodada de B (migração honesta, B-Q21) em `1fb7818` (440 testes), correções de `validate`, instalação/versão e critérios da execução real registrados na spec C, três diferimentos; WolvenTech/wolven-harness#3 mergeado por squash em `main` como `4af0e7c` (2026-09-28), gate refeito em `main` verde (440 testes). **B e D prontas**; C começa pelo stub |
| C pronta | 2026-10-30 | Evidência de dogfood do agentic-mkt registrada no One-Man-Team |

## Constraints

- Distribuição só interna em v0; repo com código público (Q22), mas sem `LICENSE` nem release open source — isso segue atrás de gate futuro
- Nenhum segredo no repo do pacote: tokens só em variáveis de ambiente e secrets do Actions
- Wizard é sessão de skill de agente, não CLI; o CLI nunca edita `AGENTS.md`/`CLAUDE.md` existentes
- `.agents/` é a fonte; runtimes recebem symlinks
- Scripts em TypeScript, dependências de runtime mínimas

## Dependencies

- A antes de B e D; C depende de A, B e D publicadas
- Acesso de push ao `WolvenTech/agentic-mkt` para o PR de dogfood (o merge é do Human)

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Resíduo do One-Man-Team vaza para as skills `code-*` | Pacote deixa de ser portátil | Prova de ausência de resíduo nas specs A e D |
| Modo legado vira permanente | O gate de ADR nunca fica fail-closed no consumidor | C só fecha com zero avisos de legado; ADR inexistente sempre falha |
| Bitbucket sem consumidor real | Bugs só aparecem no projeto Bitbucket | Paridade pela documentação; aberto a correções quando o projeto chegar |
| Code lane infla a Entrega D | B+D atrasam | Kill switch: primeiro corte é o Code lane |

## Tools and interfaces

- GitHub (repo, Packages, MCP), Bitbucket (API/MCP), QMD, Claude Code / Codex / Cursor
- Delivery/Growth entram só como consumidores do pacote; os resultados deles seguem com eles

## Closing condition

- [ ] Entregas A, B, D e C com provas verdes
- [ ] Evidência de dogfood do agentic-mkt registrada em `docs/notes/`
- [ ] Specs, planos e PRD arquivados no One-Man-Team

## Kill switch

- A não verde até 2026-10-23 (duas semanas de atraso) → pausar, rever o escopo (Code lane e Bitbucket primeiro) e registrar a decisão
- Ferramentas e Processos perde prioridade no board Corporate → estacionar o projeto com a decisão registrada

## References

- PRD: docs/prds/archived/wolven-ai-assisted-dev-harness/wolven-ai-assisted-dev-harness-prd.md (adendo do grilling)
- Framing: docs/prds/archived/wolven-ai-assisted-dev-harness/wolven-ai-assisted-dev-harness-problem.md · docs/prds/archived/wolven-harness-init-wizard/wolven-harness-init-wizard-problem.md

### Decisões do grilling (2026-09-24)

| # | Decisão |
|---|---------|
| Q1/Q3 | Repo `WolvenTech/wolven-harness`; pacote e comando `wolven-harness` |
| Q2 | GitHub Packages, escopo `@wolventech` |
| Q4 | Primeiro consumidor: `WolvenTech/agentic-mkt` |
| Q5 | ADRs fora do formato: alertar drift e sugerir migração |
| Q6 | Afirmações sobre ADRs legados: só aviso até migrar |
| Q7 | ADR inexistente: falha sempre, mesmo no modo legado |
| Q8 | Migração: passo opcional do `harness-init`, Human revisa o diff |
| Q9/Q10 | CLI cria só o que falta e grava `WOLVEN.md`; integração ao `AGENTS.md` é o passo 0 do wizard |
| Q11 | Modos: completo, leve, só menção; `WOLVEN.md` apagado exceto em só menção; sem `AGENTS.md`, vira `AGENTS.md` |
| Q12/Q13 | 11 skills: `qmd`, `pragmatic-guard`, `harness-init`, `adr`, 7 `code-*` |
| Q14 | Code lane é a Entrega D, depois de A |
| Q15 | Modo normal: só `stable` satisfaz uma afirmação |
| Q16 | Dogfood inclui migrar os 9 ADRs do agentic-mkt |
| Q17 | Instruções de construtor sem agente; GitHub via MCP; `init` pergunta `gh/bit` e `claude/codex/cursor` |
| Q18 | Bitbucket com paridade pela documentação, aberto a correções |
| Q19 | Datas: specs 01/10, A 09/10, B+D 23/10, C 30/10 |
| Q20 | Kill switch: A atrasa >2 semanas; prioridade Corporate muda |
| Q21 | Entendimento confirmado; adendo no PRD; 4 specs |
| Q22 | `WolvenTech/wolven-harness` público (evita seat de colaborador externo); sem `LICENSE`, sem release OSS — distribuição segue interna via GitHub Packages |

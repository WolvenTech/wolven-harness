---
type: knowledge
title: Evaluation design
description: Distinguish search relevance from decision usefulness through bounded trials and observable proof.
status: current
aliases:
  - Eval
checked: 2026-10-22
---

# Evaluation design

**Retrieval question:** Did a pattern card merely appear in search, or did consulting it improve a real harness decision? Search relevance and decision usefulness are separate outcomes.

## Source findings

The AI Pattern Book’s [Eval entry](https://aipatternbook.com/eval.md) is the discovery source for evaluation vocabulary; its Markdown endpoint could not be retrieved during this review, so no detailed claim is attributed to it. Anthropic’s primary [“Demystifying evals for AI agents”](https://www.anthropic.com/research/demystifying-evals-for-ai-agents) defines tasks with inputs and success criteria, trials, graders, transcripts, and outcomes. It recommends combining grader types to match the task, calibrating model graders against human judgment, using both positive and negative cases, isolating trials, and inspecting transcripts for unfair grading or genuine failures. It also cautions that a high pass rate can hide saturation, and that a small pilot cannot support broad efficacy claims.

## Harness assessment

The local `code-spec` skill requires each acceptance criterion to pair with a named proof grounded in an existing repository surface; its Eval / gates section requires real commands. `code-execute` requires fresh command output, a real diff, and validation before a completion claim. For corpus evaluation, the locked [spec](../../specs/archived/ai-patterns-corpus/ai-patterns-corpus-spec.md) separates R6 retrieval proof (expected card among top-three scoped keyword results, followed by full retrieval and live-file comparison) from R11 usefulness proof (three paired real harness decisions, baseline and treatment kept comparable, with useful additions, errors, costs, and limitations recorded). Thus top-three placement measures retrieval relevance, not whether advice changes a decision for the better.

Preserve both positive and negative triggers. For example, a real harness-design question may merit scoped consultation, while “Please fix a spelling error in README” (N1) should not load the corpus. N2’s conflicting-authority case checks that a retrieved recommendation cannot override local permission rules. A useful result may be “no change”; a hit alone is not a win. If the paired cases show no useful addition, or introduce errors or unwanted workflow changes, record that negative evidence and recommend revise/remove for Human review rather than claiming efficacy.

**Tradeoff and counterexample:** Keyword top-three checks are cheap and reproducible, but can reward lexical overlap without decision value. Paired consultations expose practical value and harm, but three cases are a small, task-specific pilot. Do not treat a spelling fix or a high retrieval score as evidence that the corpus improves harness decisions.

**Book:** [AI Pattern Book](https://aipatternbook.com/) ([Eval](https://aipatternbook.com/eval.md)). **Primary source:** [Anthropic, “Demystifying evals for AI agents”](https://www.anthropic.com/research/demystifying-evals-for-ai-agents). **Checked:** 2026-10-22. **Upstream dates:** book entry unknown; Anthropic article published 2026-01-09. **Evidence limits:** the book endpoint was inaccessible; Anthropic’s guidance is practitioner guidance, not a result validating this local corpus. **Review state:** current, with source-access caveat.

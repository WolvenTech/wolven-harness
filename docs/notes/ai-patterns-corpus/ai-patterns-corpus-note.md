---
type: note
title: Curating an AI patterns corpus for harness development
description: Source audit, candidate selection, QMD boundaries, and a proposed seven-card retrieval pilot.
status: draft
---

# Curating an AI patterns corpus for harness development

## Question

Which material from aipatternbook.com is worth curating into a small QMD
collection for developing this harness, how should we verify it, and how
would we tell whether retrieval helps?

Researched on 2026-10-22. This note proposes a pilot; it does not establish
architecture policy, create the collection, or implement an ai-patterns skill.

## Findings

### Recommendation

Start with seven original synthesis cards, organized by recurring harness
questions. Use the book for discovery and terminology, primary sources for
technical evidence, and repository files for local applicability. This division
fits the existing primary-source research gate and the distinction between
external guidance and local decisions. The number seven is a proposed pilot
size, not a research finding. Sources: [.agents/skills/research/SKILL.md](../../../.agents/skills/research/SKILL.md),
[.agents/rules/qmd-first.md](../../../.agents/rules/qmd-first.md).

### Source audit

- The publisher exposes an [llms.txt catalog](https://aipatternbook.com/llms.txt)
  and documents appending `.md` to article URLs. A sampled
  [Markdown article](https://aipatternbook.com/progressive-disclosure.md)
  includes a slug, summary, created/updated dates, and related entries. These
  are useful discovery and freshness fields; they are not evidence validation.
- The catalog reports 314 articles and a 2026-08-31 update, whereas the
  [homepage](https://aipatternbook.com/) reports 324. Recommendation: record
  article retrieval and upstream dates individually; do not assume that the
  catalog is a complete current inventory.
- The publisher's [methodology](https://aipatternbook.com/methodology) says
  an autonomous engine researches, writes, edits, and deploys the book.
  Recommendation: review claims individually rather than treating publication
  as evidence of human verification. This is a statement about its disclosed
  process, not a finding that all entries are inaccurate.
- The [Skill Fitness entry](https://aipatternbook.com/skill-fitness) describes
  a study without identifying it in its Sources section. Follow-through found
  [SWE-Skills-Bench](https://arxiv.org/html/2603.15401v1): its preliminary
  results cover 49 skills and about 565 tasks, with 39 skills showing no
  pass-rate improvement and an average increase of 1.2 percentage points.
  Experiments use Claude Code with Haiku 4.5. This supports checking contextual
  fit; it does not establish the benefit of our proposed corpus or predict
  outcomes for every runtime and model.
- No explicit reuse license was located in the inspected homepage, catalog,
  methodology, or sampled article; attempted `/terms` and `/license` fetches
  were inaccessible. This is an unresolved search result, not a legal
  determination. Recommendation: author short summaries with attribution;
  do not vendor full articles or ship their text in templates without resolving
  reuse terms. Inspection surfaces: [homepage](https://aipatternbook.com/),
  [catalog](https://aipatternbook.com/llms.txt),
  [sample](https://aipatternbook.com/progressive-disclosure.md).

### Proposed admission rule

Admit a card only when all five conditions hold. This rubric is our proposal,
grounded in the local research gate and Anthropic's recommendation to identify
capability gaps on representative tasks before adding skills.
Sources: [.agents/skills/research/SKILL.md](../../../.agents/skills/research/SKILL.md),
[Developing and evaluating skills](https://www.anthropic.com/research/equipping-agents-for-the-real-world-with-agent-skills).

1. Name a concrete development question that should retrieve it.
2. Link an existing harness surface or a demonstrated gap.
3. Add a decision aid, tradeoff, or diagnostic beyond a generic definition.
4. Link a checked primary source for each actionable technical claim; mark
   unsupported claims explicitly and omit them from recommendations.
5. Include a counterexample: when this pattern should not change our workflow.

### Seven proposed cards

The selections and local mappings below are editorial recommendations, not
measured improvements. Each book link is a discovery entry; the adjacent
primary source supports the bounded principle we would retain.

| Card and retrieval question | Discovery entry | Primary evidence to retain | Local mapping and boundary |
| --- | --- | --- | --- |
| Progressive disclosure: when should a skill load its references? | [Progressive Disclosure](https://aipatternbook.com/progressive-disclosure) | [Agent Skills specification](https://agentskills.io/specification): metadata, instructions, and resources load in stages; keep references focused. | Existing `references/` links in [code-spec](../../../.agents/skills/code-spec/SKILL.md). Inspect loading needs before splitting every short skill. |
| Context selection: what information belongs in the current task? | [Context Engineering](https://aipatternbook.com/context-engineering), with [Context Rot](https://aipatternbook.com/context-rot) as an alias | [Anthropic context engineering](https://www.anthropic.com/research/effective-context-engineering-for-ai-agents); [Chroma report](https://www.trychroma.com/research/context-rot) observes length-sensitive performance on its tested models and tasks. | [QMD retrieval guidance](../../../.agents/skills/qmd/SKILL.md). Retrieve selectively; do not invent a universal token limit or apply the report's results to untested models. |
| Verification and gates: what evidence permits work to continue? | [Verification Loop](https://aipatternbook.com/verification-loop), with [Checkpoint](https://aipatternbook.com/checkpoint) as an alias | [Long-running harness experiments](https://www.anthropic.com/research/effective-harnesses-for-long-running-agents) identify premature completion and missing end-to-end verification. | [code-execute](../../../.agents/skills/code-execute/SKILL.md) and [code-spec](../../../.agents/skills/code-spec/SKILL.md) already specify proofs and gates. Improve a demonstrated gap; avoid adding another approval at every check. |
| Session continuity: what must survive a session boundary? | [Handoff](https://aipatternbook.com/handoff) | [Long-running harness experiments](https://www.anthropic.com/research/effective-harnesses-for-long-running-agents) use progress records and Git history to resume incremental work. | [handoff](../../../.agents/skills/handoff/SKILL.md) is ask-only and writes to OS temp. Research does not authorize invoking it automatically or importing the experimental harness wholesale. |
| Skill fitness: does this skill earn its loading cost? | [Skill Fitness](https://aipatternbook.com/skill-fitness) | [SWE-Skills-Bench](https://arxiv.org/html/2603.15401v1) supplies paired, execution-based evaluation and warns about contextual mismatch. | Compare a proposed skill against the existing workflow on matching tasks. The benchmark tests skills, not QMD retrieval; its figures are not expected corpus gains. |
| Evaluation design: how can we distinguish retrieval from useful outcomes? | [Eval](https://aipatternbook.com/eval) | [Anthropic evaluation guidance](https://www.anthropic.com/research/demystifying-evals-for-ai-agents) recommends clear tasks, real failure cases, and positive and negative examples. | Existing acceptance/proof pairs in [code-spec](../../../.agents/skills/code-spec/SKILL.md). Separate search relevance from whether advice improves the decision. |
| Authority boundaries: which actions need explicit authorization? | [Approval Policy](https://aipatternbook.com/approval-policy), with [Bounded Autonomy](https://aipatternbook.com/bounded-autonomy) as an alias | [Building effective agents](https://www.anthropic.com/research/building-effective-agents) describes environmental feedback, human checkpoints, and stopping conditions. It does not define this repo's permissions. | [code-review](../../../.agents/skills/code-review/SKILL.md) has explicit ask-only and never-merge boundaries. External guidance cannot grant authority or override the user's instructions. |

Do not add separate first-pass cards for Skill, Checkpoint, Context Rot, or
Bounded Autonomy: the proposed cards above already cover their immediate
retrieval questions. Keep their names as search aliases. The [Agent Skills
specification](https://agentskills.io/specification) should be the direct
reference for skill format, rather than duplicating the book's introductory
[Skill article](https://aipatternbook.com/skill). This is a scope choice, not a
claim that those articles lack value.

### Card shape and maintenance

Proposed size: 250–450 words per card, adjusted when a real question requires
more. Separate `Source findings` from `Harness assessment`. Include title,
aliases, retrieval question, applicability, counterexample, source URLs,
upstream date if supplied, checked date, and evidence limitations. Put critical
qualifiers beside the claim so a retrieved excerpt carries them. These are
editorial choices motivated by focused on-demand resources in the [Agent
Skills specification](https://agentskills.io/specification) and QMD's
chunked retrieval in its [version-matched README](https://raw.githubusercontent.com/tobi/qmd/v2.5.3/README.md).

Proposed maintenance: recheck sources before relying on a card for a consequential
decision, after a relevant runtime or local workflow change, and in a small
quarterly review. Record `needs-review` on stale cards; retire those that have
no distinct question or are superseded. Retrieval dates describe when we checked
a source, not when its claims became true. Version/context sensitivity is
supported by [SWE-Skills-Bench](https://arxiv.org/html/2603.15401v1); the cadence
is our proposed operating choice.

### QMD design

Use one collection named `ai-patterns`, with explicit `-c ai-patterns` searches
after local ADR lookup. Recommend a distinct repository folder such as
`knowledge/ai-patterns/`, outside the existing notes glob, so the cards are not
also indexed by `notes`. The current collection roots are defined in
[.qmd/index.yml](../../../.qmd/index.yml), and local trust order is defined in
[qmd-first](../../../.agents/rules/qmd-first.md). The folder is proposed, not
created by this research.

The installed CLI reports QMD 2.5.3. Its [collection source](https://raw.githubusercontent.com/tobi/qmd/v2.5.3/src/collections.ts)
supports `includeByDefault: false`. Recommend that setting for this collection
and collection context saying: external research, advisory, local decisions
take precedence. QMD supports collection context, scoped searches, and document
retrieval in its [2.5.3 README](https://raw.githubusercontent.com/tobi/qmd/v2.5.3/README.md).
This scopes retrieval; it is not a security or instruction-priority guarantee.

Start with keyword retrieval, then assess semantic retrieval after embeddings
work. During research, `qmd status` reported 23 indexed documents, zero vectors,
and a 14-day-old index; keyword searches returned no corpus-specific decision,
and a direct repository search found no existing corpus. These are local
observations, not proof of absence from every historical document. Search-mode
behavior is documented in the [2.5.3 README](https://raw.githubusercontent.com/tobi/qmd/v2.5.3/README.md).

### Proposed pilot acceptance

Use the following six questions as a manual smoke set. These are suggested
checks, not results already obtained. Positive and negative cases follow the
evaluation design advice in [Demystifying evals](https://www.anthropic.com/research/demystifying-evals-for-ai-agents).

| Question | Expected evidence or behavior |
| --- | --- |
| A skill loads all reference files at startup; what should we inspect? | Progressive disclosure appears in the top three scoped hits. |
| A fresh session cannot tell which work passed; what must persist? | Session continuity appears in the top three; local handoff remains ask-only. |
| Tests pass but the visible feature fails; what proof is missing? | Verification appears in the top three and distinguishes existing checks from user-observable evidence. |
| Should we add a skill because its guidance sounds useful? | Skill fitness or evaluation appears in the top three; answer asks for task-specific evidence. |
| Please fix a spelling error in README. | The consultation workflow should not load the corpus. |
| A book recommends automatic PR reviews; may this repo do that? | Answer preserves the explicit local ask-only rule. |

For the four positive cases, retrieve and inspect the full card and its live
sources, not snippets alone. For default-scope searches, verify external cards
are absent; explicit collection searches must find them. Also retrieve a card
by docid and compare it with the file on disk. The live-read requirement comes
from [.agents/skills/qmd/SKILL.md](../../../.agents/skills/qmd/SKILL.md).

Then compare consultation on three actual harness decisions with the existing
workflow, holding task, model, and available repository state constant. Record
what useful tradeoff or evidence was added, unsupported claims, contradictions,
and retrieval/context cost. Three cases are a usefulness pilot, not a reliable
statistical estimate. Do not infer skill or corpus efficacy from green source
tests alone. This proposed comparison adapts the paired method in
[SWE-Skills-Bench](https://arxiv.org/html/2603.15401v1).

## Sources

| Source | Type | Used for |
| --- | --- | --- |
| aipatternbook.com homepage, llms.txt, methodology, and linked entries above | Publisher material | Catalog, format, provenance, and candidate discovery; not sole technical evidence |
| agentskills.io/specification | Official specification | Skill format and focused on-demand resources |
| Anthropic articles linked above | First-party engineering reports | Context selection, verification, continuity, evaluation, and stopping conditions |
| arxiv.org/html/2603.15401v1 | Primary research preprint | Paired skill evaluation and limits on generalization |
| trychroma.com/research/context-rot | Primary technical report | Length-sensitive performance in tested settings |
| tobi/qmd v2.5.3 README and src/collections.ts | Official versioned documentation and source | Collection scope, retrieval, context, and default exclusion |
| .qmd/index.yml, .agents/rules/qmd-first.md, and linked local skills | Repository sources | Existing retrieval configuration, evidence rules, and workflow boundaries |

## Open questions

- Does the proposed collection improve real decisions enough to justify a
  separate skill? No corpus or paired decision pilot has run yet.
- Which license or publisher permission would apply to storing or distributing
  full articles? No explicit grant was located; this proposal uses original
  synthesis and links.
- Should the seven-card pilot live in this repository's proposed `knowledge/`
  folder or a shared personal knowledge repository? The choice affects reuse,
  ownership, and update responsibility.
- Who owns source review and retirement if the pilot becomes permanent?
- Can semantic retrieval run reliably in the current environment? Keyword
  retrieval works; the existing index initially had no embeddings.

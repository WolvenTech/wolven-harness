---
name: ai-patterns
description: Consults the seven curated AI-pattern cards under docs/knowledge/ai-patterns/ and answers one concrete harness design or failure question with a sourced, locally checked recommendation. Use only when the Human explicitly asks for an ai-patterns consultation; ask-only, never invoked automatically.
disable-model-invocation: true
---

# AI patterns

Answers one concrete harness question by reading the AI-pattern cards, checking
them against this repository, and returning the smallest recommendation the
evidence supports. "No change" is a valid answer.

Ask-only: it runs only on a direct ask, and nothing else invokes it.

**Consult:** `qmd`. Use the [qmd skill](../qmd/SKILL.md) for search and retrieval mechanics only.
**Input:** an explicit ask plus a concrete question, such as "should `code-plan`
load its examples on demand?" or "why did the resume record drift?".
**Output:** a consultation reply in the shape under [Answer](#5-answer). It
writes no files.

## Pilot verdict

The 2026-10-22 pilot compared three real harness decisions with and without a
card. It found one tie and two worse answers, and its verdict is
"revise before permanent adoption"
([pilot record](../../../docs/specs/archived/ai-patterns-corpus/ai-patterns-corpus-pilot.md)).
Cards can mislead, so check every card claim against local files before it
shapes a recommendation.

## Cards

| Card | Reach for it when the question is about |
|---|---|
| [authority-boundaries](../../../docs/knowledge/ai-patterns/authority-boundaries.md) | When an agent may proceed, must prepare and wait, or must stop for explicit authorization |
| [context-selection](../../../docs/knowledge/ai-patterns/context-selection.md) | What context to load for a task, and what to leave out (`review: needs-review`) |
| [evaluation-design](../../../docs/knowledge/ai-patterns/evaluation-design.md) | Telling search relevance apart from decision usefulness; bounded trials |
| [progressive-disclosure](../../../docs/knowledge/ai-patterns/progressive-disclosure.md) | Loading references on demand while keeping essential constraints in the parent |
| [session-continuity](../../../docs/knowledge/ai-patterns/session-continuity.md) | Carrying verified state across a session boundary |
| [skill-fitness](../../../docs/knowledge/ai-patterns/skill-fitness.md) | Whether a skill earns its loading and maintenance cost |
| [verification-and-gates](../../../docs/knowledge/ai-patterns/verification-and-gates.md) | Observable proof and explicit gates before work continues |

Each card has frontmatter (`review`, `checked`, `upstream`), then
**Source findings** (what the primary sources say) and **Harness assessment**
(how that maps onto this repo, with a counterexample and evidence limits).

## Hard gates

1. **Read-only.** A consultation edits no card, skill, rule or config, and
   authorizes nothing: no implementation, commit, PR, merge, review or CI run.
2. **Local authority wins.** The Human's request, ADRs, a locked spec or plan,
   and the active skill's permissions all outrank a card. When a card conflicts
   with one, report the conflict and keep the local rule. For example, a card
   that suggests automatic PR review does not change
   [code-review](../code-review/SKILL.md)'s explicit-ask rule, nor
   [code-ci](../code-ci/SKILL.md)'s or [handoff](../handoff/SKILL.md)'s.
3. **Always scope the search.** `knowledge` is excluded from default searches,
   so always pass `-c knowledge`; a search without it can never return a card.
4. **Three cards at most** to start. Read a fourth only after naming the open
   question it would answer.
5. **Primary sources before a consequential recommendation.** A card's Source
   findings are leads. Reopen the primary source before recommending a change
   to a skill, rule or gate; if it can't be reached, say so and narrow or
   withhold that part.

## Workflow

### 1. Frame

Restate the question in one sentence and name the local surfaces it touches
(skills, rules, ADRs, specs). Read those files directly. A decision question
searches ADRs first: `qmd query -c adrs "<question>"`.

### 2. Find cards

Pick candidates from the [Cards](#cards) table, then confirm with a scoped
search:

```sh
qmd search '<keywords>' -c knowledge -n 3
```

Keep only hits under `qmd://knowledge/ai-patterns/`. A miss is a retrieval
limit, not proof that no pattern applies.

### 3. Read

Open each chosen card's live file under `docs/knowledge/ai-patterns/`; don't rely
on the search snippet. Note its `review` state and `checked` date, its source
findings, harness assessment, counterexample and evidence limits.

### 4. Check against the repo

For each card claim you intend to use, find the local file that confirms or
contradicts it. A claim that no local file supports stays a lead, not a finding.

### 5. Answer

Reply in this shape:

```markdown
**Question:** <one sentence>
**Cards:** <links, with review state and checked date>
**Local fit:** <what the repo already does, with file links>
**Tradeoff:** <the card's counterexample or cost, applied here>
**Caveats:** <needs-review cards, unreachable sources, pilot verdict>
**Recommendation:** <smallest justified change, or "no change">
```

When the consultation feeds a stage handoff (a spec, plan or review), also list
the collections searched and the exact card paths read.

## Failures

| Situation | Do |
|---|---|
| `knowledge` collection missing | Report it, check `.qmd/index.yml`, then read card files directly and label that evidence as direct-file. Don't edit the config. |
| QMD or model error | Report the command and its actual error, then fall back to keyword search or direct files. Retry once only after a concrete fix. |
| Card is `needs-review`, or its `checked` date predates a relevant change | Say so, and qualify or withhold the advice that depends on it. |
| No card fits | Answer from local files and say no card applied. |

## Changing cards

Card edits are outside a consultation and need an explicit write scope from
the Human. In that scope:

- Mark a card `review: needs-review` when evidence shows it is stale, and set
  it back to `current` with a fresh `checked` date after primary and local
  checks.
- Retire a card by moving it under an `archived/` subtree, then run
  `qmd update`; `review: retired` alone leaves it searchable.
- Run `qmd update` once after the edits land, not on every read.

## When not to use

- Answering a question the repo already settles in an ADR, spec or skill:
  cite that file instead.
- Researching a new pattern from primary sources: use `research`.
- Deciding a durable choice: use `adr` once the consultation has informed it.

## Anti-patterns

- Searching without `-c knowledge` and concluding no card exists
- Quoting a card's Source findings as settled fact without the primary source
- Letting a card override an ADR, a locked spec, or an ask-only rule
- Recommending a change from a `needs-review` card without saying so
- Reading every card "to be thorough" instead of the two or three that fit

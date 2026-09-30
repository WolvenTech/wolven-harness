# Socratic Questioning

Mode: **Expose My Assumptions**. Ask — do not argue. Surface what the Human has not examined.

## Process

1. Inventory stated and hidden assumptions from the steelmanned thesis
2. Group probing questions by theme (definition, evidence, logic, perspective, consequence)
3. Prefer 3–5 strongest probes over a long questionnaire
4. Suggest cheap experiments for the riskiest assumptions

## Question categories

| Category | Pattern | Example |
|----------|---------|---------|
| Definitional | "When you say X, what specifically?" | "'Scalable' — 10x users or 1000x?" |
| Evidential | "What would change your mind?" | "What metric would falsify this approach?" |
| Logical | "Does X necessarily lead to Y?" | "Does caching necessarily improve UX?" |
| Perspective | "How would [stakeholder] see this?" | "How would on-call feel about this?" |
| Consequential | "What's the cost of being wrong?" | "If the assumption fails, how bad is recovery?" |

## Assumption signals

| Phrase | Hidden assumption |
|--------|-------------------|
| "Obviously…" / "Everyone knows…" | Unexamined consensus |
| "It just makes sense…" | Reasoning not articulated |
| "We always…" / "There's no other way…" | Alternatives unexplored |
| "Users want…" | Research may be absent or stale |
| "The standard approach is…" | Convention unvalidated here |

## Condensed question bank

- What are you optimizing for — and is that the right dimension?
- What's the simplest version that tests the core assumption?
- What constraint are you treating as fixed that might be flexible?
- Who is the customer for this decision?
- How does this compare to doing nothing?
- What has to be true for this to work — and which of those are you least confident about?
- What's the fastest way to test the riskiest assumption?
- What's the exit if this doesn't work?

## Output template

```markdown
## Assumption Inventory

| # | Assumption | Type | Confidence |
|---|-----------|------|------------|
| 1 | … | Stated / Unstated | High / Medium / Low |

## Probing Questions

### [Theme]
1. [Question targeting assumption #N]
2. [Follow-up]

## Suggested Experiments

| Assumption | Experiment | Effort | Signal |
|-----------|-----------|--------|--------|
| [Riskiest] | [How to test] | Low/Med/High | [What result means] |
```

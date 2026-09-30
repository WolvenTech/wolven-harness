# Evidence Audit

Mode: **Test the Evidence**. A claim is meaningful only if you can say what would disprove it. Audit whether evidence actually supports the conclusion — do not merely try to disprove for sport.

## Process

1. Extract specific claims (often implicit) from the proposal
2. Design falsification criteria per claim
3. Grade evidence quality
4. Check for cognitive biases
5. Surface competing explanations for the same evidence

## Claim types

| Type | Example shape |
|------|---------------|
| Causal | "X causes Y" |
| Predictive | "X will happen" |
| Comparative | "X is better than Y" |
| Existential | "No alternative exists" |
| Universal | "X is always true" |
| Quantitative | "X is N" / "saves N hours" |

For each statement: claim or definition? type? cited/implied evidence? what would make it false?

## Falsification

| Claim | Falsification | Test |
|-------|---------------|------|
| Users want feature X | <10% engage in 30 days | Feature flag + adoption |
| Scales to 100K users | p95 > 500ms at 50K | Load test |
| Migration takes 3 months | >2 unknown-unknowns in month 1 | Surprise count |
| This reduces cost | TCO exceeds current within 12 months | Full TCO |

**Unfalsifiable red flags:** vague outcomes ("improve things"), moving goalposts, circular "experts say so", hedges true by definition. Push for a measurable pass/fail.

## Evidence grades

| Grade | Description |
|-------|-------------|
| A | Controlled, large sample, reproducible |
| B | Observational, reasonable sample, consistent |
| C | Case study / small sample / single source |
| D | Anecdote, opinion, vendor marketing |
| F | No evidence cited |

Score sample size, recency, relevance, independence, methodology, specificity. Weak patterns: survivorship bias, cherry-picked metrics, vendor benchmarks, appeal to authority, anchoring.

## Bias checklist

Confirmation, survivorship, anchoring, sunk cost, availability, bandwagon, overconfidence outside expertise, status quo.

## Competing explanations

1. State the evidence
2. State the proposed explanation
3. Generate 2–3 alternatives
4. Compare explanatory power

## Output template

```markdown
## Evidence Audit: [Proposal]

### Claims Extracted

| # | Claim | Type | Evidence cited |
|---|-------|------|----------------|
| 1 | … | Causal/… | … |

### Falsification Criteria

| Claim | What would disprove it | How to test |
|-------|------------------------|-------------|
| #1 | … | … |

### Evidence Quality

| Claim | Grade | Key weakness |
|-------|-------|--------------|
| #1 | A–F | … |

### Bias Check

| Bias | Where | Impact |
|------|-------|--------|
| … | Claim #N | … |

### Competing Explanations

| Evidence | Proposed | Alternatives |
|----------|----------|--------------|
| … | … | 1. … 2. … |

### Verdict

**Overall evidence strength:** Strong / Moderate / Weak / Insufficient
**Recommendations:** …
```

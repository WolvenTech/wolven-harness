# Dialectic Synthesis

Mode: **Argue the Other Side**. Build the strongest counter-argument, then propose a synthesis. Not about winning — about a stronger position than thesis or antithesis alone.

## Process

1. Restate and confirm the steelmanned thesis
2. Construct the strongest antithesis a smart, informed skeptic would make
3. Show where thesis and antithesis genuinely conflict
4. Propose a synthesis (or name an irreconcilable trade-off)

## Steel man checklist

- [ ] Position is stronger, not weaker
- [ ] Human would recognize it as their view (or better)
- [ ] Strongest supporting evidence included
- [ ] You attack this version, not an easier one

## Antithesis sources

| Source | Example |
|--------|---------|
| Opposing trade-off | Speed now vs maintainability later |
| Hidden cost | Migration cost exceeds savings for 18 months |
| Alternative that solves the same problem | Modular monolith gets most of the benefit cheaper |
| Precedent | Similar org tried this and reverted |
| Underserved stakeholder | Juniors struggle with the added complexity |

Use reductio sparingly — to mark a principle's boundary, not to dismiss it.

## Synthesis patterns

| Pattern | Shape |
|---------|-------|
| Conditional | X when A; Y when B |
| Scope partitioning | X in domain A; Y in domain B |
| Temporal | Start with X; migrate to Y when trigger Z |
| Risk mitigation | Proceed with X; add safeguards from Y |
| Hybrid extraction | Strongest element from each side |

## Confidence

| Level | Meaning | Action |
|-------|---------|--------|
| HIGH | Synthesis clearly stronger | Proceed with it (Human still decides) |
| MEDIUM | Plausible but untested | Name riskiest assumption + experiment |
| LOW | Irreconcilable strong claims | Name the trade-off; Human picks by priority |
| PIVOT | Antithesis stronger | Recommend reconsidering the original |

## Anti-patterns

- False synthesis ("just do both") without resolving tension
- Weak / straw antithesis
- Synthesis suspiciously identical to the original thesis
- Complexity creep or vague "it depends" without conditions

## Output template

```markdown
## Thesis (Steelmanned)

[Strongest restatement]
**Strongest evidence for:** …

## Antithesis

[Strongest counter]
**Strongest evidence for:** …

## Points of Genuine Conflict

| Dimension | Thesis | Antithesis |
|-----------|--------|------------|
| … | … | … |

## Proposed Synthesis

**Pattern:** Conditional / Scope / Temporal / Risk Mitigation / Hybrid
[Concrete proposal]
**Preserves from thesis:** …
**Incorporates from antithesis:** …
**Gives up:** …
**Confidence:** HIGH / MEDIUM / LOW / PIVOT
```

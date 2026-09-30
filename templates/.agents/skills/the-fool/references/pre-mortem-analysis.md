# Pre-Mortem Analysis

Mode: **Find the Failure Modes**. Invert optimism: *"It's N months from now and this has failed. Why?"*

## Process

1. Set the scene — clear failure, not a small setback
2. Write specific failure narratives (not vague "it didn't scale")
3. Rank by likelihood × impact
4. Trace first → second → third-order effects
5. Name early warning signs
6. Design concrete mitigations

## Narrative specificity

A failure narrative must:

- Name a specific trigger
- Include a number or measurable cutoff
- Describe the chain of events, not only the end state
- Identify who or what is affected
- Be plausible (not fantasy)

```markdown
**Failure: [Title]**

It's [timeframe] from now. [Trigger]. This caused [1st order],
which led to [2nd order]. The team discovered it when [detection],
but by then [consequence]. Root cause: [assumption that proved wrong].
```

## Second-order chains

```
Trigger: …
  → 1st order: …
    → 2nd order: …
      → 3rd order: …
```

Common patterns: late ship → trust erosion; perf degrade → workarounds become requirements; burnout → bus-factor collapse; dependency break → hotfixes bypass testing.

## Inversion

Ask: **"What would guarantee this fails?"** Check whether those conditions already exist (single knowledge holder, no rollback, untested at scale, no buffer, migration without validation).

## Condensed failure patterns

| Domain | Pattern | Typical consequence |
|--------|---------|---------------------|
| Technical | Integration cliff / scale surprise / migration trap | Cascading outage or unrecoverable cutover |
| Business | Adoption cliff / timing mismatch / hidden cost | Sunk cost, wrong problem solved |
| Process | Timeline fantasy / knowledge silo / feedback void | Crunch, stall, wrong product built correctly |

## Early warning signs

| Signal | Indicates |
|--------|-----------|
| "We'll figure that out later" ×3+ | Critical decisions deferred |
| No one can explain rollback | Rollback undesigned |
| Estimates keep growing | Hidden complexity surfacing |
| "It works locally" | Environment parity weak |
| No success metrics | No one will know if it worked |

## Output template

```markdown
## Pre-Mortem: [Name]

**Timeframe:** …

### Failure Narratives

#### 1. [Title] — Likelihood: H/M/L | Impact: H/M/L
[Narrative]
**Consequence chain:** 1st → 2nd → 3rd

### Early Warning Signs

| Signal | Predicts | Check |
|--------|----------|-------|
| … | Failure #N | Weekly / Sprint |

### Mitigations

| Failure | Mitigation | Effort | Reduces risk by |
|---------|-----------|--------|-----------------|
| #1 | [Specific action] | L/M/H | … |

### Inversion Check

**What would guarantee failure:** …
**Do any exist now?** …
```

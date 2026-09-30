# Mode Selection Guide

Recommend a mode when the Human picks **You choose**, or when auto-recommending before confirmation.

## Signal → mode

| Human signal | Recommend | Why |
|--------------|-----------|-----|
| "Is this the right approach?" | Expose My Assumptions | Exploring; not yet committed |
| "I'm about to commit to X" | Argue the Other Side | Needs strongest counter before commit |
| "What could go wrong?" | Find the Failure Modes | Explicit failure ask |
| "Is this secure/safe?" | Attack This | Adversarial framing |
| "The data shows…" / "Studies show…" | Test the Evidence | Claims need falsification |
| "Everyone agrees…" | Expose My Assumptions | Consensus hides assumptions |
| "We chose X over Y" | Argue the Other Side | Trade-off needs counter |
| "This will definitely work" | Find the Failure Modes | Overconfidence |
| "No one would ever…" | Attack This | Adversary-behavior assumption |

## Decision type → mode

| Decision type | Primary | Secondary |
|---------------|---------|-----------|
| Technology choice | Argue the Other Side | Find the Failure Modes |
| Architecture | Find the Failure Modes | Attack This |
| Business strategy | Argue the Other Side | Test the Evidence |
| Security design | Attack This | Find the Failure Modes |
| Data-driven conclusion | Test the Evidence | Expose My Assumptions |
| Process / workflow | Find the Failure Modes | Expose My Assumptions |
| Vendor / trade-off | Argue the Other Side | Find the Failure Modes |
| Risk assessment | Attack This | Find the Failure Modes |

## Domain defaults

| Domain | Default | Why |
|--------|---------|-----|
| Security | Attack This | Adversarial thinking is native |
| Infrastructure | Find the Failure Modes | Failures dominate |
| Data / analytics | Test the Evidence | Claims need scrutiny |
| Product / UX | Expose My Assumptions | User assumptions need surfacing |
| Business / strategy | Argue the Other Side | Counter strengthens strategy |
| Architecture | Find the Failure Modes | Systems fail at seams |

## Multi-mode sequences

| Sequence | When |
|----------|------|
| Expose My Assumptions → Argue the Other Side | Untested idea: surface assumptions, then counter |
| Find the Failure Modes → Attack This | High-stakes launch: internal failures, then external attacks |
| Test the Evidence → Expose My Assumptions | Data-driven proposal: audit evidence, then interpretation |
| Argue the Other Side → Find the Failure Modes | Strategic decision: counter, then stress-test what survives |

Suggest a second pass when the first mode reveals a new risk category, the thesis survives largely intact, or the domain spans two mappings. Skip when the ask is narrow, the first mode already produced actionable changes, or the Human wants to move on.

## Recommendation format

```
Based on [specific context signal], I recommend **[Mode]** because [one-sentence rationale].

[Optional:] After that, a follow-up with **[Secondary]** would [one-sentence benefit].
```

Then confirm with a question tool or grilling-style markdown:

```
❓ **Q — Confirm mode**: Proceed with the recommendation?

Options:
a) (Recommended) [Primary mode]
b) [Secondary mode if any]
c) Let me pick — return to full mode selection

➡️ Recommended: a — <one-line why>
```

## Edge cases

- Vague context → Expose My Assumptions
- Multiple concerns → Find the Failure Modes
- Frustrated / emotional Human → Argue the Other Side (steelman first)
- Technical vs business split → match the side the Human emphasizes

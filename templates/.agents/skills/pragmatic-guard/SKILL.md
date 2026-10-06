---
name: pragmatic-guard
description: "Enforces strict YAGNI — challenges over-build, refuses additions without a present need, and records deferrals with revisit triggers under docs/deferrals/. Use when adding features, abstractions, dependencies, or \"we might need\" work."
---

# Pragmatic Guard (Strict)

## When invoked

1. Read the standing rule, `.agents/rules/yagni-strict.md`.
2. Exemptions: security, data integrity, compliance, accessibility — never
   refuse or weaken these on YAGNI grounds.
3. Score present **need** (0–10) vs **complexity** (0–10) for the proposed
   addition. Question every "should" and "could", and challenge new
   abstractions, dependencies, patterns, premature performance work, upfront
   test infrastructure, and flexibility knobs.
4. Approve only when present need ≥ complexity. Otherwise **refuse** and
   propose the absolute minimal implementation for current requirements.
5. If the refused work is deferred: create or update
   **`docs/deferrals/<slug>/<slug>-deferral.md`** only — never `docs/` root
   or repo root. Frontmatter: `type: deferral`, `title`, `description`,
   `status` (`draft`, `stable`, or `deprecated`). Include trigger checkboxes
   (`- [ ]`) — concrete, observable conditions that would justify revisiting
   the work. `<slug>`: kebab-case, ASCII.

Never expand scope silently: every addition gets a verdict, and deferred work
gets a deferral file.

## Output

Reply with the five fields of the example below: need and complexity, each
with its reason (the challenge); the verdict; the simpler path; and the
deferral path with its trigger, if one was recorded.

## Worked refuse example

**User ask:** "Add a plugin system so future integrations can hook in without
touching core."

| Field | Value |
|-------|-------|
| Need | 1/10 — no second integration exists yet |
| Complexity | 8/10 — new extension points, versioned contracts, discovery and registration machinery |
| Verdict | **Refuse** the plugin system |
| Simpler path | Add the one integration directly; extract a seam only when a second integration actually needs it |
| Deferral | `docs/deferrals/plugin-system/plugin-system-deferral.md`, trigger: "a second integration is requested" |

## Anti-patterns

- Silent scope expansion without a recorded deferral.
- Approving "we might need it" without present need ≥ complexity.
- Creating deferrals outside `docs/deferrals/`.

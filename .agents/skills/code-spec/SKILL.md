---
name: code-spec
description: "Freezes design and requirements for a code initiative into a spec, from a PRD or a confirmed ask, with obligation-proof pairs, nine dimensions, and typed Unresolved rows. Use when an approved PRD or a confirmed code-shaped ask needs a spec before planning."
---

# Code Spec

Turns an approved PRD, or a confirmed code-shaped ask, into a frozen spec
ready for `code-plan` to slice into units.

**Consult:** `pragmatic-guard`.
**Input:** an approved PRD, or a code-shaped ask the Human confirms directly.
**Output:** `docs/specs/<slug>/<slug>-spec.md` (frontmatter `type: spec`).

**References (read when):**

| File | When to read |
|------|--------------|
| [TEMPLATE.md](references/TEMPLATE.md) | Before drafting — the spec skeleton |
| [EXAMPLE.md](references/EXAMPLE.md) | Unsure how to fill an obligation ↔ proof row, a nine-dimension landing, a Waves diagram, or an Eval / gates row |

## Where this sits

A PRD is optional input: when the `create-prd` skill is installed it drafts and approves the problem and its user stories, and without it `code-spec` starts from the requirements the Human states. `code-spec` freezes the requirements and design that follow. `code-plan` slices the frozen spec into ordered units. `code-execute` implements those units. Any of them may be invoked directly when the Human asks for it out of order.

## Hard gates

1. Ceremony needed — skip this skill for a one-file change; go straight to
   `code-execute` with `harness:validate`.
2. Spec home is `docs/specs/<slug>/<slug>-spec.md`, never inline chat-only.
3. Real commands only — acceptance boxes and eval rows name real commands;
   no placeholder marked done.
4. Freeze — every acceptance criterion pairs with a named obligation ↔ proof
   row grounded in the repository, not an invented surface; all nine
   dimensions land; every `n/a` cites the unchanged surface it means;
   missing product decisions become a typed row under Unresolved — never
   invented behavior.
5. No executable plan — this skill freezes requirements and design only.
   Unit order and wave packing belong to `code-plan`, after the Human
   approves this spec.

## Workflow

1. Read the PRD in full, or the confirmed ask when there is no PRD.
2. **Term challenge.** List the terms this spec relies on and check each
   against `docs/` and the existing ADRs — search with a knowledge tool
   first, if one is available, before reading the tree by hand. Reuse a
   name already in use; record a new term at its first use.
3. **Repository grounding.** List what already exists on disk — skills,
   ADRs, scripts, prior specs — that this initiative depends on. Cite what
   exists; never invent a surface.
4. **Surface walk.** Name the paths and systems in mutate scope, and those
   deliberately left out of scope.
5. Draft from [TEMPLATE.md](references/TEMPLATE.md): obligation ↔ proof
   requirements, each paired with an acceptance box, plus out of scope and
   refuses.
6. **Nine-dimension landings.** Land all nine, each as gate 4 requires:
   validation, failure modes, idempotency and retry, authorization,
   concurrency and ordering, data lifecycle, external-dependency failure,
   state transitions, and observability.
7. **Waves.** When the work spans more than one mutate batch, add a Waves
   section: name each wave and its gate command, and state that a failed
   gate aborts before the next wave, so `code-plan` can encode the same
   stops as unit boundaries. Prefer not mixing waves inside one batch.
8. **Eval / gates.** Fill the Eval / gates table with the deterministic
   checks a builder must run, including a structural check that every
   acceptance box pairs with a named obligation ↔ proof row, before handoff
   to `code-plan`. The integrity gate is `harness:validate`.
9. **Cross-domain leaks.** Fill the Cross-domain leak table with asks that
   belong to a different lane, and name where each one actually belongs.
10. **ADR.** When the spec settles a durable architecture decision, use the
    `adr` skill, by name, to create, promote, or supersede it. Numbering
    and supersession live in `adr`; this section only decides whether one
    is owed.
11. Present the draft for the Human to approve; revise in place, and
    present again whenever a revision changes something material.
12. Hand off to `code-plan` once approved.

## When not to use

- The scope is still undecided — settle it first (`grilling`, or
  `create-prd` when installed), then come back once the destination is
  clear.
- Slicing an already-frozen spec into ordered work — that is `code-plan`.

## Pragmatic-guard

Prefer the thinnest spec that unblocks `code-plan`. Refuse an empty
placeholder spec, or one with no Eval / gates table.

## Anti-patterns

- Mixing two waves into one mutate batch to skip a gate
- One proof reused across more than one obligation
- Citing a doc path that doesn't exist yet instead of a `<slug>`
  placeholder

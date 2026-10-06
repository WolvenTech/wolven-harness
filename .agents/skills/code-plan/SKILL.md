---
name: code-plan
description: "Turns a locked spec into ordered work units for code-execute, with dependencies, owned paths, an observable Done when, wave stops, and an explicit Subagent value per unit. Use when a spec is locked and needs a plan before execution."
---

# Code Plan

Produces a **work-unit index**: numbered units with dependencies, an owned
file/path scope, an explicit execution mode, and an observable Done when.

**Consult:** `pragmatic-guard`.
**Input:** a locked spec.
**Output:** `docs/specs/<slug>/<slug>-plan.md` (frontmatter `type: spec`),
written next to `docs/specs/<slug>/<slug>-spec.md`.

**References (read when):**

| File | When to read |
|------|--------------|
| [EXAMPLE-units.md](references/EXAMPLE-units.md) | Drafting a units table, wave stops, or Unresolved rows |
| [TEMPLATE-plan.md](references/TEMPLATE-plan.md) | Starting a new plan file from a blank skeleton |

**In / out / handoff:** locked spec → ordered, revisable plan → units ready
for `code-execute` once the plan is approved.

## Structural gate

Before slicing into units, confirm every obligation the spec names already
maps to a named proof or an explicit verification method. An obligation
with no way to check it is a gap in the spec, not something to paper over
with a vague unit — stop and get the proof named first.

## Hard gates

1. The spec is locked (`status: stable`), or explicitly skipped for tiny
   work — then skip this skill too.
2. Units are **agent-sized vertical slices** — each owns one coherent
   observable outcome end-to-end, never a layer-only cut ("all templates"
   then "all tests") that `code-execute` can't verify per obligation.
3. **Observable Done when** — each unit names (a) observable behavior and
   (b) a named proof from the spec **or** an explicit gate check. A Done
   when that only lists paths or files fails this gate.
4. No circular or missing dependencies; the frontier is exactly the
   unblocked units.
5. **Wave alignment** — when the spec names phased waves, units respect the
   wave stops. Prefer one wave per mutate batch, and never mix waves in one
   batch to skip a gate unit.
6. **Unresolved preserved** — every blocking open question from the spec
   appears as a typed row in the plan (see Unresolved); never invent a
   Disposition for one.
7. Every unit names a **Subagent** value: `spawn` or `inline` (see Subagent
   column). Never leave it blank or invent a third value.
8. Do not start execution from this skill — hand off only after the plan is
   approved.

## On-disk layout

| Output | Path |
|--------|------|
| Spec | `docs/specs/<slug>/<slug>-spec.md` |
| Plan | `docs/specs/<slug>/<slug>-plan.md` |
| Iteration spec (delta) | `docs/specs/<slug>/<slug>-iteration-<N>-spec.md` |
| Iteration plan (review fixes) | `docs/specs/<slug>/<slug>-iteration-<N>-plan.md` |

All live in the same slug folder under `docs/specs/`. An iteration plan
includes a finding → unit map and a closing unit that re-reports every
finding as `fixed`, `skipped` or `no_change_needed`.

## Workflow

1. Read the spec, including any phased execution and its Unresolved rows,
   and pass the structural gate.
2. Draft a numbered units table: `#`, title, Depends, Owns, **Subagent**,
   Done when — see [EXAMPLE-units.md](references/EXAMPLE-units.md). Each
   Done when opens with an unchecked `[ ]`: the unit's plan-completion
   mark, which `code-execute` flips to `[x]` in the same commit as the
   unit's work.
3. Carry every blocking open question into the typed Unresolved table,
   mapped to the unit or wave it blocks.
4. Check the draft against the safety valve; re-slice or escalate until
   every unit is verifiable on its own.
5. Note which units can run in parallel; state the frontier pull order and
   the wave stops.
6. Write `docs/specs/<slug>/<slug>-plan.md`, next to the spec, from
   [TEMPLATE-plan.md](references/TEMPLATE-plan.md) or from scratch.
7. Hand off to `code-execute` once the plan is approved.

`code-execute` fills in its own inline execution/resume bookkeeping in this
same plan file as work proceeds; this skill only produces the initial units
table, Unresolved rows, and wave stops.

## Subagent column (plan table)

Every unit names exactly one value:

| Subagent | Meaning |
|---|---|
| `spawn` | The unit runs as an isolated subagent, given the unit's brief |
| `inline` | The unit runs in the current session — no subagent is spawned |

No third value, and no default: every unit states one explicitly. Use
`inline` for gate units, read-only inspection, small hygiene edits, or
anything that must share state with what came right before it. Use `spawn`
for units whose Owns is disjoint from what else is running, or that
benefit from an isolated context.

## Unresolved (typed rows in the plan)

Carry every blocking open question from the locked spec into the plan.
Minimum columns:

| Field | Requirement |
|---|---|
| Identifier | Stable, unique key |
| Decision needed | The concrete pending choice |
| Owner | Who decides |
| Blocking effect | What can't advance (or explicit non-blocking) |
| Disposition | Resolve before wave / defer with a trigger / refuse with a reason — filled in only once decided |
| Unit | Plan unit (or wave) it blocks — optional but preferred |

Never drop a blocker or fold it into prose-only notes, and never invent a
Disposition — leave it empty until it is actually decided. A non-blocking
open question may stay listed with an explicit non-blocking effect.

## Wave-stop pattern

When the spec defines waves (or the plan spans more than one mutate
batch), every wave ends in an explicit **STOP** gate unit that depends on
every mutable unit in that wave:

| Stop | After | Gate |
|------|-------|------|
| **Wave gate** | last unit in the wave | Named checks and proofs from the spec pass; `harness:validate` PASS — **abort before the next wave** on failure |
| **Ship gate** | final wave | Final closeout checks pass; `harness:validate` PASS — before the plan's output is handed off |

Gate units are `inline`, own no feature diff, and name the checks that
must pass.

## Safety valve

Stop and re-slice when any of:

- A unit's Done when lists more than about five unrelated outcomes
- Done when is a path/file list with no behavior and no proof
- A layer-only slice ("all docs", "all tests") spans multiple obligations
- "And also …" scope creep inside one unit
- The plan runs to more than about 15 vague steps
- The dependency graph is circular, or needs more than three hops to reach
  the frontier
- A unit mixes unrelated kinds of work (structural debt, new behavior,
  hygiene) in one batch

Remedy: split the unit, add a gate unit, or send it back for the spec to
be re-phased. Never hand off a plan that can't be verified unit by unit.

## When NOT to use

- Deciding *what* to build — lock the spec first (`code-spec`).
- Running the units — hand off to `code-execute`; this skill never starts
  execution.
- Tiny tooling — a thin execute pass with no plan file is enough.

## Anti-patterns

- Vague mega-units, or layer-only slices (templates-only, tests-only), instead of vertical outcomes
- A Done when of "files edited", with no observable behavior or named proof
- Dropping or inventing a disposition for an Unresolved row

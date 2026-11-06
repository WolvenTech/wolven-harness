# Approval summary

Before asking for approval, link the real artifact and present its status and
commit state, requirements, material findings, Human decisions and where each
landed, open items, and the decision requested. Show empty findings or open
items as “None” or its equivalent in the chat language.

For the first draft, omit the delta. For a material revision, use the same
summary and link the revised artifact; add a concise delta, map decisions from
the round to the artifact, and surface remaining questions, typed Unresolved
rows, and Human gates. Keep pending feedback in open items, separate from
incorporated changes.

## PRD

Open with the confirmed problem. Use `Entrega / Resultado esperado / Casos de
aceite` or equivalent headings in the chat language, with one row per story and
its acceptance case count.

## Spec

Open with source and scope, then summarize the technical flow. Add a small
Mermaid diagram when it clarifies the flow. Show affected surfaces and
obligation IDs paired with named proofs and evidence. Use one row per wave
when waves exist and one row per obligation for unphased work; do not invent a
wave for unphased work.

## Plan

Lead with wave blocks and gates, naming what each gate blocks. Put a horizontal
divider before the first wave, between waves, and after the last. Show units
only for a single wave or fewer than ten units overall, with unit, dependency,
owned paths, `Subagent`, and Done when.

Highlight each Human gate separately from automatic gates: state who decides,
what they decide, and what waits. Show automatic checks and stop conditions
under the affected wave when present.

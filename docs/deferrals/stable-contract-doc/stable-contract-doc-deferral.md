---
type: deferral
title: Standalone contract document and finding-code reference
description: Keep the normative contract in its active ADR and the reader reference in site/commands.md until recurring supersession work or a consumer request justifies another document.
status: stable
---

# Standalone contract document and finding-code reference

**Deferred:** extracting the normative CLI contract (commands, flags, exit codes, finding codes, summary lines, and `.wolven-harness.json` schema) out of numbered ADRs into a single version-agnostic contract document, and adding a separate consumer-facing contract page with finding-code meanings.

**Why:** the active contract ADR (`ADR-005`) is pinned by `test/contract.test.ts` and the install-experience delivery obligations (`R9.1`). A second normative file would require moving that authority and its proofs deliberately. A separate reader page would duplicate the existing CLI reference without a recorded reader request. These are distinct changes: asking what a finding means does not by itself justify moving the normative contract.

**Today:** human-facing guide pages (`site/release.md`, `site/commands.md`) point to the CLI reference instead of hardcoding a numbered ADR link, while `test/contract.test.ts` continues to verify the normative contract ADR in `docs/adrs/`.

## Triggers

- [ ] A future contract change requires superseding the contract ADR again and repointing `test/contract.test.ts` becomes recurring maintenance overhead.
- [ ] The Human opens a spec to move `test/contract.test.ts` from `docs/adrs/` to a single canonical contract file.
- [ ] A consumer asks for finding-code meanings beyond `site/commands.md`. Then extend that reference first; add a separate page only if needed, generated from or checked against the active contract.

## Cleanup record

On 2026-10-22, absorbed the contract-page portion of `consumer-docs`.
Its upgrade-guide portion became a draft PRD because external consumers now
exist. On 2026-10-23 the Human dropped that guide requirement and
[cancelled the draft](../../prds/archived/consumer-upgrade-guide/consumer-upgrade-guide-prd.md):
existing CLI and release documentation are sufficient. The Human explicitly
kept this contract-document deferral and its triggers. Neither consumer
adoption nor one planned ADR successor demonstrates recurring maintenance
overhead from the contract's location.

---
type: deferral
title: Standalone public contract document outside numbered ADRs
description: Keep the normative public CLI contract in the active contract ADR and human-facing reference in site/commands.md until ADR supersession churn warrants a standalone contract file.
status: stable
---

# Standalone public contract document outside numbered ADRs

**Deferred:** extracting the normative CLI contract (commands, flags, exit codes, finding codes, summary lines, and `.wolven-harness.json` schema) out of numbered ADRs into a single version-agnostic contract document.

**Why:** the active contract ADR (`ADR-005`) is currently pinned by `test/contract.test.ts` and the install-experience delivery obligations (`R9.1`). Introducing a separate normative contract file mid-delivery would duplicate the contract surface and conflict with the active ADR claim and contract tests.

**Today:** human-facing guide pages (`site/release.md`, `site/commands.md`) point to the CLI reference instead of hardcoding a numbered ADR link, while `test/contract.test.ts` continues to verify the normative contract ADR in `docs/adrs/`.

## Triggers

- [ ] A future contract change requires superseding the contract ADR again and repointing `test/contract.test.ts` becomes recurring maintenance overhead.
- [ ] The Human opens a spec to move `test/contract.test.ts` from `docs/adrs/` to a single canonical contract file.

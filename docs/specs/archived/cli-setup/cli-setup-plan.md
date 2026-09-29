---
type: spec
title: Tell the CLI setup flow apart from harness-init — plan
description: Two waves. Wave 1 makes wolven-harness setup real and names tests setup- or install-. Wave 2 moves the prose.
status: deprecated
---

# Tell the CLI setup flow apart from harness-init — plan

## Structural gate

Every obligation R1.1–R3.3 has its own named proof. The nine landings are either one of those proofs or an `n/a` that cites a file. Unresolved is empty. Safe to slice.

## Work units

| # | Unit | Depends | Owns | Subagent | Done when |
| --- | --- | --- | --- | --- | --- |
| 01 | Make `setup` the command and move its module and tests | — | [src/cli.ts](../../../../src/cli.ts), `src/init/` → `src/setup/`, importers under [src/validate/](../../../../src/validate/) and [src/comments/](../../../../src/comments/), the nine `test/init-*.test.ts` files, [test/helpers/fixture.ts](../../../../test/helpers/fixture.ts) imports only | `inline` | `wolven-harness setup` scaffolds and `wolven-harness init` exits 1; stderr and the debug tag say `setup`; `src/init/` is gone; test files match the name map; `pnpm test` PASS except the README pin, which still says `init` until unit 03. Proofs: `proof-cli-setup-dispatch`, `proof-cli-setup-stderr`, `proof-cli-setup-symbols`, `proof-cli-setup-filenames`, `proof-cli-setup-titles` |
| 02 | **Wave 1 gate** | 01 | — | `inline` | Proofs R1.1–R2.2 inspectable; `pnpm test` fails only on the still-old README pin in [test/readme-install.test.ts](../../../../test/readme-install.test.ts); `pnpm validate` PASS. Any other failure aborts before wave 2 |
| 03 | Say `setup` in the README, Pages, and skill sentences that mean the CLI | 02 | [README.md](../../../../README.md), [site/](../../../../site/) except the harness-init title and steps, CLI sentences in [templates/.agents/skills/harness-init/](../../../../templates/.agents/skills/harness-init/) and [templates/.agents/skills/code-execute/SKILL.md](../../../../templates/.agents/skills/code-execute/SKILL.md), the README pin in [test/readme-install.test.ts](../../../../test/readme-install.test.ts) | `inline` | Install line is `pnpm exec wolven-harness setup`; `wolven-harness init` is gone; `harness-init` and `git init` remain. Proofs: `proof-cli-setup-readme`, `proof-cli-setup-prose`, `proof-cli-setup-git-init` |
| 04 | **Wave 2 gate** | 03 | — | `inline` | `pnpm test` fail 0; `pnpm docs:build` PASS; `pnpm validate` PASS. Abort on failure. Do not merge |

Unit 01 leaves the README pin red on purpose. Updating that pin inside unit 01 without the README would be a false green. Unit 03 moves the pin with the sentence it guards.

## Wave stops

| Stop | After | Gate |
| --- | --- | --- |
| **1** | 02 | R1.1–R2.2 hold; `pnpm validate` PASS; `pnpm test` red only for the README pin — abort before wave 2 on any other failure |
| **2** | 04 | R3.1–R3.3 hold; `pnpm test`, `pnpm docs:build`, and `pnpm validate` PASS — abort; wave 2 is the last wave |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
| --- | --- | --- | --- | --- | --- |
| — | None carried from the spec | — | non-blocking | — | — |

## Frontier order

**Wave 1:** 01 → **02 STOP**

**Wave 2:** 03 → **04 STOP**

No parallel units. Owns overlap the same branch, and wave 2 reads the command name wave 1 just made. Do not pack unit 03 into the wave 1 batch to skip unit 02.

---
type: deferral
title: Consumer-facing upgrade guide and contract page
description: No external repo uses the harness yet, so the site has no upgrade guide and no reader-facing copy of the ADR-004 contract.
status: stable
---

# Consumer-facing upgrade guide and contract page

**Deferred:** an upgrade guide between releases, and a site page that restates [ADR-004](../../adrs/adr-004-standalone-skills-contract.md) with a finding-code table for readers.

**Why:** no external repo has adopted a published release, so an upgrade guide has no reader. A second copy of the contract on the site would drift from ADR-004, and only the ADR is pinned by `test/contract.test.ts`.

**Today:** ADR-004 is the one place the contract is written down. `site/commands.md` and `site/release.md` link to it.

## Triggers

- [ ] An external repo adopts a published release. Then write an upgrade guide for the next release that changes templates, listing the changed template files and what to do with each.
- [ ] A consumer asks for finding-code meanings outside the ADR. Then add a contract page generated from, or checked against, ADR-004.

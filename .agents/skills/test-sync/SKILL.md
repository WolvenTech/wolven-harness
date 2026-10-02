---
name: test-sync
description: "Use when changing tests, deleting or renaming source, or trimming this repo's suite."
---

# test-sync

Keep this repo's tests aligned with current behavior. This skill is dogfood
for wolven-harness only. It is not under `templates/`, and `setup` does not
install it.

## Cited evidence

An external skill is a name and a location. Its text stays in its own file.

- External skill: jmagly `test-sync` — https://mcpmarket.com/tools/skills/test-sync-maintenance and https://github.com/jmagly/ai-writing-guide
- Repo spec: `docs/specs/repo-trim/repo-trim-spec.md`
- [ADR-001](../../../docs/adrs/adr-001-claim-path.md) and [ADR-003](../../../docs/adrs/adr-003-public-contract.md) — `legacy-adr`, `legacy-claim`, and the harness-init migration path still ship

## Local decision

The upstream skill maps `src/foo.ts` to `test/foo.test.ts`, scaffolds a test
for every source file that lacks that twin, and offers a script that deletes
orphans. This suite calls the CLI or reads templates and docs. A missing
twin is not a gap, and a cleanup script is not a deletion.

Follow the rules below. Do not install `npx test-sync` or the upstream
Python scripts.

## Rules

1. An orphan is a test whose imported module is gone, or whose subject behavior no longer exists: a retired command, an old registry, vocabulary from the template extract. Delete that test only. If a live contract item still needs a proof, keep the test that proves it.
2. These are not orphans: `test/legacy.test.ts`, `test/validate-legacy-folders.test.ts`, `test/harness-init-migration.test.ts`, `test/behaviour-brownfield.test.ts`. They prove the consumer legacy-ADR path.
3. A source file with no same-named test is not work for a trim. `validate` and `setup` are already covered through the CLI suites.
4. Do not loosen stdout or workflow pins in the same change as a deletion.
5. Do not copy this skill into `templates/` or a skill set. Promotion waits on `docs/deferrals/test-sync-package/test-sync-package-deferral.md`.

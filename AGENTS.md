# AGENTS.md — wolven-harness (package repo)

Dev entry for agents working in this repository, which builds and publishes `@wolventech/wolven-harness`.

## Build, test, validate

```
pnpm install
pnpm build      # tsc -p tsconfig.json -> dist/
pnpm test       # tsx --test "test/**/*.test.ts"
pnpm validate   # node dist/cli.js validate — run after `pnpm build`
```

## Layout

- `src/` — CLI source (`cli.ts`, `init/`, `validate/`); `pnpm build` compiles it to `dist/`.
- `templates/` — files `init` copies into a consumer repo.
- `test/` — `node:test` suites, run in-process against `src/` via `tsx` (no build required).

## Rules

- Runtime dependency: `yaml` only. Adding another runtime dependency is a decision, not a default.
- `init` never overwrites, edits, or deletes an existing path, and never creates or edits a consumer's `AGENTS.md`.
- Architecture claims follow ADR-001 (`docs/adrs/adr-001-claim-path.md`).

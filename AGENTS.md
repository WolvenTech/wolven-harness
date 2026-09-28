# AGENTS.md — wolven-harness (package repo)

Dev entry for agents working in this repository, which builds and publishes `@wolven-tech/harness`.

## Build, test, validate

```
pnpm install
pnpm build      # tsc -p tsconfig.json -> dist/
pnpm test       # tsx --test "test/**/*.test.ts"
pnpm validate   # node dist/cli.js validate — run after `pnpm build`
```

## Layout

- `src/` — CLI source (`cli.ts`, `init/`, `validate/`, `comments/`); `pnpm build` compiles it to `dist/`.
- `templates/` — files `init` copies into a consumer repo.
- `test/` — `node:test` suites, run in-process against `src/` via `tsx` (no build required).

## Rules

- Runtime dependency: `yaml` only. Adding another runtime dependency is a decision, not a default.
- `init` creates only missing paths, and never creates or edits a consumer's `AGENTS.md`. It does add missing `harness:validate` and `harness:comments` scripts to an existing `package.json`, and it rewrites `packageVersion` in `.wolven-harness.json` on every run. The `comments` base, when `--base` is omitted, is the merge-base with `origin/HEAD`, then `origin/main`, then `main`.
- Architecture claims follow ADR-001 (`docs/adrs/adr-001-claim-path.md`).
- Added comments under `src/` and `test/` must be `why:`/`hazard:`/`invariant:` (at most 4 lines) or an informative JSDoc comment on the declaration below them, with no narration of what changed and no references outside this repository; `pnpm comments` (`wolven-harness comments`) judges comment lines added since the merge-base with `origin/main` and enforces it.

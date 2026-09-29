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

- `src/` — CLI source (`cli.ts`, `setup/`, `validate/`, `comments/`); `pnpm build` compiles it to `dist/`.
- `templates/` — files `setup` copies into a consumer repo.
- `test/` — `node:test` suites, run in-process against `src/` via `tsx` (no build required).
- `CONTRIBUTING.md` — contributor entry point: requirements, the local gate, and the PR rules.
- `assets/` — the Wolven marks the `README.md` header embeds; outside `"files"`, so they do not ship.
- `site/` — the VitePress source for the GitHub Pages guide; `pnpm docs:build` builds it, and `.github/workflows/pages.yml` deploys it on push to `main`, so the repo's Pages source must be set to GitHub Actions.

## Rules

- Runtime dependencies: `yaml` and `@clack/prompts` (the `setup` prompts and progress UI, `src/setup/ui.ts`) only. Adding another runtime dependency is a decision, not a default.
- `setup` creates only missing paths, and never creates or edits a consumer's `AGENTS.md`. It does add missing `harness:validate` and `harness:comments` scripts to an existing `package.json`, and it rewrites `packageVersion` in `.wolven-harness.json` on every run. The `comments` base, when `--base` is omitted, is the merge-base with `origin/HEAD`, then `origin/main`, then `main`.
- Architecture claims follow ADR-001 (`docs/adrs/adr-001-claim-path.md`).
- Added comments under `src/` and `test/` must be `why:`/`hazard:`/`invariant:` (at most 4 lines) or an informative JSDoc comment on the declaration below them, with no narration of what changed and no references outside this repository; `pnpm comments` (`wolven-harness comments`) judges comment lines added since the merge-base with `origin/main` and enforces it.

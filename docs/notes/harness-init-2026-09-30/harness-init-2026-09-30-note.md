---
type: note
title: Harness init 2026-09-30
description: Dogfood install of this package's own harness, with the entry fold done and four ask-only skill stubs written.
status: stable
---

# Harness init 2026-09-30

## Entry integration

The Human specified full mode before this run. `AGENTS.md` was already the package-repo entry (build, layout, rules), so the fold appended a `## Wolven harness` section after that content. The entry file's first line was dropped, its opening title was replaced by that section heading, and every remaining heading was demoted one level. The entry file was then deleted.

Checks alongside the fold:

- Existing `AGENTS.md` content was left in place and only appended to.
- `CLAUDE.md` already imports `AGENTS.md`, so it was not edited.
- `.gitignore` does not exclude `.agents/`, `.claude/`, or `docs/`, so no re-include rules were needed.
- Docs already in the five profile folders were left as they were: deferrals in slug folders, an archived spec under `docs/specs/archived/`, and the three profile decisions already under `docs/adrs/`. Setup added the record-architecture-decisions ADR. Nothing was reshaped.
- One overlap is still open. The package entry tells agents to run `pnpm validate` (`node dist/cli.js validate`). The folded section tells them to run `pnpm harness:validate`. Both were kept. The Human has not said whether to reconcile them.

## ADR migration

Skipped — no legacy ADRs. The only decision-shaped seed outside `docs/adrs/` is the ignored template under `templates/`. Step 1 did not run.

### Meaning check

Skipped — step 1 did not run.

## Discovery

Context from the tree:

- This repo builds and publishes `@wolven-tech/harness` `0.3.0` (MIT, Node `>=22`). The bin is `wolven-harness` at `dist/cli.js`. Runtime dependencies are `yaml` and `@clack/prompts`.
- Dev gate: TypeScript (`pnpm build`), `node:test` via `tsx` (`pnpm test`), Biome (`pnpm lint` and the `simple-git-hooks` pre-commit), `pnpm validate`, `pnpm comments`, and `pnpm score` (`harness-score --min-level 3`).
- Docs site: VitePress under `site/`, built by `pnpm docs:build`, deployed by `.github/workflows/pages.yml` on push to `main`.
- CI: `.github/workflows/ci.yml` checks the pull-request title, lints, runs `pnpm validate`, `pnpm comments`, and `pnpm score`, tests on Node 22 and 24, and smoke-tests the packed CLI. `.github/workflows/release.yml` uses release-please and publishes to npm. pnpm `11.28.2` and Node 22 are pinned in those workflows.
- Profile decisions already in `docs/adrs/`: 000, Record architecture decisions as profile ADRs (written by setup); 001, The ADR claim gate governs architecture-decision references; 002, The package ships publicly on npmjs through OIDC trusted publishing; 003, Version 0.3.0 freezes the public contract.
- Installed skills under `.agents/skills/`: adr, code-ci, code-commit, code-execute, code-plan, code-pr, code-review, code-spec, create-prd, grilling, handoff, harness-init, pragmatic-guard, prototype, qmd, research. Rules: `comments.md`, `qmd-first.md`, `yagni-strict.md`.
- Top level also holds `src/`, `templates/`, `test/`, `assets/`, `CONTRIBUTING.md`, and `.wolven-harness.json` (`gitHost` `gh`, runtimes claude, codex, and cursor, skill sets ship and discovery).

Lifecycle: production. The Human named this stage. It was not inferred from the tree.

Decisions not visible in the tree: none. The Human said there are no hidden decisions.

Decided tools, each already in use:

- pnpm — `pnpm-lock.yaml`, the `package.json` scripts, and the `11.28.2` pin in the workflows.
- Node 22 — `engines.node` and the CI `node-version`.
- TypeScript — `pnpm build` is `tsc -p tsconfig.json`.
- tsx and `node:test` — `pnpm test`.
- Biome `2.5.14` — `pnpm lint` and the pre-commit hook.
- VitePress — `site/` and `pnpm docs:build`.
- GitHub Actions — `.github/workflows/ci.yml`, `release.yml`, and `pages.yml`.
- release-please — `release-please-config.json`, `.release-please-manifest.json`, and `googleapis/release-please-action` in `release.yml`.
- npm OIDC trusted publishing — decision 002 and the publish job in `release.yml` (`id-token: write`, `npm publish --access public --ignore-scripts`, npm `11.20.0`).
- harness-score `1.6.5` — a devDependency, with drops already in `.harness-score.json`.
- simple-git-hooks — the `prepare` script.
- QMD — `.qmd/index.yml` and `.agents/skills/qmd/`. No `index.sqlite` was present, so the index was not queried.

## Research

Repo-only. The Human declined the web pass. There was no local QMD index to query, so discovery read the files above directly. No web sources were fetched.

## Suggestions

Four skills, each named for a tool this repo already uses, and none of them an installed skill under `.agents/skills/`. The Human picked all four.

1. `vitepress` — `site/.vitepress/`, the `docs:dev` / `docs:build` / `docs:preview` scripts, and `.github/workflows/pages.yml`.
2. `release-please` — `release-please-config.json`, `.release-please-manifest.json`, and the release-please job in `.github/workflows/release.yml`.
3. `npm-trusted-publishing` — decision 002 (public npmjs, OIDC, no stored token) and the publish job in `.github/workflows/release.yml`.
4. `biome` — `@biomejs/biome` `2.5.14`, `pnpm lint` (`biome check`), and the pre-commit `biome check --staged`.

## Stubs

Ask-only stubs written for all four picks. Each folder holds a `SKILL.md` and `agents/openai.yaml`, with the discovery evidence above and headed prompts for the Human. None of these folders existed before this write.

- `.agents/skills/vitepress/`
- `.agents/skills/release-please/`
- `.agents/skills/npm-trusted-publishing/`
- `.agents/skills/biome/`

## Harness score

Before: maturity L3 Sensing (capped), score 83/83 (100%), harness-score 1.6.5. Preset `no-hooks`, with `SKL-03`, `AGT-01`, `AGT-02`, `HKS-01` through `HKS-05`, and `HYG-08` off.

No failing checks:

- Context & Guides — 20/20
- Skills & Commands — 9/9
- Hooks & Guardrails — excluded by the `no-hooks` preset
- Sensors & Feedback — 20/20
- CI Feedback — 14/14
- Hygiene & Safety — 20/20

After: the same reading. Maturity L3 Sensing (capped), score 83/83 (100%), harness-score 1.6.5. No failing checks. No new drops.

Existing `.harness-score.json` was left unchanged. It extends `no-hooks`, with rules `AGT-01`, `AGT-02`, `SKL-03`, and `HYG-08` off. Hooks stay excluded; this run does not build hooks. `HYG-03`, `HYG-04`, and `HYG-06` did not fail. No keep-or-drop question was opened, because nothing failed.

The report also says L4 needs hooks at or above 70%, which the current preset cannot reach. That is not a failing check, and this run does not build hooks.

## Validate wiring

Nothing written. The lint job in `.github/workflows/ci.yml` already runs `pnpm validate`. The `validate` script was not chained to `harness:validate`, and no new CI job was added for it.

## Next steps for the Human

Each stub stays ask-only until the Human defines it. For `vitepress`, `release-please`, `npm-trusted-publishing`, and `biome`, answer the headed prompts, then remove the `wolven-harness: stub` marker:

- When should an agent reach for this skill?
- What did they decide for that tool — naming, layout, its own rules?
- What should this skill refuse, or never do?
- What command or read confirms this skill did its job?

Defining a stub is a separate change, not part of this run.

The package entry's `pnpm validate` line and the folded section's `pnpm harness:validate` line are still side by side. The Human has not said whether to reconcile them.

Score drops need no answer unless a later change should build the hooks dimension toward L4. This run does not do that.

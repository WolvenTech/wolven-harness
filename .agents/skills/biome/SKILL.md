---
name: biome
description: "Use when changing lint, format, or the pre-commit check."
---

# biome

Keep lint, format, and the pre-commit check on Biome for this repo.
The four steps below are filled. The workflow for Biome is step 3.

## Cited evidence

Cite each source that led to this skill. An external skill is a name and
a location; its text stays in its own file.

- Decided tool: Biome
- Repo file: `biome.json`
- Repo file: `package.json` (`lint` script and `simple-git-hooks` pre-commit)
- External skill: TheBushidoCollective `biome-linting` — https://github.com/TheBushidoCollective/han/blob/main/plugins/validation/biome/skills/biome-linting/SKILL.md
- External skill: nightly-labs `biome-anti-slop` — https://github.com/nightly-labs/openbot/blob/main/.agents/skills/biome-anti-slop/SKILL.md
- Generated against: `@biomejs/biome` 2.5.14

## Local decision

When a cited skill conflicts with a stable ADR or an existing workflow
in this repo, record the conflict here and follow the local decision.
The conflicting step stays out of the workflow below.

- Conflict: TheBushidoCollective `biome-linting` is written for Biome 1. Its steps use `files.ignore`, `biome ci`, `biome check --write`, and husky. This repo's workflow is `files.includes` in `biome.json`, `pnpm lint` as `biome check`, and a `simple-git-hooks` pre-commit of `biome check --staged`.
- Follow: `pnpm lint` is `biome check`. The hook is `biome check --staged`. `biome.json` uses `files.includes` for `src/**`, `test/**`, and `site/.vitepress/config.*`, line width 120, single quotes, and trailing commas. Do not run `biome init`, do not switch to `files.ignore`, and do not add `--write` to the hook or a `biome ci` step.

Done when: Conflict names the existing workflow and the cited steps that differ, and Follow names the local decision.

## Steps

### 1. Trigger

Use when changing lint, format, or the pre-commit check.

Done when: `description` starts with `Use when` and the situation is changing lint, format, or the pre-commit check.

### 2. Conventions

- `pnpm lint` is `biome check`.
- The pre-commit hook is `pnpm exec biome check --staged --no-errors-on-unmatched --files-ignore-unknown=true`.
- `biome.json` uses `files.includes` for `src/**`, `test/**`, and `site/.vitepress/config.*`.
- Line width is 120.
- JavaScript quotes are single.
- JavaScript trailing commas are `all`.

Done when: every bullet is a decision stated for this repo, and a reader can point at `biome.json` or `package.json` for each one.

### 3. Workflow

1. Read `biome.json`, the `lint` script, and the `simple-git-hooks` pre-commit in `package.json` before editing.
   Done when: the read shows `files.includes`, `"lint": "biome check"`, and the pre-commit `pnpm exec biome check --staged --no-errors-on-unmatched --files-ignore-unknown=true`.

2. Apply the asked lint or format change in `biome.json`. Keep `files.includes` on `src/**`, `test/**`, and `site/.vitepress/config.*`. Keep line width 120, single quotes, and trailing commas `all` unless the ask changes that setting.
   Done when: `biome.json` still lists those includes under `files.includes`, and the diff leaves `files.ignore` absent.

3. If the ask changes the lint script or the hook, keep `scripts.lint` as `biome check` and the pre-commit as `pnpm exec biome check --staged --no-errors-on-unmatched --files-ignore-unknown=true`.
   Done when: `package.json` shows those two strings, and the pre-commit string has no `--write`.

4. Leave `biome init` and `biome ci` out of the change.
   Done when: the diff contains neither `biome init` nor `biome ci`.

Done when: every step ends with a `Done when:` line whose result a later run can observe — a command's exit code, a file's contents, or a diff — and each step is one stated for this repo.

### 4. Verify

Run `pnpm lint`.

Done when: `pnpm lint` exits 0.

## Length

Keep this file under 500 lines. When only one branch of a step needs
the detail, put it in `references/<slug>.md` in this skill folder — one
level down — and link it from that step.

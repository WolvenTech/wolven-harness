---
name: biome
description: "Holds this repo's Biome conventions for `biome.json`, the `pnpm lint` script, and the `simple-git-hooks` pre-commit check. Use when changing Biome lint or format settings, the lint script, or the pre-commit check."
---

# biome

Keep lint, format, and the pre-commit check on Biome for this repo.
The workflow is step 3.

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
- Follow: the Conventions below. Do not run `biome init`, do not switch to `files.ignore`, do not add `--write` to the `lint` script or the hook, and do not add a `biome ci` step. Running `pnpm exec biome check --write` by hand to apply fixes stays allowed (`CONTRIBUTING.md`).

Done when: Conflict names the existing workflow and the cited steps that differ, and Follow names the local decision.

## Steps

### 1. Trigger

The frontmatter `description` is the trigger.

Done when: `description` says in third person what the skill holds, and its `Use when` clause names changing lint, format, or the pre-commit check.

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
   Done when: the read matches the `lint` script, the pre-commit, and the `files.includes` bullets in Conventions.

2. Apply the asked lint or format change in `biome.json`. Keep the three `files.includes` entries from Conventions. Keep line width, quotes, and trailing commas as in Conventions unless the ask changes that setting.
   Done when: `biome.json` still lists those three entries under `files.includes`, and the diff leaves `files.ignore` absent.

3. Keep `scripts.lint` and the pre-commit string exactly as in Conventions, even when the ask touches the lint script or the hook.
   Done when: `package.json` shows both strings unchanged, with no `--write` in the pre-commit.

4. Leave `biome init` and `biome ci` out of the change.
   Done when: the diff contains neither `biome init` nor `biome ci`.

Done when: every step ends with a `Done when:` line whose result a later run can observe — a command's exit code, a file's contents, or a diff — and each step is one stated for this repo.

### 4. Verify

Run `pnpm lint`. If it fails on fixable findings, run `pnpm exec biome check --write`, review what it changed, and run `pnpm lint` again.

Done when: `pnpm lint` exits 0.

## Length

Keep this file under 500 lines. When only one branch of a step needs
the detail, put it in `references/<slug>.md` in this skill folder — one
level down — and link it from that step.

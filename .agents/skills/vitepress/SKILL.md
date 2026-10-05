---
name: vitepress
description: "Holds the conventions for the VitePress guide under site/ and its GitHub Pages deploy. Use when changing the guide's pages, sidebar, config, or theme, or how GitHub Pages builds and publishes it."
---

# vitepress

Change the guide pages under `site/`, the VitePress config and theme, or
how GitHub Pages publishes the built site. The workflow is step 3.

## Cited evidence

External skills are cited by name and URL; their text stays in their own
files.

- Decided tool: VitePress
- Repo file: `site/.vitepress/`, the `docs:dev`, `docs:build`, and `docs:preview` scripts in `package.json`, and `.github/workflows/pages.yml`
- External skill: antfu/skills `vitepress`, https://github.com/antfu/skills/blob/main/skills/vitepress/SKILL.md
- External skill: jeremylongshore `vitepress-config-creator`, https://github.com/jeremylongshore/claude-code-plugins-plus-skills/blob/main/skills/17-technical-docs/vitepress-config-creator/SKILL.md
- Generated against: VitePress `^1.6.4` (`package.json`)

## Local decision

When a cited skill conflicts with an existing workflow in this repo,
record the conflict here and follow the local decision. The conflicting
step stays out of this skill.

- Conflict: antfu/skills `vitepress` targets VitePress 2.0.0-alpha.20 and a migration off VitePress 1. jeremylongshore `vitepress-config-creator` generates a VitePress config and a sidebar, and records no VitePress version.
- Follow: stay on VitePress `^1.6.4`, with the site in `site/`, the hand-written sidebar in `site/.vitepress/config.ts`, and the build-and-upload path under Conventions. Do not migrate to VitePress 2 or generate a config or sidebar.

Done when: Conflict names the cited steps that differ from the existing
workflow, and Follow names the local decision.

## Steps

### 1. Trigger

The frontmatter `description` is the trigger.

Done when: `description` says in third person what the skill holds, and
its `Use when` clause names changing the guide or how GitHub Pages
publishes it.

### 2. Conventions

- Guide pages are markdown files under `site/`, beside `site/index.md`, and each has a `description` frontmatter field. Static files live in `site/public/`.
- `site/.vitepress/config.ts` is the config: `base` is `/wolven-harness/`, and the sidebar is the explicit `themeConfig.sidebar` list. `site/.vitepress/theme/index.ts` extends `vitepress/theme-without-fonts` and loads `site/.vitepress/theme/custom.css`; the fonts come from the Google Fonts link in the config `head`.
- `vitepress` `^1.6.4` is a devDependency. `pnpm docs:dev` is `vitepress dev site`, `pnpm docs:build` is `vitepress build site`, and `pnpm docs:preview` is `vitepress preview site`.
- `pnpm docs:build` writes `site/.vitepress/dist`. `.github/workflows/pages.yml` builds and uploads that directory on a push to `main`, or by hand through `workflow_dispatch`. The repository Pages source is GitHub Actions.

Done when: every bullet is a decision for this repo, and a reader can
point at `site/`, `package.json`, `.github/workflows/pages.yml`, or the
repository Pages settings for each one.

### 3. Workflow

1. Change guide pages under `site/`. Add a sidebar item in `themeConfig.sidebar` when a page belongs in the guide. Leave `base` as `/wolven-harness/`.

   Done when: the content diff is under `site/`, `site/.vitepress/config.ts` still contains `const base = '/wolven-harness/'`, and `themeConfig.sidebar` is still an explicit list in that file.

2. Keep the VitePress 1 scripts and dependency in `package.json`.

   Done when: `package.json` still contains `"docs:build": "vitepress build site"` and `"vitepress": "^1.6.4"`.

3. When the publish path is what changes, edit `.github/workflows/pages.yml` so the build step stays `pnpm docs:build` and the artifact path stays `site/.vitepress/dist`. Keep the `push` to `main` and `workflow_dispatch` triggers.

   Done when: `.github/workflows/pages.yml` contains `run: pnpm docs:build`, `path: site/.vitepress/dist`, `branches: [main]`, and `workflow_dispatch`.

Done when: every step above ends with a `Done when:` line whose result a
later run can observe in a file's contents or a diff.

### 4. Verify

```sh
pnpm docs:build
```

Done when: `pnpm docs:build` exits 0. CI does not build the site and a PR
branch does not deploy, so this local build is the only check before
merge.

## Length

Keep this file under 500 lines. When only one branch of a step needs
the detail, put it in `references/<slug>.md` in this skill folder — one
level down — and link it from that step.

---
name: vitepress
description: "Use when changing the docs site or how GitHub Pages publishes it."
disable-model-invocation: true
---

# vitepress

Ask-only: an explicit ask for `vitepress` is the only run.
`disable-model-invocation: true` stays until the Human removes it.

## Cited evidence

Cite each source that led here. An external skill is a name and a URL;
its text stays in its own file.

- Decided tool: VitePress
- Repo file: `site/.vitepress/`, the `docs:dev`, `docs:build`, and `docs:preview` scripts in `package.json`, and `.github/workflows/pages.yml`
- External skill: antfu/skills `vitepress`, https://github.com/antfu/skills/blob/main/skills/vitepress/SKILL.md
- External skill: jeremylongshore `vitepress-config-creator`, https://github.com/jeremylongshore/claude-code-plugins-plus-skills/blob/main/skills/17-technical-docs/vitepress-config-creator/SKILL.md
- Generated against: VitePress `^1.6.4` (`package.json`)

## Local decision

When a cited skill conflicts with an existing workflow in this repo,
record the conflict here and follow the local decision. The conflicting
step stays out of this skill.

- Conflict: the site in `site/`, `vitepress` `^1.6.4` in `package.json`, and the Pages upload of `site/.vitepress/dist` in `.github/workflows/pages.yml`. antfu/skills `vitepress` differs by targeting VitePress 2.0.0-alpha.20 and a migration off VitePress 1. jeremylongshore `vitepress-config-creator` differs by generating a VitePress config and a sidebar, and it records no VitePress version.
- Follow: the site stays in `site/`. `pnpm docs:build` writes `site/.vitepress/dist`. Pages uploads that directory. Stay on VitePress `^1.6.4`. Keep the hand-written sidebar in `site/.vitepress/config.ts`.

Done when: Conflict names the existing workflow and the cited step that
differs, and Follow names the local decision.

## Steps

### 1. Trigger

Use this skill when changing the docs site or how GitHub Pages publishes
it. That sentence is the `description`.

Done when: `description` starts with `Use when` and names that situation.

### 2. Conventions

- Guide pages are markdown files under `site/`, beside `site/index.md`. Each page has a `description` frontmatter field. Static files live in `site/public/`.
- `site/.vitepress/config.ts` is the config. `base` is `/wolven-harness/`. `site/.vitepress/theme/index.ts` extends `vitepress/theme-without-fonts` and loads `site/.vitepress/theme/custom.css`.
- The sidebar is the `themeConfig.sidebar` list written in `site/.vitepress/config.ts`.
- `package.json` depends on `vitepress` `^1.6.4`. `pnpm docs:dev` is `vitepress dev site`, `pnpm docs:build` is `vitepress build site`, and `pnpm docs:preview` is `vitepress preview site`.
- `pnpm docs:build` writes `site/.vitepress/dist`. `.github/workflows/pages.yml` uploads that directory on a push to `main`, and `workflow_dispatch` is the manual deploy. The repository Pages source is GitHub Actions.

Done when: every bullet is a decision for this repo, and a reader can
point at `site/`, `package.json`, or `.github/workflows/pages.yml` for
each one.

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

Done when: `pnpm docs:build` exits 0. A failed build exits non-zero.

## Length

Keep this file under 500 lines. When only one branch of a step needs
the detail, put it in `references/<slug>.md` in this skill folder — one
level down — and link it from that step.

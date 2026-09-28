---
name: release-please
description: Stub skill for release-please and publishing to GitHub Packages — not yet defined
metadata:
  wolven-harness: stub
disable-model-invocation: true
---

# release-please

Suggested while discovering this repo's decided tools, ask-only until the
Human defines it.

## Discovery evidence

- `.github/workflows/release.yml` runs `googleapis/release-please-action@v4` on
  every push to `main`; when `release_created`, it builds, runs `pnpm test`,
  and runs `pnpm publish` to `https://npm.pkg.github.com` with `GITHUB_TOKEN`.
- `release-please-config.json` sets `release-type: node`,
  `bump-minor-pre-major: true`, `include-component-in-tag: false`, and
  `initial-version: 0.1.0`; `.release-please-manifest.json` holds `0.1.1`.
- `.github/workflows/pr-title.yml` checks PR titles with
  `amannn/action-semantic-pull-request@v5`; the README's Release section
  says PRs are squash-merged with the title as the commit message.
- `package.json` sets `publishConfig.registry` to GitHub Packages;
  `test/release.test.ts` and `test/pr-title.test.ts` pin the release setup.
- The README's Release section: close and reopen the release PR before
  merging, because a PR opened by `GITHUB_TOKEN` starts no workflows; the
  release-please-action README confirms that limit and suggests a personal
  access token instead.

## When to use

<Ask the Human: when should an agent reach for this skill?>

## Conventions

<Ask the Human: what did they decide for release-please and publishing to GitHub Packages — naming, layout, its own rules?>

## What to avoid

<Ask the Human: what should this skill refuse, or never do?>

## How to verify

<Ask the Human: what command or read confirms this skill did its job?>

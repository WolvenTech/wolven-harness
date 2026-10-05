---
name: release-please
description: "Holds how release-please cuts the version bump, the release pull request, and the GitHub Release. Use when changing `release-please-config.json`, `.release-please-manifest.json`, the `release-please` job in `.github/workflows/release.yml`, the pre-1.0 bump rule, or the tag format; publishing to npm is the `npm-trusted-publishing` skill."
---

# release-please

Keep the version bump, the release pull request, and the GitHub Release on
release-please. Publishing the npm package is the `npm-trusted-publishing`
skill.

## Cited evidence

An external skill is a name and a location; its text stays in its own file.

- Decided tool: release-please
- Repo file: `release-please-config.json`
- Repo file: `.release-please-manifest.json`
- Repo file: the `release-please` job in `.github/workflows/release.yml`
- External skill: bmad-labs `release-please`, https://github.com/bmad-labs/skills/blob/main/skills/release-please/SKILL.md
- External skill: mizchi `conventional-changelog`, https://github.com/mizchi/skills/blob/main/conventional-changelog/SKILL.md
- Generated against: `googleapis/release-please-action@v5`

## Local decision

When a cited skill conflicts with a stable ADR or an existing workflow
in this repo, record the conflict here and follow the local decision.
The conflicting step stays out of this skill.

- Conflict: bmad-labs `release-please` pins action v4, creates the GitHub Release when the release pull request merges, and publishes with `NPM_TOKEN`. mizchi `conventional-changelog` uses v5 with no npm token, but it also tags when the release pull request merges. In the `release-please` job in `.github/workflows/release.yml`, a merge creates no GitHub Release.
- Follow: the `release-please` job in `.github/workflows/release.yml` and the Conventions below. The release-on-merge and `NPM_TOKEN` steps stay out.

Done when: Conflict names the existing workflow and the cited step that
differs, and Follow names the local decision.

## Steps

### 1. Trigger

The frontmatter `description` is the trigger.

Done when: `description` says in third person what the skill holds, and
its `Use when` clause names changing how the version bump and the release
pull request are cut.

### 2. Conventions

- The action pin is `googleapis/release-please-action@v5`. The `release-please` job in `.github/workflows/release.yml` is the only release workflow.
- `release-please-config.json` holds the version rule. `.release-please-manifest.json` holds the released version.
- `include-component-in-tag` is false. The tag has no component name.
- A push to `main` only updates the release pull request: `skip-github-release` is `${{ github.event_name == 'push' }}`.
- After the release pull request merges, an empty manual run of `release.yml` creates the GitHub Release. Nothing reaches npm until that run; the publish path belongs to `npm-trusted-publishing`.
- Below 1.0 a `feat` bumps the patch, and a minor bump is only for a breaking change marked `feat!` or `BREAKING CHANGE`. `bump-patch-for-minor-pre-major` is true, and `bump-minor-pre-major` stays true so that breaking change stays a minor rather than a major. ADR-003 (Change policy) and the bump table in `site/release.md` state the same rule.
- Do not add a second release workflow. Do not turn release-on-merge on. Do not add `NPM_TOKEN`.

Done when: every bullet is a decision stated for this skill, and a reader
can point at `release-please-config.json`, `.github/workflows/release.yml`,
ADR-003, or `site/release.md` for each one.

### 3. Workflow

1. Read `release-please-config.json`, `.release-please-manifest.json`, and the `release-please` job in `.github/workflows/release.yml` before editing.
   Done when: those three paths have been read in this run.

2. Keep one release workflow, and keep the push run from creating the GitHub Release.
   Done when: `.github/workflows/release.yml` still has one `release-please` job whose `skip-github-release` is `${{ github.event_name == 'push' }}`.

3. Keep the tag free of a component name.
   Done when: `release-please-config.json` contains `"include-component-in-tag": false`.

4. Keep the pre-1.0 bump from Conventions in the config, in ADR-003, and in the bump table in `site/release.md`.
   Done when: both keys in `release-please-config.json` are true, and both docs state the pre-1.0 rule from Conventions.

5. Leave npm publish on the manual run.
   Done when: the diff adds neither a publish-on-merge path nor an `NPM_TOKEN` secret.

Done when: every step above ends with a `Done when:` line whose result a
later run can observe in a file or a diff, and each step is one stated for
this skill.

### 4. Verify

Run `pnpm exec tsx --test test/release.test.ts`; it pins the
`release-please` job and the config keys above. When ADR-003 or
`site/release.md` changed, also run `pnpm build` and `pnpm validate`. Fix
and rerun until they pass.

Done when: the release tests and, when run, `pnpm validate` exit 0, and the
`release-please` job's `skip-github-release` is still
`${{ github.event_name == 'push' }}`.

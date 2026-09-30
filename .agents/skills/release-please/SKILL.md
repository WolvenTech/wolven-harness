---
name: release-please
description: "Use when changing how the version bump and the release pull request are cut."
disable-model-invocation: true
---

# release-please

Keep the version bump and the release pull request on release-please.
Ask-only: an explicit ask for `release-please` is the only run.
`disable-model-invocation: true` stays until the Human removes it.
Publishing the npm package is the `npm-trusted-publishing` skill.

## Cited evidence

Cite each source that led here. An external skill is a name and a
location; its text stays in its own file.

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

- Conflict: bmad-labs `release-please` uses action v4, creates the GitHub Release when the release pull request merges, and publishes with `NPM_TOKEN`. That differs from the `release-please` job in `.github/workflows/release.yml`. mizchi `conventional-changelog` is action v5 with no npm token, and it is not this split: merging the release pull request is not what creates the GitHub Release here.
- Follow: a push to `main` only updates the release pull request (`skip-github-release` when `github.event_name == 'push'`). The tag has no component name. An empty manual run of `release.yml` creates the GitHub Release. Do not add a second release workflow and do not turn release-on-merge on. Below 1.0 a `feat` bumps the patch, and a minor bump is only for a breaking change marked `feat!` or `BREAKING CHANGE`. Keep `bump-minor-pre-major` so that breaking change stays a minor. Nothing reaches npm until the manual run.

Done when: Conflict names the existing workflow and the cited step that
differs, and Follow names the local decision.

## Steps

### 1. Trigger

Use this skill when changing how the version bump and the release pull
request are cut.

Done when: `description` starts with `Use when` and names that situation.

### 2. Conventions

- The action pin is `googleapis/release-please-action@v5`.
- `release-please-config.json` holds the version rule. `.release-please-manifest.json` holds the released version. The `release-please` job in `.github/workflows/release.yml` is the only release workflow.
- `include-component-in-tag` is false. The tag has no component name.
- A push to `main` updates the release pull request and does not create the GitHub Release.
- An empty manual run of `release.yml` creates the GitHub Release.
- Below 1.0 a `feat` bumps the patch. A minor bump is only for a breaking change marked `feat!` or `BREAKING CHANGE`. `bump-patch-for-minor-pre-major` is true. `bump-minor-pre-major` stays true, so that breaking change stays a minor rather than a major.
- ADR-003 and the bump table in `site/release.md` state that same rule.
- Do not add a second release workflow. Do not turn release-on-merge on. Do not add `NPM_TOKEN`.
- The manual publish stays. Nothing reaches npm until the manual run. That path belongs to `npm-trusted-publishing`.

Done when: every bullet is a decision stated for this skill, and a reader
can point at `release-please-config.json`, `.github/workflows/release.yml`,
ADR-003, or `site/release.md` for each one.

### 3. Workflow

1. Read `release-please-config.json`, `.release-please-manifest.json`, and the `release-please` job in `.github/workflows/release.yml` before editing the bump or the release pull request.
   Done when: those three paths have been read in this run.

2. Keep one release workflow. A push to `main` only updates the release pull request. Leave `skip-github-release` set from `github.event_name == 'push'`. An empty manual run is what creates the GitHub Release.
   Done when: `.github/workflows/release.yml` still has one `release-please` job whose `skip-github-release` is `${{ github.event_name == 'push' }}`.

3. Keep the tag free of a component name.
   Done when: `release-please-config.json` contains `"include-component-in-tag": false`.

4. Set the pre-1.0 bump. `bump-patch-for-minor-pre-major` is true and `bump-minor-pre-major` stays true. State the same rule in ADR-003 and in the bump table in `site/release.md`: below 1.0 a `feat` bumps the patch, and a minor bump is only for a breaking change marked `feat!` or `BREAKING CHANGE`.
   Done when: both keys in `release-please-config.json` are true, and both docs contain that sentence.

5. Leave npm publish on the manual run. Do not turn release-on-merge on and do not add `NPM_TOKEN`.
   Done when: the diff adds neither a publish-on-merge path nor an `NPM_TOKEN` secret.

Done when: every step above ends with a `Done when:` line whose result a
later run can observe in a file or a diff, and each step is one stated for
this skill. The bmad-labs release-on-merge and `NPM_TOKEN` steps stay out.

### 4. Verify

Read the `release-please` job in `.github/workflows/release.yml` and confirm
`skip-github-release` is `${{ github.event_name == 'push' }}`.

Done when: that line is present. A push to `main` creates the GitHub
Release only when the line is missing or no longer tied to `push`.

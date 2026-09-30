---
name: npm-trusted-publishing
description: "Use when changing how `@wolven-tech/harness` is published to npmjs."
disable-model-invocation: true
---

# npm-trusted-publishing

Keep the OIDC trusted-publishing path for `@wolven-tech/harness` aligned
with ADR-002 and the `publish` job in `.github/workflows/release.yml`.
Ask-only: an explicit ask for `npm-trusted-publishing` is the only run.
`disable-model-invocation: true` stays until the Human removes it. The
four steps below are filled. The workflow for publishing is step 3.

## Cited evidence

An external skill is a name and a location; its text stays in its own file.

- Decided tool: OIDC trusted publishing of `@wolven-tech/harness` on npmjs
- Repo file: `.github/workflows/release.yml` (the `publish` job); `docs/adrs/adr-002-public-npm-oidc.md` (ADR-002)
- External skill: paulirish `npm-trusted-publishing`, https://github.com/paulirish/dotfiles/blob/main/agents/skills/npm-trusted-publishing/SKILL.md
- npm docs: [Trusted publishing for npm packages](https://docs.npmjs.com/trusted-publishers/) — `workflow_dispatch` is a manual publish path
- Generated against: the `publish` job in `.github/workflows/release.yml` and ADR-002 (Node 22, npm CLI `11.20.0`)

## Local decision

When a cited skill conflicts with a stable ADR or an existing workflow
in this repo, record the conflict here and follow the local decision.
The conflicting step stays out of this skill.

- Conflict: none
- Follow: ADR-002 and the `publish` job in `.github/workflows/release.yml`

Done when: Conflict is `none`, and Follow names ADR-002 and the `publish`
job.

## Steps

### 1. Trigger

Use when changing how `@wolven-tech/harness` is published to npmjs.

Done when: `description` starts with `Use when` and the situation is
changing how `@wolven-tech/harness` is published to npmjs.

### 2. Conventions

- Publish only from `workflow_dispatch` on `.github/workflows/release.yml`.
- An empty manual run creates the GitHub Release and publishes.
- A `v*` input republishes that existing tag after the build job checks the tag matches `package.json`.
- `id-token: write` belongs only on the publish job.
- Node 22, then global `npm@11.20.0`.
- The publish command is `npm publish --access public --ignore-scripts`.
- The publish job stores no `NPM_TOKEN` and sets no `registry-url` on `setup-node`.
- Provenance stays the attestation ADR-002 requires. The publish line stays `npm publish --access public --ignore-scripts`.
- Do not add `--provenance` to the publish command, and do not set `registry-url` on `setup-node`.
- npm's trusted-publisher docs are the cite for `workflow_dispatch` as a manual publish path: https://docs.npmjs.com/trusted-publishers/

Done when: every bullet is a decision in ADR-002 or in the `publish` job
in `.github/workflows/release.yml`, except the docs bullet, which points
at https://docs.npmjs.com/trusted-publishers/.

### 3. Workflow

1. Read ADR-002 and the `publish` job in `.github/workflows/release.yml` before changing the publish path.

   Done when: the change still cites ADR-002, and publish still runs from the `publish` job in `release.yml`.

2. Keep publish on `workflow_dispatch`. An empty `tag` input lets the release-please job create the GitHub Release, then the build job and the publish job run. A `v*` input republishes that existing tag after the build job checks the tag is a published Release and that it matches `package.json`.

   Done when: `on.workflow_dispatch` is present, the publish job runs only after `needs.build.result == 'success'`, and the build job exits unless `v` plus `package.json`'s `version` equals the release tag.

3. Keep `id-token: write` on the publish job alone.

   Done when: in `.github/workflows/release.yml`, `id-token: write` appears only under the `publish` job's `permissions`.

4. Keep Node 22, `npm install -g npm@11.20.0`, and `npm publish --access public --ignore-scripts`. The job stores no `NPM_TOKEN`, sets no `registry-url`, and adds no `--provenance` flag. Provenance remains the attestation ADR-002 requires.

   Done when: the publish job's `setup-node` step sets `node-version: 22` and has no `registry-url`, the following step is `npm install -g npm@11.20.0`, and the publish line is `npm publish --access public --ignore-scripts`.

Done when: every step above ends with a `Done when:` line whose result a
later run can observe in `.github/workflows/release.yml` or in ADR-002.

### 4. Verify

Read the `publish` job in `.github/workflows/release.yml`.

Done when: its publish line is `npm publish --access public --ignore-scripts`
and its `permissions` include `id-token: write`.

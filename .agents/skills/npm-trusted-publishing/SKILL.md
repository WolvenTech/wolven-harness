---
name: npm-trusted-publishing
description: "Keeps `@wolven-tech/harness` publishing to npmjs on the tokenless OIDC path of ADR-002. Use when changing the `publish` job, the manual run or tag retry in `.github/workflows/release.yml`, OIDC trusted publishing, `id-token: write`, the npm CLI version, `NPM_TOKEN`, or provenance."
---

# npm-trusted-publishing

Keep the OIDC trusted-publishing path for `@wolven-tech/harness` aligned
with ADR-002 and the `publish` job in `.github/workflows/release.yml`.
The version bump and the release pull request belong to the
`release-please` skill.

## Cited evidence

An external skill is a name and a location; its text stays in its own file.

- Decided tool: OIDC trusted publishing of `@wolven-tech/harness` on npmjs
- Repo file: `.github/workflows/release.yml` (the `publish` job); `docs/adrs/adr-002-public-npm-oidc.md` (ADR-002)
- Repo file: `.github/workflows/ci.yml` (the `package` job packs with the release npm); `site/release.md` (the npmjs trusted-publisher setting)
- External skill: paulirish `npm-trusted-publishing`, https://github.com/paulirish/dotfiles/blob/main/agents/skills/npm-trusted-publishing/SKILL.md
- npm docs: [Trusted publishing for npm packages](https://docs.npmjs.com/trusted-publishers/) — `workflow_dispatch` is a manual publish path, and trusted publishing adds provenance without `--provenance`
- Generated against: the `publish` job in `.github/workflows/release.yml` and ADR-002 (Node 22, npm CLI `11.20.0`)

## Local decision

When a cited skill conflicts with a stable ADR or an existing workflow
in this repo, record the conflict here and follow the local decision.
The conflicting step stays out of this skill.

- Conflict: paulirish `npm-trusted-publishing` publishes from a tag push and warns that `workflow_dispatch` runs can fail OIDC, sets `registry-url` on `setup-node`, adds `--provenance`, and uses `node-version: lts/*`. The `publish` job in `.github/workflows/release.yml` runs from `workflow_dispatch` on Node 22 and does none of those.
- Follow: ADR-002 and the `publish` job in `.github/workflows/release.yml`

Done when: Conflict names the cited steps that differ from the `publish`
job, and Follow names ADR-002 and the `publish` job.

## Steps

### 1. Trigger

The frontmatter `description` is the trigger.

Done when: `description` says in third person what the skill holds, and
its `Use when` clause names changing how `@wolven-tech/harness` is
published to npmjs.

### 2. Conventions

- Publish only from a manual `workflow_dispatch` run of `.github/workflows/release.yml`. A push to `main` never publishes.
- An empty `tag` input lets the `release-please` job create the GitHub Release for the merged release pull request; the `build` job and then the `publish` job run.
- A `v*` input republishes that existing tag, after the `build` job checks it is a published (non-draft) GitHub Release and equals `v` plus `package.json`'s `version`.
- `id-token: write` sits only on the `publish` job in `release.yml`.
- The `publish` job installs no project dependencies and runs no lifecycle scripts; it publishes the `dist` artifact the `build` job uploaded.
- Node 22 on `setup-node` with no `registry-url`, then `npm install -g npm@11.20.0` (OIDC needs npm 11.5.1 or later; Node 22 bundles npm 10). The `package` job in `.github/workflows/ci.yml` installs the same npm to pack, so change both together.
- The publish line is `npm publish --access public --ignore-scripts`, with no `--provenance`: trusted publishing attaches the provenance attestation ADR-002 requires.
- No `NPM_TOKEN` is stored anywhere.
- npmjs trusts workflow `release.yml` with no environment (`site/release.md`, One-time npm setup). Renaming the file or adding an `environment:` to the `publish` job breaks publishing until that npmjs setting changes.

Done when: every bullet is a decision in ADR-002, in `.github/workflows/release.yml`
or `.github/workflows/ci.yml`, or in `site/release.md`.

### 3. Workflow

1. Read ADR-002 and the `publish` job in `.github/workflows/release.yml` before changing the publish path.

   Done when: the change still cites ADR-002, and publish still runs from the `publish` job in `release.yml`.

2. Make the change within the Conventions above, then check the gating.

   Done when: `on.workflow_dispatch` is present, the `publish` job runs only after `needs.build.result == 'success'`, and the `build` job fails unless `v` plus `package.json`'s `version` equals the release tag and, for a `v*` input, that tag is a published GitHub Release.

3. Check the permissions.

   Done when: in `.github/workflows/release.yml`, `id-token: write` appears only under the `publish` job's `permissions`.

4. Check the toolchain and the publish line.

   Done when: the `publish` job's `setup-node` step sets `node-version: 22` and has no `registry-url`, the following step is `npm install -g npm@11.20.0`, no step installs project dependencies, the publish line is `npm publish --access public --ignore-scripts`, and the `package` job in `.github/workflows/ci.yml` installs the same npm version.

Done when: every step above ends with a `Done when:` line whose result a
later run can observe in `.github/workflows/release.yml`,
`.github/workflows/ci.yml`, or ADR-002.

### 4. Verify

Read the `publish` job in `.github/workflows/release.yml`.

Done when: its publish line is `npm publish --access public --ignore-scripts`
and its `permissions` include `id-token: write`.

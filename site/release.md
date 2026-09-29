---
description: How maintainers publish @wolven-tech/harness.
---

# Release

Maintainer notes for getting a change from a merged PR to a published version of `@wolven-tech/harness` on npm.

## How a release flows

1. **PRs land on `main`.** CI runs build, test, validate, and comments. PRs squash-merge, so the PR title becomes the commit on `main`.
2. **release-please keeps a release PR open.** On every push to `main`, it updates that PR with the next version and the changelog.
3. **A maintainer merges the release PR**, then **runs the `release` workflow by hand**. That run creates the tag and the GitHub Release, and publishes to npm.

::: warning Nothing publishes on its own
A push to `main` does not create the GitHub Release and does not publish. Merging the release PR doesn't either. Only the manual `release` run creates the tag and the GitHub Release, and publishes.
:::

## PR titles and version bumps

PR titles must be [Conventional Commits](https://www.conventionalcommits.org/). The title decides the next version. Before 1.0:

| PR title type | Bump |
| --- | --- |
| `feat`, or any breaking change | minor (`0.2.0` → `0.3.0`) |
| `fix` | patch (`0.2.0` → `0.2.1`) |

## Cut a release

1. **Open the release PR** that release-please maintains, and check its version and changelog.
2. **Close and reopen the release PR before merging it.** release-please pushes with `GITHUB_TOKEN`, and pushes made with that token start no workflows. Reopening the PR is what makes the checks run.
3. **Wait for checks to pass, then merge.**
4. **Run the `release` workflow by hand with the tag left empty:** Actions → **release** → **Run workflow**, on `main`. The run:
   - creates the tag and the GitHub Release,
   - checks that the tag matches `package.json`'s version, then builds and tests,
   - publishes to npmjs through OIDC trusted publishing, with provenance. It uses no stored token.
5. **Check it landed:**

   ```sh
   npm view @wolven-tech/harness version
   ```

## If publishing fails

| Situation | What to do |
| --- | --- |
| The GitHub Release exists but the publish job failed | Set **tag** to that release's tag, for example `v0.2.0`, and run the `release` workflow by hand again. The run checks that the release is published, not a draft, before it publishes. |
| The version is already on npm | You can't republish a version. Merge the fix and release the next patch. |

## One-time npm setup

This section is for setting up the package once, not for each release. It needs an owner of the `wolven-tech` npm org with two-factor authentication on. The package stays public, on npm's free plan for public organizations.

1. **Seed the package.** npm only lets you add a trusted publisher to a package that already exists. From a disposable checkout, publish a seed version, and keep that version out of `main`:

   ```sh
   npm login
   npm publish --tag oidc-seed --access public --ignore-scripts \
     --registry https://registry.npmjs.org/
   ```

2. **Add a GitHub Actions trusted publisher** on npmjs for workflow `release.yml`, with the values below. Allow direct `npm publish` for this workflow.

   | Field | Value |
   | --- | --- |
   | Organization | `WolvenTech` |
   | Repository | `wolven-harness` |
   | Workflow | `release.yml` |
   | Environment | *(none)* |

3. **Publish the first release** with the steps in [Cut a release](#cut-a-release).
4. **Lock it down.** After the first OIDC release succeeds:
   - Set publishing access to **Require two-factor authentication and disallow tokens**.
   - Deprecate the seed version:

     ```sh
     npm deprecate @wolven-tech/harness@<seed-version> "Seed release for trusted publishing; do not use."
     ```

GitHub Secrets doesn't need an npm token.

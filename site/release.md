---
description: How maintainers publish @wolven-tech/harness.
---

# Release

Maintainer notes. PR titles are Conventional Commits. CI runs build, test, validate, and comments. PRs squash-merge; the title becomes the `main` commit.

release-please watches `main` and keeps a release PR open. A push to `main` does not create the GitHub Release and does not publish.

**Stability.** From 0.3.0 the public contract is stable: commands, flags, exit codes, finding codes, and the `.wolven-harness.json` schema. Breaking changes follow the policy in the [Contract](./contract) page and [ADR-003](https://github.com/WolvenTech/wolven-harness/blob/main/docs/adrs/adr-003-public-contract.md).

Before 1.0, `feat` or a breaking change bumps minor, and `fix` bumps patch.

Close and reopen the release PR before merging it: `GITHUB_TOKEN` starts no workflows, so checks run only after the reopen.

Merging the release PR does not tag, create the GitHub Release, or publish. Run the `release` workflow by hand with the tag left empty (Actions → release → Run workflow). That publishes to npmjs through OIDC trusted publishing. No stored token. Every published version has provenance.

If publish fails after the GitHub Release exists, run the `release` workflow by hand with that release's tag. A published version cannot be republished. Ship the next patch.

One-time npm setup, by an owner of the `wolven-tech` org with 2FA on. Keep the package public on npm's free public-organization plan.

A trusted publisher needs a package that already exists. In a disposable checkout, seed npmjs with `npm login` and `npm publish --tag oidc-seed --access public --ignore-scripts --registry https://registry.npmjs.org/`. Keep the seed version out of `main`.

On npmjs, add a GitHub Actions trusted publisher: organization `WolvenTech`, repository `wolven-harness`, workflow `release.yml`, no environment. Allow direct `npm publish` for this workflow.

After the first OIDC release succeeds, set publishing access to "Require two-factor authentication and disallow tokens" and deprecate the seed version. No npm token is needed in GitHub Secrets.

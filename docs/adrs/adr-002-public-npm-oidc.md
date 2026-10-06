---
type: adr
title: The package ships publicly on npmjs through OIDC trusted publishing
description: wolven-harness publishes @wolven-tech/harness to the public npmjs.org registry from its release job through OIDC trusted publishing, with no stored token, so consumer repos install it with no registry configuration or credential.
status: stable
---

# ADR-002 — The package ships publicly on npmjs through OIDC trusted publishing

## Context

The first releases went to GitHub Packages as a private package. Every
consumer then needed a registry line, a read token, a per-repo Actions
access grant and `packages: read` in each installing CI job. Newer pnpm
versions refuse to expand an environment token in a project `.npmrc`, so
the committed setup broke on upgrade. The source repository and its
consumers are public, and the shipped files hold nothing private, so keeping
the package private bought no secrecy.

## Decision

The package is `@wolven-tech/harness` on npmjs.org, with public access. The
release job publishes it with the npm CLI through OIDC trusted publishing:
only the publish job holds `id-token: write`, it installs no project
dependencies, and npmjs trusts this repository's `release.yml` as the only
publisher. No npm token is stored anywhere. The package's publishing access
is set to disallow tokens; that setting and the trusted publisher live on
npmjs, not in this repository, so the release guide (`site/release.md`,
One-time npm setup) lists them.
Every published version carries a provenance attestation. The command stays `wolven-harness`.

A trusted publisher can only be attached to a package that already exists,
so the first version on npmjs is a manual prerelease seed under a
non-`latest` dist-tag. The workflow is merged before the npm mapping is set,
and the mapping permits direct `npm publish`. The seed is deprecated and
token publishing disabled after the first OIDC release succeeds.

A pull-request job runs the full package gate and packs the tarball with
the release job's npm, so a broken test or manifest fails on the pull
request instead of in the release job. If a publish still fails after the
tag exists, the release workflow can be run by hand for that published GitHub
Release tag, after checking that it matches the package version.

## Consequences

- Consumers install with `pnpm add -D @wolven-tech/harness` and need no
  `.npmrc`, token, access grant or extra CI permission.
- Published versions are public and effectively permanent; a bad release is
  fixed by the next patch, never by republishing a version.
- Once both npm settings are in place, nothing but this repository's
  `release.yml` can publish: not a fork, another workflow, or a leaked
  token.
- The earlier private GitHub Packages versions are left in place and are no
  longer updated.

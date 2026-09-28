---
type: adr
title: The package ships publicly on npmjs through OIDC trusted publishing
description: wolven-harness publishes @wolven/harness to the public npmjs.org registry from its release job through OIDC trusted publishing, with no stored token, so consumer repos install it with no registry configuration or credential.
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

The package is `@wolven/harness` on npmjs.org, with public access. The
release job publishes it with the npm CLI through OIDC trusted publishing:
the job holds `id-token: write`, and npmjs trusts this repository's
`release.yml` as the only publisher. No npm token is stored anywhere, and
the package's publishing access disallows tokens. Every published version
carries a provenance attestation. The command stays `wolven-harness`.

A trusted publisher can only be attached to a package that already exists,
so the first version on npmjs is a manual prerelease seed under a
non-`latest` dist-tag, deprecated once the release job publishes.

A pull-request job runs the full package gate, so a broken test fails on
the pull request instead of in the release job.

## Consequences

- Consumers install with `pnpm add -D @wolven/harness` and need no
  `.npmrc`, token, access grant or extra CI permission.
- Published versions are public and effectively permanent; a bad release is
  fixed by the next patch, never by republishing a version.
- The release job cannot publish from a fork or another workflow, and a
  leaked token cannot publish at all.
- The earlier private GitHub Packages versions are left in place and are no
  longer updated.

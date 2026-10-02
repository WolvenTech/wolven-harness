---
type: adr
title: Default branch writes require PR integration
description: Use agent policy, local Git and runtime hooks, and remote protection to preserve the default branch PR boundary.
status: draft
---

# Default branch writes require PR integration

## Context

A Claude-authored commit reached this repository's default branch without an
associated PR. Incident #40 records the evidence and its limits. The existing
branch-first instruction belongs to the PR skill; the commit hook only runs
Biome. GitHub protection exempts administrators.

The approved default branch safety PRD requires consumer protection without
turning setup into a remote administration tool. The existing setup contract
preserves existing files and does not edit consumer AGENTS.md.

## Decision

Ship a standing branch-safety rule and dependency-free local guard with the
harness. Use Git commit/push hooks and supported runtime pre-tool hooks as
complementary barriers. Agent skills perform recovery before a guarded write;
hooks reject unsafe writes without silently moving branches themselves.

Protect the remote default branch through the approved PR workflow, with no
human, administrator, or automation exception for direct writes. Local hooks
are bypassable and do not replace server-side protection. Runtime trust or
unsupported capabilities must be reported rather than assumed active.

Install only missing consumer files and hook entry points. Preserve existing
hooks and runtime settings; if safe integration is unavailable, finish the
remaining setup and report protection pending. Consumer setup provides remote
configuration instructions without inspecting or changing GitHub settings.

## Consequences

- Safety applies regardless of which delivery skill is selected.
- Existing installations can need a maintainer integration step; setup must
  distinguish installed, pending, and unsupported protection layers.
- Remote protection in this package repository covers privileged credentials;
  owners can still change settings, so this is not an immutable boundary
  against an administrator who deliberately disables enforcement.
- The public setup contract remains intact; automatic edits to existing
  runtime settings or consumer hooks are not part of this decision.
- Approval and promotion of this decision record remain pending.

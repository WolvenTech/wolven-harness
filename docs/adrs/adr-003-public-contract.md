---
type: adr
title: Version 0.3.0 freezes the public contract
description: wolven-harness 0.3.0 is the first stable release and freezes its commands, flags, exit codes, finding codes, summary lines and .wolven-harness.json schema v1; a breaking change needs a superseding ADR, a deprecation release and a breaking commit.
status: stable
---

# ADR-003 — Version 0.3.0 freezes the public contract

## Context

0.3.0 is the first stable release. Consumers now pin CI to what the tool
does. They gate merges on exit codes. They match finding codes in scripts.
They commit `.wolven-harness.json` and expect it to keep loading. A silent
change to any of these breaks their builds with no warning.

The contract must be written down once, so a change to it is a decision and
not a side effect of a refactor. Everything below was read from `src/`.

## Decision

The items in this section are the public contract. Nothing else is.

### Commands

`wolven-harness <command> [options]`. The commands are `setup`, `validate`
and `comments`.

- No command, `--help` or `-h` as the first argument prints usage to stdout
  and exits 0.
- `--version` or `-v` as the first argument prints `<package name> <version>`
  and exits 0.
- An unknown command writes the error message to stderr and usage to stdout,
  then exits 1.
- Every command exits 0 on success and 1 on any handled failure. No other
  exit code is used.

### `setup`

Flags. Each value flag takes `--flag value` or `--flag=value`.

| Flag | Value |
| --- | --- |
| `--git-host` | `gh` or `bit` |
| `--runtimes` | comma-separated `claude`, `codex`, `cursor`; entries are trimmed and deduplicated |
| `--skills` | comma-separated `ship`, `discovery`, or `none` alone |
| `--verbose` | none |
| `--debug` | none |

- Any other argument is an error and exits 1.
- `WOLVEN_HARNESS_DEBUG=1` is the same as `--debug`.
- Exit 0 when setup completes. Exit 1 on a flag or config error, on a
  cancelled prompt, and when not run at the git top-level.
- Resolution order: a flag wins over `.wolven-harness.json`, which wins over
  a prompt.
- Prompts appear only when stdout is a TTY and stdin is a TTY. Without a
  TTY, a missing `--git-host` or `--runtimes` is an error naming the flag.
  A missing `--skills` defaults to `ship`.
- On a TTY, an invalid flag value is asked again instead of failing.
- Guarantees:
  - It creates only missing paths and never overwrites or edits an existing
    file.
  - It never creates or edits `AGENTS.md`.
  - It adds `harness:validate`, `harness:comments` and `harness:score` to
    an existing `package.json` only when the script key is absent, and keeps
    every other key. With no `package.json` it does nothing there.
  - It never adds or edits a dependency. When `harness-score` is missing
    from `package.json`, it prints the install command instead.
  - It never commits.
  - It rewrites `.wolven-harness.json` on every run.

### `validate`

- Flag: `--verbose`. Any other argument exits 1.
- Exit 0 when there are no error-level findings. Exit 1 when there is at
  least one, when the config is invalid, or when not in a git repository.
- Warnings never change the exit code.
- Findings print one per line as `<level> [<code>] <file>:<line>: <message>`.
  `level` is `error` or `warn`. The `:<line>` part and then the file part are
  left out when there is no line or file. The level and code are contract;
  the message is not.
- The last line is `validate: ok` when there are no errors, else
  `validate: <X> error(s), <Y> warning(s)`.
- A finding marked verbose-only prints only with `--verbose` and never
  counts.

Finding codes:

| Code | Level |
| --- | --- |
| `ignore-entry` | error |
| `profile-filename` | error |
| `profile-adr-name` | error |
| `profile-frontmatter` | error |
| `profile-type-dir` | error |
| `profile-status` | error |
| `profile-superseded-by` | error |
| `profile-flat-layout` | error |
| `profile-missing-main-doc` | error |
| `skill-frontmatter` | error |
| `rule-missing` | error |
| `harness-ignored` | error |
| `claim-missing` | error |
| `claim-duplicate` | error |
| `claim-invalid` | error |
| `claim-draft` | error |
| `claim-deprecated` | error |
| `claim-slug-mismatch` | error |
| `profile-iteration-doc` | warn |
| `skill-stub-open` | warn |
| `step0-pending` | warn |
| `adr-unrecognized` | warn |
| `legacy-adr` | warn |
| `adr-status-mismatch` | warn |
| `legacy-claim` | warn, verbose-only |

An `ignore-entry` error stops validation early. Only that finding and the
summary line are printed.

### `comments`

- Flag: `--base <ref>`. A missing value or any other argument exits 1.
- Without `--base`, the base is the merge-base with `origin/HEAD`, then
  `origin/main`, then `main`. If none exists it exits 1 and asks for `--base`.
- It judges comment lines added since the base, including untracked files.
  Built-in extensions are `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`.
- Exit 0 with no findings. Exit 1 with any finding, an invalid `comments`
  config, or when not in a git repository. Every finding is blocking.
- Each finding is one line: `<file>:<line>: [<kind>] <reason>`. The kind is
  contract; the reason is not.
- The last line is `comments: ok (0 findings)` with no findings. A count of
  files skipped for lack of a comment syntax appends `, N skipped: no syntax`
  inside the parentheses. With findings it is `comments: N finding(s)`.

Finding kinds: `untagged`, `over-length`, `change-narration`,
`dead-citation`, `review-vantage`, `reviewer-addressed`, `flow-narration`,
`planning-id`, `todo`.

### `.wolven-harness.json`, schema `version: 1`

A JSON object at the repository root.

| Key | Type | Rule |
| --- | --- | --- |
| `version` | number | Required. Must be `1`. It is the schema version, not the package version. |
| `gitHost` | string | Required. `gh` or `bit`. |
| `runtimes` | array | Required. Non-empty. Each entry `claude`, `codex` or `cursor`. |
| `skillSets` | array | Optional. Each entry `ship` or `discovery`. |
| `ignore` | array of strings | Optional. Each entry `<dir>/**`, with no glob characters in `<dir>`, no `..`, and `<dir>` not `docs` or `.agents` or under either. |
| `packageVersion` | string | Optional. Rewritten by `setup` on every run. |
| `comments.paths` | non-empty array of strings | Optional. Directory prefixes. When set, it replaces the default scope, `ignore` included. |
| `comments.languages` | object | Optional. Extension to `{ "line": "<non-empty string>", "block": ["<open>", "<close>"] }`. `block` is optional. |

- Any other top-level key is preserved untouched on rewrite.
- Existing keys keep their order. New keys are appended.
- A file that is invalid JSON, not an object, or breaks a rule above makes
  the command that reads it exit 1.

### Not contract

These may change in any release:

- Human-readable messages and hints, including finding messages and reasons.
- Prompt wording and the terminal UI, including colour and progress output.
- The content of `--verbose` and `--debug` output, and the `claims:` and
  `ignored:` lines of `validate`.
- The contents of template files.
- The set of skills and their text, and the skill sets' membership.
- The exact order of findings within a level.

## Change policy

A breaking change to any contract item needs all three:

1. A new ADR that supersedes this one.
2. A prior release that keeps the old behaviour and emits a deprecation
   warning.
3. A `feat!` or `BREAKING CHANGE` commit.

These are additive and allowed in a minor release:

- A new command flag.
- A new warning-level finding code or comment kind that does not fail the
  run.
- A new optional config key.

A new error-level finding code counts as breaking, because it can turn a
passing CI run red. A new `comments` kind counts as breaking for the same
reason.

release-please runs with `bump-minor-pre-major` and
`bump-patch-for-minor-pre-major`. Below 1.0 a `feat` bumps the patch, and a
minor bump is only for a breaking change marked `feat!` or `BREAKING CHANGE`.
A breaking change still bumps the minor rather than the major. The version
number is not the guarantee. This policy is.

## Consequences

- Consumers can pin CI to exit codes, finding codes and the config file, and
  upgrade minor versions without a surprise.
- Adding a rule that fails builds now costs a superseding ADR and a
  deprecation release. New checks start as warnings.
- Message and prompt text can improve freely, so scripts must not parse them.
- Every contract item needs a test that fails when it changes.
- The contract is only binding once this ADR is `stable`. A human promotes it.

## Amendments

- 2026-09-29, before 0.3.0 shipped: `setup` adds a third script,
  `harness:score`, and never adds or edits a dependency. Approved by the
  maintainer.
- 2026-09-29: `adr-status-mismatch` added as a warning code. It is additive under
  the change policy and ships in a minor release.
- 2026-09-30: below 1.0 a `feat` bumps the patch, and a minor bump is only
  for a breaking change marked `feat!` or `BREAKING CHANGE`.
  `bump-patch-for-minor-pre-major` is set, and `bump-minor-pre-major` stays
  set so a breaking change stays a minor. Chosen by the maintainer.

- 2026-10-05: `profile-iteration-doc` starts as a warning.

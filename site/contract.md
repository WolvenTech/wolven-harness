---
description: What wolven-harness 0.3.0 promises to keep stable, and what it does not.
---

# Contract

From 0.3.0, the items on this page are stable. Scripts and CI can depend on them. Anything not listed here can change in any release.

The source of truth is [ADR-003](https://github.com/WolvenTech/wolven-harness/blob/main/docs/adrs/adr-003-public-contract.md). This page is the reader version.

## Commands and exit codes

`wolven-harness <command> [options]`. The commands are `setup`, `validate`, and `comments`.

- No command, `--help`, or `-h` as the first argument prints usage to stdout and exits 0.
- `--version` or `-v` as the first argument prints `<package name> <version>` and exits 0.
- An unknown command prints a message and the usage to stderr and exits 1.
- Every command exits 0 on success and 1 on any handled failure. No other exit code is used.
- `WOLVEN_HARNESS_DEBUG=1` is the same as `--debug` on `setup`.

Each value flag takes `--flag value` or `--flag=value`. Any argument a command does not list is an error and exits 1.

### `setup`

| Flag | Value |
| --- | --- |
| `--git-host` | `gh` or `bit` |
| `--runtimes` | comma-separated `claude`, `codex`, `cursor`; entries are trimmed and deduplicated |
| `--skills` | comma-separated `ship`, `discovery`, or `none` alone |
| `--verbose` | none |
| `--debug` | none |

- A flag wins over `.wolven-harness.json`, which wins over a prompt.
- Prompts appear only when stdin and stdout are both TTYs. Without a TTY, a missing `--git-host` or `--runtimes` is an error that names the flag. A missing `--skills` defaults to `ship`.
- On a TTY, an invalid flag value is asked again instead of failing.
- Exit 1 on a flag or config error, on a cancelled prompt, and when not run at the git top level.

`setup` guarantees:

- It creates only missing paths and never overwrites or edits an existing file.
- It never creates or edits `AGENTS.md`.
- It adds `harness:validate` and `harness:comments` to an existing `package.json` only when that script key is absent, and keeps every other key. With no `package.json` it does nothing there.
- It never commits.
- It rewrites `.wolven-harness.json` on every run.

### `validate`

- Flag: `--verbose`.
- Exit 0 when there are no error-level findings. Exit 1 when there is at least one, when the config is invalid, or when not in a git repository. Warnings never change the exit code.
- Each finding prints on one line as `<level> [<code>] <file>:<line>: <message>`. The level is `error` or `warn`. The `:<line>` part, then the file part, is left out when there is none. Level and code are contract. The message is not.
- The last line is `validate: ok` with no errors, else `validate: <X> error(s), <Y> warning(s)`.
- A verbose-only finding prints only with `--verbose` and never counts.
- An `ignore-entry` error stops validation early. Only that finding and the summary line print.

### `comments`

- Flag: `--base <ref>`. A missing value exits 1.
- Without `--base`, the base is the merge-base with `origin/HEAD`, then `origin/main`, then `main`. If none exists it exits 1 and asks for `--base`.
- It judges comment lines added since the base, including untracked files. Built-in extensions are `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`.
- Exit 0 with no findings. Exit 1 with any finding, an invalid `comments` config, or when not in a git repository. Every finding blocks.
- Each finding is one line: `<file>:<line>: [<kind>] <reason>`. The kind is contract. The reason is not.
- The last line is `comments: ok (0 findings)`. If files were skipped for lack of a comment syntax, `, N skipped: no syntax` is added inside the parentheses. With findings it is `comments: N finding(s)`.

## Finding codes

`validate` codes:

| Code | Level | Meaning |
| --- | --- | --- |
| `ignore-entry` | error | An `ignore` entry in `.wolven-harness.json` is not allowed. |
| `profile-filename` | error | A doc filename is not kebab-case ASCII. |
| `profile-adr-name` | error | An ADR filename does not match `adr-NNN-<kebab-slug>.md`. |
| `profile-frontmatter` | error | A doc has missing, unparseable, or incomplete frontmatter. |
| `profile-type-dir` | error | A doc's `type` does not match its `docs/` directory. |
| `profile-status` | error | `status` is not `draft`, `stable`, or `deprecated`. |
| `profile-superseded-by` | error | A deprecated ADR has a missing or invalid `superseded_by`. |
| `profile-flat-layout` | error | A doc is a flat file where the doc-folder layout is expected. |
| `profile-missing-main-doc` | error | A doc folder lacks its main doc. |
| `skill-frontmatter` | error | A skill has no `SKILL.md`, or its frontmatter is missing or invalid. |
| `rule-missing` | error | A skill cites a rule file that does not exist. |
| `harness-ignored` | error | A git ignore rule excludes a harness file, so other clones and CI never get it. |
| `claim-missing` | error | An `ADR-NNN` reference matches no decision record. |
| `claim-duplicate` | error | An `ADR-NNN` reference matches more than one record. |
| `claim-invalid` | error | The referenced ADR fails the writing profile. |
| `claim-draft` | error | The referenced ADR is draft, not stable. |
| `claim-deprecated` | error | The referenced ADR is deprecated. |
| `claim-slug-mismatch` | error | The slug in the reference does not match the ADR filename. |
| `skill-stub-open` | warn | A skill stub is unfinished. |
| `step0-pending` | warn | `harness-init` step 0 has not been done. |
| `adr-unrecognized` | warn | Files use 4-digit ADR numbering, which is not checked. |
| `legacy-adr` | warn | A legacy ADR still needs migrating. |
| `legacy-claim` | warn, verbose-only | A reference matches only a legacy ADR. |

`comments` finding kinds. All block:

| Kind | Meaning |
| --- | --- |
| `untagged` | An added comment has no `why:`, `hazard:`, or `invariant:` tag and is not a JSDoc on a declaration. |
| `over-length` | A tagged comment runs past 4 lines. |
| `change-narration` | The comment narrates the change instead of the state. |
| `dead-citation` | The comment cites code, a document, a conversation, or an id that is not in the repository. |
| `review-vantage` | The comment speaks from the change rather than from the repository. |
| `reviewer-addressed` | The comment argues its correctness to a reviewer, or records who said what. |
| `flow-narration` | The comment restates control flow the code already shows. |
| `planning-id` | The comment cites planning context a package reader never sees. |
| `todo` | The comment defers work instead of describing what holds now. |

## `.wolven-harness.json`, schema v1

A JSON object at the repository root.

| Key | Type | Rule |
| --- | --- | --- |
| `version` | number | Required. Must be `1`. This is the schema version, not the package version. |
| `gitHost` | string | Required. `gh` or `bit`. |
| `runtimes` | array | Required. Not empty. Each entry is `claude`, `codex`, or `cursor`. |
| `skillSets` | array | Optional. Each entry is `ship` or `discovery`. |
| `ignore` | array of strings | Optional. Each entry is `<dir>/**`. No glob characters in `<dir>`, no `..`, and `<dir>` is not `docs` or `.agents` or under either. |
| `packageVersion` | string | Optional. `setup` rewrites it on every run. |
| `comments.paths` | non-empty array of strings | Optional. Directory prefixes. When set, it replaces the default scope, `ignore` included. |
| `comments.languages` | object | Optional. Maps an extension to `{ "line": "<non-empty string>", "block": ["<open>", "<close>"] }`. `block` is optional. |

- Any other top-level key is kept untouched when `setup` rewrites the file.
- Existing keys keep their order. New keys are appended.
- A file that is invalid JSON, not an object, or breaks a rule above makes the command that reads it exit 1.

## Not contract

These can change in any release:

- Human-readable messages and hints, including finding messages and reasons.
- Prompt wording and the terminal UI, including colour and progress output.
- The content of `--verbose` and `--debug` output, and the `claims:` and `ignored:` lines of `validate`.
- The contents of template files.
- The set of skills, their text, and which skill set holds which skill.
- The order of findings within a level.

Do not parse messages. Match on exit codes, levels, codes, and kinds.

## Change policy

A breaking change to any item above needs all three:

1. A new ADR that supersedes ADR-003.
2. A prior release that keeps the old behaviour and prints a deprecation warning.
3. A `feat!` or `BREAKING CHANGE` commit.

These are additive and allowed in a minor release:

- A new command flag.
- A new warning-level finding code or comment kind that does not fail the run.
- A new optional config key.

A new error-level `validate` code counts as breaking, because it can turn a passing CI run red. So does a new `comments` kind.

Below 1.0, release-please still bumps the minor version for a breaking change. The version number is not the guarantee. This policy is.

To move from 0.2, see [Upgrade from 0.2 to 0.3](./upgrade).

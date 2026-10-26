---
type: adr
title: Extend the public contract with read-only installation checks
description: Carry the wiring contract forward and add doctor, linked-layout configuration, stale-rule errors and offline classification of earlier template forms.
status: stable
---

# Extend the public contract with read-only installation checks

## Context

ADR-005 records the wiring release: setup outside repositories, refusal of
repository subfolders, runtime registry ids, package-manager choice and the
home layout. That release can install the harness, but validation alone
cannot show whether an agent receives the entry section, rules and skills.

The check-and-repair release adds a read-only `doctor` command and linked
layouts. It checks paths from the folder the agent opens, including whether
qmd reaches the harness home's index. It detects changed standing-rule
copies and distinguishes untouched earlier templates from consumer edits
using the forms shipped with the package, without a network call.

This record carries the wiring contract forward in full. Its new command,
finding codes, optional configuration keys and supported layout value are
additive. Setup remains create-only; repairs require a separate Human
choice in the `harness-doctor` skill.

## Decision

The items in this section are the public contract. Nothing else is.

### Commands

`wolven-harness <command> [options]`. The commands are `setup`, `doctor`,
`validate`, `comments`, and `skills`.

- No command, `--help` or `-h` as the first argument prints usage to stdout
  and exits 0.
- `--version` or `-v` as the first argument prints `<package name> <version>`
  and exits 0.
- An unknown command writes the error message to stderr and usage to stdout,
  then exits 1.
- Every command exits 0 on success and 1 on any handled failure. No other
  exit code is used.

### Runtime ids

`claude`, `codex`, `cursor`, `opencode`, `amp`, `copilot`, `gemini`, `kiro`,
`antigravity`. Each id names one agent runtime. Which files `setup` creates
for an id is not contract (see Not contract), but an id, once listed, is
never removed without a superseding ADR.

### `setup`

Flags. Each value flag takes `--flag value` or `--flag=value`.

| Flag | Value |
| --- | --- |
| `--git-host` | `gh` or `bit` |
| `--runtimes` | comma-separated runtime ids; entries are trimmed and deduplicated |
| `--skills` | comma-separated `ship`, `discovery`, or `none` alone |
| `--package-manager` | `npm`, `yarn`, `pnpm` or `none` |
| `--verbose` | none |
| `--debug` | none |

- Any other argument is an error and exits 1.
- `WOLVEN_HARNESS_DEBUG=1` is the same as `--debug`.
- Exit 0 when setup completes. Exit 1 on a flag or config error and on a
  cancelled prompt.
- Resolution order: a flag wins over `.wolven-harness.json`, which wins over
  detection, which wins over a prompt.
- Prompts appear only when stdout is a TTY and stdin is a TTY. Without a
  TTY, a missing `--git-host` or `--runtimes` is an error naming the flag.
  A missing `--skills` defaults to `ship`.
- On a TTY, an invalid flag value is asked again instead of failing.
- The package manager is detected from `package.json`'s `packageManager`
  field, then from the single lockfile present (`pnpm-lock.yaml`,
  `yarn.lock`, `package-lock.json`). It is `none` when there is no
  `package.json`. With several lockfiles and no flag or config value, a TTY
  prompts and a run without a TTY is an error naming `--package-manager`.

Modes:

- **At a git top-level,** it scaffolds the harness as below.
- **Outside any git repository,** it writes only:
  - the core skills under `.agents/skills/`;
  - each selected runtime's skills wiring;
  - `.wolven-harness.json`.

  It then exits 0 and directs the developer to run `harness-init` in that
  folder.
- **Inside a repository subfolder,** it exits 1 before prompting or
  writing. The diagnostic names the repository top-level. When git is not
  available, setup checks the current folder and its ancestors for a `.git`
  entry to distinguish a repository subfolder from an outside folder.

Guarantees, in both modes:

- It creates only missing paths and never overwrites or edits an existing
  file. This includes each runtime's rules wiring: an existing
  `opencode.json` or `GEMINI.md` is left as it is.
- It never creates or edits `AGENTS.md`.
- At a git top-level, it adds `harness:validate`, `harness:comments` and
  `harness:score` to an existing `package.json` only when the script key is
  absent, and keeps every other key. With no `package.json` it does nothing
  there.
- It never adds or edits a dependency. When `harness-score` is missing from
  `package.json`, it prints the install command instead.
- It never commits.
- It writes no install manifest.
- It rewrites `.wolven-harness.json` on every run, and keeps the value of
  every key it does not resolve.
- Some paths depend on the chosen skill sets. With `discovery` it creates
  `docs/maps/.gitkeep`, a `docs/maps/.gitignore` that ignores built
  canvases, a `maps` collection in `.qmd/index.yml` and a `docs/maps/`
  row in `WOLVEN.md`. Without `discovery` it creates none of them. The
  create-only guarantee still holds, so a re-run never adds the collection
  or the row to a file that already exists.

### `doctor`

Checks the installed harness without writing files or using the network.

- Flag: `--dir <path>` or `--dir=<path>`, default the current directory.
  A missing value or any other argument exits 1 before checks run.
- It reads `.wolven-harness.json` in that folder. For `layout: "linked"`,
  `harnessHome` names the harness home relative to that config file. Entry,
  skills and rules wiring are checked under the open folder, following
  symlinks; source rules and templates are checked in the harness home.
- Findings print one per line as `<level> [<code>] <message>`. An error is
  followed by `fix: <text>`. Level and code are contract; message and fix
  text are not.
- The last line is `doctor: ok` with no errors, otherwise
  `doctor: <X> error(s), <Y> warning(s)`.
- Exit 0 with no error-level findings, 1 otherwise. Warnings do not change
  the exit code.
- It never installs a tool, changes a file or commits.

Finding codes:

| Code | Level | Meaning |
| --- | --- | --- |
| `doctor-config` | error | The config is missing or invalid; no other check runs. |
| `doctor-entry` | error | A wired runtime's instruction chain does not reach the harness section. |
| `doctor-rules` | error | A wired runtime cannot reach its standing rules, or the inline block is missing or incomplete. |
| `doctor-rules-stale` | error | A generated rule copy or the inline block differs from current source rules, or a generated copy has no source rule. |
| `doctor-skills` | error | A wired runtime cannot reach the expected installed skills from the open folder. |
| `doctor-docs` | error | The docs folder is missing, outside a git repository with a commit, or ignored. |
| `doctor-qmd` | error | qmd is absent from PATH, or the nearest index config found upward from the open folder does not reach the harness home's indexed `.qmd` folder. |
| `doctor-code-repo` | error | A harness-owned path exists under the configured code repository; unrelated agent settings do not count. |
| `doctor-not-global` | warn | The CLI is absent from PATH; a local or cached executable gets the resolved manager's global-install hint. |
| `doctor-version-behind` | warn | The recorded package version is older than the running CLI. |
| `doctor-drift-missing` | warn | An expected template file is absent. |
| `doctor-drift-stale` | warn | A file matches a known earlier template form but differs from the current form. |
| `doctor-drift-edited` | warn | A file differs from the current form and every known earlier form. |

Rules and drift:

- One install-wide rules mode applies. If any wired runtime reads the
  inline block, all wired runtimes receive it and no native rules wiring
  is required. A block finding names every runtime that reads it.
- A generated per-rule copy is compared byte-for-byte with the registry's
  rendering of the current source rule. An orphan generated copy also
  fails. Direct links, import lists and file wiring point at source rules
  and are checked for reachability rather than copied-body drift.
- The inline block holds current rule bodies in file-name order, with YAML
  frontmatter removed and headings transformed as `harness-init` writes
  them. Whitespace runs count as one space; extra or changed body text is
  stale. Fix guidance names `harness-doctor`.
- qmd lookup walks upward from the open folder to the first
  `.qmd/index.yaml` or `.qmd/index.yml`. That folder's real path must equal
  the harness home's `.qmd`, and it must hold `index.sqlite`.
- File drift compares current template bytes first, then known forms
  shipped with the package. Earlier installs need no adoption step or
  local write record. `WOLVEN.md` is not classified because initialization
  folds it into the entry file and deletes it.

### `skills`

Copies selected ship and discovery skills from the package templates without
running `setup`. It can run in any directory, without a Git repository or
an installed harness.

Each value flag accepts `--flag value` or `--flag=value`. Values and list
entries are trimmed; empty list entries are ignored and duplicates removed.

| Flag | Value |
| --- | --- |
| `--runtimes` | comma-separated `claude`, `codex`, `cursor` |
| `--scope` | `project`, `global`, or both as `project,global` or `global,project` |
| `--skills` | comma-separated ship or discovery skill names, the set names `ship` and `discovery`, or a mixture |

- `skills --help` or `skills -h` alone prints help to stdout, exits 0,
  and writes nothing. Help names the flags, values, available skills, and
  that core skills are installed by `setup`.
- An unknown argument or an omitted flag value exits 1 before prompting or
  writing. `none` is not a valid skill choice; `both` is not a scope value.
- Set names expand to their member skills. A skill selected through a set
  and individually is installed once. Core and unknown skill names fail
  with exit 1 before any write; the diagnostic names the choice and `setup`.
- Prompts appear only when stdout and stdin are terminals. Without a
  terminal, all three flags are required; a missing or invalid choice
  exits 1 before writing. Choice prompts run in runtime, scope, skill order.
- On a terminal, missing or invalid runtime and scope choices are prompted
  again. Supplied valid choices are retained. Missing skills are prompted;
  supplied core or unknown skill names fail rather than being re-prompted.
- The skill prompt offers ship and discovery sets and individual members.
  It names the core skills and directs users to the harness for code-lane,
  `adr`, and `qmd`, but does not offer core skills for selection.

Load paths:

| Runtime | Project | Global |
| --- | --- | --- |
| Claude | `.claude/skills/<skill>/` | `~/.claude/skills/<skill>/` |
| Codex and Cursor | `.agents/skills/<skill>/` | `~/.agents/skills/<skill>/` |

Project paths are relative to the current directory. Global paths are
relative to the home directory: a non-empty `HOME` takes precedence over
`os.homedir()`. Destinations are deduplicated before any prompt or write,
so selecting Codex and Cursor writes their shared directory once.

Guarantees:

- Only chosen skill folders are copied. No harness config, rules, runtime
  links, import files, `AGENTS.md`, package scripts, or dependencies are
  created or edited. The command never commits.
- A folder with the same relative file paths and file bytes as the package
  copy is left in place without a prompt or rewrite.
- Each differing destination has its own replacement question, in sorted
  path order. Every question is asked before any write. A yes replaces
  that folder with the package copy, deleting extra files; a no preserves
  it while allowing missing chosen folders to be added.
- Without a terminal, differing folders are preserved without prompting,
  and missing chosen folders are still copied. This is a successful run.
- Cancelling any choice or replacement prompt exits 1 and writes nothing,
  even when an earlier replacement question was answered yes.
- A handled filesystem error exits 1 and writes a diagnostic to stderr.
  Folders already written are not rolled back. A folder that was not
  selected for replacement is not deleted.
- Exit 0 when the run completes, including preserved existing folders.
  Exit 1 on a handled flag, choice, cancellation, or filesystem failure.
  Human-readable diagnostics and prompt wording remain outside the contract.

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
- `step0-pending` fires while `WOLVEN.md` exists and `AGENTS.md` lacks the
  `<!-- wolven-harness:start -->` marker.

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
| `profile-map-doc` | warn |
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

A JSON object in the folder `setup` ran in: the repository root at a git
top-level, otherwise that folder.

| Key | Type | Rule |
| --- | --- | --- |
| `version` | number | Required. Must be `1`. It is the schema version, not the package version. |
| `gitHost` | string | Required. `gh` or `bit`. |
| `runtimes` | array | Required. Non-empty. Each entry a runtime id. |
| `skillSets` | array | Optional. Each entry `ship` or `discovery`. |
| `ignore` | array of strings | Optional. Each entry `<dir>/**`, with no glob characters in `<dir>`, no `..`, and `<dir>` not `docs` or `.agents` or under either. |
| `packageVersion` | string | Optional. Rewritten by `setup` on every run. |
| `packageManager` | string | Optional. `npm`, `yarn`, `pnpm` or `none`. |
| `layout` | string | Optional. `home` or `linked`; `home` makes the open folder the harness home. |
| `harnessHome` | string | Required for `linked`, forbidden otherwise. A non-empty path relative to this config file. |
| `codeRepo` | string | Optional. A path relative to this file's folder. |
| `commitConvention` | object | Optional. `{ "style": "conventional" }`, or `{ "style": "pattern", "pattern": "<regex>", "example": "<subject>" }` where `pattern` compiles as a JavaScript regular expression. |
| `comments.paths` | non-empty array of strings | Optional. Directory prefixes. When set, it replaces the default scope, `ignore` included. |
| `comments.languages` | object | Optional. Extension to `{ "line": "<non-empty string>", "block": ["<open>", "<close>"] }`. `block` is optional. |

- Unknown extension keys are preserved untouched on rewrite. Unsupported
  installation-layout combinations are rejected.
- Existing keys keep their order. New keys are appended.
- A file that is invalid JSON, not an object, or breaks a rule above makes
  the command that reads it exit 1.

### Not contract

These may change in any release:

- Human-readable messages and hints, including finding messages, fix lines
  and reasons.
- Prompt wording and the terminal UI, including colour and progress output.
- The content of `--verbose` and `--debug` output, and the `claims:` and
  `ignored:` lines of `validate`.
- The contents of template files.
- The set of skills and their text, and the skill sets' membership.
- The exact order of findings within a level.
- Which files `setup` creates to wire a runtime's skills and rules, and the
  markers each runtime is detected by.

## Change policy

A breaking change to any contract item needs all three:

1. A new ADR that supersedes this one.
2. A prior release that keeps the old behaviour and emits a deprecation
   warning.
3. A `feat!` or `BREAKING CHANGE` commit.

These are additive and allowed in a minor release:

- A new command that preserves the existing commands and their guarantees.
- A new command flag.
- A new runtime id.
- A new warning-level finding code or comment kind that does not fail the
  run.
- A new optional config key.
- A new `doctor` finding code at any level; this command is not a CI gate.

A new error-level finding code in `validate` counts as breaking, because it
can turn a passing CI run red. A new `comments` kind counts as breaking for
the same reason.

release-please runs with `bump-minor-pre-major` and
`bump-patch-for-minor-pre-major`. Below 1.0 a `feat` bumps the patch, and a
minor bump is only for a breaking change marked `feat!` or `BREAKING CHANGE`.
A breaking change still bumps the minor rather than the major. The version
number is not the guarantee. This policy is.

## Consequences

- This record supersedes ADR-005. The predecessor remains as history;
  current claims and contract tests target this record.
- Existing wiring-only configurations remain valid. The config schema
  stays at version `1`; linked layout keys are optional outside that mode.
- The checks report installation defects without changing the install.
  Error-level findings fail doctor; drift and tool-install warnings alone
  do not fail it.
- `harness-doctor` shows a diff and asks before each repair. Stale template
  files can be replaced one at a time; edited files are shown and left
  alone. Stale generated rule copies are deleted only after approval and
  recreated by setup. Inline repairs preserve text outside the block's
  markers. Declined fixes stay failing.
- Setup still never overwrites rule copies. Updating source rules can
  therefore make doctor fail until the Human approves a repair.
- Earlier template forms ship with the package. Upgrade classification
  needs no network and no install manifest.
- New error-level `validate` checks still require the change policy above;
  this command does not change that CI guarantee.
- Human-readable messages may improve; scripts must not parse them.
- Every contract item needs a test that fails when it changes.

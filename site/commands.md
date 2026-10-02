---
description: Complete CLI reference for setup, validate, comments, flags, configuration, output, and exit codes.
---

# Commands

`wolven-harness` installs and checks the harness in a Git repository. This page is the full reference for the three CLI commands, top-level options, setup configuration, output, and failure behavior. The public contract is recorded in [ADR-003](https://github.com/WolvenTech/wolven-harness/blob/main/docs/adrs/adr-003-public-contract.md).

## Install and run

Install the package as a development dependency, then run setup from the repository root:

```sh
pnpm add -D @wolven-tech/harness
pnpm exec wolven-harness setup
```

Once setup has added the package script aliases, use `pnpm harness:validate`, `pnpm harness:comments`, and `pnpm harness:score`. You can always call an installed CLI directly with `pnpm exec wolven-harness <command>`. If you run from a source checkout, first build with `pnpm build`, then use `node /path/to/wolven-harness/dist/cli.js <command>`.

## Command overview

| Command | What it does | Where to run it |
| --- | --- | --- |
| `setup` | Installs missing harness files, wires selected runtimes, records setup choices, and adds missing package scripts. | At the Git repository root only. |
| `validate` | Checks documentation structure, ADR references, installed skills and rules, and harness paths. | Anywhere inside a Git repository. |
| `comments` | Checks newly added comment blocks against the repository's comment rules. | Anywhere inside a Git repository. |

```text
wolven-harness <command> [options]
wolven-harness --help
wolven-harness --version
```

The CLI also accepts `-h` for help and `-v` for version. Help and version are recognized when they are the first argument. A missing command prints help and exits successfully. An unknown command prints an error and help to stderr.

## `setup`

```text
wolven-harness setup [options]
```

Run setup from the Git repository's top-level directory. Setup refuses to run outside a repository or from a subdirectory. It installs core skills, rules, documentation templates, and `WOLVEN.md`; it wires selected agent runtimes; and it adds missing harness scripts to an existing `package.json`.

Setup creates only missing template paths and leaves existing copies alone. It never creates or edits `AGENTS.md`, never adds dependencies, and never commits. It rewrites `.wolven-harness.json` on each successful run to save the selected options and current package version.

### Options

| Option | Values | Behavior |
| --- | --- | --- |
| `--git-host <value>` | `gh`, `bit` | Records GitHub or Bitbucket as the repo's host. |
| `--runtimes <list>` | Comma-separated `claude`, `codex`, `cursor` | Selects runtimes to wire. Entries are trimmed and duplicates removed. At least one runtime is required. |
| `--skills <list>` | Comma-separated `ship`, `discovery`, or `none` alone | Chooses optional skill sets. Core skills are always installed. `none` means core only on a fresh setup. |
| `--verbose` | No value | Lists every file setup created and kept. |
| `--debug` | No value | Traces setup steps to stderr. |

Value options accept either `--option value` or `--option=value`. For example:

```sh
pnpm exec wolven-harness setup --git-host=gh --runtimes=claude,codex --skills=ship
```

### Prompts, detection, and defaults

Setup resolves each value in this order: command-line flag, existing `.wolven-harness.json`, then an interactive prompt. Prompts appear only when both stdin and stdout are terminals. For missing repo settings, setup detects GitHub or Bitbucket from `origin` and detects runtime markers such as `.claude`, `CLAUDE.md`, `.codex`, `.cursor`, and `.cursorrules`; detected values are preselected in the prompts.

Without an interactive terminal, supply any missing required `--git-host` and `--runtimes` values as flags. The optional skill sets default to `ship` when no choice has been recorded. On an interactive run, `ship` is preselected, and you may select no optional sets.

An invalid flag value can be corrected in an interactive prompt. In non-interactive use it is an error. `--skills none` cannot be combined with another skill set. Re-running setup never removes skill files or optional sets already present; choosing `none` does not uninstall anything.

Use `WOLVEN_HARNESS_DEBUG=1` to enable the same step trace as `--debug`.

### What setup writes

- The `.agents/` skills and rules tree, documentation folders, and `WOLVEN.md`.
- `.qmd/index.yml` and the local index ignore file.
- `.harness-score.json`, the starter configuration for harness scoring.
- `.wolven-harness.json`, with the resolved Git host, runtimes, selected skill sets, and package version.
- Missing `harness:validate`, `harness:comments`, and `harness:score` scripts in an existing `package.json`.
- For Claude Code only, a `.claude/skills` symlink and a `CLAUDE.md` import file, each created only if missing. Codex and Cursor read `.agents/skills/` natively, so setup creates no runtime-specific files for them.

Existing files and scripts are preserved. Setup does not install `harness-score`; when it is needed but absent, setup prints the command to add it. If there is no `package.json`, no scripts are added.

## `validate`

```text
wolven-harness validate [--verbose]
```

Run validation from anywhere inside a Git repository. It scans tracked files, except paths excluded by valid `ignore` entries, and reports findings from four areas:

1. **Document profile:** ADR naming and layout; required frontmatter; document type, slug folder, and status; required main documents; deprecated ADR successors.
2. **ADR claims:** References such as `ADR-003` must resolve to one valid, stable ADR. A claim that points to a draft, deprecated, invalid, missing, duplicate, or slug-mismatched decision fails.
3. **Legacy decisions:** ADRs outside `docs/adrs/` and decision folders the harness cannot interpret are reported as warnings so they can be migrated.
4. **Harness structure:** Skill frontmatter, cited rules, integration of `WOLVEN.md`, and whether required harness paths are hidden by Git ignore rules.

Warnings do not fail validation. `--verbose` includes legacy claim locations that are summarized by default. An invalid `ignore` entry stops validation early because the scan scope cannot be trusted.

### Finding codes

Every finding line has the form `level [code] path:line: message`; the path and line are omitted when a finding has no source location. Codes and levels are stable; message text may change.

| Code | Level | Meaning |
| --- | --- | --- |
| `ignore-entry` | Error | Invalid `.wolven-harness.json` ignore pattern. |
| `profile-filename`, `profile-adr-name` | Error | Document filename does not match the required kebab-case or ADR naming form. |
| `profile-frontmatter`, `profile-type-dir`, `profile-status` | Error | Required metadata is missing or invalid, or the document type does not match its folder. |
| `profile-superseded-by` | Error | Deprecated ADR has no valid tracked successor. |
| `profile-flat-layout`, `profile-missing-main-doc` | Error | A document folder uses a flat file or lacks its required main document. |
| `skill-frontmatter`, `rule-missing`, `harness-ignored` | Error | A skill is malformed, a cited rule is absent, or a required harness path is ignored. |
| `claim-missing`, `claim-duplicate`, `claim-invalid` | Error | ADR claim has no unique valid target. |
| `claim-draft`, `claim-deprecated`, `claim-slug-mismatch` | Error | ADR claim points to a decision that is not a matching stable record. |
| `skill-stub-open`, `step0-pending` | Warning | A skill stub still needs definition, or `WOLVEN.md` still needs integration into `AGENTS.md`. |
| `adr-unrecognized`, `legacy-adr`, `adr-status-mismatch` | Warning | A decision record needs migration, uses an unrecognized folder, or its body contradicts its stable status. |
| `legacy-claim` | Warning, verbose only | A claim resolves only to a legacy ADR outside `docs/adrs/`. |

Successful output ends with `validate: ok`. A failing run ends with an error and warning count and exits 1. Validation exits 1 for an invalid config or when run outside a Git repository; it exits 0 when there are warnings but no errors.

## `comments`

```text
wolven-harness comments [--base <ref>]
```

This command checks only comment blocks added since a base revision; it does not lint existing comments. Without `--base`, it uses the merge-base with the first available ref in this order: `origin/HEAD`, `origin/main`, then `main`. If none can be resolved, pass a base explicitly.

```sh
pnpm harness:comments
pnpm exec wolven-harness comments --base origin/main
```

The scan includes changed and untracked files that match the configured paths. Built-in comment syntax covers `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, and `.cjs`. Configure additional languages in `.wolven-harness.json`; files with no known syntax are skipped and counted in the summary.

### Comment rules

A new comment should explain why, a hazard, or an invariant. Use a `why:`, `hazard:`, or `invariant:` tag and keep the block to four lines or fewer. A JSDoc block directly above a declaration can instead document that declaration. The scanner also flags change narration, citations that cannot be resolved from the repository, reviewer-directed claims, comments that restate control flow, planning identifiers, and `@todo` deferrals.

Tool directives such as `eslint`, `biome-ignore`, and `@ts-ignore`, plus generated-file banners, are not treated as ordinary comments.

Findings include a root-relative path, line, kind, and explanation. A clean run prints `comments: ok (0 findings)` and exits 0. Any finding, malformed comments config, missing Git repository, unknown option, or unresolved base exits 1.

| Finding kind | What it flags |
| --- | --- |
| `untagged` | A new comment block without a reason tag or qualifying JSDoc placement. |
| `over-length` | A tagged comment block longer than four lines. |
| `change-narration` | Text describing an earlier version or narrating the change. |
| `dead-citation` | A reference to context or a plan that is not available in the repository. |
| `review-vantage` | Text written from the perspective of a PR, patch, or reviewer. |
| `reviewer-addressed` | A comment that argues correctness to a reviewer. |
| `flow-narration` | A comment that restates the code's control flow. |
| `planning-id` | A planning identifier that package users cannot resolve. |
| `todo` | An `@todo` deferral. |

## Configuration

Setup stores its choices in `.wolven-harness.json` at the repository root. The file uses schema version `1`. `setup` writes the core keys below and preserves other keys it does not own.

```json
{
  "version": 1,
  "gitHost": "gh",
  "runtimes": ["claude", "codex"],
  "skillSets": ["ship"],
  "packageVersion": "0.3.0",
  "ignore": ["vendor/**"],
  "comments": {
    "paths": ["src", "test"],
    "languages": {
      ".py": { "line": "#" },
      ".sql": { "line": "--", "block": ["/*", "*/"] }
    }
  }
}
```

| Key | Required | Purpose and rules |
| --- | --- | --- |
| `version` | Yes | Must be the number `1`; this is the config schema version. |
| `gitHost` | Yes for setup | `gh` or `bit`; the `--git-host` flag overrides it. |
| `runtimes` | Yes for setup | Non-empty array of `claude`, `codex`, or `cursor`; `--runtimes` overrides it. |
| `skillSets` | No | Optional `ship` and/or `discovery` sets; core is always installed. |
| `packageVersion` | No | Refreshed to the running package version by setup. |
| `ignore` | No | Validation scan exclusions and default comments exclusions. Each entry must be `<dir>/**`; `docs/` and `.agents/` cannot be excluded. |
| `comments.paths` | No | Non-empty directory list replacing the default comments scope. When set, it takes precedence over `ignore` for comment selection. |
| `comments.languages` | No | Maps an extension such as `.py` to a required `line` marker and optional `[open, close]` `block` markers. |

When `comments.paths` is absent, changed files under `ignore` paths are excluded from comment checks. When it is present, that path list replaces the default scope. For example, the configuration above checks comment changes under `src/` and `test/` and recognizes Python and SQL comment syntax.

Any unknown top-level keys are retained when setup rewrites the file. Invalid JSON or invalid known fields cause the command reading the config to exit 1.

## Exit codes and troubleshooting

| Exit code | Meaning |
| --- | --- |
| `0` | Help/version printed, setup completed, or a validation/comment scan found no errors. Warnings alone still succeed. |
| `1` | Unknown command or option, invalid or missing required values, cancelled setup prompt, config or Git error, or one or more error-level findings. |

Common setup problems:

- **“setup must run at the git top-level”** — change to the directory containing `.git` and retry.
- **Missing `--git-host` or `--runtimes`** — pass the missing flags in automation, or run with an interactive terminal.
- **`harness-score` is missing** — install the version-specific command printed by setup before using `harness:score`.

Common check problems:

- **No default base for `comments`** — fetch or create `origin/main`/`main`, or pass `--base <ref>`.
- **An ADR claim fails** — create or correct the profile ADR under `docs/adrs/`; claims require a unique stable decision.
- **A legacy ADR warning remains** — use the `harness-init` skill to migrate the decision while preserving its meaning.

For setup workflow and first steps, see [Setup](./harness-init). For the installed skill choices, see [Skills](./skills).

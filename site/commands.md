---
description: Complete CLI reference for setup, validate, comments, flags, configuration, output, and exit codes.
---

# Commands

Use `wolven-harness` to set up the tools your coding agent needs, then check the harness as you work. Most people start with `setup`, ask their agent to run `harness-init`, and use `validate` and `comments` during development. This page starts with common examples and then gives the exact options and behavior for all three commands.

## Install and run

From the root of the repository you want to set up, install the package and run `setup`:

```sh
pnpm add -D @wolven-tech/harness
pnpm exec wolven-harness setup
```

Next, ask your coding agent to run the `harness-init` skill. It walks through connecting the installed instructions to your repository's `AGENTS.md`; see [Setup](./harness-init) for that walkthrough.

To check the harness as you work, run:

```sh
pnpm exec wolven-harness validate
pnpm exec wolven-harness comments --base origin/main
```

When `setup` adds the package scripts, you can use `pnpm harness:validate`, `pnpm harness:comments`, and `pnpm harness:score` instead. The direct `pnpm exec wolven-harness <command>` form always works for an installed package. From a source checkout, build first with `pnpm build`, then run `node /path/to/wolven-harness/dist/cli.js <command>`.

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

Use `pnpm exec wolven-harness --help` to see the commands and options, or `pnpm exec wolven-harness --version` to check which version is installed. Running the CLI without a command also displays help. If you mistype a command, the CLI shows an error and the command list; use one of the commands in the examples above or check `--help` for the full list.

The commands, flags, exit codes, finding codes, summary lines, and configuration schema are public contract; see [ADR-003](https://github.com/WolvenTech/wolven-harness/blob/main/docs/adrs/adr-003-public-contract.md).

## `setup`

```text
wolven-harness setup [options]
```

Run setup at the top level of the Git repository you want to prepare. It adds the harness files that are missing, wires the runtimes you choose, and adds check scripts to an existing `package.json` when those scripts are absent. Setup stops with an error if you run it outside a Git repository or from a subdirectory.

You can safely run setup again: it leaves existing files and scripts in place. It does not create or edit `AGENTS.md`, install dependencies, or commit changes. After a successful run, `.wolven-harness.json` records your choices and the installed package version.

### Options

| Option | Values | Behavior |
| --- | --- | --- |
| `--git-host <value>` | `gh`, `bit` | Records GitHub or Bitbucket as the repo's host. |
| `--runtimes <list>` | Comma-separated `claude`, `codex`, `cursor` | Selects runtimes to wire. Entries are trimmed and duplicates removed. At least one runtime is required. |
| `--skills <list>` | Comma-separated `ship`, `discovery`, or `none` alone | Chooses optional skill sets. Core skills are always installed. `none` means core only on a fresh setup. |
| `--verbose` | No value | Lists every file setup created and kept. |
| `--debug` | No value | Shows a step-by-step trace while setup runs. |

Value options accept either `--option value` or `--option=value`. For example:

```sh
pnpm exec wolven-harness setup --git-host=gh --runtimes=claude,codex --skills=ship
```

### Prompts, detection, and defaults

Setup uses each value from its command-line flag first, then from `.wolven-harness.json`, and finally asks you when run in an interactive terminal. For missing repository settings, setup detects GitHub or Bitbucket from `origin` and detects runtime markers such as `.claude`, `CLAUDE.md`, `.codex`, `.cursor`, and `.cursorrules`; detected values are preselected when it asks.

When setup runs in a script or CI, include any missing required `--git-host` and `--runtimes` values in the command. The optional skill sets default to `ship` when no choice has been recorded. In an interactive setup, `ship` is preselected, and you can choose no optional sets.

If a flag value is invalid, setup lets you correct it when asking questions in a terminal; in a script or CI, correct the command and run it again. A flag with no value or an unknown option exits 1 before any prompt, even in a terminal. `--skills none` cannot be combined with another skill set. Re-running setup never removes skill files or optional sets already present; choosing `none` does not uninstall anything.

For the same setup trace in a script or CI, set `WOLVEN_HARNESS_DEBUG=1`.

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

Warnings do not fail validation. `--verbose` includes legacy claim locations that are summarized by default. An invalid `ignore` entry stops validation early because the scan scope cannot be trusted; only the `ignore-entry` finding(s) and summary line are printed, without the other profile findings.

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

This command checks only comment blocks added since a base revision; it does not lint existing comments. Without `--base`, it uses the merge-base with the first available ref in this order: `origin/HEAD`, `origin/main`, then `main`. If none can be resolved, pass a base explicitly. `--base` takes its value as a separate argument; `--base=<ref>` is rejected as an unknown option.

```sh
pnpm harness:comments
pnpm exec wolven-harness comments --base origin/main
```

The scan includes changed and untracked files that match the configured paths. Built-in comment syntax covers `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, and `.cjs`. Configure additional languages in `.wolven-harness.json`; files with no known syntax are skipped and counted in the summary.

### Comment rules

A new comment should explain why, a hazard, or an invariant. Use a `why:`, `hazard:`, or `invariant:` tag and keep the block to four lines or fewer. A JSDoc block directly above a declaration can instead document that declaration. The scanner also flags change narration, citations that cannot be resolved from the repository, reviewer-directed claims, comments that restate control flow, planning identifiers, and `@todo` deferrals.

Tool directives such as `eslint`, `biome-ignore`, and `@ts-ignore`, plus generated-file banners, are not treated as ordinary comments.

Findings include a root-relative path, line, kind, and explanation. A clean run prints `comments: ok (0 findings)` and exits 0, or `comments: ok (0 findings, N skipped: no syntax)` when in-scope files lack configured comment syntax. With findings, the summary is `comments: N finding(s)`, with ` (N skipped: no syntax)` appended when applicable. Any finding, malformed comments config, missing Git repository, unknown option, or unresolved base exits 1.

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
| `gitHost` | Yes | `gh` or `bit`; the `--git-host` flag overrides it. Every command that reads the file requires it. |
| `runtimes` | Yes | Non-empty array of `claude`, `codex`, or `cursor`; `--runtimes` overrides it. Every command that reads the file requires it. |
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
- **Missing `--git-host` or `--runtimes`** — add the missing values to the setup command in your script, for example `pnpm exec wolven-harness setup --git-host=gh --runtimes=claude,codex`, or run setup in a terminal to answer its questions.
- **`harness-score` is missing** — install the version-specific command printed by setup before using `harness:score`.

Common check problems:

- **No default base for `comments`** — fetch or create `origin/main`/`main`, or pass `--base <ref>`.
- **An ADR claim fails** — create or correct the profile ADR under `docs/adrs/`; claims require a unique stable decision.
- **A legacy ADR warning remains** — use the `harness-init` skill to migrate the decision while preserving its meaning.

For setup workflow and first steps, see [Setup](./harness-init). For the installed skill choices, see [Skills](./skills).

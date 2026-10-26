---
description: CLI reference for setup, skills, doctor, validate, comments, flags, configuration, output, and exit codes.
---

# Commands

Install `@wolven-tech/harness` globally, then run `setup` from the top level of a Git repository or a folder outside every repository. This page starts with common examples and then gives the exact options and behavior for the five commands.

## Install and run

Install the CLI globally, so `wolven-harness` works from any folder:

```sh
npm install -g @wolven-tech/harness
yarn global add @wolven-tech/harness
pnpm add -g @wolven-tech/harness
```

Then run setup from the top level of a Git repository, or from a folder outside every repository:

```sh
wolven-harness setup --git-host gh --runtimes claude
```

`setup` runs at a Git top level or outside any repository. At a top level it scaffolds the harness; outside one it writes the core skills and selected runtime links, then points to `harness-init` to finish the install there. A repository subfolder is not a setup location. Ask your coding agent to run the `harness-init` skill next; see [Installation](./install).

Check the install at any time, and check the harness as you work:

```sh
wolven-harness validate
wolven-harness comments --base origin/main
wolven-harness doctor
```

`npx @wolven-tech/harness <command>` works without a global install; `setup` then names the global install command for the recorded package manager. From a source checkout, build first with `pnpm build`, then run `node /path/to/wolven-harness/dist/cli.js <command>`.

When `setup` adds the package scripts, the `harness:validate`, `harness:comments` and `harness:score` scripts run the same commands through the package manager the install recorded (`npm run harness:validate`, `yarn harness:validate`, `pnpm harness:validate`, or the bare binaries when there is no `package.json`).

## Command overview

| Command | What it does | Where to run it |
| --- | --- | --- |
| `setup` | Installs missing harness files, wires selected runtimes, records setup choices and adds missing package scripts. | A Git top level, or a folder outside every repository for the minimal install. |
| `skills` | Copies selected ship and discovery skills into runtime load paths without installing the harness. | Any directory; no Git repository required. |
| `doctor` | Checks a wired install and reports findings with stable codes. | The open folder for the install; use `--dir <path>` to check another folder. |
| `validate` | Checks documentation structure, ADR references, installed skills and rules, and harness paths. | Anywhere inside a Git repository. |
| `comments` | Checks newly added comment blocks against the repository's comment rules. | Anywhere inside a Git repository. |

```text
wolven-harness <command> [options]
wolven-harness --help
wolven-harness --version
```

Use `wolven-harness --help` to see the commands and options, or `wolven-harness --version` to check which version is installed. Running the CLI without a command also displays help. If you mistype a command, the CLI shows an error and the command list.

The commands, flags, exit codes, finding codes, summary lines, and configuration schema documented on this page form the public CLI contract.

## `doctor`

```text
wolven-harness doctor [--dir <path>]
```

`doctor` is read-only. It checks the install from the current folder, or from the folder named by `--dir`, and prints each finding with its code. Error findings include a `fix:` line; warnings do not. It exits 1 when any error is present and 0 when only warnings or no findings remain. `doctor: ok` is the clean summary. The `harness-doctor` core skill explains the findings and proposes repairs one at a time, after asking.

| Code | Level | Meaning |
| --- | --- | --- |
| `doctor-config` | error | The install configuration is missing or invalid. |
| `doctor-entry` | error | A runtime cannot reach its harness entry instructions. |
| `doctor-rules` | error | A runtime's rules wiring is missing or incomplete. |
| `doctor-rules-stale` | error | A copied or inline rules block differs from the current rules. |
| `doctor-skills` | error | A runtime cannot reach its installed skills. |
| `doctor-docs` | error | The harness documentation is missing, uncommitted, or ignored. |
| `doctor-qmd` | error | The local search tool or its reachable index is missing or invalid. |
| `doctor-code-repo` | error | Harness files are inside the configured code repository. |
| `doctor-not-global` | warning | `wolven-harness` is not available on `PATH`; the message gives the global install form when known. |
| `doctor-version-behind` | warning | The recorded package version is older than the running CLI. |
| `doctor-drift-edited` | warning | An installed file differs from every recognized template form. |
| `doctor-drift-stale` | warning | An installed file matches an earlier recognized template form. |
| `doctor-drift-missing` | warning | An expected installed file is missing. |

For a linked layout, `.wolven-harness.json` in the open folder may set `"layout": "linked"` and `"harnessHome"` to the path of the harness home relative to that folder. The linked harness home holds the shared skills, rules, and search index; runtime links in the open folder make them reachable. The config also supports `"layout": "home"` when the harness lives in the open folder. `doctor` reads wiring from the open folder and follows its links.

## `setup`

```text
wolven-harness setup [options]
```

`setup` adds the harness files that are missing, wires the runtimes you choose, and adds check scripts to an existing `package.json` when those scripts are absent.

**Modes.** At a Git top level it scaffolds the full harness: the `.agents/` skills and rules tree, the document folders, `WOLVEN.md`, the local search index, `.harness-score.json`, each runtime's wiring, and the `harness:validate`, `harness:comments` and `harness:score` scripts in an existing `package.json`. Outside a Git top level, from a folder outside any repository, it writes only the core skills under `.agents/skills/`, each selected runtime's skills wiring, and `.wolven-harness.json`, then exits 0 and points at `harness-init`. A repository subfolder exits 1 without writing files. A minimal install writes no `docs/`, `WOLVEN.md`, `.agents/rules/`, `.qmd/`, `.harness-score.json` or `package.json` scripts.

You can safely run setup again: it leaves existing files and scripts in place. It never creates or edits `AGENTS.md`, installs dependencies, or commits changes. After a successful run, `.wolven-harness.json` records your choices and the installed package version.

### Options

| Option | Values | Behavior |
| --- | --- | --- |
| `--git-host <value>` | `gh`, `bit` | Records GitHub or Bitbucket as the repo's host. |
| `--runtimes <list>` | Comma-separated `claude`, `codex`, `cursor`, `opencode`, `amp`, `copilot`, `gemini`, `kiro`, `antigravity` | Selects runtimes to wire. Entries are trimmed and duplicates removed. At least one runtime is required. |
| `--skills <list>` | Comma-separated `ship`, `discovery`, or `none` alone | Chooses optional skill sets. Core skills are always installed. `none` means core only on a fresh setup. |
| `--package-manager <value>` | `npm`, `yarn`, `pnpm`, `none` | Overrides package-manager detection for the printed commands and the recorded value. |
| `--verbose` | No value | Lists every file setup created and kept. |
| `--debug` | No value | Shows a step-by-step trace while setup runs. |

Value options accept either `--option value` or `--option=value`. For example:

```sh
wolven-harness setup --git-host=gh --runtimes=claude,codex --package-manager=pnpm --skills=ship
```

### Prompts, detection, and defaults

Setup uses each value from its command-line flag first, then from `.wolven-harness.json`, and finally asks you when run in an interactive terminal. For missing repository settings, setup detects GitHub or Bitbucket from `origin`. It detects runtimes from the repository (`.claude`, `CLAUDE.md`, `.codex`, `.cursor`, `.cursorrules`, `opencode.json`, `.github/copilot-instructions.md`, `GEMINI.md`, `.gemini`, `.kiro`) and from the machine's runtime folders under `HOME`, `XDG_CONFIG_HOME` and `CODEX_HOME`; detected values are preselected when it asks.

The package manager resolves in this order: `--package-manager`, the value recorded in `.wolven-harness.json`, `package.json`'s `packageManager` field, the single lockfile present (`pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`), then `npm` when a `package.json` exists with no other signal, or `none` when there is no `package.json`. With several lockfiles, setup asks once in a terminal; without a terminal it exits 1 and names `--package-manager`.

When setup runs in a script or CI, include any missing required `--git-host` and `--runtimes` values in the command. The optional skill sets default to `ship` when no choice has been recorded. In an interactive setup, `ship` is preselected, and you can choose no optional sets.

If a flag value is invalid, setup lets you correct it when asking questions in a terminal; in a script or CI, correct the command and run it again. A flag with no value or an unknown option exits 1 before any prompt, even in a terminal. `--skills none` cannot be combined with another skill set. Re-running setup never removes skill files or optional sets already present; choosing `none` does not uninstall anything.

For the same setup trace in a script or CI, set `WOLVEN_HARNESS_DEBUG=1`.

### What setup writes

At a Git top level:

- The `.agents/` skills and rules tree, documentation folders, and `WOLVEN.md`.
- `.qmd/index.yml` and the local index ignore file.
- `.harness-score.json`, the starter configuration for harness scoring.
- `.wolven-harness.json`, with the resolved Git host, runtimes, selected skill sets, package manager and package version.
- Missing `harness:validate`, `harness:comments`, and `harness:score` scripts in an existing `package.json`.
- Each selected runtime's skills wiring and native rules wiring, created only if missing. See [Agent runtimes](./runtimes) for the paths.

Outside any Git repository:

- The core skills under `.agents/skills/`.
- Each selected runtime's skills wiring.
- `.wolven-harness.json`.

Existing files and scripts are preserved. Setup does not install `harness-score`; when it is needed but absent, setup prints the command to add it, using the recorded package manager. If there is no `package.json`, no scripts are added.

## `skills`

```text
wolven-harness skills [--runtimes <claude,codex,cursor>] [--scope <project|global>] [--skills <name|ship|discovery>]
```

Copies chosen ship and discovery skill folders into the directories Claude, Codex, and Cursor already read. It does not run `setup`. Core skills are installed by `setup`, and `skills --runtimes` keeps its three runtimes even though `setup --runtimes` accepts nine.

Asks for the runtimes (`claude`, `codex`, `cursor`), the scope (`project`, `global`, or `project,global`), and the skills, or takes `--runtimes`, `--scope`, and `--skills`. Those flags are required when running in a script or CI without an interactive terminal. `--skills` takes `ship`, `discovery`, or a skill in those sets, for example `--skills ship` or `--skills create-prd`.

`project` writes under the current directory. `global` writes under your home directory. Cursor and Codex share `.agents/skills/<skill>/`. Claude uses `.claude/skills/<skill>/`. Choosing Cursor and Codex writes each skill once. It does not need a Git repository, and it does not write harness config, rules, or package scripts.

A folder that already matches the package copy is left in place. When a chosen folder differs, a terminal asks before replacing it. Without a terminal, that folder stays and a missing chosen skill is still added. Cancelling a prompt writes nothing and exits 1. A core skill name writes nothing and exits 1.

## `validate`

```text
wolven-harness validate [--verbose]
```

Run validation from anywhere inside a Git repository. It scans tracked files, except paths excluded by valid `ignore` entries, and reports findings from four areas:

1. **Document profile:** ADR naming and layout; required frontmatter; document type, slug folder, and status; required main documents; deprecated ADR successors.
2. **ADR claims:** References such as `ADR-006` must resolve to one valid, stable ADR. A claim that points to a draft, deprecated, invalid, missing, duplicate, or slug-mismatched decision fails.
3. **Legacy decisions:** ADRs outside `docs/adrs/` and decision folders the harness cannot interpret are reported as warnings so they can be migrated.
4. **Harness structure:** Skill frontmatter, cited rules, the `AGENTS.md` harness section marker, and whether required harness paths are hidden by Git ignore rules.

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
| `skill-stub-open`, `step0-pending` | Warning | A skill stub still needs definition, or `AGENTS.md` lacks the harness section start marker. |
| `adr-unrecognized`, `legacy-adr`, `adr-status-mismatch` | Warning | A decision record needs migration, uses an unrecognized folder, or its body contradicts its stable status. |
| `legacy-claim` | Warning, verbose only | A claim resolves only to a legacy ADR outside `docs/adrs/`. |

Successful output ends with `validate: ok`. A failing run ends with an error and warning count and exits 1. Validation exits 1 for an invalid config or when run outside a Git repository; it exits 0 when there are warnings but no errors.

## `comments`

```text
wolven-harness comments [--base <ref>]
```

This command checks only comment blocks added since a base revision; it does not lint existing comments. Without `--base`, it uses the merge-base with the first available ref in this order: `origin/HEAD`, `origin/main`, then `main`. If none can be resolved, pass a base explicitly. `--base` takes its value as a separate argument; `--base=<ref>` is rejected as an unknown option.

```sh
wolven-harness comments --base origin/main
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

Setup stores its choices in `.wolven-harness.json` in the folder it ran in. The file uses schema version `1`. `setup` writes the keys below and preserves other keys it does not own.

```json
{
  "version": 1,
  "gitHost": "gh",
  "runtimes": ["claude", "codex"],
  "skillSets": ["ship"],
  "packageVersion": "0.4.0",
  "packageManager": "pnpm",
  "layout": "home",
  "codeRepo": "../client",
  "commitConvention": { "style": "conventional" },
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
| `runtimes` | Yes | Non-empty array of runtime ids: `claude`, `codex`, `cursor`, `opencode`, `amp`, `copilot`, `gemini`, `kiro`, `antigravity`. `--runtimes` overrides it. |
| `skillSets` | No | Optional `ship` and/or `discovery` sets; core is always installed. |
| `packageVersion` | No | Refreshed to the running package version by setup. |
| `packageManager` | No | `npm`, `yarn`, `pnpm` or `none`; the manager whose command forms the CLI prints. `--package-manager` overrides it. |
| `layout` | No | `"home"` when the harness lives in the open folder, or `"linked"` when it lives at `harnessHome`. |
| `harnessHome` | For `linked` | Path to the harness home relative to this config file; required for `"layout": "linked"`, forbidden otherwise. |
| `codeRepo` | No | The one code repository the install serves, as a path relative to the config file's folder. |
| `commitConvention` | No | `{ "style": "conventional" }`, or `{ "style": "pattern", "pattern": "<regex>", "example": "<subject>" }` where the pattern compiles as a JavaScript regular expression. |
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

- **Missing `--git-host` or `--runtimes`** — add the missing values to the setup command in your script, for example `wolven-harness setup --git-host=gh --runtimes=claude,codex`, or run setup in a terminal to answer its questions.
- **Several lockfiles and no terminal** — pass `--package-manager npm`, `--package-manager yarn` or `--package-manager pnpm`.
- **`harness-score` is missing** — install the version-specific command printed by setup before using `harness:score`.

Common check problems:

- **No default base for `comments`** — fetch or create `origin/main`/`main`, or pass `--base <ref>`.
- **An ADR claim fails** — create or correct the profile ADR under `docs/adrs/`; claims require a unique stable decision.
- **A legacy ADR warning remains** — use the `harness-init` skill to migrate the decision while preserving its meaning.
- **`step0-pending`** — `AGENTS.md` has no `<!-- wolven-harness:start -->` marker; ask your agent to run `harness-init` step 0.

For setup workflow and first steps, see [Installation](./install). For the installed skill choices, see [Skills](./skills).

---
description: Reference for setup, validate, and comments — flags and failure modes.
---

# Commands

`wolven-harness --help` (or `-h`) prints the command list. Run `setup` at the git top level; `validate` and `comments` work from anywhere inside the repo. `setup` is the only one that writes. With a local install, prefix each command below with `pnpm exec`.

## `wolven-harness setup`

Runs at the git top level and fails anywhere else. Asks for the git host (`gh` or `bit`) and the runtimes to wire (`claude`, `codex`, `cursor`), or takes `--git-host` and `--runtimes`. Those two flags are required when stdout is not a TTY.

Creates missing harness files and runtime links, preserving existing copies. Lists what it created and skipped. It never creates or edits your `AGENTS.md`, and it never commits.

It also adds missing `harness:validate` and `harness:comments` scripts to an existing `package.json`, and saves setup choices and refreshes `packageVersion` in `.wolven-harness.json` on each run. It warns when the package is missing from `devDependencies`.

Add a skill set later with `--skills` (for example `--skills ship,discovery`). Re-runs never remove one.

## `wolven-harness validate`

Run it from anywhere inside the repo. Four groups: the writing profile, ADR claims, legacy ADRs, and the skills-and-rules spine. References such as `ADR-NNN` in tracked, non-ignored files must resolve to exactly one stable decision record. ADR files, dependencies, and archived paths are excluded from the scan. Legacy records receive migration warnings; missing or duplicate targets fail validation.

Prints a claim tally and `validate: ok`, or exits 1 with diagnostics when an error is found. `--verbose` lists each legacy reference.

## `wolven-harness comments`

Run it from anywhere inside the repo. It judges the comment lines a change added since a base ref — by default the merge-base with `origin/HEAD`, then `origin/main`, then `main`. `--base <ref>` overrides that base.

Ends with `comments: ok (0 findings)`, or prints one line per finding and exits 1.

## Package script aliases

When the script names are absent, `setup` adds:

| Run with pnpm | Calls |
| --- | --- |
| `pnpm harness:validate` | `wolven-harness validate` |
| `pnpm harness:comments` | `wolven-harness comments` |

Existing scripts with those names are left unchanged, so check their definitions before assuming they are aliases. Without a `package.json`, no scripts are added; use `pnpm exec wolven-harness validate` or `pnpm exec wolven-harness comments` when the package is installed locally.

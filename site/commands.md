---
description: Reference for setup, validate, and comments — flags and failure modes.
---

# Commands

`wolven-harness --help` (or `-h`) prints the command list. Run the commands at, or anywhere inside, the repository you are setting up. `setup` is the only one that writes. The GitHub README is the short how-to-run.

## `wolven-harness setup`

Runs at the git top level and fails anywhere else. Asks for the git host (`gh` or `bit`) and the runtimes to wire (`claude`, `codex`, `cursor`), or takes `--git-host` and `--runtimes`. Those two flags are required when stdout is not a TTY.

Creates only the paths that are missing, leaves every existing path byte-identical, then lists what it created and what it skipped. It never creates or edits your `AGENTS.md`, and it never commits.

It warns when the package is missing from `devDependencies`, and records `packageVersion` in `.wolven-harness.json`.

Add a skill set later with `--skills` (for example `--skills ship,discovery`). Re-runs never remove one.

## `wolven-harness validate`

Run it from anywhere inside the repo. Four groups: the writing profile, ADR claims, legacy ADRs, and the skills-and-rules spine. Every `ADR-NNN` reference in a tracked file has to resolve to exactly one stable decision record.

Prints a claim tally and `validate: ok`, or exits 1 naming the file and line. It exits 1 when any error is found. `--verbose` lists each legacy reference.

## `wolven-harness comments`

Run it from anywhere inside the repo. It judges the comment lines a change added since a base ref — by default the merge-base with `origin/HEAD`, then `origin/main`, then `main`. `--base <ref>` overrides that base.

Ends with `comments: ok (0 findings)`, or prints one line per finding and exits 1.

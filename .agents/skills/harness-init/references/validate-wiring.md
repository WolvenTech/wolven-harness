# Validate wiring

Covers the one setup question step 6 asks before the note's final sections:
how `harness:validate` gets run. It is a single question, asked once, with the
recommended option first.

## Detect first

Read what already exists before asking, and use it to frame the options:

- CI config: `.github/workflows/*.yml`, or `bitbucket-pipelines.yml`. Which one
  applies follows `gitHost` in `.wolven-harness.json` (`gh` is GitHub Actions,
  `bit` is Bitbucket Pipelines); mention any other CI file the repo has.
- `package.json` scripts: an existing `validate` or `test` script, by name and
  current value.
- The `packageManager` recorded in `.wolven-harness.json`. It picks one row in
  each table below, so read it before writing anything.

## The question

The question is "How should we check the harness?". Ask in plain language how `harness:validate` should run, naming the evidence
found and what each choice means in practice:

1. **On every pull request** (a CI job) — run validation automatically on every
   pull request so doc formatting issues or broken ADR references are caught
   before merge. Recommended when a CI config exists or the repo is hosted on
   a platform that provides one.
2. **With your existing checks** (chained into the existing script) — run validation whenever the
   existing `validate` or `test` script runs; name the script and current
   command. Offered when a `validate` or `test` script exists.
3. **Only when I run it** (local only) — run validation by hand only when invoked; nothing is
   added to CI or package scripts.

List (b) only when there is a script to chain, and put whichever option the
evidence supports best first. Lead with what the choice does in everyday
workflow; the option letters (a, b, c) are supporting references, never the
headline of the question.

## What each answer does

Nothing is written without a yes: show the diff, wait for the Human's yes, then
write, then run `harness:validate`.

- **(a) A CI job on pull requests.** Add a minimal job or step that runs on
  pull requests. Hosted runners may have an older Node, so the job sets up
  Node ≥ 22 before the install and validate steps. When the repo already has a
  workflow or pipeline, reuse its setup steps and extend the file rather than
  replacing it. On GitHub Actions, give the job `contents: read` permissions
  and run `actions/checkout` first. Write the row for the recorded
  `packageManager`; the `none` row is the repo with no `package.json`:

  | `packageManager` | GitHub Actions | Bitbucket Pipelines |
  | --- | --- | --- |
  | `npm` | `actions/setup-node` with Node ≥ 22, then `npm ci` and `npm run harness:validate` | image with Node ≥ 22, then `npm ci` and `npm run harness:validate` |
  | `yarn` | `actions/setup-node` with Node ≥ 22, `corepack enable`, then `yarn install --frozen-lockfile` (or `yarn install --immutable` when the repo pins Yarn 2+) and `yarn harness:validate` | image with Node ≥ 22, `corepack enable`, then the same install and `yarn harness:validate` |
  | `pnpm` | `pnpm/action-setup` with the version from `packageManager`, `actions/setup-node` with Node ≥ 22 and `cache: pnpm`, then `pnpm install --frozen-lockfile` and `pnpm harness:validate` | image with Node ≥ 22, `corepack enable`, then `pnpm install --frozen-lockfile` and `pnpm harness:validate` |
  | `none` | `actions/setup-node` with Node ≥ 22 and no install step, then the globally installed `wolven-harness validate` | image with Node ≥ 22, no install step, then the globally installed `wolven-harness validate` |

- **(b) Chained into the existing script.** Append `&& ` and the run-script
  form for the recorded `packageManager` to the named script's value:

  | `packageManager` | Run-script form |
  | --- | --- |
  | `npm` | `npm run harness:validate` |
  | `yarn` | `yarn harness:validate` |
  | `pnpm` | `pnpm harness:validate` |

  With no `package.json` there is no script to chain, so (b) is not offered.
- **(c)** Write nothing; record the choice.

Record the answer under "Validate wiring" in the session note, with what was
written or "nothing written" for (c) or a declined diff.

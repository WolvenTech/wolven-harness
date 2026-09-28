# wolven-harness

AI-assisted dev harness: scaffolds an `AGENTS.md`-based `.agents/` skills tree, wires supported runtimes, and validates architecture-decision claims against a lightweight ADR profile.

## Install

Requires Node 22 or later and git.

The package is public on npmjs.org as `@wolven/harness`. Install is two commands:

```sh
pnpm add -D @wolven/harness
pnpm exec wolven-harness init
```

`init` warns when the package is missing from `devDependencies`, and records its own version as `packageVersion` in `.wolven-harness.json` — the version of the `init` that ran, which is the installed one when you run it with `pnpm exec`.

## Usage

### `wolven-harness init`

Run it at the git top-level of the target repo. It asks for the git host (`gh` or `bit`) and the runtimes to wire (`claude`, `codex`, `cursor`), or takes them as flags — `--git-host gh --runtimes claude,codex` — which are required when stdin is not a TTY. The answers are saved to `.wolven-harness.json`.

`init` only creates paths that are missing and never edits an existing file; it lists what it created and what it skipped. It writes `WOLVEN.md`, `docs/` (writing profile, ADR folder with a starter ADR, specs, notes, deferrals), `.qmd/index.yml`, `.agents/` (skills, rules, hooks — including the `comments.md` standing rule), the runtime wiring below, and `harness:validate` and `harness:comments` scripts in `package.json`. It never creates or edits `AGENTS.md`: see [Setting up with harness-init](#setting-up-with-harness-init) below.

### `wolven-harness validate`

Run it from anywhere inside the repo; it resolves the git top-level and exits 1 outside a git work tree. It checks:

- **Writing profile** — every `docs/{adrs,specs,notes,deferrals}/*.md` has `type`, `title`, `description`, and `status` (`draft`, `stable`, or `deprecated`), a `type` matching its folder, and a kebab-case name; ADRs are named `adr-NNN-<slug>.md` and name `superseded_by` when deprecated. See `docs/WRITING-PROFILE.md`.
- **ADR claims** — any `ADR-NNN` or `adr-NNN-<slug>` reference in a tracked file must resolve to exactly one `stable` ADR under `docs/adrs/`. Missing, duplicate, draft, deprecated, or mismatched references fail with file and line. New ADRs count once git tracks them (staging is enough).
- **Legacy ADRs** — ADR-like files outside `docs/adrs/` (such as `adrs/adr-002.md`) put the repo in legacy mode: references to them warn instead of failing, with one line per legacy ADR until it is migrated through `harness-init`. A reference to an ADR that exists nowhere always fails.
- **Spine** — every skill under `.agents/skills/` has `name` and `description`, every `.agents/rules/*.md` cited in `WOLVEN.md` or `AGENTS.md` exists, no harness path (`.agents/skills`, `.agents/rules`, `docs`, `.claude/skills`, and the like) is excluded by an ignore rule — an excluded one would exist on your machine only, so it fails naming the rule — and a warning remains while `WOLVEN.md` is not yet folded into `AGENTS.md`.

`--verbose` also lists each legacy reference by file and line. The command exits 1 when any error is found.

To skip vendored or generated trees, add `"ignore": ["<dir>/**"]` to `.wolven-harness.json`. Only whole directories can be ignored, and never `docs/` or `.agents/`.

### `wolven-harness comments`

Run it from anywhere inside the repo; it resolves the git top-level and judges lines added since a base ref (default: the merge-base with `origin/HEAD`, falling back to `origin/main` then `main`) plus untracked files, against the style in `.agents/rules/comments.md`. An added comment must be a `why:`, `hazard:`, or `invariant:` line (four lines or fewer) or a `/** */` block directly above a declaration, and must not narrate the change, cite something outside the repository, or defer work with `@todo`.

It prints one `<file>:<line>: [<kind>] <message>` line per finding and ends with `comments: ok (0 findings)` or `comments: <n> finding(s)`, exiting 1 on any finding. `--base <ref>` overrides the base. `init` installs it as the `harness:comments` script.

## Setting up with harness-init

`init` never creates or edits `AGENTS.md` on its own. Once it finishes, ask your agent to run the `harness-init` skill — `init`'s own closing line points you here, and so does `harness:validate` for as long as entry integration hasn't run yet.

The skill walks the repo through seven steps, and you steer every write:

- **Step 0 — entry integration.** Folds `WOLVEN.md` into `AGENTS.md` in one of three modes — full, light, or mention-only — after checking what `AGENTS.md` already holds, any overlapping router or rule, whether `CLAUDE.md` imports `AGENTS.md`, whether an ignore rule keeps a harness path from other clones (it proposes re-include rules that share the harness paths and keep the rest of those folders ignored), and whether `docs/adrs/`, `docs/prds/`, `docs/specs/`, `docs/notes/`, or `docs/deferrals/` already hold content the writing profile would fail.
- **Step 1 — legacy ADR migration**, offered only when `harness:validate` reports a legacy ADR. Migrates each one into `docs/adrs/`, keeping its number, mapping its status, and fixing the links the move touches. This step is done only once `harness:validate` exits 0 with no legacy warnings left — any claim that starts failing along the way gets worked through with you first: repointed, reworded, or turned into a new decision.
- **Steps 2–4 — discovery, research, and suggestions.** Reads what the repo already shows, researches a decided tool on the open web only with your OK and capped, and suggests two to four skills worth adding.
- **Step 5 — stubs.** Writes the skills you pick as ask-only stubs. `harness:validate` flags each open one with a `skill-stub-open` warning until you write its body and remove the stub marker.
- **Step 6 — session note.** Closes the run with a note under `docs/notes/` recording what happened and what is still yours to define.

Before writing anything, the agent shows you the diff and waits for your choice, and turns any ambiguity into one question at a time. The run also offers three commits — entry, migration, setup — each only once `harness:validate` passes, and only if you say yes.

## Doc layout

`init` creates `docs/{prds,specs,notes,deferrals}/`, each holding one
slug folder per document: `docs/<folder>/<slug>/<slug>-<type>.md` (folder →
type: `prds`→`prd`, `specs`→`spec`, `notes`→`note`, `deferrals`→`deferral`).
`docs/specs/<slug>/` may also hold `<slug>-plan.md`. `docs/adrs/`
is the exception and stays flat: `docs/adrs/adr-NNN-<slug>.md`. See
`docs/WRITING-PROFILE.md` for the full type map and rules.

## Runtimes

`init --runtimes claude,codex,cursor` wires skill discovery per runtime, based on each runtime's own docs:

- **Claude Code** ([docs](https://code.claude.com/docs/en/skills)) reads only `.claude/skills/`. `init` creates `.claude/skills` as a directory symlink to `../.agents/skills`, and writes `CLAUDE.md` containing `@AGENTS.md` — both only when absent.
- **Codex** ([docs](https://learn.chatgpt.com/docs/build-skills)) reads `.agents/skills/` natively (`$CWD/.agents/skills` up to the repo root), so `init` writes nothing for it.
- **Cursor** ([docs](https://cursor.com/docs/context/skills)) also reads `.agents/skills/` natively, so `init` writes nothing for it either. Cursor additionally reads the legacy `.claude/skills/` path, so running `init --runtimes claude,cursor` together can list a skill twice for Cursor — accepted.

v0 supports macOS and Linux only: runtime wiring requires filesystem symlinks, and Windows symlinks need Developer Mode or admin rights, which `init` does not attempt to work around.

## Release

This section is for maintainers of this repo.

PR titles must be Conventional Commits; a PR-title check enforces it. Every pull request also runs the package gate — build, test, validate, comments — in CI.

PRs are squash-merged, with the PR title becoming the commit message on `main`.

release-please watches `main` and keeps a release PR open with the version bump and a `CHANGELOG.md` entry drawn from those commits.

Before 1.0, a `feat` commit or a breaking change bumps the minor version, and a `fix` bumps the patch.

Close and reopen the release PR before merging it: it was opened by `GITHUB_TOKEN`, which starts no workflows, so the required checks only run after the reopen.

Merging the release PR tags `vX.Y.Z`, creates the GitHub Release, and the release job publishes to npmjs through OIDC trusted publishing — no stored token, and every published version carries a provenance attestation. Only the job that publishes can mint the token npm trusts; it installs no project dependencies.

If the publish fails after the tag exists, fix the cause and run the `release` workflow by hand with that tag (Actions → release → Run workflow). A version that did publish can't be republished; ship the fix as the next patch.

npm-side setup, done once by an owner of the `wolven` npm org with 2FA on:

1. A trusted publisher can only be attached to a package that already exists, so the first version on npmjs is a manual prerelease seed under a non-`latest` dist-tag, deprecated once the release job publishes.
2. On the package's settings page on npmjs, add a trusted publisher: GitHub Actions, organization `WolvenTech`, repository `wolven-harness`, workflow `release.yml`, no environment.
3. On the same page, set publishing access to "Require two-factor authentication and disallow tokens".

## Contributing

Clone the repo, install, build, and test:

```sh
git clone https://github.com/WolvenTech/wolven-harness.git
cd wolven-harness
pnpm install
pnpm build
pnpm test
```

Run the CLI from the clone inside a target repo:

```sh
cd /path/to/target-repo
node /path/to/wolven-harness/dist/cli.js init
```

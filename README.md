# wolven-harness

AI-assisted dev harness: scaffolds an `AGENTS.md`-based `.agents/` skills tree, wires supported runtimes, and validates architecture-decision claims against a lightweight ADR profile.

## Install

Requires Node 22 or later and git. The package is not published yet; until it is, build it from a clone and run the CLI directly:

```sh
git clone https://github.com/WolvenTech/wolven-harness.git
cd wolven-harness && pnpm install && pnpm build
# then, inside the target repo:
node /path/to/wolven-harness/dist/cli.js init
```

## Usage

### `wolven-harness init`

Run it at the git top-level of the target repo. It asks for the git host (`gh` or `bit`) and the runtimes to wire (`claude`, `codex`, `cursor`), or takes them as flags — `--git-host gh --runtimes claude,codex` — which are required when stdin is not a TTY. The answers are saved to `.wolven-harness.json`.

`init` only creates paths that are missing and never edits an existing file; it lists what it created and what it skipped. It writes `WOLVEN.md`, `docs/` (writing profile, ADR folder with a starter ADR, specs, notes, deferrals), `.qmd/index.yml`, `.agents/` (skills, rules, hooks), the runtime wiring below, and a `harness:validate` script in `package.json`. It never creates or edits `AGENTS.md`: run the `harness-init` skill next, whose first step folds `WOLVEN.md` into `AGENTS.md`.

### `wolven-harness validate`

Run it from anywhere inside the repo; it resolves the git top-level and exits 1 outside a git work tree. It checks:

- **Writing profile** — every `docs/{adrs,specs,notes,deferrals}/*.md` has `type`, `title`, `description`, and `status` (`draft`, `stable`, or `deprecated`), a `type` matching its folder, and a kebab-case name; ADRs are named `adr-NNN-<slug>.md` and name `superseded_by` when deprecated. See `docs/WRITING-PROFILE.md`.
- **ADR claims** — any `ADR-NNN` or `adr-NNN-<slug>` reference in a tracked file must resolve to exactly one `stable` ADR under `docs/adrs/`. Missing, duplicate, draft, deprecated, or mismatched references fail with file and line. New ADRs count once git tracks them (staging is enough).
- **Legacy ADRs** — ADR-like files outside `docs/adrs/` (such as `adrs/adr-002.md`) put the repo in legacy mode: references to them warn instead of failing, with one line per legacy ADR until it is migrated through `harness-init`. A reference to an ADR that exists nowhere always fails.
- **Spine** — every skill under `.agents/skills/` has `name` and `description`, every `.agents/rules/*.md` cited in `WOLVEN.md` or `AGENTS.md` exists, and a warning remains while `WOLVEN.md` is not yet folded into `AGENTS.md`.

`--verbose` also lists each legacy reference by file and line. The command exits 1 when any error is found.

To skip vendored or generated trees, add `"ignore": ["<dir>/**"]` to `.wolven-harness.json`. Only whole directories can be ignored, and never `docs/` or `.agents/`.

## Runtimes

`init --runtimes claude,codex,cursor` wires skill discovery per runtime, based on each runtime's own docs:

- **Claude Code** ([docs](https://code.claude.com/docs/en/skills)) reads only `.claude/skills/`. `init` creates `.claude/skills` as a directory symlink to `../.agents/skills`, and writes `CLAUDE.md` containing `@AGENTS.md` — both only when absent.
- **Codex** ([docs](https://learn.chatgpt.com/docs/build-skills)) reads `.agents/skills/` natively (`$CWD/.agents/skills` up to the repo root), so `init` writes nothing for it.
- **Cursor** ([docs](https://cursor.com/docs/context/skills)) also reads `.agents/skills/` natively, so `init` writes nothing for it either. Cursor additionally reads the legacy `.claude/skills/` path, so running `init --runtimes claude,cursor` together can list a skill twice for Cursor — accepted.

v0 supports macOS and Linux only: runtime wiring requires filesystem symlinks, and Windows symlinks need Developer Mode or admin rights, which `init` does not attempt to work around.

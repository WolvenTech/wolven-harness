# wolven-harness

AI-assisted dev harness: scaffolds an `AGENTS.md`-based `.agents/` skills tree, wires supported runtimes, and validates architecture-decision claims against a lightweight ADR profile.

## Install

_TODO (spec C — package publish)._

## Usage

### `wolven-harness init`

_TODO — scaffolds `WOLVEN.md`, the `.agents/` source tree, and wires supported runtimes at the current git repository's top level._

### `wolven-harness validate`

_TODO — checks the repo's writing profile and architecture-decision claims._

## Runtimes

`init --runtimes claude,codex,cursor` wires skill discovery per runtime, based on each runtime's own docs:

- **Claude Code** ([docs](https://code.claude.com/docs/en/skills)) reads only `.claude/skills/`. `init` creates `.claude/skills` as a directory symlink to `../.agents/skills`, and writes `CLAUDE.md` containing `@AGENTS.md` — both only when absent.
- **Codex** ([docs](https://learn.chatgpt.com/docs/build-skills)) reads `.agents/skills/` natively (`$CWD/.agents/skills` up to the repo root), so `init` writes nothing for it.
- **Cursor** ([docs](https://cursor.com/docs/context/skills)) also reads `.agents/skills/` natively, so `init` writes nothing for it either. Cursor additionally reads the legacy `.claude/skills/` path, so running `init --runtimes claude,cursor` together can list a skill twice for Cursor — accepted.

v0 supports macOS and Linux only: runtime wiring requires filesystem symlinks, and Windows symlinks need Developer Mode or admin rights, which `init` does not attempt to work around.

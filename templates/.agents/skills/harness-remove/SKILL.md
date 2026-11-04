---
name: harness-remove
description: Guides thorough removal of remaining harness edits and configuration while preserving docs/
---

# Harness Remove

Guides thorough removal of remaining harness edits and configuration across the
project and local landscape while strictly preserving `docs/`. Ask-only: nothing
else in this package invokes it; it runs only on a direct ask from the Human.

**Input:** an explicit ask from the Human to inspect and clean up remaining
harness traces after CLI uninstall (or to perform a guided deep cleanup).
**Preserves:** all authored documentation under `docs/` (`docs/adrs/`,
`docs/prds/`, `docs/specs/`, `docs/notes/`, `docs/deferrals/`, `docs/maps/`, and
`docs/WRITING-PROFILE.md`), byte-identical.
**Closing action:** offers to self-delete `harness-remove`'s own skill folder
once cleanup is complete.

## Hard gates

1. **Ask-only** — runs only on an explicit ask from the Human. Never invoked
   automatically or chained from other skills.
2. **Strictly preserve `docs/`** — never delete, modify, truncate, or move any
   file or directory under `docs/` (`adrs/`, `prds/`, `specs/`, `notes/`,
   `deferrals/`, `maps/`, or `WRITING-PROFILE.md`). All documentation is left
   byte-identical.
3. **Human approval before every write** — inspect first, show the exact
   proposed modification or diff to the Human, and apply edits ONLY upon
   explicit approval. Never edit or delete shared files silently.
4. **Declined changes stay untouched** — if the Human declines a proposed edit
   or deletion, leave that file untouched and record it in the closing summary.
   Never retry silently.
5. **No automated commits or git history rewriting** — never rewrite git
   history, and never run `git commit` or `git push` without an explicit
   request.
6. **Self-delete as final step** — offer to remove `harness-remove`'s own skill
   directory from the runtime load path as the final closing step after all
   inspections and cleanups are done.

## Workflow

### 1. Landscape inspection

Inspect the project and local landscape for remaining harness traces across
shared and intertwined files:

- **`package.json`**: Inspect `scripts` for harness commands (`harness:validate`,
  `harness:comments`, `harness:score`, `validate`, etc.) and any harness-related
  devDependencies.
- **`AGENTS.md`**: Inspect for harness-generated sections, tables (`## Wolven harness`,
  `### Skills`, `### Standing rules`, `### Harness score`, `### Architecture claims`,
  `### Validate`), or instruction blocks.
- **`.gitignore`**: Inspect for harness ignore entries (e.g. `.agents/`,
  `.wolven-harness/`, `.qmd/`, etc.).
- **CI workflows (`.github/workflows/*.yml`)**: Inspect workflow files for
  harness steps or jobs (e.g. running `wolven-harness`, `harness-score`, validation
  checks).
- **Git hooks and runtime config files**: Inspect hooks (e.g. `.husky/`,
  `.githooks/`, `simple-git-hooks`) or runtime instructions (`CLAUDE.md`,
  `CLAUDE.local.md`, `.cursorrules`, etc.) for harness references.
- **Residual harness directories or symlinks**: Check for any leftover
  `.wolven-harness/`, `.agents/`, `.qmd/`, or bootstrap symlinks that were
  skipped or added after uninstall.

### 2. Propose modifications one by one

For each identified file:

1. Show the Human the file path and a clear diff or description of what will be
   removed or changed.
2. Clearly explain why this edit removes harness leftovers while preserving the
   project's own code and configuration.
3. Ask the Human for explicit approval (`yes` / `no`).
4. If approved: apply the edit.
5. If declined: leave the file unchanged and record it as kept in the closing
   summary.

### 3. Verify `docs/` integrity

Confirm that all files under `docs/` remain present and completely untouched:

- Check that `docs/adrs/`, `docs/prds/`, `docs/specs/`, `docs/notes/`,
  `docs/deferrals/`, `docs/maps/`, and `docs/WRITING-PROFILE.md` have identical
  content and were not modified.
- If in a quiet install `.wolven-harness/docs/` was left intact, verify its
  presence and offer the Human the option to keep it in place or move it to
  `<repo>/docs/` if they wish.

### 4. Closing summary & self-cleanup

1. Report the summary of changes:
   - Files cleaned up (with approved edits).
   - Files kept unchanged (declined or skipped).
   - Preserved `docs/` confirmation.
2. Ask the Human for permission to delete `harness-remove`'s own skill folder:
   - State the path of the skill folder (e.g. `.agents/skills/harness-remove/`
     or `.claude/skills/harness-remove/`).
   - On approval, delete the `harness-remove` skill directory.
   - On decline, leave the skill directory in place.

## Anti-patterns

- Editing shared files (`package.json`, `AGENTS.md`, `.gitignore`, CI workflows)
  without showing the diff or obtaining Human approval.
- Modifying, moving, or deleting any file under `docs/`.
- Deleting the `harness-remove` skill folder before the Human approves or before
  finishing cleanup.
- Re-trying a declined modification silently.
- Running `git commit` or `git push` automatically.

---
name: harness-doctor
description: "Checks a wired harness install with `wolven-harness doctor`, then repairs it one Human-approved fix at a time: stale templates are refreshed with their manifest entry, edited files are shown and left alone, and a mention-only entry file goes through harness-init. Use when an install seems half-working, after an upgrade, or when the Human asks to check the harness."
---

# Harness Doctor

`wolven-harness doctor` answers one question: does this install work for every
runtime it says it wires? It reads `.wolven-harness.json`, then checks the entry
chain, the rules and the skills for each wired runtime, followed by `docs/`,
`qmd`, the code repository, the global CLI, version drift and template drift.
This skill turns those findings into repairs the Human approves, one at a time.

**Consult:** `harness-init` (step 0 for a mention-only entry file), `qmd`,
`code-commit` (when installed).

**In / out / handoff:** a wired install → findings read, approved fixes applied,
`doctor` rerun → a closing summary that keeps every declined check failing.

## Hard gates

1. **`doctor` is the only source of truth.** Run `wolven-harness doctor` and read
   every line: `<level> [<code>] <message>`, the `fix:` line under each error,
   and the last line (`doctor: ok` or the counts). Never guess a check's status.
2. **One fix at a time.** Propose exactly one fix, say what it changes and which
   code it clears, and apply it only after the Human says yes. Rerun `doctor`
   before proposing the next one.
3. **Declined stays failing.** A declined fix is not applied, retried silently,
   or reported as fixed. The closing summary lists it as still failing.
4. **Keep the layout.** Never move, rename or restructure a folder. A layout move
   is offered only when a check cannot pass otherwise, and only after the
   Human's explicit yes.
5. **Read-only checks stay read-only.** A finding is fixed in the install, never
   by weakening the check that reports it.
6. **No new commands.** Every fix is an existing command or a named skill. This
   skill invents no flags and no tools.

## Workflow

### 1. Read the report

Run `wolven-harness doctor`, adding `--dir <path>` when the install is not the
current folder. Keep the whole output; the last line is the baseline.

- An **error** means the install is broken for something the contract promises.
- A **warning** never changes the exit code, but it still gets a proposal.
- When `doctor-config` is the only finding, the folder has no usable
  `.wolven-harness.json`: run `wolven-harness setup` here (or fix the named
  key), then rerun. Repair nothing else until the config reads.

### 2. Propose one fix

Take the first finding and propose its fix in plain language, with the code as
supporting detail. Apply it after a yes, rerun `doctor`, then take the next
finding.

| Code | Level | The fix to propose |
| --- | --- | --- |
| `doctor-config` | error | Run `wolven-harness setup`, or fix the key the message names in `.wolven-harness.json`. |
| `doctor-entry` | error | A mention-only entry file goes through step 4 below. Any other broken chain: re-run `wolven-harness setup` to restore the runtime's import file, then `harness-init` when the harness section is still missing. |
| `doctor-rules` | error | Re-run `wolven-harness setup` to recreate the runtime's rules wiring (the `.claude/rules` link, generated rule files, `opencode.json`, `GEMINI.md`, or the inline block for Codex). `setup` never edits an existing file, so repairing one it left alone is a separate edit with the Human's yes. |
| `doctor-skills` | error | Re-run `wolven-harness setup` to restore the runtime's skills path and the missing skill folders. |
| `doctor-docs` | error | Commit the repository, or re-include `docs/` with rules appended after the broad ignore — never by deleting its ignore lines. |
| `doctor-qmd` | error | Install `qmd`, then run `qmd update` and `qmd embed`; or create the index where the finding says it is missing. |
| `doctor-code-repo` | error | Move the named harness path out of the code repository. This is the one case where a layout move is expected: propose the move, never do it silently. |
| `doctor-not-global` | warn | Offer the global install command that `setup` prints for this project's package manager. |
| `doctor-version-behind` | warn | Re-run `wolven-harness setup` to refresh `packageVersion`. |
| `doctor-drift-stale` | warn | Offer the template refresh in step 3. |
| `doctor-drift-edited` | warn | Show the diff in step 3 and change nothing. |
| `doctor-drift-missing` | warn | Offer to recreate the missing file from its template. |

### 3. Drift: stale, edited, missing

Drift comes from `.wolven-harness.manifest.json`, the record of the sha-256 of
every file `setup` wrote.

- **`doctor-drift-stale`** — the file still matches its manifest entry, but the
  shipped template changed. Offer to replace the file with the current template's
  content. On a yes: replace it, then update **that file's entry only** in
  `.wolven-harness.manifest.json` to the sha-256 of the new bytes, keep every
  other entry untouched, and rerun `doctor`.
- **`doctor-drift-edited`** — the file differs from its manifest entry, so the
  consumer edited it. Show the diff between the file and the current template,
  change nothing, and never merge the two. If the Human later asks to reset it,
  that is a separate, explicit ask; show the diff again before replacing.
- **`doctor-drift-missing`** — a current template file is absent. Offer to create
  it with the template's content. Because `setup` is create-only, a re-run may
  restore it too.
- **No manifest** — every file that differs from its template is reported as
  edited. Show the diffs and change nothing until the Human picks one.

The manifest is JSON: `{ "version": 1, "packageVersion": "<v>", "files": {
"<path>": "<sha256>" } }`. Paths are relative to the manifest, `/`-separated.
Compute the new hash from the bytes you wrote (`shasum -a 256 <file>` or
`node -e "…"`), and keep the file's key order stable.

### 4. Mention-only entry file

When `doctor-entry` reports an entry file that only mentions `WOLVEN.md` and
lacks `<!-- wolven-harness:start -->`, the install never ran step 0. Route to the
`harness-init` skill, step 0, and let the Human pick Full or Light:

- **Full** folds the whole router and skills table into `AGENTS.md`.
- **Light** adds the short summary block and leaves the existing text alone.

After the fold lands, verify `<!-- wolven-harness:start -->` and
`<!-- wolven-harness:end -->` are both in `AGENTS.md`, then rerun `doctor`. If the
Human declines the fold, record the declined check in the closing summary.

### 5. Close

Rerun `doctor` one last time and keep its last line. Close with a short summary:

1. **Fixed** — each code that cleared, with the fix that cleared it.
2. **Still failing** — every finding that remains, declined fixes included, with
   its code and level. A declined check is still failing, not fixed.
3. **Next** — offer `harness:validate` when the run changed files and the repo
   has the script, and name anything that needs a human decision later.

## Anti-patterns

- Applying several fixes at once, or a fix the Human did not approve.
- Reporting a declined check as fixed or "skipped".
- Merging a consumer edit with a template, or overwriting an edited file.
- Moving a folder to make a check pass when the finding names a smaller fix.
- Weakening the check instead of repairing the install.
- Rerunning `doctor` before the proposed fix is applied and claiming progress.

# Layout

`setup` writes the harness where it runs. The layout step decides whether
that folder is the harness home or a linked folder that reaches one, records
the answer in `.wolven-harness.json`, and links the two without moving
anything.

Run it at the start of step 2, before discovery reads the tree. Ask one
question at a time and show every diff before writing.

**Contents:** [Which layout](#which-layout) · [Home layout](#home-layout) ·
[Linked layout](#linked-layout) · [Bootstrap copies](#bootstrap-copies) ·
[Quiet install](#quiet-install) · [No moves](#no-moves)

## Which layout

Read `.wolven-harness.json` first. A recorded `layout` answers the question:
`home` is the default, `linked` keeps the open folder where it is.

Two signals say the open folder is linked:

- an entry file that imports an `AGENTS.md` above this folder, such as a
  `CLAUDE.md` holding `@../my-harness/AGENTS.md`;
- a `.claude/skills` or `.agents` path that is a symlink into another folder.

When either signal is present, or the folder is a client repository that must
not hold harness files, propose the linked layout and ask the Human to
confirm the harness home. Otherwise propose the default home layout.

## Home layout

The open folder becomes the harness home.

1. Ask for the code repository's path. Keep it relative to this folder, and
   record it as `codeRepo`.
2. Ask whether this folder should become a git repository. Run `git init`
   only after the Human agrees; show the command first. A no ends the layout
   step with no write.
3. Add the code repository's path to the harness home's `.gitignore`, so the
   harness never tracks the code it serves. When the code repository is
   outside this folder, a `.gitignore` line cannot reach it: say so and leave
   the file alone instead of writing a line that does nothing.
4. Record `layout: "home"` and `codeRepo` in `.wolven-harness.json`, next to
   the keys `setup` already wrote. Show the diff; write only on a yes.
5. Never write a file under `codeRepo`. The harness lives here; the code
   repository stays untouched.

Run `harness:validate` after the write.

## Linked layout

The open folder stays where it is and reaches a harness home above or beside
it. Nothing moves.

1. Find the harness home: follow the entry file's `@…/AGENTS.md` import, or
   the target of the symlinked skills folder. Put the result to the Human as
   one question when more than one candidate fits.
2. In the harness home, run `wolven-harness setup` when it has no
   `.wolven-harness.json`, and record `codeRepo` there. The commit-convention
   step records `commitConvention` in the same file.
3. In the open folder, record `layout: "linked"` and `harnessHome` (its path
   relative to this folder) in `.wolven-harness.json`.
4. Create these symlinks in the open folder, each pointing at the same path
   in the harness home:
   - `AGENTS.md`
   - `.agents`
   - `.claude/skills`
   - `.qmd`

   Then create each wired runtime's native wiring the same way: a directory
   symlink for `.claude/rules`, `.cursor`, `.kiro/steering` or
   `.github/instructions`, and a file symlink for `GEMINI.md` or
   `opencode.json`. The wired runtimes are the ones recorded in
   `.wolven-harness.json`, or listed in `setup`'s summary.
5. Show the diff of the links before creating them, and run
   `harness:validate` afterwards.

## Bootstrap copies

`setup` run in the open folder writes real copies of the skills, rules and
wiring. Replace a copy with its symlink only when `doctor` reports no
`doctor-drift-edited` file under it and no file was added there:

Remove the copy and create the link in one shown diff.

Otherwise the Human has edited that folder: leave it in place, name the files
that differ, and ask before anything is deleted. Never overwrite an edited
copy.

## Quiet install

Follow this section when `.wolven-harness.json` records `layout: "linked"`
and a `harnessHome` of `.wolven-harness`. The two layouts go by these names
and descriptions wherever you name them to the person:

- Quiet install: The harness lives in `.wolven-harness/`, and git sees only
  what you pick.
- Full install: The harness sits at the repo root, and git tracks all of it.
  Only for repos you own.

**Keep or switch.** Ask this before anything else in this section, for a
repository the person owns: "How much of the harness do you want to version
in git?" Options: "Quiet install" (the default) and "Full install", each with
its description above. Quiet install carries on with the steps below. Full
install runs the switch.

**The switch.** Run these checks in order, and stop at the first failure
before anything changes.

1. Blocked paths. A move that would overwrite an existing path at the
   repository root stops here, before any diff, with this message: "Can't
   switch to a full install: `<path>` already exists at the repo root.
   Nothing changed. Move or rename it, then ask again." This covers the root
   `./docs/` and each carried file's root path.
2. Unclear entries. Read the wiring record. An entry that points into
   `.wolven-harness/` and that the record does not name stops the switch with
   this message: "Can't switch to a full install: `<path>` points into
   `.wolven-harness/`, and it may not be the harness's. Nothing changed.
   Remove or keep it by hand, then ask again."

Then show one diff:

- Move `.wolven-harness/docs/` to the root `./docs/`.
- Carry the person's files. List every file under `.wolven-harness/.agents/`,
  ignored files included. Find each one `wolven-harness doctor` reports as
  `doctor-drift-edited` (edited since install) and each one no template
  installed. Move each to the same path at the root, with the map reversed on
  skill text (`.wolven-harness/docs/` back to `./docs/`,
  `.wolven-harness/.agents/` back to `./.agents/`). Show them with this line:
  "Your edited or added files move to the root: `<paths>`." Unedited template
  files are dropped, and the setup rerun recreates them.
- Remove the quiet-install wiring the record names, and show it with this
  line: "The harness symlinks, hooks, ignore lines and harness block for the
  quiet install are removed: `<paths>`." That is the per-skill and per-rule
  symlinks, `CLAUDE.local.md`, `.qmd`, the harness hook entries in
  `.claude/settings.local.json`, the harness lines in `.worktreeinclude`, the
  harness ignore lines in `.gitignore` or `.git/info/exclude`, the
  `.dockerignore` line, the bootstrap symlinks, and the harness block in the
  client's `AGENTS.md` and `CLAUDE.md`. Client content around them is kept,
  and kept client paths (merged, saved as `wolven-<name>`, skipped) are not
  touched.
- Remove the rest of `.wolven-harness/`.
- Rewrite `.wolven-harness.json` to `layout: "home"`.

Then ask: "Apply this switch? It removes `.wolven-harness/` and adds tracked
files at the root." On a yes, apply the diff and rerun `setup`, which writes
the root scaffold. Then check that no symlink or entry still points into
`.wolven-harness/`, and report any leftover with its next step: remove that
symlink or entry by hand. On a no, say "Nothing changed." and the quiet
install stays; the next step is to ask for the switch again whenever you
want it.

**Place.** Quick setup runs this section right after the path question.
Guided setup runs it after the guided steps. Ask one question at a time, show
every diff before writing, and say "symlinks" to the person, never "links" or
"entry points".

### Versioning

Ask: "Which harness folders should git track?" Offer these items as
checkboxes:

- "Rules: instructions your agent always follows" (ticked)
- "Hooks: scripts Claude Code runs automatically" (ticked)
- "Decision records (ADRs): why the code is the way it is. They keep your
  agent's context accurate over the long run, so keep them current" (ticked)
- "Notes" (not ticked)
- "Requirements and specs" (not ticked)
- "Postponed-work notes" (not ticked)

Follow the list with this footer: "Ticked folders get committed, and your
client sees them. Unticked ones stay on this machine and don't reach
worktrees."

When the question tool can't show items already ticked, never make the
person tick the defaults by hand. Ask the same question as one choice first,
with the footer: "Keep the defaults (recommended): Rules, Hooks and Decision
records (ADRs)" and "Choose the folders myself". Show the checkboxes only
after the second answer.

The items map to `.agents/rules/`, `.agents/hooks/`, `docs/adrs/`,
`docs/notes/`, `docs/prds/` with `docs/specs/`, and `docs/deferrals/`. The
home's `AGENTS.md` is always tracked and is not a checkbox. Edit only
`.wolven-harness/.gitignore`, so it re-includes exactly the ticked folders;
show that diff and write only on a yes.

### Ignore and wiring

Ask: "How should we ignore the harness local-only files?" Options:

- "In `.gitignore` (tracked change your client sees)"
- "Only on this machine: `.git/info/exclude` (nothing tracked changes)"

Check every entry-point path against what the repository root already holds
before the diff is built. The check comes first, and the diff shows its
outcome. Read the wiring record first (see Wiring record below): a path with
a recorded outcome is not checked again.

- A path that does not exist goes into the diff as a new symlink.
- A path that already is a symlink into `.wolven-harness/` stays as it is.
- Claude Code skills are always one symlink per skill. When `.claude/skills/`
  is a real folder, keep it and add the symlinks beside the client's own
  skills. Say this when you reach it: "Your `.claude/skills/` folder is
  kept. The harness adds one symlink per skill inside it, and git ignores
  them." Treat `.claude/rules/` the same way, one symlink per rule.
- Any other path that exists and is not a symlink into `.wolven-harness/` is
  an occupied entry point: a real `CLAUDE.local.md` or `.qmd`, or a client
  skill or rule named like a harness one. Keep the client's copy and ask,
  one path at a time: "You already have `<path>`, and it stays as it is. For
  the harness's `<name>`: merge it into yours (tracked change when `<path>`
  is tracked), save it next to yours as `wolven-<name>`, or skip it?" Options:
  "Merge into mine", "Save as wolven-<name>", "Skip it".

The three answers:

- "Merge into mine": the wiring diff shows the merged text. When `<path>` is
  tracked, the diff line says "Tracked change: `<path>`".
- "Save as wolven-<name>": the diff links the harness copy beside the client's
  under that name.
- "Skip it": the diff creates nothing for that path.

Never replace, move or delete a client path, whatever the answer.

Then ask: "Create the harness symlinks for <runtime names>? The diff lists
each symlink, the Claude Code hooks it sets up, and any tracked change, such
as `.dockerignore`." Name the actual recorded runtimes, such as "Claude Code
and Cursor". Show one diff with every entry point and every ignore line for
those runtimes, and take one approval for the whole diff:

- The ignore lines cover every entry point, and the bootstrap symlinks
  (`<runtime skills folder>/harness-init`) too, so they stop showing as
  untracked.
- Every entry point stays ignored: each is a symlink into a folder other
  clones may not have. Never re-include one to clear a failed check; show
  the failure and ask.
- The `.qmd` symlink carries this line, here and wherever a question names
  it: "`.qmd` is the search index for your harness docs. It lets your agent
  search your decision records, specs and notes before it answers, instead
  of working from memory."
- When the repository root has a `.dockerignore`, the same diff adds
  `.wolven-harness/` to it.
- The harness block question below is part of this diff.
- Each line that writes outside `.wolven-harness/` carries "Tracked change:
  `<path>`" or "New tracked file: `<path>`".

On a yes, write the diff, then write the wiring record
`.wolven-harness/wiring.json`. On a no, leave everything outside
`.wolven-harness/` unchanged and say "Nothing changed." with the next step:
run the `harness-init` skill again when you want the harness connected.

### Wiring record

`.wolven-harness/wiring.json` says, for this machine, what each entry point
ended up as, so a later run and `doctor` can tell a deliberate choice from
missing wiring. Write it after each approved wiring diff, never before:

```json
{
  "entries": [
    { "path": ".claude/skills/code-commit", "outcome": "linked" },
    { "path": "CLAUDE.local.md", "outcome": "skipped" }
  ]
}
```

Each entry has two fields. `path` is the entry point's path in the repository
root, the one the client would see. `outcome` is one of:

- `linked`: the harness made the symlink or generated file.
- `merged`: the harness text went into the client's file.
- `prefixed`: the client's path is kept, and the harness copy is linked
  beside it as `wolven-<name>`, which gets its own `linked` entry.
- `skipped`: nothing was created for the path.
- `unwired`: the person said No to a tracked-edit offer, so the piece is not
  set up. `doctor` still reports it with the manual step.

On a rerun, read the record first. Ask again only for an entry point that is
missing and has no recorded outcome. A `linked` entry whose symlink is gone
goes into the diff to be recreated, without a question. The nested
`.gitignore` ignores `wiring.json`, so it never reaches the commit list.

### Harness block

Ask: "Add the harness block to <file names>? (Tracked change; `AGENTS.md` is
created if missing.)" Options: Yes and No only. Name the root `AGENTS.md` or
`CLAUDE.md` files the repository has. Offer it as part of the wiring diff
above, not as a separate write.

The block is the same lean marked block in both files. It sits between
`<!-- wolven-harness:start -->` and `<!-- wolven-harness:end -->` and holds
at most three lines of plain text: the repo uses the Wolven harness, its
instructions are in `.wolven-harness/AGENTS.md`, and harness docs go under
`.wolven-harness/docs/`. It is text, never an `@` import. Change no other
line in the file.

When a selected runtime reads `AGENTS.md` and the repository has none, create
a root `AGENTS.md` that holds only the block. On a No, leave the file as it
is and name the runtimes that stay not set up to read the harness.

### Claude Code entry points

For Claude Code, the quiet install uses exactly these entry points. Each is
an ignored path in the repository root:

| Path | What it is |
| --- | --- |
| `CLAUDE.local.md` | File symlink to `.wolven-harness/AGENTS.md` |
| `.claude/skills/` | A real folder with one symlink per home skill, the bootstrap symlink among them |
| `.claude/rules/` | A real folder with one file symlink per home rule |
| `.claude/settings.local.json` | The secret guard and the worktree-parity hooks |
| `.worktreeinclude` | Lists `CLAUDE.local.md`, `.claude/rules/`, `.claude/rules/*.md`, each linked `.claude/skills/<name>`, `.claude/settings.local.json` |
| `.qmd` | Symlink to the home's `.qmd` |

### Other runtimes

Every other runtime gets one row. Each entry point is an ignored path in the
repository root, and the sources are the runtime's own documentation. Skills
are one symlink per skill in `./.agents/skills/`, and in `.kiro/skills/` for
Kiro. A generated file is covered by `doctor`'s "edited since install" check.

| Runtime | Entry points (ignored) | Tracked-edit offer | Manual step | Sources |
| --- | --- | --- | --- | --- |
| Codex | `./.agents/skills/<name>` | None: Codex follows no import, and `AGENTS.override.md` would hide the client's `AGENTS.md` | ask Codex to read .wolven-harness/AGENTS.md, or add its text to ~/.codex/AGENTS.md | [skills](https://learn.chatgpt.com/docs/build-skills), [AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md) |
| Cursor | `./.agents/skills/<name>`, `.cursor/rules/wolven-<rule>.mdc`, `.cursor/rules/wolven-agents.mdc`, `.cursor/hooks.json` | None | run "harness-init" to recreate the Cursor rules | [skills](https://cursor.com/docs/context/skills), [rules](https://cursor.com/docs/context/rules), [hooks](https://cursor.com/docs/agent/hooks) |
| OpenCode | `./.agents/skills/<name>` | An `instructions` entry in `opencode.json` listing `.wolven-harness/AGENTS.md` and `.wolven-harness/.agents/rules/*.md`. Tracked change: `opencode.json`, or New tracked file: `opencode.json` | add .wolven-harness/AGENTS.md and .wolven-harness/.agents/rules/*.md to instructions in opencode.json | [skills](https://opencode.ai/docs/skills/), [config](https://opencode.ai/docs/config/) |
| Amp | `./.agents/skills/<name>` | An `@.wolven-harness/AGENTS.md` line inside the harness block of the client's `AGENTS.md`. Tracked change: `AGENTS.md` | add @.wolven-harness/AGENTS.md inside the harness block in AGENTS.md | [skills](https://ampcode.com/docs/customize/skills), [AGENTS.md](https://ampcode.com/docs/customize/agents-md) |
| GitHub Copilot | `./.agents/skills/<name>`, `.github/instructions/wolven-<rule>.instructions.md` | Commit the generated `.github/instructions/wolven-<rule>.instructions.md` files. New tracked file: `.github/instructions/wolven-<rule>.instructions.md` | run "harness-init" to recreate the Copilot instruction files | [skills](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills), [instructions](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions) |
| Gemini CLI | `./.agents/skills/<name>`, `GEMINI.md` | The `@.wolven-harness/AGENTS.md` line in the client's own `GEMINI.md`. Tracked change: `GEMINI.md` | add @.wolven-harness/AGENTS.md to GEMINI.md | [skills](https://geminicli.com/docs/cli/skills), [context files](https://geminicli.com/docs/cli/gemini-md) |
| Kiro | `.kiro/skills/<name>`, `.kiro/steering/wolven-harness.md` | Where `.gitignore` is in `agentIgnoreFiles`, the steering file as a new tracked file. New tracked file: `.kiro/steering/wolven-harness.md` | run "harness-init" to recreate the Kiro steering file | [skills](https://kiro.dev/docs/skills/), [steering](https://kiro.dev/docs/steering/), [ignore](https://kiro.dev/docs/kiroignore/) |
| Antigravity | `./.agents/skills/<name>`, `./.agents/rules/wolven-harness.md` | None | run "harness-init" to recreate the Antigravity rule | [skills](https://www.antigravity.google/docs/skills), [rules](https://www.antigravity.google/docs/rules?tab=ide) |

Gemini CLI gets a root `GEMINI.md` holding `@.wolven-harness/AGENTS.md` only
when the client has none. Offer each tracked edit in the one wiring diff, with
this question: "<runtime> can't read <the harness instructions / rules> from
a file only on this machine. Add <change> to `<path>`? Tracked change:
`<path>` (or New tracked file: `<path>`)." Options: "Yes" and "No, leave
<runtime> without it". A No, and Codex's instructions, leave the piece not
set up to read the harness: name the row's manual step and record `unwired`.

### Claude Code hooks

The hook commands run the scripts under the home, from any working
directory. `.claude/settings.local.json` holds:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash|Read|Grep|Glob",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR/.wolven-harness/.agents/hooks/secret-path-guard.mjs\""
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR/.wolven-harness/.agents/hooks/worktree-parity.mjs\""
          }
        ]
      }
    ]
  }
}
```

The secret guard runs before reads and shell commands. The parity check runs
at session start and warns when a worktree lost its entry points.

## No moves

This step creates symlinks, config keys, ignore lines and the wiring record only. Apart from the
confirmed switch to a full install above, it never moves, renames or
deletes a folder or file to make a layout fit, and it never writes under
`codeRepo`. When a layout cannot be reached without a move, say so, say
"Nothing changed.", and stop with the next step: move the files yourself,
then run `harness-init` again.

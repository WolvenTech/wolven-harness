# Layout

`setup` writes the harness where it runs. The layout step decides whether
that folder is the harness home or a linked folder that reaches one, records
the answer in `.wolven-harness.json`, and links the two without moving
anything.

Run it at the start of step 2, before discovery reads the tree. Ask one
question at a time and show every diff before writing.

**Contents:** [Which layout](#which-layout) · [Home layout](#home-layout) ·
[Linked layout](#linked-layout) · [Bootstrap copies](#bootstrap-copies) ·
[No moves](#no-moves)

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

## No moves

This step creates links and config keys only. It never moves, renames or
deletes a folder or file to make a layout fit, and it never writes under
`codeRepo`. When a layout cannot be reached without a move, say so and stop:
that is a question for the Human, not a step.

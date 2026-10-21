# Layout

The open folder is the harness home. Run this step at the start of step 2,
before discovery reads the tree. Ask one question at a time and show every
diff before writing.

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

## No moves

This step creates config keys only. It never moves, renames or deletes a
folder or file to make a layout fit, and it never writes under `codeRepo`.
When a layout cannot be reached without a move, say so and stop:
that is a question for the Human, not a step.

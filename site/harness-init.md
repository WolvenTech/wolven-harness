---
description: Tutorial for the harness-init skill after init finishes.
---

# Setting up with harness-init

`init` never creates or edits `AGENTS.md`. After it finishes, ask your agent to run `harness-init`. You steer every write. The agent shows the diff first.

**Step 0:** fold `WOLVEN.md` into `AGENTS.md` (full, light, or mention-only). You pick the mode. `init` left the entry file alone so this choice stays yours.

**Step 1:** migrate legacy ADRs into `docs/adrs/` when validate reports them.

**Steps 2 to 4:** discover the repo and suggest two to four skills.

**Step 5:** write the skills you pick as ask-only stubs (`skill-stub-open`).

**Step 6:** write a session note under `docs/notes/`.

Migration is done only once `harness:validate` exits 0 with no legacy warnings left.

The run offers three commits (entry, migration, setup) only if you say yes.

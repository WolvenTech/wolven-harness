---
description: Connect the harness files to your repo’s existing instructions with harness-init.
---

# Setup

Run `wolven-harness setup` to install the files, then ask your agent to run the `harness-init` skill. The command and the skill are separate: setup installs files, while the skill guides you through integrating them with your repository. It shows each diff and waits for your choice before writing.

## What happens

1. Choose how to integrate `WOLVEN.md` into `AGENTS.md`: full, light, or mention-only. `setup` never creates or edits `AGENTS.md`.
2. If validation reports legacy architecture decision records (ADRs), migrate them into `docs/adrs/`, keeping their numbers and resolving broken references.
3. The agent reads the repository and suggests two to four skills based on its tools and decisions. Web research is optional and requires your agreement.
4. It creates only the skill stubs you choose. They are unfinished, ask-only skills; validation reports a `skill-stub-open` warning until you complete them. The warning does not fail validation.
5. Choose how to run validation: as a CI job, through an existing check script, or locally. The agent finishes a session note in `docs/notes/`.

The skill offers three commits, covering entry, migration, setup; each is offered only after validation passes and you say yes. Declining a commit leaves that phase uncommitted.

## Check the setup

```sh
pnpm exec wolven-harness validate
```

`setup` adds `harness:validate` as a package script for `wolven-harness validate` when that script is missing. In that case, `pnpm harness:validate` runs the same check. Existing scripts are preserved; see the full [Commands](./commands) reference.

Migration is complete when validation exits 0 with no legacy warnings left and no `adr-status-mismatch`. A superseded ADR is never kept `stable`: it gets a successor and is deprecated. References to decision records must resolve to a stable record in `docs/adrs/`; legacy records get migration warnings during the transition.

Next, try the [Daily use](./cycle) example.

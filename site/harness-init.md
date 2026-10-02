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

## Lean path

On a fresh or thin-evidence repo, `harness-init` judges from the tree that the lean path fits. If you did not state a goal in your prompt, it asks one question for your immediate goal (one sentence) and records it as you give it.

It then proposes deferring exactly four items: deep discovery Q&A beyond files, optional web research, per-dimension score-gap keep/drop questions, and the validate-wiring question. Before continuing, each deferred step is named with why and what remaining work it leaves, and you can decline any of them. Those choices, with your goal, are recorded under **Deferred / skipped steps** in the session note. Skill proposals always run and are never deferred — they cite your recorded goal and available references, or an explicit thin-evidence basis when the tree is thin.

For a worked example, see the [lean walkthrough note](https://github.com/WolvenTech/wolven-harness/blob/main/docs/notes/lean-init-walkthrough/lean-init-walkthrough-note.md).

## Check the setup

```sh
pnpm exec wolven-harness validate
```

`setup` adds `harness:validate` as a package script for `wolven-harness validate` when that script is missing. In that case, `pnpm harness:validate` runs the same check. Existing scripts are preserved; see the full [Commands](./commands) reference.

Migration is complete when validation exits 0 with no legacy warnings left and no `adr-status-mismatch`. A superseded ADR is never kept `stable`: it gets a successor and is deprecated. References to decision records must resolve to a stable record in `docs/adrs/`; legacy records get migration warnings during the transition.

Next, try the [Daily use](./cycle) example.
